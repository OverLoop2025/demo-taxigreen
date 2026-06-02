# Estado Sprint 6 — Taxi Green Demo

Fecha de cierre: 2026-06-01

## 1. Alcance implementado

Sprint 6 construye la primera versión funcional de la app conductor en React Native + Expo SDK 51:
login email+PIN, sesión segura, registro de token push y recepción de asignaciones por Supabase Realtime.

- `apps/driver/app/_layout.tsx`: providers `AuthProvider` + `RealtimeProvider` y observer de notificaciones.
- `apps/driver/app/index.tsx`: splash breve y redirect según sesión.
- `apps/driver/app/login.tsx`: email + PIN de 4 dígitos con numpad grande y botones táctiles.
- `apps/driver/app/(auth)/_layout.tsx`: tabs `Inicio` / `Perfil`.
- `apps/driver/app/(auth)/home.tsx`: saludo, estado de turno, unidad vigente, estado push/realtime y próxima asignación.
- `apps/driver/app/(auth)/asignacion/[id].tsx`: placeholder navegable para S7, alcanzable por Realtime o push tap.
- `apps/driver/app/(auth)/perfil.tsx`: datos conductor/unidad y logout.
- `apps/driver/src/features/auth`: login/logout, hidratación y persistencia en `expo-secure-store`.
- `apps/driver/src/features/api/client.ts`: cliente `fetch` con `EXPO_PUBLIC_API_URL` y `Authorization: Bearer`.
- `apps/driver/src/features/push`: canal Android `asignacion`, permisos, Expo Push Token y registro en backend.
- `apps/driver/src/features/realtime`: cliente Supabase RN + canal `conductor-{conductorId}` evento `asignacion`.
- `apps/driver/src/components`: `TouchButton`, `NumPad`, `BottomSheet`.

En web/backend:

- `POST /api/conductor/login`: valida conductor real por email+PIN bcrypt, emite JWT Bearer con expiración 12h y
  audita `login_driver_mobile`.
- `POST /api/conductor/fcm-token`: valida Bearer, guarda el token en `usuarios.fcm_token` y audita
  `driver_push_token_registrado`.
- `apps/web/src/lib/conductor-token.ts`: helper JWT móvil con `jose`, issuer/audience y verificación estricta.
- `apps/web/src/lib/push.ts`: envío a Expo Push Service si el token es `ExpoPushToken[...]`/`ExponentPushToken[...]`;
  si no hay token o no hay FCM real, degrada sin romper la asignación.
- `apps/web/src/lib/supabase/server.ts`: se conserva `reserva-{id}` y se añade broadcast complementario
  `conductor-{conductorId}`.
- `/admin/reservas/[id]`: al asignar conductor/unidad emite ambos broadcasts y prepara push; `asignarVehiculo`
  emite actualización por ambos canales sin repetir push.

No se tocó la heurística S5, no se creó app pasajero, no se añadieron tablas ni migraciones. `usuarios.fcm_token`
ya existía desde S1.

## 2. Decisiones técnicas

- La app conductor usa JWT propio Bearer para Expo, separado de la sesión Auth.js web. El token vive en
  `expo-secure-store`; no se usa AsyncStorage.
- La app escucha `conductor-{conductorId}` porque al iniciar no conoce todavía la reserva asignada. Se mantiene
  `reserva-{id}` para compatibilidad con S3/S5 y para los flujos de S7/S8.
- El campo `usuarios.fcm_token` guarda Expo Push Token en demo. El helper de push acepta Expo token real; tokens FCM
  directos quedan marcados como `fcm_not_configured` hasta dev client/Firebase de MVP.
- `EXPO_PUBLIC_EXPO_PROJECT_ID` queda documentado. Si falta, el registro push se marca como degradado
  `missing_project_id`; login y realtime siguen funcionando.
- Android físico es el objetivo. iOS, EAS Build y background location quedan fuera de S6.

## 3. Verificación ejecutada

Comandos ya ejecutados en el cierre:

```bash
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/driver typecheck
pnpm --filter @taxigreen/web lint
pnpm --filter @taxigreen/driver lint
pnpm --filter @taxigreen/web test
pnpm --filter @taxigreen/web build
pnpm --filter @taxigreen/driver exec expo config --json
pnpm turbo run typecheck lint test build
pnpm e2e
```

Resultados:

```text
apps/web unit -> 7/7 (incluye conductor-token)
apps/web build -> verde; rutas /api/conductor/login y /api/conductor/fcm-token presentes
apps/driver expo config -> name Taxi Green Conductor, scheme taxigreendriver, android.package pe.taxigreen.driver, 8 plugins
pnpm turbo run typecheck lint test build -> 52/52 tasks verdes
pnpm e2e -> 5/5 verde
```

Smoke real contra `next start` + Supabase:

| Criterio | Resultado |
|---|---|
| `POST /api/conductor/login` con `conductor1@taxigreen.demo / 1234` | 200, JWT emitido, conductor Raúl Quispe, unidad ABC-123 |
| `POST /api/conductor/fcm-token` con Bearer y `ExponentPushToken[sprint6-demo-smoke]` | 200 `{ ok: true }`, token guardado |
| `POST /api/conductor/fcm-token` sin Bearer | 401 |
| Limpieza post-smoke | `fcm_token` del conductor1 vuelto a `null`; auditoría de prueba `login_driver_mobile`/`driver_push_token_registrado` borrada |

Smoke de broadcast durante E2E:

| Criterio | Resultado |
|---|---|
| Asignación desde `/admin` durante E2E | `broadcastReserva: { success: true }` |
| Canal complementario conductor | `broadcastConductor: { success: true }` |
| Push sin token real | degradó a `missing_token` sin romper asignación |

DB tras E2E:

- Reservas temporales `TG-WA-*` detectadas: 2.
- Reservas temporales borradas: 2.
- Viajes temporales borrados: 1.
- Auditoría de prueba borrada: 10 filas.
- `usuarios.fcm_token` limpiado en 6 conductores.
- Reseed ejecutado: reserva protagonista restaurada.

## 4. Smoke Android / Expo

No se pudo cerrar un push real en Android físico dentro de esta ejecución porque no hay dispositivo conectado desde
Codex ni `EXPO_PUBLIC_EXPO_PROJECT_ID` configurado para obtener Expo Push Token real. El código degrada explícitamente:

- emulador/simulador: `device_required`;
- permisos negados: `permissions_denied`;
- falta projectId Expo: `missing_project_id`;
- token ausente en DB: push server-side `missing_token`;
- token no Expo/FCM directo: `fcm_not_configured`.

Esto no bloquea login ni Realtime. Para cerrar push real manualmente:

1. Levantar web con `pnpm --filter @taxigreen/web dev` o `start`.
2. En `apps/driver/.env`, usar `EXPO_PUBLIC_API_URL=http://<IP-LAN>:3000`, no `localhost`.
3. Completar `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` y `EXPO_PUBLIC_EXPO_PROJECT_ID`.
4. Ejecutar `cd apps/driver && pnpm start`.
5. Abrir en Android físico con Expo Go, entrar con `conductor1@taxigreen.demo / 1234`.
6. Confirmar en DB que `usuarios.fcm_token` quedó poblado.
7. Asignar una reserva desde `/admin`; la app debe recibir Realtime en Home y, si Expo devuelve token real, push.

## 5. Bugs / mejoras encontradas

- Se evitó añadir migración para `usuarios.fcm_token`: el campo ya estaba en el schema S1.
- `fetch` reemplaza axios en la app driver para reducir dependencias; cumple el contrato del prompt y centraliza
  Authorization Bearer en un único helper.
- El broadcast `reserva-{id}` no bastaba para la app conductor porque el cliente no conoce la reserva antes de ser
  asignado. Se añadió `conductor-{conductorId}` sin romper el canal anterior.
- El cleanup de smoke se ejecutó manualmente tras validar token para que la DB vuelva a baseline operativo.

## 6. Pendientes reales / riesgos

- Push real necesita Android físico + `EXPO_PUBLIC_EXPO_PROJECT_ID`. Sin eso queda degradado, documentado y visible en Home.
- FCM directo con Firebase Admin no se implementó en S6; para Expo Go la vía correcta de demo es Expo Push Service.
  Dev client + FCM directo queda para MVP si se quiere salir del servicio Expo.
- La pantalla `asignacion/[id]` es placeholder por diseño. Mapa, estados, ubicación foreground y backend de estados son S7.
- La app no consulta detalle completo de reserva todavía; Home solo muestra la asignación recibida por broadcast. S7 debe
  añadir endpoint/datos de asignación activa.

## 7. Handoff a Sprint 7

Sprint 7 debe empezar desde `docs/PROMPT_SPRINT_7_CODEX.md`.

Reglas que no se deben romper:

- La decisión de conductor/unidad sigue perteneciendo a `/admin` + `packages/asignacion`; la app conductor no decide.
- El JWT móvil se valida con `verifyConductorToken`; todo endpoint nuevo de conductor debe exigir Bearer.
- La app usa `expo-secure-store`; no introducir AsyncStorage para sesión.
- Mantener `conductor-{conductorId}` para asignación inicial y usar `reserva-{id}` para posición/estado de viaje.
- No activar background location en S7; el plan exige foreground location.

## 8. Auditoría de cierre (2026-06-01, revisión post-Codex)

Auditoría estricta de S6 leyendo TODO el código de `apps/driver` + backend móvil, **y ejecutando un bundle real de
Metro** (lo que el cierre original NO hizo: `expo config --json` valida el manifiesto, no compila el bundle). Esto
destapó **dos bugs que impedían que la app arrancara en el teléfono**, invisibles para el pipeline actual
(typecheck/lint no corren Metro/Babel; el `build` del driver es un `echo`; `expo config` no bundlea).

### 8.1. 🔴 Bug crítico 1 — la app NO bundleaba (`react-native-worklets/plugin`)

`pnpm --filter @taxigreen/driver` no compila el bundle en CI, así que nadie ejecutó Metro. Al hacerlo:

```
Android Bundling failed: [BABEL] expo-router/entry.js: Cannot find module 'react-native-worklets/plugin'
```

Causa: el `package.json` declaraba `nativewind: ^4.1.23`; el caret resolvió a **nativewind 4.2.4**, que arrastra
`react-native-css-interop@0.2.4`, cuyo `babel.js` incluye **hardcodeado** `react-native-worklets/plugin`
(*"Use this plugin in reanimated 4 and later"*). El proyecto usa **reanimated 3.10.1** (Expo SDK 51), donde
`react-native-worklets` no existe como paquete → el bundle revienta. **Fix:** pin exacto `nativewind: 4.1.23` +
override `react-native-css-interop: 0.1.22` (su `babel.js` usa `react-native-reanimated/plugin`, compatible).

### 8.2. 🔴 Bug crítico 2 — `@babel/runtime` no resoluble bajo pnpm isolated

Tras el fix anterior, el bundle avanzó a 1084 módulos y falló con:

```
Unable to resolve module @babel/runtime/helpers/interopRequireDefault from app/(auth)/home.tsx
```

Causa: con `node-linker=isolated`, `@babel/runtime` (que el código transpilado importa en runtime) no queda
accesible desde `apps/driver`. **Fix:** `@babel/runtime: ^7.24.0` como dependencia directa del driver.

**Resultado tras ambos fixes:** `npx expo export --platform android` → **`Android Bundled (1203 módulos)`, EXIT 0**.
La app ahora compila de verdad. (Verificado dos veces; driver typecheck + lint siguen limpios; CI 52/52.)

### 8.3. 🐞 Bug de navegación — race en cold-start (push tap desde app cerrada)

`useNotificationObserver` (montado en el root) resolvía `getLastNotificationResponseAsync()` y hacía
`router.push(asignacion)` al abrir desde un push; en paralelo, `app/index.tsx` hace `router.replace(home)` a los
650 ms. El `replace` pisaba la pantalla de asignación → el conductor caía en Home en vez de la asignación. **Fix:**
el caso cold-start se decide ahora SOLO en `index.tsx` (lee `getLastNotificationResponseAsync` y hace
`replace(asignacion)` si hay reservaId); el observer queda solo para taps con la app viva. Requiere verificación
física (ver §4).

### 8.4. Verificaciones que SÍ pude cerrar sin Android

- **Recepción de broadcast `conductor-{id}` (el "wow" de realtime):** suscriptor anon (idéntico al de la app) +
  `httpSend` del servidor (service role) → **el payload llega** (`reserva_id/conductor_id/vehiculo_id`). Antes solo
  estaba probado el ENVÍO (`success:true` no implica entrega). Ahora el contrato cliente↔servidor está validado.
- **Backend móvil real** contra `next start` + Supabase: login `conductor1/1234` → 200 + JWT (479 chars);
  `fcm-token` sin Bearer → 401; con Bearer → 200; login con PIN incorrecto → 401.
- **Entrega dual en `/admin`** (log `[driver-delivery]` durante E2E): `broadcastReserva: success:true`,
  `broadcastConductor: success:true`, `push: missing_token` (degradación correcta sin token Android).
- CI `typecheck lint test build` → **52/52**; `pnpm e2e` → **5/5**.

### 8.5. Observaciones menores

- `src/components/BottomSheet.tsx` es **código muerto** (no se importa en ningún screen). Listo para S7 o a eliminar.
- `@rnmapbox/maps` está como dependencia + plugin, pero **NO funciona en Expo Go** (requiere dev client / EAS). No
  afecta S6 (no se importa todavía); es un bloqueo a resolver en **S7** cuando entre el mapa. Ver `DEUDA_TECNICA.md`.
- **Gap de CI:** el driver no se bundlea en el pipeline (`build` = `echo`). Recomendación: correr
  `cd apps/driver && npx expo export --platform android` como gate manual al cerrar cada sprint de la app (o
  añadirlo a CI), porque typecheck/lint NO detectan errores de Metro/Babel/resolución.

DB en baseline canónico: 2 reservas `TG-WA-*` borradas, `fcm_token` limpiado, auditoría purgada a `seed_sprint_1`
(13 → 1), reseed. Servidor apagado.

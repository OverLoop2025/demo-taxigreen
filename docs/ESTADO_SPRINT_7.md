# Estado Sprint 7 — Taxi Green Demo

Fecha de cierre: 2026-06-02

## 1. Alcance implementado

Sprint 7 completa la asignación activa del conductor: detalle móvil real, mapa/fallback, estados secuenciales,
ubicación foreground y endpoints Bearer para la app.

En `apps/web`:

- `GET /api/conductor/asignacion/[id]`: valida JWT Bearer con `verifyConductorToken`, filtra por `tenant_id` y
  `conductor_id`, y devuelve solo reservas asignadas al conductor autenticado.
- `POST /api/conductor/asignacion/[id]/estado`: valida transición estricta
  `asignado -> en_camino -> en_punto -> a_bordo -> finalizado`.
- `apps/web/src/lib/conductor-asignacion.ts`: helper testeado para secuencia, mapeo de estado de reserva y
  serialización segura al contrato móvil.
- `apps/web/src/lib/conductor-asignacion-repository.ts`: select único para GET/POST sin exponer hashes ni internos.
- `apps/web/src/lib/supabase/server.ts`: nuevo broadcast `estado` en canal `reserva-{id}`.
- `packages/database/prisma/seed.ts`: el reseed limpia timestamps de viaje (`inicio_en_camino`, `llegada_punto`,
  `pasajero_a_bordo`, `finalizado_en`) para restaurar baseline real.

Mapeo elegido para cierre del conductor:

| Estado viaje | Estado reserva |
|---|---|
| `en_camino` | `en_curso` |
| `en_punto` | `en_curso` |
| `a_bordo` | `en_curso` |
| `finalizado` | `por_liquidar` |

La decisión `finalizado -> por_liquidar` sigue `CLAUDE.md §4.4/§4.5`: la demo prepara la liquidación; no ejecuta
pago ni cierre comercial completo sin la confirmación del pasajero.

En `apps/driver`:

- `app/(auth)/asignacion/[id].tsx`: deja de ser placeholder; carga detalle, muestra pasajero/vuelo/voucher,
  punto de encuentro, ruta y estado actual.
- `src/features/assignment`: tipos, cliente GET/POST y transición de la acción siguiente.
- `src/features/location`: `requestForegroundPermissionsAsync` + `watchPositionAsync` foreground con
  `timeInterval: 3000` y `distanceInterval: 10`; emite broadcast `posicion` a `reserva-{id}`.
- `src/features/network`: polling de `expo-network` para mostrar estado de red y reintentar una acción pendiente
  sin avanzar la UI hasta respuesta OK del servidor.
- `src/components/map/AssignmentMap.tsx`: mapa Mapbox nativo si hay token/dev client; fallback textual operable si
  falta token o el módulo nativo no carga en Expo Go.
- `expo-keep-awake`: pantalla no se duerme mientras el viaje está en `en_camino`, `en_punto` o `a_bordo`.

Dependencias añadidas al driver:

- `expo-keep-awake`
- `expo-network`

No se creó app pasajero, no se activó background location, no se añadieron tablas, no se tocó la heurística de S5.

## 2. Seguridad y reglas de negocio

- Todo endpoint nuevo de conductor usa `verifyConductorToken`.
- Un conductor sin Bearer recibe 401.
- Un conductor autenticado no puede leer ni modificar reservas de otro conductor: el API responde 404 para evitar
  filtrar existencia.
- El cliente no puede saltar estados ni repetir una transición: el servidor devuelve 409 con `estado_esperado`.
- La app no actualiza estado local de viaje hasta recibir OK del backend.
- Auditoría por cada cambio: `driver_estado_viaje_actualizado`.
- Broadcast de estado por `reserva-{id}` para que S8 consuma estados/posición en el link pasajero.

## 3. Verificación ejecutada

Comandos verdes:

```bash
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/driver typecheck
pnpm --filter @taxigreen/web lint
pnpm --filter @taxigreen/driver lint
pnpm --filter @taxigreen/web test
pnpm --filter @taxigreen/web build
pnpm --filter @taxigreen/driver exec expo config --json
pnpm --filter @taxigreen/driver exec expo export --platform android
pnpm turbo run typecheck lint test build
pnpm e2e
```

Resultados:

```text
apps/web unit -> 11/11 (incluye conductor-token y transiciones S7)
apps/web build -> rutas /api/conductor/asignacion/[id] y /estado presentes
expo config -> name Taxi Green Conductor, scheme taxigreendriver, android pe.taxigreen.driver, 8 plugins
expo export android -> EXIT 0, Android Bundled, 1350 módulos, .hbc 4.09 MB
pnpm turbo run typecheck lint test build -> 52/52 tasks verdes
pnpm e2e -> 5/5 verde
```

Smoke real contra `next start` + Supabase:

| Criterio | Resultado |
|---|---|
| Login `conductor1@taxigreen.demo / 1234` | 200, Raúl Quispe, unidad ABC-123 |
| `GET /api/conductor/asignacion/[id]` sin Bearer | 401 |
| `GET` con Bearer conductor1 | 200, `TG-2026-0001`, Aeropuerto Jorge Chávez, Salida 3 columna F2, Av. Pardo 123 |
| Salto `asignado -> a_bordo` | 409 `transicion_invalida`, esperado `en_camino` |
| Secuencia `en_camino -> en_punto -> a_bordo -> finalizado` | 200 en cada paso |
| Reserva durante secuencia | `en_curso` y luego `por_liquidar` |
| Broadcast `reserva-{id}` evento `estado` | `ok:true`, `success:true` |
| Conductor2 leyendo/modificando reserva de conductor1 | 404 / 404 |

Limpieza post-smoke/E2E:

- Reservas `TG-WA-*` borradas: 2.
- Viajes temporales borrados: 1.
- `usuarios.fcm_token` limpiado en 6 conductores.
- Auditoría purgada a baseline: solo `seed_sprint_1`.
- Reseed ejecutado y verificado: protagonista `asignada`, viaje `asignado`, timestamps S7 en `null`.

## 4. Bugs / mejoras encontradas

- **Seed incompleto para S7:** antes de este sprint, `db:seed` devolvía el viaje a `asignado` pero no limpiaba
  timestamps de estado. Se corrigió para que las pruebas manuales arranquen siempre desde un viaje limpio.
- **Mapbox en Expo Go:** S6 ya marcaba que `@rnmapbox/maps` no corre en Expo Go. En S7 se implementó fallback textual
  y carga diferida del módulo; la pantalla no se rompe aunque falte dev client o token.
- **Offline conservador:** se evita avanzar UI si el POST falla. Una acción puede quedar pendiente para reintento,
  pero el estado visible solo cambia con respuesta OK del servidor.

### 4.1 Re-auditoría independiente (2026-06-02)

Segunda pasada senior sobre todo S7 (backend + app) buscando bugs profundos. Resultado: **sin defecto funcional**.

- Backend GET/POST: auth Bearer, scoping tenant/conductor (404 no filtra existencia), transición secuencial,
  auditoría, broadcast y refetch — correcto y robusto (rechaza `cancelado`/`asignado`/saltos con 409).
- `vehiculo` se sirve vía `conductor.vehiculo_id`, **consistente** con `asignarVehiculo`/`asignarReserva` de `/admin`
  (la unidad vive en el conductor; reservas no tiene `vehiculo_id`). No es bug.
- Seed con coords reales (origen `-12.0231,-77.112`; destino `-12.1196,-77.0365`) → el mapa nativo renderiza con
  token+dev client; sin ellos cae a fallback textual.
- Orden de hooks correcto; `KeepAwakeGate` aislado como componente; tracking foreground no se reinicia entre
  `en_camino/en_punto/a_bordo`.
- **Aclaración §4.4 (doble confirmación):** el salto `finalizado → por_liquidar` es **decisión deliberada y
  consistente con el plan de S8** (no un bug). `EstadoReserva.finalizada` queda como holgura MVP. Registrado en
  `DEUDA_TECNICA §1.9`.
- Polish opcional **no** aplicado (no bloquea demo): `clearLastAssignment` existe pero no se invoca (la tarjeta
  "Próxima asignación" en Home puede quedar con la reserva ya atendida); ante un 409 por estado local desfasado el
  botón "Reintentar" repetiría el 409 sin re-sincronizar la asignación. Edge cases fuera del flujo lineal de demo.

Verificación de la re-auditoría: `pnpm turbo run typecheck lint test build --force` → **52/52** (0 caché);
`expo export --platform android` → **EXIT 0** (.hbc 4.09 MB); baseline DB confirmado read-only
(protagonista `asignada`/Raúl Quispe/ABC-123, viaje `asignado` timestamps `null`, 0 `TG-WA-*`, 0 `fcm_token`,
auditoría solo `seed_sprint_1`). Artefactos temporales eliminados.

## 5. Pendientes reales / riesgos

- No se probó Android físico en esta ejecución. Falta validar en teléfono:
  - permiso foreground real;
  - emisión visible de `posicion` mientras la pantalla está abierta;
  - keep-awake físico;
  - push real de S6 si se configura `EXPO_PUBLIC_EXPO_PROJECT_ID`.
- Mapa nativo Mapbox requiere dev client/EAS + `EXPO_PUBLIC_MAPBOX_TOKEN` y `MAPBOX_DOWNLOAD_TOKEN`. En Expo Go se
  usa fallback textual operable.
- No se integró Mapbox Directions real; la pantalla usa ruta visual simple y ETA de demo. Directions/ETA dinámica
  puede entrar después si se decide afinar el wow visual.

### 5.1 Preparación de build dev client (2026-06-02)

Para habilitar el dev client EAS (único camino para el mapa nativo Mapbox y push real; **Expo Go nunca corre
`@rnmapbox/maps`** a ninguna versión de SDK) se añadió:

- `apps/driver/eas.json`: perfil `development` (`developmentClient: true`, `distribution: internal`, APK Android),
  más `preview`/`production` base. Sirve para Android y iOS con el mismo perfil.
- `apps/driver/app.config.js`: inyecta `RNMapboxMapsDownloadToken` desde `process.env.MAPBOX_DOWNLOAD_TOKEN`
  (secret EAS) en tiempo de build, dejando `app.json` con el token vacío. El `sk` **no** se versiona. Verificado:
  `expo config --json` inyecta el token; typecheck/lint verdes; `expo export --platform android` EXIT 0, `.hbc` 4.09 MB.

Gotchas confirmados que dependen de credenciales del usuario (no codeables):

- **No upgradear SDK 51.** El desajuste "Expo Go pide SDK 53" es limitación de la app Expo Go de tienda, no de
  compatibilidad de dispositivo. El dev client fija el SDK 51 en el binario y corre en cualquier Android/iPhone sin
  depender de Expo Go. Upgradear reabriría una decisión cerrada (RN 0.74→0.76+, nativewind/reanimated/babel) y
  arriesgaría el bundle verde sin beneficio de cobertura.
- **Push real en dev build Android** necesita FCM propio: proyecto Firebase → `google-services.json` +
  `android.googleServicesFile` + subir la clave FCM V1 a EAS. Sin esto, todo S7 funciona (mapa, Realtime, login,
  estados, ubicación, keep-awake); solo la notificación OS-level no se entrega. La asignación igual llega por
  Realtime (`conductor-{id}`) con la app abierta, así que push es opcional para el flujo de demo controlada.
- **iPhone 14 Plus**: el dev client iOS en dispositivo físico exige Apple Developer Program (US$99/año) para el
  provisioning ad-hoc vía EAS (la ruta gratuita de 7 días requiere Mac + Xcode, no disponible en WSL2). Además
  `CLAUDE.md §5` define la demo como **Android only**. iOS queda como inversión post-demo/MVP.

## 6. Handoff a Sprint 8

Sprint 8 debe empezar desde `docs/PROMPT_SPRINT_8_CODEX.md`.

Reglas que no se deben romper:

- S7 ya emite estados y posiciones en `reserva-{id}`; S8 debe consumir ese canal en `/p/[token]`.
- La app pasajero sigue prohibida; S8 es web link público, no app nativa.
- El cierre conductor deja `reservas.estado = por_liquidar`; S8 añade la vista pasajero, comprobante/calificación e
  incidencia, respetando la doble confirmación.
- No introducir tablas nuevas salvo que el prompt futuro reabra explícitamente el alcance; la demo sigue sobre 10 tablas.

# Estado Sprint 8 — Taxi Green Demo

Fecha de cierre: 2026-06-03

## 1. Alcance implementado

Sprint 8 cierra la experiencia pública del pasajero en `/p/[token]` y el arco mínimo de bienestar:
tracking, comprobante, calificación triple e incidencia de objeto olvidado.

En `apps/web`:

- `/p/[token]` dejó de ser placeholder. La RSC valida `reservas.token_pasajero` y entrega un contrato seguro al
  cliente.
- `seguimiento-cliente.tsx` consume `reserva-{id}` por Supabase Realtime:
  - `estado` actualiza timeline y estado visible;
  - `posicion` mueve el conductor o actualiza fallback textual;
  - `incidencia` refresca los casos.
- Polling fallback cada 10s mediante `GET /api/pasajero/[token]`.
- UI móvil-first: DriverCard, VehicleCard, punto de encuentro prominente, timeline operativo, llamadas `tel:`,
  comprobante, calificación triple y reporte de objeto olvidado.
- Mapa Mapbox GL JS se carga desde CDN solo si `NEXT_PUBLIC_MAPBOX_TOKEN` existe. Sin token, la ruta textual sigue
  operable.
- `POST /api/pasajero/[token]/comprobante`: valida token, guarda DNI/RUC opcional y asegura comprobante.
- `GET /api/pasajero/[token]/comprobante/pdf`: valida token y delega al PDF existente de S2.
- `POST /api/pasajero/[token]/calificacion`: guarda `reservas.calificacion` JSON y exige motivo si algún eje <= 3.
- `POST /api/incidencias`: valida token pasajero, clasifica determinísticamente, crea incidencia y audita.
- `GET /api/incidencias/[id]`, `POST /api/incidencias/[id]/cerrar`: seguimiento público del caso con token.
- `POST /api/incidencias/[id]/responder`: endpoint Bearer para conductor, con scoping por conductor/reserva.
- `/bienestar/[caso]`: seguimiento público de incidencia, timeline y opciones de entrega si el conductor encontró el
  objeto.
- `/admin/bienestar`: bandeja mínima de incidencias activas.
- `apps/web/src/lib/supabase/server.ts`: nuevos broadcasts `incidencia` a `reserva-{id}` y `conductor-{id}`.
- `apps/web/src/lib/push.ts`: push opcional de objeto olvidado al conductor, degradable igual que asignación.

En `packages/bienestar`:

- `clasificarIncidenciaDeterminista`: keywords de objeto olvidado (`olvidé`, `dejé`, `perdí`, cartera/casaca/etc.)
  → `objeto_olvidado`, severidad `baja`/`media`.
- Tests unitarios de clasificación.

En `apps/driver`:

- Realtime `conductor-{id}` ahora escucha `incidencia`.
- Home muestra tarjeta "Objeto olvidado" cuando llega un caso.
- Nueva pantalla oculta `/(auth)/incidencia/[id]` con acciones grandes:
  - `Sí encontré`
  - `No vi nada`
  - `Revisar en 5 min`
- Taps de push con `screen=incidencia` navegan a la pantalla del caso.

No se añadió app pasajero, no se añadieron tablas, no se activó RLS, no se tocaron voucher/PDF/RENIEC, no se reabrió
la heurística de asignación S5.

## 2. Seguridad y reglas de negocio

- `/p/[token]` y mutaciones públicas validan `token_pasajero`; no aceptan IDs libres para modificar reservas.
- El PDF por pasajero usa endpoint tokenizado y no obliga al pasajero a conocer el ID interno del comprobante.
- La calificación vive en `reservas.calificacion`, como exige el schema demo.
- La incidencia vive en la tabla existente `incidencias`, con `timeline` JSON.
- El conductor solo responde incidencias de reservas asignadas a su `conductor_id` y tenant.
- Si el texto no clasifica como objeto olvidado, `/api/incidencias` responde `solo_objeto_olvidado_demo`.
- Toda acción relevante audita:
  - `comprobante_pasajero_preparado`
  - `reserva_calificada`
  - `incidencia_objeto_olvidado_creada`
  - `incidencia_objeto_olvidado_respondida`
  - `incidencia_objeto_olvidado_cerrada/escalada`

## 3. Verificación ejecutada

Verificación focal ya ejecutada:

```bash
pnpm --filter @taxigreen/bienestar test
pnpm --filter @taxigreen/bienestar typecheck
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/web lint
pnpm --filter @taxigreen/web test
pnpm --filter @taxigreen/web build
pnpm --filter @taxigreen/driver typecheck
pnpm --filter @taxigreen/driver lint
pnpm --filter @taxigreen/driver exec expo export --platform android
```

Resultados focales:

```text
packages/bienestar -> 3/3 tests
apps/web unit -> 11/11
apps/web build -> rutas /p/[token], /bienestar/[caso], /admin/bienestar y APIs S8 presentes
expo export android -> EXIT 0, Android Bundled, 1352 módulos, .hbc 4.1 MB
```

Verificación final de cierre:

```bash
pnpm turbo run typecheck lint test build
pnpm e2e
pnpm --filter @taxigreen/driver exec expo export --platform android
```

Resultado:

```text
pnpm turbo run typecheck lint test build -> 52/52 tasks verdes
pnpm e2e -> 6/6 verde
expo export android -> EXIT 0, 1352 módulos, .hbc 4.1 MB
```

Smoke real S8 contra `next start` + Supabase:

```text
GET /p/tg_demo_passenger_001 -> 200
GET /api/pasajero/tg_demo_passenger_001 -> 200, conductor baseline Raúl Quispe
POST /api/incidencias -> abierta
POST /api/incidencias/[id]/responder con Bearer conductor -> en_resolucion
POST /api/incidencias/[id]/cerrar con token pasajero -> cerrada
Auditoría del caso smoke -> 3 filas correctas
```

Limpieza post-verificación:

```text
Caso smoke S8 eliminado
Reservas TG-WA-* generadas por E2E eliminadas
db:seed ejecutado
DB baseline: reservas=1, incidencias=1 seed, auditoria=1 seed_sprint_1, fcmTokens=0
Reserva protagonista: TG-2026-0001 asignada a Raúl Quispe, viaje asignado con timestamps null
```

## 4. Bugs / mejoras encontradas

- `packages/bienestar` era placeholder con `test` dummy. Se convirtió en paquete real con Vitest.
- `apps/web` no dependía de `@taxigreen/bienestar`; se añadió dependency y `transpilePackages`.
- Expo Router mantenía `.expo/types/router.d.ts` cacheado sin la ruta nueva `incidencia/[id]`. Para no depender de
  esa caché local, la navegación usa cast controlado en las tres rutas de push/realtime. El bundle Metro sí reconoce
  la pantalla y exporta correctamente.
- Mapbox GL JS web no estaba instalado como dependencia. Para no ensuciar el monorepo con un paquete pesado, S8 carga
  Mapbox desde CDN solo cuando hay token; sin token usa fallback textual.
- El E2E inicial de `/p/[token]` asumía un conductor fijo (`Raúl Quispe`). La suite corre en paralelo y otros tests
  pueden reasignar la reserva durante la prueba; se corrigió para validar el contrato estable del link pasajero
  (conductor llamable, unidad, vuelo, punto y destino) sin depender del nombre exacto mientras la DB está compartida.

## 5. Pendientes reales / riesgos

- Falta smoke físico en Android/dev client para:
  - push real de incidencia;
  - navegación desde push a `/(auth)/incidencia/[id]`;
  - respuesta del conductor en dispositivo real.
- Mapbox Directions real no se implementó; se usa ruta simple entre conductor/recojo/destino. ETA sigue siendo demo
  estable.
- `GET /api/incidencias/[id]` es público por UUID del caso. Es aceptable para demo; en MVP conviene exigir token o
  magic link firmado.
- La bandeja `/admin/bienestar` es mínima; no incluye SLA visual avanzado ni asignación a operador humano.
- El endpoint de objeto olvidado puede crear varios casos por la misma reserva. Para MVP conviene deduplicar casos
  abiertos por `reserva_id + tipologia`.

## 5.2 Auditoría post-cierre exhaustiva (2026-06-03)

Segunda pasada senior sobre todo S8 (web + driver + bienestar) buscando bugs ocultos de detalle. Se
encontraron y **corrigieron** 4 defectos; 2 quedan como deuda anotada (no bloquean demo).

Corregidos:

- **(Alta) Broadcast Realtime tumbaba la mutación.** `apps/web/src/lib/supabase/server.ts`:
  `sendRealtimeBroadcast` tenía `try/finally` **sin `catch`**. Si `httpSend` rechazaba (red/Supabase
  lento), la excepción se propagaba y `POST /api/incidencias` devolvía **500 después** de crear la
  incidencia y auditarla → el pasajero reintentaba → **caso duplicado**. Ahora el broadcast es
  best-effort real: captura y devuelve `{ok:false, reason:'broadcast_error'}`. Afecta a todos los
  broadcasts (asignación/estado/incidencia desde S3/S6/S7/S8), no solo bienestar.
- **(Media) Sin deduplicación de incidencias.** `POST /api/incidencias` ahora reutiliza el caso de
  `objeto_olvidado` activo (no `cerrada`/`resuelta`) de la reserva (responde `deduplicado:true`) en vez
  de crear otro. Verificado en smoke: segundo POST → mismo `id`.
- **(Media, visual) Mapa del pasajero se recreaba cada 3 s.** `p/[token]/seguimiento-cliente.tsx`: el
  `useEffect` de creación del mapa dependía de `driverPosition`/`line`, que cambian con cada posición; su
  cleanup destruía y recreaba el mapa (flicker + reset de zoom durante el tracking en vivo, que es el wow
  principal). Ahora el mapa se crea una vez (`deps [token]`) y un segundo effect actualiza ruta y mueve el
  marcador (creándolo si la posición llega tarde), sin re-encajar bounds.
- **(Baja) Reabrir caso cerrado.** `POST /api/incidencias/[id]/responder` no impedía que una respuesta
  tardía del conductor (app con estado viejo) reabriera un caso ya `cerrada`/`resuelta`. Se añadió
  `estado: { notIn: [cerrada, resuelta] }` al match → 404 sin revertir el estado terminal del pasajero.
  Verificado en smoke: responder tras cerrar → 404.

Deuda anotada (no bloquea, en `DEUDA_TECNICA §3`):

- Correlativo de comprobante con posible race bajo concurrencia (existe `@@unique` → 500, no corrupción;
  demo single-pasajero no lo dispara).
- `GET /api/incidencias/[id]` público por UUID y token del pasajero incrustado en el link de
  `/admin/bienestar`.

Verificación de la auditoría:

```text
pnpm turbo run typecheck lint test build -> 52/52
pnpm e2e -> 6/6
pnpm --filter @taxigreen/driver exec expo export --platform android -> EXIT 0 (entry index.js, .hbc 4.1 MB)
Smoke S8 vivo: dedup (mismo id), responder encontrado 200 en_resolucion, cerrar 200 cerrada,
  responder tras cierre 404, PDF pasajero 200 (redirect firmado). DB restaurada a baseline.
```

### Fix dev client EAS (entry `index.js`)

Bug de arranque del dev client (no del bundle): `"main": "expo-router/entry"` rompía el dev client porque
Metro resolvía el entry al `.pnpm` de la **raíz** del workspace, pero el dev client pedía la ruta relativa a
`apps/driver/` (`node-linker=isolated` no tiene `.pnpm` ahí) → 404 `Unable to resolve module
./node_modules/.pnpm/expo-router@.../entry`. Se añadió `apps/driver/index.js` (`import 'expo-router/entry';`)
y `"main": "index.js"`. Verificado contra Metro real: `/index.bundle` → **200** (11.3 MB); el path viejo del
`.pnpm` → 404. **No requiere reconstruir el APK**: el dev client toma el entry del manifest de Metro en cada
conexión. APK válido en uso: build EAS `c7ecab4b` (FINISHED).

## 6. Handoff a Sprint 9

Sprint 9 debe partir de `docs/PROMPT_SPRINT_9_CODEX.md`.

Reglas que no se deben romper:

- `/p/[token]` es la superficie pública del pasajero. No crear app pasajero ni OAuth pasajero.
- `reserva-{id}` sigue siendo el canal de estado/posición/incidencia.
- Mantener objeto olvidado como única tipología E2E; no expandir a 9 tipologías antes de cerrar demo.
- S9 debe enfocarse en `/counter`, landing, reset/guion, deploy y video respaldo.

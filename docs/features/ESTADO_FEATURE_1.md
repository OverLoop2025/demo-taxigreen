# ESTADO Feature 1 — Gate de counter y estado de abordaje

**Fecha de cierre:** 2026-06-11  
**Fuente de verdad:** [`MASTER_FLUJO_OPERACIONAL_PERFECTO.md`](MASTER_FLUJO_OPERACIONAL_PERFECTO.md)  
**Prompt ejecutado:** [`PROMPT_FEATURE_1_COUNTER_GATE_CODEX.md`](PROMPT_FEATURE_1_COUNTER_GATE_CODEX.md)  
**Veredicto:** Feature 1 cerrada y verificada. GO para Feature 2.

---

## 1. Resultado operativo

El flujo sensible quedó endurecido:

1. Una reserva `recojo_aeropuerto` asignada ya no habilita al conductor automáticamente.
2. El conductor puede ver la asignación, pero el CTA queda bloqueado como **"Esperando counter"**.
3. Si intenta iniciar por API, el backend responde `409 counter_pendiente` y no modifica viaje ni reserva.
4. El counter valida el pase QR, consume el token one-time y persiste la luz verde en `reservas`.
5. La app conductor recibe/refresca el estado de abordaje y recién entonces puede avanzar `asignado -> en_camino`.
6. `traslado_aeropuerto` y `city` no se bloquean.

La corrección principal no vive solo en UI: el gate está en la transacción del endpoint móvil.

---

## 2. Cambios implementados

### 2.1 Base de datos

- `packages/database/prisma/schema.prisma`
  - Nuevo enum `EstadoAbordaje`: `no_requerido`, `pendiente_validacion`, `autorizado`.
  - Nuevos campos en `reservas`: `estado_abordaje`, `counter_validado_en`, `counter_usuario_id`.
- `packages/database/prisma/migrations/20260611000000_feature1_estado_abordaje/migration.sql`
  - Agrega enum/campos.
  - Backfill seguro:
    - recojo con viaje ya iniciado/finalizado -> `autorizado`;
    - resto de recojos -> `pendiente_validacion`.
- `packages/database/prisma/seed.ts`
  - La reserva protagonista queda en `pendiente_validacion` y limpia datos de counter al reseed base.
- `packages/database/prisma/seed-guion.ts`
  - Si deja la demo visual en curso, también deja `estado_abordaje=autorizado`.
- `packages/database/prisma/seed-operacional.ts`
  - Nuevo seed para probar Feature 1: protagonista asignada, viaje `asignado`, counter pendiente.
- `packages/database/package.json`
  - Nuevo script `db:seed-operacional`.

### 2.2 Dominio y API web

- `apps/web/src/lib/conductor-asignacion.ts`
  - Helpers `requiereCounter`, `estadoAbordajeInicial` y `puedeIniciarRuta`.
  - Serializer móvil incluye `abordaje`.
- `apps/web/src/lib/conductor-asignacion-repository.ts`
  - Selects incluyen `estado_abordaje` y `counter_validado_en`.
- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts`
  - Bloquea `asignado -> en_camino` para `recojo_aeropuerto` pendiente de counter.
  - Devuelve `409 counter_pendiente`.
  - Audita `driver_inicio_bloqueado_counter`.
- `apps/web/src/app/api/voucher/[id]/verify/route.ts`
  - Mantiene advisory lock + auditoría `voucher_qr_consumido`.
  - Persiste `estado_abordaje=autorizado`, `counter_validado_en`, `counter_usuario_id`.
  - Audita `abordaje_autorizado`.
  - Elimina la antigua mutación `confirmada -> asignada`.
  - Respuesta amplía `reserva` con `estado_abordaje`, `counter_validado_en`, `conductor` y `pago:null`.
- `apps/web/src/lib/reservas.ts`
  - `findReservaByPublicId` trae conductor/placa para counter.
- `apps/web/src/lib/supabase/server.ts`
  - Nuevos broadcasts `broadcastReservaAbordaje` y `broadcastConductorAbordaje`.
- `apps/web/src/app/wa-sim/actions.ts`
  - Nuevas reservas usan `estadoAbordajeInicial(tipo_viaje)`.
  - Seguimiento de counter deja de inferirse por auditoría como fuente de estado.

### 2.3 Counter y app conductor

- `apps/web/src/app/counter/voucher-validator.tsx`
  - Muestra conductor/unidad o "Falta asignar conductor".
  - Botón principal habla de "dar luz verde".
  - Estado final distingue luz verde enviada vs. luz verde pendiente de asignación.
- `apps/driver/src/features/assignment/types.ts`
  - `DriverAssignment` incluye `abordaje`.
- `apps/driver/src/features/assignment/transitions.ts`
  - `getNextTripAction` puede devolver acción bloqueada.
- `apps/driver/src/features/realtime/index.tsx`
  - Escucha evento `abordaje` en `conductor-{id}`.
- `apps/driver/app/(auth)/home.tsx`
  - Card de asignación activa muestra bloqueo cuando aplica.
- `apps/driver/app/(auth)/asignacion/[id].tsx`
  - CTA deshabilitado mientras el counter no valide.
  - Refetch silencioso y aviso al recibir luz verde.

---

## 3. Pruebas agregadas o endurecidas

- `apps/web/src/lib/conductor-asignacion.test.ts`
  - Helpers de counter.
  - Estado inicial por tipo de viaje.
  - Serializer móvil con `abordaje`.
- `apps/web/src/app/api/conductor/asignacion/activa/route.test.ts`
  - Contrato `abordaje` en asignación activa.
- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.test.ts`
  - `recojo_aeropuerto + pendiente_validacion` -> `409 counter_pendiente`.
  - `recojo_aeropuerto + autorizado` -> avanza.
  - `traslado_aeropuerto` -> avanza sin counter.
- `tests/e2e/counter-gate.spec.ts`
  - E2E autocontenido del gate completo.
- `tests/e2e/counter-qr.spec.ts`
  - Ahora es autocontenido y ya no consume `TG-2026-0001`.

---

## 4. Verificación ejecutada

### 4.1 Base de datos

```bash
pnpm --filter @taxigreen/database db:generate
pnpm --filter @taxigreen/database db:deploy
```

Resultado:

- Prisma Client generado correctamente.
- Migración `20260611000000_feature1_estado_abordaje` aplicada en Supabase.

### 4.2 Tests unitarios, typecheck y lint por paquete

```bash
pnpm --filter @taxigreen/web test -- --run
pnpm --filter @taxigreen/web typecheck && pnpm --filter @taxigreen/web lint
pnpm --filter @taxigreen/driver exec tsc --noEmit && pnpm --filter @taxigreen/driver lint
pnpm --filter @taxigreen/database typecheck && pnpm --filter @taxigreen/database lint
```

Resultado:

- Web: 10 archivos, 61 tests verdes.
- Web typecheck/lint: verde.
- Driver typecheck/lint: verde.
- Database typecheck/lint: verde.

### 4.3 Gate completo del monorepo

```bash
pnpm turbo run typecheck lint test build
```

Resultado:

- Verde, 56/56 tareas.

Notas:

- Persisten warnings conocidos de entorno/documentados: plugin Next ESLint no detectado por config flat,
  algunos tasks sin outputs declarados en Turbo, y fallbacks deterministas de IA/rutas durante build.

### 4.4 E2E con pila viva

Se levantó `next start` en puerto 3001 para no pisar otros servicios.

```bash
E2E_BASE_URL=http://localhost:3001 pnpm exec playwright test --config tests/e2e/playwright.config.ts --workers=1
```

Resultado:

- Verde, 9/9.

Validación adicional:

```bash
pnpm --filter @taxigreen/database db:seed-guion
E2E_BASE_URL=http://localhost:3001 pnpm exec playwright test tests/e2e/voucher-flow.spec.ts --config tests/e2e/playwright.config.ts --workers=1
```

Resultado:

- Verde, 1/1. Confirma que el voucher protagonista queda sano tras reseed.

### 4.5 Bundle móvil

```bash
pnpm --filter @taxigreen/driver exec expo export --platform android
```

Resultado:

- EXIT 0.
- Android bundle generado, 1430 módulos.

### 4.6 Smoke operacional del gate

```bash
pnpm --filter @taxigreen/database db:seed-operacional
```

Luego:

- Login conductor `conductor1@taxigreen.demo` / PIN `1234`.
- Asignación activa protagonista.
- `POST /api/conductor/asignacion/{id}/estado` con `estado=en_camino`.

Resultado esperado y verificado:

```json
{
  "error": "counter_pendiente",
  "estado_abordaje": "pendiente_validacion"
}
```

Después del smoke se restauró baseline:

```bash
pnpm --filter @taxigreen/database db:seed-guion
```

---

## 5. Bugs y hallazgos corregidos durante QA

### 5.1 Artefacto `.next` inconsistente

Al levantar `next start` en el puerto 3001 apareció:

```text
Cannot find module './vendor-chunks/zod@3.25.76.js'
```

Causa: `.next` estaba inconsistente/stale por builds previos.  
Corrección: limpiar `apps/web/.next` y reconstruir `apps/web`. No fue bug de producto ni cambio funcional.

### 5.2 E2E del counter era destructivo

`counter-qr.spec.ts` consumía el voucher protagonista. Dependiendo del orden, podía romper `voucher-flow`.

Corrección:

- El spec ahora crea su propia reserva `TG-WA-*` vía `/wa-sim`.
- Espera el QR PNG antes de pedir/verificar el token.
- Usa `page.request` y no depende de `TG-2026-0001`.

### 5.3 Carrera al leer token QR recién creado

Tras crear reserva por `/wa-sim`, leer el token de inmediato podía llegar antes de que el endpoint QR lo persistiera.

Corrección:

- El E2E espera que la imagen QR cargue antes de leer el header/token.

---

## 6. Estado de aceptación

| Criterio | Resultado |
|---|---|
| `recojo_aeropuerto` sin counter bloquea server-side | ✅ |
| CTA de conductor bloqueado mientras espera counter | ✅ |
| Counter valida y persiste luz verde | ✅ |
| Broadcast `abordaje` disponible para app conductor | ✅ |
| `traslado_aeropuerto` y `city` no se bloquean | ✅ |
| Counter antes de asignación queda soportado por persistencia | ✅ |
| `seed-guion` mantiene demo visual en curso autorizada | ✅ |
| `db:seed-operacional` deja demo del gate lista | ✅ |
| Full QA `turbo + e2e + expo export` | ✅ |

---

## 7. Riesgos residuales

- La habilitación visual sin reiniciar se validó por contrato Realtime y refetch en app, no con captura física Android
  en esta Feature. El bundle móvil sí compila/exporta correctamente.
- `pago:null` en counter es intencional. Feature 2 llenará ese contrato con cotización/pago persistidos.
- El broadcast sigue siendo best-effort, como el resto del sistema Supabase Realtime; el estado persistido es la fuente
  de verdad, así que un refetch recupera la luz verde aunque se pierda un evento.

---

## 8. Próximo paso

Implementar Feature 2:

- [`PROMPT_FEATURE_2_PAGO_DEMO_CODEX.md`](PROMPT_FEATURE_2_PAGO_DEMO_CODEX.md)

Objetivo: cotización persistida y pago demo autorizado antes de entregar el pase QR, usando el mismo monto en
wa-sim, admin, counter, pasajero y app conductor.

---

## 9. Parche F1.1 — auditoría post-cierre (2026-06-11)

Una auditoría profunda contra `MASTER_FLUJO_OPERACIONAL_PERFECTO.md` encontró 6 hallazgos (A1–A6).
Todos los de código quedaron corregidos en este parche:

| # | Severidad | Hallazgo | Fix |
|---|-----------|----------|-----|
| A1 | Alto | Crash del driver (`TypeError`) si la API no envía `abordaje` (backend prod sin F1): acceso sin `?.` en `home.tsx` y `asignacion/[id].tsx` | Optional chaining fail-open (mismo patrón que `transitions.ts`) |
| A2 | Medio | Ventana de incoherencia: DB compartida ya migrada pero Railway prod corría código pre-F1 (recojos nacían `no_requerido`, validaciones sin escribir estado) | Cerrada con commit + deploy de F1+F1.1 a Railway |
| A3 | Medio | Deadlock: QR consumido + abordaje no autorizado no tenía salida (conductor 409 `counter_pendiente`, counter 409 `voucher_ya_validado`) | Self-healing en la rama `voucher_ya_validado` del verify: repara `estado_abordaje=autorizado` con el timestamp histórico del consumo, atribuye `counter_usuario_id` al actor original, audita `abordaje_autorizado` (fuente sistema) y emite los broadcasts. Smoke en vivo verificado |
| A4 | Bajo | Jerga interna (`counter_pendiente`) visible en pantalla del conductor | Diccionario de mensajes humanos en `apiFetch` (el código crudo sigue en `ApiError.payload`) |
| A5 | Bajo | El campo `broadcast` de la respuesta del verify exponía internals de infraestructura | Eliminado de la respuesta (los broadcasts se siguen esperando server-side) |
| A6 | Bajo | El verify autorizaba abordaje de reservas canceladas | Guard `reserva_cancelada` (409) + auditoría `voucher_qr_rechazado` con motivo + etiqueta humana en `/counter` |

Verificación del parche: `turbo run typecheck lint test` 53/53, vitest web 61/61, e2e **9/9** contra build
limpio, smoke en vivo del self-healing A3 (409 + reserva reparada + auditoría, DB restaurada).

Gotcha de entorno (recurrente): correr `next dev` y `next start` sobre el mismo `apps/web/.next` corrompe
los chunks (`MODULE_NOT_FOUND vendor-chunks/...`) y rompe el login en e2e. Detener el dev server antes de
`build + start`, o usar puertos/procesos con `.next` exclusivo.

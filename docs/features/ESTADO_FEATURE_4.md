# ESTADO Feature 4 — Escenarios A/B end-to-end y pulido de mostrador/copy

**Fecha:** 2026-06-11  
**Fuente de verdad:** [`MASTER_FLUJO_OPERACIONAL_PERFECTO.md`](MASTER_FLUJO_OPERACIONAL_PERFECTO.md)  
**Prompt ejecutado:** [`PROMPT_FEATURE_4_ESCENARIOS_CODEX.md`](PROMPT_FEATURE_4_ESCENARIOS_CODEX.md)  
**Veredicto:** Feature 4 cerrada. El plan maestro F1-F4 queda completo en código y verificado localmente.

---

## 1. Implementado

Feature 4 separa los dos escenarios operativos sin contaminación:

- **A — recojo aeropuerto -> ciudad:** conserva pase de abordaje, mostrador, gate server-side y enlace en vivo diferido hasta validación.
- **B — hotel/punto externo -> aeropuerto:** nace con `estado_abordaje=no_requerido`, no muestra pase ni mostrador como requisito, entrega enlace en vivo directo y permite al conductor iniciar `en_camino` sin 409.

Quedó implementado:

- Conversación B nueva en `/wa-sim`: Hotel Costa Verde / Camila Rojas / vuelo LA640 / recojo lobby / cargo hotel.
- Reserva B canónica en seeds: `TG-2026-0002`, `tg_demo_passenger_002`, conductor distinto al protagonista, pago autorizado y viaje asignado.
- `db:seed-operacional` ahora deja A y B listos para demostrar en paralelo:
  - A: `asignada/asignado/pendiente_validacion`.
  - B: `asignada/asignado/no_requerido`.
- Ingesta documenta y prueba explícitamente:
  - "recoger en el Jorge Chávez" -> `recojo_aeropuerto`.
  - "llevar/traslado al aeropuerto" -> `traslado_aeropuerto`.
  - texto ambiguo aeroportuario -> `recojo_aeropuerto` por sesgo de negocio.
- `wa-sim` condiciona F5 por `requiereMostrador`:
  - A muestra pase y espera mostrador para revelar link.
  - B muestra seguimiento directo y no activa polling.
- Admin, pasajero y driver muestran lenguaje humano por escenario:
  - `Requiere mostrador` / `Sin mostrador`.
  - `Punto de encuentro` para A.
  - `Punto de recojo` para B.
  - driver B: `Listo para ir al punto de recojo`.
- Copy sweep:
  - UI evita llamar "voucher" al pase.
  - "QR" visible queda narrado como "pase de abordaje".
  - "counter" visible pasa a "mostrador" salvo rutas/identificadores técnicos.

---

## 2. Cambios por archivo

- `packages/ingesta/src/extractor.ts` — `punto_encuentro` solo es campo esperado para `recojo_aeropuerto`; `traslado_aeropuerto` solo exige vuelo si aplica.
- `packages/ingesta/src/diccionarios/zonas-lima.ts` — dirección canónica Hotel Costa Verde / Av. Malecón 200.
- `packages/ingesta/src/extractor.test.ts` — tests A/B + default ambiguo documentado.
- `apps/web/src/app/wa-sim/conversaciones-seed.ts` — conversación B de hotel.
- `apps/web/src/app/wa-sim/actions.ts` — retorna `tipoViaje` y `requiereMostrador`; seguimiento considera B validado desde el inicio.
- `apps/web/src/app/wa-sim/whatsapp-simulator.tsx` — tarjetas A/B diferenciadas, link directo en B, polling solo en A y panel sin "Encuentro pendiente" fantasma para B.
- `packages/database/prisma/seed.ts` — reserva B + pago + viaje + posición demo; A/B quedan idempotentes.
- `packages/database/prisma/seed-operacional.ts` — reset operacional F4 con A bloqueada y B directa.
- `packages/database/prisma/seed-guion.ts` — conserva guion visual y registra conversación B en metadata.
- `apps/web/src/lib/admin/reservas.ts` — serializa `abordaje.requiereMostrador` y autoriza B por contrato.
- `apps/web/src/app/admin/reservas/[id]/page.tsx` — chip y copy de acceso por escenario.
- `apps/web/src/components/admin/admin-reservas-live.tsx` — lista admin distingue `Mostrador` / `Sin mostrador`.
- `apps/web/src/lib/pasajero.ts` — contrato público incluye `reserva.abordaje`.
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx` — escucha evento `abordaje`, muestra pase validado en A y punto de recojo en B.
- `apps/driver/app/(auth)/home.tsx` y `apps/driver/app/(auth)/asignacion/[id].tsx` — banners/CTA por escenario y sin fallback duro a Salida 3 para B.
- `apps/driver/src/features/assignment/transitions.ts` — helper genérico para punto de recojo.
- `apps/web/src/app/counter/*`, `admin/auditoria`, `admin/metricas`, `admin/bienestar`, `demo/guion-narrado` — pulido de copy mostrador/pase y fallback real de punto.
- `tests/e2e/escenario-b.spec.ts` — E2E autocontenido de B.

---

## 3. Verificación

Comandos ejecutados:

```bash
pnpm --filter @taxigreen/ingesta test
pnpm --filter @taxigreen/web test -- --run apps/web/src/lib/conductor-asignacion.test.ts apps/web/src/lib/pasajero.test.ts
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/driver exec tsc --noEmit
pnpm --filter @taxigreen/web lint
pnpm --filter @taxigreen/database typecheck
pnpm --filter @taxigreen/pagos test
pnpm --filter @taxigreen/shared typecheck
pnpm turbo run typecheck lint test build
pnpm --filter @taxigreen/database db:seed-operacional
E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test --config tests/e2e/playwright.config.ts --workers=1
pnpm --filter @taxigreen/database db:seed-guion
E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test tests/e2e/voucher-flow.spec.ts --config tests/e2e/playwright.config.ts --workers=1
pnpm --filter @taxigreen/driver exec expo export --platform android
pnpm --filter @taxigreen/database db:seed-operacional
```

Resultados:

- Ingesta: 8/8 tests verdes.
- Web unit/API: 71/71 tests verdes.
- Pagos: 15/15 tests verdes.
- Web lint/typecheck, driver typecheck, database typecheck, shared typecheck: verdes.
- Turbo completo: 60/60 tareas verdes.
- Playwright completo contra `next start` fresco en `http://localhost:3100`: 10/10 verdes.
- Fase aislada `voucher-flow`: 1/1 verde.
- Expo Android export: EXIT 0, 1430 módulos.
- DB final restaurada con `db:seed-operacional`.

Smoke canónico con `db:seed-operacional`:

```json
{
  "A": {
    "seedEstado": "pendiente_validacion",
    "status": 409,
    "error": "counter_pendiente"
  },
  "B": {
    "seedEstado": "no_requerido",
    "status": 200,
    "requiereCounter": false,
    "autorizado": true,
    "viaje": "en_camino"
  }
}
```

---

## 4. Bugs encontrados en el camino

| Severidad | Hallazgo | Riesgo | Fix |
|---|---|---|---|
| Media | `seed.ts` intentaba resetear `calificacion: null` sobre columna `Json?`. | `tsc --noEmit` de database fallaba; el seed quedaba tipado incorrectamente. | Usar `Prisma.JsonNull` en `seed.ts`, `seed-operacional.ts` y `seed-guion.ts`. |
| Media | `wa-sim` B mostraba "Encuentro: Pendiente" aunque B no requiere punto de mostrador. | El operador podía interpretar que faltaba un dato de A en un traslado B. | Ocultar `punto_encuentro` cuando no aplica. |
| Baja | El panel de pago de `wa-sim` decía "antes de enviar el pase" también en B. | Narrativa contaminada: B no tiene pase como requisito. | Copy genérico: "antes de confirmar la reserva". |
| Baja | Admin bienestar y counter tenían fallback duro `Salida 3, columna F2`. | Una reserva B lateral podía mostrar un punto falso. | Fallback a `punto_encuentro ?? origen_texto ?? Punto por confirmar`. |
| Infra | E2E contra un `next start` viejo en puerto 3000 mostró "Application error" tras reconstruir `.next`. | Falsos negativos masivos en páginas React. | Levantar `next start` fresco en puerto 3100 y correr Playwright con `E2E_BASE_URL`. Documentado como gotcha operativo. |

---

## 5. Riesgos / deuda nueva

No se introduce deuda funcional nueva.

Se mantiene deuda ya registrada de F1: la app conductor depende de broadcast/refetch para reflejar luz verde; si el broadcast se pierde, el estado persistido se recupera al reenfocar/refrescar. Esto no bloquea F4 porque el gate server-side y el contrato A/B están correctos.

---

## 6. Próximo prompt

El plan maestro F1-F4 queda completo. La siguiente capa (identidad comercial, pago al finalizar,
cancelaciones/reasignación y reserva guiada) quedó consolidada en
[`MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md`](MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md) (features F5-F8);
el primer prompt ejecutable es
[`PROMPT_FEATURE_5_IDENTIDAD_COMERCIAL_CODEX.md`](PROMPT_FEATURE_5_IDENTIDAD_COMERCIAL_CODEX.md).

Trabajo futuro solo si se solicita explícitamente: hardening MVP, RLS, rate-limit Redis, WABA/RENIEC/SUNAT/pagos reales, liquidación, smoke Android físico con dev client/EAS.

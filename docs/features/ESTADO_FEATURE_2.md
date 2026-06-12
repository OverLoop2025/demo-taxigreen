# ESTADO Feature 2 — Pago demo y cotización persistida

**Fecha de cierre:** 2026-06-11  
**Fuente de verdad:** [`MASTER_FLUJO_OPERACIONAL_PERFECTO.md`](MASTER_FLUJO_OPERACIONAL_PERFECTO.md)  
**Prompt ejecutado:** [`PROMPT_FEATURE_2_PAGO_DEMO_CODEX.md`](PROMPT_FEATURE_2_PAGO_DEMO_CODEX.md)  
**Veredicto:** Feature 2 cerrada, auditada en profundidad y verificada. GO para Feature 3.

---

## 1. Resultado operativo

El flujo ya no trata el pago como un texto suelto en `tipo_pago`.

1. Cada reserva nueva nacida desde WhatsApp Sim calcula una tarifa demo antes de confirmar.
2. La reserva persiste la cotización (`reservas.cotizacion_*`) como fuente estable del monto.
3. El sistema crea una fila uno-a-uno en `pagos` y autoriza el método demo:
   - `app_pago` -> `autorizado` por `pasarela_demo`.
   - `voucher_hotel` -> `autorizado` por `credito_hotel_demo`.
   - `factura_empresa` -> `autorizado` por `credito_empresa_demo`.
   - `efectivo` -> `por_cobrar` por `efectivo_en_unidad`.
4. WhatsApp, counter, pasajero, admin y conductor muestran el mismo monto persistido.
5. El driver conserva el cálculo local anterior solo como fallback legacy si una reserva antigua no tiene pago.
6. Feature 3 queda lista para invocar `cerrarPagoDemo()` al finalizar viaje.

---

## 2. Cambios implementados

### 2.1 Base de datos

- `packages/database/prisma/schema.prisma`
  - Nuevo enum `EstadoPago`: `pendiente`, `autorizado`, `por_cobrar`, `capturado`, `por_liquidar`, `rechazado`.
  - Nuevo modelo `pagos` con `reserva_id @unique`, `tipo_pago`, `estado`, `monto`, `moneda`, proveedor demo, autorización de pasarela y timestamps.
  - Nuevos campos en `reservas`: `cotizacion_monto`, `cotizacion_moneda`, `cotizacion_fuente`, `cotizacion_calculada_en`.
- `packages/database/prisma/migrations/20260611010000_feature2_pagos_demo/migration.sql`
  - Crea enum, tabla e índices/FKs.
  - No hace backfill automático: las reservas históricas toleran `pago=null`.
- `packages/database/prisma/seed.ts`
  - La reserva protagonista queda con cotización `S/ 75.00` y pago `voucher_hotel/autorizado`.
- `packages/database/prisma/seed-guion.ts` y `seed-operacional.ts`
  - Limpian `pagos` antes de borrar reservas `TG-WA-*`; evita violar FK en smokes/e2e.

### 2.2 Dominio de pagos

- Nuevo paquete `packages/pagos`.
- Funciones principales:
  - `calcularCotizacionDemo(input)`: coordenadas válidas -> base `7.50 + 3.20/km * 1.3`, redondeo a `0.50`, mínimo `15.00`; sin coordenadas confiables -> `S/ 75.00`.
  - `autorizarPagoDemo(input)`: upsert idempotente por `reserva_id`.
    - Solo `app_pago` genera autorización `AUT-*`.
    - `voucher_hotel` y `factura_empresa` usan proveedor de crédito demo con `autorizacion=null`.
  - `cerrarPagoDemo(input)`: implementado para Feature 3; `app_pago/efectivo -> capturado`, `voucher_hotel/factura_empresa -> por_liquidar`.
  - `estadoPagoHumano()` y `serializarPagoDemo()` para no exponer jerga técnica en UI.
- `apps/web/package.json` y `apps/web/next.config.ts`
  - Web consume/transpila `@taxigreen/pagos`.

### 2.3 WhatsApp Sim

- `apps/web/src/app/wa-sim/actions.ts`
  - Nueva Server Action `previsualizarPagoDesdeIngesta()`.
  - `crearReservaDesdeIngesta()` ahora calcula cotización, crea reserva con `cotizacion_*`, autoriza pago en la misma transacción y audita `pago_demo_autorizado`.
- `apps/web/src/app/wa-sim/whatsapp-simulator.tsx`
  - Panel lateral muestra "Tarifa y pago" antes de confirmar.
  - Al confirmar se muestra secuencia determinística: "Calculando tarifa" -> "Validando método de pago" -> estado humano real del pago.
  - La tarjeta del chat enviada al pasajero incluye monto, método y estado de pago.
  - El resumen del copiloto incluye `Tarifa: S/ ...`.

### 2.4 Counter, pasajero, admin y conductor

- `apps/web/src/app/api/voucher/[id]/verify/route.ts`
  - `reserva.pago` deja de ser `null` y se serializa desde `pagos/cotizacion`.
- `apps/web/src/app/counter/voucher-validator.tsx`
  - La revisión del pase muestra pago y estado antes de confirmar acceso.
- `apps/web/src/lib/pasajero.ts`
  - `PassengerTripData` incluye `pago`.
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`
  - El bottom sheet del pasajero muestra "Pago" con el mismo monto/estado.
- `apps/web/src/lib/admin/reservas.ts`
  - Filas/detalle incluyen `pago` y `abordaje` serializados.
- `apps/web/src/components/admin/admin-reservas-live.tsx`
  - La lista principal muestra el monto/estado de pago sin obligar a abrir el detalle.
- `apps/web/src/app/admin/reservas/[id]/page.tsx`
  - Nuevos bloques humanos "Pago" y "Acceso del pasajero".
- `apps/web/src/lib/conductor-asignacion-repository.ts` y `conductor-asignacion.ts`
  - La asignación del conductor incluye `cobro`.
- `apps/driver/src/features/assignment/types.ts`
  - `DriverAssignment.cobro` agregado.
- `apps/driver/app/(auth)/asignacion/[id].tsx`
  - Muestra cobro persistido en vista normal y modo navegación; fallback al cálculo local solo si falta pago.
  - El fallback legacy quedó alineado con el dominio: valida rangos lat/lng y respeta mínimo `S/ 15.00`.

---

## 3. Pruebas agregadas o endurecidas

- `packages/pagos/src/index.test.ts`
  - Cotización fija sin coordenadas.
  - Cotización con coordenadas + redondeo a `0.50`.
  - Coordenadas fuera de rango -> tarifario demo.
  - Tarifa mínima.
  - Autorización de los 4 métodos, incluyendo crédito hotel/empresa sin autorización de pasarela.
  - Rechazo de monto cero/negativo.
  - Cierre de los 4 métodos y caso sin pago.
  - Serializer humano con pago real, cotización legacy y reserva sin monto.
- `apps/web/src/lib/conductor-asignacion.test.ts`
  - La asignación serializa `cobro` con `S/ 75.00`.
- `apps/web/src/app/api/conductor/asignacion/activa/route.test.ts`
  - La asignación activa devuelve `cobro`.
- `tests/e2e/wa-sim.spec.ts`
  - WhatsApp muestra tarifa/pago y el verify del counter devuelve `pago`.
- `tests/e2e/counter-gate.spec.ts`
  - El counter devuelve `pago` y el conductor recibe `cobro`.
- `tests/e2e/counter-qr.spec.ts`
  - Verificación previa y consumo exponen `pago`.
- `tests/e2e/passenger-link.spec.ts`
  - El link público muestra pago `S/ 75.00` y estado autorizado.
  - Se corrigió fragilidad de placa fija: ahora valida cualquier placa demo visible porque otros e2e pueden reasignar la protagonista en paralelo.

---

## 4. Verificación ejecutada

### 4.1 DB y migración

```bash
pnpm --filter @taxigreen/database db:generate
pnpm --filter @taxigreen/database db:deploy
pnpm --filter @taxigreen/database db:seed
```

Resultado:

- Migración `20260611010000_feature2_pagos_demo` aplicada en Supabase.
- Seed base crea `pagos=1` para la protagonista.

### 4.2 Tests y build monorepo

```bash
pnpm --filter @taxigreen/pagos typecheck
pnpm --filter @taxigreen/pagos test
pnpm --filter @taxigreen/web test
pnpm turbo run typecheck lint test build
```

Resultado:

- `@taxigreen/pagos`: 15/15 tests verdes.
- `@taxigreen/web`: 61/61 tests verdes.
- Monorepo completo: 60/60 tareas verdes.
- `@taxigreen/driver`: typecheck y lint verdes.

Notas conocidas:

- Warnings de tests de IA/rutas corresponden a fallbacks deterministas intencionales.
- Warnings de Turbo por outputs faltantes ya existían.
- Warning de ESLint Next plugin no detectado por flat config ya existía.

### 4.3 E2E contra build real

Se detuvo solo el `next-server` activo en `:3000` para evitar el gotcha documentado de `.next` compartido; Metro `:8081` quedó intacto.

```bash
pnpm --filter @taxigreen/web start
pnpm e2e
```

Resultado:

- E2E verde, 9/9.

### 4.4 Bundle móvil

```bash
pnpm --filter @taxigreen/driver exec expo export --platform android
```

Resultado:

- EXIT 0.
- Android bundle generado, 1430 módulos.

### 4.5 Smoke no destructivo post-reseed

```bash
pnpm --filter @taxigreen/database db:seed-guion
curl -fsS http://localhost:3000/api/pasajero/tg_demo_passenger_001
curl -fsS -D - -o /dev/null http://localhost:3000/api/voucher/TG-2026-0001/qr
POST /api/voucher/TG-2026-0001/verify { consume:false }
```

Resultado:

- `/api/pasajero/tg_demo_passenger_001` -> `pago.etiqueta = "S/ 75.00 · Cargo al hotel autorizado"`.
- `/p/tg_demo_passenger_001` -> HTTP 200.
- Verify no destructivo -> `200`, `consumed=false`, `reserva.pago` autorizado.

Estado DB final:

```json
{
  "reservas": 1,
  "pagos": 1,
  "wa": 0,
  "auditoria": 4,
  "incidencias": 1,
  "protagonist": {
    "estado": "en_curso",
    "estado_abordaje": "autorizado",
    "pago": {
      "estado": "autorizado",
      "monto": "75.00",
      "moneda": "PEN",
      "proveedor_demo": "credito_hotel_demo",
      "autorizacion": null
    }
  }
}
```

---

## 5. Hallazgos y decisiones

- `pagos.reserva_id` quedó `@unique` porque el contrato operativo es uno-a-uno: una reserva tiene un estado financiero demo vigente.
- La migración no backfillea reservas históricas. Los serializers devuelven `null` si no hay pago/cotización.
- El seed canónico sí fue actualizado para que la demo viva muestre pago completo.
- `cerrarPagoDemo()` se implementó pero no se invoca aún. Feature 3 lo conectará al cierre `finalizado`.
- No se tocó comprobantes ni SUNAT demo: el hardcode/fallback de comprobantes queda para Feature 3, tal como indica el master.
- El copy visible evita jerga: "Pago", "Tarifa", "Cargo al hotel autorizado", "Crédito empresa autorizado", "Por liquidar...", "Se paga en efectivo en la unidad".

---

## 6. Auditoría profunda F2.1

Después del cierre inicial se ejecutó una pasada de debugging orientada a bugs de contrato, bordes y credibilidad demo.

Hallazgos corregidos:

1. **Autorización mal modelada para crédito hotel/empresa.**
   - Problema: `voucher_hotel` generaba `HOT-*` y `factura_empresa` generaba `EMP-*`.
   - Riesgo: confundía crédito/voucher corporativo con autorización de pasarela; el prompt de F2 pedía `AUT-*` solo para `app_pago`.
   - Fix: créditos quedan `autorizado` por proveedor demo y `autorizacion=null`; seed protagonista actualizado.

2. **Cotización aceptaba coordenadas finitas pero inválidas.**
   - Problema: lat/lng fuera de rango podían producir tarifas absurdas.
   - Fix: `calcularCotizacionDemo()` valida rangos terrestres; si no son confiables cae al tarifario demo.
   - Cobertura: test de coordenadas fuera de rango y test de tarifa mínima.

3. **El fallback móvil del conductor no respetaba la misma fórmula.**
   - Problema: `cobroEstimado()` no aplicaba mínimo `S/ 15.00` y no validaba rangos lat/lng.
   - Riesgo: reservas legacy sin `pago` podían mostrar al conductor un monto distinto al dominio.
   - Fix: fallback alineado con el dominio y type predicate para que TypeScript garantice coordenadas numéricas.

4. **Fecha inválida en WhatsApp podía llegar a Prisma.**
   - Problema: una fecha no vacía pero inválida no era "faltante" y podía terminar como `Invalid Date` en la transacción.
   - Fix: `crearReservaDesdeIngesta()` valida la fecha antes de crear reserva y devuelve un error humano controlado.

5. **Copy y estado visual no eran suficientemente exactos.**
   - Problema: "Credito" sin tilde, payloads sin acentos y animación final siempre "Autorizado ✓", incluso para efectivo.
   - Fix: copy humano con acentos; la animación usa `result.pago.estadoLabel`.

6. **La lista admin escondía el pago.**
   - Problema: el serializer traía `pago`, pero "Servicios de hoy" no lo mostraba.
   - Fix: la fila principal ahora muestra `S/ ... · estado`, manteniendo el detalle como superficie ampliada.

Verificación F2.1:

```bash
pnpm --filter @taxigreen/database db:generate
pnpm --filter @taxigreen/database db:deploy
pnpm --filter @taxigreen/pagos typecheck
pnpm --filter @taxigreen/pagos test -- --run
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/web test -- --run
pnpm --filter @taxigreen/web lint
pnpm --filter @taxigreen/driver typecheck
pnpm --filter @taxigreen/driver lint
pnpm turbo run typecheck lint test build
pnpm --filter @taxigreen/database db:seed-guion
pnpm e2e
pnpm --filter @taxigreen/driver exec expo export --platform android
pnpm --filter @taxigreen/database db:seed-guion
```

Resultado F2.1:

- `@taxigreen/pagos`: 15/15.
- `@taxigreen/web`: 61/61.
- Monorepo completo: 60/60 tareas.
- Prisma migrate deploy: sin migraciones pendientes.
- E2E: 9/9 contra `next start` en `localhost:3000`.
- Expo Android export: EXIT 0, 1430 módulos.
- Smoke final no destructivo:
  - pasajero: `S/ 75.00 · Cargo al hotel autorizado`.
  - counter verify `consume:false`: `200`, `consumed=false`, mismo pago.
  - DB: `reservas=1`, `pagos=1`, `TG-WA-*=0`, protagonista `en_curso/autorizado`, `proveedor_demo=credito_hotel_demo`, `autorizacion=null`.

---

## 7. Pendiente intencional para Feature 3

- Conectar `cerrarPagoDemo()` en la transición del conductor a `finalizado`.
- Preparar comprobante con monto real (`pago.monto ?? cotizacion_monto ?? 75`) en la misma transacción.
- Cambiar el CTA del pasajero post-viaje para que "Descargar comprobante" sea dominante cuando el cierre ya lo preparó.
- Auditar `pago_demo_cerrado` y `comprobante_preparado`.

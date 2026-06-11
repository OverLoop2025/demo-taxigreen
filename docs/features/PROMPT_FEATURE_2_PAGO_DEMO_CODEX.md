# PROMPT Feature 2 — Cotización y pago demo (Codex)

> Prerrequisito: Feature 1 cerrada con `docs/features/ESTADO_FEATURE_1.md` y CI verde. Revisa ese
> estado antes de empezar: si Feature 1 cambió contratos respecto al master, el master manda y este
> prompt se ajusta.

---

Actúa como ingeniero senior full-stack del monorepo `demo-taxigreen` (stack y reglas en
`CLAUDE.md`). Idioma: español con acentos. Determinista primero; nada de LLM aquí. Commits solo si
el usuario lo pide.

## Misión

Implementar **Feature 2 del plan maestro** `docs/features/MASTER_FLUJO_OPERACIONAL_PERFECTO.md`
(§4.1, §5.6, §5.7, §5.8, §6):

> Toda reserva nace con una **cotización persistida** y un **pago demo autorizado** según su
> `tipo_pago`, ANTES de entregar el pase QR. Un único monto recorre wa-sim, admin, counter,
> pasajero y app del conductor. Sin pasarela real: autorización simulada, animada y auditada.

## Lecturas obligatorias

- `docs/features/MASTER_FLUJO_OPERACIONAL_PERFECTO.md` + `docs/features/ESTADO_FEATURE_1.md`
- `packages/database/prisma/schema.prisma` (ya con Feature 1)
- `apps/web/src/app/wa-sim/{actions.ts,whatsapp-simulator.tsx}`
- `apps/web/src/lib/{admin/reservas.ts,pasajero.ts}`
- `apps/web/src/app/api/voucher/[id]/verify/route.ts` (campo `pago: null` que dejó F1)
- `apps/web/src/app/counter/voucher-validator.tsx`
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`
- `apps/web/src/lib/conductor-asignacion.ts` + `apps/driver/app/(auth)/asignacion/[id].tsx`
  (en especial `cobroEstimado()` — va a dejar de ser la fuente del monto)
- `packages/asignacion/package.json` (referencia de cómo se estructura un paquete del workspace)

## NO tocar

- Integraciones reales (Culqi/Niubiz/SUNAT): TODO es simulado.
- El gate de Feature 1, la heurística de asignación, el QR/counter one-time.
- `comprobantes` (eso es Feature 3); aquí solo se persiste pago/cotización.

## Tareas (en orden)

### 1. Migración Prisma

`EstadoPago` (6 valores), tabla `pagos` (con `reserva_id @unique`) y los 4 campos de cotización en
`reservas`, EXACTAMENTE como master §4.1. Migración
`feature2_pagos_cotizacion`. Sin backfill de pagos (las reservas históricas quedan sin pago; los
serializers toleran `null`).

### 2. Paquete `packages/pagos`

Nuevo paquete del workspace (`@taxigreen/pagos`, mismo esqueleto que `packages/asignacion`:
tsconfig, vitest, exports desde `src/index.ts`):

- `calcularCotizacionDemo(input)` — master §5.6: con coords ⇒ `base 7.50 + 3.20/km·1.3`, redondeo a
  0.50, mínimo 15.00 (misma fórmula que hoy usa el driver en `cobroEstimado()`, para que el monto no
  "salte" al migrar); sin coords ⇒ tarifario plano 75.00 (`fuente:'tarifario_demo'`).
- `autorizarPagoDemo({reservaId, tenantId, tipoPago, monto})` — upsert sobre `pagos` por
  `reserva_id` con el mapeo estado/proveedor del master (§5.6). Genera `autorizacion: 'AUT-' + 6
  alfanuméricos` solo para `app_pago`.
- `cerrarPagoDemo({reservaId})` — implementarlo ya (Feature 3 lo invoca), con el mapeo del master.
- `estadoPagoHumano(pago)` — etiquetas humanas exactas del master (sin jerga).
- Unit tests de TODO lo anterior (fórmula con/sin coords, los 4 tipos de pago en autorizar y cerrar).

### 3. wa-sim: cotizar + autorizar al crear

`apps/web/src/app/wa-sim/actions.ts` → `crearReservaDesdeIngesta`:

- Tras crear la reserva: `calcularCotizacionDemo` (persistir los 4 campos en `reservas`) →
  `autorizarPagoDemo` → `recordAudit('pago_demo_autorizado', …)` con monto/método/estado.
- El retorno añade `cotizacion: {monto, moneda}` y `pago: {estado, etiqueta}` para la UI.

`whatsapp-simulator.tsx`:

- La tarjeta "Reserva confirmada" del chat muestra `S/ {monto} · {etiqueta humana}` (p. ej.
  "S/ 75.00 · Cargo al hotel autorizado").
- En modo copiloto, el RESUMEN previo al "¿Confirmas?" incluye la línea
  `• Tarifa: S/ {monto} ({método humano})` — el cliente confirma sabiendo el precio (calcula con
  `calcularCotizacionDemo` client-safe vía server action de preview, o incluye el monto en la
  respuesta de extracción del action; elige lo más simple y documenta).
- Animación determinista de autorización antes de mostrar la tarjeta: estados secuenciales
  "Calculando tarifa → Validando método de pago → Autorizado ✓" (setTimeout ~600 ms por paso,
  respetando el patrón visual del panel). Sin librerías nuevas.

### 4. Superficies con el MISMO monto

- **Admin** (`lib/admin/reservas.ts` + `admin/reservas/[id]/page.tsx`): bloque "Pago" (método,
  etiqueta humana del estado, monto). Sin jerga.
- **Counter** (`verify/route.ts` + `voucher-validator.tsx`): el `pago: null` de F1 se llena con
  `{metodo, estado, monto, etiqueta}`; la vista `ready` lo muestra antes de confirmar acceso.
- **Pasajero** (`lib/pasajero.ts` + `seguimiento-cliente.tsx`): bloque "Pago" visible desde el
  inicio (método + etiqueta + monto). El tipo `PassengerTripData` añade `pago` (master §5.7).
- **Driver** (`conductor-asignacion.ts` serializer + repository + `apps/driver` types/pantalla):
  campo `cobro` (master §5.5). La ficha del conductor muestra `cobro.monto` persistido;
  `cobroEstimado()` local queda SOLO como fallback cuando `cobro === null` (reservas pre-F2).

### 5. Tests

- Unit: paquete pagos completo; serializers (admin/pasajero/conductor) con y sin pago.
- E2E: ampliar `tests/e2e/wa-sim.spec.ts` — tras confirmar, asserta que la tarjeta muestra
  `S/` + etiqueta de pago; y `counter-gate.spec.ts` (de F1) asserta que el verify devuelve `pago`
  con el mismo monto.
- Verifica que `asignacion-sugerencia.spec.ts` y `passenger-link.spec.ts` siguen verdes (el
  passenger-link puede necesitar el bloque Pago en sus asserts — actualizar conservando hechos).

## Verificación final obligatoria

La batería completa del master §7 (turbo + e2e en dos fases + expo export) + smoke manual: crear
reserva por wa-sim con cada `tipo_pago` (voucher hotel / factura / yape / efectivo) y verificar el
mismo monto en chat, admin, counter y `/p/[token]` (capturas).

## DoD

- [ ] Pago persistido y auditado ANTES de que el pase QR llegue al chat.
- [ ] `app_pago→autorizado`, crédito hotel/empresa→`autorizado` (proveedor crédito),
      `efectivo→por_cobrar` — verificado por unit tests.
- [ ] Mismo monto en las 5 superficies; el driver ya no inventa su tarifa (fallback solo legacy).
- [ ] Animación de autorización visible en wa-sim (sin libs nuevas).
- [ ] Todo verde + smoke con capturas.

## Cierre

`docs/features/ESTADO_FEATURE_2.md` (plantilla master §9) + actualizar
`docs/DOCUMENTACION_TECNICA.md` + revisar/ajustar
`docs/features/PROMPT_FEATURE_3_CIERRE_PAGO_COMPROBANTE_CODEX.md`.

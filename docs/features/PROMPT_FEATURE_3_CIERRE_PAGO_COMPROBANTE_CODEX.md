# PROMPT Feature 3 — Cierre de viaje conectado a pago y comprobante (Codex)

> Prerrequisito: Features 1 y 2 cerradas (`ESTADO_FEATURE_1.md`, `ESTADO_FEATURE_2.md`) y CI verde.
> `cerrarPagoDemo` ya existe en `packages/pagos` (lo entregó F2); aquí se conecta.

Estado F2 real al arrancar:

- Migración aplicada: `20260611010000_feature2_pagos_demo`.
- `reservas` ya tiene `cotizacion_monto`, `cotizacion_moneda`, `cotizacion_fuente`, `cotizacion_calculada_en`.
- `pagos.reserva_id` es `@unique`; relación uno-a-uno `reservas.pago`.
- `@taxigreen/pagos` ya exporta `calcularCotizacionDemo`, `autorizarPagoDemo`, `cerrarPagoDemo`,
  `serializarPagoDemo`, `estadoPagoHumano`, `formatMonto`.
- Auditoría F2.1: `autorizarPagoDemo` genera `AUT-*` solo para `app_pago`; `voucher_hotel` y
  `factura_empresa` quedan `autorizado` por crédito demo con `autorizacion=null`.
- `calcularCotizacionDemo` ya valida rangos lat/lng, aplica mínimo `S/ 15.00` y rechaza montos de
  pago no positivos.
- WhatsApp Sim ya crea cotización+pago y audita `pago_demo_autorizado`.
- Counter, pasajero, admin y conductor ya leen `pago/cobro` serializado.
- DB restaurada con `db:seed-guion`: protagonista `TG-2026-0001` queda `en_curso`, abordaje `autorizado`,
  pago `voucher_hotel/autorizado`, monto `S/ 75.00`, proveedor `credito_hotel_demo`, `autorizacion=null`.

---

Actúa como ingeniero senior full-stack del monorepo `demo-taxigreen` (stack y reglas en
`CLAUDE.md`). Idioma: español con acentos. Commits solo si el usuario lo pide.

## Misión

Implementar **Feature 3 del plan maestro** `docs/features/MASTER_FLUJO_OPERACIONAL_PERFECTO.md`
(§5.6 `cerrarPagoDemo`, §6 Feature 3):

> Cuando el conductor finaliza el viaje, el sistema cierra el pago demo según su tipo y prepara el
> comprobante con el monto REAL. El comprobante deja de ser una pieza suelta con monto fijo 75: es
> la consecuencia del cierre financiero.

## Lecturas obligatorias

- `docs/features/MASTER_FLUJO_OPERACIONAL_PERFECTO.md` + estados de F1/F2
- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts` (la transacción de transición)
- `packages/pagos/src/*` (de F2)
- `apps/web/src/app/api/pasajero/[token]/comprobante/route.ts` (hoy: monto fijo 75)
- `apps/web/src/app/api/comprobantes/[id]/pdf/route.ts` (marca `emitido` al renderizar)
- `apps/web/src/lib/pasajero.ts` (`comprobante.disponible`, `isFinished`)
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx` (panel de comprobante)
- `packages/comprobantes/src/*`
- `tests/e2e/passenger-link.spec.ts`

## NO tocar

- SUNAT real (el PDF demo se conserva tal cual).
- La numeración serie/correlativo existente (`@@unique([tipo, serie, correlativo])`).
- El gate de F1 ni la autorización de F2.
- No reimplementar cotización/autorización ni copy de pago: usar `@taxigreen/pagos`.
- No volver a fijar `ABC-123` en e2e de pasajero; las pruebas paralelas pueden reasignar la protagonista.

## Tareas (en orden)

### 1. Cierre en la transición `finalizado`

En `estado/route.ts`, cuando `estadoNuevo === EstadoViaje.finalizado`, DENTRO de la transacción
existente:

- `cerrarPagoDemo({reservaId})` (mapeo del master: app_pago/efectivo → `capturado`;
  voucher_hotel/factura_empresa → `por_liquidar`). Si la reserva no tiene pago (pre-F2), no falla:
  omite y deja constancia en el audit payload (`pago: null`).
- Preparar comprobante si no existe ninguno para la reserva:
  `tipo = factura_empresa ? factura : boleta`, `estado = pendiente`,
  `monto = pago.monto ?? reservas.cotizacion_monto ?? 75` (fallback legacy explícito y comentado).
  Reusar la lógica de serie/correlativo del endpoint de pasajero — EXTRAERLA a un helper compartido
  `apps/web/src/lib/comprobantes.ts` (`prepararComprobanteDemo(tx, {...})`) para no duplicarla.
- Auditar `pago_demo_cerrado` (con estado resultante) y `comprobante_preparado`.

### 2. Endpoint de comprobante del pasajero

`apps/web/src/app/api/pasajero/[token]/comprobante/route.ts`:

- Usa el helper compartido de la tarea 1.
- El monto fijo `75` desaparece: misma cascada `pago.monto ?? cotizacion_monto ?? 75`.
- Si el viaje no está terminado (`!isFinished`), responde 409 `viaje_no_terminado` (hoy no valida:
  endurecerlo — el botón solo aparece al final, pero la API debe ser coherente con la UI).
- Conserva el flujo DNI/RUC/nombre y la posibilidad de pedir `factura` aunque exista `boleta`
  (el helper ya tolera tipos distintos por reserva).

### 3. UI pasajero

`seguimiento-cliente.tsx`:

- Si al finalizar ya existe comprobante `pendiente` (lo preparó el cierre), el CTA pasa directo a
  "Descargar comprobante" (el PDF lo marca `emitido`, comportamiento actual). "Preparar comprobante"
  queda solo para cambiar de tipo (p. ej. pedir factura) — revisa la UX para que haya UNA acción
  dominante (regla F0: una pantalla, una acción).
- El bloque Pago (de F2) refleja el estado de cierre: "Pago cobrado" / "Por liquidar con el hotel".

### 4. Admin

El detalle de reserva muestra el estado financiero post-cierre (pago + comprobante con su estado),
reusando los serializers de F2; nada nuevo de diseño, solo datos.

### 5. Tests

- API: finalizar con `app_pago` → pago `capturado` + comprobante `pendiente` con monto del pago;
  con `voucher_hotel` → `por_liquidar`; sin pago (legacy) → no explota y prepara comprobante con
  fallback. Comprobante de pasajero con viaje no terminado → 409.
- Unit: helper `prepararComprobanteDemo` (correlativos por serie, tipos por tipo_pago).
- E2E: extender `counter-gate.spec.ts` o nuevo `cierre-financiero.spec.ts` AUTO-CONTENIDO (master
  C7): crear vía wa-sim → asignar → counter → conductor recorre estados hasta `finalizado` (vía API
  con token conductor) → asserta pago cerrado y comprobante descargable en `/p/[token]`.
- `passenger-link.spec.ts`: actualizar si la copy del comprobante cambió (conservar los hechos del
  flujo protagonista).

## Verificación final obligatoria

Batería completa del master §7 + smoke manual: viaje completo A con `voucher_hotel` (termina
`por_liquidar` + ticket/boleta) y uno con `app_pago` (termina `capturado`), capturas del pasajero y
del admin.

## DoD

- [ ] Finalizar el viaje cierra el pago y prepara el comprobante en la MISMA transacción.
- [ ] Ningún comprobante nuevo nace con monto inventado: pago → cotización → fallback comentado.
- [ ] El pasajero ve "Descargar comprobante" como acción dominante al terminar.
- [ ] No existe "pago cobrado" sin fila en `pagos`.
- [ ] Todo verde + smoke con capturas.

## Cierre

`docs/features/ESTADO_FEATURE_3.md` + `docs/DOCUMENTACION_TECNICA.md` + revisar/ajustar
`docs/features/PROMPT_FEATURE_4_ESCENARIOS_CODEX.md`.

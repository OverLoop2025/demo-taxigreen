# ESTADO Feature 6 — Pago al finalizar + libertades del pasajero

**Fecha:** 2026-06-12
**Fuente de verdad:** [`MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md`](MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md) (§5.3, §7)
**Prompt ejecutado:** [`PROMPT_FEATURE_6_PAGO_FINAL_LIBERTADES_CODEX.md`](PROMPT_FEATURE_6_PAGO_FINAL_LIBERTADES_CODEX.md)
**Veredicto:** Feature 6 cerrada. El independiente paga al finalizar desde `/p/[token]`; el convenio nunca ve botón de pago; el pasajero cancela según etapa.

---

## 1. Implementado

- `cerrarPagoDemo` consulta `responsable_pago`: pasajero → `por_cobrar` (antes capturaba solo); hotel/empresa → `por_liquidar` (sin cambio). Idempotente, fail-safe a pasajero.
- `capturarPagoPasajeroDemo` + `anularPagoDemo` nuevos en `@taxigreen/pagos`.
- Endpoint `POST /api/pasajero/[token]/pago` (`pagar_app` | `confirmar_efectivo`): captura con auditoría `pago_pasajero_capturado_demo` y **prepara el comprobante recién al pagar** (pagas → recibes comprobante). Idempotente; 409 `pago_cubierto_por_convenio` / `metodo_no_coincide` / `viaje_no_terminado`.
- Endpoint `POST /api/pasajero/[token]/cancelar` con etapas del master §5.3: libre → cancela; con unidad → cancela y libera al conductor (broadcasts); en camino/en punto → **solicitud** (incidencia para el equipo, no cancela sola); a bordo+ → 409. Pago no capturado se anula (`rechazado`).
- Guard del comprobante: `POST /comprobante` responde 409 `pago_pendiente` si paga el pasajero y aún no capturó. Tipo de comprobante por responsable (`tipoComprobanteParaReserva`): empresa → factura; pasajero con RUC/`requiere_factura` → factura; resto → boleta.
- `/p/[token]`: tarjeta de pago con CTA "Pagar ahora" (pasarela animada determinista) o "Ya pagué en efectivo"; "Cancelar reserva"/"Solicitar cancelación" según etapa calculada server-side (`acciones`); banner de reserva cancelada; comprobante bloqueado hasta pagar.
- Cierre del conductor (`estado/route.ts`): pasa `responsable_pago` (bug del avance previo: el fail-safe mandaba el voucher del hotel a `por_cobrar`), audita `requiere_accion_pasajero` y NO prepara comprobante cuando paga el pasajero.
- Admin: cancelada con motivo visible (lista + detalle); la sugerencia de asignación ya excluía canceladas.

## 2. Cambios por archivo

- `packages/pagos/src/index.ts` + tests — cierre por responsable, captura pasajero, anulación.
- `apps/web/src/app/api/pasajero/[token]/pago/route.ts` (+ test) — NUEVO.
- `apps/web/src/app/api/pasajero/[token]/cancelar/route.ts` (+ test) — NUEVO.
- `apps/web/src/app/api/pasajero/[token]/comprobante/route.ts` (+ test) — guard `pago_pendiente`.
- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts` (+ test) — cierre F6.
- `apps/web/src/lib/comprobantes.ts` — `tipoComprobanteParaReserva`.
- `apps/web/src/lib/pasajero.ts` — `acciones` (pago/cancelación), `reserva.cancelada`, `comprobanteDisponible`.
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx` — `PaymentActions`, `CancelPanel`, banner cancelada, guard de comprobante.

## 3. Verificación

Compartida con F7/F8 (una sola corrida final): `pnpm turbo run typecheck lint test build` EXIT 0 · web 88/88 · pagos 31/31 · Playwright **11/11** contra `next start` fresco en `:3100` · `voucher-flow` aislado 1/1 tras `db:seed-guion` · `expo export --platform android` EXIT 0 · DB restaurada con `db:seed-operacional`.

## 4. Bugs encontrados

| Severidad | Hallazgo | Fix |
|---|---|---|
| Alta | El avance previo de F6 dejó `cerrarPagoDemo` con fail-safe a pasajero pero el route del conductor no pasaba `responsable_pago`: TODOS los cierres (incluido voucher hotel) iban a `por_cobrar`. | El select del route trae `responsable_pago/requiere_factura/pasajero_ruc` y se pasa al cierre. Test del caso hotel → `por_liquidar`. |

## 5. Riesgos / deuda

- La "pasarela" es animación determinista (intencional de demo, ya registrado).
- Sin penalidades/reembolsos (por diseño: cancelar antes de pagar no necesita reembolso).

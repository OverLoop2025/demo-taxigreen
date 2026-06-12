# ESTADO Feature 7 — Cancelación del conductor + reasignación con disculpas

**Fecha:** 2026-06-12
**Fuente de verdad:** [`MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md`](MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md) (§5.4, §5.5)
**Veredicto:** Feature 7 cerrada. El conductor cancela con motivo; la reserva queda "necesita nueva unidad"; el copiloto repone solo y el chat se disculpa con la nueva unidad.

---

## 1. Implementado

- Endpoint `POST /api/conductor/asignacion/[id]/cancelar` (motivo obligatorio del catálogo: problema mecánico / no llego a tiempo / emergencia personal / error de asignación / otro + comentario opcional). Cancelable solo en `asignado|en_camino|en_punto` (a bordo+ es incidencia, 409). En una transacción: viaje → `cancelado`, reserva → `confirmada` con `conductor_id=null`, **`estado_abordaje` se conserva** (la luz verde del mostrador sigue válida para la nueva unidad, C3). Auditorías `viaje_cancelado_por_conductor` + `reserva_requiere_reasignacion`; broadcasts a `reserva-{id}` y `conductor-{id}` (best-effort).
- App conductor: enlace discreto "No puedo continuar este viaje" (panel drive y hoja de resumen) → hoja de motivos con radios + comentario → confirma → toast y vuelve a home.
- wa-sim: **watcher de unidad** (polling 5 s tras confirmar). Si la unidad cae: copiloto ON → `asignarConductorAutomatico` (misma ruta auditada) + disculpas en el chat con la nueva unidad; copiloto OFF → aviso "estamos asignando otra" y, al reasignar manualmente desde despacho, salen las disculpas. Cambio directo A→B también dispara la disculpa. El enlace del pasajero nunca cambia (mismo token).
- Admin: bandeja prioritaria **"Necesita nueva unidad"** (derivada: `confirmada` + viaje cancelado, sin enum nuevo — D6) con CTA "Asignar unidad"; aviso equivalente en el detalle. La reserva en ese estado vuelve a admitir sugerencia heurística (estado `confirmada`).
- Mostrador: botones "Cambiar unidad" / "Abrir despacho" hacia `/admin/reservas/[id]` (D4: misma server action auditada, sin duplicar despacho dentro del counter).

## 2. Cambios por archivo

- `apps/web/src/app/api/conductor/asignacion/[id]/cancelar/route.ts` (+ test, 4 casos) — NUEVO.
- `apps/driver/src/features/assignment/client.ts` — `cancelDriverAssignment` + `MotivoCancelacion`.
- `apps/driver/app/(auth)/asignacion/[id].tsx` — hoja de motivos + entradas.
- `apps/web/src/app/wa-sim/whatsapp-simulator.tsx` — watcher + disculpas + reasignación copiloto.
- `apps/web/src/lib/admin/reservas.ts` — `necesitaNuevaUnidad` + `cancelada` en el contrato.
- `apps/web/src/components/admin/admin-reservas-live.tsx` + `admin/reservas/[id]/page.tsx` — bandeja y avisos.
- `apps/web/src/app/counter/voucher-validator.tsx` — accesos a despacho.

## 3. Verificación

Compartida (ver `ESTADO_FEATURE_6.md §3`): turbo EXIT 0, web 88/88, e2e 11/11, export Android EXIT 0.

## 4. Riesgos / deuda

- El watcher de disculpas vive en el chat abierto de wa-sim (WABA es stub): si el chat no está abierto, el aviso sale al reabrirlo. Registrado en deuda; en MVP lo dispara el backend al canal real.
- La heurística puede volver a sugerir al conductor que canceló si re-entra a la cola (aceptable en demo con 6 conductores; exclusión temporal queda para MVP).

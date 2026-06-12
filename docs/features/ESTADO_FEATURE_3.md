# ESTADO Feature 3 — Cierre financiero y comprobante conectado

**Fecha:** 2026-06-11  
**Fuente de verdad:** [`MASTER_FLUJO_OPERACIONAL_PERFECTO.md`](MASTER_FLUJO_OPERACIONAL_PERFECTO.md)  
**Prompt ejecutado:** [`PROMPT_FEATURE_3_CIERRE_PAGO_COMPROBANTE_CODEX.md`](PROMPT_FEATURE_3_CIERRE_PAGO_COMPROBANTE_CODEX.md)  
**Veredicto:** Feature 3 cerrada, verificada y con luz verde para Feature 4.

---

## 1. Resultado operativo

El comprobante ya no es una pieza suelta ni nace con un monto inventado.

1. Cuando el conductor marca el viaje como `finalizado`, la misma transacción:
   - actualiza `viajes.estado`.
   - deja `reservas.estado=por_liquidar`.
   - ejecuta `cerrarPagoDemo()`.
   - prepara un comprobante `pendiente` si aún no existe.
   - audita `pago_demo_cerrado` y `comprobante_preparado`.
2. El monto del comprobante sigue una cascada única:
   - `pagos.monto`.
   - `reservas.cotizacion_monto`.
   - fallback legacy explícito `S/ 75.00` sólo para reservas antiguas pre-F2.
3. El pasajero, al terminar el viaje, ve `Descargar comprobante` como acción dominante si el cierre ya lo dejó listo.
4. El endpoint público de comprobante devuelve `409 viaje_no_terminado` si se invoca antes del final.
5. Admin muestra pago + comprobante como un bloque financiero único y humano.

---

## 2. Cambios implementados

### 2.1 Dominio compartido de comprobantes

- `apps/web/src/lib/comprobantes.ts`
  - Nuevo helper `prepararComprobanteDemo(tx, ...)`.
  - `tipoComprobantePorPago()`:
    - `factura_empresa` -> `factura`.
    - resto -> `boleta`.
  - `serieForTipoComprobante()` centraliza `B001/F001/T001`.
  - Se conserva `comprobanteToTemplateInput()` para el PDF actual.

### 2.2 Cierre del conductor

- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts`
  - En `EstadoViaje.finalizado`, dentro de la transacción existente:
    - `cerrarPagoDemo({ reservaId, now }, tx)`.
    - `prepararComprobanteDemo(tx, ...)`.
    - auditoría financiera.
  - Reservas legacy sin pago no rompen: se registra `pago:null` y se usa la cotización o fallback documentado.

### 2.3 Endpoint pasajero

- `apps/web/src/app/api/pasajero/[token]/comprobante/route.ts`
  - Bloquea antes del cierre con `409 viaje_no_terminado`.
  - Usa el helper compartido.
  - Mantiene DNI/RUC/nombre y permite pedir un tipo distinto si el pasajero necesita factura.

### 2.4 UI pasajero, admin y counter

- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`
  - Si ya existe comprobante, la acción principal es `Descargar comprobante`.
  - `Actualizar datos` queda como acción secundaria.
- `apps/web/src/app/admin/reservas/[id]/page.tsx`
  - Nuevo bloque `Pago y comprobante`.
  - Copy humano para cierre, comprobante y acceso del pasajero.
  - Fix menor: `traslado_aeropuerto` ya no cae a texto crudo.
- `apps/web/src/app/counter/voucher-validator.tsx`
  - La cámara ya no depende sólo de `BarcodeDetector`.
  - Se añadió fallback `jsqr` sobre frames de `getUserMedia`.
  - El copy visible usa "mostrador" y evita texto de demo.
- `apps/web/src/components/brand-header.tsx`
  - Se removieron etiquetas visibles "Demo en vivo" y "Demo final".

### 2.5 WhatsApp Sim

- `apps/web/src/app/wa-sim/whatsapp-simulator.tsx`
  - Fix del resumen duplicado en modo copiloto con guard síncrono.
  - En modo copiloto, el conductor ya no se anuncia antes de validar el pase.
  - Tras validación del mostrador, el copiloto puede asignar automáticamente y recién entonces envía nombre, placa y el mismo enlace de seguimiento.
- `apps/web/src/app/wa-sim/actions.ts`
  - Mensajes de error visibles sin "demo" ni "Sprint".

---

## 3. Bugs profundos encontrados y corregidos

| Severidad | Hallazgo | Riesgo | Fix |
|---|---|---|---|
| Alta | `POST /api/pasajero/[token]/comprobante` permitía preparar comprobante antes de terminar el viaje. | Se podía generar un comprobante operativo antes del cierre financiero. | 409 `viaje_no_terminado` server-side. |
| Alta | Comprobante usaba `monto: 75` fijo. | Pago/cotización y comprobante podían contradecirse. | Helper compartido con cascada pago -> cotización -> fallback legacy. |
| Alta | `/counter` abortaba cámara si faltaba `BarcodeDetector`. | En Chrome/iOS/Firefox/ambientes móviles podía no abrir experiencia de escaneo. | Cámara abre con `getUserMedia`; `BarcodeDetector` si existe, `jsqr` como fallback universal. |
| Media | Modo copiloto repetía el resumen tras "sí confirmar". | Chat poco creíble y confuso para el cliente. | Guard síncrono `autoConfirmingRef` + bloqueo mientras espera confirmación. |
| Media | Modo copiloto anunciaba conductor antes de que el mostrador validara el pase. | Secuencia operacional invertida frente al contrato F1/F5. | Asignación automática se difiere hasta `estado_abordaje=autorizado`. |
| Baja | Admin mostraba `traslado_aeropuerto` como texto crudo. | Ruido visual y sensación técnica. | Etiqueta humana `Traslado al aeropuerto`. |
| Baja | Header compartido mostraba "Demo". | Ruido comercial visible. | Copy neutral: `Operación en vivo` / `Servicio activo`. |

---

## 4. Pruebas agregadas

- `apps/web/src/lib/comprobantes.test.ts`
  - Serie por tipo.
  - Tipo por método de pago.
  - Monto desde pago.
  - Monto desde cotización.
  - Fallback legacy.
  - Idempotencia si ya existe comprobante del mismo tipo.
- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.test.ts`
  - Nuevo caso `finalizado`: pago `por_liquidar` + comprobante `pendiente` en la misma transacción.
- `apps/web/src/app/api/pasajero/[token]/comprobante/route.test.ts`
  - 409 si el viaje no terminó.
  - Comprobante al terminar con monto real del pago.
- `tests/e2e/counter-gate.spec.ts`
  - Extendido: después de counter, el conductor recorre `en_camino -> en_punto -> a_bordo -> finalizado`, el pago queda `por_liquidar` y el pasajero ve `Descargar comprobante`.

---

## 5. Verificación ejecutada

```bash
pnpm --filter @taxigreen/web test -- --run
pnpm --filter @taxigreen/web lint
pnpm --filter @taxigreen/web typecheck
pnpm turbo run typecheck lint test build
pnpm --filter @taxigreen/database db:seed-guion
pnpm e2e
pnpm --filter @taxigreen/driver exec expo export --platform android
```

Resultado:

- Web unit/API tests: 70/70 verdes.
- Web lint: verde.
- Web typecheck: verde.
- Monorepo completo: 60/60 tareas verdes.
- E2E Playwright: 9/9 verdes contra `next start` en `http://localhost:3000`.
- Android export: EXIT 0, 1430 módulos.
- DB final restaurada con `db:seed-guion`.

Smoke adicional `app_pago`:

- Se creó una reserva temporal `app_pago` con monto `S/ 88.50`.
- Se finalizó por el endpoint real `POST /api/conductor/asignacion/[id]/estado`.
- Resultado API: `cobro.estado=capturado`, `Pago cobrado`.
- Resultado DB antes de limpiar: `reservas.estado=por_liquidar`, `pagos.estado=capturado`,
  `comprobantes[0].estado=pendiente`, `monto=88.50`.
- La reserva temporal, pago, viaje, auditoría y comprobante fueron limpiados.

---

## 6. Siguiente feature

Feature 4 debe separar los escenarios A/B:

- A: aeropuerto -> ciudad, con pase de abordaje + mostrador + luz verde.
- B: hotel/punto externo -> aeropuerto, sin mostrador, enlace en vivo directo y conductor habilitado desde la asignación.

El prompt de F4 fue ajustado para consumir F3 sin reabrir pago/comprobante.

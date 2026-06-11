# MASTER — Flujo Operacional Perfecto (documento maestro final)

**Fecha:** 2026-06-11
**Autor:** revisión de arquitectura (Favle/Claude) sobre `docs/features/PLAN_FLUJO_OPERACIONAL_PERFECTO.md` (Codex)
**Estado:** aprobado para implementación por features. Este documento es la fuente de verdad del endurecimiento operacional; el plan de Codex queda como insumo histórico.
**Regla de lectura:** todo lo afirmado aquí fue verificado contra el código real (se citan archivos y líneas). Nada está supuesto.

---

## 0. Veredicto definitivo

**GO para Feature 1 (gate de counter).** El orden propuesto por Codex es correcto y se confirma:
gate primero, pago después, cierre después, escenarios al final. Sin el gate, cualquier pasarela o UI
se apoya en un flujo que permite saltarse el paso más sensible.

El plan de Codex es **sólido en el diagnóstico** (verifiqué todos sus hallazgos: son ciertos) pero
requiere **7 correcciones quirúrgicas** antes de implementar:

| # | Corrección | Por qué |
|---|---|---|
| C1 | `EstadoAbordaje` se reduce de 5 valores a **3** (`no_requerido`, `pendiente_validacion`, `autorizado`) | `qr_validado` y `abordaje_autorizado` siempre se setean juntos en el mismo consume (no existe paso intermedio real); `abordado` duplicaría `viajes.pasajero_a_bordo` creando dos fuentes de verdad para "pasajero a bordo". Menos estados = menos invariantes que mantener. |
| C2 | Un solo timestamp: `counter_validado_en` (se elimina `abordaje_autorizado_en`) | En la demo validar = autorizar (misma transacción). Dos timestamps idénticos son ruido de esquema. |
| C3 | El gate debe ser **independiente del orden** counter↔asignación | El counter puede validar a un pasajero cuya reserva aún no tiene conductor (vuelo adelantado). `estado_abordaje=autorizado` persiste en la reserva; cuando despacho asigne, la asignación nace habilitada. Codex lo tocó en su Feature 5 pero no lo metió en el contrato del gate. |
| C4 | Eliminar la mutación `confirmada → asignada` que hoy hace el verify ([verify/route.ts:131-136](../../apps/web/src/app/api/voucher/[id]/verify/route.ts)) | "Asignada" es dominio del despacho (implica conductor); el counter no asigna. Con `estado_abordaje` esa mutación pierde su única razón de existir y contamina dominios. |
| C5 | `EstadoPago` se reduce a **6** valores (fuera `exonerado_credito`) | "Exonerado por crédito" no es un estado, es un **proveedor** (`credito_hotel_demo`). Estado y método no se mezclan: voucher_hotel autoriza → `autorizado` con proveedor crédito; al finalizar → `por_liquidar`. |
| C6 | La cotización persistida es la **única fuente del monto** en todo el sistema | Codex no detectó que la app del conductor calcula su propia tarifa local (`cobroEstimado()` en [asignacion/[id].tsx:120-133](../../apps/driver/app/(auth)/asignacion/[id].tsx)) y el comprobante usa `monto: 75` fijo ([comprobante/route.ts:87](../../apps/web/src/app/api/pasajero/[token]/comprobante/route.ts)). Tras Feature 2: driver, pasajero, counter, admin y comprobante leen el MISMO monto persistido. |
| C7 | Los e2e nuevos deben ser **auto-contenidos** (crean su propia reserva vía wa-sim; jamás consumen `TG-2026-0001`) | La suite actual ya corre "en dos fases" porque `counter-qr` consume el voucher que `voucher-flow` asume virgen. No agravar esa deuda. |

Hallazgos adicionales no presentes en el plan de Codex:

- **El escenario B no existe como dato canónico**: `seed.ts` crea **una sola reserva** (la protagonista,
  `recojo_aeropuerto`, [seed.ts:176-240](../../packages/database/prisma/seed.ts)). Las reservas de
  traslado que se ven en el historial fueron creadas a mano vía wa-sim. Feature 4 debe sembrar B.
- **El backfill de migración importa**: `seed-guion` deja la protagonista `en_curso/en_camino`
  ([seed-guion.ts:66,87](../../packages/database/prisma/seed-guion.ts)). Si la migración deja esa fila
  `pendiente_validacion`, el guion demo actual rompe (el conductor quedaría bloqueado a mitad de viaje).
  Regla de backfill: viaje ya iniciado ⇒ `autorizado`.
- **El modo copiloto de F5 asigna automáticamente** (`asignarConductorAutomatico` en
  [wa-sim/actions.ts](../../apps/web/src/app/wa-sim/actions.ts)): con el gate, esa asignación nace
  bloqueada **sin tocar el copiloto**, porque el gate vive server-side en la transición del conductor.

---

## 1. Auditoría confirmada (qué es verdad hoy)

Cada afirmación citada fue verificada en código el 2026-06-11:

| Afirmación | Veredicto | Evidencia |
|---|---|---|
| El conductor puede pasar `asignado → en_camino` sin counter | **CIERTO** | [estado/route.ts:90-97](../../apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts) solo llama `validarTransicionViaje(actual, nuevo)` que valida secuencia ([conductor-asignacion.ts:13-25](../../apps/web/src/lib/conductor-asignacion.ts)). Ni counter ni pago se consultan. |
| La validación del counter vive en auditoría, no en estado | **CIERTO** | El one-time se decide con `auditoria.findFirst({action:'voucher_qr_consumido'})` + advisory lock ([verify/route.ts:51-108](../../apps/web/src/app/api/voucher/[id]/verify/route.ts)). Ningún campo de `reservas` registra la validación (salvo el efecto colateral `confirmada→asignada`). |
| No existe `pagos`, `estado_pago` ni cotización persistente | **CIERTO** | `schema.prisma` tiene 10 tablas; `reservas` no tiene campos de monto. Montos existentes: `comprobantes.monto=75` fijo, `cobroEstimado()` local del driver. |
| La asignación dispara broadcast+push al conductor sin noción de bloqueo | **CIERTO** | `asignarReserva()` emite `broadcastReservaAsignacion` + `broadcastConductorAsignacion` + `sendConductorAssignmentPush` ([admin actions.ts:168-188](../../apps/web/src/app/admin/reservas/[id]/actions.ts)). |
| Broadcasts existentes: `asignacion`, `estado`, `incidencia` ×2 | **CIERTO** | [supabase/server.ts:29-107](../../apps/web/src/lib/supabase/server.ts): `broadcastReservaAsignacion`, `broadcastConductorAsignacion`, `broadcastReservaEstado`, `broadcastReservaIncidencia`, `broadcastConductorIncidencia`. No hay evento de abordaje/pago. |
| El comprobante es pieza suelta con monto fijo | **CIERTO** | `disponible = por_liquidar || finalizado` ([pasajero.ts:254-257,455](../../apps/web/src/lib/pasajero.ts)); `monto: 75` hardcodeado; el PDF marca `emitido` al renderizar ([comprobantes/[id]/pdf/route.ts:57](../../apps/web/src/app/api/comprobantes/[id]/pdf/route.ts)). |
| `detectarTipoPago` clasifica pero no ejecuta nada | **CIERTO** | [pagos-keywords.ts](../../packages/ingesta/src/diccionarios/pagos-keywords.ts) llena `tipo_pago` y ahí muere. |
| La ingesta distingue recojo vs traslado | **CIERTO con sesgo** | [extractor.ts:109-117](../../packages/ingesta/src/extractor.ts): detecta `traslado_aeropuerto` ("llevar/hacia aeropuerto") pero el **default es `recojo_aeropuerto`** — aceptable en demo, documentar. |
| `wa-sim` crea en `necesita_revision` con QR demo placeholder | **CIERTO** | [wa-sim/actions.ts](../../apps/web/src/app/wa-sim/actions.ts): `estado: necesita_revision`, `voucher_qr_payload: wa-sim:<código>:<nonce>` (el payload real lo escribe el primer GET del QR). |
| `seed-guion` arranca post-counter | **CIERTO** | Deja `en_curso`/`en_camino` — útil para demo visual, inútil para probar el gate. |
| Counter UI es máquina de estados `idle→validating→ready→consuming→consumed` | **CIERTO** | [voucher-validator.tsx:70,127-140](../../apps/web/src/app/counter/voucher-validator.tsx). Encaja perfecto para insertar el paso "luz verde". |

---

## 2. Principios de diseño (no negociables)

1. **El estado operacional vive en `reservas`; la auditoría es trazabilidad.** El mecanismo de
   one-time del voucher (audit + advisory lock) NO se reescribe — está probado y tiene e2e; solo se
   le AÑADE la persistencia de estado en la misma transacción.
2. **Todo gate se aplica server-side** (en la transacción de transición) **y se refleja client-side**
   (CTA deshabilitado con motivo humano). La UI nunca es la única defensa.
3. **Independencia de orden**: counter↔asignación pueden ocurrir en cualquier orden; el resultado
   final es el mismo.
4. **Determinista primero**: cotización y pago demo son funciones puras + persistencia; ningún LLM.
5. **Demo ≠ MVP**: pasarela animada simulada, sin Culqi/Niubiz/SUNAT. Pero el modelo (`pagos`,
   `estado_pago`) es el que el MVP reutilizará (regla de oro 6: nada desechable).
6. **Microcopy sin jerga** (continuidad F1-F12): "pase de abordaje", "luz verde", "pago cubierto por
   el hotel" — nunca "HMAC", "consumir", "idempotente". El término "voucher" visible queda reservado
   a `voucher_hotel` (método de pago).

---

## 3. Flujo perfecto final

### 3.1 Escenario A — Llegada: aeropuerto → ciudad (`recojo_aeropuerto`)

```
ACTOR        PASO                                            ESTADOS RESULTANTES
─────────────────────────────────────────────────────────────────────────────────────────
Hotel     1. Escribe por WhatsApp                            —
Copiloto  2. Extrae datos / pide faltantes en el chat        —
Sistema   3. Calcula COTIZACIÓN demo (persistida)            reservas.cotizacion_monto
Sistema   4. AUTORIZA pago demo según tipo_pago              pagos.estado=autorizado|por_cobrar
Operador/ 5. Confirma (o el cliente confirma en modo         reservas.estado=necesita_revision→
Cliente      copiloto) → reserva creada + QR en el chat        (vía admin) confirmada
                                                             reservas.estado_abordaje=pendiente_validacion
Despacho  6. Asigna conductor + unidad (manual o copiloto)   reservas.estado=asignada · viajes.estado=asignado
Conductor 7. Recibe asignación BLOQUEADA                     app: "Esperando validación del counter"
                                                             CTA "Iniciar ruta" deshabilitado
Pasajero  8. Aterriza, va al counter (Salida 3, columna F2)  —
Counter   9. Escanea el pase QR → ve pago + conductor        —
Counter  10. Confirma acceso (consume one-time)              estado_abordaje=autorizado
                                                             counter_validado_en=now · counter_usuario_id
                                                             auditoría abordaje_autorizado
                                                             broadcast `abordaje` → reserva + conductor
Conductor 11. LUZ VERDE: CTA habilitado sin reiniciar        viajes: asignado→en_camino→en_punto→a_bordo
Pasajero  12. Sigue el viaje en vivo (/p/[token])            —
Conductor 13. Finaliza                                       viajes.finalizado · reservas.por_liquidar
Sistema   14. CIERRA pago demo                               pagos: autorizado→capturado | →por_liquidar
Sistema   15. Prepara comprobante (monto = pago real)        comprobantes.pendiente
Pasajero  16. Descarga comprobante / califica                comprobantes.emitido
```

Regla del gate: **`asignado → en_camino` exige `estado_abordaje=autorizado` cuando
`tipo_viaje=recojo_aeropuerto`**. Justificación operacional: en el modelo de counter de aeropuerto
(Lima/LAP), la unidad sale de la bolsa/cola cuando el pasajero se presenta en el módulo — el counter
ES el despacho físico. Bloquear el inicio (y no `en_punto→a_bordo`) hace la luz verde visible y
demo-able. *Nota MVP:* si negocio decide permitir pre-posicionamiento, el gate se mueve a
`en_punto→a_bordo` cambiando UNA condición en el helper `puedeIniciarRuta` — la arquitectura no cambia.

### 3.2 Escenario B — Hotel/punto externo → aeropuerto (`traslado_aeropuerto`)

```
1. Hotel/empresa solicita traslado al aeropuerto (vuelo de salida).
2. Copiloto extrae: origen externo, destino aeropuerto, hora, vuelo, pasajero.
3. Cotización demo + autorización de pago (voucher_hotel | factura_empresa | app_pago).
4. Reserva confirmada → estado_abordaje=no_requerido. El chat entrega reserva + enlace en vivo
   directamente (no hay counter en el origen: el pase QR no es requisito de inicio).
5. Despacho asigna → el conductor puede iniciar DE INMEDIATO ("Listo para ir al punto de recojo").
6. asignado→en_camino→en_punto→a_bordo→finalizado (sin gate).
7. Cierre de pago + comprobante idéntico a A (pasos 13-16).
```

Diferencias de contrato A vs B:

| Aspecto | A (`recojo_aeropuerto`) | B (`traslado_aeropuerto`) | `city` |
|---|---|---|---|
| `estado_abordaje` inicial | `pendiente_validacion` | `no_requerido` | `no_requerido` |
| Counter | obligatorio antes de iniciar | no participa | no participa |
| QR en el chat | "pase de abordaje" (counter) | no se envía como requisito; el chat entrega reserva + enlace | ídem B |
| Enlace en vivo | tras validación del counter (flujo F5 actual) | inmediato al confirmar | inmediato |
| Banner conductor | "Esperando validación del counter" → "Luz verde" | "Listo para ir al punto de recojo" | ídem B |

> Nota F5: el "revelado progresivo" del enlace (F5) queda condicionado a `requiereCounter`: en B el
> polling no aplica y el enlace va en la tarjeta de confirmación. Esto se implementa en Feature 4.

---

## 4. Modelo de datos final

### 4.1 Cambios a `schema.prisma`

```prisma
enum EstadoAbordaje {
  no_requerido          // traslado_aeropuerto, city
  pendiente_validacion  // recojo_aeropuerto esperando counter
  autorizado            // counter validó el pase (luz verde)
}

enum EstadoPago {
  pendiente    // creado, sin autorizar (no debería verse en demo feliz)
  autorizado   // app_pago autorizado | crédito hotel/empresa cubierto
  por_cobrar   // efectivo: se cobra en la unidad
  capturado    // app_pago/efectivo cobrado al finalizar
  por_liquidar // crédito hotel/empresa: pasa a liquidación
  rechazado    // rama de error demo (opcional en UI)
}

model reservas {
  // ... campos existentes intactos ...
  estado_abordaje         EstadoAbordaje @default(no_requerido)
  counter_validado_en     DateTime?
  counter_usuario_id      String?        // usuarios.id del supervisor; sin FK (cirugía mínima demo)
  cotizacion_monto        Decimal?       @db.Decimal(10, 2)
  cotizacion_moneda       String?        @default("PEN")
  cotizacion_fuente       String?        // 'tarifario_demo' | 'distancia_demo'
  cotizacion_calculada_en DateTime?

  pagos pagos[]
}

model pagos {
  id             String     @id @default(uuid())
  tenant_id      String
  tenant         tenants    @relation(fields: [tenant_id], references: [id])
  reserva_id     String     @unique // demo: un pago por reserva (upsert simple)
  reserva        reservas   @relation(fields: [reserva_id], references: [id])
  tipo_pago      TipoPago
  estado         EstadoPago
  monto          Decimal    @db.Decimal(10, 2)
  moneda         String     @default("PEN")
  proveedor_demo String?    // 'pasarela_demo' | 'credito_hotel_demo' | 'credito_empresa_demo' | 'efectivo_en_unidad'
  autorizacion   String?    // código demo tipo 'AUT-XXXXXX'
  autorizado_en  DateTime?
  capturado_en   DateTime?
  created_at     DateTime   @default(now())
  updated_at     DateTime   @updatedAt

  @@index([tenant_id])
}
```

**Justificación de la tabla 11 (`pagos`):** la regla "10 tablas" era el presupuesto de la demo S0-S9,
ya cerrada y verificada. Este plan es endurecimiento post-S9. La alternativa sin tabla (campos
`estado_pago/monto` en `reservas` o JSON en `raw_ingesta`) se descarta: (a) el pago tiene ciclo de
vida propio (autorizar/capturar con timestamps); (b) `comprobantes` ya es entidad separada y el pago
es su antecedente natural; (c) el MVP necesitará `pagos` sí o sí — crearla ahora respeta la regla de
oro 6 (nada desechable). El costo (1 migración + 1 modelo) es menor que el costo de desenredar JSON.

**Backfill de la migración (crítico para no romper la demo):**

```sql
-- recojo con viaje ya iniciado o terminado => autorizado (no bloquear guiones en curso)
UPDATE reservas r SET estado_abordaje='autorizado', counter_validado_en=now()
WHERE r.tipo_viaje='recojo_aeropuerto' AND EXISTS (
  SELECT 1 FROM viajes v WHERE v.reserva_id=r.id AND v.deleted_at IS NULL
    AND v.estado IN ('en_camino','en_punto','a_bordo','finalizado'));
-- resto de recojos => pendiente
UPDATE reservas SET estado_abordaje='pendiente_validacion'
WHERE tipo_viaje='recojo_aeropuerto' AND estado_abordaje='no_requerido';
```

### 4.2 Seeds

- `seed.ts` (base): protagonista queda `asignada/asignado` + `estado_abordaje=pendiente_validacion`
  (A bloqueada, lista para demostrar el gate). Añade en Feature 4 la reserva B canónica
  (`traslado_aeropuerto`, San Isidro → aeropuerto, `factura_empresa`, `no_requerido`).
- `seed-guion.ts` (demo visual en curso): al poner `en_camino`, setea también
  `estado_abordaje=autorizado` + `counter_validado_en` sintético (coherencia: si va en camino, el
  counter ya pasó).
- **Nuevo** `db:seed-operacional` (script en `packages/database/package.json`): deja A en
  `asignada/asignado/pendiente_validacion` y B en `asignada/asignado/no_requerido` con pagos
  autorizados — el punto de partida para demos del gate y para los e2e.

---

## 5. Contratos finales

### 5.1 Helpers de dominio (nuevos, en `apps/web/src/lib/conductor-asignacion.ts`)

```ts
export function requiereCounter(tipoViaje: TipoViaje): boolean {
  return tipoViaje === TipoViaje.recojo_aeropuerto;
}

// Único punto de verdad del gate. Si negocio mueve el gate a a_bordo en MVP,
// solo cambia esta función (y sus tests).
export function puedeIniciarRuta(args: {
  tipoViaje: TipoViaje;
  estadoAbordaje: EstadoAbordaje;
}): { ok: true } | { ok: false; motivo: 'counter_pendiente' } {
  if (!requiereCounter(args.tipoViaje)) return { ok: true };
  if (args.estadoAbordaje === EstadoAbordaje.autorizado) return { ok: true };
  return { ok: false, motivo: 'counter_pendiente' };
}
```

### 5.2 API — transición del conductor (`POST /api/conductor/asignacion/[id]/estado`)

- El `select` de la transacción añade `tipo_viaje` y `estado_abordaje`.
- Tras validar secuencia y **solo si `estado_nuevo === 'en_camino'`**, evalúa `puedeIniciarRuta`.
- Nueva rama de respuesta:

```jsonc
// 409 — gate cerrado
{ "error": "counter_pendiente", "estado_abordaje": "pendiente_validacion" }
```

- En `finalizado` (Feature 3): dentro de la MISMA transacción, cierra pago
  (`cerrarPagoDemo`) y prepara comprobante (ver 5.6).

### 5.3 API — verify del counter (`POST /api/voucher/[id]/verify`)

Cambios al branch `consume:true` (dentro de la transacción existente, tras crear el audit row):

1. `UPDATE reservas SET estado_abordaje='autorizado', counter_validado_en=now, counter_usuario_id=<session.user.id>`.
2. **Se elimina** la mutación `confirmada → asignada` (C4). Verificar que ningún test dependa de
   ella (`counter-qr.spec.ts` no la asserta; el detalle admin tampoco).
3. Auditar `abordaje_autorizado` (además del existente `voucher_qr_consumido`).
4. Post-tx: `broadcastReservaAbordaje({reservaId})` y, si `reserva.conductor_id`,
   `broadcastConductorAbordaje({conductorId, reservaId})`.
5. La respuesta (`consume:true` y también `consume:false`) amplía `reserva` con:

```jsonc
{
  "ok": true, "consumed": true, "consumedAt": "...",
  "reserva": {
    /* campos actuales ... */
    "estado_abordaje": "autorizado",
    "conductor": { "nombre": "Raúl Quispe", "placa": "ABC-123" } | null,
    "pago": { "metodo": "voucher_hotel", "estado": "autorizado", "monto": "75.00", "etiqueta": "Cargo al hotel autorizado" } | null
  }
}
```

(`pago` llega con Feature 2; hasta entonces `null` — el contrato nace estable.)

### 5.4 Realtime — evento nuevo `abordaje`

En `apps/web/src/lib/supabase/server.ts`, siguiendo el patrón existente:

```ts
broadcastReservaAbordaje({ reservaId })            // canal `reserva-{id}`,   evento 'abordaje'
broadcastConductorAbordaje({ conductorId, reservaId }) // canal `conductor-{id}`, evento 'abordaje'
// payload: { reserva_id, estado_abordaje: 'autorizado', counter_validado_en }
```

Driver (`apps/driver/src/features/realtime/index.tsx`): el canal `conductor-{id}` ya escucha
`asignacion` e `incidencia`; se añade `.on('broadcast', {event:'abordaje'}, ...)` → expone
`lastAbordaje` → `home` y `asignacion/[id]` refrescan (mismo patrón refetch-on-broadcast de F11).
Pasajero (`seguimiento-cliente.tsx`): opcionalmente escucha `abordaje` en `reserva-{id}` para
mostrar "Pase validado" (nice-to-have de Feature 4).

### 5.5 Contrato móvil (driver)

`ConductorAsignacionResponse` / `DriverAssignment` añade:

```ts
abordaje: {
  requiereCounter: boolean;        // requiereCounter(tipo_viaje)
  autorizado: boolean;             // estado_abordaje === 'autorizado' || !requiereCounter
  counterValidadoEn: string | null;
};
cobro: {                           // Feature 2; antes: null
  monto: string | null;            // "75.00" (Decimal serializado)
  moneda: string;                  // "PEN"
  metodo: TipoPago;
  estadoPago: string | null;       // EstadoPago
  etiqueta: string;                // "Cargo al hotel autorizado" (humano, sin jerga)
} | null;
```

`transitions.ts` cambia de firma:

```ts
getNextTripAction(estado, abordaje): NextTripAction | { bloqueada: true; label: 'Esperando counter'; helper: string } | null
```

UI (`asignacion/[id].tsx` + `home.tsx`):

- A bloqueado: banner "Tu pasajero está por llegar — esperando validación del counter", CTA
  deshabilitado con esa etiqueta. Al llegar el broadcast `abordaje` → refetch → CTA "Iniciar ruta"
  habilitado **sin reiniciar la app** (DoD).
- B: sin cambios visibles ("Empezar"/"Iniciar ruta" desde el primer momento).
- La ficha de cobro del conductor pasa a mostrar `cobro.monto` persistido; `cobroEstimado()` local
  queda solo como fallback si `cobro` es null (C6).

### 5.6 Pago demo y cotización (`packages/pagos`, Feature 2)

Paquete nuevo `packages/pagos` (dominio compartido web/admin/pasajero/driver — se confirma la
recomendación de Codex frente a un `lib/` local):

```ts
// determinista, sin red:
calcularCotizacionDemo(input: { tipoViaje; origen?: {lat,lng}; destino?: {lat,lng} }):
  { monto: Decimal; moneda: 'PEN'; fuente: 'distancia_demo' | 'tarifario_demo' }
// con coords: misma fórmula del driver hoy => base 7.50 + 3.20/km * 1.3, redondeo a 0.50, mínimo 15
// sin coords: tarifario plano aeropuerto = 75.00 (compat con el monto histórico del comprobante)

autorizarPagoDemo({ reservaId, tipoPago, monto }): pagos  // upsert por reserva_id
//  app_pago        -> estado=autorizado,  proveedor='pasarela_demo',        autorizacion='AUT-XXXXXX'
//  voucher_hotel   -> estado=autorizado,  proveedor='credito_hotel_demo'
//  factura_empresa -> estado=autorizado,  proveedor='credito_empresa_demo'
//  efectivo        -> estado=por_cobrar,  proveedor='efectivo_en_unidad'

cerrarPagoDemo({ reservaId }): pagos // llamado al finalizar el viaje (Feature 3)
//  app_pago        -> capturado (capturado_en=now)
//  efectivo        -> capturado (cobro manual demo)
//  voucher_hotel   -> por_liquidar
//  factura_empresa -> por_liquidar

estadoPagoHumano(pago): string // "Pago con tarjeta autorizado", "Cargo al hotel autorizado",
                               // "Se paga en efectivo en la unidad", "Pago cobrado", "Por liquidar con el hotel"
```

Puntos de integración:

- `crearReservaDesdeIngesta` (wa-sim): tras crear la reserva → `calcularCotizacionDemo` (persistir en
  `reservas`) → `autorizarPagoDemo` → auditar `pago_demo_autorizado`. La tarjeta del chat muestra
  monto + método ("S/ 75.00 · Cargo al hotel"). En modo copiloto, el resumen al cliente incluye la
  tarifa ANTES del "¿Confirmas?".
- Endpoints REST (`/api/pagos/demo/autorizar`, `/api/pagos/demo/capturar`) **no se crean**: la demo
  no tiene consumidor externo de pagos; server actions + paquete bastan. (Corrección al plan de
  Codex: menos superficie = menos mantenimiento. Si el MVP los necesita, el paquete ya los provee.)
- wa-sim UI: secuencia animada determinista (setTimeout) "Calculando tarifa → Validando método →
  Autorizado ✓" antes de mostrar la tarjeta de confirmación.

### 5.7 Contrato pasajero (`PassengerTripData`)

```ts
pago: {
  metodo: TipoPago; estado: string | null;
  monto: string | null; moneda: string;
  etiqueta: string; // humano
} | null;
// comprobante.etiqueta pasa a usar pago.monto ?? cotizacion_monto ?? 75 (compat)
```

### 5.8 Contrato admin

`getReservaDetalle` añade `abordaje` (estado + counter_validado_en + "Requiere counter sí/no") y
`pago` (método/estado/monto). El detalle muestra dos bloques nuevos: **Abordaje** y **Pago** —
lenguaje humano, criterios técnicos colapsados como ya hace la sugerencia (F6).

### 5.9 Contrato counter

La UI ([voucher-validator.tsx](../../apps/web/src/app/counter/voucher-validator.tsx)) conserva su
máquina `idle→validating→ready→consuming→consumed` y enriquece:

- `ready` (QR válido, sin consumir): muestra pasajero + punto + destino + **pago** (etiqueta humana)
  + **conductor/unidad** (o "Falta asignar conductor" + link "Abrir despacho"). CTA: con conductor →
  "Confirmar acceso y dar luz verde"; sin conductor → "Confirmar acceso" (la luz verde llegará sola
  al asignar, por independencia de orden).
- `consumed`: "Acceso confirmado · Luz verde enviada al conductor" (o "El conductor la recibirá al
  ser asignado"). Mantiene "Este pase ya no puede usarse otra vez".

---

## 6. Secuencia de features

> Las antiguas Features 5/6/7 de Codex se absorben: la 5 (counter operacional) se reparte entre
> Feature 1 (luz verde mínima) y Feature 4 (pulido); la 6 (copy) se aplica feature a feature sobre
> las superficies que cada una toca; la 7 (QA/docs) es el protocolo de cierre de TODAS (sección 9).

| # | Feature | Prioridad | Depende de | Prompt |
|---|---|---|---|---|
| 1 | Gate de counter + estado de abordaje | P0 | — | [PROMPT_FEATURE_1_COUNTER_GATE_CODEX.md](PROMPT_FEATURE_1_COUNTER_GATE_CODEX.md) |
| 2 | Cotización + pago demo | P0 | F1 (campos/contratos nacen estables) | [PROMPT_FEATURE_2_PAGO_DEMO_CODEX.md](PROMPT_FEATURE_2_PAGO_DEMO_CODEX.md) |
| 3 | Cierre de viaje → pago → comprobante | P1 | F2 | [PROMPT_FEATURE_3_CIERRE_PAGO_COMPROBANTE_CODEX.md](PROMPT_FEATURE_3_CIERRE_PAGO_COMPROBANTE_CODEX.md) |
| 4 | Escenarios A/B end-to-end + pulido counter/copy | P1 | F1 (gate por tipo_viaje ya existe) | [PROMPT_FEATURE_4_ESCENARIOS_CODEX.md](PROMPT_FEATURE_4_ESCENARIOS_CODEX.md) |

Resumen de alcance por feature (detalle completo en cada prompt):

### Feature 1 — Gate de counter (P0)
- Migración: `EstadoAbordaje` + 3 campos en `reservas` + backfill (§4.1).
- Helpers `requiereCounter` / `puedeIniciarRuta` + unit tests.
- Gate en `estado/route.ts` (409 `counter_pendiente`).
- Verify: persistir abordaje, quitar `confirmada→asignada`, broadcasts `abordaje`, response ampliada.
- Serializer conductor + app driver: campo `abordaje`, CTA bloqueado, refetch por broadcast.
- Counter UI mínima: "Luz verde enviada al conductor" / "Falta asignar conductor".
- Seeds: base bloqueada + `seed-guion` autorizado + `db:seed-operacional`.
- **DoD:** conductor NO puede iniciar recojo sin counter (server-side 409 + UI bloqueada); tras
  validar, se habilita sin reiniciar; `traslado_aeropuerto` jamás se bloquea.

### Feature 2 — Cotización + pago demo (P0/P1)
- Migración: `EstadoPago` + tabla `pagos` + campos cotización en `reservas`.
- `packages/pagos` (§5.6) + unit tests.
- wa-sim: cotizar + autorizar al crear; tarjeta del chat y resumen del copiloto muestran tarifa y
  método; animación de autorización.
- Superficies: admin (bloque Pago), counter (pago en `ready`), pasajero (bloque Pago), driver
  (`cobro` persistido en la ficha).
- **DoD:** mismo monto y estado en wa-sim/admin/counter/pasajero/driver; pago persistido ANTES de
  entregar el pase QR.

### Feature 3 — Cierre conectado (P1)
- Al `finalizado`: `cerrarPagoDemo` + preparar comprobante (`pendiente`, monto = pago) en la misma
  transacción del estado; auditar `pago_demo_cerrado` + `comprobante_preparado`.
- Pasajero: CTA pasa de "Preparar comprobante" a "Descargar comprobante" cuando ya existe; el monto
  fijo 75 desaparece (fallback solo si no hay pago).
- Tipos: `factura_empresa→factura`, resto→`boleta` (el pasajero puede pedir otro tipo, flujo actual
  se conserva).
- **DoD:** finalizar dispara estado financiero visible; no existe "capturado" sin fila en `pagos`.

### Feature 4 — Escenarios A/B (P1)
- Seeds: conversación wa-sim B + reserva B canónica en `seed.ts` y `seed-operacional`.
- Ingesta: tests explícitos recojo vs traslado (el default `recojo` se documenta).
- F5 condicionado por `requiereCounter`: en B el enlace en vivo va directo en la tarjeta (sin polling).
- Driver: banner B "Listo para ir al punto de recojo"; admin: "Requiere counter sí/no"; pasajero:
  "Pase validado" en vivo (opcional).
- Copy sweep final: ninguna superficie llama "voucher" al QR (solo a `voucher_hotel`).
- **DoD:** demo A y demo B ejecutables de punta a punta con `db:seed-operacional`, sin contaminarse.

---

## 7. Verificación global (toda feature cierra con esto)

```bash
pnpm turbo run typecheck lint test build
pnpm exec playwright test --config tests/e2e/playwright.config.ts --workers=1   # fase 1
pnpm --filter @taxigreen/database db:seed-guion                                  # re-seed
pnpm exec playwright test tests/e2e/voucher-flow.spec.ts --config tests/e2e/playwright.config.ts  # fase 2
pnpm --filter @taxigreen/driver exec expo export --platform android
```

Reglas para e2e nuevos (C7): crean su propia reserva vía wa-sim (patrón de `wa-sim.spec.ts` actual),
asignan conductor explícito conocido (conductor1/Raúl Quispe vía UI de despacho, patrón de
`admin-asignacion.spec.ts`) y NUNCA consumen `TG-2026-0001`. Tras el deploy correspondiente, smoke en
Railway (`railway up` manual; el endpoint nuevo debe dejar de responder 404/comportamiento viejo).

---

## 8. Riesgos y decisiones cerradas

| # | Riesgo/decisión | Resolución |
|---|---|---|
| R1 | +1 tabla (`pagos`) vs presupuesto 10 tablas | Aceptado (post-S9, reutilizable en MVP). §4.1. |
| R2 | Dónde bloquear | `asignado→en_camino` (modelo counter aeroportuario; pedido explícito de negocio). Encapsulado en `puedeIniciarRuta` para poder moverse en MVP. §3.1. |
| R3 | Auditoría como estado | Prohibido en adelante; el one-time existente se conserva pero el estado se persiste en `reservas`. §2.1. |
| R4 | Renombrar `voucher_codigo` | NO migrar DB. UI ya dice "Reserva" (F12); el QR se llama "pase de abordaje" (F5). Alias técnico opcional para MVP. |
| R5 | `seed-guion` arranca en `en_camino` | Se conserva (demo visual) + `estado_abordaje=autorizado` sintético. Nuevo `db:seed-operacional` para el gate. §4.2. |
| R6 | Migraciones sobre Supabase con datos | Backfill obligatorio en la misma migración (§4.1); `prisma migrate deploy` verificado en local y Railway antes de cerrar la feature. |
| R7 | Push de asignación dice "Nueva asignación" aunque esté bloqueada | Aceptable: el contrato GET trae `abordaje` y la app muestra el estado correcto al abrir. Opcional añadir "(esperando counter)" al body del push en F4. |
| R8 | Modo copiloto auto-asigna antes del counter | Correcto por diseño: la asignación nace bloqueada server-side; no se toca el copiloto. |

---

## 9. Protocolo de cierre por feature (obligatorio)

Cada feature entrega, además del código:

1. `docs/features/ESTADO_FEATURE_<n>.md` con esta plantilla:

```md
# Estado Feature <n> — <nombre>

## Implementado
- (bullets de lo realmente hecho)

## Cambios por archivo
- ruta → qué cambió y por qué

## Verificación
- comando → resultado literal (conteos de tests, EXIT codes)
- smoke manual → pasos y evidencia (capturas si hay UI)

## Bugs encontrados en el camino
- (y si se corrigieron aquí o se difirieron)

## Riesgos / deuda nueva
- (registrar también en docs/DEUDA_TECNICA.md si es real)

## Próximo prompt
- docs/features/PROMPT_FEATURE_<n+1>_*.md (ajustado con lo aprendido)
```

2. Actualización de `docs/DOCUMENTACION_TECNICA.md` si cambió un contrato, y de
   `docs/GUIA_PRUEBAS_DEMO.md` si cambió el flujo manual de demo.
3. El prompt de la siguiente feature **se revisa** contra lo realmente implementado antes de usarlo
   (los prompts de este directorio son el punto de partida, no un contrato ciego).

---

## 10. Veredicto

**GO para Feature 1 — Gate de counter.** Ninguna dependencia debe ir antes: el gate solo necesita
`tipo_viaje` (existe) y los campos nuevos de abordaje (su propia migración). El pago (Feature 2) gana
sentido narrativo solo cuando el pase ya es un permiso real.

Orden final: **F1 → F2 → F3 → F4**, con el protocolo §9 en cada cierre.

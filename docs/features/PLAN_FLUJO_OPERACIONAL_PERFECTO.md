# Plan de Flujo Operacional Perfecto — Taxi Green

**Fecha:** 2026-06-11  
**Estado:** propuesta de endurecimiento post-S9/F5/F12. No implementa código.  
**Objetivo:** convertir las piezas actuales de la demo en una secuencia operacional obligatoria de punta a punta:
WhatsApp -> cotizacion/pago demo -> pase de abordaje -> counter -> luz verde conductor -> viaje -> cierre de pago ->
comprobante -> liquidacion/soporte.

---

## 0. Veredicto Ejecutivo

La sospecha del usuario es correcta. El producto actual tiene buenas piezas funcionales, pero todavia no garantiza la
secuencia operacional completa.

Hoy existe:

- WhatsApp Sim con extraccion, confirmacion en chat, QR real y revelado progresivo del link pasajero tras auditoria de counter.
- Reserva con `tipo_pago`.
- QR HMAC firmado y verificacion one-time.
- Counter web que valida y consume el QR.
- Admin que asigna conductor/unidad.
- App conductor con estados secuenciales.
- Link pasajero con tracking, comprobante y calificacion.
- Comprobante PDF SUNAT-like.

Lo que falta para que sea creible de punta a punta:

- El counter no bloquea realmente al conductor. La validacion vive en auditoria, no en estado de negocio.
- El conductor puede pasar `asignado -> en_camino` apenas el admin asigna, incluso si el QR nunca fue validado.
- No existe `estado_pago`, `pagos`, autorizacion/captura demo, ni pasarela animada.
- No existe cotizacion persistente. Hay montos sueltos: `comprobantes.monto=75`, `cobroEstimado()` en driver y copy visual.
- El comprobante no esta conectado al cierre financiero; puede prepararse/generarse como pieza separada.
- `voucher_codigo` se usa como codigo operativo, mientras `TipoPago.voucher_hotel` usa la misma palabra "voucher"; esto confunde la narrativa.
- `recojo_aeropuerto` y `traslado_aeropuerto` estan modelados, pero la experiencia demo no los separa con reglas operativas claras.

La correccion recomendada es quirurgica: agregar estado persistente de abordaje, pago demo, cotizacion, gates de transicion y copy/UX que respete escenarios.

---

## 1. Alcance y No Alcance

### Alcance de este plan

- Definir el flujo perfecto.
- Identificar los huecos reales del codigo actual.
- Proponer features/PRs secuenciales, pequenas y verificables.
- Enumerar archivos inspeccionados e involucrados.
- Definir pruebas obligatorias por feature.
- Preparar el prompt para que Claude/Favle revise y pula esta propuesta.

### No alcance

- No integrar Culqi, Niubiz, SUNAT real, WABA real ni Redis.
- No cambiar la heuristica de asignacion de S5.
- No reescribir la app conductor ni el admin.
- No mover la arquitectura fuera del monorepo.
- No reemplazar `voucher_codigo` en DB de golpe. Se puede renombrar en UI primero y migrar tecnicamente despues.

---

## 2. Auditoria del Estado Real

### 2.1 Base de datos actual

Archivo revisado:

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260531000000_sprint1_initial/migration.sql`
- `packages/database/prisma/seed.ts`
- `packages/database/prisma/seed-guion.ts`

Hallazgos:

- Existen enums:
  - `TipoViaje = recojo_aeropuerto | traslado_aeropuerto | city`
  - `TipoPago = efectivo | voucher_hotel | factura_empresa | app_pago`
  - `EstadoReserva = ingesta_pendiente | necesita_revision | confirmada | asignada | en_curso | finalizada | por_liquidar | cancelada`
  - `EstadoViaje = asignado | en_camino | en_punto | a_bordo | finalizado | cancelado`
  - `EstadoComprobante = emitido | anulado | pendiente`
- `reservas` tiene:
  - `tipo_pago`
  - `voucher_codigo`
  - `voucher_qr_payload`
  - `voucher_emitido_en`
  - `token_pasajero`
  - `conductor_id`
  - `raw_ingesta`
  - `sugerencia_copiloto`
  - `calificacion`
- No existe:
  - `pagos`
  - `EstadoPago`
  - `estado_pago`
  - `cotizacion_monto`
  - `counter_validado_en`
  - `counter_usuario_id`
  - `abordaje_autorizado_en`
  - `estado_abordaje`
- El seed protagonista queda como `tipo_pago=voucher_hotel`, `estado=asignada`, y `viaje.estado=asignado`.
- `seed-guion.ts` deja la demo protagonista en `reserva.estado=en_curso` y `viaje.estado=en_camino`; esto es util para demo visual, pero no representa el arranque obligatorio desde counter.

Conclusion:

El modelo actual puede representar la reserva y el viaje, pero no puede representar "pago autorizado" ni "counter valido/luz verde" como verdad persistente.

### 2.2 WhatsApp Sim / F5 actual

Archivos revisados:

- `apps/web/src/app/wa-sim/actions.ts`
- `apps/web/src/app/wa-sim/whatsapp-simulator.tsx`
- `apps/web/src/app/api/ingesta/extraer/route.ts`
- `packages/ingesta/src/types.ts`
- `packages/ingesta/src/extractor.ts`
- `packages/ingesta/src/diccionarios/pagos-keywords.ts`
- `tests/e2e/wa-sim.spec.ts`
- `tests/e2e/asignacion-sugerencia.spec.ts`

Hallazgos:

- `crearReservaDesdeIngesta()` crea la reserva en `EstadoReserva.necesita_revision`.
- Genera `voucher_codigo`, `token_pasajero` y un `voucher_qr_payload` inicial tipo demo.
- La tarjeta del chat muestra "Tu reserva" y "Tu pase de abordaje" con QR servido por `/api/voucher/[id]/qr`.
- El link `/p/[token]` se revela solo despues de detectar en auditoria `voucher_qr_consumido`.
- El "modo copiloto" puede crear y asignar conductor automaticamente tras confirmacion del cliente, usando `aceptarSugerenciaAsignacion()`.
- `detectarTipoPago()` clasifica palabras como voucher, factura, yape, plin, tarjeta, efectivo.
- Esa clasificacion solo llena `tipo_pago`; no ejecuta autorizacion de pago.

Conclusion:

F5 mejoro la experiencia de chat, pero no agrego pasarela demo ni gate persistente. Ademas, el modo copiloto puede asignar conductor y disparar broadcast/push antes de que exista autorizacion operacional de abordaje.

### 2.3 Counter actual

Archivos revisados:

- `apps/web/src/app/counter/page.tsx`
- `apps/web/src/app/counter/voucher-validator.tsx`
- `apps/web/src/app/api/voucher/[id]/qr/route.ts`
- `apps/web/src/app/api/voucher/[id]/verify/route.ts`
- `packages/voucher/src/sign.ts`
- `packages/voucher/src/qr.ts`
- `tests/e2e/counter-qr.spec.ts`
- `tests/e2e/voucher-flow.spec.ts`

Hallazgos:

- `/api/voucher/[id]/qr` genera token HMAC, actualiza `reservas.voucher_qr_payload` y `voucher_emitido_en`, audita `voucher_qr_emitido`.
- `/api/voucher/[id]/verify` valida:
  - HMAC correcto.
  - `reserva_id` coincide.
  - `codigo_publico` coincide.
  - token recibido es igual a `voucher_qr_payload`.
- Con `consume:true` exige rol `supervisor`.
- El consumo one-time se apoya en auditoria `voucher_qr_consumido` + advisory lock.
- Si la reserva estaba `confirmada`, el endpoint la cambia a `asignada`.
- Si la reserva ya estaba `asignada`, consume y audita, pero no cambia ningun campo persistente de autorizacion.
- No emite broadcast especifico de "abordaje autorizado" al conductor.
- El counter UI dice "Acceso confirmado", pero no muestra pago/autorizacion ni conductor asignado como parte del permiso final.

Conclusion:

La seguridad criptografica del QR esta bien. El problema es de dominio: auditoria se esta usando como fuente de estado, y eso no debe ser la verdad operacional.

### 2.4 Admin / despacho actual

Archivos revisados:

- `apps/web/src/app/admin/reservas/[id]/actions.ts`
- `apps/web/src/app/admin/reservas/[id]/page.tsx`
- `apps/web/src/app/admin/reservas/[id]/reserva-detalle.tsx`
- `apps/web/src/app/admin/reservas/[id]/sugerencia-card.tsx`
- `apps/web/src/lib/admin/reservas.ts`
- `apps/web/src/components/admin/admin-reservas-live.tsx`
- `tests/e2e/admin-asignacion.spec.ts`

Hallazgos:

- `asignarReserva()` cambia `reservas.estado` a `asignada`.
- Crea o actualiza `viajes.estado=asignado`.
- Actualiza `conductores.vehiculo_id` si se eligio unidad.
- Audita `reserva_asignada`.
- Emite:
  - `broadcastReservaAsignacion`
  - `broadcastConductorAsignacion`
  - `sendConductorAssignmentPush`
- No diferencia "asignacion informativa/bloqueada" vs "luz verde".
- `getReservaDetalle()` expone `tipoPago`, pero el detalle admin no tiene bloque fuerte de pago/cotizacion.

Conclusion:

La asignacion es funcional, pero hoy es tambien la senal implicita de que el conductor puede empezar. Necesitamos separar "conductor asignado" de "abordaje autorizado".

### 2.5 App conductor actual

Archivos revisados:

- `apps/web/src/app/api/conductor/asignacion/[id]/route.ts`
- `apps/web/src/app/api/conductor/asignacion/activa/route.ts`
- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts`
- `apps/web/src/app/api/conductor/viajes/route.ts`
- `apps/web/src/lib/conductor-asignacion.ts`
- `apps/web/src/lib/conductor-asignacion-repository.ts`
- `apps/driver/src/features/assignment/types.ts`
- `apps/driver/src/features/assignment/client.ts`
- `apps/driver/src/features/assignment/transitions.ts`
- `apps/driver/app/(auth)/home.tsx`
- `apps/driver/app/(auth)/asignacion/[id].tsx`
- `apps/driver/src/features/realtime/*`

Hallazgos:

- La secuencia movil es:
  - `asignado -> en_camino -> en_punto -> a_bordo -> finalizado`
- `validarTransicionViaje()` solo valida el siguiente estado esperado.
- `/api/conductor/asignacion/[id]/estado` no consulta counter ni pago.
- Si el conductor esta asignado y la transicion es secuencial, la acepta.
- La UI muestra CTA:
  - `asignado`: "Iniciar ruta"
  - `en_camino`: "Ya llegue"
  - `en_punto`: "Iniciar viaje"
  - `a_bordo`: "Finalizar"
- El contrato movil no contiene `estadoAbordaje`, `counterValidadoEn`, `pago`, `cotizacion` ni `bloqueo`.

Conclusion:

Este es el bug principal de secuencia: la app permite avanzar con solo tener `viaje.estado=asignado`.

### 2.6 Pasajero / comprobante actual

Archivos revisados:

- `apps/web/src/lib/pasajero.ts`
- `apps/web/src/app/p/[token]/page.tsx`
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`
- `apps/web/src/app/api/pasajero/[token]/route.ts`
- `apps/web/src/app/api/pasajero/[token]/comprobante/route.ts`
- `apps/web/src/app/api/pasajero/[token]/comprobante/pdf/route.ts`
- `apps/web/src/app/api/comprobantes/[id]/pdf/route.ts`
- `apps/web/src/lib/comprobantes.ts`
- `packages/comprobantes/src/*`
- `tests/e2e/passenger-link.spec.ts`

Hallazgos:

- El pasajero ve tracking, conductor, unidad, ruta, comprobante/calificacion.
- `PassengerTripData` no incluye pago ni cotizacion.
- `comprobante.disponible` depende de `reserva.estado=por_liquidar` o `viaje.estado=finalizado`.
- `POST /api/pasajero/[token]/comprobante` crea o reutiliza comprobante con monto fijo `75`.
- `GET /api/comprobantes/[id]/pdf` marca el comprobante como `emitido` al renderizar/subir PDF.
- No hay captura de pago antes del comprobante.

Conclusion:

El comprobante existe, pero esta desconectado de pago/cierre financiero. Para demo premium, debe aparecer como consecuencia de cierre de pago, no como boton aislado.

### 2.7 Realtime / broadcasts actuales

Archivos revisados:

- `apps/web/src/lib/supabase/server.ts`
- `apps/driver/src/features/realtime/client.ts`
- `apps/driver/src/features/realtime/index.tsx`
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`

Hallazgos:

- Existen broadcasts:
  - `reserva-{id}` evento `asignacion`
  - `conductor-{conductorId}` evento `asignacion`
  - `reserva-{id}` evento `estado`
  - `reserva-{id}` evento `incidencia`
  - `conductor-{conductorId}` evento `incidencia`
- No existe evento `abordaje`, `counter_validado` o `pago`.

Conclusion:

Hay infraestructura suficiente para emitir "luz verde"; falta el evento y los campos serializados.

---

## 3. Flujo Perfecto Objetivo

### 3.1 Escenario A — Llegada internacional: aeropuerto -> ciudad

Este es el flujo protagonista actual, endurecido:

1. Hotel/concierge escribe por WhatsApp.
2. Copiloto extrae datos.
3. Operador o modo copiloto valida datos criticos.
4. Sistema calcula cotizacion demo.
5. Sistema detecta modalidad de pago.
6. Sistema simula autorizacion de pago/voucher/credito.
7. Reserva queda confirmada.
8. Se emite pase de abordaje QR.
9. Se asigna conductor y unidad.
10. Conductor recibe la asignacion, pero en estado bloqueado:
    - "Asignacion recibida"
    - "Esperando validacion del counter"
    - sin CTA para iniciar ruta.
11. Pasajero llega al aeropuerto.
12. Counter escanea QR.
13. Backend consume QR, persiste `counter_validado_en` y `estado_abordaje=abordaje_autorizado`.
14. Backend emite broadcast/push "luz verde".
15. Conductor recien puede iniciar:
    - `asignado -> en_camino`
16. Conductor llega al punto.
17. Pasajero aborda:
    - `en_punto -> a_bordo`
18. Viaje a destino.
19. Conductor finaliza.
20. Backend cierra pago demo segun tipo:
    - app pago: autorizado -> capturado.
    - voucher hotel/factura empresa: credito autorizado -> por liquidar.
    - efectivo: por cobrar -> capturado manual o pendiente.
21. Backend crea/actualiza comprobante.
22. Pasajero ve comprobante y calificacion.
23. Admin ve reserva cerrada/por liquidar y trazabilidad completa.

### 3.2 Escenario B — Hotel/punto externo -> aeropuerto

Este flujo NO debe esperar counter al inicio.

1. Hotel/empresa/pasajero solicita traslado hacia aeropuerto.
2. Copiloto extrae origen externo, destino aeropuerto, hora, vuelo, maletas, pasajero.
3. Sistema clasifica `tipo_viaje=traslado_aeropuerto`.
4. Sistema calcula cotizacion demo.
5. Sistema autoriza voucher hotel/factura empresa/app pago.
6. Reserva queda confirmada.
7. Se asigna conductor y unidad.
8. Conductor puede iniciar ruta al hotel/punto externo inmediatamente.
9. Conductor marca:
   - `asignado -> en_camino`
   - `en_camino -> en_punto`
   - `en_punto -> a_bordo`
   - `a_bordo -> finalizado`
10. Al finalizar en aeropuerto, se cierra pago/comprobante segun modalidad.

Regla:

- `recojo_aeropuerto`: requiere counter si origen fisico es aeropuerto y hay pase QR de abordaje.
- `traslado_aeropuerto`: no requiere counter al inicio.
- `city`: no requiere counter salvo que se decida un OTP futuro.

---

## 4. Vocabulario de Producto

Para evitar confusion:

| Concepto interno actual | UI recomendada | Nota |
|---|---|---|
| `voucher_codigo` | Reserva / codigo de reserva | Mantener campo por compatibilidad; no llamarlo voucher al pasajero. |
| `voucher_qr_payload` | Pase de abordaje QR | Es el QR que valida counter. |
| `TipoPago.voucher_hotel` | Cargo a hotel / voucher hotel | Es metodo de pago, no el QR. |
| `comprobantes` | Comprobante | Boleta/factura/ticket; no equivale a pago. |
| `pagos` nuevo | Pago demo / autorizacion | Pasarela simulada o credito. |
| `counter_validado_en` nuevo | Counter validado | Fuente persistente de luz verde. |
| `estado_abordaje` nuevo | Estado de abordaje | Bloqueo/permiso operacional. |

---

## 5. Features / PRs Propuestos

### Feature 1 — Estado de abordaje y gate de counter

**Prioridad:** P0.  
**Motivo:** cierra el bug operacional mas grave.

#### Cambios de dominio

Agregar a Prisma:

```prisma
enum EstadoAbordaje {
  no_requiere_counter
  pendiente_counter
  qr_validado
  abordaje_autorizado
  abordado
}

model reservas {
  // campos existentes...
  estado_abordaje        EstadoAbordaje @default(no_requiere_counter)
  counter_validado_en    DateTime?
  counter_usuario_id     String?
  abordaje_autorizado_en DateTime?
}
```

Opcion minima si se quiere evitar enum nuevo en una primera migracion:

```prisma
counter_validado_en    DateTime?
counter_usuario_id     String?
abordaje_autorizado_en DateTime?
```

Recomendacion: usar enum. La demo ya paso los 10 sprints; post-S9 hardening puede aceptar ampliar esquema.

#### Reglas

- Al crear una reserva:
  - si `tipo_viaje=recojo_aeropuerto`: `estado_abordaje=pendiente_counter`
  - si `traslado_aeropuerto` o `city`: `estado_abordaje=no_requiere_counter`
- Al asignar conductor:
  - se mantiene `reservas.estado=asignada`
  - se mantiene/crea `viajes.estado=asignado`
  - se envia asignacion al conductor, pero el contrato indica si esta bloqueada.
- Al consumir QR:
  - set `counter_validado_en=now`
  - set `counter_usuario_id=session.user.id`
  - set `abordaje_autorizado_en=now`
  - set `estado_abordaje=abordaje_autorizado`
  - auditar `abordaje_autorizado`
  - broadcast `reserva-{id}` evento `abordaje`
  - broadcast `conductor-{conductorId}` evento `abordaje` si hay conductor asignado
- Al conductor intentar `asignado -> en_camino`:
  - si `tipo_viaje=recojo_aeropuerto` y `estado_abordaje` no es `abordaje_autorizado`, devolver `409 counter_pendiente`.
  - si `traslado_aeropuerto`, permitir.

#### Archivos a tocar

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/*`
- `packages/database/prisma/seed.ts`
- `packages/database/prisma/seed-guion.ts`
- `apps/web/src/app/wa-sim/actions.ts`
- `apps/web/src/app/admin/reservas/[id]/actions.ts`
- `apps/web/src/app/api/voucher/[id]/verify/route.ts`
- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts`
- `apps/web/src/lib/conductor-asignacion.ts`
- `apps/web/src/lib/conductor-asignacion-repository.ts`
- `apps/web/src/lib/supabase/server.ts`
- `apps/driver/src/features/assignment/types.ts`
- `apps/driver/src/features/assignment/transitions.ts`
- `apps/driver/app/(auth)/home.tsx`
- `apps/driver/app/(auth)/asignacion/[id].tsx`
- `apps/web/src/app/counter/voucher-validator.tsx`
- `apps/web/src/app/admin/reservas/[id]/page.tsx`
- `apps/web/src/lib/admin/reservas.ts`

#### Pruebas obligatorias

- Unit:
  - `validarTransicionViaje` o nuevo helper `puedeAvanzarConductor()`:
    - recojo aeropuerto + pendiente counter -> bloquea.
    - recojo aeropuerto + abordaje autorizado -> permite.
    - traslado aeropuerto -> permite sin counter.
- API:
  - `POST /api/conductor/asignacion/[id]/estado` sin counter -> `409 counter_pendiente`.
  - consumir QR -> `200`, campos persistidos.
  - despues de consumir QR -> transicion conductor `200`.
  - reuso QR -> `409 voucher_ya_validado`, no duplica estado.
- E2E:
  - admin asigna conductor -> app/endpoint conductor ve asignacion bloqueada.
  - counter valida QR -> conductor queda habilitado.
- Smoke:
  - `pnpm turbo run typecheck lint test build`
  - `pnpm e2e` en fases si los specs de QR consumen datos.
  - `pnpm --filter @taxigreen/driver exec expo export --platform android`

#### DoD

- El conductor no puede iniciar un recojo de aeropuerto sin counter.
- Counter muestra "Luz verde enviada al conductor".
- App conductor muestra "Esperando validacion del counter" y CTA deshabilitado.
- Tras validar QR, el CTA se habilita sin reiniciar app.

---

### Feature 2 — Cotizacion y pago demo

**Prioridad:** P0/P1.  
**Motivo:** cerrar el hueco entre `tipo_pago` y comprobante.

#### Cambios de dominio

Agregar:

```prisma
enum EstadoPago {
  pendiente
  autorizado
  capturado
  rechazado
  exonerado_credito
  por_cobrar
  por_liquidar
}

model pagos {
  id              String     @id @default(uuid())
  tenant_id       String
  reserva_id      String
  tipo_pago       TipoPago
  estado          EstadoPago
  monto           Decimal    @db.Decimal(10,2)
  moneda          String     @default("PEN")
  proveedor_demo  String?
  autorizacion    String?
  payload_demo    Json?
  autorizado_en   DateTime?
  capturado_en    DateTime?
  created_at      DateTime   @default(now())
  updated_at      DateTime   @updatedAt

  tenant          tenants    @relation(fields: [tenant_id], references: [id])
  reserva         reservas   @relation(fields: [reserva_id], references: [id])

  @@index([tenant_id])
  @@index([reserva_id])
}
```

Agregar a `reservas`:

```prisma
cotizacion_monto        Decimal? @db.Decimal(10,2)
cotizacion_moneda       String?  @default("PEN")
cotizacion_fuente       String?
cotizacion_calculada_en DateTime?
```

Si se quiere evitar campos de cotizacion en `reservas`, se puede usar el primer pago como fuente del monto. Recomendacion: guardar cotizacion en `reservas` para no depender de pago si es `efectivo`.

#### Servicio recomendado

Crear `packages/pagos` o `packages/cotizacion`.

Opcion mas limpia:

- `packages/cotizacion`
  - `calcularCotizacionDemo(reserva | puntos)`
- `packages/pagos`
  - `autorizarPagoDemo({ reservaId, tipoPago, monto })`
  - `capturarPagoDemo({ reservaId })`
  - `estadoPagoHumano()`

Opcion mas corta:

- Crear `apps/web/src/lib/pagos-demo.ts` y extraer a paquete despues.

Recomendacion senior: crear `packages/pagos` porque pago sera dominio compartido entre web/admin/pasajero/driver.

#### Reglas por `tipo_pago`

| TipoPago | Al autorizar | Al finalizar |
|---|---|---|
| `app_pago` | `estado=autorizado`, proveedor `demo_link_yape_tarjeta` | `capturado` |
| `voucher_hotel` | `estado=exonerado_credito`, proveedor `hotel_credito_demo` | `por_liquidar` |
| `factura_empresa` | `estado=exonerado_credito`, proveedor `credito_empresa_demo` | `por_liquidar` |
| `efectivo` | `estado=por_cobrar` | `capturado` o `por_cobrar` segun confirmacion manual |

#### UI WhatsApp

Despues de extraer datos:

1. Resumen de reserva.
2. Tarifa estimada/cerrada.
3. Metodo de pago detectado.
4. Boton "Simular autorizacion".
5. Animacion:
   - Calculando tarifa
   - Validando metodo de pago
   - Autorizando voucher hotel / link de pago / credito empresa
   - Autorizado
   - Pase QR emitido

La reserva no debe parecer "lista" sin pago demo resuelto.

#### Archivos a tocar

- `packages/database/prisma/schema.prisma`
- nueva migracion
- `packages/database/prisma/seed.ts`
- `packages/database/prisma/seed-guion.ts`
- `packages/ingesta/src/types.ts` si se quiere enriquecer `tipo_pago` con metadata.
- `apps/web/src/app/wa-sim/actions.ts`
- `apps/web/src/app/wa-sim/whatsapp-simulator.tsx`
- `apps/web/src/lib/admin/reservas.ts`
- `apps/web/src/app/admin/reservas/[id]/page.tsx`
- `apps/web/src/app/counter/voucher-validator.tsx`
- `apps/web/src/lib/pasajero.ts`
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`
- nuevo endpoint:
  - `apps/web/src/app/api/pagos/demo/autorizar/route.ts`
  - `apps/web/src/app/api/pagos/demo/capturar/route.ts`
- nuevo package opcional:
  - `packages/pagos/src/*`

#### Pruebas obligatorias

- Unit:
  - calculo de cotizacion determinista.
  - autorizacion por tipo de pago.
- API:
  - autorizar app pago -> `autorizado`.
  - autorizar voucher hotel -> `exonerado_credito`.
  - autorizar efectivo -> `por_cobrar`.
- E2E:
  - WhatsApp muestra cotizacion y animacion.
  - Passenger link muestra metodo, estado y monto.
  - Counter muestra pago autorizado antes de confirmar acceso.

#### DoD

- Existe estado de pago persistente.
- El usuario ve que hubo autorizacion/cobertura antes del QR.
- Admin, counter y pasajero muestran el mismo monto y estado.

---

### Feature 3 — Cierre de viaje conectado a pago y comprobante

**Prioridad:** P1.  
**Motivo:** que el PDF no sea una pieza suelta.

#### Reglas

Cuando el conductor marca `a_bordo -> finalizado`:

- Actualizar viaje con `finalizado_en`.
- Actualizar reserva a `por_liquidar` o `finalizada` segun decision de producto.
- Ejecutar cierre de pago demo:
  - `app_pago`: `autorizado -> capturado`.
  - `voucher_hotel`: `exonerado_credito -> por_liquidar`.
  - `factura_empresa`: `exonerado_credito -> por_liquidar`.
  - `efectivo`: `por_cobrar -> capturado` si se simula cobro manual; si no, queda `por_cobrar`.
- Crear o actualizar comprobante:
  - `app_pago`: boleta/ticket pendiente -> emitible.
  - `voucher_hotel`: ticket o factura pendiente segun demo.
  - `factura_empresa`: factura pendiente/emitida.
- Auditar:
  - `pago_demo_capturado`
  - `pago_demo_por_liquidar`
  - `comprobante_preparado`

#### Archivos a tocar

- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts`
- `apps/web/src/lib/conductor-asignacion.ts`
- `apps/web/src/app/api/pasajero/[token]/comprobante/route.ts`
- `apps/web/src/app/api/comprobantes/[id]/pdf/route.ts`
- `apps/web/src/lib/pasajero.ts`
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`
- `apps/web/src/lib/admin/reservas.ts`
- `apps/web/src/app/admin/reservas/[id]/page.tsx`
- `packages/comprobantes/src/*`
- `packages/pagos/src/*` si se crea.

#### Pruebas obligatorias

- API:
  - finalizar viaje app_pago captura pago y prepara comprobante.
  - finalizar viaje voucher_hotel deja pago por liquidar y comprobante pendiente.
  - finalizar viaje factura_empresa deja factura pendiente/emitida segun regla.
- E2E:
  - passenger link solo ofrece comprobante cuando viaje termino.
  - al pedir PDF, comprobante se marca emitido.
- DB smoke:
  - pagos y comprobantes quedan ligados a `reserva_id`.

#### DoD

- El cierre del conductor dispara un estado financiero visible.
- El comprobante se entiende como consecuencia del cierre.
- No se puede mostrar "pago capturado" si no existe pago.

---

### Feature 4 — Separacion de escenarios: aeropuerto -> ciudad vs hotel -> aeropuerto

**Prioridad:** P1.  
**Motivo:** evitar que counter contamine flujos donde no corresponde.

#### Escenario A

- `tipo_viaje=recojo_aeropuerto`
- requiere `estado_abordaje=abordaje_autorizado`
- muestra counter/pase de abordaje
- conductor bloqueado hasta counter

#### Escenario B

- `tipo_viaje=traslado_aeropuerto`
- no requiere counter
- puede usar "codigo de reserva" u OTP futuro, no QR de counter como permiso inicial.
- conductor puede iniciar tras asignacion.
- pago recomendado: `voucher_hotel` o `factura_empresa`.

#### Cambios

- Agregar conversaciones seed en `wa-sim`:
  - `protagonista-llegada-aeropuerto`
  - `hotel-hacia-aeropuerto`
  - `empresa-factura-hacia-aeropuerto`
- Ajustar `packages/ingesta/src/extractor.ts` y tests para distinguir:
  - "recoger en Jorge Chavez" -> `recojo_aeropuerto`
  - "llevar al aeropuerto" -> `traslado_aeropuerto`
- Admin debe mostrar regla operacional:
  - "Requiere counter" / "No requiere counter".
- Driver debe mostrar:
  - A: "Esperando validacion del counter"
  - B: "Listo para ir al hotel/punto de recojo"

#### Archivos a tocar

- `apps/web/src/app/wa-sim/conversaciones-seed.ts`
- `packages/ingesta/src/extractor.ts`
- `packages/ingesta/src/extractor.test.ts`
- `apps/web/src/app/wa-sim/whatsapp-simulator.tsx`
- `apps/web/src/lib/admin/reservas.ts`
- `apps/web/src/app/admin/reservas/[id]/page.tsx`
- `apps/driver/app/(auth)/home.tsx`
- `apps/driver/app/(auth)/asignacion/[id].tsx`
- `apps/web/src/lib/pasajero.ts`
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`

#### Pruebas obligatorias

- Unit:
  - ingesta detecta `traslado_aeropuerto`.
  - helper `requiereCounter()` solo aplica a recojo aeropuerto.
- E2E:
  - Demo A bloquea conductor hasta counter.
  - Demo B no bloquea conductor.

#### DoD

- Se puede presentar claramente una demo A y una demo B.
- El QR de counter no aparece como requisito en hotel -> aeropuerto.

---

### Feature 5 — Counter operacional, no solo validador

**Prioridad:** P2.  
**Motivo:** el counter esta funcional, pero aun se siente como herramienta aislada.

#### Cambios

Al validar un QR, el counter debe mostrar:

- Reserva encontrada.
- Metodo de pago y estado:
  - "Cargo a hotel autorizado"
  - "Crédito empresa autorizado"
  - "Pago app autorizado"
  - "Pago en efectivo pendiente"
- Conductor asignado.
- Unidad.
- Punto de encuentro.
- Boton "Enviar luz verde al conductor" o "Confirmar llegada y enviar luz verde".
- Resultado:
  - "Luz verde enviada"
  - "Conductor habilitado"
  - "Este pase ya no puede reutilizarse"

Si no hay conductor asignado:

- Mostrar "Pase valido, falta conductor".
- CTA: "Abrir despacho".

#### Archivos a tocar

- `apps/web/src/app/counter/voucher-validator.tsx`
- `apps/web/src/app/api/voucher/[id]/verify/route.ts`
- `apps/web/src/lib/reservas.ts`
- `apps/web/src/lib/admin/reservas.ts`
- `apps/web/src/app/admin/reservas/[id]/page.tsx`

#### Pruebas obligatorias

- E2E counter:
  - valida QR y ve conductor/unidad/pago.
  - consume y ve luz verde.
  - reuso muestra bloqueo.

---

### Feature 6 — Copy y nombres consistentes en todo el sistema

**Prioridad:** P2.  
**Motivo:** evitar confusion "voucher" vs "pase" vs "pago" vs "comprobante".

#### Cambios UI

- Pasajero:
  - "Tu reserva"
  - "Pase de abordaje"
  - "Pago"
  - "Comprobante"
- Counter:
  - "Validar pasajero"
  - "Pase de abordaje"
  - "Luz verde al conductor"
- Admin:
  - "Reserva"
  - "Metodo de pago"
  - "Abordaje"
  - "Conductor asignado"
- Driver:
  - "Esperando counter"
  - "Listo para iniciar"
  - "Iniciar ruta"

#### Archivos a tocar

- `packages/shared/src/copy/index.ts`
- `apps/web/src/app/*`
- `apps/driver/app/*`
- `tests/e2e/*`

#### DoD

- Ninguna superficie visible llama "voucher" al QR, salvo cuando se refiera explicitamente a `voucher_hotel`.
- El pasajero entiende la diferencia entre reserva, pago y comprobante.

---

### Feature 7 — QA, datos demo y documentacion viva

**Prioridad:** continua.  
**Motivo:** cada feature debe cerrar con reporte y prompt siguiente, como los sprints.

#### Cambios

- Crear por feature:
  - `docs/features/ESTADO_FEATURE_X.md`
  - `docs/features/PROMPT_FEATURE_X+1_CODEX.md`
- Actualizar:
  - `docs/DOCUMENTACION_TECNICA.md`
  - `docs/GUIA_PRUEBAS_DEMO.md`
  - `docs/PLAN_RENOVACION_FRONTEND_PREMIUM.md` si toca UX.
- Seed:
  - `db:seed-guion` debe dejar al menos:
    - Demo A: recojo aeropuerto pendiente counter.
    - Demo B: traslado aeropuerto sin counter.
    - Pago app autorizado.
    - Voucher hotel autorizado.
    - Factura empresa autorizada.

#### Pruebas obligatorias globales

- `pnpm turbo run typecheck lint test build`
- `pnpm e2e`
- `pnpm --filter @taxigreen/driver exec expo export --platform android`
- Smoke manual/API:
  - conductor bloqueado antes de counter.
  - counter consume QR.
  - conductor habilitado despues.
  - pago demo visible en WA/admin/counter/pasajero.
  - cierre de pago al finalizar.

---

## 6. Orden Recomendado de Implementacion

1. **Feature 1 — Estado de abordaje y gate de counter.**  
   No avanzar con pago si el conductor todavia puede saltarse counter.

2. **Feature 2 — Cotizacion y pago demo.**  
   Agrega la narrativa financiera antes del QR.

3. **Feature 3 — Cierre de viaje conectado a pago y comprobante.**  
   Une finalizacion con captura/liquidacion/comprobante.

4. **Feature 4 — Separacion de escenarios.**  
   Evita confundir aeropuerto -> ciudad con hotel -> aeropuerto.

5. **Feature 5 — Counter operacional.**  
   Lo convierte de validador aislado a torre de autorizacion.

6. **Feature 6 — Copy consistente.**  
   Puede avanzar en paralelo, pero debe cerrarse despues de tener campos reales.

7. **Feature 7 — QA/docs por feature.**  
   Corre siempre.

---

## 7. Riesgos y Decisiones

### R1. Mantener 10 tablas vs agregar `pagos`

Sprint 9 cerraba la demo con 10 tablas, pero este endurecimiento es post-S9. Para hacer pago creible, `pagos` es la tabla correcta.

Decision recomendada: aceptar +1 tabla. No sobrecargar `comprobantes` ni `reservas.raw_ingesta`.

### R2. Bloquear `asignado -> en_camino` o `en_punto -> a_bordo`

Para la demo actual, bloquear `asignado -> en_camino` es lo mas claro: el conductor no puede iniciar el flujo hasta que counter valide.

Si negocio decide que el conductor puede acercarse antes de que llegue el pasajero, entonces bloquear `en_punto -> a_bordo`. Pero la critica actual pide evitar que "conductor pueda iniciar" sin counter. Por tanto, PR1 debe bloquear `asignado -> en_camino`.

### R3. Auditoria no debe ser fuente de estado

Auditoria sigue siendo trazabilidad. El estado operacional debe vivir en `reservas`.

### R4. `voucher_codigo` como nombre tecnico

Renombrar DB puede ser costoso. Recomendacion:

- Fase 1: cambiar UI/copy a "Reserva" y "Pase de abordaje".
- Fase 2 opcional: migrar campo a `codigo_reserva` o agregar alias en serializer.

### R5. `seed-guion` hoy arranca en `en_camino`

Para probar el gate, el seed deberia poder arrancar en estado inicial bloqueado. Se recomienda:

- `db:seed-guion`: flujo listo para demo visual actual.
- nuevo script: `db:seed-flujo-operacional` o flag que deje la reserva `asignada/asignado/pendiente_counter`.

---

## 8. Lista de Archivos Inspeccionados o Directamente Involucrados

### Documentacion / negocio

- `docs/ESTADO_SPRINT_9.md`
- `docs/DOCUMENTACION_TECNICA.md`
- `docs/PLAN_RENOVACION_FRONTEND_PREMIUM.md`
- `docs/PROMPT_MAESTRO_RENOVACION_FRONTEND_PREMIUM_TAXIGREEN.md`
- `_FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md`
- `_FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md`
- `06_DEMO_TECNICA/FLUJO_NEGOCIO_CANONICO.md`
- `06_DEMO_TECNICA/ESPECIFICACION_PANTALLAS_PREMIUM.md`
- `07_PLAN_EJECUCION/LOGICA_NEGOCIO_OPERATIVA.md`
- `07_PLAN_EJECUCION/SPRINT.md`
- adjunto del usuario: `/home/jose/.codex/attachments/42cc1c6a-2cc2-469f-a54e-84a17bafd27d/pasted-text.txt`

### Base de datos

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260531000000_sprint1_initial/migration.sql`
- `packages/database/prisma/seed.ts`
- `packages/database/prisma/seed-guion.ts`
- `packages/database/src/index.ts`

### WhatsApp / ingesta

- `apps/web/src/app/wa-sim/actions.ts`
- `apps/web/src/app/wa-sim/whatsapp-simulator.tsx`
- `apps/web/src/app/wa-sim/conversaciones-seed.ts`
- `apps/web/src/app/wa-sim/page.tsx`
- `apps/web/src/app/api/ingesta/extraer/route.ts`
- `packages/ingesta/src/types.ts`
- `packages/ingesta/src/extractor.ts`
- `packages/ingesta/src/post-procesamiento.ts`
- `packages/ingesta/src/diccionarios/pagos-keywords.ts`
- `packages/ingesta/src/extractor.test.ts`

### Voucher / counter

- `apps/web/src/app/counter/page.tsx`
- `apps/web/src/app/counter/voucher-validator.tsx`
- `apps/web/src/app/api/voucher/[id]/qr/route.ts`
- `apps/web/src/app/api/voucher/[id]/verify/route.ts`
- `packages/voucher/src/sign.ts`
- `packages/voucher/src/qr.ts`
- `packages/voucher/src/sign.test.ts`

### Admin / asignacion

- `apps/web/src/app/admin/reservas/[id]/actions.ts`
- `apps/web/src/app/admin/reservas/[id]/page.tsx`
- `apps/web/src/app/admin/reservas/[id]/reserva-detalle.tsx`
- `apps/web/src/app/admin/reservas/[id]/sugerencia-card.tsx`
- `apps/web/src/lib/admin/reservas.ts`
- `apps/web/src/app/api/asignacion/sugerir/route.ts`
- `packages/asignacion/src/sugerir.ts`
- `packages/asignacion/src/heuristica.ts`
- `packages/ia/src/racionalizador-llm.ts`

### Conductor web API / app movil

- `apps/web/src/app/api/conductor/asignacion/[id]/route.ts`
- `apps/web/src/app/api/conductor/asignacion/activa/route.ts`
- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts`
- `apps/web/src/app/api/conductor/viajes/route.ts`
- `apps/web/src/lib/conductor-asignacion.ts`
- `apps/web/src/lib/conductor-asignacion-repository.ts`
- `apps/web/src/lib/conductor-token.ts`
- `apps/driver/src/features/assignment/types.ts`
- `apps/driver/src/features/assignment/client.ts`
- `apps/driver/src/features/assignment/transitions.ts`
- `apps/driver/app/(auth)/home.tsx`
- `apps/driver/app/(auth)/asignacion/[id].tsx`
- `apps/driver/app/(auth)/historial.tsx`
- `apps/driver/src/features/realtime/client.ts`
- `apps/driver/src/features/realtime/index.tsx`

### Pasajero / comprobante / pago pendiente

- `apps/web/src/lib/pasajero.ts`
- `apps/web/src/app/p/[token]/page.tsx`
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`
- `apps/web/src/app/api/pasajero/[token]/route.ts`
- `apps/web/src/app/api/pasajero/[token]/comprobante/route.ts`
- `apps/web/src/app/api/pasajero/[token]/comprobante/pdf/route.ts`
- `apps/web/src/app/api/comprobantes/[id]/pdf/route.ts`
- `apps/web/src/lib/comprobantes.ts`
- `packages/comprobantes/src/types.ts`
- `packages/comprobantes/src/render.ts`
- `packages/comprobantes/src/templates/*`

### Realtime / push / routing relacionados

- `apps/web/src/lib/supabase/server.ts`
- `apps/web/src/lib/push.ts`
- `apps/web/src/app/api/rutas/calcular/route.ts`
- `packages/rutas/src/*`
- `apps/driver/src/features/routing/use-route.ts`
- `apps/driver/src/components/map/AssignmentMap.tsx`

### Tests existentes a actualizar o ampliar

- `tests/e2e/wa-sim.spec.ts`
- `tests/e2e/counter-qr.spec.ts`
- `tests/e2e/voucher-flow.spec.ts`
- `tests/e2e/admin-asignacion.spec.ts`
- `tests/e2e/asignacion-sugerencia.spec.ts`
- `tests/e2e/passenger-link.spec.ts`
- `apps/web/src/lib/conductor-asignacion.test.ts`
- `apps/web/src/lib/conductor-asignacion-repository.test.ts`
- `apps/web/src/app/api/conductor/asignacion/activa/route.test.ts`
- `packages/ingesta/src/extractor.test.ts`
- nuevos tests recomendados para `packages/pagos`.

---

## 9. Prompt Base Reutilizable para Cada Feature

Cada feature debe cerrar con:

1. Implementacion.
2. Tests unitarios/API/E2E segun riesgo.
3. Smoke manual documentado.
4. `docs/features/ESTADO_FEATURE_X.md`.
5. `docs/features/PROMPT_FEATURE_X+1_CODEX.md`.
6. Actualizacion de `docs/DOCUMENTACION_TECNICA.md` si cambia contrato tecnico.
7. Actualizacion de `docs/GUIA_PRUEBAS_DEMO.md` si cambia flujo manual.

Plantilla de cierre:

```md
# Estado Feature X — [nombre]

## Implementado
- ...

## Cambios por archivo
- ...

## Verificacion
- comando -> resultado
- smoke -> resultado

## Bugs encontrados
- ...

## Riesgos / deuda
- ...

## Proximo prompt recomendado
- link a PROMPT_FEATURE_X+1_CODEX.md
```

---

## 10. Recomendacion Final

Primero implementar **Feature 1 — Estado de abordaje y gate de counter**.  
Mientras eso no exista, cualquier pasarela, UI premium o mapa se apoya en un flujo que todavia puede saltarse el paso mas sensible.

Despues implementar **Feature 2 — Cotizacion y pago demo**.  
Eso convierte `tipo_pago` de dato decorativo en parte visible del relato operacional.

Con esas dos features, la demo pasara de "piezas conectadas" a "proceso obligatorio y verificable".

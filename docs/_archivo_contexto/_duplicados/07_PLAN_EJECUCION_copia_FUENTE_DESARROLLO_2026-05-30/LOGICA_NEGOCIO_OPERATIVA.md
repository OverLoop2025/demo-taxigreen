# Lógica de Negocio Operativa — Taxi Green

**Versión:** 1.0
**Fecha:** 2026-05-29
**Estado:** documento puente entre negocio y datos. Traduce `FLUJO_NEGOCIO_CANONICO.md` a entidades, reglas de asignación, reglas de historial e importes, y deltas de esquema respecto a `PLAN_SOFTWARE.md` v4.0 §7.6. Marca qué se implementa en demo, qué se siembra para MVP y qué es futuro.
**Norte:** habilitar las pantallas premium (DriverCard, VehicleCard, DriverHistorySummary, RatingTripleCard) **sin inflar el alcance de demo**. El motor de liquidación es MVP; la demo muestra resúmenes con datos semilla.

**Convención:** `Construir (demo)` · `Semilla MVP` · `Futuro` · `Por validar` · `Contradicción resuelta`.

---

## 1. Entidades de negocio principales

| Entidad | Rol | Estado en demo |
|---|---|---|
| **Reserva** | Pedido trazable desde un canal | Construir |
| **Viaje** | Ejecución de una reserva | Construir |
| **Conductor** | Persona que ejecuta | Construir (+ campos nuevos) |
| **Vehículo / Unidad** | Auto asignado (N:N con conductor en el tiempo) | Construir (+ campos nuevos) |
| **Voucher** | Artefacto QR firmado del pedido | Construir |
| **Comprobante** | Boleta/factura SUNAT-like | Construir (visual) |
| **Incidencia** | Caso de bienestar (objeto olvidado en demo) | Construir (1 tipología) |
| **Calificación** | Triple: servicio, conductor, unidad | Construir (jsonb demo) |
| **Liquidación** | Cierre de importes al conductor | **Semilla MVP** (mockup en demo) |
| **Cola de aeropuerto** | Orden de conductores en módulo | Construir (visual) / Semilla MVP (motor) |
| **Empresa cliente** | Pagador corporativo | Semilla MVP (string en demo) |

---

## 2. Reservas — modelo y reglas

### 2.1 Datos (alineado con `PLAN_SOFTWARE §7.6`, con delta semántico)
`reservas`: `canal_origen`, `tipo_viaje`, `solicitante_tipo/nombre/contacto`, `pasajero_nombre/telefono/email/dni/ruc`, `origen/destino (texto+lat+lng)`, `punto_encuentro`, `fecha_hora_servicio`, `vuelo_codigo`, `tipo_pago`, `estado`, `token_pasajero`, `voucher_codigo`, `voucher_qr_payload`, `raw_ingesta jsonb`, `sugerencia_copiloto jsonb`, `empresa_nombre`, `hotel_nombre`.

### 2.2 Semántica de flujo y seed protagonista

`tipo_viaje` separa la **dirección física** del canal que originó la reserva:

```prisma
enum TipoViaje {
  recojo_aeropuerto       // Aeropuerto Jorge Chávez -> ciudad
  traslado_aeropuerto    // ciudad/hotel/casa/oficina -> Aeropuerto Jorge Chávez
  city                   // otro origen/destino
}
```

Seed obligatorio para la demo:

```json
{
  "canal_origen": "whatsapp_oficial",
  "tipo_viaje": "recojo_aeropuerto",
  "solicitante_tipo": "hotel",
  "solicitante_nombre": "Concierge hotel",
  "pasajero_nombre": "Pasajero final del huésped",
  "origen_texto": "Aeropuerto Jorge Chávez - Llegadas",
  "punto_encuentro": "Salida 3, columna F2",
  "destino_texto": "Av. Pardo 123, Miraflores",
  "vuelo_codigo": "LA2456"
}
```

Reglas:
- `hotel_nombre` describe al **solicitante** o convenio comercial; nunca reemplaza `origen_texto`.
- En el flujo protagonista, el conductor se dirige al aeropuerto, no al hotel.
- El counter walk-in también usa `tipo_viaje = recojo_aeropuerto`.
- `traslado_aeropuerto` existe para MVP/ruta secundaria, no para el guion principal.

### 2.3 Reglas
- Una reserva nace en `ingesta_pendiente` y solo pasa a `asignada` tras **aprobación humana**.
- El copiloto **no inventa**: si falta un dato crítico (dirección, nombre, correo), queda `ingesta_pendiente`; si hay contradicción (vuelo/hora, RUC inválido) → `necesita_revision`.
- `Semilla MVP`: añadir estados `necesita_revision` y sub-estado `por_liquidar` al enum (en demo son etiquetas visuales).

---

## 3. Conductor y Vehículo — deltas de esquema **[datos nuevos]**

> El esquema demo actual (`PLAN_SOFTWARE §7.6`) tiene: `conductores(licencia, rating, tiempo_en_cola_desde, vehiculo_id)` y `vehiculos(placa, modelo, capacidad)`. **Insuficiente** para las DriverCard/VehicleCard pedidas. Deltas:

### 3.1 `conductores` — añadir
```prisma
foto_url        String?   // Construir (demo): foto del conductor (DriverCard)
// nombres completos ya viven en usuarios.nombre (usar nombre completo en seed)
rating          Float     // ya existe — valoración del conductor (★)
total_viajes    Int       @default(0)  // Semilla MVP: para "487 viajes" de la DriverCard
```

### 3.2 `vehiculos` — añadir
```prisma
marca       String        // Construir (demo): "Toyota"
// modelo ya existe: "Yaris"
tipo        TipoVehiculo  // Construir (demo): enum sedan|camioneta|van|minivan
foto_url    String?       // Construir (demo): foto del auto (VehicleCard)
color       String?       // Construir (demo)
anio        Int?          // Semilla MVP
// capacidad ya existe
```
`enum TipoVehiculo { sedan camioneta van minivan }` — `Construir (demo)`.

### 3.3 Regla de asignación conductor / unidad
- **Separados.** `Evidencia directa`: la misma unidad la conduce hoy uno, mañana otro. Relación **N:N en el tiempo** (un `vehiculo_id` nullable en `conductores` modela la asignación *vigente*; el histórico real es MVP).
- En `3.C` y en counter, el operador selecciona **conductor** y **unidad** por separado.
- `Semilla MVP`: tabla `asignaciones_unidad(conductor_id, vehiculo_id, desde, hasta)` para el histórico N:N. En demo basta `conductores.vehiculo_id`.

### 3.4 Regla de cola de aeropuerto
- Orden por `tiempo_en_cola_desde` (más antiguo primero), filtrado por **compatibilidad de tipo de unidad** y **capacidad**.
- Score de recomendación (heurística determinista, `packages/asignacion`):
  ```
  score = w1·tiempo_en_cola + w2·(1/distancia_km) + w3·match_tipo_unidad
          + w4·capacidad_suficiente − w5·penalizacion_retrasos
  ```
- `Construir (demo)`: heurística + razón corta. `Semilla MVP`: pesos ajustables + auditoría de overrides.
- **No "el más cercano gana".** `Evidencia directa` (PROBLEMA §3.5): la cola importa.

---

## 4. Calificación triple — modelo **[Evidencia directa]**

`Contradicción resuelta`: `SPRINT.md` S8 la degradó a "notas"; Raúl la pidió explícita. Se re-prioriza.

- **Demo:** persistir en `reservas.sugerencia_copiloto`... no — usar un campo dedicado `reservas.calificacion jsonb`:
  ```json
  { "servicio": 5, "conductor": 5, "unidad": 4, "motivo": ["limpieza"], "comentario": null }
  ```
  `Construir (demo)`: añadir `reservas.calificacion Json?`.
- **MVP:** tabla dedicada
  ```prisma
  model calificaciones {
    id            String @id @default(uuid())
    reserva_id    String @unique
    servicio      Int    // 1-5
    conductor     Int    // 1-5
    unidad        Int    // 1-5
    motivo        String[]
    comentario    String?
    created_at    DateTime @default(now())
  }
  ```
- Regla: si cualquier eje ≤ 3, pedir motivo (chips). El `rating` del conductor se recalcula con el promedio del eje "conductor" (MVP).

---

## 5. Importes, historial y liquidación — reglas **[datos nuevos]**

> `Evidencia directa` (Raúl): el pago al conductor es **"harina de otro costal"**, se procesa aparte. El cierre del viaje **prepara** la liquidación (`por_liquidar`); **no la ejecuta**. Por eso: **demo muestra el resumen como mockup; el motor real es MVP.**

### 5.1 Campos del `DriverHistorySummary` (pedido)
| Campo | Definición | Origen |
|---|---|---|
| **Viajes atendidos** | viajes `finalizado` del conductor en el periodo | conteo |
| **Viajes cobrados / procesados** | viajes con comprobante `emitido` y pago confirmado | conteo |
| **Viajes pendientes de procesar** | atendidos − procesados (estado `por_liquidar`) | conteo |
| **Importe facturado** | Σ tarifa de viajes del periodo | suma |
| **Comisión empresa** | facturado × `tasa_comision` | cálculo |
| **Neto a cobrar** | facturado − comisión | cálculo |

### 5.2 Reglas de importes
```
importe_facturado   = Σ tarifa(viajes_periodo)
comision_empresa    = importe_facturado × tasa_comision     // tasa_comision en env/config (ej. 0.20)
neto_a_cobrar       = importe_facturado − comision_empresa
viajes_pendientes   = viajes_atendidos − viajes_procesados
```
- `tasa_comision`: `Por validar` con Taxi Green (no inventar el %; en demo usar 20% como `Hipótesis` rotulada).
- **Demo:** valores calculados desde datos semilla (no hay flujo de pago real). `Construir (demo)` solo la **vista**.
- **MVP:** tabla `liquidaciones` + cierre quincenal.
  ```prisma
  model liquidaciones {            // Semilla MVP — NO en demo
    id              String @id @default(uuid())
    conductor_id    String
    periodo_inicio  DateTime
    periodo_fin     DateTime
    viajes_atendidos Int
    viajes_procesados Int
    importe_facturado Decimal
    comision_empresa  Decimal
    neto_a_cobrar     Decimal
    estado            String   // abierta, cerrada, pagada
  }
  ```
- **Futuro:** adelantos/préstamos al conductor.

### 5.3 Historial del conductor (`2.H`) vs liquidación (`3.E`)
- `2.H` (app conductor): lista de viajes del turno + su propio neto estimado. Sin datos de otros conductores.
- `3.E` (admin): `DriverHistorySummary` completo por conductor (los 6 campos), con comisión de empresa visible (dato interno, no para el conductor en demo).

---

## 6. Voucher, comprobante, incidencia (sin cambios mayores)

- **Voucher:** `voucher_codigo` único + `voucher_qr_payload` firmado HMAC; uso único (bloqueo idempotente). `Construir (demo)`.
- **Comprobante:** `comprobantes(tipo, serie, correlativo, monto, pdf_url, estado)`. PDF visual SUNAT-like. `Construir (demo)`; emisión real = MVP (Fenbo).
- **Incidencia:** `incidencias(tipologia, severidad, estado, timeline jsonb, tpr_seg, tr_seg)`. Demo: solo `objeto_olvidado` E2E + clasificador determinista. 10 tipologías + LLM = MVP/Futuro.

---

## 7. Tabla maestra: qué se implementa, qué se siembra, qué es futuro

| Capacidad | Demo | MVP | Futuro |
|---|---|---|---|
| `conductores.foto_url`, `vehiculos.marca/tipo/foto_url/color` | ✅ Construir | enriquecer | — |
| Asignación separada conductor/unidad (vigente) | ✅ `conductores.vehiculo_id` | tabla `asignaciones_unidad` (N:N histórico) | — |
| Cola de aeropuerto (vista) | ✅ | motor + reglas + auditoría | optimización ML |
| Heurística de sugerencia | ✅ determinista | + LLM con fallback | aprendizaje de overrides |
| Calificación triple | ✅ `reservas.calificacion jsonb` | tabla `calificaciones` + recálculo rating | — |
| DriverHistorySummary (vista) | ✅ mockup datos semilla | datos reales | — |
| Liquidación (motor) | ❌ enunciar | ✅ tabla + cierre quincenal | adelantos/préstamos |
| Estados `necesita_revision`, `por_liquidar` | etiqueta visual | estados reales | — |
| Empresa cliente / reporte | string libre + 1 lámina | FK `empresas_clientes` + reporte | asistente conversacional |
| Doble confirmación cruzada | ✅ visual | ✅ con políticas no-show | — |

---

## 8. Deltas de esquema demo — resumen accionable

Sobre las **10 tablas demo** de `PLAN_SOFTWARE §7.6`, añadir (todo `Construir (demo)`, no rompe el conteo de tablas):
```prisma
// conductores
+ foto_url     String?
+ total_viajes Int @default(0)   // semilla para "X viajes" en DriverCard

// vehiculos
+ marca    String
+ tipo     TipoVehiculo          // enum nuevo
+ foto_url String?
+ color    String?
+ anio     Int?

// reservas
+ calificacion Json?             // {servicio, conductor, unidad, motivo, comentario}
+ tipo_viaje   TipoViaje         // recojo_aeropuerto | traslado_aeropuerto | city
+ solicitante_tipo String?       // demo: hotel | empresa | pasajero | operador
+ solicitante_nombre String?
+ solicitante_contacto String?

// enums
+ enum TipoVehiculo { sedan camioneta van minivan }
+ enum TipoViaje { recojo_aeropuerto traslado_aeropuerto city }
```
> No se añaden tablas nuevas en demo. `calificaciones`, `liquidaciones`, `asignaciones_unidad`, `empresas_clientes` son **Semilla MVP**. El `DriverHistorySummary` se alimenta de conteos y sumas sobre `viajes`/`comprobantes` con `tasa_comision` de config.

---

## 9. Preguntas por validar con Taxi Green (no inventar)

| Pregunta | Por qué importa |
|---|---|
| ¿`tasa_comision` real al conductor? | Define `neto_a_cobrar` y `comision_empresa` |
| ¿La tarifa es siempre cerrada o a veces estimada? | Microcopy y confianza del pasajero |
| ¿Cómo se procesa hoy el pago al conductor? | Diseño de `liquidaciones` (MVP) |
| ¿Política de espera/no-show? | Estados y cargos |
| ¿Verde Taxi Green vs azul Qorinti como identidad del producto? | Decisión de marca (ver `ESPECIFICACION §7`) |

---

*Fin. Negocio: `06_DEMO_TECNICA/FLUJO_NEGOCIO_CANONICO.md`. Pantallas: `06_DEMO_TECNICA/ESPECIFICACION_PANTALLAS_PREMIUM.md`. Alineación: `06_DEMO_TECNICA/MAPA_ALINEACION_PLAN_FIGMA.md`.*

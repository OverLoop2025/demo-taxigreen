# Flujo de Negocio Canónico — Taxi Green

**Versión:** 1.0
**Fecha:** 2026-05-29
**Estado:** documento canónico de negocio. Reconcilia `00_EVIDENCIA_REAL` (transcripción Raúl 19-may + `PROBLEMA_ordenado`), `PLAN_SOFTWARE.md` v4.0, `vision_final_taxigreen_refinada.md` y `vision_final_perfecta.md`. La evidencia real manda; los documentos recientes mandan sobre los antiguos, salvo donde el antiguo (`PROPUESTA_DEMO.md`) conserva un flujo operativo perdido.
**Propósito:** fijar la lógica de negocio ANTES de tocar el Figma. Define actores, canales, flujos, estados, eventos, datos mínimos, reglas y excepciones. Marca qué es demo, qué es MVP y qué es futuro.

**Convención epistémica:** `Evidencia directa` · `Dicho en reunión` · `Propuesta previa` · `Inferencia` · `Hipótesis` · `Por validar` · `Contradicción` · `Recomendación`.

---

## 0. La frase que ordena el negocio

> Taxi Green recibe pedidos por **los canales que el cliente ya usa** (WhatsApp, hotel, counter, llamada, web), los convierte en una **reserva trazable con voucher/QR**, un **humano asigna conductor y unidad por separado** (apoyado por una sugerencia), el viaje se **ejecuta y se cierra con doble confirmación**, y emite **comprobante**. Si algo queda pendiente (un objeto olvidado), se **resuelve con un humano nombrado y constancia**.

`Inferencia` con confianza alta: el cuello de botella real no es "pedir un taxi", sino la **fricción entre el canal de entrada y la operación** y entre la operación y el cierre administrativo. El producto ordena ese tránsito; no reemplaza al humano.

### 0.1 Regla P0 — dirección física y roles

La demo protagonista queda cerrada como **Recojo en aeropuerto**:

```text
Solicitante hotel/concierge por WhatsApp
  → pasajero final llega al Aeropuerto Jorge Chávez
  → recojo en llegadas, Salida 3, columna F2
  → destino Av. Pardo 123, Miraflores
```

- **Hotel / concierge = solicitante**, no origen físico.
- **Pasajero final = persona que viaja**, físicamente en el aeropuerto al momento del recojo.
- **Origen físico = Aeropuerto Jorge Chávez**, llegadas.
- **Destino físico = Lima / Miraflores**.
- El flujo inverso **ciudad/hotel/casa/oficina → aeropuerto** se llama **Traslado hacia aeropuerto** y queda como variante no protagonista / MVP.

> Regla de lenguaje: evitar "salida aeropuerto" o "salida del aeropuerto" como etiqueta suelta. Usar **Recojo en aeropuerto** para Aeropuerto → ciudad y **Traslado hacia aeropuerto** para ciudad → aeropuerto.

---

## 1. Actores

| Actor | Quién es | Qué necesita | Canal / superficie | Protagonismo demo |
|---|---|---|---|---|
| **Pasajero** | Quien viaja (turista, ejecutivo, huésped) | Saber quién lo recoge, dónde, cuándo; comprobante; ayuda si algo falla | **Link `/p/[token]`** (sin app) | Importante, **no** protagonista activo |
| **Hotel / concierge** | Recepción que pide por el huésped | Pedir sin teclear; recibir voucher/QR | **WhatsApp** | **Solicitante del flujo protagonista**; no origen físico |
| **Operador / Admin operativo** ("Carla") | Despachador con control de operación | Ver reservas, aprobar sugerencia, asignar conductor+unidad, atender incidencias | Panel web `/admin` | **Protagonista (humano en control)** |
| **Supervisor de counter** (operador de módulo aeropuerto) | Persona física en Puerta 1 | Validar QR, registrar walk-in, ver cola, presentar conductor | Panel web/tablet `/counter` | Secundario (diferencial LAP) |
| **Conductor** | Quien ejecuta el viaje | Recibir asignación clara, cambiar estados, navegar | **App nativa RN+Expo** | Protagonista de ejecución |
| **Empresa cliente** | Hotel/corporativo que paga | Reporte y facturación sin perseguir | Panel `/empresa` | **Solo enunciado** en demo |
| **Taxi Green central / gerencia** | Operación y dirección | Trazabilidad, métricas reales | Panel `/admin` (reportes) | Enunciado |

`Contradicción resuelta`: `PROBLEMA_ordenado` recomienda no abusar de "supervisor" y llamarlo **operador de módulo / despachador de aeropuerto**. La demo conserva el rótulo "Supervisor de counter" por familiaridad, pero su **rol es de operador de módulo**: valida, registra venta, ve cola, presenta conductor, resuelve en el punto físico. No solo "escanea QR".

---

## 2. Canales de entrada (jerarquizados)

`Hecho` (PLAN_SOFTWARE §1, Redirección 3) + `Evidencia directa` (PROBLEMA §4: *"WhatsApp es la puerta de entrada al sistema"*):

| Prioridad | Canal | Cómo entra | Estado demo |
|---|---|---|---|
| **1** | **WhatsApp** | Hotel/pasajero escribe en lenguaje natural; el copiloto extrae | **Construir** (simulador `/wa-sim`) |
| **2** | **Hotel / concierge** | Variante de WhatsApp: el hotel pide por el huésped. El hotel es **solicitante**, no punto de recojo | **Construir** (es el caso del guion) |
| **3** | **Counter aeropuerto** | Walk-in presencial o validación de QR | **Construir** (`/counter`) |
| **4** | **Llamada / correo** | Operador transcribe (asistido por LLM en MVP) | **Enunciar** |
| **5** | **Web pública** | Landing → CTA `wa.me` con mensaje prearmado. **Sin formulario** | **Construir básico** (solo landing) |

> **Regla dura:** la web pública **no es un formulario de reserva**. El link `/p/[token]` aparece **después** de creada la reserva, como superficie de **tracking / voucher / comprobante / bienestar**. `Contradicción resuelta` con `DISEÑO_UI_DETALLADO` (que detalla un wizard 1.B–1.E de reserva del pasajero): ese wizard se degrada a ruta de autoservicio secundaria, fuera del flujo protagonista.

---

## 3. Flujo protagonista (demo, 12 min) — Recojo en aeropuerto: Aeropuerto → Miraflores

Es la **variante 2A** de `PROBLEMA_ordenado` (reserva previa), iniciada por el hotel vía WhatsApp. El hotel solicita; el pasajero final viaja desde el aeropuerto hacia Lima.

```
1.  Hotel escribe por WhatsApp: "Huésped llega mañana 3:45am, vuelo LATAM 2456,
    2 personas, destino Av. Pardo 123, Miraflores. Recojo en Salida 3, columna F2."
2.  Copiloto extrae: canal=whatsapp, tipo_viaje=recojo_aeropuerto, solicitante=hotel,
    origen=Aeropuerto Jorge Chávez, punto_encuentro=Salida 3 columna F2,
    destino=Av. Pardo 123 Miraflores, vuelo=LA2456, hora=03:45, pax=2.
    → Detecta si FALTAN: dirección exacta, nombre del pasajero, correo.
    NO inventa: pide de vuelta en el canal.
3.  Hotel completa datos. Copiloto arma BORRADOR de reserva (no despacha solo).
4.  Operador (Carla) ve el borrador en /admin. El copiloto SUGIERE conductor+unidad
    con razón explicable. Carla APRUEBA (o cambia). → reserva CONFIRMADA + ASIGNADA.
5.  Voucher con QR + link /p/[token] se devuelven al hotel por el mismo canal.
6.  Conductor recibe push en su app nativa → ve DriverCard del viaje → ACEPTA.
7.  Pasajero (o el hotel) abre /p/[token]: ve conductor (foto, nombre, placa,
    marca/modelo, tipo, foto auto, valoración), mapa, ETA, punto de encuentro.
8.  Conductor: En camino al aeropuerto → Llegué a Salida 3, columna F2
    → (pasajero confirma "Ya lo vi") → A bordo.
9.  Viaje hacia Av. Pardo 123, Miraflores. Tracking en vivo en /p/[token].
10. Doble confirmación: pasajero "llegué" + conductor "servicio atendido"
    → reserva FINALIZADA → estado "por liquidar".
11. Comprobante (boleta/factura) emitido y enviado.
12. Calificación TRIPLE: servicio, conductor, unidad.
13. [Arco corto] Pasajero reporta objeto olvidado en el mismo link → conductor
    recibe push → "Sí, encontré" → opciones de entrega → constancia → cierre.
```

`Recomendación`: contar la historia por **3 actores en una línea de tiempo** (hotel → operador → conductor → pasajero) + arco corto de incidencia. **Demo por flujo, no por pantalla.**

---

## 4. Flujo secundario (demo, 3 min) — Counter walk-in: Aeropuerto → destino en Lima

Rescata el **corazón operativo perdido** (`PROPUESTA_DEMO` §6 + `PROBLEMA_ordenado` §2.4, variante 2B):

```
VARIANTE 2A (con reserva):  Pasajero llega → muestra QR → supervisor escanea
   → valida contra backend (HMAC) → ve datos → presenta conductor de la cola.

VARIANTE 2B (walk-in, sin reserva):  Pasajero llega al módulo → supervisor
   registra destino + tipo de unidad → sistema calcula tarifa → comprobante
   → CONSULTA LA COLA DE CONDUCTORES → asigna el siguiente (o el recomendado)
   → presenta el conductor al pasajero → módulo queda libre para el siguiente.
```

> **No eliminar el counter ni la cola.** `Evidencia directa` (PROBLEMA): *"avisan al conductor que está en cola, porque es así, en cola."* La asignación en aeropuerto **no es Uber** (el más cercano gana); es **cola + tipo de unidad + capacidad + reglas**. Esto es lo que ningún Uber puede ofrecer y justifica cobrar más.

`Recomendación` demo: mostrar la **variante 2B (walk-in)** como secundaria, porque demuestra la digitalización de una operación física ya existente. La 2A (QR) se enuncia o se muestra en 1 pantalla.

---

## 5. Flujo de incidencia (demo, 2 min) — Objeto olvidado

`Hecho` (PLAN_SOFTWARE §2.1 + visión perfecta §3.bis.3): única tipología construida en demo.

```
Pasajero (≤24h, en el mismo /p/[token]): "¿Olvidaste algo?" → describe el objeto.
   El sistema YA SABE viaje, conductor, placa, hora. No re-pide datos.
→ Confirmación ≤5s con N° de caso + conductor identificado + SLA.
→ Push al conductor: "¿Encontraste una billetera azul?" [Sí] [No] [Revisar 5min].
→ Si Sí: ofrece 2 opciones de entrega concretas → pasajero elige → agenda.
→ Entra a la cola de **soporte de viaje / objeto olvidado** del operador
  (humano nombrado, no ticket frío).
→ Constancia digital al cierre + "¿quedó resuelto?" (si no, reabre y sube prioridad).
```

Las otras 9 tipologías (queja, seguridad, no-show, etc.) se **enuncian**; se construyen en MVP.

---

## 6. Estados

### 6.1 Estados de reserva

```
ingesta_pendiente   → el copiloto está extrayendo / faltan datos críticos
necesita_revision   → contradicción detectada (vuelo/hora no cuadran, RUC inválido)
confirmada          → datos completos, aún sin conductor/unidad
asignada            → conductor + unidad asignados (humano aprobó)
en_curso            → viaje iniciado
finalizada          → doble confirmación cruzada cumplida
por_liquidar        → sub-estado de finalizada: lista para procesar pago al conductor
cancelada           → cancelación pasajero/operador
```
> Enum demo de `PLAN_SOFTWARE §7.6`: `borrador, confirmada, asignada, en_curso, finalizada, cancelada`. Este documento añade `necesita_revision` (copiloto) y `por_liquidar` (sub-estado de cierre) como **semilla**: en demo son etiquetas visuales; en MVP son estados reales.

### 6.2 Estados de viaje

```
asignado → en_camino → en_punto (llegó) → a_bordo → finalizado
```
(Alineado con `PLAN_SOFTWARE §7.6`: `en_camino, llegada_punto, pasajero_a_bordo, finalizado`.)

### 6.3 Estados de comprobante

```
pendiente → emitido → anulado
```

### 6.4 Estados de incidencia

```
abierta → en_resolucion → resuelta → cerrada
   ↘ escalada (categorías sensibles: seguridad, queja grave — a humano)
   ↘ reabierta (si el pasajero responde "no quedó resuelto")
```

---

## 7. Eventos que disparan cada transición

| Evento | Actor | Transición |
|---|---|---|
| Mensaje entra por canal | Hotel/pasajero | → `ingesta_pendiente` |
| Copiloto detecta datos completos | Sistema | → `confirmada` (borrador) |
| Copiloto detecta contradicción | Sistema | → `necesita_revision` (sube en cola del operador) |
| Operador aprueba sugerencia / asigna | Operador | `confirmada` → `asignada` (+ emite voucher, push al conductor) |
| Conductor acepta | Conductor | habilita viaje `asignado` |
| Conductor "En camino" | Conductor | viaje `asignado` → `en_camino` (inicia tracking) |
| Conductor "Llegué" (GPS <100m) | Conductor | viaje `en_camino` → `en_punto` |
| Pasajero "Ya lo vi" | Pasajero | confirma encuentro |
| Conductor "Pasajero a bordo" | Conductor | viaje `en_punto` → `a_bordo`; reserva → `en_curso` |
| Conductor "Servicio atendido" **y** Pasajero "Llegué" | Ambos | doble confirmación → viaje `finalizado`, reserva `finalizada` → `por_liquidar` |
| Emisión de comprobante | Sistema | comprobante `pendiente` → `emitido` |
| Pasajero reporta objeto | Pasajero | incidencia → `abierta` |
| Operador toma el caso | Operador | `abierta` → `en_resolucion` |
| Conductor confirma hallazgo + entrega | Conductor | → `resuelta` |
| Pasajero confirma cierre | Pasajero | `resuelta` → `cerrada` (o `reabierta`) |

---

## 8. Datos mínimos por actor

| Actor | Datos mínimos |
|---|---|
| **Pasajero** | nombre y apellido, teléfono, correo (para comprobante), DNI o RUC (al pedir boleta/factura) |
| **Hotel/concierge** | nombre del hotel, contacto, datos del huésped que dicta |
| **Reserva** | canal, `tipo_viaje` (`recojo_aeropuerto`, `traslado_aeropuerto`, `city`), solicitante, pasajero final, origen físico, destino físico, fecha-hora, vuelo (si aplica), pax, equipaje, tipo de unidad, tipo de pago, tipo de comprobante, punto de encuentro |
| **Conductor** | **foto**, nombres completos, licencia, valoración, estado (libre/asignado/en cola/pausa), tiempo en cola |
| **Vehículo** | **placa, marca, modelo, tipo (sedán/camioneta/van), foto del auto**, capacidad, año/color |
| **Voucher** | código público, QR firmado (HMAC), punto de encuentro, vigencia, uso único |
| **Comprobante** | tipo, serie, correlativo, monto, datos del cliente, estado |
| **Incidencia** | tipología, severidad, descripción, reserva/conductor/vehículo vinculados, timeline, responsable, SLA |
| **Calificación** | **servicio (1-5), conductor (1-5), unidad (1-5)**, motivo si ≤3 |

> `Contradicción resuelta` con `SPRINT.md` v3 (S8: rating *"no crítico, solo guardar en notas"*). La calificación triple es **`Evidencia directa`** (pedido literal de Raúl) y es **barata visualmente**. Se re-prioriza a P0 visual; el backend la persiste en `jsonb` en demo y como tabla `calificaciones` en MVP (ver `LOGICA_NEGOCIO_OPERATIVA.md`).

---

## 9. Reglas de negocio

1. **Asignación separada conductor / unidad.** `Evidencia directa`: la misma unidad la conduce hoy uno, mañana otro (relación N:N en el tiempo). Se asignan por separado.
2. **Cola de conductores, no cercanía pura.** `Evidencia directa`. Score = posición en cola + cercanía + compatibilidad de unidad + capacidad − penalización por retrasos. GPS solo no basta.
3. **Humano en control.** El copiloto **sugiere**; el operador **confirma** asignación, factura corporativa y manejo de queja. `Hecho` (visión perfecta principio 2; PLAN regla 5).
4. **Doble confirmación cruzada para cerrar.** Pasajero "llegué" + conductor "atendí" → `por_liquidar`. `Evidencia directa`.
5. **Pago al conductor = "harina de otro costal".** `Evidencia directa` (Raúl): el cierre **prepara** la liquidación; no la ejecuta. La demo llega hasta `por_liquidar`.
6. **Tarifa cerrada** (no dinámica tipo Uber). `Inferencia` desde "tarifa cerrada"; `Por validar` si siempre es exacta o a veces estimada.
7. **Voucher/QR de un solo uso**, firmado HMAC, validación server-side. QR reusado → bloqueo idempotente.
8. **GPS y ETA reales.** `Evidencia directa` (Raúl exige): origen, destino, mapa, cálculo de km y ETA deben funcionar de verdad.
9. **Todo lo demás simulado.** `Evidencia directa`: pago, SUNAT, SMS, llamada — simulados en demo.
10. **Sesión asumida.** Conductor y pasajero ya registrados; el login es decorativo. `Evidencia directa`.
11. **Cero negación al usuario en bienestar.** Si no hay respuesta inmediata, "te respondemos en X min" y se cumple, con humano nombrado.

---

## 10. Excepciones

| Excepción | Manejo canónico | Demo |
|---|---|---|
| **Pasajero no aparece (no-show)** | Conductor "El pasajero no llegó" → operador contacta → política de espera/cargo | Enunciar (botón existe) |
| **Conductor no aparece** | Pasajero "No lo encuentro" → operador reasigna de la cola | Enunciar |
| **Vuelo retrasado** | Monitoreo (MVP); en demo, operador ajusta hora manualmente | Enunciar |
| **Cambio de destino** | Operador edita reserva antes de iniciar; recálculo de tarifa | Enunciar |
| **QR inválido / reusado** | Validación HMAC falla → mensaje claro + verificación manual con DNI | **Construir** (validación real) |
| **Objeto olvidado** | Flujo completo §5 | **Construir** |
| **Comprobante pendiente** | Estado `pendiente` visible; reintento de emisión | Mostrar estado |

---

## 11. Qué es demo, qué es MVP, qué es futuro

| Capacidad | Demo | MVP | Futuro |
|---|---|---|---|
| Flujo protagonista A→Z (hotel→aeropuerto→destino) | ✅ | ✅ | — |
| Counter walk-in (2B) + cola de conductores | ✅ visual | ✅ real | — |
| Counter validación QR (2A) | ✅ | ✅ | — |
| Casa → aeropuerto (salida) | Enunciar | ✅ | — |
| Asignación separada conductor/unidad | ✅ | ✅ | — |
| Sugerencia de asignación (copiloto) | ✅ con fallback determinista | ✅ completa | — |
| Doble confirmación cruzada | ✅ | ✅ | — |
| Calificación triple | ✅ visual + jsonb | ✅ tabla | — |
| DriverCard / VehicleCard completas | ✅ visual | ✅ datos reales | — |
| DriverHistorySummary con importes | ✅ mockup | ✅ liquidación real | Optimización |
| Comprobante (PDF SUNAT-like) | ✅ visual | ✅ Fenbo real | — |
| Objeto olvidado (1 tipología) | ✅ | ✅ + 2 más | 10 tipologías + predicción |
| Empresa cliente / reporte corporativo | Enunciar (1 lámina) | ✅ básico | Asistente conversacional |
| Pago real / SUNAT real / WhatsApp API real | Simular | ✅ | — |
| App pasajero nativa | ❌ | ❌ | Si una empresa la exige |
| SaaS multi-operador | ❌ | ❌ | Fase 3 condicional |

> `Recomendación` final: la **visión perfecta (copiloto de 5 caras + bienestar completo) es destino, no compromiso**. La demo prueba **un flujo bien hecho** + 3 wows verificables (canal del cliente, app conductor real, pasajero sin app) + el diferencial counter/cola.

---

*Fin. Documentos compañeros: `CONTRATO_NARRATIVO_DEMO.md` (guion), `ESPECIFICACION_PANTALLAS_PREMIUM.md` (pantallas y componentes), `MAPA_ALINEACION_PLAN_FIGMA.md` (matriz), `07_PLAN_EJECUCION/LOGICA_NEGOCIO_OPERATIVA.md` (entidades y reglas de importes).*

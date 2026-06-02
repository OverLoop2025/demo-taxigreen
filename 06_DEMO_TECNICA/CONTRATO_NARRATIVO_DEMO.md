# Contrato Narrativo de la Demo — Taxi Green

**Versión:** 1.0
**Fecha:** 2026-05-29
**Estado:** contrato de narrativa. Define el guion de 12 minutos, el orden exacto de pantallas, qué debe entender Taxi Green en cada momento, qué emoción debe generar, y qué se construye / se simula / se enuncia. Subordinado a `FLUJO_NEGOCIO_CANONICO.md`.
**Regla madre:** una sola ruta protagonista. El Figma **vende una narrativa, no lista pantallas**.

**IDs de pantalla:** los `id` entre comillas (`pwa.passenger.1A`, etc.) corresponden a `figma-plugin-taxigreen-master/code.js` / `screens.master.json`. Donde una pantalla deba **crearse o reforzarse**, se marca `[NUEVA]` o `[REFORZAR]`.

---

## 0. Principio narrativo

La demo no demuestra un producto completo. **Cuenta una historia**: cómo un pedido caótico por WhatsApp se convierte en una operación ordenada, trazable y humana, sin que nadie teclee de más, sin que el pasajero instale nada, y con un humano siempre al mando.

Tres golpes (wows) verificables:
1. **El canal del cliente manda** — el copiloto entiende el WhatsApp del hotel.
2. **La app del conductor es real** — push, mapa, botones grandes, app nativa.
3. **El pasajero no instala nada** — abre un link y ve todo.

Y un diferenciador que ningún Uber puede mostrar: **la operación física del aeropuerto** (cola + counter) y **el bienestar con humano nombrado**.

### 0.1 Cierre operativo del caso

El caso protagonista no es "hotel → aeropuerto". Es:

```text
Hotel/concierge solicita por WhatsApp
  → pasajero final llega al Aeropuerto Jorge Chávez
  → Taxi Green lo recoge en Salida 3, columna F2
  → destino Av. Pardo 123, Miraflores
```

El hotel es **solicitante/canal**, no punto de recojo. El pasajero final está físicamente en el aeropuerto al momento de iniciar el viaje. La variante ciudad/hotel/casa/oficina → aeropuerto se nombra **Traslado hacia aeropuerto** y no protagoniza esta demo.

---

## 1. Guion de 12 minutos (+ 3 counter + 2 incidencia = 17 min total)

| Min | Bloque | Pantalla(s) | Qué debe ENTENDER Taxi Green | Qué debe SENTIR |
|---|---|---|---|---|
| 0:00–0:45 | **Apertura / promesa** | `00 Cover` | "No es una app tipo Uber. Es la digitalización de SU operación, respetando 25 años." | Respeto, seriedad ejecutiva |
| 0:45–1:15 | **Mapa de la demo** | `13 Prototype` → "Iniciar por canal" | "Vamos a ver UN flujo de punta a punta, no un tour de pantallas." | Claridad, control |
| 1:15–2:00 | **El canal real** | `pwa.passenger.1A` Entrada multicanal | "El cliente entra por donde ya está: WhatsApp, hotel, counter, web. En este guion el hotel solicita; el recojo físico es en aeropuerto." | "Esto entiende cómo trabajamos" |
| 2:00–3:30 | **WhatsApp + copiloto** | `whatsapp.12A` → `12B` | "El copiloto lee el WhatsApp del hotel solicitando recojo en Jorge Chávez, extrae los datos, **detecta lo que falta y lo pide. No inventa.**" | Asombro tranquilo ("no tecleó nada") |
| 3:30–4:15 | **Voucher por el canal** | `whatsapp.12C` | "Se devuelve voucher + QR + link por el mismo WhatsApp. El huésped que llega a Lima ya tiene reserva verificable sin app." | Fluidez |
| 4:15–6:00 | **Humano en control** | `dispatch.3C` Aprobación `[REFORZAR]` | "El copiloto **sugiere** conductor+unidad con motivo explicable. **Carla aprueba.** La IA no despacha sola." | Confianza ("el humano manda") |
| 6:00–7:00 | **App del conductor** | `driver.2C` → `driver.2D` | "El conductor recibe push, ve que debe ir al Aeropuerto Jorge Chávez, acepta con dos taps. App de trabajo real, no PWA frágil." | "Mis conductores sí usarían esto" |
| 7:00–9:00 | **Pasajero sin app** | `pwa.passenger.1G2` `[REFORZAR]` → `1G3` → `1G4` | "El pasajero final abre un link y ve **foto del conductor, nombre, placa, marca/modelo, tipo, foto del auto, valoración**, mapa, ETA y punto de encuentro Salida 3, columna F2." | Tranquilidad premium |
| 9:00–10:00 | **Cierre + comprobante + calificación triple** | `pwa.passenger.1G5` `[REFORZAR]` | "Doble confirmación cierra el viaje. Comprobante automático. **Califica servicio, conductor y unidad por separado.**" | Cierre limpio |
| 10:00–11:30 | **Soporte de viaje / objeto olvidado** | `wellbeing.13A` → `13B` → `13F` → `13G` → `13H` → `13K` | "Si olvida algo, lo reporta en el mismo link. **Un humano nombrado** lo atiende, el conductor confirma, hay constancia." | "Esto vale más que un Uber" |
| 11:30–12:00 | **Cierre comercial** | `00 Cover` / lámina anzuelo | "Esto se construye por fases. El día que quieran multi-empresa, ya está sembrado." | Deseo de avanzar |

### Ruta secundaria — Counter aeropuerto (3 min, si hay tiempo o lo piden)

| Pantalla | Qué se explica |
|---|---|
| `13 Prototype` → "Iniciar counter" | "Caso del pasajero que llega al aeropuerto sin WhatsApp." |
| `counter.4A` → `counter.4B` | "El supervisor ve vuelos y **la cola de conductores**." |
| `counter.4C` Crear reserva manual (walk-in 2B) `[REFORZAR]` | "Venta en el módulo: Aeropuerto → destino en Lima + tipo de unidad + tarifa + comprobante." |
| `counter.10B` / asignación desde cola | "Se asigna **el siguiente en cola**, no el más cercano. Eso es lo que ningún Uber puede hacer." |
| → `dispatch.3C` | "El counter alimenta el mismo despacho. No es otro sistema." |

> **No mostrar las dos rutas como protagonistas.** La principal es WhatsApp/hotel. El counter es el golpe diferencial de respaldo.

---

## 2. Orden exacto de pantallas (ruta protagonista)

```
00 Cover
 └─ 13 Prototype  ["Iniciar por canal"]
     └─ pwa.passenger.1A   (Entrada multicanal)
         └─ whatsapp.12A   (Mensaje incompleto — el copiloto pide lo que falta)
             └─ whatsapp.12B   (Datos completos — borrador + sugerencia)
                 └─ whatsapp.12C   (Reserva creada — voucher + QR + link)   [REFORZAR: momento voucher]
                     └─ dispatch.3C   (Operador aprueba sugerencia)   [REFORZAR: dualidad IA/humano]
                         └─ driver.2C   (Conductor: nueva asignación)
                             └─ driver.2D   (Conductor: en camino → "Enviar tracking")
                                 └─ pwa.passenger.1G2   (Conductor asignado)   [REFORZAR: DriverCard+VehicleCard completas]
                                     └─ pwa.passenger.1G3   (Conductor llegó)
                                         └─ pwa.passenger.1G4   (En viaje)
                                             └─ pwa.passenger.1G5   (Finalizado + comprobante + RatingTripleCard)   [REFORZAR]
                                                 └─ wellbeing.13A   (Reportar objeto olvidado)
                                                     └─ wellbeing.13B   (Reporte recibido — SLA + humano)
                                                         └─ wellbeing.13F   (Cola de bienestar del operador)
                                                             └─ wellbeing.13G   (Resolución)
                                                                 └─ wellbeing.13H   (Conductor confirma hallazgo)
                                                                     └─ wellbeing.13K   (Constancia PDF)
```

### Correcciones de cableado obligatorias (de `AUDITORIA_FIGMA_WOW`)

| Problema actual | Corrección |
|---|---|
| `12.C` queda sin inbound; se pierde el momento voucher | Insertar `12.B → 12.C → dispatch.3C` en la cadena principal |
| `1.G2 "Reportar algo" → 13.D` (queja) rompe el viaje | En el flujo protagonista, `1.G2` avanza a `1.G3`; el reporte va al final (`1.G5 → 13.A`) |
| `driver.2D → 1.G5` salta tracking | `driver.2D → 1.G2` (enviar tracking), el pasajero recorre `1G2→1G3→1G4→1G5` |
| `driver.2G → driver.2B` cierra en el conductor | El cierre comercial vive en el pasajero (`1.G5`); `2.G` puede volver a `2.B` solo en la ruta conductor aislada |
| `wellbeing.13G → 13C` salta de desktop a mobile sin rótulo | Rotular "Vista del pasajero" + microcopy; preferir `13G → 13H → 13K` |
| Acciones secundarias con peso igual al primario | Una sola acción primaria por pantalla (ver §4) |

---

## 3. Qué se construye, qué se simula, qué solo se enuncia (en la demo)

> Esta tabla es **contrato con el cliente**: se le dice de frente. La credibilidad se pierde si algo simulado se presenta como real.

### Se construye (real)
- Simulador WhatsApp `/wa-sim` con extracción (LLM real + fallback determinista visible).
- Voucher + QR firmado HMAC; validación real en counter.
- Panel `/admin` con aprobación humana y sugerencia explicable.
- App conductor nativa (RN+Expo): push, mapa, estados, botones grandes.
- Link `/p/[token]`: tracking, DriverCard/VehicleCard, comprobante, calificación triple, reporte.
- Counter `/counter` con escaneo QR por cámara + walk-in.
- 1 incidencia (objeto olvidado) E2E.
- Comprobante PDF estilo SUNAT (visual).
- GPS / mapa / ETA / cálculo de km **reales** (exigencia de Raúl).

### Se simula (declarado)
- WhatsApp Business API (lo cubre `/wa-sim`).
- Pasarela de pago (UI + animación + check).
- Emisión SUNAT real (PDF look-and-feel).
- SMS / llamada (toast).
- LLM puede desconectarse y el fallback determinista responde (se muestra el badge 🤖/⚙️).

### Se enuncia (no se construye)
- **Traslado hacia aeropuerto** (ciudad/hotel/casa/oficina → Jorge Chávez).
- Empresa cliente / reporte corporativo (1 lámina anzuelo).
- 9 tipologías restantes de bienestar.
- Liquidación real al conductor (el `DriverHistorySummary` se muestra como mockup).
- App pasajero nativa, biometría, OCR, integración LAP/ATU, SaaS multi-operador.

---

## 4. Una sola acción primaria por pantalla (contrato de claridad)

| Pantalla | Acción PRIMARIA | Acción secundaria permitida |
|---|---|---|
| `1.A` Entrada multicanal | **Comenzar por WhatsApp** | (link de texto) "Ya tengo reserva → abrir link" |
| `12.A` Mensaje incompleto | **Pedir el dato que falta** | — |
| `12.B` Datos completos | **Aprobar y crear reserva** | "Editar" (ghost) |
| `12.C` Reserva creada | **Ver en despacho** | "Compartir voucher" (ghost) |
| `3.C` Aprobación | **Aprobar y enviar a Juan** | "Asignar otro" (ghost, abre selector) |
| `2.C` Nueva asignación | **Aceptar viaje** | "Rechazar" (ghost, pide motivo) |
| `2.D` Camino al pasajero | **Enviar tracking al pasajero** | "Llamar" (ghost) |
| `1.G2` Conductor asignado | **(pasiva: observar)** + "Simular llegada" en modo demo | "Compartir mi viaje" (secondary) |
| `1.G3` Conductor llegó | **Ya lo vi** | "No lo encuentro" (care) |
| `1.G5` Finalizado | **Enviar calificación** (triple) | "Olvidé algo" (care) |
| `13.A` Objeto perdido | **Enviar reporte** | — |
| `13.G` Resolución | **Contactar conductor** | "Marcar resuelto" se habilita **después** de la confirmación del conductor |

> Donde hoy hay 2-3 botones equivalentes, **degradar visualmente** los secundarios (ghost / link) para que el ojo encuentre una sola acción.

---

## 5. Notas para el presentador

- **Empezar siempre en `13 Prototype`** con "Iniciar por canal". No abrir páginas sueltas.
- **No abrir múltiples tabs.** Todo guionado.
- **No comparar con Uber explícitamente.** Decir "transporte programado premium" / "operación formal trazable".
- Si preguntan por IA: mostrar el **fallback determinista en vivo** (badge ⚙️) — "si la IA falla, el sistema sigue".
- Si preguntan por Mongo/microservicios: argumentación lista en `PLAN_SOFTWARE §7.3` (concesión digerible).
- **Video de respaldo grabado** la noche anterior (plan B si la red falla).
- El momento de bienestar es el cierre emocional: **bajar el ritmo ahí**, es donde se gana el "esto vale más que un Uber".

---

*Fin. Las pantallas y componentes se detallan en `ESPECIFICACION_PANTALLAS_PREMIUM.md`. La alineación con el Figma actual está en `MAPA_ALINEACION_PLAN_FIGMA.md`.*

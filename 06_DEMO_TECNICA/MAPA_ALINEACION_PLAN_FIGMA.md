# Mapa de Alineación Plan ↔ Figma — Taxi Green

**Versión:** 1.1
**Fecha:** 2026-05-30
**Estado:** matriz de auditoría que cruza cada requisito del plan/visión/evidencia contra el estado real del Figma (`figma-plugin-taxigreen-master/code.js`, `screens.master.json`) y define acción + prioridad. Incluye revisión semántica post-Figma del flujo físico.
**Leyenda de estado:** `cumple` · `parcial` · `no cumple` · `contradice`.
**Prioridad:** **P0** = indispensable para la demo protagonista de 12 min · **P1** = refuerza el wow · **P2** = pulido / secundario.

> Fuentes de requisito: `FLUJO_NEGOCIO_CANONICO.md`, `CONTRATO_NARRATIVO_DEMO.md`, `ESPECIFICACION_PANTALLAS_PREMIUM.md`, `PLAN_SOFTWARE.md` v4.0, `00_EVIDENCIA_REAL`.

## 0. Revisión post-Figma — flujo físico cerrado

| # | Requisito | Estado post-Figma | Evidencia | Acción |
|---|---|---|---|---|
| D0 | El flujo protagonista debe ser **Recojo en aeropuerto**: Aeropuerto Jorge Chávez → Av. Pardo 123, Miraflores | **cumple con aclaración documental** | Ruta A-Z validada en `VALIDACION_CABLEADO.md`; glosario y contrato en `08_SOFTWARE_PRODUCTO` | Mantener hotel/concierge como solicitante por WhatsApp; no usarlo como origen físico |
| D1 | Counter debe ser ruta secundaria **Aeropuerto → destino en Lima** | **cumple con aclaración documental** | `counter.4C → dispatch.3C` y README del plugin | Rotular como `Counter walk-in` |
| D2 | Objeto olvidado debe ser soporte del viaje, no app separada | **cumple** | `wellbeing.13A → 13K` después de `1G5` | Usar "Soporte de viaje / objeto olvidado" en prompts |

---

## 1. Narrativa y estructura

| # | Requisito del plan | Evidencia en Figma actual | Archivo / pantalla | Estado | Acción recomendada | Prio |
|---|---|---|---|---|---|---|
| N1 | UN flujo protagonista A→Z (no 3 equivalentes) | `validation.requiredProtagonistPath` fija la ruta A-Z y `13 Prototype` jerarquiza apoyos | `screens.master.json`, `README.md`, `VALIDACION_CABLEADO.md` | **cumple** | Mantener counter y bienestar como rutas de apoyo visualmente subordinadas | **P0** |
| N2 | Demo arranca por canal (no por PWA pasajero) | `1.A Entrada multicanal` existe y es inicio | `pwa.passenger.1A` | **cumple** | Mantener; reforzar arte (canales como tarjetas claras) | P1 |
| N3 | Portada vende concepto ejecutivo | `00 Cover` resumen, no venta dramatizada | `code.js` cover | **parcial** | Reescribir portada: promesa + alcance real/simulado/aplazado | P1 |
| N4 | `13 Prototype` = mapa narrativo de 12 min | Ruta A-Z validada como protagonista; counter queda como apoyo | `code.js` prototype page + validación local | **cumple** | Revisar visualmente en Figma Desktop que el peso relativo se perciba como 70/30 | **P0** |
| N5 | Una sola acción primaria por pantalla | Varias con 2-3 acciones equivalentes | múltiples (`1.A`, `13.G`, etc.) | **parcial** | Degradar secundarias a ghost/link (ver `CONTRATO §4`) | **P0** |

## 2. Cableado (prototype wiring)

| # | Requisito | Evidencia actual | Pantalla | Estado | Acción | Prio |
|---|---|---|---|---|---|---|
| W1 | `12.B → 12.C → dispatch.3C` (no perder voucher) | Edge validado por script local | `VALIDACION_CABLEADO.md` | **cumple** | Mantener voucher como momento narrativo obligatorio | **P0** |
| W2 | `driver.2D → 1.G2` (enviar tracking, no saltar al cierre) | `driver.2D → pwa.passenger.1G2` ya existe; pero `2D` también ofrece continuar | `driver.2D` | **parcial** | Dejar "Enviar tracking" como primaria → `1.G2` | P1 |
| W3 | Pasajero recorre `1G2→1G3→1G4→1G5` | Edge validado por script local; reporte ocurre después de `1.G5` | `VALIDACION_CABLEADO.md` | **cumple** | Mantener objeto olvidado como arco posterior al cierre | **P0** |
| W4 | Cierre comercial vive en el pasajero | `driver.2G → driver.2B` cierra en conductor | `driver.2G` | **parcial** | `2.G` cierra solo en ruta conductor aislada; protagonista cierra en `1.G5` | P1 |
| W5 | `13.G → 13.H → 13.K` con rótulos claros | Edge validado por script local | `VALIDACION_CABLEADO.md` | **cumple** | Confirmar visualmente rótulos al ejecutar plugin en Figma | P1 |
| W6 | Counter alimenta el mismo despacho | `counter.4C → dispatch.3C` existe | `counter.4C` | **cumple** | Mantener | P2 |

## 3. Componentes premium (datos nuevos)

| # | Requisito (componente) | Evidencia actual | Pantalla | Estado | Acción | Prio |
|---|---|---|---|---|---|---|
| C1 | **DriverCard**: foto, nombre completo, placa, valoración | Texto plano "Toyota Yaris blanco – ABC-123"; visual `"driver"` simple | `code.js:558`, `1.G2/1.G3/2.C/3.C` | **no cumple** | Crear componente DriverCard con foto + nombre completo + ★valoración | **P0** |
| C2 | **VehicleCard**: foto del auto, marca, modelo, tipo, placa | No existe ficha de vehículo con foto/tipo | `1.G2`, `2.C`, `3.C` | **no cumple** | Crear VehicleCard (foto 16:9 + marca/modelo + badge tipo + placa) | **P0** |
| C3 | **RatingTripleCard**: servicio/conductor/unidad | Chips `["1".."5"]` simple | `pwa.passenger.1G5` | **contradice** | Reemplazar por 3 ejes de estrellas + motivo si ≤3 | **P0** |
| C4 | **DriverHistorySummary**: atendidos, cobrados, pendientes, facturado, neto, comisión | `2.H`/`3.E` muestran solo "viajes + tarifa" | `driver.2H`, `dispatch.3E` | **no cumple** | Crear resumen con 6 importes (mockup demo) | **P1** |
| C5 | **AssignmentApprovalPanel**: sugerencia + motivo + badge fuente | `3.C` tiene aprobación, sin dualidad IA/humano fuerte | `dispatch.3C` | **parcial** | Reforzar: motivo explicable + score + badge 🤖/⚙️ | **P0** |
| C6 | **WhatsAppCopilotDualPanel**: chat + cocina copiloto | `12.B` muestra chat + extracción, dualidad débil | `whatsapp.12B` | **parcial** | Reforzar layout dual + banner transparencia | **P0** |
| C7 | **VoucherQR realista** | Voucher declarativo (texto) | `12.C`, `1.F`, `1.G5` | **parcial** | QR con módulos reales + punto encuentro + sello | **P1** |
| C8 | **PassengerTrackingLink** (header sobrio sin app) | Header genérico de pasajero | `1.G2`–`1.G5` | **parcial** | Header link `/p/[token]` premium, sin nav app | P1 |
| C9 | **TripStatusTimeline** | Estados implícitos, sin timeline unificado | viaje + incidencia | **parcial** | Componente timeline reutilizable | P1 |
| C10 | **IncidentResolutionPanel** | `13.G` tiene timeline + panel | `wellbeing.13G` | **cumple** | Pulir microcopy humano | P2 |
| C11 | **DriverQueueList** (cola de conductores) | Solo chip "Cola 47 min" | `driver.2B`, `counter.*` | **no cumple** | Crear lista de cola ordenada por tiempo en cola + tipo unidad | **P1** |

## 4. Lógica de negocio (evidencia real)

| # | Requisito | Evidencia actual | Pantalla | Estado | Acción | Prio |
|---|---|---|---|---|---|---|
| L1 | Cola de conductores como corazón del aeropuerto | Subrepresentada (chip) | counter / despacho | **no cumple** | Hacer la cola hero en counter (walk-in 2B) | **P1** |
| L2 | Walk-in sin reserva (variante 2B) | `counter.4C` crea reserva manual, sin tarifa/cola explícita | `counter.4C` | **parcial** | Añadir tarifa calculada + asignación desde cola | P1 |
| L3 | Asignación separada conductor / unidad | `3.E` muestra conductor+placa juntos | `dispatch.3C/3E` | **parcial** | Mostrar conductor y unidad como selecciones separadas | P1 |
| L4 | Doble confirmación cruzada (pasajero + conductor) | Cierre simple, sin cruce visible | `1.G5`, `2.G`, `3.x` | **parcial** | Mostrar el cruce en panel operador → "por liquidar" | P1 |
| L5 | Humano aprueba (IA no despacha sola) | `3.C` aprobación existe | `dispatch.3C` | **cumple** | Reforzar con badge fuente (ver C5) | P0 |
| L6 | GPS / ETA / mapa reales | Mapa = retícula abstracta | todos los mapas | **parcial** | Mapa creíble (agua, vías, ruta, halo conductor) | **P0** |
| L7 | Punto de encuentro físico prominente | Texto secundario | `1.G2/1.G3`, voucher | **parcial** | Tarjeta prominente "Salida 3, columna F2" | P1 |

## 5. Alcance y honestidad

| # | Requisito | Evidencia actual | Pantalla | Estado | Acción | Prio |
|---|---|---|---|---|---|---|
| A1 | Empresa cliente se enuncia, no protagoniza | Página `09` completa (8 pantallas) | `09 Empresa Cliente` | **contradice** | Reducir a 1 lámina-anzuelo; sacar del recorrido | **P0** |
| A2 | Wizard reserva pasajero NO es entrada protagonista | `1.B–1.E` presentes como flujo | `pwa.passenger.1B–1E` | **parcial** | Degradar a ruta "web/autoservicio" secundaria | P1 |
| A3 | Bienestar demo = 1 tipología (objeto olvidado) | `13.D` queja, `13.E` seguridad como pares | `11 Bienestar` | **parcial** | Objeto olvidado protagonista; resto enunciado | P1 |
| A4 | Construido/simulado/aplazado declarado | Portada no lo dramatiza | `00 Cover`, `13 Prototype` | **parcial** | Banda explícita en portada y prototype | P1 |
| A5 | App conductor = nativa (no "PWA conductor") | Guía/diseño la llaman PWA | microcopy Figma | **parcial** | Ajustar rótulos a "app del conductor" | P2 |

## 6. Identidad visual (paleta Qorinti)

| # | Requisito | Evidencia actual | Estado | Acción | Prio |
|---|---|---|---|---|---|
| V1 | Evaluar paleta Qorinti (#0B0952 / #227FDE / blanco), verde descartado | Figma usa verde `brand/*` en toda la UI | **contradice** | Adoptar sistema dual: azul Qorinti = chrome del producto; verde = solo logo/chip Taxi Green (ver `ESPECIFICACION §7`). Validar con cliente | **P0** |
| V2 | Premium, sobrio, ejecutivo | Tarjetas genéricas, mapas abstractos | **parcial** | Jerarquía por densidad, sombras finas, mapas creíbles | **P0** |
| V3 | Color = significado | Semánticos presentes | **cumple** | Conservar success/warning/danger/care | P2 |

---

## 7. Resumen de prioridades

**P0 (bloqueantes de la demo protagonista) — estado post-Figma:**
Resueltos por la generación master o por contrato documental: N1, N4, W1, W3, W5, D0, D1, D2.
Pendientes de verificación visual al ejecutar en Figma: N5, C1, C2, C3, C5, C6, L6, A1, V1, V2.
> En una frase: **el sentido del flujo ya está cerrado como Recojo en aeropuerto; queda validar percepción visual, componentes premium y jerarquía en Figma Desktop.**

**P1 (refuerzan el wow) — 14 ítems:**
N2, N3, W2, W4, W5, C4, C7, C8, C9, C11, L1, L2, L3, L4, L7, A2, A3, A4.

**P2 (pulido) — resto:**
W6, C10, A5, V3.

---

*Fin. La acción concreta de construcción por sprint se ajusta en `07_PLAN_EJECUCION/SPRINT.md`; la lógica de datos en `07_PLAN_EJECUCION/LOGICA_NEGOCIO_OPERATIVA.md`.*

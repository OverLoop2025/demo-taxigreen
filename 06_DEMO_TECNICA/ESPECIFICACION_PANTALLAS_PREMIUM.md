# Especificación de Pantallas Premium — Taxi Green

**Versión:** 1.0
**Fecha:** 2026-05-29
**Estado:** especificación de diseño para llevar el Figma de "blueprint" a "producto premium, sobrio, ejecutivo e intuitivo". Subordinada a `FLUJO_NEGOCIO_CANONICO.md` y `CONTRATO_NARRATIVO_DEMO.md`. Complementa (no reemplaza) `DISEÑO_UI_DETALLADO.md`: aquí se corrige lo que el plan dejó débil y se especifican los **componentes premium** y los **datos nuevos** pedidos.
**Norte estético:** **premium · sobrio · ejecutivo · clarísimo · una sola acción primaria por pantalla.** Menos cajas, más jerarquía. Datos reales, no listas de texto.

---

## 0. Los 4 principios visuales que separan "producto" de "blueprint"

1. **Una sola acción primaria por pantalla.** Lo demás es ghost/link. (`DISEÑO_UI §0.1`.)
2. **Lo importante es grande; lo accesorio, chico.** Sin grises decorativos. La foto del conductor, el ETA y la placa dominan; el resto respira.
3. **Datos reales con formato, no bullets.** Una DriverCard no es una lista "Nombre: …, Placa: …"; es una ficha con foto, jerarquía tipográfica y monoespaciado tabular en placa/importe.
4. **Mapas creíbles, no retículas.** Agua/costa, vías, ruta con polilínea, pin de aeropuerto, halo del conductor. El mapa debe "sentirse" GPS real.

### 0.1 Lenguaje operativo obligatorio

La UI de la demo debe nombrar el flujo como **Recojo en aeropuerto**: Aeropuerto Jorge Chávez → Av. Pardo 123, Miraflores. El hotel/concierge aparece como **solicitante** por WhatsApp, no como origen físico. El pasajero final está en el aeropuerto al momento del recojo.

Microcopy base:

| Concepto | Texto recomendado |
|---|---|
| Tipo protagonista | Recojo en aeropuerto |
| Origen físico | Aeropuerto Jorge Chávez · Llegadas |
| Punto de encuentro | Salida 3, columna F2 |
| Destino | Av. Pardo 123, Miraflores |
| Hotel/concierge | Solicitante |
| Flujo inverso no protagonista | Traslado hacia aeropuerto |
| Incidencia | Soporte de viaje / objeto olvidado |

No usar "hotel → aeropuerto" como historia principal ni "pasajero en hotel" en pantallas del flujo protagonista.

---

## 1. Pantallas hero prioritarias (orden de inversión de pulido)

| # | Pantalla | Por qué es hero | Componentes que la hacen premium |
|---|---|---|---|
| H1 | `whatsapp.12B` Datos completos | Wow #1: canal del cliente + copiloto | **WhatsAppCopilotDualPanel** |
| H2 | `dispatch.3C` Aprobación | "Humano en control" | **AssignmentApprovalPanel** + DriverCard + VehicleCard |
| H3 | `pwa.passenger.1G2` Conductor asignado | Wow #3: pasajero sin app | **DriverCard + VehicleCard + PassengerTrackingLink + mapa** |
| H4 | `driver.2C` Nueva asignación | Wow #2: app conductor real | Tarjeta de viaje grande + countdown |
| H5 | `pwa.passenger.1G5` Cierre | Comprobante + calificación triple | **VoucherQR + RatingTripleCard** |
| H6 | `wellbeing.13G` Resolución | Diferenciador soporte de viaje | **IncidentResolutionPanel + TripStatusTimeline** |
| H7 | `dispatch.3E` Conductores / Historial | Pedido nuevo: importes | **DriverHistorySummary** |
| H8 | `counter.4C` Walk-in + cola | Diferencial LAP | **Cola de conductores** (ver §3.K) |

---

## 2. Información obligatoria, acción primaria y secundaria por pantalla hero

### H1 — `whatsapp.12B` Datos completos
- **Obligatorio:** panel izquierdo (chat WhatsApp del hotel como **solicitante**) + panel derecho ("cocina del copiloto": campos extraídos uno a uno, confianza con color, badge 🤖 IA / ⚙️ Algoritmo, lista de "lo que falta"). Deben verse `tipo_viaje=recojo_aeropuerto`, origen Aeropuerto Jorge Chávez, punto Salida 3 columna F2 y destino Av. Pardo 123, Miraflores. Banner de transparencia: "Borrador. Nada se despacha sin aprobación humana."
- **Primaria:** **Aprobar y crear reserva**. **Secundaria:** Editar campo (inline).

### H2 — `dispatch.3C` Aprobación humana
- **Obligatorio:** datos de reserva (solicitante hotel, pasajero final, vuelo, ruta Aeropuerto → Miraflores, tarifa) + **AssignmentApprovalPanel** con conductor sugerido (DriverCard compacta), motivo explicable, score, badge fuente.
- **Primaria:** **Aprobar y enviar a [conductor]**. **Secundaria:** Asignar otro (abre selector de cola).

### H3 — `pwa.passenger.1G2` Conductor asignado
- **Obligatorio:** **DriverCard completa + VehicleCard** (ver §3), mapa en vivo, ETA, **punto de encuentro físico prominente "Salida 3, columna F2"**, PassengerTrackingLink para el pasajero final que está llegando al aeropuerto.
- **Primaria:** (observar) / "Simular llegada" en modo demo. **Secundaria:** Compartir mi viaje.

### H4 — `driver.2C` Nueva asignación
- **Obligatorio:** recoger en X min en Aeropuerto Jorge Chávez, punto Salida 3 columna F2, destino Av. Pardo 123 Miraflores, vuelo, pax/equipaje, tarifa fija, countdown 30s.
- **Primaria:** **Aceptar viaje**. **Secundaria:** Rechazar (pide motivo).

### H5 — `pwa.passenger.1G5` Cierre
- **Obligatorio:** **VoucherQR/comprobante** (código, monto, método, destino de envío, estado), **RatingTripleCard**.
- **Primaria:** **Enviar calificación**. **Secundaria:** Olvidé algo (care).

### H6 — `wellbeing.13G` Resolución
- **Obligatorio:** **TripStatusTimeline** de la incidencia, datos del viaje vinculado, responsable nombrado, plantilla de mensaje, estado/SLA.
- **Primaria:** **Contactar conductor**. **Secundaria:** Marcar resuelto (habilitada tras confirmación del conductor).

### H7 — `dispatch.3E` Historial del conductor
- **Obligatorio:** **DriverHistorySummary** (ver §5).
- **Primaria:** **Ver detalle de liquidación** (mockup). **Secundaria:** Exportar (enunciar).

### H8 — `counter.4C` Walk-in + cola
- **Obligatorio:** formulario corto de walk-in aeropuerto (destino en Lima, tipo de unidad, pax), tarifa calculada, **cola de conductores** con tiempo en cola + tipo de unidad.
- **Primaria:** **Asignar siguiente en cola** (o "Asignar recomendado"). **Secundaria:** Registrar entrega.

---

## 3. Componentes premium necesarios

> Todos son **componentes Figma reutilizables con variantes**, no frames ejemplares. En código viven en `apps/web/src/components/` y `apps/driver/src/components/`.

### 3.A `DriverCard` — ficha del conductor asignado **[datos nuevos obligatorios]**
Campos **obligatorios** (pedido explícito del usuario + `Evidencia directa`):
- **Foto del conductor** (avatar 64–80 px, `radius/full`).
- **Nombres y apellidos completos** (`heading/md`).
- **Valoración del conductor** (★ 4.9 · 487 viajes) — `body/sm`.
- Estado (libre / asignado / en cola / pausa) como punto en avatar.
- Acciones de contacto (Llamar / Mensaje) como ghost.

Variantes: `compacta` (en `3.C`, lista de cola), `completa` (en `1.G2`, `1.G3`).

### 3.B `VehicleCard` — ficha del vehículo **[datos nuevos obligatorios]**
Campos **obligatorios**:
- **Foto del auto** (16:9, `radius/md`).
- **Placa** (mono, copiable tap-hold).
- **Marca y modelo** (ej. "Toyota Yaris").
- **Tipo de auto** (sedán / camioneta / van / minivan) como badge.
- Color, capacidad de pax y maletas.

> `DriverCard` + `VehicleCard` se muestran juntas en "conductor asignado" (`1.G2`, `1.G3`, `2.C`, `3.C`). Hoy el Figma solo tiene "Toyota Yaris blanco – ABC-123" como texto plano (`code.js` línea 558): **insuficiente**. Esto pasa a P0.

### 3.C `TripStatusTimeline` — línea de estados del viaje
- Pasos: Asignado → En camino → Llegó → A bordo → Finalizado.
- Activo lleno `accent`, completado con check, pendiente con borde. Próximo paso siempre visible.
- Reusable también para el timeline de incidencia.

### 3.D `VoucherQR` — voucher realista (no declarativo)
- QR construido con módulos reales, código público (`TG-20260525-0341`), datos del viaje, **punto de encuentro físico**, sello "Taxi Green · Operador formal", vigencia.
- Debe sentirse como **tarjeta de embarque del traslado** (`PROPUESTA_DEMO`).

### 3.E `PassengerTrackingLink` — encabezado del link `/p/[token]`
- Barra superior sobria: "Tu viaje · LA2456", badge de estado, sin login, sin publicidad.
- Debajo: DriverCard + VehicleCard + mapa + ETA + punto de encuentro.

### 3.F `AssignmentApprovalPanel` — panel de aprobación (humano en control)
- Conductor sugerido (DriverCard compacta) + **motivo explicable** ("1° en cola compatible · a 6 min · 3 servicios del mismo solicitante hotel") + **score** + **badge fuente** (🤖 IA / ⚙️ Algoritmo).
- Acción primaria "Aprobar y enviar"; secundaria "Asignar otro".
- Banner: "El copiloto sugiere. Tú decides."

### 3.G `WhatsAppCopilotDualPanel` — el canal y la cocina
- **Izquierda:** chat WhatsApp del cliente (burbujas, timestamps, look #075E54 — color del *simulador*, no de la marca).
- **Derecha:** extracción estructurada en vivo, confianza con color, badge fuente, "lo que falta".
- Banner de transparencia entre ambos.

### 3.H `DriverHistorySummary` — resumen/liquidación del conductor **[datos nuevos]**
Ver §5. Campos: total atendidos, cobrados/procesados, pendientes de procesar, importe facturado, neto a cobrar, comisión empresa.

### 3.I `RatingTripleCard` — calificación triple **[Evidencia directa]**
Ver §6. Tres ejes: servicio, conductor, unidad.

### 3.J `IncidentResolutionPanel` — resolución de incidencia
- Timeline + datos del viaje + responsable nombrado + plantilla de mensaje + acciones + estado/SLA.
- Constancia descargable al cierre + "¿quedó resuelto?".

### 3.K `DriverQueueList` — cola de conductores **[corazón operativo, faltante]**
- Lista ordenada por **tiempo en cola** (no por cercanía pura): cada fila = DriverCard compacta + VehicleCard mini + tiempo en cola + compatibilidad de unidad + estado.
- Acciones: "Asignar siguiente" / "Asignar recomendado".
- Vive en `counter.4C/10B` y en el selector de `3.C`. Hoy solo existe como chip "Cola 47 min": **insuficiente**.

---

## 4. Detalle visual — pantalla "Conductor asignado" (`1.G2` / `2.C` / `3.C`)

```
┌───────────────────────────────────────────┐
│  Tu viaje · LA2456            [En camino]  │ ← PassengerTrackingLink
├───────────────────────────────────────────┤
│  ┌────────┐                                │
│  │ [FOTO] │  Juan Carlos Pérez Quispe      │ ← DriverCard
│  │ 72px   │  ★ 4.9  ·  487 viajes          │
│  └────────┘  [Llamar]  [Mensaje]           │
├───────────────────────────────────────────┤
│  [ FOTO DEL AUTO 16:9 ]                     │ ← VehicleCard
│  Toyota Yaris   ·   [Sedán]                 │
│  Placa  ABC-123        Blanco · 4 pax       │
├───────────────────────────────────────────┤
│  Llega en  8 min            [ETA grande]    │
│  Punto de encuentro:                        │
│  ▸ Salida 3, columna F2     [prominente]    │
├───────────────────────────────────────────┤
│  [ MAPA EN VIVO — ruta + halo conductor ]   │
├───────────────────────────────────────────┤
│  [ Compartir mi viaje ]   (secundaria)      │
└───────────────────────────────────────────┘
```
Datos **obligatorios** en esta pantalla: foto conductor, nombre completo, placa, marca, modelo, tipo, foto del auto, valoración. (Los 7 del pedido + valoración.)

---

## 5. Detalle visual — Historial / liquidación del conductor (`2.H` y `3.E`) **[nuevo]**

`Recomendación`: en demo es **mockup con datos semilla** (no motor de liquidación). En MVP se construye real. Raúl dijo que el pago al conductor es "harina de otro costal" → la demo **muestra el resumen** pero **no procesa pagos**.

```
┌───────────────────────────────────────────────────────────┐
│  Juan Carlos Pérez Quispe   ·   ABC-123        [Mayo 2026] │
├───────────────────────────────────────────────────────────┤
│  Viajes atendidos        128                                │
│  Viajes cobrados/proc.   119                                │
│  Pendientes de procesar    9   [badge ámbar]                │
├───────────────────────────────────────────────────────────┤
│  Importe facturado      S/ 8,420.00     (mono tabular)      │
│  Comisión empresa  (20%) S/ 1,684.00    (gris)              │
│  ─────────────────────────────────────────                 │
│  Neto a cobrar          S/ 6,736.00     [display, accent]   │
├───────────────────────────────────────────────────────────┤
│  [ Ver detalle de liquidación ]   (mockup, enunciar export) │
└───────────────────────────────────────────────────────────┘
```
Campos obligatorios (pedido): total atendidos · total cobrados/procesados · total pendientes de procesar · importe facturado · neto a cobrar · comisión empresa. Regla: `neto = facturado − comisión` (ver `LOGICA_NEGOCIO_OPERATIVA.md`).

---

## 6. Detalle visual — Calificación triple (`1.G5`) **[Evidencia directa]**

Estilo inDrive **adaptado a Taxi Green**: tres ejes separados, no una sola estrella.

```
┌───────────────────────────────────────────┐
│  ¿Cómo estuvo tu viaje?                     │
├───────────────────────────────────────────┤
│  Servicio en general   ★ ★ ★ ★ ★            │
│  Tu conductor          ★ ★ ★ ★ ★            │
│  La unidad             ★ ★ ★ ★ ★            │
├───────────────────────────────────────────┤
│  [si algún eje ≤ 3]                          │
│  ¿Qué pudo ser mejor?                        │
│  [Espera] [Trato] [Limpieza] [Ruta] [Otro]   │
├───────────────────────────────────────────┤
│  [ Enviar calificación ]  (primaria)         │
│  [ Saltar ]               (ghost)            │
└───────────────────────────────────────────┘
```
> Corrige `pwa.passenger.1G5` (hoy chips `["1".."5"]` simple) y `SPRINT.md` S8 (rating degradado a "notas"). Persistencia: `jsonb` en demo, tabla `calificaciones` en MVP.

---

## 7. Cómo usar (o no) la paleta Qorinti SaaS — análisis y recomendación

**Paleta propuesta:** texto e isotipo `#0B0952` (azul marino profundo), isotipo `#227FDE` (azul medio), fondo blanco. **Verde descartado.**

### 7.1 La tensión real (no la escondo)
- `Evidencia directa` (Raúl, 19-may): *"utiliza los colores de Taxi Green, el logotipo de Taxi Green que está en la web."* La marca Taxi Green **es verde** (taxigreen.com.pe, logo). Todo el repo (DISEÑO, plan, Figma `brand/*`) usa verde.
- El nuevo input pide **descartar el verde** y evaluar Qorinti (azul). Qorinti es **otra empresa / producto de referencia**, no Taxi Green.
- `Contradicción`: no se puede a la vez "usar los colores de Taxi Green" y "descartar el verde", **salvo** que separemos **marca del cliente** (Taxi Green = verde) de **identidad del producto/plataforma** que se vende.

### 7.2 Lectura ejecutiva del azul marino
`Inferencia` con confianza media-alta: `#0B0952` + `#227FDE` + blanco **leen más ejecutivo, sobrio y "software premium"** que el verde taxi (que tiende a "servicio de taxi" / fast-food si está saturado). Para el objetivo "premium, sobrio, ejecutivo", el azul marino **ayuda**.

### 7.3 Recomendación (con justificación, sin imponer)

**Sistema dual de identidad:**

| Capa | Paleta | Justificación |
|---|---|---|
| **Producto / plataforma (chrome de la app)** | **Qorinti: `#0B0952` texto/superficies ejecutivas, `#227FDE` acción/estado/links, blanco fondo** | Es lo que se vende: un producto digital sobrio y ejecutivo. El azul marino transmite formalidad y trazabilidad mejor que el verde. |
| **Marca del tenant (Taxi Green)** | Verde **solo** en el logo del cliente y un chip de marca | Respeta los 25 años de Taxi Green y el pedido de Raúl, sin teñir toda la UI de verde. |
| **Estados semánticos** | Éxito, ámbar (atención), rojo (problema), **púrpura `care` (bienestar)** | No tocar: el color = significado. |

**Por qué dual y no "azul total":**
1. Respeta `Evidencia directa` (logo y marca Taxi Green presentes) sin contradecir "premium/ejecutivo".
2. Si esto evoluciona a **SaaS multi-operador** (la 4ª vista que mencionó Raúl), el azul Qorinti es la **identidad de la plataforma** y cada operador (Taxi Green, otros) aporta su acento de marca. La paleta Qorinti **encaja como capa SaaS futura** — exactamente una de las opciones que el usuario pidió evaluar.
3. El verde **no se "impone ni se prohíbe ciegamente"**: se reubica como acento de tenant.

**Riesgo a declarar:** cambiar de verde a azul es una **decisión de marca que pertenece al cliente**. `Por validar` con Taxi Green antes de producción: mostrar ambas variantes (verde-marca vs azul-producto) y dejar que elijan. En la **demo** se recomienda el azul ejecutivo Qorinti para el chrome del producto + logo verde de Taxi Green, porque vende mejor "producto premium".

### 7.4 Tokens concretos sugeridos (demo)
```
product/ink     #0B0952   ← texto principal, headers, isotipo
product/accent  #227FDE   ← botón primario, links, estado activo, ruta en mapa
product/accent-600 (hover/pressed: derivar oscureciendo ~10–12%)
surface/base    #FFFFFF
surface/soft    #F5F7FB   ← fondos de sección (azulado muy sutil, evita blanco plano)
neutral/*       grises fríos (mantener escala de DISEÑO_UI §1.1)
brand/tenant    verde Taxi Green  ← SOLO logo + chip de marca
care/*          púrpura  (bienestar, sin cambios)
estados         success / warning / danger (sin cambios)
```
> Sustituye `brand/*` (verde) por `product/*` (azul) como **color de UI**, conservando los semánticos. El verde queda como `brand/tenant`.

---

## 8. Reglas de microcopy (para que no parezca genérico)

`Hecho` (de `DISEÑO_UI §6`, reforzado):

1. **Frases cortas** (≤14 palabras). Imperativo amable en botones: "Aprobar", "Aceptar viaje", "Enviar reporte". Nunca "Confirmar reserva ahora".
2. **Una sola acción primaria** nombrada con verbo + objeto claro: "Aprobar y enviar a Juan" (no "Aceptar").
3. **Errores explican qué pasó y qué hacer.** Prohibido "Algo salió mal".
4. **Honestidad de fuente:** badge "🤖 Sugerido por IA" / "⚙️ Sugerido por reglas" siempre visible donde el copiloto actúa.
5. **Bienestar = cálido + concreto:** "Lamentamos que pase. Ya contactamos a Juan. Te avisamos en menos de 15 minutos." Nunca "Su ticket fue registrado".
6. **Glosario consistente:** Reserva (antes de iniciar) · Viaje (en curso) · Conductor (no "chofer") · Voucher · Comprobante · Empresa cliente · Incidencia / Objeto perdido.
7. **Números con formato tabular** (placa, importe, código) en monoespaciado.
8. **Nada de "transformación digital", "ecosistema", "revolucionar".** Lenguaje de operación: "menos llamadas", "menos tecleo", "cierre limpio".
9. **El punto de encuentro físico** siempre explícito: "Salida 3, columna F2", no "el conductor te ubicará".
10. **Peruano neutro**, sin modismos cerrados ni "ahorita" como muletilla.

---

*Fin. La alineación de cada pantalla/componente con el Figma actual y su prioridad P0/P1/P2 están en `MAPA_ALINEACION_PLAN_FIGMA.md`. Las reglas de datos e importes, en `07_PLAN_EJECUCION/LOGICA_NEGOCIO_OPERATIVA.md`.*

# Taxi Green — Mapeo del sistema actual y propuesta de demo de app móvil

**Analista:** Análisis de producto / consultoría de software
**Fecha del análisis:** 19 de mayo de 2026
**Fuente principal:** Navegación pública de https://taxigreen.com.pe/green/index.php y subdominios relacionados
**Tipo de análisis:** Inspección visual y funcional. Sin pentesting ni intentos de bypass.

---

## TL;DR — la oportunidad en una página

Taxi Green es un operador peruano tradicional (GREEN AIRPORT S.A., +23 años, base en Callao) especializado en traslados al Aeropuerto Jorge Chávez, eventos corporativos y servicio ejecutivo. Tiene flota declarada de "400 unidades" y un módulo físico en Llegadas del aeropuerto.

Hoy convive una mezcla incómoda de dos webs:

- **`/green/`** — el sistema operativo real: PHP clásico (2014-era jQuery 1.11, Bootstrap, Moment, Leaflet, OpenPay). Aquí ocurre la reserva, el cobro y la facturación electrónica.
- **`/t/`** — una vitrina WordPress nueva, más bonita, pero que en su sección "Reservas" no reserva: es un formulario de contacto con Cloudflare Turnstile y un CTA a WhatsApp.

El sitio promete una app móvil con botones de Google Play y App Store, pero **el enlace de App Store retorna 404 y no se identifica claramente la app en Play Store con la marca "Taxi Green Perú"**. Es decir: la app o nunca se publicó, o fue retirada, o está bajo otra marca.

**Esto es exactamente el ángulo de venta:** la empresa tiene marca, volumen, un módulo en el aeropuerto, e incluso el storytelling de "descargá nuestra app", pero no tiene la pieza que el viajero moderno espera. Hay clientes corporativos con facturación quincenal, hay viajeros internacionales con pickup en aeropuerto, hay drivers con dispatch manual — todos casos donde una app les daría margen, control y diferenciación frente a inDrive, Uber, Cabify, Beat.

La demo debería atacar el viaje aeropuerto-Lima (su core), mostrar tracking en tiempo real, vehículo asignado con foto del conductor, pago con tarjeta/Yape/Plin sin fricción, facturación automática con RUC, e idealmente un módulo B2B para empresas que ya les pagan quincenalmente.

---

## 1. Qué parece hacer el sistema actual

### 1.1 Observado directamente

**Modelo de negocio operacional:**

- Servicio de taxi de **alta confianza** ("seguridad y confort"), no de competencia en precio. No es ride-hailing tipo Uber: es traslado pre-reservado con conductor uniformado, fotochecked y capacitado.
- Verticales explícitos en la página:
  1. Traslados al/desde el Aeropuerto Jorge Chávez (su core histórico).
  2. Taxi ejecutivo punto-a-punto con reserva previa.
  3. Servicio por hora (alquiler de unidad por bloque de tiempo).
  4. Servicio de Van (familia o grupos, espacio para equipaje).
  5. Eventos corporativos (declaran flota de 400 unidades).
  6. City Tours con conductores capacitados en zonas turísticas.
- Atención **24/7/365**.
- Módulo presencial de atención en **Llegadas Nacionales, frente a la Puerta 1** del aeropuerto.
- Tipos de vehículos declarados: Auto Sedán (4 pax), Camioneta (4-6 pax), Van (7 pax), Van Master (9, 15 y 20 pax).

**Reglas del negocio capturadas en Términos:**

- Tiempo de tolerancia de espera: **15 minutos**, luego se cobra hora adicional.
- No-show: cobro del **100% de la tarifa**.
- Cancelación/modificación: requiere **mínimo 4 horas de anticipación**, por call center.
- Cancelación tardía o ausencia: **100% por "desplazamiento"**.
- Peajes opcionales (Evitamiento + Línea Amarilla): **S/ 12.60 soles**, los puede asumir pasajero o empresa.
- Capacidad de maletera: si excede, **se negocia con conductor**, que puede rechazar el servicio.
- **No hay reembolsos en efectivo**, solo crédito en caso de queja formalmente investigada.

**Métodos de pago integrados (logos visibles):**
Openpay (gateway), izipay, Niubiz, Visa, Mastercard, Yape, Plin. En la modal de reserva además hay un toggle **PAGO EFECTIVO / PAGO TARJETA**.

**Facturación electrónica:**
Externalizada con **Tranzas / Fenbo Digital** (`api-taxigreen.fenbodigital.pe/tranzas/consultax.php`). Esto es el típico esquema peruano de PSE (Proveedor de Servicios Electrónicos para SUNAT). El módulo de "Seguimiento" en `/green/seguimiento.php` también está brandeado "TRANZAS TAXI GREEN — Seguimiento a Reservas y Facturas". Es decir: la consulta de reservas y de comprobantes electrónicos comparten infraestructura con el proveedor externo.

**Canales declarados:**

- Call center: (01) 484-4001
- Móviles: 998 267 148 / 996 575 781
- Correos: reservas@, ventas@, ventascorporativas@taxigreen.com.pe
- WhatsApp (widget flotante en el sitio) al 51998267148
- Redes: Instagram, Facebook, X/Twitter, TikTok, LinkedIn, YouTube
- Libro de Reclamaciones: **un PDF estático** alojado en `/t/wp-content/uploads/2026/03/virtual_archivo.pdf` (cumplimiento mínimo de Indecopi).

### 1.2 Inferido razonablemente

- **Su mercado principal es el viajero al/del aeropuerto**, B2C de pasajero individual con tarifa "ejecutiva" (default visible de S/ 30 al iniciar una reserva), no competencia con apps de ride-hailing baratas.
- **Existe un canal corporativo significativo** (ventascorporativas@, "Traslados Corporativos con créditos quincenales y reportes personalizados" en la web nueva, capacidad de facturación con RUC). Aerolíneas y empresas de eventos son clientes recurrentes.
- **El dispatch (asignación de unidad al pasajero) es centralizado por call center** — no hay evidencia de marketplace abierto a conductores. Los conductores son "afiliados" según los Términos.
- El sitio asume que el conductor se entera de los servicios por **vía interna (radio/sistema propio/WhatsApp interno)**, no por una app de driver pública.
- Probablemente las tarifas son **por zona/tarifario fijo**, no metered. La modal mostraba S/ 30 fijo aún sin haber movido el origen.

### 1.3 Por validar con el cliente

- ¿Cuántas reservas reciben por web vs. teléfono vs. WhatsApp vs. presencial en aeropuerto?
- ¿Cuál es la proporción real B2C vs B2B (corporativo)?
- ¿La flota de "400 unidades" es propia, asociada, o mezcla?
- ¿Cómo se enteran los conductores hoy del próximo servicio (¿WhatsApp grupal, radio, sistema propio, llamada)?
- ¿Existe alguna app o sistema que ya use el conductor?
- ¿La tarifa es flat por zona o calculada por distancia? ¿Hay tarifario público?

---

## 2. Mapa de flujos y módulos identificables

### 2.1 Flujo 1 — Reserva por web (`/green/index.php`)

Lo observado al interactuar con el formulario "RESERVA AQUI":

1. Usuario elige **VAN / AUTO** (toggle).
2. Selecciona **fecha**, **hora**, y **dirección de pickup** (placeholder: *"Ej: ¿Donde lo buscamos?"*).
3. El campo de dirección usa **autocomplete con Leaflet + leaflet-control-geocoder** (geocoder de OpenStreetMap-Nominatim, no Google Maps). Sugirió correctamente "Aeropuerto Internacional Jorge Chávez, Avenida Morales Duarez, Callao".
4. Click en **VAMOS** dispara `ValidarPreEnvio()` → abre modal con:
   - Celular, Email, Documento de Identidad, Pasajero (nombre).
   - Fecha/Hora pre-rellenada, Tipo de Servicio (SERV.AUTO), **Tarifa** (S/ 30 default visible).
   - Toggle **PAGO EFEC / PAGO TARJETA**.
   - Sliders: **Peaje** (0..n), **Maletas** (1..n), **Personas** (1..n).
   - Campos opcionales para boleta/factura: **RUC** y **Razón Social**.
   - Botones: Cerrar / Reserva.
5. El formulario hace POST a `https://taxigreen.com.pe/green/registro.php` con coordenadas lat/lon de origen y destino (campos hidden: `origen1lat`, `origen1lon`, `destinolat`, `destinolon`).
6. Una segunda modal `myModalPago` aparece para tokenización de tarjeta con **OpenPay** (`js.openpay.pe`), si elige pago con tarjeta.
7. Existe una modal adicional `myModalReserva` con título "MI RESERVA" — probablemente confirmación post-pago.

**Hipótesis razonable:**
El campo de "destino" en backend está hardcodeado a "AEROPUERTO JORGE CHAVEZ" en el flujo del index, lo que sugiere que **el formulario de la home solo cubre traslados Lima→Aeropuerto** (origen libre, destino fijo). Los servicios punto-a-punto, por hora, eventos y city tours **no parecen tener flujo de auto-reserva web** y caen al call center / WhatsApp / correo.

### 2.2 Flujo 2 — Seguimiento de reserva / comprobante (`/green/seguimiento.php`)

Botón **CHECKING** del home navega a una página separada (proveedor Tranzas) donde el usuario:
- Elige **Tipo Documento** (DNI / pasaporte / RUC / CE).
- Ingresa **Número de Documento**.
- Ingresa **Nombres de Pasajero**.
- Click en **Ver Documento** → consulta de reserva o factura electrónica.

Este flujo está acoplado al proveedor externo Tranzas/Fenbodigital y mezcla "ver mi reserva" con "ver mi comprobante", lo cual es confuso a nivel UX.

### 2.3 Flujo 3 — Facturación Electrónica (Tranzas)

`https://api-taxigreen.fenbodigital.pe/tranzas/consultax.php` — externo, mismo proveedor que el seguimiento.

### 2.4 Flujo 4 — Contacto y Libro de Reclamaciones

- Página de contacto: estática, datos + formulario "Envíanos tu mensaje" (no se inspeccionó submit en profundidad).
- Libro de Reclamaciones: PDF estático en `/t/wp-content/uploads/2026/03/virtual_archivo.pdf`. Cumple norma de Indecopi pero no es un libro virtual real.

### 2.5 Flujo 5 — Pide tu taxi por WhatsApp

- Widget flotante en el home (botón verde abajo a la izquierda).
- Enlaces directos a `wa.link/ml9ssq` y a `api.whatsapp.com/send?phone=51998267148`.
- En `/t/reservas/` el CTA principal explícito es **"Pide tu taxi por WhatsApp"**.

### 2.6 Flujo 6 — Vitrina WordPress paralela (`/t/`)

- Sitio nuevo, con menú: Inicio, Servicios, **Corporativo** (dropdown a Empresas + Eventos), Trabaja con nosotros, Conctacto (sic — typo en URL `conctacto/`), Noticias.
- Toggle de idioma EN/ES.
- Página `/t/reservas/` no reserva: es un formulario de contacto comercial (Nombre, Nro de Contacto, Empresa, RUC, Email, Mensaje) con Cloudflare Turnstile.
- Tiene contadores animados ("Viajes", "Conductores", "Clientes", "+26 años Exp."), pero todos los visibles arrancan en 0 (probablemente animados con JS que no llegó a dispararse en mi visita).

### 2.7 Resumen visual de módulos

| Módulo | Visible | Funcional | Calidad UX | Stack |
|---|---|---|---|---|
| Marketing home | Sí (`/green/` y `/t/`) | Sí | Mediocre (duplicado, inconsistente) | PHP + WP |
| Reserva al aeropuerto | Sí | Sí | Funcional, anticuada | PHP + jQuery + Leaflet + OpenPay |
| Reserva punto-a-punto / por hora / van / eventos / city tours | No (no se ve flujo web) | Vía call center / WhatsApp | — | — |
| Seguimiento reserva | Sí (`/green/seguimiento.php`) | Limitado, mezclado con factura | Pobre | Tranzas externo |
| Factura electrónica | Sí | Sí (externalizada) | Aceptable | Tranzas / Fenbo |
| App móvil | Botones presentes | **No verificable** (App Store 404, sin match claro en Play) | — | — |
| Driver / dispatch | No expuesto al pasajero | Asumido offline | — | — |
| Cliente corporativo | Sólo formulario de contacto | Manual | Pobre | WP form |
| Libro de Reclamaciones | PDF estático | Manual | Mínimo legal | Archivo PDF |
| Atención humana | WhatsApp + call center + módulo físico | Sí | Probablemente buena | — |

---

## 3. Stack técnico, señales de infraestructura y notas para cotización

### 3.1 Observado en la cabecera/scripts

- jQuery `1.11.0` / `1.11.3` (versión de 2014, sin soporte).
- Moment.js (deprecated formalmente desde 2020).
- Bootstrap (3 o 4, no versión moderna).
- Plugins jQuery: owl-carousel, isotope, swiper, malihu-custom-scrollbar, clockpicker, sweetalert2.
- **Leaflet 1.9.4 + leaflet-control-geocoder 2.4.0**: confirman uso de OSM/Nominatim para autocompletar direcciones (sin costo Google).
- **OpenPay** (`js.openpay.pe/openpay.v1.min.js` + `openpay-data.v1.min.js`): tokenización client-side de tarjetas con device fingerprint anti-fraude. Es la implementación estándar PCI-friendly.
- **SHA-1** lib client-side (probablemente para firmar requests a OpenPay o al backend).
- Google Tag Manager (GTM-TG568DLS) y AdSense (¿AdSense en su propio sitio? — extraño, ver §4.3).
- Plugin de WhatsApp chat support cargado en el footer.

### 3.2 Backend

- PHP clásico monolítico: `index.php`, `registro.php`, `seguimiento.php`. No hay evidencia de una API REST/JSON propia, ni de SPA.
- Probable arquitectura: PHP + MySQL (no confirmado), con módulos comerciales acoplados.
- El sitio paralelo `/t/` es WordPress (Elementor por las URLs `elementor-action`).
- El backend principal está bajo dominio propio; la factura/seguimiento se delega a Tranzas/Fenbodigital.

### 3.3 Consecuencias prácticas para una app móvil

Esto es la **noticia crítica para la cotización**:

1. **No existe (o no está expuesta) una API consumible por una app móvil nativa.** El sitio se opera por form posts y document.location, no por endpoints JSON con autenticación.
2. Cualquier app móvil real va a requerir:
   - **(a)** o un wrapper WebView pesado y feo (mala UX, no recomendable como diferenciador),
   - **(b)** o un **API gateway nuevo encima del PHP existente** (recomendado: ahorra reescribir el core),
   - **(c)** o reescritura del backend (más caro pero da base para 5+ años).
3. El proveedor de pagos (OpenPay) y el de facturación (Tranzas) **ya tienen SDKs / APIs que la app puede usar directamente**: eso ahorra trabajo.
4. El geocoder actual con OSM es funcional, pero para una app móvil con ruteo y ETAs probablemente convenga mover a **Google Maps Platform o Mapbox** (mejor calidad de búsqueda en Lima, ruteo, tráfico, polylines). Es un costo recurrente a discutir.

---

## 4. Problemas, limitaciones y oportunidades detectadas

### 4.1 Problemas de producto y UX (observado o inferido)

1. **Dos sitios web duplicados, inconsistentes y desincronizados.** `/green/` (operacional) vs `/t/` (marketing). El usuario que llega a `/t/` y hace clic en "Reservas" cae en un formulario que no reserva. Tasa de conversión seguramente sufre.
2. **El flujo de reserva sólo cubre uno de los 6 servicios** (aeropuerto, posiblemente sólo Lima→aeropuerto). Para los otros 5 servicios, el cliente termina en el call center.
3. **No hay cuenta de usuario.** Cada reserva es anónima, ligada a DNI + número de reserva. No hay historial, no hay "repetir tu viaje", no hay direcciones guardadas, no hay loyalty.
4. **No hay tracking en tiempo real.** Tras confirmar, no se ve mapa, ni ETA, ni datos del conductor asignado, ni placa. El pasajero queda esperando una llamada/WhatsApp.
5. **Mezcla confusa** entre "seguimiento de reserva" y "consulta de factura" en la misma pantalla. Modelo mental del usuario distinto.
6. **Libro de Reclamaciones es un PDF descargable**: no cumple bien el espíritu del libro virtual ni captura datos digitales.
7. **Lost & Found es 100% manual**: 1) recordar en qué taxi olvidaste, 2) llamar, 3) ir físicamente a la oficina en Callao. Pésima experiencia para un turista que ya partió del país.
8. **Sin login** ⇒ no hay perfil corporativo. Una empresa con 50 colaboradores que viajan necesita reportes, centros de costo, autorizaciones — todo lo cual hoy se procesa por correo + Excel + facturación a fin de mes.
9. **Stack frontal anticuado** (jQuery 1.11). Riesgos de seguridad y de mantenimiento aparentes.
10. **App móvil prometida pero no entregable.** Enlace App Store devuelve 404; no se identifica un match claro en Play Store. Crisis de credibilidad para el viajero que la busca.
11. **Errores de copy** ("Conctacto" en lugar de "Contacto" en la URL del menú nuevo, "Olvidastes" en lugar de "Olvidaste" en la página de beneficios). Pequeños, pero erosionan la marca premium que el sitio intenta proyectar.
12. **Toggle VAN/AUTO** pero no aparenta cambiar la tarifa visible en la modal. Por validar si la lógica realmente está implementada.
13. **El placeholder dice "donde lo buscamos"** (origen) pero el backend lo trata como destino en algunos flujos. Hay ambigüedad de modelo Pickup vs Drop-off.
14. **AdSense en el sitio propio** (script `pagead2.googlesyndication.com`): si está activo, son anuncios mostrándose en el sitio de la propia marca, lo cual es contraproducente para una marca premium. Validar si es intencional o un legado.

### 4.2 Oportunidades comerciales obvias

1. **Modernizar la experiencia del viajero internacional** — es su mercado base y es el más rentable por viaje. Un viajero que aterriza no quiere "llamar". Quiere abrir una app, ver dónde está su conductor, recibir el comprobante en su correo en segundos.
2. **Diferenciación frente a Uber/inDrive/Cabify/Beat** no es precio: es **confianza**. La app debe vender confianza con foto del conductor, badge "afiliado oficial 4 años", placa visible, contacto directo con central, video sobre el módulo del aeropuerto.
3. **App para clientes corporativos** (B2B). Hoy son atendidos por correo + Excel + crédito quincenal. Pueden tener su propia área dentro de la app: centros de costo, aprobadores, dashboard mensual, reportes descargables, integraciones con sus ERP/contabilidad. Esto **fideliza y aumenta ticket promedio sustancialmente**.
4. **Reservas recurrentes corporativas** (ej: traslados diarios al aeropuerto para tripulaciones de aerolíneas — clientes naturales).
5. **Pricing dinámico/transparente**: hoy el sistema parece basarse en tarifas planas por zona; mostrar tarifa exacta antes de reservar, con peajes opcionales claros, es un upgrade fácil con muy buen ROI percibido.
6. **Loyalty / programa de viajero frecuente**: con base de usuarios con cuenta, descuentos en quinta reserva, beneficios por traer empresa nueva.
7. **City tours como producto vendible online**: hoy queda fuera del flujo digital, pero turistas extranjeros con poco tiempo en Lima son target perfecto para tours de 3-4 horas reservables en app.
8. **Módulo de Lost & Found digital**: foto + descripción + reserva, asignación al backoffice, notificaciones al usuario sin obligarlo a ir a Callao. Una palanca de NPS enorme.
9. **Notificaciones push** (estado de reserva, asignación de conductor, conductor llegando, conductor en camino, comprobante listo).
10. **Reseñas y calificación post-viaje**, no para mostrar al público, sino para alimentar control de calidad interno y filtros de conductores. Punto sensible — definir con el cliente.

### 4.3 Riesgos a considerar al cotizar

- Integración con backend PHP existente puede tener documentación nula. Probable necesidad de **arqueología técnica** (lectura del código actual) antes de poder estimar con precisión.
- Integración con **Tranzas/Fenbodigital** depende de las APIs que ese proveedor exponga (a confirmar). Si solo permite consulta, el flujo de generación de comprobante seguirá yendo por su panel.
- **OpenPay tiene SDK móvil**, pero requiere keys y configuración productiva del comercio. Confirmar con el cliente que el comercio está vigente.
- Si quieren mantener pagos por **Yape/Plin/Niubiz** en la app, cada uno requiere integración separada (Yape PE tiene API, Plin no expone fácilmente, Niubiz expone via NPI). Costo y plazos variables.
- Decisión Maps: OSM gratis pero búsqueda en Lima pobre; Google Maps Platform o Mapbox tienen costo recurrente. Definir tope de gasto mensual.
- AdSense activo (si lo está) — confirmar política con cliente; sería raro mantenerlo en una app premium.

---

## 5. Cómo se convertiría en una app móvil moderna

### 5.1 Arquitectura recomendada (alto nivel)

```
   [App iOS]  [App Android]   ← Flutter o React Native (single codebase)
        \         /
         \       /
        [API Gateway]  ← Node/NestJS o Python/FastAPI (nuevo, capa de orquestación)
         /  |  \
        /   |   \
   PHP    OpenPay   Tranzas
  legado   (pagos)  (factura)
        \           /
       Maps Provider (Google/Mapbox)
        \
       Notifs Push (FCM/APNs)
```

Una **capa de API nueva** que envuelva el PHP actual permite:
- No reescribir el sistema operacional ahora (riesgo bajo).
- Tener endpoints REST limpios y tipados para la app.
- Auditar y mejorar incrementalmente partes del legado sin frenar al cliente.
- Reusar el mismo API para una **futura web nueva** que reemplace `/green/` y `/t/`.

### 5.2 Decisión técnica clave: app nativa vs cross-platform

| Opción | Pro | Contra | Recomendación |
|---|---|---|---|
| **Flutter** | UI consistente, performance casi nativa, dev rápido | Equipo Dart, talento PE escaso | Recomendable si el equipo lo conoce |
| **React Native** | Stack JS familiar, ecosistema enorme | Bridges, performance en mapas pesados | Buena opción default |
| **Nativo iOS + Android** | Mejor experiencia, sobre todo en mapas | Doble equipo, doble costo, doble tiempo | Sólo si presupuesto lo permite |
| **WebView** | Reusa web actual | UX pobre, mala percepción | **Descartar** |

Para una **demo vendible**, recomiendo **Flutter** (look y feel pulido en 1 codebase, animaciones limpias, demo en iOS y Android desde el día 1) o **React Native con Expo** si el equipo viene de JS.

### 5.3 Módulos sugeridos de la app

**Núcleo (V1 — el "MVP que se vende"):**

1. **Onboarding y cuenta** (registro con DNI/pasaporte, correo, celular OTP). Soporte cuenta personal y cuenta corporativa.
2. **Pantalla de reserva al aeropuerto** (su core histórico) — selector "Voy al aeropuerto" / "Salgo del aeropuerto", dirección con autocomplete + mapa, fecha, hora, tipo de unidad, cantidad de pasajeros y maletas, peaje opcional. Cálculo de tarifa en vivo.
3. **Resumen y confirmación**, con política clara de cancelación y wait time.
4. **Pago** con tarjeta (OpenPay), Yape, Plin, o efectivo en destino. Guardar tarjeta con token.
5. **Asignación de conductor** (push notification): foto, nombre, placa, marca/modelo del vehículo, "Llamar conductor", "Chat WhatsApp".
6. **Tracking en tiempo real** con polyline y ETA.
7. **Reserva activa** en pantalla principal, cuenta regresiva, botón SOS visible.
8. **Comprobante automático** post-viaje (Boleta o Factura con RUC), descarga en PDF.
9. **Historial** de viajes y posibilidad de **repetir reserva** en un tap.
10. **Soporte**: chat con call center (vía WhatsApp Business API o chat in-app), botón "He olvidado algo en el taxi" → módulo de Lost & Found digital.

**Diferenciadores (V1.5 — los que hacen vender):**

11. **Direcciones guardadas** (Casa, Trabajo, Hotel actual).
12. **Reserva para otra persona** (familiar, ejecutivo, invitado de evento).
13. **Modo turista** con copy en inglés (su sitio nuevo ya tiene EN/ES, alinear), aceptación de tarjetas internacionales, indicaciones del módulo de Llegadas Puerta 1.
14. **Recurring trips** — ej: traslado al aeropuerto cada jueves a las 5am.
15. **Programa de fidelización** — viajes acumulados, niveles, descuentos.
16. **Compartir mi viaje** con familiar (link con ETA y posición en vivo, válido sólo durante el viaje).

**Módulo corporativo (V2 — donde está el dinero recurrente):**

17. Cuenta empresa, RUC, razón social, dirección fiscal.
18. Roles: administrador, aprobador, viajero.
19. Centros de costo y proyectos para taggear cada viaje.
20. Aprobación de viajes (opcional, ajustable por empresa).
21. Crédito quincenal o mensual, no se cobra al pasajero individual.
22. **Dashboard web** complementario para los administradores corporativos (no necesariamente en la app — webview o portal web).
23. Reportes descargables (CSV, Excel, PDF) por mes, centro de costo, colaborador.
24. Factura electrónica consolidada quincenal automática.
25. Reglas de uso (por ejemplo: solo aeropuerto, solo Lima, presupuesto máximo).

**Operacional / driver (V2-V3):**

26. **App del conductor** con asignaciones, navegación, marcar "Estoy en punto", "Pasajero a bordo", "Viaje completado".
27. Comunicación con central.
28. Pago/liquidación al conductor desde la app.
29. Calificación del pasajero (interna, no pública).
30. Panel de admin/dispatcher web para el call center: asignar manualmente, ver flota en mapa, métricas en vivo.

---

## 6. La demo: qué presentar para venderles la idea

### 6.1 Objetivo de la demo

Convencer al comité de decisión de Taxi Green de que **una app moderna es la pieza que les falta para defender su nicho premium y abrir el corporativo**, frente a competencia digital que les come por abajo (Uber, inDrive) y servicios premium internacionales que les pueden comer por arriba.

La demo no debe verse como "otra app de taxi". Debe verse como **la app que el viajero internacional en Lima quería que existiera**.

### 6.2 Guion sugerido para la demo (10-12 minutos)

**Escenario:** Ana, ejecutiva extranjera, aterriza en Jorge Chávez a las 23:40, ha reservado por la app dos días antes desde su hotel anterior.

1. **Pantalla previa al viaje** — recordatorio push 2h antes ("Tu Taxi Green ya está confirmado"), card con conductor asignado, vehículo, placa, ETA del módulo de Llegadas.
2. **Llegada al aeropuerto** — la app detecta arribo (o el usuario confirma "Ya llegué"), muestra mapa con ubicación del módulo Puerta 1 y del conductor, botón "Llamar" / "Chat".
3. **Conductor a bordo** — pantalla de viaje en curso: mapa con polyline, ETA al destino, foto del conductor, botón SOS, opción "Compartir mi viaje" (genera link enviable a su contacto de confianza).
4. **Llegada al destino** — pago automático con tarjeta tokenizada, comprobante (boleta o factura con RUC) llega al correo y queda en historial. CTA "Califica tu viaje".
5. **Salto a vista corporativa** (segundo personaje, "Carla", administradora de viajes corporativos en una aerolínea cliente):
   - Dashboard mes en curso: 47 viajes, S/ 4,820 acumulado, top destinos, factura electrónica consolidada lista.
   - Ver el viaje de Ana, su centro de costo, su comprobante, descargar.
6. **Cierre comercial:** mensaje claro — *"esto es lo que sus clientes ya esperan; quien lo entregue primero en Lima en este nicho gana el corporativo"*.

### 6.3 Qué construir físicamente para la demo (mínimo viable de venta)

No hay que construir todo el backend. La demo se vende con:

- **Flutter o React Native** con datos mockeados (json local), 6-8 pantallas clave finamente diseñadas.
- Animaciones limpias: transición entre pantallas, marcador de auto moviéndose en mapa.
- Mapa funcional (Google Maps SDK key gratis del trial).
- Login con OTP simulado (un código fijo).
- Push notif simulada o realmente disparada con FCM si hay tiempo.
- 1 hilo del lado corporativo (3 pantallas: login, dashboard, detalle de viaje).
- **No** integrar OpenPay real, **sí** una pantalla de pago bonita con animación de éxito.

Mantener la demo en **un solo dispositivo o emulador**, idealmente un iPhone bonito como mockup en pantalla compartida, refuerza la sensación premium.

### 6.4 Material complementario a la demo

- Un **mockup en Figma de alta fidelidad** con los flujos completos (no solo los demoables) — sirve como pieza de venta independiente y como referencia para la cotización.
- Un **deck de 12-15 slides** con el porqué, el qué, el cómo y el cuándo (roadmap V1, V2, V3 con timelines indicativos).
- Una **lista de KPIs medibles** que la app les va a mover: conversión web→reserva, % reservas por canal digital vs call center, NPS post-viaje, % clientes recurrentes, ticket promedio corporativo, tiempo medio de asignación.
- Un **mini estimado de costos** (rango, no preciso) y un timeline de 3 fases.

---

## 7. Priorización: qué va primero

Sugerencia de orden, optimizado para **mostrar valor temprano y validar suposiciones críticas con el cliente real**:

### Fase 0 — Discovery (2-3 semanas)

- Reuniones con stakeholders operativos y comerciales.
- Acceso al backend actual, esquema de DB.
- Auditoría de tarifas, zonas, reglas de negocio.
- Definición conjunta del scope de V1.
- Decisión Maps y stack móvil.
- Definir métricas de éxito.

### Fase 1 — MVP V1 (3-4 meses)

Lo mínimo que justifica publicar la app y empezar a moverla:
- API gateway sobre PHP existente.
- App pasajero: cuenta, reserva al aeropuerto en ambos sentidos, pago con tarjeta y efectivo, conductor asignado, tracking, comprobante, historial, soporte WhatsApp.
- Publicación en stores con cuentas de Taxi Green (recuperar el ID iOS, crear nuevo si fue borrado).
- Panel admin mínimo para que el call center vea las reservas que llegan por la app.

### Fase 2 — V1.5 / corporativo light (2-3 meses adicionales)

- Direcciones guardadas, reserva recurrente, soporte multi-idioma EN/ES, compartir viaje, Lost & Found digital.
- Cuenta empresa básica: viaje a costo del empleador, crédito quincenal, reporte mensual descargable.
- Web admin para corporativos.

### Fase 3 — V2 / driver y dispatch (4-6 meses)

- App del conductor con asignación, navegación, estados.
- Panel de dispatch en tiempo real para el call center.
- Liquidación al conductor.
- Reemplazo gradual del sitio `/green/` por una nueva web sobre la misma API.

### Fase 4 — V3 / extras competitivos

- Loyalty, City Tours como producto reservable, precios dinámicos por demanda en eventos, integraciones con Booking/Expedia o hoteles partner para sumarse como opción de traslado.

---

## 8. Preguntas que hay que hacerle al cliente antes de cotizar o desarrollar

Estas son las preguntas que más mueven la cotización. Organizadas por bloque para una primera reunión de descubrimiento.

### 8.1 Sobre el negocio

1. ¿Cuál es la mezcla real de canales de reserva hoy (web, llamada, WhatsApp, presencial)? ¿Volúmenes mensuales aproximados?
2. ¿Qué porcentaje de los ingresos vienen del corporativo vs del B2C?
3. ¿Quiénes son sus 5 clientes corporativos más grandes y qué les piden hoy que no pueden entregar?
4. ¿Cuál es el principal motivo por el que pierden viajes hoy: precio, capacidad, demora en asignación, fricción digital?
5. ¿Tienen objetivo claro de penetración digital (por ejemplo, "que el 40% de las reservas vengan por canal digital en 12 meses")?
6. ¿Hay competidores directos que les preocupan más?

### 8.2 Sobre el producto

7. ¿La app es para reemplazar la actual o se intenta resucitar la existente? ¿Existe realmente la app de hoy en algún store?
8. ¿Quieren cubrir desde V1 todos los servicios (aeropuerto, ejecutivo, hora, van, eventos, city tours) o priorizan aeropuerto?
9. ¿La app debe estar en inglés desde V1 (su clientela aeroportuaria es 50%+ internacional)?
10. ¿Quieren incorporar funcionalidad de driver/dispatch o lo dejan para V2?
11. ¿Quieren que la app reemplace eventualmente al sitio operacional `/green/` o ambos conviven?
12. ¿Quieren onboarding sin login (reserva como invitado) o cuenta obligatoria?

### 8.3 Sobre tarifas y reglas

13. ¿Tarifa actual es plana por zona o calculada? ¿Existe tarifario interno digital?
14. ¿Qué descuentos o promos manejan que la app debería respetar?
15. ¿Cómo facturan a corporativos hoy: contra cada viaje, consolidado quincenal, mensual?
16. ¿Cómo se cobran las modificaciones, cancelaciones y no-shows? ¿Quieren automatizar el cargo en la app?

### 8.4 Sobre operaciones

17. ¿Cómo se enteran los conductores del próximo servicio hoy? ¿Quieren cambiar eso?
18. ¿Conductores tienen smartphone? ¿Plan de datos? ¿Idioma único (español)?
19. ¿Cuántos conductores activos hay? ¿Cuántos hablan inglés (relevante para el viajero internacional)?
20. ¿Tienen sistema de turnos, control de disponibilidad?

### 8.5 Sobre tecnología

21. ¿Tienen documentación del backend actual? ¿Acceso a la base de datos?
22. ¿Quién es el actual proveedor de hosting y mantenimiento del sitio?
23. ¿Quién es el dueño de la cuenta de Apple Developer y de Google Play Console? ¿Hay credenciales? ¿La cuenta sigue activa?
24. ¿Tienen contrato vigente con OpenPay, Niubiz, Tranzas/Fenbodigital? ¿Quién es su contacto técnico ahí?
25. ¿Tienen Maps API key (Google) o quieren mantener OpenStreetMap?
26. ¿Tienen política de protección de datos vigente acorde a la Ley 29733 (Perú)?
27. ¿Tienen logos, paleta y guía de marca actualizadas en algún archivo entregable, o trabajamos a partir del sitio actual?

### 8.6 Sobre presupuesto y plazos

28. ¿Tienen un rango presupuestal de referencia para esta primera versión?
29. ¿Hay fecha objetivo (un evento, una temporada alta, fin de año)?
30. ¿Cómo prefieren contratar: por fases con entregables (recomendado) o llave en mano?

---

## 9. Diferenciación entre lo observado, inferido y por validar

### 9.1 Observado directamente (verificable navegando hoy)

- Empresa real, 23+ años, nombre legal GREEN AIRPORT S.A., base en Callao.
- Sitio `/green/` operativo con flujo de reserva (form, modal, OpenPay, sliders, validaciones JS).
- Sitio `/t/` paralelo en WordPress con vitrina más moderna pero sin booking real.
- Stack frontend obsoleto (jQuery 1.11, Moment, Bootstrap, etc.).
- OpenPay, Tranzas, Leaflet como integraciones confirmadas en scripts.
- Tarifa por defecto S/ 30 al iniciar una reserva al aeropuerto.
- 6 verticales de servicio anunciados.
- Términos de servicio formales: 15 min de espera, 4h cancelación, peajes S/ 12.60.
- Enlaces a app móvil presentes pero rotos (App Store 404, sin match claro en Play Store).
- Libro de Reclamaciones es PDF estático.
- Canales: call center, WhatsApp, módulo físico aeropuerto Puerta 1.

### 9.2 Inferido razonablemente (alta confianza, no probado)

- Backend PHP monolítico sin API JSON pública.
- Dispatch interno por call center, no marketplace de conductores.
- Tarifas planas por zona, no metered.
- Mercado mixto B2C aeroportuario + B2B corporativo.
- App de conductor no existe o no está expuesta públicamente.
- Bookings desde la web son una minoría del volumen total (mayoría sigue siendo call center y WhatsApp).
- Sitio `/t/` es marketing/SEO, no migración real del sistema operativo.

### 9.3 Por validar con el cliente (no asumible)

- Estado real de la app móvil (si fue publicada, retirada, o nunca lanzada).
- Volumen real de reservas y mezcla por canal.
- Cliente corporativo: cuántos, cuánto pesan, qué procesos tienen.
- Modelo de tarifación exacto.
- Modelo de dispatch y software actual (si existe).
- Presupuesto y plazos.
- Disponibilidad de credenciales y de equipo técnico interno.

---

## 10. Notas finales para el cierre comercial

1. **No vender "una app de taxi".** Vender **"la versión digital del módulo del aeropuerto Puerta 1"**, que ya es el activo de confianza diferenciado que tiene Taxi Green. La app es la prolongación de esa presencia física en el bolsillo del viajero, no un Uber-clone.
2. **Recordar el ángulo corporativo.** Es el que defiende el negocio frente a Uber/inDrive. Es donde está el revenue recurrente. Es donde se justifica una inversión más alta.
3. **Empezar pequeño, lanzar rápido, iterar.** Mejor V1 publicado en 4 meses cubriendo aeropuerto+pago+tracking, que un proyecto de 12 meses que no llega a producción.
4. **Pedir acceso al sistema actual antes de cotizar firme.** Toda cifra dada sin haber visto el código es una apuesta.
5. **Demostrar respeto por su trayectoria.** 23 años en Perú es mucho. La modernización no es romper, es proteger lo que ya funciona.

---

## Anexo A — Inventario rápido de assets observables hoy

| Asset | URL | Estado |
|---|---|---|
| Sitio operacional | https://taxigreen.com.pe/green/index.php | Activo |
| Vitrina WordPress | https://taxigreen.com.pe/t/ | Activo |
| Reserva (form) | https://taxigreen.com.pe/green/index.php#formulario | Activo |
| Endpoint reserva | https://taxigreen.com.pe/green/registro.php | POST destino |
| Seguimiento | https://taxigreen.com.pe/green/seguimiento.php | Activo (tranzas) |
| Factura electrónica | https://api-taxigreen.fenbodigital.pe/tranzas/consultax.php | Externo |
| Libro Reclamaciones | PDF estático en /t/wp-content/uploads/2026/03/ | Mínimo legal |
| WhatsApp directo | https://wa.link/ml9ssq y phone=51998267148 | Activo |
| App Store (iOS) | apps.apple.com/pe/app/taxi-green-peru/id6476325352 | **404 Not Found** |
| Google Play (Android) | búsqueda "taxi green peru" | **Sin match claro** |
| Instagram | @taxigreen.oficial | Activo |
| Facebook | /oficialtaxigreen | Activo |
| TikTok | @taxigreenoficial | Activo |
| LinkedIn | /company/taxi-green-oficial | Activo |
| YouTube | @taxigreen3944 | Activo |

## Anexo B — Stack técnico identificado

**Frontend `/green/`:**
- jQuery 1.11.0 / 1.11.3
- Moment.js + moment-timezone
- Bootstrap (3 o 4)
- SweetAlert2
- Leaflet 1.9.4 + leaflet-control-geocoder 2.4.0 (OSM)
- OpenPay JS v1
- SHA-1 client
- Google Tag Manager (GTM-TG568DLS)
- AdSense (validar si intencional)
- Plugins: owl-carousel, isotope, swiper, malihu-custom-scrollbar, clockpicker

**Backend `/green/`:**
- PHP (index.php, registro.php, seguimiento.php)
- DB no inspeccionable (probable MySQL)
- Sin API REST/JSON pública evidente

**Sitio `/t/`:**
- WordPress + Elementor
- Cloudflare Turnstile como captcha

**Integraciones externas:**
- OpenPay (`js.openpay.pe`) — pagos
- Tranzas / Fenbo Digital (`api-taxigreen.fenbodigital.pe`) — facturación + seguimiento
- WhatsApp Business (vía links)

---

*Fin del documento. Cualquier afirmación marcada como inferida u "por validar" debe revisarse en la primera reunión de descubrimiento con el cliente antes de comprometer alcance o precio.*

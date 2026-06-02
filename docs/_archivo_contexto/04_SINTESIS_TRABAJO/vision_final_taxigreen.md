# Visión estratégica Taxi Green — análisis neutral previo a cualquier decisión de producto

**Documento de trabajo, pasada 1 de 2.**
**Rol del autor:** analista neutral, según `CLAUDE.md`.
**Fecha:** 2026-05-21.
**Alcance:** construir una visión razonada y sin sesgo de producto, *antes* de decidir formato (app, web, WhatsApp, SaaS, dashboard, marketplace, copiloto, etc.) y *antes* de diseñar la demo.
**No es:** un pitch comercial, una arquitectura cerrada, un plan de sprints, ni una defensa de propuestas previas.

> Este documento intenta describir lo que sabemos, lo que creemos saber, lo que asumimos sin pruebas y lo que falta validar — para que cualquier decisión posterior tenga base, no impulso.

---

## 1. Inventario de fuentes revisadas

Se distinguen las fuentes por su naturaleza epistémica, no por su orden en el repo.

### 1.1 Evidencia directa de Taxi Green (cliente y operación real)

| Fuente | Naturaleza | Lo que aporta |
|---|---|---|
| `00_EVIDENCIA_REAL/reuniones/transcripcion_demo.txt` | Transcripción literal de reunión con Raúl | Voz del cliente, expectativa de demo, preferencias técnicas iniciales (Mongo, microservicios, distintos clouds), descripción de dos flujos (casa→aeropuerto, aeropuerto→ciudad), enumeración de pantallas esperadas. |
| `00_EVIDENCIA_REAL/reuniones/PROBLEMA_ordenado_Taxi_Green.md` | Versión ordenada por ChatGPT de un chat de discusión | Reorganiza la voz del cliente; ya empieza a inferir conclusiones ("WhatsApp es la puerta, no el reemplazo"). **Está parcialmente contaminada por interpretación.** |
| `00_EVIDENCIA_REAL/taxigreen/taxi_green_principal.md` | Inspección del sitio web público y del sistema operativo | Stack real observable: PHP + jQuery 1.11 + Leaflet + Bootstrap, OpenPay/Izipay/Niubiz + Yape/Plin, facturación delegada a Fenbo Digital. Marca de 25+ años. App Android 404 en Google Play. |
| `00_EVIDENCIA_REAL/taxigreen/taxi_green_secundario.md` | Segundo análisis del sitio | Cifras declarativas (800K+ viajes, 350+ conductores, 80K+ clientes — sin validar). Recomienda MVP híbrido. |
| `00_EVIDENCIA_REAL/taxigreen/primeras_ideas.pdf` | Reporte estratégico inicial (probablemente generado con IA) | Identifica las 5 concesionarias LAP del nuevo terminal, propone modelo SaaS white-label "FleetVoucher". Mezcla evidencia de mercado con propuestas. |
| `00_EVIDENCIA_REAL/referencias_qorinti/Reporte_Tecnico_Qorinti.pdf` y `Reporte_Contexto_Qorinti.pdf` | Reportes de un proyecto previo (Qorinti) | Patrones funcionales observados en otra app de movilidad; **NO es evidencia de Taxi Green**, sólo cantera de patrones. No leídos en profundidad en esta pasada. |

### 1.2 Investigaciones de IA (análisis auxiliar, no autoridad)

| Fuente | Aporta | Riesgo |
|---|---|---|
| `01_INVESTIGACIONES_IA/claude/Investigacion_Estrategica_Taxi_Aeropuerto_Lima.md` | Síntesis cruzada y capas de evidencia. Recomienda omnicanal, PostgreSQL, monolito modular. | Tono ya cercano a recomendación; conviene leerlo como hipótesis. |
| `01_INVESTIGACIONES_IA/chatgpt/deep-research-report.md` | Contenido convergente con Claude. | Posible eco entre fuentes IA. |
| `01_INVESTIGACIONES_IA/gemini/Investigacion_Innovacion_Transporte_Aeropuerto_Lima.pdf` | Marco regulatorio LAP/ATU, comparativos globales (Booking.com Airport Taxis, Blacklane, Welcome Pickups, Autocab, Routematic, MoveInSync), categorías "Fleet Voucher", "Control Tower", "Copiloto IA". | Algunos números provienen de fuentes secundarias contradictorias entre sí — el propio reporte lo señala. |

### 1.3 Propuestas previas (historial de ideas, no decisión)

| Fuente | Naturaleza | Riesgo de sesgo |
|---|---|---|
| `02_PROPUESTAS_PREVIAS/PROPUESTA_DEMO.md` | Plan de demo de 10–14 días con stack Flutter+Next.js+NestJS+PostgreSQL/PostGIS, 4 vistas (pasajero, conductor, admin, supervisor), QR, simulación de pago. | Ya **define solución**. Útil como hipótesis; peligroso como ancla. |
| `02_PROPUESTAS_PREVIAS/DEMO_COMERCIAL_TAXI_GREEN_MASTERPLAN.md` | Masterplan comercial con guion de 12 min, "Taxi Green Control Tower". | Tono de venta interna; útil para entender la historia, no la decisión. |
| `02_PROPUESTAS_PREVIAS/PLAN_DE_SOFTWARE.md` | Plan técnico detallado (modelo de datos, contratos REST/WS, sprints, DDL). Confronta explícitamente las preferencias técnicas de Raúl. | Decisiones ya cerradas; conviene leerlo como evidencia *de qué se ha pensado*, no *de qué se debe hacer*. |
| `02_PROPUESTAS_PREVIAS/PROBLEMA_ordenado_Taxi_Green.md` | Duplicado o casi duplicado del archivo homónimo en `00_EVIDENCIA_REAL`. | Confirma que el "problema ordenado" ya tiene interpretación. |

### 1.4 Referencias externas (inspiración, no dominio)

| Fuente | Uso permitido | Uso prohibido |
|---|---|---|
| `03_REFERENCIAS_EXTERNAS/vision_final_warem.md` | Rescatar filosofía: copiloto, simplicidad, "el sistema alimenta al usuario, no al revés", contrato de autonomía (la máquina hace lo repetitivo, el humano decide lo importante, nada irreversible sin humano). | Trasladar dominio WAREM/Pepethefrog (distribución técnica B2B) a Taxi Green. |
| `03_REFERENCIAS_EXTERNAS/WAREM_Plan_Software_Consolidado.md` | Mismo criterio: principios, no soluciones. | No leído en profundidad en esta pasada. |

### 1.5 Lectura realizada con honestidad

- Fueron leídos en profundidad: la transcripción de demo, los dos análisis del sitio Taxi Green, las investigaciones IA Claude/ChatGPT/Gemini, las cuatro propuestas previas (totales o parciales), `primeras_ideas.pdf` y parte de `vision_final_warem.md`.
- No fueron leídos en profundidad: los reportes Qorinti (`Reporte_Tecnico` y `Reporte_Contexto`), ni `WAREM_Plan_Software_Consolidado.md`, ni los últimos lines de `vision_final_warem.md`. Estas omisiones se declaran y se marcan los puntos donde podrían matizar la conclusión.

---

## 2. Separación epistemológica de lo que hay en los documentos

Convivencia explícita de tipos de afirmaciones, etiquetadas según `CLAUDE.md`.

### 2.1 `Evidencia directa` (observable, verificable)

- Existe un sitio operativo bajo `taxigreen.com.pe/green/` construido en PHP, con jQuery 1.11, Bootstrap clásico, Leaflet (no Google Maps), modales de reserva y pasarela de pago integrada con OpenPay/Izipay/Niubiz/Yape/Plin.
- La facturación electrónica está delegada al subdominio `api-taxigreen.fenbodigital.pe`. Taxi Green no construyó capa fiscal propia.
- El paquete Android `com.maurodev.taxigreen` está publicado por una persona natural ("Maurodev") y no por GREEN AIRPORT S.A.; al momento del análisis devolvía HTTP 404 en Google Play.
- Existe una vitrina WordPress paralela bajo `taxigreen.com.pe/t/` con flujo de reserva más cercano a "contacto comercial" que a transacción.
- Taxi Green opera bajo la razón social GREEN AIRPORT S.A., con sede física en Av. Bertello, Callao.
- Cabify Empresas trabaja con más de 3.100 empresas en Perú y crece dos dígitos en el segmento corporativo. *(Cita directa de prensa en `primeras_ideas.pdf`.)*

### 2.2 `Dicho en reunión` (voz del cliente, no necesariamente correcta)

- Raúl sugirió MongoDB, reconociendo no haber trabajado con esa base, y abrió la puerta a una propuesta mejor.
- Raúl sugirió microservicios y front/back/DB en clouds distintos para evitar dependencia de un proveedor.
- Raúl describió dos flujos (casa→aeropuerto, aeropuerto→destino) y mencionó cuatro vistas necesarias: pasajero, conductor, administrador, supervisor de aeropuerto.
- Raúl asumió simulación de pago y GPS real como aceptables para una demo.
- Raúl mencionó la posibilidad futura de una vista de "administrador de la plataforma" multi-empresa.

### 2.3 `Propuesta previa` (idea que figura en el repo)

- Construir un único sistema vertical para Taxi Green con 4 vistas reales + 1 vista hook corporativo (Propuesta_Demo, Masterplan).
- Construir un **SaaS white-label "FleetVoucher"** vendido a las 5 concesionarias LAP y a remisses formales del Perú (`primeras_ideas.pdf`).
- Adoptar stack Flutter + Next.js + NestJS + PostgreSQL + PostGIS + Socket.IO + Mapbox + FCM (Propuesta_Demo, Plan_de_Software).
- QR-Voucher como artefacto central de confianza, validación y auditoría.
- Modelo de "Control Tower" como concepto narrativo (Masterplan).
- Modelo de "copiloto" (rescatado de WAREM) aplicado a tareas repetitivas internas — sólo como filosofía, no como producto definido.

### 2.4 `Investigación IA` (análisis sintetizado por modelos)

- El "moat" de Taxi Green es regulatorio y físico (concesión LAP), no tecnológico. *(Claude, ChatGPT y Gemini coinciden.)*
- Sólo cinco operadores tienen counter autorizado en Nivel 1 del nuevo terminal: Taxi Green, CMV Taxi Remisse Ejecutivo, Taxi Mitsoo Remisse, Taxi365 y Taxi Directo. *(Gemini, primeras_ideas.)*
- El mercado peruano de transporte aeroportuario y corporativo está estructuralmente fragmentado, con apps masivas (Uber/Cabify/inDrive/DiDi) dominando lo on-demand y nicho remisse dominando lo programado. *(Gemini, primeras_ideas.)*
- La demanda corporativa post-pandemia exige *duty of care* y trazabilidad de cada traslado (precedente legal Dusek v StormHarbour). *(Gemini, primeras_ideas, citado por ambos.)*
- Existen referentes globales: Blacklane / Welcome Pickups (premium meet-and-greet), Booking.com Airport Taxis / Mozio / GetTransfer (agregadores tipo GDS terrestre), Autocab / TaxiCaller (fleet dispatch), Routematic / MoveInSync (transporte corporativo). *(Gemini.)*

### 2.5 `Inferencia` (deducción razonable, no observada)

- La fragmentación del stack actual (`/green/` PHP + `/t/` WordPress + app de persona natural + factura externa) sugiere ausencia de gobierno técnico unificado y dependencia de proveedores externos puntuales.
- La frase "el corporativo subsidia la infraestructura B2C" (Gemini) es razonable pero no validada con datos de Taxi Green: requiere conocer la distribución real de ingresos.
- La existencia del módulo físico en counter sugiere que el meet-and-greet humano es parte del producto, no un costo a eliminar — pero no hay datos cuantitativos del valor que genera.

### 2.6 `Hipótesis` (idea que requiere validación con clientes reales)

- El segmento que mejor pagaría por software adicional es el corporativo programado (cuentas marco con factura consolidada mensual), no el pasajero individual.
- La adopción de un QR-Voucher por parte de pasajeros invitados sería superior a la adopción de una app nativa.
- Las otras 4 concesionarias LAP (Mitsoo, CMV, Taxi365, Taxi Directo) tendrían disposición a pagar por un SaaS común. *(Especialmente débil: no hay contacto con ninguna documentada en el repo.)*
- Una operación de ~400 unidades + cuentas corporativas justifica software dedicado pero **no** justifica una plataforma SaaS multi-país en año 1.

### 2.7 `Contradicción` (tensiones internas en el repo)

- **Sistema dedicado a Taxi Green vs SaaS multi-tenant white-label**: la `PROPUESTA_DEMO` y el `MASTERPLAN` están centrados en Taxi Green como cliente único; `primeras_ideas.pdf` propone vender a 5–10 transportistas en simultáneo. No es la misma empresa.
- **Stack relacional (PostgreSQL+PostGIS) vs preferencia del cliente (MongoDB)**: el `PLAN_DE_SOFTWARE` documenta la confrontación; queda como decisión por validar en reunión.
- **App vs PWA vs WhatsApp**: las propuestas internas mezclan Flutter nativo (Propuesta_Demo) con PWA ligera (primeras_ideas) con WhatsApp como canal principal (PROBLEMA_ordenado).
- **Foco aeropuerto vs foco corporativo**: la demo descrita se centra en el flujo aeroportuario; la oportunidad estratégica que más se repite es la corporativa programada. Son afines pero no idénticas — un B2B de oficina-a-oficina urbana no requiere QR en counter LAP.
- **Mongo + microservicios + multi-cloud (voz del cliente) vs monolito modular en PaaS único (consenso analítico)**: hay que confrontar abiertamente al cliente, no obedecer ni desobedecer en silencio.

### 2.8 `Por validar`

- Distribución real de ingresos de Taxi Green entre (a) counter spot, (b) convenios corporativos, (c) eventos/tours.
- Cifras declarativas del sitio (800K viajes, 350+ conductores, 80K clientes): el orden de magnitud parece plausible pero no auditable desde fuera.
- Estado real de la app Android: ¿despublicada, error técnico transitorio, o nunca bien indexada?
- Volumen real de WhatsApp/llamadas que entra al call center 01-484-4001 y al despachador.
- Disposición de Raúl a aceptar un cambio de stack sobre lo que él mismo propuso.
- Existencia o no de exclusividad operativa con LAP, y términos de la concesión.

---

## 3. ¿Cuál es el problema real? (separando lo explícito de lo inferido)

Aquí intentamos extraer el problema desde la evidencia, no desde las soluciones que ya se propusieron.

### 3.1 Problema explícito en la voz del cliente *(transcripción de reunión)*

Raúl describe un sistema y unos flujos. No describe un dolor. La conversación está orientada a *qué construir*, no a *qué duele*. Eso es información valiosa por lo que **no** dice: la reunión asume que la respuesta es "construir un sistema digital ordenado para Taxi Green".

Conviene leer eso con cuidado: cuando el cliente describe la solución pero no describe el problema, el equipo debe reconstruir el problema, no obedecer la solución.

### 3.2 Problema inferido desde la evidencia operativa *(análisis del sitio + investigaciones IA)*

Hay varias capas de fricción razonablemente deducibles:

| Capa | Dolor probable | Evidencia que lo respalda |
|---|---|---|
| Pasajero individual | Reserva por sitio web obsoleto, sin tracking visible, sin tarjeta de embarque digital, app rota. | Estado del stack actual. *(Inferencia fuerte.)* |
| Pasajero corporativo invitado | Llega a Lima, no sabe a dónde ir, no tiene app del proveedor, busca cartel en la zona caótica de llegadas. | Modelo "Meet-and-Greet" descrito por Welcome Pickups/Blacklane; ausencia de canal digital ligero en el sitio actual. *(Inferencia razonable.)* |
| Conductor | Recibe asignaciones por WhatsApp/teléfono sin datos estructurados, transcribe direcciones a Waze a mano. | Mismo patrón observado por Gemini en otros operadores del sector. *(Inferencia razonable, falta evidencia directa.)* |
| Despachador | Coordina manualmente reservas entrantes, asigna conductor + unidad por separado, resuelve excepciones por chat. | Descrito explícitamente en `primeras_ideas.pdf` como cuello de botella del sector. *(Inferencia.)* |
| Administrador corporativo de empresa cliente | Recibe boletas/facturas dispersas, reconstruye centros de costo en Excel a fin de mes. | Es el dolor estándar del segmento B2B corporativo de movilidad en LATAM. *(Inferencia con respaldo de mercado.)* |
| Compliance/Risk corporativo | Necesita evidencia auditable de cada traslado pagado por la empresa (Duty of Care). | Precedente legal Dusek v StormHarbour. *(Citado por Gemini y primeras_ideas.)* |
| Operación SUNAT | Plazo de 3 días calendario para emitir comprobante electrónico; factura consolidada mensual requiere conciliación pesada. | Norma SUNAT R.S. 193-2020. *(Verificable.)* |

### 3.3 ¿Quién sufre el problema?

No hay un único "usuario". Hay un sistema de actores con dolores parcialmente alineados:

1. **Pasajero individual aeropuerto**: experiencia de confianza visible (¿quién me recoge?, ¿cuánto pago?, ¿qué pasa si mi vuelo se retrasa?).
2. **Pasajero corporativo invitado**: encuentro físico ordenado sin tener cuenta en ningún sistema.
3. **Empleado corporativo recurrente**: reserva rápida con pago a cargo de su empresa.
4. **Conductor**: claridad operativa, menos llamadas, menos transcripción manual, liquidación correcta.
5. **Operador / despachador Taxi Green**: orquestación visible, asignación auditable, manejo de excepciones (vuelo retrasado, no-show).
6. **Supervisor aeroportuario (counter LAP)**: validación rápida de pasajeros, entrega ordenada al conductor en zona de llegadas.
7. **Administrador corporativo del cliente**: política, presupuesto, centros de costo, factura mensual consolidada.
8. **Compliance / Risk corporativo**: trazabilidad auditable de cada viaje.
9. **Gerencia Taxi Green**: visibilidad de operación, capacidad comercial de cerrar más cuentas corporativas, control de marca.

Esto importa porque cualquier producto que ataque sólo a uno de estos actores está incompleto, y cualquier producto que pretenda atacarlos a todos a la vez está sobredimensionado para una primera entrega.

### 3.4 Síntesis provisional del problema

Una formulación honesta del problema, antes de elegir solución:

> Taxi Green tiene una operación física confiable de 25+ años apoyada en una concesión aeroportuaria escasa, pero su capa digital — sitio, app, facturación, coordinación interna — está fragmentada y tercerizada. Esto erosiona dos cosas valiosas: la **confianza visible** hacia el pasajero (y especialmente hacia el pasajero corporativo invitado) y la **eficiencia operativa interna** (coordinación humana, asignación, liquidación, facturación). En paralelo, el mercado peruano y LATAM de movilidad corporativa programada con cuenta marco está creciendo y exige *duty of care* y descargo contable, dolor que ninguna app masiva tipo Uber resuelve estructuralmente.

Notar que esta formulación **no obliga** a una app, un SaaS, una IA, un dashboard o un marketplace. Sólo describe una asimetría entre activos físicos sólidos y activos digitales débiles, y un mercado adyacente que valora exactamente lo que se ha vuelto difícil de ofrecer.

---

## 4. Tensiones y contradicciones que no se deben tapar

Estas tensiones aparecen una y otra vez en el repo. Conviene mantenerlas abiertas en lugar de resolverlas por defecto.

### 4.1 Tensión cliente único vs plataforma multi-cliente

- *Argumento a favor de cliente único (Taxi Green):* hay relación, hay marca, hay activo físico, hay capacidad de cerrar venta. La operación tiene tamaño suficiente para sostener su propio producto.
- *Argumento a favor de plataforma multi-cliente (las 5 LAP + remisses formales):* las economías de un SaaS son superiores; el dolor descrito es genérico al sector; ningún competidor peruano ofrece una capa unificada.
- *Riesgo de cerrar prematuramente como SaaS:* nunca se ha hablado con Mitsoo, CMV, Taxi365, Taxi Directo. La "hipótesis de 5 clientes" es proyección, no validación.
- *Riesgo de cerrar prematuramente como cliente único:* perder un caso de uso comercial defensable a 3–5 años.

**Camino sano:** construir como si fuera multi-tenant *internamente*, pero comprometerse comercialmente sólo con Taxi Green hasta validar al menos un segundo cliente.

### 4.2 Tensión vertical aeropuerto vs vertical corporativa

- El aeropuerto es donde Taxi Green tiene el activo único (concesión LAP).
- El corporativo es donde el dolor genera disposición a pagar software (cuenta marco, factura mensual, duty of care).
- No son lo mismo, pero se intersectan: muchos viajes corporativos *son* hacia/desde aeropuerto.

**Camino sano:** el flujo aeroportuario es la escena más demostrable; el modelo corporativo es la fuente de ingreso más defendible. La intersección — *traslado corporativo programado al aeropuerto* — es probablemente el punto de inicio menos arriesgado.

### 4.3 Tensión "más app" vs "menos app"

- *A favor de app nativa:* el conductor sí necesita una app (notificaciones, GPS, botones grandes); el pasajero recurrente la usa.
- *En contra:* el pasajero invitado corporativo no descargará una app para un solo viaje. El turista internacional, tampoco.
- *Alternativa intermedia (PWA + link público + WhatsApp):* el pasajero invitado recibe un link/QR; el conductor sí tiene app.

**Camino sano:** dejar de pensar "una app" vs "no app" y pensar **por actor**:
- Conductor → app dedicada (nativa o PWA optimizada para móvil) parece justificada.
- Despachador → web es probablemente el mejor canal.
- Pasajero recurrente → app o PWA.
- Pasajero invitado → link público + QR + WhatsApp como notificación.
- Administrador corporativo → web.
- Supervisor counter → web/tablet.

### 4.4 Tensión preferencia técnica del cliente vs consenso analítico

- Mongo vs PostgreSQL+PostGIS: el dominio es **fuertemente relacional y geo-espacial**; PostGIS es estándar del sector. Pero la decisión final debe pasar por una conversación abierta, no por una decisión silenciosa.
- Microservicios vs monolito modular: para el volumen operativo (~400 unidades, decenas de despachos diarios) los microservicios son sobredimensión. Pero el principio que Raúl defendió ("no depender de un solo proveedor") es legítimo y debe respetarse a nivel de portabilidad, no de fragmentación.
- Multi-cloud por servicios vs PaaS único: portabilidad ≠ multi-cloud. Dockerizar y separar configuración ya cubre la intención.

**Camino sano:** documentar la confrontación honestamente (como hizo `PLAN_DE_SOFTWARE.md` §2), llevar la conversación al cliente como decisión técnica con argumentos, no como hecho consumado.

### 4.5 Tensión "copiloto IA" vs "operación humana confiable"

- La filosofía WAREM (copiloto, automatización responsable, humano en control) es atractiva como brújula.
- Pero en el segmento premium aeroportuario, el valor que paga el cliente es **precisamente** la presencia humana (despachador, supervisor, conductor con cartel). Sustituir esto con IA sería destruir la propuesta.

**Camino sano:** si entra IA al producto, entra como copiloto de *tareas internas repetitivas* (clasificación de mensajes, redacción de borradores, sugerencias de asignación, consolidación de reportes), nunca como sustituto del meet-and-greet ni de la decisión final de asignación.

### 4.6 Tensión "vender una idea" vs "validar una hipótesis"

- Las propuestas previas (Demo, Masterplan, Plan de Software) están escritas con tono comercial: "esto enamora al cliente", "guion de presentación", "anti-patrones de presentación".
- La instrucción de proyecto pide explícitamente lo contrario: no vender una idea antes de analizarla.

**Camino sano:** separar entregables. Un documento puede ser análisis; otro puede ser pitch; un tercero puede ser plan de implementación. Mezclarlos lleva a que el análisis colapse contra la conclusión que se quería sostener.

---

## 5. Espacio de oportunidad (sin elegir todavía qué construir)

Mapeo neutral de oportunidades posibles. Ninguna es recomendación final.

### 5.1 Oportunidad A — Plataforma digital interna de Taxi Green

- **Qué es:** modernizar el stack actual (back, sitio, app, facturación) bajo gobierno único; ordenar la operación interna; mejorar la experiencia visible del pasajero individual y corporativo.
- **Quién paga:** Taxi Green (interno).
- **Modelo:** servicio + producto interno, sin pretensión comercial inmediata.
- **Pro:** dolor real verificado; cliente existente; alcance acotado; resultado visible rápido.
- **Contra:** techo de crecimiento limitado al tamaño de Taxi Green; equipo de producto sin escala comercial.

### 5.2 Oportunidad B — Producto "Torre de Control aeroportuaria" (vertical aeropuerto)

- **Qué es:** capa digital específica para reserva aeroportuaria programada, con QR de embarque, validación en counter, asignación supervisada, comprobante consolidado.
- **Quién paga:** Taxi Green hoy; potencialmente Mitsoo/CMV/Taxi365/Taxi Directo más tarde.
- **Modelo:** producto orientado a aeropuerto, comercial.
- **Pro:** capitaliza la escasez de la concesión LAP; diferencial frente a Uber/Cabify estructurado.
- **Contra:** mercado total reducido (~5 operadores LAP en Perú); replicación internacional incierta.

### 5.3 Oportunidad C — SaaS white-label de gestión de movilidad corporativa programada

- **Qué es:** plataforma multi-tenant vendida a transportistas formales del Perú/LATAM (≈100–300 empresas según `primeras_ideas.pdf`).
- **Quién paga:** transportistas (suscripción mensual + comisión por viaje).
- **Modelo:** SaaS B2B clásico, marca blanca.
- **Pro:** mercado mayor; modelo escalable; pricing defensible.
- **Contra:** ciclo de venta largo; competencia de Cabify Empresas / SAP Concur / Uber for Business; ninguno de los clientes potenciales está validado a la fecha.

### 5.4 Oportunidad D — Producto B2B2C "Voucher Corporativo"

- **Qué es:** módulo específico que permite a una empresa generar QR/link de viaje prepagado para un invitado (candidato, paciente, ejecutivo VIP, asistente a evento) sin que el invitado tenga cuenta.
- **Quién paga:** transportistas (lo ofrecen como diferencial a sus clientes corporativos).
- **Modelo:** módulo dentro de A, B o C, o producto stand-alone integrable.
- **Pro:** dolor identificado (invitado sin app, factura sin descargo); diferencial puntual claro.
- **Contra:** caso de uso vertical estrecho; nunca debería ser el producto entero.

### 5.5 Oportunidad E — Agregador de transporte aeroportuario tipo Booking/Mozio

- **Qué es:** plataforma que conecta a las 5 concesionarias LAP entre sí y con hoteles/agencias/aerolíneas internacionales.
- **Quién paga:** comisión por viaje a hoteles, agencias o pasajeros.
- **Pro:** modelo probado globalmente (Mozio, GetTransfer, Booking.com Airport Taxis).
- **Contra:** Taxi Green pierde control de marca; LAP podría preferir un proveedor único o un sistema central; alto riesgo de canibalización entre las 5 concesionarias.

### 5.6 Oportunidad F — Copiloto interno para el despachador/operación

- **Qué es:** asistente IA que ordena mensajes entrantes (WhatsApp/correo/llamada), prepara borradores de asignación, redacta confirmaciones al pasajero, consolida reportes diarios. *Humano sigue decidiendo.*
- **Quién paga:** Taxi Green o transportistas.
- **Pro:** ataca un dolor real (saturación de despacho); ROI medible; alineado con filosofía WAREM rescatable.
- **Contra:** riesgo de comprar "IA por moda" sin que mueva ningún indicador; requiere medición disciplinada.

### 5.7 Lo que el espacio NO debería ser (anti-oportunidades razonadas)

- **App B2C masiva tipo Uber peruano:** suicida frente a Uber/Cabify/inDrive/DiDi; ya hay cadáveres en el mercado (Beat cerró noviembre 2022).
- **Marketplace inverso de subastas entre conductores:** rompe la propuesta de calidad/confianza que sostiene la marca; patrón observado en Qorinti que conviene descartar.
- **App nativa obligatoria para pasajero invitado/turista:** fricción incompatible con el caso de uso; PWA o link público sirven mejor.
- **Plataforma omnicanal multipaís año 1:** sobredimensión; el repo aún no ha validado el cliente local.

---

## 6. Principios que cualquier opción de solución debería respetar

Estos principios surgen del cruce evidencia + filosofía WAREM rescatada + sentido común de producto. Son criterios, no diseño.

1. **El humano sigue siendo el producto en el aeropuerto.** Cualquier solución que elimine al despachador, al supervisor de counter o al conductor con cartel está atacando la diferenciación, no el problema.
2. **El sistema alimenta a los actores; los actores no deberían alimentar al sistema con formularios.** Donde haya datos ya disponibles (reserva previa, vuelo, contrato corporativo) deben aparecer prellenados.
3. **Trazabilidad por defecto.** Cada viaje debe tener inicio, fin, identidad de conductor, identidad de unidad, comprobante. No como reporte adicional, sino como subproducto natural del flujo.
4. **Asignación supervisada, no marketplace abierto.** El despachador (o una regla del sistema) decide; no los conductores compiten por subasta.
5. **Conductor y unidad como entidades separadas.** Un mismo conductor puede operar distintas unidades; un mismo vehículo puede ser operado por distintos conductores. Modelarlos juntos es errar el dominio.
6. **Confianza visible, no sólo prometida.** El pasajero ve quién lo recoge, en qué unidad, a qué hora, con qué comprobante. La confianza histórica de Taxi Green debe traducirse a pixeles.
7. **Comprobante fiscal embebido en el flujo, no como anexo.** Boleta/factura SUNAT como parte natural del viaje, no como tarea de fin de mes.
8. **Independencia de proveedor a nivel de portabilidad, no de fragmentación.** Aplicación contenedorizada, configurable, sin amarres propietarios; pero no microservicios prematuros.
9. **Nada irreversible sin humano** (rescatado de WAREM). Asignar, cancelar, cerrar, facturar son acciones que dejan rastro y son revertibles donde tenga sentido.
10. **Simplicidad como criterio de decisión, no como nota al margen.** Cada función añadida debe justificar su existencia frente a un actor concreto en un caso concreto.
11. **Construir multi-tenant internamente, vender a un cliente primero.** No es lo mismo *poder* multi-tenant que *prometer* SaaS; lo primero protege futuro, lo segundo compromete recursos.
12. **La IA, si entra, entra como copiloto de tareas internas repetitivas; nunca como sustituto del juicio operativo ni del meet-and-greet.**

---

## 7. Visión provisional (qué *podría* ser, sin decidir todavía)

Esta sección es la más importante y la más cuidadosa. Es una hipótesis razonada, no un diseño.

### 7.1 Formulación en una sola frase

> Una capa digital sobria y verificable que **vuelve visible la confianza operativa que Taxi Green ya tiene**, ordena su capa B2B corporativa programada (con especial fuerza en el flujo aeroportuario), y deja preparado — sin comprometerse aún — el camino para que esa capa pueda servir a otros operadores formales del sector si el mercado lo valida.

### 7.2 Lo que esta visión **es**

- Una promesa **operativa**, no de marca: ordenar lo que ya funciona pero está disperso.
- Una promesa **focalizada**: traslado programado, con énfasis en el aeropuerto, con apoyo natural al segmento corporativo.
- Una promesa **trazable**: cada viaje deja huella suficiente para descargo contable, compliance y postventa.
- Una promesa **respetuosa del humano**: el despachador, el supervisor y el conductor son parte del valor, no obstáculos a automatizar.
- Una promesa **portable**: el código y los datos no son rehenes de un proveedor; la arquitectura puede vivir donde la gerencia decida.

### 7.3 Lo que esta visión **no** es

- No es "app de taxi" ni intento de competir con Uber/Cabify/inDrive en lo on-demand.
- No es marketplace ni subasta inversa.
- No es SaaS multipaís en año 1.
- No es copiloto IA conversacional que reemplace al despachador o al call center.
- No es modernización cosmética del sitio actual.
- No es un compromiso con un stack específico todavía. El stack se elige *después* de cerrar problema y de conversar honestamente con Raúl sobre Mongo/micros/multi-cloud.

### 7.4 Articulación por actor (visión, no diseño)

- **Pasajero individual** ve una reserva clara, una tarjeta de viaje con datos del conductor y la unidad, y un comprobante que llega solo.
- **Pasajero corporativo invitado** recibe un link/QR sin tener que descargar nada; al llegar al counter, alguien lo recibe y el sistema sabe quién es.
- **Conductor** ve sus servicios asignados, datos completos, ruta, estado del viaje en pocos toques; nada de transcribir direcciones a mano.
- **Despachador / operación Taxi Green** ve todas las reservas en un panel ordenado; asigna conductor y unidad por separado; ve excepciones (vuelo retrasado, no-show) en un solo lugar.
- **Supervisor de counter LAP** valida pasajero con tablet/QR y entrega al conductor disponible; deja huella auditable.
- **Administrador corporativo del cliente** ve el consumo de sus empleados, fija políticas, recibe una factura consolidada mensual con centros de costo.
- **Compliance / Risk corporativo** tiene un reporte exportable: quién viajó, cuándo, con qué placa, con qué conductor, validado en qué punto.
- **Gerencia Taxi Green** ve la operación viva: cuántos viajes, cuántos en counter spot, cuántos corporativos, qué cuentas están creciendo.

### 7.5 Filosofía rescatada de WAREM, aplicada a Taxi Green sin copiar dominio

- **Simplicidad radical:** cada pantalla resuelve una cosa.
- **El sistema alimenta al usuario, no al revés:** formularios mínimos; datos prellenados desde la reserva, el vuelo, el contrato corporativo.
- **Contrato de autonomía:** lo repetitivo (notificar, generar comprobante, consolidar reporte) lo hace la máquina; lo importante (asignar, validar, manejar excepción) lo decide un humano.
- **Nada irreversible sin humano:** asignaciones, cancelaciones y facturas siempre revertibles donde el negocio lo permita.
- **Auditoría embebida:** cada decisión deja rastro de qué datos usó y qué regla aplicó.

---

## 8. Diferencial estratégico provisional

Si el mercado validara esta visión, el diferencial defendible se compondría por **acumulación**, no por una sola feature.

| Capa de diferencial | Qué aporta | Quién más lo tiene en Perú hoy |
|---|---|---|
| Concesión LAP en Nivel 1 del nuevo terminal | Acceso físico a pasajeros aeroportuarios | Sólo 5 operadores. Uber/Cabify NO. |
| Marca de 25+ años en aeropuerto | Confianza histórica con corporativos | Sólo otros operadores históricos. |
| Capa digital trazable y auditable | Duty of care, descargo SUNAT, postventa | Ningún operador peruano local de tamaño Taxi Green lo tiene unificado hoy. |
| Modelo de QR-Voucher / link público para invitado | Pasajero sin cuenta atendido sin fricción | Uber for Business Vouchers a nivel global; ningún operador peruano nativo. |
| Asignación supervisada conductor + unidad | Coherente con flota afiliada (no marketplace) | Operadores tradicionales lo hacen manualmente. |
| Copiloto interno de tareas repetitivas (futuro) | Reduce carga del despachador sin reemplazarlo | Casi nadie en Perú. |
| Cumplimiento SUNAT embebido al flujo | Reduce costo administrativo del cliente corporativo | Operadores delegan a PSE; ninguno lo presenta como diferencial visible. |

Ninguna capa aislada es defensa suficiente. El defensible es el conjunto, y específicamente **el ensamblaje de concesión física + capa digital trazable + cumplimiento fiscal + experiencia corporativa**.

---

## 9. Qué validar antes de cerrar cualquier solución

Esta es la sección más operativa de todo el documento, y la más subestimada habitualmente.

### 9.1 Con Taxi Green (cliente actual)

- ¿Qué porcentaje de sus ingresos viene de (a) counter spot, (b) convenios corporativos, (c) eventos/tours, (d) hoteles/agencias? *(Sin esto no se puede priorizar el flujo a digitalizar.)*
- ¿Cuántas reservas entran al día por (i) web, (ii) WhatsApp, (iii) llamada al call center, (iv) email, (v) counter directo?
- ¿Cuánto tiempo invierte un despachador en promedio por cada reserva?
- ¿Qué clientes corporativos representan el grueso del ingreso B2B? ¿Cuál es su disposición a adoptar un cambio de proceso?
- ¿Cuál es la relación exacta con LAP? ¿Es concesión exclusiva, renovable, sujeta a tarifa por counter?
- ¿La app Android está despublicada por decisión, por descuido, o por problema técnico?
- ¿Hay disposición de Taxi Green a ser cliente-cero comprometido, o sólo busca proveedor de proyecto?
- ¿Existe acuerdo legal claro sobre propiedad intelectual del software entre Taxi Green y el equipo de desarrollo?

### 9.2 Con potenciales clientes adyacentes (si se considera SaaS)

- ¿Alguno de Mitsoo, CMV, Taxi365, Taxi Directo está dispuesto a una conversación exploratoria?
- ¿Estarían dispuestos a operar bajo una plataforma común sin perder identidad de marca?
- ¿Cuál es el pricing tope que pagarían por una herramienta de gestión?

### 9.3 Con empresas corporativas demandantes

- ¿Qué hace hoy una administradora de viajes corporativos cuando reserva un traslado al aeropuerto para un ejecutivo? (¿Llama, escribe WhatsApp, mail?)
- ¿Cuántas horas/persona al mes se gastan en consolidar facturas y centros de costo?
- ¿Qué requisitos de duty of care exigen sus áreas de Compliance/Risk?

### 9.4 Con LAP y reguladores

- ¿LAP tiene plan de estandarizar un sistema de despacho central en el nuevo terminal? *(Riesgo: bloqueo regulatorio.)*
- ¿Cuáles son los requisitos formales de operación en Nivel 1 del nuevo terminal?
- ¿Hay un cronograma público de transición desde el terminal antiguo?

### 9.5 Con la realidad SUNAT

- ¿La integración OSE/PSE actual (Fenbo Digital) cubre el caso de factura consolidada B2B con centros de costo?
- ¿Hay alternativas verificadas (Nubefact, Efact, Greenter) y cuáles son sus costos reales por documento?

---

## 10. Implicancias para la demo (sólo como nota, no como diseño)

La instrucción del proyecto pide **no** diseñar demo en esta pasada. Pero conviene dejar señales útiles para la próxima.

### 10.1 Lo que la demo debería ser capaz de demostrar

- Que un viaje corporativo programado al aeropuerto puede crearse, asignarse, ejecutarse y cerrarse con trazabilidad completa, sin tareas manuales fuera del sistema.
- Que el pasajero invitado puede ser atendido **sin descargar nada**.
- Que el conductor recibe lo que necesita en pocos toques.
- Que el despachador tiene visibilidad real, no Excel paralelo.
- Que la factura electrónica nace del cierre del viaje, no se reconstruye después.
- Que la operación física (counter, supervisor) sigue siendo central, no eliminada.

### 10.2 Lo que la demo NO debería ser

- No debería ser "una app más bonita que la actual".
- No debería competir visualmente con Uber: copiar mapa-céntrico es entrar en su terreno.
- No debería sobre-prometer capacidades de IA que no estén medidas.
- No debería incluir cuatro vistas equilibradas: la vista del **despachador** o del **supervisor de counter** probablemente sea la protagonista en términos narrativos, porque es donde reside el moat operativo de Taxi Green.
- No debería incluir un módulo SaaS multi-empresa funcional, sólo como gesto narrativo si acaso ("preparado para multi-operador" como inferencia, no como producto).
- No debería extender más allá de lo razonable para una demo (≤2 semanas de construcción dedicada).

### 10.3 Hipótesis a contrastar con Raúl antes de cerrar demo

- ¿La demo va a ser para Taxi Green o para usar Taxi Green como caso ante terceros?
- Si es para Taxi Green: ¿qué actor le interesa ver más cómodo? ¿pasajero, despachador, conductor, gerencia?
- Si es para usar Taxi Green como caso ante terceros: ¿está Taxi Green de acuerdo con esa exposición?

---

## 11. Riesgos identificados

Los riesgos se separan en categorías para evitar mezclar peligros de naturaleza distinta.

### 11.1 Riesgos de negocio

| Riesgo | Probabilidad | Impacto | Mitigación posible |
|---|---|---|---|
| Taxi Green es cliente único y no escala el modelo | Media | Medio | Diseñar multi-tenant interno aunque se venda sólo a Taxi Green |
| Las otras concesionarias LAP rechazan colaborar | Media-alta | Medio | No prometer SaaS multi-tenant antes de validar |
| LAP impone sistema propio centralizado | Media | Alto | Vigilar comunicaciones LAP, mantener arquitectura compatible |
| Cabify/Uber for Business lanzan vertical aeropuerto Perú | Media en 2–3 años | Alto | Vertical profunda + cumplimiento local + concesión LAP como defensa |
| Inversión no se recupera por mercado demasiado estrecho | Media | Alto | Validar pricing y disposición a pagar antes de construir |

### 11.2 Riesgos operativos

| Riesgo | Probabilidad | Impacto | Mitigación posible |
|---|---|---|---|
| Conductores afiliados rechazan adoptar app/PWA | Media | Alto | Interfaz extremadamente simple (3–4 toques); incentivo claro |
| Despachadores actuales perciben el sistema como vigilancia y sabotean | Media | Alto | Co-diseño con despachadores; el sistema asiste, no controla |
| Pasajeros corporativos no perciben diferencia en su experiencia | Media | Medio | Tarjeta de embarque digital + comprobante automático como señales tangibles |
| Caída del sitio/sistema en hora pico aeroportuaria | Alta sin disciplina | Alto | Observabilidad mínima desde día 1, plan de contingencia operativa |

### 11.3 Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación posible |
|---|---|---|---|
| Adoptar Mongo por presión del cliente y sufrir en consultas geo-espaciales | Media | Alto | Confrontar técnica y explícitamente; no obedecer en silencio |
| Adoptar microservicios prematuros y duplicar costos de operación | Media | Alto | Monolito modular bien organizado; extraer servicio sólo cuando duela |
| Dependencia de un proveedor único de mapas, push o pagos | Media | Medio | Capa de abstracción por integración (Mapbox/Google/Leaflet intercambiables) |
| Capa fiscal SUNAT mal modelada genera comprobantes inválidos | Alta sin cuidado | Alto | Integración con OSE/PSE existente (Fenbo, Nubefact, Efact); no reinventar |

### 11.4 Riesgos de proceso / equipo

| Riesgo | Probabilidad | Impacto | Mitigación posible |
|---|---|---|---|
| Construcción se acelera sin contrato de IP/equity claro | Alta | Catastrófico | Cerrar acuerdo legal antes del MVP |
| Equipo confunde demo con producto y entrega ambas mal | Alta sin disciplina | Alto | Separar entregables: análisis ≠ demo ≠ producto |
| Documentación gira sobre sí misma (más documentos que decisiones) | Alta | Medio | Cada documento cierra al menos una decisión o pregunta |
| Las propuestas previas se vuelven anclas que sesgan el análisis | Alta | Alto | Esta carpeta `05_FINAL` se trata como pasada nueva, no como cierre |

### 11.5 Riesgos epistémicos (de este propio análisis)

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Las tres investigaciones IA (Claude/ChatGPT/Gemini) repiten supuestos no validados | Alta | Marcar claramente lo no validado |
| Confundir interpretación con voz del cliente | Media | Distinguir `dicho en reunión` de `inferencia` |
| Trasladar inadvertidamente dominio WAREM/Qorinti | Media | Vigilancia explícita en cada principio rescatado |
| Quedarse en análisis perpetuo sin tomar decisión | Alta | Cerrar próxima pasada con decisión o con preguntas concretas al cliente |

---

## 12. Preguntas críticas abiertas

Estas son las preguntas que conviene llevar al cliente o resolver con evidencia adicional antes de una segunda pasada que cierre opción de producto.

### 12.1 Sobre el problema

1. ¿Qué duele *hoy* más a Taxi Green: la operación interna (coordinación, despacho, asignación) o la experiencia del pasajero (web, app, comprobante)?
2. ¿Hay un evento concreto (queja, pérdida de cliente, multa SUNAT) que esté disparando la urgencia del proyecto, o es una decisión de modernización estratégica?
3. ¿Cuánto le cuesta a Taxi Green hoy una reserva mal ejecutada (no-show, asignación tardía, factura observada)?

### 12.2 Sobre el cliente

4. ¿Quién es el comprador real dentro de Taxi Green? ¿Raúl, gerencia, directorio?
5. ¿Cuál es el presupuesto razonable y el horizonte de ROI esperado?
6. ¿Existe sponsor ejecutivo con poder sobre alcance, datos y proceso?

### 12.3 Sobre el mercado

7. ¿Las otras 4 concesionarias LAP son potenciales clientes, competencia, o irrelevantes?
8. ¿Qué porcentaje del mercado corporativo programado está hoy efectivamente en manos de operadores formales como Taxi Green vs Cabify Empresas vs Uber for Business?
9. ¿LAP tiene apetito o desinterés por estandarizar un sistema central de despacho?

### 12.4 Sobre la arquitectura

10. ¿Cuál es la postura real de Raúl frente al cambio Mongo→PostgreSQL+PostGIS si se le presenta con argumentos?
11. ¿Hay restricciones de hosting (preferencia por cloud específico, requerimiento on-premise, soberanía de datos)?
12. ¿Qué tan dispuesto está Taxi Green a migrar gradualmente desde el PHP actual vs construir en paralelo?

### 12.5 Sobre la demo / siguiente paso

13. ¿La demo va a Taxi Green directamente, o se está construyendo para una mesa de trabajo posterior con un público distinto?
14. ¿Hay una fecha objetivo dura?
15. ¿La demo debe demostrar capacidad técnica del equipo, o capacidad de entender el negocio del cliente? (No es lo mismo.)

---

## 13. Conclusión provisional, nivel de confianza y siguiente paso

### 13.1 Lo que se puede afirmar con confianza alta

- Taxi Green tiene un activo defendible (concesión LAP + marca + flota) y un pasivo digital (stack fragmentado, app rota, facturación tercerizada).
- El segmento corporativo programado con cuenta marco y descargo contable es estructuralmente afín a este tipo de operador y no es atendido por Uber/Cabify/inDrive con la misma profundidad de cumplimiento.
- La operación física aeroportuaria (counter, supervisor, conductor con cartel) es parte del valor, no un costo a eliminar.
- Un modelo de marketplace abierto tipo Uber sería destructivo para esta propuesta de valor.

### 13.2 Lo que se puede afirmar con confianza media

- Una capa digital centrada en *trazabilidad + experiencia corporativa + cumplimiento fiscal* tiene espacio en el mercado peruano de transporte aeroportuario y ejecutivo.
- El "QR-Voucher" o equivalente (link público + validación bidireccional) es un artefacto razonable para resolver el caso del pasajero invitado.
- Un stack relacional con extensiones geo-espaciales es técnicamente más adecuado que NoSQL para este dominio.
- Multi-tenancy debería estar en la arquitectura, no necesariamente en el go-to-market inicial.

### 13.3 Lo que sigue siendo `hipótesis` o `por validar`

- Que las otras 4 concesionarias LAP estén dispuestas a un SaaS común.
- Que el mercado de transportistas formales (~100–300 empresas en Perú según `primeras_ideas.pdf`) sea efectivamente capaz de pagar suscripción SaaS.
- Que Taxi Green esté dispuesto a ser cliente-cero comprometido en un producto reutilizable, y no sólo comprador de software a medida.
- Que un pasajero invitado adopte mejor un QR/link público que una app — razonable pero no observado.
- Que la IA como copiloto interno de despacho mueva indicadores de productividad reales en este volumen operativo.

### 13.4 Lo que **explícitamente no se decide** en este documento

- Si se construye app nativa, PWA, web responsiva o combinación.
- Si se elige PostgreSQL, Mongo, Firebase o híbrido.
- Si se elige monolito modular, microservicios o serverless.
- Si la demo cubre 1, 2, 3 o 4 vistas funcionales.
- Si el modelo comercial final es proyecto cerrado, SaaS multi-tenant, joint-venture con Taxi Green o licenciamiento por viaje.
- Si entra IA y dónde.

Estas decisiones requieren las respuestas de la sección 12 y, en algunos casos, prototipos rápidos antes de comprometer dirección.

### 13.5 Nivel de confianza global del documento

- **Confianza alta** sobre lo que dice el repo y las contradicciones internas.
- **Confianza media** sobre el problema real del cliente (porque hay sólo una reunión documentada y mucha interpretación posterior).
- **Confianza baja** sobre el mercado adyacente (porque ninguna de las otras empresas mencionadas ha sido contactada según lo que se ve en el repo).
- **Confianza muy baja** sobre cualquier afirmación de tamaño de mercado o de "tendencias LATAM" — los datos provienen de fuentes secundarias y, en algunos casos, contradictorias.

### 13.6 Siguiente paso recomendado

Una segunda pasada debería:

1. **Llevar la sección 12 al cliente** (Taxi Green) en una conversación estructurada antes de cerrar opción de producto.
2. **Decidir explícitamente** entre Oportunidad A (sistema interno de Taxi Green), B (vertical aeropuerto), C (SaaS multi-tenant), D (Voucher), o una combinación priorizada.
3. **Cerrar el debate técnico Mongo/microservicios/multi-cloud** con Raúl con honestidad, no como hecho consumado.
4. **Sólo entonces** diseñar la demo, eligiendo qué actor protagoniza la narrativa según la decisión anterior.
5. **Sólo después de la demo bien recibida** considerar SaaS, copiloto IA, expansión a otras concesionarias.

### 13.7 Una nota final sobre el tono de los próximos documentos

Los documentos previos están escritos con tono comercial ("esto enamora al cliente", "guion de presentación"). Para una segunda pasada útil, conviene mantener el tono de este documento: sobrio, etiquetado, con preguntas abiertas. La venta vendrá después. Lo que toca ahora es no confundirse uno mismo, y dejar que la decisión emerja del análisis en lugar de defenderla retroactivamente.

---

## Apéndice — Mapa de fuentes y etiquetas

Para facilitar la próxima pasada, este mapa puede usarse como referencia rápida.

| Carpeta | Cómo tratarla | Riesgo si se trata mal |
|---|---|---|
| `00_EVIDENCIA_REAL/reuniones` | Voz del cliente, pero interpretada en algunos archivos | Tomar interpretación como voz literal |
| `00_EVIDENCIA_REAL/taxigreen` | Observación del sistema y mercado | Confundir inferencia técnica con evidencia operativa |
| `00_EVIDENCIA_REAL/referencias_qorinti` | Patrones funcionales de otro proyecto | Trasladar dominio Qorinti a Taxi Green |
| `01_INVESTIGACIONES_IA/claude` | Análisis sintetizado, ya cercano a recomendación | Tratar como verdad |
| `01_INVESTIGACIONES_IA/chatgpt` | Convergente con Claude, posible eco | Confiar en la coincidencia entre IAs |
| `01_INVESTIGACIONES_IA/gemini` | Mejor en marco regulatorio y benchmarks globales | Confiar en cifras de fuentes secundarias |
| `02_PROPUESTAS_PREVIAS` | Historial de pensamiento, no decisión | Cerrar opciones antes de evaluar |
| `03_REFERENCIAS_EXTERNAS/vision_final_warem` | Filosofía rescatable (copiloto, simplicidad, contrato de autonomía) | Copiar dominio WAREM/Pepethefrog |
| `03_REFERENCIAS_EXTERNAS/WAREM_Plan_Software_Consolidado` | No leído en profundidad en esta pasada | — |

**Recordatorio epistémico final:**
Las etiquetas `evidencia directa`, `dicho en reunión`, `propuesta previa`, `investigación IA`, `inferencia`, `hipótesis`, `por validar` y `contradicción` no son decorativas. Son la única forma de impedir que el análisis se convierta lentamente en defensa de una idea preconcebida.

---

*Fin del documento. Esperando preguntas, validaciones o instrucciones para la segunda pasada.*

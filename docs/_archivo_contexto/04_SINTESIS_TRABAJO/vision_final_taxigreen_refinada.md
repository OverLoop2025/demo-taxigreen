# Visión final refinada — Taxi Green

**Fecha:** 2026-05-21.
**Naturaleza:** documento estratégico interno. NO se entrega al cliente. La pieza para cliente es el one-pager incluido en `que_presentar_a_taxigreen_refinado.md`.
**Estado de los predecesores:** este documento reemplaza la lectura estratégica de `vision_final_taxigreen.md`. Conserva sus fortalezas (cierre de puertas, condiciones de avance, mapeo de riesgos) y corrige sus debilidades (asunción de cliente-cero sin evidencia, pasajero corporativo invitado como protagonista sin mix de ingresos validado, subestimación del riesgo LAP/ATU, IP sin bajar a términos, sin plan B si el B2B no pesa, roadmap optimista).
**Tono:** sin humo, sin "transformación digital", sin "ecosistemas". Cada afirmación importante etiquetada o caída a evidencia/hipótesis/riesgo.

---

## 0. Tesis central

Una sola, sin matices que diluyan:

> **Convertir a Taxi Green en el operador formal más trazable del aeropuerto de Lima**, mediante un flujo verificable de reserva, voucher con código QR, asignación supervisada de conductor y unidad, ejecución registrada y cierre con comprobante electrónico. Empezar exclusivamente en el corredor aeropuerto. Abrir corporativo y otros segmentos solo si la operación real de Taxi Green lo justifica con datos.

No es app de taxi. No es SaaS regional. No es marketplace. No es copiloto IA. No es modernización cosmética del sitio actual. No es portal corporativo completo en fase 1.

Es trazabilidad operativa formal con artefacto físico-digital (voucher/QR) como núcleo.

### 0.1 Por qué esta tesis y no otra

La elegí entre cinco formulaciones candidatas:

| Formulación candidata | Por qué la descarté |
|---|---|
| "Sistema de despacho moderno para Taxi Green" | Suena a software a medida sin diferencial; no se distingue de cualquier dispatch. |
| "Plataforma corporativa para movilidad ejecutiva" | Asume que el B2B pesa. No tenemos dato. Si pesa <10%, queda vacía. |
| "App pasajero premium" | Compite donde Uber/Cabify ya ganan; suicida. |
| "SaaS multi-operador para remisses formales" | Cero validación con un solo comprador adicional. Humo. |
| **"Operador formal más trazable del aeropuerto + voucher/QR + comprobante"** | Se ancla en el activo único (concesión LAP + counter), tiene artefacto vendible (voucher), y produce ahorro operativo medible (comprobante + descargo + menos llamadas). |

La formulación elegida sobrevive a los tres escenarios más probables (Taxi Green cliente-cero, Taxi Green compra proyecto, B2B pesa o no pesa) con ajuste menor. Las otras cuatro se rompen en al menos uno.

---

## 1. Auditoría brutal de los documentos previos

Necesaria como base. Si no se hace explícita, la versión refinada repite los errores.

### 1.1 `vision_final_taxigreen.md` (mi versión anterior) — fallas

1. **Asume cliente-cero sin evidencia.** Toda la fase 0 y el roadmap suponen que Taxi Green firma un acuerdo de discovery pagado. No hay nada en la transcripción de reunión que lo respalde. Raúl describió una demo, no un compromiso de proceso.
2. **Pasajero corporativo invitado como protagonista sin mix de ingresos.** Es razonable como hipótesis, no como decisión. Si el counter spot pesa 70% y el corporativo invitado 5%, el flujo protagonista está mal elegido.
3. **Riesgo LAP/ATU mencionado, no dimensionado.** El nuevo terminal ya tiene operación con QR + counter + app conductor (referencia ATU 2025 citada en `vision_chatgpt_taxigreen.md`). Es plausible que el sistema central exista o esté llegando. Mi versión anterior lo trata como riesgo a vigilar; debería ser supuesto a validar primero, no después.
4. **IP mencionada, no negociable.** Decir "cerrar acuerdo de IP antes de construir" no es plan. Plan es decir qué tres opciones se presentan y cuáles son los términos mínimos.
5. **Roadmap de tres fases optimista.** Asume que Fase 2 (corporativo) llega tras 30 días de Fase 1. Sin venta corporativa probada, eso es deseo.
6. **Sin plan B si el B2B no pesa.** El documento se rompe en silencio si Taxi Green dice "el corporativo es el 4% de nuestros ingresos".

### 1.2 `que_presentar_a_taxigreen.md` (mi versión anterior) — fallas

1. **20 preguntas de validación.** Imposible en una reunión real. Hay que recortar a 15 con jerarquía clara (5+5+5).
2. **Slice funcional de 10–14 días-persona antes de compromiso.** Es trabajo a riesgo. Si Taxi Green dice no, el equipo perdió 80–120 horas. Hay que ofrecer tres niveles de demo y solo construir el alto si hay carta de intención o anticipo.
3. **No resuelve si el slice va antes o después de la reunión.** Es ambiguo. Lo refinado: nivel 0 y nivel 1 antes; nivel 2 solo después y solo si hay compromiso firmado.
4. **Asume que Taxi Green pagará discovery.** Sin plan B fuerte si dicen "muéstrenos primero algo gratis".
5. **No baja "cliente-cero vs proyecto" a lenguaje de negocio.** Para un gerente, "cliente-cero" no significa nada. Hay que decirlo como "ustedes pagan menos a cambio de que reusemos el producto en otros operadores no competidores" o "ustedes pagan tarifa completa y todo es de ustedes".
6. **Falta one-pager comercial.** El cliente debe quedarse con UNA hoja en la mano, no con un documento estratégico de 700 líneas.

### 1.3 Contradicciones entre ambos documentos

- La visión dice "multi-tenant en arquitectura, mono-tenant en go-to-market". La presentación no traduce eso a propuesta comercial concreta. Quedó en el aire.
- La visión propone IA copiloto en fase 2. La presentación no la menciona. ¿Se vende o no se vende? Refinado: no se vende todavía, ni siquiera en fase 2 sin volumen de WhatsApp medido.
- La visión asume conductores adoptan PWA. La presentación asume despachador acepta panel. Ambos sin co-diseño previo. Refinado: ambas adopciones son hipótesis a validar en discovery, no supuestos del diseño.

### 1.4 Partes que asustan al cliente si las ve tal cual

- La sección de "Lo que NO se decide en este documento" suena a equipo dubitativo. Internamente es honestidad; externamente es inseguridad.
- La tabla de niveles de confianza ("baja", "muy baja") es necesaria internamente; al cliente le transmite que no estamos seguros de nada.
- Las preguntas sobre estado de la app Android, propiedad de cuentas de stores y acceso a código fuente son operativas; preguntarlas en deck inicial suena a auditoría. Van al backup, no a la slide principal.

---

## 2. Idea exacta que se va a vender, en lenguaje de gerente

Si un dueño de Taxi Green pregunta "¿qué me vas a hacer?", la respuesta debe ser esta, en máximo 30 segundos:

> "Hoy ustedes reciben reservas por web, WhatsApp, llamada, correo y counter. La asignación de conductor y unidad la coordina su gente manualmente, la factura la emite un proveedor externo, y el seguimiento del viaje vive en chats. Lo que proponemos es ordenar ese flujo: una sola reserva, un voucher con código QR que el pasajero recibe en su teléfono o que la empresa cliente le envía, validación rápida en su counter del aeropuerto, asignación de conductor y unidad con un par de clicks, comprobante automático al cierre, y reporte de qué traslados pasaron en el mes. Empezamos por el aeropuerto porque ahí está su diferencial. Si funciona, conectamos lo corporativo después."

Sin "transformación", sin "ecosistema", sin "inteligencia artificial".

### 2.1 Qué gana Taxi Green, con números aterrizables (rangos, no promesas)

Estos rangos son **hipótesis de trabajo**; deben validarse en discovery con datos reales de Taxi Green. Aparecen aquí para internalizar magnitudes, no para prometerlas al cliente sin matiz.

- Reducción de llamadas de confirmación pasajero ↔ central: rango plausible 30–60% si la mayoría de reservas hoy generan al menos una llamada de seguimiento.
- Reducción de tiempo de asignación en counter: rango plausible 1–3 minutos por viaje walk-in si hoy es >5 minutos.
- Reducción de errores de comprobante (boleta vs factura, RUC mal escrito): rango plausible 50–80% al automatizar el dato desde la reserva.
- Mejora en cierre fiscal mensual: rango "días-persona ahorrados" depende del volumen. Solo medible en discovery.

**Nada de esto se promete al cliente sin matiz**. Al cliente se le dice: "ese tipo de mejora es lo que esperamos validar en el piloto; los números reales los sacamos de su operación".

### 2.2 Qué NO se vende todavía

Lista explícita para que ningún miembro del equipo prometa por inercia:

- App pasajero nativa.
- Portal corporativo completo (centros de costo + presupuestos + aprobaciones).
- IA copiloto / asistente de despacho.
- Flight tracking integrado.
- Pagos reales integrados (queda con el PSP actual o se simula en piloto).
- Facturación SUNAT propia (se queda con Fenbo o el PSE actual).
- Integración con hoteles, agencias o aerolíneas.
- SaaS para otros operadores.
- Marketplace o subasta.
- Reservas on-demand tipo Uber.

---

## 3. Hipótesis críticas, con grado de fortaleza

Cada hipótesis declarada con su soporte y su fragilidad. Si una se rompe, el efecto se documenta en §5.

| Hipótesis | Soporte | Fragilidad | Cómo validarla | Si se rompe |
|---|---|---|---|---|
| H1: El corredor aeropuerto es el flujo donde más se siente el moat de Taxi Green | Concesión LAP en Nivel 1 del nuevo terminal; observación directa del sitio actual centrado en aeropuerto. | Alta. Es razonable, no medida. | Pedir a Taxi Green el % de viajes mensuales que tocan aeropuerto. | Ver §5 escenario 6. |
| H2: El voucher/QR es el artefacto correcto para el pasajero invitado y para la validación en counter | Patrón global probado (Uber for Business Vouchers, Welcome Pickups); ATU 2025 ya menciona QR en counter del nuevo terminal. | Media. Aún no validado localmente con Taxi Green. | Mostrar en la demo y observar reacción del supervisor de counter. | Pivotar a credencial alternativa (código numérico + DNI, link sin QR). El núcleo de la propuesta sobrevive. |
| H3: Taxi Green aceptará discovery pagado de 4–6 semanas | Cero evidencia. Es nuestro deseo. | **Muy alta.** | Pedirlo directamente en la reunión. Sin más vuelta. | Ver §5 escenario 4. |
| H4: El B2B corporativo programado pesa al menos 15–25% de los ingresos de Taxi Green | Inferencia de propuestas previas y de la actividad corporativa declarada en su sitio. | Alta. Sin dato real. | Pregunta directa en discovery. | Ver §5 escenario 6. |
| H5: LAP/ATU no impondrá un sistema central de despacho que reemplace el sistema propio de cada operador | Inferencia. El reporte ATU 2025 describe counter + QR + app conductor pero no aclara si es propio de operador o estandarizado. | **Alta.** Riesgo subestimado en mi versión anterior. | Pregunta a Taxi Green; verificación con fuente oficial LAP. | Ver §5 escenario 5. |
| H6: Conductores afiliados de Taxi Green aceptarán una vista móvil (PWA o app ligera) | Inferencia. Hay smartphones; hay precedente Qorinti, pero Qorinti no es Taxi Green. | Media-alta. | Observación + entrevista con 5–8 conductores. | Producto sigue viable con vista conductor por WhatsApp estructurado (mensajes con link a vista web mínima). |
| H7: El equipo desarrollador tiene capacidad real de entregar fase 1 en 8–12 semanas con el stack PostgreSQL + Next.js + monolito modular | Capacidad técnica asumida. | Media. Depende del equipo concreto. | Estimación interna realista antes de la reunión. | Renegociar alcance o tiempo con cliente. |

**Hipótesis más peligrosa de las 7:** H3 (que Taxi Green pague discovery). Es donde mi versión anterior se rompe en silencio. El refinado tiene plan B en §5.

---

## 4. Lo que se construye, lo que no se construye, lo que se aplaza

### 4.1 Lo que se construye en fase 1 (solo si hay carta de intención + anticipo)

Componentes mínimos del producto:

1. **Web pública de reserva** (ciudad → aeropuerto, aeropuerto → destino).
2. **Voucher con QR** generado al confirmar reserva, enviable por mail/WhatsApp/link.
3. **Panel operativo central** (web) para despacho: ver reservas, asignar conductor y unidad por separado, gestionar excepciones.
4. **Vista módulo counter** (web responsivo / tablet) para supervisor aeropuerto: validar QR, confirmar asignación, cerrar entrega.
5. **Vista conductor** (PWA optimizada; si la adopción lo justifica, app ligera más adelante): recibir asignación, ver datos, marcar estados.
6. **Modelo de datos relacional con `tenant_id`** desde día 1 (multi-tenant en arquitectura, no en venta).
7. **Integración con PSE actual** (Fenbo o equivalente) para boleta/factura sin reinventar la capa fiscal.
8. **Observabilidad mínima** (logs estructurados, métricas básicas de uso).

Nada más.

### 4.2 Lo que no se construye en fase 1, aunque parezca tentador

- App pasajero nativa.
- Pagos reales integrados (se queda con la pasarela actual o se simula).
- Portal corporativo con presupuestos y aprobaciones.
- IA de despacho.
- Flight tracking.
- Reportes BI elaborados (basta CSV exportable).
- Internacionalización (multi-idioma).
- Modo offline en vista conductor.
- WhatsApp Business automation.
- Sistema de calificaciones bidireccional.

### 4.3 Lo que se aplaza a fase 2 (condicional a métricas de fase 1)

- Capa corporativa ligera: la empresa cliente genera vouchers, ve consumo, descarga reporte. Solo si el discovery confirmó que el B2B pesa.
- Reportes ejecutivos para gerencia Taxi Green.
- Si volumen WhatsApp medido lo justifica: copiloto de clasificación de WhatsApp entrante.

### 4.4 Lo que se aplaza a fase 3 (condicional a validación con terceros)

- Evaluación SaaS: solo después de fases 1 y 2 cumplidas, con entrevistas a 5–10 operadores formales.

---

## 5. Matriz de escenarios — qué hacemos si las hipótesis caen

Esta sección es la corrección más importante a mi versión anterior. Sin escenarios explícitos, la visión se rompe en silencio.

### 5.1 Escenario 1 — Taxi Green acepta ser cliente-cero comprometido

**Definición operativa:** Taxi Green firma carta de intención, paga anticipo de discovery, asigna sponsor ejecutivo, abre acceso a stakeholders y a counter, acepta que el equipo conserve el núcleo del software para evolucionarlo más allá de Taxi Green (con exclusividad acotada en sector y geografía).

**Qué se negocia:** términos del Opción B en §7 (tarifa preferente, exclusividad acotada, prioridad de soporte, co-marca en piloto).

**Qué se construye:** discovery (4–6 semanas) → fase 1 mínima (8–12 semanas). Sin saltarse pasos.

**Qué se valida en discovery:** mix de ingresos, peso real del B2B, postura LAP/ATU, adopción del conductor, integración con Fenbo, contratos PSP.

**Qué se mide en piloto:** tiempo de asignación en counter, número de llamadas de confirmación pasajero ↔ central, errores de comprobante, tiempo de cierre fiscal mensual.

**Qué se cobra:** discovery con anticipo + pago contra entregables; fase 1 por etapas con hitos pagados.

**Qué conserva el equipo:** código fuente del núcleo (motor de reservas, voucher, panel, datos modelados como multi-tenant). Taxi Green tiene licencia perpetua de uso para su operación, exclusividad acotada (sector aeropuerto Lima/Callao, 12–18 meses).

### 5.2 Escenario 2 — Taxi Green solo quiere una demo, no compromiso

**Definición operativa:** Taxi Green pide que se muestre algo, no acepta discovery pagado, no firma carta de intención, dice "muéstrenme y luego vemos".

**Qué demo se muestra:** **nivel 0 (deck + Figma + flujo narrado) o nivel 1 (prototipo navegable con datos simulados)**, nunca nivel 2.

**Qué NO se construye:** slice funcional con backend real. Cero código de producto antes de compromiso.

**Tiempo máximo invertido:** 5 días-persona en total (3 días en Figma + 2 días en deck + ensayo). No más.

**Qué se pide a cambio:**
- Una pregunta cerrada al final de la reunión: "después de ver esto, ¿estarían dispuestos a pagar un discovery acotado para validar el caso de negocio, sí o no?"
- Si la respuesta es "sí" → escenario 1.
- Si la respuesta es "tal vez" → segunda reunión en 2 semanas con datos refinados, pero ya con condición de discovery pagado en la mesa.
- Si la respuesta es "no, queremos ver más antes" → escenario 4.

**Cómo evitar trabajar gratis indefinidamente:** regla interna de "tres strikes". Tres reuniones sin compromiso = se cierra el ciclo comercial y se ofrece el material a otro operador del sector. No hay cuarta reunión sin contrato.

### 5.3 Escenario 3 — Taxi Green quiere un proyecto a medida, todo de ellos

**Definición operativa:** Taxi Green dice "queremos el código, los diseños, la propiedad total, sin que ustedes lo reusen con nadie".

**Cómo cambia el enfoque:** ya no es producto, es servicio de desarrollo a medida. Se cobra tarifa de proyecto cerrado o por horas, sin descuento de cliente-cero.

**Qué se cobra:** múltiplo de 1.5x–2.5x sobre la tarifa de cliente-cero. La razón se explica al cliente: "el descuento de cliente-cero existe porque conservamos el núcleo para reutilizarlo; si todo es exclusivo de ustedes, perdemos esa optionalidad y compensamos en precio".

**Qué pasa con la propiedad intelectual:** Taxi Green se queda con todo el código y diseños desarrollados a medida. El equipo conserva derecho sobre frameworks, herramientas internas y conocimiento general (cosa que el código de proyecto no incluye).

**Qué partes pueden reutilizarse:** ninguna del código entregado. El conocimiento del equipo (patrones, arquitectura, decisiones) sí es del equipo.

**Qué partes serían exclusivas:** el código completo + diseños + diagramas específicos al dominio Taxi Green.

**Riesgo a evaluar internamente antes de aceptar:** este escenario convierte al equipo en proveedor, no en empresa de producto. Si la estrategia del equipo es construir empresa de producto, debe valorarse si vale la pena este proyecto vs invertir el mismo tiempo en otro cliente que sí acepte cliente-cero.

### 5.4 Escenario 4 — Taxi Green no quiere pagar discovery

**Definición operativa:** Taxi Green muestra interés pero no quiere abrir cheque por entrevistas/observación; piden "demuéstrennos primero".

**Plan B realista — micro-validación gratuita acotada:**

1. **Reunión de 2 horas, gratis,** con el material nivel 0 ya preparado.
2. **Una entrevista con la persona de operaciones**, máximo 90 min, gratis. A cambio: acceso a 3 preguntas duras (mix de ingresos aproximado, postura LAP, peso del B2B).
3. **Observación de 1 turno en counter**, gratis. A cambio: el equipo entrega al cliente un mini-informe de 1 página con hallazgos.
4. **Carta de intención no vinculante** que diga: "si después de esto encontramos caso de negocio, pasamos a discovery pagado".

**Inversión total del equipo en plan B:** 4–6 días-persona, no más.

**Si después del plan B sigue sin haber compromiso:** se aplica la regla de tres strikes. El equipo cierra y reasigna esfuerzo.

**Condiciones para seguir o parar:**
- Seguir si: hay sponsor ejecutivo identificado + acceso confirmado a 3+ stakeholders + dato del mix de ingresos compartido + fecha objetivo de proyecto.
- Parar si: faltan dos o más de las condiciones anteriores después del plan B.

### 5.5 Escenario 5 — LAP/ATU impone sistema centralizado de despacho con QR

**Definición operativa:** Se descubre (en discovery o por comunicación pública) que el nuevo terminal opera un sistema único de despacho/QR/asignación; cada operador es cliente de ese sistema, no construye el suyo.

**Cómo cambia la propuesta:** el flujo aeropuerto → destino y el voucher/QR pierden valor diferencial en counter (ya los provee LAP). La propuesta deja de ser "el operador más trazable del aeropuerto" y pasa a ser **"capa interna de Taxi Green para reservas, despacho, conductor, comprobantes y reportes, integrada con el sistema oficial del terminal"**.

**Qué queda vivo:**
- Reservas web/WhatsApp del corredor ciudad → aeropuerto.
- Vista conductor de Taxi Green (la app oficial de terminal probablemente cubre solo el momento en aeropuerto, no el viaje completo).
- Panel central de Taxi Green para ver toda la operación (lo de aeropuerto se integra leyendo del sistema oficial).
- Capa de comprobante electrónico embebida al flujo.
- Capa corporativa ligera con vouchers (independiente del aeropuerto).

**Qué muere:**
- Voucher/QR como artefacto diferencial en counter.
- Vista módulo propia (queda reemplazada por la del terminal).
- Narrativa "el operador más trazable del aeropuerto".

**Si pasa: el producto se convierte en capa interna + integrador con el sistema oficial.** El alcance baja, el atractivo comercial baja, pero el caso de negocio sigue (más reservas convertidas + menos llamadas + comprobante limpio + reportes).

**Decisión condicional:** si discovery confirma este escenario, evaluar si Taxi Green sigue interesado en pagar por algo más modesto. Si no, terminar contrato de discovery con entrega del informe y cerrar.

### 5.6 Escenario 6 — El B2B corporativo pesa <10% de los ingresos de Taxi Green

**Definición operativa:** discovery revela que el 80–90% de los ingresos vienen de counter spot + reservas individuales web/WhatsApp + ocasional hotel; el corporativo programado es marginal.

**Cómo cambia el protagonista:**

| Variante del escenario 6 | Nuevo protagonista | Qué cambia en el producto |
|---|---|---|
| 6a. Counter spot domina (>60% de ingresos) | Supervisor de counter como actor central | Vista módulo + cola de conductores + voucher generado en counter para el pasajero walk-in. La web pasajero baja prioridad. |
| 6b. Pasajero recurrente individual domina | Pasajero local recurrente | Web pasajero + sistema de "viajes guardados" + reserva rápida. Capa B2B se elimina. |
| 6c. Operación interna es el dolor principal | Despachador/operación | Panel operativo + integración WhatsApp + comprobantes. La capa pasajero es secundaria. |

**Si pasa cualquier variante de escenario 6: la tesis central sobrevive con ajuste de protagonista.** La oportunidad sigue siendo "operador formal más trazable del aeropuerto"; el actor cambia pero el voucher, la asignación supervisada y el comprobante embebido siguen siendo el núcleo.

**Lo que se invalida:** la promesa de portal corporativo ligero en fase 2.

### 5.7 Tabla resumen de escenarios

| Escenario | Probabilidad | Impacto en la tesis | Acción |
|---|---|---|---|
| 1. Cliente-cero comprometido | Media-baja | Tesis sobrevive completa | Avanzar con discovery pagado. |
| 2. Solo demo, sin compromiso | Media | Tesis sobrevive como narrativa | Mostrar nivel 0/1; pedir cierre sí/no al final. |
| 3. Proyecto a medida, todo de ellos | Media | Tesis se simplifica; cambia modelo de negocio | Cobrar 1.5x–2.5x; evaluar internamente si conviene. |
| 4. No quieren pagar discovery | Media-alta | Tesis sobrevive solo si micro-validación gratis revela compromiso | Plan B acotado, máximo 6 días-persona, regla de tres strikes. |
| 5. LAP/ATU centraliza | Media | Tesis pierde diferencial aeropuerto; sobrevive como capa interna integradora | Reformular alcance; cobrar menos; evaluar interés residual. |
| 6. B2B corporativo no pesa | Media-alta | Tesis sobrevive con ajuste de protagonista | Pivotar a counter spot, recurrente o operación interna según subescenario. |

---

## 6. Roles: Taxi Green y el equipo

Para evitar la confusión que aparece cuando el cliente cree que está contratando proveedor y el equipo cree que está cerrando socio.

### 6.1 Rol del equipo

- Diseño y desarrollo del producto.
- Conducción metodológica del discovery.
- Propiedad del núcleo reutilizable (en escenarios 1 y 2).
- Soporte y evolución del producto durante el contrato.

### 6.2 Rol de Taxi Green

**Mínimo no negociable** (en cualquier escenario):
- Sponsor ejecutivo identificado con poder de decisión.
- Acceso a la operación real (datos, observación, entrevistas).
- Pago según calendario acordado.
- Definición clara de quién aprueba qué internamente.

**Adicional en escenario cliente-cero:**
- Carta de intención firmada.
- Aceptación de exclusividad acotada (no exclusividad total).
- Coautoría en piloto y autorización para referenciar el caso comercialmente (con confidencialidad de números sensibles).

### 6.3 Lo que NUNCA hace el equipo

- Construir producto sin contrato firmado.
- Aceptar exclusividad total sin compensación equivalente.
- Prometer plazos sin estimación con buffer.
- Aceptar pago al final del proyecto sin hitos intermedios.
- Trabajar más de tres reuniones sin compromiso comercial concreto (regla de tres strikes).

---

## 7. Propiedad intelectual — tres opciones y términos mínimos

Mi versión anterior decía "cerrar IP antes de construir" sin decir cómo. Aquí los términos.

### 7.1 Opción A — Proyecto a medida

- **Precio:** 1.5x–2.5x sobre Opción B.
- **Propiedad del código:** Taxi Green dueño del 100% del código entregado.
- **Propiedad de diseños:** Taxi Green dueño del 100%.
- **Datos operativos:** Taxi Green dueño.
- **Marca:** ambas partes mantienen la propia.
- **Exclusividad:** total e indefinida sobre el código entregado.
- **Reutilización:** el equipo NO puede reutilizar el código en otro cliente. Sí conserva conocimiento general (patrones, arquitectura).
- **Confidencialidad:** mutua.
- **Soporte:** se cobra aparte por horas o por contrato de mantenimiento.
- **Salida:** cualquier parte puede terminar el contrato con preaviso de 60 días; entregables hasta la fecha son del cliente.
- **Pagos:** por hitos o por horas, factura mensual.
- **Entregables:** código fuente + documentación + transferencia técnica al equipo interno de Taxi Green si quieren mantenerlo después.

**Cuándo se ofrece:** si Taxi Green pide proyecto a medida explícitamente y el equipo decide aceptar.

### 7.2 Opción B — Cliente-cero / piloto estratégico (recomendada)

- **Precio:** 1x (tarifa base). Discovery con anticipo; fase 1 por etapas pagadas.
- **Propiedad del código:** el equipo conserva el núcleo reutilizable (motor de reservas, voucher, panel, modelo de datos multi-tenant). Taxi Green recibe **licencia perpetua e irrevocable de uso** para su operación.
- **Propiedad de personalizaciones específicas:** Taxi Green dueño (módulos exclusivos a su operación).
- **Propiedad de diseños:** el equipo conserva diseños base; Taxi Green recibe diseños personalizados.
- **Datos operativos:** Taxi Green dueño; el equipo solo accede con autorización y bajo confidencialidad.
- **Marca:** ambas mantienen la propia. El equipo puede mencionar a Taxi Green como caso de uso con autorización por escrito.
- **Exclusividad:** acotada. El equipo no comercializa el núcleo con competidores directos de Taxi Green en el sector taxi aeropuerto de Lima/Callao durante **12–18 meses** desde el lanzamiento de fase 1. Fuera de ese sector/geografía/plazo, el equipo es libre.
- **Reutilización:** el equipo puede evolucionar el núcleo y ofrecerlo a otros operadores (fuera de la exclusividad) sin compartir datos ni configuraciones de Taxi Green.
- **Confidencialidad:** mutua; datos operativos de Taxi Green nunca se exponen a terceros.
- **Soporte:** incluido en fase 1; se renegocia para post-lanzamiento (contrato de mantenimiento mensual).
- **Salida:** ambas partes con preaviso de 90 días. Si el equipo termina, Taxi Green conserva licencia perpetua de la última versión entregada. Si Taxi Green termina, paga las etapas ejecutadas y conserva lo entregado.
- **Pagos:** discovery con 50% anticipo + 50% contra entrega. Fase 1 con 20% anticipo + pagos por hito.
- **Entregables:** producto funcionando + documentación operativa + transferencia básica al equipo interno + 60 días de soporte hipercuidado post-lanzamiento.

**Cuándo se ofrece:** opción primaria recomendada al cliente.

### 7.3 Opción C — Sociedad o revenue share

- **Precio:** menor o nulo upfront; el equipo cobra porcentaje sobre ingresos generados por el producto o sobre nuevos clientes adquiridos.
- **Propiedad del código:** compartida según porcentaje acordado, o estructurada legalmente vía sociedad.
- **Propiedad de diseños:** según acuerdo de sociedad.
- **Datos operativos:** Taxi Green dueño operativamente; el equipo tiene acceso para evolución del producto.
- **Marca:** según acuerdo; potencialmente co-marca para el producto extendido.
- **Exclusividad:** definida por contrato de sociedad.
- **Reutilización:** definida por contrato.
- **Salida:** clausulada en sociedad (compraventa de participación, derecho de tanteo, etc.).
- **Pagos:** revenue share + retainer si aplica.
- **Riesgo:** alto. Requiere asesoría legal especializada y due diligence cruzada. No se entra sin equipo legal real.

**Cuándo se ofrece:** solo si Taxi Green muestra interés explícito en ser socio, no cliente, y solo después de discovery cumplido. Nunca en primera reunión.

### 7.4 Términos mínimos a discutir en cualquiera de las tres opciones

Checklist para llevar a negociación. Sin esto cerrado por escrito, el equipo no firma:

- [ ] Propiedad del código (núcleo vs personalización).
- [ ] Propiedad de los diseños.
- [ ] Propiedad y custodia de los datos operativos.
- [ ] Uso de la marca Taxi Green en comunicaciones del equipo.
- [ ] Exclusividad: sector, geografía, plazo.
- [ ] Derechos de reutilización del producto.
- [ ] Confidencialidad mutua.
- [ ] Esquema de soporte y SLA mínimo.
- [ ] Cláusula de salida con preaviso y consecuencias.
- [ ] Calendario y forma de pagos (anticipos, hitos, retainer).
- [ ] Entregables concretos por fase.
- [ ] Acceso a operación real (datos, observación, entrevistas).
- [ ] Cláusula de no-contratación de personal cruzada (con plazo razonable).
- [ ] Mecanismo de resolución de disputas (mediación antes de juicio).

---

## 8. Condiciones para avanzar y condiciones para matar la idea

Sin esto, la idea se arrastra por inercia. Cada checkpoint con su criterio.

### 8.1 Condiciones para avanzar a discovery pagado

Todas necesarias, no opcionales:

1. Sponsor ejecutivo identificado con poder de decisión sobre presupuesto y alcance.
2. Aceptación de carta de intención no vinculante.
3. Aceptación de pago de discovery (con anticipo).
4. Acceso confirmado a al menos 3 stakeholders internos para entrevista.
5. Acceso confirmado a observación en counter (al menos 1 turno).
6. Cierre del acuerdo de IP (Opción A o B) por escrito antes del primer día de discovery.

Si falta una, no se inicia.

### 8.2 Condiciones para avanzar de discovery a fase 1

Todas necesarias:

1. Mix de ingresos validado y compatible con la tesis (o pivot claro a §5.6).
2. Postura LAP/ATU clarificada (escenario 5 descartado o reformulado).
3. Acceso confirmado del equipo a operación, datos y conductores.
4. Presupuesto de fase 1 aprobado por escrito.
5. Métricas de éxito de piloto definidas y aceptadas por ambas partes.
6. Stack técnico cerrado en mesa con Raúl (Mongo/Postgres, microservicios/monolito, cloud).

### 8.3 Condiciones para matar la idea (no avanzar nunca más)

- LAP impone sistema central que cubre todos los componentes del producto sin posibilidad de integración (escenario 5 extremo).
- Taxi Green rechaza cualquier acceso a operación real.
- Taxi Green exige exclusividad total con tarifa de cliente-cero (incompatibilidad estructural).
- Tres reuniones sin compromiso comercial (regla de tres strikes).
- Discovery revela que el producto no resuelve dolor económico medible (>$X de ahorro anual; X a definir según volumen).

---

## 9. Roadmap realista (con buffer, no con deseo)

Mi versión anterior comprimía las fases. Esta tiene aire.

### 9.1 Fase 0 — Discovery (4–6 semanas)

- Semana 1: kickoff, plan de entrevistas, primer set de preguntas.
- Semanas 2–3: entrevistas internas (3–5 stakeholders), observación en counter (2–3 turnos).
- Semana 4: entrevistas con clientes corporativos (2–4 si Taxi Green los facilita).
- Semana 5: análisis de sistema actual, contratos PSE/PSP, integración Fenbo.
- Semana 6: informe de hallazgos + visión refinada + propuesta de fase 1 con presupuesto.

**Entregable final:** documento de discovery + decisión Go/No-Go con cliente.

### 9.2 Fase 1 — Producto mínimo defendible (10–14 semanas, no 8–12)

Buffer ampliado vs mi versión anterior porque siempre se subestima. Distribución sugerida:

- Semanas 1–2: setup, arquitectura, decisiones técnicas finales, modelo de datos.
- Semanas 3–6: backend mínimo + autenticación + reservas + voucher/QR.
- Semanas 7–9: panel central + vista módulo + integración Fenbo.
- Semanas 10–12: vista conductor + estados + cierre + comprobante.
- Semanas 13–14: piloto interno con Taxi Green, ajustes, hardening.

**Entregable final:** sistema operando en al menos un flujo (aeropuerto→destino o ciudad→aeropuerto) durante 30 días.

### 9.3 Fase 2 — Capa corporativa ligera + optimización (8–12 semanas)

Condicional a métricas de fase 1 favorables y a confirmación de peso del B2B (escenario 6 descartado).

### 9.4 Fase 3 — Evaluación SaaS

Condicional a fases 1 y 2 cumplidas. Sin compromiso de fecha hasta validación con terceros.

### 9.5 Tiempos a NO promete al cliente

- "Listo en 2 meses": no.
- "Demo en una semana": solo nivel 0/1, sin backend real.
- "Multi-tenant comercial en fase 2": no, solo en arquitectura.

---

## 10. Métricas de validación — qué se mide y cuándo

Para evitar declarar éxito en base a "se ve bien" o "el cliente sonrió".

### 10.1 Métricas de discovery

- Mix de ingresos por segmento, en %.
- Volumen de reservas por canal, por día.
- Tiempo promedio de asignación por reserva (por canal).
- Número de llamadas por reserva (estimado).
- % de errores de comprobante.
- Días-persona en cierre fiscal mensual.
- Adopción esperada de vista conductor (% de conductores con smartphone + disposición declarada).
- Postura de LAP/ATU clarificada (sí/no/parcial).

### 10.2 Métricas de fase 1 (piloto)

Antes del piloto, declarar línea base. Después, comparar.

- Reducción de tiempo de asignación: meta inicial 30%, declarar línea base real.
- Reducción de llamadas de confirmación: meta inicial 30%.
- Reducción de errores de comprobante: meta inicial 50%.
- Tiempo de cierre fiscal mensual: meta de reducción a definir.
- Adopción real de vista conductor: % de conductores activos en la vista por semana.
- Adopción real de vista módulo: % de validaciones por QR vs validaciones manuales.
- NPS interno (operadores + conductores + supervisor): >7/10.

Si en piloto las métricas no se mueven, no se avanza a fase 2. Se reformula o se cierra.

---

## 11. Decisión recomendada

Para tomar antes de la reunión:

1. **Ir a la reunión con material nivel 0 + nivel 1 listos** (deck + Figma navegable). NO construir nivel 2 antes de la reunión.
2. **Llevar el one-pager comercial** (incluido en `que_presentar_a_taxigreen_refinado.md`) impreso o digital.
3. **Llevar la propuesta de IP Opción A y Opción B preparadas**, dejar Opción C fuera de la primera conversación.
4. **Llevar las 15 preguntas críticas priorizadas** (5+5+5 en `que_presentar_a_taxigreen_refinado.md`).
5. **Tener interiorizada la regla de tres strikes** y la disposición a aplicarla.
6. **Tener interiorizados los seis escenarios** y los planes B asociados.

Después de la reunión:

- Si la respuesta es escenario 1 → avanzar con kickoff de discovery en máximo 2 semanas.
- Si es escenario 2/4 → aplicar plan B acotado (6 días-persona máximo).
- Si es escenario 3 → evaluar internamente si conviene aceptar a 1.5x–2.5x.
- Si es escenario 5/6 → reformular alcance y verificar interés residual.

---

## 12. ¿Esta visión es 10/10?

No. Probablemente sea 7.5/10 con el material disponible. Lo que falta para llegar más alto:

- Dato real del mix de ingresos de Taxi Green (sin esto, todo el documento está construido sobre la H1/H4).
- Dato real de la postura LAP/ATU (sin esto, escenario 5 es ruleta).
- Validación de adopción real con 5–8 conductores (sin esto, H6 es esperanza).
- Capacidad real del equipo desarrollador (sin esto, los plazos del roadmap son simulacro).
- Asesoría legal mínima sobre IP (sin esto, las opciones A/B/C son borrador).

Lo que SÍ está al nivel necesario:
- Tesis central única, defendible.
- Escenarios contemplados con plan B.
- IP con términos negociables.
- Roadmap con buffer realista.
- Condiciones explícitas para avanzar/matar.

Para llegar a 9/10 hace falta el discovery. Para llegar a 10/10 hace falta operar el piloto y medir. Este documento es la mejor versión posible **antes** de validar; las siguientes versiones del documento solo pueden mejorar si entran datos reales.

---

*Fin del documento. Su par operacional es `que_presentar_a_taxigreen_refinado.md`, que baja todo esto a la reunión concreta y al material que se lleva.*

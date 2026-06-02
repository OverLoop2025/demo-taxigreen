# Visión Final — Taxi Green

**Versión:** perfecta (síntesis ingeniosa, no incrementalista)
**Fecha:** 2026-05-22
**Autor:** Análisis estratégico neutral, contrastado contra evidencia, investigaciones IA, propuestas previas y referencias externas
**Predecesoras:** `vision_final_taxigreen.md`, `vision_final_taxigreen_refinada.md`, `vision_claude_taxigreen.md`, `vision_chatgpt_taxigreen.md`
**Estándar de honestidad epistémica:** cada afirmación clave está etiquetada como `Evidencia directa`, `Dicho en reunión`, `Propuesta previa`, `Investigación IA`, `Inferencia`, `Hipótesis`, `Por validar`, `Contradicción` o `Recomendación provisional`.

---

## 0. Postura en una frase

Taxi Green deja de ser "un operador de taxi del aeropuerto" para convertirse en **el primer operador formal del Perú con un copiloto de operación**: un sistema que **ingiere los canales caóticos por los que ya llega el negocio** (WhatsApp, correo, llamadas, web, counter, hoteles, empresas) y **devuelve operación ordenada, conductor asignado bien, pasajero atendido como invitado y empresa cliente con cierre limpio sin que nadie tenga que perseguir nada**.

El producto no es una app. **El producto es el copiloto.** La app, el QR, el voucher y la web son sólo las superficies donde el copiloto se asoma.

> `Recomendación provisional` con `nivel de confianza medio-alto`: esta postura es la única que explica simultáneamente (a) por qué Taxi Green sobrevive 25 años haciendo bien lo invisible, (b) por qué Raúl insiste en multicanal y "que el sistema entienda", (c) por qué WAREM/Pepethefrog funciona como referencia de estilo sin copiar dominio, y (d) por qué la app sola, el WhatsApp solo o el dashboard solo se quedan cortos.

---

## 1. Discontinuidad con las visiones anteriores

Esta visión no continúa linealmente las anteriores. Las **reordena**.

| Visión previa | Núcleo | Por qué se queda corta |
|---|---|---|
| `vision_final_taxigreen.md` | "Operador formal más trazable + voucher/QR + comprobante" | Es honesta, pero describe una mejora gradual. No redefine categoría. No tiene "wow". |
| `vision_final_taxigreen_refinada.md` | Lo anterior + matriz de escenarios + IP modular + roadmap con buffer | Más realista todavía, pero por ser tan prudente pierde tesis. La autoevaluación honesta del propio documento es **7.5/10**. |
| `vision_claude_taxigreen.md` | Análisis epistemológico, doce principios, espacio de oportunidad A-F | Excelente estructura analítica, pero termina en "visión provisional". No clava un núcleo. |
| `vision_chatgpt_taxigreen.md` | 14 rutas evaluadas, recomendación = híbrido aeropuerto + corporativo | Buen mapeo, pero ofrece menú, no tesis. |

`Inferencia` con `confianza alta`: el patrón común de los documentos previos es **describir bien lo que Taxi Green hace y mejorar lo que falta**. Ninguno propone una inversión paradigmática del modelo de operación. Esta visión sí.

> No se descarta lo anterior. La trazabilidad aeroportuaria, el QR/voucher, el comprobante automático, el modelo híbrido y la disciplina epistémica **se conservan como capas**. Lo que cambia es el **núcleo**.

---

## 2. La inversión paradigmática

### 2.1. Cómo opera hoy la flota (tal cual)

`Evidencia directa` (transcripción Raúl, 19-may, y materiales `00_EVIDENCIA_REAL/taxigreen/`):

- El despachador o supervisor recibe reservas por **WhatsApp, llamada telefónica, correo, web y counter**.
- Cada canal entra en un formato distinto, en lenguaje natural, sin estructura.
- Una persona transcribe a un sistema interno, asigna un conductor de la cola disponible, lo llama o le manda WhatsApp.
- La facturación con boleta o factura RUC se hace después, normalmente al cierre del día o cuando la empresa cliente lo pide.
- La cola de conductores, la rotación y la prioridad se manejan por criterio del operador humano.

`Dicho en reunión` (Raúl, 19-may): Raúl quiere que "el sistema entienda" y "no perder tiempo tecleando lo que ya está en el WhatsApp".

`Inferencia` con `confianza alta`: el cuello de botella **no es la app ni la web**. El cuello de botella es **la fricción humana entre canal de entrada y operación**, y entre operación y cierre administrativo.

### 2.2. La inversión

La industria normalmente piensa: **"construyamos la app y obliguemos al usuario a entrar por ella"**. Uber, Cabify, Beat, InDriver: todos invierten en sacar al usuario de WhatsApp/teléfono y meterlo en su canal propio.

Taxi Green **no puede ni debe competir en ese terreno**. Sus clientes (pasajeros recurrentes, hoteles, empresas, ejecutivos en el aeropuerto) **ya llegan por WhatsApp, correo y llamada**, y **no van a cambiar**. Esa es una `Evidencia directa` del propio modelo histórico: 25 años, 80K+ clientes declarados, sin app dominante, viven en los canales del cliente.

La inversión paradigmática es:

> **No mover al cliente al canal del operador. Mover al copiloto al canal del cliente.**

El copiloto **come WhatsApp, correo, llamadas transcritas y formularios web** como si fueran lenguaje natural, **extrae la reserva estructurada**, **propone asignación**, **dispara el voucher con QR**, **maneja el cobro y el comprobante**, y **deja al humano supervisando, no tecleando**.

Este patrón es exactamente la **filosofía** de WAREM/Pepethefrog (`Referencia externa` — `03_REFERENCIAS_EXTERNAS`): "el chat alimenta al sistema, no al revés". `Recomendación`: rescatar la esencia (copiloto, simplicidad, humano en control, dopamina por defecto), **no copiar el dominio comercial**. Aquí el dominio es operación de taxi aeroportuario y corporativo, no CRM ni ventas.

### 2.3. Por qué esto es ingenioso y no obvio

`Inferencia` razonada:

1. Es **ingenioso** porque convierte la "debilidad histórica" (Taxi Green no tiene app fuerte, vive en canales informales) en su **ventaja estructural**: no necesita reeducar al cliente; necesita entender el canal que ya usa.
2. Es **no obvio** porque la respuesta intuitiva de un consultor o de una IA promedio sería "hagan una app moderna como Uber". Esa respuesta los pone a competir donde no pueden ganar.
3. Es **defendible** porque el activo que se construye no es código copiable: es **un modelo de ingesta entrenado sobre años de reservas reales de un mercado específico** (jergas peruanas, modismos de hoteles limeños, formatos corporativos del aeropuerto, modos de pago locales, vouchers de hoteles 5 estrellas, comprobantes SUNAT). Eso **no se compra hecho**.
4. Es **honesto** porque no promete "IA mágica". Promete **automatización responsable de la parte repetitiva**, con humano siempre encima.

---

## 3. El Copiloto como núcleo — sus cinco caras

El copiloto **no es un chatbot**. Es **un mismo motor** que se asoma con cinco caras distintas, una por actor.

> `Hipótesis arquitectónica` clave: las cinco caras comparten el mismo modelo de dominio (reserva, conductor, vehículo, pasajero, empresa cliente, vuelo, voucher, comprobante). Lo que cambia es la **superficie**.

### 3.1. Cara 1 — Ingesta multicanal (lado operador interno)

**Entrada:** mensaje de WhatsApp del hotel, correo de la asistente de gerencia, llamada transcrita, formulario web, mostrador del counter.

**Lo que hace el copiloto:**

- Lee el texto/transcripción en lenguaje natural.
- Extrae los campos estructurados: pasajero, teléfono, vuelo, fecha/hora, origen, destino, tipo de servicio (aeropuerto / corporativo / city), tipo de pago (cash, voucher, factura RUC), notas (silla de niño, bilingüe, recibe con cartel, etc.).
- **Si falta algo crítico, pregunta de vuelta en el mismo canal** ("Veo que no me dio el número de vuelo. ¿Lo confirma?"). No interrumpe el flujo humano: lo completa.
- **Si encuentra contradicción** (vuelo y hora no cuadran, RUC inválido, dirección dudosa), marca la reserva como "necesita revisión" y la pone arriba en la cola del supervisor.
- Genera el voucher con QR único y lo devuelve al canal donde entró la reserva.

**Lo que no hace:** no asigna conductor solo. No factura solo. **Sugiere; el humano confirma con un clic.**

`Evidencia directa` que respalda esto: en `vision_chatgpt_taxigreen.md` se mapea explícitamente la multicanalidad como ruta de solución; en `00_EVIDENCIA_REAL` Raúl insiste en que el sistema "entienda" el WhatsApp; en `vision_claude_taxigreen.md` se identifica el espacio de oportunidad "ingesta + ordenamiento" como una de las áreas A-F.

### 3.2. Cara 2 — Despacho asistido (lado despachador)

**Pantalla simple. No es un dashboard hostil de torre de control.** El despachador ve:

- Cola de reservas próximas, ordenadas por urgencia real (vuelo aterrizando, recogida programada).
- Cola de conductores disponibles, con tiempo en cola, rating interno, distancia al punto.
- **Sugerencia del copiloto:** "Para esta reserva, sugiero al conductor X. Razón: lleva 47 min en cola, está a 6 min del punto, hizo 3 servicios al mismo hotel en el último mes con buen feedback."
- Botón "Asignar" o "Asignar otro". Si el despachador elige otro, el copiloto **aprende del cambio sin pedir explicación**.

`Dicho en reunión` y `Evidencia directa`: la cola de conductores y la asignación manual son el corazón operativo actual. La sugerencia asistida **respeta la jerarquía existente** ("primero en cola, primero en salir") **pero la enriquece** con contexto que un humano no puede mantener en cabeza (¿este conductor sabe entrar al hotel X por la rampa de atrás? ¿el pasajero pidió bilingüe?).

`Hipótesis` con `confianza media`: este patrón es lo que más reduce horas-hombre en el día a día. Validar en demo con un despachador real, no con un demo limpio.

### 3.3. Cara 3 — Concierge del pasajero (lado pasajero invitado)

**El pasajero no descarga nada.** Recibe un link/QR por WhatsApp o correo. Al abrirlo, ve **una sola superficie minimalista**:

- Su nombre, su vuelo, su conductor con foto, placa, color del auto, contacto.
- Mapa en vivo del conductor acercándose.
- Botón "Llamar al conductor" / "Llamar a Taxi Green" / "Aviso de retraso".
- Al final, su comprobante listo y "¿Cómo estuvo? 😊 / 😐 / 😞".

**Lo que no ve:** publicidad, registro, "crear cuenta", "introduce tu RUC", "elige el método de pago". Si lo paga la empresa, no ve nada de cobro. Si lo paga él, paga con un solo clic.

`Inferencia` con `confianza alta`: ésta es la dopamina del pasajero. La diferencia entre "abrir Uber" y "abrir un link que ya sabe quién soy". Es la analogía taxi del momento WAREM en que "el chat ya conoce mi venta y me la cierra solo".

`Referencia externa`: la filosofía Apple/Jobs aplicada: **la superficie del pasajero no muestra nada que él no necesite ver en ese momento exacto**.

### 3.4. Cara 4 — Asistente corporativo (lado empresa cliente)

Las empresas clientes (hoteles, corporativos, embajadas, agencias de viaje) **hoy persiguen al operador por correo**: "necesito el reporte de los servicios del mes pasado", "necesito las facturas separadas por centro de costo", "necesito saber cuántos servicios usó la doctora X".

El copiloto **les devuelve un panel que se actualiza solo y un correo semanal que llega sin que lo pidan**:

- Resumen de servicios del periodo, por persona, por centro de costo, por vuelo, por destino.
- Facturas SUNAT ya emitidas, descargables.
- Excepciones: "esta semana hubo 2 servicios cancelados por el pasajero. Aquí están."
- Una sola conversación de WhatsApp con la empresa para todo el mes, **no doce correos sueltos**.

`Hipótesis comercial` con `confianza media-alta`: ésta es la oferta que paga las cuentas. El corporativo no paga por viaje, paga por **dejar de perseguir**. Es exactamente lo que `vision_chatgpt_taxigreen.md` identifica como ruta híbrida y `vision_final_taxigreen_refinada.md` señala como segmento ancla.

`Por validar` en reunión con Taxi Green: qué fracción del ingreso ya viene de corporativos y qué tan dolorosa es hoy la conciliación. Si es >30% del ingreso y >5 horas-hombre semanales en conciliación, la propuesta tiene encaje fuerte.

### 3.5. Cara 5 — Asistente del conductor (lado conductor)

PWA o link en WhatsApp. **Diseñado para un conductor de 50+ años que maneja con guantes y con el celular en el portavasos.**

- Próximo servicio en una sola pantalla grande: pasajero, vuelo, hora, dirección, tipo de pago.
- Botón gigante "En camino" / "Llegué" / "Pasajero a bordo" / "Servicio terminado".
- Si el pasajero no aparece, botón "Avisar a despacho" — y el copiloto en cara 1 ya está hablando con el pasajero por WhatsApp.
- Al final del día: resumen automático de servicios, propinas, hora de salida proyectada.

**Lo que no hace:** no le pide login complejo, no le manda notificaciones de marketing, no le pone publicidad, no le exige actualizar la app cada semana.

`Inferencia` con `confianza alta`: el conductor es el actor más maltratado en las apps modernas. Una superficie sobria es **adherencia y retención de flota**, que es el activo escaso real de Taxi Green (350+ conductores, según material declarado).

### 3.6. Una columna vertebral, no cinco productos

Las cinco caras **comparten el mismo modelo de datos**. Una reserva tocada en cara 1 (ingesta WhatsApp) **es la misma entidad** que aparece en cara 2 (despacho), cara 3 (link al pasajero), cara 4 (panel corporativo) y cara 5 (PWA del conductor). Esto importa porque:

- Reduce inconsistencias (el pasajero ve lo mismo que la empresa ve).
- Reduce costo de desarrollo (un dominio, cinco superficies).
- Genera el **moat de datos**: cada reserva enriquece el modelo de ingesta de cara 1 y el modelo de sugerencia de cara 2.

`Recomendación provisional` técnica: dominio modelado en una base relacional con extensión geo (PostgreSQL + PostGIS), no por dogma, sino porque las relaciones reserva-conductor-vehículo-empresa-comprobante son fuertemente relacionales y la facturación SUNAT exige integridad transaccional. `Contradicción` registrada: Raúl prefiere Mongo y microservicios sin experiencia previa (`Dicho en reunión`, 19-may). Esta tensión se discute con Raúl, no se resuelve en la visión.

---

## 4. Experiencia por actor — momentos de dopamina

Cada actor tiene un **micro-momento mágico** donde algo que esperaba que costara, no costó. Esto es lo que produce el "wow" sostenido, no el discurso de marketing.

| Actor | Hoy le pasa esto | Con el copiloto le pasa esto | Por qué es dopamina |
|---|---|---|---|
| Pasajero ocasional (turista) | Aterriza, busca el counter, da datos, espera, no sabe placa, recibe boleta a mano | Le llega un link al WhatsApp: "Tu conductor José llega en 4 min, placa AB-123, te espera en la salida 3". Ve mapa, paga con un toque, comprobante automático | Llegó cansado, no tuvo que pensar |
| Pasajero recurrente (ejecutivo) | Cada viaje da los mismos datos otra vez | Manda un WhatsApp "Hoy a las 6, al de siempre" y el copiloto entiende. Le confirma y listo | El sistema lo reconoce sin pedirle nada |
| Hotel concierge | Llama por teléfono, dicta datos, anota voucher manual | Manda WhatsApp con foto del voucher del huésped. El copiloto extrae todo, asigna y devuelve el QR | No teclea, no transcribe, no llama dos veces |
| Empresa cliente (asistente de gerencia) | Persigue por correo: "necesito la factura, necesito el reporte" | Recibe el lunes a las 9am su reporte semanal con las facturas adjuntas, ya separadas por centro de costo | No tuvo que pedirlo |
| Despachador interno | Teclea reservas todo el día, llama conductores, controla cola mentalmente | Ve la cola enriquecida, aprueba sugerencias con un clic, atiende sólo las excepciones | Trabaja con la cabeza, no con los dedos |
| Supervisor counter | Anota a mano, valida documentos, escanea pasajeros | Escanea el voucher con QR, el sistema valida y el conductor ya viene en camino | El counter deja de ser cuello de botella |
| Conductor | App pesada, login que se cae, instrucciones poco claras | Una pantalla grande, botones gigantes, todo en una | No pelea con la tecnología |
| Administrador de flota | Hoja Excel, conciliación manual fin de mes | El cierre se materializa solo. Excepciones marcadas | Cierra el mes en horas, no en días |
| Gerencia | Pide reportes, espera | Tablero ejecutivo con métricas operativas, no de vanidad | Decide con datos reales |

`Recomendación` para la demo: contar la historia por **al menos tres actores en una sola línea de tiempo** (hotel manda WhatsApp → despachador aprueba sugerencia → pasajero recibe link → conductor ejecuta → empresa recibe reporte). **No demos por pantalla, demos por flujo.**

---

## 5. Qué se construye, qué no se construye

### 5.1. Se construye

- **Motor de ingesta multicanal** (WhatsApp Business API oficial + correo + formulario web; voz transcrita como fase 2).
- **Modelo de extracción de reservas en lenguaje natural** (LLM razonable + capa de validación reglada, no LLM crudo).
- **Backend de dominio**: reserva, conductor, vehículo, pasajero, empresa cliente, vuelo, voucher, comprobante, comprobante SUNAT.
- **Superficie despachador** (web sobria).
- **Superficie pasajero** (link/QR, sin app obligatoria).
- **Superficie conductor** (PWA simple).
- **Superficie corporativa** (panel + reporte semanal automático).
- **Integración Fenbo Digital / SUNAT** para boleta y factura RUC.
- **Integración con pasarelas existentes** (Niubiz, Izipay, OpenPay — las que ya están en el stack declarado).
- **Capa de auditoría y trazabilidad** (quién hizo qué, en qué canal, cuándo, qué dijo el copiloto, qué confirmó el humano). Esto sirve doble: cumplimiento ATU/LAP y entrenamiento del modelo.

### 5.2. Se NO construye

`Recomendación provisional` con `confianza alta`:

- **No se construye app móvil del pasajero** como prioridad. El link/QR cubre el caso. La app puede venir después si una empresa cliente la exige expresamente.
- **No se construye marketplace abierto** (tipo Uber). Taxi Green opera flota propia formal; el marketplace mata el activo.
- **No se construye "IA conversacional general"**. El copiloto entiende **un dominio**: reservas de taxi. Si le hablan de otra cosa, deriva a humano.
- **No se construye dashboard "Business Intelligence" elaborado**. Métricas operativas concretas, no torre de control de vanidad.
- **No se hace migración tecnológica radical de un golpe**. El stack actual (jQuery + Leaflet + servicios existentes) **sigue funcionando para lo que ya funciona**. El copiloto se monta **al lado**, no encima.
- **No se promete multi-tenant comercial**. La arquitectura multi-tenant **es interna** (separar instancias por flota dentro del mismo Taxi Green), no una promesa de SaaS a terceros. Si más adelante hay validación comercial, se evalúa.
- **No se prometen integraciones con todo**. Se prometen las dos o tres que pagan el modelo: SUNAT, una pasarela, WhatsApp Business.

### 5.3. La regla de oro

> Cada feature que entra debe responder a "¿qué actor sufre menos por esto y cómo lo demostramos?". Si la respuesta es vaga, no entra.

---

## 6. El moat — por qué esto no se copia en seis meses

`Inferencia` razonada con `confianza media-alta`:

1. **Moat de datos.** Cada reserva entrenando el modelo de ingesta. Cada cambio de asignación entrenando el modelo de sugerencia. Cada queja entrenando la priorización. Un competidor que llegue mañana tendrá el código pero no los **2 años de WhatsApps reales de hoteles limeños**.

2. **Moat de relación.** Taxi Green ya tiene contratos vigentes con hoteles, embajadas, empresas. Esos contratos se renuevan **por dejar de perseguir**, no por descuento. El copiloto multiplica el valor de cada renovación. Un competidor nuevo tendría que ganar primero los contratos, después construir el copiloto, después demostrar valor — Taxi Green hace los tres a la vez.

3. **Moat regulatorio.** Concesión LAP Nivel 1 en el aeropuerto Jorge Chávez. Habilitación ATU. Permanecer como **operador formal con trazabilidad ejecutiva** es defensa frente al riesgo informal y posiblemente alineamiento con futura regulación más estricta. Si ATU/LAP centralizan despacho, Taxi Green ya tiene el sistema para integrarse sin rehacer.

4. **Moat de operación.** 25 años, 350+ conductores fidelizados, 80K+ clientes declarados. La flota no se monta en seis meses. La cultura de servicio no se entrena en un trimestre.

5. **Moat de marca / formalidad.** Boleta/factura electrónica, voucher trazable, conductor identificable, vehículo registrado. En un mercado lleno de informalidad, **la formalidad es producto**.

`Contradicción registrada`: la formalidad puede ser percibida como "más cara". Mitigación: la promesa no es precio, es **certeza** (te recogen, llegas, te dan comprobante).

---

## 7. Hipótesis críticas y cómo validarlas

`Recomendación` central: **no construir antes de validar las cuatro hipótesis críticas**. Cada una tiene un test barato.

| Hipótesis | Confianza | Cómo validarla barato |
|---|---|---|
| **H1.** El cuello de botella real está en la ingesta multicanal, no en otra parte | Media-alta | Sentarse 4 horas con un despachador y cronometrar: cuánto tiempo teclea, cuánto llama, cuánto resuelve excepciones. Si teclear+transcribir >40% del turno, H1 vive. |
| **H2.** Los hoteles y empresas clientes pagarán más por "dejar de perseguir" que por precio bajo | Media | 5 entrevistas con concierges y asistentes corporativas. Pregunta clave: "¿qué hora del mes te toma conciliar facturas de taxi?" Si la respuesta media es ≥ media jornada, H2 vive. |
| **H3.** Un LLM con capa reglada puede extraer reservas de WhatsApp limeño con ≥90% de precisión en campos críticos (fecha, vuelo, destino, RUC) | Media | Tomar 200 WhatsApps reales (ya existen, son data histórica), pasarlos por un prototipo y medir. Es un test técnico de 1 semana. |
| **H4.** El conductor de 50+ años adoptará una PWA simple sin resistencia significativa | Media-baja | Prototipo de papel + 6 conductores reales. Si 4 o más lo usan sin pedir ayuda en menos de 3 minutos, H4 vive. |

`Por validar` adicional: la disponibilidad real de WhatsApp Business API en condiciones de Perú con el volumen estimado, y el costo unitario de mensaje. Es bloqueante de modelo de negocio si el costo unitario supera el margen por servicio.

---

## 8. Escenarios y plan B

Esta visión **no asume un solo futuro**. Reconoce que hay tres escenarios plausibles y diseña para los tres.

### 8.1. Escenario A — Tracción B2B (lo deseable)

Los corporativos y hoteles adoptan el panel y el reporte automático. El ingreso recurrente crece. La marca se posiciona como "operador formal trazable + cero fricción administrativa". El copiloto se expande con confianza.

### 8.2. Escenario B — Tracción mixta

B2B avanza con algunos hoteles pero no con todos. El B2C (pasajero ocasional del aeropuerto) sostiene el volumen pero no paga la diferencia. **Plan B**: el copiloto sigue siendo activo interno (reduce costo operativo), aunque la propuesta de valor "dejar de perseguir" se ofrece como **servicio aparte** con precio explícito.

### 8.3. Escenario C — ATU/LAP centraliza despacho (riesgo regulatorio)

`Por validar`. Si la autoridad aeroportuaria o ATU centraliza la asignación de taxis, Taxi Green deja de ser dueño del despacho. **Plan C**: el copiloto se vuelve **interno** (ingesta, conductor, conciliación, corporativo) y la cara de despacho se reduce o se conecta como cliente del sistema central. **Toda la inversión en ingesta multicanal, corporativo y conductor sigue viva.** Es por esto que el copiloto **no se diseña como reemplazo del despacho** sino como **capa de inteligencia operativa**.

`Recomendación` arquitectónica derivada: separar limpiamente los módulos. Si mañana hay que apagar despacho propio, no debe arrastrar al resto.

---

## 9. Filosofía — los principios no negociables

Estos principios provienen de **rescatar la esencia** de WAREM/Pepethefrog (`Referencia externa`), validados contra evidencia Taxi Green.

1. **Simplicidad obsesiva.** Cada pantalla justifica cada elemento. Si no tiene función en ese momento exacto, no aparece.
2. **Humano en control.** El copiloto sugiere; el humano confirma en las decisiones que importan (asignación, factura corporativa, manejo de queja).
3. **Automatización responsable.** Se automatiza lo repetitivo y lo verificable. No se automatiza lo ambiguo.
4. **Dopamina por defecto.** Cada interacción debe terminar con "ah, qué bien". No con "uf, listo".
5. **El canal del usuario manda.** Si el cliente vive en WhatsApp, el copiloto vive en WhatsApp.
6. **Cero fricción innecesaria.** Sin logins gratuitos, sin formularios largos, sin "actualice la app".
7. **Trazabilidad total.** Cada acción tiene autor, momento, contexto. Es producto y es defensa regulatoria.
8. **Formalidad como producto.** Voucher, comprobante, conductor identificable son parte de la experiencia, no del backoffice.
9. **Conservar lo que ya funciona.** El stack actual sigue. El copiloto se monta al lado, no en lugar de.
10. **Honestidad epistémica.** Cada afirmación etiquetada. Cada hipótesis con su validación. Nada de "magia" no demostrable.

---

## 10. Roadmap honesto

`Recomendación provisional` con `confianza media`. Pensado en fases cortas, validables, sin compromiso de fechas finales hasta validar H1-H4.

### Fase 0 — Validación de hipótesis (4-6 semanas)

- 4 horas con despachador, cronometrar (H1).
- 5 entrevistas con concierges/empresas (H2).
- Test técnico con 200 WhatsApps reales (H3).
- Prototipo de papel con 6 conductores (H4).
- **Resultado**: ir/no ir, y qué cara del copiloto se construye primero.

### Fase 1 — Copiloto interno (8-12 semanas)

- Cara 1 (ingesta WhatsApp + correo) en modo asistido (no autónomo).
- Cara 2 (despacho asistido) sobre el flujo actual.
- Integración SUNAT/Fenbo para comprobante automático.
- **Métrica clave**: reducción de tiempo de transcripción por reserva.
- **Esto se demuestra al cliente sin tocar la cara del pasajero**.

### Fase 2 — Caras externas (8-12 semanas)

- Cara 3 (link/QR del pasajero).
- Cara 4 (panel corporativo + reporte automático).
- **Métrica clave**: NPS pasajero y horas-mes ahorradas por empresa cliente.

### Fase 3 — Conductor + escala (8-12 semanas)

- Cara 5 (PWA del conductor).
- Optimización del modelo de ingesta con datos acumulados.
- Cierre del ciclo: reserva → asignación → ejecución → comprobante → reporte automático.

### Fase 4 — Endurecimiento y opciones

- Multi-tenant interno si la flota lo justifica.
- Voz transcrita.
- Evaluar plan C según movimientos regulatorios.
- Evaluar si una empresa cliente justifica app móvil dedicada.

`Importante`: cada fase **debe entregar valor solo**. Si en cualquier punto el cliente decide no continuar, **lo que se entregó sigue siendo útil sin el resto**.

---

## 11. Lo que se le presenta a Taxi Green (no este documento)

Este documento es **interno**, denso, epistemológicamente honesto. **No se le entrega a Taxi Green tal cual.**

Lo que se le presenta es:

1. **Una tesis en una frase**: "Su sistema entiende WhatsApp, correo y llamadas como entiende un humano experimentado, y le devuelve operación ordenada. Su gente deja de teclear y empieza a supervisar."
2. **Una demo de un solo flujo** (idealmente: hotel manda WhatsApp → reserva extraída → asignación sugerida → conductor recibe → pasajero recibe link → comprobante automático → reporte corporativo).
3. **Cuatro preguntas honestas** (H1-H4) que Taxi Green ayuda a responder.
4. **Un roadmap por fases**, cada una con valor entregable.
5. **Una postura comercial transparente**: cliente-cero comprometido (Taxi Green) con IP compartida o licenciamiento, vs proyecto a medida, **se decide después de la validación**, no antes.

---

## 12. Autocrítica brutal — qué podría salir mal con esta visión

Honestidad obligada. Para cada riesgo, una mitigación.

| Riesgo | Severidad | Mitigación |
|---|---|---|
| El LLM no extrae con suficiente precisión en jerga local | Alta | H3 valida antes de construir. Capa reglada de respaldo. Fallback humano en cada caso dudoso. |
| WhatsApp Business API es cara o limitada para el volumen | Alta | Validar costo unitario en Fase 0. Plan alterno: número compartido manual con scraping responsable (más frágil). |
| Taxi Green prefiere "una app moderna como Uber" y rechaza la tesis copiloto | Media-alta | Demo por flujo, no por pantalla. Mostrarles **cuánto tiempo ahorra su despachador** en los primeros 30 segundos. |
| Raúl insiste en Mongo + microservicios sin experiencia y se construye una arquitectura frágil | Media | Esta visión separa **decisión técnica** de **decisión de producto**. La discusión técnica se da con datos del dominio (consultas relacionales, integridad SUNAT). |
| Los conductores rechazan la PWA | Media-baja | H4 valida antes. La cara 5 puede llegar al final, no es bloqueante de las otras. |
| ATU/LAP centraliza despacho y el módulo despacho queda obsoleto | Media | Plan C ya contemplado. Modularidad del copiloto preserva el resto. |
| El "wow" del copiloto se diluye en la implementación y termina pareciendo un CRM más | Alta | Disciplina de simplicidad obsesiva (principio 1). Cada pantalla revisada con la pregunta "¿qué actor sufre menos por esto?". |
| Se hace tanto al mismo tiempo que ninguna cara queda bien | Alta | Roadmap por fases con valor entregable cada una. No se empieza la cara N+1 hasta tener evidencia de uso real en la cara N. |
| Sesgo de IA: estoy enamorado de mi propia analogía WAREM | Crítico | Esta sección existe precisamente para no esconderlo. La analogía WAREM **inspira filosofía**, no decide producto. La validación H1-H4 manda. |

---

## 13. Nivel de confianza y disclaimer

`Confianza global de la visión`: **media-alta** en la tesis (copiloto que ingiere multicanal), **media** en la estrategia comercial (B2B paga por dejar de perseguir), **media** en el roadmap (depende de validación H1-H4), **media-baja** en cualquier número específico (no hay métricas reales suficientes en los documentos del repo para sostenerlo).

**Lo que esta visión NO es**:

- No es un compromiso técnico cerrado.
- No es una promesa comercial.
- No es una verdad absoluta del repo (el repo contiene insumos, no respuestas finales).
- No es una continuación lineal de las visiones previas.

**Lo que esta visión SÍ es**:

- Una **tesis ingeniosa, defendible y honesta** sobre dónde está la ventaja real de Taxi Green.
- Un **marco de cinco caras del mismo copiloto** que da coherencia a actores hoy desconectados.
- Una **lista de hipótesis críticas con tests baratos**, para no construir antes de validar.
- Un **roadmap por fases con valor entregable cada una**.
- Una **filosofía rescatada de WAREM, sin copiar dominio**.

---

## 14. Cierre

La pregunta no es "¿qué app construimos para Taxi Green?".

La pregunta es: **"¿qué activo construimos para que, en cada reserva, alguien deje de teclear, alguien deje de perseguir y alguien deje de esperar sin saber?"**.

La respuesta defendida en este documento es: **un copiloto que ingiere los canales por donde ya llega el negocio y devuelve operación ordenada, experiencia mágica y cierre automático**. Cinco caras, un dominio, un activo que crece con cada reserva.

Eso es lo que esta visión propone validar.

Lo demás —pantallas, frameworks, decisiones técnicas— viene después, **y depende de lo que digan H1, H2, H3 y H4**.

---

*Fin. Para ejecutar, primero validar. Para validar, primero escuchar. Para escuchar, primero callarse las soluciones aprendidas de otros mercados.*

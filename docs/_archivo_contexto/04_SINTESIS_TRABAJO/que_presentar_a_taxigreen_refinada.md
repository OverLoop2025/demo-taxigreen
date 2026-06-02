# Qué presentar a Taxi Green — versión refinada

**Documento operativo para la primera reunión real con el cliente**

Este documento reemplaza, no complementa, la versión anterior (`que_presentar_a_taxigreen.md`). Está pensado como guía táctica para una reunión de 60 a 90 minutos con el comité decisor de Taxi Green (gerencia, operaciones, idealmente alguien de tecnología si lo tienen). No es un guion para leer: es la estructura mínima que evita los errores típicos de una primera presentación que termina sin avanzar.

Lo que está aquí asume la tesis del documento estratégico refinado: foco exclusivo en el corredor aeropuerto, voucher con código QR como artefacto verificable, monoliente al inicio, multitenant solo en arquitectura. Si esa tesis no se sostiene tras leer el repo, esta guía también cambia.

Marcado epistémico recurrente:
- `Evidencia directa` — está en transcripciones o documentos del cliente.
- `Inferencia` — deducción razonable nuestra.
- `Hipótesis` — apuesta sin confirmar.
- `Por validar` — pendiente explícito con el cliente.

---

## 1. Objetivo de la reunión

El objetivo NO es vender una solución. El objetivo NO es mostrar lo que sabemos hacer. El objetivo es **calificar si Taxi Green es un cliente con quien vale la pena entrar a una fase de discovery pagado**.

Eso se descompone en tres preguntas que la reunión debe responder, no que nosotros debemos responder:

1. **¿El problema que ellos sienten coincide con el problema que nosotros leímos en las transcripciones?** Si no coincide, todo lo demás es teatro.
2. **¿Quién decide y quién paga?** Si la persona que decide presupuesto no está en la reunión, esta reunión es de calentamiento, no de cierre.
3. **¿Están dispuestos a pagar para reducir incertidumbre antes de pedir cotización?** Es decir, ¿aceptan un discovery pagado como puerta de entrada? Si la respuesta es no, hay que decidir si igual queremos avanzar bajo otras condiciones o retirarnos elegantemente.

**Lo que no es el objetivo:**
- No es lograr que firmen un contrato grande hoy.
- No es lograr aplausos por la demo.
- No es enseñar tecnología.
- No es defender la idea del voucher como si fuera nuestra única apuesta.

**Indicador binario de éxito real:** al cierre, ¿hay acuerdo verbal o escrito sobre próximo paso con fecha, responsable y entregable? Si sí, ganamos. Si no, perdimos aunque la reunión "haya ido bien".

---

## 2. Materiales a llevar

Lista mínima, ordenada por probabilidad de uso real:

| Material | Soporte | Cuándo se usa |
|---|---|---|
| Deck impreso (10 a 12 láminas) | Papel A4 o A3 | Si la reunión es presencial y hay sala con mesa |
| Deck digital (mismo deck) | Laptop + adaptador HDMI/VGA propio | Si hay proyector o pantalla |
| One-pager comercial (1 cara, máx 2) | Papel impreso, varias copias | Se entrega al cierre, no al inicio |
| Demo Nivel 0 (Figma o láminas estáticas con flujo numerado) | Mismo laptop o impreso | Solo si la conversación lo pide |
| Demo Nivel 1 (prototipo navegable Figma) | Laptop | Solo si Nivel 0 generó tracción y hay tiempo |
| Hoja en blanco + lapicero | Físico | Para tomar nota frente a ellos. Esto comunica más que cualquier slide |
| Lista de las 15 preguntas priorizadas | Papel, solo para nosotros | Para asegurarse de no salir sin preguntar lo esencial |
| Acta corta o memo de reunión (template en blanco) | Digital o papel | Para llenar en vivo y enviar mismo día |

**Lo que NO se lleva:**
- Demo Nivel 2 (slice funcional real). Si la construimos sin compromiso firmado, ya cometimos el error que el documento estratégico advierte. Se ofrece como entregable de discovery, no como entrada.
- Cotización detallada. Cotizar sin discovery es disparar a ciegas.
- Arquitectura técnica con cajitas. No le importa a Taxi Green en esta etapa.
- Comparativas con Uber, Cabify, InDriver. Distraen y posicionan mal.
- Promesas de cifras de ahorro o ingresos. Sin datos suyos, cualquier número es inventado.

**Regla operativa:** todo lo que se lleve debe poder explicarse de pie y en menos de dos minutos. Si requiere más, no es material de primera reunión.

---

## 3. Qué mostrar primero

El orden importa. La mayoría de proveedores empieza mostrando su solución. Eso es exactamente lo que queremos evitar.

**Secuencia recomendada:**

1. **Devolverles su propio problema (3 a 5 minutos).** Empezar con: "Antes de mostrarles nada, queremos confirmar que entendimos lo que ustedes ya nos contaron." Y enunciar en lenguaje suyo, no nuestro, los puntos centrales que aparecieron en las transcripciones: contrato exclusivo con LAP, X unidades de flota propia operando aeropuerto, dificultad para escalar la operación administrativa, dependencia de procesos manuales, problemas de trazabilidad cuando un pasajero se queja. **Aquí escuchamos más que hablamos.** El cliente corrige, matiza, agrega. Esa información vale más que cualquier slide nuestra.

2. **Mostrar el mapa de oportunidades, no la solución (5 minutos).** Una sola lámina con tres a cinco bloques: operación aeropuerto, corporativos, eventos, integración con LAP, otros. Decir explícitamente: "Vemos varios frentes posibles. Hoy queremos discutir cuál merece foco primero según ustedes, no según nosotros." Esto los pone en posición de elegir.

3. **Recién entonces mostrar el flujo del voucher (10 a 15 minutos).** Solo si hay tracción en el bloque aeropuerto. Presentarlo como **hipótesis fuerte**, no como decisión: "Si el foco fuera aeropuerto, este es el flujo concreto que estamos imaginando. Queremos validarlo con ustedes paso a paso porque ustedes lo conocen mejor que nadie." Recorrer reserva → asignación → embarque → trayecto → cierre. Pausar en cada etapa para preguntar: "¿Esto se parece a cómo lo hacen hoy? ¿Qué falta? ¿Qué sobra?"

**Por qué este orden funciona:** posiciona a Bohemia (o como se llame el equipo proveedor) como interlocutor que escucha antes de proponer. Reduce el riesgo de que el cliente sienta que le están vendiendo algo prefabricado. Saca a la luz desalineaciones temprano, no al final.

**Lo que NO se hace al inicio:**
- No empezar presentando al equipo, hojas de vida o portafolio. Tres frases sobre quiénes somos bastan, dichas en el saludo.
- No empezar con la visión grandiosa. Eso suena a proveedor que quiere impresionar.
- No empezar con Figma abierto. Genera expectativa de que la reunión es para validar diseño, cuando todavía no validamos el problema.

---

## 4. Narrativa de 5 minutos

Si por restricción de tiempo o de agenda solo tenemos cinco minutos para presentar el concepto antes de que la reunión derive a otros temas, este es el guion mínimo a tener memorizado. No es un pitch de ventas: es el resumen ejecutivo de lo que entendimos y de lo que proponemos discutir.

**Estructura del guion (5 minutos cronometrados):**

> "Hemos leído lo que conversamos antes y queremos compartir cómo lo estamos entendiendo, para confirmar o corregir.
>
> Ustedes operan en el aeropuerto bajo concesión, con flota propia y conductores formales. Eso ya los diferencia de la mayoría del mercado, que es informal o intermediado por apps grandes. Esa diferencia es activo, no limitación.
>
> Lo que vemos como oportunidad concreta es construir un flujo verificable de extremo a extremo para cada servicio del aeropuerto: reserva, voucher con código QR, asignación de conductor y unidad, ejecución registrada, cierre con comprobante electrónico. Que cada servicio quede como evidencia consultable, no solo como movimiento operativo.
>
> Esto resuelve tres cosas que aparecen en lo que conversamos: trazabilidad ante quejas, formalización tributaria de cada operación, y base de datos sobre ustedes mismos para tomar decisiones con información real.
>
> Lo proponemos como hipótesis fuerte, no como decisión. Antes de cotizar cualquier cosa, queremos hacer un trabajo corto y pagado de descubrimiento, donde acompañamos su operación unos días, conversamos con conductores y administración, y volvemos con un plan que ustedes puedan aprobar o rechazar con información sobre la mesa.
>
> Lo siguiente que necesitamos de ustedes hoy no es una decisión sobre construir. Es una conversación sobre si esa lectura del problema y esa puerta de entrada por descubrimiento hacen sentido para ustedes."

**Notas sobre el guion:**
- No menciona tecnología (no se nombra app, web, WhatsApp, dashboard, base de datos).
- No menciona competidores.
- No menciona cifras de inversión.
- Termina con una pregunta abierta, no con una pregunta de cierre comercial.
- Usa "ustedes" muchas veces. Eso desplaza el foco hacia el cliente.

Si después de los cinco minutos el cliente quiere ver flujos, pasamos a Demo Nivel 0. Si quiere ir directo a costos, ahí aplica el plan B (sección 7c).

---

## 5. Demo: Nivel 0, Nivel 1 y Nivel 2

Esta sección define con precisión qué es cada nivel, qué cuesta producirlo, y bajo qué condiciones se muestra. Es la respuesta directa al error de la versión anterior, que ofrecía un "slice funcional end-to-end" como entrada de la primera reunión.

### Nivel 0 — Deck + Figma estático narrado

**Qué es:** entre 8 y 12 láminas estáticas, hechas en Figma o PowerPoint, que muestran el flujo paso a paso del voucher aeropuerto. No es navegable. No hay clic real. Cada lámina es un estado del sistema (pantalla de reserva, voucher generado, vista del conductor, etc.) y el flujo se cuenta narrando, no haciendo clic.

**Qué incluye exactamente:**
- Portada con concepto del flujo verificable.
- Lámina del mapa de actores (pasajero, operador, conductor, administración).
- 5 a 7 láminas mostrando cada paso del flujo: reserva → voucher → asignación → embarque (lectura QR) → trayecto → cierre → comprobante.
- 1 lámina con qué queda registrado tras cada servicio.
- 1 lámina con qué NO está incluido todavía (lista honesta de lo que falta).
- 1 lámina de cierre con la propuesta de discovery.

**Costo de producción nuestro:** 1 a 2 días-persona de diseño y curaduría. Bajo. Se puede producir antes de la primera reunión sin compromiso del cliente.

**Cuándo se muestra:** en la primera reunión, después de que el bloque aeropuerto generó tracción en la conversación de mapa de oportunidades. Es el material por defecto.

**Riesgo asociado:** el cliente puede confundirlo con producto terminado si no se enmarca bien. Enmarcado correcto: "Estas son láminas de concepto, no pantallas reales del sistema. Sirven para alinear el flujo."

### Nivel 1 — Prototipo navegable en Figma

**Qué es:** las mismas láminas del Nivel 0, ahora conectadas con interacciones Figma (clics, transiciones entre pantallas). El cliente puede recorrer el flujo en una laptop o tablet sin ayuda nuestra. No hay backend, no hay datos reales, no se persiste nada.

**Qué incluye exactamente:**
- Todo lo del Nivel 0.
- Interacciones Figma: clic en "generar voucher" lleva a la pantalla del voucher; escanear QR (simulado) lleva a la pantalla del conductor; etc.
- Dos o tres ramas alternativas mostradas (por ejemplo, qué pasa si el conductor no aparece, qué pasa si el pasajero cancela).
- Versión móvil simulada para la vista del conductor.

**Costo de producción nuestro:** 3 a 5 días-persona de diseño UX más curaduría. Medio.

**Cuándo se muestra:**
- Opción A: en la primera reunión, solo si el cliente ya expresó interés explícito por aeropuerto y queda tiempo suficiente (más de 30 minutos). No es default.
- Opción B (preferida): en una segunda reunión específicamente convocada para validar flujo. Esto ya implica que la primera reunión generó compromiso para avanzar.

**Riesgo asociado:** mismo del Nivel 0 amplificado. El cliente puede pensar que es producto listo y preguntar "¿cuándo lo tenemos?". Hay que ser explícito: "Esto es interfaz simulada. La construcción del sistema real es una decisión posterior."

**Condición dura para invertir el costo:** que haya al menos compromiso verbal del cliente de seguir hablando después de la primera reunión. Si la primera reunión no avanza, el Nivel 1 no se construye.

### Nivel 2 — Slice funcional real end-to-end

**Qué es:** una versión recortada pero funcional del flujo del voucher. Tiene backend mínimo, base de datos real, capacidad de generar un voucher con QR único, registrar lectura del QR, y emitir un comprobante (PDF simulando boleta o factura). Sirve para una demostración real en operación, con un conductor real de Taxi Green leyendo el QR con un teléfono.

**Qué incluye exactamente:**
- Backend con base de datos (PostgreSQL).
- Generación de voucher con QR único.
- Endpoint de lectura de QR (PWA del conductor).
- Registro de timestamps en cada estado (creado, asignado, leído, cerrado).
- Generación de PDF con datos del servicio (sin integración tributaria real; el PDF dice "documento de prueba, no válido tributariamente").
- Panel mínimo de operador para ver vouchers activos.

**Costo de producción nuestro:** entre 3 y 5 semanas de equipo (1 backend + 1 frontend + 1 diseño parcial + dirección). Alto.

**Cuándo se construye:** **solo después de discovery firmado y pagado**, o como entregable explícito de la Fase 1 si se acordó arrancar.

**Cuándo NO se construye:**
- Para primera reunión.
- Para segunda reunión.
- Para "demostrar capacidad" sin compromiso comercial.
- Para "convencer" al cliente. Si necesitamos un slice real para convencerlo, el problema no es la demo, es que la conversación no convence por sí sola.

**Disciplina comercial asociada:** ofrecer Nivel 2 sin discovery firmado equivale a regalar entre veinte y cuarenta mil soles de equipo, dependiendo de qué se incluya. Esa decisión la debe tomar gerencia comercial con plena conciencia, no por inercia de "queremos impresionarlos".

### Tabla resumen de decisión

| Nivel | Costo nuestro | Cuándo se muestra | Riesgo principal | Decisión por defecto |
|---|---|---|---|---|
| 0 | Bajo (1-2 días) | Primera reunión, default | Confusión con producto real | Producir antes de la reunión |
| 1 | Medio (3-5 días) | Segunda reunión, o primera si hay tiempo y tracción | Cliente pide construir ya | Producir solo si Nivel 0 generó interés explícito |
| 2 | Alto (3-5 semanas) | Solo post-discovery firmado | Regalar trabajo | NO producir sin compromiso |

**Inferencia:** si la primera reunión exige Nivel 2 sin compromiso, el cliente está calibrado a comprar commodity, no a invertir en producto. Esa señal vale más que el riesgo de perder la oportunidad.

---

## 6. Preguntas priorizadas (5 + 5 + 5)

Las 50 preguntas del paquete de contexto no se preguntan en una reunión. Hay que decidir cuáles son las 15 que no podemos salir sin haber abordado. Se agrupan por urgencia y momento de la conversación.

### Bloque A — Primeras 5 (críticas, sin estas no avanzamos)

Estas se hacen en la primera mitad de la reunión. Si quedan sin respuesta, la reunión no fue útil.

1. **¿Quién toma la decisión de invertir en un proyecto como este y quién aprueba el presupuesto?** Sin nombre concreto y rol, todo lo demás es exploratorio. `Por validar`.

2. **¿Cuál es el problema más caro de su operación actual, medido en tiempo de gerencia o en plata?** No el problema más visible: el más caro. La respuesta filtra entre proyecto real y proyecto cosmético. `Por validar`.

3. **¿Cuántos servicios realiza Taxi Green al mes en aeropuerto y qué proporción son taxi suelto vs corporativo vs van vs eventos?** Define tamaño real del problema y dimensionamiento de cualquier solución. `Por validar`.

4. **¿Qué pasa cuando un pasajero presenta una queja o reclamo? ¿Cómo lo manejan hoy?** La respuesta revela el verdadero dolor de trazabilidad y si el voucher resuelve algo concreto o solo nominal. `Por validar`.

5. **¿Han intentado algo parecido antes (software propio, sistema externo, intentos manuales) y por qué no funcionó?** Evita repetir errores que ya cometió otro proveedor y revela tolerancia real al cambio. `Por validar`.

### Bloque B — Siguientes 5 (importantes, idealmente en la reunión)

Estas se hacen en la segunda mitad, después de que el bloque A dio tracción.

6. **¿Cuál es la relación contractual exacta con LAP y qué cláusulas afectan la operación digital o el manejo de datos del pasajero?** Define límites legales y de marca antes de invertir en cualquier construcción. `Por validar`.

7. **¿Cuántos conductores tienen y cuál es el rango de edad y familiaridad con tecnología?** Define si una PWA es realista o si hay que pensar artefactos no digitales para el conductor. `Por validar`.

8. **¿Tienen sistema actual de facturación electrónica y con qué proveedor (PSE u OSE)?** Define complejidad de integración tributaria, que es el punto más subestimable de cualquier sistema operativo. `Por validar`.

9. **¿Qué información del servicio les piden hoy sus clientes corporativos (si los tienen), por ejemplo reportes mensuales, conciliaciones, evidencia de viajes?** Define si el activo de trazabilidad tiene mercado interno o se construye para nadie. `Por validar`.

10. **¿Estarían dispuestos a pagar por un trabajo de descubrimiento de 4 a 6 semanas antes de cotizar el proyecto completo?** Esta es la pregunta de calificación definitiva. Si la respuesta es no rotundo, la conversación cambia (ver plan B). `Por validar`.

### Bloque C — Últimas 5 (se preguntan si quedó tiempo o quedan para segunda reunión)

11. **¿Cómo asignan hoy la unidad y el conductor a cada servicio? ¿Hay despachador, hay rotación automática, hay rotación informal en el grifo?** Profundiza diseño de flujo. Se puede dejar para discovery.

12. **¿Cuál es la mayor preocupación operativa respecto a sus conductores (rotación, formalidad, evasión, conflictos)?** Sensible, no preguntar antes de generar confianza.

13. **¿Qué relación tienen con la ATU y cuál es su lectura del sistema central de despacho con QR que ATU planea para 2025?** Riesgo regulatorio. Se puede dejar para segunda reunión si no surge espontáneamente.

14. **¿Quién dentro de Taxi Green sería contraparte operativa diaria del equipo de desarrollo si esto avanza?** Asegura que no es solo iniciativa de gerencia sin sponsor operativo.

15. **¿Qué expectativa tienen de plazos? ¿Necesitan algo en producción este año o pueden invertir en un trabajo más largo de 6 a 9 meses?** Calibra disonancia entre lo que quieren y lo que es realista.

### Reglas de uso

- **No leer la lista en la reunión.** Tener las preguntas memorizadas o en una hoja para nosotros, y deslizarlas naturalmente en la conversación.
- **Preferir preguntas abiertas antes que cerradas.** "¿Cómo manejan…?" en lugar de "¿Manejan…?"
- **Si una pregunta del Bloque A no se puede responder, hay que decirlo explícitamente al cierre:** "Notamos que la pregunta sobre quién decide presupuesto quedó sin respuesta. ¿Podemos coordinar una conversación con esa persona?"
- **Las preguntas del Bloque C pueden esperar.** Discovery existe precisamente para responderlas.

---

## 7. Planes B

### 7a. Plan B si rechazan discovery

**Cuándo aplica:** la pregunta 10 del Bloque B recibe respuesta negativa explícita ("No, queremos cotización directa") o evasiva ("Veamos primero el proyecto completo y luego conversamos").

**Reconocimiento honesto antes de actuar:** rechazar discovery pagado no es necesariamente rechazo al proveedor. Puede ser cultura organizacional ("nosotros no pagamos por consultoría"), puede ser falta de presupuesto disponible, puede ser desconfianza inicial razonable. La respuesta no es retirarse de inmediato.

**Tres alternativas en orden de preferencia:**

**Alternativa 1: Discovery diferido pero comprometido.** "Entendemos. ¿Estarían dispuestos a un descubrimiento de menor escala (2 semanas en lugar de 4-6) cuyo costo se descuente del proyecto si avanzan?" Esto reduce fricción y mantiene la disciplina de no cotizar a ciegas. Si aceptan, se firma carta de intención con el costo del discovery y el descuento.

**Alternativa 2: Cotización por hipótesis con cláusulas explícitas.** "Podemos enviar una cotización indicativa basada en hipótesis. Lleva explícito que el precio se ajusta tras un discovery integrado al proyecto en las primeras 4 semanas. Si los hallazgos cambian el alcance, el precio cambia con regla clara." Esto es peor que discovery pagado pero mejor que cotización ciega sin disclaimer.

**Alternativa 3: Retirada elegante.** Si rechazan también las alternativas 1 y 2: "Lo respetamos. Nuestra forma de trabajar requiere un mínimo de información antes de comprometer plazos. Quedamos abiertos si en algún momento eso encaja." No es portazo, es reconocer mismatch de modelos.

**Lo que no se hace:** ceder y cotizar igual sin ningún colchón. La cotización ciega lleva a desviación de alcance, conflicto y proyecto inviable.

**Regla operativa (tres strikes):** si en la primera reunión rechazan discovery, en una segunda reunión rechazan discovery diferido, y en una tercera reunión rechazan cotización con cláusulas, la cuarta reunión no se agenda. Cada strike consume tiempo de equipo y refuerza la sensación de que somos negociables hasta el infinito.

### 7b. Plan B si piden solo demo

**Cuándo aplica:** el cliente expresa interés pero solicita ver más prototipo o pide construir Nivel 2 antes de cualquier compromiso. Frases típicas: "Muéstrennos algo más concreto", "Háganos una prueba para evaluar".

**Reconocimiento honesto:** querer ver más es razonable. El problema no es la solicitud, es producirla gratis.

**Respuesta escalonada:**

**Si piden más Nivel 0 o Nivel 1:** producirlo es barato. Acordar próxima reunión en 2 semanas con material extendido (más láminas, más ramas del flujo, demo navegable en lugar de estática). Esto se ofrece sin costo y sin compromiso porque la inversión es manejable.

**Si piden Nivel 2 sin discovery:** "Construir una versión funcional es trabajo de equipo durante varias semanas. Lo hacemos con gusto, dentro de un discovery pagado o como primer entregable del proyecto si avanzan. Sin alguno de esos dos marcos, no es viable para nosotros." Frase calibrada para no sonar rígida pero ser clara.

**Si presionan con "otros proveedores nos hacen demos gratis":** "Probablemente. Nuestra propuesta no compite por velocidad de demostración, compite por reducir el riesgo de que un proyecto termine mal. Si su criterio principal es ver demos antes de pagar, hay proveedores que encajan mejor con esa lógica." Esta respuesta gana o pierde el cliente según el tipo de cliente que sea. Si lo perdemos por esto, no era cliente para nuestra forma de trabajar.

**Lo que no se hace:** prometer Nivel 2 "rapidito" para no perder la oportunidad. Si se promete y se entrega, regalamos veinte a cuarenta mil soles. Si se promete y no se entrega, perdemos credibilidad.

### 7c. Plan B si preguntan por IP

**Cuándo aplica:** el cliente pregunta directamente "¿de quién es el sistema si lo construyen?" o "¿podríamos usarlo nosotros si terminamos relación?" o "¿lo van a vender después a la competencia?".

**Reconocimiento:** la pregunta es legítima y casi siempre llega tarde o nunca. Si llega en primera reunión, es buena señal: el cliente está pensando en serio.

**No improvisar.** Hay tres opciones de fondo (detalladas en el documento estratégico refinado, sección Propiedad intelectual). En reunión no se eligen, se explican:

**Respuesta sugerida:**

> "Es una pregunta importante y queremos abordarla con claridad. Hay tres formas usuales en que se estructura esto. Cada una tiene implicaciones distintas en precio, en velocidad y en futuro de la solución. Las describimos brevemente para que sepan qué opciones existen, y proponemos discutir cuál encaja con ustedes durante el discovery, no aquí."

Luego enunciar las tres en una frase cada una:

- **Opción A (proyecto a medida):** "Ustedes son dueños del código entregado. El precio refleja esa propiedad y suele estar entre 1.5x y 2.5x del costo base."
- **Opción B (cliente cero):** "Nosotros somos dueños y ustedes son cliente fundador con condiciones favorables: precio menor, exclusividad en su segmento por un periodo acordado (sugerimos 12 a 18 meses), trato preferencial."
- **Opción C (modelo mixto o revenue share):** "Compartimos riesgo y retorno. Útil solo si ustedes están dispuestos a operar el negocio digital activamente, no solo a usarlo."

**Cierre de la respuesta:**

> "No tenemos preferencia rígida. La opción correcta depende de qué tan estratégico es esto para ustedes y qué riesgo están dispuestos a tomar. Lo conversamos en serio durante el discovery."

**Lo que no se hace:**
- No prometer "el código es suyo" sin saber bajo qué opción se trabajará. Eso cierra la opción B y C, y obliga a la A que es la más cara.
- No prometer "es nuestro" sin saber si el cliente acepta. Eso puede romper la conversación de inmediato.
- No evadir la pregunta. Evadir genera desconfianza permanente.

**Por validar internamente antes de la reunión:** el equipo proveedor debe tener una opinión interna previa sobre qué opción prefiere por defecto. No para imponerla, pero sí para no improvisar.

---

## 8. Cierres

### 8a. Cierre ideal

Lo siguiente, en orden, al final de la reunión:

1. **Recapitulación de 2 minutos:** "Antes de cerrar, queremos confirmar qué entendimos. [Repetir los 3 a 5 puntos centrales que el cliente dijo, no los que nosotros dijimos.]"

2. **Pregunta directa:** "¿Tiene sentido para ustedes que avancemos a una fase de descubrimiento pagado de 4 a 6 semanas, con un costo de [rango calibrado] y entregables específicos [enunciarlos brevemente]?"

3. **Acuerdo concreto:** si responden positivamente, definir en la misma reunión:
   - Fecha tentativa de inicio del discovery.
   - Quién es contraparte operativa del cliente.
   - Cuándo se envía la carta de intención formal (idealmente 48 horas).
   - Próxima reunión: fecha y agenda.

4. **Memo de reunión en vivo o en 24 horas:** correo o documento corto con: temas tratados, decisiones, próximos pasos, responsables. Esto evita el clásico "lo que se conversó se diluye".

**Indicador de cierre ideal:** salimos con próximo paso agendado, contraparte definida, y compromiso (verbal o escrito) sobre discovery.

### 8b. Cierre mínimo aceptable

Si no se logró el cierre ideal, lo mínimo que justifica la reunión:

1. **Acuerdo sobre próxima conversación con fecha tentativa.** No "los llamamos en unos días". Fecha y hora propuesta antes de salir.

2. **Identificación clara de qué falta para decidir.** "Para que ustedes puedan decidir si avanzar, ¿qué información o conversación les falta? ¿Necesitan involucrar a alguien más? ¿Necesitan ver algo más concreto? ¿Necesitan resolver presupuesto interno?"

3. **Compromiso del cliente de hacer una acción específica antes de la próxima reunión.** Aunque sea pequeña ("nos confirman si gerencia general puede asistir", "nos comparten el contrato con LAP", "nos pasan el volumen de servicios mensual"). Esto convierte la próxima reunión en algo distinto a una repetición.

4. **Memo de reunión enviado mismo día.** Igual de importante que en cierre ideal.

**Indicador de mínimo aceptable:** la próxima reunión tiene fecha y contenido definido, no es "vamos coordinando".

### 8c. Reunión sin cierre

Si al cierre no hay próxima fecha ni próximo compromiso del cliente, la reunión fue calentamiento, no avance. Decisión interna a tomar en menos de 48 horas:

- ¿Insistimos con seguimiento activo o dejamos que el cliente venga si tiene interés?
- ¿Vale la pena producir Nivel 1 en frío para reactivar?
- ¿O entra en lista de "abierto pero no priorizado"?

Esta decisión no se toma sola por el comercial, se conversa en equipo.

---

## 9. Señales de alerta durante la reunión

Cosas que, si ocurren, hay que registrar inmediatamente porque cambian la lectura del cliente. No interrumpen la reunión, pero ajustan la conducta posterior.

### Señales rojas (riesgo alto)

- **Ausencia de quien decide presupuesto sin justificación clara.** Si no está el gerente general, o el dueño, o el director financiero, y no hay razón evidente (viaje), probablemente no es prioridad para ellos todavía.
- **El cliente compara precio explícitamente con desarrollo en serie o con soluciones tipo plantilla.** "¿Pero esto no se hace con un Bubble o un Glide?" Si no se reencuadra a tiempo, vamos a una guerra de precio que perdemos.
- **El cliente quiere que firmemos NDA sin abrir conversación sobre IP.** Puede indicar intención de tomar la idea y ejecutarla con otro proveedor más barato.
- **Pregunta repetida sobre "¿cuánto cuesta?" antes de que terminemos de explicar el concepto.** Indica calibración a comprar commodity, no a invertir en producto.
- **Hostilidad o desinterés evidente de alguien clave (operaciones por ejemplo).** Sin sponsor operativo, el proyecto se cae después de cualquier contrato.
- **El cliente menciona que tiene una solución casi lista de otro proveedor y solo busca segunda opinión.** Es señal de que somos backup, no opción real.

### Señales amarillas (cautela)

- **Mucha pregunta sobre tecnología específica (qué base de datos, qué framework).** Puede ser un colaborador técnico legítimo, o puede ser intento de absorber conocimiento gratis para hacerlo internamente.
- **Cliente pide "estudio gratis" o "informe gratis" como prueba de capacidad.** Aceptable solo si es de baja inversión y con marco temporal claro.
- **Reunión que deriva permanentemente a otros temas operativos de su empresa (problemas con LAP, conflictos con ATU, anécdotas largas).** Puede indicar que la prioridad real es otra y este proyecto es secundario.
- **Cliente que cambia de interlocutor sin avisar entre reuniones.** Síntoma de que no hay claridad interna sobre quién lleva el proyecto.
- **Promesas vagas tipo "esto puede ser muy grande" sin compromisos concretos.** Buen tono no equivale a tracción.

### Señales verdes (avanzar)

- **El cliente menciona presupuesto disponible específico, incluso aproximado.** Si dice "tenemos asignado un rango para este año", es señal de proyecto real.
- **El cliente pide reunión interna entre la primera y la segunda con nosotros.** Quieren alinear, eso es bueno.
- **El cliente comparte información operativa sensible (cifras, contratos, problemas reales).** Es señal de confianza ganada.
- **El cliente pregunta por equipo, por plazo, por metodología.** No por tecnología. Está evaluando cómo trabajaríamos juntos.
- **El cliente acepta discovery pagado sin pelear el precio.** Señal de proyecto serio.

---

## 10. One-pager comercial (separado, presentable al cliente)

Este es el único material que se entrega al cliente al cierre (no al inicio). Es un documento de una cara, máximo dos, que el cliente puede llevarse y mostrar internamente. No reemplaza ninguna conversación, condensa lo discutido. Lo siguiente es el contenido exacto que debe ir:

---

### TAXI GREEN — Operación verificable en aeropuerto

**Resumen ejecutivo**

Hipótesis de trabajo: cada servicio de Taxi Green en el corredor aeropuerto puede convertirse en una operación trazable de extremo a extremo, desde la reserva hasta el comprobante electrónico, manteniendo la flexibilidad operativa actual y aprovechando la ventaja de la concesión formal.

**El problema observado**

En la operación actual existen tres tensiones que aparecen recurrentemente: dificultad para responder con evidencia ante quejas o auditorías; trabajo administrativo manual que limita la capacidad de escalar sin sumar personal; falta de información estructurada sobre la operación propia para tomar decisiones.

**Lo que se propone construir (en fases)**

*Fase 0 — Descubrimiento pagado (4 a 6 semanas).* Acompañamiento operativo, conversaciones con conductores y administración, mapeo del flujo real actual, validación de hipótesis. Entregable: plan de proyecto con alcance, plazos y costo cerrados. Esta fase es deducible del proyecto si se avanza.

*Fase 1 — Construcción del flujo del aeropuerto (3 a 4 meses).* Reserva, voucher con código QR, asignación de conductor y unidad, registro de embarque por lectura QR, cierre del servicio, comprobante electrónico integrado con facturación tributaria. Vista de operador y vista del conductor.

*Fase 2 — Reportería y reconciliación (1 a 2 meses adicionales).* Tablero de operación, reportes para clientes corporativos si los hay, reconciliación con LAP, exportación de datos.

*Fases posteriores — Solo según resultados.* Apertura a otros segmentos (corporativo, eventos, vans), integraciones específicas, automatizaciones avanzadas.

**Qué NO se ofrece en esta etapa**

App de pasajero generalista. Marketplace. Competencia con Uber, Cabify o InDriver. Promesas de cifras de ahorro sin medición previa.

**Modelo de relación propuesto**

La propiedad intelectual del sistema y las condiciones comerciales se definen durante el descubrimiento. Hay tres modelos posibles que conversamos según convenga al cliente: proyecto a medida con código propio del cliente; cliente fundador con condiciones favorables y exclusividad de segmento; modelo mixto con riesgo compartido.

**Próximo paso sugerido**

Carta de intención para Fase 0 con alcance, plazos y costo del descubrimiento. Una vez recibida, se inicia en menos de 2 semanas.

**Contraparte sugerida del cliente**

Una persona del lado del cliente con autoridad operativa real y al menos 2 horas semanales para el equipo. Sin esa contraparte, los plazos se duplican.

**Contacto y equipo**

[Datos del equipo proveedor, sin alarde de credenciales: nombre, rol, contacto.]

---

**Notas sobre el one-pager:**
- No tiene logos grandes ni diseño pesado. Tipografía limpia.
- No tiene precios. Los precios se conversan, no se publican.
- No tiene plazos exactos. Rangos.
- No tiene cifras inventadas sobre ahorro o eficiencia.
- Cabe en una cara A4 con letra legible.
- Se firma con la fecha del día de la reunión, eso indica que está vigente y no es genérico.

---

## 11. Checklist previo a reunión

Lista accionable a marcar 48 horas antes de la reunión. No es burocracia, es lo que separa una reunión floja de una reunión que avanza.

### Preparación de contenido (48 horas antes)

- [ ] Releer las transcripciones disponibles del cliente para citarlas literalmente si surge oportunidad.
- [ ] Tener actualizada la lista de las 15 preguntas priorizadas en una hoja propia.
- [ ] Confirmar que la narrativa de 5 minutos está memorizada por quien la va a decir, no leída.
- [ ] Decidir qué nivel de demo se lleva (por defecto Nivel 0; Nivel 1 solo si la conversación previa lo justifica).
- [ ] Tener listo el one-pager impreso en al menos 3 copias.
- [ ] Tener acordado internamente quién responde si preguntan por IP (no improvisar la respuesta).
- [ ] Tener acordado internamente el rango de costo del discovery por si lo preguntan.

### Preparación logística (24 horas antes)

- [ ] Confirmar día, hora y modalidad (presencial/virtual) de la reunión.
- [ ] Confirmar lista de asistentes del lado del cliente. Si falta el decisor de presupuesto, preguntar si puede sumarse o si la reunión es preparatoria.
- [ ] Si es presencial: confirmar dirección, ubicación, estacionamiento si aplica.
- [ ] Si es virtual: probar enlace, audio, video y compartir pantalla con anticipación.
- [ ] Cargar batería de laptop. Llevar cargador. Llevar adaptador HDMI o VGA si es presencial.
- [ ] Tener offline una copia del deck (no depender de wifi del cliente).
- [ ] Imprimir todo lo necesario. No depender de impresora del cliente.

### Preparación de equipo (24 horas antes)

- [ ] Definir quién habla cada parte (la narrativa de 5 minutos, las preguntas, la conducción de la demo, el cierre).
- [ ] Acordar señales internas (por ejemplo, si alguien del equipo nota una señal roja, cómo lo comunica sin interrumpir).
- [ ] Acordar quién toma notas en vivo y quién las consolida después en el memo.
- [ ] Acordar el plan B explícito por escenario (si rechazan discovery, si piden Nivel 2, si preguntan por IP). No improvisar bajo presión.

### Post-reunión (mismas 24 horas después)

- [ ] Enviar memo de reunión al cliente con: temas tratados, decisiones, próximos pasos, fechas.
- [ ] Si quedó próxima reunión, enviar invitación de calendario en menos de 24 horas.
- [ ] Internamente: hacer debrief de 30 minutos máximo. Revisar señales rojas/amarillas/verdes. Decidir conducta para siguiente etapa.
- [ ] Actualizar registro interno del cliente (CRM, hoja de cálculo o lo que sea) con etapa actual y próxima acción.
- [ ] Si hubo material nuevo solicitado por el cliente, asignar responsable y fecha de entrega.

---

## 12. Evaluación honesta de este documento

Antes de cerrar, una mirada propia sobre qué tan útil es este documento y qué le falta para ser realmente sólido:

**Lo que el documento resuelve bien:**
- Reemplaza la propuesta original de "slice funcional como entrada" por una escala de demo de tres niveles con disciplina comercial asociada.
- Da una secuencia concreta de qué hacer minuto a minuto en la reunión.
- Da planes B explícitos para los tres escenarios más probables de fricción.
- Da un one-pager listo para usar.
- Distingue cierre ideal de cierre mínimo aceptable, evitando la falsa dicotomía éxito/fracaso.

**Lo que el documento no resuelve y queda pendiente:**
- Los rangos de costo del discovery no están en este documento porque no son decisión nuestra (proveedor), son decisión comercial interna. Quien use este documento debe completarlos.
- No incluye guion para reunión virtual vs presencial; hay diferencias importantes (control de la sala, atención del cliente, etc.) que merecerían un anexo.
- No incluye cómo manejar reuniones con consultores externos del cliente (auditores, asesores). Si Taxi Green los lleva, cambia la dinámica.
- No incluye plan para reunión con persona diferente a la prevista (el cliente cambia a último minuto a un interlocutor nuevo). Es común y descalibra a quien no está preparado.

**Nivel de confianza:** moderado-alto sobre el flujo de reunión y los planes B. Moderado sobre los rangos de costo de cada nivel de demo (estimados conservadores; pueden variar según equipo real y experiencia del diseñador). Bajo sobre la respuesta exacta del cliente, que es por definición lo que la reunión va a descubrir.

**Riesgo principal de este documento:** usarlo como guion rígido. La reunión real exige flexibilidad. Este documento es una red de seguridad para no salir sin haber abordado lo crítico, no una camisa de fuerza.

---

## Anexo — Diferencias respecto a la versión anterior

Para trazabilidad interna, principales cambios respecto a `que_presentar_a_taxigreen.md`:

| Aspecto | Versión anterior | Versión refinada |
|---|---|---|
| Demo por defecto | Slice funcional end-to-end | Nivel 0 (Figma estático); Nivel 2 solo post-discovery |
| Preguntas para reunión | 20 preguntas en 3 grupos | 15 preguntas priorizadas en bloques A/B/C |
| Plan B si rechazan discovery | No explicitado | Tres alternativas + regla de tres strikes |
| Plan B si preguntan IP | Mencionado vagamente | Respuesta calibrada con tres opciones nombradas |
| One-pager | No incluido | Incluido como anexo entregable |
| Checklist previo | No incluido | Incluido con secciones 48h/24h/post |
| Cierres | Implícitos | Explícitos: ideal, mínimo aceptable, sin cierre |
| Señales de alerta | No incluidas | Rojas/amarillas/verdes con conductas asociadas |

Este documento no invalida el anterior por completo: lo aprovecha donde acertaba (estructura de validación, tono) y lo corrige donde se equivocaba (subestimar costo de demo, no anticipar escenarios de fricción).

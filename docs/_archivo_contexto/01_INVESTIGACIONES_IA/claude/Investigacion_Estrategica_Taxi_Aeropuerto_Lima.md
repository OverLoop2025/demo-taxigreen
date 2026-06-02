# Investigación estratégica independiente: Taxi Green, Taxi Directo y el sector de transporte aeroportuario y ejecutivo en Lima

**Analista:** Investigación senior de estrategia, producto digital y modelos de negocio SaaS
**Fecha:** 20 de mayo de 2026
**Alcance:** Investigación independiente con lectura crítica de archivos del expediente
**Metodología:** Tres capas (lectura crítica de archivos, investigación web independiente, síntesis estratégica)
**Disclaimer fundamental:** Este informe diferencia explícitamente entre hechos confirmados, fuentes externas verificadas, datos provenientes de archivos del expediente, inferencias razonables, hipótesis abiertas y vacíos de información. Ningún supuesto se presenta como hecho.

---

## 1. Resumen ejecutivo

La pregunta que se le ha pedido a esta investigación contestar no es "qué app conviene construirle a Taxi Green". Es una pregunta más profunda y mucho más útil: ¿cuál es el verdadero problema operativo, comercial y de experiencia del cliente en el sector peruano de taxi aeroportuario y transporte ejecutivo, y qué tipo de solución digital tendría más sentido para resolverlo de manera viable, vendible y diferenciada?

La respuesta, después de cruzar evidencia interna y externa, es esta. El verdadero problema **no es** que los pasajeros peruanos no tengan apps para pedir taxis. Apps masivas hay de sobra: Uber, Cabify, inDrive y DiDi cubren ese terreno con miles de millones de dólares en capital acumulado. El verdadero problema, el que no resuelve ninguna de esas apps, es el que vive del otro lado del mostrador: la operadora formal de transporte ejecutivo que tiene un concesionario físico en el aeropuerto, una flota de conductores afiliados, una cartera de clientes corporativos que pagan a crédito y exigen factura electrónica consolidada, y una pila de procesos operativos sostenidos hoy por WhatsApp, llamadas, Excel y comprobantes en papel. Ese vacío tiene tres dimensiones simultáneas que se reforzaron al investigar el mercado: trazabilidad y compliance del traslado corporativo (duty of care), facturación electrónica SUNAT consolidada y predecible, y validación humana en el meet-and-greet aeroportuario.

Mi recomendación honesta, después de revisar todo el expediente, es que se debe construir **una plataforma operativa B2B de gestión de movilidad corporativa programada y aeroportuaria**, diseñada con visión de producto SaaS de marca blanca para el sector. El cliente que paga no es el pasajero individual; son las cinco a quince empresas formales peruanas de remisse y transporte ejecutivo (Taxi Green, Taxi Directo, Taxi365, CMV Remisse, Taxi Mitsoo, Moobiz, Remisse San Borja, A1Perú y similares), más las áreas de Travel y Administración de empresas medianas y multinacionales que hoy contratan estos servicios por WhatsApp.

Sin embargo, mi conclusión difiere en un matiz importante de la del reporte estratégico previo del expediente que recomienda construir el SaaS de marca blanca de entrada como producto independiente. En el contexto peruano y dada la realidad del cliente concreto (Taxi Green) que pidió la demo, lo más prudente es **partir construyendo el núcleo operativo digital para Taxi Green primero** (modernización + plataforma corporativa + módulo aeropuerto + capa de conductor) **diseñado desde día uno con arquitectura multitenant y separación clara entre lógica de operador y lógica de marca**. Esto permite, en doce a dieciocho meses, dar el salto a SaaS de marca blanca con un caso real, métricas reales, y cero riesgo de vender una promesa vacía. Esta ruta es la única que respeta tres restricciones simultáneas: el contrato comercial concreto que se está intentando ganar con Taxi Green, la realidad de los recursos de un emprendedor o un equipo pequeño, y la imposibilidad de validar un SaaS sin un cliente cero que pague.

El error estratégico más peligroso que debe evitarse, mucho más peligroso que la elección de stack o arquitectura, es presentarle a Taxi Green un "Uber clon" o un "Yango clon" como si esa fuera la solución. Esa propuesta es exactamente la que cualquier dev shop genérico puede ofrecer, no resuelve el dolor real, no defiende contra Cabify Empresas ni Moobiz, y le pide al pasajero algo que no quiere hacer: descargar una app más. Es el riesgo que ya estaba presente en parte del expediente.

El segundo error de magnitud equivalente es lo opuesto: presentar un SaaS ambicioso de marca blanca sin haber resuelto primero una operación real. Sería vender una promesa de catedral cuando lo que el cliente necesita es que su counter del aeropuerto funcione mejor el lunes siguiente.

---

## 2. Lo que dicen los archivos del expediente, separando hechos de hipótesis

Los archivos del expediente son ricos pero requieren una lectura quirúrgica. He encontrado material muy útil mezclado con propuestas preliminares, supuestos no validados, y al menos un caso de un proyecto distinto (Qorinti) que aparece como referencia pero no es la situación de Taxi Green. Procedo a ordenarlos por categoría epistémica, no por archivo.

### 2.1. Hechos concretos sobre Taxi Green que el expediente respalda y la investigación externa confirma

La empresa existe, opera bajo razón social GREEN AIRPORT S.A. y marca comercial Taxi Green, tiene su sede en Av. Bertello en el Callao, lleva veintitrés a veinticinco años en mercado (depende de la fuente, los archivos dicen 23+ y la propia web "más de 25"), y tiene una flota cuya cifra declarada va de 350 a 400 unidades. Su web operativa real corre en PHP en la ruta `/green/index.php` con stack frontal anticuado (jQuery 1.11, Bootstrap, Moment, Leaflet con geocoder Nominatim/OSM), tiene una vitrina paralela en WordPress en `/t/`, integra OpenPay como pasarela de pagos, externaliza facturación electrónica a Tranzas/Fenbo Digital, y declara seis verticales explícitos: traslados aeropuerto, taxi ejecutivo punto a punto, servicio por hora, van familiar y grupal, eventos corporativos, y city tours. Tiene un módulo físico de atención en Llegadas del aeropuerto Jorge Chávez frente a Puerta 1, atención 24/7/365, y reglas comerciales formalizadas que incluyen quince minutos de tolerancia de espera, cuatro horas mínimas de anticipación para cancelar, no-show con cargo del 100%, y peajes opcionales fijos en S/12.60.

Esto está documentado en el archivo principal de notas de Taxi Green y queda corroborado al cruzarlo con fuentes externas que mencionan la empresa como una de las cinco autorizadas a operar dentro del aeropuerto Jorge Chávez (junto con Taxi Directo, Taxi365, CMV Taxi Remisse Ejecutivo y Taxi Mitsoo Remisse). Las cinco empresas formales que el viajero encuentra dentro del aeropuerto Jorge Chávez son CMV Taxi Remisse Ejecutivo, Taxi Mitsoo Remisse, Taxi365, Taxi Directo y Taxi Green.

### 2.2. Ideas propuestas en los archivos, todavía en estatus de hipótesis comercial

El expediente contiene varias ideas comerciales que merecen consideración pero que **no son hechos**, sino propuestas que deben validarse:

La primera idea, presente en el archivo `taxi_green_principal.md`, plantea modernizar la experiencia del viajero internacional con una app móvil bonita estilo "premium" como diferencial frente a Uber, Cabify e inDrive. La segunda idea, en `taxi_green_secundario.md`, plantea un MVP híbrido que comienza modernizando el sistema actual y termina convirtiéndose en SaaS multiempresa. La tercera idea, en `PROBLEMA_ordenado_Taxi_Green.md`, surge después de una reunión con Raúl (operador con conocimiento del negocio) y reorienta la propuesta hacia una plataforma omnicanal que digitaliza la operación real del módulo aeropuerto, con WhatsApp y web como canales principales y app sólo como complemento. La cuarta idea, en el reporte estratégico `primeras_ideas.pdf`, va más lejos y plantea no construir nada específico para Taxi Green sino directamente un SaaS B2B2C de marca blanca para todo el sector regional, con QR-Voucher corporativo como diferencial.

Estas cuatro ideas no se contradicen entre sí en lo conceptual (todas reconocen que el corazón del negocio es B2B corporativo más concesión LAP, no app masiva de pasajeros), pero sí difieren mucho en lo táctico: por dónde empezar, a quién venderle primero, y cuánto comprometerse con el cliente concreto Taxi Green antes de pensar en el resto del sector.

### 2.3. Hechos sobre la conversación con Raúl que cambian el problema

El archivo `transcripcion_demo.txt` es probablemente el documento más valioso del expediente porque captura las palabras textuales de Raúl, el conocedor del negocio. De ese audio se extraen cosas que un análisis externo nunca habría llegado a saber: que la asignación de conductores en el aeropuerto no funciona como Uber sino por cola operativa, que el operador del módulo cumple un rol humano y de presentación que la IA no debe reemplazar sino acompañar, que la unidad vehicular y el conductor se gestionan por separado porque un mismo auto lo pueden conducir personas distintas en distintos turnos, que la empresa hoy notifica a sus conductores por llamadas y WhatsApp grupales, y que la liquidación al conductor es un proceso aparte que se hace después del servicio.

Esos detalles operativos son lo que distingue una propuesta que "se siente real" para Taxi Green de una propuesta "tipo Uber" que les sonaría ajena.

### 2.4. Supuestos ocultos en los archivos que conviene marcar

He detectado supuestos no explícitos que se filtran en los archivos y que conviene tener identificados antes de comprometerse con cualquier ruta:

El primero es la suposición de que Taxi Green quiere modernizarse. Esto **no está confirmado**. Lo único confirmado es que están abiertos a recibir una demo. Una empresa con veintitrés años de operación, flota considerable y módulo en el aeropuerto puede no querer cambiar nada, y "ver una demo" no implica compromiso de compra.

El segundo es la suposición de que el cliente corporativo de Taxi Green hoy está insatisfecho y demanda más tecnología. Esto también es hipótesis: es posible que el cliente corporativo de Taxi Green ya esté plenamente satisfecho con la operación actual por WhatsApp y crédito quincenal, y que el problema sea solo de cara al viajero turista (un mercado completamente distinto).

El tercero es la suposición de que las "400 unidades" de la flota son propias o controlables. Los Términos del sitio mencionan que los conductores son "afiliados", lo que sugiere un modelo más cercano al de empresa de despacho/marca que al de empresa de flota propia. La diferencia es crucial para diseñar cualquier app de conductor.

El cuarto es la suposición, presente en el reporte estratégico SaaS, de que hay diez a quince empresas formales de remisse en Perú dispuestas a pagar suscripción SaaS. No hay evidencia de eso. Hay evidencia de su existencia. La intención de pago es completamente distinta y se valida con entrevistas, no con suposiciones.

### 2.5. Contradicciones internas del expediente

Los archivos no se contradicen mucho entre sí pero hay tensiones reales que conviene resolver explícitamente. La principal es la tensión entre lo que Raúl pide (en la transcripción, una app tipo Uber con MongoDB, arquitectura distribuida en tres clouds, ciclo completo de reserva) y lo que la mayoría de los análisis posteriores recomiendan (no construir tipo Uber, no usar arquitectura sobre-ingenierizada para una demo, no insistir en MongoDB para datos esencialmente relacionales). Esta tensión es real y hay que negociarla con Raúl directamente, no por escrito desde un informe.

La segunda tensión es entre el archivo `vision_final.md`, que claramente pertenece a otro proyecto (Pepethefrog, copiloto comercial para distribuidoras técnicas), y el resto del expediente. Ese archivo no debe usarse como insumo para Taxi Green; está aquí por accidente del proceso de subida o como referencia de estilo de informe, no como fuente sobre este sector.

La tercera tensión es entre los reportes del proyecto Qorinti (`Reporte_Tecnico_Qorinti.pdf` y `Reporte_Contexto_Qorinti.pdf`) y la situación de Taxi Green. Qorinti es un producto **distinto** que ya tiene una versión beta funcional construida con Flutter, Dart y Firebase, posicionado como marketplace multivertical de transporte y logística, con módulo administrativo, panel de conductor, sistema de subasta entre ofertas, comisiones, facturación, billeteras Yape/Plin, geolocalización con Google Maps y validación documental de conductores y vehículos. Si Qorinti es algo en lo que tú u otra parte interesada ya tiene equity o derechos, es un activo aparte y la decisión sobre qué hacer con él se cruza con (pero no se subordina a) la decisión sobre Taxi Green. Más sobre eso en la sección 15.

---

## 3. Qué NO debe asumirse como verdad desde los archivos

Hago aquí explícitos los puntos donde el expediente arrastra sesgos o conclusiones precipitadas que esta investigación rechaza como punto de partida.

No debe asumirse que la solución correcta sea una app móvil para pasajeros. Ninguna de las cuatro ideas mayores del expediente lo sostiene una vez analizadas, pero la transcripción de Raúl sí lo da por sentado. Investigué deliberadamente si esa es la dirección correcta y la conclusión es contundente: si Taxi Green compite por la atención del pasajero individual en su app, pierde ante Uber, Cabify e inDrive sin discusión, porque esos rivales tienen miles de millones de dólares de capital, conductores en todas las ciudades del Perú y operación en cientos de países. inDrive ya es líder en Perú con presencia en 21 ciudades y crecimiento de 32% en el primer semestre de 2025. Uber acumula más de 380 millones de viajes y 2.500 millones de kilómetros recorridos en Perú desde el inicio de operaciones. Entrar a ese terreno con una app local es suicida.

No debe asumirse que Taxi Green necesita copiar Uber. Lo que necesita Taxi Green es lo opuesto: defender y profundizar lo que tiene de propio (concesión LAP, marca, antigüedad, módulo físico, relación corporativa) digitalizando capas que hoy son manuales. Es una historia de modernización defensiva y palanca corporativa, no de batalla por atención de pasajeros.

No debe asumirse que el cliente final del software es Taxi Green. Si el norte es SaaS de marca blanca, el cliente final no es Taxi Green sino el conjunto de empresas similares en Perú y la región. Taxi Green sería el "cliente cero" que paga por modernizarse, no el comprador final del SaaS comercializado.

No debe asumirse que el QR es lo que Raúl dice en la transcripción (un código tipo boarding pass de LATAM, que el pasajero muestra). Eso es UN uso legítimo (verificación en el meet-and-greet aeroportuario) pero hay tres usos adicionales más valiosos que el expediente discute solo parcialmente: voucher corporativo prepagado para invitados sin cuenta, marca de tiempo legalmente útil para el descargo contable de la factura electrónica, y huella de auditoría para compliance corporativo. La sección 12 desarrolla esto.

No debe asumirse que la arquitectura distribuida en tres nubes diferentes con MongoDB que propuso Raúl sea técnicamente correcta. Para una demo de preventa, e incluso para un MVP de producción inicial, la complejidad operativa que añade esa elección no se justifica con los beneficios. Más importante todavía, los datos del dominio (reservas, conductores, viajes, pagos, comprobantes, centros de costo) son intrínsecamente relacionales y se modelan mucho mejor en PostgreSQL o MySQL que en MongoDB. Esta es una conversación que José tiene que tener con Raúl antes del compromiso técnico.

No debe asumirse, finalmente, que los ocho clientes corporativos públicamente citados por Moobiz (Willax TV, Apuesta Total, OIM, SUNAFIL, UNICEF, Nexa, Mitsui, Movistar, Mattel, Falabella, Pacífico Seguros, Deloitte) sean clientes activos de hoy ni que los volúmenes que manejan sean grandes. Es lista de marketing público, no de fact-check.

---

## 4. Contexto del mercado peruano de taxi aeropuerto y transporte ejecutivo

Para que la recomendación tenga peso, hay que entender bien el escenario donde se va a operar. Lo voy a presentar en cuatro frentes: la operación aeroportuaria como tal, la operación corporativa, los aplicativos masivos como contexto, y el marco regulatorio.

### 4.1. La operación aeroportuaria post-junio 2025

El aeropuerto Jorge Chávez vivió uno de los cambios de infraestructura más grandes de su historia en 2025. El nuevo terminal, tres veces más grande que el anterior, inició operaciones el **1 de junio de 2025**, después de una ceremonia de inauguración el viernes 30 de mayo y una marcha blanca de dos semanas que arrancó el 15 de mayo. La presidenta Dina Boluarte participó de la inauguración el 30 de mayo, y las operaciones comerciales iniciaron oficialmente el domingo 1 de junio a la 1 de la tarde. La capacidad declarada es de 40 millones de pasajeros anuales hacia 2025 con un edificio terminal de 270 mil metros cuadrados.

Esto importa para la propuesta por dos razones operativas concretas. La primera es que el acceso vehicular al nuevo terminal cambió, y los pasajeros deben prever tiempos adicionales considerables. El CEO de LAP anunció oficialmente que los pasajeros deben salir 45 minutos antes de lo habitual para llegar al nuevo terminal. La segunda es que el primer mes de operación arrojó cifras que confirman la dimensión del flujo: en su primer mes el nuevo terminal movilizó a 2 millones 134 mil pasajeros y operó casi 15 mil vuelos, con un promedio diario de 70 mil pasajeros. La demanda agregada de traslados al/desde el aeropuerto creció en simultáneo, y con ella crece la demanda corporativa específica: trayectos más largos por la nueva entrada, más necesidad de meet-and-greet ordenado, más facturación para descargos contables.

Esto define el "moat" físico que tiene Taxi Green: ser una de solo cinco empresas autorizadas a tener counter dentro del nuevo terminal, en zona de Llegadas, lo que les da una posición que Uber, Cabify, inDrive y DiDi no pueden replicar. Dentro del nuevo aeropuerto operan cinco empresas autorizadas con counters físicos: CMV Taxi Remisse Ejecutivo, Taxi Mitsoo Remisse, Taxi365, Taxi Directo y Taxi Green. Esa autorización es regulatoria y física, no tecnológica.

### 4.2. La operación corporativa peruana de movilidad

Aquí hay datos externos contundentes y recientes. Cabify ha hecho un trabajo cuidadoso de medición. El Barómetro de Movilidad Corporativa 2026 de Cabify para empresas reporta más de 3.100 empresas usando soluciones de movilidad corporativa, crecimiento del 17% en usuarios corporativos y 12,3% en volumen de viajes durante el último año, con un promedio de 7,5 viajes mensuales por usuario corporativo. La mayor concentración de viajes corporativos se registra alrededor de las 10:00 a.m., con picos los miércoles y jueves de la tercera semana de cada mes.

Más interesante todavía para una propuesta enfocada en aeropuerto: los viajes con reservas anticipadas crecieron 52% en 2024, impulsados por el segmento corporativo y por sectores intensivos en personal como BPO y operaciones aeroportuarias. Renato Cáceres, Head of B2B de Cabify Perú, declaró que en el primer trimestre de 2026 el negocio corporativo creció 30% frente al año previo y 20% en número de viajes, alcanzando una facturación histórica para Cabify Empresas en marzo. Y un dato que no aparece tan citado pero que es revelador del estado de adopción: 9 de cada 10 empresas en Perú modernizan su movilidad corporativa para atraer talento y fortalecer su marca.

Estos números no significan que el mercado esté saturado. Lo que significan es que existe demanda corporativa real, está creciendo, y los competidores grandes ya la están atendiendo activamente. Si la propuesta no se diferencia con un dolor específico que esos competidores no resuelven, no tiene chance.

Hay también un competidor peruano local especializado, Moobiz, que merece análisis. Moobiz se presenta como app peruana enfocada en taxis corporativos con operación principal en Lima y cobertura nacional, ofreciendo reservas programadas, dashboards de control de gastos, facturación electrónica consolidada, conductores verificados y vehículos en buen estado. Moobiz inició como empresa de remisse hace una década y desde 2016 cuenta con portal web y app móvil propia. La empresa figura registrada en SUNAT como Moobiz Corp S.A.C., razón social anterior Taxi Club Remisse S.A.C., con CIIU 60227 (otros tipos de transporte no regulado vía terrestre).

### 4.3. Las apps masivas como contexto, no como competencia frontal

El mercado peruano de ride-hailing está muy maduro. El sector taxi-aplicativo mueve económicamente unos S/10.000 millones a nivel nacional, con S/2.000 millones solo en Lima Metropolitana, según consultora Flanqueo. El 38% de los limeños usa aplicaciones de taxi, principalmente en sectores socioeconómicos A y B, mientras el 70% sigue prefiriendo transporte público; inDrive es la app más instalada (71% de los encuestados la tiene en su celular), superando a Uber.

Sobre los actores principales: inDrive opera cinco servicios en Perú (movilidad urbana, delivery, transporte ciudad-a-ciudad, cargo y servicios financieros), está en 21 ciudades, y tiene tasas de crecimiento de 32% en el primer semestre 2025. Uber, presente en todos los departamentos del Perú, acumula más de 380 millones de viajes y reporta que el turismo es uno de sus motores de crecimiento más importantes para 2026. Beat cesó operaciones en Perú el 9 de noviembre de 2022.

Ninguno de estos jugadores compite directamente en el segmento "reserva programada corporativa con factura consolidada, aprobación previa, módulo físico aeroportuario, voucher para invitado sin cuenta y duty of care". Ese hueco es real.

### 4.4. Marco regulatorio relevante

La facturación electrónica en Perú está consolidada como obligatoria. La factura electrónica es obligatoria desde 2022 para todos los contribuyentes en Perú como parte del proceso de digitalización fiscal de SUNAT. SUNAT publicó la Resolución 000075-2026 que entra en vigor el 1 de junio de 2026 y establece que los nuevos contribuyentes inscritos en el RUC bajo Régimen MYPE Tributario, Régimen Especial o Régimen General deberán emitir comprobantes electrónicos desde el mismo día de su inscripción. Cualquier producto de transporte ejecutivo que no maneje bien la integración SUNAT con OSE (Operador de Servicios Electrónicos) certificado pierde el partido. No por mérito tecnológico sino por incumplimiento formal.

A esto se suma la **Guía de Remisión Electrónica (GRE)** y la digitalización plena del sistema de fiscalización, que para 2026 ya consolidó el modelo de fiscalización digital con auditorías automatizadas y cruces de datos en tiempo real. El cliente corporativo serio no quiere usar una plataforma de transporte que no se conecte bien con SUNAT.

---

## 5. Mapa de actores del ecosistema

Voy a mapear nueve actores con sus necesidades reales, sus pains principales y los canales que usan hoy. Esto sirve como base para decidir a quién atender prioritariamente en cualquier propuesta.

El **pasajero individual turista internacional** llega al aeropuerto Jorge Chávez con jet-lag, posiblemente sin chip local, posiblemente sin haber reservado, y prioriza tres cosas en este orden: seguridad (no caer en taxi informal), velocidad para salir del aeropuerto, y precio razonable. Su comportamiento típico es buscar el counter de una empresa formal con cartel claro, pagar tarifa fija prepublicada, recibir comprobante en su correo si lo solicita, y salir. Casi no descarga apps locales. Usa Uber con su cuenta global si quiere bajar precio. Lo que más le falla hoy es la fricción del meet-and-greet manual.

El **pasajero individual local frecuente** es muy distinto: vive en Lima, usa el aeropuerto cuando viaja, ya tiene cuenta en Uber/Cabify/inDrive. Probablemente reserve Taxi Green sólo para vuelos muy tempranos o muy tarde, o cuando quiere garantía de unidad. Para él, una app de Taxi Green compite con apps que ya tiene instaladas y donde ya tiene tarjeta cargada. Difícil moverlo.

El **pasajero corporativo invitado** llega al aeropuerto en un vuelo pagado por la empresa que lo invitó (un cliente lo recibe, una conferencia, un proceso de selección, una visita médica). No tiene cuenta en la app del proveedor de transporte. Recibió por correo o WhatsApp un código de reserva, datos del conductor y placa del vehículo. El meet-and-greet humano es para él más importante que cualquier app: un conductor con su cartel, con su nombre bien escrito.

El **conductor afiliado** es, en el caso peruano de remisse formal, una pieza híbrida: típicamente independiente, dueño de su vehículo o de un vehículo asignado por la empresa, paga afiliación o comisión, recibe servicios por WhatsApp, radio o sistema interno, y cobra contra el efectivo del viaje menos comisión, o contra liquidación periódica. Lo que necesita es claridad sobre el próximo servicio, ruta, datos del pasajero, comprobante de cierre y dinero a tiempo. Hoy todo eso le llega con fricción y ruido.

La **central operativa o despachador del proveedor** (lo que en el archivo PROBLEMA_ordenado llaman "operador del módulo aeropuerto") es el rol más invisible y el más crítico. Decide qué unidad va a qué reserva, resuelve cambios de vuelo y no-shows, atiende el counter, presenta el conductor al pasajero, registra la venta en caja en el caso walk-in. Su herramienta hoy es WhatsApp, su libreta y una computadora con sistema interno. Es a esta persona a la que más le va a impactar (positiva o negativamente) cualquier solución digital.

El **administrador corporativo del cliente final** (Travel Manager, RR.HH., Administración) gestiona los servicios desde la empresa que contrata. Da de alta empleados, fija centros de costo, autoriza viajes, recibe la factura mensual consolidada, descarga reportes. Hoy lo hace casi todo por correo y Excel. Es el comprador más valioso porque firma los contratos marco y porque puede llevar a su empresa de proveedor en proveedor según calidad de servicio y facilidad operativa.

El **hotel partner** (Marriott, Westin, JW, Sheraton, Country Club, etc.) ofrece a sus huéspedes el servicio de traslado al aeropuerto como parte de su servicio de conserjería. Normalmente trabaja con uno o dos proveedores fijos. Hoy gestiona reservas por correo y WhatsApp con la central del proveedor. Su pain es la confiabilidad: si un huésped queda mal, queda mal el hotel.

La **agencia de viajes y operador turístico** vende paquetes que incluyen traslado aeropuerto y city tours, y lo gestiona con uno o varios proveedores. Le interesa la integración por API o al menos por correo automatizado, y la facturación consolidada por temporada.

El **aeropuerto y Lima Airport Partners (LAP)** es el regulador físico de la operación en el terminal. Otorga las concesiones, exige cumplimiento, fija las reglas del módulo. Es un actor del que depende todo y al que ninguna solución técnica reemplaza.

El **administrador de la plataforma o super-admin del proveedor**, finalmente, es quien gestiona conductores, vehículos, tarifas, conciliaciones, reportes financieros y la lectura del negocio. Es el rol que típicamente hace el dueño o gerente operativo de la empresa de transporte. Es quien firma el cheque del SaaS si se lo vendemos.

---

## 6. Flujo actual probable del servicio

Aquí integro lo observado en la web pública de Taxi Green, lo descrito por Raúl en la transcripción, y los patrones del sector para reconstruir cómo funciona hoy probablemente el servicio. Lo presento separando los flujos centrales.

El **flujo Lima a aeropuerto con reserva previa** comienza cuando un pasajero llama al call center (484-4001), escribe por WhatsApp (998267148), o hace la reserva por la web operativa `/green/index.php`. Cualquiera que sea el canal, los datos terminan en un sistema interno de Taxi Green (probablemente una base MySQL detrás de los scripts PHP) y desde ahí en una cola de reservas que la central operativa revisa. La central confirma el servicio al pasajero (por el mismo canal o por SMS/correo), y en algún momento próximo a la hora pactada, asigna manualmente un conductor con su unidad, probablemente avisándole por WhatsApp interno o por una llamada. El conductor llega al punto de recojo con quince minutos de tolerancia, toma al pasajero y su equipaje, ejecuta el viaje. Al final, cobra al pasajero por el método pactado (efectivo, Yape, Plin, tarjeta tokenizada vía OpenPay), reporta el cierre, y la factura o boleta electrónica se emite por Tranzas/Fenbo Digital y llega al correo del pasajero.

El **flujo aeropuerto a destino con reserva previa** es la variante más sensible porque cruza con la operación del módulo físico. El pasajero hizo la reserva antes (web, WhatsApp, call center, o desde la sala de espera de su vuelo) indicando vuelo, hora de llegada y destino. La central ve la reserva en su sistema, alerta al personal del módulo aeropuerto, y al momento estimado de salida del pasajero (calculado desde el aterrizaje) el operador del módulo lo espera con un cartel con su nombre. Cuando el pasajero llega, se acerca, se identifica (por nombre, por DNI, por código de reserva, por QR si lo lleva en celular), y el operador valida la reserva en su pantalla. Aquí ocurre el momento de asignación: el operador consulta la cola de conductores disponibles, le asigna uno (manualmente o asistido por un sistema interno básico), avisa al conductor que está en cola (por radio, app interna, o WhatsApp), y presenta al conductor al pasajero. El conductor lleva al pasajero al vehículo, ejecuta el viaje, cobra, y se emite el comprobante.

El **flujo aeropuerto a destino walk-in (sin reserva previa)** es probablemente el más alto en volumen para Taxi Green durante temporada turística. El pasajero llega al módulo, pregunta tarifa, decide, paga en counter (o lo hace cargar a la empresa si tiene convenio), y todo lo demás se desencadena igual que en la variante con reserva: el operador asigna conductor, presenta, y arranca el servicio.

El **flujo corporativo recurrente** se diferencia en dos cosas. Primero, no hay pago directo: la empresa cliente tiene cuenta crédito y paga a fin de mes o quincenalmente contra factura consolidada. Segundo, los servicios pueden venir agrupados (varios traslados al día para distintos colaboradores), y la persona que solicita el servicio en la empresa cliente puede no ser la misma que viaja. Esto introduce los conceptos de "solicitante" y "aprobador", y demanda reportes mensuales con centros de costo y trazabilidad de cada viaje.

El **flujo de city tour** es un servicio más complejo que típicamente queda fuera del canal digital y se gestiona por correo o WhatsApp directo con el área de ventas corporativas. Se pacta itinerario, número de pasajeros, horarios, idioma del guía si aplica, tarifa fija. Es operación a medida.

Lo importante de este mapa es que ningún flujo es "pedido en la calle a un conductor cercano" estilo Uber. Todos pasan por una central que valida, asigna y reporta. Esa es la diferencia estructural que cualquier solución debe respetar.

---

## 7. Dolores principales detectados

Aquí cruzo lo que el expediente sugiere (con sus sesgos) con lo que la investigación externa permite confirmar como dolor real del sector.

El primer dolor, y el más documentable, es la **trazabilidad y compliance del traslado corporativo**. Cuando una multinacional contrata Taxi Green o cualquier remisse para que recoja a un ejecutivo o invitado, hoy tiene un correo o un WhatsApp como única evidencia formal. Si pasa algo (un accidente, un retraso crítico, una queja, una denuncia de seguridad), la trazabilidad es manual y débil. Esto entra en colisión directa con el "duty of care" que las áreas de Risk Management y Legal de las multinacionales empezaron a exigir después de incidentes como el precedente Dusek v StormHarbour, donde una empresa empleadora fue responsabilizada por no verificar adecuadamente al operador de transporte que contrató. Cabify lo entendió: una buena parte de su pitch corporativo gira sobre seguridad medible y reportable.

El segundo dolor es la **facturación electrónica consolidada**. Una empresa con cuarenta o cien viajes mensuales en taxis corporativos hoy debe conciliar a mano si su proveedor le emite un comprobante por viaje, esperar al fin de mes a un correo con un Excel adjunto, validar centro a centro de costo cuál viaje corresponde a cuál empleado, y todo eso bajo la presión del plazo SUNAT de envío del CPE. Es un trabajo manual costoso, propenso a errores, y obvio candidato a automatización. El Barómetro de Cabify 2026 explícitamente identifica el control y la trazabilidad como vectores estratégicos donde las empresas siguen evolucionando.

El tercer dolor es la **fricción del meet-and-greet aeroportuario**. En el viejo terminal el counter estaba a pocos pasos de Llegadas. En el nuevo terminal el acceso vehicular cambió, los flujos son más largos, hay más distancias y más confusión. Coordinar al pasajero correcto con el conductor correcto con la unidad correcta en el lugar correcto, con tiempos de espera ajustados, es genuinamente difícil. El operador del módulo hoy lo hace con cartel, planilla, llamada por radio o WhatsApp, y agilidad humana. Cualquier herramienta digital que reduzca tiempo y errores en ese hito reduce el costo de oportunidad de la operación.

El cuarto dolor es la **gestión del invitado sin cuenta**. Cabify y Uber han avanzado mucho en esto con sus productos Vouchers para empresa: la corporación genera un link prepagado y el invitado lo consume sin descargar la app. En Perú, los proveedores formales de remisse hacen la misma función pero de forma artesanal: envían al invitado un correo con un código de reserva y un teléfono de contacto, y rezan que el meet-and-greet salga bien. Hay aquí una oportunidad de digitalización clara.

El quinto dolor es la **asignación operativa del conductor**. Hoy en Taxi Green, según el expediente y la transcripción, la asignación se hace por llamada o WhatsApp grupal: el despachador pregunta quién está cerca o disponible y alguien responde. Es funcional pero arrastra ruido, demoras y dependencia del juicio del despachador. Un sistema asistido (no autónomo) que muestre cola de conductores con su ubicación, tipo de unidad y disponibilidad, y le sugiera al despachador un orden recomendado mientras éste mantiene la decisión final, ahorra minutos en cada servicio y minimiza errores en horas pico.

El sexto dolor es la **invisibilidad del estado de servicio para el pasajero y para el cliente corporativo**. Una vez que se pacta la reserva, el pasajero queda esperando una llamada del conductor cuando llegue al punto. No hay tracking, no hay ETA dinámico, no hay confirmación visual del vehículo asignado. Esto es exactamente lo que los pasajeros internacionales esperan de cualquier servicio de transporte premium en 2026, y no recibirlo erosiona la marca premium que Taxi Green intenta proyectar.

El séptimo dolor es la **debilidad de la app móvil oficial**. Esto es específico de Taxi Green pero ilustra un patrón sectorial. El reporte estratégico previo del expediente y el archivo `taxi_green_principal.md` documentan que la app declarada de Taxi Green no resuelve actualmente en stores y está publicada bajo cuenta de persona natural ajena a la sociedad GREEN AIRPORT S.A. (un proveedor llamado "Maurodev" / Guissepi Rodriguez Torres). Esto es una bandera roja de gobierno corporativo y de continuidad: la propiedad intelectual del producto digital móvil de la empresa no es de la empresa misma. Es probable que un patrón similar afecte a otras empresas del sector que tercerizan la app a desarrolladores independientes.

El octavo dolor es la **escasez de city tours y servicios complementarios en canal digital**. La empresa declara seis verticales pero solo uno (traslado al aeropuerto) tiene flujo digital semiautónomo. Los otros cinco caen al call center.

El noveno dolor es la **distancia digital con los hoteles y agencias**. Hoteles cuatro y cinco estrellas en Lima ofrecen traslado a sus huéspedes y necesitan un proveedor confiable. La integración entre proveedor y hotel hoy es manual o, en el mejor caso, por API muy básica.

Cada uno de estos dolores es accionable. La pregunta táctica no es "¿cuál existe?", sino "¿por cuál empiezo y a quién se lo cobro?". Eso lo responde la sección 14.

---

## 8. Comparación con países desarrollados: cómo se resuelve este problema en Estados Unidos y Europa

Para evitar copiar Uber, hay que entender bien qué se hizo en mercados más desarrollados específicamente para resolver este nicho, que NO es ride-hailing masivo.

En **Alemania y Reino Unido**, el modelo dominante de transporte ejecutivo internacional es Blacklane. Blacklane conecta a sus huéspedes con choferes profesionales locales certificados en 60 países y más de 500 ciudades del mundo, bajo una marca y un estándar único, con servicios de transferencia aeroportuaria (con flight tracking, una hora de espera gratuita y servicio de meet-and-greet en Llegadas), city-to-city, contrataciones por hora, y on-demand. Blacklane fue fundada en septiembre de 2011 en Berlín por Jens Wohltorf y Frank Steuer, no tiene flota propia y trabaja con compañías locales de chofer en cada ciudad. Tienen una división Blacklane for Business con portal corporativo, gestión de pasajeros invitados, facturación consolidada e integración con Concur y otros sistemas de gestión de viajes corporativos.

Aplicado a Perú, lo aprendible de Blacklane es: no necesitas tener flota propia, sí necesitas tener marca, certificación y experiencia consistente, y la pieza tecnológica que vale es el meet-and-greet con flight tracking, no la app de ride-hailing.

En **Grecia, España, Italia y Francia** el modelo dominante para hoteles es Welcome Pickups. Welcome Pickups trabaja con hoteles de cuatro y cinco estrellas en Europa para automatizar los traslados aeroportuarios prearreglados de sus huéspedes, con beneficios para el hotel como ingreso adicional, optimización operativa por conocimiento de hora de arribo, monitoreo de retrasos de vuelo, y servicio sin requerir exclusividad. Más de 1500 hoteles en Europa trabajan con Welcome Pickups para automatizar las transferencias de huéspedes. Welcome Pickups ofrece precios fijos publicados con anticipación, típicamente entre 30 y 70 euros para vehículos estándar en destinos europeos, y resuelve la fricción del taxi local desconocido y de los carteles de taxi mafiosos en zonas turísticas.

Aplicado a Perú, lo aprendible de Welcome Pickups es: el canal hotelero es subutilizado, el precio fijo prepublicado vence al taxímetro (y al regateo), y un proveedor de software puede crearse como integrador entre hoteles y proveedores locales sin tener una flota.

En **Estados Unidos** hay un ecosistema más fragmentado. GroundLink y Wingz son agregadores de chofer en negro tipo Blacklane más enfocados en costa este y costa oeste, con producto B2B fuerte para corporativos. GroundLink ofrece servicio de chofer en negro tanto punto a punto como traslado aeroportuario, con app para iOS y Android y opción de orden inmediata o programada. Uber for Business y Lyft Business pelean la otra mitad con sus respectivos productos Vouchers (link prepagado para invitado sin cuenta) y Reserve (reserva programada con conductor garantizado).

Aplicado a Perú, lo aprendible del modelo Uber for Business Vouchers es directamente que el voucher prepagado es el formato correcto para el invitado sin cuenta, y debe ser parte central de la propuesta para Perú porque resuelve un dolor exacto que ninguna app peruana hoy resuelve bien.

En **India**, dos referentes valiosos en SaaS de transporte corporativo. MoveInSync y Routematic. Aunque ambos están enfocados en transporte de empleados con turnos rotativos para el sector BPO/IT. La traducción a Perú no es directa porque el contexto operativo es muy distinto, pero el modelo de SaaS B2B sí es transferible y prueba que la categoría existe.

En **agregadores y APIs**, Mozio se ha posicionado como el "Booking.com de los traslados terrestres" para hoteles, aerolíneas y agencias. Mozio agrega cobertura global y trabaja con Hertz, Air France, TUI, Priceline, JetBlue, Booking.com, CruisePlanners, Accor y más de 5.000 agentes de viaje. Para empresas peruanas que quieran capturar parte del flujo internacional, integrar como proveedor en Mozio o equivalente puede ser tan o más valioso que su propia app.

Lo común a todos estos referentes internacionales es lo siguiente, y conviene marcarlo en negrita conceptual: **ninguno construye una app de pasajero como diferenciador**. Todos construyen software de gestión del proveedor, integración con canales B2B (hoteles, agencias, multinacionales), módulo de chofer asistido, y meet-and-greet operativo. La capa que el pasajero ve es minimalista (link, código, voucher, confirmación), no una app instalada.

---

## 9. Benchmark de soluciones internacionales para el problema concreto

Para que sea útil prácticamente, sintetizo qué hace cada referente que valga la pena mirar.

**Blacklane** opera como agregador con marca global y red de proveedores locales certificados, sin flota propia. Su valor diferencial es la consistencia: el ejecutivo que viaja a Berlín, Dubái o Lima quiere la misma experiencia. Su modelo de cobro es por servicio (no por suscripción) con tarifa fija basada en distancia, sin sorpresas. Su portal corporativo para empresas permite gestionar viajes de invitados sin necesidad de cuenta. Es premium y caro.

**Welcome Pickups** opera como capa entre hoteles y proveedores locales en cada ciudad, con foco en automatizar el traslado del huésped. Su valor es resolverle al hotel el problema operativo de transporte sin que el hotel tenga que gestionarlo. Su modelo permite al hotel ganar comisión y mantener la experiencia premium. Su pieza fuerte es la integración con PMS y channel managers.

**MoveInSync** y **Routematic** son SaaS B2B puros para gestión de transporte de empleados, especialmente para BPO/IT en India. Su valor es la optimización de rutas, gestión de flota y reporting financiero detallado. Su modelo es suscripción por cliente más, en algunos casos, comisión por viaje procesado.

**Uber for Business** ofrece la suite corporativa más completa del mundo: gestión centralizada, vouchers, factura consolidada, integración con Concur. Para Perú es contexto, no benchmark, porque su escala es inalcanzable para un proyecto local.

**Cabify Empresas** en Perú es el competidor más cercano y el más relevante para el benchmark local. Maneja más de 3.100 empresas, dashboard de control, reservas anticipadas, facturación consolidada y métricas de uso. Su gap es que sigue siendo una app de ride-hailing premium adaptada al corporativo, no un SaaS para que otros operadores construyan su propio servicio corporativo.

**Moobiz** en Perú es probablemente el competidor más alineado conceptualmente con cualquier propuesta que partamos. Es un operador peruano de remisse con catorce años, app propia, dashboards corporativos, factura consolidada. No vende su software a otros; es un operador con tecnología. Es el benchmark a vencer en producto pero no en modelo.

**Mozio** es benchmark de agregador. Si la apuesta es vender al canal turismo/hoteles internacional, integrar como proveedor en Mozio o construir una variante local sería complementario, no competitivo, con un SaaS para operadores formales peruanos.

La aplicación inmediata para nuestra propuesta es híbrida: tomar de Blacklane la disciplina del meet-and-greet con flight tracking, de Welcome Pickups la integración con hoteles cuatro y cinco estrellas, de Uber Vouchers la generación de QR/link prepagado, de MoveInSync el rigor del backend operativo, y de Cabify Empresas el dashboard corporativo con centros de costo y facturación. Ninguno de estos elementos individualmente es novedoso. Lo novedoso, si se construye, es la **integración local con SUNAT-OSE peruanos**, el **respeto a la operación del módulo aeropuerto** que es la realidad de los proveedores formales peruanos, y la **especialización vertical** que les permitirá a esos proveedores defenderse de Cabify Empresas y Uber for Business.

---

## 10. Comparativa Taxi Green, Taxi Directo, Uber, Cabify e inDrive

Sintetizo los cinco actores con la información disponible. Marco con claridad lo que sé y lo que estoy infiriendo razonablemente.

**Taxi Green / GREEN AIRPORT S.A.** opera con marca de veinticinco años, flota declarada de 350 a 400 unidades (afiliadas), counter físico en el nuevo terminal Jorge Chávez, seis verticales explícitos (aeropuerto, ejecutivo, por hora, van, eventos, city tours), call center 484-4001, WhatsApp 998267148, web operativa en PHP con OpenPay como pasarela, facturación electrónica externalizada a Tranzas/Fenbo Digital, y app en stores con estado dudoso. Su modelo es B2C aeroportuario más B2B corporativo. Su moat es la concesión LAP y la marca. Su debilidad es la capa digital.

**Taxi Directo** es la segunda empresa con counter en el aeropuerto comparable a Taxi Green. Taxi Directo Lima ha desarrollado una aplicación móvil propia que permite reservar viajes, calcular tarifas y seguir en tiempo real la ubicación de su taxi, según sus comunicaciones públicas; opera bajo dominio `directoapp.pe` y `taxidirecto2015.wixsite.com/taxi-directo` lo que sugiere infraestructura más moderna y orientada al canal app. Promueve reservas vía app con pago tarjeta para "Atención Express" y embarque en dos minutos. Comparte el mismo nicho y la misma concesión que Taxi Green. No tengo evidencia pública del volumen real ni de la satisfacción de su base.

**Uber Perú** opera con la cobertura más amplia (todos los departamentos), modelo on-demand individual con plataforma global, Uber for Business para corporativos, Uber Reserve para reservas programadas, y nuevos productos como Uber Tuk y Uber Pet en 2026. Más de 380 millones de viajes acumulados desde inicio de operaciones, presencia en todos los departamentos del Perú, y crecimiento explícito en turismo internacional. No tiene módulo físico en el aeropuerto. Su factura electrónica corporativa cumple SUNAT vía mecanismos propios. Es competencia frontal para B2C pero no para el segmento "reserva programada con factura consolidada y módulo aeropuerto".

**Cabify Perú** es el actor más sofisticado en el segmento premium y corporativo. Atiende a más de 3.100 empresas en Perú, lanza Cabify Executive en 2026 con vehículos modernos y conductores más profesionales, y reporta crecimientos del 30% trimestral en B2B. Producto sólido, marca consolidada, capital regional, dashboard corporativo competitivo. Es la principal amenaza para cualquier propuesta del segmento corporativo en Lima. No tiene counter físico en el aeropuerto.

**inDrive Perú** es el líder por volumen en ride-hailing con su modelo de negociación de tarifa. Líder en transporte urbano con presencia en 21 ciudades, cinco servicios en Perú, y ambición de ser super-app. Su corazón es B2C masivo, no corporativo. No es competencia directa para el segmento que nos interesa.

Si alineamos estos cinco actores en el segmento específico de "reserva programada corporativa o aeroportuaria con factura consolidada y meet-and-greet": Taxi Green y Taxi Directo compiten frontalmente (más Mitsoo, CMV, Taxi365); Cabify Empresas compite agresivamente desde un producto más maduro; Uber for Business compite menos visiblemente pero con capacidad global; inDrive no compite ahí. El espacio en que Taxi Green tiene ventaja defendible es el counter físico aeroportuario, no la app.

---

## 11. Brechas entre Perú y mercados desarrollados

Hay tres brechas estructurales que conviene marcar para no engañarse.

La primera brecha es **capacidad de pago corporativo**. Mientras una empresa estadounidense paga sin discutir 80 a 150 dólares por un traslado aeropuerto-Manhattan con Blacklane o GroundLink, una empresa peruana mediana negocia hasta el último sol con su proveedor de remisse. Cabify Empresas reporta crecimientos importantes pero también que el 36% de las empresas peruanas ya tiene consolidado el factor seguridad como variable bajo control, lo que sugiere que el grueso del mercado peruano no compite en seguridad-premium sino en costo y eficiencia. Esto significa que el ARPU realista de un cliente corporativo peruano es una fracción del europeo.

La segunda brecha es **fragmentación regulatoria y de canales de pago**. Donde un competidor europeo integra con Stripe, Adyen o el equivalente local nacional una vez, en Perú hay que integrar OpenPay, Niubiz, Izipay, Visa, Mastercard, Yape, Plin, y eventualmente alguna pasarela bancaria adicional según cliente. Adicionalmente hay que integrar con OSE certificado por SUNAT para facturación electrónica. La superficie de integraciones para un mismo producto es mayor en Perú que en Estados Unidos o España. Es una barrera de entrada para nuevos pero también una barrera de salida para cualquier producto ya integrado.

La tercera brecha es **cultura digital del usuario final**. Solo el 38% de los limeños usa aplicativos de taxi; el 70% sigue prefiriendo transporte público. La adopción de apps en Perú no es comparable a la europea o norteamericana. WhatsApp sigue siendo el canal rey para muchas relaciones comerciales, incluida la reserva de transporte. Una propuesta peruana que ignore WhatsApp es muy probable que falle de adopción aun siendo técnicamente excelente. Eso fue exactamente la observación de Raúl reformulada con datos.

Las brechas tienen consecuencias prácticas concretas. Significa que el ticket promedio del SaaS peruano será menor que el europeo. Significa que el modelo de cobro debe ser flexible (mensual + comisión, no solo mensual fijo). Significa que el canal WhatsApp tiene que estar en la propuesta desde el día uno, no como add-on. Significa que el "factura electrónica SUNAT consolidada" no es una feature, es un requisito de entrada al mercado.

---

## 12. Oportunidades reales de producto o negocio

Aquí están las cinco oportunidades más fuertes que la investigación independiente identifica, en orden de fuerza estratégica decreciente. Son las opciones reales sobre las que se va a tomar la decisión final.

La **oportunidad principal** es construir una **plataforma operativa B2B para empresas de transporte ejecutivo y aeroportuario**, con cinco módulos núcleo: panel del cliente corporativo (Travel Manager para configurar empleados, centros de costo, políticas), generador de QR-voucher corporativo para invitados sin cuenta, app o PWA ligera de conductor con flight tracking y meet-and-greet asistido, panel de operador del módulo aeropuerto con cola de conductores y asignación asistida, y motor de facturación electrónica SUNAT consolidada vía OSE certificado. La cobranza puede ser SaaS mensual al transportista, con plan base (USD 200-500 por mes según volumen) más comisión por viaje corporativo procesado (USD 0,20-0,50). El primer cliente sería Taxi Green; los siguientes, las otras cuatro empresas con counter LAP. El motivo de fuerza es que cubre el dolor exacto del cliente corporativo (trazabilidad, factura, compliance), no le pide al pasajero descargar nada, y respeta la operación real del módulo aeropuerto.

La **segunda oportunidad** es un **sistema de booking-engine con white-label para hoteles cuatro y cinco estrellas**, replicando lo que Welcome Pickups hace en Europa, en versión Perú. La empresa del hotel pone su marca, sus huéspedes ven un sitio embebido en el del hotel, hacen su reserva con tarifa fija prepublicada, reciben confirmación con conductor y placa, y son recibidos en el aeropuerto. El hotel gana comisión. El proveedor de transporte gana volumen. El SaaS cobra licencia por hotel o porcentaje de transacción. Esta oportunidad puede integrarse a la primera o construirse en paralelo.

La **tercera oportunidad** es un **producto de QR-Voucher corporativo standalone** que se le venda directamente a empresas multinacionales con sede en Lima (las Fortune 1000 con operación en Perú) y que sirva como capa de gestión sobre cualquier proveedor de transporte, no solo Taxi Green. La empresa genera un voucher prepagado, el invitado lo presenta a Taxi Green, Mitsoo, CMV o quien sea, y la factura se consolida desde el SaaS. Es una idea más cercana a la del reporte estratégico previo y tiene mucho potencial regional pero compite directamente con Uber for Business Vouchers. Sostengo que es **menos prudente como primer paso** porque pide construir un mercado de dos lados (proveedores de transporte que acepten el voucher + empresas que lo paguen) al mismo tiempo.

La **cuarta oportunidad** es un **bot de WhatsApp Business profesional para reservas**, integrado con el backend de Taxi Green y de sus pares, que tome la solicitud por chat (con cualquier ChatGPT-class LLM para entender lenguaje natural), confirme la reserva, devuelva un código y eventualmente cobre. Es una entrada de bajo costo y alta adopción dado el patrón peruano de uso de WhatsApp. Su debilidad es que es difícil de monetizar standalone; mejor como parte de la oportunidad principal.

La **quinta oportunidad** es un **panel de despacho asistido por IA** que reciba pedidos de varios canales (web, WhatsApp, app, voz), los normalice, los asigne sugiriendo conductor óptimo al despachador humano, y emita los reportes. Esta es básicamente la pieza interna del módulo aeropuerto del flujo principal. Funciona como tercer producto vendible si la oportunidad principal genera tracción.

Hay tres oportunidades **descartables** que el expediente menciona y que la investigación independiente concluye son débiles. La primera es construir una app móvil para pasajeros estilo "Uber para Taxi Green" como producto principal: investigué y no se justifica con la información disponible (sección 15 explica por qué). La segunda es modernizar quirúrgicamente el sistema PHP actual y nada más, sin construir capa nueva: deja a Taxi Green en la misma posición competitiva y no abre la puerta a SaaS. La tercera es construir el SaaS de marca blanca desde el día uno sin un cliente ancla: alto riesgo de construir algo que nadie quiere pagar.

---

## 13. Matriz de soluciones posibles

Aquí evalúo nueve modelos de solución contra ocho criterios. Es la sección con más estructura tabular del informe, porque el formato matricial está pedido explícitamente en el alcance.

| Modelo | Valor cliente | Valor empresa | Dificultad técnica | Costo desarrollo | Adopción | Diferenciación | Velocidad demo | Potencial escalar |
|---|---|---|---|---|---|---|---|---|
| 1. App móvil pasajero estilo Uber | Bajo (ya tienen Uber/Cabify) | Bajo (lucha frontal perdida) | Media | Alto | Lenta | Nula | Media | Bajo |
| 2. Web app de reserva sin instalación | Medio (turistas internacionales) | Medio (mejora canal digital) | Baja | Bajo | Rápida | Baja | Rápida | Medio |
| 3. WhatsApp automatizado con bot | Alto (alineado con cultura) | Alto (mejora canal real) | Media | Medio | Muy rápida | Media | Rápida | Medio |
| 4. Panel interno para central | Indirecto | Muy alto (ordena operación) | Media | Medio | Media | Media (interna) | Lenta | Alto |
| 5. App o PWA de conductor | Indirecto | Alto (trazabilidad) | Media | Medio | Compleja (adopción driver) | Media | Media | Alto |
| 6. Plataforma para hoteles | Alto (mercado capturable) | Alto (canal estable) | Media | Medio | Media | Alta | Media | Muy alto |
| 7. Portal corporativo B2B con QR-Voucher | Muy alto (dolor real) | Muy alto (defiende corp) | Media-alta | Medio-alto | Media | Muy alta | Media | Muy alto |
| 8. SaaS multiempresa de marca blanca | Variable | Muy alto (línea ingresos) | Alta | Alto | Lenta sin cliente cero | Alta | Lenta | Muy alto |
| 9. Desarrollo a medida solo para Taxi Green | Limitado | Alto (resuelve cliente) | Media | Medio-alto | Garantizada (un cliente) | Baja (no reusable) | Media | Bajo (no escala) |

Tres lecturas de esta matriz son útiles.

Primera, el modelo número 7 (portal corporativo B2B con QR-Voucher) es el que tiene la mejor combinación de valor, diferenciación y potencial. Es el núcleo de la recomendación principal.

Segunda, los modelos 3, 4 y 5 son **piezas** del modelo 7 más que alternativas a él. Una propuesta completa los integra. Esto es lo que distingue una "solución" de una "feature": la solución correcta combina varios modelos en un producto coherente.

Tercera, el modelo 8 (SaaS multiempresa) es el destino, no el punto de partida. Llegar a SaaS sin haber resuelto el "cliente cero" (Taxi Green u otro operador concreto) es la trampa más común y el reporte estratégico previo del expediente tiene razón en que es viable a medio plazo pero subestima la dificultad de hacerlo de entrada.

---

## 14. Recomendación preliminar sobre qué solución tiene más sentido

Después de cruzar todo lo anterior, mi recomendación honesta es la siguiente. Construir una **plataforma operativa B2B para empresas de transporte ejecutivo y aeroportuario peruano**, con Taxi Green como cliente cero, diseñada desde el día uno con arquitectura multitenant y separación clara entre "core de operador" y "marca de operador", para que en doce a dieciocho meses pueda venderse como SaaS de marca blanca a las demás empresas formales del sector.

Los cinco módulos centrales del producto, en orden de implementación, son los siguientes. El **panel del módulo aeropuerto** es el corazón operativo: gestiona la cola de conductores, recibe reservas previas y walk-in, asiste al operador en la asignación, presenta visualmente al conductor asignado y registra el cierre. El **generador de QR-Voucher corporativo** crea vouchers prepagados con ruta, valor y fecha que la empresa cliente envía a sus invitados por correo o WhatsApp, sin necesidad de cuenta. La **app o PWA de conductor** muestra próximo servicio, ruta, datos del pasajero, escanea QR, abre y cierra el servicio, comparte ubicación con la central y registra GPS para evidencia. El **panel del cliente corporativo** permite al Travel Manager dar de alta empleados, fijar centros de costo, generar vouchers, ver historial y descargar reportes y la factura mensual. El **motor de facturación electrónica SUNAT consolidada** se integra con un OSE certificado (Nubefact, Sovos, Efact, Greenter o el mismo Fenbo Digital que ya usa Taxi Green) y consolida los servicios del mes en factura única con detalle por viaje y por centro de costo.

El canal **WhatsApp** se cubre desde el día uno con un bot básico que tome reserva, devuelva código y se conecte al backend. No es app móvil de pasajero. Es el canal que ya usan los pasajeros peruanos.

La capa de **pasajero web** es un sitio responsive minimalista (no app instalable) que el pasajero usa para ver el estado de su reserva, confirmar identidad con un tap o un QR en el meet-and-greet, ver datos del conductor y calificar el servicio al final.

El stack técnico recomendado es deliberadamente conservador y trabajado para que un equipo pequeño (entre uno y tres desarrolladores incluyendo tú) lo pueda construir. Backend en Laravel 12 con PHP (que es lenguaje familiar al ecosistema peruano, compatible con Greenter para SUNAT, fácil de contratar para mantenimiento) sobre PostgreSQL o MySQL. Frontend de paneles en Vue/Nuxt o React/Next.js. Pasajero y conductor en PWA con Vue/Nuxt o React Native con Expo (un solo equipo iOS+Android). Mapas inicialmente con OpenStreetMap más Leaflet (gratis, ya lo usa Taxi Green) y se migra a Google Maps Platform o Mapbox cuando se justifique. QR con librería estándar (Endroid QR Code o equivalente) firmado con HMAC server-side. Pasarela de pago empezando con OpenPay (ya integrado) más Yape/Plin. Facturación electrónica integrada con Nubefact (rápido de implementar) y como fallback el propio Fenbo Digital que Taxi Green ya tiene contratado. Hosting en DigitalOcean, Railway o AWS Lightsail con presupuesto inicial bajo (50 a 100 USD mensuales).

Esta recomendación se diferencia explícitamente de la propuesta de Raúl en la transcripción en tres puntos que conviene negociar con él directamente. Primero, la base de datos no es MongoDB sino relacional, porque la naturaleza del dominio (reservas, conductores, vehículos, viajes, pagos, comprobantes, centros de costo, empresas, empleados) es esencialmente relacional con muchas relaciones uno-a-muchos y muchos-a-muchos. MongoDB no aporta ventaja aquí y sí complica la consistencia transaccional crítica para una operación con dinero de por medio. Segundo, la arquitectura de inicio no requiere "front en Google Cloud, back en Azure y DB en Mongo Cloud": eso es over-engineering de demo y de MVP. Un solo proveedor cloud con servicios separados pero gestionados consistentemente sirve. Tercero, la prioridad para la demo no es replicar Uber sino mostrar exactamente lo que diferencia el producto: el panel del módulo aeropuerto y el QR-Voucher corporativo, no la app de pasajero.

Esta recomendación se alinea con la propuesta del reporte estratégico previo (`primeras_ideas.pdf`) en lo conceptual pero **difiere en el orden táctico**: el reporte previo sugiere empezar con SaaS de marca blanca, esta propuesta sugiere empezar con cliente cero y diseñar para SaaS desde el primer día. La diferencia importa porque vender SaaS a transportistas peruanos requiere tener un caso real con métricas reales que mostrar; sin eso, todo es promesa.

---

## 15. Qué propuesta sería débil, riesgosa o prematura

Tres propuestas concretas merecen ser marcadas como evitables. La primera y más peligrosa, ya señalada en el resumen ejecutivo, es presentarle a Taxi Green un "Uber clon" como solución. Esto incluye cualquier variante con app móvil de pasajero como pieza central, marketplace de subastas entre conductores estilo inDrive, o algoritmo de matching geográfico que ignore la cola operativa real del módulo aeropuerto. Esta propuesta perdería ante los rivales con miles de millones de capital, no resolvería el dolor corporativo, y le restaría a Taxi Green su único moat defendible que es la concesión LAP. La transcripción de Raúl describe parcialmente este enfoque y conviene tener una conversación franca con él al respecto antes del compromiso.

La segunda propuesta riesgosa es construir un SaaS de marca blanca multiempresa desde el día uno, sin un cliente ancla que pague. Esta ruta tiene mérito conceptual y es la conclusión del reporte estratégico previo del expediente, pero subestima la dificultad de validar simultáneamente la propuesta de valor y la disposición a pagar de las cinco a diez empresas formales peruanas de remisse. La razón por la que estas empresas no tienen ya un SaaS bueno no es solo que nadie se lo haya ofrecido. Es que sus márgenes son ajustados, sus dueños son operativos, y su prioridad nunca ha sido invertir en software. Vender SaaS a este perfil requiere ROI cuantificable demostrable, y eso solo se demuestra con un primer cliente que ya esté usando el producto y mostrando métricas.

La tercera propuesta riesgosa es comprometerse con una "modernización quirúrgica del sistema actual de Taxi Green" sin un objetivo claro de producto. Esto es lo que hace un dev shop: refactoriza el PHP, le agrega una capa de API, le mejora el frontend, factura por horas, y deja a Taxi Green exactamente en la misma posición competitiva que estaba, sin diferenciación frente a sus pares y sin capacidad de defensa frente a Cabify Empresas que sigue creciendo a 30% trimestral en B2B. Es una decisión que premia el corto plazo (ingreso de proyecto) y castiga el largo plazo (cero opción real de SaaS, cero relación de socio estratégico con el cliente).

A esto se agrega una cuarta señal de alerta sobre **Qorinti**. Si el equipo tiene equity o derechos sobre el producto Qorinti que aparece en el expediente, hay que considerar explícitamente si la propuesta para Taxi Green podría aprovechar partes de ese sistema. Qorinti está construido con Flutter+Firebase, modelo marketplace multivertical con contraoferta entre conductores. La tentación de "reusar Qorinti rebrandeado para Taxi Green" tiene problemas serios: la arquitectura Firebase no escala bien para el modelo B2B corporativo que Taxi Green necesita, el modelo de contraoferta de Qorinti contradice frontalmente el modelo de cola operativa de Taxi Green (lo que Raúl describió como "no es así, es por cola"), y el branding cruzado podría confundir clientes. **Si Qorinti es del equipo, conviene mantenerlo como producto separado para su mercado natural (transporte general no-aeroportuario, carga, mudanza) y construir un producto nuevo para Taxi Green y el segmento corporativo aeroportuario.** No reutilizar por reutilizar.

---

## 16. Qué información falta validar con Taxi Green

Hay nueve grupos de información que el expediente no permite validar y que son críticos antes de cualquier compromiso de alcance o precio.

Sobre el negocio, falta saber la mezcla real de canales de reserva (qué porcentaje viene de web, qué de WhatsApp, qué de call center, qué del counter), la proporción real B2C versus B2B en sus ingresos, los cinco clientes corporativos más importantes y qué tarifas tienen, la tasa real de pérdida de viajes y por qué se pierden, si tienen objetivos cuantificados de penetración digital, y a qué competidores temen específicamente.

Sobre el producto, falta saber qué quieren hacer con la app móvil actual (¿resucitar, rehacer, abandonar?), si quieren cubrir desde la primera versión todos los seis verticales o solo aeropuerto, si exigen inglés desde la primera versión dada su clientela internacional, y si en su visión el conductor entra al producto en la versión uno o se queda para una segunda fase.

Sobre tarifas y reglas, falta saber si la tarifa actual es plana por zona o calculada (con qué fórmula), qué descuentos y promociones manejan, cómo facturan hoy a corporativos (por viaje, quincenal, mensual), y cómo cobran modificaciones, cancelaciones y no-shows.

Sobre operaciones, falta saber cómo se entera el conductor del próximo servicio (¿WhatsApp grupal, llamada, radio, sistema interno?), si los conductores tienen smartphone y plan de datos, cuántos conductores activos hay, cuántos hablan inglés (relevante para turismo), y si tienen sistema de turnos o disponibilidad.

Sobre tecnología, falta saber si tienen documentación del backend actual, si hay acceso a la base de datos, quién es el proveedor de hosting y mantenimiento actuales, quién es dueño de las cuentas Apple Developer y Google Play Console (y si las credenciales siguen activas), si tienen contratos vigentes con OpenPay, Niubiz y Tranzas/Fenbo, si tienen Maps API key de Google o quieren quedarse en OpenStreetMap, y si tienen política de protección de datos acorde a la Ley 29733.

Sobre presupuesto y plazos, falta saber el rango presupuestal de referencia que manejan, si hay fecha objetivo crítica (evento, temporada alta, fin de año), y si prefieren contratar por fases con entregables o llave en mano.

Sobre el modelo de negocio para el SaaS futuro, falta saber si están abiertos a que Taxi Green sea "cliente cero" formal de una plataforma que después se le venderá a otros operadores (incluyendo competidores directos suyos), o si exigen exclusividad o desarrollo a medida no replicable.

Sobre roles internos, falta confirmar quién es el sponsor del proyecto dentro de Taxi Green, quién toma la decisión final de compra, y quién será el usuario funcional principal con quien se va a iterar el producto.

Finalmente sobre los conductores, falta validar si son empleados, afiliados con contrato o terceros independientes, qué resistencia previsible tendrían al cambio operativo, y cómo se les remunera hoy.

Esta lista es la agenda mínima de la primera reunión de discovery.

---

## 17. Preguntas clave para la primera reunión con el cliente

Convierto la sección 16 en una agenda concreta de reunión, en orden de prioridad y con redacción amigable. Son las treinta preguntas que mueven el cierre del proyecto.

**Sobre la operación real.** ¿Cómo nos describirían un día típico en su operación, desde que el sol sale hasta que se acuesta? ¿Cuántas reservas reciben en un día normal y cuántas en un viernes de temporada alta? ¿Qué porcentaje de su negocio es B2C aeroportuario individual y qué porcentaje es corporativo con cuenta crédito? ¿Quiénes son sus cinco clientes corporativos más grandes hoy y cómo los atienden?

**Sobre el momento del aeropuerto.** ¿Cuántas personas trabajan en el módulo en hora pico? ¿Cómo asignan al conductor cuando llega un walk-in? ¿Cómo cambió la operación del módulo con el nuevo terminal desde junio de 2025? ¿Qué les preocupa más operativamente: el tiempo de espera del pasajero, la coordinación con el conductor, los reclamos posteriores, o algo más?

**Sobre el conductor.** ¿Sus conductores son afiliados, empleados o mixto? ¿Tienen ya algún sistema interno o WhatsApp grupal para asignarles servicios? ¿Tienen smartphones todos? ¿Cuántos hablan inglés conversacional? ¿Cuánta resistencia previsible habría a usar una app o PWA nueva?

**Sobre el cliente corporativo.** ¿Cómo les llega hoy una reserva corporativa? ¿Quién aprueba los servicios en la empresa cliente? ¿Cuánto tarda en promedio el ciclo de cobro? ¿Qué tan importante es para sus clientes corporativos hoy tener factura electrónica consolidada con detalle por centro de costo?

**Sobre la app y el sistema actual.** ¿Existe hoy una app de Taxi Green en producción? Si sí, ¿quién la mantiene y bajo qué cuenta está? Si no, ¿qué pasó con el intento anterior? ¿Tienen acceso al código del sistema web actual o quien lo mantiene es un tercero?

**Sobre el alcance.** ¿Si tuvieran un sistema digital nuevo en producción dentro de cuatro meses, qué pieza les daría más alivio operativo? ¿Cuál es el dolor que les quita el sueño hoy? ¿Si pudieran tener solo una cosa nueva, qué sería?

**Sobre el modelo de propuesta.** ¿Están abiertos a que el producto que construyamos para ustedes pueda eventualmente venderse a otras empresas de su rubro, o necesitan exclusividad sobre lo que se construya? ¿Cómo se sienten con un modelo de socio en producto (en lugar de proveedor de desarrollo)?

**Sobre presupuesto y plazo.** ¿Tienen un rango presupuestal de referencia o quieren que la propuesta lo defina? ¿Hay alguna fecha crítica que no podamos pasar? ¿Prefieren un proyecto cerrado o un modelo iterativo con entregables progresivos?

**Sobre temas legales y de datos.** ¿Cómo manejan hoy la protección de datos personales de pasajeros (Ley 29733)? ¿Quién es responsable de su libro de reclamaciones? ¿Tienen política formal de manejo de quejas y reclamos?

**Sobre liquidación a conductores.** ¿Cómo funciona hoy el flujo de cobro a conductor (descuento de comisión, pago a fin de mes, mixto)? ¿Es algo que les interesa optimizar o lo dejan tal cual?

**Pregunta clave de cierre.** Si en este proyecto les ofreciéramos una herramienta digital que les permita capturar a uno o dos clientes corporativos nuevos cada trimestre que hoy se los lleva Cabify Empresas, ¿qué valor tendría para ustedes en términos económicos anuales?

Esta última pregunta es la única que les exige a ellos pensar en ROI cuantificable, que es exactamente el lenguaje en que hay que cerrar la venta.

---

## 18. Qué demo conviene preparar

Aquí cambio el ángulo del archivo del expediente que sugería una demo tipo Uber con muchas pantallas. Propongo otra cosa.

La demo no debe parecer una app de pasajero. La demo debe parecer **el panel que el operador del módulo aeropuerto querría tener mañana**. Es decir, la pantalla principal de la demo no es un mapa con un autito moviéndose, sino el panel operativo que muestra cola de conductores en vivo, lista de reservas próximas con su nombre y vuelo, lista de pasajeros walk-in pendientes de asignar, y un módulo de QR-Voucher corporativo que el operador puede consultar.

El guion de la demo, en doce minutos, podría ser el siguiente. Empieza con una pantalla del panel del módulo aeropuerto en el nuevo terminal, mostrando la cola de seis conductores en tiempo real con su tipo de unidad, ubicación dentro o cerca del aeropuerto, y disponibilidad. Aparece una notificación de "Pasajero aterrizando: María González, vuelo LA2055 desde Bogotá, reserva confirmada por empresa MultiTech S.A.C., voucher prepagado, destino Hotel Country Club". El operador del módulo confirma y el sistema sugiere el próximo conductor en cola; el operador acepta. El conductor recibe la asignación en su PWA con todos los datos, incluido el QR del voucher de María. María, mientras tanto, recibió ayer por correo (o WhatsApp) el voucher con un QR y los datos del conductor y vehículo. Al llegar al meet-and-greet, María muestra su QR al conductor; el conductor lo escanea y "abre" el viaje. La pantalla del operador muestra que el servicio inició. El conductor lleva a María. Al llegar al hotel, escanea nuevamente el QR (o cierra manualmente) y el viaje se cierra. La factura se genera automáticamente al final del mes consolidada con los demás viajes de MultiTech, con detalle por colaborador y centro de costo. La administradora de viajes en MultiTech ve en su panel ese viaje en el dashboard mensual.

Tres pantallas adicionales completan la demo. El **panel del cliente corporativo** mostrando viajes del mes, gasto acumulado, top destinos, centros de costo y descarga de factura. La **vista del pasajero web** (sin instalación) mostrando datos del conductor, foto, placa, y botón de "Llamar al conductor" y "Compartir mi viaje". El **bot de WhatsApp** con una conversación simulada donde un pasajero ocasional pide su taxi al aeropuerto y recibe confirmación por chat.

Lo importante de la demo, lo que la distingue, es que el centro emocional de las pantallas no es "una app que pide un Uber" sino "una operación de remisse premium digitalizada". Eso es lo que Taxi Green va a reconocer como suyo. Eso es lo que les vende.

Sobre los recursos para construir la demo, no se requiere backend real ni integraciones reales. La mayoría se simula con datos mockeados (JSON local). Pero **el mapa, el cálculo de distancia y el cálculo de ETA sí deben funcionar de verdad**, como pidió Raúl con razón, porque es la única parte que se va a sentir real. El uso recomendado es Flutter o React Native con datos mockeados, Google Maps SDK para el mapa funcional (key gratis del trial), animaciones limpias en transiciones, y una demo idealmente corrida en un dispositivo físico de buena calidad o emulador iPhone bien presentado.

Como soporte de la demo conviene preparar también un mockup de Figma de alta fidelidad con los flujos completos (los que se muestran y los que no), un deck de doce a quince diapositivas que cubra el porqué, el qué, el cómo y el cuándo, una lista de KPIs medibles que el producto va a mover (porcentaje de reservas por canal digital, NPS post-viaje, tiempo medio de asignación, porcentaje de clientes corporativos recurrentes, ticket promedio corporativo, conversión web a reserva), y un mini-estimado de costos por fases.

---

## 19. Roadmap preliminar

Propongo el siguiente roadmap conservador, en cuatro fases acumulativas. Las duraciones son orientativas y dependen del tamaño del equipo (asumo entre uno y tres desarrolladores incluyendo a quien lidera el proyecto).

**Fase 0: Demo y descubrimiento (siete a catorce días).** Construir la demo descrita en la sección 18, completar la primera reunión de discovery con las preguntas de la sección 17, definir conjuntamente el alcance de la fase 1, y firmar un acuerdo marco de cooperación o un contrato de desarrollo por fases con entregables. Esta fase es preventa. La inversión es tiempo, no dinero.

**Fase 1: MVP cliente cero (ocho a doce semanas).** Construir el panel del módulo aeropuerto, el generador de QR-Voucher corporativo básico, la PWA de conductor con lo esencial (asignación, datos del pasajero, abrir y cerrar servicio, escaneo QR), el panel corporativo del cliente final con configuración mínima (empresa, empleados, centros de costo, generación de vouchers), y el motor de facturación electrónica vía OSE certificado. Lanzar con un único cliente cero (Taxi Green) en producción, con métricas medidas desde día uno. El presupuesto orientativo es 15.000 a 25.000 USD en costos directos de desarrollo (más coste de infraestructura inicial y licencias OSE).

**Fase 2: Refinamiento y extensión (ocho a doce semanas adicionales).** Sobre lo construido, añadir el bot de WhatsApp profesional, la vista web del pasajero sin instalación, integración con dos hoteles cinco estrellas piloto, módulo de reportes corporativos avanzado, y el primer caso de migración del servicio walk-in del módulo a la plataforma (no solo reservas previas). El objetivo de esta fase es alcanzar 1.000 viajes mensuales procesados por la plataforma, lo que valida tracción.

**Fase 3: Primer SaaS de marca blanca (diez a dieciséis semanas adicionales).** Refactorizar la plataforma con la separación multitenant ya implícita en el diseño, empaquetar como producto vendible (documentación de onboarding, contrato modelo, pricing definido, soporte estándar), y vender a un segundo operador peruano (Taxi365, Mitsoo, CMV, Taxi Directo, o cualquiera de las empresas medianas). Esta fase es la que convierte el proyecto en negocio recurrente. El objetivo es entre dos y cuatro clientes pagantes para fin del primer año, y entre cinco y ocho para el segundo año.

**Fase 4: Expansión regional (segundo año en adelante).** Replicar en Arequipa, Trujillo y Cusco como ciudades secundarias del Perú, e iniciar contacto con empresas similares en Bogotá, Quito y Santiago. Para entonces, el moat construido es la integración local con SUNAT más la operación específica del módulo aeropuerto, que es difícil de replicar en lo regulatorio aunque no en lo tecnológico. La presencia regional permite eventualmente competir con Cabify Empresas en su propio terreno o ser target de adquisición estratégica.

Cada fase tiene una puerta clara de decisión Go/No-Go. Al final de la fase 0, si Taxi Green no firma o si las preguntas de la sección 17 revelan vacíos críticos, se reconsidera el cliente cero o se cambia de estrategia. Al final de la fase 1, si la operación de Taxi Green no muestra mejora medible (reducción de tiempo de asignación, aumento de % de reservas por canal digital, factura corporativa sin reclamos), se pivota. Al final de la fase 2, si no hay tracción suficiente para sustentar el caso de venta a un segundo operador, se replantea la estrategia SaaS y se considera optimizar la relación con Taxi Green como ingreso principal.

---

## 20. Conclusión estratégica

La pregunta correcta no es "¿cómo hacemos una app para Taxi Green?". La pregunta correcta es "¿cómo construimos algo que resuelva el problema real del transporte corporativo programado en Perú y que pueda escalar más allá de un cliente?". Esa pregunta tiene una respuesta que cruza la evidencia interna del expediente y la evidencia externa de la investigación independiente.

La respuesta es construir, con Taxi Green como cliente cero y socio estratégico, una plataforma operativa B2B que digitalice tres piezas que ninguna app masiva resuelve bien: la operación del módulo aeropuerto, el QR-Voucher corporativo para invitados sin cuenta, y la facturación electrónica SUNAT consolidada con trazabilidad por centro de costo. Esa plataforma se diseña multitenant desde el día uno, lo que permite convertirla en SaaS de marca blanca en doce a dieciocho meses, con métricas reales y un caso real.

Esta recomendación honra dos restricciones simultáneamente. Honra el compromiso comercial concreto que se está intentando ganar con Taxi Green (una demo tangible, un primer proyecto pagado, un cliente que aporta volumen, marca y validación). Y honra el horizonte estratégico más ambicioso que el equipo claramente está considerando (un SaaS vendible regionalmente).

El error más peligroso que debe evitarse, lo repito porque conviene anclarlo, es presentar a Taxi Green un "Uber clon" como propuesta. Es lo que cualquier dev shop sugeriría. Pierde frente a los competidores con miles de millones de capital, no resuelve el dolor real del cliente corporativo, y desperdicia el moat real de Taxi Green que es la concesión LAP. La transcripción de Raúl arrastra algo de ese enfoque y conviene tener una conversación franca con él sobre por qué la dirección debe ajustarse.

El segundo error de magnitud equivalente es construir un SaaS multiempresa de marca blanca sin tener un primer cliente operando en producción. Es vender una catedral antes de tener un ladrillo.

El tercer error, menos visible pero también costoso, es intentar reutilizar artefactos de Qorinti (si los hay disponibles) sin evaluar si su arquitectura y modelo de negocio realmente sirven para el caso Taxi Green. Si Qorinti es un activo del equipo, mantenerlo como producto separado para su mercado natural y construir nuevo para Taxi Green es probablemente lo correcto.

La pregunta que sigue, la que debes contestar tú, no esta investigación, es si tienes el apetito y el horizonte para tomar este camino largo de socio estratégico de Taxi Green con visión de SaaS regional, o si prefieres el camino corto de desarrollo a medida con cobro por hora. Ambos son legítimos. Solo el primero construye algo defensible en el tiempo. El segundo paga las cuentas el próximo mes pero deja a Taxi Green exactamente donde está hoy y a ti exactamente donde estás hoy.

Una última nota personal de cierre. Toda esta investigación se hizo cruzando varios documentos del expediente que recomiendan caminos distintos. He intentado integrar lo mejor de cada uno sin forzar la conclusión hacia ninguna predefinida. La síntesis que entrego difiere ligeramente del reporte estratégico previo del expediente (que recomienda partir con SaaS de marca blanca directamente) y difiere bastante del archivo `taxi_green_principal.md` (que pone la app móvil como pieza central). La diferencia clave es el orden: cliente cero antes que SaaS, plataforma operativa antes que app, módulo aeropuerto antes que app móvil de pasajero. Ese orden tiene una virtud que ninguna otra ruta tiene: respeta a la vez la realidad del negocio concreto, la realidad del bolsillo y del equipo, y la ambición de construir algo que importe regionalmente.

---

## Anexo: ruta crítica para los próximos quince días

Como sé que esto es un informe largo y que la siguiente acción es tangible, agrego una hoja de ruta para los próximos quince días.

En los días uno a tres, programar la reunión de descubrimiento con Raúl y su contacto en Taxi Green, llevando preparada la agenda de la sección 17. En los días tres a cinco, tener una conversación franca con Raúl sobre los tres puntos donde la recomendación difiere de su planteamiento original (MongoDB versus relacional, una nube versus tres, app de pasajero versus panel operativo como pieza central de la demo). En los días cinco a diez, construir la demo descrita en la sección 18 con datos mockeados pero mapa y cálculo de distancia reales. En los días diez a doce, preparar el deck de doce a quince diapositivas y el documento de propuesta por fases. En los días doce a catorce, ensayar la demo con Raúl y cerrar la lista de cosas a presentar. En el día quince, presentar a Taxi Green.

Si en algún punto entre los días cero y quince surge evidencia que contradiga las recomendaciones de este informe (por ejemplo, que Taxi Green ya cerró un acuerdo con otro proveedor, o que su prioridad real es retirar la operación del aeropuerto, o cualquier otro hecho sustantivo), conviene revisar la recomendación antes de seguir. Las recomendaciones son siempre provisionales sobre los hechos disponibles, y los hechos disponibles cambian.

---

*Fin del informe. Toda afirmación marcada como inferencia o hipótesis debe revisarse en la primera reunión con el cliente antes de comprometer alcance, plazo o precio. Las fuentes externas citadas a lo largo del informe corresponden a búsquedas web realizadas en mayo de 2026 y deben revalidarse antes de publicar materiales comerciales basados en ellas.*

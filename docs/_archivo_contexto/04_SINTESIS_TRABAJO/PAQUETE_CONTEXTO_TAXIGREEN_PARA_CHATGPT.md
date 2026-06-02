# Paquete de contexto Taxi Green para ChatGPT

**Fecha de consolidacion:** 2026-05-21  
**Proposito:** entregar un paquete neutral, ordenado y util para que otra IA genere una vision independiente.  
**Regla de lectura aplicada:** la evidencia real pesa mas que las investigaciones de IA, las propuestas previas y las referencias externas.

Este documento **no es una vision final**, **no decide solucion**, **no aprueba ninguna demo** y **no convierte propuestas anteriores en verdad**. Su funcion es separar evidencia, inferencias, hipotesis, contradicciones y preguntas pendientes.

---

## 1. Mapa de archivos revisados

### 1.1 Raiz del repositorio

| Archivo | Estado | Uso en esta sintesis |
|---|---:|---|
| `AGENTS.md` | Revisado | Instrucciones de trabajo del repo: analisis neutral, no asumir solucion, etiquetar evidencia. |
| `CLAUDE.md` | Revisado | Contiene memoria/contexto de trabajos previos y reglas de analisis; se trata como contexto del proceso, no como evidencia de Taxi Green. |

### 1.2 `00_EVIDENCIA_REAL`

| Archivo | Tipo | Peso epistemico | Uso |
|---|---|---:|---|
| `00_EVIDENCIA_REAL/reuniones/transcripcion_demo.txt` | Transcripcion literal | Muy alto | Voz mas directa de Raúl/Jose. Define expectativas iniciales de demo, flujos, actores, GPS real, pagos/facturacion simulados y preferencias tecnicas iniciales. |
| `00_EVIDENCIA_REAL/reuniones/PROBLEMA_ordenado_Taxi_Green.md` | Transcripcion ordenada + interpretacion | Alto, con cautela | Ordena la conversacion y agrega interpretacion sobre modulo aeropuerto, cola, WhatsApp/web y app no obligatoria. |
| `00_EVIDENCIA_REAL/taxigreen/taxi_green_principal.md` | Inspeccion publica del sitio | Alto | Mapea sistema actual `/green/`, stack visible, metodos de pago, facturacion, terminos, canales y problemas de UX. |
| `00_EVIDENCIA_REAL/taxigreen/taxi_green_secundario.md` | Segundo analisis del sitio | Alto/medio | Refuerza lectura de sistema, roles, oportunidades app/SaaS, flujos y riesgos; contiene recomendaciones, por tanto no es evidencia pura. |
| `00_EVIDENCIA_REAL/taxigreen/primeras_ideas.pdf` | Reporte estrategico PDF | Medio | Mezcla investigacion de mercado con propuesta SaaS `FleetVoucher`; se usa como hipotesis/propuesta, no como hecho cerrado. |
| `00_EVIDENCIA_REAL/referencias_qorinti/Reporte_Contexto_Qorinti.pdf` | Referencia de otro proyecto | Bajo para Taxi Green | Aporta patrones de producto: conductor, vehiculo, empresa, aprobaciones, servicios, pagos, reportes. No prueba nada sobre Taxi Green. |
| `00_EVIDENCIA_REAL/referencias_qorinti/Reporte_Tecnico_Qorinti.pdf` | Referencia tecnica de otro proyecto | Bajo para Taxi Green | Aporta patrones de interfaz y stack Qorinti: Flutter, Firebase, Google Maps, admin, comisiones. No debe trasladarse literalmente. |

### 1.3 `01_INVESTIGACIONES_IA`

| Archivo | Tipo | Uso |
|---|---|---|
| `01_INVESTIGACIONES_IA/chatgpt/deep-research-report.md` | Sintesis IA con citas externas | Analisis auxiliar; identifica capas de evidencia, oportunidades y cautelas. No es autoridad. |
| `01_INVESTIGACIONES_IA/claude/Investigacion_Estrategica_Taxi_Aeropuerto_Lima.md` | Investigacion IA extensa | Analisis auxiliar; propone plataforma B2B con Taxi Green como cliente cero. Debe leerse como hipotesis razonada. |
| `01_INVESTIGACIONES_IA/gemini/Investigacion_Innovacion_Transporte_Aeropuerto_Lima.pdf` | Investigacion IA PDF | Marco externo sobre aeropuerto, regulacion, actores, benchmarks y oportunidades. Varias cifras requieren revalidacion. |

### 1.4 `02_PROPUESTAS_PREVIAS`

| Archivo | Tipo | Uso |
|---|---|---|
| `02_PROPUESTAS_PREVIAS/PROPUESTA_DEMO.md` | Propuesta maestra de demo | Historial de pensamiento: app multirol + panel + QR + GPS + pago/facturacion simulados. No decision. |
| `02_PROPUESTAS_PREVIAS/DEMO_COMERCIAL_TAXI_GREEN_MASTERPLAN.md` | Masterplan comercial/tecnico | Historial de pensamiento: `Taxi Green Control Tower`, PWA, flujo aeropuerto, corporativo light. No decision. |
| `02_PROPUESTAS_PREVIAS/PLAN_DE_SOFTWARE.md` | Plan tecnico detallado | Historial tecnico: Postgres/PostGIS, monolito modular, REST/WS, QR, sprints. No decision. |
| `02_PROPUESTAS_PREVIAS/PROBLEMA_ordenado_Taxi_Green.md` | Duplicado exacto de `00_EVIDENCIA_REAL/reuniones/PROBLEMA_ordenado_Taxi_Green.md` | Revisado por checksum; mismo contenido. |

### 1.5 `03_REFERENCIAS_EXTERNAS`

| Archivo | Tipo | Uso |
|---|---|---|
| `03_REFERENCIAS_EXTERNAS/vision_final_warem.md` | Vision de otro dominio | Inspiracion conceptual: simplicidad, copiloto, humano en control, nada irreversible sin humano. No dominio Taxi Green. |
| `03_REFERENCIAS_EXTERNAS/WAREM_Plan_Software_Consolidado.md` | Plan tecnico de otro dominio | Inspiracion arquitectonica: monolito modular, adapters, auditoria, autonomia supervisada. No dominio Taxi Green. |

### 1.6 `04_SINTESIS_TRABAJO`

| Archivo | Estado | Uso |
|---|---:|---|
| `vision_chatgpt.md` | Vacio | Sin contenido. |
| `vision_claude.md` | Vacio | Sin contenido. |
| `vision_gemini.md` | Vacio | Sin contenido. |
| `matriz_comparativa.md` | Vacio | Sin contenido. |
| `decisiones_producto.md` | Vacio | Sin contenido. |

### 1.7 `05_FINAL`

| Archivo | Estado | Uso |
|---|---:|---|
| `05_FINAL/vision_final_taxigreen.md` | Revisado | Sintesis previa neutral. Se toma como insumo de contraste, no como decision final. |
| `demo_final_taxigreen.md` | Vacio | Sin contenido. |
| `pitch_reunion.md` | Vacio | Sin contenido. |
| `preguntas_para_cliente.md` | Vacio | Sin contenido. |
| `roadmap_validacion.md` | Vacio | Sin contenido. |

---

## 2. Resumen de evidencia real

### 2.1 Dicho en reunion

- Raúl planteó una demo centrada en el **ciclo completo de reserva**, no en toda la casuistica del negocio.
- Para efectos de demo, se aceptó partir **desde cero**, con tecnologias modernas y de amplia comunidad.
- Raúl sugirió **MongoDB** y una arquitectura con front, back y base de datos separables, incluso en distintos proveedores cloud; tambien mencionó microservicios. El propio Raúl reconoció que era sugerencia y dejó abierta una mejor propuesta.
- El flujo inicial descrito fue **casa/oficina/hotel -> aeropuerto**:
  - usuario inicia sesion,
  - activa GPS,
  - elige destino aeropuerto,
  - define horario,
  - elige tipo de vehiculo,
  - ve precio,
  - escoge boleta o factura,
  - paga,
  - recibe numero de reserva,
  - ve una tarjeta/QR tipo boarding pass en `Mis reservas`.
- Se describió una vista administrativa donde Taxi Green ve la reserva y asigna **conductor y unidad por separado**.
- El conductor recibe la reserva asignada y ve datos de pasajero, origen, destino, hora, QR o informacion asociada.
- El pasajero recibe datos del conductor y la unidad, incluyendo foto/placa y posibilidad de ver ubicacion/ETA.
- Se consideró cierre por dos partes: conductor marca servicio atendido y pasajero confirma llegada.
- Se mencionó que el pago real y la facturacion real pueden ser simulados en demo; en cambio, GPS, mapa, kilometraje y tiempo debian sentirse reales.
- Se describió un segundo flujo **aeropuerto -> destino**, con origen fijo aeropuerto, datos de vuelo, reserva previa, QR, llegada del pasajero, validacion en modulo/supervisor y asignacion de conductor/unidad en aeropuerto.
- Se mencionaron actores: pasajero, conductor, administrador Taxi Green, supervisor/modulo aeropuerto y eventualmente administrador de plataforma.

### 2.2 Observado en analisis del sistema actual

- Taxi Green opera como GREEN AIRPORT S.A., con trayectoria declarada de mas de 23/25 años y base en Callao.
- El sitio operativo principal identificado es `/green/`, construido con PHP clasico, jQuery antiguo, Bootstrap, Leaflet/OpenStreetMap, modales y formularios.
- Hay una web paralela `/t/` tipo WordPress/marketing, con apariencia mas moderna pero sin flujo transaccional equivalente al sistema operativo.
- La reserva web visible se concentra en traslado relacionado con el aeropuerto y usa formulario con fecha, hora, direccion, tipo de unidad, datos de pasajero, documento, celular, correo, tarifa, peaje, maletas, pasajeros y comprobante.
- Los medios de pago visibles incluyen OpenPay, Izipay, Niubiz, Visa, Mastercard, Yape, Plin y efectivo/tarjeta en modal.
- La facturacion y/o seguimiento estan asociados a Tranzas/Fenbo Digital en subdominio externo.
- Existen reglas comerciales visibles:
  - tolerancia de espera de 15 minutos,
  - cancelacion/modificacion con minimo 4 horas,
  - no-show o cancelacion tardia con cargo de 100%,
  - peajes opcionales por monto fijo,
  - equipaje excedente sujeto a coordinacion con conductor.
- Los canales humanos siguen siendo centrales: call center, WhatsApp, correos de reservas/ventas/corporativo, modulo fisico, redes.
- La app movil aparece como promesa o enlace, pero los analisis reportan senales de debilidad: enlace iOS roto/no verificable y Android sin match claro o bajo cuenta de persona natural. Esto debe revalidarse antes de afirmarlo comercialmente.

### 2.3 Referencias Qorinti como evidencia indirecta

- Qorinti no es Taxi Green.
- Qorinti muestra patrones reutilizables solo con cautela:
  - registro/aprobacion de conductor,
  - registro/aprobacion de vehiculo,
  - separacion conductor/vehiculo,
  - mapa y ruta,
  - solicitud de servicio,
  - admin con pendientes/aprobados,
  - pagos/comisiones,
  - historial y calificaciones.
- Qorinti tambien contiene patrones que podrian ser incompatibles con Taxi Green:
  - marketplace multiservicio,
  - subasta/contraoferta,
  - carga/mudanza/categorias amplias,
  - comisiones visibles como flujo principal,
  - logica de "conductores ofertan" en lugar de despacho centralizado.

---

## 3. Resumen de investigaciones previas

### 3.1 Coincidencias principales entre investigaciones IA

- El problema no parece ser "hacer otra app de taxi" sino ordenar una operacion de transporte programado/aeroportuario/corporativo.
- Taxi Green tendria un activo fuerte en marca, trayectoria, modulo fisico y posicion aeroportuaria; su debilidad esta en capa digital fragmentada.
- Las apps masivas compiten mejor en on-demand B2C, pero no cubren con la misma profundidad el nicho de:
  - reserva programada,
  - meet-and-greet,
  - trazabilidad,
  - factura corporativa,
  - centros de costo,
  - invitados sin cuenta.
- El modulo/counter del aeropuerto y el personal humano no deberian verse solo como costo: son parte de la confianza ofrecida.
- El QR o link/voucher aparece como artefacto recurrente para identidad, validacion, auditoria y experiencia sin app obligatoria.
- La facturacion electronica/SUNAT/PSE/OSE es una pieza estructural en Peru; no debe tratarse como adorno visual.
- El enfoque SaaS white-label aparece como oportunidad posible, pero las investigaciones mas cautelosas recomiendan validarlo con cliente cero antes de prometerlo.

### 3.2 Aportes especificos

- ChatGPT enfatiza capas epistemicas y advierte que no todos los documentos pesan igual.
- Claude enfatiza cliente cero, plataforma operativa B2B y prudencia frente a SaaS prematuro.
- Gemini aporta marco de aeropuerto, regulacion, actores, benchmarks globales y anti-patrones, pero varias cifras deben revalidarse antes de usarse en venta.

### 3.3 Riesgo comun de las investigaciones IA

- Pueden estar haciendo eco entre si.
- Pueden mezclar fuentes publicas, inferencias y propuestas en un mismo tono de certeza.
- Pueden sobredimensionar mercado SaaS, disposicion de pago o madurez corporativa sin entrevistas reales.
- Pueden tomar como hecho cifras o estados publicos que deberian verificarse en la fecha de uso.

---

## 4. Resumen de propuestas previas

### 4.1 `PROPUESTA_DEMO.md`

Propone una demo de preventa con:

- app movil multirol pasajero/conductor,
- panel web admin/supervisor,
- backend unico en tiempo real,
- QR tipo boarding pass,
- GPS/mapa/ETA real,
- pago y facturacion simulados,
- dos flujos: casa -> aeropuerto y aeropuerto -> destino,
- asignacion separada conductor/unidad,
- stack sugerido Flutter + Next.js + NestJS + PostgreSQL/PostGIS + Socket.IO + Mapbox/Google + FCM.

Riesgo: ya cierra solucion, stack y narrativa. Debe leerse como propuesta previa, no como decision.

### 4.2 `DEMO_COMERCIAL_TAXI_GREEN_MASTERPLAN.md`

Propone una demo llamada internamente `Taxi Green Control Tower`, con:

- PWA/Next.js para acelerar preventa,
- vista pasajero, conductor, supervisor, admin y corporativo light,
- reserva programada al aeropuerto como flujo protagonista,
- variante aeropuerto -> destino con vuelo y QR,
- portal corporativo breve como remate,
- énfasis en no copiar Uber, no subastar, no mostrar SaaS completo.

Riesgo: tiene tono comercial fuerte. Sus ideas son utiles como historia, no como conclusion.

### 4.3 `PLAN_DE_SOFTWARE.md`

Propone un plan tecnico detallado:

- Postgres/PostGIS en vez de MongoDB,
- monolito modular en vez de microservicios desde el inicio,
- portabilidad cloud en vez de multi-cloud artificial,
- DDL, REST, WebSocket, QR HMAC, tracking GPS, FCM, seguridad, sprints y checklist.

Riesgo: convierte hipotesis tecnicas en especificaciones. Debe ser insumo tecnico, no mandato.

### 4.4 `PROBLEMA_ordenado_Taxi_Green.md`

Ordena la conversacion y propone giro:

- no app-first obligatoria,
- modulo aeropuerto como centro,
- cola de conductores,
- WhatsApp/web como puerta para pasajero ocasional,
- app/PWA para conductor, recurrentes o corporativos,
- IA solo como copiloto de despacho, no reemplazo.

Riesgo: ya contiene interpretacion de ChatGPT, por lo que no equivale a transcripcion literal.

---

## 5. Hechos confirmados

### 5.1 Sobre el repo

- El repositorio es documental; no contiene una aplicacion implementada.
- Hay documentos vacios en `04_SINTESIS_TRABAJO` y `05_FINAL`.
- `02_PROPUESTAS_PREVIAS/PROBLEMA_ordenado_Taxi_Green.md` y `00_EVIDENCIA_REAL/reuniones/PROBLEMA_ordenado_Taxi_Green.md` son identicos por checksum.

### 5.2 Sobre Taxi Green, segun evidencia revisada

- Taxi Green tiene un sistema web operativo visible bajo `/green/`.
- Ese sistema web usa tecnologias clasicas/antiguas y no se observa como una API moderna para app.
- Existe una web paralela `/t/` orientada a marketing/contacto.
- La operacion publica esta fuertemente vinculada al aeropuerto Jorge Chavez.
- Se declaran servicios adicionales: ejecutivo, por hora, vans, eventos corporativos y city tours.
- Hay canales humanos activos o declarados: call center, WhatsApp, correos, modulo fisico, redes.
- Hay integracion visible o comunicada con pagos digitales y facturacion electronica externa.
- La transcripcion confirma que, para la demo, se queria mostrar reserva, asignacion, conductor, unidad, estados, QR y cierre del servicio.
- La transcripcion confirma que conductor y unidad deben modelarse por separado.

### 5.3 Sobre lo que no esta confirmado

- No hay acceso al codigo fuente del backend real.
- No hay acceso a base de datos real.
- No hay volumen real de reservas.
- No hay mix real de ingresos B2C/B2B.
- No hay confirmacion directa de procesos internos de despacho.
- No hay confirmacion directa de contratos corporativos.
- No hay confirmacion directa del estado actual de las cuentas de App Store / Google Play.

---

## 6. Inferencias razonables

- El sistema actual probablemente depende de PHP + base relacional y formularios server-side, no de una API publica moderna.
- El flujo digital visible parece cubrir principalmente aeropuerto, mientras varios servicios quedan a call center, WhatsApp o correo.
- Taxi Green opera mas como servicio programado/controlado que como marketplace abierto tipo Uber.
- El modulo fisico/counter del aeropuerto es parte del valor de confianza.
- La asignacion de conductor probablemente tiene componente manual o semi-manual.
- Para pasajeros ocasionales o invitados, exigir app nativa podria ser friccion alta.
- Para conductor, operador, supervisor o corporativo frecuente, una app/PWA/panel podria tener mas sentido que para el pasajero ocasional.
- Un modelo de datos relacional parece natural para reservas, conductores, vehiculos, pagos, comprobantes, empresas y centros de costo.
- El futuro SaaS puede ser una opcion, pero solo si se valida que otros operadores pagarian y aceptarian una plataforma comun.
- La automatizacion o IA podria aportar valor en tareas repetitivas, pero no deberia reemplazar el juicio humano ni la atencion presencial del modulo.

---

## 7. Hipotesis

- El mayor dolor de Taxi Green podria estar en la operacion interna y corporativa, no en la falta de una app para pasajeros.
- El segmento corporativo programado podria ser mas rentable y defendible que el B2C individual on-demand.
- Un QR/link/voucher podria resolver mejor el caso del pasajero invitado que una app obligatoria.
- Un panel de modulo/operacion podria generar mas impacto comercial que una app pasajero si el cliente valora eficiencia y control.
- La factura consolidada con centros de costo podria ser una palanca comercial importante para clientes corporativos.
- Taxi Green podria ser cliente cero de una plataforma replicable, pero falta validar si desea o permite reutilizacion del producto con otros operadores.
- Otros operadores autorizados o remisse formales podrian necesitar herramientas similares, pero no hay entrevistas que prueben disposicion de pago.
- Un sistema de despacho asistido por reglas/score podria mejorar asignacion, siempre que respete cola, tipo de unidad, disponibilidad y decision humana.
- El estado de la app movil actual podria representar un problema de credibilidad, pero debe verificarse antes de usarlo en pitch.

---

## 8. Contradicciones

### 8.1 App movil vs web/WhatsApp/PWA

- La transcripcion inicial habla varias veces de "aplicacion" y vistas en app.
- El documento ordenado y varias investigaciones recomiendan no obligar al pasajero ocasional a descargar app.
- Las propuestas previas oscilan entre Flutter nativo, Expo, PWA Next.js y WhatsApp.
- No hay decision validada por Taxi Green sobre canal principal.

### 8.2 SaaS vs proyecto Taxi Green

- `primeras_ideas.pdf` empuja SaaS white-label regional desde el inicio.
- Otros documentos recomiendan Taxi Green como cliente cero antes de SaaS.
- No hay evidencia de que otros operadores hayan sido entrevistados.

### 8.3 Mongo/microservicios/multi-cloud vs relacional/monolito modular

- Raúl sugirio MongoDB, microservicios y separacion cloud.
- Los planes tecnicos argumentan PostgreSQL/PostGIS, monolito modular y portabilidad.
- La tension debe conversarse con Raúl; no debe resolverse por imposicion silenciosa.

### 8.4 Operacion tipo Uber vs cola/modulo

- Algunas ideas iniciales suenan a app tipo Uber: GPS, conductor cercano, tracking, app pasajero.
- La evidencia operativa ordenada sugiere que el aeropuerto funciona por modulo, cola, supervisor y asignacion controlada.
- Qorinti usa subasta/contraoferta, pero Taxi Green parece requerir control y confianza.

### 8.5 Evidencia directa vs investigaciones externas

- Las investigaciones citan cifras de mercado, airport terminal, competidores y regulacion.
- Algunas cifras o fechas pueden cambiar o tener fuentes secundarias contradictorias.
- Para decision comercial, deben revalidarse.

---

## 9. Vacios de informacion

- Volumen mensual de reservas por canal: web, WhatsApp, telefono, email, counter, corporativo.
- Distribucion de ingresos por segmento: aeropuerto spot, corporativo, eventos, vans, city tours, hoteles/agencias.
- Tarifario real: por zona, distrito, distancia, convenio, horario, tipo de vehiculo o mezcla.
- Flujo real de asignacion: llamada, WhatsApp, radio, sistema interno, cola fisica, reglas, excepciones.
- Estado real de conductores: empleados, afiliados, terceros, turnos, smartphones, datos, idioma, adopcion digital.
- Propiedad de flota: propia, afiliada o mixta.
- Propiedad y estado de app actual, cuentas de stores y codigo fuente.
- Proveedor actual de hosting y mantenimiento.
- Accesos a OpenPay/Niubiz/Izipay/Yape/Plin y contratos activos.
- Alcance real de Fenbo/Tranzas: emite, consulta, consolida, permite API, soporta centros de costo.
- Procesos de clientes corporativos: aprobaciones, centros de costo, reportes, factura mensual/quincenal.
- Relacion exacta con LAP y reglas operativas del modulo en el nuevo terminal.
- Presupuesto, sponsor, decisor y urgencia real del proyecto.
- Posicion de Taxi Green sobre reutilizacion del software para otros operadores.
- Si la demo debe vender a Taxi Green, a Raúl/equipo interno o a terceros usando Taxi Green como caso.

---

## 10. Actores detectados

| Actor | Evidencia | Necesidad probable |
|---|---|---|
| Pasajero individual local | Transcripcion y sitio | Reservar, pagar, recibir comprobante, ver conductor/unidad, saber estado. |
| Pasajero turista/internacional | Sitio, aeropuerto, investigaciones | Confianza, punto de encuentro claro, idioma, pago simple, no friccion de app obligatoria. |
| Pasajero corporativo invitado | Investigaciones/propuestas | Recibir link/QR/datos sin crear cuenta; ser validado al llegar. |
| Cliente corporativo solicitante | Sitio y propuestas | Reservar para colaboradores/invitados, asociar RUC, factura, centro de costo. |
| Administrador corporativo | Investigaciones/propuestas | Reportes, consumo mensual, centros de costo, comprobantes, trazabilidad. |
| Conductor | Transcripcion/Qorinti/propuestas | Recibir asignacion clara, ruta, datos de pasajero, estados simples, navegacion. |
| Unidad/vehiculo | Transcripcion | Debe modelarse separada del conductor. |
| Operador/despachador Taxi Green | Transcripcion/problema ordenado | Ver reservas, asignar conductor/unidad, resolver excepciones, cerrar servicios. |
| Supervisor/modulo aeropuerto | Transcripcion/problema ordenado | Validar pasajero, QR/codigo, vuelo, asignar/confirmar conductor en counter. |
| Finanzas/facturacion Taxi Green | Sitio/propuestas | Boletas/facturas, conciliacion, comprobantes, pagos a conductor. |
| Soporte/call center | Sitio/propuestas | Cambios, cancelaciones, no-shows, reclamos, comunicacion con pasajero. |
| Gerencia Taxi Green | Inferencia | Visibilidad, control, crecimiento corporativo, decision de inversion. |
| LAP/autoridad aeropuerto | Investigaciones | Marco operativo y regulatorio del counter. |
| Proveedor PSE/OSE/Fenbo/Tranzas | Evidencia sitio | Facturacion/seguimiento externo. |
| Pasarelas de pago | Evidencia sitio | Tokenizacion y pago digital. |
| Otros operadores remisse/aeropuerto | Investigaciones | Posibles competidores o clientes futuros si se valida SaaS. |

---

## 11. Flujo actual probable

Los siguientes flujos son **inferidos** desde sitio, transcripcion e investigaciones; no estan confirmados con operacion interna.

### 11.1 Ciudad -> aeropuerto con reserva previa

1. Pasajero reserva por web, telefono, WhatsApp o correo.
2. Entrega origen, destino aeropuerto, fecha/hora, tipo de unidad, datos personales y comprobante.
3. Sistema o operador registra la solicitud.
4. Pago puede ser efectivo, tarjeta, billetera o credito corporativo, segun canal.
5. Operador confirma reserva.
6. Antes del servicio, Taxi Green asigna conductor y unidad.
7. Conductor recibe datos por canal interno.
8. Conductor llega al punto, contacta al pasajero, realiza traslado.
9. Servicio se cierra manualmente o en sistema.
10. Comprobante se emite/consulta mediante Fenbo/Tranzas u otro proceso externo.

### 11.2 Aeropuerto -> destino con reserva previa

1. Pasajero reserva antes de llegar y puede registrar vuelo/hora/destino.
2. Central o modulo aeropuerto ve reserva.
3. Pasajero llega a llegadas y busca modulo/personal.
4. Personal valida identidad/reserva mediante nombre, documento, codigo o QR si existiera.
5. Asignacion de conductor/unidad ocurre en aeropuerto o se confirma en ese momento.
6. Personal entrega/orienta al pasajero hacia conductor/unidad.
7. Conductor ejecuta viaje.
8. Cierre, pago/comprobante y eventual reporte se procesan despues.

### 11.3 Aeropuerto -> destino walk-in

1. Pasajero llega al modulo sin reserva.
2. Solicita destino/tipo de unidad.
3. Operador cotiza y registra venta.
4. Pasajero paga o se asocia a convenio.
5. Operador consulta/usa cola de conductores.
6. Se asigna conductor/unidad.
7. Se entrega pasajero al conductor y se ejecuta viaje.

### 11.4 Corporativo recurrente

1. Empresa solicita traslados por correo, WhatsApp, telefono o canal comercial.
2. Taxi Green agenda viajes para empleados/invitados.
3. Puede haber pago por credito y facturacion quincenal/mensual.
4. Reporte y conciliacion probablemente involucran Excel/correo o sistema externo.
5. Falta confirmar aprobaciones, centros de costo, reglas por empresa y flujo real.

---

## 12. Problemas detectados

### 12.1 Confirmados o muy probables

- Fragmentacion digital: `/green/` operativo, `/t/` marketing, app dudosa, facturacion externa.
- Stack web antiguo con riesgo de mantenimiento, seguridad y conversion.
- Seguimiento/facturacion mezclados en experiencia confusa.
- Servicios declarados que no parecen tener todos un flujo digital robusto.
- Falta visible de tracking/conductor/unidad/ETA en experiencia actual.
- Libro de reclamaciones y varios procesos parecen manuales o minimos.
- App prometida o mencionada con estado incierto, potencialmente dañando credibilidad.
- Dependencia alta de canales humanos sin trazabilidad digital clara.

### 12.2 Inferidos

- Operacion interna puede depender de WhatsApp, telefono, Excel o sistemas no integrados.
- Clientes corporativos pueden requerir mejor reporte, factura y trazabilidad.
- Conductores pueden recibir datos sin estructura estandarizada.
- Cambios de vuelo, no-shows, equipaje y excepciones pueden generar friccion operativa.
- La ausencia de una cuenta/historial puede limitar repeticion de reserva y calidad de servicio.

### 12.3 Riesgo de diagnostico

- Es posible que algunos procesos internos ya esten mejor resueltos que lo visible publicamente.
- Es posible que el cliente no quiera modernizar la operacion, sino solo una demo comercial.
- Es posible que el dolor mas fuerte no sea corporativo, sino otro segmento no documentado.

---

## 13. Rutas de solucion posibles

Ninguna ruta se toma como decision. Todas requieren validacion.

### Ruta A — Modernizacion interna Taxi Green

- **Qué seria:** ordenar reserva, despacho, estados, pagos/facturacion e interfaces internas para Taxi Green.
- **Canales posibles:** web/PWA/app/panel segun actor.
- **Valor:** reduce friccion y deuda interna.
- **Riesgo:** techo limitado a un cliente; puede convertirse en desarrollo a medida sin producto replicable.
- **Validar:** presupuesto, acceso tecnico, sponsor, dolor interno.

### Ruta B — Torre de control aeroportuaria

- **Qué seria:** sistema centrado en modulo/counter, cola, reservas, QR, validacion y asignacion.
- **Valor:** se apoya en el activo diferencial aeroportuario.
- **Riesgo:** mercado estrecho si no se conecta a corporativo o otros operadores.
- **Validar:** flujo real en counter, reglas LAP, volumen walk-in/prebook.

### Ruta C — Plataforma corporativa programada

- **Qué seria:** reservas corporativas, invitados, centros de costo, reportes, factura consolidada y trazabilidad.
- **Valor:** potencial mayor disposicion de pago.
- **Riesgo:** requiere validar que empresas/clientes corporativos tienen ese dolor y pagarian por resolverlo.
- **Validar:** clientes corporativos activos, reportes actuales, ciclo de facturacion, exigencias de compliance.

### Ruta D — QR/link/voucher para pasajero invitado

- **Qué seria:** artefacto de validacion y trazabilidad para pasajeros sin cuenta ni app.
- **Valor:** reduce friccion de app y sirve para corporativo/aeropuerto.
- **Riesgo:** podria ser solo una feature, no un producto completo.
- **Validar:** casos de invitados, eventos, hoteles, empresas.

### Ruta E — WhatsApp/web como puerta de entrada

- **Qué seria:** reserva por WhatsApp o web responsive conectada a backend/panel.
- **Valor:** baja friccion; respeta habitos de mercado.
- **Riesgo:** si se queda solo en chat, no resuelve operacion ni facturacion.
- **Validar:** volumen y calidad del canal WhatsApp, automatizacion permitida, WhatsApp Business API.

### Ruta F — App/PWA de conductor

- **Qué seria:** herramienta diaria para recibir asignaciones, navegar y cambiar estados.
- **Valor:** trazabilidad y coordinacion.
- **Riesgo:** adopcion por afiliados; resistencia si se percibe vigilancia.
- **Validar:** smartphones, datos, edad digital, incentivos, turnos, relacion contractual.

### Ruta G — SaaS white-label para operadores

- **Qué seria:** producto multiempresa para remisse/aeropuerto/movilidad corporativa.
- **Valor:** escalabilidad comercial.
- **Riesgo:** no hay validacion con compradores; venta puede ser lenta y de bajo margen.
- **Validar:** entrevistas con 5-10 operadores, disposicion de pago, necesidad real, exclusividad con Taxi Green.

### Ruta H — Copiloto/IA de despacho o ventas

- **Qué seria:** asistente para clasificar solicitudes, sugerir asignaciones, redactar confirmaciones y consolidar reportes.
- **Valor:** puede ahorrar tiempo sin reemplazar humanos.
- **Riesgo:** IA por moda, decisiones erroneas o perdida de confianza.
- **Validar:** volumen de mensajes, repeticion de tareas, reglas claras, umbrales de autonomia.

---

## 14. Demo propuesta anteriormente

Las propuestas anteriores contienen varias versiones. Este resumen describe lo propuesto, no lo aprueba.

### 14.1 Demo app/panel multirol

- Pasajero crea reserva hacia aeropuerto.
- GPS/geocoding/ruta/ETA reales.
- Tarifa estimada.
- Boleta/factura.
- Pago simulado.
- QR de reserva.
- Admin ve la reserva en vivo.
- Admin asigna conductor y unidad por separado.
- Conductor recibe asignacion.
- Pasajero ve conductor, placa, ubicacion y ETA.
- Conductor inicia/finaliza.
- Pasajero confirma llegada.
- Comprobante simulado.
- Calificacion.

### 14.2 Variante aeropuerto

- Pasajero reserva aeropuerto -> destino.
- Registra vuelo.
- Recibe QR.
- Supervisor/modulo escanea o valida QR.
- Asigna conductor/unidad en aeropuerto.
- Viaje se ejecuta y cierra.

### 14.3 Remate corporativo

- Viaje asociado a empresa/RUC/centro de costo.
- Dashboard simple con viajes del mes y comprobante.
- Reporte/export simulado.

### 14.4 Stacks propuestos

- Version 1: Flutter + Next.js + NestJS + PostgreSQL/PostGIS + Socket.IO + Mapbox/Google + FCM.
- Version 2: PWA Next.js + TypeScript + Tailwind/shadcn + Prisma + PostgreSQL/SQLite + Maps + QR + Playwright.
- Para producto real: Expo/React Native, Next.js, NestJS, PostgreSQL/PostGIS, Redis, adaptadores de pago/facturacion, notificaciones y WhatsApp Business.

### 14.5 Elementos que las propuestas recomiendan simular

- Pago real.
- Facturacion SUNAT/Fenbo/Tranzas real.
- Email/SMS/push externo si no hay tiempo.
- Tracking de vuelo.
- Chat in-app.
- Multiempresa SaaS real.

### 14.6 Cautela

La demo previa puede ser util como cantera de ideas, pero no debe convertirse en decision final antes de validar:

- objetivo real de la demo,
- publico de la demo,
- actor protagonista,
- dolor prioritario,
- canal adecuado por actor,
- alcance que Taxi Green realmente compraria.

---

## 15. Riesgos

### 15.1 Riesgos de negocio

- Construir una app pasajero que no use el pasajero ocasional.
- Construir SaaS antes de validar compradores.
- Resolver Taxi Green como desarrollo a medida sin opcion de producto, si el objetivo real era escalar.
- Prometer multiempresa o marca blanca si Taxi Green exige exclusividad.
- Diseñar para corporativo sin confirmar que corporativo pesa en ingresos.
- Ignorar hoteles/agencias si resultan ser canal importante.
- Subestimar a Cabify Empresas, Uber for Business, Moobiz u operadores locales.

### 15.2 Riesgos operativos

- Conductores afiliados rechazan app/PWA.
- Despachadores perciben sistema como vigilancia.
- Supervisor/counter no tiene tiempo de operar pantallas complejas.
- App o panel aumenta pasos en vez de reducirlos.
- Sistema falla en hora pico y deja sin plan B.
- Cierre digital no coincide con realidad fisica del servicio.

### 15.3 Riesgos tecnicos

- MongoDB por presion sin encaje con datos relacionales/geo.
- Microservicios prematuros con costo operativo alto.
- Integracion fiscal mal modelada.
- Dependencia fuerte de un proveedor de mapas/pagos/facturacion.
- Ausencia de auditoria y trazabilidad de estados.
- Manejo debil de datos personales, documentos, ubicaciones y pagos.

### 15.4 Riesgos de producto

- Copiar Uber y perder el diferencial.
- Copiar Qorinti y meter marketplace/subasta donde no corresponde.
- Copiar WAREM/Pepethefrog y convertir Taxi Green en un producto de ventas/IA que no corresponde al dominio.
- Sobrecargar la demo con cinco vistas equilibradas y perder foco.
- Vender "IA" sin indicador operativo medible.

### 15.5 Riesgos epistemicos

- Tratar investigaciones IA como evidencia.
- Repetir supuestos porque aparecen en varios documentos.
- Confundir transcripcion ordenada con voz literal.
- Usar cifras externas sin revalidarlas.
- Asumir que "ver demo" equivale a "comprar proyecto".

---

## 16. Qué cosas no deben asumirse como verdad

- No asumir que la solucion debe ser app movil.
- No asumir que la solucion debe ser SaaS.
- No asumir que la solucion debe ser WhatsApp/web/panel antes de justificarlo.
- No asumir que Taxi Green quiere reemplazar su sistema actual.
- No asumir que Taxi Green quiere ser cliente cero de un SaaS vendible a competidores.
- No asumir que los clientes corporativos estan insatisfechos.
- No asumir que el negocio corporativo pesa mas que el counter o B2C.
- No asumir que la flota de 350/400 unidades es propia.
- No asumir que todos los conductores tienen smartphone, datos y disposicion a GPS persistente.
- No asumir que la app actual esta muerta sin verificar en stores y con Taxi Green.
- No asumir que los operadores LAP mencionados aceptarian una plataforma comun.
- No asumir que LAP no construira o exigira un sistema propio.
- No asumir que la tarifa es por distancia; podria ser por zona, convenio o reglas internas.
- No asumir que Fenbo/Tranzas permite todas las integraciones necesarias.
- No asumir que Qorinti puede reutilizarse como base directa.
- No asumir que IA debe asignar automaticamente.
- No asumir que "conductor mas cercano" es regla correcta; la cola puede importar mas.
- No asumir que pago y factura deben integrarse en la demo si el objetivo es preventa.
- No asumir que las cifras externas o de mercado son actuales sin revalidacion.

---

## 17. Preguntas pendientes para Taxi Green

### 17.1 Negocio y prioridad

1. ¿Cual es el problema que mas quieren resolver hoy: reservas, despacho, experiencia pasajero, corporativo, facturacion, app, marketing o control interno?
2. ¿Que porcentaje de ingresos viene de counter aeropuerto, reservas programadas, corporativo, eventos, vans, city tours y hoteles/agencias?
3. ¿Cuantas reservas reciben por dia/mes y por canal?
4. ¿Que porcentaje de reservas termina en no-show, cancelacion o modificacion?
5. ¿Cual es el ticket promedio por tipo de servicio y unidad?
6. ¿Hay una fecha objetivo o evento que impulse la demo/proyecto?
7. ¿Quien toma la decision final de compra?
8. ¿Hay presupuesto definido o se espera que la propuesta lo determine?

### 17.2 Operacion aeropuerto

9. ¿Como funciona exactamente el modulo/counter en llegadas?
10. ¿Como se maneja la cola de conductores?
11. ¿Quien asigna conductor y unidad en un walk-in?
12. ¿Que datos se registran cuando un pasajero compra en modulo?
13. ¿Cuanto tarda la asignacion en hora normal y hora pico?
14. ¿Que cambia entre vuelo nacional e internacional?
15. ¿Como se manejan vuelos retrasados, cancelados o pasajeros demorados?
16. ¿LAP impone reglas tecnicas o de proceso para el counter?

### 17.3 Despacho, conductor y unidad

17. ¿Los conductores son empleados, afiliados, terceros o mixto?
18. ¿Las unidades son propias, afiliadas o mixtas?
19. ¿Un conductor puede manejar varias unidades y una unidad varios conductores?
20. ¿Como reciben hoy los conductores una asignacion?
21. ¿Deben aceptar/rechazar servicios o solo recibir asignacion?
22. ¿Tienen todos smartphone y plan de datos?
23. ¿Hay resistencia esperada a app/PWA o GPS?
24. ¿Como se liquida/paga al conductor despues del servicio?

### 17.4 Corporativo

25. ¿Cuantos clientes corporativos activos tienen?
26. ¿Quienes son los principales clientes corporativos por volumen?
27. ¿Como solicita hoy una empresa un traslado?
28. ¿Existe aprobacion interna del cliente corporativo?
29. ¿Manejan centros de costo, areas, proyectos o usuarios autorizados?
30. ¿Facturan por viaje, quincenal, mensual o mezcla?
31. ¿Que reportes exige el cliente corporativo?
32. ¿Que dolores reportan las areas de administracion/finanzas de clientes?

### 17.5 Tecnologia

33. ¿Tienen acceso al codigo fuente del sistema `/green/`?
34. ¿Quien lo mantiene y donde esta alojado?
35. ¿Que base de datos usa?
36. ¿Existe una API interna o todo opera por formularios/paginas?
37. ¿Que estado real tiene la app movil?
38. ¿Quien posee las cuentas Apple Developer y Google Play?
39. ¿Que contratos/credenciales existen con OpenPay, Niubiz, Izipay, Yape, Plin?
40. ¿Que alcance tecnico ofrece Fenbo/Tranzas?
41. ¿Tienen politica de proteccion de datos personales vigente?
42. ¿Hay requerimientos de hosting, nube, on-premise o soberania de datos?

### 17.6 Demo y decision de producto

43. ¿La demo debe persuadir a Taxi Green, a Raúl/equipo interno o a terceros?
44. ¿Que actor debe sentirse mejor servido en la demo: pasajero, conductor, supervisor, despachador, gerencia o corporativo?
45. ¿Que parte de la demo debe funcionar de verdad y que parte puede simularse?
46. ¿Quieren validar app, panel, WhatsApp/web, QR, corporativo, despacho o todo?
47. ¿Que resultado medible haria que Taxi Green considere exitosa una primera version?
48. ¿Taxi Green aceptaria que el producto se diseñe para posible reutilizacion con otros operadores?
49. ¿Necesitan exclusividad?
50. ¿Cual es el riesgo que mas les preocupa si modernizan la operacion?

---

## Cierre neutral

La evidencia sugiere que Taxi Green combina un activo operativo fuerte (marca, aeropuerto, confianza, canales humanos) con una capa digital fragmentada. Sin embargo, todavia no hay suficiente informacion para decidir si la respuesta correcta es app, PWA, WhatsApp, panel, SaaS, QR, copiloto IA o una combinacion.

Para una vision independiente, la siguiente IA deberia partir de estas reglas:

- separar hechos de interpretaciones,
- no convertir propuestas previas en decisiones,
- decidir por actor y problema, no por tecnologia,
- validar primero la economia y la operacion real,
- tratar la demo como herramienta de aprendizaje/preventa, no como vision final.

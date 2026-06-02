# Guia practica del Figma - Demo Taxi Green

Esta guia explica, de forma simple y completa, como entender el Figma generado por el plugin local de Taxi Green, que representa cada pagina y como se recorre el flujo principal de la demo comercial.

La idea central es esta:

> El usuario no empieza en una app. Empieza en un canal real: WhatsApp, web publica, QR/counter o recepcion de hotel. Desde ahi Taxi Green convierte el pedido en una operacion trazable: reserva, aprobacion humana, conductor, tracking por link, viaje, comprobante y bienestar.

## 1. Que es este Figma

Este Figma no es el MVP completo ni una app final lista para produccion. Es una **demo comercial navegable** para contar una historia clara de producto.

Su objetivo es mostrarle a Taxi Green como podria funcionar una operacion moderna de taxis aeroportuarios, sin prometer que toda la vision futura ya esta construida.

El Figma muestra:

- Como entra una solicitud desde un canal natural.
- Como el copiloto operativo extrae datos.
- Como un admin operativo aprueba, corrige o asigna.
- Como el conductor recibe una asignacion simple.
- Como el pasajero ve tracking sin instalar app.
- Como se cierra el viaje con comprobante.
- Como se reporta y resuelve un objeto perdido.
- Como el counter funciona como apoyo secundario.

## 2. La frase que ordena toda la demo

La demo debe entenderse asi:

> **Canal de entrada -> copiloto -> admin operativo -> conductor -> link pasajero -> viaje -> comprobante -> bienestar.**

No debe entenderse como:

- "Una PWA de pasajero".
- "Un chatbot".
- "Un dashboard generico".
- "Un MVP completo".
- "Una app para todos los casos posibles".

La demo cuenta **un solo flujo protagonista** y usa las demas vistas como apoyo.

## 3. Actores principales

### 3.1 Pasajero

Es la persona que necesita tomar un taxi.

Importante: el pasajero **no empieza descargando una app**. Entra por un canal:

- WhatsApp.
- Link enviado por hotel.
- Web publica que lo deriva a WhatsApp.
- QR en counter.
- Atencion presencial del counter.

Cuando la reserva ya existe, el pasajero recibe un link tipo:

`/p/[token]`

Ese link le permite ver:

- Conductor asignado.
- Placa.
- Mapa.
- ETA.
- Voucher.
- Comprobante.
- Acceso a bienestar si algo sale mal.

### 3.2 Admin operativo

Es el equivalente a un despachador/supervisor con control de operacion.

En la demo se representa como **Carla**, quien:

- Revisa reservas.
- Valida sugerencias del copiloto.
- Aprueba asignaciones.
- Ve trazabilidad.
- Atiende incidencias.
- Contacta al conductor si hay objeto perdido.

Este actor es clave porque la demo no vende "IA autonoma". Vende:

> **Copiloto con humano en control.**

### 3.3 Conductor

Es quien recibe una asignacion de viaje.

Su interfaz debe sentirse simple:

- Un estado claro.
- Una accion principal.
- Botones grandes.
- Nada de burocracia.
- Flujo de trabajo directo.

La demo muestra una app de conductor orientada a trabajo real.

### 3.4 Counter

Es el punto presencial en aeropuerto.

No es el flujo protagonista, pero demuestra que Taxi Green puede cubrir casos donde:

- El pasajero llega sin WhatsApp.
- Alguien necesita ayuda presencial.
- Se crea una reserva manual.
- Se deriva todo al mismo despacho.

### 3.5 Empresa cliente

Es un actor de contexto.

Existe en el Figma para mostrar potencial corporativo, reportes, facturacion y privacidad, pero **no debe robar protagonismo** en la demo principal.

### 3.6 Bienestar

No es una app separada ni una seccion decorativa.

Bienestar es una capa integrada al flujo:

- Aparece al final del viaje.
- Permite reportar objeto perdido.
- Crea un caso.
- Entra a una cola del admin operativo.
- El admin contacta al conductor.
- Se genera una resolucion.
- Puede cerrarse con constancia.

La promesa es:

> Taxi Green no solo transporta; tambien responde cuando algo queda pendiente.

## 4. Paginas del Figma

El plugin genera 14 paginas.

### 00 Cover

Portada ejecutiva.

Sirve para abrir la presentacion y explicar la vision:

- Operacion aeroportuaria formal.
- Servicio premium.
- Copiloto operativo.
- Humano en control.
- Pasajero sin app.
- Bienestar como promesa.

Esta pagina no es para hacer clic primero durante la demo. Es para vender el concepto.

### 01 Design Tokens

Muestra colores, tipografia y reglas visuales.

Sirve para demostrar que no es un mockup improvisado, sino un sistema visual con criterio:

- Verdes Taxi Green.
- Amarillo del logo.
- Neutros calidos.
- Estados semanticos.
- Colores de bienestar.
- Tipografia.
- Espaciado.
- Radios.
- Sombras.

### 02 Components

Muestra componentes base.

Incluye:

- Botones.
- Inputs.
- Badges.
- Chips.
- Driver card.
- Trip card.
- Voucher QR.
- Incident card.

Tambien incluye componentes reales de Figma cuando es viable.

### 03 Patterns

Muestra patrones de layout.

Sirve para entender como se estructuran:

- Entrada/link pasajero.
- App conductor.
- Admin operativo.
- Counter.
- Empresa.
- Bienestar.

### 04 Iconography & Assets

Muestra iconografia y assets.

Incluye:

- Recreacion vectorial del logo Taxi Green.
- Pictogramas.
- Criterios de uso visual.

Nota: no se embebe `logo.jpg` directamente porque el JPG original tiene fondo negro rectangular. Por eso se usa una recreacion vectorial mas flexible.

### 05 Entrada y Link Pasajero

Esta es una pagina importante porque corrige la idea de que el usuario empieza en una PWA.

Aqui se muestra:

- Entrada multicanal.
- Link pasajero.
- Tracking.
- Voucher.
- Estados del viaje.
- Cierre.
- Entrada a bienestar.

La pantalla clave es:

`1.A Entrada multicanal`

Desde ahi se entiende que el pasajero puede entrar por WhatsApp, web publica, QR/counter o hotel.

### 06 App Conductor

Muestra la interfaz del conductor.

Pantallas importantes:

- Login conductor.
- Inicio libre.
- Nueva asignacion.
- Camino al pasajero.
- Esperando pasajero.
- Viaje en curso.
- Finalizar viaje.

Lo importante aqui es la simplicidad:

- El conductor no gestiona un dashboard.
- El conductor confirma hitos.
- La interfaz esta pensada para uso rapido en operacion real.

### 07 Admin Operativo

Esta es la pagina del actor administrador/despachador.

Pantallas importantes:

- Login admin operativo.
- Torre de control.
- Reserva drawer.
- Mapa operacional.
- Conductores.
- Ingesta multicanal.
- Reportes.
- Configuracion.

La pantalla mas importante es:

`3.C Reserva TG-0341`

Porque ahi se ve la idea clave:

> El copiloto sugiere, Carla aprueba.

### 08 Counter Supervisor

Flujo secundario.

Muestra como un supervisor de aeropuerto puede:

- Ver vuelos.
- Crear reserva manual.
- Revisar historial.
- Reportar incidencia rapida.

Es apoyo, no protagonista.

### 09 Empresa Cliente

Contexto corporativo.

Muestra:

- Dashboard empresa.
- Viajes.
- Colaboradores.
- Facturacion.
- Notificaciones.
- Incidencias con privacidad.

Debe mencionarse como potencial, no como centro de la demo.

### 10 Canal WhatsApp

Esta pagina representa el canal protagonista.

No es WhatsApp Business real. Es un simulador visual para explicar como funcionaria la ingesta.

Pantallas:

- `12.A Mensaje incompleto`
- `12.B Datos completos`
- `12.C Reserva creada`

Aqui se ve la dualidad:

- Lado cliente: chat natural.
- Lado sistema: cocina del copiloto.

### 11 Bienestar Integrado

Aqui vive la capa de bienestar.

Pantallas clave:

- Reportar objeto perdido.
- Reporte recibido.
- Detalle de incidencia.
- Cola de bienestar.
- Atencion de incidencia.
- Solicitud al conductor.
- Constancia PDF.

Lo importante es que bienestar se conecta al flujo del viaje, no aparece como modulo aislado.

### 12 Estados

Estados auxiliares:

- Empty states.
- Errores.
- Loading.
- Offline.

Sirven para handoff y diseño de calidad.

### 13 Prototype

Esta es la pagina desde donde conviene iniciar la demo navegable.

Tiene un mapa narrativo:

- Flujo protagonista.
- Flujo secundario counter.
- Flujo secundario bienestar.
- Estados construido / simulado / aplazado.

El boton principal es:

`Iniciar por canal`

Ese boton lleva al inicio correcto: entrada multicanal.

## 5. Flujo protagonista completo

Este es el recorrido que deberias presentar como demo principal.

### Paso 1 - Inicio en canal de entrada

Pantalla:

`13 Prototype -> Iniciar por canal -> 1.A Entrada multicanal`

Que se explica:

> El pasajero o el hotel no empieza en una app. Empieza por el canal que ya usa: WhatsApp, web publica, QR, counter o recepcion.

Que debe quedar claro:

- La demo no obliga a instalar app.
- La web publica no necesita ser un formulario complejo.
- El canal dominante es WhatsApp.
- El link pasajero aparece despues.

Accion:

`Comenzar por WhatsApp`

### Paso 2 - WhatsApp recibe un mensaje incompleto

Pantalla:

`12.A Mensaje incompleto`

Historia:

El hotel escribe algo como:

> Tenemos huesped llegando manana 3:45am, vuelo LATAM 2456, dos personas, destino Miraflores.

El sistema entiende algunos datos:

- Canal: WhatsApp.
- Tipo de viaje: Recojo en aeropuerto (Aeropuerto Jorge Chavez -> Miraflores).
- Vuelo: LA2456.
- Hora: 03:45.
- Pasajeros: 2.
- Destino aproximado: Miraflores.

Pero faltan datos:

- Direccion exacta.
- Correo para comprobante.
- Nombre del pasajero.

Que se vende:

> El copiloto no inventa. Detecta lo que falta y propone pedirlo.

Accion:

`Pedir direccion exacta`

### Paso 3 - WhatsApp completa datos

Pantalla:

`12.B Datos completos`

Historia:

El hotel responde:

- Direccion exacta.
- Correo.
- Nombre.

La cocina del copiloto convierte conversacion en borrador operativo.

Que debe verse:

- Extraccion validada.
- Borrador de reserva.
- Decision sugerida.
- Humano en control.

Que se vende:

> La IA estructura, pero no despacha sola.

Accion:

`Aprobar y crear reserva`

### Paso 4 - Voucher enviado por WhatsApp

Pantalla:

`12.C Reserva creada`

Historia:

El canal devuelve al hotel/pasajero:

- Codigo TG-0341.
- Link de tracking.
- QR.
- Confirmacion de reserva.

Que se vende:

> El pasajero ya tiene una reserva verificable sin instalar nada.

Accion:

`Ver en despacho`

### Paso 5 - Admin operativo revisa la reserva

Pantalla:

`3.C Reserva TG-0341`

Actor:

Carla, admin operativo.

Que ve Carla:

- Reserva desde WhatsApp.
- Datos del pasajero.
- Vuelo.
- Tarifa.
- Conductor sugerido.
- Trazabilidad.
- Motivo de sugerencia.

Que se vende:

> El copiloto sugiere. Carla aprueba. La operacion mantiene control humano.

Accion:

`Aprobar y enviar a Juan`

### Paso 6 - Conductor recibe asignacion

Pantalla:

`2.C Nueva asignacion`

Actor:

Juan, conductor.

Que ve Juan:

- Viaje recomendado.
- Punto de recojo.
- Destino.
- Vuelo.
- Pasajeros.
- Tarifa.
- Boton principal: aceptar.

Que se vende:

> La app del conductor no lo abruma. Solo le da la decision correcta en el momento correcto.

Accion:

`Aceptar viaje`

### Paso 7 - Conductor va al pasajero

Pantalla:

`2.D Camino al pasajero`

Que ocurre:

El conductor ya acepto y esta yendo al Sector A.

Que se vende:

> Al aceptar, el pasajero recibe link de tracking con placa y conductor.

Accion principal para demo:

`Enviar tracking al pasajero`

### Paso 8 - Pasajero ve tracking sin app

Pantalla:

`1.G2 Conductor asignado`

Actor:

Pasajero.

Que ve:

- Juan llega en 8 minutos.
- Placa.
- Vehiculo.
- Rating.
- Mapa.
- Link compartible.

Que se vende:

> El pasajero no instala app. Solo abre un link confiable.

Accion:

`Simular llegada`

### Paso 9 - Conductor llega

Pantalla:

`1.G3 Conductor llego`

Que ve el pasajero:

- Juan esta en el punto.
- Placa ABC-123.
- Toyota Yaris blanco.
- Punto de encuentro.
- Boton para confirmar.

Accion:

`Ya lo vi`

### Paso 10 - Viaje en curso

Pantalla:

`1.G4 En viaje`

Que ve el pasajero:

- Ruta.
- ETA.
- Tarifa.
- Estado vivo.
- Opcion de reportar algo.

Que se vende:

> La operacion mantiene trazabilidad sin invadir al pasajero.

Accion:

`Ver comprobante`

### Paso 11 - Viaje finalizado

Pantalla:

`1.G5 Viaje finalizado`

Que ve:

- Comprobante.
- Monto.
- Canal de envio.
- Calificacion.
- Bienestar.

Aqui se integra bienestar naturalmente.

No se debe presentar bienestar como modulo separado. Se explica asi:

> Cuando termina el viaje, si algo quedo pendiente, Taxi Green lo atiende con trazabilidad.

Accion:

`Olvide algo en el auto`

### Paso 12 - Reportar objeto perdido

Pantalla:

`13.A Objeto perdido`

Que ocurre:

El viaje ya viene precargado:

- Reserva.
- Conductor.
- Placa.
- Vuelo.

El usuario no tiene que repetir todo.

Que se pregunta:

- Que se quedo.
- Donde pudo quedar.
- Contacto preferido.

Que se vende:

> Bienestar no es un boton decorativo. Es un flujo real de resolucion.

Accion:

`Enviar reporte`

### Paso 13 - Reporte recibido

Pantalla:

`13.B Reporte recibido`

Que ve el pasajero:

- Caso abierto.
- SLA.
- Responsable humano.
- Proximo paso.

Que se vende:

> No queda como ticket frio. Una persona toma el caso.

Accion para demo:

`Ver en cola de despacho`

### Paso 14 - Cola de bienestar del admin

Pantalla:

`13.F Cola de bienestar`

Actor:

Admin operativo.

Que ve:

- Caso de objeto perdido.
- SLA.
- Responsable.
- Prioridad.
- Estado.

Que se vende:

> El problema tambien entra a la operacion formal.

Accion:

`Abrir caso Gianella`

### Paso 15 - Resolucion de objeto perdido

Pantalla:

`13.G Resolucion de objeto perdido`

Que ve Carla:

- Timeline.
- Estado.
- Plantilla de mensaje.
- Datos del viaje.
- Acciones.

Accion:

`Contactar conductor`

### Paso 16 - Conductor recibe solicitud

Pantalla:

`13.H Conductor objeto perdido`

Que ve Juan:

- Solicitud concreta.
- Que objeto buscar.
- Donde buscar.
- Checklist simple.

Accion:

`Lo encontre`

Esto vuelve a la vista del admin para marcar resolucion.

### Paso 17 - Constancia de cierre

Pantalla:

`13.K Constancia PDF`

Que representa:

- Cierre formal.
- Historial.
- Objeto recuperado.
- Confirmacion.
- Firma o responsable.

Que se vende:

> Taxi Green puede demostrar como atendio el caso, no solo decir que lo hizo.

## 6. Flujo secundario: counter

El counter se usa si el pasajero no entra por WhatsApp o necesita atencion presencial.

Recorrido recomendado:

1. `13 Prototype`
2. `Iniciar counter`
3. `4.A Login supervisor de counter`
4. `4.B Dashboard del counter`
5. `4.C Crear reserva manual`
6. `3.C Reserva TG-0341`

Que se explica:

> El counter no es otro sistema separado. Alimenta el mismo despacho.

## 7. Flujo secundario: bienestar

Se puede mostrar bienestar de forma directa si el cliente pregunta por diferenciacion.

Recorrido recomendado:

1. `13 Prototype`
2. `Abrir objeto perdido`
3. `13.A Reportar objeto perdido`
4. `13.B Reporte recibido`
5. `13.F Cola de bienestar`
6. `13.G Resolucion`
7. `13.H Solicitud al conductor`
8. `13.K Constancia`

Pero lo ideal es mostrarlo dentro del flujo principal, despues del viaje finalizado.

## 8. Que esta construido, simulado y aplazado

### Construido en la demo Figma

- Flujo visual completo A-Z.
- Entrada multicanal.
- Simulador WhatsApp.
- Cocina del copiloto.
- Admin operativo.
- App conductor.
- Link pasajero.
- Tracking.
- Comprobante/voucher.
- Objeto perdido.
- Cola de bienestar.
- Resolucion y constancia.

### Simulado

- WhatsApp Business API real.
- Envio real de mensajes.
- Integracion real de pagos.
- SUNAT.
- Tracking GPS real.
- LLM real dentro del Figma.

### Aplazado

- App nativa pasajero.
- Biometria conductor.
- OCR avanzado.
- 10 tipologias completas de bienestar.
- Integraciones externas reales.
- Motor de asignacion productivo completo.

## 9. Como presentar la demo en reunion

### Apertura

Mostrar `00 Cover`.

Mensaje:

> Esta demo no intenta mostrar todo el producto. Muestra un flujo central bien contado: desde el canal real del cliente hasta la resolucion de un problema.

### Inicio navegable

Ir a `13 Prototype`.

Click:

`Iniciar por canal`

Mensaje:

> El pasajero no empieza descargando una app. Empieza donde ya esta: WhatsApp, web, QR o counter.

### Nucleo de operacion

Pasar por WhatsApp, admin y conductor.

Mensaje:

> El copiloto reduce errores y transcripcion manual, pero Carla mantiene control.

### Experiencia pasajero

Mostrar tracking por link.

Mensaje:

> El pasajero tiene transparencia sin friccion.

### Diferenciador

Mostrar objeto perdido.

Mensaje:

> Bienestar no es marketing. Es responder cuando algo sale mal.

### Cierre

Mostrar constancia.

Mensaje:

> La promesa es trazabilidad completa: reserva, viaje, comprobante e incidencia.

## 10. Como ejecutar el plugin

1. Abrir Figma Desktop.
2. Crear un archivo nuevo o duplicado.
3. Ir a `Plugins -> Development -> Import plugin from manifest...`.
4. Seleccionar:

   `06_DEMO_TECNICA/figma-plugin-taxigreen-master/manifest.json`

5. Ejecutar:

   `Taxi Green Master Figma Generator`

6. El plugin genera 14 paginas y deja seleccionada la pagina:

   `13 Prototype`

7. En modo Prototype, presionar Play.

## 11. Que revisar visualmente despues de generar

Revisar estas pantallas en orden:

1. `00 Cover`
2. `13 Prototype`
3. `05 Entrada y Link Pasajero / 1.A Entrada multicanal`
4. `10 Canal WhatsApp / 12.A`
5. `10 Canal WhatsApp / 12.B`
6. `10 Canal WhatsApp / 12.C`
7. `07 Admin Operativo / 3.C`
8. `06 App Conductor / 2.C`
9. `05 Entrada y Link Pasajero / 1.G2`
10. `05 Entrada y Link Pasajero / 1.G5`
11. `11 Bienestar Integrado / 13.A`
12. `11 Bienestar Integrado / 13.F`
13. `11 Bienestar Integrado / 13.G`
14. `11 Bienestar Integrado / 13.K`

Verificar:

- Que la historia empiece por canal.
- Que el admin operativo quede claro.
- Que bienestar aparezca conectado al viaje.
- Que los fondos tengan matices suaves.
- Que el flujo se entienda sin explicar demasiado.
- Que las acciones principales sean claras.
- Que no se sienta como dashboard generico.

## 12. Resumen en una linea

Este Figma cuenta como Taxi Green puede pasar de un pedido por canal natural a una operacion aeroportuaria completa, con copiloto, humano en control, conductor simple, pasajero sin app y bienestar integrado.

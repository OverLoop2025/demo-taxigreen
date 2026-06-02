# Propuesta maestra de demo — Taxi Green

**Documento:** decisión de producto, arquitectura técnica y guion comercial para la demo de preventa.
**Audiencia:** equipo de construcción de la demo + comité de decisión de Taxi Green.
**Fecha:** 2026-05-19.
**Autor:** arquitecto de software / consultor de preventa.

---

## 0. TL;DR — la apuesta en un párrafo

No vamos a construir "una app de taxi" ni un clon ligero de Uber. Vamos a construir **la versión digital del módulo físico de Taxi Green en Llegadas Puerta 1**: una app donde el pasajero internacional reserva con confianza, recibe un **código QR que opera como tarjeta de embarque del traslado**, un supervisor humano lo recibe en el aeropuerto y lo valida con un escaneo, y el administrador en Callao ve todo el ballet operativo en tiempo real desde una sola consola. La demo demuestra dos flujos en vivo (casa → aeropuerto y aeropuerto → destino) con cuatro actores sincronizados, GPS real, notificaciones push reales y pago simulado. El stack es Flutter + Next.js + NestJS + PostgreSQL/PostGIS + Socket.IO + Mapbox; construible por una persona en aproximadamente 10 a 14 días, presentable en 10 a 12 minutos, y diseñada desde el día cero para que la "cuarta vista" (multi-empresa) deje ver — sin distraer — que detrás hay un SaaS regional.

La demo no se vende como software. Se vende como **continuidad de los 23 años de Taxi Green**: misma confianza, ahora en el bolsillo del viajero.

---

## 1. Diagnóstico — el ángulo comercial real

Antes de decidir qué construir, hay que ser brutal sobre dónde está parado Taxi Green:

| Activo real | Estado | Implicancia para la demo |
|---|---|---|
| Concesión LAP en Puerta 1 (1 de 5 empresas autorizadas en el aeropuerto Jorge Chávez nuevo, 40M pax/año potenciales) | **Activo y diferenciado** | El moat. La demo lo digitaliza, no lo reemplaza. |
| Marca con 23+ años, base corporativa con aerolíneas y eventos | **Activo subutilizado** | El cliente B2B paga quincenal por Excel + correo hoy. Hay revenue recurrente esperando ser ordenado. |
| Web `/green/index.php` (PHP + jQuery 1.11 + Leaflet) | **Funcional pero obsoleta** | No tiene API. No es base para móvil. La demo no la toca. |
| Vitrina WordPress `/t/` | **Bonita pero no opera** | Irrelevante para la demo. |
| App móvil prometida | **Rota** (iOS 404, Android publicada como persona natural sin reseñas) | Crisis de credibilidad. La demo viene a llenar exactamente este hueco. |
| Facturación electrónica (Fenbo Digital / Tranzas) | **Tercerizada y operando** | No replicamos SUNAT. Simulamos PDF visualmente para demo, integramos real si hay venta. |
| Dispatch | **Manual por call center + WhatsApp interno** | La demo lo formaliza como flujo digital coordinado, no lo reemplaza. |

**Lo que esto significa estratégicamente:** Taxi Green no necesita una app más bonita. Necesita **una app que demuestre, en 10 minutos de presentación, que su modelo operativo actual cabe limpio dentro de un sistema digital sin perder lo que lo hace especial** (la persona humana en Puerta 1, la asignación supervisada, la trazabilidad, la factura electrónica con RUC). La demo tiene que decir: *"no venimos a romper lo que hacen; venimos a ordenarlo y proyectarlo al 2026 y más allá."*

Ese mensaje es el que defenderá el ticket comercial frente a inDrive/Uber/Cabify y abrirá la conversación corporativa, que es donde está el revenue de verdad.

---

## 2. La decisión central — qué demo se construye

Después de cruzar la voz directa del cliente (transcripción de Raúl), el diagnóstico técnico principal y la visión SaaS de fondo, la demo correcta es esta:

> **Una app móvil multi-rol (pasajero y conductor en una sola codebase) más un panel web operativo (administrador y supervisor de aeropuerto), construida sobre un backend único en tiempo real, que ejecuta de extremo a extremo dos flujos de reserva — casa→aeropuerto y aeropuerto→destino — con cuatro actores sincronizados, GPS funcional, generación de QR como tarjeta de embarque del traslado, asignación separada de conductor y unidad, validación humana en el aeropuerto y comprobante electrónico simulado al cierre.**

Lo que **no** vamos a construir en la demo (y por qué):

- **No** marketplace abierto de conductores con oferta/contraoferta tipo Qorinti/inDrive. Taxi Green no opera así, su valor es despacho controlado.
- **No** facturación electrónica real contra Fenbo/SUNAT. Es trabajo de proyecto, no de preventa.
- **No** pagos reales (OpenPay/Yape/Plin). El cliente fue explícito: "todo simulado".
- **No** dos apps móviles separadas. Una sola app que muta según rol (pasajero/conductor) — esto ahorra trabajo y refuerza la narrativa de plataforma única.
- **No** microservicios. El cliente lo sugirió, pero para una demo —y honestamente para un V1— es overengineering. Un backend modular monolítico bien organizado es superior. Lo justifico en §10.
- **No** dashboards corporativos B2B completos. Sí dejamos visible una pista (cuarta vista) que insinúa la dirección SaaS para que el cliente pregunte por ella.

---

## 3. La historia que la demo debe contar

Toda demo memorable es una **narrativa**, no un tour de features. La de Taxi Green es esta:

> **Ana**, ejecutiva de una multinacional que aterriza en Lima a las 23:40 desde Madrid, ya tiene reservado su Taxi Green desde hace dos días. Su empresa tiene convenio. Cuando aterriza, recibe un push en su celular: *"Tu Taxi Green te espera en Puerta 1, Diego con uniforme y tablet va a recibirte. Tu código de embarque es TG-2026-04829."* En el módulo, Diego (supervisor) escanea el QR del celular de Ana, le dice *"bienvenida señora, su conductor es Luis con la camioneta de placa BTW-431, lo acompaño"*, y todo eso queda registrado en el panel central en Callao. Luis arranca, Ana puede compartir la ruta con su esposo en Madrid, el viaje termina, llega la boleta electrónica al correo. Total: 22 minutos. Cero llamadas. Cero fricción. Cero ambigüedad sobre quién pagó qué.

Esa es la historia. **El protagonista no es la app: es la confianza de Taxi Green proyectada a 2026.** La app es solo el escenario.

---

## 4. Los cuatro actores y sus vistas

| Rol | Plataforma | Lo que ve en la demo | Por qué importa |
|---|---|---|---|
| **Pasajero** | App móvil (Flutter) | Reserva, mapa, conductor, ETA, QR, pago, comprobante, historial, compartir viaje | Es la cara visible al cliente final. Donde se mide el "wow". |
| **Conductor** | Misma app móvil (Flutter, modo conductor) | Reservas asignadas, navegación, estados, comunicación con central | Demuestra que el conductor afiliado adopta la herramienta sin doble app. |
| **Administrador Taxi Green** | Panel web (Next.js) | Tablero de reservas en vivo, mapa de flota, asignación de conductor + unidad, métricas | Es la consola que reemplaza WhatsApp interno y call center descoordinado. El comité de decisión vivirá en esta pantalla. |
| **Supervisor en aeropuerto** | Panel web móvil (tablet en Puerta 1) | Cola de pasajeros llegando por vuelo, escaneo de QR, asignación in-situ | La pieza que **nadie más en el mercado puede ofrecer**. Es la digitalización del activo físico de la concesión LAP. |

> Decisión de diseño explícita: el supervisor del aeropuerto y el admin de Callao usan el mismo panel web con permisos distintos. Es la misma SPA con dos sub-vistas, no dos productos. Eso simplifica el código y refuerza la coherencia visual.

La "cuarta vista" que mencionó Raúl en la transcripción (administrador de plataforma SaaS para vender el sistema a otras empresas) **no se construye en la demo**, pero se deja visible como ítem deshabilitado en el menú del admin con la etiqueta *"Multi-empresa (próximamente)"*. Esa sola línea de menú es el anzuelo SaaS.

---

## 5. Flujo protagonista #1 — Casa → Aeropuerto

Construido por completo, en vivo, con sincronización real entre los cuatro actores. Pasos visibles:

1. **Pasajero abre app, inicia sesión** (correo+contraseña; usuarios precargados, no hay onboarding real en la demo).
2. **Pasajero solicita "Llévame al aeropuerto"**. La app pide permiso de GPS (real), detecta ubicación, muestra mapa centrado.
3. **Pasajero define destino** — autocomplete con Mapbox Search o Google Places, sugerencia top "Aeropuerto Internacional Jorge Chávez". El campo viene pre-rellenado pero editable.
4. **Pasajero elige horario** ("recógeme a las 22:00, mi vuelo sale a la 01:00") y **tipo de unidad** (Sedán / Camioneta / Van / Van Master). El monto se recalcula al cambiar tipo.
5. **Pasajero decide boleta o factura**. Si factura: campos RUC + Razón Social.
6. **Pasajero pulsa "Reservar"**. Aparece pasarela simulada con tabs: Tarjeta / Yape / Plin / Transferencia. Animación de procesamiento (2.5 s). Confirmación verde con check.
7. **App genera código de reserva + QR firmado** y navega a "Mis reservas". El QR contiene un payload HMAC-firmado en backend con: `reservaId | pasajeroId | timestamp | hash`.
8. **El admin en el panel web ve la reserva entrar en vivo** (sin recargar la página — vía WebSocket). Toast de notificación, sonido suave, contador del badge "Pendientes de asignar" incrementa.
9. **Admin asigna conductor y unidad por separado** (campo conductor con buscador, campo unidad con buscador; relación uno a muchos: el mismo Luis puede operar la BTW-431 esta noche y la JKL-892 mañana). Botón "Asignar y notificar".
10. **El conductor recibe push real** en su app: *"Nueva reserva asignada. Pasajero: Ana López. Recojo: 22:00 en San Isidro. Destino: Aeropuerto."*
11. **El pasajero recibe push real**: *"Tu Taxi Green tiene conductor. Luis con la camioneta BTW-431. Ver detalles."* Al abrir, ve foto del conductor, datos de la unidad, botón "Llamar", botón "WhatsApp", botón "Compartir mi viaje".
12. **A la hora del servicio**, el conductor desde su app pulsa "Iniciar viaje". El pasajero ve en su mapa al conductor moviéndose en vivo (esto es GPS real del dispositivo o simulado con interpolación de polyline si estamos en escritorio — ver §8).
13. **Pasajero puede "Compartir mi viaje"** — genera link público temporal (válido solo durante el viaje) que un tercero puede abrir en cualquier navegador y ver la ruta en vivo. *Esto es un wow factor por seguridad post-incidente 2015.*
14. **Cuando se llega al destino**, ambos confirman fin: pasajero pulsa "Llegué" y conductor pulsa "Servicio atendido". El cruce se ve en el panel admin (íconos verdes).
15. **El sistema dispara comprobante electrónico simulado** — un PDF con el look-and-feel de una boleta SUNAT real (serie, número, RUC del emisor, cliente, detalle, importe) que llega como notificación al pasajero y al correo simulado. *No se envía a Fenbo, pero el PDF es presentable.*
16. **Pasajero califica 1-5 estrellas** (servicio, conductor, unidad — tres calificaciones separadas, como pidió Raúl).
17. **Reserva pasa a estado "Cerrada — Por liquidar"** en el panel admin. Aquí termina la demo del flujo 1.

---

## 6. Flujo protagonista #2 — Aeropuerto → Destino (el "wow")

Este es el flujo que **ninguna app masiva puede demostrar**, porque depende del módulo físico en Puerta 1. Es donde la demo se diferencia de inDrive/Uber/Cabify de forma irrebatible.

1. **Pasajero (que puede estar todavía en otro país, no necesita GPS)** abre la app y pulsa "Llévame desde el aeropuerto".
2. **Origen pre-rellenado**: "Aeropuerto Internacional Jorge Chávez — Llegadas". Destino: lo escribe (ej. San Juan de Lurigancho, Estación Caja de Agua).
3. **Pasajero indica vuelo y aerolínea** ("LATAM LA2477") + hora estimada de llegada. La app puede mostrar un autocomplete de aerolíneas; el número de vuelo es texto libre.
4. **Pasajero elige tipo de unidad, boleta/factura, paga**. Mismo flujo que antes. Recibe QR.
5. **El admin en Callao ve la reserva entrar**, pero a diferencia del flujo 1 **no asigna conductor**. La asignación se hace en el aeropuerto.
6. **En el panel del supervisor de Puerta 1**, aparece la reserva en la cola "Llegadas pendientes" agrupadas por vuelo + hora. Es una tarjeta con: nombre del pasajero, vuelo, ETA, tipo de unidad reservada, foto del pasajero si la subió al registrarse.
7. **Cuando el pasajero llega físicamente**, busca a la persona de Taxi Green con su cartel. El supervisor le dice *"¿señor López? ¿me muestra su código?"* — el pasajero abre la app, muestra el QR.
8. **Supervisor escanea con la cámara de la tablet** (el panel web usa la cámara del navegador vía `getUserMedia`). El sistema valida el QR contra el backend (HMAC + lookup). Aparece check verde, datos del pasajero, datos de la reserva.
9. **El supervisor asigna conductor + unidad en ese momento**, desde la misma pantalla. La lista de conductores muestra solo los que están marcados como "disponibles en aeropuerto" en sus apps.
10. **El conductor recibe push y aparece en módulo**. El supervisor acompaña al pasajero hasta el conductor. Se ven en la app las identidades cruzadas. *Opcional — el conductor también escanea el QR del pasajero como contra-validación, satisfaciendo el "duty of care" corporativo.*
11. **El viaje arranca y se ejecuta exactamente como el flujo 1**, hasta el comprobante final.

> Este flujo es la demostración más fuerte de todo el documento. Cuando el comité de Taxi Green lo vea, va a entender que la app no compite con Uber — **es la pieza tecnológica que les permite cobrar más caro que Uber porque ningún Uber puede tener un humano con tablet en Puerta 1**.

---

## 7. Mapa de qué es real y qué es simulado

La demo gana credibilidad cuando el cliente puede tocar lo que es real. Pierde credibilidad cuando algo simulado se presenta como real. Por eso, esta tabla es contrato:

| Componente | Estado en demo | Razón |
|---|---|---|
| GPS, mapa, ETA, distancia, ruta | **Real** | Lo exigió Raúl explícitamente. Diferenciador percibido. |
| Autenticación de los 4 roles | **Real** (con usuarios precargados) | JWT real, sesiones reales. Da seriedad. |
| Generación y validación de QR | **Real** | Es la pieza de seguridad. Tiene que aguantar escaneo. |
| Notificaciones push | **Real** (vía FCM) | "Magia" visible en la demo cuando suena el push del conductor. |
| Real-time entre dispositivos (cambios de estado, asignación) | **Real** (vía WebSocket) | Lo que hace que la demo se sienta viva. |
| Mapa del conductor moviéndose | **Real si hay dispositivos en movimiento**, simulado en escritorio con interpolación de polyline a velocidad de ~30 km/h | Truco aceptado, queda natural. |
| Compartir viaje vía link público | **Real** | Wow factor de seguridad. |
| Pasarela de pago | **Simulada** (UI bonita + animación + delay + check verde) | Cliente fue explícito. |
| Comprobante electrónico | **Simulado** (PDF generado localmente con apariencia SUNAT real) | Cliente fue explícito. |
| Integración Fenbo / Tranzas | **No existe** | Trabajo de proyecto, no de demo. |
| Empresas corporativas | **Data semilla visible en panel** | Insinúa SaaS sin construirlo. |
| Multi-empresa real | **No existe** (placeholder en menú) | Anzuelo deliberado para que el cliente pregunte. |
| Lost & Found | **No existe** | Distrae del flujo principal. Se menciona en roadmap. |

Regla de oro: **si algo está simulado, está simulado bien**. Una pasarela de pago falsa pero con `Procesando...` durante 2.5 s y check animado vende. Una pasarela falsa con click instantáneo no.

---

## 8. Arquitectura técnica — la decisión de fondo

### 8.1 Diagrama de alto nivel

```
   ┌─────────────────┐     ┌─────────────────┐
   │  App Flutter    │     │  Panel Web      │
   │  (pasajero +    │     │  Next.js 15     │
   │   conductor)    │     │  (admin +       │
   │                 │     │   supervisor)   │
   └────────┬────────┘     └────────┬────────┘
            │                       │
            │   REST + WebSocket    │
            └───────────┬───────────┘
                        │
              ┌─────────▼──────────┐
              │   API NestJS       │
              │   monolito modular │
              │   ┌──────────────┐ │
              │   │ Auth (JWT)   │ │
              │   │ Reservas     │ │
              │   │ Asignación   │ │
              │   │ Tracking     │ │
              │   │ QR / firma   │ │
              │   │ Notif (FCM)  │ │
              │   │ Comprobantes │ │
              │   └──────────────┘ │
              └─────────┬──────────┘
                        │
        ┌───────────────┼──────────────────┐
        │               │                  │
        ▼               ▼                  ▼
  ┌───────────┐  ┌────────────┐  ┌──────────────┐
  │ Postgres  │  │  Mapbox    │  │  Firebase    │
  │ + PostGIS │  │  / Google  │  │  Cloud Msg   │
  │           │  │  Maps      │  │  (push only) │
  └───────────┘  └────────────┘  └──────────────┘
```

### 8.2 Separación lógica (no microservicios)

El cliente Raúl pidió en la transcripción que front, back y DB pudieran vivir en distintos proveedores cloud y mencionó microservicios. **Le damos lo que pidió en espíritu sin pagar el costo de microservicios reales:**

- El **frontend móvil** es un proyecto Flutter independiente — deployable a iOS/Android stores, hospedable como build externo.
- El **frontend web** es un proyecto Next.js independiente — deployable a Vercel, Railway, Netlify.
- El **backend** es un solo servicio NestJS — modular por dominio (módulos `auth`, `reservas`, `tracking`, etc.), deployable a Railway, DigitalOcean o cualquier VPS.
- La **base de datos** es PostgreSQL gestionada — Supabase / Neon / DigitalOcean Managed Database.

Esto cumple "front, back y DB separados" y "puede vivir en distintas nubes" sin la complejidad y latencia de microservicios reales. Cuando el cliente pregunte por microservicios en la presentación, la respuesta honesta es: *"Hoy el sistema está estructurado en módulos internos que pueden extraerse como microservicios cuando el volumen lo exija — pero hacerlo desde el día 1 cuesta tiempo y dinero sin beneficio."*

### 8.3 Real-time

Socket.IO conecta:
- Pasajero ↔ backend (cambios de estado de su reserva, ubicación del conductor).
- Conductor ↔ backend (nueva asignación, cancelación, instrucciones).
- Admin/supervisor ↔ backend (toda reserva nueva, cambio de estado, geolocalización de flota).

Cada cliente se suscribe a las "rooms" que le importan (su userId, sus reservas, todo el tenant si es admin). El servidor empuja diffs, no estados completos.

### 8.4 Despliegue para la demo

Todo corre **local** durante el desarrollo, con `docker-compose` levantando Postgres + NestJS en dos comandos. Para la presentación real al cliente, se hace deploy a:
- Backend + DB → **Railway** (un click, plan gratuito alcanza para demo).
- Panel web → **Vercel** (un click).
- App móvil → **APK firmado para Android** (instalable directamente) + **build TestFlight para iOS** si hay cuenta Apple Developer; alternativa: emulador iOS en una Mac durante la demo.

Costo total de hosting para preventa: **menos de USD 10/mes**. Cero en muchos casos. Cumple el mandato de Raúl de austeridad económica.

---

## 9. Modelo de datos (núcleo)

Tablas mínimas necesarias para la demo. Diseñado para crecer hacia SaaS multi-tenant sin reescribir.

```
usuarios            (id, email, password_hash, nombre, telefono, foto_url,
                     rol, empresa_id_nullable, creado_en)
empresas            (id, ruc, razon_social, direccion_fiscal, telefono,
                     contacto_principal, creado_en)         -- semilla
conductores         (id, usuario_id, dni, licencia_numero, licencia_categoria,
                     licencia_vencimiento, foto_url, disponible, en_aeropuerto,
                     calificacion_promedio)
unidades            (id, placa, marca, modelo, anio, tipo, capacidad_pax,
                     soat_vencimiento, foto_url, activa)
reservas            (id, codigo_publico, pasajero_id, empresa_id_nullable,
                     origen_lat, origen_lng, origen_label,
                     destino_lat, destino_lng, destino_label,
                     fecha_servicio, tipo_unidad_solicitada, pasajeros,
                     maletas, tarifa, peaje, comprobante_tipo, ruc_factura,
                     razon_social_factura, vuelo_numero, vuelo_aerolinea,
                     vuelo_eta, qr_payload, qr_hmac, estado,
                     conductor_asignado_id, unidad_asignada_id,
                     creada_en, actualizada_en)
viajes              (id, reserva_id, inicio_real, fin_real,
                     distancia_km, duracion_min, polyline_recorrida)
posiciones_conductor(id, conductor_id, lat, lng, heading, velocidad,
                     reportada_en)            -- alta cardinalidad, índice tiempo
calificaciones      (id, reserva_id, calificacion_servicio,
                     calificacion_conductor, calificacion_unidad, comentario)
comprobantes        (id, reserva_id, tipo, serie, numero, total, pdf_url,
                     emitido_en, mock_sunat_id)
notificaciones      (id, usuario_id, tipo, payload, leida, creada_en)
auditoria           (id, actor_id, accion, recurso_tipo, recurso_id,
                     payload, ip, creada_en)
```

**Decisión sobre estados de reserva** (máquina de estados explícita; clave para que el panel admin sea legible):

```
PENDIENTE_ASIGNACION  →  ASIGNADA  →  EN_CAMINO_RECOJO  →
EN_CURSO  →  FINALIZADA  →  CALIFICADA  →  LIQUIDADA
                                ↘  CANCELADA
                                ↘  NO_SHOW
```

Los estados se muestran como tags de color en el panel admin (rojo / amarillo / verde / gris). Esto da legibilidad operativa inmediata cuando el comité vea la pantalla.

**Por qué PostgreSQL y no MongoDB** (la conversación que hay que tener con Raúl):

El cliente sugirió Mongo "porque tengo buenas referencias" y abrió la puerta a otra propuesta: *"tal vez tengas una mejor propuesta y ahí ya me cuentas"*. Le damos la mejor propuesta:

| Criterio | PostgreSQL (+ PostGIS) | MongoDB |
|---|---|---|
| Naturaleza de los datos (reservas, asignaciones, conductores, unidades) | Relacional puro — JOINs naturales | Forzar referencias en documentos |
| Geolocalización (consultas "¿qué conductores están a 2 km del aeropuerto?") | PostGIS, estándar oro del sector (Uber y Lyft lo usan) | Geo-índices existen pero pobres |
| Transacciones ACID (asignar conductor sin race conditions) | Nativo, robusto | Posible pero más caro |
| Costo de hosting (Supabase, Neon, Railway free tier) | Gratis para demo | Atlas free tier limitado |
| Comunidad peruana | Enorme | Existe pero menor |
| Escalabilidad para SaaS multi-tenant | Row-level security nativo | Requiere lógica en app |

**Conclusión:** PostgreSQL es la decisión técnica correcta. Si Raúl insiste en Mongo después de escuchar este argumento, la alternativa de respaldo es Firebase Firestore (igual de "no relacional", real-time nativo, lo que usó Qorinti con éxito). MongoDB self-hosted en VPS es la peor de las tres para esta demo y hay que decirlo.

---

## 10. Stack tecnológico — decisión final y por qué

| Capa | Tecnología elegida | Por qué |
|---|---|---|
| **App móvil** | **Flutter 3.x + Dart** | Una sola codebase iOS+Android, animaciones de primera, mapa fluido, el mismo stack que validó Qorinti (referencia funcional ya probada). React Native con Expo es alternativa válida si el equipo viene de JS. |
| **Panel web** | **Next.js 15 + TypeScript + Tailwind + shadcn/ui** | Calidad visual seria desde el día 1. shadcn/ui da componentes accesibles y elegantes sin pelear con CSS. SSR para el dashboard, client components para las pantallas reactivas. |
| **Backend** | **NestJS (Node + TypeScript)** | Modular por design, WebSocket gateway de primera clase, ecosistema gigante, fácil de contratar talento, mismo lenguaje que el frontend (productividad). FastAPI (Python) es la alternativa válida si el equipo es Python-first. |
| **Base de datos** | **PostgreSQL 16 + PostGIS** | Justificado en §9. |
| **Real-time** | **Socket.IO sobre el gateway NestJS** | Reconexión automática, rooms, namespaces, fallback a polling si la red falla — todo gratis. |
| **Push notifications** | **Firebase Cloud Messaging (FCM)** | El único uso de Firebase. Gratis, multiplataforma, configuración de 30 min. |
| **Mapas y geocoding** | **Mapbox GL** (preferido) o **Google Maps** | Mapbox da mejor estética nocturna y precios saludables. Google es alternativa si la búsqueda de direcciones en Lima resulta más precisa (validar en discovery del proyecto). En demo, free tier cubre todo. |
| **Autenticación** | **JWT + bcrypt** (custom en NestJS, no Auth0) | Suficiente para demo, mantiene control. Login con Google/Facebook se finge en demo (botones decorativos). |
| **Generación de QR** | **`qrcode` (Node)** + HMAC SHA-256 server-side | El payload del QR está firmado para evitar clonado. La validación es server-side. |
| **Generación de comprobantes** | **Puppeteer** (HTML → PDF) o **pdfkit** | HTML/CSS es más rápido para iterar el diseño del PDF. |
| **Diseño** | Figma (mockup de alta fidelidad antes de codear) | Acelera la build. Reutilizable como entregable comercial. |
| **Hosting demo** | Backend en **Railway**, DB en **Supabase** (free tier), web en **Vercel**, mobile en **Firebase App Distribution** (APK + TestFlight) | Cero costo a baja escala. Deploy con git push. |
| **Versionado y CI** | GitHub + GitHub Actions (lint + build) | Estándar. |
| **Observabilidad demo-grade** | Logs de NestJS a consola + Sentry free tier | Suficiente para detectar bugs en preventa. |

### 10.1 Lo que dijimos no al cliente y cómo defenderlo

Raúl mencionó tres cosas que **no** vamos a hacer y necesita argumento:

1. **Mongo** → argumentado en §9. Le damos PostgreSQL.
2. **Microservicios** → argumentado en §8.2. Le damos monolito modular, escalable a microservicios cuando exista.
3. **Front en Google Cloud, back en Azure, DB en Mongo Atlas** → la idea de fondo (independencia de proveedor) es correcta. Le damos eso vía dockerización + arquitectura desacoplada, sin pagar el costo de coordinar tres clouds para una demo.

La forma de comunicárselo es respetuosa y senior: *"Tomé en cuenta tus tres sugerencias. En lugar de Mongo elegí PostgreSQL por estas razones específicas vinculadas a geolocalización; en lugar de microservicios elegí un monolito modular que puede partirse cuando el volumen lo justifique; la independencia entre componentes que pediste sí está, sólo que servida con menos plomería. Si alguna de estas decisiones no te convence, las repasamos."*

---

## 11. Diseño visual — la primera impresión

La demo se juega también en lo visual. La paleta y la tipografía deben sentirse **premium peruano**, no Uber genérico.

- **Paleta**: tomar los verdes oficiales de Taxi Green del sitio actual (verde institucional como primario), blanco como base de pantallas, negro carbón para texto, dorado suave como acento premium (uso económico). Evitar el verde plano y saturado de "taxi"; bajarle saturación, elevar elegancia. Modo oscuro disponible para tracking nocturno (refuerza la idea de aeropuerto a la madrugada).
- **Tipografía**: Inter o IBM Plex Sans para UI, Manrope o Sora para titulares. Cero Comic Sans, cero fuentes con corazón en Material Design genérico.
- **Iconografía**: Lucide o Phosphor. Consistencia absoluta.
- **Animaciones**: transiciones de pantalla suaves (Hero animations en Flutter), marcador del auto interpolado suave, micro-interacciones en botones (press depth de 4 px), check animado en confirmaciones.
- **Componentes clave que tienen que estar pulidos**:
  - Card de "reserva confirmada" con QR centrado (es el equivalente a la tarjeta de embarque y debe sentirse así — bordes redondeados, sombra suave, peso visual).
  - Mapa de tracking con polyline animada, marcador de auto con foto del conductor flotando arriba.
  - Tarjeta del conductor asignado (foto grande, nombre, calificación, placa, botones de contacto).
  - Modal de pago con apariencia de pasarela real (logos Yape/Plin/Visa, máscara de tarjeta, animación de procesamiento).
  - Panel admin con tablero estilo Linear/Notion — filtros como pills, lista densa pero respirada, mapa lateral con la flota.

Antes de codear: **una pasada completa por Figma** (4-6 horas) ahorra 2 días de retrabajo. Ese mockup, además, es entregable comercial independiente.

---

## 12. Plan de construcción — días, no semanas

Asumiendo un desarrollador a tiempo completo con asistencia de IA generativa (lo que el propio José mencionó tener), distribución realista:

| Día | Hito | Por qué este orden |
|---|---|---|
| 1 | Mockup Figma de las 12 pantallas core + decisiones visuales finales | Sin esto, codear es picar al aire |
| 2 | Esqueleto NestJS (modulos, auth JWT, esquema Prisma o TypeORM, seed con usuarios + empresas + unidades + conductores) | Sin backend no hay nada |
| 3 | App Flutter — navegación, autenticación, splash, login, home; panel web — autenticación, layout, sidebar | Cimientos visibles |
| 4 | Flujo reserva pasajero — pantallas, mapa, geocoder, cálculo de tarifa mock | El corazón del producto |
| 5 | Pasarela simulada + generación de QR + pantalla "Mis reservas" + ticket de embarque | Cierre del lado pasajero |
| 6 | Panel admin — lista de reservas en vivo (WebSocket), asignación conductor+unidad, notificaciones | El lado operativo |
| 7 | App Flutter modo conductor — recepción de asignación, push real (FCM), navegación, estados | La capa que cierra el bucle |
| 8 | Tracking en vivo — emisión de posición desde el conductor, recepción en pasajero y admin | El "wow" visual |
| 9 | Flujo aeropuerto → destino + panel supervisor + escaneo de QR con cámara | El diferenciador comercial |
| 10 | Comprobante PDF + calificación + cierre de viaje + compartir viaje (link público) | Pulido del cierre |
| 11 | Polish visual + animaciones + data semilla creíble + ajustes UX | El día que separa una demo de una buena demo |
| 12 | Deploy + APK + ensayo de la presentación + grabación de respaldo en video | Plan B si algo falla en vivo |
| 13-14 | Buffer para imprevistos y refinamiento | Siempre se necesita |

**10 días útiles + 4 de buffer = 14 días calendario** para llegar a una demo presentable y robusta. Si el plazo aprieta, se puede cortar el flujo aeropuerto→destino al flujo casa→aeropuerto y prometerlo para la siguiente sesión — pero eso debilita la venta.

---

## 13. Qué rescatar de Qorinti (y qué no)

Qorinti dejó pistas técnicas y funcionales útiles. La regla: **rescatar patrones técnicos validados, descartar el modelo de negocio**.

| De Qorinti | ¿Lo usamos? | Por qué |
|---|---|---|
| Flutter + Firebase + Google Maps como stack móvil | **Como referencia técnica** — confirma que Flutter funciona, validamos los mismos patrones aunque elijamos backend propio | Reduce riesgo técnico |
| Registro de conductor con DNI + RUC opcional + licencia + categoría + vencimiento | **Sí, idéntico** | Es el set correcto para PE |
| Registro de vehículo con placa + marca + modelo + año + tipo + SOAT + vencimiento | **Sí, idéntico** | Mismo dominio |
| Validación de formato de placa con guion | **Sí** | Detalle pequeño que vende rigor |
| Aprobación administrativa de conductor y vehículo | **No en la demo** — asumimos preregistrados (Raúl lo pidió así explícitamente) | "Detrás se asume que existen" |
| Subasta / contraoferta del conductor (precio variable por viaje) | **NO** — descartar | Taxi Green opera con tarifa fija + dispatch centralizado. Esto rompe su modelo. |
| Calificación de conductor y cliente | **Sí** — extendida a tres calificaciones (servicio, conductor, unidad) | Lo pidió Raúl |
| Pago con Yape/Plin/efectivo | **Sí, simulado** | Estándar peruano |
| Comisión por servicio del conductor a la plataforma | **No en la demo** | Distrae. Es flujo de pago al conductor, no de venta. |
| Panel admin con pestañas pendientes/aprobados | **Sí** — adaptado a estados de reserva | Es el lenguaje correcto |
| Reportes exportables a Excel | **Sólo placeholder** | No es protagonista de la venta |
| Detección de tipo de servicio (Taxi / Carga / Mudanza / Carga pesada) | **NO** | Taxi Green no hace carga. Confunde el mensaje. |
| Múltiples paradas | **Sí, pero opcional y no en flujo principal** | Realista para servicios punto-a-punto |
| ETA estática como placeholder | **NO** — la nuestra es real | El cliente lo pidió como exigencia explícita |

---

## 14. La visión SaaS sin distraer

Raúl mencionó que la demo se va a vender "como plataforma" y que existe una eventual "cuarta vista" para administradores de plataforma. El documento `primeras_ideas.pdf` desarrolla todo un caso de SaaS B2B2C con QR-Voucher corporativo, factura SUNAT consolidada y white-label.

**Cómo se metaboliza esa visión en la demo sin distraer la venta inicial:**

1. **Tag visible "Próximamente: Multi-empresa"** en el menú del admin. Genera la pregunta.
2. **Selector de empresa** en el panel admin con dropdown que muestra solamente "Taxi Green" pero está claramente preparado para más. El cliente lo nota.
3. **Modelo de datos preparado** desde el día 1 con `empresa_id` en las tablas principales (row-level multi-tenant). No se construye la lógica, pero el esquema lo soporta.
4. **Slide final del deck comercial**: una sola lámina que dice *"Imagina este sistema operando para Mitsoo, CMV, Taxi365, Remisse San Borja y Moobiz, con Taxi Green como benchmark del estándar."* Suficiente. El cliente decide si quiere abrir esa conversación.

No se construye el SaaS en la demo. No se vende el SaaS en la primera reunión. Se siembra. La pregunta "¿y esto se podría vender a otras empresas?" debe salir del cliente.

---

## 15. Guion de la presentación (10-12 minutos)

| Minuto | Bloque | Punto crítico |
|---|---|---|
| 0:00–0:45 | **Contexto y promesa**: "Vamos a mostrarles cómo se vería Taxi Green operando en 2027 sin romper lo que hoy funciona." | Anclar respeto a los 23 años de la marca |
| 0:45–1:30 | **El problema desde la voz del viajero**: "Ana, ejecutiva extranjera, aterriza a las 23:40." | Empatía inmediata. El comité piensa "yo también he sido Ana." |
| 1:30–4:30 | **Flujo casa → aeropuerto en vivo**, en 4 pantallas simultáneas (pasajero, conductor, admin, mapa) | El ballet. Mostrar la magia de la sincronización en tiempo real. |
| 4:30–5:00 | **Pausa narrativa**: "Hasta aquí, lo que tenemos es una app de taxi premium. Lo que viene es lo que ninguna app de taxi puede ofrecer." | Marcar el quiebre. |
| 5:00–8:30 | **Flujo aeropuerto → destino en vivo** con el supervisor escaneando QR. Cámara en vivo de la tablet. | El golpe. Aquí se gana el proyecto. |
| 8:30–9:30 | **Vista del administrador**: panel completo, métricas en vivo, mapa de flota, filtros, una sola consola. | El comprador es probablemente operativo. Aquí es donde toma notas. |
| 9:30–10:30 | **Cierre comercial + visión**: "Esto que ven está construido en X días, sobre un stack que pueden mantener internamente o con nosotros. Y está preparado, desde el día 1, para que el día que decidan ofrecer este sistema a otras 5 o 10 empresas del rubro, ya esté listo." | El anzuelo SaaS. |
| 10:30–12:00 | **Q&A** | Anticipar: Mongo/microservicios (explicado), costo, plazo, integración Fenbo, app actual desactivada, exclusividad. |

> Recomendación táctica: **grabar la demo de respaldo en video la noche anterior**. Si el WiFi de la reunión falla o el push tarda, se sigue con video sin perder ritmo. Una demo que se cae en vivo cuesta más que cualquier inversión en el plan B.

---

## 16. Anti-patrones que mataremos antes de que aparezcan

- **No** mostrar pantallas de configuración, settings, "Acerca de", términos y condiciones, recuperación de contraseña. Distraen.
- **No** mostrar formularios de registro completos. Se asume registrado.
- **No** explicar la arquitectura técnica al inicio. Va al final, si preguntan.
- **No** prometer plazos sin haber visto el sistema actual. Las cifras que se den son rangos.
- **No** comparar con Uber. Mencionarlo es regalarle relevancia. Decir "transporte programado premium" en lugar de "como Uber pero…".
- **No** abrir múltiples tabs durante la presentación. Cero "déjenme buscar otra cosa". Todo guionado.
- **No** mostrar bugs en vivo. Si algo falla, pasar al video de respaldo sin disculparse en exceso.
- **No** vender lo que no está construido. La cuarta vista SaaS se insinúa, no se demuestra.

---

## 17. Roadmap post-venta (si gana el proyecto)

Para que el cliente vea la demo no como un fin, sino como el inicio:

- **Fase 0 — Descubrimiento** (3 semanas): acceso al backend actual, esquema de DB, contratos con Fenbo / OpenPay, decisiones de marca, presupuesto, fecha objetivo.
- **Fase 1 — MVP V1** (3–4 meses): apps publicadas en stores, panel admin, panel supervisor, integración real con Fenbo y OpenPay, migración del flujo de reserva web `/green/`.
- **Fase 2 — Corporativo light** (2–3 meses): cuenta empresa, centros de costo, aprobaciones, reporte mensual descargable, factura consolidada quincenal.
- **Fase 3 — Operación ampliada** (4–6 meses): driver dispatch optimizado, panel de operación 24/7 con SLA, reemplazo gradual de `/green/`.
- **Fase 4 — Plataforma SaaS** (6+ meses): multi-tenant real, marca blanca, onboarding de Mitsoo / Taxi365 / Remisse San Borja como primeros clientes externos.

Cada fase es un contrato comercial separado, con entregables y métricas. Esto le da al cliente control y al equipo previsibilidad.

---

## 18. Riesgos y contingencias

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Demo se cae en vivo (red, push, geocoder) | Media | Video de respaldo grabado |
| Cliente insiste en Mongo / microservicios | Media-alta | Argumentación preparada en §9 y §10.1; alternativa Firestore como concesión digerible |
| Cliente pide plazo / costo en la reunión | Alta | Respuesta preparada: rango sí, cifra exacta no sin discovery |
| Cliente pide ver código fuente en vivo | Baja | Tener el repo abierto, listo para mostrar estructura modular del backend |
| FCM no entrega push en la red del cliente | Baja-media | WebSocket como fallback visual; el toast aparece igual aunque el push no llegue |
| GPS del dispositivo demo no funciona en interior | Media | Simulador de ubicación preparado, marcador interpolado por polyline |
| Cliente pregunta por integración con Fenbo en vivo | Alta | Mostrar el PDF mock; explicar que la integración es trivial técnicamente y ya se hizo en sistemas similares; ofrecer hablar con su contacto en Fenbo |
| Cliente quiere agregar features en la reunión | Alta | Decir sí a todo conceptualmente, anotar, no comprometer alcance ni precio |

---

## 19. Decisiones que el cliente debe tomar antes de la siguiente reunión (si hay venta)

Aunque la demo es preventa y libre de compromisos, vale dejar plantadas las preguntas que decidirán plazos y precio en el momento que se firme:

1. ¿La app oficial de Taxi Green hoy en stores se puede recuperar o se publica nueva?
2. ¿La cuenta de Apple Developer / Google Play está vigente? ¿Está a nombre de la empresa o de Maurodev / Guissepi Rodriguez como persona natural?
3. ¿Existe documentación o acceso al backend PHP actual?
4. ¿La integración debe ser con Fenbo Digital (su PSE actual) o quieren evaluar Nubefact / Efact?
5. ¿OpenPay sigue siendo su pasarela o se evalúa Izipay/Niubiz directos?
6. ¿Quieren cuenta corporativa (B2B) desde V1 o se posterga a V1.5?
7. ¿La app debe estar en inglés desde V1 dado su tráfico aeroportuario internacional?
8. ¿Cuántos conductores tienen smartphone con datos? ¿Cuántos hablan inglés básico?
9. ¿Aceptan que el dispatch siga siendo manual en V1 o quieren algoritmo de asignación automática desde el inicio?
10. ¿Hay rango presupuestal de referencia? ¿Hay fecha objetivo (temporada alta de turismo, evento)?

---

## 20. La intención final, dicha sin adornos

La meta de esta demo no es ganarle a Uber. Es **dejar a Taxi Green sin excusas para no modernizarse**, porque después de verla el comité ya no podrá decir "no sabemos cómo se vería". Lo van a saber, lo van a tocar, y van a entender — sin que nadie se los explique — que la versión digital de su módulo Puerta 1 es **el siguiente paso natural** de sus 23 años de historia.

Si después de los 12 minutos de demo alguien en la sala dice *"¿cuándo lo podemos tener?"* — el proyecto está cerrado. Si dicen *"esto entiende cómo trabajamos"* — el proyecto está cerrado dos veces. Hacia eso construimos cada decisión de este documento.

---

*Fin de la propuesta maestra. Documento vivo: cualquier decisión técnica o comercial aquí puede revisarse antes de iniciar la construcción, pero no después.*

# Plan de Software — Demo Taxi Green (Copiloto Operativo + Capa de Bienestar)

**Versión:** 1.0
**Fecha:** 2026-05-23
**Autor:** Análisis técnico senior (arquitectura full-stack + diseño + producto), neutral, contrastado contra `05_FINAL/vision_final_perfecta.md`, `04_SINTESIS_TRABAJO/vision_final_taxigreen_refinada.md`, `02_PROPUESTAS_PREVIAS/PROPUESTA_DEMO.md` y `04_SINTESIS_TRABAJO/que_presentar_a_taxigreen_refinada.md`.
**Naturaleza:** documento técnico interno. Es la **especificación de construcción de la demo real** (no Nivel 0 ni Nivel 1; un Nivel 2 ambicioso pero defendible) que se llevará al cliente.
**Compañero:** `DISEÑO_UI_DETALLADO.md` — blueprint exhaustivo pantalla por pantalla para Figma navegable y posterior implementación.
**Estándar epistémico:** mantenemos las etiquetas (`Evidencia directa`, `Dicho en reunión`, `Propuesta previa`, `Investigación IA`, `Inferencia`, `Hipótesis`, `Por validar`, `Recomendación provisional`). Toda decisión técnica fuerte va con su justificación; toda decisión débil queda marcada como hipótesis a revalidar.

---

## 0. TL;DR — la apuesta de la demo en un párrafo

Construimos el **Copiloto Operativo de Taxi Green** como un sistema real, no maqueta: monolito modular en **Next.js 15 + TypeScript + Prisma + PostgreSQL/PostGIS**, con **Socket.IO** para tiempo real, **Claude API (Anthropic)** para extracción de reservas en lenguaje natural, **Mapbox** para mapas, **shadcn/ui + Tailwind** para UI, **Firebase Cloud Messaging** para push, **Puppeteer** para PDFs y un **simulador de WhatsApp** integrado que demuestra la ingesta multicanal sin necesidad de WhatsApp Business API. Sobre eso montamos las **cinco caras** del copiloto (pasajero por link/QR sin app, conductor PWA, despachador admin, supervisor counter aeropuerto, empresa cliente) y, **atravesándolas todas**, la **Capa de Bienestar / Resolución de Incidencias** (objeto olvidado, queja, emergencia) con número de caso, SLA visible, escalamiento humano automático en categorías sensibles y cierre con confirmación del usuario. Construible por un senior con asistencia de IA generativa en **18-22 días calendario** con buffer. Presentable en **15 minutos con dos arcos narrativos** (operación normal + resolución de incidencia). Las únicas piezas simuladas son las que el sentido común dicta: pasarela de pago (con UI de pasarela real, animación, check), emisión SUNAT vía PDF que imita el formato real, y la voz humana de incidencias críticas.

---

## 1. Alcance — la regla de oro

La regla es una sola: **cada feature que entra debe responder a "¿qué actor sufre menos por esto y cómo lo demostramos en 90 segundos al cliente?"**. Si la respuesta es ambigua, queda fuera.

### 1.1. Lo que se construye (demo funcional real)

| Capacidad | Cara(s) implicada(s) | Estado |
|---|---|---|
| Reserva por web (ciudad → aeropuerto / aeropuerto → destino) | Pasajero | **Real** |
| Reserva por simulador WhatsApp (extracción con Claude API) | Despacho + ingesta | **Real con LLM real** |
| Voucher con QR firmado HMAC | Despacho → Pasajero | **Real** |
| Sugerencia de asignación copiloto (heurística + LLM contexto) | Despacho | **Real** |
| Asignación manual conductor + unidad (separadas) | Despacho | **Real** |
| Push real al conductor (FCM) | Conductor | **Real** |
| PWA conductor con botones gigantes (En camino / Llegué / Pasajero a bordo / Terminado) | Conductor | **Real** |
| Tracking GPS en vivo (real o interpolado en escritorio) | Pasajero + Despacho | **Real / interpolado** |
| Link público del pasajero, sin login | Pasajero | **Real** |
| Compartir viaje (link público temporal) | Pasajero → terceros | **Real** |
| Comprobante PDF estilo SUNAT al cierre | Pasajero + Empresa | **Real (visual)** |
| Panel despachador en tiempo real (WebSocket) | Despacho | **Real** |
| Vista counter aeropuerto con escaneo QR (cámara navegador) | Supervisor counter | **Real** |
| Panel corporativo con reportes y descargas | Empresa cliente | **Real** |
| Reporte semanal corporativo automático (envío programado) | Empresa cliente | **Real (cron)** |
| **Capa de Bienestar: reportar incidencia en un toque** | Pasajero + Conductor + Despacho + Corporativo | **Real (flujo completo)** |
| **Flujo objeto olvidado punta a punta** | Pasajero + Conductor + Despacho | **Real** |
| **Botón "Necesito ayuda" (seguridad)** | Pasajero + Conductor | **Real con escalamiento simulado a humano** |
| Trazabilidad / auditoría (quién hizo qué y cuándo) | Despacho + Corporativo | **Real** |
| Multitenant en esquema (`tenant_id`) | Backend | **Real (silencioso)** |

### 1.2. Lo que se simula (con honestidad declarada al cliente)

| Capacidad | Tipo de simulación | Razón |
|---|---|---|
| Pasarela de pago (Niubiz / Izipay / Yape / Plin) | UI de pasarela real, animación de procesamiento 2.5 s, check verde | El cliente lo pidió explícitamente. Integración real es trabajo de proyecto. |
| Emisión SUNAT (Fenbo / Tranzas) | PDF con look-and-feel de boleta/factura real, sin envío SUNAT real | Trabajo de proyecto, no demo. |
| WhatsApp Business API real | Simulador integrado de UI WhatsApp que llama al LLM | Costo y aprobación de Meta no caben en una demo. La lógica de extracción es 100% real. |
| Voz humana en incidencia crítica (categoría 7) | Toast "Supervisor te llama en 30s" + grabación pregrabada en demo | El protocolo humano se vende como integración real V1. |
| Cámara interna del vehículo | No existe en demo. Mencionada como roadmap. | Hardware, no software. |
| SMS y llamada real desde sistema | Sólo push + WhatsApp simulado | Costo, no valor diferencial en demo. |

### 1.3. Lo que NO se construye (disciplina)

- App nativa móvil del pasajero. PWA cubre todo.
- Marketplace abierto / subasta / contraoferta. Rompe el modelo de Taxi Green.
- Login social (Google/Facebook). Botón decorativo, sin OAuth real.
- Onboarding completo de conductor/vehículo. Datos pre-cargados con seed.
- Reportes BI elaborados. Sólo lo que arma el cuento.
- Multi-tenant comercial (visible). Sólo en esquema.
- Pagos al conductor / liquidación / comisiones. Distrae del eje.
- Integración con vuelos en vivo (Aviationstack/FlightAware). Vuelo se ingresa manualmente; se simula ETA.
- Internacionalización. Castellano de Perú únicamente.

`Recomendación provisional`: si una funcionalidad adicional aparece tentadora durante la build, **se anota como "fase 2"**, no se mete. La demo gana por foco, no por densidad.

---

## 2. Arquitectura técnica

### 2.1. Diagrama de alto nivel

```
                    ┌──────────────────────────────────────────────┐
                    │              FRONTEND SURFACES                │
                    │  (todas en un solo proyecto Next.js 15)       │
                    │                                                │
                    │  /p/[token]   → Pasajero (PWA link/QR)        │
                    │  /c           → Conductor (PWA)               │
                    │  /admin       → Despachador + métricas        │
                    │  /counter     → Supervisor aeropuerto         │
                    │  /empresa     → Cliente corporativo           │
                    │  /wa-sim      → Simulador WhatsApp (demo)     │
                    │  /bienestar/[caso]  → Estado incidencia        │
                    └────────────────────┬─────────────────────────┘
                                         │
                              REST + WebSocket
                                         │
                    ┌────────────────────▼─────────────────────────┐
                    │        BACKEND MONOLITO MODULAR              │
                    │        (Next.js API Routes + Server Actions) │
                    │                                                │
                    │  ┌────────────────────────────────────────┐  │
                    │  │  auth       reservas      asignación   │  │
                    │  │  ingesta    despacho      tracking     │  │
                    │  │  qr/voucher comprobante   notificación │  │
                    │  │  empresa    bienestar     auditoría    │  │
                    │  │  copiloto-ai (Claude API)              │  │
                    │  └────────────────────────────────────────┘  │
                    │                                                │
                    │  Socket.IO Gateway (rooms por tenant/user)    │
                    │  BullMQ workers (jobs: extracción, reportes)  │
                    └─────┬─────────────┬──────────────┬───────────┘
                          │             │              │
                  ┌───────▼────────┐ ┌──▼────────┐ ┌──▼──────────┐
                  │ PostgreSQL 16  │ │ Redis 7   │ │ Servicios   │
                  │ + PostGIS      │ │ (cache,   │ │ externos    │
                  │ + Prisma ORM   │ │  queues,  │ │ - Mapbox    │
                  │                │ │  pubsub)  │ │ - Claude    │
                  │                │ │           │ │ - FCM       │
                  │                │ │           │ │ - Resend    │
                  └────────────────┘ └───────────┘ └─────────────┘
```

### 2.2. Por qué monolito modular y no microservicios

`Recomendación provisional` con `confianza alta`:

- **Latencia de coordinación:** una demo necesita que un evento toque 4 superficies (pasajero, conductor, despacho, corporativo) en ≤500 ms percibidos. Microservicios añaden saltos de red sin beneficio operativo en este volumen.
- **Costo cognitivo del desarrollador único:** un senior puede mantener un monolito modular en su cabeza; cuatro microservicios y un bus de eventos lo obliga a ser DevOps + arquitecto + dev.
- **Coste real de hosting:** monolito = 1 servicio, 1 DB, 1 Redis. Microservicios = N servicios, gateway, observabilidad. La demo debe correr en <USD 20/mes.
- **Modularidad lógica:** los módulos del backend (carpetas `lib/modules/*`) **están separados como si fueran microservicios** — interfaces claras, sin imports cruzados arbitrarios. El día que el volumen lo exija, cada uno se extrae en horas, no en meses. Esta es la respuesta exacta a la petición de Raúl de "que se pueda separar".
- **`Contradicción registrada` con `Dicho en reunión` 19-may**: Raúl pidió microservicios. La respuesta honesta es la del § 10.1 de `PROPUESTA_DEMO.md`: te damos lo que pediste en espíritu sin pagar el costo.

### 2.3. Por qué Next.js 15 full-stack en lugar de NestJS + frontend aparte

`Recomendación` con `confianza media-alta`:

- **Server Actions** de Next 15 simplifican mutaciones (formularios, asignaciones) sin escribir endpoints REST repetitivos.
- **App Router** permite que cada cara viva en su segmento (`/p`, `/c`, `/admin`, `/counter`, `/empresa`, `/wa-sim`, `/bienestar`) con layouts independientes y middlewares de auth distintos, en el mismo proyecto.
- **Streaming** y **Suspense** dan UX premium en pantallas con datos en vivo (panel despacho, tracking).
- **Despliegue de un solo artefacto** (Railway o VPS) reduce el tiempo de "lo subo y funciona" de horas a minutos.
- **PWA con next-pwa** o config manual: misma codebase sirve la PWA del conductor.
- `Por validar`: si en algún momento se necesita un endpoint WebSocket pesado o jobs CPU-bound, ese módulo se extrae a un worker Node aparte (BullMQ ya lo prepara).

### 2.4. Por qué PostgreSQL + PostGIS y no MongoDB

Argumentado en `PROPUESTA_DEMO.md` §9. Lo repito condensado porque es la decisión técnica más importante:

- Las relaciones del dominio (reserva ↔ pasajero ↔ conductor ↔ vehículo ↔ empresa ↔ comprobante ↔ incidencia) son **relacionales puras**. Forzar referencias en documentos cuesta.
- Las consultas geo ("conductores en cola dentro del polígono del aeropuerto", "vehículo más cercano al punto de recojo") son **PostGIS nativo, estándar oro del sector**. Mongo Geo es funcional pero pobre comparativamente.
- Integridad ACID para asignación y facturación es nativa, no negociable para Taxi Green.
- Multi-tenant por **row-level security** se hace gratis con `tenant_id` + políticas RLS.
- Costo: Supabase / Neon free tier alcanza para demo y para pilot.
- **Si Raúl insiste en Mongo:** plan alterno discutido honestamente es **Firebase Firestore** (real-time nativo, validado por Qorinti) — pero perdemos PostGIS. Mongo self-hosted en VPS es la peor opción y lo decimos.

### 2.5. Capa de IA (copiloto)

**Modelos usados:**

| Tarea | Modelo | Por qué |
|---|---|---|
| Extracción de reserva desde WhatsApp/correo (jerga peruana) | **Claude Sonnet 4.6** (`claude-sonnet-4-6`) | Mejor relación precisión / costo / velocidad para extracción estructurada. Maneja español peruano con jerga hotelera. |
| Generación de pregunta de aclaración ("falta el vuelo, ¿lo confirmas?") | **Claude Haiku 4.5** | Latencia baja, costo bajo, suficiente para 1-2 oraciones contextualizadas. |
| Sugerencia de asignación con contexto ("este conductor ya hizo 3 servicios al mismo hotel") | **Heurística reglada + Claude Haiku 4.5** para racionalizar la sugerencia en lenguaje natural | La decisión la toma código determinista; el LLM solo explica. |
| Clasificación inicial de incidencia (categoría 1-10) | **Claude Haiku 4.5** | Clasificación rápida, conservadora (si duda, escala a humano). |
| Generación de borrador de respuesta empática en queja | **Claude Sonnet 4.6** | Para que el despachador no parta de hoja en blanco. **Nunca se envía sin que un humano lo apruebe.** |

**Patrón de diseño:** **LLM jamás como autoridad final**. Siempre extrae → valida con reglas → propone → humano confirma. Esto es coherente con los principios 2 y 3 de la visión (humano en control + automatización responsable).

**Costos estimados de la demo:** con Claude Sonnet 4.6 ~ USD 3/1M tokens entrada, ~USD 15/1M salida; Haiku ~USD 1/4 de eso. Para una demo de 15 minutos con ~50 invocaciones del modelo, costo aproximado <USD 0.50. `Por validar` con consumo real durante build.

### 2.6. Real-time

**Socket.IO** sobre el mismo servidor Next.js (custom server con Express delegado o un endpoint API que monta Socket.IO server).

Rooms:
- `tenant:{id}` — el despachador y supervisores escuchan todo del tenant.
- `reserva:{id}` — pasajero, conductor y despachador específico para esa reserva.
- `conductor:{id}` — el conductor escucha sus asignaciones.
- `empresa:{id}` — la empresa cliente escucha sus reservas y reportes.
- `incidencia:{id}` — todos los involucrados en una incidencia activa.

Eventos clave:
- `reserva.creada` `reserva.asignada` `reserva.estado_cambio`
- `conductor.posicion` (throttle a 1 emisión cada 3s por vehículo)
- `incidencia.abierta` `incidencia.actualizada` `incidencia.cerrada`
- `copiloto.sugerencia_lista` `copiloto.aclaracion_solicitada`

Throttling de geo: cliente conductor envía cada 5s, server emite a rooms cada 3s con coalescing. Esto preserva batería del conductor y ancho de banda.

### 2.7. Push (FCM)

Firebase Cloud Messaging para:
- Conductor: nueva asignación, cambio de pasajero, llegó pasajero, incidencia que lo involucra.
- Pasajero: conductor asignado, conductor en camino, conductor llegó, comprobante listo, **respuesta a incidencia**.
- Despachador: alerta de incidencia crítica (categoría 6-9).

Fallback: WebSocket → toast en pantalla. Esto cubre el caso "FCM no entrega en la red del cliente durante la demo".

### 2.8. Mapas y geocoding

**Mapbox GL JS** + Mapbox Search API. Razones:
- Estética nocturna seria (despacho 24/7).
- Costo competitivo.
- Búsqueda peruana razonable; si en discovery aparece que Google es más preciso para Lima, se intercambia trivialmente.
- Animación suave de marcadores (interpolación nativa con `setLayoutProperty` o transition).

**Fallback offline para demo:** snapshot estático de Lima + Callao en imagen + overlay propio si Mapbox falla la red del cliente.

---

## 3. Modelo de dominio (núcleo)

Tablas mínimas necesarias. Diseñado multi-tenant desde el día 1 (`tenant_id` en todas).

### 3.1. Esquema relacional resumido

```
tenants                 (id, nombre, ruc, plan, creado_en)
usuarios                (id, tenant_id, email, password_hash, nombre, telefono,
                         foto_url, rol['pasajero'|'conductor'|'despachador'|
                         'supervisor'|'admin_empresa'|'admin_tenant'],
                         empresa_id_nullable, creado_en)
empresas_clientes       (id, tenant_id, ruc, razon_social, direccion_fiscal,
                         contacto_principal, telefono, creado_en)
conductores             (id, tenant_id, usuario_id, dni, licencia_numero,
                         licencia_categoria, licencia_vencimiento, foto_url,
                         estado['disponible'|'en_servicio'|'en_aeropuerto'|
                         'fuera_de_turno'], rating_promedio, tiempo_en_cola_min)
vehiculos               (id, tenant_id, placa, marca, modelo, anio, tipo
                         ['sedan'|'camioneta'|'van'|'van_master'],
                         capacidad_pax, soat_vencimiento, foto_url, activa)
reservas                (id, tenant_id, codigo_publico, token_pasajero,
                         pasajero_id, pasajero_nombre, pasajero_telefono,
                         empresa_id_nullable, canal_origen
                         ['web'|'whatsapp'|'correo'|'counter'|'app_corporate'],
                         origen_lat, origen_lng, origen_label,
                         destino_lat, destino_lng, destino_label,
                         fecha_servicio, tipo_unidad_solicitada, pasajeros,
                         maletas, tarifa, peaje,
                         comprobante_tipo['boleta'|'factura'],
                         ruc_factura, razon_social_factura,
                         vuelo_numero, vuelo_aerolinea, vuelo_eta,
                         notas_pasajero, qr_payload, qr_hmac,
                         estado, conductor_id_nullable, vehiculo_id_nullable,
                         creada_en, actualizada_en)
ingesta_eventos         (id, tenant_id, canal, raw_message, parsed_json,
                         confianza_modelo, aclaraciones_pendientes,
                         reserva_id_nullable, creado_en)
viajes                  (id, reserva_id, inicio_real, fin_real, distancia_km,
                         duracion_min, polyline_recorrida, tarifa_final)
posiciones_conductor    (id, conductor_id, vehiculo_id_nullable, geom GEOGRAPHY,
                         heading, velocidad, reportada_en)
                        -- particionada por mes; índice GIST geom + tiempo
calificaciones          (id, reserva_id, calificacion_servicio,
                         calificacion_conductor, calificacion_vehiculo,
                         comentario, creado_en)
comprobantes            (id, reserva_id, tipo, serie, numero, total,
                         pdf_url, emitido_en, fenbo_mock_id)
notificaciones          (id, usuario_id, tipo, payload_json, canal
                         ['push'|'whatsapp_sim'|'in_app'], leida, creada_en)

-- Capa de Bienestar / Incidencias
incidencias             (id, tenant_id, codigo_publico, reserva_id_nullable,
                         categoria[1..10], severidad['baja'|'media'|'alta'|'critica'],
                         estado['abierta'|'en_atencion'|'esperando_usuario'|
                         'resuelta_pendiente_confirmacion'|'cerrada'|'reabierta'],
                         reportado_por_id, reportado_por_rol,
                         titulo_corto, descripcion_inicial, descripcion_estructurada_json,
                         tpr_meta_min, tr_meta_min,
                         tpr_real_min_nullable, tr_real_min_nullable,
                         resolucion_propuesta_json, resolucion_aceptada_bool,
                         confirmacion_usuario_bool_nullable,
                         nps_post_incidencia_nullable, abierta_en, cerrada_en)
incidencia_acciones     (id, incidencia_id, autor_id, autor_rol,
                         tipo['nota'|'cambio_estado'|'mensaje_a_usuario'|
                         'accion_operativa'|'escalamiento'|'cierre_propuesto'],
                         payload_json, creado_en)
                        -- es la línea de tiempo completa de cada caso
incidencia_adjuntos     (id, incidencia_id, tipo['foto'|'audio'|'documento'],
                         url, autor_id, creado_en)
incidencia_constancias  (id, incidencia_id, tipo['recepcion_objeto'|
                         'declaracion'|'cierre'], pdf_url, firmado_en,
                         hash_integridad)

-- Trazabilidad
auditoria               (id, tenant_id, actor_id_nullable, actor_rol, accion,
                         recurso_tipo, recurso_id, payload_diff_json, ip,
                         user_agent, copiloto_sugerencia_json_nullable,
                         creado_en)
```

### 3.2. Máquina de estados de reserva

```
BORRADOR  →  PENDIENTE_ASIGNACION  →  ASIGNADA  →  EN_CAMINO_RECOJO  →
EN_PUNTO_RECOJO  →  EN_CURSO  →  FINALIZADA  →  CALIFICADA  →  LIQUIDADA
                                                ↘  CANCELADA_PASAJERO
                                                ↘  CANCELADA_OPERADOR
                                                ↘  NO_SHOW_PASAJERO
                                                ↘  NO_SHOW_CONDUCTOR
                                                ↘  INTERRUMPIDA_POR_INCIDENCIA
```

Cada transición:
- Registra `auditoria` con autor, payload y diff.
- Emite evento Socket.IO al room correspondiente.
- Si dispara un side-effect (notificar al pasajero, generar comprobante, abrir incidencia), lo encola en BullMQ.

### 3.3. Máquina de estados de incidencia

```
ABIERTA  →  EN_ATENCION  →  ESPERANDO_USUARIO  →
RESUELTA_PENDIENTE_CONFIRMACION  →  CERRADA
                                              ↘ REABIERTA → (volver a EN_ATENCION)
```

Reglas críticas:
- **Categoría 6, 7, 9:** el paso ABIERTA → EN_ATENCION dispara escalamiento humano automático (notificación SMS+push al supervisor de turno). El copiloto no puede tomar acciones operativas autónomas; solo registrar y notificar.
- **Cierre:** sólo el usuario puede cerrar definitivamente con confirmación. Sin confirmación en 72 h, queda como "cerrada por timeout" pero etiquetada para revisión gerencial.
- **Reapertura:** automática si el usuario contesta negativamente la confirmación final; sin límite.

---

## 4. Módulos del backend (estructura del código)

```
src/
├── app/                     # Next.js App Router (todas las superficies)
│   ├── (pasajero)/p/[token]/...
│   ├── (conductor)/c/...
│   ├── (admin)/admin/...
│   ├── (counter)/counter/...
│   ├── (empresa)/empresa/...
│   ├── (wa-sim)/wa-sim/...
│   ├── (bienestar)/bienestar/...
│   └── api/                 # endpoints REST puntuales y webhooks
├── lib/
│   ├── db/                  # Prisma client, helpers, RLS
│   ├── auth/                # JWT, sesiones, RBAC por superficie
│   ├── modules/
│   │   ├── reservas/        # creación, edición, cancelación
│   │   ├── ingesta/         # WhatsApp sim, correo sim, extracción LLM
│   │   ├── asignacion/      # heurística + LLM racionalización
│   │   ├── despacho/        # cola, prioridades, métricas operativas
│   │   ├── tracking/        # posiciones, ETA, polyline
│   │   ├── voucher/         # generación QR firmado HMAC
│   │   ├── comprobantes/    # PDFs estilo SUNAT (Puppeteer)
│   │   ├── notificaciones/  # FCM, WhatsApp sim, in-app
│   │   ├── empresas/        # corporativo, reportes, descargas
│   │   ├── bienestar/       # incidencias completas
│   │   ├── auditoria/       # write-only del lado de modules
│   │   └── copiloto/        # wrapper Claude API + prompts versionados
│   ├── realtime/            # Socket.IO server + rooms
│   ├── queues/              # BullMQ (extracción async, reportes semanales)
│   └── utils/
├── prompts/                 # prompts del copiloto, versionados, con tests
│   ├── extraccion_reserva.v1.md
│   ├── aclaracion_campo_faltante.v1.md
│   ├── clasificacion_incidencia.v1.md
│   └── borrador_respuesta_queja.v1.md
├── components/              # shadcn/ui + componentes propios
├── styles/                  # tokens, tailwind config
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/                 # Playwright para flujos críticos
```

`Recomendación`: **los prompts viven como markdown versionado en repo**, no como strings en código. Esto permite iterarlos, hacer A/B y mantener histórico. Cada prompt tiene su test (ej. `extraccion_reserva.test.ts` con 20 ejemplos de WhatsApp peruanos).

---

## 5. Capa de Bienestar — diseño técnico detallado

`Hipótesis central` (consistente con vision sección 3.bis): la calidad de la resolución de una incidencia es un activo comercial diferenciador. Por eso recibe diseño técnico de primera, no de segunda.

### 5.1. Disparadores (todos a un toque visible)

| Cara | Acceso al reporte de incidencia |
|---|---|
| Pasajero (link/QR) | Botón fijo "**¿Algo no estuvo bien?**" en footer del link, presente durante y después del viaje. Y banner "**¿Olvidaste algo?**" automáticamente visible 0-24h post-viaje. |
| Conductor (PWA) | Botón persistente "**Reportar**" en header. Y en cierre del viaje, paso obligatorio "¿Encontraste algún objeto?". |
| Despachador (admin) | Botón "**Abrir incidencia**" en sidebar global. Y bandeja "**Incidencias**" en sidebar permanente con badge de pendientes. |
| Supervisor counter | Botón "**Reportar incidente en counter**" siempre visible. |
| Empresa cliente | Sección "**Incidencias de mi equipo**" en panel. Visible si hay alguna abierta o reciente. |

### 5.2. Captura del pasajero — flujo cero-fricción

Vista `/p/[token]` ya contiene el contexto del viaje. Cuando el pasajero toca "¿Olvidaste algo?":

1. **Pantalla 1:** "¿Qué olvidaste?" — input de texto libre (placeholder: *"Por ejemplo: billetera marrón, mochila negra, audífonos"*) + botón "Adjuntar foto" (opcional).
2. **Pantalla 2:** "¿Dónde lo dejaste?" — tres opciones grandes con icono: **En el asiento de atrás** / **En el asiento del copiloto** / **En la maletera**. Cuarta opción discreta: "No estoy seguro".
3. **Pantalla 3:** confirmación inmediata con número de caso, foto del conductor, placa, mensaje "Estamos contactando a Luis ahora. Te avisamos en menos de 15 minutos." + botón "Llamar a Taxi Green" como salida humana.

**Lo que NO se le pide al pasajero:** código de reserva, fecha, hora, ruta. El sistema lo sabe. Esto es **literal** principio 2 (humano en control) + principio 6 (cero fricción).

### 5.3. Push al conductor

Mensaje recibido en PWA conductor:

```
🛟 INCIDENCIA — Objeto olvidado
Servicio TG-2026-04829 (Andrés Ramírez)
Objeto: "billetera marrón en asiento trasero"

[ SÍ, LO TENGO ]  [ NO LO VEO ]  [ DEJAME REVISAR 5 MIN ]
```

Botones gigantes, alto contraste, sin paso intermedio. El conductor responde con un toque.

### 5.4. Resolución propuesta automática (cuando SÍ)

El copiloto consulta:
- Próximo servicio del conductor + ruta planificada.
- Dirección registrada del pasajero (hotel, oficina o residencia, según viaje).
- Horario laboral de la oficina Taxi Green.

Genera dos opciones concretas:

```
Tu billetera fue encontrada por Luis. ¿Cómo prefieres recibirla?

A) Entrega esta tarde 7-9pm en tu hotel (Hilton Miraflores), sin costo
   estimado de llegada: 19:45

B) Pasas mañana 8am-6pm por nuestra oficina (Av. Aviación 123, Callao)
```

Si el pasajero toca A, el copiloto:
- Agrega un evento "Devolución" en la cola del conductor.
- Notifica al despachador para visibilidad.
- Crea un sub-tracking del objeto (estado "en ruta de devolución").
- Notifica al pasajero por WhatsApp cuando el conductor esté a 10 min.

### 5.5. Escalamiento humano (categorías 6, 7, 9)

**Criterio determinista, no LLM:**

| Palabra clave o señal | Categoría | Acción |
|---|---|---|
| "acoso", "tocó", "miedo", "amenazó", "borracho" | 6 | Escalar a supervisor humano inmediatamente. Bloquear cierre por bot. |
| Botón rojo "Necesito ayuda" + tipo "Emergencia" | 7 | Llamada saliente automática al teléfono del usuario. Geolocalización congelada. Supervisor en línea en ≤2 min. |
| "me siento mal", "se desmayó", "está sangrando" | 9 | Mismo protocolo que 7. |
| RUC mal, factura duplicada | 10 | Cola normal, prioridad media. |
| "se perdió", "olvidé" + objeto | 1 | Flujo automatizado descrito arriba. |

La clasificación inicial la hace **Claude Haiku con un prompt conservador** (en duda, escalar). El operador humano puede reclasificar siempre.

### 5.6. Vista de estado para el pasajero

`/bienestar/[caso]` (mismo dominio del link de su viaje original — no necesita nada nuevo) muestra:

- Estado actual con color y mensaje claro ("Tu caso está en atención por María, supervisora").
- Línea de tiempo (timeline) con cada acción significativa.
- Próximo paso esperado con SLA.
- Botón "Hablar con humano ahora" (siempre visible).
- Botón "Mi caso ya quedó resuelto" sólo en estado RESUELTA_PENDIENTE_CONFIRMACION.

### 5.7. Vista del despachador

Bandeja `/admin/incidencias`:
- Lista ordenada por severidad → SLA restante → tiempo abierta.
- Color: rojo (crítica, SLA en riesgo), naranja (alta), amarillo (media), gris (baja).
- Filtros: categoría, estado, conductor, empresa, fecha.
- Detalle con timeline completa, acciones disponibles según rol, redactor de respuesta con borrador del copiloto (texto editable antes de enviar).

### 5.8. PDFs generados

- **Constancia de recepción de objeto** (cuando el pasajero firma "recibí mi billetera completa"): PDF con datos del servicio, descripción del objeto, fecha-hora-lugar de entrega, firma digital (canvas).
- **Acta de incidencia grave** (categorías 6-9): PDF con timeline completa, hash de integridad, exportable para autoridades si hace falta.

---

## 6. Seguridad y trazabilidad

### 6.1. Autenticación por superficie

| Superficie | Mecanismo | Justificación |
|---|---|---|
| Pasajero `/p/[token]` | **Magic link único** (token JWT firmado de larga duración, asociado a la reserva). Sin password. | Cero fricción. El pasajero llegó por WhatsApp/correo; el link es su credencial. |
| Conductor `/c` | Email + PIN de 6 dígitos (no password). PIN puede regenerarse por despacho. | Conductor 50+ no recuerda passwords. PIN funciona. |
| Despachador `/admin` | Email + password + 2FA opcional | Acceso a operación crítica. |
| Supervisor counter | Email + password, sesión persistente en tablet del counter | Operativo, dispositivo controlado. |
| Empresa cliente `/empresa` | Email + password + 2FA recomendado | Acceso a datos sensibles facturados. |

### 6.2. Autorización (RBAC)

Roles en `usuarios.rol`:
- `pasajero`: solo lectura de su(s) reserva(s) y sus incidencias.
- `conductor`: solo lectura de sus asignaciones + escritura de estados; lectura de sus incidencias.
- `despachador`: CRUD de reservas, asignaciones, incidencias del tenant. Sin acceso a configuración global.
- `supervisor`: lectura/escritura del subset counter.
- `admin_empresa`: lectura del subset de su `empresa_id`.
- `admin_tenant`: todo dentro del tenant.

PostgreSQL Row-Level Security activado con políticas por `tenant_id` desde el día 1.

### 6.3. Trazabilidad

Cada acción significativa registra una fila en `auditoria` con:
- Quién (usuario y rol).
- Qué (acción + recurso).
- Cuándo (timestamp).
- Desde dónde (IP, user agent).
- Diff (campos cambiados, antes/después).
- Si fue sugerencia del copiloto: el prompt usado, la respuesta literal, si el humano la aceptó tal cual o la modificó.

`Inferencia` con `confianza alta`: esto es producto (transparencia para auditorías corporativas y futura regulación) y data de entrenamiento (el delta humano sobre la sugerencia del LLM es señal de calidad).

### 6.4. Firma de vouchers

QR contiene un payload base64 de:
```
{
  "reserva_id": "uuid",
  "codigo_publico": "TG-2026-04829",
  "issued_at": 1716480000,
  "expires_at": 1716566400,
  "hmac": "sha256(secret + reserva_id + issued_at)"
}
```

Validación server-side comprueba HMAC y expiración. Imposible clonar sin el secret del servidor.

### 6.5. Datos sensibles

- Passwords con bcrypt (cost 12).
- PIN del conductor con bcrypt.
- Datos personales del pasajero (teléfono, RUC) cifrados a nivel de columna con `pgcrypto` (`pgp_sym_encrypt`).
- Logs sanitizados (sin payload de pasaporte / DNI completo, sólo últimos 4 dígitos).
- Adjuntos de incidencias (fotos) en bucket S3-compatible con URLs firmadas y expiración 24h.

---

## 7. Observabilidad

Mínimo viable para demo + base para producción:

- **Logs estructurados** (Pino) con `request_id`, `tenant_id`, `user_id`, `action`.
- **Sentry free tier** para errores en front y back.
- **Métricas operativas internas:** dashboard `/admin/metricas` con tiempo medio de asignación, p95, NPS, % incidencias resueltas con confirmación, etc. Esto es producto, no observabilidad técnica.

---

## 8. Despliegue de la demo

| Componente | Servicio | Costo |
|---|---|---|
| App Next.js (front + back) | **Railway** (1 vCPU, 1 GB RAM, dominio gratis) | USD 5/mes |
| PostgreSQL + PostGIS | **Supabase** o **Neon** (free tier) | USD 0 |
| Redis | **Upstash** (free tier) | USD 0 |
| Mapbox | Free tier (50K loads/mes) | USD 0 |
| Claude API | Pago por uso | <USD 5 para toda la fase de build y demo |
| FCM | Free | USD 0 |
| Resend (correo transaccional) | Free tier (3K mes) | USD 0 |
| **Total mensual durante demo** | | **<USD 10/mes** |

Despliegue: `git push` → Railway buildea, Supabase migra (`prisma migrate deploy`), siguiente request es la nueva versión. Cero downtime entre versiones para tráfico de demo.

**Plan B si Railway falla durante la presentación:** instancia local en laptop del presentador con `ngrok` o `cloudflared` para tunelizar. Video de respaldo grabado la noche anterior con OBS Studio cubre el escenario más catastrófico.

---

## 9. Plan de construcción — 18 a 22 días calendario

`Recomendación provisional` con `confianza media-alta`, asumiendo desarrollador senior solo, asistencia plena de Claude/ChatGPT/Gemini, tiempo completo.

### Día 0 — Cimientos (0.5 días)

- Repo Next.js 15 + TS + Tailwind + shadcn/ui inicializado.
- Prisma + Postgres local (docker-compose).
- Variables de entorno: `DATABASE_URL`, `JWT_SECRET`, `HMAC_SECRET`, `ANTHROPIC_API_KEY`, `MAPBOX_TOKEN`, `FCM_*`.
- CI mínima (lint + typecheck + build) en GitHub Actions.

### Día 1 — Modelo de datos y seeds (1 día)

- Schema Prisma completo (sección 3).
- Migraciones aplicadas.
- Script `seed.ts` con: 1 tenant Taxi Green, 12 conductores, 18 vehículos, 6 empresas clientes (Hilton, Marriott, Embajada de España, Petroperu, Anglo American, IBM Perú), 25 reservas históricas en varios estados, 4 incidencias en distintos estados.
- Tests de schema con datos seed.

### Día 2 — Auth + RBAC + layouts (1 día)

- Auth: magic link pasajero, PIN conductor, email/password resto.
- Middlewares por segmento de ruta (`/p`, `/c`, `/admin`, `/counter`, `/empresa`).
- Layouts globales por superficie (header, sidebar donde aplique, footer).
- Página de login para cada rol no-pasajero.

### Día 3 — Superficie pasajero base (1 día)

- `/p/[token]` con detalle de viaje (datos del conductor, vehículo, mapa estático).
- Estado del viaje según `estado` de reserva (cards distintas).
- Compartir viaje (link público).
- Llamadas al conductor / Taxi Green (botones).
- **Banner "¿Olvidaste algo?" listo para flujo bienestar.**

### Día 4 — Superficie conductor PWA (1 día)

- `/c` con lista de servicios del día.
- `/c/servicio/[id]` con detalle gigante (pasajero, vuelo, hora, dirección, tipo de pago).
- Botones gigantes "En camino" / "Llegué" / "Pasajero a bordo" / "Terminé".
- Recepción de push FCM real.
- Reporte de posición cada 5s al backend.

### Día 5 — Panel despachador parte 1 (1 día)

- `/admin/reservas` con tabla + filtros.
- `/admin/reservas/[id]` con detalle, asignación manual conductor + vehículo (con buscador).
- Live updates por WebSocket (toast cuando entra reserva nueva).
- Mapa de flota (`/admin/mapa`) con marcadores en vivo.

### Día 6 — Panel despachador parte 2 + sugerencia copiloto (1 día)

- Sugerencia de asignación en `/admin/reservas/[id]`: heurística + racionalización con Claude Haiku.
- Botón "Asignar sugerencia" / "Asignar otro" (registra cambio para entrenamiento).
- Cola de reservas próximas ordenada por urgencia (vuelo aterrizando, etc.).

### Día 7 — Voucher QR + comprobante PDF (1 día)

- Generación QR firmado HMAC.
- Página pública del voucher (vista compartida con pasajero).
- Generación de PDF de comprobante estilo SUNAT con Puppeteer.

### Día 8 — Simulador WhatsApp + ingesta LLM (1.5 días)

- `/wa-sim` interfaz que imita WhatsApp Web.
- Selector de "hotel emisor" (preset Hilton, Marriott, etc.) y "texto del concierge".
- Botón "Enviar" → llamada a `lib/modules/ingesta/extraerReserva.ts` que llama a Claude Sonnet con `prompts/extraccion_reserva.v1.md`.
- Resultado mostrado: reserva extraída en JSON con confianza por campo.
- Pregunta de aclaración si confianza<umbral.
- **Cuando se confirma, la reserva entra al panel del despachador** (visible vía Socket.IO).

### Día 9 — Supervisor counter aeropuerto (1 día)

- `/counter/cola` con cola de vuelos del día agrupados.
- `/counter/vuelo/[id]` con pasajeros esperados.
- `/counter/escaneo` con apertura de cámara (`getUserMedia`), lectura del QR (librería `jsqr`), validación HMAC server-side.
- Asignación de conductor + vehículo desde la pantalla del counter.

### Día 10 — Panel empresa cliente (1 día)

- `/empresa/dashboard` con resumen semanal.
- `/empresa/servicios` con lista filtrable por centro de costo, persona, periodo.
- `/empresa/facturas` con descargas PDF.
- `/empresa/solicitar` con formulario rápido (un solo formulario; el panel reaprovecha datos del usuario).
- Job semanal (BullMQ) que genera reporte y lo envía por correo (Resend).

### Día 11 — Capa de Bienestar parte 1 — captura (1 día)

- Modelo de incidencias en Prisma (ya creado en día 1, ahora se completa).
- Flujo de pasajero: "¿Olvidaste algo?" → 3 pantallas → confirmación.
- Push real al conductor con tres botones gigantes.
- Estado en vivo `/bienestar/[caso]`.

### Día 12 — Capa de Bienestar parte 2 — resolución (1 día)

- Resolución propuesta automática (cuando SÍ encontró).
- Agendamiento de devolución (entrada en cola del conductor o "mensajería").
- Cierre con constancia digital PDF + firma canvas.
- Confirmación de bienestar (estrellas) post-cierre.

### Día 13 — Capa de Bienestar parte 3 — escalamiento (0.5 días)

- Botón rojo "Necesito ayuda" en pasajero y conductor.
- Clasificación con Claude Haiku.
- Escalamiento automático a supervisor (en demo, abre toast "Supervisor te llama en 30s" y simula con audio pre-grabado).
- Bandeja `/admin/incidencias` con prioridades y colores.

### Día 14 — Trazabilidad + métricas + auditoría (0.5 días)

- Logging completo en `auditoria` desde todos los módulos.
- Dashboard `/admin/metricas` con KPIs operativos y de bienestar.
- Exportación de auditoría como CSV.

### Día 15 — Polish visual + animaciones + microcopy (1.5 días)

- Pasada completa con `DISEÑO_UI_DETALLADO.md` en mano.
- Transiciones suaves, estados de carga, vacíos, errores.
- Microcopy revisado superficie por superficie.
- Modo oscuro para despachador (operación 24/7).

### Día 16 — Datos seed creíbles + ensayo (1 día)

- Reescribir el seed con datos peruanos realistas: nombres, RUCs, direcciones, números de vuelo de LATAM/Avianca/Iberia.
- Conductores con fotos reales (placeholder con avatares).
- Empresa Hilton con vouchers programados de ejemplo.
- Una incidencia pre-cargada (objeto olvidado) en estado "en atención".

### Día 17 — Deploy + smoke tests (1 día)

- Deploy a Railway + Supabase + Upstash + Resend.
- Smoke tests E2E con Playwright sobre la URL de producción.
- Configurar dominio bonito (`taxigreen-demo.app` o similar).
- Generar APK firmado de la PWA conductor (TWA o instalable).

### Día 18 — Grabación de respaldo + guion (0.5 días)

- Grabar la demo completa con OBS Studio (4 ventanas en paralelo: pasajero, conductor, despacho, mapa).
- Editar a 15 minutos limpios.
- Subir a YouTube no listado como backup.

### Días 19-22 — Buffer (4 días)

- Bug fixing, refinamientos, ensayos con cronómetro, pruebas con personas que **no han visto el sistema**.

**Total optimista:** 18 días con tope de 22.

### 9.1. Hitos de validación interna durante la build

| Día | Hito | Validación |
|---|---|---|
| 4 | Pasajero + conductor sincronizados | Push real al conductor desde un PC, conductor confirma desde celular, pasajero ve el estado cambiar. |
| 7 | Voucher + comprobante visualmente correctos | Pasar QR por escáner externo (otro celular). Ver PDF impreso. |
| 9 | Counter funciona con cámara | Generar QR en celular, escanear desde el navegador en otra laptop. |
| 12 | Bienestar funciona punta a punta | Pasajero reporta objeto. Conductor confirma. Pasajero ve resolución. Constancia PDF generada. |
| 16 | Datos creíbles | Una persona que no conoce el sistema dice "esto se ve real". |

---

## 10. Guion de la presentación — 15 minutos cronometrados

Doble arco narrativo: **viaje normal + incidencia bien resuelta**. La incidencia es el segundo "wow" que ninguna app masiva puede demostrar con la misma calidad.

| Minuto | Bloque | Pantalla principal | Punto crítico |
|---|---|---|---|
| 0:00–0:45 | Contexto | Slide cerrado | "Vamos a mostrarles cómo se vería Taxi Green operando como copiloto, no como app más." |
| 0:45–1:30 | Personaje | Slide con Ana | Empatía. "Ana es ejecutiva, aterriza a las 23:40." |
| 1:30–2:30 | **Ingesta WhatsApp** | `/wa-sim` | Concierge del Hilton manda WhatsApp. Reserva extraída en pantalla con confianza por campo. **Wow #1**. |
| 2:30–4:30 | Despacho asistido | `/admin/reservas/[id]` | Sugerencia del copiloto aparece. Despachador acepta. **Wow #2: explica con lenguaje natural por qué este conductor.** |
| 4:30–6:30 | Conductor + Pasajero sincronizados | Split screen | Push real al conductor. Pasajero recibe link, ve mapa en vivo, foto del conductor. **Wow #3**. |
| 6:30–7:00 | Pausa narrativa | Mantener split | "Hasta aquí es una buena app. Lo que viene es lo que ninguna app puede hacer." |
| 7:00–9:30 | **Flujo aeropuerto → counter** | `/counter/escaneo` | Otro pasajero llegando del extranjero. Supervisor escanea QR con la cámara del tablet. Asignación in situ. **Wow #4: la pieza física**. |
| 9:30–11:30 | **Capa de Bienestar — objeto olvidado** | `/p/[token]` → `/c` → `/bienestar/[caso]` | Pasajero del primer flujo descubre que olvidó la billetera. Un toque, captura cero-fricción, conductor confirma en 30s, resolución propuesta automáticamente, devolución agendada. **Wow #5: la confianza vuelve a Taxi Green**. |
| 11:30–12:30 | Panel corporativo | `/empresa/dashboard` | Hilton ve el viaje + la incidencia resuelta + reporte semanal automatizado. **Wow #6: dejar de perseguir**. |
| 12:30–13:30 | Vista de gerencia + trazabilidad | `/admin/metricas` + `/admin/auditoria` | TPR, TR, NPS post-incidencia, % cerradas con confirmación. "No medimos número de incidencias; medimos cómo las resolvemos." |
| 13:30–14:00 | Roadmap honesto + multitenant | `/admin` con badge "Multi-empresa próximamente" | Una sola frase: "Esto está preparado desde el día 1 para crecer a otros operadores no competidores. No se vende hoy." |
| 14:00–15:00 | Cierre + Q&A | Slide cierre | "Esto ya existe. No es maqueta. Lo que falta es validar con su operación real durante un discovery acotado. ¿Conversamos?" |

**Notas de presentación:**
- 4 ventanas siempre visibles en pantalla compartida (admin grande + 3 lateralitas pequeñas).
- Cronómetro discreto en una esquina.
- Si algo se cae: video de respaldo continúa la narrativa sin disculpas.
- No mencionar Uber, Cabify, inDriver. Decir "transporte programado premium".

---

## 11. Riesgos y mitigaciones

| Riesgo | Probabilidad | Severidad | Mitigación |
|---|---|---|---|
| Claude API caída durante la demo | Baja | Alta | Cachear respuestas pre-grabadas para los WhatsApps de la demo. Si la API falla, sirve la cacheada. |
| FCM no llega push en la red del cliente | Media | Media | Socket.IO + toast como fallback. Push real se demuestra en otro momento si llega. |
| GPS no funciona en interior de la sala | Alta | Media | Simulador de ubicación pre-armado. Marcador interpolado por polyline pre-cargada. |
| Pasajero/conductor/despacho desincronizados | Baja | Alta | Tests E2E Playwright sobre la URL de producción, mañana del día de la demo. |
| Cliente pide ver código fuente | Baja | Baja | Repo abierto, listo para mostrar estructura modular. |
| Cliente insiste en Mongo / microservicios | Alta | Media | Argumentación lista (§2.2, §2.4). Concesión digerible: Firestore como plan B. |
| Cliente pregunta plazo y costo | Alta | Media | Rango sí, número no sin discovery. Mensaje preparado. |
| Demo se cae completa | Muy baja | Crítica | Video de respaldo grabado el día anterior. |
| Cliente quiere agregar features en la sala | Alta | Media | Sí conceptual, anotación, sin compromiso de alcance ni precio. |
| Cliente desconfía del PDF mock de SUNAT | Baja | Media | Explicar honestamente: "es un mock visual; la integración con Fenbo es trivial y se demuestra en proyecto". |
| Bienestar no se entiende como diferenciador | Media | Alta | El guion lo posiciona explícitamente. Si en preguntas no aparece, lo trae el presentador. |

---

## 12. Validación post-demo y siguiente paso

Si la demo gana al cliente, las preguntas reales empiezan, no terminan:

- ¿Cuánto del flujo de hoy se parece a lo mostrado? (`Por validar`).
- ¿Qué actor sufre más de los seis mostrados? (`Por validar`).
- ¿La capa de Bienestar resuelve el dolor de objetos olvidados que ya existe? (`Por validar`).
- ¿Qué empresa cliente real estaría dispuesta a ser early adopter del panel corporativo? (`Por validar`).
- ¿Cuántos servicios al mes y qué % aeropuerto vs corporativo vs otros? (`Por validar`).

Esas preguntas alimentan el discovery pagado descrito en `vision_final_perfecta.md` §10 (Fase 0). La demo es entrada, no fin.

---

## 13. Honestidad final

Esta demo **no es** producto V1. Es prueba de concepto funcional de primera clase. Lo que falta para producto:
- Integración real Fenbo / SUNAT.
- Pasarela real (Niubiz / Izipay).
- WhatsApp Business API real (Meta, costos, aprobación).
- Hardening de seguridad (penetration test, SOC mínimo).
- Multi-región DB, backups, runbooks.
- Soporte operativo 24/7.
- Capacitación a Taxi Green.

Todo eso es trabajo de proyecto, no de preventa. La demo demuestra que la tesis es construible; el proyecto la construye en serio.

`Recomendación final` con `confianza alta`: el cliente debe ver, en la primera reunión, un sistema que **se siente real** (datos creíbles, sincronización en vivo, IA respondiendo en tiempo real) y **una capa de bienestar que ningún competidor en el mercado peruano ofrece hoy con esta calidad**. Esos dos puntos cierran la conversación.

---

*Fin del plan técnico. Compañero indispensable: `DISEÑO_UI_DETALLADO.md`. Cualquier decisión técnica de este documento puede revisarse antes de iniciar la build; no después.*

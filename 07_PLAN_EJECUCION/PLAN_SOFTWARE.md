# Plan de Software — Taxi Green

**Versión:** 4.0 — Redirección crítica tras auditoría: demo enfocada en UN flujo protagonista, app conductor en React Native + Expo, real-time gestionado, IA como interfaz agnóstica desde demo
**Fecha:** 2026-05-26
**Reemplaza:** v3.0 (2026-05-26 madrugada)
**Estado epistémico:** documento técnico interno. Cada decisión está etiquetada como `Construir`, `Simular`, `Aplazar a MVP`, `Aplazar a Futuro`, `Por validar` o `No construir todavía`.
**Fuentes contrastadas:** [05_FINAL/vision_final_perfecta.md](../05_FINAL/vision_final_perfecta.md), [04_SINTESIS_TRABAJO/vision_final_taxigreen_refinada.md](../04_SINTESIS_TRABAJO/vision_final_taxigreen_refinada.md), [02_PROPUESTAS_PREVIAS/PROPUESTA_DEMO.md](../02_PROPUESTAS_PREVIAS/PROPUESTA_DEMO.md), [02_PROPUESTAS_PREVIAS/PLAN_DE_SOFTWARE.md](../02_PROPUESTAS_PREVIAS/PLAN_DE_SOFTWARE.md), [06_DEMO_TECNICA/DISEÑO_UI_DETALLADO.md](../06_DEMO_TECNICA/DISEÑO_UI_DETALLADO.md), transcripciones [00_EVIDENCIA_REAL](../00_EVIDENCIA_REAL/).

---

## 0. Postura — la frase que ordena todo el documento

> **La demo NO es el MVP. La demo demuestra UN flujo protagonista en 12 minutos. El MVP construye el producto real, con tiempo y discovery. La visión perfecta es destino, no compromiso.**

Esta frase reemplaza la frase ambigua de v3.0 ("el demo es el primer commit del MVP"). La auditoría detectó que mezclar demo y MVP llevó a 17 tablas, 8 wows, OCR on-device, biometría y multi-tenant con RLS — eso es producto, no demo. Aquí se separa de nuevo.

**Corrección canónica post-Figma (2026-05-30):** el flujo protagonista físico es **Recojo en aeropuerto**: Aeropuerto Jorge Chávez, llegadas, Salida 3 columna F2 → Av. Pardo 123, Miraflores. El hotel/concierge es **solicitante por WhatsApp**, no origen físico. La variante ciudad/hotel/casa/oficina → aeropuerto se llama **Traslado hacia aeropuerto** y no protagoniza la demo.

| Horizonte | Propósito | Plazo | Modelo de negocio |
|---|---|---|---|
| **DEMO** | Vender la visión con UN flujo A→Z en 12 min | 8-10 sprints (no por días) | A riesgo + anticipo simbólico |
| **MVP — Fase 1** | Operación real Taxi Green en corredor aeropuerto | 10-14 semanas tras discovery | Opción A o B visión refinada §7 |
| **FUTURO** (MVP Fase 2-3 + Producto Final) | Cinco caras del copiloto + capa bienestar completa + SaaS | 12-30 meses | Revenue recurrente o sociedad |

---

## 1. Las cinco redirecciones críticas respecto a v3.0

### Redirección 1 — La demo cuenta UN flujo, no demuestra un producto

**Flujo protagonista (12 min):**

```
Hotel/concierge solicita por WhatsApp un recojo en aeropuerto
       → Copiloto extrae + valida con reglas → Operador acepta sugerencia
       → Conductor (RN-app real) recibe push → Acepta → Va al Jorge Chávez
       → Pasajero final recibe link /p/[token] → Ve a su conductor en mapa
       → Conductor recoge en Salida 3, columna F2 → Lleva a Av. Pardo 123, Miraflores
       → Cierre
       → Comprobante PDF → Pasajero califica
```

**Flujo secundario (3 min):**

```
Counter aeropuerto → Walk-in o pasajero presenta QR → Supervisor valida
       → Crea/recupera reserva Aeropuerto → destino en Lima
       → Asigna desde cola → Presenta conductor
```

**Una sola incidencia simulada (2 min):**

```
Pasajero olvidó algo → Reporta en /p/[token] → Conductor recibe push
   → "Sí, encontré" → Pasajero recibe opciones de entrega → Cierre
```

Todo lo demás queda como "se enuncia, no se construye". El comité Taxi Green verá un sistema que **opera el flujo central completo**, no diez fragmentos a medio terminar.

### Redirección 2 — App del conductor: React Native + Expo SDK 51 desde día 1

Capacitor 6 fue descartado tras análisis técnico. El argumento previo ("reusa el código web") era falso — el código del conductor no comparte ninguna pantalla con la web. Lo único reusable son tipos y helpers en `packages/shared`, que cualquier stack consume igual.

**React Native + Expo SDK 51 gana en todos los criterios para un conductor de producción:**

| Criterio | Capacitor 6 (descartado) | React Native + Expo 51 |
|---|---|---|
| Rendering | WebView (Chromium embebido) | Componentes nativos reales |
| Performance lista larga + mapa + GPS | Aceptable, no excelente | Nativa, fluida |
| Consumo de batería | Mayor | Menor |
| Background location | Plugin community con soporte irregular | `expo-task-manager` + `expo-location` con background mode oficial |
| Push nativo | Plugin OK | `expo-notifications` con APNs/FCM unificado |
| OTA updates sin tienda | Workarounds | `EAS Update` oficial — actualizas la app sin Play Store |
| Build pipeline | Gradle local + GitHub Actions custom | `EAS Build` managed o local prebuild |
| Adopción producción (2026) | Apps de marketing | Discord, Shopify, Meta Teams, Coinbase, Uber Eats |
| Mantenimiento 2 años | Plugins community pueden morir | Backed por Expo (financiación sólida) |
| Mapas | Mapbox GL web embebido | `react-native-maps` (Google nativo) o `@rnmapbox/maps` nativo |

**Demo:** `expo start --tunnel` con `Expo Go` o **dev client** instalado en Android de utilería. Sin Play Store.
**MVP:** `EAS Build` para APK firmado + Play Store; iOS si datos justifican.

Flutter se descarta por introducir Dart y romper el monorepo TypeScript del backend.

### Redirección 3 — Canales correctamente jerarquizados

La tesis es **"llevar el sistema al canal del cliente"**. La web pública NO es protagonista — el link `/p/[token]` es **superficie de seguimiento**, no formulario de entrada.

| Prioridad | Canal | Función |
|---|---|---|
| **1** | **WhatsApp** | Entrada natural. Copiloto extrae, voucher se devuelve en el mismo canal |
| **2** | **Hotel concierge** | El hotel envía con datos del huésped como **solicitante**. No es origen físico en el flujo protagonista |
| **3** | **Counter aeropuerto** | Supervisor crea o valida reserva de **Aeropuerto → destino en Lima**. Pasajero entrega DNI verbal o escrito |
| **4** | **Llamada** | Operador transcribe (asistido por LLM en futuro) |
| **5** | **Web pública** | **Solo landing** "¿Necesitas un taxi? Escríbenos por WhatsApp" → `wa.me/...` con mensaje pre-armado. **Cero formularios web en demo** |

El link `/p/[token]` que recibe el pasajero sirve para:
- Ver al conductor en el mapa
- Ver punto de encuentro físico exacto (`Salida 3, columna F2`)
- Pagar si toca
- Descargar comprobante
- Reportar incidencia

### Redirección 4 — IA agnóstica desde demo, completa en MVP

`Construir en demo`:
- Interfaz `LLMProvider` agnóstica de proveedor
- Adapter `AnthropicProvider` mínimo
- `withFallback()` wrapper simple
- Prompts en disco con frontmatter de versión
- Validación Zod de outputs LLM contra reglas deterministas

`Aplazar a MVP`:
- `packages/ia` con strategy pattern elaborado
- Telemetría de costos por capacidad
- Feature flags por capacidad (`IA_INGESTA`, `IA_RACIONAL`, etc.)
- A/B testing de prompts
- Adapters para OpenAI, Gemini, modelos locales
- Tests de regresión con 200 WhatsApps reales

**Patrón inviolable:** cada capacidad inteligente tiene **dos implementaciones — determinista (siempre activa) y LLM (opcional)**. Si LLM falla o el flag está apagado, la determinista responde. La demo debe poder ejecutarse con LLM desconectado y seguir siendo coherente.

### Redirección 5 — Real-time gestionado en demo, evaluar Socket.IO en MVP

`Construir en demo`: **Supabase Realtime** sobre la misma instancia de Postgres que ya usamos. Cero infra extra, sin custom server, RLS valida permisos automáticamente.

| Tipo de evento | Mecanismo Supabase |
|---|---|
| Cambio de estado de reserva | `postgres_changes` en tabla `reservas` |
| Nueva posición del conductor | `broadcast` en canal `reserva:{id}` |
| Asignación de conductor | `postgres_changes` filtrado por `conductor_id` |
| Incidencia abierta | `postgres_changes` en tabla `incidencias` |

`Aplazar a MVP`: si carga lo justifica, migrar a **Socket.IO + custom server** o **Liveblocks**. Decisión data-driven, no especulativa.

---

## 2. Horizonte DEMO

### 2.1. Lo que se construye

| Componente | Tipo | Justificación |
|---|---|---|
| **Simulador WhatsApp `/wa-sim`** con LLM real opcional + fallback determinista | Real | Wow #1 — canal del cliente manda |
| **Backend de reserva** con voucher + QR HMAC + punto de encuentro físico | Real | Núcleo del producto |
| **Panel `/admin`** con lista, asignación manual (conductor + vehículo separados), sugerencia | Real | Despachador como humano en control |
| **App nativa conductor (RN+Expo)** con auth PIN, push, mapa, ubicación foreground, estados viaje | Real | Wow #2 — app de trabajo real |
| **Link `/p/[token]`** del pasajero: mapa, tracking en vivo, comprobante, reportar incidencia | Real | Wow #3 — pasajero sin app |
| **Vista `/counter`** con escaneo QR por cámara | Real | Demuestra cobertura aeropuerto |
| **Una incidencia "objeto olvidado" simplificada** | Real | Demuestra soporte de viaje dentro de `/p/[token]` |
| **Landing pública `/`** con CTA "Pídelo por WhatsApp" | Real básico | Cubre el caso turista orgánico sin construir formulario |
| **Comprobante PDF estilo SUNAT** | Real visual | Pedido explícito de Raúl |
| **Auditoría visible básica** | Real | "Humano en control" + base regulatoria |

### 2.2. Lo que se simula (declarado al cliente)

| Componente | Tipo de simulación |
|---|---|
| WhatsApp Business API real | Simulador `/wa-sim` con LLM real |
| Pasarela de pago | UI realista + animación + check verde |
| Emisión SUNAT real | PDF look-and-feel real, sin envío |
| RENIEC API | Cache pre-cargado con 3 DNIs del guion (APIs.net.pe activado solo si online) |
| SMS de respaldo | Toast "SMS enviado a +51 9XX..." sin envío real |
| Llamada del operador | Toast "Operador te llama en 30s" + audio pregrabado opcional |
| Punto de encuentro detallado | Texto fijo "Salida 3, columna F2" (sin mapa interno de aeropuerto) |
| Integración LAP/ATU | Endpoint stub 501 con mensaje "Pendiente de convenio" |

### 2.3. Lo que NO se construye en demo (disciplina dura)

- ❌ OCR MLKit on-device (aplazado a MVP)
- ❌ Biometría conductor (PIN basta en demo)
- ❌ Background location con foreground service Android (app abierta en sala basta)
- ❌ Multi-tenant con RLS activo (solo `tenant_id` simbólico)
- ❌ Cadena de 4 fallbacks RENIEC (1 proveedor + cache)
- ❌ Panel corporativo `/empresa` con reportes Excel/CSV
- ❌ Capa bienestar 10 tipologías (solo 1 en demo)
- ❌ App nativa pasajero
- ❌ Login social pasajero (OAuth Google)
- ❌ Marketplace / subasta / contraoferta
- ❌ Flight tracking en vivo
- ❌ Cron semanal real de reportes
- ❌ Calificaciones bidireccionales con histórico
- ❌ Internacionalización
- ❌ App iOS (solo Android demo)
- ❌ EAS Build firmado (Expo Go con dev client basta)
- ❌ OpenTelemetry (Sentry + Pino bastan)
- ❌ Sentry source maps en demo
- ❌ Toggle `/admin/configuracion` para IA on/off (verbal al cliente si pregunta)
- ❌ `/demo/reset` UI elaborada (`pnpm db:seed` re-ejecutable basta)
- ❌ Liquidación al conductor (enunciar en roadmap)
- ❌ Adelantos/préstamos al conductor (futuro)

### 2.4. Lo que se enuncia pero no se construye

Al cliente se le explica en la reunión que en MVP/futuro se construyen:
- App iOS si datos justifican
- OCR DNI on-device (MLKit)
- Biometría conductor
- Background location real con foreground service
- Reportes corporativos avanzados
- Bienestar 10 tipologías + métricas TPR/TR/NPS
- Integración LAP/ATU si convenio
- Liquidación + adelantos al conductor
- Flight tracking
- SaaS multioperador

### 2.5. Modelo de dominio demo — 10 tablas

```
tenants                  (multitenancy raíz, solo simbólico en demo)
usuarios                 (admin, supervisor, conductor — con email, password/PIN)
conductores              (datos operativos, FK usuarios)
vehiculos                (placa, modelo, capacidad)
reservas                 (canal_origen, tipo_viaje, solicitante, voucher_codigo, token_pasajero, punto_encuentro,
                          raw_ingesta jsonb opcional, sugerencia_copiloto jsonb opcional)
viajes                   (estados, timestamps, posición pickup/dropoff)
posiciones_conductor     (geo + timestamp, sin particionado, sin GiST en demo)
comprobantes             (tipo, datos cliente, PDF URL, estado)
incidencias              (tipologia, severidad, estado, timeline en jsonb)
auditoria                (quién, qué, cuándo, fuente_decision)
```

**Aplazadas a MVP:** `personas_fisicas` (separada de `usuarios`), `empresas_clientes`, `empresa_centros_costo`, `hoteles_aliados`, `ingesta_eventos` (tabla dedicada), `consultas_reniec`, `notificaciones`, `integraciones_externas_log`.

Justificación de cada inclusión/exclusión: el demo guion no muestra empresas como flujo activo (solo lo enuncia con la landing corporativa visual), no necesita cachear consultas RENIEC más allá de los 3 del guion (los pre-cargamos en seed), y el flujo de notificaciones se trackea inline en `auditoria` y `reservas`.

### 2.6. Superficies y dónde viven

| Superficie | Ruta / distribución | Stack |
|---|---|---|
| **Landing pública** | `apps/web` → `/` | Next.js 15.4 (static) |
| **Simulador WhatsApp** | `apps/web` → `/wa-sim` | Next.js 15.4 + Vercel AI SDK |
| **Despachador** | `apps/web` → `/admin` | Next.js 15.4 + Supabase Realtime client |
| **Counter** | `apps/web` → `/counter` | Next.js 15.4 responsive + cámara |
| **Pasajero (link/QR)** | `apps/web` → `/p/[token]` | Next.js 15.4 + Supabase Realtime |
| **Bienestar (caso incidencia)** | `apps/web` → `/bienestar/[caso]` | Next.js 15.4 |
| **Conductor — APP NATIVA** | `apps/driver` → `Expo Go` dev client / EAS Build (MVP) | **React Native + Expo SDK 51** |

### 2.7. DoD de la demo

La demo está terminada cuando, en una sola sesión cronometrada de ≤12 min, una persona ajena al equipo puede:

1. Ejecutar el flujo protagonista de principio a fin sin errores visibles
2. Demostrar el flujo counter en 3 min
3. Demostrar la incidencia simplificada en 2 min
4. Recuperarse de una caída de red cambiando al video de respaldo en <30s
5. Responder a las 5 objeciones técnicas conocidas (Mongo vs Postgres, microservicios vs monolito, IA vs algoritmos, Capacitor vs RN, custom vs Supabase Realtime)

### 2.8. Modelo comercial demo

- **A riesgo controlado** o **anticipo simbólico de preventa** (USD 500-1500) descontable del primer hito del MVP si convierte.
- **Regla de dos strikes**: si no convierte tras dos reuniones, reasignar a otro operador no competidor.

### 2.9. Cierre del horizonte demo

Si convierte: el código de la demo se **refactoriza para MVP**, no se rehace desde cero. La interfaz `LLMProvider`, el schema de 10 tablas, los packages `ingesta` / `asignacion` / `bienestar` (todos deterministas) se conservan.

Si no convierte: queda como activo del equipo, reusable para otros operadores no competidores.

---

## 3. Horizonte MVP — Fase 1

### 3.1. Definición operativa

Primer producto **operado por Taxi Green con clientes reales**, según [vision_final_taxigreen_refinada.md](../04_SINTESIS_TRABAJO/vision_final_taxigreen_refinada.md):

> "Convertir a Taxi Green en el operador formal más trazable del aeropuerto de Lima, mediante un flujo verificable de reserva, voucher con código QR, asignación supervisada de conductor y unidad, ejecución registrada y cierre con comprobante electrónico."

### 3.2. Lo que se construye en MVP (lo que la demo enunció)

| Componente | Justificación |
|---|---|
| **App nativa RN+Expo + EAS Build + Play Store** | Distribución profesional |
| **OCR DNI on-device** (MLKit en counter + driver) | Wow visual + privacidad |
| **Biometría conductor** (huella/Face) | UX 50+ años |
| **Background location real** (`expo-task-manager`) con foreground service | Crítico para asignación geográfica |
| **Multi-tenant con RLS PostgreSQL activo** | Compliance |
| **Schema completo 17 tablas** | `personas_fisicas`, `empresas_clientes`, `empresa_centros_costo`, `hoteles_aliados`, `ingesta_eventos`, `consultas_reniec`, `notificaciones`, `integraciones_externas_log` |
| **Cadena de fallbacks RENIEC** (APIs.net.pe → Decolecta → Factiliza → SUNAT Padrón) | Resiliencia |
| **Integración SUNAT real** (Fenbo / Tranzas) | Emisión legal |
| **Integración pasarela real** (Niubiz/Izipay/OpenPay) | Pago real |
| **Panel corporativo `/empresa`** con reportes mensuales + export | "Dejar de perseguir" |
| **Conciliación corporativa básica** (factura mensual por empresa) | Hueco identificado |
| **Capa bienestar con 3 tipologías** (objeto olvidado E2E + queja + botón rojo seguridad) | Wow #8 visión perfecta |
| **No-show / cancelación / cambio de vuelo** (flujos completos) | Huecos identificados |
| **Soporte humano en vivo** (chat operador) | Hueco identificado |
| **Fallback SMS real + llamada** si WhatsApp falla | Hueco identificado |
| **Liquidación al conductor** (cálculo de comisiones + cierre quincenal) | Hueco identificado |
| **Observabilidad completa** (Sentry + Pino + OpenTelemetry) | Operación 24/7 |
| **Auditoría con retención 1 año** | Compliance ATU/LAP |
| **`packages/ia` completo** (strategy pattern + telemetría + flags + tests regresión) | Habilitar copiloto gradual |

### 3.3. ADN sembrado en demo que MVP conserva

Estos seis sembrados de la demo no se rehacen:

1. **Interfaz `LLMProvider` agnóstica** — MVP añade adapters (OpenAI, Gemini), no cambia la interfaz
2. **Packages deterministas** (`ingesta`, `asignacion`, `bienestar`) — siempre operativos, MVP los enriquece pero no los reemplaza
3. **`canal_origen` en `reservas`** desde día 1
4. **Auditoría con `fuente_decision`** (algoritmo vs LLM)
5. **Schema relacional con `tenant_id`** simbólico (MVP activa RLS sin cambiar columnas)
6. **Prompts versionados en disco** con frontmatter

### 3.4. Lenguaje comercial — "menos persecución", no "IA"

**No se vende en MVP:** "copiloto IA", "asistente automático", "IA de despacho".

**Se vende en MVP:** trazabilidad formal, voucher QR verificable, comprobante embebido, menos llamadas, menos transcripción, menos errores, reporte mensual corporativo, app del conductor que funciona como debe.

### 3.5. Métricas de MVP fase 1

Antes del piloto, declarar línea base. Después comparar:

- Reducción tiempo de asignación: meta 30%
- Reducción llamadas de confirmación: meta 30%
- Reducción errores de comprobante: meta 50%
- Adopción real app conductor: % activos por semana
- Adopción real vista counter: % validaciones por QR vs manuales
- NPS interno: >7/10

Si no se mueven en piloto: **no se avanza a fase 2**. Se reformula o se cierra.

### 3.6. Modelo comercial MVP

Sin cambios respecto a visión refinada §7. Opción A (proyecto a medida 1.5x-2.5x), Opción B recomendada (cliente-cero 1x con licencia perpetua + exclusividad acotada 12-18 meses sector taxi aeropuerto Lima/Callao), Opción C (sociedad) solo si Taxi Green lo pide explícitamente.

---

## 4. Horizonte FUTURO (MVP Fase 2-3 + Producto Final)

### 4.1. Las cinco caras del copiloto

Detalladas en [vision_final_perfecta.md §3](../05_FINAL/vision_final_perfecta.md). Se construyen **por crecimiento orgánico del MVP**, sumando capacidades cuando los datos lo justifican.

| Cara | Actor | Aplazada a |
|---|---|---|
| **Cara 1** | Ingesta multicanal real | MVP Fase 2 |
| **Cara 2** | Despacho asistido con sugerencia LLM completa | MVP Fase 2 |
| **Cara 3** | Concierge del pasajero | MVP Fase 1 (versión básica) → Fase 2 enriquecida |
| **Cara 4** | Asistente corporativo conversacional | MVP Fase 2 |
| **Cara 5** | Asistente del conductor con copiloto | Producto Final |

### 4.2. Capa bienestar completa

Detallada en [vision_final_perfecta.md §3.bis](../05_FINAL/vision_final_perfecta.md). 10 tipologías + escalamiento automático + métricas TPR/TR/NPS post-incidencia. **MVP fase 1 construye 3 tipologías; fase 2 las 10**.

### 4.3. Lo que queda aplazado más allá del MVP

- App nativa iOS (solo si datos justifican)
- OCR DNI documentos extranjeros
- Voz transcrita (llamadas)
- Integración real LAP/ATU si convenio
- Flight tracking con APIs (Aviationstack / FlightAware)
- SaaS multioperador (Fase 3 condicional a validación con 5-10 operadores)
- Adelantos/préstamos al conductor
- Cámara interna del vehículo (hardware, no software)

---

## 5. Por validar (preguntas que la demo no responde)

Estas preguntas se responden en **discovery pagado**, no en la demo:

| Pregunta | Cómo validarla |
|---|---|
| ¿Conductores 45-60 adoptan app nativa sin resistencia? | H4 visión perfecta — 6 conductores reales con prototipo de papel |
| ¿Mix de ingresos corporativo vs counter vs WhatsApp? | H1 — pedirlo a Taxi Green directo |
| ¿Hoteles aceptan flujo WhatsApp estructurado? | H2 — 5 entrevistas con concierges |
| ¿LAP/ATU centralizará despacho a corto plazo? | Consulta directa + verificación fuente oficial |
| ¿Costo unitario WABA en Perú con volumen estimado? | Cotización Meta / 360dialog |
| ¿Cuánto paga Taxi Green hoy por cada servicio? | Revisar contratos vigentes con flota |
| ¿LLM extrae con ≥90% precisión en jerga peruana? | H3 — 200 WhatsApps reales en banco de pruebas |
| ¿Mongo vs Postgres es discusión cerrable con Raúl? | Reunión técnica con datos del dominio |

---

## 6. No construir todavía

Lista explícita de "tentaciones" que el equipo debe rechazar incluso si surgen pedidos:

- Marketplace abierto / subasta / contraoferta
- App nativa pasajero
- Login social pasajero (Google/Apple OAuth)
- Calificaciones bidireccionales con histórico
- Internacionalización (multi-idioma)
- Modo offline completo del driver (excepto cola simple de posiciones)
- Cámara interna vehículo (hardware)
- Geofencing avanzado para zonas restringidas
- Chat libre entre pasajero y conductor (solo llamadas)
- Tarifa dinámica tipo Uber
- Predicción demanda con ML pesado

---

## 7. Arquitectura técnica — vanguardia 2026 sin sobreingeniería

### 7.1. Decisión central — monorepo Turborepo con dos apps

```
taxigreen/
├─ apps/
│  ├─ web/                       # Next.js 15.4 — todas las superficies web + backend
│  └─ driver/                    # React Native + Expo SDK 51 — app nativa conductor
├─ packages/
│  ├─ database/                  # Prisma + schema (10 tablas demo, 17 MVP)
│  ├─ shared/                    # tipos, design tokens, helpers
│  ├─ ingesta/                   # DETERMINISTA: parser regex + reglas + chrono-node
│  ├─ asignacion/                # DETERMINISTA: heurística scoring puro
│  ├─ bienestar/                 # DETERMINISTA: clasificación incidencias por keywords
│  ├─ ia/                        # DEMO: interfaz LLMProvider + 1 adapter + fallback
│  │  ├─ src/
│  │  │  ├─ llm-provider.ts      # interfaz agnóstica
│  │  │  ├─ providers/
│  │  │  │  └─ anthropic.ts      # adapter Anthropic (demo)
│  │  │  ├─ fallback.ts          # withFallback() wrapper
│  │  │  └─ prompts.ts           # cargador de prompts desde disco
│  │  └─ prompts/
│  │     ├─ ingesta-whatsapp.v1.md
│  │     ├─ asignacion-racional.v1.md
│  │     └─ clasificacion-incidencia.v1.md
│  ├─ voucher/                   # QR + HMAC
│  ├─ comprobantes/              # plantillas PDF + stub Fenbo
│  ├─ auditoria/                 # recordAudit
│  └─ integraciones/
│     ├─ reniec/                 # demo: 1 proveedor + cache. MVP: cadena
│     └─ lap-atu/                # stub interface + endpoint 501 (puerta abierta)
├─ infra/
│  ├─ docker-compose.yml         # Postgres 17 + PostGIS local
│  └─ supabase/                  # migraciones + RLS policies (pasivas en demo)
└─ turbo.json
```

**No incluidos en demo (vienen en MVP):**
- `packages/ui-web` (los componentes shadcn viven dentro de `apps/web/src/components/ui/` en demo; se mueven a package compartido en MVP cuando se justifique)
- `packages/realtime` (Supabase Realtime client se consume directo; en MVP si migramos a Socket.IO se crea)
- `packages/integraciones/{whatsapp,pagos,sunat}` (todos stub en demo)

### 7.2. Stack consolidado (referencia)

```
Monorepo:        Turborepo 2 + pnpm 9 workspaces
Lenguaje:        TypeScript 5.6 strict + noUncheckedIndexedAccess

apps/web:
  Framework:     Next.js 15.4 (App Router + RSC)
  UI:            Tailwind 3.4 + shadcn/ui (Radix)
  State:         Zustand 5 + TanStack Query 5
  Forms:         React Hook Form 7 + Zod 3
  Auth:          Auth.js v5 + magic-link helpers
  Real-time:     Supabase Realtime client (postgres_changes + broadcast)

apps/driver:
  Framework:     React Native 0.74+ con Expo SDK 51
  Navegación:    Expo Router 3
  UI:            Tailwind via NativeWind 4
  State:         Zustand 5 + TanStack Query 5
  Real-time:     supabase-js (mismo cliente que web)
  Plugins Expo:  expo-location (foreground demo, background MVP),
                 expo-notifications (push FCM),
                 expo-task-manager (MVP),
                 expo-camera (counter / DNI scan MVP),
                 expo-local-authentication (MVP biometría),
                 expo-secure-store (tokens),
                 @rnmapbox/maps (mapas nativos)
  Distribución:  Expo Go con dev client (demo) → EAS Build APK firmado (MVP)

Compartido (packages/*):
  ORM:           Prisma 6
  DB:            PostgreSQL 17 + PostGIS 3.5 (Supabase)
  LLM:           Anthropic SDK (adapter inicial) — agnóstico vía LLMProvider
  Modelos demo:  claude-sonnet-4-6 (extracción) · claude-haiku-4-5-20251001 (racionalización)
  Push:          Web Push (FCM) en web + expo-notifications en driver
  PDF:           Puppeteer (@sparticuz/chromium-min para Railway)
  QR:            qrcode + HMAC SHA-256
  Mail:          Resend
  Storage:       Supabase Storage

Integraciones externas:
  RENIEC:        demo: APIs.net.pe + cache local. MVP: cadena
  WABA:          stub demo. MVP: 360dialog o Meta directo
  Pagos:         stub demo. MVP: Niubiz/Izipay/OpenPay
  SUNAT:         stub demo. MVP: Fenbo / Tranzas
  LAP/ATU:       stub interface (puerta abierta)

Observabilidad:
  Demo:          Sentry + Pino logs
  MVP:           + OpenTelemetry + métricas Prometheus opcionales

Tests:           Vitest 2 + Playwright 1.48 + MSW 2
Hosting demo:    Railway (apps/web) + Supabase (DB + Realtime + Storage)
Hosting MVP:     Igual + EAS para driver + opcional Upstash/Redis si BullMQ entra
Build driver:    Expo dev client (demo) → EAS Build (MVP)
```

### 7.3. Backend — Next.js, NO NestJS

Justificación dura: Next.js 15.4 App Router + Server Actions + Route Handlers cubre 100% del backend que esta demo y MVP necesitan. NestJS añadiría:
- Otra app en monorepo (`apps/api`)
- Otro proceso a desplegar
- Otro layer de abstracción (módulos, providers, decorators)
- Sin ningún beneficio mensurable a nuestra escala

**Cuándo evaluar NestJS:** solo si en MVP fase 2 surgen necesidades como gateway dedicado, workers heavy en otro proceso, GraphQL federation, microservicios reales. Hoy: no.

### 7.4. Real-time — Supabase Realtime en demo

```typescript
// apps/web/src/lib/realtime.ts
import { createClient } from '@supabase/supabase-js';
export const sb = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Despachador: suscripción a nuevas reservas
sb.channel('reservas-tenant-' + tenantId)
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reservas', filter: `tenant_id=eq.${tenantId}` },
      handleNuevaReserva)
  .subscribe();

// Pasajero: ubicación del conductor (broadcast, no DB)
sb.channel('reserva-' + reservaId)
  .on('broadcast', { event: 'posicion' }, handlePosicion)
  .subscribe();

// Driver app emite posición
sb.channel('reserva-' + reservaId).send({
  type: 'broadcast',
  event: 'posicion',
  payload: { lat, lng, ts: Date.now() }
});
```

Throttle de posiciones del conductor: cada 3s con coalescing en cliente.

### 7.5. Capa de IA — interfaz agnóstica desde demo

```typescript
// packages/ia/src/llm-provider.ts
export interface LLMProvider {
  name: string;
  generateObject<T>({
    prompt: string,
    schema: ZodSchema<T>,
    timeoutMs?: number
  }): Promise<T>;
  generateText({
    prompt: string,
    maxTokens?: number,
    timeoutMs?: number
  }): Promise<string>;
}

// packages/ia/src/providers/anthropic.ts
export class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  constructor(private modelExtraccion: string, private modelRapido: string) {}
  async generateObject<T>({ prompt, schema, timeoutMs }) { /* Anthropic SDK */ }
  async generateText({ prompt, maxTokens, timeoutMs }) { /* Anthropic SDK */ }
}

// packages/ia/src/fallback.ts
export async function withFallback<TInput, TOutput>({
  llm, algoritmo, timeoutMs = 5000, capacidad
}: {
  llm: () => Promise<TOutput>;
  algoritmo: () => Promise<TOutput> | TOutput;
  timeoutMs?: number;
  capacidad: 'ingesta' | 'racionalizacion' | 'clasificacion';
}): Promise<{ resultado: TOutput; fuente: 'llm' | 'algoritmo'; motivo: string | null }> {
  if (!env.IA_HABILITADA) {
    return { resultado: await algoritmo(), fuente: 'algoritmo', motivo: 'flag_off' };
  }
  try {
    const resultado = await Promise.race([
      llm(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]);
    return { resultado, fuente: 'llm', motivo: null };
  } catch (err) {
    log.warn({ capacidad, err }, 'LLM falló, fallback determinista');
    return { resultado: await algoritmo(), fuente: 'algoritmo', motivo: 'fallback' };
  }
}
```

**Toda llamada LLM del sistema pasa por `withFallback()`. Sin excepciones.**

Para cambiar de Anthropic a OpenAI/Gemini/Llama local en MVP: implementar otro adapter de `LLMProvider`, cambiar la línea de instanciación. **Nada más toca.**

### 7.6. Modelo de datos demo (10 tablas, esquema clave)

```prisma
// packages/database/prisma/schema.prisma (extracto)

model tenants {
  id        String   @id @default(uuid())
  nombre    String
  created_at DateTime @default(now())
}

model usuarios {
  id            String   @id @default(uuid())
  tenant_id     String
  rol           Rol      // enum: admin_tenant, despachador, supervisor, conductor, pasajero_invitado
  email         String?  @unique
  password_hash Bytes?
  pin_hash      Bytes?
  nombre        String
  telefono      String?
  activo        Boolean  @default(true)
  created_at    DateTime @default(now())
  conductor     conductores?
  @@index([tenant_id, rol])
}

model conductores {
  id            String   @id @default(uuid())
  tenant_id     String
  usuario_id    String   @unique
  usuario       usuarios @relation(fields: [usuario_id], references: [id])
  licencia      String
  rating        Float    @default(5.0)
  tiempo_en_cola_desde DateTime?
  vehiculo_id   String?
  vehiculo      vehiculos? @relation(fields: [vehiculo_id], references: [id])
  posiciones    posiciones_conductor[]
  viajes        viajes[]
  @@index([tenant_id])
}

model vehiculos {
  id         String @id @default(uuid())
  tenant_id  String
  placa      String @unique
  modelo     String
  capacidad  Int
  conductores conductores[]
}

model reservas {
  id                  String       @id @default(uuid())
  tenant_id           String
  canal_origen        CanalOrigen  // enum: whatsapp_oficial, whatsapp_manual, web_landing, counter, llamada, hotel
  tipo_viaje          TipoViaje    // recojo_aeropuerto, traslado_aeropuerto, city
  solicitante_tipo    String?      // demo: hotel, empresa, pasajero, operador
  solicitante_nombre  String?
  solicitante_contacto String?
  pasajero_nombre     String
  pasajero_telefono   String
  pasajero_email      String?
  pasajero_dni        String?      // se llena al pedir boleta
  pasajero_ruc        String?      // se llena si es factura
  origen_texto        String
  origen_lat          Float?
  origen_lng          Float?
  destino_texto       String
  destino_lat         Float?
  destino_lng         Float?
  punto_encuentro     String?      // "Salida 3, columna F2"
  fecha_hora_servicio DateTime
  vuelo_codigo        String?
  tipo_pago           TipoPago     // efectivo, voucher_hotel, factura_empresa, app_pago
  estado              EstadoReserva  // borrador, confirmada, asignada, en_curso, finalizada, cancelada
  token_pasajero      String       @unique  // nanoid 21
  voucher_codigo      String       @unique
  voucher_qr_payload  String       // firmado HMAC
  voucher_emitido_en  DateTime?
  raw_ingesta         Json?        // jsonb opcional: para demo guardamos aquí en vez de tabla aparte
  sugerencia_copiloto Json?        // jsonb: fuente, razon, score, modelo
  empresa_nombre      String?      // demo: string libre, MVP: FK a empresas_clientes
  hotel_nombre        String?      // solicitante/convenio; NO origen físico. MVP: FK a hoteles_aliados
  created_at          DateTime     @default(now())
  updated_at          DateTime     @updatedAt
  deleted_at          DateTime?
  conductor_id        String?
  viajes              viajes[]
  comprobantes        comprobantes[]
  incidencias         incidencias[]
  @@index([tenant_id, estado])
  @@index([tenant_id, canal_origen])
}

model viajes {
  id            String   @id @default(uuid())
  tenant_id     String
  reserva_id    String
  reserva       reservas @relation(fields: [reserva_id], references: [id])
  conductor_id  String
  conductor     conductores @relation(fields: [conductor_id], references: [id])
  estado        EstadoViaje
  inicio_en_camino DateTime?
  llegada_punto    DateTime?
  pasajero_a_bordo DateTime?
  finalizado_en    DateTime?
  @@index([tenant_id])
}

model posiciones_conductor {
  id           String   @id @default(uuid())
  tenant_id    String
  conductor_id String
  conductor    conductores @relation(fields: [conductor_id], references: [id])
  lat          Float
  lng          Float
  geom         Unsupported("geography(Point, 4326)")?  // PostGIS opcional, sin GiST en demo
  velocidad    Float?
  ts           DateTime @default(now())
  @@index([conductor_id, ts(sort: Desc)])
}

model comprobantes {
  id         String @id @default(uuid())
  tenant_id  String
  reserva_id String
  reserva    reservas @relation(fields: [reserva_id], references: [id])
  tipo       TipoComprobante  // boleta, factura, ticket
  serie      String
  correlativo Int
  monto      Decimal
  pdf_url    String?
  estado     EstadoComprobante  // emitido, anulado, pendiente
  created_at DateTime @default(now())
}

model incidencias {
  id          String @id @default(uuid())
  tenant_id   String
  reserva_id  String
  reserva     reservas @relation(fields: [reserva_id], references: [id])
  tipologia   TipologiaIncidencia  // objeto_olvidado, queja, seguridad, otro (en MVP: 10 valores)
  severidad   SeveridadIncidencia  // baja, media, alta, critica
  estado      EstadoIncidencia  // abierta, en_resolucion, resuelta, escalada, cerrada
  descripcion String
  timeline    Json @default("[]")  // jsonb: en demo guardamos array de acciones inline
  tpr_seg     Int?
  tr_seg      Int?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  closed_at   DateTime?
}

model auditoria {
  id            String   @id @default(uuid())
  tenant_id     String?
  actor_tipo    String   // sistema, usuario, conductor, pasajero, llm
  actor_id      String?
  action        String   // login_admin, reserva_creada, asignacion_aceptada, etc.
  target_table  String?
  target_id     String?
  payload       Json?
  fuente_decision Json?  // {fuente: 'llm'|'algoritmo', motivo, modelo?}
  ip            String?
  user_agent    String?
  ts            DateTime @default(now())
  @@index([tenant_id, action, ts(sort: Desc)])
}
```

`TipoViaje` es obligatorio en demo aunque sea un enum pequeño:

```prisma
enum TipoViaje {
  recojo_aeropuerto       // Aeropuerto Jorge Chávez -> ciudad
  traslado_aeropuerto    // ciudad/hotel/casa/oficina -> Aeropuerto Jorge Chávez
  city                   // otro origen/destino
}
```

Seed protagonista: `tipo_viaje = recojo_aeropuerto`, `origen_texto = "Aeropuerto Jorge Chávez - Llegadas"`, `punto_encuentro = "Salida 3, columna F2"`, `destino_texto = "Av. Pardo 123, Miraflores"`. El hotel se guarda como solicitante/convenio, nunca como origen físico.

### 7.7. Seguridad demo (mínimo viable + base para MVP)

- **Auth pasajero:** magic link / token `/p/[token]` (nanoid 21), validación server-side directa
- **Auth conductor:** email + PIN bcrypt en driver app
- **Auth admin/supervisor:** email + password Auth.js v5 + JWT cookie httpOnly
- **Firma QR:** HMAC SHA-256 con payload `{reserva_id, codigo_publico, issued_at, expires_at}`
- **Datos sensibles:** passwords bcrypt cost 12, PINs bcrypt. DNI/RUC en demo se guardan en plano (en MVP se cifran con pgcrypto)
- **HTTPS forzado** en prod (Railway lo da por defecto)
- **Auditoría:** cada login + acción crítica en tabla `auditoria`
- **RLS:** **NO activado en demo** (solo `tenant_id` simbólico filtrado por queries). MVP activa RLS con policies estrictas.

### 7.8. Despliegue

| Componente | Servicio | Costo demo | Costo MVP estimado |
|---|---|---|---|
| App web Next.js | Railway | USD 5/mes | USD 20-50/mes |
| App driver | Expo Go (demo) → EAS (MVP) | USD 0 | USD 0-29/mes Expo Pro si necesario |
| PostgreSQL + Realtime + Storage | Supabase | Free tier | USD 25-100/mes |
| Mapbox | Free tier | USD 0 | USD 50-200/mes por uso |
| Anthropic API (Sonnet + Haiku) | Por uso con cache | <USD 15 | Variable según activación |
| FCM | Free | USD 0 | USD 0 |
| Resend | Free tier | USD 0 | USD 0-20/mes |
| APIs.net.pe | Free 100/día | USD 0 | USD 30-100/mes |
| **Total demo** | | **<USD 20/mes** | |
| **Total MVP** | | | **USD 130-470/mes** |

### 7.9. Sembrados para integración LAP/ATU (puerta abierta sin construcción)

```typescript
// packages/integraciones/lap-atu/src/types.ts
export interface DespachoProvider {
  receiveReserva(payload: LAPReservaPayload): Promise<ReservaInterna>;
  syncEstado(reservaId: string, estado: EstadoReserva): Promise<void>;
}

// packages/integraciones/lap-atu/src/local.ts
export class LocalDispatchProvider implements DespachoProvider {
  // stub: cumple interfaz, no-op
}

// apps/web/src/app/api/integraciones/lap-atu/webhook/route.ts
export async function POST() {
  return Response.json(
    { error: 'Integración LAP/ATU pendiente de convenio' },
    { status: 501 }
  );
}
```

Schema `reservas` ya incluye `canal_origen` enum extensible. Cuando LAP firme: añadimos valor `lap_atu` al enum + columnas `origen_externo_id` y `origen_externo_tipo` en migración no-disruptiva.

---

## 8. Dolores de negocio identificados y dónde van

| Dolor | Demo | MVP | Futuro |
|---|---|---|---|
| Liquidación al conductor | Enunciar | Construir (cálculo + cierre quincenal) | Optimización |
| Adelantos / préstamos conductor | — | — | Construir |
| No-show del pasajero | Construir flujo simple | Construir completo con políticas | — |
| Cancelación pasajero/conductor | Enunciar | Construir con políticas | — |
| Esperas / colas en aeropuerto | — | Construir gestión de colas | — |
| Cambio de vuelo / vuelo atrasado | — | Notificación manual | Integración flight tracking |
| **Punto de encuentro físico exacto** | **Construir (campo en voucher)** | Refinar con mapa interno | — |
| Conciliación corporativa básica | Mockup visual | Construir reporte mensual real | Asistente conversacional |
| QR usado dos veces | Bloqueo idempotente backend | Auditoría + alertas | — |
| Pasajero equivocado | — | Verificación nombre + foto opcional | Biometría facial |
| Soporte humano en vivo | Enunciar (botón "Llamar a Taxi Green") | Chat operador + número fijo | — |
| Incidencia sensible (seguridad activa) | — | Botón rojo + protocolo manual | Protocolo automatizado |
| Fallback si WhatsApp/link falla | SMS simulado | SMS real + llamada | — |
| Adopción real del conductor | — | Validar H4 en discovery | Onboarding asistido |
| Propiedad intelectual | Resuelto (visión refinada §7) | — | — |
| Auditoría legal ATU/LAP | Auditoría básica | Retención 1 año + reportes | Compliance automatizado |

---

## 9. Riesgos y mitigaciones

### 9.1. Riesgos demo

| Riesgo | Probabilidad | Severidad | Mitigación |
|---|---|---|---|
| Anthropic API caída en demo | Baja | Alta | Cache pregrabado + fallback determinista visible |
| Supabase Realtime hiccup en demo | Baja | Media | Polling fallback cada 10s en cliente |
| Wifi de la sala falla | Media | Crítica | Hotspot 4G de respaldo + video grabado del guion |
| GPS no funciona en interior | Alta | Media | Posiciones interpoladas con polyline pre-cargada |
| Expo Go falla en Android de utilería | Baja | Alta | Tener 2 Androids preparados + APK firmado en USB |
| APIs.net.pe rate-limited | Baja | Baja | Cache pre-cargado con 3 DNIs del guion |
| Cliente pide ver código fuente | Baja | Baja | Monorepo limpio, estructura evidente |
| Cliente insiste en Mongo / microservicios | Alta | Media | Argumentación lista §7.3 + concesión digerible |
| Cliente pregunta plazo y costo | Alta | Media | Rango sí, número solo tras discovery |
| Cliente pregunta "¿y si la IA falla?" | Media | Alta | Mostrar fallback determinista en vivo |
| Cliente pregunta "¿y si Supabase muere?" | Baja | Media | "Migramos a Postgres self-hosted + Socket.IO" |
| Conductor de utilería no entiende la app | Baja | Media | Onboarding 5 min antes + botones gigantes |

### 9.2. Riesgos MVP

| Riesgo | Mitigación |
|---|---|
| Taxi Green no acepta discovery pagado | Plan B visión refinada §5.2 + regla 3 strikes |
| H1-H4 caen en discovery | Pivot matriz escenarios visión refinada §5 |
| LAP/ATU centraliza despacho | Plan C: copiloto interno, integrar como cliente |
| Conductores rechazan app nativa | Fallback PWA mínima para casos extremos |
| WhatsApp Business API costo prohibitivo | Validar costo unitario en Fase 0 |
| Supabase Realtime no escala | Migrar a Socket.IO o Liveblocks con razón medida |

---

## 10. Honestidad final

Esta v4.0 corrige la traición original de v3.0. La demo vuelve a ser demo: un flujo protagonista, tres wows, código limpio, fallback determinista visible. El MVP es donde se construye el producto real, con tiempo, discovery y métricas. El producto final es destino, no compromiso.

> "Comercialmente, vendemos la refinada. Estratégicamente, orientamos hacia la perfecta. Técnicamente, **la demo demuestra UN flujo bien hecho. El MVP construye el resto cuando hay venta**. Narrativamente, el copiloto es futuro enunciado, no promesa inmediata."

`Recomendación final` con `confianza alta`: ejecutar la demo según [SPRINT.md v3.0](./SPRINT.md). Si convierte, abrir discovery del MVP. Si no convierte tras dos reuniones, aplicar regla de dos strikes y reasignar esfuerzo.

---

## 11. Documentos compañeros

- **[SPRINT.md](./SPRINT.md)** — plan de ejecución 10 sprints de la demo, con criterios de aceptación y prompts para Opus / Sonnet / Codex
- **[06_DEMO_TECNICA/DISEÑO_UI_DETALLADO.md](../06_DEMO_TECNICA/DISEÑO_UI_DETALLADO.md)** — blueprint pantalla por pantalla
- **[05_FINAL/vision_final_perfecta.md](../05_FINAL/vision_final_perfecta.md)** — destino visión (no demo, no MVP fase 1)
- **[04_SINTESIS_TRABAJO/vision_final_taxigreen_refinada.md](../04_SINTESIS_TRABAJO/vision_final_taxigreen_refinada.md)** — formulación comercial MVP
- **[02_PROPUESTAS_PREVIAS/PLAN_DE_SOFTWARE.md](../02_PROPUESTAS_PREVIAS/PLAN_DE_SOFTWARE.md)** — plan de software v1 (referencia técnica histórica)

---

*Fin del plan. Cualquier decisión técnica de este documento puede revisarse antes de iniciar la build; no después.*

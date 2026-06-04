# Deuda técnica — Taxi Green Demo

> Registro vivo. Distingue **deuda intencional** (decisión consciente de demo, sin riesgo de
> "sorpresa" porque está acotada y documentada) de **deuda programada** (trabajo real diferido a un
> sprint posterior) y de **riesgos a vigilar**. Última revisión: **2026-06-04** (cierre S9: routing real,
> counter one-time, landing, reset de guion y hardenings; ver `docs/ESTADO_SPRINT_9.md`).

La regla maestra (CLAUDE.md §5 y reglas de oro §6.6): *lo que se construye en demo debe ser reusable en
MVP, sin código desechable*. Por eso casi toda la deuda es **acotada por interfaz** (stubs, flags), no
atajos que haya que reescribir.

---

## 1. Deuda intencional de demo (decisión cerrada, no es bug)

| # | Tema | Estado en demo | Por qué es seguro | Dónde se cierra (MVP) |
|---|------|----------------|-------------------|------------------------|
| 1 | **Sin RLS multi-tenant** | `tenant_id` simbólico en las 10 tablas, sin Row Level Security activo. El filtrado por tenant es **a nivel de aplicación** (todas las queries Prisma llevan `where: { tenant_id }`). | Demo mono-tenant ("Taxi Green Demo"). No hay datos de otros operadores que aislar. El `tenant_id` ya viaja en sesión y queries, así que activar RLS es aditivo. | Activar políticas RLS en Supabase + `auth.jwt()->tenant_id`. Semilla MVP. |
| 2 | **Rate limit in-memory** | Login admin/counter/driver usa un limitador en memoria del proceso (`apps/web/src/lib/auth/rate-limit.ts`). | En demo corre un solo proceso Next. Cumple su función (frenar fuerza bruta del PIN en la demo). **Salvaguarda S9:** desplegar Railway con **1 instancia** para que el `Map` sea la única fuente de verdad. | Mover a Redis/Upstash o tabla con TTL para que sea consistente entre instancias (MVP). |
| 3 | **RENIEC = cache demo** | `packages/integraciones/reniec` resuelve 3 DNIs del guion (`44556677`, `12345678`, `87654321`) desde cache in-memory TTL 30 min. El provider real (`apis-net-pe`) existe pero exige `RENIEC_API_TOKEN`. | El flujo protagonista solo necesita esos DNIs. Sin token → 503 controlado, no rompe. | Cablear `RENIEC_API_TOKEN` y/o cadena de fallbacks (prohibida en demo, CLAUDE.md §5). |
| 4 | **Pago / SUNAT / SMS / WABA simulados** | Stubs por interfaz: el comprobante PDF tiene *look* SUNAT pero no emite ante SUNAT; el pago al conductor es mockup (`DriverHistorySummary`); WhatsApp entra por `/wa-sim` y crea reservas como actor sistema. | Decisión de alcance (CLAUDE.md §0, §5). GPS/ETA/mapa **sí** son reales (exigencia de Raúl). | Integraciones reales por sprint MVP, detrás de las mismas interfaces y firma/secreto WABA entrante. |
| 5 | **Liquidación no se ejecuta** | El cierre con doble confirmación prepara `por_liquidar`; el pago es "harina de otro costal" (mockup). | Regla de negocio explícita (CLAUDE.md §4.5). | Motor de liquidación MVP. |
| 6 | **IA apagada por defecto** | `IA_HABILITADA=false`. Toda capacidad LLM tiene par determinista vía `withFallback`. AnthropicProvider ya está implementado para activarse con key. | Costo cero en demo y robustez: la demo corre 100% determinista con badge algoritmo. | Activar `ANTHROPIC_API_KEY` cuando se quiera mostrar el badge IA. |
| 7 | **Solo Android en app conductor** | Sin iOS, sin background location. S7 usa foreground location y fallback textual si Mapbox nativo no está disponible. | Alcance de demo (CLAUDE.md §5). El flujo operativo ya existe; el smoke físico depende de dispositivo/dev client. | EAS Build + background location (MVP). |
| 8 | **Doble confirmación cruzada simplificada (S7→S8)** | El conductor, al `finalizado`, deja la reserva en `por_liquidar` de forma unilateral (`estadoReservaParaViaje`). El estado `EstadoReserva.finalizada` existe en el enum pero **no se usa** (holgura). El "lado pasajero" de §4.4 no es un gate de estado: en la demo se materializa como comprobante + calificación en `/p/[token]` (S8). | **Consistente y deliberado**: tanto el cierre de S7 como el prompt de S8 (`PROMPT_SPRINT_8_CODEX` líneas 32/57/88) asumen `por_liquidar` tras el cierre del conductor y construyen la experiencia del pasajero encima. No hay agente que quede esperando un cruce de estados. | Si en MVP se quiere el gate estricto de §4.4 (conductor `finalizado` → reserva `finalizada`; pasajero confirma → `por_liquidar`), el estado `finalizada` ya está reservado para ese uso. |

---

## 2. Deuda programada (trabajo real, diferido a un sprint posterior — NO es regresión)

| Tema | Sprint que lo cierra | Nota |
|------|----------------------|------|
| **Deploy automático desde GitHub Actions** | ✅ **Cerrado en cierre S9 (2026-06-04)** | `deploy-web.yml` despliega con `railway up --service web` y un **project token** real guardado como GitHub Secret `RAILWAY_TOKEN`. Se corrigió el bug que lo bloqueaba: pasar `--project` sin `--environment` aborta con un project token (`railway whoami` Unauthorized era falso negativo: los project tokens no tienen usuario). **Deuda viva:** rotar el token antes de producción (un project token lee todas las variables del servicio). Ver `ESTADO_SPRINT_9.md §7`. |
| **Video respaldo de demo** | Post S9 | El software queda listo para grabar, pero el video comercial aún no se generó dentro del repo. |
| **Smoke físico Android completo** | Post S9 / MVP | `expo export --platform android` pasa y EAS puede generar APK/dev client, pero push/mapa nativo/location real deben validarse en Android físico con build instalada. |
| Geocoding real Mapbox para direcciones libres | Post S9 / MVP | S4 resuelve direcciones del guion con diccionario local. El routing S9 usa las coords ya sembradas; el geocoding de direcciones **libres** sigue siendo MVP (el flujo protagonista no lo necesita). |

---

## 3. Riesgos a vigilar (no bloquean, pero pueden sorprender)

| Riesgo | Detalle | Mitigación actual |
|--------|---------|-------------------|
| **Realtime depende de config del proyecto Supabase** | `postgres_changes` filtrado por `tenant_id` requiere: `reservas` en publicación `supabase_realtime`, `REPLICA IDENTITY FULL` y `GRANT SELECT` a `anon/authenticated/service_role`. Si se **resetea la DB**, hay que reaplicarlo. | Verificado vivo el 2026-06-01. `/admin` degrada a **polling 10s** si Realtime no está. Pendiente: versionar estos pasos como migración SQL Supabase. |
| **Secretos en `.env` locales** | DB password, `HMAC_SECRET`, `AUTH_SECRET` son valores de demo; sus literales viven **solo** en `.env` gitignored, nunca versionados ni documentados aquí. | **Rotar la DB password tras la demo.** `HMAC_SECRET`/`AUTH_SECRET` rotar antes de prod. |
| **`marcarExcepcion` sobrescribe `sugerencia_copiloto`** | Al marcar excepción se reemplaza el jsonb completo (se pierde la sugerencia del algoritmo) y se fuerza `necesita_revision` sin condición. | Aceptable en demo (la excepción es acción terminal del operador). Si en MVP se quiere preservar la traza, hacer *merge* en lugar de overwrite. |
| **Push/location real dependen de Android físico** | S6 registra token si Expo entrega `ExpoPushToken[...]`. S7 solicita ubicación foreground y emite `posicion`. S8 añade push/navegación de incidencia, pero el smoke físico no se pudo cerrar desde Codex. | No bloquea login, Realtime, endpoints ni fallback textual. Para cerrar smoke real: Android físico + dev client/EAS + API URL LAN/túnel + Supabase env + permisos. |
| **FCM directo no está cableado** | El campo se llama `fcm_token`, pero en S6 la demo usa Expo Push Service. Si llega un token no Expo, `sendConductorAssignmentPush` devuelve `fcm_not_configured` sin romper asignación. | Aceptable en Expo Go. FCM directo queda para dev client/Firebase Admin en MVP si se necesita. |
| **Realtime dual conductor/reserva** | `conductor-{id}` entrega asignación e incidencia al driver; `reserva-{id}` emite `asignacion`, `estado`, `posicion` e `incidencia` para viaje/pasajero. | Canal dual documentado. No retirar `reserva-{id}`. |
| **`GET /api/incidencias/[id]` es público por UUID + token en link de admin** | S8 expone el seguimiento de caso por UUID (cierre sí exige `token_pasajero`). Además `/admin/bienestar` enlaza `/bienestar/{id}?t={token_pasajero}`, incrustando el token del pasajero en una superficie de operador. | Aceptable para demo controlada (UUID no adivinable, operador confiable). MVP: magic link firmado para lectura y vista de operador SIN el token del pasajero en el link. |
| **Objeto olvidado: dedup de casos (CORREGIDO en auditoría S8, 2026-06-03)** | `POST /api/incidencias` ahora reutiliza el caso de `objeto_olvidado` activo (no `cerrada`/`resuelta`) de la reserva en vez de crear otro (responde `deduplicado:true`). Evita duplicados por doble tap/reintento. | Verificado en smoke: segundo POST devuelve el mismo `id`. La tabla sigue sin `@@unique(reserva_id,tipologia)`; el guard es lógico (suficiente para demo). |
| **Broadcast Realtime es best-effort (ENDURECIDO en auditoría S8)** | `sendRealtimeBroadcast` tenía `try/finally` **sin `catch`**: si `httpSend` rechazaba (red/Supabase), la excepción tumbaba la mutación que ya escribió en DB (p.ej. `POST /api/incidencias` devolvía 500 tras crear el caso → reintento → duplicado). Ahora captura y devuelve `{ok:false, reason:'broadcast_error'}`. | Aplica a TODOS los broadcasts (asignación/estado/incidencia). El broadcast nunca debe romper la escritura; el cliente refresca por polling igual. |
| **Correlativo de comprobante con posible race (S8)** | `POST /api/pasajero/[token]/comprobante` calcula `correlativo = max+1` en transacción sin lock de fila. Existe `@@unique([tipo, serie, correlativo])`, así que dos emisiones concurrentes del mismo `serie` darían `P2002` (500 a uno), **no** corrupción. | Demo single-pasajero no lo dispara. MVP: secuencia por `serie` o retry ante `P2002`. El correlativo es global por `serie` (cross-tenant) — revisar al activar multi-tenant. |
| **Mapbox GL JS web se carga desde CDN** | `/p/[token]` usa CDN solo si existe `NEXT_PUBLIC_MAPBOX_TOKEN`; sin token cae a ruta textual. | Evita peso extra en el monorepo. Para producción, decidir si instalar `mapbox-gl` localmente y añadir CSP formal. |
| **Caché/throttle de rutas es in-memory** | `/api/rutas/calcular` guarda cache TTL 45s y throttle por reserva en memoria del proceso. Si Railway escala a más de 1 réplica, cada réplica tendría cache propia. | Demo configurada a 1 réplica. MVP: Redis/Upstash o cache compartida si se habilita escalado horizontal. |
| **Cámara QR depende de `BarcodeDetector`** | `/counter` usa cámara progresiva si el navegador soporta `BarcodeDetector`; algunos navegadores lo bloquean o no lo implementan. | Siempre existe fallback manual: pegar token o escribir `TG-2026-0001`. No bloquea operación. |
| **LLM real de ingesta/asignación no smokeado con Anthropic** | S4/S5 cubrieron IA off, LLM ok mockeado y fallback por error/timeout. No se hizo llamada real porque no hay `ANTHROPIC_API_KEY`. | No bloquea: `/wa-sim`, `/api/ingesta/extraer` y `/api/asignacion/sugerir` funcionan con `fuente=algoritmo`, y el adapter real falla controlado hacia fallback si falta key. |
| **Carga de prompts `.md` bajo bundling de Next (solo si IA on)** | `packages/ia/src/prompts.ts` hace `readFileSync(new URL('../prompts/x.md', import.meta.url))`. `@taxigreen/ia` está en `transpilePackages`, así que Next lo empaqueta y `import.meta.url` apunta al chunk de `.next`, donde no están los `.md` → `loadPrompt` lanza ENOENT. **`withFallback` lo captura y degrada a determinista**, así que NO crashea, pero la IA "parecería activa y nunca correría". | **Antes de activar IA en prod: smokear `/api/ingesta/extraer` y `/api/asignacion/sugerir` con `IA_HABILITADA=true` + key y confirmar `fuente=llm`.** Fix recomendado: inlinar los prompts como string importado, o añadir `outputFileTracingIncludes` + resolver ruta robusta. IA off en demo. |
| **AI SDK v6 vs "SDK 4" documentado** | `packages/ia` usa `ai@^6` + `@ai-sdk/anthropic@^3`; CLAUDE.md §1 dice "Vercel AI SDK 4". v6 es más nuevo y **peer-compatible con zod `^3.25.76`** (ya unificado, ver §4). Funciona con provider mockeado; la ruta real Anthropic sigue sin smokear. | Decisión del equipo: actualizar CLAUDE.md §1 a "AI SDK 6" (recomendado, ya integrado) **o** fijar a v4 (reescritura del adapter, no validable sin key). No se downgradeó para no romper código que funciona con mocks. |
| **`colaScore` se normaliza por la espera máxima de la cola (S5, corregido en auditoría)** | El `colaScore` ya NO usa el tope `min(min/60,1)` (saturaba y rompía la prioridad de cola >60 min). Ahora es `minutos/maxMinutos` (relativo a la cola actual). | Corregido + test de regresión. Es **relativo**: si todos esperan parecido, los scores de cola quedan altos y los factores secundarios (distancia/match) deciden entre casi-iguales — comportamiento deseado. |
| **`POST /api/asignacion/sugerir` no lo consume la UI** | La card calcula la sugerencia en el RSC (server-side); el endpoint queda gateado y funcional pero sin consumidor en el front. | No es código muerto peligroso; superficie lista para refresco manual/uso externo. |
| **Aceptar sugerencia confía en metadata de auditoría del cliente** | `aceptarSugerenciaAsignacion` guarda `score`/`razon`/`factores` desde campos ocultos. Conductor y unidad **sí** se validan contra el tenant. | Modelo "humano en control" (operador confiable). Endurecible en MVP recomputando la sugerencia server-side al aceptar. |
| **El `build` del driver sigue siendo placeholder** | `apps/driver` mantiene `build: echo` porque la build real es EAS/dev client. Desde S9 existe `mobile-smoke.yml` con `expo export --platform android`, pero el pipeline principal de turbo no ejecuta Metro. | Gate móvil dedicado en CI + smoke manual cada sprint de app: `pnpm --filter @taxigreen/driver exec expo export --platform android`. |
| **`nativewind`/`react-native-css-interop` deben quedar pineados (S6)** | `nativewind` fijado a `4.1.23` exacto + override `react-native-css-interop: 0.1.22`. Subir a 4.2.x/css-interop 0.2.x reintroduce `react-native-worklets/plugin`, incompatible con reanimated 3.10 (Expo SDK 51) → el bundle vuelve a romper. | No quitar el pin ni el override sin migrar a reanimated 4 / worklets. |
| **`@rnmapbox/maps` NO corre en Expo Go común** | S7 lo carga de forma diferida. Si falta token o módulo nativo, la pantalla muestra ruta textual y las acciones siguen operativas. El bundle Android sí pasa con Mapbox incluido. | Para mapa nativo real: dev client/EAS + `EXPO_PUBLIC_MAPBOX_TOKEN` + `MAPBOX_DOWNLOAD_TOKEN`. El fallback textual es intencional para demo sin dev client. |

---

## 4. Estándar de dependencias y TypeScript

**Zod unificado a 3.x (auditoría S4).** Se detectó que `packages/ia` traía `zod@^4.4.3` mientras el resto del
repo (apps/web, apps/driver, ingesta) usa `zod@^3`. Dos copias de zod conviviendo (ia importaba schemas zod3 de
ingesta y definía schemas zod4 locales) es frágil y contradice CLAUDE.md §1 ("Zod 3"). Como `ai@6` y
`@ai-sdk/anthropic@3` aceptan peer `zod ^3.25.76 || ^4.1.8`, se bajó `ia` a `zod@^3.25.76` sin tocar
`schemas.ts` (usa solo APIs comunes a v3/v4). Verificado: CI 52/52 + E2E 4/4 verde. Ahora **todo el repo usa una
sola versión de zod (3.25.76)**.

`tsconfig.base.json` ya aplica: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
`noFallthroughCasesInSwitch` y, desde la auditoría S3, **`noImplicitReturns`** (verificado: CI 52/52 sigue
verde).

Flags adicionales evaluados y **no** adoptados aún (por ruido/fricción durante maquetado de UI):

- `exactOptionalPropertyTypes` — alto impacto, rompe patrones `prop?: T` habituales; revisar caso a caso.
- `noPropertyAccessFromIndexSignature` — ruidoso con accesos por índice; bajo valor aquí.
- `noUnusedLocals` / `noUnusedParameters` — ya cubiertos como **warning** por ESLint
  (`@typescript-eslint/no-unused-vars`, `argsIgnorePattern: ^_`). Promoverlos a error en los paquetes
  críticos (`voucher`, `auditoria`, `asignacion`, `ingesta`, `comprobantes`, `database`, `integraciones`)
  vía `tsconfig` por paquete es razonable **antes de cerrar el MVP**, no durante construcción de UI.

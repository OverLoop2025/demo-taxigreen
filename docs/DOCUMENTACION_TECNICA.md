# Documentación Técnica — Demo Taxi Green

**Versión:** 1.11 · **Fecha:** 2026-06-05 · **Cubre:** Sprint 0-9 — demo completa verificada localmente y en producción + auditoría de cierre + endurecimiento de pruebas (§20).
**Ámbito:** este documento describe **todo lo que existe hoy en el monorepo de software**. Para el *qué construir*
y el *por qué de negocio*, la fuente de verdad es [`_FUENTE_DESARROLLO/`](../_FUENTE_DESARROLLO/) y
[`07_PLAN_EJECUCION/`](../07_PLAN_EJECUCION/); este doc no los reemplaza, los **complementa con el estado real del código**.

Documentos vivos relacionados:
- [`../CLAUDE.md`](../CLAUDE.md) — instrucciones maestras de build (decisiones cerradas).
- [`ESTADO_SPRINT_0_Y_HANDOFF.md`](ESTADO_SPRINT_0_Y_HANDOFF.md) — handoff a Sprint 1 (estado real + gotchas).
- [`ESTADO_SPRINT_9.md`](ESTADO_SPRINT_9.md) — cierre real de Sprint 9.
- [`GUIA_PRUEBAS_DEMO.md`](GUIA_PRUEBAS_DEMO.md) — guía no técnica para levantar y probar S0-S9.

---

## 1. Resumen ejecutivo

Demo de **Taxi Green**: digitalización trazable de la operación de un taxi aeroportuario en Lima. La demo cuenta
**un** flujo protagonista A→Z (~12 min): un hotel/concierge solicita por WhatsApp un **recojo en el Aeropuerto
Jorge Chávez** para un huésped que llega a Lima; el sistema crea la reserva, el operador (humano) aprueba la
sugerencia de conductor+unidad, el conductor (app nativa) recoge en **Salida 3, columna F2** y lleva al pasajero a
**Av. Pardo 123, Miraflores**; cierre con comprobante y calificación; arco corto de objeto olvidado.

**Estado actual:** **Sprint 9 implementado**. Sprint 1 quedó cerrado contra Supabase con migración, seed idempotente,
login real y auditoría. Sprint 2 agregó voucher QR HMAC, comprobante PDF visual, RENIEC cacheado y vista de auditoría.
Sprint 3 agregó `/admin` operativo con Realtime, detalle de reserva, asignación manual conductor/unidad y métricas.
Sprint 4 agrega ingesta determinista, wrapper LLM opcional y simulador `/wa-sim` capaz de crear reservas auditadas.
Sprint 5 agrega heurística de asignación, racionalización opcional LLM y tarjeta de sugerencia auditable en el detalle
de reserva. Sprint 6 agrega app conductor Expo con login email+PIN, sesión en SecureStore, registro push degradable,
Realtime `conductor-{id}` y navegación a asignación. Sprint 7 agrega detalle activo de asignación, endpoints móviles
Bearer, estados secuenciales, ubicación foreground y broadcast `posicion`/`estado` en `reserva-{id}`.
Sprint 8 agrega `/p/[token]` con tracking público, Mapbox/fallback textual, comprobante/calificación, incidencia de
objeto olvidado, `/bienestar/[caso]`, `/admin/bienestar` y respuesta mínima del conductor. Sprint 9 agrega routing
real con Mapbox Directions + fallback determinista, `/counter` con QR de un solo uso, landing pública, reset de guion,
mobile smoke CI, fail-fast runtime de secretos y corrección del redirect PDF en Railway.
El monorepo conserva el pipeline `typecheck/lint/test/build` en verde.

---

## 2. Enfoque de IA: **determinista primero, LLM apagado pero activable** ✅

> Esta es la decisión que ordena toda la arquitectura inteligente del producto, y está **implementada así desde el día 1**.

**Objetivo:** para la demo (y para no incurrir en cobros de API), el sistema funciona **100% con lógica
determinista**. El LLM se deja **construido pero desconectado**, listo para activarse con un único interruptor
cuando el proyecto se apruebe — **sin reescribir nada de la lógica de negocio**.

Cómo está garantizado en el código:

| Mecanismo | Dónde | Efecto |
|---|---|---|
| Interruptor `IA_HABILITADA` | env (`.env.example`), leído en [`packages/ia/src/fallback.ts`](../packages/ia/src/fallback.ts) | Si ≠ `'true'`, **no se llama al LLM**: corre el algoritmo determinista (`fuente:'algoritmo', motivo:'flag_off'`). Cero llamadas → **cero costo**. |
| `withFallback()` | [`packages/ia/src/fallback.ts`](../packages/ia/src/fallback.ts) | Único punto por donde pasa toda capacidad inteligente. Aun con IA activa, si el LLM falla o expira (timeout), cae al determinista. |
| CI con LLM desconectado | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (`IA_HABILITADA: 'false'`) | El pipeline valida que el sistema **funcione sin IA**. |
| Determinista primero | packages `ingesta` / `asignacion` / `bienestar` (deterministas puros) | Se construyen antes que el LLM; el LLM se "enchufa por encima". |
| Interfaz agnóstica | [`packages/ia/src/llm-provider.ts`](../packages/ia/src/llm-provider.ts) + adapter [`providers/anthropic.ts`](../packages/ia/src/providers/anthropic.ts) | Cambiar de proveedor (Anthropic→OpenAI/Gemini/local) o activar el LLM no toca el negocio. |
| Prompts fuera del código | [`packages/ia/prompts/*.v1.md`](../packages/ia/prompts/) (frontmatter versionado) | Ningún string de prompt vive en el código. |

**Cómo se activa el LLM:** poner `IA_HABILITADA=true` + `ANTHROPIC_API_KEY` en el `.env`. El
`AnthropicProvider` ya usa AI SDK; si falta key, falla o expira, `withFallback()` conserva el resultado
determinista. Nada del flujo determinista cambia.

> Conclusión: **sí, el enfoque es el correcto y ya está cableado.** En Sprint 4 ya quedó implementado el parser
> determinista de ingesta; S5 ya replica el patrón para asignación y S8 lo replica para bienestar.

---

## 3. Stack tecnológico

| Capa | Tecnología | Versión objetivo |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces | Turbo 2 · pnpm 9+ (máquina: 10) |
| Lenguaje | TypeScript `strict` + `noUncheckedIndexedAccess` | 5.6 (resuelto 5.9) |
| Runtime | Node | 22 LTS (`.nvmrc`; máquina: 24) |
| Web (`apps/web`) | Next.js (App Router + RSC) · React 19 · Tailwind 3.4 · shadcn/ui · Auth.js v5 · Pino · Zod | Next 15.4 |
| Conductor (`apps/driver`) | React Native + Expo SDK 51 · Expo Router 3 · NativeWind 4 · expo-notifications · expo-location · expo-keep-awake · expo-network · Supabase JS · React 18.2 | Expo 51 |
| Datos | Prisma 6 · PostgreSQL 17 + PostGIS 3.5 (Supabase) | — |
| IA | Interfaz `LLMProvider` + adapter Anthropic real + `withFallback` | modelos demo: `claude-sonnet-4-6`, `claude-haiku-4-5-20251001` |
| Rutas | `packages/rutas` + Mapbox Directions v5 + fallback determinista | `driving-traffic`, `geojson`, `overview=full` |
| Real-time | Supabase Realtime (browser client + server broadcast) | validado en S3 |
| Tests | Vitest 2 (unit) · Playwright 1.48+ (e2e) | — |
| Hosting | Railway (web) · Supabase (DB/Realtime/Storage) · Expo Go (driver) | — |

**Decisiones de arquitectura cerradas:** Backend = **Next.js** (Route Handlers + Server Actions), no NestJS.
**Monolito modular** en monorepo, no microservicios. DB **PostgreSQL** (no Mongo). **10 tablas** en demo (no 17).
Identidad visual = **paleta AZUL** (sistema dual). Detalle y justificación en `07_PLAN_EJECUCION/PLAN_SOFTWARE §7`.

---

## 4. Identidad visual — paleta AZUL (decisión cerrada)

Sistema **dual** (cerrado el 2026-05-29):

| Rol | Token | Color | Uso |
|---|---|---|---|
| Chrome del producto | `product.DEFAULT` / `product.deep` | `#227FDE` / `#0B0952` (azul) | **Toda la UI** (botones, headers, foco) |
| Marca / tenant | `brand.tenant` | `#0B7A3B` (verde) | **Solo** logo y chip de tenant |
| Bienestar / soporte | `care.DEFAULT` | `#6D28D9` (púrpura) | Superficie de incidencias |
| Semánticos | `success/warning/danger/info` | — | Estados |

No se usa "verde total". Tokens en [`packages/shared/src/tokens/colors.ts`](../packages/shared/src/tokens/colors.ts),
consumidos por Tailwind en web. Escalas completas + tipografía/spacing definitivos quedaron implementados en Sprint 1.
Registro de la decisión: `_FUENTE_DESARROLLO/04_DECISIONES_ABIERTAS §A1`.

---

## 5. Estructura del monorepo (inventario 100% del código actual)

```
demo-taxigreen/
├─ package.json            scripts raíz → turbo; bloque pnpm (overrides, onlyBuiltDependencies, peerDependencyRules)
├─ pnpm-workspace.yaml     workspaces: apps/*, packages/*, packages/integraciones/*
├─ turbo.json             pipelines: typecheck, lint, test, build, dev(persistent)
├─ tsconfig.base.json      TS estricto + noUncheckedIndexedAccess (heredado por packages)
├─ eslint.config.mjs       ESLint flat (config única del monorepo)
├─ .npmrc                  node-linker=isolated + hoist público de expo/RN + postcss/tailwind + concurrencia conservadora
├─ .nvmrc (22) · .gitignore · .editorconfig · .prettierrc.json · .prettierignore
├─ .env.example            variables raíz (todas comentadas)
├─ README.md · CLAUDE.md   quick start · instrucciones maestras de build
│
├─ apps/
│  ├─ web/                 Next.js 15.4 — todas las superficies web + backend
│  │  ├─ package.json · next.config.ts · tsconfig.json · next-env.d.ts
│  │  ├─ postcss.config.mjs · tailwind.config.ts (tokens azul) · vitest.config.ts · .env.example
│  │  └─ src/
│  │     ├─ app/ layout.tsx · page.tsx · counter/ · demo/guion-narrado/ · admin/{auditoria,bienestar,metricas,reservas}/ · bienestar/[caso]/ · wa-sim/ · api/{admin,auth,voucher,rutas,comprobantes,reniec,ingesta,asignacion,conductor,pasajero,incidencias}/ · p/[token]
│  │     ├─ components/ brand-header.tsx · ui/* · admin/{audit-table,admin-reservas-live}.tsx · auth/login-form.tsx
│  │     ├─ lib/ env.ts · logger.ts · sentry.ts · auth/* · conductor-token.ts · conductor-asignacion*.ts · push.ts · admin/reservas.ts · supabase/{client,server}.ts · supabase-storage.ts
│  │     └─ __tests__/ smoke.test.ts + lib/* tests (vitest)
│  └─ driver/              React Native + Expo SDK 51 — app conductor
│     ├─ package.json · app.json (name/slug/scheme/android.package/plugins/permisos)
│     ├─ tsconfig.json · babel.config.js · metro.config.js (monorepo) · tailwind.config.js (NativeWind)
│     ├─ global.css · expo-env.d.ts · nativewind-env.d.ts · .env.example
│     ├─ app/ _layout.tsx · index.tsx · login.tsx · (auth)/{home,perfil,asignacion/[id],incidencia/[id]}
│     └─ src/ components/* · features/{api,assignment,auth,incidents,location,network,push,realtime,routing} · lib/env.ts (Zod, EXPO_PUBLIC_*)
│
├─ packages/
│  ├─ database/            Prisma 6 — schema 10 tablas + migración inicial + seed protagonista + scripts db:*
│  ├─ shared/              tokens AZUL (colors/typography) + FLUJO_PROTAGONISTA + test de tokens
│  ├─ ia/                  LLMProvider + AnthropicProvider real + withFallback + loader prompts + extractor/racionalizador LLM
│  │  └─ prompts/          ingesta-whatsapp.v1.md · aclaracion-datos-faltantes.v1.md · asignacion-racional.v1.md · clasificacion-incidencia.v1.md
│  ├─ ingesta/             DETERMINISTA (parser reservas WhatsApp) — implementado en S4
│  ├─ asignacion/          DETERMINISTA (heurística scoring) — implementado en S5
│  ├─ bienestar/           DETERMINISTA (clasificador objeto olvidado) — implementado en S8
│  ├─ rutas/               DETERMINISTA + Mapbox Directions + withRutaFallback — implementado en S9
│  ├─ voucher/             QR + HMAC — implementado en S2
│  ├─ comprobantes/        PDF SUNAT-like — implementado en S2 con fallback local
│  ├─ auditoria/           recordAudit — implementado en S1 + vista web en S2
│  └─ integraciones/
│     ├─ reniec/           APIs.net.pe + cache 3 DNIs — implementado en S2
│     └─ lap-atu/          stub interfaz (puerta abierta) — placeholder
│
├─ infra/
│  ├─ docker-compose.yml   Postgres 17 + PostGIS local (opcional)
│  └─ supabase/ init/01-extensions.sql (postgis, pgcrypto) · migrations/.gitkeep
│
├─ tests/e2e/              Playwright: smoke, voucher, admin, wa-sim, asignación sugerida, link pasajero y rutas
│                         (corre con `pnpm e2e`)
│
└─ .github/workflows/
   ├─ ci.yml               install → turbo typecheck/lint/test/build (IA_HABILITADA=false)
   ├─ deploy-web.yml       Railway `railway up --service web` (gated por RAILWAY_TOKEN project token; CI activo)
   └─ mobile-smoke.yml     driver typecheck/lint + expo export Android
```

**14 paquetes de workspace:** `@taxigreen/web`, `@taxigreen/driver`, `@taxigreen/{database, shared, ia, ingesta,
asignacion, bienestar, rutas, voucher, comprobantes, auditoria}`, `@taxigreen/integraciones-{reniec, lap-atu}`.

### 5.1 Detalle por archivo relevante

**Raíz**
- `package.json` — scripts (`dev/build/lint/typecheck/test/e2e/format`) que delegan en turbo; bloque `pnpm` con
  `onlyBuiltDependencies` (prisma/esbuild), `overrides` (dedupe `@types/react`) y `peerDependencyRules`.
- `turbo.json` — pipelines con dependencias `^build`; `dev` no cachea y es `persistent`.
- `eslint.config.mjs` — flat config: objeto de ignores (incluye la documentación `00_-07_` y `_FUENTE_DESARROLLO`),
  reglas TS recomendadas, `no-unused-vars`/`no-explicit-any` como `warn`.
- `.npmrc` — **`node-linker=isolated`** (clave, ver §7), hoist público de `expo*/react-native*/@rnmapbox/nativewind`
  y de `postcss/autoprefixer/tailwindcss`, `child-concurrency=1`/`network-concurrency=3` (evita OOM en WSL2).

**apps/web** (Next.js)
- `src/lib/env.ts` — todas las env tipadas con Zod, **opcionales** en Sprint 0 (no rompe build sin secretos).
- `src/lib/auth/*` — Auth.js v5 con credentials admin/counter/driver, helpers bcrypt/PIN y sesiones JWT.
- `src/lib/logger.ts` (Pino) · `src/lib/sentry.ts` (dummy con misma API que `@sentry/nextjs`).
- `src/components/ui/button.tsx` — botón con variantes en azul (`bg-product`); placeholder sin radix (ver §7).
- `src/app/page.tsx` — landing pública de demo con CTA WhatsApp y entrada al link pasajero protagonista.
- `src/app/counter/` — supervisor counter: validación manual/cámara progresiva de voucher QR y consumo one-time.
- `src/app/demo/guion-narrado/` — guion interno de presentación para preparar demo/video.
- `src/app/api/rutas/calcular/route.ts` — endpoint server-side de ruta/ETA con token pasajero o Bearer conductor.
- `src/app/wa-sim/` — simulador WhatsApp Web de S4: conversaciones seed, extracción, panel JSON/confianza y creación de reserva.
- `src/app/api/ingesta/extraer/route.ts` — endpoint de ingesta con `extraerReservaConFallback`.
- `src/app/api/asignacion/sugerir/route.ts` — endpoint protegido para sugerir conductor+unidad.
- `src/app/api/conductor/login/route.ts` — login móvil email+PIN, JWT Bearer 12h y auditoría `login_driver_mobile`.
- `src/app/api/conductor/fcm-token/route.ts` — guarda Expo/FCM token en `usuarios.fcm_token` con Bearer.
- `src/app/api/conductor/asignacion/[id]/route.ts` — detalle móvil tenant-safe de reserva asignada al conductor.
- `src/app/api/conductor/asignacion/[id]/estado/route.ts` — transición secuencial de viaje, auditoría y broadcast.
- `src/lib/conductor-token.ts` — firma/verifica JWT móvil (`jose`).
- `src/lib/conductor-asignacion.ts` — secuencia `asignado -> en_camino -> en_punto -> a_bordo -> finalizado`,
  mapeo reserva/viaje y serialización móvil.
- `src/lib/push.ts` — helper de Expo Push Service con degradación controlada si falta token/FCM real.
- `src/lib/supabase/server.ts` — broadcast server-side `reserva-{id}` (`asignacion`/`estado`/`incidencia`) y
  `conductor-{conductorId}` (`asignacion`/`incidencia`).
- `src/app/admin/reservas/[id]/sugerencia-card.tsx` — tarjeta "Copiloto recomienda" con aceptar/override.
- `next.config.ts` — transpila paquetes internos (`shared`, `voucher`, `comprobantes`, `reniec`, `ingesta`,
  `asignacion`, `bienestar`, `rutas`, `ia`) y deja Puppeteer/Chromium externos para no romper `ws`.
- `tsconfig.json` — `paths`/`typeRoots` que fuerzan `react`/`react-dom` al `@types` local de web (ver §7, gotcha 2).

**apps/driver** (Expo)
- `app.json` — `name "Taxi Green Conductor"`, `slug taxigreen-driver`, `scheme taxigreendriver`,
  `android.package pe.taxigreen.driver`, permisos (location/notifications/camera) y los **8 plugins** instalados
  como placeholders (expo-router, expo-secure-store, expo-notifications, expo-location, expo-task-manager,
  expo-camera, expo-local-authentication, @rnmapbox/maps).
- `metro.config.js` — `watchFolders`/`nodeModulesPaths` para monorepo + NativeWind (`global.css`).
- `app/login.tsx` — email + PIN con numpad grande.
- `app/(auth)/home.tsx` — turno, unidad, estado Realtime/push y próxima asignación.
- `app/(auth)/asignacion/[id].tsx` — asignación activa: datos, mapa/fallback, estado secuencial, keep-awake y CTA único.
- `src/features/auth/use-auth.tsx` — SecureStore, login/logout e hidratación de sesión.
- `src/features/assignment` — cliente GET/POST de asignación y helper de próxima acción.
- `src/features/location` — foreground location con `watchPositionAsync`, emisión `posicion` por `reserva-{id}`.
- `src/features/network` — polling básico de conectividad y reintento conservador.
- `src/features/push` — canal Android `asignacion`, permisos, Expo Push Token y tap listener.
- `src/features/realtime` — cliente Supabase RN y canal `conductor-{conductorId}`.
- `src/features/routing/use-route.ts` — recalcula ruta/ETA contra `/api/rutas/calcular` con fallback local.
- `src/lib/env.ts` — env tipadas con Zod (prefijo `EXPO_PUBLIC_*`, incluye `EXPO_PUBLIC_EXPO_PROJECT_ID`).

**packages/database**
- `prisma/schema.prisma` — **vacío a propósito** (datasource Postgres + generator). Las 10 tablas llegan en S1.
- `src/index.ts` — cliente Prisma singleton (patrón global, log condicionado por `NODE_ENV`).
- `package.json` — scripts `db:migrate/db:deploy/db:seed/db:seed-guion/db:studio/db:reset` listos.

**packages/ia** (la capa que materializa el enfoque del §2)
- `src/llm-provider.ts` (interfaz) · `src/providers/anthropic.ts` (AI SDK/Anthropic) · `src/fallback.ts`
  (withFallback funcional) · `src/prompts.ts` (frontmatter loader) · `src/extractor-llm.ts` (ingesta con
  validación determinista) · `src/racionalizador-llm.ts` (explica sugerencia S5 sin decidir) · `prompts/*.v1.md`
  (4 prompts versionados).

---

## 6. Cómo ejecutar (Quick Start)

```bash
# Requisitos: Node 22 LTS (.nvmrc) y pnpm 9+. (La máquina actual usa Node 24 / pnpm 10; compatible.)
pnpm install                         # instala 14 workspaces. Sin TTY (CI/automatización): CI=true pnpm install

# Variables de entorno (todas opcionales en Sprint 0)
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/driver/.env.example apps/driver/.env

# (Opcional) Postgres local con PostGIS
docker compose -f infra/docker-compose.yml up -d

# Migraciones + guion demo
pnpm --filter @taxigreen/database db:deploy
pnpm --filter @taxigreen/database db:seed-guion

# Verificación completa (debe quedar en verde: 56/56 tareas)
pnpm turbo run typecheck lint test build

# Web en http://localhost:3000
pnpm --filter @taxigreen/web build
pnpm --filter @taxigreen/web start

# App conductor (Expo Go en Android físico)
cd apps/driver && pnpm start          # escanear el QR con Expo Go
# En Android físico, EXPO_PUBLIC_API_URL debe usar IP LAN: http://<IP-LAN>:3000
# Mapa nativo requiere dev client/EAS; Expo Go usa fallback textual si Mapbox no carga.

# Gate real de bundle móvil al cerrar sprints de app
cd /home/jose/dev/demo-taxigreen && pnpm --filter @taxigreen/driver exec expo export --platform android

# E2E (con la web levantada)
pnpm e2e
```

---

## 7. Decisiones de entorno NO obvias (¡no revertir sin entender!)

Descubiertas resolviendo fricción real de instalación/build. Documentadas también en `_FUENTE_DESARROLLO/08`.

1. **`node-linker=isolated`** — El monorepo tiene **dos versiones de React** (web 19 / driver 18.2 por Expo 51).
   Con `hoisted`, se mezclaban dos copias de React y `next build` reventaba con
   `Cannot read properties of null (reading 'useContext')` al prerenderizar. El linker aislado da a cada app su
   árbol correcto. Metro ya está configurado para monorepo (`metro.config.js`).
2. **`@types/react` por app + `paths` en `apps/web/tsconfig.json`** (web 19.2.6 / driver 18.2.79) — con linker
   aislado, el `tsc` de web también cargaba el `@types/react@18` del driver desde el store y contaminaba el
   namespace global `React`/`JSX`. Se resolvió con: pins exactos en `apps/web` (`@types/react 19.2.6`,
   `@types/react-dom 19.2.0`) + override `@types/react-dom>@types/react: 19.2.6` en el raíz, y sobre todo
   **`paths`/`typeRoots`/`types` en `apps/web/tsconfig.json`** que fuerzan `react`/`react-dom` al `@types` local
   (mismo patrón que el driver). El Button base sigue **sin `@radix-ui/react-slot`** para evitar una segunda copia de tipos React.
3. **Mapbox RN no es Expo Go puro** — `@rnmapbox/maps` está instalado y bundlea, pero el mapa nativo requiere
   dev client/EAS + token Mapbox. S7 carga el módulo de forma diferida y muestra fallback textual si no está
   disponible; la operación de estados no depende del mapa.
3b. **Entry del driver = `apps/driver/index.js`, NO `expo-router/entry`** — con `node-linker=isolated` el dev
   client EAS fallaba al arrancar con `Unable to resolve module ./node_modules/.pnpm/expo-router@.../entry`:
   Metro resuelve `expo-router/entry` al `.pnpm` de la **raíz** del workspace, pero el dev client pide la ruta
   relativa a `apps/driver/`, donde no hay `.pnpm`. La solución es un entry físico local
   (`index.js` → `import 'expo-router/entry';`) con `"main": "index.js"`. Verificado contra Metro:
   `/index.bundle` → 200. **No requiere reconstruir el APK** (el entry lo sirve el manifest de Metro). No revertir
   a `"main": "expo-router/entry"`.
4. **`db:seed` resetea timestamps S7** — el viaje protagonista vuelve a `asignado` y limpia
   `inicio_en_camino/llegada_punto/pasajero_a_bordo/finalizado_en`, para que cada demo arranque desde baseline real.
3. **PostCSS/Tailwind hoisteados** (`.npmrc`: `public-hoist-pattern[]=postcss|autoprefixer|tailwindcss`) — Next
   resuelve los plugins de PostCSS por string desde el cwd de `apps/web`; con isolated no quedaban accesibles y
   `next build` fallaba con `Cannot find module 'autoprefixer'`.
4. **`peerDependencyRules.allowedVersions`** (raíz) para `next-auth>next`, `next-auth>react`,
   `@rnmapbox/maps>react-native` — sin esto, con linker aislado, pnpm deja peers "unmet" y next-auth no entra.
5. **`@rnmapbox/maps` fijado a `10.1.33`** — la 10.3.x exige `react-native>=0.79`; Expo 51 trae 0.74.5.
6. **`onlyBuiltDependencies`** (prisma, esbuild) — pnpm 10 bloquea build scripts; declararlos evita aprobación interactiva en CI.
7. **`next.config.ts` ignora eslint/ts en build + `apps/web/tsconfig.json` excluye `.next`** — typecheck y lint son
   tareas turbo separadas que ya cubren todo el repo; así `next build` no repite esas fases y `tsc --noEmit` no
   depende de artefactos generados por el build (evita carrera typecheck↔build). **No es para tapar errores.**
8. **Lint por paquete:** `eslint . --config <ruta>/eslint.config.mjs` (config flat única en la raíz).
9. **Tras tocar deps/overrides: instalación limpia** (`rm -rf node_modules pnpm-lock.yaml && CI=true pnpm install`);
   restos del store de instalaciones incrementales confunden la resolución de tipos.

---

## 8. Verificación del Sprint 0 (resultados reales)

| Criterio (DoD Sprint 0) | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` resuelve los 14 workspaces | ✅ |
| `pnpm turbo run typecheck lint test build` (sin caché) | ✅ **52/52 tasks** verdes (~16 s) |
| `next build` compila y **prerenderiza 4/4 páginas** (`/`, `/_not-found`, …) | ✅ sin error de hidratación |
| `next start` → `GET /` | ✅ **HTTP 200**, `<title>Taxi Green — Demo</title>`, contiene "Jorge Chávez" + CTA WhatsApp |
| Expo resuelve `app.json` + **8 plugins** (`expo config` exit 0) | ✅ name/slug/scheme/android.package correctos |
| Vitest (web + shared) | ✅ tests de smoke y de tokens pasan |
| Estructura == `SPRINT.md §0.2` | ✅ |
| `.env.example` en raíz + web + driver | ✅ |

**Pendiente de credenciales/servicios para próximos sprints**:
- **Railway** — servicio `web` + `RAILWAY_TOKEN` en GitHub Secrets (workflow ya listo).
- **Anthropic / Mapbox / Resend / APIs.net.pe / Expo (EAS)** — Anthropic sigue opcional por fallback; el resto se cablea cuando lo consuma cada sprint (S5+/S6+).
**Supabase Storage y Realtime** ya quedaron validados en S3 con bucket `comprobantes`, publicación `supabase_realtime`
y grants de lectura para `reservas`.

---

## 9. Qué NO se construye en demo (y es correcto)

Conforme al plan, S0-S9 dejan cimentación, datos, auth, artefactos físico-digitales, despacho operativo, ingesta
WhatsApp determinista, sugerencia automática de asignación, app conductor operativa con estados/ubicación foreground,
tracking público del pasajero, comprobante/calificación, objeto olvidado E2E, routing real con fallback, counter QR
one-time, landing y reset/guion. Lo que queda fuera es deliberadamente MVP o externo a la demo.

**Prohibido en toda la demo** (no construir aunque se pida): app pasajero nativa, OAuth pasajero, portal `/empresa`,
OCR on-device, biometría, background location, RLS activo, cadena RENIEC, 9 tipologías extra de bienestar,
marketplace/subasta, tarifa dinámica, flight tracking, liquidación real, SaaS, iOS. (Canónico: `PLAN_SOFTWARE §2.3`/`§6`.)
Pendiente externo post-S9: video respaldo y smoke físico Android si se quiere demostrar push/mapa nativo con APK/dev
client instalado. El `RAILWAY_TOKEN` ya está en GitHub Secrets y el CI despliega automático; deploy manual y por
Actions verificados en `https://web-production-816a4.up.railway.app`. Acción de seguridad: rotar el token si circuló
por un canal no seguro (un project token lee todas las variables del servicio).

---

## 10. Próximos pasos post-S9

La demo de software está cerrada en S9. Lo siguiente solo debe hacerse por instrucción explícita:

- `RAILWAY_TOKEN` real ya está en GitHub Secrets y `deploy-web.yml` despliega automático en push a main (hecho).
- **Rotar** el `RAILWAY_TOKEN` (y password DB / `AUTH_SECRET` / `HMAC_SECRET`) antes de producción real; ver `DEUDA_TECNICA.md`.
- Grabar video respaldo de la demo.
- Validar Android físico con dev client/EAS si se quiere enseñar push/mapa nativo/location real.
- Empezar MVP: RLS, Redis/Upstash, SUNAT/pago/WABA/RENIEC reales, geocoding libre y liquidación.

**Regla de oro:** no se abre un sprint sin cerrar el anterior con `pnpm turbo run typecheck lint test build` verde
y smoke test; al cerrar cada sprint se actualiza el estado (`docs/ESTADO_SPRINT_{n}.md`) y se deja el prompt del
siguiente.

---

## 11. Actualización Sprint 1

Estado actual: Sprint 1 implementado. El detalle operativo vive en
[`ESTADO_SPRINT_1.md`](ESTADO_SPRINT_1.md) y el siguiente prompt en
[`PROMPT_SPRINT_2_CODEX.md`](PROMPT_SPRINT_2_CODEX.md).

Cambios principales:

- Prisma schema con las 10 tablas exactas de demo + migracion inicial.
- Seed protagonista idempotente con admin, counter, conductores, vehiculos, reserva, viaje, comprobante,
  incidencia y auditoria.
- Auth.js v5 con credentials admin/counter/driver, guards de rutas y logout.
- `recordAudit` real en `packages/auditoria`.
- Tokens AZUL definitivos en `packages/shared/src/tokens`, consumidos por Tailwind web.
- Placeholders protegidos `/admin`, `/counter` y publico `/p/[token]`.

Verificación:

- Prisma format/validate: verde.
- `pnpm turbo run typecheck lint test build`: verde, 52/52 tasks.
- `apps/web` build: verde.
- Smoke real DB contra Supabase: verde. `postgis` + `pgcrypto`, `migrate deploy`, `seed` x2 idempotente,
  login admin/counter/driver, auditoría y reserva protagonista verificados.

## 12. Actualización Sprint 2

Estado actual: Sprint 2 implementado. El detalle operativo vive en
[`ESTADO_SPRINT_2.md`](ESTADO_SPRINT_2.md) y el siguiente prompt en
[`PROMPT_SPRINT_3_CODEX.md`](PROMPT_SPRINT_3_CODEX.md).

Cambios principales:

- `packages/voucher`: HMAC SHA-256, verificación anti-tampering y QR PNG/SVG.
- `apps/web`: rutas `/api/voucher/[id]/qr` y `/api/voucher/[id]/verify`.
- `packages/comprobantes`: plantillas HTML SUNAT-like y render PDF con Puppeteer; fallback PDF local si Chromium
  no está disponible.
- `apps/web`: ruta `/api/comprobantes/[id]/pdf` con adapter Supabase Storage si hay service role.
- `packages/integraciones/reniec`: cache in-memory de 3 DNIs del guion y proveedor APIs.net.pe.
- `apps/web`: ruta `/api/reniec/lookup` y vista `/admin/auditoria`.
- `tests/e2e/voucher-flow.spec.ts`: smoke de QR/verificación/tampering.

Verificación S2:

- Voucher unit tests: verde.
- Typecheck/lint/test/build enfocado: verde.
- Smoke real con Supabase DB: QR PNG 200, verify 200, tampering 400, RENIEC cacheado 200, PDF 200.
- Storage firmado quedó validado al iniciar S3, tras cablear Supabase y crear el bucket privado `comprobantes`.

S3 tomó el relevo con `/admin` operativo + Supabase Realtime + asignación manual conductor/unidad.

## 13. Actualización Sprint 3

Estado actual: Sprint 3 implementado. El detalle operativo vive en
[`ESTADO_SPRINT_3.md`](ESTADO_SPRINT_3.md) y el siguiente prompt en
[`PROMPT_SPRINT_4_CODEX.md`](PROMPT_SPRINT_4_CODEX.md).

Cambios principales:

- `/admin`: lista operativa de reservas con query inicial Prisma.
- `AdminReservasLive`: suscripción Supabase `postgres_changes` filtrada por `tenant_id` y polling de respaldo cada 10s.
- `/admin/reservas/[id]`: detalle de reserva, pasajero, solicitante, ruta, voucher, conductor/unidad y auditoría.
- Server Actions: `asignarConductor`, `asignarVehiculo`, `marcarExcepcion`, todas con `recordAudit`.
- Broadcast Supabase `reserva-{id}` después del commit DB exitoso.
- `/admin/metricas`: reservas hoy, asignaciones hoy, conductores activos y vouchers emitidos desde Prisma.
- `tests/e2e/admin-asignacion.spec.ts`: login admin → reserva seed → asignación → auditoría.

Verificación S3:

- `pnpm --filter @taxigreen/web typecheck lint test build`: verde.
- `pnpm e2e`: 3/3 verde.
- Supabase Storage real: bucket `comprobantes`, PDF Puppeteer y URL firmada 24h validados.
- Supabase Realtime real: `public.reservas` en `supabase_realtime`, `REPLICA IDENTITY FULL`, grants `SELECT`; smoke
  `postgres_changes` recibió UPDATE real.

## 14. Actualización Sprint 4

Estado actual: Sprint 4 implementado. El detalle operativo vive en
[`ESTADO_SPRINT_4.md`](ESTADO_SPRINT_4.md) y el siguiente prompt en
[`PROMPT_SPRINT_5_CODEX.md`](PROMPT_SPRINT_5_CODEX.md).

Cambios principales:

- `packages/ingesta`: extractor determinista de reservas WhatsApp con Zod, diccionarios, fechas Lima, RUC, vuelo,
  teléfono, pago, hotel/aeropuerto/zona y preguntas de aclaración.
- `packages/ia`: AnthropicProvider real con AI SDK, loader de prompts con frontmatter y `extraerReservaConFallback`.
- `apps/web`: `POST /api/ingesta/extraer`.
- `apps/web/wa-sim`: simulador WhatsApp Web con 3 conversaciones, panel de extracción, JSON/confianza y creación de
  reserva auditada.
- `tests/e2e/wa-sim.spec.ts`: login admin → `/wa-sim` → extrae protagonista → crea reserva → verifica detalle.

Verificación S4:

- `pnpm turbo run typecheck lint test build`: verde, 52/52 tasks.
- `pnpm e2e`: 4/4 verde.
- Smoke API con `next start`: protagonista extrae `fuente=algoritmo`, `confianza=1`, origen Jorge Chávez, destino
  Av. Pardo 123, pasajero Valeria Mendoza, vuelo LA2456 y pago `voucher_hotel`.
- Capturas desktop/mobile de `/wa-sim`: sin solapes ni texto roto.
- DB real limpiada de reservas `TG-WA-*` generadas por E2E; baseline protagonista conservado.

## 15. Actualización Sprint 5

Estado actual: Sprint 5 implementado. El detalle operativo vive en
[`ESTADO_SPRINT_5.md`](ESTADO_SPRINT_5.md), la guía manual en
[`GUIA_PRUEBAS_DEMO.md`](GUIA_PRUEBAS_DEMO.md) y el siguiente prompt histórico en
[`PROMPT_SPRINT_6_CODEX.md`](PROMPT_SPRINT_6_CODEX.md).

Cambios principales:

- `packages/asignacion`: `puntuarCandidatos()` y `sugerirAsignacionDeterminista()` con cola, distancia, match y
  capacidad.
- `packages/ia`: `sugerirAsignacionConRazonamiento()` usando `withFallback`; el LLM solo redacta la razón.
- `apps/web`: `POST /api/asignacion/sugerir` protegido por sesión.
- `/admin/reservas/[id]`: tarjeta "Copiloto recomienda", aceptar sugerencia y override humano auditado.
- `tests/e2e/asignacion-sugerencia.spec.ts`: flujo `/wa-sim` → detalle → sugerencia → aceptación → auditoría.

Verificación S5:

- `pnpm turbo run typecheck lint test build`: verde, 52/52 tasks.
- `pnpm e2e`: 5/5 verde.
- Captura desktop de reserva pendiente revisada sin solapes.
- Bug corregido: la tarjeta ya no recalcula otra sugerencia después de que una reserva queda asignada.

Sprint 6 tomó el relevo con app conductor React Native + Expo.

## 16. Actualización Sprint 6

Estado actual: Sprint 6 implementado. El detalle operativo vive en
[`ESTADO_SPRINT_6.md`](ESTADO_SPRINT_6.md), la guía manual en
[`GUIA_PRUEBAS_DEMO.md`](GUIA_PRUEBAS_DEMO.md) y el siguiente prompt en
[`PROMPT_SPRINT_7_CODEX.md`](PROMPT_SPRINT_7_CODEX.md).

Cambios principales:

- `apps/driver`: login email+PIN, sesión en `expo-secure-store`, Home, Perfil y placeholder `asignacion/[id]`.
- `apps/driver/src/features/api/auth/push/realtime`: cliente backend, auth mobile, registro Expo Push Token y canal
  Supabase `conductor-{conductorId}`.
- `apps/web`: `POST /api/conductor/login` y `POST /api/conductor/fcm-token` con JWT Bearer móvil.
- `apps/web/src/lib/push.ts`: Expo Push Service con degradación controlada.
- `/admin/reservas/[id]`: al asignar emite `reserva-{id}`, `conductor-{conductorId}` y prepara push.

Verificación S6:

- `apps/web` unit tests: 7/7.
- `apps/web build`: verde con rutas móviles presentes.
- `apps/driver expo config`: name/scheme/android.package/plugins correctos.
- Smoke real `next start` + Supabase: login conductor 200, registro token 200, endpoint sin Bearer 401; DB limpiada
  después del smoke.
- `pnpm turbo run typecheck lint test build`: verde, 52/52 tasks.
- `pnpm e2e`: 5/5 verde; logs de servidor mostraron `broadcastReserva` y `broadcastConductor` con `success:true`,
  push degradado a `missing_token` por falta de token Android real.
- DB post-E2E: reservas `TG-WA-*` borradas, auditoría de prueba purgada, `fcm_token` limpiado y reseed ejecutado.

**Auditoría de cierre S6 (2026-06-01):** se ejecutó por primera vez un **bundle real de Metro** (`expo export`),
que el cierre original omitió. Destapó 3 bugs invisibles al CI (el driver no se bundlea en el pipeline; su `build`
es un `echo`): (1) la app **no bundleaba** por `react-native-worklets/plugin` (drift de `nativewind` a 4.2.4 /
`css-interop` 0.2.4 incompatible con reanimated 3.10) → pin `nativewind 4.1.23` + override
`react-native-css-interop 0.1.22`; (2) `@babel/runtime` no resoluble bajo pnpm isolated → dep directa del driver;
(3) race de navegación cold-start (push tap) → consolidado en `index.tsx`. Bundle Android ahora **EXIT 0 (1203
módulos, Hermes .hbc)**. Además se validó la **recepción real** de broadcast `conductor-{id}` (no solo el envío).
Detalle en [`ESTADO_SPRINT_6.md §8`](ESTADO_SPRINT_6.md). Gate nuevo: bundlear el driver al cerrar cada sprint de app.

## 17. Actualización Sprint 7

Estado actual: Sprint 7 implementado. El detalle operativo vive en
[`ESTADO_SPRINT_7.md`](ESTADO_SPRINT_7.md), la guía manual en
[`GUIA_PRUEBAS_DEMO.md`](GUIA_PRUEBAS_DEMO.md) y el siguiente prompt en
[`PROMPT_SPRINT_8_CODEX.md`](PROMPT_SPRINT_8_CODEX.md).

Cambios principales:

- `apps/web`: `GET /api/conductor/asignacion/[id]` y `POST /api/conductor/asignacion/[id]/estado` con Bearer
  conductor, scoping por tenant/conductor y sin exposición de hashes.
- `apps/web/src/lib/conductor-asignacion.ts`: transición secuencial
  `asignado -> en_camino -> en_punto -> a_bordo -> finalizado`, mapeo de reserva y serialización móvil.
- `apps/web/src/lib/supabase/server.ts`: broadcast `estado` en `reserva-{id}`.
- `apps/driver`: pantalla real `asignacion/[id]` con pasajero, vuelo, voucher, punto de encuentro, mapa/fallback,
  una acción primaria secuencial y resumen final.
- `apps/driver/src/features/location`: foreground location con `watchPositionAsync` 3s/10m y broadcast `posicion`.
- `apps/driver`: `expo-keep-awake` mientras el viaje está activo y `expo-network` para reintento conservador.
- `packages/database/prisma/seed.ts`: reseed limpia timestamps de viaje para baseline canónico.

Verificación S7:

- `apps/web` unit tests: 11/11.
- Smoke real `next start` + Supabase: login conductor 200, GET asignación 200, sin Bearer 401, salto de estado 409,
  secuencia completa hasta `por_liquidar` 200, conductor2 404/404, broadcast `estado` OK.
- `pnpm --filter @taxigreen/driver exec expo export --platform android`: EXIT 0, 1350 módulos, .hbc 4.09 MB.
- `pnpm turbo run typecheck lint test build`: verde, 52/52 tasks.
- `pnpm e2e`: 5/5 verde.
- DB post-verificación: 0 `TG-WA-*`, 0 `fcm_token`, auditoría solo `seed_sprint_1`, protagonista
  `asignada/asignado` con timestamps S7 `null`.

Pendiente ambiental S7: Android físico/dev client para validar ubicación real, keep-awake físico, push real y mapa
Mapbox nativo. En Expo Go común la pantalla conserva fallback textual operable.

Sprint 8 tomó el relevo con `/p/[token]`, comprobante/calificación e incidencia objeto olvidado.

## 18. Actualización Sprint 8

Estado actual: Sprint 8 implementado. El detalle operativo vive en
[`ESTADO_SPRINT_8.md`](ESTADO_SPRINT_8.md), la guía manual en
[`GUIA_PRUEBAS_DEMO.md`](GUIA_PRUEBAS_DEMO.md) y el siguiente prompt en
[`PROMPT_SPRINT_9_CODEX.md`](PROMPT_SPRINT_9_CODEX.md).

Cambios principales:

- `apps/web`: `/p/[token]` público con contrato seguro por token, Realtime `reserva-{id}`, polling 10s, mapa
  Mapbox GL JS opcional y fallback textual.
- `apps/web`: endpoints `GET /api/pasajero/[token]`, comprobante tokenizado, PDF, calificación triple e incidencia.
- `packages/bienestar`: clasificador determinista de objeto olvidado con tests.
- `apps/web`: `/bienestar/[caso]` para seguimiento público del caso y `/admin/bienestar` para bandeja operativa mínima.
- `apps/driver`: Realtime/push de incidencia, tarjeta en Home y pantalla oculta `incidencia/[id]` con respuestas
  `encontrado`, `no_visto` y `revisar`.
- `apps/web/src/lib/supabase/server.ts`: broadcast `incidencia` en `reserva-{id}` y `conductor-{conductorId}`.

Verificación S8:

- `packages/bienestar`: 3/3 tests.
- `apps/web` unit tests: 11/11.
- `apps/web build`: rutas S8 presentes.
- `pnpm turbo run typecheck lint test build`: verde, 52/52 tasks.
- `pnpm e2e`: 6/6 verde.
- `pnpm --filter @taxigreen/driver exec expo export --platform android`: EXIT 0, 1352 módulos, .hbc 4.1 MB.
- Smoke real `next start` + Supabase: `/p/tg_demo_passenger_001` 200, `GET /api/pasajero/...` 200, incidencia
  `abierta -> en_resolucion -> cerrada` con 3 auditorías correctas.
- DB post-verificación: 0 `TG-WA-*`, 0 `fcm_token`, auditoría solo `seed_sprint_1`, protagonista
  `asignada/asignado` con timestamps S7 `null`.

Pendiente ambiental S8: Android físico/dev client para push real de incidencia y navegación desde notificación. La
ruta del link pasajero mantiene fallback textual; **el routing real (Directions) se planifica e integra en S9** (ver
§19), no queda fuera del producto.

Sprint 9 ya implementó routing en tiempo real, `/counter` con QR de un solo uso, landing, reset/guion,
endurecimientos y preparación de deploy Railway.

---

## 19. Actualización Sprint 9 — routing, counter y cierre de demo

Estado actual: Sprint 9 implementado y verificado localmente. El detalle operativo vive en
[`ESTADO_SPRINT_9.md`](ESTADO_SPRINT_9.md). El diseño original sigue documentado en
> [`PLAN_RUTAS_TIEMPO_REAL_S9.md`](PLAN_RUTAS_TIEMPO_REAL_S9.md).

**Qué se construyó:** distancia real por carretera, ETA real con tráfico, ruta dibujada que sigue las calles y
recálculo cuando el conductor se mueve. **No fue scope creep:** la regla de negocio #7 exige "GPS, ETA y mapa
reales" y `PLAN_SOFTWARE §7.8` presupuesta Mapbox a **USD 0**; solo su implementación estaba diferida.

**Patrón (calca `packages/ia`):** `packages/rutas` con (a) **estimador determinista siempre
activo** (haversine·sinuosidad + velocidad media — lo que hoy hace `estimateEtaMinutos` + `buildLine`), (b)
adapter **Mapbox Directions `driving-traffic`**, (c) `withRutaFallback()` gobernado por **`RUTAS_HABILITADAS`**.
Sin token o flag off ⇒ estimación; con token ⇒ ruta real.

**Flujo de datos:** `GET /api/rutas/calcular` server-side (token pasajero o Bearer conductor) con **caché
in-memory + throttle**; el token de Directions (`MAPBOX_SERVER_TOKEN`) **no sale al cliente** (los tiles siguen
con `NEXT_PUBLIC_MAPBOX_TOKEN`). Recálculo cliente-side debounced: umbral **120 m y 6 s**; tramo según fase
(`en_camino`→punto, `a_bordo`→destino). Geometría se actualiza con `setData` **sin recrear el mapa** (respeta el
fix de auditoría S8).

**Inventario que cambió:** `packages/rutas` (nuevo), `api/rutas/calcular` (nuevo), `lib/pasajero.ts` (ETA pasa a
ser fallback; contrato `tracking` gana `geometry`/`distancia`/`duración`/`fuente`), `p/[token]/seguimiento-cliente.tsx`
(pinta geometry real + badge + recálculo), driver `AssignmentMap.tsx` + nuevo `features/routing/use-route.ts`,
`seed-guion.ts` (polyline pre-cargada). **No se toca** `packages/asignacion/heuristica.ts` (S5 sigue con
haversine) ni el schema (cero tablas; caché in-memory).

**Costo $0 demostrable:** free tier 100k req/mes; ~50–150 req por ensayo con throttle+caché; degradación a
estimación ante 429/timeout/sin token.

### Gotcha de entorno S9 (routing)

- **Token de Directions = token público `pk.*` con scopes por defecto.** Directions viene habilitado en un
  `pk.*` por defecto; si ya hay token de tiles (S7/S8) **se puede reutilizar** como `MAPBOX_SERVER_TOKEN`.
  `MAPBOX_DOWNLOAD_TOKEN` (`sk.*`, DOWNLOADS:READ) es **solo** para descargar el SDK nativo en EAS y **no**
  sirve para Directions. Mantener `MAPBOX_SERVER_TOKEN` **server-side** (sin prefijo `NEXT_PUBLIC_`).

Cambios adicionales S9:

- `/counter` quedó operativo para supervisor con validación manual/cámara progresiva y consumo QR one-time.
- `/` quedó como landing pública de demo con CTA WhatsApp y link pasajero.
- `db:seed-guion` deja la DB lista para narrar la demo con 10 posiciones pre-cargadas.
- `mobile-smoke.yml` agrega gate Android (`typecheck`, `lint`, `expo export`).
- `env.ts` endurece secretos críticos en runtime de producción.
- Redirect PDF pasajero usa `Location` relativo para evitar `https://0.0.0.0:3000/...` en Railway.

Verificación S9:

- `pnpm turbo run typecheck lint test build`: verde, 56/56 tasks.
- `pnpm e2e`: 7/7 verde.
- `pnpm --filter @taxigreen/driver exec expo export --platform android`: EXIT 0, 1354 módulos.
- Smoke local `next start`: landing 200, pasajero 200, ruta pública 200 con `fuente=mapbox`, counter 307 protegido,
  PDF pasajero 307 relativo.
- Deploy Railway: `2291ae23-1e18-436a-918b-4ecf29b5dc29` SUCCESS/RUNNING; producción smokeada en
  `https://web-production-816a4.up.railway.app`.
- Smoke QR: verify 200, consume supervisor 200, reuse 409.
- `db:seed-guion`: deja QR no consumido y DB limpia para demo.

**Auditoría de cierre S9 (2026-06-04):** revisión quirúrgica del código y de producción viva. Núcleo sólido; se
corrigió **un bug real de CI** (`deploy-web.yml` pasaba `--project` sin `--environment`, que aborta con un project
token → fix: `railway up --service web --detach`) y se confirmó que el **bug de PDF `0.0.0.0:3000` ya estaba
resuelto** en el deploy vivo (cadena 307 relativo → Supabase firmado → 200). Smoke de producción: `/` 200, ruta
`fuente=mapbox` 691 puntos, mapa con token inlineado, counter 307 relativo. `RAILWAY_TOKEN` (project token) válido y
en GitHub Secrets. Detalle en [`ESTADO_SPRINT_9.md §7`](ESTADO_SPRINT_9.md).

---

## 20. Endurecimiento de pruebas — caza de bugs ocultos (2026-06-05)

Pase quirúrgico de cobertura sobre los puntos donde el sistema **aparenta funcionar por fuera** pero un cambio
silencioso rompería la seguridad o la parte visual de la demo (los peores bugs viven en esos detalles). Foco: el
contrato exacto de cada borde, no el "camino feliz". Todo lo nuevo corre en el **gate de CI** (`pnpm turbo run
typecheck lint test`) salvo el E2E del counter (necesita pila viva + reseed) y la prueba física de APK (manual).

**Antes → después:** web `11 → 51` tests unit (+40), `@taxigreen/asignacion` `6 → 14` (+8), `@taxigreen/rutas`
`4 → 6` (+2) = **+50 unit** y **+1 E2E**. Gate completo: **53/53 tareas verdes** (`typecheck lint test`).

### 20.1 Qué blinda cada archivo nuevo

| Archivo | Qué garantiza (regresión = rojo en CI) |
|---|---|
| [`apps/web/src/middleware.test.ts`](../apps/web/src/middleware.test.ts) | Matriz de autorización por rol: `/admin` y `/wa-sim` sólo `admin_tenant`/`despachador`; `/counter` sólo `supervisor`. Cubre anónimo, rol cruzado (supervisor→/admin, despachador→/counter, conductor→/admin), subrutas profundas y preservación de `callbackUrl`. Invertir un `!==` se vuelve rojo. |
| [`apps/web/src/lib/conductor-asignacion-repository.test.ts`](../apps/web/src/lib/conductor-asignacion-repository.test.ts) | **Contrato de aislamiento** (lo que separa "funciona" de "es seguro"): el `where` de Prisma filtra por `tenant_id`, `conductor_id`, `deleted_at`, usuario `rol=conductor` `activo` no borrado, y la activa excluye `cancelada` y ordena por servicio más reciente. Borrar cualquier eje del scope (un conductor vería reservas de otro, o de otro tenant, o desactivado) → rojo. |
| [`apps/web/src/app/api/conductor/asignacion/activa/route.test.ts`](../apps/web/src/app/api/conductor/asignacion/activa/route.test.ts) | Endpoint clave de móvil (asignación al abrir sin push): `401` sin Bearer / token inválido, asignación serializada con token válido, `{ asignacion: null }` sin viaje, y que **no filtra** `password_hash`/`voucher_qr_payload`. Tokens Bearer **reales** (no mock del verificador). |
| [`apps/web/src/lib/pasajero.test.ts`](../apps/web/src/lib/pasajero.test.ts) | **Anti-recta del servidor**: con estimación determinista NO entrega geometría (recta) pero sí ETA/distancia; con curva Mapbox real (100 vértices) sí; geometría Mapbox degenerada de 2 puntos NO se pinta (guard `>2`); sin coordenadas no calcula ruta ni inventa trazo (fallback textual); comprobante sólo disponible al finalizar. Protege que el link `/p/[token]` no mienta visualmente. Ver [[mapas-solo-ruta-real]]. |
| [`apps/web/src/lib/auth/secret.test.ts`](../apps/web/src/lib/auth/secret.test.ts) | Fail-fast de `AUTH_SECRET`: lanza en runtime de producción sin secreto; NO lanza en build de producción ni en CI. Evita firmar sesiones JWT con la clave de desarrollo en producción. |
| [`apps/web/src/lib/conductor-asignacion.test.ts`](../apps/web/src/lib/conductor-asignacion.test.ts) (ampliado) | Máquina de estados del viaje: recorrido completo hacia adelante, rechazo de retroceso, estado terminal (`finalizado`), `cancelado` fuera de la secuencia y prohibición de saltar un estado intermedio. |
| [`packages/asignacion/src/heuristica.test.ts`](../packages/asignacion/src/heuristica.test.ts) (ampliado) | Van preferida sobre minivan con >4 pax; la distancia penaliza con cola/match iguales; distancia mock estable sin coordenadas; `getPesosAsignacion` lee `ASIGNACION_PESO_*` del entorno, los overrides ganan, valores no numéricos vuelven al default y el cambio se propaga a `factores.pesos`. |
| [`packages/rutas/src/rutas.test.ts`](../packages/rutas/src/rutas.test.ts) (ampliado) | El proveedor real pasa a través cuando responde y el flag está activo; `calcularRutaEstimada` lanza `coordenadas_invalidas` (no degrada en silencio). Suma a los tests previos de `flag_off`, timeout y fallo del proveedor. |
| [`tests/e2e/counter-qr.spec.ts`](../tests/e2e/counter-qr.spec.ts) | **QR de un solo uso (E2E):** consumir exige supervisor (`401` sin sesión), primer consumo `200 consumed=true`, reuso `409 voucher_ya_validado` con `consumedAt`. Verificado con `playwright --list`; corre con `pnpm e2e` sobre DB recién sembrada. |

### 20.2 Qué queda deliberadamente fuera (manual o nivel de pila)

- **Concurrencia real del QR** (dos consumos simultáneos → 1×200 / 1×409): exige una transacción Postgres real con
  `pg_advisory_xact_lock`; no es comprobable con mocks. Queda como prueba E2E/manual sobre DB viva.
- **E2E del counter:** es **destructivo** (consume el voucher del guion y escribe `voucher_qr_consumido`). Correr
  `pnpm --filter @taxigreen/database db:seed-guion` antes de `pnpm e2e` (mismo requisito que la suite 7/7 tras reseed).
- **Anti-recta del lado conductor** (`apps/driver`: `AssignmentMap.tsx`, `seguimiento-cliente.tsx`,
  `features/routing/use-route.ts`): la misma regla `>2 vértices` está replicada en el cliente RN, pero `apps/driver`
  no tiene runner de tests (su `build`/`test` es un `echo`); el guard se valida vía el contrato del servidor
  (`pasajero.test.ts`) y el bundle Metro. Ver [[push-no-en-apk-standalone]].
- **APK físico Android:** instala/login/Realtime/mapa nativo/cierre — checklist manual del usuario.

*Fin. Este documento se actualiza al cierre de cada sprint para mantener la cobertura al 100% del avance.*

---

## 21. QA movil con ojos reales (2026-06-06)

Se instalo toolchain Android/Expo/Maestro en WSL y se valido una ruta real de capturas para `apps/driver`.
Detalle operativo completo en [`QA_MOVIL_ANDROID_OJOS_REALES.md`](QA_MOVIL_ANDROID_OJOS_REALES.md).

**Resultado:** BlueStacks expuesto por ADB en `127.0.0.1:5556` permitio instalar el APK preview EAS y generar
captura real de la app nativa en `artifacts/maestro/driver-bluestacks-login.png` (`1080x1920`, login del conductor).

**Script nuevo:** `pnpm visual:driver:adb` (`scripts/visual-driver-adb.mjs`) abre la app por ADB, captura login,
ingresa PIN `1234`, captura home y, si existe una asignacion activa, captura la pantalla de asignacion.

**Hallazgo ambiental:** los AVDs WSL (`taxigreen_pixel`, `taxigreen_atd`) quedaron instalados, pero sin permiso KVM
(`/dev/kvm`) el emulador corre por software, produce ANR con `@rnmapbox/maps`/`Mapbox LifecycleService` y/o
screenshots negros. Para usar AVDs como runner visual estable, ejecutar `sudo gpasswd -a "$USER" kvm` y reabrir WSL.
Mientras tanto, el carril recomendado es BlueStacks abierto manualmente + `adb connect 127.0.0.1:5556` + script ADB.

### 21.1 QA visual web (Playwright) — `pnpm visual:web`

`scripts/visual-web.mjs` levanta `next dev` en un puerto propio, **pre-calienta rutas**, hace login de counter
esperando hidratación y captura las superficies cliente (landing, pasajero, counter) en **móvil+desktop ×
claro+oscuro** → `artifacts/playwright/*.png` + `report.html` (`artifacts/` está gitignored). Es evidencia visual
real para no revisar "a ciegas": así se cazó la **corrupción del pasajero en desktop** (mapa full-bleed → se
contuvo en columna 480px) y se afinó el **stepper del counter** que se cortaba en móvil. Gotchas aprendidos
(documentados en el script): `next dev` (no `start`) porque las cookies `secure` de Auth.js no viajan sobre
`http://localhost`; esperar hidratación antes de enviar el form (si no, hace GET nativo); y `waitForURL('**/X')`
casa también con `?callbackUrl=/X` (usar matcher de pathname exacto). Por esto último se endureció
`tests/e2e/admin-asignacion.spec.ts`.

### 21.2 Driver EN VIVO (dev client + Metro) y renovación premium del conductor (F3.5)

**Método recomendado para ver el código de la rama en el móvil** (no el APK preview, que es un snapshot que
apunta a producción): **dev client + Metro + backend local**, con `adb reverse tcp:8081` y `tcp:3000` para que el
`localhost` de Android llegue a WSL (red WSL en `mirrored`). Guía paso a paso en
[`QA_MOVIL_ANDROID_OJOS_REALES.md §0`](QA_MOVIL_ANDROID_OJOS_REALES.md). Con esto se verificó en vivo (BlueStacks,
Fast refresh ON) el flujo real del conductor y se aplicó el **primer pase premium**:

- `apps/driver/app/(auth)/home.tsx`: se elimina la jerga (`Realtime`/`Push no provisionado`); indicador humano
  "● En línea/Conectando", estado Disponible/En pausa, unidad con icono y CTA "Tienes un viaje → Abrir viaje".
- `apps/driver/app/(auth)/_layout.tsx`: **iconos de tabs** reales (Ionicons; antes tofu) y **barra de tabs
  oculta** en `asignacion/[id]`/`incidencia/[id]` para navegación full-screen.
- `apps/driver/app/login.tsx`: layout centrado/balanceado + mensaje de error humano.
- `packages/database/prisma/seed.ts`: `pasajero_nombre` del protagonista pasa de "Pasajero final del huésped" a
  **"Valeria Mendoza"** (consistente con tests y conversación WhatsApp).
- **Limitación conocida:** el mapa nativo `@rnmapbox/maps` no pinta en BlueStacks (GL del emulador) → queda área
  oscura; en dispositivo físico y en la web sí pinta. Registrado en `DEUDA_TECNICA.md`.
- Verde: `expo export android` EXIT 0 (4.48 MB), driver typecheck+lint.

### 21.3 Tonalidad móvil: dark-first + verde dopamina (2026-06-06)

Por feedback del usuario (azul = simplista/cero dopamina; modo noche negro/gris; preferencia por verde) se
**reabrió la decisión AZUL cerrada** (CLAUDE.md §0/§4) **sólo para `apps/driver`**: nueva paleta en
`apps/driver/tailwind.config.js` con `brand` esmeralda (`#10B981`/glow `#34D399`) e `ink` negro/gris neutro
(`#0A0A0B`…`#2E2E34`). La app conductor pasa a **dark-first** (login, home, navegación, tabs, `TouchButton`,
`NumPad`); CTAs verde brillante con texto oscuro (alta dopamina). Verificado en vivo (dev client) y `expo export`
EXIT 0. **La web sigue en azul**; migrar los tokens compartidos (`packages/shared/src/tokens/colors.ts`) + el dark
mode web a negro/gris/verde queda **pendiente de confirmación** del usuario.

**Ver el mapa nativo (crítico, no resuelto por BlueStacks):** plan robusto en
[`QA_MOVIL_ANDROID_OJOS_REALES.md §00`](QA_MOVIL_ANDROID_OJOS_REALES.md) — Android físico por Wi-Fi ADB + `scrcpy`
(mejor) o AVD con KVM (`sudo gpasswd -a "$USER" kvm` + reabrir WSL). Lo ejecuta el usuario.

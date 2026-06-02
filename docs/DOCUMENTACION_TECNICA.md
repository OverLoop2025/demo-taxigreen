# Documentación Técnica — Demo Taxi Green

**Versión:** 1.7 · **Fecha:** 2026-06-02 · **Cubre:** Sprint 0-7 — 100% del avance actual.
**Ámbito:** este documento describe **todo lo que existe hoy en el monorepo de software**. Para el *qué construir*
y el *por qué de negocio*, la fuente de verdad es [`_FUENTE_DESARROLLO/`](../_FUENTE_DESARROLLO/) y
[`07_PLAN_EJECUCION/`](../07_PLAN_EJECUCION/); este doc no los reemplaza, los **complementa con el estado real del código**.

Documentos vivos relacionados:
- [`../CLAUDE.md`](../CLAUDE.md) — instrucciones maestras de build (decisiones cerradas).
- [`ESTADO_SPRINT_0_Y_HANDOFF.md`](ESTADO_SPRINT_0_Y_HANDOFF.md) — handoff a Sprint 1 (estado real + gotchas).
- [`ESTADO_SPRINT_7.md`](ESTADO_SPRINT_7.md) — cierre real de Sprint 7.
- [`PROMPT_SPRINT_8_CODEX.md`](PROMPT_SPRINT_8_CODEX.md) — prompt copy-paste para ejecutar Sprint 8.
- [`GUIA_PRUEBAS_DEMO.md`](GUIA_PRUEBAS_DEMO.md) — guía no técnica para levantar y probar S0-S7.

---

## 1. Resumen ejecutivo

Demo de **Taxi Green**: digitalización trazable de la operación de un taxi aeroportuario en Lima. La demo cuenta
**un** flujo protagonista A→Z (~12 min): un hotel/concierge solicita por WhatsApp un **recojo en el Aeropuerto
Jorge Chávez** para un huésped que llega a Lima; el sistema crea la reserva, el operador (humano) aprueba la
sugerencia de conductor+unidad, el conductor (app nativa) recoge en **Salida 3, columna F2** y lleva al pasajero a
**Av. Pardo 123, Miraflores**; cierre con comprobante y calificación; arco corto de objeto olvidado.

**Estado actual:** **Sprint 7 implementado**. Sprint 1 quedó cerrado contra Supabase con migración, seed idempotente,
login real y auditoría. Sprint 2 agregó voucher QR HMAC, comprobante PDF visual, RENIEC cacheado y vista de auditoría.
Sprint 3 agregó `/admin` operativo con Realtime, detalle de reserva, asignación manual conductor/unidad y métricas.
Sprint 4 agrega ingesta determinista, wrapper LLM opcional y simulador `/wa-sim` capaz de crear reservas auditadas.
Sprint 5 agrega heurística de asignación, racionalización opcional LLM y tarjeta de sugerencia auditable en el detalle
de reserva. Sprint 6 agrega app conductor Expo con login email+PIN, sesión en SecureStore, registro push degradable,
Realtime `conductor-{id}` y navegación a asignación. Sprint 7 agrega detalle activo de asignación, endpoints móviles
Bearer, estados secuenciales, ubicación foreground y broadcast `posicion`/`estado` en `reserva-{id}`.
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
> determinista de ingesta; S5 ya replica el patrón para asignación y S8 lo hará para bienestar.

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
│  │     ├─ app/ layout.tsx · page.tsx · admin/{auditoria,metricas,reservas}/ · wa-sim/ · api/{admin,auth,voucher,comprobantes,reniec,ingesta,asignacion,conductor}/ · p/[token]
│  │     ├─ components/ brand-header.tsx · ui/* · admin/{audit-table,admin-reservas-live}.tsx · auth/login-form.tsx
│  │     ├─ lib/ env.ts · logger.ts · sentry.ts · auth/* · conductor-token.ts · conductor-asignacion*.ts · push.ts · admin/reservas.ts · supabase/{client,server}.ts · supabase-storage.ts
│  │     └─ __tests__/ smoke.test.ts + lib/* tests (vitest)
│  └─ driver/              React Native + Expo SDK 51 — app conductor
│     ├─ package.json · app.json (name/slug/scheme/android.package/plugins/permisos)
│     ├─ tsconfig.json · babel.config.js · metro.config.js (monorepo) · tailwind.config.js (NativeWind)
│     ├─ global.css · expo-env.d.ts · nativewind-env.d.ts · .env.example
│     ├─ app/ _layout.tsx · index.tsx · login.tsx · (auth)/{home,perfil,asignacion/[id]}
│     └─ src/ components/* · features/{api,assignment,auth,location,network,push,realtime} · lib/env.ts (Zod, EXPO_PUBLIC_*)
│
├─ packages/
│  ├─ database/            Prisma 6 — schema 10 tablas + migración inicial + seed protagonista + scripts db:*
│  ├─ shared/              tokens AZUL (colors/typography) + FLUJO_PROTAGONISTA + test de tokens
│  ├─ ia/                  LLMProvider + AnthropicProvider real + withFallback + loader prompts + extractor/racionalizador LLM
│  │  └─ prompts/          ingesta-whatsapp.v1.md · aclaracion-datos-faltantes.v1.md · asignacion-racional.v1.md · clasificacion-incidencia.v1.md
│  ├─ ingesta/             DETERMINISTA (parser reservas WhatsApp) — implementado en S4
│  ├─ asignacion/          DETERMINISTA (heurística scoring) — implementado en S5
│  ├─ bienestar/           DETERMINISTA (clasificador incidencias) — placeholder
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
├─ tests/e2e/              Playwright: smoke, voucher, admin, wa-sim y asignación sugerida (corre con `pnpm e2e`)
│
└─ .github/workflows/
   ├─ ci.yml               install → turbo typecheck/lint/test/build (IA_HABILITADA=false)
   └─ deploy-web.yml       Railway (gated por RAILWAY_TOKEN; manual hasta tener credenciales)
```

**13 paquetes de workspace:** `@taxigreen/web`, `@taxigreen/driver`, `@taxigreen/{database, shared, ia, ingesta,
asignacion, bienestar, voucher, comprobantes, auditoria}`, `@taxigreen/integraciones-{reniec, lap-atu}`.

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
- `src/app/page.tsx` — landing placeholder que enumera las superficies y enlaza el flujo (CTA WhatsApp).
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
- `src/lib/supabase/server.ts` — broadcast server-side `reserva-{id}` (`asignacion`/`estado`) y
  `conductor-{conductorId}`.
- `src/app/admin/reservas/[id]/sugerencia-card.tsx` — tarjeta "Copiloto recomienda" con aceptar/override.
- `next.config.ts` — transpila paquetes internos (`shared`, `voucher`, `comprobantes`, `reniec`, `ingesta`, `asignacion`, `ia`) y deja Puppeteer/Chromium externos para no romper `ws`.
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
- `src/lib/env.ts` — env tipadas con Zod (prefijo `EXPO_PUBLIC_*`, incluye `EXPO_PUBLIC_EXPO_PROJECT_ID`).

**packages/database**
- `prisma/schema.prisma` — **vacío a propósito** (datasource Postgres + generator). Las 10 tablas llegan en S1.
- `src/index.ts` — cliente Prisma singleton (patrón global, log condicionado por `NODE_ENV`).
- `package.json` — scripts `db:migrate/db:deploy/db:seed/db:studio/db:reset` listos.

**packages/ia** (la capa que materializa el enfoque del §2)
- `src/llm-provider.ts` (interfaz) · `src/providers/anthropic.ts` (AI SDK/Anthropic) · `src/fallback.ts`
  (withFallback funcional) · `src/prompts.ts` (frontmatter loader) · `src/extractor-llm.ts` (ingesta con
  validación determinista) · `src/racionalizador-llm.ts` (explica sugerencia S5 sin decidir) · `prompts/*.v1.md`
  (4 prompts versionados).

---

## 6. Cómo ejecutar (Quick Start)

```bash
# Requisitos: Node 22 LTS (.nvmrc) y pnpm 9+. (La máquina actual usa Node 24 / pnpm 10; compatible.)
pnpm install                         # instala 13 workspaces. Sin TTY (CI/automatización): CI=true pnpm install

# Variables de entorno (todas opcionales en Sprint 0)
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/driver/.env.example apps/driver/.env

# (Opcional) Postgres local con PostGIS
docker compose -f infra/docker-compose.yml up -d

# Verificación completa (debe quedar en verde: 52/52 tareas)
pnpm turbo run typecheck lint test build

# Web en http://localhost:3000
pnpm turbo run dev --filter=@taxigreen/web

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
| `pnpm install --frozen-lockfile` resuelve los 13 workspaces | ✅ |
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

## 9. Qué NO se construyó todavía (y es correcto)

Conforme al plan, S0-S7 dejaron cimentación, datos, auth, artefactos físico-digitales, despacho operativo, ingesta
WhatsApp determinista, sugerencia automática de asignación y app conductor operativa con estados/ubicación
foreground. Todavía no existe tracking completo del pasajero, flujo objeto olvidado E2E, counter final, deploy ni
video respaldo. Todo eso entra por sprint (S8-S9).

**Prohibido en toda la demo** (no construir aunque se pida): app pasajero nativa, OAuth pasajero, portal `/empresa`,
OCR on-device, biometría, background location, RLS activo, cadena RENIEC, 9 tipologías extra de bienestar,
marketplace/subasta, tarifa dinámica, flight tracking, liquidación real, SaaS, iOS. (Canónico: `PLAN_SOFTWARE §2.3`/`§6`.)
Todavía faltan por sprint: tracking completo `/p/[token]` e incidencia E2E (S8), counter final + deploy (S9).

---

## 10. Próximos pasos (Sprint 8 y siguientes)

**Sprint 8**: link pasajero `/p/[token]` con tracking en vivo, comprobante/calificación e incidencia simple de
objeto olvidado. Prompt copy-paste listo en [`PROMPT_SPRINT_8_CODEX.md`](PROMPT_SPRINT_8_CODEX.md).

**S8→S9** siguen el mismo patrón (`/p/[token]`+incidencia → counter+landing+deploy). **Regla de oro:** no se abre
un sprint sin cerrar el anterior con `pnpm turbo run typecheck lint test
build` verde + smoke test; al cerrar cada sprint se actualiza el estado (`docs/ESTADO_SPRINT_{n}.md`) y se deja el
prompt del siguiente.

---

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

Próximo sprint: S8 `/p/[token]` con tracking, comprobante/calificación e incidencia objeto olvidado.

*Fin. Este documento se actualiza al cierre de cada sprint para mantener la cobertura al 100% del avance.*

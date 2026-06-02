# SPRINT.md — Construcción de la DEMO de Taxi Green

**Versión:** 3.0 — Redirección crítica: 10 sprints enfocados en UN flujo protagonista, app conductor en React Native + Expo, real-time Supabase, IA agnóstica desde demo
**Fecha:** 2026-05-26
**Alcance exclusivo:** Horizonte 1 — DEMO según [PLAN_SOFTWARE.md v4.0](./PLAN_SOFTWARE.md) §2.
**No cubre:** MVP, Futuro, Por validar, No construir todavía. Esos se mencionan solo cuando una decisión del demo siembra algo futuro (marca `[Semilla MVP]`).

---

## 0. Reglas de oro antes de empezar

Estas reglas son **no negociables**. Cualquier sprint que las viole se reinicia.

1. **La demo cuenta UN flujo protagonista, no demuestra un producto.** Si una tarea no contribuye al flujo A→Z (Hotel WhatsApp → reserva → despacho → conductor → pasajero → cierre + comprobante), se aplaza a MVP.
2. **Modelo más caro al sprint más crítico.** S0 y S1 (cimentación + schema) con **Opus**. S4 (interfaz IA + adapter) y S6 (scaffolding driver RN+Expo) con **Opus**. El resto con **Sonnet 4.6** o **Codex 5.5** según tabla §0.3.
3. **Nada se mergea sin `pnpm turbo run typecheck lint test` verde.** El sprint no cierra si CI falla.
4. **Nada se construye sin criterio de aceptación escrito antes.**
5. **El humano siempre confirma las acciones del LLM.** La demo muestra "sugerencia", no "automático".
6. **Cada feature lleva seed mínimo y test E2E mínimo.**
7. **Lo que se construye en demo debe ser reusable en MVP.** Sin código desechable. Marca `[Semilla MVP]` indica decisiones que persisten.
8. **Ningún string de prompt vive en código.** Todos en `packages/ia/prompts/*.md` con frontmatter de versión.
9. **Toda capacidad LLM tiene su par determinista.** Sin excepción. La determinista se construye primero. La LLM se enchufa por encima con `withFallback()`. Si `IA_HABILITADA=false` el sistema opera 100% sobre algoritmos. La demo debe poder ejecutarse con LLM desconectado.
10. **`tenant_id` simbólico en todas las tablas relevantes desde día 1**, pero sin RLS activo en demo.
11. **`apps/web` y `apps/driver` son apps separadas.** Comparten solo `packages/*`. Nunca imports cruzados directos.
12. **El driver RN+Expo se prueba en Android físico antes de cerrar S6 y S7.**
13. **Si un sprint se atrasa, se corta alcance del sprint, no se aumenta presupuesto total del horizonte demo.**

### 0.0.1 Corrección canónica de flujo físico

Antes de S0/S1, todos los agentes deben aplicar este contrato:

```text
Flujo protagonista = Recojo en aeropuerto
Hotel/concierge = solicitante por WhatsApp, no origen físico
Pasajero final = persona que llega al Aeropuerto Jorge Chávez
Origen físico = Aeropuerto Jorge Chávez - Llegadas
Punto de encuentro = Salida 3, columna F2
Destino físico = Av. Pardo 123, Miraflores
```

La variante ciudad/hotel/casa/oficina → aeropuerto se llama **Traslado hacia aeropuerto** y no es el guion protagonista. En seeds, prompts y tests manuales queda prohibido usar "hotel → aeropuerto" como caso principal.

### 0.1. Stack consolidado

```
Monorepo:        Turborepo 2 + pnpm 9 workspaces
Lenguaje:        TypeScript 5.6 strict + noUncheckedIndexedAccess

apps/web (Next.js 15.4):
  UI:            Tailwind 3.4 + shadcn/ui (Radix)
  State:         Zustand 5 + TanStack Query 5
  Forms:         React Hook Form 7 + Zod 3
  Auth:          Auth.js v5 + magic-link helpers
  Real-time:     @supabase/supabase-js (postgres_changes + broadcast)
  AI streaming:  Vercel AI SDK 4

apps/driver (React Native + Expo SDK 51):
  Navegación:    Expo Router 3
  UI:            NativeWind 4 (Tailwind para RN)
  State:         Zustand 5 + TanStack Query 5
  Real-time:     @supabase/supabase-js
  Plugins:       expo-location (foreground demo), expo-notifications (FCM),
                 expo-secure-store, expo-camera (preparado), expo-task-manager (preparado),
                 expo-local-authentication (preparado), @rnmapbox/maps
  Distribución:  Expo Go con dev client (demo) — EAS Build (MVP)

Compartido (packages/*):
  ORM:           Prisma 6
  DB:            PostgreSQL 17 + PostGIS 3.5 (Supabase)
  LLM (demo):    Adapter Anthropic vía interfaz LLMProvider — agnóstico
  Modelos demo:  claude-sonnet-4-6 (extracción) · claude-haiku-4-5-20251001 (racionalización)
  PDF:           Puppeteer (@sparticuz/chromium-min)
  QR:            qrcode + HMAC SHA-256
  Mail:          Resend (free tier)
  Storage:       Supabase Storage
  Logs:          Pino + Sentry

Integraciones:
  RENIEC demo:   APIs.net.pe + cache de 3 DNIs del guion
  WABA / Pagos / SUNAT / LAP-ATU: STUBS en demo

Tests:           Vitest 2 + Playwright 1.48 + MSW 2
Hosting demo:    Railway (apps/web) + Supabase (DB + Realtime + Storage) + Expo Go (driver)
```

### 0.2. Estructura de carpetas objetivo

```
taxigreen/
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ (publico)/page.tsx       ← Landing pública (CTA WhatsApp)
│  │  │  │  ├─ p/[token]/               ← Pasajero (link tracking)
│  │  │  │  ├─ admin/                   ← Despacho
│  │  │  │  ├─ counter/                 ← Aeropuerto
│  │  │  │  ├─ wa-sim/                  ← Simulador WhatsApp
│  │  │  │  ├─ bienestar/[caso]/        ← Estado incidencia
│  │  │  │  ├─ login-admin/
│  │  │  │  ├─ login-counter/
│  │  │  │  └─ api/
│  │  │  │     ├─ auth/[...nextauth]/
│  │  │  │     ├─ ingesta/extraer/
│  │  │  │     ├─ asignacion/sugerir/
│  │  │  │     ├─ voucher/[id]/qr/
│  │  │  │     ├─ voucher/[id]/verify/
│  │  │  │     ├─ comprobantes/[id]/pdf/
│  │  │  │     ├─ reniec/lookup/
│  │  │  │     ├─ conductor/             ← endpoints consumidos por driver app
│  │  │  │     │  ├─ login/
│  │  │  │     │  ├─ fcm-token/
│  │  │  │     │  └─ asignacion/[id]/(aceptar|rechazar|estado)/
│  │  │  │     └─ integraciones/lap-atu/webhook/  ← stub 501
│  │  │  ├─ components/ui/               ← shadcn primitives locales (demo)
│  │  │  ├─ lib/
│  │  │  └─ middleware.ts
│  │  ├─ next.config.ts
│  │  └─ package.json
│  └─ driver/                            ← React Native + Expo SDK 51
│     ├─ app/                            ← Expo Router routes
│     │  ├─ _layout.tsx
│     │  ├─ index.tsx                    ← splash/redirect
│     │  ├─ login.tsx                    ← email + PIN
│     │  ├─ (auth)/
│     │  │  ├─ _layout.tsx
│     │  │  ├─ home.tsx                  ← turno activo + próxima asignación
│     │  │  ├─ asignacion/[id].tsx       ← asignación activa con botones gigantes
│     │  │  └─ perfil.tsx
│     ├─ src/
│     │  ├─ features/
│     │  │  ├─ auth/                     ← PIN, secure-store
│     │  │  ├─ realtime/                 ← supabase client + canales
│     │  │  ├─ location/                 ← expo-location wrappers
│     │  │  ├─ push/                     ← expo-notifications
│     │  │  └─ api/                      ← cliente HTTP con interceptor JWT
│     │  └─ providers/
│     ├─ app.json                        ← config Expo (nombre, iconos, plugins)
│     ├─ eas.json                        ← config EAS (placeholder demo)
│     ├─ metro.config.ts
│     ├─ tailwind.config.js              ← NativeWind config
│     └─ package.json
├─ packages/
│  ├─ database/
│  │  ├─ prisma/schema.prisma             ← 10 tablas demo
│  │  ├─ prisma/seed.ts                   ← datos guion idempotente
│  │  └─ src/index.ts                     ← prisma client singleton
│  ├─ shared/
│  │  ├─ src/types/                       ← Zod schemas dominio
│  │  ├─ src/tokens/                      ← colores, tipografía, spacing
│  │  └─ src/utils/                       ← formatters, validators
│  ├─ ingesta/                            ← DETERMINISTA: parser regex + chrono-node + diccionarios
│  ├─ asignacion/                         ← DETERMINISTA: heurística scoring
│  ├─ bienestar/                          ← DETERMINISTA: clasificación incidencias keywords
│  ├─ ia/                                 ← DEMO MÍNIMA: interfaz + 1 adapter + fallback
│  │  ├─ src/
│  │  │  ├─ llm-provider.ts               ← interfaz agnóstica
│  │  │  ├─ providers/anthropic.ts        ← adapter Anthropic
│  │  │  ├─ fallback.ts                   ← withFallback()
│  │  │  └─ prompts.ts                    ← cargador prompts .md
│  │  └─ prompts/
│  │     ├─ ingesta-whatsapp.v1.md
│  │     ├─ asignacion-racional.v1.md
│  │     └─ clasificacion-incidencia.v1.md
│  ├─ voucher/                            ← QR + HMAC
│  ├─ comprobantes/                       ← plantillas + stub Fenbo
│  ├─ auditoria/                          ← recordAudit
│  └─ integraciones/
│     ├─ reniec/                          ← APIs.net.pe + cache demo
│     └─ lap-atu/                         ← stub interface (puerta abierta)
├─ infra/
│  ├─ docker-compose.yml                  ← Postgres 17 + PostGIS local opcional
│  └─ supabase/migrations/                ← SQL migraciones gestionadas
├─ tests/
│  └─ e2e/                                ← Playwright (web) + Maestro (driver MVP)
├─ .github/workflows/
│  ├─ ci.yml
│  └─ deploy-web.yml
├─ turbo.json
├─ pnpm-workspace.yaml
├─ .nvmrc                                 ← node 22 lts
└─ package.json
```

### 0.3. Asignación de modelos por sprint

| Sprint | Entregable principal | Modelo principal | Revisión |
|---|---|---|---|
| 0 | Cimentación monorepo + apps stub + CI | **Opus** | — |
| 1 | Schema 10 tablas + seed + Auth.js v5 | **Opus** | Sonnet 4.6 |
| 2 | Backend dominio: voucher + comprobante + auditoría | Sonnet 4.6 | Codex 5.5 |
| 3 | Panel /admin + Supabase Realtime + asignación manual | Sonnet 4.6 | Codex 5.5 |
| 4 | Capa IA mínima + ingesta determinista + simulador WhatsApp | **Opus** (core) + Sonnet (UI) | Sonnet |
| 5 | Heurística asignación + racionalización LLM + fallback | Sonnet 4.6 | Codex 5.5 |
| 6 | App RN+Expo: scaffolding + auth + push + recibir asignación | **Opus** | Sonnet 4.6 |
| 7 | App RN+Expo: mapa + estados viaje + ubicación foreground | Sonnet 4.6 | Codex 5.5 |
| 8 | Link /p pasajero + tracking en vivo + comprobante + 1 incidencia | Sonnet 4.6 | Codex 5.5 |
| 9 | /counter QR scan + landing pública + datos guion + reset + deploy | Sonnet 4.6 | Codex 5.5 |

### 0.4. Convención de commits

```
feat(app/web):    descripción
feat(app/driver): descripción
feat(pkg/ia):     descripción
fix(pkg/voucher): descripción
chore(infra):     descripción
test(e2e):        descripción
docs:             descripción
```

Scopes válidos: `app/web`, `app/driver`, `pkg/<nombre>`, `infra`, `e2e`, `docs`. Un commit nunca cruza dos scopes.

### 0.5. Definición de "sprint terminado" (Sprint DoD genérico)

1. Todos los tickets del backlog en estado `done`.
2. PR mergeado o commit firmado en `main`.
3. `pnpm turbo run typecheck` pasa.
4. `pnpm turbo run lint` pasa.
5. `pnpm turbo run test` pasa.
6. Smoke test específico del sprint pasa manualmente en dev local.
7. Rama `main` despliega en Railway sin error (apps/web).
8. Para sprints que afectan driver: app builda en Expo Go y se prueba en Android físico.

---

## Mapa de sprints (10 sprints, ordenados por dependencia)

| Sprint | Foco | Bloquea a |
|---|---|---|
| **S0** | Cimentación monorepo + apps stub + Supabase + CI | S1+ |
| **S1** | Schema 10 tablas + seed + Auth.js v5 | S2-S9 |
| **S2** | Voucher QR + Comprobante PDF + Auditoría helper | S3, S8 |
| **S3** | Panel /admin + Supabase Realtime + asignación manual | S5, S6 |
| **S4** | Capa IA mínima (interfaz + adapter + fallback) + ingesta determinista + simulador WhatsApp | S5 |
| **S5** | Heurística asignación + racionalización LLM con fallback | S7 |
| **S6** | App RN+Expo: scaffolding + auth PIN + push + recibir asignación | S7 |
| **S7** | App RN+Expo: mapa + estados viaje + ubicación foreground + Realtime client | S8 |
| **S8** | Link /p pasajero + tracking en vivo + comprobante + 1 incidencia simple | S9 |
| **S9** | /counter QR scan + landing pública + datos guion + reset + deploy + video respaldo | (cierre) |

---

## Sprint 0 — Cimentación monorepo + apps stub + CI — Modelo: OPUS

**Objetivo:** dejar el monorepo Turborepo con `apps/web` (Next.js 15.4 + Supabase) y `apps/driver` (React Native + Expo SDK 51) buildando, packages vacíos inicializados, Supabase provisionado, CI verde, primer deploy smoke a Railway.

### S0.1. Dependencias previas
- Cuentas creadas: Railway, Supabase, Expo (EAS opcional MVP), Anthropic, Resend, Mapbox, Sentry, APIs.net.pe.
- Tokens disponibles para `.env`.
- Repositorio Git vacío (GitHub privado: `taxigreen`).
- Android SDK + Android Studio para probar `apps/driver` (opcional S0, requerido S6).

### S0.2. Backlog

1. `chore: bootstrap Turborepo 2 + pnpm 9 workspaces`.
2. `chore(app/web): scaffolding Next.js 15.4 + React 19 + Tailwind 3.4 + shadcn/ui init + Sentry init dummy`.
3. `chore(app/driver): scaffolding Expo SDK 51 con expo-router 3 + NativeWind 4`.
   - `pnpm create expo-app driver --template tabs` y purgar a vacío
   - Configurar `app.json` con nombre "Taxi Green Conductor", scheme `taxigreendriver`
   - Instalar plugins: `expo-location`, `expo-notifications`, `expo-secure-store`, `expo-camera`, `expo-task-manager`, `expo-local-authentication`, `@rnmapbox/maps` (este último con instrucciones de token Mapbox).
4. `chore(pkg/database): Prisma 6 + schema vacío + cliente singleton`.
5. `chore(pkg/shared): tipos + tokens + utils placeholders`.
6. `chore(pkg/*): inicializar packages vacíos (ingesta, asignacion, bienestar, ia/{src,prompts}, voucher, comprobantes, auditoria, integraciones/{reniec, lap-atu})`. La carpeta `packages/ia/src/` incluye archivos placeholder `llm-provider.ts`, `providers/anthropic.ts`, `fallback.ts`, `prompts.ts`.
7. `chore(infra): docker-compose.yml con Postgres 17 + PostGIS local opcional`.
8. `chore(infra): provisionar Supabase + habilitar extensiones postgis y pgcrypto via SQL editor de Supabase`.
9. `chore: ESLint flat config + Prettier + EditorConfig + .nvmrc (node 22)`.
10. `chore: Vitest 2 (apps/web + packages) + Playwright 1.48 (tests/e2e) con tests dummy`.
11. `chore: GitHub Actions ci.yml — turbo run typecheck/lint/test/build con caché pnpm + turbo`.
12. `chore: .env.example en raíz + apps/web + apps/driver`.
13. `chore: README.md raíz con Quick Start completo`.
14. `chore: deploy smoke a Railway con apps/web página "/" placeholder`.

### S0.3. Criterios de aceptación

- `pnpm install` instala sin warnings críticos; resuelve todos los workspaces.
- `pnpm turbo run dev --filter=web` arranca Next en `:3000` y responde 200.
- `cd apps/driver && pnpm start` arranca Expo Metro y muestra QR (Expo Go funcional).
- `pnpm turbo run typecheck lint test build` todo verde.
- Workflow CI corre verde en PR de prueba.
- Railway despliega `apps/web` y responde 200 en URL pública.
- Supabase tiene extensiones `postgis` + `pgcrypto` habilitadas (verificable en SQL editor).
- `.env.example` completo en los tres lugares.
- Estructura de carpetas coincide 100% con §0.2.

### S0.4. Prompt para OPUS — Sprint 0

```text
Actúa como ingeniero senior full-stack con experiencia en monorepos modernos y React Native + Expo. Trabajas en el repositorio "taxigreen".

CREAS LA CIMENTACIÓN de un sistema con dos aplicaciones:
- apps/web: Next.js 15.4 + React 19 (RSC) — todas las superficies web + backend.
- apps/driver: React Native + Expo SDK 51 — app nativa Android para conductor.

CONTEXTO DURO:
- Stack documentado en 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §7.2.
- Estructura de carpetas requerida en §0.2 de este SPRINT.md.
- Reglas no negociables:
  - tsconfig "strict": true, "noUncheckedIndexedAccess": true.
  - Nada de "any" implícito. Cualquier "any" lleva eslint-disable con motivo.
  - pnpm 9 como único package manager.
  - Turborepo 2 con caching local.
  - Variables de entorno tipadas con zod en apps/web/src/lib/env.ts y apps/driver/src/lib/env.ts.
  - Node 22 LTS (.nvmrc en raíz).

ENTREGABLES SPRINT 0:
1. package.json raíz con scripts: dev, build, lint, typecheck, test, e2e (delegan a turbo).
2. pnpm-workspace.yaml con apps/* y packages/*.
3. turbo.json con pipelines: typecheck, lint, test, build, dev (persistent).
4. apps/web: Next.js 15.4 + Tailwind 3.4 + shadcn/ui init + Auth.js v5 stub + Sentry dummy + Pino logger.
5. apps/driver: Expo SDK 51 con expo-router 3 + NativeWind 4 + plugins listados arriba instalados pero sin uso (placeholders).
6. apps/driver/app.json configurado: name "Taxi Green Conductor", slug "taxigreen-driver", scheme "taxigreendriver", android.package "pe.taxigreen.driver", plugins: [expo-router, expo-secure-store, expo-notifications, expo-location, expo-task-manager, [@rnmapbox/maps, {...}]].
7. packages/database: Prisma 6 + schema.prisma vacío + cliente singleton.
8. packages/shared, packages/ia (con subcarpeta src/ + prompts/), packages/{ingesta,asignacion,bienestar,voucher,comprobantes,auditoria}: package.json + tsconfig + index.ts placeholder.
9. packages/integraciones/{reniec, lap-atu}: package.json + index.ts placeholder.
10. infra/docker-compose.yml con Postgres 17 + PostGIS local opcional.
11. .github/workflows/ci.yml: install → typecheck → lint → test → build con caché.
12. .env.example en raíz + apps/web + apps/driver con TODAS las variables comentadas.
13. README.md raíz con Quick Start (clone → pnpm i → supabase setup → pnpm turbo run dev).

PROHIBIDO:
- Implementar features, modelos, auth o UI más allá de placeholders.
- Instalar dependencias no justificadas en §7.2 del PLAN_SOFTWARE.md.
- Usar npm o yarn.

FORMATO DE SALIDA:
Devuelve archivos uno por uno con path como comentario en primera línea. Al final, output esperado de:
- `pnpm install`
- `pnpm turbo run typecheck lint test build`
- `pnpm turbo run dev --filter=web` (en background)
- `cd apps/driver && pnpm start` (en background)

Si tienes dudas, marca con `# TODO confirmar` y sigue. No preguntes.
```

### S0.5. Smoke test manual

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d   # opcional, Supabase es la DB real
pnpm turbo run typecheck lint test build
pnpm turbo run dev --filter=web                     # :3000 OK
cd apps/driver && pnpm start                        # Expo Metro + QR
# Escanear QR con Expo Go en Android físico → ver pantalla placeholder
# Subir a main → CI verde → Railway redeploy
```

### S0.6. Riesgos

- Expo Router 3 + React Native 0.74+ versión exacta puede tener fricción inicial. Mitigación: usar `pnpm create expo-app` que garantiza versiones compatibles.
- NativeWind 4 requiere Babel plugin específico. Verificar en setup.
- @rnmapbox/maps requiere token Mapbox descarga en Android. Documentar en README.
- Custom server Next + Supabase Realtime: NO se usa custom server en demo (Supabase Realtime es cliente puro). Despliegue Railway con Next.js estándar.

---

## Sprint 1 — Schema 10 tablas + seed + Auth.js v5 — Modelo: OPUS

**Objetivo:** sentar la columna vertebral. Schema Prisma 6 de 10 tablas del demo, seed idempotente con datos del guion, Auth.js v5 para admin/counter web + endpoint conductor login (consumido por driver app en S6), helper de auditoría. Este sprint NO puede tener bugs.

### S1.1. Dependencias previas
- S0 cerrado.
- Supabase con extensiones `postgis` + `pgcrypto` habilitadas (de S0).
- Las 10 tablas confirmadas según [PLAN_SOFTWARE.md §7.6](./PLAN_SOFTWARE.md).

### S1.2. Backlog

**A. Schema Prisma 6 (packages/database)**

1. `feat(pkg/database): schema con 10 tablas`:
   - `tenants`, `usuarios`, `conductores`, `vehiculos`, `reservas`, `viajes`, `posiciones_conductor`, `comprobantes`, `incidencias`, `auditoria`.
   - `tenant_id` simbólico en todas menos `tenants` y `auditoria` (este último lo tiene nullable). Sin RLS activado.
   - Enums según PLAN_SOFTWARE.md §7.6 (CanalOrigen, EstadoReserva, EstadoViaje, TipoPago, TipoComprobante, EstadoComprobante, TipologiaIncidencia con 4 valores demo, SeveridadIncidencia, EstadoIncidencia, Rol).
   - Soft delete (`deleted_at` nullable) en `usuarios`, `reservas`, `viajes`, `incidencias`.
   - Timestamps `created_at` + `updated_at` automáticos.
   - `posiciones_conductor.geom Unsupported("geography(Point, 4326)")?` opcional (sin índice GiST en demo).
   - `reservas.raw_ingesta Json?` para guardar inline el evento crudo de WhatsApp (demo).
   - `reservas.sugerencia_copiloto Json?` para metadata de asignación (fuente, razón, score, modelo).
   - `reservas.punto_encuentro String?` para el "Salida 3, columna F2".
   - `reservas.tipo_viaje TipoViaje` con enum `recojo_aeropuerto | traslado_aeropuerto | city`.
   - `reservas.solicitante_tipo/nombre/contacto` para separar solicitante del origen físico.
   - Regla P0: `hotel_nombre` o `solicitante_nombre` nunca reemplazan `origen_texto`.
   - `incidencias.timeline Json @default("[]")` para guardar inline las acciones (demo).
   - `auditoria.fuente_decision Json?` con `{fuente, motivo, modelo?}`.
2. `feat(pkg/database): migración inicial Prisma aplicada en Supabase`.
3. **Sin SQL custom complejo en demo**. La extensión PostGIS ya está activada en S0. No hay índices GiST, no hay particionado, no hay RLS.

**B. Seed (packages/database/prisma/seed.ts)**

4. `feat(pkg/database): seed.ts idempotente`:
   - 1 tenant "Taxi Green Demo".
   - 1 admin `admin@taxigreen.demo` / password `demo1234` (bcrypt).
   - 1 supervisor counter `counter@taxigreen.demo` / `demo1234`.
   - 6 conductores con email `conductor1..6@taxigreen.demo` + PIN bcrypt único (1234, 2345, 3456, 4567, 5678, 6789).
   - Nombres realistas: Raúl Quispe, Mario Huamán, Lucía Pérez, Javier Ríos, Ana Salazar, Pedro Morales.
   - 8 vehículos Toyota Corolla Hybrid placas peruanas formato ABC-123.
   - Asociar conductores a vehículos (1:1).
   - 1 reserva protagonista idempotente: solicitante hotel/concierge, `tipo_viaje=recojo_aeropuerto`, origen "Aeropuerto Jorge Chávez - Llegadas", punto "Salida 3, columna F2", destino "Av. Pardo 123, Miraflores".
   - 1 incidencia histórica `objeto_olvidado` cerrada con timeline de 3 acciones (para mostrar trazabilidad).
   - Idempotente: upsert por email/placa/codigo.

**C. Auth.js v5 (apps/web)**

5. `feat(app/web): Auth.js v5 config con providers`:
   - `credentials-admin`: email + password (admin, supervisor) con bcrypt.
   - `credentials-driver`: email + PIN 4 dígitos (conductor — endpoint consumido por driver app en S6).
   - JWT en cookie httpOnly, sameSite=Lax, secure en prod, expira 24h.
6. `feat(app/web): middleware Next.js route guards por rol`:
   - `/admin/**` → rol `admin_tenant` o `despachador`.
   - `/counter/**` → rol `supervisor`.
   - `/p/[token]` público (validación server-side directa contra `reservas.token_pasajero`).
7. `feat(app/web): páginas login-admin, login-counter con shadcn forms + React Hook Form + Zod`.
8. `feat(app/web): API route /api/auth/logout que limpia sesión`.
9. `test(app/web): unit tests helpers auth (hashPin, verifyPin, hashPassword, verifyPassword, generateMagicToken, validateMagicToken)`.

**D. Auditoría (packages/auditoria)**

10. `feat(pkg/auditoria): helper recordAudit({ actor, action, payload, tenantId, req?, fuenteDecision? })` que escribe en tabla `auditoria`.

**E. UI base (apps/web)**

11. `feat(app/web): componentes/ui/* (shadcn primitives locales — NO en package compartido en demo)`.
12. `feat(pkg/shared): tokens design system Taxi Green (verde-principal #0B7A3B, verde-claro #E6F4EC, verde-oscuro #06532A, gris-texto #1F2937, fondo #F9FAFB, fuente Inter)`.
   > ⚠️ **Decisión abierta de paleta antes de esta tarea.** `ESPECIFICACION_PANTALLAS_PREMIUM §7` y el plugin Figma recomiendan sistema **dual** (azul Qorinti `#0B0952`/`#227FDE` como chrome del producto + verde solo en logo/chip de tenant + `care/*`). Resolver según `_FUENTE_DESARROLLO/04_DECISIONES_ABIERTAS.md §A1` (es decisión de marca del cliente, `Por validar`). No fijar verde total a ciegas.
13. `feat(app/web): tailwind.config.ts consumiendo tokens de packages/shared`.
14. `feat(app/web): componente BrandHeader + ToastProvider globales`.
15. `feat(app/web): página / es la landing pública (S9 la completa, hoy placeholder con menú a las 5 superficies internas + texto "Pídelo por WhatsApp")`.

### S1.3. Criterios de aceptación

- `pnpm --filter database db:migrate` aplica migraciones sin error en Supabase.
- `pnpm --filter database db:seed` puebla. Re-ejecutar no duplica.
- `pnpm turbo run test` pasa todos los unitarios de auth.
- Login admin `admin@taxigreen.demo / demo1234` → entra a /admin (placeholder).
- Login counter `counter@taxigreen.demo / demo1234` → entra a /counter (placeholder).
- `/p/[token]` con token inválido → 404 elegante; con token válido (de seed o crear manual) → placeholder.
- Tabla `auditoria` recibe registros al loguearse.
- Seed protagonista muestra hotel/concierge como solicitante y Aeropuerto Jorge Chávez como origen físico.
- Paleta verde Taxi Green visible en BrandHeader.
- Prisma Studio (`pnpm --filter database db:studio`) muestra todas las tablas pobladas.

### S1.4. Prompt para OPUS — Sprint 1

```text
Arquitecto de datos senior. Trabajas sobre el repo "taxigreen" con cimentación monorepo del S0.

MISIÓN S1:
1. Schema Prisma 6 de 10 tablas (lista en §S1.2.A) según especificaciones exactas de PLAN_SOFTWARE.md §7.6.
2. Migración inicial aplicada en Supabase.
3. Seed idempotente con datos del guion (§S1.2.B).
4. Auth.js v5 con 2 providers (admin web + driver — endpoint para futura app RN).
5. Middleware route guards.
6. recordAudit helper.
7. UI base con tokens.

REGLAS NO NEGOCIABLES:
- 10 tablas EXACTAS. NO añadir personas_fisicas, empresas_clientes, hoteles_aliados, ingesta_eventos, consultas_reniec, notificaciones, empresa_centros_costo, integraciones_externas_log. Esos son MVP. Si por hábito los modelas, los borras.
- tenant_id en todas menos tenants y auditoria. NO RLS activo.
- Soft delete en usuarios, reservas, viajes, incidencias.
- En reservas: voucher_codigo único, token_pasajero único (nanoid 21), raw_ingesta jsonb opcional, sugerencia_copiloto jsonb opcional, punto_encuentro string nullable.
- En reservas: agregar `tipo_viaje` y campos de solicitante. El seed protagonista usa `tipo_viaje='recojo_aeropuerto'`, origen Aeropuerto Jorge Chávez, punto Salida 3 columna F2, destino Av. Pardo 123 Miraflores.
- `hotel_nombre`/solicitante describen quién pidió; nunca son el punto de recojo del flujo protagonista.
- En incidencias: timeline jsonb default '[]'.
- En auditoria: fuente_decision jsonb nullable con {fuente: 'algoritmo'|'llm', motivo?, modelo?}.
- DNI/RUC en demo se guardan en plano en reservas (pasajero_dni, pasajero_ruc strings nullable). MVP cifra.
- Seed idempotente con upsert.
- Auth.js v5 con cookies httpOnly. Errores genéricos "credenciales inválidas".
- Rate limit básico in-memory 5 intentos en 5 min.
- recordAudit invocado en cada login y cada acción crítica.

ARCHIVOS A ENTREGAR:
- packages/database/prisma/schema.prisma
- packages/database/prisma/seed.ts
- packages/database/src/index.ts (Prisma client singleton)
- packages/database/package.json con scripts db:migrate, db:seed, db:studio, db:reset
- apps/web/src/lib/auth/config.ts (Auth.js v5)
- apps/web/src/lib/auth/providers/{credentials-admin.ts, credentials-driver.ts}
- apps/web/src/lib/auth/{passwords.ts, pin.ts, session.ts, magic-link.ts}
- apps/web/src/middleware.ts
- apps/web/src/app/api/auth/[...nextauth]/route.ts
- apps/web/src/app/login-admin/page.tsx
- apps/web/src/app/login-counter/page.tsx
- packages/auditoria/src/index.ts + types.ts
- apps/web/src/components/ui/* (shadcn primitives)
- apps/web/src/components/brand-header.tsx
- packages/shared/src/tokens/{colors.ts, typography.ts, index.ts}
- apps/web/tailwind.config.ts (consume packages/shared)
- apps/web/src/app/layout.tsx + globals.css + page.tsx placeholder
- tests/unit en apps/web y packages/auditoria

VERIFICACIÓN:
- pnpm --filter database db:migrate sin error.
- pnpm --filter database db:seed puebla. Re-ejecutar no duplica.
- pnpm turbo run test verde.
- Login manual admin OK + auditoría registra.
- Prisma Studio muestra 10 tablas con datos.
- Prisma Studio muestra una reserva protagonista con hotel como solicitante y origen físico aeropuerto.

Sin preguntas. Decide y comenta ambigüedades con `// DECISIÓN: ...`.
```

### S1.5. Riesgos

- Pin/password bcrypt cost 12 es lento; testing con cost 4 para no demorar test suite.
- Auth.js v5 vs v4: si v5 sigue beta a la fecha de ejecución, fallback documentado a v4.
- Supabase Prisma migrations con `directUrl` para pooler: usar `DATABASE_URL` (pooler 6543) + `DIRECT_URL` (5432) según docs Supabase.

---

## Sprint 2 — Voucher QR + Comprobante PDF + Auditoría visible — Modelo: SONNET 4.6

**Objetivo:** generar los artefactos físico-digitales del producto. Voucher con QR firmado HMAC, comprobante PDF estilo SUNAT, vista de auditoría visible básica.

### S2.1. Backlog

1. `feat(pkg/voucher): createVoucherToken/verifyVoucherToken HMAC SHA-256, payload {reserva_id, codigo_publico, issued_at, expires_at}`.
2. `feat(pkg/voucher): renderQRtoPNG (lib qrcode) + renderQRtoSVG`.
3. `feat(app/web): /api/voucher/[id]/qr → PNG cacheable 30s`.
4. `feat(app/web): /api/voucher/[id]/verify → 200 si válido, 400 si tampered/expired`.
5. `feat(pkg/comprobantes): plantillas HTML React-Email-like para boleta + factura + ticket con look-and-feel SUNAT`.
6. `feat(pkg/comprobantes): render PDF con Puppeteer + @sparticuz/chromium-min para Railway`.
7. `feat(app/web): /api/comprobantes/[id]/pdf → genera + cachea en Supabase Storage (bucket "comprobantes" privado, URLs firmadas 24h)`.
8. `feat(pkg/integraciones/reniec): cliente APIs.net.pe con cache in-memory + pre-carga 3 DNIs del guion (los del seed)`.
9. `feat(app/web): /api/reniec/lookup → POST {tipo:dni|ruc, documento}`.
10. `feat(app/web): /admin/auditoria/page.tsx con tabla paginada filtrable por action/actor/fecha`.
11. `test(pkg/voucher): unit tests firma + verificación + tampering + expiración`.
12. `test(e2e): Playwright "crear reserva manual en DB → /api/voucher/[id]/qr devuelve PNG → /verify → 200"`.

### S2.2. Criterios de aceptación

- HMAC verificable: tampering del payload detectado y rechazado.
- QR generado en <100ms.
- PDF de comprobante en <2s, look-and-feel SUNAT.
- Supabase Storage URL firmada expiración 24h.
- Auditoría refleja emisión y verificación.
- `/api/reniec/lookup` con DNI cacheado devuelve <50ms; con DNI no cacheado consulta APIs.net.pe (real, mock en test).

### S2.3. Prompt SONNET — S2

```text
Contexto: repo "taxigreen". S0+S1 cerrados. Schema 10 tablas + auth + recordAudit listos.

MISIÓN S2:
Construir artefactos físico-digitales: voucher QR HMAC, comprobante PDF SUNAT, vista auditoría, RENIEC lookup endpoint.

ENTREGABLES:
1. packages/voucher/src/{sign.ts, qr.ts, index.ts}. sign.ts con HMAC SHA-256 desde HMAC_SECRET env. qr.ts con lib `qrcode` para PNG/SVG.
2. apps/web/src/app/api/voucher/[id]/qr/route.ts GET → PNG con Cache-Control: 30s.
3. apps/web/src/app/api/voucher/[id]/verify/route.ts POST {token} → 200/400.
4. packages/comprobantes/src/templates/{boleta.tsx, factura.tsx, ticket.tsx} con JSX inline-styled emulando look SUNAT real.
5. packages/comprobantes/src/render.ts con Puppeteer (@sparticuz/chromium-min para Railway serverless-like).
6. apps/web/src/app/api/comprobantes/[id]/pdf/route.ts GET → genera + sube a Supabase Storage bucket "comprobantes" + retorna URL firmada 24h.
7. packages/integraciones/reniec/src/{index.ts, cache.ts, providers/apis-net-pe.ts}. Cache in-memory Map<documento, {payload, expires_at}> con TTL 30 min. Pre-carga 3 DNIs del seed.
8. apps/web/src/app/api/reniec/lookup/route.ts POST con Zod validation + recordAudit con action="reniec_lookup".
9. apps/web/src/app/admin/auditoria/page.tsx con tabla TanStack Table paginada + filtros action/actor/fecha.
10. tests/unit/voucher.spec.ts (firma, verificación, tampering, expiración con 8h en el futuro).
11. tests/e2e/voucher-flow.spec.ts (crear reserva en DB con prisma → GET QR → POST verify → 200; modificar payload → POST verify → 400).

REGLAS:
- Storage Supabase: bucket "comprobantes" privado + URLs firmadas.
- recordAudit en emisión y verificación con fuente_decision=null (no aplica IA aquí).
- No emisión SUNAT real en demo (solo PDF visual).
- RENIEC: si APIs.net.pe falla en demo → log warning, devolver 503 (sin cadena de fallbacks en demo, eso es MVP).

VERIFICACIÓN:
- pnpm turbo run typecheck lint test verde.
- Manual: crear reserva manual en Prisma Studio → abrir /api/voucher/<id>/qr en navegador → ver PNG.
- POST a /api/reniec/lookup con DNI del seed → respuesta <50ms.
- Auditoría visible en /admin/auditoria con paginación funcional.

Sin preguntas.
```

---

## Sprint 3 — Panel /admin + Supabase Realtime + asignación manual — Modelo: SONNET 4.6

**Objetivo:** el despachador tiene su sala de control. Lista de reservas en vivo via Supabase Realtime, asignación manual conductor + vehículo separados, auditoría de cada acción.

### S3.1. Backlog

1. `feat(app/web): /admin/page.tsx (RSC con query inicial Prisma) + componente cliente AdminReservasLive`.
2. `feat(app/web): AdminReservasLive suscrito a Supabase Realtime postgres_changes en tabla reservas filtrado por tenant_id`.
3. `feat(app/web): /admin/reservas/[id]/page.tsx con detalles + acciones (asignar conductor, asignar vehículo, marcar excepción)`.
4. `feat(app/web): selector conductor con cola enriquecida (orden por tiempo_en_cola_desde + distancia mock al punto)`.
5. `feat(app/web): selector vehículo separado (placa, modelo, capacidad)`.
6. `feat(app/web): Server Actions asignarConductor + asignarVehiculo + marcarExcepcion + recordAudit`.
7. `feat(app/web): emisión Supabase broadcast en canal reserva:{id} al asignar (preparación para que driver app suscriba en S6)`.
8. `feat(app/web): widget métricas /admin/metricas con mockup creíble (sparklines + cards)`.
9. `test(e2e): Playwright "login admin → ver lista → abrir reserva creada manual → asignar conductor → ver auditoría con action=reserva_asignada"`.

### S3.2. Criterios de aceptación

- Login admin → ve lista de reservas en /admin.
- 2 pestañas abiertas en /admin con mismo usuario: crear reserva manual en Prisma Studio → en ambas pestañas aparece nueva fila vía Supabase Realtime sin refresh.
- Asignar conductor + vehículo en ≤3 clicks.
- Auditoría refleja `reserva_asignada` con payload completo.

### S3.3. Prompt SONNET — S3

```text
Contexto: repo "taxigreen". S0-S2 cerrados.

MISIÓN S3:
Panel /admin completo + Supabase Realtime + asignación manual + auditoría visible.

LECTURA OBLIGATORIA:
- 06_DEMO_TECNICA/DISEÑO_UI_DETALLADO.md (sección admin si existe).
- PLAN_SOFTWARE.md §7.4 (Supabase Realtime).

ENTREGABLES:
1. apps/web/src/lib/supabase/client.ts y server.ts (cliente browser y server).
2. apps/web/src/app/admin/page.tsx (RSC: query inicial Prisma) + admin/admin-reservas-live.tsx (Client: useEffect con sb.channel('reservas-' + tenantId).on('postgres_changes', {event: '*', schema:'public', table:'reservas', filter: 'tenant_id=eq.'+tenantId}, callback).subscribe()).
3. apps/web/src/app/admin/reservas/[id]/page.tsx (RSC) + reserva-detalle.tsx (client con acciones).
4. apps/web/src/app/admin/reservas/[id]/actions.ts (Server Actions: asignarConductor, asignarVehiculo, marcarExcepcion). Cada una con recordAudit.
5. Selector conductor: query Prisma de conductores activos sin viaje en curso, orden por tiempo_en_cola_desde ASC. Mostrar foto (placeholder), nombre, tiempo en cola, "X min en cola".
6. Selector vehículo: query vehículos del tenant, orden por placa.
7. Emisión Supabase broadcast: sb.channel('reserva-' + reservaId).send({type:'broadcast', event:'asignacion', payload: {conductor_id, vehiculo_id}}). Esto lo recibirá la driver app en S6.
8. apps/web/src/app/admin/metricas/page.tsx con cards mockup (TanStack Table sparklines con datos calculados desde Prisma — reservas hoy, asignaciones hoy, conductores activos).
9. tests/e2e/admin-asignacion.spec.ts: login admin → reserva manual → asignar conductor → verificar auditoría.

REGLAS:
- Toda acción del admin → recordAudit con fuente_decision=null (humana directa).
- Emisión Supabase Realtime SIEMPRE después de commit DB exitoso (prevenir doble notificación).
- Selector conductor: ordenar por tiempo_en_cola_desde (más antiguo primero).
- Tenant scoping: queries filtradas por tenant_id del JWT (en demo solo 1 tenant, igual filtrar).

VERIFICACIÓN:
- 2 pestañas /admin: crear reserva en Prisma Studio → aparece en ambas vía Realtime sin refresh.
- Asignar → auditoría OK.

Sin preguntas.
```

---

## Sprint 4 — Capa IA mínima + ingesta determinista + simulador WhatsApp — Modelo: OPUS (core) + SONNET (UI)

**Objetivo:** construir el `Wow #1` con arquitectura correcta. Determinista que SIEMPRE funciona + capa LLM mínima con fallback. Simulador WhatsApp visual.

### S4.1. Backlog

**Parte 1 — Determinista (packages/ingesta):**

1. `feat(pkg/ingesta): types.ts con Zod schemas ReservaExtraida + interfaz IExtractorReserva`.
2. `feat(pkg/ingesta): ExtractorDeterminista en src/extractor.ts usando:`
   - `chrono-node` (locale `es`) para fechas relativas.
   - Diccionarios en src/diccionarios/{hoteles.ts, aeropuertos.ts, zonas-lima.ts, vuelos-prefijos.ts, pagos-keywords.ts}.
   - Regex teléfono peruano (+51 9XXXXXXXX).
   - Regex + validación módulo 11 RUC.
   - Regex DNI (8 dígitos).
   - Confianza = campos_extraidos / campos_esperables_segun_tipo_servicio.
3. `feat(pkg/ingesta): post-procesamiento (normalizarFecha, validarRUC, normalizarDireccion via Mapbox forward geocoding bbox Lima)`.
4. `feat(pkg/ingesta): aclarador.ts con templates de preguntas por campo faltante`.
5. `feat(pkg/ingesta): test-suite/whatsapps.ts con 15 muestras peruanas + tests verificando campos críticos`.

**Parte 2 — Capa IA mínima (packages/ia):**

6. `feat(pkg/ia): llm-provider.ts con interfaz LLMProvider { name; generateObject<T>(...); generateText(...) }`.
7. `feat(pkg/ia): providers/anthropic.ts adapter usando @ai-sdk/anthropic + generateObject de Vercel AI SDK 4`.
8. `feat(pkg/ia): fallback.ts con withFallback({llm, algoritmo, timeoutMs, capacidad}) según PLAN_SOFTWARE.md §7.5`.
9. `feat(pkg/ia): prompts.ts cargador de prompts desde packages/ia/prompts/*.md (parser frontmatter + body)`.
10. `feat(pkg/ia): prompts/ingesta-whatsapp.v1.md con system + few-shot 3 ejemplos peruanos`.
11. `feat(pkg/ia): src/extractor-llm.ts envuelve a ExtractorDeterminista con Sonnet → si LLM responde dentro de 5s, valida campos verificables (RUC/DNI/fecha/vuelo) contra determinista; si LLM falla, cae al determinista`.
12. `feat(pkg/ia): index.ts exporta extraerReservaConFallback(input) que aplica withFallback`.

**Parte 3 — UI simulador WhatsApp (apps/web):**

13. `feat(app/web): /api/ingesta/extraer endpoint POST → llama packages/ia/extraerReservaConFallback`.
14. `feat(app/web): /wa-sim/page.tsx réplica visual WhatsApp Web (header verde #075E54, sidebar conversaciones, chat principal)`.
15. `feat(app/web): /wa-sim/conversaciones-seed.ts con 3 conversaciones pre-cargadas. La conversación protagonista es hotel/concierge solicitando **recojo en aeropuerto** para huésped que llega a Lima; las otras dos son variantes no protagonistas.`
16. `feat(app/web): /wa-sim/chat.tsx (Client) con input + envío al endpoint + streaming visualización via useChat de @ai-sdk/react`.
17. `feat(app/web): /wa-sim/extraccion-panel.tsx panel lateral con JSON extraído en vivo + confianza + badge "🤖 IA" o "⚙️ Algoritmo" según fuente`.
18. `feat(app/web): /wa-sim/actions.ts crearReservaDesdeIngesta server action → guarda raw_ingesta jsonb + crea reserva con canal_origen=whatsapp_oficial + redirige a /admin/reservas/[id]`.
19. `test(pkg/ia): unit tests con MSW mockeando LLM ok/timeout/500 → verifica fallback`.
20. `test(e2e): Playwright "abrir /wa-sim → Hilton → enviar mensaje → ver extracción → crear reserva → aparece en /admin"`. Ejecutar 2 veces: IA_HABILITADA=true e IA_HABILITADA=false.

### S4.2. Prompt versionado packages/ia/prompts/ingesta-whatsapp.v1.md

```markdown
---
version: 1
created: 2026-05-26
purpose: extracción structured de reservas de taxi desde WhatsApp peruano
target-model: claude-sonnet-4-6
fallback: ExtractorDeterminista (packages/ingesta)
---

# System

Eres un asistente experto en extraer datos estructurados de mensajes WhatsApp en castellano peruano para Taxi Green (taxi aeroportuario Lima).

## Reglas
1. Extrae SOLO lo explícito. Si falta algo, déjalo null + agrégalo a "preguntas_aclaracion".
2. Fechas → ISO 8601, zona America/Lima si no se especifica.
3. "mañana"/"pasado mañana"/"el viernes" → calcula con fecha_actual_iso del input.
4. Hoteles/aeropuertos reconocidos: usa nombre canónico.
5. Tipos de pago: efectivo, voucher_hotel, factura_empresa, app_pago.
6. NUNCA inventes. null + pregunta > dato erróneo.

## Few-shot
[3 ejemplos peruanos reales: Hilton concierge formal, ejecutivo BBVA express, turista con jerga]

# User

fecha_actual_iso: {{fecha_actual_iso}}
contexto_conversacion: {{contexto_conversacion}}
mensaje: {{mensaje}}
```

### S4.3. Prompt OPUS — Sprint 4 (Parte 1+2)

```text
Ingeniero senior. Construyes la ingesta multicanal de Taxi Green con arquitectura dual: extractor determinista que SIEMPRE funciona + wrapper LLM (Sonnet) opcional con fallback automático.

CONTEXTO OBLIGATORIO:
- PLAN_SOFTWARE.md §7.5 (capa IA mínima en demo).
- Visión perfecta §3.1.
- Castellano peruano con jerga.

REGLA CENTRAL: si IA_HABILITADA=false, el sistema extrae correctamente con SOLO el determinista. La demo debe poder demostrarse con LLM apagado.

MISIÓN PARTE 1 — packages/ingesta DETERMINISTA:
1. types.ts: Zod schemas + interfaz IExtractorReserva.
2. src/extractor.ts: clase ExtractorDeterminista implements IExtractorReserva. Usa chrono-node (es), diccionarios src/diccionarios/{hoteles, aeropuertos, zonas-lima, vuelos-prefijos, pagos-keywords}.ts, regex teléfono/RUC/DNI con validaciones, confianza calculada.
3. src/aclarador.ts: dada ReservaExtraida con nulls, genera preguntas con templates fijos.
4. src/post-procesamiento.ts: normalizarFecha, validarRUC, normalizarDireccion via Mapbox forward geocoding bbox Lima.
5. src/test-suite/whatsapps.ts: 15 muestras peruanas (hotel formal, ejecutivo express, turista jerga, multi-turno, datos incompletos, typos).
6. tests/unit/ingesta-determinista.spec.ts: cada muestra verifica campos críticos extraídos.

MISIÓN PARTE 2 — packages/ia mínima:
7. src/llm-provider.ts: interface LLMProvider { name; generateObject<T>({prompt, schema, timeoutMs}); generateText({prompt, maxTokens, timeoutMs}) }.
8. src/providers/anthropic.ts: class AnthropicProvider implements LLMProvider. Constructor(modelExtraccion, modelRapido). Usa @ai-sdk/anthropic + generateObject/generateText de Vercel AI SDK 4.
9. src/fallback.ts: withFallback<TInput,TOutput>({llm, algoritmo, timeoutMs=5000, capacidad}) según PLAN_SOFTWARE.md §7.5. Lee env.IA_HABILITADA. Promise.race con timeout. Telemetría simple via Pino log {capacidad, fuente, latencia_ms, ok}.
10. src/prompts.ts: cargador prompts desde packages/ia/prompts/*.md. Parser frontmatter (gray-matter) + body. Función loadPrompt(name) → {meta, body}.
11. prompts/ingesta-whatsapp.v1.md (template arriba).
12. prompts/aclaracion-datos-faltantes.v1.md (Haiku, pregunta corta peruana).
13. src/extractor-llm.ts: clase ExtractorLLM implements IExtractorReserva. Internamente llama Sonnet vía generateObject con schema Zod, luego cruza con ExtractorDeterminista para validar campos verificables (RUC/DNI/fechas/vuelos). Si LLM contradice, gana determinista para esos campos. Retorna {reserva, fuente:'llm', motivo:null}.
14. src/index.ts: exporta extraerReservaConFallback(input) que aplica withFallback({llm: ExtractorLLM.extraer, algoritmo: ExtractorDeterminista.extraer, capacidad: 'ingesta'}).
15. tests/unit/ia-fallback.spec.ts: 4 escenarios — IA off → algoritmo; IA on + LLM ok → llm; IA on + LLM timeout → algoritmo fallback; IA on + LLM 500 → algoritmo fallback.

REGLAS NO NEGOCIABLES:
- packages/ingesta NUNCA importa packages/ia. Dependencia única: ia → ingesta.
- packages/ia NUNCA bypassa withFallback.
- Streaming activado en LLM (UX en wa-sim mostrará campos uno a uno).
- Costo target: <USD 0.005 por extracción LLM. Cache in-memory 5min para los WhatsApps del guion demo.
- Schema Zod estricto, sin coerción implícita.

VERIFICACIÓN:
- pnpm turbo run test pasa.
- Manual env IA_HABILITADA=false: extraerReservaConFallback con "Hola, soy el concierge. Necesito recojo en el Jorge Chávez para una huésped que llega mañana 03:45 en vuelo LA2456. Punto de encuentro Salida 3 columna F2. Destino Av. Pardo 123, Miraflores. 2 pasajeros, 2 maletas. Pago voucher hotel." → determinista extrae solicitante hotel, origen aeropuerto, punto de encuentro, destino Miraflores, hora, vuelo; metadata fuente='algoritmo' motivo='flag_off'.
- Manual env IA_HABILITADA=true mismo mensaje → fuente='llm', validado contra determinista.

Sin preguntas. Decide con `// DECISIÓN: ...`.
```

### S4.4. Prompt SONNET — Sprint 4 (Parte 3 UI)

```text
Contexto: capa IA + ingesta determinista del backend listas (S4 partes 1+2).

MISIÓN UI:
1. apps/web/src/app/wa-sim/page.tsx — réplica WhatsApp Web.
2. apps/web/src/app/wa-sim/conversaciones-seed.ts: 3 conversaciones con avatares + último mensaje. La conversación Hilton/concierge debe pedir recojo en Aeropuerto Jorge Chávez hacia Av. Pardo 123, Miraflores; BBVA/turista quedan como variantes.
3. apps/web/src/app/wa-sim/chat.tsx (Client) con useChat de @ai-sdk/react para streaming + input + envío.
4. apps/web/src/app/wa-sim/extraccion-panel.tsx panel lateral derecho con:
   - JSON extraído en vivo (campos aparecen uno a uno si fuente='llm', de golpe si 'algoritmo').
   - Badge prominente "🤖 IA" o "⚙️ Algoritmo".
   - Confianza con color (verde >0.85, amarillo 0.7-0.85, rojo <0.7).
   - Lista de preguntas_aclaracion si las hay.
   - Botón "Crear reserva con esto" si confianza > 0.7.
5. apps/web/src/app/api/ingesta/extraer/route.ts POST → llama packages/ia.extraerReservaConFallback. Devuelve {reserva, confianza, fuente, motivo, preguntas_aclaracion}.
6. apps/web/src/app/wa-sim/actions.ts crearReservaDesdeIngesta server action: guarda raw_ingesta jsonb + crea reserva con canal_origen='whatsapp_oficial' + recordAudit con fuente_decision={fuente, motivo, modelo} + redirige a /admin/reservas/[id].
7. tests/e2e/wa-sim-dual.spec.ts: ejecuta el flujo 2 veces — IA_HABILITADA=true e IA_HABILITADA=false; ambas crean reserva correctamente.

UI/UX:
- Look exacto WhatsApp Web (header #075E54, mensajes burbuja, timestamps).
- Panel extracción a la derecha (sheet animado).
- Badge fuente visible y honesto — esto es estratégico para el guion.

VERIFICACIÓN:
- Manual IA_HABILITADA=true: /wa-sim → "Hilton concierge" → enviar mensaje completo → ver streaming + badge "🤖 IA" → crear reserva → verificar en /admin.
- Manual IA_HABILITADA=false (cambiar env, reiniciar): mismo flujo, sin streaming, badge "⚙️ Algoritmo", reserva creada igual.

Sin preguntas.
```

---

## Sprint 5 — Heurística asignación + racionalización LLM con fallback — Modelo: SONNET 4.6

**Objetivo:** `Wow #2` del despacho. Cuando el despachador abre una reserva nueva, el sistema sugiere conductor + vehículo con un párrafo en castellano explicando por qué.

### S5.1. Backlog

1. `feat(pkg/asignacion): heurística determinista puntuarCandidatos({reserva, conductores_disponibles, vehiculos_disponibles}) → array ordenado con score`.
   - Score = w1·tiempo_en_cola + w2·(1/distancia_mock_km) + w3·match_tipo_servicio.
   - Pesos en env.
2. `feat(pkg/asignacion): sugerirAsignacion(reservaId) determinista → {conductor, vehiculo, razon_corta_fija, score}`.
3. `feat(pkg/ia): prompts/asignacion-racional.v1.md (Haiku 2 frases peruanas explicando veredicto)`.
4. `feat(pkg/ia): src/racionalizador-llm.ts envuelve a packages/asignacion.sugerirAsignacion (determinista) — el LLM SOLO añade prosa, no cambia la decisión. Si LLM falla, devuelve razón corta determinista`.
5. `feat(pkg/ia): exporta sugerirAsignacionConRazonamiento(reservaId) que aplica withFallback`.
6. `feat(app/web): /api/asignacion/sugerir endpoint POST {reservaId}`.
7. `feat(app/web): en /admin/reservas/[id] mostrar tarjeta de sugerencia con foto conductor + placa + párrafo + badge fuente`.
8. `feat(app/web): botón "Aceptar sugerencia" → server action asigna + recordAudit con fuente_decision`.
9. `feat(app/web): botón "Asignar otro" → selector manual + recordAudit con flag override=true`.
10. `test(pkg/asignacion): unit tests heurística con escenarios edge`.
11. `test(pkg/ia): unit tests racionalizador con LLM mockeado ok/timeout/500`.

### S5.2. Criterios de aceptación

- Crear reserva nueva en /admin → tarjeta de sugerencia aparece con datos coherentes.
- Si IA_HABILITADA=true: párrafo natural Haiku.
- Si IA_HABILITADA=false: razón corta determinista ("Sugerido: 1° en cola, más cercano").
- Botón aceptar → asigna + auditoría refleja fuente_decision.

### S5.3. Prompt SONNET — S5

```text
Contexto: S0-S4 cerrados. Ahora sugerencia de asignación racionalizada con fallback.

MISIÓN:
1. packages/asignacion/src/heuristica.ts: puntuarCandidatos({reserva, conductores, vehiculos}) → ordenado con score. Pesos w1=0.5, w2=0.3, w3=0.2 desde env.
2. packages/asignacion/src/sugerir.ts: sugerirAsignacionDeterminista(reservaId) → {conductor, vehiculo, razon: "Sugerido por: 1° en cola, más cercano (6 min)", score}.
3. packages/ia/prompts/asignacion-racional.v1.md: Haiku, 2 frases peruanas naturales. Input: top candidato + contexto reserva. Output: párrafo.
4. packages/ia/src/racionalizador-llm.ts: clase RacionalizadorLLM. Llama Haiku con prompt. Si responde, sustituye razon por el párrafo del LLM. Si falla, devuelve la razon corta determinista. Resultado siempre incluye {fuente, motivo, modelo?}.
5. packages/ia/src/index.ts: exporta sugerirAsignacionConRazonamiento(reservaId) usando withFallback.
6. apps/web/src/app/api/asignacion/sugerir/route.ts POST.
7. apps/web/src/app/admin/reservas/[id]/sugerencia-card.tsx (client): muestra foto conductor + placa + razon + badge "🤖 IA" o "⚙️ Algoritmo".
8. Botón "Aceptar sugerencia" → server action asignar + recordAudit con fuente_decision={fuente, motivo, modelo, razon, score}.
9. Botón "Asignar otro" → abre selector manual + recordAudit con fuente_decision={fuente:'algoritmo', motivo:'override_humano', razon_original_sugerida}.
10. tests/unit/asignacion-heuristica.spec.ts: escenarios edge (conductor sin tiempo_en_cola_desde, sin vehículos, etc.).
11. tests/unit/ia-racionalizador.spec.ts: LLM mockeado ok/timeout/500 → fuente correspondiente.

REGLAS:
- Haiku, no Sonnet (costo + latencia <1s).
- Streaming UI: párrafo aparece progresivamente si LLM.
- LLM NO cambia la decisión de conductor/vehículo — solo prosa.
- Override siempre auditado.

VERIFICACIÓN:
- Manual con IA_HABILITADA=true: crear reserva en /wa-sim → abrir en /admin → ver tarjeta con párrafo Haiku + badge IA → aceptar → auditoría con fuente_decision LLM.
- Manual con IA_HABILITADA=false: mismo flujo, razon corta + badge algoritmo.

Sin preguntas.
```

---

## Sprint 6 — App RN+Expo: scaffolding + auth PIN + push + recibir asignación — Modelo: OPUS

**Objetivo:** dejar la app del conductor (React Native + Expo SDK 51) corriendo en Expo Go con login email+PIN, push notifications con expo-notifications, suscripción a Supabase Realtime para recibir asignación. **Sprint más crítico técnicamente** después de S1.

### S6.1. Dependencias previas
- S0-S3 cerrados.
- Android SDK + Android Studio para probar.
- Cuenta Expo (gratuita).
- Firebase project con `google-services.json` (placeholder de S0, real para push).

### S6.2. Backlog

1. `feat(app/driver): app.json finalizado con plugins, scheme, iconos placeholder, android.permissions (location foreground, notifications, camera)`.
2. `feat(app/driver): app/_layout.tsx con AuthProvider + RealtimeProvider + Toast provider`.
3. `feat(app/driver): app/index.tsx splash + redirect según auth (login si no, home si sí)`.
4. `feat(app/driver): app/login.tsx con email + PIN (4 dígitos numpad gigante)`.
5. `feat(app/driver): src/features/auth/use-auth.ts con login(email, pin) → POST /api/conductor/login → token JWT guardado en expo-secure-store`.
6. `feat(app/driver): src/features/api/client.ts con axios + interceptor que añade Authorization Bearer desde secure-store`.
7. `feat(app/driver): src/features/push/index.ts con expo-notifications:`
   - solicitarPermiso()
   - registrarToken() → POST /api/conductor/fcm-token
   - listener onNotificationReceived
   - listener onNotificationResponse (tap → navega a /asignacion/[id])
   - canal Android "asignacion" con prioridad MAX + sonido custom (placeholder mp3)
8. `feat(app/driver): src/features/realtime/index.ts con cliente Supabase + suscripción a canal conductor:{conductorId} y broadcast 'asignacion'`.
9. `feat(app/driver): app/(auth)/home.tsx con saludo + estado del turno + próxima asignación si existe (placeholder)`.
10. `feat(app/driver): app/(auth)/_layout.tsx con tabs simples (Home, Perfil)`.
11. `feat(app/driver): UI componentes táctiles base inline en app/driver (TouchButton min 64px, NumPad 4cols 3rows, BottomSheet)`.
12. `feat(app/web): /api/conductor/login POST {email, pin} → JWT (reusa Auth.js v5 credentials-driver provider de S1, pero exponer endpoint REST adicional para RN)`.
13. `feat(app/web): /api/conductor/fcm-token POST {token} → guarda token en usuarios.fcm_token (añadir columna nullable en migración Prisma)`.
14. `feat(app/web): cuando admin asigna en /admin (S3 server action) → adicionalmente emitir push FCM al conductor (usar Firebase Admin SDK)`.

### S6.3. Criterios de aceptación

- `cd apps/driver && pnpm start` → QR Expo Go → escanear → arranca app placeholder.
- Login con `conductor1@taxigreen.demo / 1234` → entra a /home.
- Backend recibe FCM token (verificable en tabla usuarios).
- Test emitir asignación desde /admin → llega push al Android físico con sonido + badge.
- Tap en push → abre app en /asignacion/[id] (placeholder S6, completo en S7).
- Supabase Realtime broadcast 'asignacion' recibido en el cliente (verificable con log).

### S6.4. Prompt OPUS — S6

```text
Ingeniero senior con experiencia en React Native + Expo. La app conductor es el activo más crítico de Taxi Green (10h/día de uso).

CONTEXTO OBLIGATORIO:
- Visión perfecta §3.5 (cara 5: conductor 45-60, botones gigantes, cero login complejo).
- PLAN_SOFTWARE.md §2.6 y §7.2 (decisión React Native + Expo SDK 51).

MISIÓN S6:
1. apps/driver/app.json finalizado con plugins, scheme, iconos placeholder, permisos Android (location foreground, notifications, camera).
2. apps/driver/app/_layout.tsx con providers: AuthProvider, RealtimeProvider, Toast.
3. apps/driver/app/index.tsx splash 800ms + redirect según auth state.
4. apps/driver/app/login.tsx con email input + PIN numpad gigante (cada botón min 80px). Submit → POST /api/conductor/login → guarda JWT en expo-secure-store → router.replace('/(auth)/home').
5. apps/driver/src/features/auth/{use-auth.ts, types.ts}: hook useAuth + persistencia secure-store + logout.
6. apps/driver/src/features/api/client.ts: axios con baseURL desde env, interceptor Authorization Bearer.
7. apps/driver/src/features/push/{index.ts, channel-config.ts}:
   - registerForPushNotificationsAsync(): solicita permiso + obtiene Expo push token + POSTea a backend.
   - Canal Android "asignacion" con importancia MAX, sonido custom asignacion.mp3 (placeholder), vibración.
   - Listener Notifications.addNotificationReceivedListener para foreground.
   - Listener Notifications.addNotificationResponseReceivedListener: tap → router.push('/(auth)/asignacion/' + data.reservaId).
8. apps/driver/src/features/realtime/{index.ts, hooks.ts}: cliente Supabase con anon key, hook useRealtimeChannel(channelName, eventName, callback).
9. apps/driver/app/(auth)/home.tsx: saludo "Hola Raúl", estado turno (toggle "En turno"/"Off"), próxima asignación si existe.
10. apps/driver/app/(auth)/_layout.tsx con Tabs (Home, Perfil) usando expo-router.
11. apps/driver/app/(auth)/asignacion/[id].tsx placeholder (completo en S7).
12. apps/driver/app/(auth)/perfil.tsx con datos del conductor + logout.
13. Componentes táctiles en apps/driver/src/components/{TouchButton.tsx, NumPad.tsx, BottomSheet.tsx} usando NativeWind. min-height 64px botones, padding 24, fuente 20.
14. apps/web/src/app/api/conductor/login/route.ts: POST {email, pin} → valida con bcrypt → emite JWT firmado (jose) → return {token, conductor}. Llama recordAudit.
15. apps/web/src/app/api/conductor/fcm-token/route.ts: POST {token} con auth Bearer → actualiza usuarios.fcm_token.
16. packages/database/prisma/schema.prisma: añadir columna usuarios.fcm_token String? (migración).
17. apps/web/src/app/admin/reservas/[id]/actions.ts (modificar de S3): al asignar, además de Supabase broadcast, llamar packages/push/send-fcm (nuevo helper en apps/web/src/lib/push.ts usando firebase-admin) → enviar push al conductor.

REGLAS:
- React 19 strict.
- NativeWind 4 con Tailwind compatible.
- Toda llamada al backend pasa por src/features/api/client.ts.
- @capacitor-related = NO (es Expo).
- Notification channel Android prioridad MAX con sonido custom.
- Permisos: solicitar foreground al inicio. Background y biometría = MVP.
- Secure store para tokens (NUNCA AsyncStorage para JWT).

VERIFICACIÓN MANUAL (Android físico con Expo Go):
1. cd apps/driver && pnpm start → escanear QR → app arranca placeholder.
2. Login conductor1@taxigreen.demo / 1234 → entra a /home.
3. Verificar en /admin que aparece el conductor con fcm_token poblado en usuarios.
4. Desde /admin → crear reserva manual → asignar al conductor → llega push con sonido en Android.
5. Tap push → abre app en /(auth)/asignacion/[id] (placeholder).
6. Verificar Supabase Realtime broadcast log en consola Expo.

Sin preguntas. Decide y comenta ambigüedades de plugin Expo con `// EXPO-DECISIÓN:`.
```

### S6.5. Riesgos

- Permisos push iOS: solo Android en demo, iOS es MVP.
- `expo-notifications` en Expo Go: pre-SDK 53 requiere remote push con Expo servers, no FCM directo. **Opción demo:** usar Expo Push Notification service (gratis hasta cierto límite). **Opción MVP:** dev client con FCM directo via @react-native-firebase/messaging.
- Firebase admin SDK en Railway requiere service account JSON en env var (base64) — documentar en README.
- Sonido custom requiere que el mp3 esté en `apps/driver/assets/sounds/asignacion.mp3` + configurado en notification channel Android.

---

## Sprint 7 — App RN+Expo: mapa + estados viaje + ubicación foreground + Realtime client — Modelo: SONNET 4.6

**Objetivo:** completar la app del conductor con la pantalla de asignación activa, mapa Mapbox nativo, ubicación foreground emitida vía Supabase broadcast, botones gigantes para cambiar estados.

### S7.1. Backlog

1. `feat(app/driver): app/(auth)/asignacion/[id].tsx con layout vertical`:
   - Header: pasajero + vuelo + ETA
   - Mapa @rnmapbox/maps 50% altura con marcador conductor + ruta a punto de recogida en Aeropuerto Jorge Chávez
   - Datos visibles: origen "Aeropuerto Jorge Chávez - Llegadas", punto "Salida 3, columna F2", destino "Av. Pardo 123, Miraflores"
   - 4 botones gigantes secuenciales (one-at-a-time visible): "En camino" → "Llegué" → "Pasajero a bordo" → "Servicio terminado"
2. `feat(app/driver): src/features/location/index.ts con expo-location foreground`:
   - solicitarPermiso() permiso Foreground
   - iniciarTracking(reservaId) → watchPositionAsync cada 3s con distance interval 10m → emite broadcast en canal Supabase reserva:{id} event 'posicion'
   - detenerTracking()
3. `feat(app/driver): botones de estado → POST /api/conductor/asignacion/[id]/estado con estado_nuevo + recordAudit`.
4. `feat(app/driver): screen always-on cuando estado_viaje activo (expo-keep-awake)`.
5. `feat(app/driver): toast confirmaciones tras cada acción`.
6. `feat(app/web): /api/conductor/asignacion/[id]/estado route handler POST → actualiza viaje + reserva.estado + recordAudit + emite Supabase Realtime postgres_changes que el pasajero recibirá en S8`.
7. `feat(app/web): /api/conductor/asignacion/[id]/aceptar route handler POST → marca aceptación + dispara emisión push fallback`.
8. `feat(app/driver): manejo offline básico — si POST falla, encolar en Map local y reintentar al recuperar conexión (expo-network)`.

### S7.2. Criterios de aceptación

- Asignación activa visible con mapa + 4 botones secuenciales.
- Botones cambian estado backend y reflejan en /admin via Supabase Realtime.
- Posición emitida cada 3s mientras viaje activo.
- Screen no se apaga durante viaje activo.

### S7.3. Prompt SONNET — S7

```text
Contexto: S6 cerrado. App driver con auth + push + suscripción Realtime funcionando.

MISIÓN:
1. apps/driver/app/(auth)/asignacion/[id].tsx layout completo:
   - Top: Card con pasajero_nombre, vuelo_codigo, ETA calculado (mock Mapbox Directions o tiempo fijo si demo), origen Aeropuerto Jorge Chávez, punto Salida 3 columna F2 y destino Av. Pardo 123, Miraflores.
   - Middle: MapView con @rnmapbox/maps. Marker del conductor (icon TaxiGreen rotating según heading). Marker del punto recogida (pin). LineLayer con ruta polyline.
   - Bottom: ScrollView con 4 botones grandes secuenciales. Solo se ve el siguiente botón. Tras pulsarlo, animar transición al siguiente.
2. apps/driver/src/features/location/index.ts:
   - solicitarPermisoForeground(): Location.requestForegroundPermissionsAsync().
   - useLocationTracking(reservaId, activo): hook que cuando activo=true llama Location.watchPositionAsync({timeInterval: 3000, distanceInterval: 10}) y por cada update llama sb.channel('reserva-' + reservaId).send({type:'broadcast', event:'posicion', payload: {lat, lng, ts}}).
   - Cleanup al desmontar.
3. Acciones de botones:
   - "En camino" → POST /api/conductor/asignacion/[id]/estado {estado_nuevo:'en_camino'} → inicia useLocationTracking → muestra botón "Llegué".
   - "Llegué" → estado en_lugar → muestra "Pasajero a bordo".
   - "Pasajero a bordo" → estado a_bordo → muestra "Servicio terminado".
   - "Servicio terminado" → estado finalizado → detiene tracking → muestra resumen + botón "Volver al inicio".
4. expo-keep-awake: useKeepAwake() en la screen mientras estado activo.
5. apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts: POST {estado_nuevo} con auth Bearer → actualiza viaje.estado + reserva.estado correspondientes + recordAudit + Supabase emite postgres_changes (auto).
6. Manejo offline: queue local Map con uuid → cada POST si falla se guarda y se reintenta al volver online (expo-network NetInfo listener).

REGLAS:
- @rnmapbox/maps requiere config token MAPBOX_DOWNLOAD_TOKEN en EAS o local. Documentar.
- Throttle posición: 3s + 10m distance.
- Botones nunca permiten saltar pasos.

VERIFICACIÓN MANUAL:
1. Crear reserva en /wa-sim → asignar al conductor1 desde /admin → llega push al Android.
2. Tap → abre /asignacion/[id] → ver mapa con marker + punto recogida.
3. Pulsar "En camino" → caminar 50m con app abierta → verificar en /admin que marker se mueve.
4. Secuencia completa: En camino → Llegué → Pasajero a bordo → Servicio terminado → reserva.estado='finalizada'.

Sin preguntas.
```

---

## Sprint 8 — Link /p pasajero + tracking en vivo + comprobante + 1 incidencia simple — Modelo: SONNET 4.6

**Objetivo:** cerrar el círculo. El pasajero abre `/p/[token]`, ve a su conductor moviéndose en tiempo real, ve punto de encuentro físico, recibe notificación al llegar, recibe comprobante, puede reportar UNA incidencia ("olvidé algo").

### S8.1. Backlog

1. `feat(app/web): /p/[token]/page.tsx (RSC con datos iniciales) + /p/[token]/cliente.tsx con Supabase Realtime client suscrito a canal reserva:{id} (postgres_changes para estados + broadcast para posiciones)`.
2. `feat(app/web): mapa Mapbox GL JS v3.5 con marker conductor (foto + flecha según heading) + marker punto recogida + polyline de ruta`.
3. `feat(app/web): tarjeta superior con foto conductor + nombre + placa + "Llega en X min" (ETA dinámico)`.
4. `feat(app/web): tarjeta de punto de encuentro físico prominente ("Salida 3, columna F2") — esto es CLAVE`.
5. `feat(app/web): botones "Llamar al conductor" (tel:) + "Llamar a Taxi Green" (tel:) + "Aviso de retraso"`.
6. `feat(app/web): estados visibles secuencia: confirmada → asignada → en_camino → llegó → a_bordo → finalizado`.
7. `feat(app/web): al finalizado → mostrar comprobante (botón "Descargar boleta/factura") + modal de boleta (preguntar DNI o "Sin documento") + RatingTripleCard (servicio, conductor, unidad)`.
8. `feat(app/web): modal boleta → si DNI ingresado → llama /api/reniec/lookup → autocompletea nombre → POST /api/comprobantes/[reservaId]/emitir → PDF generado`.
9. `feat(app/web): sección "¿Olvidaste algo?" visible post-viaje → click abre formulario simple (texto libre) → POST /api/incidencias → crea incidencia tipologia=objeto_olvidado + timeline inicial`.
10. `feat(pkg/bienestar): clasificador determinista en src/clasificador.ts (keywords → tipologia, severidad)`.
11. `feat(app/web): /bienestar/[caso]/page.tsx mostrando estado del caso en vivo`.
12. `feat(app/web): /admin/bienestar/page.tsx bandeja simple de incidencias activas`.
13. `feat(app/driver): cuando llega incidencia objeto_olvidado al conductor activo → push + pantalla con dos botones gigantes "Sí encontré" / "No vi nada" → POST actualiza incidencia.timeline + emite Realtime al pasajero`.
14. `feat(app/web): al "Sí encontré" → en /bienestar/[caso] aparecen 2 opciones de entrega ("Entregar en recepción del hotel solicitante hoy" / "Recoger en oficina Taxi Green mañana") → pasajero elige → cierre con confirmación "¿quedó resuelto?"`.

### S8.2. Criterios de aceptación

- Crear reserva → asignar → conductor cambia estados → pasajero ve actualizaciones en /p/[token] en vivo.
- Punto de encuentro visible en tarjeta prominente del voucher y del link /p.
- Al finalizar: descargar comprobante PDF.
- Reportar objeto olvidado → conductor recibe push → "Sí encontré" → pasajero ve opciones → elige → cierre.
- Toda la cadena se cumple en <2 min en demo en vivo.

### S8.3. Prompt SONNET — S8

```text
Contexto: S0-S7 cerrados. El círculo cierra aquí.

MISIÓN:
1. apps/web/src/app/p/[token]/page.tsx (RSC: query reserva + viaje + conductor inicial) + p/[token]/seguimiento-cliente.tsx (Client: Supabase Realtime).
2. Suscripciones cliente:
   - sb.channel('reserva-' + reservaId).on('postgres_changes', {event:'UPDATE', table:'reservas', filter:'id=eq.'+reservaId}, ...) — para cambios de estado.
   - sb.channel('reserva-' + reservaId).on('broadcast', {event:'posicion'}, ...) — para posiciones.
3. Mapa Mapbox GL JS v3.5 con marker conductor (rotación según heading interpolado), marker recogida, polyline ruta (Mapbox Directions API).
4. Tarjeta superior con datos conductor + ETA calculado.
5. Tarjeta PROMINENTE punto encuentro ("Salida 3, columna F2") — esto distingue de Uber.
6. Botones tel: para llamar + botón "Aviso de retraso" → POST crea incidencia retraso (registro simple).
7. Estados visibles con stepper (5 pasos).
8. Al finalizado: 
   - botón "Descargar comprobante" → modal preguntando tipo (boleta/factura/ticket) + DNI opcional.
   - Si DNI → llama /api/reniec/lookup → autocompletea nombre → confirmar.
   - POST /api/comprobantes/[id]/emitir con datos cliente → backend crea comprobante + dispara generación PDF + retorna URL Storage.
   - Mostrar botón descarga + RatingTripleCard (servicio, conductor, unidad).
9. Sección "¿Olvidaste algo?" (collapsible) con textarea + botón "Reportar".
10. POST /api/incidencias → packages/bienestar.clasificar determinista (keywords texto → tipologia + severidad) → crea incidencia + recordAudit + emite Supabase Realtime al conductor activo.
11. packages/bienestar/src/clasificador.ts: switch keywords ("olvidé", "dejé", "perdí" → objeto_olvidado). En MVP/futuro entra LLM con fallback (paralelo a packages/ingesta).
12. apps/web/src/app/bienestar/[caso]/page.tsx con timeline + estado actual + acciones del pasajero (cuando aplique).
13. apps/web/src/app/admin/bienestar/page.tsx con bandeja simple (cards ordenadas por SLA restante).
14. apps/driver/app/(auth)/incidencia/[id].tsx pantalla notificación incidencia:
    - "Pasajero olvidó: <descripción>"
    - 3 botones gigantes: "Sí encontré" / "No vi nada" / "Revisar (5min)".
    - "Sí encontré" → POST /api/incidencias/[id]/responder {respuesta:'encontrado'} → emite Realtime al pasajero.
15. Cuando pasajero recibe Realtime "encontrado" → en /bienestar/[caso] aparecen 2 opciones de entrega → elige → POST cierre.
16. Cierre incidencia → pregunta "¿quedó resuelto?" emoji 👍/👎 → si 👎 reopen + sube prioridad.

REGLAS:
- /p/[token] sin login. Validación token server-side.
- Realtime con polling fallback cada 10s si Supabase Realtime cae.
- Mapbox marker actualización suave (animación 1.5s entre posiciones).
- Incidencia clasificada por DETERMINISTA en demo. LLM solo en MVP.
- Punto de encuentro: STRING fijo en reserva. MVP tendrá mapa interno.

VERIFICACIÓN:
- Manual: flujo completo en vivo — crear reserva /wa-sim → asignar /admin → conductor cambia estados → pasajero ve actualizaciones → finaliza → comprobante → reportar olvido → conductor "sí" → pasajero elige entrega → cierre.

Sin preguntas.
```

---

## Sprint 9 — /counter + landing pública + datos guion + reset + deploy + video respaldo — Modelo: SONNET 4.6

**Objetivo:** cerrar la demo. Vista counter con escaneo QR (cámara), landing pública con CTA WhatsApp, datos exactos del guion cargados, mecanismo reset, deploy prod estable, video de respaldo grabado.

### S9.1. Backlog

1. `feat(app/web): /counter/page.tsx con UI tablet-optimized + tab "Validar voucher"`.
2. `feat(app/web): /counter componente QRScanner con html5-qrcode o @yudiel/react-qr-scanner usando cámara navegador → escanea QR → POST /api/voucher/[id]/verify → muestra datos reserva + botón "Confirmar entrega"`.
3. `feat(app/web): / landing pública con hero + CTA "Pídelo por WhatsApp" (link wa.me con mensaje pre-armado) + sección "Cómo funciona" + footer`.
4. `feat(pkg/database): seed-guion.ts con datos EXACTOS del guion (3 conversaciones WhatsApp en /wa-sim, 1 reserva preasignada para demostrar tracking en vivo, 1 incidencia activa, conductor1 activo en turno con posición pre-cargada)`.
5. `feat(pkg/database): script reset = seed-guion (no UI, comando pnpm)`.
6. `feat(app/web): /demo/guion-narrado/page.tsx con steps del guion (para ensayos, no para cliente)`.
7. `chore: revisión final accesibilidad WCAG AA contraste + alt texts + focus visible`.
8. `chore: ensayo completo del guion timed (target <12min flujo A→Z + 3min counter + 2min incidencia)`.
9. `chore: deploy prod Railway con dominio custom (ej. demo.taxigreen.dev)`.
10. `chore: variables env prod configuradas`.
11. `chore: video de respaldo grabado con OBS Studio (15 min) del guion completo`.
12. `docs: README de demo con instrucciones para presentador (cómo abrir, cómo resetear via pnpm db:seed, qué hacer si X falla)`.

### S9.2. Criterios de aceptación

- Ensayo completo del guion <17 min sin tropiezos.
- /counter funcional con cámara escaneando QR del seed.
- Landing pública responde 200 en prod.
- `pnpm --filter database db:seed` resetea estado para nuevo ensayo.
- Video de respaldo grabado y subido a Drive interno.
- README de demo claro para presentador.

### S9.3. Prompt SONNET — S9

```text
Contexto: S0-S8 cerrados. Cerramos la demo.

MISIÓN:
1. apps/web/src/app/counter/page.tsx con layout tablet (>=768px) y tab "Validar voucher".
2. apps/web/src/app/counter/qr-scanner.tsx (Client) con @yudiel/react-qr-scanner: cámara → onScan → POST /api/voucher/[id]/verify → si OK muestra card con datos reserva + botón gigante "Confirmar entrega" → actualiza viaje.estado="a_bordo" + recordAudit.
3. apps/web/src/app/page.tsx landing pública:
   - Hero: logo TaxiGreen + título "Recojo en el Jorge Chávez, sin formularios" + subtítulo + botón "Pídelo por WhatsApp" (link wa.me/51XXXXXXXXX?text=Hola%20necesito%20un%20taxi).
   - Sección "Cómo funciona" con 3 pasos: 1) Escríbenos por WhatsApp, 2) Recibe tu voucher, 3) Te esperamos en Salida 3.
   - Footer simple.
4. packages/database/prisma/seed-guion.ts: datos EXACTOS guion (a coordinar con presentador):
   - 3 conversaciones wa-sim ya pobladas con último mensaje.
   - 1 reserva preasignada con conductor1 en estado "en_camino" + posiciones pre-cargadas con polyline simulada Aeropuerto Jorge Chávez → Av. Pardo 123, Miraflores.
   - 1 incidencia activa "objeto_olvidado" para mostrar bienestar.
   - Reset = re-ejecutar seed-guion (idempotente con upsert + truncate en tablas operativas).
5. apps/web/src/app/demo/guion-narrado/page.tsx: cards con pasos del guion (solo para ensayo interno, ocultar de menú principal).
6. Accesibilidad: contrast checker, alt texts en imágenes, focus rings visibles, navegación teclado.
7. Deploy prod Railway con dominio demo.taxigreen.dev (o el que esté disponible). Variables env: DATABASE_URL Supabase, ANTHROPIC_API_KEY, MAPBOX_TOKEN, RESEND_API_KEY, etc.
8. Video respaldo: OBS Studio grabando el guion completo en local + subir a Drive (link en README).
9. README docs/demo-presenter.md con: cómo abrir cada superficie, cómo resetear (pnpm --filter database db:seed), 5 objeciones frecuentes y respuestas, video respaldo URL.

VERIFICACIÓN:
- Ensayo timed <17 min total.
- /counter en tablet o navegador desktop con cámara → escanear QR del seed → 200.
- Landing pública prod responde 200 + CTA WhatsApp abre wa.me.
- Reset funciona limpio.

Sin preguntas.
```

---

## Cierre

Esta v3.0 está alineada a [PLAN_SOFTWARE.md v4.0](./PLAN_SOFTWARE.md). La demo cuenta UN flujo A→Z protagonista, demuestra tres wows verificables (canal del cliente, app conductor real, pasajero sin app), y no rehace nada cuando convierte la venta — la interfaz `LLMProvider`, el schema de 10 tablas, los packages deterministas y la app RN+Expo son la base del MVP.

`Recomendación final` con `confianza alta`: ejecutar S0-S9 en orden. Si algún sprint descubre un riesgo no anticipado, **modificar este documento antes de continuar** — no construir sobre un plan obsoleto.

---

*Fin del SPRINT.md. Cualquier decisión técnica de este documento puede revisarse antes de iniciar el sprint correspondiente; no después.*

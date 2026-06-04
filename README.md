# Taxi Green — Monorepo (Demo)

Monorepo de la **demo de Taxi Green**: operación trazable de taxi aeroportuario en Lima.
Cuenta **un** flujo protagonista A→Z (~12 min): recojo en el **Aeropuerto Jorge Chávez → Av. Pardo 123, Miraflores**,
solicitado por un hotel/concierge vía WhatsApp. **Demo ≠ MVP.**

> Fuente de verdad operativa: [CLAUDE.md](CLAUDE.md) (maestro) y
> [`_FUENTE_DESARROLLO/`](_FUENTE_DESARROLLO/). Plan técnico: [`07_PLAN_EJECUCION/`](07_PLAN_EJECUCION/).
> Estado actual y handoff: [`docs/`](docs/) — [DOCUMENTACION_TECNICA.md](docs/DOCUMENTACION_TECNICA.md),
> [ESTADO_SPRINT_9.md](docs/ESTADO_SPRINT_9.md), [GUIA_PRUEBAS_DEMO.md](docs/GUIA_PRUEBAS_DEMO.md).
> Estado: **Sprint 9 implementado — demo A-Z verificada localmente (56/56 + E2E 7/7).**

## Stack

- **Monorepo:** Turborepo 2 + pnpm (workspaces) · TypeScript 5.6 strict + `noUncheckedIndexedAccess` · Node 22 LTS.
- **apps/web:** Next.js 15.4 (App Router + RSC) · Tailwind 3.4 + shadcn/ui · Auth.js v5 · Pino · Supabase Realtime · Vercel AI SDK.
- **apps/driver:** React Native 0.74 + Expo SDK 51 · Expo Router 3 · NativeWind 4 · supabase-js · @rnmapbox/maps.
- **packages:** `database` (Prisma 6 + Postgres 17/PostGIS) · `shared` (tokens azul) · `ia` (LLMProvider + withFallback) · deterministas (`ingesta`/`asignacion`/`bienestar`) · `rutas` (Mapbox Directions + fallback) · `voucher`/`comprobantes`/`auditoria` · `integraciones/{reniec,lap-atu}`.

🎨 **Identidad visual = paleta AZUL (sistema dual):** chrome del producto en azul (`#0B0952`/`#227FDE`);
verde Taxi Green reservado a logo/chip de tenant; púrpura `care/*` en bienestar.

## Estructura

```
apps/{web,driver}   packages/{database,shared,ia,ingesta,asignacion,bienestar,voucher,comprobantes,auditoria,integraciones/*}
infra/              docker-compose (Postgres 17 + PostGIS) + supabase/
tests/e2e/          Playwright
.github/workflows/  ci.yml + deploy-web.yml + mobile-smoke.yml
```

## Quick Start

```bash
# 1) Requisitos: Node 22 LTS (ver .nvmrc) y pnpm 9+.
nvm use            # opcional, usa Node 22
corepack enable    # opcional, fija pnpm

# 2) Clonar e instalar
pnpm install

# 3) Variables de entorno (copiar y completar)
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/driver/.env.example apps/driver/.env

# 4) (Opcional) Postgres local con PostGIS
docker compose -f infra/docker-compose.yml up -d

# 5) Aplicar migraciones y dejar guion demo listo
pnpm --filter @taxigreen/database db:deploy
pnpm --filter @taxigreen/database db:seed-guion

# 6) Verificación (debe quedar todo verde)
pnpm turbo run typecheck lint test build

# 7) Levantar la web (http://localhost:3000)
pnpm --filter @taxigreen/web build
pnpm --filter @taxigreen/web start

# 8) Levantar la app conductor (Expo Go/dev client en Android)
cd apps/driver && pnpm start    # escanear el QR con Expo Go
```

### Pendiente de credenciales del usuario (servicios externos)

Estos pasos del DoD de Sprint 0 requieren cuentas/credenciales del usuario y quedan cableados pero sin ejecutar:

- **Supabase:** crear proyecto + habilitar extensiones `postgis` y `pgcrypto` (SQL editor). Pegar `DATABASE_URL`/`DIRECT_URL` y claves en `.env`.
- **Railway:** web desplegada en `https://web-production-816a4.up.railway.app`; falta pegar el `RAILWAY_TOKEN` secreto real en GitHub Secrets para deploy automático.
- **Anthropic / Resend / APIs.net.pe / Expo (EAS):** claves opcionales según demo/MVP. Mapbox ya se usa para rutas si `MAPBOX_SERVER_TOKEN` está configurado.

## Notas

- **Entorno actual:** Node 24 / pnpm 10 (la `.nvmrc` apunta a Node 22 como objetivo documentado; lockfile compatible).
- **CI** (`.github/workflows/ci.yml`): `install → turbo run typecheck lint test build` con `IA_HABILITADA=false`.
- **Mobile smoke** (`.github/workflows/mobile-smoke.yml`): driver `typecheck`, `lint` y `expo export --platform android`.
- Demo manual principal: `/`, `/login-admin`, `/wa-sim`, `/counter`, `/p/tg_demo_passenger_001`.
- No modificar el plugin Figma (`06_DEMO_TECNICA/figma-plugin-taxigreen-master/`).

## Convención de commits

`feat(app/web): …` · `feat(app/driver): …` · `feat(pkg/<nombre>): …` · `chore(infra): …` · `test(e2e): …` · `docs: …`
(un commit nunca cruza dos scopes). Commits/push solo cuando se solicite.

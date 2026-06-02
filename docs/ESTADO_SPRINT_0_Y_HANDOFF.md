# Estado Sprint 0 + Handoff a Sprint 1 — Demo Taxi Green

**Fecha:** 2026-05-31 · **Estado:** ✅ **Sprint 0 COMPLETO y verificado (DoD verde, 52/52).**
**Propósito:** dejar por escrito *qué se implementó en Sprint 0*, *cómo quedó el entorno* (con las decisiones no
obvias que un agente nuevo debe respetar) y *qué corresponde hacer en Sprint 1*. El prompt copy-paste para
ejecutar Sprint 1 con Codex 5.5 (high) está en [PROMPT_SPRINT_1_CODEX.md](PROMPT_SPRINT_1_CODEX.md).

> **Ubicación:** este handoff vive en `docs/` (no en `_FUENTE_DESARROLLO/`) porque un proceso externo revirtió esa
> carpeta y se perdieron versiones previas; `docs/` es estable. Precedencia documental sin cambios: manda
> `_FUENTE_DESARROLLO/{01_FUENTE_DE_VERDAD, GLOSARIO, CONTRATO_FLUJO_PROTAGONISTA, 04_DECISIONES_ABIERTAS}` y
> `07_PLAN_EJECUCION/{PLAN_SOFTWARE, SPRINT, LOGICA}`. Este doc solo añade el **estado real del repo**.

---

## 1. Qué se implementó en Sprint 0 (cimentación)

Monorepo **Turborepo 2 + pnpm** en la raíz de `demo-taxigreen/` (convive con la documentación `00_…07_`).

```
package.json (raíz, scripts → turbo) · pnpm-workspace.yaml · turbo.json · tsconfig.base.json
eslint.config.mjs (flat) · .prettierrc.json · .editorconfig · .nvmrc (22) · .npmrc · .gitignore
.env.example (raíz) · README.md · CLAUDE.md (MAESTRO de build)

apps/web/        Next.js 15.4 (App Router + RSC) · React 19 · Tailwind 3.4 (tokens AZUL) · Button placeholder
                 · Auth.js v5 STUB (src/lib/auth.ts, sin providers) · Pino (logger) · Sentry dummy
                 · env tipado con Zod (src/lib/env.ts) · landing placeholder (/) · test smoke (vitest)
apps/driver/     Expo SDK 51 · Expo Router 3 · NativeWind 4 · React 18.2
                 · app.json (name "Taxi Green Conductor", slug taxigreen-driver, scheme taxigreendriver,
                   android.package pe.taxigreen.driver, permisos location/notifications/camera)
                 · 8 plugins instalados (placeholders): expo-router, expo-secure-store, expo-notifications,
                   expo-location, expo-task-manager, expo-camera, expo-local-authentication, @rnmapbox/maps
                 · env tipado con Zod · pantalla placeholder
packages/database/    Prisma 6 · schema.prisma VACÍO (a propósito) · cliente singleton · scripts db:*
packages/shared/      tokens AZUL (product/brand/care) · FLUJO_PROTAGONISTA · test de tokens (vitest)
packages/ia/          interfaz LLMProvider · AnthropicProvider (stub) · withFallback() funcional
                      · cargador de prompts (tipos) · prompts/*.v1.md (3, versionados con frontmatter)
packages/ingesta|asignacion|bienestar|voucher|comprobantes|auditoria/   placeholders con index.ts
packages/integraciones/{reniec,lap-atu}/                                placeholders con index.ts
infra/docker-compose.yml   Postgres 17 + PostGIS local (opcional) + init SQL (postgis, pgcrypto)
infra/supabase/migrations/ (vacío, se llena en S1)
.github/workflows/ci.yml          install → turbo typecheck/lint/test/build (IA_HABILITADA=false)
.github/workflows/deploy-web.yml   Railway (gated por RAILWAY_TOKEN; manual hasta tener credenciales)
tests/e2e/        Playwright (config + smoke dummy; corre con `pnpm e2e`, no entra al pipeline turbo)
```

**13 paquetes de workspace** (`@taxigreen/web`, `@taxigreen/driver`, `@taxigreen/{database,shared,ia,ingesta,
asignacion,bienestar,voucher,comprobantes,auditoria}`, `@taxigreen/integraciones-{reniec,lap-atu}`).

### Decisiones tomadas en Sprint 0
- 🎨 **Paleta AZUL CERRADA** (sistema dual): aplicada en `_FUENTE_DESARROLLO/04_DECISIONES_ABIERTAS §A1`, en
  `CLAUDE.md §0`, en los tokens de `packages/shared` y en los `tailwind.config` de web y driver. Chrome del
  producto = azul (`#0B0952`/`#227FDE`); verde Taxi Green = solo logo/chip de tenant; `care/*` púrpura = bienestar.
- El **CLAUDE.md "analista neutral"** se preservó en
  `_FUENTE_DESARROLLO/_historico_proceso/CLAUDE_analista_neutral.md` y la raíz pasó a ser el **CLAUDE.md MAESTRO de build**.
- **Enfoque IA = determinista primero, LLM apagado pero activable** (ver §3 bis).

---

## 2. Verificación (DoD de Sprint 0) — resultado real

| Criterio | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` resuelve los 13 workspaces | ✅ |
| `pnpm turbo run typecheck lint test build` (sin caché) | ✅ **52/52 tasks** verdes (~16 s) |
| `next build` (apps/web) compila y **prerenderiza 4/4 páginas** | ✅ sin error de hidratación |
| Smoke `next start` → `GET /` | ✅ **HTTP 200**, `<title>Taxi Green — Demo</title>`, contiene "Jorge Chávez" + CTA WhatsApp |
| Expo resuelve `app.json` + **8 plugins** (`expo config` exit 0) | ✅ name/slug/scheme/android.package correctos |
| Estructura de carpetas == `SPRINT.md §0.2` | ✅ |
| `.env.example` en raíz + apps/web + apps/driver | ✅ |

**Pendiente de credenciales del usuario** (no bloquea el DoD local; sí el deploy/DB en vivo):
- **Supabase:** crear proyecto + habilitar extensiones `postgis` + `pgcrypto`, pegar `DATABASE_URL`/`DIRECT_URL`
  y claves. Necesario para `db:migrate`/`db:seed` de Sprint 1.
- **Railway:** servicio `web` + `RAILWAY_TOKEN` en GitHub Secrets (workflow ya listo).
- **Anthropic / Mapbox / Resend / APIs.net.pe / Expo (EAS):** claves cuando las consuma cada sprint (S4+/S6+).

---

## 3. ⚠️ Decisiones de entorno NO OBVIAS (respétalas en Sprint 1+)

Descubiertas resolviendo fricción real de instalación/build. **No las revierta sin entender por qué.**

1. **`node-linker=isolated` (no hoisted).** El monorepo tiene **dos versiones de React**: web React 19 y driver
   React 18.2 (Expo SDK 51). Con `hoisted`, una react se hoistea al root y la otra queda nested → "dos copias de
   React" → `next build` reventaba con `Cannot read properties of null (reading 'useContext')` al prerenderizar.
   El linker aislado da a cada app su árbol correcto. (`.npmrc`.)
2. **`@types/react` por app + `paths` en `apps/web/tsconfig.json`.** Web usa `@types/react` 19.2.6 y driver 18.2.79.
   Con linker aislado, el `tsc` de web también cargaba el `@types/react@18` del driver desde el store de pnpm
   (confirmado por `traceResolution`), contaminando el namespace global `React`/`JSX` → `ReactNode` incompatible en
   el `forwardRef` del Button. **Solución (dos capas):** (a) pins exactos en `apps/web/package.json`
   (`@types/react 19.2.6`, `@types/react-dom 19.2.0`) + override `"@types/react-dom>@types/react": "19.2.6"` en el
   raíz; (b) **`paths`/`typeRoots`/`types` en `apps/web/tsconfig.json`** que fuerzan `react`/`react-dom` al `@types`
   local de web (mismo patrón que `apps/driver/tsconfig.json`). **No quitar esos `paths`.**
3. **PostCSS/Tailwind hoisteados** (`.npmrc`: `public-hoist-pattern[]=postcss|autoprefixer|tailwindcss`). Next
   resuelve los plugins de PostCSS **por string desde el cwd de `apps/web`**; con linker aislado no quedaban
   accesibles y `next build` fallaba con `Cannot find module 'autoprefixer'`. Hoistearlos lo resuelve.
4. **`peerDependencyRules.allowedVersions`** en el `package.json` raíz: `next-auth>next`, `next-auth>react`,
   `@rnmapbox/maps>react-native`. Sin esto, con linker aislado, pnpm marca peers "unmet" y next-auth no entra al lockfile.
5. **`@rnmapbox/maps` fijado a `10.1.33`** (no `^`). La 10.3.x exige `react-native>=0.79`; Expo SDK 51 trae 0.74.5.
6. **`onlyBuiltDependencies`** (bloque `pnpm`): `@prisma/client`, `@prisma/engines`, `esbuild`, `prisma`. pnpm 10
   bloquea build scripts por defecto; declararlos evita depender de aprobación interactiva en CI.
7. **`next.config.ts` ignora eslint/ts en build + `apps/web/tsconfig.json` excluye `.next`.** typecheck y lint son
   tareas turbo separadas que ya cubren todo el repo; así `next build` no repite esas fases y `tsc --noEmit` no
   depende de artefactos generados por el build. **No es para tapar errores.**
8. **Lint por paquete:** `eslint . --config <ruta>/eslint.config.mjs` (config flat única en la raíz).
9. **Button placeholder sin `@radix-ui/react-slot`.** Minimiza superficie de tipos en S0; el `Button` es un
   `<button>` con `forwardRef`, sin `asChild`/Slot. **Sprint 1 reintroduce radix/shadcn** con la UI real; al
   hacerlo, mantener los `paths` de web y vigilar que `@types/react` no se duplique (pins + override ya previstos).
10. **Instalación limpia tras tocar deps/overrides:** `rm -rf node_modules pnpm-lock.yaml && CI=true pnpm install`.
    Restos del store de instalaciones incrementales confunden la resolución de tipos.
11. **Entorno de la máquina:** Node 24 / pnpm 10 (la `.nvmrc` apunta a Node 22 LTS como objetivo; lockfile
    compatible). Para purgar node_modules sin TTY: `CI=true pnpm install`.

---

## 3 bis. Enfoque de IA (decisión confirmada con el cliente)

**Determinista primero; LLM construido pero APAGADO, activable con un interruptor** (sin reescribir negocio):
- `IA_HABILITADA` (env) lo lee `withFallback()` en `packages/ia/src/fallback.ts`. Si ≠ `'true'`, **no se llama al
  LLM** (cero costo); responde el algoritmo determinista (`fuente:'algoritmo', motivo:'flag_off'`).
- CI corre con `IA_HABILITADA=false`: el sistema debe funcionar 100% determinista.
- Activar el LLM (tras aprobación) = `IA_HABILITADA=true` + `ANTHROPIC_API_KEY` + implementar el cuerpo del
  `AnthropicProvider` (hoy stub). Nada del flujo determinista cambia. Detalle en `docs/DOCUMENTACION_TECNICA.md §2`.

---

## 4. Qué corresponde hacer en Sprint 1 (resumen accionable)

**Objetivo S1:** columna vertebral de datos + auth + tokens definitivos. Modelo recomendado: **Opus** (o **Codex
5.5 high** si se delega; prompt en [PROMPT_SPRINT_1_CODEX.md](PROMPT_SPRINT_1_CODEX.md)).

1. **Schema Prisma — 10 tablas** = `PLAN_SOFTWARE §7.6` **+ deltas de `LOGICA_NEGOCIO_OPERATIVA §8`**.
   - 10 tablas EXACTAS: `tenants, usuarios, conductores, vehiculos, reservas, viajes, posiciones_conductor,
     comprobantes, incidencias, auditoria`. **No** crear `personas_fisicas/empresas_clientes/hoteles_aliados/
     ingesta_eventos/consultas_reniec/notificaciones/calificaciones/liquidaciones/asignaciones_unidad` (= MVP).
   - **Deltas §8 obligatorios** (no añaden tablas): `conductores += foto_url, total_viajes`;
     `vehiculos += marca, tipo(TipoVehiculo), foto_url, color, anio`;
     `reservas += calificacion(Json?), tipo_viaje(TipoViaje), solicitante_tipo/nombre/contacto`;
     enums `TipoVehiculo {sedan camioneta van minivan}`, `TipoViaje {recojo_aeropuerto traslado_aeropuerto city}`.
   - `tenant_id` simbólico en todas salvo `tenants` y `auditoria`(nullable). **Sin RLS.** Soft delete en
     `usuarios/reservas/viajes/incidencias`. `posiciones_conductor.geom Unsupported("geography(Point,4326)")?`.
   - Añadir `usuarios.fcm_token String?` (lo usa la app conductor en S6; sembrarlo ya evita migración extra).
2. **Migración inicial** aplicada en Supabase + **seed idempotente** con la **semilla protagonista** exacta
   (`tipo_viaje=recojo_aeropuerto`, origen "Aeropuerto Jorge Chávez - Llegadas", punto "Salida 3, columna F2",
   destino "Av. Pardo 123, Miraflores", vuelo "LA2456", solicitante hotel/concierge). 6 conductores, 8 vehículos,
   1 admin, 1 supervisor, 1 incidencia `objeto_olvidado` cerrada con timeline de 3 acciones.
3. **Auth.js v5 real** (sobre el stub en `apps/web/src/lib/auth.ts`): `credentials-admin` (email+password bcrypt)
   y `credentials-driver` (email+PIN) + middleware de route guards por rol + páginas `login-admin`/`login-counter`.
4. **`packages/auditoria`**: `recordAudit(...)` real escribiendo en tabla `auditoria` (con `fuente_decision`).
5. **Tokens de diseño definitivos (AZUL)** en `packages/shared/src/tokens` (escalas + tipografía + spacing)
   consumidos por `apps/web/tailwind.config.ts`. La decisión ya está cerrada (azul): no reabrir.
6. Tests unitarios de los helpers de auth. Mantener CI verde. Al reintroducir radix/shadcn, respetar gotcha 2 y 9.

**Criterio de cierre S1:** `db:migrate` y `db:seed` OK (no duplica al repetir), login admin/counter funciona,
`auditoria` registra logins, Prisma Studio muestra las 10 tablas con la reserva protagonista, y
`pnpm turbo run typecheck lint test build` sigue verde.

---

## 5. Cómo continuar después de Sprint 1 (S2 → S9)

Cada sprint se ejecuta con el **mismo patrón** (plantilla en `PROMPT_SPRINT_1_CODEX.md §"Patrón para los siguientes
sprints"`): tomar `SPRINT.md §S{n}` + enriquecerlo con (a) el estado real del repo, (b) las decisiones de entorno
§3, (c) la paleta azul, (d) el contrato de flujo protagonista, (e) "determinista primero, LLM por encima con
`withFallback`". **Regla de oro:** no se abre un sprint sin cerrar el anterior con CI verde + smoke test; al
terminar cada sprint se actualiza este documento (o se crea `ESTADO_SPRINT_{n}.md`) + el prompt del siguiente.

Orden: S2 voucher/QR/comprobante/auditoría visible · S3 `/admin` + Realtime + asignación manual · S4 IA mínima +
ingesta + `/wa-sim` · S5 heurística + racionalización LLM · S6 app conductor (auth/push/asignación) · S7 app
conductor (mapa/estados/ubicación) · S8 `/p/[token]` + tracking + comprobante + objeto olvidado · S9 `/counter` +
landing + datos del guion + reset + deploy + video respaldo.

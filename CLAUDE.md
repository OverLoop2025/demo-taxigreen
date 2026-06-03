# CLAUDE.md MAESTRO — Software Demo Taxi Green

> **Fase actual: CONSTRUCCIÓN (build).** La fase de análisis neutral terminó y produjo
> `07_PLAN_EJECUCION/`. El antiguo CLAUDE.md de "analista neutral" se preservó en
> [_FUENTE_DESARROLLO/_historico_proceso/CLAUDE_analista_neutral.md](_FUENTE_DESARROLLO/_historico_proceso/CLAUDE_analista_neutral.md).
> Este archivo es la **fuente de verdad operativa para escribir código**.

Este repo (`demo-taxigreen/`) es a la vez **documentación** (carpetas `00_…07_` + `_FUENTE_DESARROLLO/`)
y **monorepo de software** (`apps/`, `packages/`, `infra/`). El código y los documentos conviven;
las rutas relativas de los prompts (`07_PLAN_EJECUCION/…`, `_FUENTE_DESARROLLO/…`) resuelven desde aquí.

---

## 0. Lo que NO se reabre (decisiones cerradas)

- **Flujo protagonista = Recojo en aeropuerto.** `Aeropuerto Jorge Chávez (Llegadas) → Av. Pardo 123, Miraflores`.
  Hotel/concierge = **solicitante por WhatsApp, NO origen físico**. Pasajero final = quien viaja, físicamente
  en el aeropuerto al recoger. Punto de encuentro = **Salida 3, columna F2**. Vuelo ejemplo = **LA2456**.
  El conductor va al **aeropuerto, nunca al hotel**. NO invertir el flujo. (Ver `GLOSARIO_FLUJOS_TAXIGREEN.md`,
  `CONTRATO_FLUJO_PROTAGONISTA.md`.)
- **Demo ≠ MVP.** La demo cuenta UN flujo A→Z en ~12 min con 3 wows. El MVP construye el producto. (`PLAN_SOFTWARE §0`.)
- **App conductor = nativa React Native + Expo SDK 51** (Capacitor descartado).
- **Pasajero = link `/p/[token]`, sin app nativa.** Bienestar/objeto olvidado vive **dentro** de `/p/[token]`.
- **Backend = Next.js** (Route Handlers + Server Actions), **NO NestJS**. **Monolito modular** en Turborepo, **no microservicios**.
- **DB = PostgreSQL 17 + Prisma 6** (no Mongo). **Real-time = Supabase Realtime** en demo.
- **10 tablas en demo** (no 17). Esquema = `PLAN_SOFTWARE §7.6` **+ deltas de `LOGICA_NEGOCIO_OPERATIVA §8`**.
- **🎨 Identidad visual = paleta AZUL (sistema dual).** ✅ CERRADA (2026-05-29). Chrome del producto en **azul**
  (`#0B0952` / `#227FDE`), verde Taxi Green **solo** en logo y chip de tenant, `care/*` púrpura en bienestar.
  **No "verde total".** Tokens definitivos en Sprint 1; ver `04_DECISIONES_ABIERTAS §A1`.

---

## 1. Stack cerrado

```
Monorepo:   Turborepo 2 + pnpm (workspaces) · TypeScript 5.6 strict + noUncheckedIndexedAccess · Node 22 LTS (.nvmrc)
apps/web:   Next.js 15.4 (App Router + RSC) · Tailwind 3.4 + shadcn/ui · Zustand 5 + TanStack Query 5
            · React Hook Form 7 + Zod 3 · Auth.js v5 · Supabase Realtime client · Vercel AI SDK 4 · Pino + Sentry
apps/driver:React Native 0.74 + Expo SDK 51 · Expo Router 3 · NativeWind 4 · Zustand + TanStack Query
            · supabase-js · expo-location (foreground demo) · expo-notifications (FCM) · expo-secure-store
            · expo-camera/expo-task-manager/expo-local-authentication (preparados) · @rnmapbox/maps
            · Distribución: Expo Go dev client (demo) → EAS Build (MVP)
packages/*: Prisma 6 · PostgreSQL 17 + PostGIS 3.5 (Supabase) · Anthropic SDK vía interfaz LLMProvider
            · Modelos demo: claude-sonnet-4-6 (extracción) + claude-haiku-4-5-20251001 (racionalización)
            · Puppeteer (PDF) · qrcode + HMAC SHA-256 · Resend · Supabase Storage
Stubs demo: WABA · Pagos · SUNAT · LAP/ATU (interfaz + endpoint 501)
Tests:      Vitest 2 + Playwright 1.48 + MSW 2 · Hosting demo: Railway (web) + Supabase + Expo Go
```

> **Nota de entorno (2026-05-29):** la máquina corre Node 24 / pnpm 10. `.nvmrc` apunta a Node 22 (objetivo
> documentado); se usa el pnpm disponible (lockfile compatible). Si surge fricción de versión, preferir Node 22 LTS.

**Patrón inviolable de IA:** toda capacidad inteligente tiene **dos implementaciones** — determinista (siempre activa)
+ LLM (opcional) — unidas por `withFallback()`. Si `IA_HABILITADA=false`, el sistema opera 100% determinista.
La demo debe correr con el LLM desconectado (badge 🤖 IA / ⚙️ Algoritmo). Ningún string de prompt vive en código:
van en `packages/ia/prompts/*.md` con frontmatter de versión. Referencia: `PLAN_SOFTWARE §7.5`.

---

## 2. Estructura del monorepo (objetivo, `SPRINT.md §0.2`)

```
apps/
  web/      Next.js 15.4 — todas las superficies web + backend
  driver/   React Native + Expo SDK 51 — app nativa conductor
packages/
  database/ Prisma + schema (10 tablas demo) + cliente singleton
  shared/   tipos, design tokens (azul), helpers
  ingesta/ asignacion/ bienestar/   DETERMINISTAS (parser, scoring, clasificación)
  ia/       interfaz LLMProvider + 1 adapter (anthropic) + withFallback + prompts/
  voucher/ comprobantes/ auditoria/
  integraciones/{reniec, lap-atu}
infra/      docker-compose (Postgres 17 + PostGIS) + supabase/migrations
tests/e2e/  Playwright
.github/workflows/  ci.yml + deploy-web.yml
```

`apps/web` y `apps/driver` comparten **solo** `packages/*`. Nunca imports cruzados directos entre apps.

---

## 3. Modelo de datos demo (REGLA CRÍTICA)

Esquema demo = **`PLAN_SOFTWARE §7.6` (10 tablas)** **+ deltas de `LOGICA_NEGOCIO_OPERATIVA §8`**.
Si construyes solo el §7.6 base, faltarán los campos que alimentan DriverCard/VehicleCard/RatingTripleCard.

**10 tablas (no más):** `tenants`, `usuarios`, `conductores`, `vehiculos`, `reservas`, `viajes`,
`posiciones_conductor`, `comprobantes`, `incidencias`, `auditoria`. `tenant_id` simbólico en todas
(salvo `tenants` y `auditoria` nullable). **Sin RLS activo** en demo.

**NO crear en demo** (Semilla MVP): `personas_fisicas`, `empresas_clientes`, `empresa_centros_costo`,
`hoteles_aliados`, `ingesta_eventos`, `consultas_reniec`, `notificaciones`, `integraciones_externas_log`,
`calificaciones`, `liquidaciones`, `asignaciones_unidad`.

**Semilla protagonista obligatoria:** `tipo_viaje=recojo_aeropuerto`, `solicitante_tipo=hotel`,
`origen_texto="Aeropuerto Jorge Chávez - Llegadas"`, `punto_encuentro="Salida 3, columna F2"`,
`destino_texto="Av. Pardo 123, Miraflores"`, `vuelo_codigo="LA2456"`. `hotel_nombre`/solicitante **nunca**
reemplazan `origen_texto`.

---

## 4. Reglas de negocio obligatorias (resumen — detalle en `01_FUENTE_DE_VERDAD §7`)

1. **Asignación separada conductor / unidad** (N:N en el tiempo); se eligen por separado en `/admin` y counter.
2. **Cola de conductores, no cercanía pura.** `score = w1·tiempo_en_cola + w2·(1/distancia) + w3·match_tipo + w4·capacidad − w5·penalización`.
3. **Humano en control.** El copiloto **sugiere**, el operador **confirma**. Toda acción → `recordAudit` con `fuente_decision`.
4. **Doble confirmación cruzada** para cerrar (pasajero "llegué" + conductor "atendí") → `por_liquidar`.
5. **Pago al conductor = "harina de otro costal":** el cierre prepara la liquidación, no la ejecuta. `DriverHistorySummary` = mockup en demo.
6. **Voucher/QR de un solo uso**, firmado HMAC, validación server-side, bloqueo idempotente.
7. **GPS, ETA y mapa reales** (exigencia de Raúl). Pago/SUNAT/SMS simulados.
8. **Calificación triple** (servicio, conductor, unidad); si un eje ≤3, pedir motivo. `jsonb` en demo.

---

## 5. PROHIBIDO en demo

App pasajero nativa · OAuth/login social pasajero · portal `/empresa` con reportes · OCR on-device · biometría
conductor · background location con foreground service · RLS multi-tenant activo · cadena de fallbacks RENIEC
· 9 tipologías extra de bienestar · marketplace/subasta/contraoferta · tarifa dinámica · flight tracking ·
liquidación real (solo mockup) · SaaS multi-operador · iOS (solo Android demo). Lista canónica: `PLAN_SOFTWARE §2.3` y `§6`.

---

## 6. Plan de ejecución (10 sprints) y reglas de oro

`SPRINT.md` define S0–S9. Modelo: **Opus** en S0/S1/S4/S6; Sonnet/Codex el resto.

| S | Foco |
|---|---|
| S0 | Cimentación monorepo + apps stub + Supabase + CI |
| S1 | Schema 10 tablas (+ deltas §8) + seed protagonista + Auth.js v5 + **tokens azul** |
| S2 | Voucher QR HMAC + Comprobante PDF + Auditoría |
| S3 | `/admin` + Supabase Realtime + asignación manual (conductor/unidad separados) |
| S4 | Capa IA mínima + ingesta determinista + simulador `/wa-sim` |
| S5 | Heurística de asignación + racionalización LLM con fallback |
| S6 | App conductor RN+Expo: scaffolding + auth PIN + push + recibir asignación |
| S7 | App conductor: mapa + estados viaje + ubicación foreground |
| S8 | `/p/[token]` + tracking + comprobante + 1 incidencia (objeto olvidado) |
| S9 | `/counter` QR + landing + datos del guion + reset + deploy + video respaldo |

**Reglas de oro (no negociables, `SPRINT.md §0`):**
1. La demo cuenta UN flujo protagonista; si una tarea no contribuye al flujo A→Z, se aplaza a MVP.
2. **Nada se mergea sin `pnpm turbo run typecheck lint test` verde.** El sprint no cierra si CI falla.
3. Nada se construye sin criterio de aceptación escrito antes.
4. El humano confirma las acciones del LLM (la demo muestra "sugerencia", no "automático").
5. Cada feature lleva seed mínimo y test E2E mínimo.
6. Lo que se construye en demo debe ser reusable en MVP (sin código desechable). `[Semilla MVP]` = persiste.
7. Ningún string de prompt en código (van en `packages/ia/prompts/*.md`).
8. Toda capacidad LLM tiene su par determinista; la determinista se construye primero.
9. `tenant_id` simbólico desde día 1, sin RLS activo en demo.
10. **Al terminar un sprint, detente y reporta CI verde + smoke test antes de empezar el siguiente.**

**Commits:** `feat(app/web): …`, `feat(app/driver): …`, `feat(pkg/<nombre>): …`, `chore(infra): …`,
`test(e2e): …`, `docs: …`. Un commit nunca cruza dos scopes. (Commits/push solo cuando el usuario lo pida.)

---

## 7. Precedencia documental (cuál gana)

```
1. 00_EVIDENCIA_REAL/            (transcripciones, frases de Raúl)  ← la evidencia manda
2. _FUENTE_DESARROLLO/           (glosario + contrato + fuente de verdad + este CLAUDE)
3. 06_DEMO_TECNICA/FLUJO_NEGOCIO_CANONICO.md
4. 07_PLAN_EJECUCION/            (PLAN_SOFTWARE v4.0, SPRINT v3.0, LOGICA v1.0)
5. 06_DEMO_TECNICA/ (ESPECIFICACION, CONTRATO_NARRATIVO, MAPA, plugin Figma)
   ── por debajo = HISTÓRICO/REFERENCIA: 02_/04_/05_, 01_INVESTIGACIONES_IA/, 03_REFERENCIAS_EXTERNAS/
```
Lecturas de arranque para cualquier agente: `_FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md` →
`GLOSARIO_FLUJOS_TAXIGREEN.md` → `CONTRATO_FLUJO_PROTAGONISTA.md` → `04_DECISIONES_ABIERTAS.md` →
`07_PLAN_EJECUCION/{PLAN_SOFTWARE,SPRINT}.md`. **No modificar el plugin Figma**
(`06_DEMO_TECNICA/figma-plugin-taxigreen-master/`).

---

## 8. Cómo trabajar aquí

- Idioma: **español** (con acentos correctos) en explicaciones, comentarios y microcopy.
- TypeScript `strict` + `noUncheckedIndexedAccess`; cero `any` implícito (si hace falta, `eslint-disable` con motivo).
- Ante ambigüedad menor: decide y marca `// DECISIÓN: …` o `// TODO confirmar`; no frenes el sprint.
- Trabaja autónomamente; no entregues "instrucciones para que el usuario configure" servicios que puedas
  codear. Servicios externos que requieren **credenciales del usuario** (Supabase, Railway, Expo, claves API)
  se cablean en código y `.env.example`, y se señalan como pendientes de credenciales.
- No avances de sprint sin cerrar el anterior con CI verde + smoke test.

---

## 9. Estado y handoff por sprint (`docs/`)

El **estado real del código** y el **handoff entre sprints** viven en [`docs/`](docs/) (carpeta estable, fuera de
`_FUENTE_DESARROLLO/`):
- [`docs/DOCUMENTACION_TECNICA.md`](docs/DOCUMENTACION_TECNICA.md) — inventario 100% del avance + enfoque IA + gotchas de entorno.
- [`docs/ESTADO_SPRINT_0_Y_HANDOFF.md`](docs/ESTADO_SPRINT_0_Y_HANDOFF.md) — qué se hizo en S0, decisiones de entorno, qué sigue en S1.
- [`docs/PROMPT_SPRINT_1_CODEX.md`](docs/PROMPT_SPRINT_1_CODEX.md) — prompt copy-paste para Codex 5.5 (high) + patrón para S2–S9.
- [`docs/ESTADO_SPRINT_1.md`](docs/ESTADO_SPRINT_1.md) — qué se implementó en S1, verificación y pendiente real de DB por entorno.
- [`docs/PROMPT_SPRINT_2_CODEX.md`](docs/PROMPT_SPRINT_2_CODEX.md) — prompt copy-paste para ejecutar solo Sprint 2.
- [`docs/ESTADO_SPRINT_2.md`](docs/ESTADO_SPRINT_2.md) — qué se implementó en S2, smoke y pendientes condicionados por entorno.
- [`docs/PROMPT_SPRINT_3_CODEX.md`](docs/PROMPT_SPRINT_3_CODEX.md) — prompt copy-paste para ejecutar solo Sprint 3.
- [`docs/ESTADO_SPRINT_3.md`](docs/ESTADO_SPRINT_3.md) — qué se implementó en S3, smoke Realtime/Storage y handoff.
- [`docs/PROMPT_SPRINT_4_CODEX.md`](docs/PROMPT_SPRINT_4_CODEX.md) — prompt copy-paste para ejecutar solo Sprint 4.
- [`docs/ESTADO_SPRINT_4.md`](docs/ESTADO_SPRINT_4.md) — qué se implementó en S4, smoke `/wa-sim` e ingesta.
- [`docs/PROMPT_SPRINT_5_CODEX.md`](docs/PROMPT_SPRINT_5_CODEX.md) — prompt copy-paste para ejecutar solo Sprint 5.
- [`docs/ESTADO_SPRINT_5.md`](docs/ESTADO_SPRINT_5.md) — qué se implementó en S5, smoke de sugerencia y auditoría.
- [`docs/PROMPT_SPRINT_6_CODEX.md`](docs/PROMPT_SPRINT_6_CODEX.md) — prompt copy-paste para ejecutar solo Sprint 6.
- [`docs/ESTADO_SPRINT_6.md`](docs/ESTADO_SPRINT_6.md) — qué se implementó en S6, smoke endpoints mobile y pendientes Android/push.
- [`docs/PROMPT_SPRINT_7_CODEX.md`](docs/PROMPT_SPRINT_7_CODEX.md) — prompt copy-paste para ejecutar solo Sprint 7.
- [`docs/ESTADO_SPRINT_7.md`](docs/ESTADO_SPRINT_7.md) — qué se implementó en S7, smoke endpoints de estados, bundle móvil y pendientes Android físico/Mapbox.
- [`docs/PROMPT_SPRINT_8_CODEX.md`](docs/PROMPT_SPRINT_8_CODEX.md) — prompt copy-paste para ejecutar solo Sprint 8.
- [`docs/ESTADO_SPRINT_8.md`](docs/ESTADO_SPRINT_8.md) — qué se implementó en S8, link pasajero, bienestar, smoke y pendientes Android físico.
- [`docs/PROMPT_SPRINT_9_CODEX.md`](docs/PROMPT_SPRINT_9_CODEX.md) — prompt copy-paste para ejecutar solo Sprint 9.
- [`docs/GUIA_PRUEBAS_DEMO.md`](docs/GUIA_PRUEBAS_DEMO.md) — guía no técnica para levantar y probar la demo S0-S8.
- [`docs/DEUDA_TECNICA.md`](docs/DEUDA_TECNICA.md) — registro de deuda: intencional de demo (sin RLS, rate-limit in-memory, QR no one-time, RENIEC demo) vs programada (Railway/PDF-en-Railway = S9) vs riesgos a vigilar.

**Estado:** Sprint 8 **cerrado** (2026-06-03) — S1/S2/S3/S4/S5/S6/S7/S8 verificados contra Supabase/local donde aplica.
S8 agrega `/p/[token]` público con tracking por `reserva-{id}`, polling fallback, Mapbox GL JS opcional, comprobante,
PDF tokenizado, calificación triple, incidencia de objeto olvidado, `/bienestar/[caso]`, `/admin/bienestar`, clasificador
determinista en `packages/bienestar` y respuesta mínima del conductor por Realtime/push `conductor-{id}`. Mantener la
regla: app pasajero nativa/OAuth pasajero siguen prohibidos en demo. Pendiente ambiental: Android físico/dev client para
push real de incidencia y navegación desde notificación; Mapbox Directions real queda fuera del alcance demo. Verificación:
`pnpm turbo run typecheck lint test build` 52/52, `pnpm e2e` 6/6, `expo export --platform android` EXIT 0 y smoke S8
contra Supabase cerrado. Siguiente sprint: `docs/PROMPT_SPRINT_9_CODEX.md`.
Al cerrar cada sprint: actualizar `docs/ESTADO_SPRINT_{n}.md`, registrar deuda en `docs/DEUDA_TECNICA.md` y dejar el
prompt del siguiente.

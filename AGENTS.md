# Workspace Runtime Notes

- Use WSL as the only runtime for workspace paths under `/home/jose/dev`.
- Repository root for this project: `/home/jose/dev/demo-taxigreen`.
- Primary build authority: `CLAUDE.md`.
- Current implementation status: Sprint 8 implemented. Read `docs/ESTADO_SPRINT_8.md` before starting more work.
- Next sprint prompt: `docs/PROMPT_SPRINT_9_CODEX.md`.
- If `context7` is relevant or explicitly requested, use the MCP tool directly if exposed.
- Do not probe `context7` with MCP resources/templates list methods; this server is tools-only.
- If `context7` is configured in WSL but not surfaced as a tool, fallback:
  - Start `/home/jose/.local/bin/context7-mcp --transport http --port 3131`
  - Speak MCP over `http://localhost:3131/mcp`
- If the user asks to avoid web browsing, do not replace `context7` with web search.

## Sprint 8 Handoff

- S1 DB smoke is closed against Supabase: migration, seed x2, login helpers, audit and protagonist reservation verified.
- S2 added voucher QR HMAC, comprobante PDF visual, RENIEC lookup and `/admin/auditoria`.
- S3 added `/admin` operativo, Supabase clients, Realtime/polling list, reservation detail, manual conductor/unit assignment, metrics and E2E.
- Supabase Storage signed URLs are now validated: private bucket `comprobantes`, Puppeteer renderer and signed URL header work.
- Supabase Realtime for `reservas` is validated. Required DB setup: `public.reservas` in publication `supabase_realtime`, `REPLICA IDENTITY FULL`, and `GRANT SELECT` to `anon`, `authenticated`, `service_role`.
- S4 added deterministic WhatsApp ingestion in `packages/ingesta`, real `AnthropicProvider` + `withFallback` in `packages/ia`, `POST /api/ingesta/extraer`, and `/wa-sim` with audited reservation creation.
- S5 added deterministic assignment scoring in `packages/asignacion`, LLM-only rationale in `packages/ia`, `POST /api/asignacion/sugerir`, and the `/admin/reservas/[id]` suggestion card.
- Accepting a suggestion assigns conductor+unit, reuses the S3 broadcast, and audits `fuente_decision`; manual override audits `reserva_sugerencia_override`.
- S5 post-audit fixed `colaScore` saturation: queue priority now normalizes by max queue wait, with regression test.
- S6 added Expo driver app auth: email+PIN login, JWT Bearer in `expo-secure-store`, Home/Profile, push registration and Realtime subscription.
- S6 web added `POST /api/conductor/login`, `POST /api/conductor/fcm-token`, `apps/web/src/lib/conductor-token.ts`, `apps/web/src/lib/push.ts`, and dual assignment broadcast `reserva-{id}` + `conductor-{conductorId}`.
- S7 added `GET /api/conductor/asignacion/[id]`, `POST /api/conductor/asignacion/[id]/estado`, `apps/web/src/lib/conductor-asignacion*.ts`, audited sequential state transitions and broadcast `estado` in `reserva-{id}`.
- S7 driver replaced the assignment placeholder with the active trip screen: passenger/flight/voucher header, point "Salida 3, columna F2", Mapbox native when available, textual fallback when not, one large sequential action, foreground location broadcast `posicion`, keep-awake and conservative retry.
- S7 verification: `pnpm turbo run typecheck lint test build` 52/52 green, `pnpm e2e` 5/5 green, `expo export --platform android` EXIT 0 (1350 modules), `next start` + Supabase smoke login 200, GET assignment 200, no-Bearer 401, invalid jump 409, full sequence to `por_liquidar` 200, conductor2 404/404; DB cleaned to seed baseline.
- S8 added public passenger tracking `/p/[token]` backed by `apps/web/src/lib/pasajero.ts`, Supabase Realtime `reserva-{id}` (`estado`, `posicion`, `incidencia`) and polling fallback.
- S8 added passenger comprobante/calificación endpoints: `GET /api/pasajero/[token]`, `POST /comprobante`, `GET /comprobante/pdf`, `POST /calificacion`.
- S8 added object-lost flow in `packages/bienestar`, `POST /api/incidencias`, `GET /api/incidencias/[id]`, `POST /responder`, `POST /cerrar`, `/bienestar/[caso]` and `/admin/bienestar`.
- S8 driver added Realtime/push incident handling, Home incident card and hidden `/(auth)/incidencia/[id]` response screen.
- S8 verification: `pnpm turbo run typecheck lint test build` 52/52 green, `pnpm e2e` 6/6 green, `expo export --platform android` EXIT 0 (1352 modules), `next start` + Supabase smoke `/p/tg_demo_passenger_001` 200, passenger API 200, incident `abierta -> en_resolucion -> cerrada` with 3 audit rows; smoke data cleaned.
- DB baseline after S8: reservas=1, incidencias=1 seed, auditoria=1 seed_sprint_1, fcmTokens=0, protagonist `TG-2026-0001` assigned to Raúl Quispe with S7 trip timestamps null.
- Push/location/map real still need Android physical + dev client/EAS + `EXPO_PUBLIC_EXPO_PROJECT_ID`/Mapbox tokens; without them S8 degrades visibly and login/Realtime/state/incident endpoints still work.
- Before S9, read `docs/PROMPT_SPRINT_9_CODEX.md`; S9 owns `/counter`, final QR consumption, landing/demo reset, Railway deploy and video fallback. `ANTHROPIC_API_KEY` remains optional; deterministic first.

<claude-mem-context>
# Memory Context

# [demo-taxigreen] recent context, 2026-05-28 3:08pm GMT-5

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (23,197t read) | 821,771t work | 97% savings

### May 19, 2026
S11 Taxi Green Demo — Master Commercial Proposal + Full Software Implementation Plan (PROPUESTA_DEMO.md + PLAN_DE_SOFTWARE.md) (May 19, 5:26 AM)
S10 Taxi Green Commercial Demo — Master Proposal Document Creation (PROPUESTA_DEMO.md) (May 19, 5:26 AM)
S12 update-config skill invoked — Claude asked user to clarify which plugin to enable (May 19, 11:49 AM)
### May 20, 2026
S13 Complete visual restructuring of Taxi Green Notion page — replacing dense text with Mermaid diagrams, tables, and visual callouts for the Copiloto Operativo vision (May 20, 2:14 PM)
### May 23, 2026
S14 Build a complete navigable Figma prototype for TaxiGreen "Copiloto Operativo Multicanal" — aligned to vision documents, company green branding, logo, and live website — and deliver a Figma link (May 23, 12:06 AM)
S15 Build complete navigable Figma prototype for TaxiGreen (Peruvian airport taxi service) with green brand colors, matching taxigreen.com.pe, aligned to vision_final_perfecta.md and vision_final_taxigreen_refinada.md, incorporating logo.jpg — deliver shareable Figma link (May 23, 3:34 PM)
### May 24, 2026
S16 Build a complete navigable Figma prototype for TaxiGreen (Peruvian airport taxi service) with brand colors, logo, and shareable link (May 24, 6:11 PM)
### May 25, 2026
S17 TaxiGreen demo software plan revision: PWA vs native app for drivers, OAuth/RENIEC authentication for independent passengers, and full rewrite of PLAN_SOFTWARE.md and SPRINT.md in 07_PLAN_EJECUCION/ (May 25, 3:58 PM)
318 6:50p 🟣 Cableado de navegación estructural — bottom nav, back button, top nav tabs y side nav items
319 6:51p 🟣 Desktop shell top nav tabs y side nav items ahora generan reacciones ON_CLICK
320 " 🔴 Variante `success` añadida a `renderSection()` — secciones de confirmación ahora se renderizan en verde
321 6:52p 🔴 `wirePrototype()` reescrita — fix del breaking change `action`→`actions[]`, soporte BACK/CLOSE y diagnósticos
322 " 🟣 Notificación final del plugin ahora muestra conteo de reacciones cableadas
323 " 🟣 Pantalla `1.C-otro` añadida — flujo de reserva bifurcado para origen/destino libre
324 6:53p 🟣 4 pantallas de Counter añadidas (4.A–4.D) — resuelve targets faltantes en navegación de top/side nav
325 6:54p 🟣 3 pantallas de Empresa añadidas (5.A–5.C) — resuelve `company.5B` faltante en navegación desktop
326 " 🔴 Correcciones de flujo en WhatsApp 12.A, Bienestar 13.D y 13.G — etiquetas y targets ajustados
### May 26, 2026
327 9:21p ⚖️ PWA vs Native App Decision for TaxiGreen Driver Side
328 " ⚖️ OAuth-Based Authentication for Independent Passenger Users Without Airport API Dependency
329 " ✅ PLAN_SOFTWARE.md and SPRINT.md Rewritten with Senior-Level Technical Precision
330 9:22p 🔵 SPRINT.md File Size Confirmed at 524 Lines
331 " 🔵 Previous PLAN_DE_SOFTWARE.md is 1703 Lines with PostgreSQL+PostGIS Over MongoDB Decision
332 9:34p ⚖️ TaxiGreen MVP Architecture Reformulation: Canal-First, PWA-Minimal Strategy
333 9:46p ⚖️ PWA vs Native App Decision for TaxiGreen Driver Interface
334 " ⚖️ OAuth2 Authentication Strategy for Independent (Non-Corporate) Users
335 " ✅ PLAN_SOFTWARE.md and SPRINT.md Updated with Revised Architecture
336 " ✅ PLAN_SOFTWARE.md Upgraded to v3.0 — Full Turborepo Monorepo Architecture
337 9:55p ⚖️ PWA vs Native App Decision for TaxiGreen Driver Side
338 " ⚖️ OAuth2 Authentication for Independent (Non-Corporate) Users Booking Airport Taxis
339 " ✅ PLAN_SOFTWARE.md and SPRINT.md Updated with Architecture Revisions
340 " ✅ SPRINT.md v2.0 Fully Written — 15-Sprint Plan with Monorepo Architecture
341 " ✅ PLAN_SOFTWARE.md Section Count Updated: 7 Quiebres → 8 Quiebres
342 9:56p ⚖️ Quiebre 8 Added: AI/LLM as Optional Layer with Deterministic Fallback (Strategy Pattern)
### May 27, 2026
343 5:32p ⚖️ Critical Architectural Review of PLAN_SOFTWARE.md for Transport Booking SaaS
344 7:50p ⚖️ PWA vs Native App Decision for TaxiGreen Driver Interface
345 " ⚖️ OAuth-Based Identity Resolution for Independent Airport Passengers
346 " ✅ PLAN_SOFTWARE.md and SPRINT.md Updated with Revised Architecture Decisions
347 7:51p ✅ PLAN_SOFTWARE.md Upgraded to v4.0 — Critical Architectural Audit and Redirection
348 7:57p ⚖️ PWA vs Native App Decision for TaxiGreen Driver Interface
349 " ⚖️ OAuth Authentication Strategy for Independent Passenger Users (No Airport API)
350 " ✅ PLAN_SOFTWARE.md and SPRINT.md Updated with Revised Architecture Decisions
S18 TaxiGreen demo plan critical rewrite: SPRINT.md v3.0 + PLAN_SOFTWARE.md v4.0 — driver app PWA vs native analysis, OAuth for independent passenger auth, complete sprint plan overhaul from 15 to 10 sprints with React Native + Expo replacing Capacitor (May 27, 7:58 PM)
351 8:28p ⚖️ Taxi Green Figma Plugin Commercial Demo — Scope & Art Direction Defined
352 8:29p 🔵 npx skills find Produces No Output for Figma/Design Queries
353 " 🔵 exec_command Requires tty=true for Interactive CLI Tools
354 8:30p 🔵 npx skills find Process Still Running After Failed pkill; Full Dev Environment Mapped
355 " 🔵 skills CLI Hangs Even With CI=1 and timeout Flags
356 " 🔵 npx skills find Confirmed Non-Functional Non-Interactively — Exit Code 124 (timeout)
357 " 🔵 skills CLI --help Works Non-Interactively; find is the Only Interactive Command
358 8:31p 🔵 skills find With tty=true Shows Spinner But Still Searching — Network-Dependent Registry Lookup
359 " 🔵 Ctrl+C Interrupt Works With tty=true; skills list --json Attempted for Non-Interactive Skill Inventory
360 " 🔵 Installed Skills Inventory: Only find-skills Present; No Design/Figma Skills Installed
361 " 🔵 Actual Project File Structure Mapped for 06_DEMO_TECNICA and 07_PLAN_EJECUCION
362 8:32p 🔵 Figma Plugin Complete Structure Mapped: 14 Pages, 52 Screens, 3 Prototype Flows, Brand Tokens
363 " 🔵 code.js Full Architecture Audited: Data-Driven Screen Generator with Complete Color System and Prototype Wiring
364 " 🔵 logo.jpg Confirmed: 1200×768 JPEG, 26KB — Base64 Embed Feasible but Borderline on Size
365 " 🔵 PLAN_SOFTWARE.md v4.0 Key Constraints for Figma Demo Scope
366 8:33p 🔵 Prototype Wiring Audit: 0 Broken Links, 12 Orphaned Screens With No Inbound Navigation
367 " 🟣 AUDITORIA_FIGMA_WOW.md Created — Task 1 Complete

Access 822k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>

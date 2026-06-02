# Prompt Sprint 1 — para Codex 5.5 (high) · Demo Taxi Green

**Uso:** copia y pega el bloque de abajo en Codex 5.5 (high) para ejecutar **solo Sprint 1**. Refleja
`07_PLAN_EJECUCION/SPRINT.md §Sprint 1 (§S1.2/§S1.4)` + los deltas de `LOGICA_NEGOCIO_OPERATIVA §8`, e incorpora
el **estado real del repo tras Sprint 0** ([ESTADO_SPRINT_0_Y_HANDOFF.md](ESTADO_SPRINT_0_Y_HANDOFF.md)) y la
**decisión de paleta AZUL** (cerrada). Al final hay un **patrón** para generar los prompts de S2–S9.

> Prerrequisito de credenciales: para `db:migrate`/`db:seed` reales hace falta Supabase del usuario
> (`DATABASE_URL`/`DIRECT_URL` + extensiones `postgis`,`pgcrypto`). Si aún no están, el agente debe dejar el
> schema/seed escritos y la migración lista para aplicar, señalando ese punto como pendiente de credenciales.

---

## Prompt (copiar y pegar)

```text
Trabajas en el monorepo de la demo de Taxi Green (Turborepo + pnpm), en /home/jose/dev/demo-taxigreen.
Eres arquitecto de datos + full-stack senior. Ejecuta SOLO Sprint 1. No empieces Sprint 2.

ANTES DE TOCAR CÓDIGO, LEE EN ESTE ORDEN:
1. CLAUDE.md (raíz, MAESTRO de build)
2. _FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md
3. _FUENTE_DESARROLLO/GLOSARIO_FLUJOS_TAXIGREEN.md + CONTRATO_FLUJO_PROTAGONISTA.md
4. docs/ESTADO_SPRINT_0_Y_HANDOFF.md  (estado real del repo + gotchas de entorno)
5. docs/DOCUMENTACION_TECNICA.md      (inventario y enfoque IA)
6. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §7.6 (10 tablas) y §7.7 (seguridad)
7. 07_PLAN_EJECUCION/LOGICA_NEGOCIO_OPERATIVA.md §3, §4, §8 (DELTAS de esquema — OBLIGATORIOS)
8. 07_PLAN_EJECUCION/SPRINT.md §Sprint 1 (§S1.2 backlog, §S1.3 criterios, §S1.4 prompt original)

DECISIONES CERRADAS (no las reabras):
- Flujo protagonista = Recojo en aeropuerto: Aeropuerto Jorge Chávez (Llegadas) -> Av. Pardo 123, Miraflores.
  Hotel/concierge = SOLICITANTE por WhatsApp, NO origen físico. Punto de encuentro = Salida 3, columna F2.
  Vuelo ejemplo = LA2456. El conductor va al aeropuerto, nunca al hotel. NO inviertas el flujo.
- Identidad visual = PALETA AZUL (sistema dual), YA CERRADA. Chrome del producto en azul (#0B0952 / #227FDE);
  verde Taxi Green SOLO en logo y chip de tenant; care/* púrpura en bienestar. NO uses "verde total".
- DB = PostgreSQL 17 + Prisma 6. Backend = Next.js. 10 tablas EXACTAS (no 17). Sin RLS activo en demo.
- IA: determinista primero; el LLM va detrás de withFallback() y APAGADO por defecto (IA_HABILITADA=false).
  En Sprint 1 NO se toca IA; solo respétalo.

ALCANCE = SOLO SPRINT 1: schema 10 tablas (+ deltas §8) + migración + seed protagonista + Auth.js v5
(admin/counter/driver) + middleware route guards + recordAudit + tokens de diseño AZUL definitivos. NADA MÁS.
No construyas features de S2+ (voucher real, /admin, IA, app conductor): eso son sprints posteriores.

GOTCHAS DE ENTORNO (del repo Sprint 0 — respétalos, no los rompas; detalle en docs/ESTADO_SPRINT_0_Y_HANDOFF.md §3):
- Linker pnpm = isolated (dos versiones de React: web 19 / driver 18.2). NO cambies a hoisted.
- apps/web/tsconfig.json tiene paths/typeRoots que fuerzan react/react-dom al @types local de web. NO los quites.
  Al reintroducir radix/shadcn (UI real), vigila que @types/react no se duplique (pins en apps/web + override raíz).
- postcss/autoprefixer/tailwindcss están public-hoisted en .npmrc (Next los resuelve por string). No lo deshagas.
- next.config.ts ignora eslint/ts en build a propósito (turbo cubre esas fases). No lo "arregles".
- Lint por paquete: eslint . --config ../../eslint.config.mjs  (config flat única en raíz).
- tsconfig estricto: "strict" + "noUncheckedIndexedAccess". Cero any implícito (si hace falta, eslint-disable con motivo).
- Si purgas node_modules / cambias overrides: rm -rf node_modules pnpm-lock.yaml && CI=true pnpm install.
- packages/database/prisma/schema.prisma está VACÍO desde S0: aquí lo llenas.

ENTREGABLES SPRINT 1:
A. SCHEMA (packages/database/prisma/schema.prisma) — 10 tablas EXACTAS de PLAN_SOFTWARE §7.6
   MÁS los deltas de LOGICA_NEGOCIO_OPERATIVA §8 (no añaden tablas):
   - tenants, usuarios, conductores, vehiculos, reservas, viajes, posiciones_conductor, comprobantes,
     incidencias, auditoria.
   - Enums: Rol, CanalOrigen, TipoViaje{recojo_aeropuerto,traslado_aeropuerto,city}, TipoPago, EstadoReserva,
     EstadoViaje, TipoComprobante, EstadoComprobante, TipologiaIncidencia{objeto_olvidado,queja,seguridad,otro},
     SeveridadIncidencia, EstadoIncidencia, TipoVehiculo{sedan,camioneta,van,minivan}.
   - Deltas: conductores += foto_url String?, total_viajes Int @default(0);
     vehiculos += marca String, tipo TipoVehiculo, foto_url String?, color String?, anio Int?;
     reservas += calificacion Json?, tipo_viaje TipoViaje, solicitante_tipo/nombre/contacto String?.
   - usuarios += fcm_token String?  (lo consumirá la app conductor en S6; sembrarlo evita migración extra).
   - tenant_id simbólico en todas salvo tenants y auditoria (nullable). SIN RLS.
   - Soft delete (deleted_at DateTime?) en usuarios, reservas, viajes, incidencias. created_at/updated_at autom.
   - posiciones_conductor.geom Unsupported("geography(Point,4326)")? (PostGIS, sin índice GiST en demo).
   - reservas: voucher_codigo @unique, token_pasajero @unique (nanoid 21), voucher_qr_payload String,
     raw_ingesta Json?, sugerencia_copiloto Json?, punto_encuentro String?, hotel_nombre String? (solicitante,
     NUNCA reemplaza origen_texto), empresa_nombre String?. incidencias.timeline Json @default("[]").
     auditoria.fuente_decision Json? con {fuente:'algoritmo'|'llm', motivo?, modelo?}.
   - DNI/RUC en plano en demo (pasajero_dni/pasajero_ruc String?). Índices según §7.6.
B. MIGRACIÓN: prisma migrate dev inicial aplicada en Supabase (si hay credenciales; si no, deja la migración
   generada y documenta el paso pendiente). NO SQL custom complejo, NO RLS, NO GiST.
C. SEED idempotente (packages/database/prisma/seed.ts), con upsert:
   - 1 tenant "Taxi Green Demo". 1 admin admin@taxigreen.demo/demo1234 (bcrypt). 1 supervisor
     counter@taxigreen.demo/demo1234. 6 conductores conductor1..6@taxigreen.demo con PIN bcrypt
     (1234,2345,3456,4567,5678,6789) y nombres realistas. 8 vehículos Toyota placas ABC-123 (asociación 1:1).
   - 1 RESERVA PROTAGONISTA: canal_origen=whatsapp_oficial, tipo_viaje=recojo_aeropuerto, solicitante_tipo=hotel,
     solicitante_nombre="Concierge hotel", origen_texto="Aeropuerto Jorge Chávez - Llegadas",
     punto_encuentro="Salida 3, columna F2", destino_texto="Av. Pardo 123, Miraflores", vuelo_codigo="LA2456".
     hotel_nombre describe al solicitante; NUNCA reemplaza origen_texto.
   - 1 incidencia objeto_olvidado CERRADA con timeline de 3 acciones (para mostrar trazabilidad).
   - bcrypt cost 12 en runtime; en tests usar cost bajo para no demorar.
   - Conecta script: packages/database/package.json db:seed debe ejecutar seed.ts (tsx/ts-node).
D. AUTH.JS v5 (apps/web) — sobre el STUB existente en src/lib/auth.ts:
   - provider credentials-admin (email+password bcrypt; roles admin/supervisor) y credentials-driver
     (email+PIN; endpoint que consumirá la app RN en S6). JWT en cookie httpOnly, sameSite=Lax, secure en prod, 24h.
   - src/lib/auth/{passwords.ts,pin.ts,session.ts}. middleware.ts con route guards: /admin/** -> admin_tenant|despachador;
     /counter/** -> supervisor; /p/[token] público (validación server-side directa). Errores genéricos
     "credenciales inválidas". Rate limit básico in-memory (5 intentos / 5 min).
   - páginas src/app/login-admin/page.tsx y login-counter/page.tsx con shadcn + React Hook Form + Zod.
   - /api/auth/[...nextauth]/route.ts y /api/auth/logout.
E. AUDITORÍA (packages/auditoria): recordAudit({actor,action,payload,tenantId,req?,fuenteDecision?}) que escribe
   en tabla auditoria. Invocarlo en cada login y acción crítica.
F. TOKENS DE DISEÑO AZUL DEFINITIVOS (packages/shared/src/tokens): escalas completas product/* (azul),
   brand/tenant (verde), care/* (púrpura), semánticos, tipografía (Inter), spacing. Consumidos por
   apps/web/tailwind.config.ts. BrandHeader ya existe: mantenlo coherente con el chrome azul.
G. TESTS: unit de helpers auth (hashPassword/verifyPassword, hashPin/verifyPin) con vitest. Mantener CI verde.

PROHIBIDO EN SPRINT 1:
- Crear tablas fuera de las 10 (personas_fisicas, empresas_clientes, hoteles_aliados, calificaciones,
  liquidaciones, asignaciones_unidad, etc. = MVP). Activar RLS. Construir features de S2+ (voucher real,
  /admin operativo, IA, ingesta, app conductor). Usar paleta verde como sistema. Invertir el flujo protagonista.

CRITERIOS DE ACEPTACIÓN (S1 DoD):
- pnpm --filter @taxigreen/database db:migrate aplica sin error (o migración lista si faltan credenciales).
- pnpm --filter @taxigreen/database db:seed puebla; re-ejecutar NO duplica.
- Login admin (admin@taxigreen.demo/demo1234) y counter funcionan; auditoria registra el login.
- /p/[token] inválido -> 404 elegante; válido (del seed) -> placeholder.
- Prisma Studio muestra las 10 tablas pobladas y la reserva protagonista (hotel como SOLICITANTE, origen físico
  = Aeropuerto Jorge Chávez).
- pnpm turbo run typecheck lint test build -> TODO VERDE.

FORMATO Y CIERRE:
- Trabaja autónomamente; no entregues "pasos para que el usuario configure" lo que puedas codear. Lo que requiera
  credenciales del usuario (Supabase) se cablea y se marca como pendiente en .env.example.
- Ante ambigüedad menor: decide y comenta con // DECISIÓN: ...  No preguntes.
- AL TERMINAR: detente. Reporta CI verde + smoke (migrate/seed/login). Actualiza docs/ESTADO_SPRINT_0_Y_HANDOFF.md
  (o crea docs/ESTADO_SPRINT_1.md) con lo implementado y deja el prompt de Sprint 2 (patrón abajo). NO empieces
  Sprint 2 sin nueva instrucción.
```

---

## Patrón para los siguientes sprints (S2 → S9)

Para cada sprint `N`, genera su prompt con la **misma plantilla**, cambiando solo el contenido específico:

1. **Encabezado fijo:** "Trabajas en el monorepo de la demo de Taxi Green… Ejecuta SOLO Sprint N. No empieces N+1."
2. **Lecturas obligatorias:** `CLAUDE.md` → `01_FUENTE_DE_VERDAD` → `GLOSARIO` + `CONTRATO_FLUJO_PROTAGONISTA` →
   el **último** `docs/ESTADO_SPRINT_{N-1}.md` (estado real + gotchas) → `07_PLAN_EJECUCION/SPRINT.md §Sprint N`
   (+ las secciones de `PLAN_SOFTWARE`/`LOGICA` que ese sprint cite).
3. **Decisiones cerradas** (recordatorio fijo): flujo protagonista (no invertir), **paleta azul**, 10 tablas,
   Next.js (no NestJS), monolito modular, Supabase Realtime, **determinista primero + LLM por encima con
   `withFallback` (apagado por defecto)**, ningún prompt en código (van en `packages/ia/prompts/*.md`), humano confirma al LLM.
4. **Gotchas de entorno** (copiar de `docs/ESTADO_SPRINT_0_Y_HANDOFF.md §3`): linker isolated, dos Reacts, paths de
   `@types/react` en web, postcss hoisteado, `next.config` ignora ts/eslint a propósito, lint por paquete con
   `--config`, install limpia tras cambios de deps, peers de `next-auth`/`@rnmapbox`.
5. **Entregables / Prohibido / Criterios de aceptación:** tomar del `SPRINT.md §S{N}` (backlog + DoD), enriquecidos
   con el estado real del repo.
6. **Cierre fijo:** autónomo, sin instrucciones-para-el-usuario, `// DECISIÓN:` ante ambigüedad, y al terminar:
   **CI verde + smoke**, **actualizar/crear `docs/ESTADO_SPRINT_{N}.md`** y **dejar el prompt de Sprint N+1**.

Mapa de sprints (modelo sugerido por el plan): **Opus** en S1/S4/S6; **Sonnet 4.6 / Codex 5.5** el resto.

| N | Foco | Secciones a citar |
|---|---|---|
| 2 | Voucher QR HMAC + Comprobante PDF SUNAT-like + Auditoría visible + RENIEC lookup | `SPRINT §S2`, `PLAN §7.6/§7.9`, `LOGICA §6` |
| 3 | `/admin` + Supabase Realtime + asignación manual (conductor/unidad separados) | `SPRINT §S3`, `PLAN §7.4`, `LOGICA §3` |
| 4 | Capa IA mínima (LLMProvider+adapter+withFallback) + ingesta determinista + `/wa-sim` | `SPRINT §S4`, `PLAN §7.5`, `LOGICA §2` |
| 5 | Heurística de asignación + racionalización LLM con fallback | `SPRINT §S5`, `LOGICA §3.4` |
| 6 | App conductor RN+Expo: scaffolding + auth PIN + push + recibir asignación | `SPRINT §S6`, `PLAN §2.6/§7.2` |
| 7 | App conductor: mapa + estados viaje + ubicación foreground | `SPRINT §S7` |
| 8 | `/p/[token]` + tracking + comprobante + 1 incidencia (objeto olvidado) | `SPRINT §S8`, `LOGICA §4/§6` |
| 9 | `/counter` QR + landing + datos del guion + reset + deploy + video respaldo | `SPRINT §S9` |

> Regla de oro transversal: **no se abre un sprint sin cerrar el anterior con `pnpm turbo run typecheck lint test
> build` verde + smoke test**, y cada feature lleva su seed mínimo y su E2E mínimo. Si un sprint descubre un riesgo
> no anticipado, se actualiza el documento de plan **antes** de continuar.

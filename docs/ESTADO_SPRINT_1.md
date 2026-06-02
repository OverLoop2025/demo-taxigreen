# Estado Sprint 1 — Taxi Green Demo

Fecha de cierre: 2026-05-31

## 1. Alcance cerrado

Sprint 1 implementa la base operativa de la demo sin adelantar features de Sprint 2+:

- Schema Prisma con las 10 tablas exactas de la demo: `tenants`, `usuarios`, `conductores`, `vehiculos`,
  `reservas`, `viajes`, `posiciones_conductor`, `comprobantes`, `incidencias`, `auditoria`.
- Migracion inicial en `packages/database/prisma/migrations/20260531000000_sprint1_initial/migration.sql`.
- Seed idempotente en `packages/database/prisma/seed.ts` con tenant demo, admin, supervisor counter, 6 conductores,
  8 Toyota, reserva protagonista, viaje, posicion, comprobante pendiente, incidencia cerrada y auditoria inicial.
- Auth.js v5 en `apps/web`: credentials admin/counter por email+password, credentials driver por email+PIN,
  JWT 24h, rate limit in-memory, logout y guards de `/admin/**` y `/counter/**`.
- `recordAudit` real en `packages/auditoria`, invocado en logins y preparado para acciones criticas.
- Tokens definitivos AZUL en `packages/shared/src/tokens` consumidos por `apps/web/tailwind.config.ts`.
- Placeholders protegidos para `/admin`, `/counter` y placeholder publico `/p/[token]`.
- Tests unitarios de helpers auth y tokens.

## 2. Decisiones respetadas

- Flujo protagonista: `Aeropuerto Jorge Chávez - Llegadas` -> `Av. Pardo 123, Miraflores`.
- Hotel/concierge queda como `solicitante_*` y `hotel_nombre`; no reemplaza el origen fisico.
- Paleta dual: azul para chrome de producto, verde solo tenant/logo, purpura para `care/*`.
- Sin RLS, sin tablas extra y sin features S2+ como voucher QR real, PDF, IA, `/admin` operativo o app conductor.

## 3. Credenciales demo sembradas

- Admin: `admin@taxigreen.demo` / `demo1234`.
- Counter: `counter@taxigreen.demo` / `demo1234`.
- Conductores: `conductor1@taxigreen.demo` a `conductor6@taxigreen.demo`.
- PINs conductores: `1234`, `2345`, `3456`, `4567`, `5678`, `6789`.
- Token pasajero demo: `tg_demo_passenger_001`.
- Voucher publico demo: `TG-2026-0001`.

## 4. Verificacion realizada

Comandos verdes:

```bash
pnpm --filter @taxigreen/database exec prisma format
DATABASE_URL=postgresql://taxigreen:taxigreen@localhost:5432/taxigreen DIRECT_URL=postgresql://taxigreen:taxigreen@localhost:5432/taxigreen pnpm --filter @taxigreen/database exec prisma validate
pnpm --filter @taxigreen/shared typecheck
pnpm --filter @taxigreen/auditoria typecheck
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/shared test
pnpm --filter @taxigreen/web test
pnpm --filter @taxigreen/web lint
pnpm --filter @taxigreen/auditoria lint
pnpm --filter @taxigreen/shared lint
pnpm --filter @taxigreen/database build
pnpm --filter @taxigreen/web build
DATABASE_URL=postgresql://taxigreen:taxigreen@localhost:5432/taxigreen DIRECT_URL=postgresql://taxigreen:taxigreen@localhost:5432/taxigreen pnpm turbo run typecheck lint test build
```

Resultados:

- Turbo completo: 52/52 tasks verdes.
- Prisma schema valido.
- Migracion diff genera 10 `CREATE TABLE`, 12 enums, sin RLS y sin indice GiST.
- Web build compila rutas `/`, `/admin`, `/counter`, `/login-admin`, `/login-counter`, `/p/[token]` y auth API.
- Vitest web: 5 tests verdes.
- Vitest shared: 4 tests verdes.
- Smoke HTTP del build: `/` 200, `/login-admin` 200, `/admin` 307 hacia `/login-admin?callbackUrl=%2Fadmin`.
- `/p/[token]`: la query `reservas.findUnique({ where: { token_pasajero } })` que alimenta la página se validó
  contra Supabase (devuelve la reserva protagonista para `tg_demo_passenger_001`; token inexistente → `notFound()`/404).
  Ver §5 (smoke DB completado).

## 5. Smoke DB — COMPLETADO contra Supabase (2026-05-31)

El smoke real de base de datos se ejecutó contra el proyecto Supabase del cliente (pooler IPv4:
`aws-1-us-east-1.pooler.supabase.com`, transaction 6543 + session 5432). Credenciales cableadas en
`.env` (gitignored) de raíz, `apps/web` y `packages/database`.

Secuencia ejecutada y verde:

```bash
# 1) Extensiones (creadas por código, no via dashboard)
pnpm --filter @taxigreen/database exec prisma db execute --url "$DIRECT_URL" --file extensiones.sql
#    -> CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS pgcrypto;  => OK
# 2) Migración
pnpm --filter @taxigreen/database exec prisma migrate deploy   # aplica 20260531000000_sprint1_initial => OK
# 3) Seed x2 (idempotencia)
pnpm --filter @taxigreen/database db:seed   # corrida 1
pnpm --filter @taxigreen/database db:seed   # corrida 2
```

Resultados verificados:

- **10 tablas creadas** (`prisma migrate status` => "Database schema is up to date!", sin drift).
- **Idempotencia OK**: conteos idénticos tras corrida 1 y 2 →
  `{tenants:1, usuarios:8, conductores:6, vehiculos:8, reservas:1, viajes:1, posiciones_conductor:1, comprobantes:1, incidencias:1, auditoria:1}`.
  (`usuarios:8` = admin + counter + 6 conductores.)
- **Login real** (helpers reales `verifyPassword`/`verifyPin` contra hashes sembrados): admin `demo1234` ✅,
  counter `demo1234` ✅, conductor1 PIN `1234` ✅; credenciales incorrectas → `false` ✅.
- **Auditoría al loguear**: `recordAudit` real escribió fila (`auditoria` 1→2), `action=login_admin`; fila de
  prueba eliminada después (vuelve a 1).
- **Reserva protagonista** correcta: `tipo_viaje=recojo_aeropuerto`, origen físico `Aeropuerto Jorge Chávez - Llegadas`,
  `punto_encuentro=Salida 3, columna F2`, destino `Av. Pardo 123, Miraflores`, vuelo `LA2456`,
  `solicitante_tipo=hotel` (hotel NO reemplaza el origen físico), `token_pasajero=tg_demo_passenger_001`.

> ⚠️ Seguridad: la Database password del proyecto se usó para este smoke y quedó en los `.env` locales
> (no versionados). Rotar la password en Supabase tras la demo. Nota menor: `voucher_qr_payload` se regenera
> con `nanoid(8)` en la rama `update` del upsert (no duplica filas; irrelevante porque en S2 el voucher se firma
> con HMAC real).

## 6. Handoff a Sprint 2

Sprint 2 debe empezar desde `docs/PROMPT_SPRINT_2_CODEX.md`.

Orden recomendado:

1. Ejecutar smoke real DB apenas haya Docker/Supabase accesible.
2. Implementar voucher QR HMAC en `packages/voucher`.
3. Implementar comprobantes PDF SUNAT-like en `packages/comprobantes`.
4. Implementar RENIEC lookup con cache en `packages/integraciones/reniec`.
5. Construir auditoria visible en `/admin/auditoria`.
6. Mantener la regla: no avanzar a S3 sin `pnpm turbo run typecheck lint test build` y smoke S2.

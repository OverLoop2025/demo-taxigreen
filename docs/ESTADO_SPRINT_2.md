# Estado Sprint 2 — Taxi Green Demo

Fecha de cierre: 2026-05-31

## 1. Confirmación de Sprint 1

Se incorpora el smoke real de DB reportado tras el cierre inicial de S1:

- Extensiones `postgis` + `pgcrypto` creadas por código contra Supabase.
- `prisma migrate deploy` aplicó `20260531000000_sprint1_initial`.
- `prisma migrate status` quedó `up to date`, sin drift.
- `db:seed` ejecutado 2 veces sin duplicar datos.
- Conteos estables: `tenants:1`, `usuarios:8`, `conductores:6`, `vehiculos:8`, `reservas:1`,
  `viajes:1`, `posiciones_conductor:1`, `comprobantes:1`, `incidencias:1`, `auditoria:1`.
- Login real admin/counter/driver verificado contra hashes bcrypt sembrados.
- `recordAudit` escribió fila real en auditoría durante login.
- Reserva protagonista correcta: `recojo_aeropuerto`, origen `Aeropuerto Jorge Chávez - Llegadas`,
  punto `Salida 3, columna F2`, destino `Av. Pardo 123, Miraflores`, vuelo `LA2456`,
  `solicitante_tipo=hotel`.

Nota de seguridad: rotar la Database password de Supabase tras la demo, porque se usó en `.env` locales gitignored.

## 2. Alcance implementado en Sprint 2

### Voucher QR HMAC

- `packages/voucher/src/sign.ts`: `createVoucherToken` y `verifyVoucherToken` con HMAC SHA-256.
- Payload: `{reserva_id, codigo_publico, issued_at, expires_at, v}`.
- Tampering y expiración rechazados con resultado tipado.
- `packages/voucher/src/qr.ts`: `renderQRtoPNG` y `renderQRtoSVG` con `qrcode`.
- Tests unitarios en `packages/voucher/src/sign.test.ts`.

### Rutas voucher

- `GET /api/voucher/[id]/qr`: acepta `id`, `voucher_codigo` o `token_pasajero`; devuelve PNG 512x512,
  actualiza `reservas.voucher_qr_payload` con token HMAC real y audita `voucher_qr_emitido`.
- `POST /api/voucher/[id]/verify`: valida firma, expiración y match con reserva; audita
  `voucher_qr_verificado` o `voucher_qr_rechazado`.

### Comprobantes PDF SUNAT-like

- `packages/comprobantes/src/templates/*`: plantillas visuales para boleta, factura y ticket.
- `packages/comprobantes/src/render.ts`: render PDF vía `puppeteer-core` + `@sparticuz/chromium-min`.
- `packages/comprobantes/src/fallback-pdf.ts`: PDF local de contingencia para entornos sin Chromium.
- `GET /api/comprobantes/[id]/pdf`: genera PDF, marca comprobante como `emitido`, actualiza `pdf_url` y audita
  `comprobante_pdf_generado`.
- Si hay `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, intenta subir al bucket privado
  `comprobantes` y devuelve URL firmada 24h en header `x-supabase-signed-url`.

### RENIEC lookup

- `packages/integraciones/reniec`: cache in-memory TTL 30 min.
- Precarga 3 DNIs del guion: `44556677`, `12345678`, `87654321`.
- `packages/database/prisma/seed.ts` ahora deja esos 3 DNIs también dentro de `raw_ingesta.reniec_demo_dnis`.
- Provider APIs.net.pe preparado para DNI/RUC con `RENIEC_API_TOKEN`.
- `POST /api/reniec/lookup`: validación Zod, cache primero, auditoría `reniec_lookup`, 503 si proveedor externo
  no está disponible.

### Auditoría visible

- `/admin/auditoria`: RSC protegida por roles `admin_tenant|despachador`.
- Filtros por `action`, `actor`, fecha desde/hasta y paginación.
- Tabla cliente con TanStack Table.

### E2E mínimo

- `tests/e2e/voucher-flow.spec.ts`: QR PNG, verificación 200 y token alterado 400.

## 3. Verificación ejecutada

Comandos verdes:

```bash
pnpm --filter @taxigreen/voucher test
pnpm --filter @taxigreen/voucher typecheck
pnpm --filter @taxigreen/comprobantes typecheck
pnpm --filter @taxigreen/integraciones-reniec typecheck
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/voucher lint
pnpm --filter @taxigreen/comprobantes lint
pnpm --filter @taxigreen/integraciones-reniec lint
pnpm --filter @taxigreen/web lint
pnpm --filter @taxigreen/web test
pnpm --filter @taxigreen/web build
pnpm turbo run typecheck lint test build
pnpm exec playwright install chromium
pnpm e2e
```

Smoke real contra Supabase + `next start`:

- `pnpm --filter @taxigreen/database db:seed` actualizó el seed con los 3 DNIs de guion.
- `GET /api/voucher/TG-2026-0001/qr` → 200, `content-type: image/png`, PNG 512x512.
- `POST /api/voucher/TG-2026-0001/verify` con token emitido → 200.
- `POST /api/voucher/TG-2026-0001/verify` con token alterado → 400.
- `POST /api/reniec/lookup` con `{"tipo":"dni","documento":"44556677"}` → 200, `cache_hit:true`.
- `GET /api/comprobantes/{reserva_id}/pdf` → 200, `content-type: application/pdf`, PDF válido.
- `/admin/auditoria` sin sesión → 307 a `/login-admin?callbackUrl=%2Fadmin%2Fauditoria`.
- E2E completo: 2/2 tests verdes (`smoke.spec.ts` + `voucher-flow.spec.ts`).

## 3.5. Auditoría de cierre + corrección de bug (2026-05-31, revisión post-Codex)

Se ejecutó el smoke real contra Supabase + `next start :3000` (no solo el reporte de Codex) y se verificó todo:

- `GET /api/voucher/TG-2026-0001/qr` → 200, `image/png`, `Cache-Control: max-age=30`, header `x-voucher-token`, PNG válido.
- `POST /verify` token emitido → 200 `{ok:true}`; token alterado → 400 `{ok:false}`.
- `POST /api/reniec/lookup` `{dni,44556677}` → 200 `cache_hit:true` (Valeria Mendoza Rojas).
- `GET /admin/auditoria` sin sesión → 307 a `/login-admin`.
- Auditoría registró los 6 eventos: `voucher_qr_emitido`, `voucher_qr_verificado`, `voucher_qr_rechazado`,
  `reniec_lookup`, `comprobante_pdf_generado`.
- Plantilla SUNAT (`?format=html`) renderiza con datos del protagonista (boleta Taxi Green, RUC, Jorge Chávez, Pardo).
- E2E `pnpm e2e` → **2/2 verde**. CI `pnpm turbo run typecheck lint test build` → **52/52 verde**.

**🐞 Bug corregido (afectaba también a producción/Railway):** el `GET /api/comprobantes/[id]/pdf` caía SIEMPRE al
fallback inline (1 KB) con `TypeError: b.mask is not a function`. Causa: `@taxigreen/comprobantes` está en
`transpilePackages`, por lo que Next empaquetaba `puppeteer-core` y su dependencia `ws` dentro del route bundle,
rompiendo `ws.mask`. No era solo "falta Chromium local": con Chromium presente seguía fallando, así que el PDF SUNAT
real **nunca** se habría generado (ni en Railway). Fix en `apps/web/next.config.ts`:

- `serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min']`.
- Como `serverExternalPackages` no atraviesa `transpilePackages`, además se fuerzan los externals del build de
  servidor vía `webpack` (`puppeteer-core`, `@sparticuz/chromium-min`, `ws`, `bufferutil`, `utf-8-validate`).

Tras el fix y rebuild: `GET /api/comprobantes/{reserva_id}/pdf` → 200, `x-comprobante-renderer: puppeteer`,
PDF real de ~32 KB (look SUNAT), 0 errores. Verificado con el Chromium de Playwright vía `PUPPETEER_EXECUTABLE_PATH`.

DB dejada limpia: reseed idempotente + purga de los 22 eventos de auditoría de prueba (queda solo `seed_sprint_1`).
Servidor apagado.

## 4. Pendientes condicionados por entorno

- **PDF Puppeteer: RESUELTO** (ver §3.5). En esta máquina se usa el Chromium de Playwright vía
  `PUPPETEER_EXECUTABLE_PATH` (cableado en `apps/web/.env`, gitignored, ruta machine-specific). En Railway se usa el
  layer/binario de Chromium o su propia `PUPPETEER_EXECUTABLE_PATH`/`CHROMIUM_PATH`.
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` no están cargados para web en este entorno, por eso el
  **Storage firmado 24h no se probó end-to-end**; la ruta degrada a PDF inline y sigue auditando (código listo). Único
  criterio de S2 sin verificar contra servicio real. Para demo: crear bucket privado `comprobantes` + service role solo
  en servidor. (Las connection strings de Supabase ya están; faltan estas 2 claves del proyecto.)
- `HMAC_SECRET` ya cableado en `apps/web/.env` para la demo (rotar antes de prod).

Actualización S3: este pendiente quedó cerrado. Las claves Supabase fueron cableadas en `.env` gitignored, se creó
el bucket privado `comprobantes` y `GET /api/comprobantes/{reserva_id}/pdf` devolvió PDF Puppeteer con URL firmada.

### Notas menores (no bloquean S3)

- Voucher: la verificación es stateless por HMAC; **no implementa "un solo uso" / bloqueo idempotente** (regla global
  CLAUDE.md §4.6). No es criterio de S2; relevante para el QR scan de `/counter` en S9.
- `/api/reniec/lookup`: el Zod valida 8 u 11 dígitos pero no cruza `tipo=dni→8` / `tipo=ruc→11`. Cosmético.
- `/admin/auditoria`: el filtro "actor" matchea `actor_tipo` (usuario/sistema/conductor), no `actor_id`. Aceptable.

## 5. Handoff a Sprint 3

Sprint 3 debe empezar desde `docs/PROMPT_SPRINT_3_CODEX.md`.

Orden recomendado:

1. Validar que Storage `comprobantes` esté disponible si se quiere enseñar URL firmada.
2. Implementar `/admin` operativo con query inicial Prisma.
3. Agregar Supabase Realtime para reservas por `tenant_id`.
4. Implementar asignación manual conductor/unidad separadas.
5. Cada acción humana debe escribir `recordAudit` con `fuente_decision=null`.
6. No avanzar a S4 sin `pnpm turbo run typecheck lint test build` y smoke S3.

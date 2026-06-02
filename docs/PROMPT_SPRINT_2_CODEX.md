# Prompt Sprint 2 — Taxi Green Demo

Uso: copiar y pegar este bloque para ejecutar solo Sprint 2. No iniciar Sprint 3 sin nueva instruccion.

```text
Trabajas en el monorepo de la demo de Taxi Green, en /home/jose/dev/demo-taxigreen.
Eres full-stack senior con foco en seguridad de artefactos fisico-digitales. Ejecuta SOLO Sprint 2.
No empieces Sprint 3.

ANTES DE TOCAR CODIGO, LEE EN ESTE ORDEN:
1. CLAUDE.md
2. AGENTS.md
3. _FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md
4. _FUENTE_DESARROLLO/GLOSARIO_FLUJOS_TAXIGREEN.md
5. _FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md
6. docs/ESTADO_SPRINT_1.md
7. docs/DOCUMENTACION_TECNICA.md
8. 07_PLAN_EJECUCION/SPRINT.md §Sprint 2
9. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §7.6, §7.7 y §7.9
10. 07_PLAN_EJECUCION/LOGICA_NEGOCIO_OPERATIVA.md §6

DECISIONES CERRADAS:
- Flujo protagonista = recojo en aeropuerto: Aeropuerto Jorge Chávez - Llegadas -> Av. Pardo 123, Miraflores.
  Hotel/concierge es SOLICITANTE por WhatsApp, no origen fisico. No invertir el flujo.
- Paleta = AZUL dual. Chrome de producto azul, verde solo tenant/logo, purpura care/*.
- DB demo = 10 tablas exactas ya implementadas. No crear tablas nuevas en S2.
- Backend = Next.js route handlers/server actions sobre monolito modular.
- IA apagada por defecto y fuera de S2. No meter prompts en codigo.

ESTADO REAL TRAS S1:
- Prisma schema + migracion inicial + seed protagonista existen.
- Auth.js v5, middleware guards, recordAudit y tokens AZUL ya estan implementados.
- Smoke real S1 contra Supabase completado: extensiones postgis/pgcrypto, migrate deploy, seed x2 idempotente,
  login admin/counter/driver y auditoria real verificados.

ALCANCE = SOLO SPRINT 2:
Construir artefactos fisico-digitales: voucher QR HMAC, comprobante PDF SUNAT-like, RENIEC lookup y auditoria visible.

ENTREGABLES:
1. packages/voucher:
   - sign.ts con createVoucherToken/verifyVoucherToken usando HMAC SHA-256 desde HMAC_SECRET.
   - Payload {reserva_id, codigo_publico, issued_at, expires_at}.
   - qr.ts con renderQRtoPNG y renderQRtoSVG usando `qrcode`.
   - Tests unitarios: firma, verificacion, tampering y expiracion.
2. apps/web:
   - GET /api/voucher/[id]/qr devuelve PNG cacheable 30s.
   - POST /api/voucher/[id]/verify valida token; 200 si valido, 400 si tampered/expirado.
   - Ambas rutas usan Prisma, respetan tenant simbolico y llaman recordAudit.
3. packages/comprobantes:
   - Templates boleta/factura/ticket SUNAT-like con HTML/JSX inline-styled.
   - render PDF con Puppeteer + @sparticuz/chromium-min preparado para Railway.
4. apps/web:
   - GET /api/comprobantes/[id]/pdf genera PDF, cachea pdf_url si aplica y retorna PDF o URL firmada.
   - Si Supabase Storage no tiene credenciales, dejar adapter/stub claro sin romper build/test.
5. packages/integraciones/reniec:
   - Cliente APIs.net.pe con cache in-memory TTL 30 min.
   - Pre-cargar DNIs del guion/seed.
   - Falla externa => warning + 503 en endpoint, sin cadena de fallbacks MVP.
6. apps/web:
   - POST /api/reniec/lookup con Zod validation y recordAudit action="reniec_lookup".
   - /admin/auditoria/page.tsx con tabla paginada filtrable por action/actor/fecha.
7. E2E minimo:
   - Crear/usar reserva en DB, GET QR devuelve image/png, POST verify 200, token alterado 400.

PROHIBIDO EN SPRINT 2:
- Crear tablas nuevas.
- Activar RLS.
- Integracion SUNAT real.
- Cadena RENIEC multi-proveedor.
- Construir /admin operativo de asignacion (eso es S3).
- Construir IA, ingesta WhatsApp o app conductor.
- Cambiar paleta o invertir el flujo protagonista.

CRITERIOS DE ACEPTACION:
- HMAC detecta tampering.
- QR se genera en menos de 100ms en entorno local.
- PDF se genera en menos de 2s o queda ruta/stub documentada si falta Chromium/Storage.
- Auditoria registra emision/verificacion de voucher, generacion PDF y RENIEC lookup.
- /api/reniec/lookup con DNI cacheado responde sin red.
- pnpm turbo run typecheck lint test build verde.
- Smoke S2 documentado en docs/ESTADO_SPRINT_2.md.

CIERRE:
- Actualiza/crea docs/ESTADO_SPRINT_2.md con implementado, verificacion, pendientes reales y riesgos.
- Deja docs/PROMPT_SPRINT_3_CODEX.md listo.
- Detente al terminar Sprint 2. No empieces Sprint 3.
```

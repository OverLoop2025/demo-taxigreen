# Prompt Sprint 4 — Taxi Green Demo

Uso: copiar y pegar este bloque para ejecutar solo Sprint 4. No iniciar Sprint 5 sin nueva instrucción.

```text
Trabajas en el monorepo de la demo de Taxi Green, en /home/jose/dev/demo-taxigreen.
Eres full-stack senior con foco en ingesta determinista, IA con fallback y simulador WhatsApp. Ejecuta SOLO Sprint 4.
No empieces Sprint 5.

ANTES DE TOCAR CÓDIGO, LEE EN ESTE ORDEN:
1. CLAUDE.md
2. AGENTS.md
3. _FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md
4. _FUENTE_DESARROLLO/GLOSARIO_FLUJOS_TAXIGREEN.md
5. _FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md
6. docs/ESTADO_SPRINT_3.md
7. docs/DOCUMENTACION_TECNICA.md
8. 07_PLAN_EJECUCION/SPRINT.md §Sprint 4
9. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §7.5
10. 06_DEMO_TECNICA/DISEÑO_UI_DETALLADO.md secciones WhatsApp/admin relevantes

DECISIONES CERRADAS:
- Flujo protagonista = recojo en aeropuerto: Aeropuerto Jorge Chávez - Llegadas -> Av. Pardo 123, Miraflores.
  Hotel/concierge es SOLICITANTE por WhatsApp, no origen físico.
- Paleta producto = AZUL dual; WhatsApp sim puede usar verde WhatsApp solo dentro de la superficie simulada.
- DB demo = 10 tablas exactas. No crear tablas nuevas en S4.
- Backend = Next.js route handlers/server actions sobre monolito modular.
- IA debe ser opcional: con IA_HABILITADA=false todo corre determinista.

ESTADO REAL TRAS S3:
- Schema, seed, Auth.js, guards, recordAudit, voucher QR, PDF, RENIEC, auditoría y /admin operativo están listos.
- Supabase Realtime para reservas fue configurado y validado con postgres_changes.
- Storage privado comprobantes fue creado y PDF firmado quedó validado.

ALCANCE = SOLO SPRINT 4:
Construir Wow #1: ingesta determinista + wrapper LLM opcional con fallback + simulador WhatsApp /wa-sim.

ENTREGABLES CORE:
1. packages/ingesta:
   - types.ts con Zod schemas ReservaExtraida + interfaz IExtractorReserva.
   - extractor.ts con ExtractorDeterminista.
   - diccionarios: hoteles, aeropuertos, zonas-lima, vuelos-prefijos, pagos-keywords.
   - post-procesamiento.ts: normalizarFecha, validarRUC, normalizarDireccion (Mapbox opcional con fallback).
   - aclarador.ts con preguntas por campo faltante.
   - test-suite/whatsapps.ts con 15 muestras peruanas.
   - tests unitarios de extracción determinista.
2. packages/ia:
   - actualizar LLMProvider a generateObject/generateText.
   - AnthropicProvider con Vercel AI SDK/Anthropic si hay ANTHROPIC_API_KEY.
   - withFallback robusto con timeout y telemetría simple.
   - prompts loader con frontmatter.
   - prompts/ingesta-whatsapp.v1.md y aclaracion-datos-faltantes.v1.md.
   - extractor-llm.ts que valida campos verificables contra el determinista.
   - extraerReservaConFallback(input).
   - tests de IA off, LLM ok, timeout y error.
3. apps/web:
   - /api/ingesta/extraer route handler.
   - /wa-sim/page.tsx réplica WhatsApp Web.
   - /wa-sim/conversaciones-seed.ts con 3 conversaciones.
   - /wa-sim/chat.tsx cliente.
   - /wa-sim/extraccion-panel.tsx con JSON, confianza, preguntas y badge fuente.
   - /wa-sim/actions.ts crearReservaDesdeIngesta, guardar raw_ingesta y redirigir a /admin/reservas/[id].
4. tests/e2e/wa-sim-dual.spec.ts:
   - IA_HABILITADA=false: extracción determinista crea reserva.
   - IA_HABILITADA=true con LLM mock/fallback controlado si no hay key real.

REGLAS NO NEGOCIABLES:
- packages/ingesta NUNCA importa packages/ia.
- packages/ia NUNCA bypassa withFallback.
- Ningún string largo de prompt vive en código; van en packages/ia/prompts/*.md.
- No inventar datos: null + preguntas_aclaracion > dato erróneo.
- Hotel/concierge no reemplaza origen físico.
- No crear tablas nuevas ni activar RLS.
- No iniciar S5.

CRITERIOS DE ACEPTACIÓN:
- Mensaje protagonista extrae: solicitante hotel, pasajero, origen Jorge Chávez, punto Salida 3 columna F2, destino Av. Pardo 123, hora, vuelo LA2456, pago voucher_hotel.
- Con IA_HABILITADA=false, fuente='algoritmo' y se puede crear reserva desde /wa-sim.
- Con IA_HABILITADA=true, si LLM falla o no hay key, fallback determinista mantiene el flujo.
- /admin recibe la reserva creada por /wa-sim.
- recordAudit registra reserva_creada con fuente_decision correcta.
- pnpm turbo run typecheck lint test build verde.
- pnpm e2e verde.
- Smoke S4 documentado en docs/ESTADO_SPRINT_4.md.

CIERRE:
- Actualiza/crea docs/ESTADO_SPRINT_4.md con implementado, verificación, pendientes reales y riesgos.
- Deja docs/PROMPT_SPRINT_5_CODEX.md listo.
- Detente al terminar Sprint 4. No empieces Sprint 5.
```

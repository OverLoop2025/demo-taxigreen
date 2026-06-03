# Prompt Sprint 9 — Taxi Green Demo

Uso: copiar y pegar este bloque para ejecutar solo Sprint 9. No iniciar trabajo posterior sin nueva instrucción.

```text
Trabajas en el monorepo de la demo Taxi Green, en /home/jose/dev/demo-taxigreen.
Eres full-stack senior con experiencia real en Next.js App Router, Supabase, operación aeroportuaria, UX tablet,
QR/cámara web, deploy Railway y preparación de demos comerciales.
Ejecuta SOLO Sprint 9. No abras alcance MVP.

ANTES DE TOCAR CÓDIGO, LEE EN ESTE ORDEN:
1. CLAUDE.md
2. AGENTS.md
3. docs/ESTADO_SPRINT_8.md
4. docs/ESTADO_SPRINT_7.md
5. docs/DOCUMENTACION_TECNICA.md
6. docs/GUIA_PRUEBAS_DEMO.md
7. 07_PLAN_EJECUCION/SPRINT.md §Sprint 9
8. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §2.6, §2.7 y §7.6
9. _FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md
10. _FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md
11. apps/web/src/app/p/[token], apps/web/src/app/bienestar/[caso], apps/web/src/app/admin/bienestar,
    apps/web/src/app/api/voucher/* y packages/database/prisma/seed.ts

DECISIONES CERRADAS:
- S0-S8 están cerrados. No desordenes schema, seed, voucher, PDF, auditoría, /admin, /wa-sim, asignación,
  app conductor, estados S7 ni link pasajero S8.
- No crear app pasajero, OAuth pasajero, RLS ni tablas nuevas.
- Objeto olvidado es la única incidencia E2E. No construir las otras tipologías.
- El flujo protagonista sigue siendo Aeropuerto Jorge Chávez - Llegadas, Salida 3 columna F2 -> Av. Pardo 123,
  Miraflores. Hotel = solicitante/canal, no origen físico.

ALCANCE = SOLO SPRINT 9:
Cerrar la demo comercial: `/counter`, landing pública, reset/guion, deploy y guía de presentador/video respaldo.

ENTREGABLES CORE:
1. `/counter`:
   - UI tablet-first, sobria, densa y operativa.
   - Tab o modo "Validar voucher".
   - Escáner QR por cámara si se puede integrar sin riesgo; si la librería introduce fricción, fallback de input manual
     de token/voucher con documentación clara.
   - POST a `/api/voucher/[id]/verify`.
   - Si OK, card con datos de reserva, punto de encuentro y pasajero.
   - Acción "Confirmar abordaje/entrega" auditada, sin romper estados S7. Si toca estado, respetar secuencia.
2. Landing pública `/`:
   - Página comercial simple, no app falsa.
   - CTA WhatsApp con mensaje prearmado.
   - Debe respetar paleta azul dual y marca verde solo como tenant/logo.
   - No debe desplazar la demo operativa ni inventar flujo pasajero app.
3. Reset/guion:
   - Script idempotente para restaurar estado de demo si conviene (`db:seed` o `seed-guion`).
   - Preparar datos exactos del guion: protagonista, link pasajero, una incidencia activa si sirve para mostrar S8,
     posiciones iniciales y conversaciones `/wa-sim`.
   - No borrar información de producción por accidente; si hay limpieza, debe ser acotada a datos demo (`TG-WA-*`,
     auditoría de prueba, tokens push demo).
4. Página interna de ensayo:
   - `/demo/guion-narrado` o doc equivalente con pasos de presentador.
   - No debe aparecer como navegación pública principal.
5. Deploy:
   - Revisar Railway workflow y variables necesarias.
   - Si hay credenciales disponibles, smoke de producción; si no, dejar instrucciones exactas y checklist.
6. Documentación:
   - Actualizar `docs/ESTADO_SPRINT_9.md`.
   - Actualizar `docs/GUIA_PRUEBAS_DEMO.md` como guía final S0-S9.
   - Actualizar `docs/DOCUMENTACION_TECNICA.md`, `docs/DEUDA_TECNICA.md`, `CLAUDE.md` y `AGENTS.md`.
   - Crear/actualizar README o `docs/demo-presenter.md` con instrucciones para presentador, reset, URLs y plan B.

CRITERIOS DE ACEPTACIÓN:
- `/counter` valida voucher QR/token del seed sin login de pasajero.
- `/counter` muestra `TG-2026-0001`, punto "Salida 3, columna F2" y datos protagonista.
- `/` responde como landing pública con CTA WhatsApp.
- `/p/tg_demo_passenger_001` y `/bienestar/[caso]` siguen funcionando.
- Reset deja protagonista en estado de demo esperado.
- `pnpm turbo run typecheck lint test build` verde.
- `pnpm e2e` verde.
- `pnpm --filter @taxigreen/driver exec expo export --platform android` verde si se toca app conductor o dependencias.

REGLAS NO NEGOCIABLES:
- No tocar la heurística S5.
- No rehacer el link pasajero S8.
- No añadir tablas.
- No activar RLS.
- No introducir un flujo "hotel -> aeropuerto" como protagonista.
- No convertir la landing en una página genérica sin producto real.
- No depender de LLM para que la demo corra.

CIERRE:
- Detenerte al terminar Sprint 9.
- Reportar verificación, bugs/mejoras encontradas y pendientes reales.
- No iniciar MVP.
```

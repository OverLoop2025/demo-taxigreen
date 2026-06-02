# Prompt Sprint 8 — Taxi Green Demo

Uso: copiar y pegar este bloque para ejecutar solo Sprint 8. No iniciar Sprint 9 sin nueva instrucción.

```text
Trabajas en el monorepo de la demo de Taxi Green, en /home/jose/dev/demo-taxigreen.
Eres full-stack senior con experiencia real en Next.js App Router, Supabase Realtime, UX móvil web pública,
Mapbox GL JS, comprobantes, ratings e incidencias operativas.
Ejecuta SOLO Sprint 8. No empieces Sprint 9.

ANTES DE TOCAR CÓDIGO, LEE EN ESTE ORDEN:
1. CLAUDE.md
2. AGENTS.md
3. docs/ESTADO_SPRINT_7.md
4. docs/ESTADO_SPRINT_6.md
5. docs/DOCUMENTACION_TECNICA.md
6. docs/GUIA_PRUEBAS_DEMO.md
7. 07_PLAN_EJECUCION/SPRINT.md §Sprint 8
8. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §2.6, §7.4 y §7.6
9. _FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md
10. _FUENTE_DESARROLLO/GLOSARIO_FLUJOS_TAXIGREEN.md
11. _FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md
12. apps/web/src/app/p/[token], apps/web/src/app/api/voucher/*, apps/web/src/app/api/comprobantes/*,
    apps/web/src/lib/supabase/*, packages/bienestar, packages/ia/prompts/clasificacion-incidencia.v1.md,
    apps/driver/src/features/location y docs/ESTADO_SPRINT_7.md

DECISIONES CERRADAS:
- S0-S7 están cerrados. No desordenes schema, seed, voucher, PDF, auditoría, /admin, /wa-sim, heurística S5,
  contrato móvil S6 ni estados/ubicación S7.
- App pasajero nativa sigue prohibida. Pasajero = link público /p/[token].
- S7 ya emite estados y `posicion` por broadcast en canal `reserva-{id}`.
- El conductor finaliza dejando la reserva en `por_liquidar`; S8 agrega experiencia pasajero, comprobante,
  calificación e incidencia simple.
- Demo = un flujo protagonista: Aeropuerto Jorge Chávez - Llegadas, Salida 3 columna F2 -> Av. Pardo 123, Miraflores.
- No implementar 9 tipologías de bienestar. Solo objeto olvidado E2E.
- No activar RLS ni crear app passenger.

ALCANCE = SOLO SPRINT 8:
Cerrar la experiencia pública del pasajero en `/p/[token]`: tracking en vivo, estados, comprobante/calificación y
una incidencia de objeto olvidado.

ENTREGABLES CORE:
1. apps/web `/p/[token]`:
   - RSC inicial valida token_pasajero y carga reserva protagonista con conductor/unidad/viaje/comprobante.
   - Cliente Realtime se suscribe a `reserva-{id}`:
     - evento `estado` actualiza timeline;
     - evento `posicion` mueve marcador del conductor.
   - UI móvil exquisita y sobria: DriverCard, VehicleCard, punto de encuentro muy prominente, timeline,
     llamadas rápidas (`tel:`) a conductor y Taxi Green.
   - Sin login, sin ruido, sin hero marketing. Es una pantalla de viaje operativa.
   - Si falta Mapbox token, degradar a ruta textual sin romper estados ni acciones.
2. Tracking:
   - Mapbox GL JS si `NEXT_PUBLIC_MAPBOX_TOKEN` existe.
   - Marcador conductor + marcador recojo + marcador destino + ruta simple.
   - ETA demo estable o calculada si Mapbox Directions se cablea sin riesgo.
3. Final de viaje:
   - Cuando estado sea `por_liquidar`/viaje `finalizado`, mostrar:
     - botón descargar comprobante PDF existente;
     - formulario breve para boleta: DNI opcional, lookup RENIEC si DNI de demo, fallback sin documento;
     - RatingTripleCard con servicio/conductor/unidad.
   - Guardar `reservas.calificacion` JSON sin crear tabla nueva.
4. Incidencia objeto olvidado:
   - `packages/bienestar`: clasificador determinista simple para texto libre -> `objeto_olvidado`, severidad baja/media.
   - `POST /api/incidencias`: valida `token_pasajero`, crea incidencia vinculada a reserva, timeline inicial auditado.
   - `/bienestar/[caso]`: página pública simple de seguimiento del caso.
   - `/admin/bienestar`: bandeja mínima de incidencias activas.
   - No construir las otras 9 tipologías.
5. App driver:
   - Si llega incidencia objeto olvidado del viaje activo, añadir pantalla/acción mínima para responder:
     "Sí encontré" / "No vi nada".
   - POST actualiza `incidencias.timeline` y emite Realtime al pasajero.
   - Si el acople driver toma demasiado, dejar endpoint + UI mínima documentada; no romper S7.
6. Seguridad:
   - `/p/[token]` no expone datos internos, hashes ni IDs innecesarios.
   - Mutaciones públicas usan token_pasajero y reserva asociada, no IDs libres sin validación.
   - Auditoría en comprobante/calificación/incidencia.
7. Tests:
   - Unit tests para clasificador bienestar.
   - Tests web para endpoint incidencia/token si aplica.
   - E2E web existente sigue verde.
   - Nuevo E2E mínimo del link pasajero si es estable en Playwright.

CRITERIOS DE ACEPTACIÓN:
- `/p/tg_demo_passenger_001` muestra conductor Raúl Quispe, unidad ABC-123, vuelo LA2456, punto "Salida 3, columna F2"
  y destino Av. Pardo 123.
- Al cambiar estados desde app conductor/API S7, `/p/[token]` refleja timeline en vivo por Realtime.
- Al recibir `posicion`, el marcador o panel de ubicación se actualiza sin refresh.
- Con viaje finalizado/por_liquidar, el pasajero puede descargar comprobante y dejar calificación triple.
- El pasajero puede reportar "olvidé una cartera/casaca" y se crea incidencia `objeto_olvidado`.
- `/admin/bienestar` muestra la incidencia.
- Sin Mapbox token, la pantalla sigue operable.
- `pnpm turbo run typecheck lint test build` verde.
- `pnpm e2e` verde.

REGLAS NO NEGOCIABLES:
- No construir app pasajero nativa.
- No reabrir OAuth/login pasajero.
- No activar background location.
- No introducir RLS ni tablas nuevas en demo.
- No reescribir voucher/PDF/RENIEC; usar lo ya construido.
- No hacer que el LLM decida bienestar: determinista primero, LLM opcional solo si queda trivial y con fallback.
- No tocar la heurística de asignación S5.

CIERRE:
- Crear docs/ESTADO_SPRINT_8.md con implementado, verificación, bugs/mejoras y pendientes reales.
- Actualizar docs/GUIA_PRUEBAS_DEMO.md con el flujo pasajero S8.
- Dejar docs/PROMPT_SPRINT_9_CODEX.md listo.
- Actualizar docs/DOCUMENTACION_TECNICA.md, docs/DEUDA_TECNICA.md, CLAUDE.md y AGENTS.md si cambia el estado operativo.
- Detenerte al terminar Sprint 8. No empieces Sprint 9.
```

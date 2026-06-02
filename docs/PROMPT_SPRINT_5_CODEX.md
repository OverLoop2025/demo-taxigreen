# Prompt Sprint 5 — Taxi Green Demo

Uso: copiar y pegar este bloque para ejecutar solo Sprint 5. No iniciar Sprint 6 sin nueva instrucción.

```text
Trabajas en el monorepo de la demo de Taxi Green, en /home/jose/dev/demo-taxigreen.
Eres full-stack senior con foco en heurísticas operativas, IA con fallback y UX de despacho. Ejecuta SOLO Sprint 5.
No empieces Sprint 6.

ANTES DE TOCAR CÓDIGO, LEE EN ESTE ORDEN:
1. CLAUDE.md
2. AGENTS.md
3. docs/ESTADO_SPRINT_4.md
4. docs/DOCUMENTACION_TECNICA.md
5. 07_PLAN_EJECUCION/SPRINT.md §Sprint 5
6. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §7.5 y reglas de asignación
7. _FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md
8. _FUENTE_DESARROLLO/GLOSARIO_FLUJOS_TAXIGREEN.md
9. _FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md
10. apps/web/src/app/admin/reservas/[id] y packages/asignacion/packages/ia actuales

DECISIONES CERRADAS:
- S0-S4 están cerrados. No desordenes schema, seed, voucher, PDF, auditoría, /admin, Realtime ni /wa-sim.
- El flujo protagonista sigue siendo recojo aeropuerto: Aeropuerto Jorge Chávez - Llegadas -> Av. Pardo 123, Miraflores.
- Humano en control: el copiloto sugiere, el operador confirma.
- La asignación separa conductor y unidad; no acoples unidad como si fuera propiedad fija de reserva.
- IA opcional: con IA_HABILITADA=false todo debe funcionar determinista.
- El LLM NO cambia la decisión de conductor/vehículo; solo redacta una explicación natural.

ALCANCE = SOLO SPRINT 5:
Construir Wow #2: sugerencia de asignación con heurística determinista + racionalización LLM opcional con fallback.

ENTREGABLES CORE:
1. packages/asignacion:
   - src/heuristica.ts: puntuarCandidatos({reserva, conductores, vehiculos}) -> candidatos ordenados con score.
   - Pesos por env con defaults: w_cola=0.5, w_distancia=0.3, w_match=0.2.
   - Score considera tiempo_en_cola_desde, distancia_mock_km o posición mock si existe, match tipo/capacidad.
   - src/sugerir.ts: sugerirAsignacionDeterminista(reservaId) -> {conductor, vehiculo, razon, score, factores}.
   - tests unitarios edge: conductor sin cola, sin vehículo, reserva con más pasajeros, empate por cola.
2. packages/ia:
   - prompts/asignacion-racional.v1.md: Haiku, máximo 2 frases peruanas naturales.
   - src/racionalizador-llm.ts: llama al proveedor para redactar razón, pero conserva conductor/vehículo deterministas.
   - export sugerirAsignacionConRazonamiento(reservaId) usando withFallback.
   - tests con provider mock: IA off, LLM ok, timeout/error -> razón determinista.
3. apps/web:
   - /api/asignacion/sugerir route handler POST {reservaId}.
   - En /admin/reservas/[id], tarjeta de sugerencia con conductor, placa/unidad, score, factores, razón y badge fuente.
   - Botón "Aceptar sugerencia" -> asigna conductor+unidad, reusa lógica existente y audita con fuente_decision.
   - Botón "Asignar otro" o flujo manual -> audita override humano con razon_original_sugerida.
   - Mantener selectores manuales existentes como fallback visible.
4. tests/e2e:
   - Crear reserva desde /wa-sim o usar una reserva necesita_revision.
   - Abrir /admin/reservas/[id], ver tarjeta de sugerencia determinista, aceptar y verificar auditoría.

REGLAS NO NEGOCIABLES:
- No crear tablas nuevas ni activar RLS.
- packages/asignacion no importa packages/ia.
- packages/ia nunca bypassa withFallback.
- Ningún prompt largo vive en código.
- LLM solo redacta, no decide.
- Override humano siempre queda auditado.
- UI debe ser sobria, clara e irresistible para despacho: densa pero legible, sin landing ni adornos innecesarios.

CRITERIOS DE ACEPTACIÓN:
- Al abrir una reserva nueva/pendiente en /admin/reservas/[id], aparece una sugerencia coherente.
- Con IA_HABILITADA=false, badge algoritmo y razón corta determinista.
- Con IA_HABILITADA=true + LLM mock/key, badge IA y párrafo natural, pero mismo conductor/unidad deterministas.
- Aceptar sugerencia asigna reserva y viaje, actualiza panel, emite Realtime/broadcast existente y audita fuente_decision.
- Asignar otro queda auditado como override humano.
- pnpm turbo run typecheck lint test build verde.
- pnpm e2e verde.

CIERRE:
- Actualiza/crea docs/ESTADO_SPRINT_5.md con implementado, verificación, bugs/mejoras y pendientes reales.
- Deja docs/PROMPT_SPRINT_6_CODEX.md listo.
- Actualiza docs/DOCUMENTACION_TECNICA.md, CLAUDE.md y AGENTS.md si cambia el estado operativo.
- Detente al terminar Sprint 5. No empieces Sprint 6.
```

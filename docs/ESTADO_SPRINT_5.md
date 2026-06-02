# Estado Sprint 5 — Taxi Green Demo

Fecha de cierre: 2026-06-01

## 1. Alcance implementado

Sprint 5 construye el Wow #2: sugerencia de asignación con heurística determinista, racionalización LLM opcional y
control humano desde `/admin/reservas/[id]`.

- `packages/asignacion`: motor determinista `puntuarCandidatos()` y `sugerirAsignacionDeterminista()`.
- Score configurable por env: `ASIGNACION_PESO_COLA`, `ASIGNACION_PESO_DISTANCIA`, `ASIGNACION_PESO_MATCH`; defaults
  `0.5 / 0.3 / 0.2`.
- El score considera cola (`tiempo_en_cola_desde`), distancia real/mock, tipo de viaje, tipo de unidad y capacidad.
- `packages/ia/src/racionalizador-llm.ts`: envuelve la sugerencia determinista con `withFallback()`. El LLM solo redacta
  la razón; no puede cambiar conductor, vehículo, score ni factores.
- `packages/ia/prompts/asignacion-racional.v1.md`: prompt Haiku, máximo dos frases naturales y sin invención.
- `apps/web/src/app/api/asignacion/sugerir/route.ts`: endpoint `POST {reservaId}` protegido por sesión operativa.
- `/admin/reservas/[id]`: tarjeta "Copiloto recomienda" con conductor, unidad, score, factores, razón y badge
  `Algoritmo`/`IA`.
- Botón "Aceptar sugerencia": asigna conductor+unidad, crea/actualiza viaje, emite broadcast Supabase y audita
  `fuente_decision`.
- Botón "Asignar otro": deja auditoría `reserva_sugerencia_override` antes de usar selectores manuales.
- `tests/e2e/asignacion-sugerencia.spec.ts`: crea reserva desde `/wa-sim`, ve tarjeta, acepta sugerencia y verifica
  auditoría.

No se crearon tablas nuevas, no se activó RLS y no se inició Sprint 6.

## 2. Decisiones técnicas

- `packages/asignacion` no importa `packages/ia`; la dependencia sigue siendo `ia -> asignacion`.
- La asignación sigue separando conductor y unidad. En demo se usa `conductores.vehiculo_id` como unidad vigente; el
  histórico N:N sigue siendo semilla MVP.
- La reserva asignada ya no recalcula otra recomendación en la UI. La tarjeta aparece para reservas en
  `necesita_revision`, `ingesta_pendiente` o `confirmada`.
- Si `IA_HABILITADA=false`, la tarjeta sale con badge `Algoritmo`, razón corta determinista y cero llamadas al LLM.
- Si `IA_HABILITADA=true`, el LLM solo sustituye el texto de `razon`; el resultado conserva IDs deterministas.
- El endpoint `/api/asignacion/sugerir` usa el `tenantId` de sesión para no cruzar datos.

## 3. Verificación ejecutada

Comandos verdes:

```bash
pnpm --filter @taxigreen/asignacion typecheck
pnpm --filter @taxigreen/asignacion lint
pnpm --filter @taxigreen/asignacion test
pnpm --filter @taxigreen/ia typecheck
pnpm --filter @taxigreen/ia lint
pnpm --filter @taxigreen/ia test
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/web lint
pnpm --filter @taxigreen/web test
pnpm --filter @taxigreen/web build
pnpm turbo run typecheck lint test build
pnpm e2e
```

Resultados:

```text
packages/asignacion tests -> 5/5
packages/ia tests -> 7/7
apps/web unit -> 5/5
pnpm turbo run typecheck lint test build -> 52/52 tasks verdes
pnpm e2e -> 5/5 verde
```

Smoke visual:

- Captura desktop de reserva pendiente con tarjeta S5 revisada: `/tmp/taxigreen-s5-pendiente.png`.
- Captura desktop post-aceptación revisada: se corrigió para no recalcular sugerencias en reservas ya asignadas.
- No se observaron solapes ni textos críticos fuera de contenedor.

DB tras E2E:

- El E2E creó 11 reservas temporales `TG-WA-*` durante las iteraciones de verificación.
- Se borraron esas reservas temporales y su auditoría asociada.
- Se ejecutó `pnpm --filter @taxigreen/database db:seed` para restaurar la reserva protagonista.

## 4. Bugs / mejoras encontradas durante cierre

- La primera versión recalculaba una nueva sugerencia después de aceptar una asignación. Se corrigió: la tarjeta solo
  aparece mientras la reserva necesita decisión.
- El E2E validaba `reserva_asignada` dentro del detalle inmediatamente después de aceptar; esa zona puede refrescar
  después que el panel. Se robusteció: la prueba valida el evento en `/admin/auditoria`, que es la pantalla natural de
  auditoría.
- La acción de aceptación puede tardar algunos segundos por el broadcast Supabase server-side. El E2E usa timeout
  explícito de 20s en esa transición.
- Microcopy visual: se compactó el factor de cola (`308m` en lugar de `308 min`) para evitar salto incómodo en tarjetas
  estrechas.

## 5. Pendientes reales / riesgos

- No se probó una llamada Anthropic real. No bloquea S5: los tests cubren IA off, LLM ok con provider mock y
  error/timeout con fallback.
- La distancia usa GPS real si hay posición de conductor; si no existe, usa mock determinista estable. Mapbox/ETA real
  queda para sprints posteriores.
- El envío a conductor aún es solo broadcast Supabase existente. Push y app conductor entran en Sprint 6.
- El algoritmo no gestiona histórico N:N de unidades; para demo se respeta `conductores.vehiculo_id`. La tabla
  `asignaciones_unidad` sigue marcada como semilla MVP, no demo.

## 6. Handoff a Sprint 6

Sprint 6 debe empezar desde `docs/PROMPT_SPRINT_6_CODEX.md`.

Reglas que no se deben romper:

- S5 deja la decisión de conductor/unidad en `packages/asignacion`; la app conductor no debe redecidir.
- Al aceptar desde `/admin`, ya existe broadcast `reserva-{id}` con evento `asignacion`; S6 puede escucharlo desde Expo.
- `usuarios.fcm_token` ya existe en schema desde S1; S6 debe reutilizarlo para registrar Expo/FCM token.
- `ANTHROPIC_API_KEY` sigue siendo opcional. La demo debe correr con `IA_HABILITADA=false`.
- No avanzar a S7 sin `pnpm turbo run typecheck lint test build`, `pnpm e2e` y smoke manual en Android/Expo.

## 7. Auditoría de cierre (2026-06-01, revisión post-Codex)

Auditoría estricta de S5: lectura completa del motor de scoring, racionalizador, mutaciones auditadas, card y
endpoint, **más introspección empírica del motor contra la DB sembrada** (no solo lectura). Resultado: **S5
cerrado**, con **1 bug sustantivo corregido**. CI `pnpm turbo run typecheck lint test build` → **52/52 verde**;
`pnpm e2e` → **5/5 verde** (incluye `asignacion-sugerencia`); endpoint sin sesión → **401**.

### 7.1. 🐞 Bug sustantivo corregido — saturación del `colaScore` rompía "cola, no cercanía pura"

`puntuarCandidatos` normalizaba la cola con `Math.min(minutos / 60, 1)`. Ese **tope satura**: dos conductores
que esperan 65 y 74 min obtienen ambos `colaScore = 1.0` (empate), y el desempate lo gana un factor secundario
(match de unidad / distancia). **Probado empíricamente contra la DB:** con la cola envejecida, el motor
recomendaba a **Ana Salazar (65 min, #2 en cola, camioneta)** sobre **Pedro Morales (74 min, #1 en cola,
minivan)** — es decir, recomendaba al **#2 mostrando "Cola #2"** mientras existía un **#1**. Eso contradice la
regla rectora `CLAUDE.md §4.2` ("cola de conductores, no cercanía pura") en cuanto las esperas superan 60 min,
algo **normal en un aeropuerto** y alcanzable con pocos minutos de demora tras el reseed.

**Fix** (`packages/asignacion/src/heuristica.ts`): `colaScore = minutos / maxMinutos` (normalizado por la espera
máxima de la cola actual, sin tope). Es monótono, mantiene la cola como factor dominante (el que más espera
siempre obtiene 1.0) y el score sigue acotado a 100. Fiel a `w1·tiempo_en_cola` del CLAUDE.md (el tope fijo era un
detalle de implementación no especificado). **Verificado post-fix:** el motor ahora recomienda a **Pedro Morales
(#1 en cola, score 73)**. Se añadió test de regresión `mantiene la prioridad de cola sin saturar cuando ambas
esperas superan 60 min` (paquete `asignacion`: 5 → **6 tests**), que falla con el código viejo y pasa con el nuevo.
No cambia el resultado en una cola "fresca" (9–54 min); solo corrige el rango >60 min.

### 7.2. Lo que verifiqué que SÍ está correcto (no se tocó)

- **Disponibilidad:** el filtro excluye conductores con viaje activo en **otra** reserva (`reserva_id: { not }`),
  e incluye al que ya está en la reserva actual. Correcto.
- **Scoping multi-tenant:** página y endpoint pasan `tenantId` de sesión; introspección con tenant inexistente →
  `null`. Sin fuga cross-tenant en la práctica.
- **LLM solo redacta:** `racionalizador-llm` con `fuente='llm'` solo cambia `razon`; conductor, unidad, score y
  factores se conservan (tests lo bloquean). Fallback por error/timeout/flag-off → razón determinista.
- **Auditoría:** aceptar audita `reserva_asignada` con `fuente_decision` + `sugerencia_copiloto`; "Asignar otro"
  audita `reserva_sugerencia_override`. La card incrusta los IDs sugeridos en campos ocultos, así que **se asigna
  exactamente lo mostrado** (no hay recálculo entre ver y aceptar).
- **Endpoint** `POST /api/asignacion/sugerir` protegido por sesión + rol (401 sin sesión).
- La card no aparece para reservas ya `asignada` (no recalcula sobre asignadas).

### 7.3. Observaciones menores (no bloquean, documentadas en `DEUDA_TECNICA.md`)

- `POST /api/asignacion/sugerir` existe, está gateado y funciona, pero la **UI calcula la sugerencia en el RSC**
  (server-side); la card no consume ese endpoint. Queda como superficie para uso futuro/externo, no es código muerto
  peligroso.
- `aceptarSugerenciaAsignacion` guarda en auditoría el `score`/`razon`/`factores` **provenientes del cliente**
  (campos ocultos). El conductor y la unidad **sí** se validan contra el tenant; la metadata de auditoría confía en
  el operador (modelo "humano en control"). Para MVP endurecible recomputando server-side al aceptar.
- La carga de prompts `.md` bajo bundling de Next (riesgo IA-on documentado en S4) **también** cubre
  `asignacion-racional.v1.md`; degrada a razón determinista, no crashea.

DB dejada en baseline canónico: reservas `TG-WA-*` del E2E borradas (2), auditoría purgada a solo `seed_sprint_1`
(50 → 1), reseed idempotente. Servidor apagado (puerto 3000 libre).

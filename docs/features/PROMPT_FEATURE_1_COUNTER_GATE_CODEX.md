# PROMPT Feature 1 — Gate de counter y estado de abordaje (Codex)

Copia desde aquí hasta el final en una sesión nueva de Codex, con el repo `demo-taxigreen` como cwd.

---

Actúa como ingeniero senior full-stack del monorepo `demo-taxigreen` (Turborepo + pnpm, TypeScript
strict + noUncheckedIndexedAccess, Next.js 15.4 App Router, Prisma 6 + PostgreSQL/Supabase, app
conductor React Native + Expo SDK 51). Idioma: español con acentos correctos en comentarios y
microcopy. Commits solo si el usuario lo pide.

## Misión

Implementar **Feature 1 del plan maestro** `docs/features/MASTER_FLUJO_OPERACIONAL_PERFECTO.md`
(léelo COMPLETO antes de tocar código; este prompt lo resume pero el master manda):

> El conductor de un `recojo_aeropuerto` NO puede iniciar la ruta hasta que el counter valide el
> pase QR del pasajero. Esa validación se persiste como estado de negocio en `reservas` (no solo en
> auditoría) y dispara una "luz verde" en tiempo real a la app del conductor. Un
> `traslado_aeropuerto` o `city` jamás se bloquea.

## Lecturas obligatorias antes de empezar

- `docs/features/MASTER_FLUJO_OPERACIONAL_PERFECTO.md` (§3, §4, §5, §6 Feature 1)
- `packages/database/prisma/schema.prisma`
- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts`
- `apps/web/src/app/api/voucher/[id]/verify/route.ts`
- `apps/web/src/lib/conductor-asignacion.ts` y `conductor-asignacion-repository.ts`
- `apps/web/src/lib/supabase/server.ts`
- `apps/driver/src/features/assignment/{types,transitions,client}.ts`
- `apps/driver/src/features/realtime/index.tsx`
- `apps/driver/app/(auth)/asignacion/[id].tsx` y `home.tsx`
- `apps/web/src/app/counter/voucher-validator.tsx`
- `packages/database/prisma/{seed.ts,seed-guion.ts}`
- `tests/e2e/{counter-qr,wa-sim,admin-asignacion}.spec.ts`

## NO tocar

- El mecanismo one-time del voucher (auditoría `voucher_qr_consumido` + advisory lock): se CONSERVA;
  solo se le añade persistencia en la misma transacción.
- La heurística de asignación, el copiloto wa-sim, el mapa del conductor, el plugin Figma.
- La secuencia `asignado→en_camino→en_punto→a_bordo→finalizado` (solo se le antepone el gate).
- `voucher_codigo` en DB (no renombrar).

## Tareas (en orden)

### 1. Migración Prisma

En `packages/database/prisma/schema.prisma`:

```prisma
enum EstadoAbordaje {
  no_requerido
  pendiente_validacion
  autorizado
}
```

En `model reservas` añade:

```prisma
estado_abordaje     EstadoAbordaje @default(no_requerido)
counter_validado_en DateTime?
counter_usuario_id  String?
```

Crea la migración (`pnpm --filter @taxigreen/database exec prisma migrate dev --name feature1_estado_abordaje`)
e INCLUYE en su SQL el backfill exacto del master §4.1:

```sql
UPDATE reservas r SET estado_abordaje='autorizado', counter_validado_en=now()
WHERE r.tipo_viaje='recojo_aeropuerto' AND EXISTS (
  SELECT 1 FROM viajes v WHERE v.reserva_id=r.id AND v.deleted_at IS NULL
    AND v.estado IN ('en_camino','en_punto','a_bordo','finalizado'));
UPDATE reservas SET estado_abordaje='pendiente_validacion'
WHERE tipo_viaje='recojo_aeropuerto' AND estado_abordaje='no_requerido';
```

### 2. Helpers de dominio + unit tests

En `apps/web/src/lib/conductor-asignacion.ts` añade `requiereCounter(tipoViaje)` y
`puedeIniciarRuta({tipoViaje, estadoAbordaje})` EXACTAMENTE como el master §5.1. Tests en
`apps/web/src/lib/conductor-asignacion.test.ts` (ya existe; ampliar):

- recojo + pendiente_validacion → `{ok:false, motivo:'counter_pendiente'}`
- recojo + autorizado → ok
- traslado_aeropuerto + no_requerido → ok
- city + no_requerido → ok

### 3. Creación de reservas: estado inicial

Helper `estadoAbordajeInicial(tipoViaje)` (recojo → `pendiente_validacion`; resto → `no_requerido`)
usado por:

- `apps/web/src/app/wa-sim/actions.ts` → `crearReservaDesdeIngesta` (añadir el campo al `create`).
- `packages/database/prisma/seed.ts` → la reserva protagonista queda `pendiente_validacion`.
- `packages/database/prisma/seed-guion.ts` → al forzar `en_camino`, setear TAMBIÉN
  `estado_abordaje='autorizado'` + `counter_validado_en` (si va en camino, el counter ya pasó).

### 4. Gate en la transición del conductor

`apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts`:

- Añade `tipo_viaje: true, estado_abordaje: true` al `select` de la transacción.
- Tras `validarTransicionViaje` y solo cuando `estadoNuevo === EstadoViaje.en_camino`, evalúa
  `puedeIniciarRuta`. Si falla, devuelve nueva rama:

```ts
return { kind: 'counter_pendiente' as const, estadoAbordaje: reserva.estado_abordaje };
// → HTTP 409 { error: 'counter_pendiente', estado_abordaje } fuera de la tx
```

- Audita el intento bloqueado: `action: 'driver_inicio_bloqueado_counter'` (payload: reserva_id,
  estado_abordaje).

### 5. Verify del counter persiste el abordaje

`apps/web/src/app/api/voucher/[id]/verify/route.ts`, branch `consume:true`, dentro de la
transacción existente (tras crear la fila de auditoría `voucher_qr_consumido`):

- `tx.reservas.update({ estado_abordaje:'autorizado', counter_validado_en: now, counter_usuario_id: session.user.id })`.
- **ELIMINA** el bloque que muta `confirmada → asignada` (líneas ~131-136). Es dominio del despacho.
- Audita `abordaje_autorizado`.
- Post-transacción: emite los broadcasts nuevos (tarea 6); para eso el `findReservaByPublicId` ya
  trae `conductor_id` (verifica; si no, añade el select).
- Amplía la respuesta (en `consume:true` Y en `consume:false`) con
  `estado_abordaje` y `conductor: {nombre, placa} | null` (join a `conductores→usuario,vehiculo`).
  Deja `pago: null` ya tipado (Feature 2 lo llenará; el contrato nace estable — master §5.3).

### 6. Broadcasts `abordaje`

`apps/web/src/lib/supabase/server.ts`, siguiendo el patrón de las funciones existentes:

- `broadcastReservaAbordaje({reservaId, counterValidadoEn})` → canal `reserva-{id}`, evento `abordaje`.
- `broadcastConductorAbordaje({conductorId, reservaId, counterValidadoEn})` → canal `conductor-{id}`,
  evento `abordaje`. Solo se emite si la reserva tiene conductor (independencia de orden, master C3).

### 7. Contrato y app del conductor

- `apps/web/src/lib/conductor-asignacion.ts`: el serializer añade
  `abordaje: { requiereCounter, autorizado, counterValidadoEn }` (master §5.5); el repositorio
  (`conductor-asignacion-repository.ts`) añade `tipo_viaje/estado_abordaje/counter_validado_en` a los
  selects (asignación E historial).
- `apps/driver/src/features/assignment/types.ts`: añade el campo `abordaje`.
- `apps/driver/src/features/assignment/transitions.ts`: `getNextTripAction` recibe el abordaje; si
  `estado==='asignado'` y `abordaje.requiereCounter && !abordaje.autorizado`, devuelve acción
  bloqueada `{ bloqueada: true, label: 'Esperando counter', helper: 'El pasajero validará su pase al llegar.' }`.
- `apps/driver/app/(auth)/asignacion/[id].tsx`: con acción bloqueada, el CTA se muestra deshabilitado
  con esa etiqueta y el banner dice "Esperando validación del counter". NADA de jerga.
- `apps/driver/src/features/realtime/index.tsx`: el canal `conductor-{id}` añade
  `.on('broadcast', { event: 'abordaje' }, ...)` → expone `lastAbordaje` (timestamp) en el contexto;
  `home.tsx` y `asignacion/[id].tsx` refrescan al recibirlo (mismo patrón refetch-on-broadcast que ya
  usa `lastAssignment`). **DoD: el CTA se habilita sin reiniciar la app.**
- `home.tsx`: si el viaje activo está bloqueado, el card dice "Esperando counter" en vez de "Empezar".

### 8. Counter UI mínima (luz verde)

`apps/web/src/app/counter/voucher-validator.tsx`:

- En `ready`: muestra además conductor/unidad si la respuesta los trae, o "Falta asignar conductor".
- En `consumed`: "Acceso confirmado · Luz verde enviada al conductor" (con conductor) o "Acceso
  confirmado · El conductor recibirá la luz verde al ser asignado" (sin conductor). Conserva "Este
  pase ya no puede usarse otra vez".

### 9. Seed operacional nuevo

`packages/database/package.json`: script `db:seed-operacional` → nuevo
`prisma/seed-operacional.ts` que parte del seed base y deja la protagonista en
`asignada / viaje asignado / pendiente_validacion` (A bloqueada lista para demo del gate). No toques
`db:seed-guion` más allá de la tarea 3.

### 10. Tests

- Unit (tarea 2) + test del serializer con `abordaje`.
- API (`apps/web/src/app/api/...` tests con el patrón mock-prisma del repo —ver
  `conductor-asignacion-repository.test.ts`—): transición `en_camino` con `pendiente_validacion` →
  409 `counter_pendiente`; con `autorizado` → ok; `traslado_aeropuerto` → ok sin counter.
- E2E nuevo `tests/e2e/counter-gate.spec.ts` AUTO-CONTENIDO (master C7 — prohibido tocar
  `TG-2026-0001`): 1) admin crea reserva recojo vía wa-sim (patrón `wa-sim.spec.ts`: extraer →
  "Confirmar y avisar al cliente"); 2) "Abrir en despacho" → asignar conductor **Raúl Quispe** +
  unidad (patrón `admin-asignacion.spec.ts`); 3) login conductor API
  (`conductor1@taxigreen.demo`/PIN `1234`) → `POST /api/conductor/asignacion/{id}/estado`
  `en_camino` → espera **409 counter_pendiente**; 4) counter (login `counter@taxigreen.demo`) → GET
  QR → header `x-voucher-token` → POST verify `consume:true` → 200; 5) repetir la transición → 200 y
  `asignacion.abordaje.autorizado === true`.
- Actualiza specs existentes SOLO si el cambio de respuesta del verify los rompe (verificar
  `counter-qr.spec.ts` — no asserta la mutación `confirmada→asignada`, debería pasar intacto).

## Verificación final obligatoria

```bash
pnpm turbo run typecheck lint test build
pnpm --filter @taxigreen/database db:seed-guion
pnpm exec playwright test --config tests/e2e/playwright.config.ts --workers=1
pnpm --filter @taxigreen/database db:seed-guion
pnpm exec playwright test tests/e2e/voucher-flow.spec.ts --config tests/e2e/playwright.config.ts
pnpm --filter @taxigreen/driver exec tsc --noEmit && pnpm --filter @taxigreen/driver lint
pnpm --filter @taxigreen/driver exec expo export --platform android
```

Smoke manual documentado: con `db:seed-operacional`, app conductor muestra "Esperando counter" con
CTA bloqueado; validar QR en `/counter`; el CTA se habilita sin reiniciar (capturas).

## DoD

- [ ] `recojo_aeropuerto` sin counter → 409 server-side y CTA bloqueado en la app.
- [ ] Tras validar el pase, el conductor queda habilitado SIN reiniciar (broadcast `abordaje`).
- [ ] Counter muestra luz verde / falta-conductor según corresponda.
- [ ] `traslado_aeropuerto` y `city` nunca se bloquean.
- [ ] Counter antes de asignación: al asignar después, la asignación nace habilitada.
- [ ] `seed-guion` sigue dejando la demo visual operativa (viaje en curso NO bloqueado).
- [ ] Todo verde (comandos de arriba) + smoke con capturas.

## Cierre

Escribe `docs/features/ESTADO_FEATURE_1.md` (plantilla en master §9), actualiza
`docs/DOCUMENTACION_TECNICA.md` (contrato conductor + verify) y revisa/ajusta
`docs/features/PROMPT_FEATURE_2_PAGO_DEMO_CODEX.md` con lo aprendido. No hagas commit salvo pedido
explícito del usuario.

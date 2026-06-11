# PROMPT Feature 4 — Escenarios A/B end-to-end y pulido de counter/copy (Codex)

> Prerrequisito: Features 1-3 cerradas y CI verde. Lee sus `ESTADO_FEATURE_*.md`: si algún contrato
> difiere del master, el código real + master mandan sobre este prompt.

---

Actúa como ingeniero senior full-stack + diseñador de producto del monorepo `demo-taxigreen`
(stack y reglas en `CLAUDE.md`; regla rectora del frontend: si una pantalla necesita explicación,
está mal). Idioma: español con acentos. Commits solo si el usuario lo pide.

## Misión

Implementar **Feature 4 del plan maestro** `docs/features/MASTER_FLUJO_OPERACIONAL_PERFECTO.md`
(§3.2, §6 Feature 4):

> Los dos escenarios del negocio quedan demo-ables de punta a punta y sin contaminarse:
> **A** (aeropuerto → ciudad, con counter y luz verde) y **B** (hotel/punto externo → aeropuerto,
> SIN counter, conductor inicia de inmediato, enlace en vivo directo). Hoy B ni siquiera existe como
> dato canónico: `seed.ts` crea una sola reserva (la protagonista A).

## Lecturas obligatorias

- `docs/features/MASTER_FLUJO_OPERACIONAL_PERFECTO.md` (§3.2 tabla A vs B) + estados F1-F3
- `apps/web/src/app/wa-sim/{conversaciones-seed.ts,whatsapp-simulator.tsx,actions.ts}`
- `packages/ingesta/src/extractor.ts` (detección en líneas ~109-117: default = recojo) y
  `extractor.test.ts`
- `packages/database/prisma/{seed.ts,seed-operacional.ts}`
- `apps/driver/app/(auth)/{home.tsx,asignacion/[id].tsx}` + `transitions.ts`
- `apps/web/src/app/admin/reservas/[id]/{page.tsx,reserva-detalle.tsx}`
- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`
- `apps/web/src/app/counter/voucher-validator.tsx`

## NO tocar

- El gate de F1, el pago de F2, el cierre de F3 (solo se consumen).
- La heurística del extractor más allá de tests/documentación (el default `recojo_aeropuerto` se
  DOCUMENTA, no se cambia: es el sesgo correcto para el negocio).

## Tareas (en orden)

### 1. Datos canónicos del escenario B

- `conversaciones-seed.ts`: la conversación "ACME Perú" ya es un traslado; añade una tercera
  conversación B de hotel: "Hotel Costa Verde: llevar al aeropuerto al huésped Camila Rojas mañana
  18:30, vuelo LA640, recojo en el lobby (Av. Malecón 200, Miraflores), pago con voucher del hotel,
  tel +51 911 555 333". Verifica que el extractor la clasifica `traslado_aeropuerto` (test).
- `seed.ts` + `seed-operacional.ts`: reserva B canónica persistida
  (`traslado_aeropuerto`, San Isidro/lobby → `Aeropuerto Jorge Chávez - Llegadas`, `voucher_hotel` o
  `factura_empresa`, `estado_abordaje=no_requerido`, con cotización y pago autorizado de F2,
  asignada a un conductor DISTINTO del protagonista para poder demostrar A y B en paralelo).

### 2. Ingesta: tests explícitos A vs B

`extractor.test.ts`: casos "recoger en el Jorge Chávez" → `recojo_aeropuerto`; "llevar al
aeropuerto" / "traslado al aeropuerto desde San Isidro" → `traslado_aeropuerto`; texto ambiguo →
`recojo_aeropuerto` (default DOCUMENTADO con comentario en el test).

### 3. wa-sim: F5 condicionado por `requiereCounter`

En `whatsapp-simulator.tsx` (+ lo que el action deba exponer, p. ej. `tipo_viaje` en el retorno de
`crearReservaDesdeIngesta`):

- **A (requiere counter)**: comportamiento F5 actual intacto — tarjeta con pase QR, enlace en vivo
  SOLO tras validación (polling).
- **B (no requiere counter)**: la tarjeta de confirmación NO presenta el QR como requisito de
  abordaje; incluye el botón "Seguir mi taxi en vivo" DIRECTAMENTE (sin polling) y el texto cambia a
  "Tu conductor va en camino al punto de recojo". El panel del operador refleja "No requiere
  counter".

### 4. Driver: banners por escenario

Con los datos de F1 (`abordaje.requiereCounter`):

- A bloqueado: "Esperando validación del counter" (ya de F1).
- B: home y pantalla de viaje dicen "Listo para ir al punto de recojo" y el CTA es inmediato
  (verificar que NINGÚN copy de counter aparece en B).

### 5. Admin + pasajero

- Admin: chip "Requiere counter" / "Sin counter" en el detalle (y en la lista si hay columna de tipo).
- Pasajero (opcional pero recomendado): suscripción al evento `abordaje` en `reserva-{id}` para
  mostrar "Pase validado ✓" en vivo en escenario A.

### 6. Barrido final de copy (cierre de la antigua Feature 6)

Grep de superficies visibles (NUNCA identificadores/enums/columnas/tests):

- "voucher" visible solo cuando hable del método `voucher_hotel` ("Cargo al hotel").
- El QR siempre es "pase de abordaje"; el código TG-… siempre es "Reserva".
- Counter: "Validar pasajero / Confirmar acceso / Luz verde".
- Sin "ETA/Realtime/token/HMAC/idempotente" en UI (auditar lo nuevo de F1-F3).

### 7. Tests

- E2E nuevo `tests/e2e/escenario-b.spec.ts` AUTO-CONTENIDO: crear B vía wa-sim (conversación nueva)
  → confirmar → la tarjeta trae enlace en vivo directo (sin counter) → asignar conductor →
  `POST estado en_camino` → **200 a la primera** (sin 409) → finalizar → pago cerrado según F3.
- E2E A (`counter-gate.spec.ts` de F1) sigue verde sin cambios.
- Unit de ingesta (tarea 2).

## Verificación final obligatoria

Batería completa del master §7 + smoke manual de las DOS demos con `db:seed-operacional`:
A bloqueada → counter → luz verde → viaje → cierre; B directa → viaje → cierre. Capturas de driver
(banners A y B), wa-sim (tarjetas A y B), counter y pasajero.

## DoD

- [ ] Demo A y demo B ejecutables de punta a punta desde `db:seed-operacional`.
- [ ] B jamás muestra counter/pase como requisito (chat, driver, admin, pasajero).
- [ ] A conserva intacto el flujo F5 + gate F1.
- [ ] Ingesta con tests A/B y default documentado.
- [ ] Copy sin "voucher" fuera de `voucher_hotel`; cero jerga nueva.
- [ ] Todo verde + smoke con capturas.

## Cierre

`docs/features/ESTADO_FEATURE_4.md` + actualizar `docs/DOCUMENTACION_TECNICA.md` y
`docs/GUIA_PRUEBAS_DEMO.md` (guion de las dos demos). Con esto el plan maestro queda completo:
reserva → cotización/pago → pase → asignación bloqueada → counter → luz verde → viaje → cierre →
comprobante, en sus dos escenarios.

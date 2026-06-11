# Prompt para Favle / Claude — Revision del Plan de Flujo Operacional Perfecto

Usa este prompt con Claude/Favle para que revise el plan creado por Codex, lo refine y produzca el documento maestro final con prompts de implementacion por feature.

---

## Prompt

Actua como arquitecto senior full-stack/producto para el repo `demo-taxigreen`.

Necesito que revises y mejores el documento:

```text
docs/features/PLAN_FLUJO_OPERACIONAL_PERFECTO.md
```

Contexto obligatorio:

- Estado actual implementado: `docs/ESTADO_SPRINT_9.md`
- Documentacion tecnica: `docs/DOCUMENTACION_TECNICA.md`
- Plan frontend actual: `docs/PLAN_RENOVACION_FRONTEND_PREMIUM.md`
- Fuente de verdad historica:
  - `_FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md`
  - `_FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md`
  - `06_DEMO_TECNICA/FLUJO_NEGOCIO_CANONICO.md`
  - `07_PLAN_EJECUCION/LOGICA_NEGOCIO_OPERATIVA.md`

Problema a resolver:

El sistema actual tiene piezas funcionales separadas, pero el flujo operacional todavia permite saltarse pasos:

- El counter valida QR, pero esa validacion vive principalmente en auditoria.
- El conductor puede iniciar con una reserva asignada aunque el counter no haya validado el QR.
- `tipo_pago` existe, pero no hay pasarela demo, `pagos`, `estado_pago`, autorizacion ni captura.
- El comprobante PDF existe, pero no esta encadenado a cierre financiero.
- `recojo_aeropuerto` y `traslado_aeropuerto` existen, pero no tienen reglas de UX/operacion claramente separadas.

Tu tarea:

1. Lee el plan de Codex completo.
2. Contrasta sus propuestas con el codigo real actual del repo.
3. Corrige cualquier decision que te parezca riesgosa, redundante o mal secuenciada.
4. Produce un documento maestro final en:

```text
docs/features/MASTER_FLUJO_OPERACIONAL_PERFECTO.md
```

5. Ese documento maestro debe incluir:

- Veredicto definitivo.
- Flujo perfecto final para:
  - Escenario A: llegada internacional / aeropuerto -> ciudad.
  - Escenario B: hotel o punto externo -> aeropuerto.
- Modelo de datos final propuesto.
- Contrato de API final por feature.
- Contrato movil final para app conductor.
- Contrato web final para admin, counter, wa-sim y passenger link.
- Secuencia de PRs/features en orden.
- Para cada feature:
  - objetivo
  - archivos a tocar
  - riesgos
  - pruebas obligatorias
  - DoD
  - prompt exacto para Codex
  - formato de reporte `ESTADO_FEATURE_X.md`
  - prompt siguiente `PROMPT_FEATURE_X+1_CODEX.md`

6. Tambien crea los prompts iniciales para Codex:

```text
docs/features/PROMPT_FEATURE_1_COUNTER_GATE_CODEX.md
docs/features/PROMPT_FEATURE_2_PAGO_DEMO_CODEX.md
docs/features/PROMPT_FEATURE_3_CIERRE_PAGO_COMPROBANTE_CODEX.md
docs/features/PROMPT_FEATURE_4_ESCENARIOS_CODEX.md
```

Reglas:

- No implementes codigo en esta pasada. Solo documentacion.
- No cambies comportamiento del producto.
- Se quirurgico: cada feature debe poder implementarse sin romper los logros S1-S9/F5/F12.
- Mantener determinista primero. LLM opcional.
- No sobrecargar auditoria como estado de negocio.
- No usar `comprobantes` como sustituto de pago.
- No confundir `voucher_hotel` con el QR de abordaje.
- Si propones agregar `pagos`, justifica por que vale romper el conteo historico de 10 tablas.
- Si propones alternativa sin tabla `pagos`, explica tradeoff y por que la descartas o aceptas.
- Si decides bloquear `asignado -> en_camino` o `en_punto -> a_bordo`, justificalo con experiencia operacional.
- Respeta que `traslado_aeropuerto` no debe requerir counter al inicio.

Archivos que debes inspeccionar minimo:

```text
packages/database/prisma/schema.prisma
packages/database/prisma/migrations/20260531000000_sprint1_initial/migration.sql
packages/database/prisma/seed.ts
packages/database/prisma/seed-guion.ts

apps/web/src/app/wa-sim/actions.ts
apps/web/src/app/wa-sim/whatsapp-simulator.tsx
apps/web/src/app/wa-sim/conversaciones-seed.ts
apps/web/src/app/api/ingesta/extraer/route.ts
packages/ingesta/src/types.ts
packages/ingesta/src/extractor.ts
packages/ingesta/src/diccionarios/pagos-keywords.ts

apps/web/src/app/api/voucher/[id]/qr/route.ts
apps/web/src/app/api/voucher/[id]/verify/route.ts
apps/web/src/app/counter/page.tsx
apps/web/src/app/counter/voucher-validator.tsx
packages/voucher/src/sign.ts
packages/voucher/src/qr.ts

apps/web/src/app/admin/reservas/[id]/actions.ts
apps/web/src/app/admin/reservas/[id]/page.tsx
apps/web/src/app/admin/reservas/[id]/reserva-detalle.tsx
apps/web/src/lib/admin/reservas.ts

apps/web/src/app/api/conductor/asignacion/[id]/route.ts
apps/web/src/app/api/conductor/asignacion/activa/route.ts
apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts
apps/web/src/app/api/conductor/viajes/route.ts
apps/web/src/lib/conductor-asignacion.ts
apps/web/src/lib/conductor-asignacion-repository.ts
apps/driver/src/features/assignment/types.ts
apps/driver/src/features/assignment/client.ts
apps/driver/src/features/assignment/transitions.ts
apps/driver/app/(auth)/home.tsx
apps/driver/app/(auth)/asignacion/[id].tsx

apps/web/src/lib/pasajero.ts
apps/web/src/app/p/[token]/seguimiento-cliente.tsx
apps/web/src/app/api/pasajero/[token]/route.ts
apps/web/src/app/api/pasajero/[token]/comprobante/route.ts
apps/web/src/app/api/pasajero/[token]/comprobante/pdf/route.ts
apps/web/src/app/api/comprobantes/[id]/pdf/route.ts
apps/web/src/lib/comprobantes.ts

apps/web/src/lib/supabase/server.ts
apps/web/src/lib/push.ts

tests/e2e/wa-sim.spec.ts
tests/e2e/counter-qr.spec.ts
tests/e2e/voucher-flow.spec.ts
tests/e2e/admin-asignacion.spec.ts
tests/e2e/asignacion-sugerencia.spec.ts
tests/e2e/passenger-link.spec.ts
```

Resultado esperado:

Quiero un plan final que permita enviar prompts a Codex uno por uno, como se hizo con los sprints originales. Cada prompt debe ser preciso, verificable y con alcance cerrado. El objetivo no es "hacer mas pantallas", sino cerrar la secuencia operacional:

```text
reserva -> cotizacion/pago demo -> pase QR -> asignacion bloqueada -> counter valida -> conductor habilitado -> viaje -> cierre pago -> comprobante
```

Devuelve al final un veredicto:

- "GO para Feature 1" si tu revision confirma que el primer PR debe ser counter gate.
- O "Reordenar: primero X" si encuentras que otra dependencia debe ir antes.

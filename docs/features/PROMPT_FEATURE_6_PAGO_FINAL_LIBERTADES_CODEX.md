# PROMPT Feature 6 — Pago al finalizar + libertades del pasajero (Codex)

> Prerrequisito: Feature 5 cerrada y verificada (`ESTADO_FEATURE_5.md`). Fuente de verdad:
> `docs/features/MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md` (§5.3, §7, §10-F6) y el código real post-F5.
> Si este prompt difiere del master o del estado F5, manda el código real + master.

---

Actúa como ingeniero senior full-stack + diseñador de producto del monorepo `demo-taxigreen`.
Stack, comandos y límites en `CLAUDE.md`. Idioma: español con acentos. No hagas commits salvo pedido explícito.

## Misión

Implementar Feature 6: el pasajero independiente **paga al finalizar**, no al reservar, y recupera libertad
operativa para cancelar según etapa. La base semántica ya existe en F5:

- `perfil_pasajero` dice quién viaja.
- `responsable_pago` dice quién cubre este servicio.
- `tipo_pago` sigue siendo método.
- `requiere_factura` pertenece al comprobante, no al perfil.

La regla de producto es simple:

- `responsable_pago=pasajero`: al finalizar el viaje queda `por_cobrar`; `/p/[token]` ofrece pagar ahora
  o confirmar efectivo.
- `responsable_pago=empresa|hotel`: nunca hay botón de pago para pasajero; al finalizar queda `por_liquidar`.

## Lecturas obligatorias

- `docs/features/MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md`: §5.3, §7.1, §7.2, §7.3 y §10-F6.
- `docs/features/ESTADO_FEATURE_5.md`: decisiones, bugs y verificación F5.
- `packages/pagos/src/index.ts`: `cerrarPagoDemo`, `autorizarPagoDemo`, serialización y tests.
- `apps/web/src/lib/pasajero.ts` y `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`.
- `apps/web/src/app/api/conductor/asignacion/[id]/estado/route.ts`: cierre financiero actual.
- `apps/web/src/lib/comprobantes.ts` + `apps/web/src/app/api/pasajero/[token]/comprobante/route.ts`.
- `apps/web/src/lib/conductor-asignacion.ts` y app driver para copy de cobro.
- `packages/database/prisma/schema.prisma`, seeds y `seed-operacional`.

Usa context7 si necesitas documentación actual de Next Server Actions/Route Handlers/Prisma; usa shadcn MCP si tocas
componentes UI nuevos. No instales componentes por impulso: primero revisa patrones locales.

## NO tocar

- No renombrar `tipo_pago`, `perfil_pasajero` ni `responsable_pago`.
- No cambiar el gate F1 ni el contrato A/B F4.
- No implementar cancelación del conductor ni reasignación con disculpas: eso es F7.
- No implementar modo guiado con menús: eso es F8.
- No agregar pasarela real, SUNAT real, Yape/Plin real ni penalidades.
- No crear tablas nuevas salvo que encuentres un bloqueo demostrable. F6 debe caber en el modelo F5/F2/F3.

## Tareas

### 1. Ajustar cierre financiero por responsable

En `@taxigreen/pagos`:

- `cerrarPagoDemo({ reservaId, now }, tx)` debe leer la reserva con `responsable_pago` y `tipo_pago`.
- Si `responsable_pago=hotel|empresa`: mantener comportamiento actual `por_liquidar`.
- Si `responsable_pago=pasajero` y `tipo_pago=app_pago|efectivo`: cambiar a `por_cobrar`, no `capturado`.
- Mantener idempotencia: si ya está `capturado` o `por_liquidar`, no retroceder.
- Auditar payload claro desde el route de conductor: `responsable_pago`, `estado_anterior`, `estado_nuevo`,
  `requiere_accion_pasajero`.

Tests obligatorios:

- app/efectivo + pasajero -> `por_cobrar`.
- voucher/factura + hotel/empresa -> `por_liquidar`.
- cierre repetido no duplica ni retrocede.
- legacy sin `responsable_pago` imposible post-F5, pero si llega null/undefined por mock debe fail-safe a pasajero.

### 2. Endpoint pasajero para pagar después del viaje

Crear endpoint(s) bajo `/api/pasajero/[token]/pago`:

- `POST { accion:'pagar_app' }` para `app_pago` en `por_cobrar`.
- `POST { accion:'confirmar_efectivo' }` para `efectivo` en `por_cobrar`.
- Requiere token público válido, reserva no borrada, viaje finalizado o reserva `por_liquidar`.
- Si `responsable_pago!=pasajero`, responder `409 pago_cubierto_por_convenio`.
- Si el pago no está `por_cobrar`, responder idempotente con estado actual o `409 pago_no_cobrable` según aplique.
- Ejecutar en transacción: pago -> `capturado`, `capturado_en=now`, auditoría `pago_pasajero_capturado_demo`.
- Después de capturar, preparar comprobante o permitir que el endpoint existente lo prepare.

No aceptar montos desde el cliente. La fuente de monto sigue siendo `pagos.monto`.

### 3. Comprobante después del pago

Ajustar `prepararComprobanteDemo` y el endpoint pasajero:

- `responsable_pago=empresa|hotel`: comprobante/factura puede quedar preparado al finalizar como hoy.
- `responsable_pago=pasajero`: el comprobante no debe estar disponible antes de capturar pago.
- Tipo:
  - empresa/hotel -> factura/ticket según contrato actual y lo que el código ya soporte.
  - pasajero + `requiere_factura=true` o `pasajero_ruc` -> factura.
  - pasajero sin RUC -> boleta.
- Testear que `POST /comprobante` antes de pago capturado responde `409 pago_pendiente`.

### 4. UI pasajero `/p/[token]`

Actualizar la tarjeta de pago:

- Si viaje no finalizado y pasajero paga: "No se realizará ningún cobro todavía. Pagas al finalizar el viaje."
- Si finalizado + `por_cobrar` + `app_pago`: botón "Pagar ahora" con pasarela demo animada determinista.
- Si finalizado + `por_cobrar` + `efectivo`: botón "Ya pagué en efectivo al conductor".
- Si capturado: "Pago confirmado" + comprobante.
- Si empresa/hotel: "Cubierto por {empresa/hotel}. No se te cobrará este servicio." y nunca botón de pago.

Diseño: reutiliza el lenguaje visual actual. Evita modal complejo si una card con estado y CTA resuelve mejor.

### 5. Cancelación escalonada del pasajero

Implementar acciones en `/p/[token]` según master §5.3:

- Sin conductor: cancelar libremente con confirmación.
- Unidad asignada: cancelar con aviso, liberar conductor/unidad, notificar/broadcast.
- En camino/en punto: solicitar cancelación, crear incidencia o auditoría de solicitud, no cancelar automáticamente.
- A bordo/finalizado: no cancelar, mostrar soporte/incidencia.

Server:

- Nuevo endpoint o Server Action pública por token, protegido por token pasajero y etapa.
- Transacción para `reservas.estado=cancelada`, viaje `cancelado` si existe, pago `rechazado/anulado demo` si no fue capturado,
  `cancelada_por='pasajero'`, `cancelada_motivo`.
- Auditorías: `reserva_cancelada_pasajero`, `pago_demo_anulado_cancelacion` si aplica.
- Broadcasts a `reserva-{id}` y `conductor-{conductorId}`. Broadcast best-effort, nunca rompe la transacción.

No implementar penalidades ni reembolsos.

### 6. Superficies conectadas

- Admin lista/detalle: mostrar cancelada con motivo y responsable; no sugerir asignación a canceladas.
- Driver: si recibe broadcast de cancelación, mostrar estado humano y volver a home/refetch.
- Counter: una reserva cancelada responde 409 y copy humano. Ya existe guard base de F1.1; extender si hace falta.
- `/wa-sim`: si una reserva de demo se cancela desde pasajero, el operador debe verlo al abrir admin; no hace falta WABA real.

### 7. Seeds y pruebas de demo

- `db:seed-operacional`: A/B siguen igual tras F6.
- Añadir o reutilizar una reserva/flujo autocontenido para pasajero con `app_pago` y/o `efectivo`, sin quemar `TG-2026-0001`.
- E2E nuevos deben crear sus propias `TG-WA-*`.

## Criterios de aceptación

1. Al finalizar un viaje `responsable_pago=pasajero`, el pago queda `por_cobrar` y `/p/[token]` muestra CTA.
2. Pagar app/confirmar efectivo cambia a `capturado` con auditoría y habilita comprobante.
3. Empresa/hotel nunca ve botón de pago pasajero y conserva `por_liquidar`.
4. Comprobante de pasajero no se emite antes de capturar pago.
5. Cancelación del pasajero funciona por etapa y no rompe gate F1 ni escenario B F4.
6. Admin, driver, passenger y counter tienen copy humano, sin códigos crudos.
7. La suite global y E2E autocontenidos quedan verdes.

## Verificación requerida

```bash
pnpm --filter @taxigreen/pagos test
pnpm --filter @taxigreen/web test
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/database typecheck
pnpm --filter @taxigreen/driver exec tsc --noEmit
pnpm turbo run typecheck lint test build
pnpm --filter @taxigreen/database db:seed-operacional
E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test --config tests/e2e/playwright.config.ts --workers=1
pnpm --filter @taxigreen/database db:seed-guion
E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test tests/e2e/voucher-flow.spec.ts --config tests/e2e/playwright.config.ts --workers=1
pnpm --filter @taxigreen/driver exec expo export --platform android
pnpm --filter @taxigreen/database db:seed-operacional
```

Gotcha: levantar `next start` fresco en puerto 3100 después de `next build`; no correr E2E contra un server viejo que
comparta `.next` con `next dev`.

## Cierre

Entregar `docs/features/ESTADO_FEATURE_6.md`, actualizar `docs/DOCUMENTACION_TECNICA.md`,
`docs/GUIA_PRUEBAS_DEMO.md` y `docs/DEUDA_TECNICA.md`, y dejar redactado el prompt de Feature 7 con lo aprendido.

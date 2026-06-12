# ESTADO Feature 5 — Identidad comercial + borrador inteligente

**Fecha:** 2026-06-11  
**Fuente de verdad:** [`MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md`](MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md)  
**Prompt ejecutado:** [`PROMPT_FEATURE_5_IDENTIDAD_COMERCIAL_CODEX.md`](PROMPT_FEATURE_5_IDENTIDAD_COMERCIAL_CODEX.md)  
**Veredicto:** Feature 5 cerrada. La matriz comercial de 6 casos ya es expresable, extraíble, persistible y visible en superficies operativas.

---

## 1. Implementado

Feature 5 separa definitivamente **quién viaja** de **quién paga**:

- `perfil_pasajero`: `particular | corporativo | hotel`.
- `responsable_pago`: `pasajero | empresa | hotel`.
- `tipo_pago` conserva su significado de método.
- `requiere_factura` deja de ser señal de perfil corporativo.

Quedó implementado:

- Migración `20260611020000_feature5_identidad_comercial` con enums, columnas y backfill por `tipo_pago`.
- Diccionario determinista de convenios demo: ACME Perú, Andes Corporate Travel, Hotel Costa Verde y Hilton Lima Miraflores.
- Extractor determinista con fixes E1-E5:
  - vuelo + origen residencial explícito -> `traslado_aeropuerto`;
  - intención reciente por encima del contexto;
  - factura/RUC no convierte a corporativo;
  - léxico Jorge Chávez ampliado;
  - preferencia de vehículo, pasajeros y equipaje persistibles.
- `/wa-sim` con borrador corregible:
  - envía último mensaje como intención actual y mensajes anteriores como contexto;
  - re-cotiza con "Tarifa estimada protegida vN";
  - conversación seed "ACME personal".
- `packages/shared/src/comercial` centraliza copy humano para chat, pasajero, mostrador, admin y driver.
- Admin lista/detalle, counter, pasajero y conductor serializan `comercial`.
- App conductor muestra cobro por responsable: "Cargo al hotel/empresa - no cobres al pasajero" o cobro al finalizar.
- `packages/asignacion` usa `vehiculo_preferencia` como señal de `match_tipo` sin tocar la prioridad de cola.
- Prompt LLM de ingesta actualizado con regla `perfil_pasajero != responsable_pago`.
- Seeds F5:
  - A `TG-2026-0001`: Hilton Lima Miraflores, `hotel/hotel`, mostrador pendiente.
  - B `TG-2026-0002`: ACME Perú, `corporativo/empresa`, sin mostrador.

Se revisaron shadcn MCP/context7 al inicio: no hizo falta instalar componentes nuevos; se reutilizaron patrones locales. Context7 confirmó flujo Prisma/Next para migraciones y Server Actions.

---

## 2. Matriz comercial cubierta

| Caso | Resultado F5 |
|---|---|
| Particular común | `particular/pasajero`, método personal. |
| Trabajador con convenio, viaje de trabajo | `corporativo/empresa`, `factura_empresa`, convenio validado. |
| Trabajador de empresa, viaje personal | `corporativo/pasajero`, método personal, convenio puede quedar trazado sin cobrar a empresa. |
| Empresa sin convenio | `corporativo/pasajero`, factura requerida si dio RUC, método por aclarar si no indicó efectivo/app. |
| Hotel reserva para huésped | `hotel/hotel`, `voucher_hotel`, convenio validado. |
| Particular que pide factura | `particular/pasajero`, `requiere_factura=true`, nunca corporativo. |

---

## 3. Bugs encontrados durante QA

| Severidad | Hallazgo | Fix |
|---|---|---|
| Alta | `/wa-sim` pegaba todo el historial como `mensaje`, anulando en UI el fix E2 del extractor. Una corrección reciente podía volver a perder contra el dato viejo. | `/wa-sim` ahora manda el último mensaje como `mensaje` y el historial anterior como `contextoConversacion`. E2E nuevo cubre "solo voy yo / puerta 4". |
| Media | Regex de nombre de empresa aceptaba mal nombres mixtos y podía degradar "Empresa Fantasma" a placeholder. | Extracción de nombre de empresa centralizada, con corte por verbos/puntuación y soporte mayúsculas/minúsculas. Test reforzado. |
| Baja | Seed A seguía mostrando `hotel_nombre=Concierge hotel`, correcto pero pobre para F5. | Seed base, operacional y guion usan `Hilton Lima Miraflores`. |
| Baja | Fixture del endpoint de transición conductor no tenía campos comerciales y podía serializar copy degradado sin fallar. | Fixture F5 completo + aserción `pagoConductor`. |
| Lint | `!Boolean(...)` en extractor rompió `no-extra-boolean-cast`. | Comparación directa `detectarAeropuerto(texto) === null`. |

---

## 4. Verificación

Comandos ejecutados:

```bash
pnpm --filter @taxigreen/database db:generate
pnpm --filter @taxigreen/ingesta typecheck
pnpm --filter @taxigreen/ingesta test
pnpm --filter @taxigreen/shared typecheck
pnpm --filter @taxigreen/ia typecheck
pnpm --filter @taxigreen/asignacion test
pnpm --filter @taxigreen/web test
pnpm --filter @taxigreen/database typecheck
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/driver exec tsc --noEmit
pnpm --filter @taxigreen/database db:deploy
pnpm --filter @taxigreen/database db:seed-operacional
pnpm turbo run typecheck lint test build
E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test --config tests/e2e/playwright.config.ts --workers=1
pnpm --filter @taxigreen/database db:seed-guion
E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test tests/e2e/voucher-flow.spec.ts --config tests/e2e/playwright.config.ts --workers=1
pnpm --filter @taxigreen/driver exec expo export --platform android
pnpm --filter @taxigreen/database db:seed-operacional
```

Resultados:

- Ingesta: 13/13 tests verdes.
- Web unit/API: 71/71 tests verdes.
- Asignación: 15/15 tests verdes.
- Pagos: 15/15 tests verdes dentro del turbo completo.
- Turbo completo: 60/60 tareas verdes.
- Playwright completo contra `next start` fresco en `http://localhost:3100`: 11/11 verdes.
- `voucher-flow` aislado post `db:seed-guion`: 1/1 verde.
- Expo Android export: EXIT 0, 1431 módulos.
- Migración F5 aplicada en Supabase con `prisma migrate deploy`.

Smoke DB final post `db:seed-operacional`:

```json
[
  {
    "voucher_codigo": "TG-2026-0001",
    "tipo_viaje": "recojo_aeropuerto",
    "tipo_pago": "voucher_hotel",
    "perfil_pasajero": "hotel",
    "responsable_pago": "hotel",
    "convenio_validado_demo": true,
    "requiere_factura": false,
    "estado_abordaje": "pendiente_validacion",
    "hotel_nombre": "Hilton Lima Miraflores"
  },
  {
    "voucher_codigo": "TG-2026-0002",
    "tipo_viaje": "traslado_aeropuerto",
    "tipo_pago": "factura_empresa",
    "perfil_pasajero": "corporativo",
    "responsable_pago": "empresa",
    "convenio_validado_demo": true,
    "requiere_factura": true,
    "estado_abordaje": "no_requerido",
    "empresa_nombre": "ACME Perú"
  }
]
```

---

## 5. Documentación actualizada

- [`DOCUMENTACION_TECNICA.md`](../DOCUMENTACION_TECNICA.md): contratos F4/F5, serializers y modelo comercial.
- [`GUIA_PRUEBAS_DEMO.md`](../GUIA_PRUEBAS_DEMO.md): demo de matriz comercial y corrección del borrador.
- [`DEUDA_TECNICA.md`](../DEUDA_TECNICA.md): convenios por diccionario, `equipaje_nivel` textual y F6-F8 pendientes.
- [`PROMPT_FEATURE_6_PAGO_FINAL_LIBERTADES_CODEX.md`](PROMPT_FEATURE_6_PAGO_FINAL_LIBERTADES_CODEX.md): siguiente prompt ejecutable.

---

## 6. Riesgos residuales

No quedan bugs conocidos bloqueantes dentro del alcance F5.

Riesgos intencionales, no regresiones:

- Convenio sigue siendo diccionario demo, no CRM/SUNAT.
- `equipaje_nivel`, `cancelada_por` y `cancelada_motivo` son texto acotado; F6/F7 los consumirán.
- El acto real de pago del pasajero sigue pendiente para F6; F5 solo deja la semántica correcta para cobrar a quien corresponde.
- Cancelaciones/reasignación siguen fuera de alcance hasta F6/F7.

---

## 7. Próximo prompt

Siguiente paso: [`PROMPT_FEATURE_6_PAGO_FINAL_LIBERTADES_CODEX.md`](PROMPT_FEATURE_6_PAGO_FINAL_LIBERTADES_CODEX.md).

F6 debe cambiar el cierre financiero para que `responsable_pago=pasajero` quede `por_cobrar` al finalizar y pague desde
`/p/[token]`, además de implementar cancelación escalonada del pasajero. F7 queda para cancelación del conductor y
reasignación con disculpas; F8 para conversación guiada.

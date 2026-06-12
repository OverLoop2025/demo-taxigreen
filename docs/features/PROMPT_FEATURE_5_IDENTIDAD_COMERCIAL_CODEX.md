# PROMPT Feature 5 — Identidad comercial + borrador inteligente (Codex)

> Prerrequisito: Features 1-4 cerradas y CI verde (`ESTADO_FEATURE_4.md`). Fuente de verdad de esta
> feature: `docs/features/MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md` (§2, §6, §8, §9, §10-F5). Si algún
> contrato difiere del master, el código real + master mandan sobre este prompt.

---

Actúa como ingeniero senior full-stack + diseñador de producto del monorepo `demo-taxigreen`
(stack y reglas en `CLAUDE.md`; regla rectora del frontend: si una pantalla necesita explicación,
está mal). Idioma: español con acentos. Commits solo si el usuario lo pide.

## Misión

Implementar **Feature 5 del master comercial**: separar **quién viaja** (`perfil_pasajero`) de
**quién paga** (`responsable_pago`), corregir los sesgos reales del extractor (E1-E5 del master §8)
y formalizar el **borrador de reserva corregible**: el mensaje más reciente del cliente manda, cada
corrección re-cotiza y re-emite el resumen, y la reserva solo nace al confirmar.

> Clave conceptual: *corporativo no es lo mismo que pago corporativo*. Un trabajador de empresa
> puede pagar su viaje personal; un particular puede pedir factura sin volverse corporativo.

## Lecturas obligatorias

- `docs/features/MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md` — §2 (matriz de 6 casos e invariantes),
  §6 (borrador/versiones), §8 (hallazgos E1-E5 con líneas exactas), §9 (deltas de schema + backfill).
- `packages/ingesta/src/extractor.ts` (bugs en líneas 95, 110, 181-183) + `post-procesamiento.ts`,
  `aclarador.ts`, diccionarios y `extractor.test.ts`.
- `apps/web/src/app/wa-sim/{actions.ts,whatsapp-simulator.tsx,conversaciones-seed.ts}` — el borrador
  ya vive en el estado del simulador; `previsualizarPagoDesdeIngesta` ya re-cotiza.
- `packages/database/prisma/{schema.prisma,seed.ts,seed-operacional.ts,seed-guion.ts}`.
- `apps/web/src/lib/{pasajero.ts,admin/reservas.ts}` y `apps/web/src/app/counter/voucher-validator.tsx`
  (superficies que mostrarán perfil/responsable).
- `packages/ia/prompts/` (el prompt LLM de extracción debe aprender los campos nuevos DESPUÉS de que
  el determinista los tenga — regla de oro 8).

## NO tocar

- El gate F1, el pago F2, el cierre F3, el contrato A/B de F4 (solo se consumen).
- `tipo_pago` no cambia de significado (sigue siendo el MÉTODO); ningún rename de enum existente.
- NO crear tablas (`empresas_clientes`/`hoteles_aliados` son Semilla MVP): el "convenio" demo es un
  diccionario determinista en `packages/ingesta` (ACME Perú, Hotel Costa Verde, y 2-3 más del seed).
- NO cancelaciones, NO pago al finalizar, NO modo guiado (son F6-F8).

## Tareas (en orden)

### 1. Migración + backfill (master §9)

Enums `PerfilPasajero` (particular|corporativo|hotel) y `ResponsablePago` (pasajero|empresa|hotel);
campos en `reservas`: `perfil_pasajero` (default particular), `responsable_pago` (default pasajero),
`convenio_validado_demo` (default false), `requiere_factura` (default false), `vehiculo_preferencia
TipoVehiculo?`, `pasajeros_cantidad Int?`, `equipaje_nivel String?`, `cancelada_por String?`,
`cancelada_motivo String?` (estos dos últimos los consume F7; nacen ahora para una sola migración).
Backfill en la MISMA migración: `voucher_hotel → (hotel, hotel, convenio=true)`;
`factura_empresa → (corporativo, empresa, convenio=true)`; resto → (particular, pasajero).
Verificar `prisma migrate deploy` contra la DB local/Supabase antes de seguir (patrón F1, riesgo R6).

### 2. Ingesta: fixes E1-E5 + campos nuevos

En `packages/ingesta` (determinista primero):

- **E2 (prioridad de intención reciente):** extraer sobre el mensaje actual PRIMERO y rellenar
  faltantes desde `contextoConversacion` (hoy es al revés). Test obligatorio: "para 3 personas…
  [resumen] … me equivoqué, solo voy yo" ⇒ `pasajeros=1`.
- **E1 (vuelo ≠ recojo):** vuelo + origen residencial/hotel explícito ("recógeme en", dirección no
  aeroportuaria) ⇒ `traslado_aeropuerto`. El default ambiguo sigue siendo `recojo_aeropuerto`
  (sesgo F4: se conserva y se documenta en el test).
- **E3 (factura ≠ empresa):** "factura"/RUC alimentan `requiere_factura` + `pasajero_ruc`, NUNCA el
  perfil. El perfil solo cambia con señal de pertenencia ("trabajo en X", "somos de X", nombre en el
  diccionario de convenios).
- **E5 (campos comerciales):** detectores de `perfil_pasajero` y `responsable_pago` ("lo cubre el
  hotel", "lo paga la empresa", "yo asumo", "viaje personal"), `vehiculo_preferencia` (sedán/amplio/
  van — mapear a `TipoVehiculo`), `equipaje_nivel` (poco|normal|grande) y `pasajeros_cantidad`
  (reusar `extraerCantidad`). Diccionario `convenios-demo.ts` con las empresas/hoteles seed ⇒
  `convenio_validado_demo`.
- **E4 (léxico Jorge Chávez):** variantes de punto de encuentro ("salida 3", "puerta 4, columna F2",
  "zona de llegadas"), prefijos de aerolíneas (LA/H2/JA — LATAM/Sky/JetSMART), expresiones reales
  ("aterrizo a las 5", "mi vuelo se retrasó", "vengo de Cusco").
- **Aclarador (pregunta en 2 pasos, master §2.3):** si el texto no resuelve el perfil ⇒ "¿La reserva
  es particular o va asociada a una empresa u hotel?"; solo si es empresa/hotel y no se sabe quién
  paga ⇒ "¿El servicio lo cubre la empresa/hotel o lo pagarás tú?". CERO preguntas si ya se infiere.
- **Regla de coherencia:** `responsable_pago≠pasajero ⇔ tipo_pago∈{voucher_hotel,factura_empresa}`.
  Si el cliente dice "lo pago yo" siendo corporativo ⇒ método personal (efectivo/app_pago). Si nombra
  empresa SIN convenio en el diccionario ⇒ `responsable_pago=pasajero` + respuesta elegante: "No
  encuentro un convenio activo con esa empresa; podemos continuar con pago personal y factura a tu RUC".
- Tests: **un caso por fila de la matriz §2.2** (6 casos) + E1/E2/E3 + léxico E4.

### 3. wa-sim: borrador con versiones de cotización

- `crearReservaDesdeIngesta` persiste los campos nuevos (perfil, responsable, convenio, factura,
  preferencia, pasajeros, equipaje) — los datos ya llegan en `ReservaExtraida` ampliada.
- En el simulador: cuando un mensaje nuevo cambia un factor de tarifa (destino, vehículo,
  pasajeros/equipaje), re-cotizar con `previsualizarPagoDesdeIngesta` y emitir en el chat la nueva
  versión: "Actualicé tu reserva: … Nueva tarifa estimada protegida: S/ XX.XX. ¿Confirmas?".
  La tarifa se presenta SIEMPRE como "Tarifa estimada protegida" (master §6.1).
- El resumen del copiloto incluye perfil/pago en humano: "Pago: lo cubre Hotel Costa Verde" /
  "Pago: tarjeta al finalizar el viaje" (el copy "se paga al finalizar" nace aquí; el ACTO de pagar
  llega en F6).
- Conversación seed nueva: corporativo que paga él mismo (caso 3 de la matriz) — p. ej. analista de
  ACME en viaje personal que pide su recojo y dice "esta vez lo pago yo con tarjeta".

### 4. Superficies: perfil/responsable visibles

- **Admin** (detalle + lista): bloque "Cliente" con perfil/responsable en humano ("Corporativo ·
  paga la empresa (convenio ACME)" / "Particular · paga el pasajero"). Chip de convenio si aplica.
- **Mostrador** (`ready`): bajo el pago, una línea de responsable ("Cubierto por Hotel Costa Verde" /
  "Paga el pasajero al finalizar").
- **Pasajero** (`/p/[token]`): el bloque de pago existente refleja responsable: "Cubierto por tu
  empresa — no se te cobrará" vs "Pagas al finalizar el viaje". SIN botón de pagar todavía (F6).
- **Driver**: la ficha de cobro (`cobro.etiqueta`) refleja responsable ("Cargo a la empresa — no
  cobres al pasajero" / "Cobra al finalizar: S/ XX.XX en efectivo").

### 5. Prompt LLM

Actualizar el prompt de extracción en `packages/ia/prompts/` (frontmatter de versión) con los campos
nuevos y la regla perfil≠responsable, manteniendo el contrato de salida = `ReservaExtraida` ampliada.
El fallback determinista ya quedó listo en la tarea 2 (regla de oro 8).

### 6. Seeds

- `seed.ts` / `seed-operacional.ts`: la protagonista A queda `(hotel, hotel, convenio=true)`
  vía backfill natural de `voucher_hotel`; la B canónica `(corporativo, empresa, convenio=true)`.
  Añadir una reserva lateral caso-3 (corporativo paga pasajero) si no infla el guion — si lo infla,
  basta la conversación seed de wa-sim.
- `seed-guion.ts`: coherente con los campos nuevos (sin cambiar su narrativa).

## Criterios de aceptación (DoD)

1. Los 6 casos de la matriz §2.2 del master son expresables, extraíbles y visibles end-to-end
   (chat → reserva → admin/mostrador/pasajero/driver) con copy humano.
2. "Me equivoqué, solo voy yo y salgo por la puerta 4" tras un resumen: el borrador se corrige
   (pasajeros, punto de encuentro), re-cotiza y re-emite resumen — sin reiniciar la conversación.
3. Un particular pidiendo factura NUNCA queda corporativo; un corporativo "lo pago yo" NUNCA queda
   `factura_empresa`.
4. "Tengo vuelo LA640, recógeme en mi casa de San Isidro" ⇒ `traslado_aeropuerto`.
5. La cotización congelada al confirmar sigue siendo la única fuente del monto (C6 intacto:
   driver/pasajero/counter/admin muestran lo mismo).
6. Migración con backfill aplicada en local y Supabase sin romper `db:seed-operacional` ni el guion.

## Verificación (protocolo master §12)

```bash
pnpm turbo run typecheck lint test build
pnpm --filter @taxigreen/database db:seed-operacional
E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test --config tests/e2e/playwright.config.ts --workers=1
pnpm --filter @taxigreen/database db:seed-guion
E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test tests/e2e/voucher-flow.spec.ts --config tests/e2e/playwright.config.ts --workers=1
pnpm --filter @taxigreen/driver exec expo export --platform android
pnpm --filter @taxigreen/database db:seed-operacional
```

E2E nuevos autocontenidos (C7: crear reserva propia vía wa-sim, jamás consumir `TG-2026-0001`).
Gotcha conocido: levantar `next start` fresco en puerto 3100 (nunca compartir `apps/web/.next` con
un `next dev` vivo — ver `ESTADO_FEATURE_1.md §9` y `ESTADO_FEATURE_4.md §4`).

## Cierre

Entregar `docs/features/ESTADO_FEATURE_5.md` (plantilla del master anterior §9), actualizar
`docs/DOCUMENTACION_TECNICA.md` (contrato `ReservaExtraida`/serializers) y `docs/GUIA_PRUEBAS_DEMO.md`
(cómo demostrar los 6 casos), registrar deuda real en `docs/DEUDA_TECNICA.md`, y dejar redactado
`PROMPT_FEATURE_6_PAGO_FINAL_LIBERTADES_CODEX.md` ajustado con lo aprendido (alcance en master §10-F6).

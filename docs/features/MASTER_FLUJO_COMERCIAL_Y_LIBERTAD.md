# MASTER — Flujo Comercial y Libertad del Pasajero (clarificación total A/B)

**Fecha:** 2026-06-11
**Autor:** revisión de arquitectura (Fable/Claude) sobre las ideas del usuario + propuesta externa (ChatGPT), contrastadas contra el código real post-F4.
**Estado:** aprobado para implementación por features (F5→F8). Sucede a [`MASTER_FLUJO_OPERACIONAL_PERFECTO.md`](MASTER_FLUJO_OPERACIONAL_PERFECTO.md) (F1-F4, cerrado según [`ESTADO_FEATURE_4.md`](ESTADO_FEATURE_4.md)).
**Regla de lectura:** todo lo afirmado sobre el código fue verificado el 2026-06-11 (se citan archivos y líneas). Las propuestas externas se auditaron: lo que se acepta, se acepta con evidencia; lo que se corrige, se corrige con evidencia.

---

## 0. Veredicto y decisiones cerradas

La tesis central de la propuesta es **correcta y se adopta**: *corporativo no es lo mismo que pago
corporativo*. El sistema debe separar **quién viaja** (perfil) de **quién paga** (responsable), y el
flujo debe dejar de sentirse rígido: borrador corregible antes de confirmar, cancelación escalonada
después, reasignación con disculpas si el conductor falla, y pago del independiente **al finalizar**,
nunca al reservar.

Pero la propuesta llegó con 5 puntos que **contradicen decisiones ya cerradas o el código real**, y
aquí se corrigen de forma definitiva:

| # | Decisión cerrada | Qué se corrige y por qué |
|---|---|---|
| D1 | **El pase QR NO se pospone hasta tener conductor.** Se conserva C3 del master anterior (independencia de orden counter↔asignación). | El "bug de counter validando un viaje sin chofer" **no existe como bug**: el verify ya devuelve `conductor: null` y el mostrador muestra "Falta asignar conductor"; la luz verde queda guardada y la asignación nace habilitada ([MASTER §5.9](MASTER_FLUJO_OPERACIONAL_PERFECTO.md)). El pase es **identidad + acceso**, no orden de despacho: el vuelo aterriza cuando quiere, no cuando despacho asigna. Posponer el QR rompería el caso real "vuelo adelantado". |
| D2 | **El QR no "contiene" los datos del conductor; el escaneo los muestra.** | El QR es un puntero firmado HMAC de un solo uso. La verdad vive en el servidor: al escanear, el verify devuelve conductor/placa/pago **actualizados al segundo** (incluida una reasignación de última hora). Meter datos en el payload los volvería falsificables y obsoletos. Lo que pide el usuario ("el QR debe tener toda la información vital") ya se cumple **en el momento del escaneo**, que es el único momento que importa. |
| D3 | **El revelado de conductor/placa/enlace NO se difiere hasta `en_camino`.** Se mantiene: A = tras luz verde del mostrador; B = al asignar. | La motivación del usuario (no mostrar datos que luego cambian si el conductor cancela) se resuelve mejor con el **mensaje de actualización ante reasignación** (§5.4): "cambiamos tu unidad, tu nuevo conductor es X". En A el pasajero está físicamente en el mostrador cuando llega la luz verde; en B necesita saber qué auto lo recoge **antes** de que llegue. Se añade además el mensaje "Tu conductor inició la ruta" al pasar a `en_camino` (nice-to-have wa-sim). |
| D4 | **El mostrador no recibe un despacho duplicado dentro de `/counter`.** Recibe un acceso directo "Cambiar unidad" que abre el despacho de esa reserva. | Los usuarios de mostrador ya tienen rol `supervisor` y la server action de asignación ya reemplaza conductor/unidad. Duplicar la UI de despacho dentro del counter viola "una capacidad, una superficie" y agranda la demo sin sumar al guion. El poder que pide el usuario existe: a un clic, con la misma auditoría. |
| D5 | **Sin tarifa dinámica tipo Uber (surge).** Cotización **dinámica en el borrador, congelada al confirmar** ("tarifa protegida"). | El surge está en PROHIBIDO de demo (`CLAUDE.md §5`) y además es la decisión de producto correcta: Taxi Green vende confianza aeroportuaria, no ruleta de precios. La tarifa solo se recalcula si el cliente cambia factores (destino, vehículo, condiciones) **antes** de confirmar; después solo por incidencia real (fuera de demo). |
| D6 | **No se crea el estado `requiere_reasignacion` en `EstadoReserva`.** | La cancelación del conductor regresa la reserva a `confirmada` con `conductor_id = null` + auditoría con motivo. "Necesita nueva unidad" es **derivable** (confirmada + viaje cancelado previo) y se muestra como bandeja en admin sin migrar el enum. Menos estados = menos invariantes (misma lógica que C1 del master anterior). |

Lo que se **adopta** de la propuesta, tal cual o afinado:

- Separación `perfil_pasajero` / `responsable_pago` con la matriz de 6 casos (§2).
- Pregunta en dos pasos, **solo cuando no se puede inferir** del texto (§3.2).
- Borrador de reserva corregible por intención más reciente + cotización por versiones (§6).
- Pago del independiente al finalizar, desde `/p/[token]` (§7) — hoy `cerrarPagoDemo` captura solo
  ([packages/pagos/src/index.ts:323-348](../../packages/pagos/src/index.ts)): eso cambia.
- Cancelación escalonada del pasajero por etapa (§5.3) y del conductor con motivo obligatorio (§5.4).
- Dos modos de chat en `/wa-sim`: libre (actual, mejorado) y guiado con menús (§3.3).
- Preferencia de vehículo simple, alimentando el `w3·match_tipo` del score que **ya existe**.
- "Particular que pide factura NO es corporativo" — y esto destapó un **bug real ya presente**
  en el extractor (§8, hallazgo E3).

---

## 1. Auditoría del estado actual (qué es verdad hoy)

Verificado en código el 2026-06-11:

| Afirmación | Veredicto | Evidencia |
|---|---|---|
| No existe `perfil_pasajero` ni `responsable_pago`; el proxy es `solicitante_tipo` + `tipo_pago` | **CIERTO** | `schema.prisma` (reservas) y [extractor.ts:82-105](../../packages/ingesta/src/extractor.ts). El caso "corporativo que paga él mismo" es **inexpresable** hoy. |
| Un particular que menciona "factura" se clasifica como empresa | **CIERTO (bug)** | [extractor.ts:95](../../packages/ingesta/src/extractor.ts): `normalized.includes('factura') || extraerRuc(texto)` ⇒ `tipo: 'empresa'`. |
| "Tengo vuelo LA640, recógeme en mi casa" se clasifica `recojo_aeropuerto` | **CIERTO (bug)** | [extractor.ts:110](../../packages/ingesta/src/extractor.ts): sin mención de aeropuerto + palabra "vuelo" ⇒ `recojo_aeropuerto`, cuando un recojo en casa con vuelo es un **traslado** AL aeropuerto. |
| El pago se autoriza al CREAR la reserva, y el cierre captura solo al finalizar | **CIERTO** | [wa-sim/actions.ts:234-243](../../apps/web/src/app/wa-sim/actions.ts) (`autorizarPagoDemo` en la misma transacción del create) y [pagos/index.ts:323-348](../../packages/pagos/src/index.ts) (`cerrarPagoDemo`: app_pago/efectivo → `capturado` automático). **El pasajero nunca ejecuta un acto de pago.** |
| No existe ninguna acción de cancelar para pasajero ni conductor | **CIERTO** | `EstadoReserva.cancelada` / `EstadoViaje.cancelado` existen en el enum y como **etiquetas** ([historial.tsx:22](../../apps/driver/app/(auth)/historial.tsx), [transitions.ts:52](../../apps/driver/src/features/assignment/transitions.ts)) pero ningún endpoint/UI los transiciona desde driver o `/p/[token]`. |
| El borrador conversacional ya existe de facto, sin nombre | **CIERTO** | La extracción vive en estado del cliente del simulador ([whatsapp-simulator.tsx:246-260](../../apps/web/src/app/wa-sim/whatsapp-simulator.tsx)); la reserva real solo nace al confirmar. Falta: re-cotización visible por corrección y patch por intención más reciente. |
| `pasajeros`, `maletas` y preferencia de vehículo NO se persisten en `reservas` | **CIERTO** | El extractor los extrae ([extractor.ts:196-197](../../packages/ingesta/src/extractor.ts)) pero mueren en `raw_ingesta`; `schema.prisma` no tiene columnas. |
| La cotización no considera tipo de vehículo ni pasajeros | **CIERTO** | `calcularCotizacionDemo` solo recibe coordenadas ([wa-sim/actions.ts:109-116](../../apps/web/src/app/wa-sim/actions.ts)). |
| El score de asignación ya pondera match de tipo de vehículo | **CIERTO** | `w3·match_tipo` en la heurística (`CLAUDE.md §4.2`) — la preferencia del cliente tiene dónde caer sin tocar el algoritmo. |
| El mostrador ya maneja "sin conductor" sin romperse | **CIERTO** | Contrato F1/F4: `ready` muestra "Falta asignar conductor" + la luz verde queda guardada (independencia de orden, C3). |
| Modo copiloto asigna automático por la misma ruta auditada del operador | **CIERTO** | [wa-sim/actions.ts:366-394](../../apps/web/src/app/wa-sim/actions.ts) (`asignarConductorAutomatico` → `aceptarSugerenciaAsignacion`). |
| En A el enlace se revela tras luz verde; en B va directo | **CIERTO** | [wa-sim/actions.ts:326-356](../../apps/web/src/app/wa-sim/actions.ts) (`obtenerSeguimientoReserva`) + polling solo en A ([whatsapp-simulator.tsx:461-501](../../apps/web/src/app/wa-sim/whatsapp-simulator.tsx)). |

**Conclusión de auditoría:** F1-F4 dejaron la columna vertebral operacional correcta (gate, pago
persistido, cierre, A/B). Los huecos reales son exactamente cuatro: (1) identidad comercial
inexpresable, (2) pago sin acto de pago del pasajero, (3) cero cancelaciones/reasignación,
(4) extractor con sesgos que la vida real del Jorge Chávez va a romper.

---

## 2. Identidad comercial: perfil ≠ responsable de pago

### 2.1 Los dos ejes

```
perfil_pasajero   = particular | corporativo | hotel    ← quién viaja / a qué está asociado
responsable_pago  = pasajero  | empresa     | hotel     ← quién paga ESTE servicio
tipo_pago         = efectivo | app_pago | voucher_hotel | factura_empresa   ← MÉTODO (ya existe)
```

`tipo_pago` no cambia de significado: sigue siendo el método. La novedad es que el método se
**deriva** de los dos ejes, no al revés.

### 2.2 Matriz canónica (6 casos)

| Caso | `perfil_pasajero` | `responsable_pago` | `tipo_pago` | Botón "Pagar" en `/p/[token]` | Comprobante |
|---|---|---|---|---|---|
| Particular común | particular | pasajero | efectivo \| app_pago | **Sí**, al finalizar | boleta (DNI opcional) |
| Trabajador con convenio, viaje de trabajo | corporativo | empresa | factura_empresa | No — "Cubierto por tu empresa" | factura a la empresa |
| Trabajador de empresa, viaje personal | corporativo | pasajero | efectivo \| app_pago | **Sí**, al finalizar | boleta; factura solo si pide RUC |
| Empresa sin convenio validado (demo: nombre no reconocido) | corporativo | pasajero | efectivo \| app_pago | **Sí** + aviso "convenio no validado" | boleta/factura según pida |
| Hotel reserva para huésped | hotel | hotel | voucher_hotel | No — "Cubierto por el hotel" | factura al hotel |
| Particular que pide factura | particular | pasajero | efectivo \| app_pago | **Sí** | **factura con RUC — sin volverse corporativo** |

Invariantes:

- `responsable_pago ≠ pasajero` ⇔ `tipo_pago ∈ {voucher_hotel, factura_empresa}` ⇔ el pasajero
  **nunca** ve botón de pago.
- `requiere_factura`/RUC es atributo del **comprobante**, jamás del perfil (mata el bug E3 del extractor).
- `convenio_validado_demo`: en demo, la "validación SUNAT/convenio" es un diccionario determinista de
  empresas/hoteles seed (ACME Perú, Hotel Costa Verde…). Nombre reconocido ⇒ `true` y se permite
  `responsable_pago=empresa|hotel`; no reconocido ⇒ el copiloto responde con elegancia: "No encuentro
  un convenio activo con esa empresa; podemos continuar con pago personal y factura a su RUC". Sin
  llamadas reales a SUNAT (stub, como RENIEC).

### 2.3 La pregunta en dos pasos (solo si hace falta)

El bot **no interroga lo obvio**. Regla de inferencia primero, pregunta después:

1. Si el texto ya resuelve ambos ejes ("cargo al hotel", "factura a ACME con RUC 20…", "pago yo con
   tarjeta") ⇒ **cero preguntas**.
2. Si falta el perfil: *"¿La reserva es particular o va asociada a una empresa u hotel?"*
3. Solo si eligió empresa/hotel: *"¿El servicio lo cubre la empresa/hotel o lo pagarás tú?"*

Esto aplica idéntico en modo libre (como `preguntas_aclaracion` del aclarador actual) y en modo
guiado (como menú numerado).

---

## 3. Flujo A consolidado — aeropuerto → ciudad (`recojo_aeropuerto`)

Los pasos 1-16 del master anterior (§3.1) **siguen vigentes**. Esta es la versión final con las
capas nuevas intercaladas (en **negrita** lo que agregan F5-F8):

```
ACTOR        PASO                                                  NOVEDAD
──────────────────────────────────────────────────────────────────────────────────────────
Cliente    1. Escribe por WhatsApp (libre o "Necesito reservar")   F6: modo guiado
Copiloto   2. Infere/pregunta PERFIL y RESPONSABLE (2 pasos máx.)  F5
Copiloto   3. Extrae datos; cada mensaje ACTUALIZA EL BORRADOR     F5: patch por intención reciente
Sistema    4. Cotiza el borrador (versión vN, visible en el chat)  F5: re-cotización por corrección
Copiloto   5. Resumen + "¿Confirmas o cambias algo?"               (ya existe en copiloto)
Cliente    6. Corrige en lenguaje natural → vuelve a 3-5           F5
Cliente    7. Confirma → reserva real + COTIZACIÓN CONGELADA       (ya existe: persistida al crear)
Sistema    8. Registra pago según responsable:                     F7 (semántica)
              · pasajero  → método registrado, SIN COBRO
              · empresa/hotel → "cubierto por convenio"
Sistema    9. Entrega pase de abordaje en el chat                  (ya existe; D1: con o sin conductor)
Despacho  10. Asigna conductor + unidad (manual o copiloto)        (ya existe)
Conductor 11. Recibe asignación BLOQUEADA (gate F1)                (ya existe)
          11b. PUEDE RECHAZAR CON MOTIVO → reasignación §5.4       F8
Pasajero  12. Aterriza, va al mostrador (Salida 3, columna F2)     —
Mostrador 13. Escanea: ve pago + conductor ACTUALIZADOS (D2)       (ya existe)
          13b. Si necesita otra unidad: "Cambiar unidad" → despacho F8 (D4)
Mostrador 14. Confirma acceso → luz verde                          (ya existe)
Sistema   15. WhatsApp: conductor + placa + enlace en vivo (D3)    F4 ya lo hace; F8 añade
                                                                   "tu conductor inició la ruta"
Conductor 16. Inicia ruta → viaje → finaliza                       (ya existe)
          16b. Si cancela EN RUTA: motivo + reasignación + disculpas §5.4   F8
Sistema   17. Cierre financiero:                                   F7
              · responsable=pasajero → pago QUEDA POR COBRAR
              · empresa/hotel → por_liquidar automático (ya existe)
Pasajero  18. En /p/[token]: "PAGAR AHORA" (simulado) o            F7
              "pagué en efectivo" → capturado + auditoría
Sistema   19. Comprobante según responsable (§2.2) → descarga      F3 ya existe; F7 ajusta tipo
Pasajero  20. Califica (triple)                                    (ya existe)
```

En todo momento el pasajero conserva las libertades de la matriz §5.3 (cancelar/editar según etapa).

### 3.3 Modo guiado (`/wa-sim`, F6)

Disparador: el cliente abre con intención sin datos ("Necesito reservar un taxi"). El bot ofrece
menús numerados (estilo WhatsApp Business real). Secuencia: tipo de servicio → perfil →
responsable (si aplica) → personas → equipaje (3 niveles: poco / maletas normales / varias-grande)
→ preferencia de vehículo (default: "el mejor disponible") → datos del viaje → resumen + tarifa →
confirmación. **Ambos modos comparten el mismo motor de borrador y el mismo extractor**: el guiado
solo precarga respuestas estructuradas; el cliente puede romper el guion escribiendo libre en
cualquier paso y el patch por intención reciente lo absorbe (es el mismo código de F5).

---

## 4. Flujo B consolidado — punto externo → aeropuerto (`traslado_aeropuerto`)

Idéntico esqueleto que A **sin pasos 12-15** (no hay mostrador): el contrato A/B de F4 sigue
intacto (`estado_abordaje=no_requerido`, enlace directo, conductor inicia sin 409). Las capas
nuevas aplican igual:

- Clasificación comercial (pasos 2, 8) — idéntica.
- Revelado: conductor + placa + enlace **al asignar** (ya es así). El mensaje "tu conductor inició
  la ruta" llega al pasar a `en_camino`.
- Cancelaciones/reasignación (§5) — idénticas, sin la rama de mostrador.
- Pago al finalizar (§7) — idéntico.

B debe sentirse como app de movilidad premium: reservar → ver unidad → seguir en vivo → pagar al
final. **El error sería copiarle a B la lógica del mostrador de A** — eso ya quedó protegido en F4
y no se toca.

---

## 5. Libertades por etapa (la capa que faltaba)

### 5.1 Principio

> Confirmar una reserva no puede sentirse como quedar atrapado. Premium no es que nada falle:
> es que el sistema responda con elegancia cuando algo cambia.

### 5.2 Estados de referencia

Etapas del pasajero, derivadas de estados existentes (sin enums nuevos):
`sin_conductor` (confirmada/necesita_revision sin viaje) → `unidad_asignada` (viaje `asignado`) →
`en_camino` → `en_punto` → `a_bordo` → `finalizado`.

### 5.3 Matriz del pasajero (acciones en `/p/[token]`, F7)

| Etapa | Acciones | Microcopy guía |
|---|---|---|
| Sin conductor | **Cancelar reserva** (libre, 1 clic + confirmación) · cambiar datos de comprobante · cambiar método de pago | "Puedes cancelar sin problema: aún no enviamos una unidad." |
| Unidad asignada | **Cancelar con aviso** (cancela + libera conductor + notifica despacho) · soporte | "Tu unidad está siendo preparada. Si necesitas cancelar, avísanos ahora para liberar al conductor." |
| En camino / en punto | **Solicitar cancelación** (crea incidencia para el equipo, NO cancela sola) · soporte | "Tu conductor ya está en camino. El equipo revisará tu solicitud." |
| A bordo | Soporte · incidencia · objeto olvidado (ya existe) | — |
| Finalizado | Pagar (si responsable=pasajero) · comprobante · calificar | — |

Efectos de "cancelar": `reservas.estado=cancelada`, viaje (si existe) `cancelado`, pago demo
anulado/`rechazado` con auditoría, broadcast al conductor ("El pasajero canceló — quedas
disponible"), y mensaje de confirmación en el chat wa-sim. El conductor vuelve a la cola.

### 5.4 Cancelación del conductor + reasignación (F8)

Aplica en A y B, desde `asignado` hasta `en_punto` (a partir de `a_bordo` ya no es cancelación:
es incidencia).

**UI driver** (hoja modal, ordenada y humana):

```
¿Por qué no puedes continuar?
○ Problema mecánico            ○ No llego a tiempo
○ Emergencia personal          ○ Error de asignación
○ Otro
[ Cuéntanos brevemente (opcional) ]
[ Confirmar cancelación ]   [ Volver ]
```

**Server (una transacción):** viaje → `cancelado` (con motivo en auditoría
`viaje_cancelado_por_conductor`); reserva → vuelve a `confirmada` con `conductor_id=null`;
`estado_abordaje` **se conserva** (una luz verde dada sigue válida — C3); broadcasts a reserva y
conductor.

**Después, según modo:**

- **Copiloto activo:** `asignarConductorAutomatico` (ya existe, [wa-sim/actions.ts:366](../../apps/web/src/app/wa-sim/actions.ts))
  reasigna por la misma ruta auditada y el chat envía las disculpas:
  > "Disculpa, tuvimos que cambiar tu unidad para cuidar tu tiempo. Tu nuevo conductor es
  > {nombre}, placa {placa}. Tu enlace de seguimiento sigue siendo el mismo: {link}".
- **Copiloto apagado:** la reserva aparece en la bandeja **"Necesita nueva unidad"** del admin
  (derivada: `estado=confirmada` + existe viaje cancelado; sin enum nuevo, D6) con prioridad visual.
  Al reasignar manualmente, el mismo mensaje de disculpas sale al chat.

El enlace `/p/[token]` no cambia (mismo token); el contenido se actualiza solo vía Realtime.

### 5.5 Poder del mostrador (F8, D4)

En `ready`/`consumed` con conductor asignado, el mostrador ve el botón **"Cambiar unidad"** → abre
`/admin/reservas/[id]` (rol supervisor ya autorizado). La reasignación es la misma server action
auditada del despacho; el mensaje de disculpas del §5.4 aplica si el pasajero ya había recibido datos.

---

## 6. Cotización: borrador, versiones y congelado

### 6.1 Reglas

| Momento | Comportamiento |
|---|---|
| Borrador (antes de confirmar) | Recalcula con cada corrección que afecte factores: destino, tipo de vehículo, nº pasajeros/equipaje. Cada recálculo es una **versión visible** en el chat ("Nueva tarifa estimada: S/ 68.00"). |
| Resumen | Se presenta como **"Tarifa estimada protegida"** con la nota: "puede variar solo si cambias destino, vehículo o condiciones del servicio". |
| Confirmación | La última versión aceptada se **congela** en `reservas.cotizacion_*` (mecánica ya existente de F2 — no cambia). |
| Post-confirmación | No cambia en demo. (MVP: solo por incidencia real — cambio de destino, espera extraordinaria.) |

No hay surge ni precio por demanda (D5). La fórmula sigue siendo determinista
(`calcularCotizacionDemo`), extendida con **multiplicador por categoría de vehículo**:
sedán ×1.00 · camioneta/amplio ×1.15 · van/minivan ×1.40 (redondeo a 0.50 ya existente).

### 6.2 El borrador como concepto (F5)

Se formaliza lo que ya existe: la extracción en estado del simulador ES el borrador. F5 le añade:

- **Patch por intención más reciente:** el mensaje nuevo manda sobre el contexto acumulado
  (hoy es al revés: [extractor.ts:181-183](../../packages/ingesta/src/extractor.ts) concatena
  `contexto + mensaje` y el primer match del regex gana). Implementación: extraer sobre el mensaje
  actual primero; rellenar faltantes desde el contexto. "Me equivoqué, solo voy yo y salgo por la
  puerta 4" debe pisar `pasajeros`, `vehiculo_preferencia` y `punto_encuentro` sin tocar el resto.
- **Re-cotización en cada patch** que toque factores (usa `previsualizarPagoDesdeIngesta`, que ya
  existe — [wa-sim/actions.ts:118-142](../../apps/web/src/app/wa-sim/actions.ts)).
- **Resumen re-emitido** tras cada corrección, con la tarifa nueva y "¿Confirmas?".

La reserva real sigue naciendo **solo** al confirmar (ya es así — no cambia).

---

## 7. Pagos: el acto de pagar existe (F7)

### 7.1 Qué cambia y qué no

**No cambia:** el modelo `pagos`/`EstadoPago` de F2, la autorización al crear (semánticamente es
"método validado/reservado", no cobro), ni el cierre `por_liquidar` para crédito hotel/empresa.

**Cambia (quirúrgico):** `cerrarPagoDemo` deja de capturar automáticamente cuando
`responsable_pago=pasajero`:

```
al finalizar el viaje:
  voucher_hotel | factura_empresa  → por_liquidar      (igual que hoy)
  app_pago | efectivo              → por_cobrar        (HOY: capturado automático ← esto se corrige)

en /p/[token], estado finalizado + pago por_cobrar:
  app_pago  → "Pagar ahora" → pasarela demo animada (determinista, setTimeout,
              patrón de la autorización F2) → capturado + auditoría pago_demo_capturado
  efectivo  → "Pagué en efectivo al conductor" → capturado + auditoría
              (en demo confirma el pasajero; MVP: confirma conductor/counter)
```

### 7.2 Copy por responsable

- Pasajero: "Tu reserva está confirmada. **No se realizará ningún cobro todavía** — pagas al
  finalizar el viaje." (chat y `/p/[token]`).
- Empresa/hotel: "Servicio cubierto por {nombre} · el comprobante será emitido a la empresa/hotel."
  Sin botón de pago, nunca.

### 7.3 Comprobante

La mecánica F3 (preparar al finalizar, descargar en `/p/[token]`) no cambia. Ajustes: tipo derivado
de `responsable_pago` (empresa/hotel → factura al pagador corporativo; pasajero → boleta, factura
solo si dio RUC), y para responsable=pasajero el comprobante se habilita **tras capturar** el pago
(no antes), que es el orden natural: pagas → recibes comprobante.

---

## 8. Extractor: hallazgos reales y endurecimiento (F5)

Hallazgos verificados (los dos primeros son bugs presentes hoy):

| # | Hallazgo | Fix |
|---|---|---|
| E1 | "vuelo" sin mención de aeropuerto ⇒ `recojo_aeropuerto` ([extractor.ts:110](../../packages/ingesta/src/extractor.ts)). "Tengo vuelo LA640 mañana, recógeme en mi casa de San Isidro" se clasifica como recojo EN el aeropuerto. | Si hay vuelo + origen residencial/hotel explícito ("recógeme en", dirección no aeroportuaria) ⇒ `traslado_aeropuerto`. El default ambiguo sigue siendo `recojo_aeropuerto` (sesgo de negocio documentado en F4 — se conserva). |
| E2 | El contexto acumulado pisa al mensaje nuevo (orden de concatenación, [extractor.ts:181-183](../../packages/ingesta/src/extractor.ts)): las correcciones del cliente pueden perder contra el dato original. | Prioridad de intención más reciente (§6.2). Tests con secuencias corrección-sobre-dato. |
| E3 | "factura" o RUC en el texto ⇒ solicitante `empresa` ([extractor.ts:95](../../packages/ingesta/src/extractor.ts)). El particular que pide factura se vuelve corporativo. | La factura alimenta `requiere_factura`/`pasajero_ruc`, no el perfil. El perfil solo cambia con señal de pertenencia ("trabajo en", "somos de", nombre de empresa en convenio). |
| E4 | Léxico aeroportuario real incompleto. El Jorge Chávez actual (terminal único) habla de "puerta X", "salida nacional/internacional", "zona de llegadas"; los clientes escriben "mi vuelo se retrasó", "aterrizo a las 5", "vengo de Cusco", aerolíneas (LATAM/Sky/JetSMART → LA/H2/JA). | Ampliar diccionarios: variantes de punto de encuentro ("salida 3", "puerta 4, columna F2"), prefijos de vuelo por aerolínea, expresiones de llegada/retraso. Sin LLM: sigue siendo determinista (el par LLM ya existe vía `withFallback`). |
| E5 | Nuevos campos comerciales no se extraen. | Detectores de perfil/responsable (frases: "lo paga la empresa", "yo asumo", "corre por cuenta del hotel", "viaje personal") + preferencia de vehículo y equipaje en 3 niveles. |

Cada caso de la matriz §2.2 obtiene su test de extracción. La regla de oro 8 aplica: primero el
determinista; el prompt LLM (`packages/ia/prompts/*.md`) se actualiza con los campos nuevos después.

---

## 9. Modelo de datos (deltas F5-F8)

```prisma
enum PerfilPasajero {
  particular
  corporativo
  hotel
}

enum ResponsablePago {
  pasajero
  empresa
  hotel
}

model reservas {
  // ... todo lo existente intacto ...
  perfil_pasajero        PerfilPasajero  @default(particular)
  responsable_pago       ResponsablePago @default(pasajero)
  convenio_validado_demo Boolean         @default(false)
  requiere_factura       Boolean         @default(false)
  vehiculo_preferencia   TipoVehiculo?   // null = "el mejor disponible"
  pasajeros_cantidad     Int?
  equipaje_nivel         String?         // 'poco' | 'normal' | 'grande' (demo; enum en MVP si crece)
  cancelada_por          String?         // 'pasajero' | 'conductor' | 'operador' (auditoría rápida)
  cancelada_motivo       String?
}
```

**Backfill** (misma migración, patrón F1): derivar de `tipo_pago` —
`voucher_hotel → (hotel, hotel, convenio=true)`; `factura_empresa → (corporativo, empresa, convenio=true)`;
`efectivo|app_pago → (particular, pasajero)`. `empresa_nombre`/`hotel_nombre` ya existen y se reutilizan.

**No se crean tablas nuevas.** `empresas_clientes`/`hoteles_aliados` siguen siendo Semilla MVP
(`CLAUDE.md §3`); el "convenio" demo es el diccionario determinista del §2.2.

---

## 10. Secuencia de features

| # | Feature | Prioridad | Depende de | Alcance resumido |
|---|---|---|---|---|
| **F5** | Identidad comercial + borrador inteligente | P0 | — | Migración §9 + backfill · detectores E1-E5 y pregunta en 2 pasos en modo libre · patch por intención reciente · re-cotización por versión + resumen re-emitido · superficies (admin/counter/pasajero/chat) muestran perfil/responsable con copy humano · tests por caso de la matriz §2.2 |
| **F6** | Pago al finalizar + libertades del pasajero | P0 | F5 (responsable_pago) | `cerrarPagoDemo` por responsable (§7.1) · `/p/[token]`: "Pagar ahora" pasarela demo / efectivo confirmado / "cubierto por convenio" · cancelación escalonada del pasajero (§5.3) · comprobante por responsable y tras captura (§7.3) |
| **F7** | Cancelación del conductor + reasignación con disculpas | P1 | F5 (mensajes), F6 (anulación de pago) | Hoja de motivos en driver (§5.4) · transición server transaccional · bandeja "Necesita nueva unidad" en admin · reasignación automática en copiloto + mensaje de disculpas en wa-sim · "Cambiar unidad" en mostrador (§5.5) · broadcast/Realtime de cambio de unidad |
| **F8** | Reserva guiada + preferencia de vehículo | P1 | F5 (motor de borrador) | Modo guiado con menús (§3.3) · preguntas de personas/equipaje/vehículo · multiplicador de cotización por categoría (§6.1) · `vehiculo_preferencia` alimenta `w3·match_tipo` · mensaje "tu conductor inició la ruta" |

Orden de ejecución: **F5 → F6 → F7 → F8**. F5 es la base semántica de todo; F6 cierra el dinero
(lo que más le importa al negocio); F7 cierra la resiliencia; F8 es la capa conversacional vistosa
y va última porque reusa el motor de F5 ya estabilizado.

Los prompts se generan uno a la vez, ajustados con lo aprendido (protocolo del master anterior §9.3):
[`PROMPT_FEATURE_5_IDENTIDAD_COMERCIAL_CODEX.md`](PROMPT_FEATURE_5_IDENTIDAD_COMERCIAL_CODEX.md) ya
está listo; los de F6-F8 se escriben al cerrar la feature precedente.

---

## 11. Qué NO entra (demo ≠ MVP, lista explícita)

- SUNAT/validación de RUC real (el "convenio" es diccionario seed; el copy lo dice con elegancia).
- Pasarela de pago real (Culqi/Niubiz), Yape/Plin reales — pasarela demo animada determinista.
- Surge pricing / tarifa por demanda (D5) y recálculo post-confirmación por tráfico.
- Penalidades de cancelación, no-show, cobros parciales.
- Reembolsos (cancelar antes de pagar no necesita reembolso — por diseño del §7).
- Tabla `empresas_clientes`/`hoteles_aliados` y portal `/empresa` (Semilla MVP).
- Notificación WhatsApp real (WABA stub: los mensajes "al pasajero" viven en wa-sim, como hasta hoy).
- Flight tracking real ("mi vuelo se retrasó" se extrae y se muestra; no se verifica contra LAP).

---

## 12. Protocolo de cierre

Idéntico al master anterior (§7 verificación global + §9 estado por feature): cada feature entrega
`docs/features/ESTADO_FEATURE_<n>.md`, turbo verde completo, e2e autocontenidos (C7: jamás consumir
`TG-2026-0001`), seeds actualizados (`db:seed-operacional` debe dejar A y B demo-ables con la capa
comercial), smoke en Railway tras deploy, y el prompt de la siguiente feature ajustado.

---

## 13. Veredicto

**GO para Feature 5 — Identidad comercial + borrador inteligente.** Es la base semántica: sin
`perfil_pasajero`/`responsable_pago`, el pago al finalizar (F6) no sabe a quién cobrarle, la
reasignación (F7) no sabe a quién disculparse en nombre de quién, y el modo guiado (F8) no sabe
qué preguntar. El flujo A→Z deja de venderse como "reserva + QR" y pasa a venderse como:

> "El pasajero reserva sin fricción y sin quedar atrapado; el sistema sabe quién viaja y quién paga;
> la unidad se revela cuando la operación está validada; si algo cambia, Taxi Green responde con
> elegancia; y el dinero se cobra al final, con comprobante claro para quien corresponde."

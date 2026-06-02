# Decisiones abiertas y bloqueos

**Fecha:** 2026-05-30. Lo único que falta cerrar antes de avanzar. Todo lo demás está decidido (ver `00_LEEME_PRIMERO §4`).

Regla: **nada aquí bloquea Sprint 0** (cimentación pura, agnóstica de paleta y de negocio). Se indica qué sprint toca cada punto.

---

## A. Contradicción real a resolver (1) — bloquea Sprint 1, no Sprint 0

### A1 · Identidad visual: verde Taxi Green vs azul Qorinti chrome + verde tenant

> **✅ DECISIÓN CERRADA (2026-05-29, instrucción del cliente/Jose):** se adopta el **sistema DUAL con paleta AZUL como chrome del producto** (`ESPECIFICACION §7.4`): `product/*` en **azul** (`#0B0952` / `#227FDE`) como chrome de toda la UID + `brand/tenant` en **verde Taxi Green** reservado a logo y chip de tenant + `care/*` (púrpura) en bienestar + semánticos. Ya **no** se usa "verde total" como sistema. Esto resuelve la contradicción de `SPRINT.md §S1.2.E.12` a favor del azul. Los design tokens se implementan en `packages/shared` (placeholder en Sprint 0 ya orientado a azul; tokens definitivos en Sprint 1). El resto de esta sección queda como registro histórico de la deliberación.

**La contradicción (entre documentos activos):**
- `07_PLAN_EJECUCION/SPRINT.md §S1.2.E.12` fija tokens **verdes** como sistema (`verde-principal #0B7A3B`).
- `06_DEMO_TECNICA/ESPECIFICACION_PANTALLAS_PREMIUM §7` + `MAPA_ALINEACION §V1` + el plugin Figma (`screens.master.json` brand) recomiendan **sistema dual**: azul Qorinti `#0B0952`/`#227FDE` como **chrome del producto** + verde Taxi Green **solo en logo y chip de tenant** + púrpura `care` en bienestar.
- `00_EVIDENCIA_REAL` (Raúl, 19-may): *"usa los colores de Taxi Green… el logotipo que está en la web"* → la marca es **verde**.

**Por qué importa para no alucinar:** si el agente construye los design tokens en Sprint 1 sin esto resuelto, pintará toda la UI de un color que el cliente podría rechazar, o mezclará ambas paletas.

**Naturaleza:** es una **decisión de marca que pertenece al cliente** (`Por validar` con Taxi Green). No la cierra un agente.

**Default recomendado para no frenar (rotulado como hipótesis):** implementar en `packages/shared` el **sistema dual** de `ESPECIFICACION §7.4` — `product/*` (azul) como chrome + `brand/tenant` (verde) para logo/chip + semánticos + `care/*`. Es lo más reciente y específico, respeta la evidencia (verde presente como marca) y vende "producto premium ejecutivo". Mostrar ambas variantes al cliente antes de producción.

**Acción:** decidir antes de la tarea de tokens de Sprint 1. Si se confirma el dual, `SPRINT.md §S1.2.E.12` debe leerse con esa corrección (ver nota añadida en ese punto). Si el cliente exige verde total, se conserva el verde como `product/*`.

**Toca:** Sprint 1. **No bloquea Sprint 0.**

---

## B. Inputs de negocio `Por validar` — no bloquean, se siembran como hipótesis rotuladas

| # | Pregunta | Default para la demo | Toca |
|---|---|---|---|
| B1 | `tasa_comision` real al conductor | **20%** rotulado `Hipótesis` (env/config) | S5/S8 (vista `DriverHistorySummary`) |
| B2 | Tarifa exacta Aeropuerto → Miraflores | Semilla demo (valor fijo creíble) | S2/S8 |
| B3 | Política de espera / no-show | Solo enunciar (botón existe) | enunciado |
| B4 | Nombre real del hotel solicitante | Genérico: "Concierge hotel" | S1 (seed) |
| B5 | ¿Tarifa siempre cerrada o a veces estimada? | Asumir cerrada; microcopy neutro | S8 |

Estas se resuelven en **discovery pagado con Taxi Green**, no en la demo. Lista ampliada en `PLAN_SOFTWARE §5` y `LOGICA_NEGOCIO_OPERATIVA §9`.

---

## C. Verificación pendiente en Figma (no es código) — paralela al desarrollo

`MAPA_ALINEACION_PLAN_FIGMA §7` y `VALIDACION_CABLEADO.md` dejan checks **visuales** a confirmar en Figma Desktop (no bloquean código): que `13 Prototype` dé ~70% de peso a la ruta A-Z; que `setReactionsAsync` materialice los botones; que los componentes premium P0 (DriverCard, VehicleCard, RatingTripleCard, AssignmentApprovalPanel) se perciban premium. Es trabajo de diseño, no de Sprint 0/1 de código.

---

## Resumen de bloqueos para empezar desarrollo

| ¿Bloquea Sprint 0? | Bloqueos |
|---|---|
| **NO** | Ninguno. Sprint 0 tiene GO. |
| Pre–Sprint 1 | ~~identidad visual (A1)~~ **✅ CERRADA: paleta AZUL dual (ver A1).** |

> Conclusión: **se puede iniciar Sprint 0 ya.** La decisión de identidad visual quedó **cerrada a favor de la paleta AZUL dual** (chrome azul + verde de marca acotado a logo/chip). Sprint 1 implementa los tokens definitivos sobre esa base.

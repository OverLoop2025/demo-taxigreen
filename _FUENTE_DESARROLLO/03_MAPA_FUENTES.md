# Mapa de Fuentes — qué manda, qué es referencia, qué es histórico

**Fecha:** 2026-05-30. Clasificación de TODO el repositorio para que ningún agente use un documento obsoleto como fuente de implementación.

**Leyenda:**
- 🟢 **MANDA** — fuente activa para escribir código.
- 🔵 **REFERENCIA** — consultar para contexto/visual; no es fuente de flujo ni de decisiones.
- ⚪ **HISTÓRICO** — memoria del proceso. NO usar para implementar.
- 🚫 **PROHIBIDO** — no tocar / no construir lo que describe.

---

## Carpeta activa de desarrollo

| Archivo | Clase | Nota |
|---|---|---|
| `_FUENTE_DESARROLLO/00_LEEME_PRIMERO.md` | 🟢 | Entrada. Orden de lectura, precedencia, GO. |
| `_FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md` | 🟢 | Documento central destilado. |
| `_FUENTE_DESARROLLO/02_PROMPT_SPRINT_0.md` | 🟢 | Prompt de arranque Sprint 0. |
| `_FUENTE_DESARROLLO/03_MAPA_FUENTES.md` | 🟢 | Este archivo. |
| `_FUENTE_DESARROLLO/04_DECISIONES_ABIERTAS.md` | 🟢 | Lo único pendiente de decidir. |
| `_FUENTE_DESARROLLO/GLOSARIO_FLUJOS_TAXIGREEN.md` | 🟢 | Glosario sagrado de roles/términos (movido desde 08). |
| `_FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md` | 🟢 | Contrato de flujo + seed (movido desde 08). |
| `_FUENTE_DESARROLLO/_historico_proceso/*` | ⚪ | Reportes del proceso de reconciliación (ex-08). No implementar desde aquí. |

---

## 07_PLAN_EJECUCION — base de software (permanece en su sitio)

| Archivo | Clase | Nota |
|---|---|---|
| `PLAN_SOFTWARE.md` (v4.0) | 🟢 | Plan técnico canónico. Stack, alcance, modelo de datos §7.6, arquitectura. |
| `SPRINT.md` (v3.0) | 🟢 | 10 sprints S0–S9 con criterios y prompts. |
| `LOGICA_NEGOCIO_OPERATIVA.md` (v1.0) | 🟢 | Deltas de esquema §8, asignación, cola, calificación, importes. **Imprescindible junto al §7.6.** |

> No se movieron a `_FUENTE_DESARROLLO/` a propósito: el plugin Figma referencia `07_PLAN_EJECUCION/LOGICA_NEGOCIO_OPERATIVA.md` por ruta en `screens.master.json` (no modificable). Moverlos rompería esa referencia. La carpeta activa los declara canónicos y los enruta.

---

## 06_DEMO_TECNICA — negocio, guion, pantallas y Figma

| Archivo | Clase | Nota |
|---|---|---|
| `FLUJO_NEGOCIO_CANONICO.md` (v1.0) | 🟢 | Negocio canónico: actores, canales, flujos, estados, reglas. Manda sobre el resto de 06. |
| `ESPECIFICACION_PANTALLAS_PREMIUM.md` (v1.0) | 🟢 | Pantallas hero + componentes premium + microcopy. |
| `CONTRATO_NARRATIVO_DEMO.md` (v1.0) | 🟢 | Guion de 12 min, orden de pantallas, una acción primaria por pantalla. |
| `MAPA_ALINEACION_PLAN_FIGMA.md` (v1.1) | 🟢 | Matriz requisito↔Figma con prioridad P0/P1/P2. |
| `figma-plugin-taxigreen-master/` (`code.js`, `screens.master.json`, `manifest.json`, `README.md`, `VALIDACION_CABLEADO.md`, `scripts/`) | 🟢🚫 | Referencia de pantallas/cableado. Se ejecuta en Figma Desktop para regenerar. **No modificar `code.js` ni `screens.master.json`.** |
| `GUIA_FIGMA_FLUJO_DEMO.md` | 🔵 | Cómo leer el Figma. Útil, secundario. |
| `logo.jpg` | 🔵 | Asset de marca. |
| `DISEÑO_UI_DETALLADO.md` (102 KB) | 🔵 | Referencia visual exhaustiva. Etiquetas antiguas **subordinadas** al glosario (nota post-Figma en su cabecera). No es fuente de flujo. |
| `PLAN_SOFTWARE_DEMO.md` (2026-05-23) | ⚪ | **Superado** por `07/PLAN_SOFTWARE.md` v4.0 (proponía 15+ tablas, 18–22 días, PWA conductor). No usar. |
| `INDEX.md` | ⚪ | Describe el set viejo (PWA, 15 tablas). Obsoleto. |
| `AUDITORIA_FIGMA_WOW.md` | ⚪ | Auditoría que originó las correcciones. Histórico. |

---

## 00–05 — evidencia, investigación, propuestas, síntesis, visión

| Carpeta / archivo | Clase | Nota |
|---|---|---|
| `00_EVIDENCIA_REAL/` (transcripciones, `PROBLEMA_ordenado`, taxigreen/*, referencias_qorinti/*) | 🔵 | **Evidencia: la fuente de verdad última.** Consultar ante cualquier duda de negocio. No es "código", es el sustrato. |
| `01_INVESTIGACIONES_IA/` (claude, chatgpt, gemini) | 🔵 | Análisis auxiliar. Privilegiar Claude ante conflicto. No autoridad. |
| `02_PROPUESTAS_PREVIAS/` (PROPUESTA_DEMO, PLAN_DE_SOFTWARE 1703 líneas, MASTERPLAN, PROBLEMA_ordenado) | ⚪ | Propuestas del 19-may. Superadas por 06/07. `PROPUESTA_DEMO` rescató el "corazón operativo" (counter/cola) ya integrado en `FLUJO_NEGOCIO_CANONICO`. |
| `03_REFERENCIAS_EXTERNAS/` (WAREM, vision_final_warem) | 🔵🚫 | Solo inspiración de estilo/filosofía. **No trasladar el dominio WAREM/Pepethefrog a Taxi Green.** |
| `04_SINTESIS_TRABAJO/` | ⚪ | Síntesis del 21-may. `vision_final_taxigreen_refinada.md` se cita como framing comercial del MVP; el resto histórico. **Stubs vacíos (0 bytes):** `decisiones_producto.md`, `matriz_comparativa.md`, `vision_chatgpt.md`, `vision_claude.md`, `vision_gemini.md`. |
| `05_FINAL/` | ⚪ | Visión "destino" del 22-may. `vision_final_perfecta.md` se cita como destino (no demo, no MVP fase 1). `vision_final_perfecta_antigua.md` y `vision_final_taxigreen.md` muertos. **Stubs vacíos (0 bytes):** `demo_final_taxigreen.md`, `pitch_reunion.md`, `preguntas_para_cliente.md`, `roadmap_validacion.md`. |

---

## Raíz / tooling

| Archivo | Clase | Nota |
|---|---|---|
| `CLAUDE.md` | 🟢 | Instrucciones del proyecto (rol analista neutral). Vigente. |
| `AGENTS.md` | ⚪ | Volcado de contexto de claude-mem (memoria auto). No es fuente. |
| `.agents/`, `skills-lock.json` | 🔵 | Tooling de skills. No tocar. |

---

## Stubs vacíos (0 bytes) — limpieza opcional

No estorban al desarrollo, pero son ruido. Si se quiere limpiar: `04_SINTESIS_TRABAJO/{decisiones_producto, matriz_comparativa, vision_chatgpt, vision_claude, vision_gemini}.md` y `05_FINAL/{demo_final_taxigreen, pitch_reunion, preguntas_para_cliente, roadmap_validacion}.md`. **No se eliminaron en esta pasada** para no borrar nombres que alguien pudiera querer rellenar; quedan marcados como vacíos.

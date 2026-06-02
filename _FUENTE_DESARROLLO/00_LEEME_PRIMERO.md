# LÉEME PRIMERO — Fuente de Desarrollo Taxi Green

**Esta es la carpeta activa para pasar a programación.** Todo agente humano o IA que vaya a escribir código del demo de Taxi Green empieza aquí.

**Fecha de consolidación:** 2026-05-30
**Estado:** lista para Sprint 0. `GO` condicionado (ver §6).

---

## 0. Qué es esta carpeta

Es la **fuente de verdad operativa** ("skill interna") destilada del repositorio. El repo acumuló investigación, evidencia, visiones, propuestas, Figma, plan de software y reportes de agentes a lo largo de mayo 2026. Mucho de eso es **histórico o superado**. Esta carpeta separa lo que **manda** de lo que es **memoria**.

No reabre decisiones cerradas. No inventa producto nuevo. Solo ordena para que un agente de programación **no alucine**.

---

## 1. Orden de lectura para un agente de programación

Lee en este orden. No saltes pasos.

| # | Documento | Para qué |
|---|---|---|
| 1 | **[01_FUENTE_DE_VERDAD.md](01_FUENTE_DE_VERDAD.md)** | Qué se construye: problema, flujo protagonista, actores, superficies, demo vs simulado vs enunciado vs MVP, stack, modelo de datos, reglas de negocio, qué pantallas del Figma importan, qué está prohibido. **El documento central.** |
| 2 | **[GLOSARIO_FLUJOS_TAXIGREEN.md](GLOSARIO_FLUJOS_TAXIGREEN.md)** | Términos obligatorios (solicitante vs pasajero final vs origen físico) y frases prohibidas. Evita el error #1: invertir el flujo. |
| 3 | **[CONTRATO_FLUJO_PROTAGONISTA.md](CONTRATO_FLUJO_PROTAGONISTA.md)** | Contrato cerrado del flujo + seed + criterios de aceptación de dirección física. |
| 4 | **[04_DECISIONES_ABIERTAS.md](04_DECISIONES_ABIERTAS.md)** | Lo único que falta decidir. Qué bloquea y qué no. Léelo antes de tocar tokens de diseño o tarifas. |
| 5 | **[02_PROMPT_SPRINT_0.md](02_PROMPT_SPRINT_0.md)** | El prompt exacto con el que arranca Sprint 0. |
| 6 | **[03_MAPA_FUENTES.md](03_MAPA_FUENTES.md)** | Mapa de TODO el repo: qué manda, qué es referencia, qué es histórico, qué está prohibido usar. Consúltalo cuando dudes si un archivo viejo aplica. |

Los documentos técnicos profundos (plan, sprints, lógica de datos, pantallas premium, plugin Figma) **permanecen en su sitio** (`07_PLAN_EJECUCION/` y `06_DEMO_TECNICA/`) porque el plugin Figma los referencia por ruta y no debe modificarse. Esta carpeta los **declara canónicos y los enruta** (ver §3).

---

## 2. Regla de precedencia (cuál documento gana)

Cuando dos documentos se contradigan, gana el de mayor jerarquía:

```
1. 00_EVIDENCIA_REAL/            (transcripciones, frases de Raúl)   ← la evidencia manda
2. _FUENTE_DESARROLLO/           (esta carpeta: glosario + contrato + fuente de verdad)
3. 06_DEMO_TECNICA/FLUJO_NEGOCIO_CANONICO.md  (negocio canónico)
4. 07_PLAN_EJECUCION/            (PLAN_SOFTWARE v4.0, SPRINT v3.0, LOGICA v1.0)
5. 06_DEMO_TECNICA/ (resto activo: ESPECIFICACION, CONTRATO_NARRATIVO, MAPA, plugin)
   ─────────────────────────────────────────────────────────────────
   POR DEBAJO DE ESTA LÍNEA = HISTÓRICO / REFERENCIA, NO FUENTE ACTIVA
   02_PROPUESTAS_PREVIAS/  04_SINTESIS_TRABAJO/  05_FINAL/
   01_INVESTIGACIONES_IA/  03_REFERENCIAS_EXTERNAS/
   06_DEMO_TECNICA/{PLAN_SOFTWARE_DEMO, DISEÑO_UI_DETALLADO, INDEX, AUDITORIA_FIGMA_WOW, GUIA_FIGMA}
```

Regla práctica: **documento más reciente + más cercano a la evidencia gana**, salvo que un antiguo conserve lógica operativa real que el nuevo perdió (ya reconciliado en `FLUJO_NEGOCIO_CANONICO.md`).

---

## 3. Qué manda, qué es referencia, qué es histórico (resumen)

Detalle completo en [03_MAPA_FUENTES.md](03_MAPA_FUENTES.md). Resumen:

**MANDA (fuente activa para código):**
- `_FUENTE_DESARROLLO/*` (esta carpeta).
- `07_PLAN_EJECUCION/PLAN_SOFTWARE.md` · `SPRINT.md` · `LOGICA_NEGOCIO_OPERATIVA.md`.
- `06_DEMO_TECNICA/FLUJO_NEGOCIO_CANONICO.md` · `ESPECIFICACION_PANTALLAS_PREMIUM.md` · `CONTRATO_NARRATIVO_DEMO.md` · `MAPA_ALINEACION_PLAN_FIGMA.md`.
- `06_DEMO_TECNICA/figma-plugin-taxigreen-master/` (referencia de pantallas/cableado; **no modificar**).

**REFERENCIA (consultar, no fuente de flujo):**
- `06_DEMO_TECNICA/DISEÑO_UI_DETALLADO.md` (referencia visual; etiquetas viejas subordinadas al glosario).
- `06_DEMO_TECNICA/GUIA_FIGMA_FLUJO_DEMO.md`, `logo.jpg`.
- `00_EVIDENCIA_REAL/`, `01_INVESTIGACIONES_IA/`, `03_REFERENCIAS_EXTERNAS/` (contexto).

**HISTÓRICO (NO usar como fuente de implementación):**
- `02_PROPUESTAS_PREVIAS/`, `04_SINTESIS_TRABAJO/`, `05_FINAL/`.
- `06_DEMO_TECNICA/{PLAN_SOFTWARE_DEMO.md, INDEX.md, AUDITORIA_FIGMA_WOW.md}`.
- `_FUENTE_DESARROLLO/_historico_proceso/` (reportes del proceso de reconciliación).

---

## 4. Decisiones cerradas (NO reabrir sin contradicción crítica en evidencia)

- **Flujo protagonista = Recojo en aeropuerto.** Hotel/concierge = solicitante por WhatsApp; origen físico = Aeropuerto Jorge Chávez; punto de encuentro = Salida 3, columna F2; destino = Av. Pardo 123, Miraflores.
- **App del conductor = nativa React Native + Expo SDK 51** (Capacitor descartado).
- **Demo ≠ MVP.** La demo cuenta UN flujo A→Z; el MVP construye el producto.
- **Pasajero = link `/p/[token]`, sin app nativa.** El wizard de reserva del pasajero (Figma `1.B–1.E`) NO es entrada protagonista.
- **Bienestar = soporte de viaje / objeto olvidado dentro de `/p/[token]`**, no app separada.
- **Empresa cliente = enunciado** (1 lámina), no protagonista. No construir `/empresa`.
- **Backend = Next.js** (no NestJS). **Monolito modular** en monorepo Turborepo (no microservicios).
- **DB = PostgreSQL 17 + Prisma** (no Mongo). **Real-time = Supabase Realtime** en demo.
- **10 tablas en demo** (no 17). El esquema demo = `PLAN_SOFTWARE §7.6` **+ deltas de `LOGICA_NEGOCIO_OPERATIVA §8`**.

---

## 5. Qué está PROHIBIDO construir en la demo

App pasajero nativa · login social/OAuth pasajero · portal `/empresa` con reportes · OCR on-device · biometría conductor · background location con foreground service · RLS multi-tenant activo · cadena de fallbacks RENIEC · 9 tipologías extra de bienestar · marketplace/subasta · tarifa dinámica tipo Uber · flight tracking · liquidación real al conductor (solo mockup) · SaaS multi-operador · iOS (solo Android demo). Lista completa en `PLAN_SOFTWARE §2.3` y `§6`.

---

## 6. ¿Hay GO para Sprint 0?

**SÍ — GO para Sprint 0.** Sprint 0 es solo cimentación (monorepo, apps stub, packages vacíos, CI, provisión Supabase). Es **agnóstico de paleta y de inputs de negocio**, por lo que ninguna decisión abierta lo bloquea.

**Antes de Sprint 1** debe resolverse 1 decisión (no bloquea S0):
1. **Identidad visual** (verde Taxi Green vs azul Qorinti chrome + verde tenant). Ver [04_DECISIONES_ABIERTAS.md](04_DECISIONES_ABIERTAS.md). Hay default recomendado.

Inputs de negocio `Por validar` (sembrables como hipótesis rotuladas, no bloquean): `tasa_comision`, tarifa exacta Aeropuerto→Miraflores, política no-show, nombre real del hotel (genérico OK).

---

## 7. Instrucción exacta para el agente de programación

> Lee `_FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md`, luego `GLOSARIO_FLUJOS_TAXIGREEN.md` y `CONTRATO_FLUJO_PROTAGONISTA.md`. Ejecuta **solo Sprint 0** según `_FUENTE_DESARROLLO/02_PROMPT_SPRINT_0.md` (que refleja `07_PLAN_EJECUCION/SPRINT.md §Sprint 0`). No implementes features, modelos de datos ni UI más allá de placeholders. No toques el plugin Figma. Al terminar Sprint 0, detente y reporta CI verde antes de pedir Sprint 1.

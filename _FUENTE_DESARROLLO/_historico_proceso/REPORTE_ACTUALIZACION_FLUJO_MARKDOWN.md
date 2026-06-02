# Reporte de Actualización de Flujo Markdown

**Fecha:** 2026-05-30  
**Alcance:** documentación y prompts. No se modificó código de aplicación ni `code.js`.

---

## 1. Veredicto final

La documentación queda alineada para iniciar software con una decisión única:

```text
Flujo protagonista = Recojo en aeropuerto
Solicitante = hotel/concierge por WhatsApp
Pasajero final = huésped que llega a Lima
Origen físico = Aeropuerto Jorge Chávez, llegadas, Salida 3 columna F2
Destino físico = Av. Pardo 123, Miraflores
```

La variante ciudad/hotel/casa/oficina -> aeropuerto queda como **Traslado hacia aeropuerto**, válida para MVP/rutas secundarias, no para la demo protagonista.

---

## 2. Archivos creados

| Archivo | Propósito |
|---|---|
| `08_SOFTWARE_PRODUCTO/00_INSTRUCCIONES_SAGRADAS/GLOSARIO_FLUJOS_TAXIGREEN.md` | Glosario obligatorio de roles, dirección física y frases prohibidas. |
| `08_SOFTWARE_PRODUCTO/03_CONTRATOS_IMPLEMENTACION/CONTRATO_FLUJO_PROTAGONISTA.md` | Contrato de implementación con ruta, seed y criterios de aceptación. |
| `08_SOFTWARE_PRODUCTO/04_SPRINTS/AUDITORIA_FLUJO_POST_FIGMA.md` | Auditoría de contradicciones y resolución documental. |
| `08_SOFTWARE_PRODUCTO/06_PROMPTS_AGENTES/PROMPT_CODEX_SOFTWARE_S0_S1_ACTUALIZADO.md` | Prompt actualizado para agentes de software S0/S1. |
| `08_SOFTWARE_PRODUCTO/04_SPRINTS/REPORTE_ACTUALIZACION_FLUJO_MARKDOWN.md` | Este reporte de cierre. |

---

## 3. Archivos modificados

| Archivo | Corrección principal |
|---|---|
| `06_DEMO_TECNICA/FLUJO_NEGOCIO_CANONICO.md` | Agregada regla P0 de dirección física y roles; protagonista renombrado como Recojo en aeropuerto. |
| `06_DEMO_TECNICA/CONTRATO_NARRATIVO_DEMO.md` | Cerrado caso operativo hotel solicitante -> aeropuerto -> Miraflores; counter como apoyo. |
| `06_DEMO_TECNICA/ESPECIFICACION_PANTALLAS_PREMIUM.md` | Agregado lenguaje operativo obligatorio y datos exactos por pantalla hero. |
| `06_DEMO_TECNICA/MAPA_ALINEACION_PLAN_FIGMA.md` | Actualizado a versión post-Figma con validación semántica D0/D1/D2. |
| `06_DEMO_TECNICA/DISEÑO_UI_DETALLADO.md` | Añadida nota de subordinación histórica al glosario actual. |
| `06_DEMO_TECNICA/GUIA_FIGMA_FLUJO_DEMO.md` | Corregido "salida aeropuerto" a "Recojo en aeropuerto". |
| `06_DEMO_TECNICA/figma-plugin-taxigreen-master/README.md` | Aclarada ruta física y rol del hotel como solicitante. |
| `06_DEMO_TECNICA/figma-plugin-taxigreen-master/VALIDACION_CABLEADO.md` | Añadida validación semántica del flujo. |
| `07_PLAN_EJECUCION/LOGICA_NEGOCIO_OPERATIVA.md` | Agregado `tipo_viaje`, solicitante y seed protagonista. |
| `07_PLAN_EJECUCION/PLAN_SOFTWARE.md` | Corregido flujo protagonista que antes decía conductor va al hotel/lleva al aeropuerto. |
| `07_PLAN_EJECUCION/SPRINT.md` | Agregada corrección transversal S0/S1, seed, schema y prueba manual actualizados. |

---

## 4. Contradicciones resueltas

| Contradicción | Resolución |
|---|---|
| "Hotel -> aeropuerto" como protagonista | Reemplazado por hotel solicitante y viaje físico Aeropuerto -> Miraflores. |
| "Va al hotel" en `PLAN_SOFTWARE.md` | Corregido a conductor va al Jorge Chávez. |
| Test manual "Hilton Miraflores al aeropuerto" | Reemplazado por recojo en Jorge Chávez hacia Av. Pardo 123. |
| "salida aeropuerto" como tipo de viaje | Reemplazado por Recojo en aeropuerto y glosario de términos. |
| Hotel mezclado con origen físico | Separado en `solicitante_*`, `hotel_nombre`, `origen_texto` y `destino_texto`. |
| Counter como flujo ambiguo | Fijado como walk-in Aeropuerto -> destino en Lima. |
| Bienestar como app/actor aparte | Reencuadrado como soporte de viaje / objeto olvidado dentro de `/p/[token]`. |

---

## 5. Impacto en software

- `reservas` debe incluir `tipo_viaje`.
- El seed de Sprint 1 debe crear una reserva protagonista con origen Aeropuerto Jorge Chávez y destino Av. Pardo 123, Miraflores.
- Los prompts de ingesta deben separar `solicitante` de `origen_texto`.
- La app conductor debe mostrar recojo en aeropuerto, no hotel.
- El link pasajero debe mostrar Salida 3, columna F2.
- El counter debe crear/validar servicios Aeropuerto -> Lima.

---

## 6. Riesgos y pendientes

- `04_SINTESIS_TRABAJO/*.md` y `05_FINAL/*.md` conservan material histórico con ambos sentidos de viaje. No se editaron masivamente; quedan subordinados al glosario y contrato.
- `DISEÑO_UI_DETALLADO.md` aún contiene etiquetas antiguas en secciones históricas; se agregó nota superior de subordinación. Si se reutiliza para implementación, leer primero el glosario.
- No se modificó `screens.master.json`; se usó como referencia de ruta validada.
- No se ejecutaron tests de app porque la tarea fue documental.

---

## 7. Preguntas abiertas

| Pregunta | Estado |
|---|---|
| ¿Nombre real del hotel solicitante para el seed? | Puede quedar genérico en demo: "Concierge hotel". |
| ¿Vuelo definitivo del guion? | Se mantiene LA2456 como seed. |
| ¿Tarifa exacta del tramo Aeropuerto -> Miraflores? | Por validar con Taxi Green; puede ser semilla demo. |
| ¿Tasa de comisión real al conductor? | Fuera del alcance de esta corrección. |

---

## 8. Checklist de arranque S0/S1

- [x] Glosario creado.
- [x] Contrato de flujo protagonista creado.
- [x] Plan de software corregido.
- [x] Sprint plan corregido.
- [x] Prompt Codex S0/S1 creado.
- [x] Plugin docs aclarados.
- [x] Counter definido como ruta secundaria aeropuerto -> Lima.
- [x] Objeto olvidado definido como soporte del viaje.
- [ ] Al iniciar código, implementar `tipo_viaje` y campos `solicitante_*`.
- [ ] Al crear seed, verificar origen/destino exactos.

**Prompt recomendado para Sprint 0/1:**  
`08_SOFTWARE_PRODUCTO/06_PROMPTS_AGENTES/PROMPT_CODEX_SOFTWARE_S0_S1_ACTUALIZADO.md`


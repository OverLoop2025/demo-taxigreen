# Auditoría de Flujo Post-Figma

**Fecha:** 2026-05-30  
**Estado:** auditoría documental posterior a la generación del Figma master.  
**Alcance:** Markdown canónico, plan de software, sprint plan, plugin docs y prompts iniciales.

---

## 1. Veredicto de auditoría

Había una ambigüedad real entre dos historias:

1. **Ciudad/hotel -> aeropuerto**, heredada de documentos anteriores y de prompts de software.
2. **Aeropuerto -> ciudad**, que es la decisión canónica para la demo protagonista actual.

La decisión cerrada es:

```text
Demo protagonista = recojo en aeropuerto.
Hotel/concierge = solicitante por WhatsApp.
Pasajero final = persona que llega al aeropuerto.
Origen físico = Aeropuerto Jorge Chávez, Salida 3, columna F2.
Destino = Av. Pardo 123, Miraflores.
```

---

## 2. Contradicciones detectadas

| Fuente | Estado | Problema | Resolución |
|---|---|---|---|
| `PLAN_SOFTWARE.md` | Contradicción fuerte | El flujo decía que el conductor iba al hotel y llevaba al pasajero al aeropuerto. | Reescrito como recojo en aeropuerto: conductor va al Jorge Chávez y lleva a Miraflores. |
| `SPRINT.md` | Contradicción fuerte | Test manual S4 usaba "Hilton Miraflores al aeropuerto". | Reescrito como pedido de hotel para recoger en aeropuerto y llevar a Av. Pardo 123. |
| `FLUJO_NEGOCIO_CANONICO.md` | Parcialmente correcto | Ya narraba aeropuerto -> destino, pero no cerraba con suficiente fuerza hotel como solicitante. | Se agregó regla P0 de roles y términos. |
| `CONTRATO_NARRATIVO_DEMO.md` | Parcialmente correcto | Guion correcto en líneas generales, pero podía leerse "hotel" como origen. | Se agregó bloque operativo de roles y dirección física. |
| `ESPECIFICACION_PANTALLAS_PREMIUM.md` | Parcialmente correcto | Pantallas no exigían explícitamente el origen físico en cada hero. | Se agregó lenguaje obligatorio y datos de origen/destino por pantalla. |
| `MAPA_ALINEACION_PLAN_FIGMA.md` | Desactualizado | Seguía auditando un Figma anterior como si no hubiera ruta A-Z generada. | Se agregó estado post-Figma y requisito D0 de dirección física. |
| `LOGICA_NEGOCIO_OPERATIVA.md` | Falta de modelo | No separaba `tipo_viaje` de `canal_origen`/`hotel_nombre`. | Se agregó enum semántico y seed protagonista. |
| `README.md` plugin | Parcial | Ruta A-Z existía, pero faltaba decir hotel = solicitante. | Se aclaró ruta física del flujo. |
| `VALIDACION_CABLEADO.md` | Parcial | Validaba cableado técnico, no semántica de negocio. | Se agregó validación semántica. |

---

## 3. Documentos históricos

`04_SINTESIS_TRABAJO/*.md` y `05_FINAL/*.md` conservan material previo con ambos sentidos de viaje. No se editaron de forma masiva porque funcionan como memoria histórica y fuentes de contraste. Desde ahora quedan subordinados a:

1. `08_SOFTWARE_PRODUCTO/00_INSTRUCCIONES_SAGRADAS/GLOSARIO_FLUJOS_TAXIGREEN.md`
2. `08_SOFTWARE_PRODUCTO/03_CONTRATOS_IMPLEMENTACION/CONTRATO_FLUJO_PROTAGONISTA.md`
3. `06_DEMO_TECNICA/FLUJO_NEGOCIO_CANONICO.md`

Si un agente usa esos documentos históricos, debe leer primero el glosario y el contrato de flujo protagonista.

---

## 4. Dudas cerradas

| Duda | Decisión |
|---|---|
| ¿El hotel es origen físico? | No. Es solicitante/canal. |
| ¿El pasajero está en hotel en la demo? | No. El pasajero final llega al aeropuerto. |
| ¿El conductor va al hotel? | No en el flujo protagonista. Va al aeropuerto. |
| ¿"Salida del aeropuerto" es etiqueta aceptable? | Solo si se explica como "Recojo en aeropuerto: aeropuerto -> ciudad". Se prefiere no usarla. |
| ¿Counter es protagonista? | No. Es ruta secundaria obligatoria. |
| ¿Bienestar es producto separado? | No. Es soporte del viaje dentro del mismo link. |

---

## 5. Riesgos residuales

- Documentos antiguos pueden seguir usando ciudad -> aeropuerto como una variante válida. Eso no es incorrecto si se marca como MVP/no protagonista.
- Algunas pantallas históricas del documento `DISEÑO_UI_DETALLADO.md` usan etiquetas anteriores. El contrato actual las subordina; solo deben consultarse como referencia visual, no como fuente de flujo protagonista.
- `screens.master.json` se usa como referencia de ruta validada, pero la fuente ejecutable sigue siendo `code.js`.

---

## 6. Checklist de cierre

- [x] Flujo protagonista fijado como Aeropuerto -> Miraflores.
- [x] Hotel/concierge fijado como solicitante.
- [x] Pasajero final fijado como persona que viaja.
- [x] Counter walk-in fijado como Aeropuerto -> destino en Lima.
- [x] Objeto olvidado fijado como soporte de viaje.
- [x] PLAN_SOFTWARE y SPRINT alineados para Sprint 0/1.
- [x] Prompt actualizado para agentes de software S0/S1.


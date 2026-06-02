# Glosario de Flujos Taxi Green

**Fecha:** 2026-05-30  
**Estado:** instrucción sagrada para demo y Sprint 0/1.  
**Propósito:** eliminar ambigüedad entre quien solicita un servicio, quien viaja y hacia dónde se mueve físicamente el pasajero.

---

## 1. Decisión canónica

El flujo protagonista de la demo es:

```text
Solicitante hotel/concierge por WhatsApp
  -> reserva de recojo en aeropuerto
  -> pasajero final llega al Aeropuerto Jorge Chávez
  -> conductor recoge en llegadas, Salida 3, columna F2
  -> traslado a Av. Pardo 123, Miraflores
```

La dirección física es **Aeropuerto Jorge Chávez -> destino en Lima**.

---

## 2. Términos obligatorios

| Término | Definición | Uso correcto |
|---|---|---|
| **Solicitante** | Persona o entidad que inicia el pedido. Puede ser hotel, concierge, empresa, operador o pasajero. | "El hotel es el solicitante por WhatsApp." |
| **Pasajero final** | Persona que realmente viaja. En el flujo protagonista está físicamente en el aeropuerto al momento del recojo. | "El pasajero final abre `/p/[token]` al llegar a Lima." |
| **Recojo en aeropuerto** | Servicio físico **Aeropuerto Jorge Chávez -> ciudad / Lima**. | "Recojo en aeropuerto hacia Miraflores." |
| **Traslado hacia aeropuerto** | Servicio físico **ciudad / hotel / casa / oficina -> Aeropuerto Jorge Chávez**. | "Variante MVP: traslado hacia aeropuerto." |
| **Counter walk-in** | Pedido presencial en el módulo del aeropuerto, sin reserva previa por WhatsApp. | "Counter walk-in -> destino en Lima." |
| **Soporte de viaje / objeto olvidado** | Arco de ayuda posterior al viaje, dentro del mismo link del pasajero. | "Objeto olvidado es soporte del viaje, no una app separada." |

---

## 3. Datos semilla del flujo protagonista

| Campo | Valor canónico |
|---|---|
| `tipo_viaje` | `recojo_aeropuerto` |
| `canal_origen` | `whatsapp_oficial` o `hotel` según implementación; ambos representan canal, no origen físico |
| Solicitante | Hotel / concierge |
| Pasajero final | Huésped que llega a Lima |
| Origen físico | Aeropuerto Jorge Chávez, llegadas |
| Punto de encuentro | Salida 3, columna F2 |
| Destino físico | Av. Pardo 123, Miraflores |
| Vuelo ejemplo | LA2456 |
| Superficie del pasajero | Link `/p/[token]`, sin app nativa |

---

## 4. Frases a evitar o aclarar

Estas frases quedan prohibidas en prompts, criterios de aceptación y microcopy si no se explican de inmediato:

| Frase ambigua | Reemplazo |
|---|---|
| "salida aeropuerto" | "Recojo en aeropuerto" o "Traslado hacia aeropuerto", según dirección física |
| "salida del aeropuerto" | "Recojo en aeropuerto: Aeropuerto -> ciudad" |
| "hacia aeropuerto" como protagonista | "Recojo en aeropuerto" |
| "hotel -> aeropuerto" como protagonista | "Hotel solicita por WhatsApp; pasajero final viaja Aeropuerto -> Miraflores" |
| "WhatsApp hotel" sin explicación | "WhatsApp iniciado por solicitante hotel/concierge" |
| "pasajero en hotel" en protagonista | "pasajero final llega al aeropuerto" |
| "Bienestar" como actor/app separada | "Soporte de viaje / objeto olvidado dentro del link del pasajero" |

---

## 5. Regla para futuras decisiones

Cuando un documento diga "hotel", preguntar siempre:

```text
¿Hotel como solicitante/canal o hotel como origen físico?
```

En el flujo protagonista, la respuesta es siempre:

```text
Hotel = solicitante/canal.
Origen físico = Aeropuerto Jorge Chávez.
```

Cuando se necesite el flujo inverso, nombrarlo explícitamente como **Traslado hacia aeropuerto** y marcarlo como variante MVP o ruta secundaria, no como demo protagonista.


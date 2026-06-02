# Prompt Codex Software S0/S1 Actualizado

**Fecha:** 2026-05-30  
**Uso:** entregar a Codex/agent antes de iniciar Sprint 0 o Sprint 1.  
**Objetivo:** evitar que el software nazca con el flujo físico invertido.

---

## Prompt

```text
Trabajas en el software demo de Taxi Green.

ANTES DE TOCAR CÓDIGO, LEE ESTOS DOCUMENTOS EN ESTE ORDEN:
1. 08_SOFTWARE_PRODUCTO/00_INSTRUCCIONES_SAGRADAS/GLOSARIO_FLUJOS_TAXIGREEN.md
2. 08_SOFTWARE_PRODUCTO/03_CONTRATOS_IMPLEMENTACION/CONTRATO_FLUJO_PROTAGONISTA.md
3. 06_DEMO_TECNICA/FLUJO_NEGOCIO_CANONICO.md
4. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md
5. 07_PLAN_EJECUCION/SPRINT.md

DECISIÓN CANÓNICA:
- El flujo protagonista NO es hotel -> aeropuerto.
- El flujo protagonista ES recojo en aeropuerto: Aeropuerto Jorge Chávez -> Av. Pardo 123, Miraflores.
- Hotel/concierge es solicitante por WhatsApp, no origen físico.
- Pasajero final es quien viaja y está en el aeropuerto al momento del recojo.
- Punto de encuentro: Salida 3, columna F2.
- Counter walk-in también es aeropuerto -> destino en Lima.
- Objeto olvidado es soporte del viaje dentro de /p/[token], no una app separada.

REGLA DE IMPLEMENTACIÓN:
Si ves "hotel", modela dos conceptos separados:
1. solicitante_nombre / solicitante_tipo / hotel_nombre: canal o entidad que pide.
2. origen_texto: ubicación física del recojo.

Para el seed protagonista usa:
tipo_viaje = 'recojo_aeropuerto'
canal_origen = 'whatsapp_oficial'
solicitante_tipo = 'hotel'
origen_texto = 'Aeropuerto Jorge Chávez - Llegadas'
punto_encuentro = 'Salida 3, columna F2'
destino_texto = 'Av. Pardo 123, Miraflores'

NO uses como prueba manual:
"del Hilton Miraflores al aeropuerto"

Usa como prueba manual:
"Hola, soy el concierge. Necesito recojo en el Jorge Chávez para una huésped que llega mañana 03:45 en vuelo LA2456. Punto de encuentro Salida 3 columna F2. Destino Av. Pardo 123, Miraflores. 2 pasajeros, 2 maletas. Pago voucher hotel."

CRITERIOS DE ACEPTACIÓN TRANSVERSALES S0/S1:
- El schema permite separar canal/solicitante/origen/destino.
- El seed idempotente contiene al menos una reserva protagonista con origen Aeropuerto y destino Miraflores.
- El nombre del hotel nunca reemplaza `origen_texto`.
- La app del conductor muestra "recoger en Aeropuerto Jorge Chávez", no "ir al hotel".
- El link /p/[token] muestra punto de encuentro aeroportuario.
- El counter mantiene ruta walk-in Aeropuerto -> destino en Lima.

Si un documento viejo contradice esto, el contrato de flujo protagonista manda.
```


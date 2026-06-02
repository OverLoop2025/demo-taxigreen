# Contrato de Flujo Protagonista

**Fecha:** 2026-05-30  
**Estado:** contrato de implementación para Sprint 0/1 y para cualquier agente que toque producto, datos, prompts o Figma.  
**Subordinación:** manda sobre documentos antiguos cuando exista ambigüedad de dirección física.

---

## 1. Veredicto

La demo comercial y el software inicial deben contar un solo flujo protagonista:

```text
Hotel/concierge solicita por WhatsApp
  -> Taxi Green crea una reserva de recojo en aeropuerto
  -> pasajero final llega al Jorge Chávez
  -> conductor recoge en Salida 3, columna F2
  -> viaje termina en Av. Pardo 123, Miraflores
```

**Dirección física:** Aeropuerto Jorge Chávez -> Lima.  
**Rol del hotel:** solicitante/canal, no origen físico.  
**Rol del pasajero:** pasajero final, físicamente en el aeropuerto al momento del recojo.

---

## 2. Alcance protagonista

| Elemento | Decisión cerrada |
|---|---|
| Canal inicial | WhatsApp iniciado por hotel/concierge |
| Tipo de viaje | `recojo_aeropuerto` |
| Origen físico | Aeropuerto Jorge Chávez, llegadas |
| Punto de encuentro | Salida 3, columna F2 |
| Destino | Av. Pardo 123, Miraflores |
| Pasajero | Huésped que llega a Lima |
| Solicitud | Hecha por el hotel en nombre del huésped |
| Link pasajero | `/p/[token]`, sin app instalada |
| Counter | Ruta secundaria obligatoria: walk-in aeropuerto -> destino en Lima |
| Incidencia | Objeto olvidado como soporte del mismo viaje |

---

## 3. Qué NO significa el flujo

- No significa que el hotel sea el punto de recojo.
- No significa que el pasajero esté esperando en el hotel.
- No significa que el conductor vaya al hotel en el flujo protagonista.
- No significa "hotel -> aeropuerto" como historia principal.
- No significa que "Bienestar" sea una aplicación independiente.
- No significa que el counter reemplace el despacho; alimenta el mismo sistema.

---

## 4. Modelo mínimo de datos para no confundirse

```typescript
type TipoViaje =
  | 'recojo_aeropuerto'       // Aeropuerto -> ciudad
  | 'traslado_aeropuerto'     // ciudad -> Aeropuerto
  | 'city';                   // otro origen/destino

type ReservaDemo = {
  canal_origen: 'whatsapp_oficial' | 'hotel' | 'counter' | 'llamada' | 'web_landing';
  tipo_viaje: TipoViaje;
  solicitante_nombre?: string;
  solicitante_tipo?: 'hotel' | 'empresa' | 'pasajero' | 'operador';
  pasajero_nombre: string;
  origen_texto: string;
  destino_texto: string;
  punto_encuentro?: string;
};
```

Para la demo:

```json
{
  "canal_origen": "whatsapp_oficial",
  "tipo_viaje": "recojo_aeropuerto",
  "solicitante_tipo": "hotel",
  "solicitante_nombre": "Concierge hotel",
  "origen_texto": "Aeropuerto Jorge Chávez - Llegadas",
  "punto_encuentro": "Salida 3, columna F2",
  "destino_texto": "Av. Pardo 123, Miraflores"
}
```

---

## 5. Ruta narrativa esperada

```text
cover.00
prototype.home
pwa.passenger.1A
whatsapp.12A
whatsapp.12B
whatsapp.12C
dispatch.3C
driver.2C
driver.2D
pwa.passenger.1G2
pwa.passenger.1G3
pwa.passenger.1G4
pwa.passenger.1G5
wellbeing.13A
wellbeing.13B
wellbeing.13F
wellbeing.13G
wellbeing.13H
wellbeing.13K
```

La ruta secundaria de counter debe ser:

```text
counter.4A -> counter.4B -> counter.4C -> dispatch.3C
```

con sentido físico **Aeropuerto -> destino en Lima**.

---

## 6. Criterio de aceptación para cualquier implementación

Antes de cerrar Sprint 0/1 o cualquier prompt derivado, verificar:

- El seed protagonista usa `tipo_viaje = recojo_aeropuerto`.
- El origen físico dice Aeropuerto Jorge Chávez / llegadas.
- El punto de encuentro dice Salida 3, columna F2.
- El destino dice Av. Pardo 123, Miraflores.
- El hotel aparece como solicitante, no como origen.
- El conductor se dirige al aeropuerto, no al hotel.
- El pasajero final abre el link al llegar o estar en el aeropuerto.
- El counter walk-in conserva el sentido Aeropuerto -> Lima.


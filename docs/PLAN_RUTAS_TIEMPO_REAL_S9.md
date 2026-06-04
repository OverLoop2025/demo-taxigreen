# Plan de arquitectura — Routing en tiempo real (Sprint 9)

> **Tipo de documento:** planeación de ingeniería senior. Es la **fuente de verdad de diseño** para la
> feature "todo en tiempo real" (distancia real por carretera, ETA con tráfico, ruta dibujada, recálculo al
> moverse). No contiene código de implementación; define **qué se construye, qué se mueve, qué NO se toca**.
> **Fecha:** 2026-06-03 · **Autor:** planeación S9 · **Estado:** aprobado para ejecución en Sprint 9.

---

## 0. TL;DR (para decidir en 60 segundos)

- **Qué pide el negocio:** que el mapa se comporte como una app real — **distancia real por carretera, tiempo
  estimado real, tráfico, ruta dibujada que sigue las calles y recálculo cuando el conductor se mueve.**
- **Esto NO es scope creep.** `PLAN_SOFTWARE §7.8` ya presupuesta **"Mapbox · Free tier · USD 0"** para la
  demo, y la **regla de negocio #7** (`CLAUDE.md §4.7`) exige textualmente: *"GPS, ETA y mapa reales (exigencia
  de Raúl). Pago/SUNAT/SMS simulados."* Lo único que se había diferido era la **implementación** del routing
  (nota de cierre S8: *"Mapbox Directions real queda fuera del alcance demo"*). S9 cierra esa brecha.
- **Costo:** **USD 0 garantizado.** Mapbox Directions/Matrix free tier = 100 000 requests/mes. Un ensayo
  completo consume ~50–150 requests con throttle. Ya se usa Mapbox para los tiles desde S7/S8, así que la
  cuenta/token ya existe.
- **Cómo, sin romper nada:** se replica **exactamente el patrón estrella del proyecto** (`withFallback`):
  capacidad **determinista siempre activa** (haversine + velocidad media, lo que ya hay) **+** adapter real
  Mapbox **opcional**, unidos por `withRutaFallback()` y gobernados por el flag **`RUTAS_HABILITADAS`**
  (análogo a `IA_HABILITADA`). Sin token o con el flag apagado, **la demo corre 100 % con estimación** y un
  badge `📐 Estimación`; con token, badge `🛰️ Ruta real`.
- **Lo que NO se toca:** la **heurística de asignación S5** (sigue con haversine), el schema (cero tablas
  nuevas), RLS (sigue desactivado), el link pasajero S8 y los estados S7.

---

## 1. Estado actual (inventario exacto, 2026-06-03)

| Capacidad | Dónde vive hoy | Implementación actual | Real? |
|---|---|---|---|
| **Distancia (scoring asignación)** | `packages/asignacion/src/heuristica.ts` (`haversineKm`, `distanciaKm`) | Haversine línea recta; override `distanciaMockKm`; piso 0.2 km | ❌ recta |
| **ETA visible (pasajero)** | `apps/web/src/lib/pasajero.ts` (`estimateEtaMinutos`) | Hardcode por estado de viaje: `asignado=9`, `en_camino=7`, `en_punto=0`, `a_bordo=22` min | ❌ fija |
| **Ruta dibujada (pasajero web)** | `apps/web/src/app/p/[token]/seguimiento-cliente.tsx` (`buildLine`) | `LineString` recta `[conductor, origen, destino]` en Mapbox GL JS (CDN) | ❌ recta |
| **Ruta dibujada (conductor)** | `apps/driver/src/components/map/AssignmentMap.tsx` | `LineString` recta `[conductor, origen, destino]` en `@rnmapbox/maps` | ❌ recta |
| **Posición conductor** | `apps/driver/src/features/location/index.ts` (`useLocationTracking`) | **GPS foreground REAL** (`expo-location`) → broadcast Realtime `posicion` en `reserva-{id}` cada 3 s / 10 m | ✅ real |
| **Render de mapa** | Web: Mapbox GL JS v3.5 desde CDN si `NEXT_PUBLIC_MAPBOX_TOKEN`. Driver: `@rnmapbox/maps` diferido si `EXPO_PUBLIC_MAPBOX_TOKEN` + dev client | Tiles reales; fallback textual sin token | ✅ real |

**Conclusión:** la posición del conductor **ya es real y ya viaja por Realtime**. Lo que falta es convertir esa
posición + origen/destino en **distancia/tiempo/geometría reales por carretera y recálculo**. Es una capa
aditiva sobre infraestructura que ya existe; no hay que rehacer Realtime, ni el mapa, ni el tracking.

---

## 2. Decisión de proveedor (cerrada)

**Proveedor: Mapbox Directions API, perfil `driving-traffic`.** Razones:

1. **Ya está integrado y presupuestado** (tiles GL JS web + `@rnmapbox/maps` nativo + tokens en `.env.example`;
   `PLAN_SOFTWARE §7.8` lo fija a USD 0). Cero proveedores nuevos, cero cuentas nuevas.
2. **Único de la terna gratuita con tráfico en vivo.** El perfil `driving-traffic` devuelve duración
   ajustada por tráfico actual — requisito explícito del pedido.
3. **Geometría GeoJSON** lista para pintar en la misma capa `route-line` que ya existe (web y nativo).
4. **Reusable en MVP** sin reescritura (la interfaz `RouteProvider` es la puerta para cambiar/añadir
   proveedor después).

**Alternativas evaluadas y descartadas para la demo** (se documentan por trazabilidad):

| Proveedor | Costo | Tráfico | Por qué no (para esta demo) |
|---|---|---|---|
| **OpenRouteService** | Gratis, sin tarjeta, 2 000 req/día | ❌ no | Pierde el wow de "tráfico real". Útil como 2.º adapter MVP si se quiere evitar tarjeta. |
| **OSRM público / self-host** | Gratis | ❌ no | Sin tráfico; el demo endpoint público no da SLA. |
| **Google Routes / HERE / TomTom** | De pago tras crédito | ✅ sí | Viola "costo estricto de cero". |

> La interfaz `RouteProvider` deja la puerta abierta: si en MVP se decide no depender de Mapbox para routing,
> se añade un `OpenRouteServiceProvider` sin tocar consumidores.

---

## 3. Arquitectura objetivo — `packages/rutas` (espejo de `packages/ia`)

Se crea un paquete determinista-primero que calca el patrón ya aprobado del proyecto. **Esto es lo que hace
que la feature sea segura:** la demo nunca depende del proveedor externo para funcionar.

```
packages/rutas/
  package.json                 @taxigreen/rutas  (sin deps de React; igual que ia/asignacion)
  src/
    index.ts                   superficie pública
    types.ts                   PuntoGeo, RouteRequest, RouteResult, RutaFuente, RouteProvider
    geo.ts                     haversineMetros() + factor de sinuosidad  (helper geo compartible)
    estimador.ts               estimación DETERMINISTA (siempre activa): haversine·sinuosidad + velocidad media
    with-ruta-fallback.ts      withRutaFallback() — flag RUTAS_HABILITADAS + timeout + degradación
    providers/
      mapbox-directions.ts     adapter Mapbox driving-traffic (fetch + parse routes[0])
    rutas.test.ts              unit: estimador, fallback flag-off, fallback por error/timeout
```

### 3.1. Contrato de tipos (`types.ts`)

```ts
export type RutaFuente = 'mapbox' | 'estimacion';
export type RutaPerfil = 'driving-traffic' | 'driving';

export interface PuntoGeo { lat: number; lng: number; }

export interface RouteRequest {
  origen: PuntoGeo;            // p.ej. posición actual del conductor
  destino: PuntoGeo;           // punto de encuentro o destino, según fase
  perfil?: RutaPerfil;         // default 'driving-traffic'
}

export interface RouteResult {
  distanciaMetros: number;
  duracionSegundos: number;            // con tráfico si perfil = driving-traffic
  duracionSinTraficoSegundos: number | null;
  geometry: { type: 'LineString'; coordinates: Array<[number, number]> }; // [lng,lat]
  fuente: RutaFuente;                  // 'mapbox' | 'estimacion'  → alimenta el badge
  calculadoEn: string;                 // ISO; para TTL/caché y "actualizado hace Ns"
}

export interface RouteProvider {
  calcular(req: RouteRequest): Promise<RouteResult>;
}
```

### 3.2. Estimador determinista (`estimador.ts`) — el piso que nunca falla

- `distanciaMetros = haversineMetros(origen, destino) * FACTOR_SINUOSIDAD` (≈ **1.35** para malla urbana de Lima).
- `duracionSegundos = distanciaMetros / VELOCIDAD_MEDIA_MS` (≈ **28 km/h** ⇒ ~7.8 m/s; parametrizable por
  `RUTAS_VELOCIDAD_KMH`).
- `geometry` = recta de 2 puntos `[origen, destino]` (lo que ya pinta hoy; visualmente honesto como estimación).
- `fuente = 'estimacion'`, `duracionSinTraficoSegundos = null`.
- **Determinista y testeable**: mismos inputs → mismo output; no I/O, no red. Es la capacidad "siempre activa"
  que exige `CLAUDE.md §1`.

### 3.3. Adapter Mapbox (`providers/mapbox-directions.ts`)

```
GET https://api.mapbox.com/directions/v5/mapbox/{perfil}/{lng1},{lat1};{lng2},{lat2}
    ?geometries=geojson&overview=full&annotations=duration,distance&access_token={MAPBOX_SERVER_TOKEN}
```

- `distanciaMetros = routes[0].distance`, `duracionSegundos = routes[0].duration` (con tráfico en
  `driving-traffic`), `geometry = routes[0].geometry`, `fuente = 'mapbox'`.
- Lanza si no hay token, si `routes` viene vacío o si el HTTP no es 2xx → lo captura `withRutaFallback`.

### 3.4. `withRutaFallback()` — calca `packages/ia/src/fallback.ts`

```ts
// Pseudocódigo — misma forma que withFallback (ia)
export async function withRutaFallback(req, { timeoutMs = 2500 }) {
  if (process.env.RUTAS_HABILITADAS !== 'true') return estimador(req);   // flag off → determinista
  try {
    return await Promise.race([mapbox.calcular(req), timeout(timeoutMs)]); // fuente 'mapbox'
  } catch {
    return estimador(req);                                                 // degradación → 'estimacion'
  }
}
```

Reglas idénticas al patrón IA: **flag off ⇒ determinista**; **error/timeout/sin token ⇒ degrada a
determinista**; nunca lanza hacia el consumidor. La demo corre con routing real **desconectado**, igual que
corre con el LLM desconectado.

---

## 4. Flujo de datos — server-side con caché (protege el free tier y el token)

```
                        ┌──────────────────────────────────────────────┐
  Conductor (driver)    │  apps/web  ·  GET/POST /api/rutas/calcular     │
  emite posición ─────► │  • valida token pasajero | Bearer conductor    │
  (Realtime posicion)   │  • withRutaFallback(origen, destino, perfil)   │
                        │  • caché in-memory LRU (clave: coords redondeadas + perfil, TTL)
  Pasajero (/p/[token]) │  • throttle por reserva                        │
  pide ruta ──────────► │  → RouteResult { geometry, duración, fuente }  │
                        └──────────────────────────────────────────────┘
                                   │ token Mapbox NUNCA sale al cliente
                                   ▼
                        Mapbox Directions (driving-traffic)
```

**Por qué server-side y no llamar a Mapbox desde el cliente:**
1. **Caché y throttle centralizados** → garantizan costo $0 aunque haya varios espectadores del link pasajero.
2. **El token de Directions queda en el servidor** (`MAPBOX_SERVER_TOKEN`, sin `NEXT_PUBLIC_`). El
   `NEXT_PUBLIC_MAPBOX_TOKEN` se mantiene **solo** para render de tiles (lo que ya hace S8).
3. **Mismo contrato para web y nativo**: el conductor y el pasajero consumen el mismo endpoint y el mismo
   `RouteResult`.

**Caché:** clave = `{lat,lng}` redondeados a ~4 decimales (≈11 m) de origen y destino + perfil. TTL corto
para tráfico (p.ej. **45 s**) y largo para el tramo estático origen→destino. LRU acotada (sin tabla nueva;
in-memory, demo single-process — ver §7 "no tablas").

---

## 5. Recálculo cuando el conductor se mueve (el comportamiento "app real")

1. El conductor ya emite `posicion` por Realtime (`useLocationTracking`, sin cambios en la fuente GPS).
2. **Disparador de recálculo** (nuevo, lado cliente, debounced): se recalcula la ruta cuando se cumplen
   **ambos**:
   - el conductor se movió **> `RUTAS_UMBRAL_RECALCULO_M`** (default **120 m**) desde el último cálculo, **y**
   - pasaron **> `RUTAS_INTERVALO_MIN_S`** (default **6 s**) desde la última petición.
   (Throttle doble: distancia + tiempo. Protege el free tier y evita parpadeo.)
3. **Tramo según fase del viaje** (igual que una app real):
   | Estado viaje | Tramo que se calcula | ETA mostrada |
   |---|---|---|
   | `asignado` / `en_camino` | conductor → **punto de encuentro** (origen) | "Tu conductor llega en X" |
   | `en_punto` | — (0) | "Llegó al punto" |
   | `a_bordo` | conductor → **destino** | "Llegas a destino en X" |
   | `finalizado` | — | sin ETA |
4. La geometría devuelta reemplaza el `LineString` recto en `route-line` (web y nativo) **sin recrear el
   mapa** (respeta el fix de auditoría S8: el mapa se crea una vez; solo se hace `setData` a la fuente).

---

## 6. Qué se mueve / cambia / reestructura (mapa archivo por archivo)

| Acción | Archivo | Cambio |
|---|---|---|
| **CREAR** | `packages/rutas/**` | Paquete nuevo (§3). Determinista + adapter + fallback + tests. |
| **CREAR** | `apps/web/src/app/api/rutas/calcular/route.ts` | Route Handler server-side con caché/throttle (§4). Valida token pasajero o Bearer conductor. |
| **CREAR (opcional)** | `apps/web/src/lib/rutas.ts` | Helper de servidor: arma `RouteRequest` desde una reserva + fase + posición. |
| **CAMBIAR** | `apps/web/src/lib/pasajero.ts` | `estimateEtaMinutos` pasa a ser **el fallback** del estimador; el contrato `tracking` gana `distanciaMetros`, `duracionSegundos`, `geometry`, `fuente`. El valor real lo aporta el servicio; si no hay routing, queda la estimación (compatibilidad total). |
| **CAMBIAR** | `apps/web/src/app/p/[token]/seguimiento-cliente.tsx` | Pinta `geometry` real (en vez de `buildLine` recto); ETA y badge `fuente`; dispara recálculo al moverse (§5) respetando el "mapa se crea una vez". |
| **CAMBIAR** | `apps/driver/src/components/map/AssignmentMap.tsx` | Pinta `geometry` real; muestra ETA/distancia; consume `/api/rutas/calcular`. Mantiene fallback textual sin token. |
| **CAMBIAR** | `apps/driver/app/(auth)/asignacion/[id].tsx` | Muestra ETA/distancia reales; lógica de tramo por fase. |
| **CREAR (driver)** | `apps/driver/src/features/routing/use-route.ts` | Hook que pide ruta + recálculo debounced a partir de la posición (consume el endpoint web). |
| **CAMBIAR** | `packages/database/prisma/seed-guion.ts` (nuevo en S9) | Polyline pre-cargada de posiciones Aeropuerto→Av. Pardo para que el ensayo muestre **movimiento real sin teléfono físico** (ver `SPRINT.md` S9.1.4). |
| **CAMBIAR (config)** | `.env.example` (raíz, web, driver) | Documentar `RUTAS_HABILITADAS`, `MAPBOX_SERVER_TOKEN`, `RUTAS_VELOCIDAD_KMH`, `RUTAS_UMBRAL_RECALCULO_M`, `RUTAS_INTERVALO_MIN_S`. *(Edición real en ejecución S9; aquí solo se especifica.)* |
| **🚫 NO TOCAR** | `packages/asignacion/src/heuristica.ts` | El scoring de asignación **sigue con haversine**. Regla S9: *"No tocar la heurística S5."* Routing real es solo para tracking/ETA/mapa, no para el ranking de conductores. |
| **🚫 NO TOCAR** | `packages/database/prisma/schema.prisma` | Cero tablas/columnas nuevas (§7). |

> **Reuso de `haversine`:** hoy vive embebido en `heuristica.ts`. Para no duplicar, `packages/rutas/src/geo.ts`
> tendrá su propia `haversineMetros` (independiente). **No** se refactoriza `asignacion` para importar de
> `rutas` en S9 (eso tocaría S5). Si en MVP se quiere un único helper geo, se sube a `packages/shared` — fuera
> de alcance demo.

---

## 7. Restricciones respetadas (checklist anti-rotura)

- ✅ **No tabla nueva.** Caché in-memory; la geometría no se persiste. La demo es single-process (Railway 1
  instancia — ver `CIERRE_10_DE_10.md`), así que la caché in-memory es consistente. (Para multi-instancia MVP:
  mover a Redis/Upstash; misma decisión que el rate-limit.)
- ✅ **No tocar heurística S5** (scoring sigue haversine).
- ✅ **No RLS, no app pasajero, no OAuth pasajero.**
- ✅ **Determinista primero**: el estimador se construye y testea antes que el adapter (regla de oro #8).
- ✅ **Demo corre con routing desconectado**: `RUTAS_HABILITADAS=false` o sin token ⇒ estimación + badge 📐.
- ✅ **Costo $0**: free tier + caché + throttle (§8).
- ✅ **Token server-side**: Directions no expone token nuevo al cliente; tiles siguen con `NEXT_PUBLIC_*`.
- ✅ **Reusable en MVP** (interfaz `RouteProvider`): no es código desechable (regla de oro #6).

---

## 8. Presupuesto y costo (USD 0, demostrable)

- **Free tier Mapbox:** Directions 100 000 req/mes · Matrix 100 000 req/mes (no se usa Matrix en S9).
- **Consumo por ensayo completo (~17 min):** tramo `en_camino` ~3–5 min con recálculo cada ≥6 s y ≥120 m ⇒
  ~30–50 req; tramo `a_bordo` similar ⇒ **~50–150 req por demo**. Más caché (coords redondeadas) ⇒ aún menos.
- **Margen:** se podrían correr **cientos de ensayos al mes** sin salir del free tier. Costo efectivo: **USD 0.**
- **Salvaguardas de costo en código:** flag global, throttle doble (distancia+tiempo), caché TTL, y
  degradación silenciosa a estimación si Mapbox responde 429.

---

## 9. Credenciales requeridas (lo que necesito que generes)

> El usuario pidió explícitamente: *"sé que necesitaremos tokens o ciertas llaves, no dudes en pedírmelas."*
> Aquí está la lista mínima. **Posiblemente ya tengas todo** (Mapbox se usa desde S7/S8).

| Variable | Para qué | ¿Nueva? | Cómo obtenerla |
|---|---|---|---|
| `MAPBOX_SERVER_TOKEN` | Directions server-side (ruta/ETA/tráfico) | Puede reutilizar tu `pk.*` existente | Token público Mapbox con scopes por defecto (Directions viene habilitado). Recomendado: token **separado** y, si se quiere, con *URL restrictions*. Va **solo en el servidor** (sin `NEXT_PUBLIC_`). |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Tiles del mapa web (ya en uso S8) | **Ya la tienes** | Sin cambios. |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Tiles del mapa nativo (ya en uso S7) | **Ya la tienes** | Sin cambios. |
| `RUTAS_HABILITADAS` | Encender routing real | No es secreto | `true` para mostrar el wow; `false` corre con estimación. |

**Dato clave:** un **token público Mapbox (`pk.*`) ya incluye Directions** por defecto. Si ya generaste el
token de tiles, **no necesitas un token nuevo** — puedes reutilizarlo como `MAPBOX_SERVER_TOKEN`.
`MAPBOX_DOWNLOAD_TOKEN` (`sk.*`, DOWNLOADS:READ) es **otra cosa** (descarga del SDK nativo en EAS) y **no**
sirve para Directions.

> **Confírmame una sola cosa:** ¿tu token `pk.*` actual tiene los scopes por defecto (no fue restringido a
> solo `styles:read`/`tiles:read`)? Si lo restringiste, genera uno con scopes por defecto. Si no lo tocaste,
> ya sirve.

---

## 10. Criterios de aceptación de la feature

- Con `RUTAS_HABILITADAS=true` + token: `/p/[token]` y la app conductor muestran **ruta que sigue las calles**,
  **ETA y distancia reales** y **badge `🛰️ Ruta real`**; al mover al conductor, la ruta y el ETA **recalculan**.
- Con `RUTAS_HABILITADAS=false` o **sin token**: misma pantalla operativa, ruta como estimación recta, **badge
  `📐 Estimación`**, ETA por velocidad media. **Nada se rompe.**
- `packages/rutas` tiene tests unit: estimador determinista, fallback por flag-off y fallback por error/timeout.
- `GET /api/rutas/calcular` valida token pasajero o Bearer conductor (no acepta coords libres sin credencial)
  y cachea/throttlea.
- **El scoring de asignación S5 no cambia** (test de regresión de `asignacion` sigue verde).
- `pnpm turbo run typecheck lint test build` 56/56; `pnpm e2e` verde (incluye un caso que
  prueba `/p/[token]` **sin** `RUTAS_HABILITADAS`); `expo export --platform android` EXIT 0.

---

## 11. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Free tier agotado / 429 | Throttle doble + caché TTL + degradación a estimación. Flag para apagar. |
| Token filtrado en cliente | Directions corre **server-side**; el cliente nunca ve `MAPBOX_SERVER_TOKEN`. |
| Recálculo agresivo = parpadeo/costo | Umbral 120 m **y** 6 s; geometría se actualiza con `setData`, sin recrear el mapa (fix S8). |
| Demo sin internet / Mapbox caído | `withRutaFallback` ⇒ estimación. El wow degrada con elegancia; el flujo no se cae. |
| Tocar S5 sin querer | `heuristica.ts` está en la lista 🚫 NO TOCAR; test de regresión lo blinda. |
| Recálculo en Expo Go (sin mapa nativo) | El ETA/distancia textual sí funciona (consume el endpoint); el mapa nativo sigue siendo dev client/EAS. |

---

## 12. Cómo encaja en el cierre de S9

Esta feature **se ejecuta dentro de Sprint 9** junto a `/counter`, landing, reset/guion, deploy y video. El
orden sugerido de ejecución (no negociable que routing salga **antes** del deploy, para que el deploy ya lleve
el wow):

1. `packages/rutas` (determinista + adapter + fallback + tests).
2. `/api/rutas/calcular` + integración en `/p/[token]` y app conductor + recálculo.
3. `seed-guion` con polyline (movimiento sin teléfono).
4. `/counter` + QR de un solo uso + landing + reset.
5. Endurecimientos elegidos (`mobile-smoke.yml`, env fail-fast — ver `CIERRE_10_DE_10.md`).
6. Deploy Railway real + smoke de producción + video.

El detalle operativo (prompt copy-paste) está en `docs/PROMPT_SPRINT_9_CODEX.md`; el alcance canónico en
`07_PLAN_EJECUCION/SPRINT.md §Sprint 9`; el veredicto sobre las recomendaciones extra y el "10/10" en
`docs/CIERRE_10_DE_10.md`.

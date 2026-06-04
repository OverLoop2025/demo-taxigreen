# Prompt Sprint 9 — Taxi Green Demo

Uso: copiar y pegar este bloque para ejecutar solo Sprint 9. No iniciar trabajo posterior sin nueva instrucción.

```text
Trabajas en el monorepo de la demo Taxi Green, en /home/jose/dev/demo-taxigreen.
Eres full-stack senior con experiencia real en Next.js App Router, Supabase, operación aeroportuaria, UX tablet,
QR/cámara web, deploy Railway y preparación de demos comerciales.
Ejecuta SOLO Sprint 9. No abras alcance MVP.

ANTES DE TOCAR CÓDIGO, LEE EN ESTE ORDEN:
1. CLAUDE.md
2. AGENTS.md
3. docs/ESTADO_SPRINT_8.md
4. docs/ESTADO_SPRINT_7.md
5. docs/DOCUMENTACION_TECNICA.md
6. docs/GUIA_PRUEBAS_DEMO.md
7. docs/PLAN_RUTAS_TIEMPO_REAL_S9.md   (arquitectura de routing en tiempo real — feature nueva de S9)
8. docs/CIERRE_10_DE_10.md             (qué endurecimientos entran a S9 y por qué)
9. 07_PLAN_EJECUCION/SPRINT.md §Sprint 9
10. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §2.6, §2.7, §7.6 y §7.8
11. _FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md
12. _FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md
13. apps/web/src/app/p/[token], apps/web/src/app/bienestar/[caso], apps/web/src/app/admin/bienestar,
    apps/web/src/app/api/voucher/*, apps/web/src/lib/pasajero.ts, packages/asignacion/src/heuristica.ts,
    packages/ia/src/fallback.ts (patrón withFallback a replicar) y packages/database/prisma/seed.ts

DECISIONES CERRADAS:
- S0-S8 están cerrados. No desordenes schema, seed, voucher, PDF, auditoría, /admin, /wa-sim, asignación,
  app conductor, estados S7 ni link pasajero S8.
- No crear app pasajero, OAuth pasajero, RLS ni tablas nuevas.
- Objeto olvidado es la única incidencia E2E. No construir las otras tipologías.
- El flujo protagonista sigue siendo Aeropuerto Jorge Chávez - Llegadas, Salida 3 columna F2 -> Av. Pardo 123,
  Miraflores. Hotel = solicitante/canal, no origen físico.

ALCANCE = SOLO SPRINT 9 (codificación final + despliegue):
Cerrar la demo comercial: ROUTING EN TIEMPO REAL, `/counter` con QR de un solo uso, landing pública,
reset/guion, dos endurecimientos acotados (mobile-smoke CI + env fail-fast), deploy real y guía de
presentador/video respaldo.

ENTREGABLE 0 — ROUTING EN TIEMPO REAL (feature nueva; leer docs/PLAN_RUTAS_TIEMPO_REAL_S9.md COMPLETO):
Objetivo: que el mapa se comporte como app real — distancia real por carretera, ETA real con tráfico, ruta
dibujada que sigue las calles y recálculo cuando el conductor se mueve. Es cerrar la brecha que ya exige la
regla de negocio #7 (GPS/ETA/mapa reales) y que PLAN_SOFTWARE §7.8 presupuesta como Mapbox free tier USD 0.
0.1. `packages/rutas` NUEVO, espejo EXACTO de `packages/ia`:
   - `types.ts`: PuntoGeo, RouteRequest, RouteResult { distanciaMetros, duracionSegundos,
     duracionSinTraficoSegundos, geometry LineString, fuente: 'mapbox'|'estimacion', calculadoEn }, RouteProvider.
   - `geo.ts`: haversineMetros propio (NO importar de asignacion; no tocar S5).
   - `estimador.ts`: estimación DETERMINISTA siempre activa = haversine·1.35 (sinuosidad) + velocidad media
     (RUTAS_VELOCIDAD_KMH, default 28) + geometría recta. fuente='estimacion'.
   - `providers/mapbox-directions.ts`: adapter Mapbox Directions perfil driving-traffic
     (geometries=geojson, overview=full, annotations=duration,distance). fuente='mapbox'.
   - `with-ruta-fallback.ts`: calca packages/ia/src/fallback.ts. Flag RUTAS_HABILITADAS !== 'true' ⇒ estimador;
     timeout (2500ms) / error / sin token ⇒ degrada a estimador. NUNCA lanza al consumidor.
   - tests unit: estimador determinista, fallback flag-off, fallback por error/timeout.
0.2. `apps/web/src/app/api/rutas/calcular/route.ts` NUEVO: server-side, valida token pasajero o Bearer
   conductor, withRutaFallback, caché in-memory LRU (clave coords redondeadas ~4 decimales + perfil, TTL ~45s),
   throttle por reserva. El token Mapbox queda SERVER-SIDE (MAPBOX_SERVER_TOKEN, sin NEXT_PUBLIC_).
0.3. `apps/web/src/lib/pasajero.ts`: estimateEtaMinutos pasa a ser el fallback; el contrato tracking gana
   distanciaMetros/duracionSegundos/geometry/fuente. Sin routing real, queda la estimación (compatibilidad total).
0.4. `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`: pinta geometry real (en vez de buildLine recto),
   ETA + badge fuente (🛰️ Ruta real / 📐 Estimación), recálculo al moverse. RESPETAR el fix S8: el mapa se
   crea UNA vez; solo setData a la fuente 'route' (no recrear el mapa).
0.5. App conductor: `AssignmentMap.tsx` pinta geometry real + ETA/distancia; nuevo hook
   `apps/driver/src/features/routing/use-route.ts` con recálculo debounced (umbral 120m Y 6s) consumiendo el
   endpoint web; `asignacion/[id].tsx` muestra ETA/distancia y tramo por fase (en_camino→punto; a_bordo→destino).
0.6. Tramo por fase del viaje: asignado/en_camino = conductor→punto de encuentro; en_punto = 0;
   a_bordo = conductor→destino; finalizado = sin ETA.
NO NEGOCIABLE de routing: NO tocar packages/asignacion/heuristica.ts (scoring sigue haversine); cero tablas
nuevas (caché in-memory); la demo DEBE correr con RUTAS_HABILITADAS=false o sin token (estimación + badge 📐).

ENTREGABLES CORE:
1. `/counter`:
   - UI tablet-first, sobria, densa y operativa.
   - Tab o modo "Validar voucher".
   - Escáner QR por cámara si se puede integrar sin riesgo; si la librería introduce fricción, fallback de input manual
     de token/voucher con documentación clara.
   - POST a `/api/voucher/[id]/verify`.
   - Si OK, card con datos de reserva, punto de encuentro y pasajero.
   - QR DE UN SOLO USO (cierra DEUDA §1.3): al confirmar, el voucher se "quema" con bloqueo idempotente
     server-side (marca de consumido + validación de reintento → segundo escaneo responde "ya validado", no
     re-procesa). Sin tabla nueva: usar un campo/estado existente o el propio viaje/auditoría como marca.
   - Acción "Confirmar abordaje/entrega" auditada, sin romper estados S7. Si toca estado, respetar secuencia.
2. Landing pública `/`:
   - Página comercial simple, no app falsa.
   - CTA WhatsApp con mensaje prearmado.
   - Debe respetar paleta azul dual y marca verde solo como tenant/logo.
   - No debe desplazar la demo operativa ni inventar flujo pasajero app.
3. Reset/guion:
   - Script idempotente para restaurar estado de demo si conviene (`db:seed` o `seed-guion`).
   - Preparar datos exactos del guion: protagonista, link pasajero, una incidencia activa si sirve para mostrar S8,
     posiciones iniciales y conversaciones `/wa-sim`.
   - POLYLINE PRE-CARGADA: sembrar una secuencia de `posiciones_conductor` a lo largo del trayecto Aeropuerto
     Jorge Chávez → Av. Pardo 123, Miraflores, para que el ensayo muestre MOVIMIENTO REAL y recálculo de ruta
     SIN necesidad de un teléfono físico emitiendo GPS. Coherente con el routing real del Entregable 0.
   - No borrar información de producción por accidente; si hay limpieza, debe ser acotada a datos demo (`TG-WA-*`,
     auditoría de prueba, tokens push demo).
4. Página interna de ensayo:
   - `/demo/guion-narrado` o doc equivalente con pasos de presentador.
   - No debe aparecer como navegación pública principal.
5. ENDURECIMIENTOS ACOTADOS (justificación en docs/CIERRE_10_DE_10.md §2):
   5.1. `.github/workflows/mobile-smoke.yml` NUEVO: workflow_dispatch + push/PR con
        paths ['apps/driver/**','packages/**'] → typecheck + lint + `expo export --platform android` del driver.
        Separado de ci.yml (export RN es lento). Actions en v6 (Node 24), como el resto.
   5.2. `apps/web/src/lib/env.ts` (o equivalente): fail-fast SOLO si NODE_ENV==='production' y falta
        AUTH_SECRET / HMAC_SECRET / DATABASE_URL / SUPABASE_SERVICE_ROLE_KEY → error fatal al arrancar
        (sin fallback silencioso del AUTH_SECRET hardcodeado). Fuera de producción NO cambia nada (la demo
        local arranca igual). Añadir MAPBOX_SERVER_TOKEN y RUTAS_* como OPCIONALES (sin ellas, estimación).
   5.3. Documentar (no implementar): Railway 1 instancia para que el rate-limit in-memory sea consistente.
6. Deploy:
   - Revisar `deploy-web.yml` y variables necesarias (DATABASE_URL, DIRECT_URL, AUTH_SECRET, HMAC_SECRET,
     SUPABASE_*, MAPBOX_SERVER_TOKEN, NEXT_PUBLIC_MAPBOX_TOKEN, RUTAS_HABILITADAS).
   - Si hay `RAILWAY_TOKEN`, ejecutar deploy real + smoke de producción (landing 200, /p/[token] 200,
     /counter, PDF comprobante, Realtime desde prod). Si no, dejar checklist exacto y dejar el workflow
     gateado (verde sin desplegar es aceptable como red de seguridad).
   - Checklist de PRUEBA FÍSICA del conductor (la ejecuta el usuario con su Android + dev client c7ecab4b):
     login conductor, asignación recibida, estados, ubicación emitida, recálculo de ruta real al moverse,
     fallback sin red, push. No es código; es guía de validación en device.
7. Documentación:
   - Actualizar `docs/ESTADO_SPRINT_9.md`.
   - Actualizar `docs/GUIA_PRUEBAS_DEMO.md` como guía final S0-S9 (incluir routing real + /counter QR + landing).
   - Actualizar `docs/DOCUMENTACION_TECNICA.md`, `docs/DEUDA_TECNICA.md`, `CLAUDE.md` y `AGENTS.md`.
   - Mantener coherencia con `docs/PLAN_RUTAS_TIEMPO_REAL_S9.md` y `docs/CIERRE_10_DE_10.md` (ya escritos).
   - Crear/actualizar README o `docs/demo-presenter.md` con instrucciones para presentador, reset, URLs y plan B.

CRITERIOS DE ACEPTACIÓN:
- ROUTING: con RUTAS_HABILITADAS=true + token, /p/[token] y app conductor muestran ruta que sigue las calles,
  ETA/distancia reales, badge 🛰️, y recalculan al mover al conductor. Con RUTAS_HABILITADAS=false o SIN token:
  misma pantalla operativa, ruta como estimación recta, badge 📐, ETA por velocidad media; NADA se rompe.
- `packages/rutas` con tests verdes (estimador determinista + fallback flag-off + fallback por error/timeout).
- `GET /api/rutas/calcular` valida token pasajero o Bearer conductor (no acepta coords libres sin credencial).
- El scoring de asignación S5 NO cambia (test de regresión de `asignacion` sigue verde).
- `/counter` valida voucher QR/token del seed sin login de pasajero y lo CONSUME (segundo escaneo = "ya validado").
- `/counter` muestra `TG-2026-0001`, punto "Salida 3, columna F2" y datos protagonista.
- `/` responde como landing pública con CTA WhatsApp.
- `/p/tg_demo_passenger_001` y `/bienestar/[caso]` siguen funcionando.
- Reset deja protagonista en estado de demo esperado, con polyline pre-cargada para mostrar movimiento.
- `mobile-smoke.yml` verde (workflow_dispatch).
- `pnpm turbo run typecheck lint test build` verde (incluye `packages/rutas`).
- `pnpm e2e` verde (incluye un caso de `/p/[token]` con routing apagado).
- `pnpm --filter @taxigreen/driver exec expo export --platform android` verde.

REGLAS NO NEGOCIABLES:
- No tocar la heurística S5 (el scoring sigue con haversine; el routing real es SOLO para tracking/ETA/mapa).
- No rehacer el link pasajero S8 (solo extender el contrato de tracking y la capa de mapa).
- No añadir tablas (la caché de routing es in-memory; la marca de QR consumido reusa campos/estados existentes).
- No activar RLS.
- No introducir un flujo "hotel -> aeropuerto" como protagonista.
- No convertir la landing en una página genérica sin producto real.
- No depender de LLM ni de Mapbox para que la demo corra (determinista primero, fallback siempre).
- No exponer el token de Directions en el cliente (Directions corre server-side; tiles siguen con NEXT_PUBLIC_).

CIERRE:
- Detenerte al terminar Sprint 9.
- Reportar verificación, bugs/mejoras encontradas y pendientes reales.
- No iniciar MVP.
```

# Estado Sprint 9 — Routing, counter, landing y deploy

**Fecha:** 2026-06-04  
**Estado:** implementado, verificado localmente, desplegado en Railway y con deploy automático por GitHub Actions habilitado (project token real en Secrets). Auditoría de cierre aplicada (ver §7).

---

## 1. Objetivo del sprint

Sprint 9 cierra la demo A-Z con cuatro piezas que faltaban para que la presentación se sienta completa:

- Ruta/ETA real con tráfico cuando Mapbox está disponible, sin perder fallback determinista.
- Counter operativo con lectura/validación de voucher QR de un solo uso.
- Landing pública limpia para entrar al flujo protagonista.
- Reset de guion y hardenings mínimos para demo/deploy.

La regla central se mantuvo: no se toca la heurística de asignación de Sprint 5. La ruta para tracking y navegación vive aparte en `packages/rutas`.

---

## 2. Implementado

### 2.1 `packages/rutas`

Nuevo paquete interno:

- `calcularRutaEstimada`: estimador determinista por haversine, sinuosidad y velocidad media.
- `MapboxDirectionsProvider`: adapter server-side para Mapbox Directions v5.
- `withRutaFallback`: patrón equivalente a IA, con flag `RUTAS_HABILITADAS`, timeout y degradación segura.
- Tests unitarios: estimador, flag off, error del provider y timeout.

Parámetros usados:

- Perfil `driving-traffic`.
- Geometría `geojson`.
- `overview=full`.
- `annotations=duration,distance`.
- `depart_at=now`.

Referencia oficial revisada: <https://docs.mapbox.com/api/navigation/directions/>.

### 2.2 API de rutas

Nuevo endpoint:

```text
GET/POST /api/rutas/calcular
```

Características:

- Acepta Bearer de conductor o token público pasajero.
- Valida que el destino pertenezca a la reserva; si no, responde `403 destino_fuera_de_reserva`.
- Mantiene caché in-memory TTL 45s y throttle 2.5s por reserva.
- No expone `MAPBOX_SERVER_TOKEN` al navegador.
- Devuelve `fuente=mapbox` o `fuente=estimacion` con `LineString`, distancia y duración.

Smoke local real:

```text
/api/rutas/calcular + token pasajero + coordenadas canónicas
200 OK · fuente=mapbox · 18-20 km · 717-722 puntos de geometría
```

### 2.3 Web pasajero `/p/[token]`

El link pasajero ahora consume routing:

- Muestra ruta real si Mapbox responde.
- Recalcula con umbral conservador.
- Dibuja `LineString` real en Mapbox GL JS cuando hay token público.
- Mantiene fallback textual y estimación si falta token, falla CDN o falla Mapbox.
- Conserva polling + Supabase Realtime de Sprint 8.

### 2.4 App conductor

La asignación activa ahora usa rutas:

- Hook `useDriverRoute`.
- ETA/distancia dinámica.
- Línea real en mapa nativo si `@rnmapbox/maps` está disponible.
- Fallback textual con los mismos datos si el módulo nativo o token no están.
- Nuevas env públicas:
  - `EXPO_PUBLIC_RUTAS_UMBRAL_RECALCULO_M`
  - `EXPO_PUBLIC_RUTAS_INTERVALO_MIN_S`

### 2.5 Counter QR one-time

Se endureció `POST /api/voucher/[id]/verify`:

- Valida HMAC.
- Exige que el token recibido sea el token vigente de la reserva.
- `consume:false` mantiene compatibilidad de Sprint 2.
- `consume:true` exige sesión `supervisor`.
- Consumo idempotente con transacción y advisory lock Postgres.
- Reuso bloqueado con `409 voucher_ya_validado`.
- Audita `voucher_qr_consumido` y `voucher_qr_reuso_bloqueado`.

Nueva pantalla:

```text
/counter
```

Incluye input manual, cámara progresiva vía `BarcodeDetector` si el navegador lo soporta, fallback manual si no.

Smoke local:

```text
verify válido -> 200 ok consumed=false
consume supervisor -> 200 ok consumed=true
reuse -> 409 voucher_ya_validado
```

Tras el smoke se ejecutó `db:seed-guion` para dejar el QR disponible otra vez.

### 2.6 Landing pública

`/` dejó de ser placeholder y ahora es landing de demo:

- Primer viewport con Taxi Green como señal visual real.
- CTA WhatsApp.
- Acceso al link pasajero protagonista.
- Copy enfocado en el recojo aeroportuario.
- Links secundarios a `Counter` y `WhatsApp Sim`.

### 2.7 Reset de guion

Nuevo script:

```bash
pnpm --filter @taxigreen/database db:seed-guion
```

Qué hace:

- Corre `db:seed`.
- Limpia reservas `TG-WA-*` de pruebas.
- Deja `TG-2026-0001` en estado narrativo de demo.
- Precarga viaje en camino.
- Inserta 10 posiciones deterministas para el conductor protagonista.
- Deja una incidencia seed de objeto olvidado.
- Limpia auditoría de QR/calificación/incidencia de pruebas.

Resultado verificado:

```text
Seed guion S9 listo: reserva=3342a28b-c695-4c5e-87ce-09d001c171a5, posiciones=10
```

### 2.8 CI y hardening

Agregado:

- `.github/workflows/mobile-smoke.yml`: driver typecheck, lint y `expo export --platform android`.
- `env.ts` fail-fast runtime en producción para secretos críticos.
- `AUTH_SECRET` ya no debe caer silenciosamente al secreto demo en producción runtime.
- `deploy-web.yml` apunta explícitamente al proyecto Railway para evitar depender de `railway link` local en GitHub Actions.

### 2.9 Bug corregido

`GET /api/pasajero/[token]/comprobante/pdf` armaba el redirect con `new URL(request.url)`. En Railway eso podía producir `https://0.0.0.0:3000/...`.

Fix:

```text
Location: /api/comprobantes/{id}/pdf?redirect=signed
```

Smoke local:

```text
307 Location: /api/comprobantes/3342a28b-c695-4c5e-87ce-09d001c171a5/pdf?redirect=signed
```

---

## 3. Verificación

| Prueba | Resultado |
|---|---:|
| `pnpm --filter @taxigreen/rutas test` | 4/4 |
| `pnpm --filter @taxigreen/web test` | 11/11 |
| `pnpm --filter @taxigreen/web build` | OK |
| `pnpm --filter @taxigreen/driver exec expo export --platform android` | OK · 1354 módulos |
| `pnpm turbo run typecheck lint test build` | 56/56 |
| `pnpm e2e` | 7/7 |
| `db:seed-guion` | OK, idempotente |
| Ruta pública con Mapbox | 200, `fuente=mapbox` |
| QR consume/reuse | 200/409 correcto |
| PDF pasajero redirect | 307 relativo correcto |
| Deploy Railway manual por CLI | SUCCESS/RUNNING |
| Smoke producción `/` | 200 |
| Smoke producción `/p/tg_demo_passenger_001` | 200 |
| Smoke producción `/api/rutas/calcular` | 200 · `fuente=mapbox` |
| Smoke producción `/counter` sin sesión | 307 a login |
| Smoke producción PDF pasajero | 307 relativo |

Warnings conocidos:

- Next avisa que el plugin ESLint de Next no está detectado. Ya existía y no bloquea.
- Vitest imprime warnings intencionales de fallback IA/rutas en tests que fuerzan errores/timeouts.
- Expo export imprime warnings `NO_COLOR/FORCE_COLOR`; no bloquea.

---

## 4. Railway y credenciales

Railway CLI está logueado como la cuenta del usuario y el proyecto local está vinculado:

```text
Proyecto: earnest-communication
Project ID: fdf084df-2314-45d2-9601-c5348fbcf647
Servicio web: 0629b6b4-0f02-4b3c-a24e-070bf6f3deaa
Dominio: https://web-production-816a4.up.railway.app
```

**Token CI resuelto (2026-06-04).** Se creó un **project token** de Railway y se guardó en
`Settings > Secrets and variables > Actions` como `RAILWAY_TOKEN`. El token es válido y autoriza el deploy:

```text
RAILWAY_TOKEN=<project_token> railway variables --service web   -> 200, lista variables de producción
RAILWAY_TOKEN=<project_token> railway status                    -> Project earnest-communication / Environment production
```

> **Aclaración del diagnóstico previo.** Los intentos anteriores con tokens en formato UUID se descartaron porque
> `railway whoami` devolvía `Unauthorized`. Eso era un **falso negativo**: un *project token* no representa a un
> usuario, así que `whoami` falla **por diseño**. El token sí sirve para `railway up`/`railway variables`. El
> formato UUID **es** un project token válido, no "el ID visible en pantalla".

Deploys:

```text
Manual (CLI):  2291ae23-1e18-436a-918b-4ecf29b5dc29  SUCCESS RUNNING
Dominio:       https://web-production-816a4.up.railway.app
CI (Actions):  habilitado tras corregir el workflow (ver §7); dispara en push a main.
```

---

## 5. Estado de datos tras verificación

Se dejó la DB en guion limpio con:

- Reserva protagonista `TG-2026-0001`.
- Viaje protagonista en camino.
- 10 posiciones deterministas.
- Incidencia seed de objeto olvidado.
- QR no consumido, listo para demo.
- Reservas `TG-WA-*` limpiadas.
- Auditoría canónica reducida a 2 filas: `seed_sprint_1` y `seed_guion_s9`.

---

## 6. Pendiente para cerrar 100% operativo

CI/deploy automático: **resuelto** (token real en Secrets + workflow corregido, §7). Ya no es bloqueante.

Pendiente externo de demo grabada:

- Grabar video respaldo de 8-12 minutos con el guion.
- Smoke físico Android con dev client/EAS si se quiere mostrar mapa nativo/push real en teléfono.

Acción de seguridad recomendada (no bloquea la demo):

- **Rotar el `RAILWAY_TOKEN`** si su valor llegó a circular por un canal no seguro (chat/captura). Un project
  token permite desplegar y **leer todas las variables** del servicio (incluye `DATABASE_URL` con password y
  `SUPABASE_SERVICE_ROLE_KEY`). Rotar = borrar el token en Railway, crear otro y reemplazar el GitHub Secret.
- Rotar antes de producción real: password de DB, `AUTH_SECRET`, `HMAC_SECRET` (hoy son placeholders de demo,
  ya marcados en `docs/DEUDA_TECNICA.md`).

Sin esos puntos, el software S9 queda funcional, verificado localmente y desplegándose por CI.

---

## 7. Auditoría de cierre S9 (2026-06-04)

Revisión quirúrgica de todo lo construido en S9 contra el código real y contra producción viva. Resultado: el
núcleo (routing, voucher one-time, PDF, middleware, env) está **sólido**; se halló y corrigió **un bug real de CI**
y se confirmó que el bug de PDF reportado **ya estaba resuelto** en el deploy vivo.

### 7.1 Bug corregido: workflow de deploy

`deploy-web.yml` ejecutaba `railway up --project "$RAILWAY_PROJECT_ID" --service web --detach`. Con un **project
token**, pasar `--project` exige también `--environment`, de lo contrario el CLI aborta:

```text
--environment is required when using --project
```

El primer deploy por CI habría fallado. Como el project token ya auto-resuelve proyecto+environment, el fix es
**no pasar `--project`**: `railway up --service web --detach`. Verificado contra `railway` 4.66.x.

### 7.2 Verificado en producción (`https://web-production-816a4.up.railway.app`)

| Comprobación | Resultado |
|---|---|
| `GET /` | 200 |
| PDF pasajero (cadena completa) | 307 **relativo** → 307 Supabase firmado → 200. Sin `0.0.0.0`. |
| `POST /api/rutas/calcular` (coords canónicas) | 200 · `fuente=mapbox` · 21 km · 691 puntos de geometría |
| `/counter` sin sesión | 307 relativo a `/login-counter` (Auth.js `trustHost` OK) |
| Mapa pasajero (token `pk.*` inlineado en build) | contenedor del mapa presente en SSR ✓ |
| Variables Railway | `RUTAS_HABILITADAS=true`, `MAPBOX_SERVER_TOKEN`, `AUTH_*`, `SUPABASE_*`, `DATABASE_URL` presentes |

### 7.3 Bug de PDF reportado (`0.0.0.0:3000`)

Ya **corregido y verificado** en el deploy vivo. El handler del PDF pasajero devuelve `Location` **relativo**
(`/api/comprobantes/{id}/pdf?redirect=signed`) y el segundo salto redirige a la URL firmada absoluta de Supabase.
El síntoma `https://0.0.0.0:3000/...` correspondía a un deploy anterior al fix. No requiere cambios adicionales.

### 7.4 Observaciones menores (no bloqueantes, candidatas a MVP)

- `/api/rutas/calcular`: durante el *throttle* (≥2 clientes sobre la misma reserva en <2.5 s) se cachea una
  estimación bajo la misma clave de coordenadas por 45 s; con el gating cliente (120 m / 6 s) no se dispara en la
  demo. Aceptable mono-instancia.
- Caché/throttle en memoria de módulo: correcto con Railway a **1 instancia**; en MVP migra junto al rate-limit.

### 7.5 Verificación local

```text
pnpm turbo run typecheck lint test build  ->  56 successful, 56 total
```

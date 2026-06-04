# Cierre de Sprint 9 — Veredicto senior sobre las 7 recomendaciones + camino al 10/10

> **Propósito:** responder, con criterio de ingeniería independiente, qué de las 7 recomendaciones recibidas
> **entra a Sprint 9** (cierre de codificación) y qué **se difiere al MVP**, separando lo que sube la nota de
> la demo de lo que solo aplica a un producto en producción. Incluye la **solicitud consolidada de
> credenciales**. **Fecha:** 2026-06-03.

---

## 0. Marco de decisión

Sprint 9 es **"cerrar la codificación de una vez por todas y pasar al despliegue de punta a punta"** (palabras
del pedido). Por tanto el filtro es:

> **Entra a S9** lo que (a) hace la **demo a prueba de balas y desplegable**, (b) es **bajo riesgo / no rompe
> lo construido**, y (c) tiene **costo cero o trivial**.
> **Se difiere al MVP** lo que es **endurecimiento de producción** sin impacto en el guion de la demo, o lo
> que **`CLAUDE.md §0/§5` cerró explícitamente** como fuera de alcance.

Las reglas cerradas mandan: `CLAUDE.md §5` **prohíbe en demo** RLS multi-tenant activo, app pasajero, OAuth
pasajero, etc.; `§0` fija pago/SUNAT/SMS como simulados ("harina de otro costal"). Esas líneas **no se
reabren** en S9.

---

## 1. Veredicto recomendación por recomendación

| # | Recomendación | Veredicto | Por qué |
|---|---|---|---|
| **1** | Build real del driver en pipeline (`mobile-smoke.yml`) | ✅ **ENTRA a S9** | Mejor ROI de la lista. La deuda ya exige `expo export EXIT 0` como gate manual; promoverlo a CI es barato y atrapa bugs de Metro/Babel que ya colaron antes. |
| **2** | Deploy real (no solo workflow verde) | ✅ **ENTRA a S9** (ya era core) | Es **el** entregable de S9 (deploy + smoke prod + video). Necesita `RAILWAY_TOKEN`. |
| **3** | `env.ts` fail-fast en producción | ✅ **ENTRA a S9** (acotado) | Cambio pequeño, alto valor, soporta "deploy real". Solo lanza si `NODE_ENV=production`; demo/dev conserva la comodidad. Elimina el riesgo del `AUTH_SECRET` hardcodeado en prod. |
| **4** | RLS multi-tenant real | ⛔ **MVP** (prohibido en demo) | `CLAUDE.md §5` y el prompt S9 lo **prohíben explícitamente**. Demo es mono-tenant. Es el **#1 de seguridad para MVP**, no para la demo. |
| **5** | Rate-limit → Redis/Upstash | ⛔ **MVP** (con salvaguarda en S9) | Demo corre **1 instancia**; el limiter in-memory es correcto ahí. **Salvaguarda S9 (doc):** fijar Railway a 1 instancia para que el límite sea consistente. Upstash free tier = camino MVP. |
| **6** | Integraciones reales (SUNAT/pago/WABA/RENIEC/Directions/liquidación) | 🟡 **PARCIAL** | **Entran a S9:** (a) **QR de un solo uso** (ya era S9, ver `DEUDA §1.3`); (b) **Mapbox Directions real** = el pedido nuevo (ver `PLAN_RUTAS_TIEMPO_REAL_S9.md`). **Difieren a MVP:** SUNAT/pago/WABA/RENIEC real/liquidación — son decisiones cerradas `CLAUDE.md §0`. |
| **7** | Prueba física fuerte del conductor | 🟡 **PARCIAL** | S9 **entrega** el dev client + checklist + script de smoke; la **ejecución física la corre el usuario** (tiene el dispositivo). Se enlaza con el test del recálculo de ruta real en device. |

**Resumen de lo que ENTRA a S9 (más allá del backlog original):**
1. `packages/rutas` + routing en tiempo real (distancia/ETA/tráfico/ruta/recálculo) con fallback determinista.
2. QR de un solo uso en `/counter` (consumo idempotente server-side).
3. `mobile-smoke.yml` (CI del driver: typecheck + lint + `expo export`).
4. `env.ts` fail-fast en `NODE_ENV=production`.
5. Deploy Railway real + smoke de producción + checklist de prueba física del conductor.

**Lo que se DIFIERE al MVP (documentado, no olvidado):** RLS, Redis/Upstash rate-limit, SUNAT/pago/WABA/RENIEC
real/liquidación real.

---

## 2. Detalle de los endurecimientos que entran a S9

### 2.1. `mobile-smoke.yml` (recomendación 1)

- **Trigger:** `workflow_dispatch` + `push`/`pull_request` con `paths: ['apps/driver/**', 'packages/**']`.
- **Pasos:** `pnpm install --frozen-lockfile` → `pnpm --filter @taxigreen/driver typecheck` →
  `pnpm --filter @taxigreen/driver lint` → `pnpm --filter @taxigreen/driver exec expo export --platform android`.
- **Por qué separado de `ci.yml`:** el export RN es más lento y pesado (toolchain Metro/Babel); separarlo
  mantiene `ci.yml` rápido y no bloquea PRs de solo-web por el bundle nativo.
- **EAS build validado** (opcional): se **documenta** como paso manual con `EXPO_TOKEN`; no se mete a CI por
  costo/cuota del free tier de EAS.

### 2.2. `env.ts` fail-fast en producción (recomendación 3)

- **Comportamiento:** si `NODE_ENV === 'production'` y falta alguna de **`AUTH_SECRET`, `HMAC_SECRET`,
  `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`** ⇒ **error fatal al arrancar** (no fallback silencioso).
- **Fuera de producción:** se conserva el fallback de comodidad para que la demo local arranque sin fricción.
- **Quita el riesgo** del `AUTH_SECRET` hardcodeado llegando a prod.
- **No rompe nada:** el cambio está **gateado por `NODE_ENV`**; local/CI (`NODE_ENV` ≠ production) no cambia.
- **Variables nuevas de routing** (`MAPBOX_SERVER_TOKEN`, `RUTAS_*`) se suman como **opcionales** (sin ellas,
  estimación determinista).

### 2.3. Salvaguarda del rate-limit sin migrar a Redis (recomendación 5, mínimo viable)

- **Acción S9 (doc + deploy):** desplegar Railway con **una sola instancia/replica** del servicio web. Así el
  `Map` in-memory del limiter es la única fuente de verdad y el límite es consistente.
- **MVP:** mover a Upstash (free tier) o tabla con TTL. Misma decisión arquitectónica que la caché de routing
  (§7 del plan de rutas).

---

## 3. Qué haría a este proyecto un **10/10 independiente de que sea demo**

Esto **no entra a S9** (excede el cierre de demo), pero queda escrito como el norte de calidad para MVP. Es la
respuesta directa a *"comenta qué debe realizarse para que este proyecto sea un 10/10."*

### 3.1. Seguridad (lo más importante)
1. **RLS en Supabase/PostgreSQL** con políticas por `tenant_id` (`auth.jwt()->>'tenant_id'`) en las 10 tablas,
   + **tests negativos** que intenten leer datos de otro tenant y fallen. Hoy el aislamiento es por query
   Prisma; en producción debe ser por base de datos.
2. **Rotación de secretos** antes de prod: `AUTH_SECRET`, `HMAC_SECRET`, password de DB. Sin literales en
   repo (ya se cumple) y con **fail-fast** (entra en S9).
3. **Rate-limit distribuido** (Upstash/Redis) por **IP + email + dispositivo**, con log de intentos fallidos.
4. **Magic link firmado** para lectura de incidencias (hoy `GET /api/incidencias/[id]` es público por UUID) y
   vista de operador en `/admin/bienestar` **sin** el `token_pasajero` incrustado en el link.
5. **CSP formal** + `mapbox-gl` instalado localmente (hoy se carga desde CDN).

### 3.2. Integraciones reales (cerrar los stubs)
6. **SUNAT real** (emisión, no solo look-and-feel), **pasarela de pago real**, **WhatsApp Business API real**
   con verificación de firma del webhook entrante, **RENIEC real** (cadena de fallbacks), **liquidación real**
   al conductor. Todas detrás de las interfaces que ya existen (no reescritura).

### 3.3. Plataforma y operación
7. **CI del driver con EAS build firmado** + **iOS** + **background location** con foreground service.
8. **Observabilidad real:** Sentry con source maps + OpenTelemetry + dashboards; alertas.
9. **Pruebas:** cobertura de los paquetes críticos (`voucher`, `auditoria`, `asignacion`, `ingesta`,
   `comprobantes`), tests de carga del Realtime, y E2E móvil en device farm.
10. **Despliegue:** dominio propio, migraciones versionadas (incluida la config de Realtime de Supabase, hoy
    aplicada a mano), backups, y staging separado de prod.

### 3.4. Producto
11. **Bienestar 10 tipologías**, calificaciones bidireccionales con histórico, reportes corporativos
    `/empresa`, flight tracking, SaaS multi-operador. (Todo enunciado en `PLAN_SOFTWARE §3/§4`.)

> **Lectura honesta:** para una **demo comercial**, el proyecto ya está cerca del 10 (flujo A→Z real, 3 wows,
> patrón IA determinista-primero, app nativa real, pasajero sin app). El salto a **10/10 de producto** es
> sobre todo **seguridad (RLS) + integraciones reales + observabilidad**, que son MVP por definición. S9 no
> debe intentar todo eso o pondría en riesgo el cierre.

---

## 4. Solicitud consolidada de credenciales (lo que necesito que generes/envíes)

| Credencial | Obligatoria para | Estado probable | Nota |
|---|---|---|---|
| **`MAPBOX_SERVER_TOKEN`** (`pk.*`, scopes por defecto) | Routing real (ruta/ETA/tráfico) | ✅ **Cableada** | `pk.*` `taxigreen-directions-server` en `.env` y en Railway. Server-side. Routing real verificado en prod (`fuente=mapbox`). |
| **`RAILWAY_TOKEN`** | Deploy real + smoke de producción | ✅ **Resuelta** | **Project token** de Railway en GitHub Secrets. CI despliega con `railway up --service web` (sin `--project`, ver `ESTADO_SPRINT_9.md §7`). |
| **`EXPO_TOKEN`** | *(Opcional)* EAS build validado en CI | Pendiente, opcional | Solo si quieres validar el build firmado en CI. El dev client actual (`c7ecab4b`) ya sirve para el smoke físico. |
| `ANTHROPIC_API_KEY` | *(Opcional)* mostrar badge 🤖 IA | Opcional | La demo corre 100 % determinista sin ella. |

**Lo que NO necesito que generes:** `NEXT_PUBLIC_MAPBOX_TOKEN` / `EXPO_PUBLIC_MAPBOX_TOKEN` (ya en uso desde
S7/S8), `MAPBOX_DOWNLOAD_TOKEN` (ya configurado para EAS; **no** sirve para Directions).

> **Recordatorio de seguridad:** ninguna de estas llaves debe versionarse; van en `.env` gitignored o en
> GitHub Secrets. Rotar `HMAC_SECRET`/`AUTH_SECRET`/password de DB antes de producción.

---

## 5. Confirmaciones que pido antes de ejecutar S9

1. **Token Mapbox:** ¿tu `pk.*` actual tiene scopes por defecto (Directions habilitado)? Si lo restringiste a
   solo tiles, genera uno con scopes por defecto y mándamelo como `MAPBOX_SERVER_TOKEN`.
2. **Railway:** ¿genero el flujo asumiendo que me pasarás `RAILWAY_TOKEN`, o prefieres que el deploy quede
   como checklist manual documentado (sin token) y tú lo corres? (El workflow ya está gateado por el token.)
3. **Endurecimientos:** confirmo que **entran a S9** `mobile-smoke.yml` + `env.ts` fail-fast (mi
   recomendación). Si prefieres S9 más liviano (solo routing + counter + deploy), dímelo y los muevo a un S9.1.

*(Estas confirmaciones no bloquean la documentación, que ya está escrita; condicionan la ejecución de código
en S9.)*

---

## 6. Estado de ejecución (2026-06-04)

S9 **ejecutado, verificado y desplegado**. Las tres confirmaciones del §5 quedaron resueltas:

1. **Mapbox:** `pk.*` `taxigreen-directions-server` cableado; Directions habilitado; routing real verificado en
   producción (`fuente=mapbox`, ruta por calles, recálculo).
2. **Railway:** project token real en GitHub Secrets; deploy por Actions habilitado (workflow corregido).
3. **Endurecimientos:** `mobile-smoke.yml` + `env.ts` fail-fast entraron a S9 como se recomendó.

Lo que ENTRÓ a S9 (§1) está implementado y en verde (`56/56` tasks, `7/7` e2e). La auditoría de cierre encontró y
corrigió **un bug real de CI** (`--project` sin `--environment` en `deploy-web.yml`) y confirmó que el bug de PDF
`0.0.0.0` **ya estaba resuelto** en producción. Detalle: [`ESTADO_SPRINT_9.md §7`](ESTADO_SPRINT_9.md).

Lo DIFERIDO al MVP (§1 y §3) sigue siendo el norte de calidad: RLS, rate-limit distribuido, integraciones reales,
observabilidad, rotación de secretos. Nada de eso se reabrió en S9.

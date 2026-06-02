# Fuente de Verdad — Demo Taxi Green

**Fecha:** 2026-05-30 · **Estado:** canónico, activo para desarrollo.
**Propósito:** que un agente de programación entienda QUÉ construir sin leer 30 documentos. Destila `07_PLAN_EJECUCION/` + `06_DEMO_TECNICA/` activos + glosario/contrato. Donde se necesite profundidad, **apunta** al documento canónico; no lo duplica.

> Si algo aquí contradice a `00_EVIDENCIA_REAL` o al `GLOSARIO_FLUJOS_TAXIGREEN.md`, ganan ellos. Para el resto, este documento resume la decisión vigente.

---

## 1. El problema que se resuelve

Taxi Green es un operador formal de taxi aeroportuario en Lima (25 años, marca real, web `taxigreen.com.pe`). El cuello de botella **no es "pedir un taxi"**, es la **fricción entre el canal de entrada (WhatsApp, hotel, counter, llamada) y la operación**, y entre la operación y el **cierre administrativo** (voucher, asignación, comprobante, objeto olvidado).

La demo prueba que ese tránsito se puede **ordenar y hacer trazable sin reemplazar al humano**: el copiloto sugiere, el humano decide.

No es una app tipo Uber. Es la **digitalización de la operación existente** de Taxi Green.

---

## 2. Flujo protagonista (lo que la demo cuenta A→Z, ~12 min)

**Recojo en aeropuerto.** Dirección física: **Aeropuerto Jorge Chávez → Lima**.

```
Hotel/concierge solicita por WhatsApp un recojo en aeropuerto
  → Copiloto extrae datos + valida con reglas (no inventa: pide lo que falta)
  → Operador (Carla) ve el borrador en /admin → el copiloto SUGIERE conductor+unidad
    con motivo explicable → Carla APRUEBA → reserva CONFIRMADA + ASIGNADA
  → Voucher + QR + link /p/[token] vuelven al hotel por el mismo WhatsApp
  → Conductor (app nativa RN+Expo) recibe push → ACEPTA → va al Jorge Chávez
  → Pasajero final (que llega a Lima) abre /p/[token]: ve conductor, auto, mapa, ETA,
    y punto de encuentro "Salida 3, columna F2"
  → Conductor: En camino → Llegué a Salida 3 col. F2 → Pasajero a bordo
  → Viaje hacia Av. Pardo 123, Miraflores (tracking en vivo en /p/[token])
  → Doble confirmación (pasajero "llegué" + conductor "atendí") → FINALIZADA → "por liquidar"
  → Comprobante PDF (boleta/factura) → Calificación TRIPLE (servicio, conductor, unidad)
  → [arco corto] Objeto olvidado: pasajero reporta en el mismo link → conductor "Sí, encontré"
    → opciones de entrega → constancia → cierre
```

**Reglas cerradas del flujo (no invertir):**
- Hotel/concierge = **solicitante/canal**, NO origen físico. El conductor NO va al hotel.
- Pasajero final = **persona que viaja**, físicamente en el aeropuerto al recoger.
- Origen físico = **Aeropuerto Jorge Chávez (Llegadas)**. Punto de encuentro = **Salida 3, columna F2**. Destino = **Av. Pardo 123, Miraflores**. Vuelo ejemplo = **LA2456**.

**Flujo secundario (~3 min) — Counter walk-in:** pasajero llega al módulo del aeropuerto sin reserva → supervisor registra destino en Lima + tipo de unidad → tarifa → **asigna desde la cola de conductores** (no el más cercano) → alimenta el mismo `/admin`. Dirección física también **Aeropuerto → Lima**.

**Arco de incidencia (~2 min) — Objeto olvidado:** única tipología construida en demo. Las otras 9 se enuncian.

Detalle: `06_DEMO_TECNICA/FLUJO_NEGOCIO_CANONICO.md` (negocio) y `CONTRATO_NARRATIVO_DEMO.md` (guion min a min).

---

## 3. Actores y superficies

| Actor | Superficie | Stack | Protagonismo demo |
|---|---|---|---|
| **Hotel/concierge** (solicitante) | WhatsApp → simulador `/wa-sim` | `apps/web` | Inicia el flujo |
| **Operador/Admin "Carla"** | `/admin` | `apps/web` | **Protagonista (humano en control)** |
| **Conductor** | **App nativa** | `apps/driver` (RN + Expo SDK 51) | Protagonista de ejecución |
| **Pasajero final** | Link `/p/[token]` (sin app) | `apps/web` | Importante, no activo |
| **Supervisor counter** | `/counter` (tablet) | `apps/web` | Secundario (diferencial) |
| **Empresa cliente** | — | — | **Solo enunciado** (1 lámina). No construir. |

Superficies web (`apps/web`, Next.js 15.4): `/` (landing CTA WhatsApp), `/wa-sim`, `/admin`, `/counter`, `/p/[token]`, `/bienestar/[caso]`. App conductor (`apps/driver`): login PIN, home, asignación, perfil.

---

## 4. Qué se construye / simula / enuncia / queda para MVP

| | Contenido |
|---|---|
| **Se construye (real)** | Simulador `/wa-sim` (LLM real + fallback determinista visible) · voucher + QR HMAC · `/admin` con aprobación humana y sugerencia explicable · app conductor nativa (push, mapa, estados, ubicación foreground) · `/p/[token]` (tracking, DriverCard/VehicleCard, comprobante, calificación triple, reporte) · `/counter` con escaneo QR por cámara + walk-in · 1 incidencia objeto olvidado E2E · comprobante PDF SUNAT-like (visual) · **GPS/mapa/ETA/cálculo de km reales** (exigencia de Raúl). |
| **Se simula (declarado al cliente)** | WhatsApp Business API (lo cubre `/wa-sim`) · pasarela de pago (UI + check) · emisión SUNAT real · RENIEC (cache 3 DNIs del guion) · SMS/llamada (toast) · LLM desconectable → fallback determinista responde (badge 🤖/⚙️). |
| **Se enuncia (no se construye)** | Traslado hacia aeropuerto (ciudad→Jorge Chávez) · empresa/reporte corporativo (1 lámina) · 9 tipologías extra de bienestar · liquidación real (el `DriverHistorySummary` es mockup) · app pasajero nativa · biometría · OCR · LAP/ATU · SaaS. |
| **MVP (después de vender)** | Detalle en `PLAN_SOFTWARE §3`. La demo siembra el ADN (interfaz `LLMProvider`, 10 tablas + deltas, packages deterministas, app RN+Expo) que el MVP **no rehace**. |

---

## 5. Stack técnico (cerrado)

```
Monorepo:   Turborepo 2 + pnpm 9 · TypeScript 5.6 strict + noUncheckedIndexedAccess · Node 22 LTS
apps/web:   Next.js 15.4 (App Router + RSC) · Tailwind 3.4 + shadcn/ui · Zustand 5 + TanStack Query 5
            · React Hook Form 7 + Zod 3 · Auth.js v5 · Supabase Realtime client · Vercel AI SDK 4
apps/driver:React Native 0.74+ con Expo SDK 51 · Expo Router 3 · NativeWind 4 · Zustand + TanStack Query
            · supabase-js · expo-location (foreground demo) · expo-notifications (FCM) · expo-secure-store
            · @rnmapbox/maps · Distribución: Expo Go dev client (demo) → EAS Build (MVP)
packages/*: Prisma 6 · PostgreSQL 17 + PostGIS 3.5 (Supabase) · Anthropic SDK vía interfaz LLMProvider
            · Modelos demo: claude-sonnet-4-6 (extracción) + claude-haiku-4-5-20251001 (racionalización)
            · Puppeteer (PDF) · qrcode + HMAC SHA-256 · Resend · Supabase Storage · Pino + Sentry
Stubs demo: WABA · Pagos · SUNAT · LAP/ATU (interfaz + endpoint 501)
Tests:      Vitest 2 + Playwright 1.48 + MSW 2 · Hosting demo: Railway (web) + Supabase + Expo Go
```

**Backend = Next.js (Route Handlers + Server Actions), NO NestJS.** **Monolito modular, NO microservicios.** Justificación en `PLAN_SOFTWARE §7.3`. Estructura de monorepo objetivo en `SPRINT.md §0.2`.

**Patrón inviolable de IA:** toda capacidad inteligente tiene **dos implementaciones — determinista (siempre activa) + LLM (opcional)** unidas por `withFallback()`. Si `IA_HABILITADA=false`, el sistema opera 100% determinista. La demo debe correr con el LLM desconectado. Código de referencia en `PLAN_SOFTWARE §7.5`. Ningún string de prompt vive en código: van en `packages/ia/prompts/*.md` con frontmatter de versión.

---

## 6. Modelo de datos demo — REGLA CRÍTICA

> El esquema demo = **`PLAN_SOFTWARE §7.6` (10 tablas base)** **MÁS** **los deltas de `LOGICA_NEGOCIO_OPERATIVA §8`**. Si construyes solo el §7.6 base, faltarán los campos que alimentan las DriverCard/VehicleCard/RatingTripleCard pedidas. **Aplica ambos.**

**10 tablas (no más):** `tenants`, `usuarios`, `conductores`, `vehiculos`, `reservas`, `viajes`, `posiciones_conductor`, `comprobantes`, `incidencias`, `auditoria`.
`tenant_id` simbólico en todas (salvo `tenants` y `auditoria` nullable). **Sin RLS activo** en demo.

**Deltas obligatorios sobre el §7.6 base (todos `Construir (demo)`, no añaden tablas):**
```prisma
// conductores
+ foto_url      String?
+ total_viajes  Int @default(0)        // semilla para "487 viajes" en DriverCard
// vehiculos
+ marca   String                        // "Toyota"
+ tipo    TipoVehiculo                   // enum nuevo
+ foto_url String?
+ color   String?
+ anio    Int?
// reservas
+ calificacion       Json?              // {servicio, conductor, unidad, motivo[], comentario}
+ tipo_viaje         TipoViaje          // recojo_aeropuerto | traslado_aeropuerto | city
+ solicitante_tipo   String?            // hotel | empresa | pasajero | operador
+ solicitante_nombre String?
+ solicitante_contacto String?
// enums nuevos
+ enum TipoVehiculo { sedan camioneta van minivan }
+ enum TipoViaje    { recojo_aeropuerto traslado_aeropuerto city }
```
`reservas` también tiene (ya en §7.6): `canal_origen`, `punto_encuentro`, `token_pasajero` (nanoid 21, único), `voucher_codigo` (único), `voucher_qr_payload` (HMAC), `raw_ingesta jsonb`, `sugerencia_copiloto jsonb`, `hotel_nombre` (solicitante/convenio, **nunca** reemplaza `origen_texto`).

**Semilla protagonista obligatoria** (`LOGICA §2.2` / `CONTRATO_FLUJO_PROTAGONISTA §4`):
```json
{ "canal_origen": "whatsapp_oficial", "tipo_viaje": "recojo_aeropuerto",
  "solicitante_tipo": "hotel", "solicitante_nombre": "Concierge hotel",
  "pasajero_nombre": "Pasajero final del huésped",
  "origen_texto": "Aeropuerto Jorge Chávez - Llegadas",
  "punto_encuentro": "Salida 3, columna F2",
  "destino_texto": "Av. Pardo 123, Miraflores", "vuelo_codigo": "LA2456" }
```

**Semilla MVP (NO crear tablas en demo):** `calificaciones`, `liquidaciones`, `asignaciones_unidad`, `empresas_clientes`. Importes del `DriverHistorySummary` se calculan por conteos/sumas sobre `viajes`/`comprobantes` con `tasa_comision` de config. Detalle en `LOGICA_NEGOCIO_OPERATIVA.md` (entidades, asignación, cola, calificación, importes).

---

## 7. Reglas de negocio obligatorias

1. **Asignación separada conductor / unidad** (N:N en el tiempo). Se eligen por separado en `/admin` y counter.
2. **Cola de conductores, no cercanía pura.** `score = w1·tiempo_en_cola + w2·(1/distancia) + w3·match_tipo_unidad + w4·capacidad − w5·penalización`. GPS solo no basta. (`Evidencia directa`.)
3. **Humano en control.** El copiloto **sugiere**; el operador **confirma**. La IA no despacha sola. Toda acción del operador → `recordAudit` con `fuente_decision`.
4. **Doble confirmación cruzada para cerrar:** pasajero "llegué" + conductor "atendí" → `por_liquidar`.
5. **Pago al conductor = "harina de otro costal":** el cierre **prepara** la liquidación, no la ejecuta. La demo llega hasta `por_liquidar`; el `DriverHistorySummary` es mockup.
6. **Tarifa cerrada** (no dinámica). `Por validar` si siempre exacta.
7. **Voucher/QR de un solo uso**, firmado HMAC, validación server-side, bloqueo idempotente si se reusa.
8. **GPS, ETA y mapa reales** (exigencia de Raúl). Lo demás (pago, SUNAT, SMS) simulado.
9. **Calificación triple** (servicio, conductor, unidad). Si un eje ≤3, pedir motivo (chips). `jsonb` en demo.
10. **Cero negación en bienestar:** si no hay respuesta inmediata, "te respondemos en X min" con humano nombrado, y se cumple.

Estados de reserva: `ingesta_pendiente → necesita_revision → confirmada → asignada → en_curso → finalizada → por_liquidar / cancelada` (en demo, `necesita_revision` y `por_liquidar` son etiquetas visuales). Estados de viaje: `asignado → en_camino → en_punto → a_bordo → finalizado`. Eventos y transiciones completos en `FLUJO_NEGOCIO_CANONICO §6–7`.

---

## 8. Pantallas/componentes del Figma que importan para código

El plugin `06_DEMO_TECNICA/figma-plugin-taxigreen-master/` genera 14 páginas / 64 pantallas. **Para el código del demo solo importa la ruta protagonista + counter + objeto olvidado.** Ignora las pantallas marcadas `support` (wizard reserva pasajero `1.B–1.E`, empresa `09/11`, etc.).

**Ruta protagonista (validada, `screens.master.json`):**
```
cover.00 → prototype.home → pwa.passenger.1A → whatsapp.12A → 12B → 12C
→ dispatch.3C → driver.2C → 2D → pwa.passenger.1G2 → 1G3 → 1G4 → 1G5
→ wellbeing.13A → 13B → 13F → 13G → 13H → 13K
```
**Ruta counter:** `counter.4A → 4B → 4C → dispatch.3C`.

**Componentes premium obligatorios (P0/P1)** — especificados en `ESPECIFICACION_PANTALLAS_PREMIUM §3`:
- `DriverCard` (foto, nombre completo, ★valoración, viajes) · `VehicleCard` (foto auto 16:9, placa, marca/modelo, tipo) · `RatingTripleCard` (3 ejes) · `AssignmentApprovalPanel` (sugerencia + motivo + score + badge 🤖/⚙️) · `WhatsAppCopilotDualPanel` (chat + cocina del copiloto) · `DriverHistorySummary` (6 importes, mockup) · `DriverQueueList` (cola por tiempo) · `VoucherQR` · `PassengerTrackingLink` · `TripStatusTimeline` · `IncidentResolutionPanel`.

**Mapa de cumplimiento Figma↔requisitos** (qué pantalla cumple/falta y su prioridad): `06_DEMO_TECNICA/MAPA_ALINEACION_PLAN_FIGMA.md`. Componentes viven en `apps/web/src/components/` y `apps/driver/src/components/`. El plugin es **referencia**: el Figma se regenera ejecutándolo en Figma Desktop; **no se modifica `code.js` ni `screens.master.json`**.

---

## 9. Qué NO inventar / qué está prohibido en la demo

**No inventar:** datos que no estén en el mensaje (el copiloto pide lo que falta, no rellena) · `tasa_comision` (usar 20% rotulado como `Hipótesis`) · tarifas reales (semilla) · paleta final (ver decisiones abiertas) · pantallas o flujos que no estén en la ruta protagonista/counter/objeto-olvidado.

**Prohibido construir en demo:** app pasajero nativa · OAuth/login social pasajero · portal `/empresa` con reportes · OCR on-device · biometría · background location con foreground service · RLS activo · cadena RENIEC · 9 tipologías extra de bienestar · marketplace/subasta/contraoferta · tarifa dinámica · flight tracking · liquidación real · SaaS · iOS. (Lista canónica: `PLAN_SOFTWARE §2.3` y `§6`.)

---

## 10. Plan de ejecución (10 sprints)

`SPRINT.md` define S0–S9. Modelo por sprint (Opus en S0/S1/S4/S6; Sonnet/Codex el resto). **Sprint 0 = solo cimentación** (ver `02_PROMPT_SPRINT_0.md`). Regla de oro: nada se mergea sin `pnpm turbo run typecheck lint test` verde; cada sprint se cierra con su smoke test; si un sprint descubre un riesgo, se actualiza el doc **antes** de seguir.

| S | Foco |
|---|---|
| S0 | Cimentación monorepo + apps stub + Supabase + CI |
| S1 | Schema 10 tablas (+ deltas §8) + seed protagonista + Auth.js v5 |
| S2 | Voucher QR HMAC + Comprobante PDF + Auditoría |
| S3 | `/admin` + Supabase Realtime + asignación manual (conductor/unidad separados) |
| S4 | Capa IA mínima + ingesta determinista + simulador `/wa-sim` |
| S5 | Heurística de asignación + racionalización LLM con fallback |
| S6 | App conductor RN+Expo: scaffolding + auth PIN + push + recibir asignación |
| S7 | App conductor: mapa + estados viaje + ubicación foreground |
| S8 | `/p/[token]` + tracking + comprobante + 1 incidencia (objeto olvidado) |
| S9 | `/counter` QR + landing + datos del guion + reset + deploy + video respaldo |

---

*Fin. Profundidad: `07_PLAN_EJECUCION/PLAN_SOFTWARE.md` (técnico), `SPRINT.md` (ejecución), `LOGICA_NEGOCIO_OPERATIVA.md` (datos/reglas), `06_DEMO_TECNICA/` (negocio, guion, pantallas, Figma). Decisiones que faltan: `04_DECISIONES_ABIERTAS.md`.*

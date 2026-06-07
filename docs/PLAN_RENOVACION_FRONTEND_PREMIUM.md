# Plan de Renovación Frontend Premium — Taxi Green

> **Estado:** F0 ✅ · F1 ✅ · F2 ✅ · F3 ✅ · F4 ✅ · **FQA (ojos reales) ✅** · **F3.5 driver premium ✅ (1er pase)** · F5 siguiente · rama `feat/renovacion-frontend-premium`
> **Origen:** `docs/PROMPT_MAESTRO_RENOVACION_FRONTEND_PREMIUM_TAXIGREEN.md` (propuesta ChatGPT) + ajustes propios.
> **Regla rectora:** si una pantalla necesita explicación, está mal. Una info = un bloque. El mapa manda.

> **Estrategia de QA visual (no quedar ciegos) — añadida 2026-06-06.**
> - **Web:** Playwright con servidor propio → `pnpm visual:web` deja capturas (móvil+desktop, claro+oscuro) en
>   `artifacts/playwright/` + `report.html`. Es como se cazó la corrupción del pasajero y se afinó el counter.
> - **Móvil (driver):** **dev client + Metro = código EN VIVO de la rama** sobre BlueStacks/ADB (NO el APK
>   preview congelado que apunta a prod). Guía completa en `docs/QA_MOVIL_ANDROID_OJOS_REALES.md §0`.
>   Herramienta elegida: **Maestro** para flows declarativos (`.maestro/`) cuando el device soporta su driver;
>   **ADB directo** (`scripts/visual-driver-adb.mjs`) como ruta principal estable en BlueStacks. Detox/Appium
>   se descartan por ahora (pesados; requieren build instrumentado / enterprise).

Este documento es el entregable de **Mini Sprint F0** (auditoría read-only dirigida, sin tocar
producto). No se leyó todo el repo: se usó `grep` dirigido sobre superficies visibles para minimizar
tokens y atacar lo concreto.

---

## 1. Objetivo y desviaciones respecto al prompt de ChatGPT

El prompt maestro es buena guía. Se adopta con **6 ajustes**:

1. **Se añade modo claro/oscuro** (no estaba en el prompt; es pedido explícito del usuario). Se engancha
   al sistema de tokens azul existente (`packages/shared/src/tokens`), no se inventa paleta nueva.
2. **F0 minimal**: auditoría por `grep`, no lectura exhaustiva de 15 rutas.
3. **Baneo de términos = solo strings visibles (microcopy).** Nunca identificadores, tipos, enums,
   columnas de DB (`score_sugerido`), params de ruta (`/p/[token]`), JWT ni tests. Riesgo #1.
4. **Público diferenciado**: baneo estricto en superficies de cliente (pasajero, counter, conductor);
   en `/admin` (operador) se humaniza conservando precisión operativa.
5. **El copiloto automático (preguntar faltantes + confirmar) toca lógica** (`packages/ingesta`):
   va en su propio mini-sprint (F5), con patrón determinista-primero y tests, no mezclado con copy.
6. **Reúso**: el driver ya tiene `BottomSheet.tsx`; en web el bottom sheet se hace ligero sin librería nueva.

### Reordenamiento de mini-sprints (vs ChatGPT)

| Mini sprint | Foco | Estado |
|---|---|---|
| **F0** | Auditoría dirigida + este documento | ✅ |
| **F1** | Fundamentos: **lenguaje humano** + **tema claro/oscuro** (infra + landing) | ✅ |
| **F2** | Pasajero `/p/[token]` map-first + bottom sheet + fullscreen | ✅ |
| **F3** | Conductor `asignacion/[id]` modo navegación full-screen (mapa fill + banner + panel) | ✅ |
| **F4** | Counter premium + QR progresivo (flujo guiado por estado, sin jerga, dark) | ✅ |
| F5 | WhatsApp copiloto premium (modo auto + política de confianza) — toca `packages/ingesta` | 🔜 |
| F6 | Despacho `/admin` simplificado | ⏳ |
| F7 | Soporte / calificación / comprobante progresivos | ⏳ |
| F8 | Pruebas, smoke comercial, cierre y docs | ⏳ |

**Cierre F4 (2026-06-06):** `/counter` pasó a un flujo guiado por estado (barra **Validar → Confirmar acceso
→ Siguiente pasajero**): cámara como acción principal ("Escanear QR"), código manual como alternativa; el
resultado del pasajero y "Confirmar acceso" solo aparecen tras validar; al confirmar muestra "Acceso
confirmado". Se eliminó la jerga (HMAC, idempotente, token, "Walk-in aeropuerto", "Entrega y auditoría",
"Validación operativa", "Fallback operativo") y se suavizó el `BrandHeader` ("operación trazable" → "Demo en
vivo"). Dark-mode-aware por tokens. Lógica de validación/consumo/cámara intacta → el e2e de seguridad del QR
(API) no cambia. Verificado con screenshots (idle claro/oscuro + estado de error) y `turbo typecheck lint
test` 53/53. Nota: el voucher demo `TG-2026-0001` quedó consumido (2026-06-04); para ver el happy-path correr
`pnpm --filter @taxigreen/database db:seed-guion`.

**F3.6 — Tonalidad móvil: dark-first + verde dopamina (2026-06-06):** por feedback del usuario ("el azul es
simplista y genera cero dopamina; modo noche en negro/gris; mejor verde"). Se **reabre la decisión AZUL cerrada**
(autorizada por el usuario) para `apps/driver`:
- Nueva paleta del driver (`apps/driver/tailwind.config.js`): `brand` = esmeralda (#10B981 / glow #34D399) para
  acción/energía; `ink` = negro/gris neutro (#0A0A0B…#2E2E34) para superficies. Se abandona el azul.
- **App conductor DARK-first** (estilo Uber Driver/Waze de noche): login, home, navegación, tabs, `TouchButton`,
  `NumPad` reescritos a negro + verde. CTAs verde brillante con texto oscuro = alta dopamina.
- Verificado **en vivo** (dev client) los 3 screens core: login, home y navegación. `expo export` EXIT 0.
- **Web aún en azul** (pendiente de confirmar dirección con el usuario antes de migrar tokens compartidos +
  dark mode web a negro/gris/verde; ver `packages/shared/src/tokens/colors.ts`).
- **Mapa nativo:** sigue sin pintar en BlueStacks (GL). Plan robusto para verlo (físico+scrcpy / AVD+KVM) en
  `QA_MOVIL_ANDROID_OJOS_REALES.md §00` — lo ejecuta el usuario.

**F3.5 — Driver premium con ojos reales (2026-06-06):** primer pase de renovación del conductor verificado
**en vivo** (dev client + Metro + backend local, capturas reales en BlueStacks):
- **Home sin jerga:** fuera las tarjetas "REALTIME / Realtime activo" y "PUSH / Push no provisionado"; ahora un
  indicador humano "● En línea / Conectando", estado Disponible/En pausa, unidad con icono, y CTA protagonista
  "Tienes un viaje → Abrir viaje". Texto más medido (sin 3xl).
- **Tabs:** iconos reales (`@expo/vector-icons` Ionicons) — antes salían como tofu (□).
- **Navegación full-screen:** la barra de tabs se **oculta** en `asignacion/[id]` e `incidencia/[id]`
  (`tabBarStyle: display:none`), eliminando el corte inferior que rompía la inmersión.
- **Login balanceado:** centrado vertical (antes pegado abajo con vacío enorme en pantallas grandes) + error
  humano ("Ese email o PIN no coincide…").
- **Dato humanizado:** el seed usaba `pasajero_nombre: "Pasajero final del huésped"`; se unificó a **"Valeria
  Mendoza"** (nombre canónico que ya usan tests y la conversación WhatsApp).
- Pendiente (siguiente iteración del loop): mapa nativo no pinta en BlueStacks (GL del emulador; OK en device/
  web) → cubrir con device físico; explorar acento/dopamina y panel inferior más rico en navegación.
- Verde: `expo export android` EXIT 0 (4.48 MB), driver typecheck+lint.

**Hardening F2 (2026-06-05):** la vista map-first del pasajero se veía rota en desktop (mapa full-bleed →
área vacía a pantalla ancha; en local sin `NEXT_PUBLIC_MAPBOX_TOKEN` se ve el `MapFallback`). Se contuvo en
**columna centrada (máx. 480px)** sobre fondo sobrio: full-screen en móvil, impecable en desktop como la
versión de producción. La altura sigue siendo la del viewport, así el bottom sheet (mide con
`window.innerHeight`) calza exacto. Mapa más fluido: `ResizeObserver → map.resize()` (el canvas desfasado del
contenedor hacía sentir el paneo "duro") + `maxZoom` cómodo; el `MapFallback` ya no queda tapado por el sheet.
Verificado con screenshots (desktop 1366×800 + móvil 390×844) y e2e (smoke + passenger-link) 3/3.

**Cierre F3 (2026-06-05):** `apps/driver/app/(auth)/asignacion/[id].tsx` pasó de `ScrollView` + mapa `h-80`
a navegación estilo Waze: mapa de fondo a pantalla completa (`AssignmentMap` con prop `fill`), banner
superior con instrucción humana (`bannerConductor`) + llegada (`formatLlegada`, nunca "ETA"), y panel
inferior con una sola acción (`accionConductor`) + detalles expandibles. Se cableó `@taxigreen/shared` en el
driver (dependencia workspace) importando desde la **raíz** (no subpath: Expo SDK 51 no tiene
`unstable_enablePackageExports`). Toda la lógica (carga, retry offline, 409, tracking, ruta, KeepAwake) se
conservó intacta. Verde: `expo export android` EXIT 0 (1360 módulos), `turbo typecheck lint test` 53/53.
**Regresión e2e cazada con Playwright:** F2 había roto `passenger-link.spec.ts` (afirmaba la microcopy vieja
"Recojo en aeropuerto"/"Tu conductor"); se actualizó el spec a la copy nueva conservando los hechos del flujo
protagonista (vuelo, punto, destino, placa, llamada). e2e web (smoke + passenger-link) 3/3.

---

## 2. Inventario de superficies

### Web (`apps/web/src/app`)
- `/` landing — `page.tsx`
- `/p/[token]` pasajero — `seguimiento-cliente.tsx` (~1000 líneas, mapa dentro de tarjeta)
- `/counter` validación QR — `page.tsx`, `voucher-validator.tsx`
- `/admin` despacho — `page.tsx`, `admin-reservas-live.tsx`, `reservas/[id]/{page,reserva-detalle,sugerencia-card}.tsx`
- `/admin/{auditoria,bienestar,metricas}` paneles internos
- `/wa-sim` simulador WhatsApp — `whatsapp-simulator.tsx`, `actions.ts`
- `/bienestar/[caso]` objeto olvidado
- `/login-admin`, `/login-counter`
- `/demo/guion-narrado` (interno; no comercial — copy técnico permitido)

### Driver (`apps/driver/app`)
- `index.tsx`, `login.tsx`
- `(auth)/home.tsx` — muestra estado técnico (Realtime/Push)
- `(auth)/asignacion/[id].tsx` — pantalla activa, hoy con `ScrollView` y mapa `h-80`
- `(auth)/incidencia/[id].tsx`, `(auth)/perfil.tsx`
- Componentes: `BottomSheet.tsx` (✅ reusable), `NumPad.tsx`, `TouchButton.tsx`, `map/AssignmentMap.tsx`

---

## 3. Copy técnico detectado (grep real, 62 ocurrencias en UI web)

Ejemplos confirmados que **sí** son visibles al cliente (prioridad de F1):

| Archivo | Línea (aprox) | Texto técnico | Reemplazo |
|---|---|---|---|
| `app/page.tsx` | 20, 97 | "ETA", "ETA y ruta en tiempo real…Mapbox" | "Llega en…", "Sigue tu viaje en vivo" |
| `p/[token]/seguimiento-cliente.tsx` | 176, 237, 470 | "Ruta real"/"Estimación", "ETA X min" | "Ruta actualizada", "Llega en X min" |
| `counter/page.tsx` | 19 | "consume el QR de forma idempotente" | "valida el acceso de un solo uso" |
| `wa-sim/whatsapp-simulator.tsx` | 192 | "WA Sim" | "WhatsApp" |
| `admin/reservas/[id]/reserva-detalle.tsx` | 17-20 | "X min en cola" | "X min en turno" (operador) |

**NO tocar (son código, no copy):**
- `score_sugerido`, `score`, `scoreRaw` en `actions.ts` (columnas/variables)
- `route.fuente === 'mapbox'` (lógica anti-recta — ver memoria `mapas-solo-ruta-real`)
- `record.fuente`, params, comentarios `//` internos
- `/demo/guion-narrado` (guion interno de demo, no superficie comercial)

---

## 4. Estado del sistema de tema (hallazgo para modo claro/oscuro)

- **Web:** tokens en `packages/shared/src/tokens/colors.ts` (paleta azul cerrada). Tailwind
  (`apps/web/tailwind.config.ts`) mapea colores con **hex fijos**; `background/foreground/border/surface`
  apuntan a neutros claros fijos. `globals.css` define unas CSS vars sin uso real. **No hay dark mode.**
- **Driver:** NativeWind 4 (`tailwind.config.js` + `global.css`). Sin `useColorScheme` ni `dark:`.

**Decisión de implementación (F1):**
1. `darkMode: 'class'` en Tailwind web.
2. Convertir los tokens **semánticos de superficie** (`background`, `surface`, `foreground`, `border`,
   y `product-deep` de chrome) a CSS variables en `globals.css` con override en `.dark`. Light mode
   conserva exactamente los valores actuales → cero regresión visual.
3. `ThemeProvider` propio (sin dependencia nueva) + script anti-flash en `layout.tsx` + toggle.
4. La paleta de marca (verde, care/púrpura, product-500) **no se invierte**; solo se adapta el chrome.
5. Cobertura dark se completa por superficie en F2/F4/F6 (donde hoy hay `bg-white` hardcodeado).
   El driver (NativeWind) se aborda en F3.

---

## 5. Cambios por prioridad

1. **F1** Lenguaje humano (cliente estricto) + infra tema + landing.
2. **F2/F3** Mapa grande pasajero / navegación full-screen conductor (el mayor "wow").
3. **F4** Counter progresivo.
4. **F5** Copiloto seguro con confirmación.
5. **F6/F7** Despacho y cierre del viaje.

---

## 6. Riesgos

- **Reemplazo a ciegas** que rompa identificadores/tests → mitigado: solo microcopy, revisión por archivo.
- **Dark mode incompleto** por `bg-white`/`text-neutral-*` hardcodeados → se acepta cobertura progresiva;
  infra no rompe light mode.
- **Bottom sheet web** sin librería → implementación ligera; si crece, evaluar `vaul`.
- **Driver expo export** debe seguir verde; cambios de navegación no deben romper el bundle (F3).
- Preservar invariantes de memoria: solo ruta real (`mapas-solo-ruta-real`), push por Realtime
  (`push-no-en-apk-standalone`).

---

## 7. Plan de pruebas (cierre F8)

```bash
pnpm turbo run typecheck lint test build
pnpm e2e
pnpm --filter @taxigreen/driver exec expo export --platform android
```
Más smoke manual por superficie y verificación de que no quedan términos prohibidos en copy de cliente.

---

## 8. Criterio de aceptación F0

- [x] No se modificó producto, solo este documento.
- [x] Inventario de superficies, copy técnico y estado de tema documentados con evidencia real (grep).
- [x] Plan por mini-sprints con desviaciones justificadas respecto al prompt original.

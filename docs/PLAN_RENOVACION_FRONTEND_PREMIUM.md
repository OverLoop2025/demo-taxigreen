# Plan de Renovación Frontend Premium — Taxi Green

> **Estado:** F0 cerrado · F1 en curso · rama `feat/renovacion-frontend-premium`
> **Origen:** `docs/PROMPT_MAESTRO_RENOVACION_FRONTEND_PREMIUM_TAXIGREEN.md` (propuesta ChatGPT) + ajustes propios.
> **Regla rectora:** si una pantalla necesita explicación, está mal. Una info = un bloque. El mapa manda.

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
| **F1** | Fundamentos: **lenguaje humano** + **tema claro/oscuro** (infra + landing) | 🔄 |
| F2 | Pasajero `/p/[token]` map-first + bottom sheet + fullscreen | ⏳ |
| F3 | Conductor `asignacion/[id]` modo navegación full-screen | ⏳ |
| F4 | Counter premium + QR progresivo | ⏳ |
| F5 | WhatsApp copiloto premium (modo auto + política de confianza) — toca `packages/ingesta` | ⏳ |
| F6 | Despacho `/admin` simplificado | ⏳ |
| F7 | Soporte / calificación / comprobante progresivos | ⏳ |
| F8 | Pruebas, smoke comercial, cierre y docs | ⏳ |

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

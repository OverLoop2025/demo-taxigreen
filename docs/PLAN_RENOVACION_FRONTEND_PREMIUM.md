# Plan de Renovación Frontend Premium — Taxi Green

> **Estado:** F0 ✅ · F1 ✅ · F2 ✅ · F3 ✅ · F4 ✅ · **FQA (ojos reales) ✅** · **F3.5 driver premium ✅** · **F6 despacho simplificado ✅** · **F8 tema coherente + sin JSON ✅ (2026-06-07)** · **F10 conductor mapa→navegación ✅ (2026-06-09)** · **F11 conductor 1ª persona + historial + coherencia unidad ✅ (2026-06-09)** · **F5 WhatsApp copiloto (chat con QR/enlace + modo copiloto) ✅ (2026-06-10)** · **F12 conductor pulido + landing premium ✅ (2026-06-10)** · F7 siguiente · rama `feat/renovacion-frontend-premium`
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
| **F6** | Despacho `/admin` simplificado | ✅ 1er pase |
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

**F3.7 — Identidad de color UNIFICADA: esmeralda + noche negra (2026-06-07):** se extendió el verde a **todo el
sistema** (no solo el driver) de forma coherente, centralizado en los tokens:
- `packages/shared/src/tokens/colors.ts`: `product` pasa de azul a **esmeralda** (DEFAULT `#059669` legible con
  texto blanco; `deep` `#053226` para héroes/títulos; `400/500` = acentos brillantes `#34D399`/`#10B981` de
  dopamina). `brand/tenant` a esmeralda vivo; `semantic.info` a verde. Propaga a TODA la web (clases semánticas).
- `apps/web/src/app/globals.css`: **modo noche = NEGRO + grises neutros** (`#0a0a0b…#2a2a2e`), no navy → el verde
  resalta al máximo. Light mode limpio (legibilidad).
- Coherencia de detalle: degradado del hero de la landing a esmeralda; ruta del mapa pasajero a verde
  (línea `#34D399`, casing `#053226`, marcador `#10B981`); mapa/fallback del driver a verde+oscuro.
- Tests de tokens actualizados (shared + web smoke). Verde: `turbo typecheck lint test` 53/53, e2e 7/7 (dos fases),
  `expo export` EXIT 0. Verificado con `visual:web` (landing/pasajero/counter, claro+oscuro): legible y coherente.
- Pendiente menor: en modo oscuro, la etiqueta "PUNTO DE ENCUENTRO" del pasajero (verde sobre tinte verde) gana
  con un acento más claro; perfil/incidencia del driver siguen en claro (migrar a oscuro en otra pasada).

**F9 — Chofer: navegación tipo Waze + modo oscuro real, verificado con ojos reales (2026-06-08):** sobre el
emulador Windows (`emulator-5582`) con capturas adb en cada paso. (1) **Modo oscuro arreglado de raíz:** seguía sin
conmutar porque el `colorScheme` de NativeWind con `darkMode:'class'` no resuelve fiable el modo del sistema; ahora
`ThemeProvider` calcula `resolved` desde `Appearance` nativo e inyecta los tokens de superficie con `vars()` →
todas las pantallas cambian a la vez. Tab bar y `StatusBar` migrados a la misma fuente de verdad (antes el tab bar
quedaba blanco en oscuro). (2) **Mapa sobrio:** base `light-v11`/`dark-v11` que elimina el **escudo de carretera
negro** ("LA") y el arcoíris de tráfico; capa de tráfico **propia y tenue** (paridad con la web) + ruta dominante
(casing + trazo brillante); el mapa entra en **modo noche** real. (3) **Banner tipo Waze:** recuadro oscuro de alto
contraste con la **maniobra real en español** (flecha + "En 50 m" + "Gire a la izquierda hacia Calle Corpac."),
alimentada por `packages/rutas` (`steps=true` + `language=es` → `RoutePaso[]`); fallback a la fase si no hay ruta
real. (4) **Ficha del chofer:** "Cobro estimado" estable (origen→destino). (5) **Copy sobrio:** "Activo",
"Con tráfico actual" (sin "en vivo"/"en línea"). Verificación: `typecheck`+`lint` driver/web/rutas ✅, `turbo test`
25 tareas (web 51, rutas 6) ✅, `expo export android` EXIT 0, y **capturas reales** de oscuro/claro, banner de
maniobra y tarifa. **Pendiente de deploy:** las maniobras requieren el backend nuevo; en Railway aparecen tras
redeploy (lo demás —tema/mapa/tarifa/copy— es client-side y ya funciona).

**F10 — Chofer: flujo mapa general → modo conductor (2026-06-09):** se refinó la navegación activa para que no
arranque siempre inclinada. Ahora el estado inicial del viaje muestra **ruta completa** (recojo→destino) con cámara
cenital y CTA humano **"Iniciar ruta"**; al pasar a `en_camino` o `a_bordo` entra en **modo conductor** con cámara
inclinada, heading course-up, banner de maniobra grande, puck propio tipo flecha, botón de **ubicarme** y botón de
**ruta completa**. El mapa conserva modo noche/día, tráfico tenue y ruta verde dominante; se repuso logo/atribución
de Mapbox en posición baja-discreta para no violar TOS. Verificado en emulador real con Metro/dev-client:
`artifacts/driver-live/21-driver-nav-arrow-puck.png`, `22-driver-route-overview-button.png`,
`25-driver-recenter-button-retap.png`. Validación: driver `typecheck`, `lint` y `expo export --platform android`
verdes.

**F10.1 — Chofer: ruta desde GPS exacto + UI de conducción limpia (2026-06-09):** se corrigió un bug de sincronía
del hook de rutas: el `useEffect` dependía del objeto crudo de GPS y cancelaba el request de Mapbox si llegaba un
tick nuevo durante el cálculo; con el mismo tramo redondeado, el throttle podía impedir el recálculo siguiente y dejar
una línea vieja separada del puck. Ahora el tramo usa una clave estable (`legKeyValue`), limpia geometría vieja al
cambiar de tramo y sólo conserva curvas del mismo tramo. Además, en modo conductor la ruta real se dibuja desde la
coordenada GPS exacta del chofer antes de unirse a la geometría Mapbox, la cámara queda centrada abajo con heading
derivado de ruta si el GPS no trae rumbo útil, el panel inferior se reduce a destino/ETA/distancia/acción y no muestra
datos de pasajero/cobro, y el fallo de broadcast Realtime de ubicación degrada en silencio porque la navegación local
depende del GPS, no del canal. Captura final de control:
`artifacts/driver-live/29-driver-first-person-route-ahead.png`. Validación: driver `typecheck`, `lint`,
`expo export --platform android` verdes y smoke directo de `/api/rutas/calcular` con `fuente=mapbox`, 724 puntos.

**F11 — Chofer: primera persona real + historial + coherencia unidad (2026-06-09):** auditoría y mejora del
modo conductor más el flujo del chofer en general. (1) **Cámara frontal course-up:** el rumbo ya no se deriva de un
único vértice (que ladeaba el mapa en un giro cercano) sino del **rumbo promediado de la vía ~140 m por delante**
(`headingAlongRoute`), de modo que la calzada recede recta hacia arriba (frontal tipo Waze). Pitch 64→**58** (menos
inclinación extrema), zoom 17.1→**16.6** (algo más de vía a la vista) y `paddingTop` 280→**360** para fijar el puck
en el **centro-inferior** dejando toda la ruta por delante. (2) **Puck = flecha de navegación clásica:** disco
esmeralda con borde blanco y **triángulo blanco** que en course-up apunta siempre adelante (reemplaza el icono
"navigate"); halo suave para lectura al volante. (3) **Chevrons de ruta más resaltantes:** `▶`→**`▲` lleno**, más
grande (18→30 px) y con halo grueso, rotado al sentido de marcha pero de cara a la cámara — mismo lenguaje que se
reusará en el mapa del pasajero. (4) **Historial de viajes:** nueva pestaña **"Viajes"** (`app/(auth)/historial.tsx`)
que separa **EN CURSO** (viaje activo, destacado y accionable) de **HISTORIAL** (cerrados: Terminado/Cancelado, con
ruta, fecha y unidad). Backend mínimo de solo lectura: `GET /api/conductor/viajes`
(`findHistorialForConductor` + `serializeConductorViajeResumen`) que clasifica activo vs cerrado. (5) **Coherencia
conductor↔unidad:** la unidad vive en `conductores.vehiculo_id` (la asignación del `/admin` la actualiza), así que el
endpoint ya devuelve la **unidad actual** fresca; lo único rancio era el snapshot de la sesión (login). El home ahora
prioriza la **unidad del viaje vigente** (`activeAssignment.unidad`) sobre la predefinida, se refresca ante cada
broadcast y al re-enfocar la pantalla, y muestra el chip **"Reasignada"** cuando difiere de la del login. Además
`findActiveAsignacionForConductor` dejó de devolver reservas **cerradas** (finalizada/por_liquidar/cancelada): el
home solo dice "tienes un viaje" si es realmente activo, y los terminados quedan en el historial. **Verificado en
emulador real (Metro/dev-client → backend local):** historial activo/cerrado
(`artifacts/driver-live/31-historial.png`), home con "Unidad del viaje" (`30-home-localhost.png`), modo conductor con
banner de maniobra real en español + puck + chevrons (`33-drive-frontal-puck.png`, `33b-map-crop.png`) y overview con
cobro S/ (`ov`). Smoke directo: `/api/conductor/viajes` 1 activo + 3 cerrados, `/api/rutas/calcular` `fuente=mapbox`
328 vértices + 12 pasos ("Gire a la derecha hacia Circuito de Playas").

> **Pendientes de la app del pasajero (registro extendido, se harán después — la sesión se centró en el chofer):**
> - **Espejo de la ruta del conductor en tiempo real:** mostrar al pasajero en `/p/[token]` la **misma ruta y avance**
>   que ve el chofer (la posición del conductor ya viaja por broadcast Realtime `reserva-<id>`; falta pintar la
>   polilínea viva y el puck del conductor en el mapa del pasajero en vez de solo el marcador estático).
> - **Reuso del lenguaje visual del conductor:** llevar el **mismo puck (triángulo)** y los **chevrons `▲`** al mapa
>   del pasajero para coherencia (hoy el pasajero usa marcadores simples).
> - **Fase de aproximación al pasajero:** confirmar que el pasajero vea, antes del recojo, el trazo **GPS del
>   conductor → punto de encuentro**, y tras "a bordo", el trazo **GPS → destino** (paridad con el chofer).
> - **Nota de entorno (GPS emulador):** el trazo "desde mi GPS exacto" depende de que `watchPositionAsync` reciba la
>   ubicación; en emulador requiere proveedor **network** habilitado además de GPS (`settings put secure
>   location_providers_allowed +network`) y `Accuracy.Balanced` puede no tomar `adb emu geo fix`. La lógica de
>   trazado desde el GPS es correcta (verificada por cálculo directo de ruta); en dispositivo real con GPS fluye.

**F5 — WhatsApp copiloto premium (2026-06-10):** el inicio del flujo ahora se entiende y se cierra DENTRO del chat.
(1) **Confirmación en el chat:** al confirmar, el cliente recibe en la conversación la tarjeta "Reserva confirmada"
con su **reserva TG-…**, el punto de encuentro y su **pase de abordaje (QR real firmado, el mismo que valida el
counter)**. (2) **Revelado progresivo del enlace:** el botón **"Seguir mi taxi en vivo"** (`/p/[token]`) ya NO llega
junto al QR: el chat hace polling (`obtenerSeguimientoReserva`, auditoría `voucher_qr_consumido`) y el copiloto
entrega el enlace **recién cuando el counter valida el pase** — trazabilidad coherente de punta a punta.
(3) **Modo copiloto (switch en el panel):** apagado por defecto (modo seguro: el operador revisa y confirma).
Encendido, el copiloto **pregunta los datos faltantes en el chat, envía el resumen y espera el "Sí" DEL CLIENTE**;
con esa confirmación crea la reserva y **asigna conductor/unidad solo** reutilizando la sugerencia heurística y la
ruta auditada del despacho (`asignarConductorAutomatico` → `aceptarSugerenciaAsignacion`, fuente
`copiloto_automatico_confirmado_por_cliente`, broadcast al chofer incluido) y lo anuncia: "Tu conductor será Ana
Salazar, unidad EJP-615". El operador nunca hace clic en modo auto; el panel muestra el estado (resumen enviado /
esperando al cliente / enviada al cliente con checklist de QR·enlace·conductor). (4) **Panel "Reserva sugerida"**
con estado humano líder (Faltan datos / Listo para confirmar / Enviada al cliente) y % de lectura discreto; botón
"Pedir estos datos al cliente" en modo manual. (5) Guards con `useRef` contra el doble-efecto de StrictMode
(resumen/enlace duplicados). **Verificado:** e2e `wa-sim.spec.ts` realineado al flujo completo (confirmar → QR sin
enlace → counter valida vía `/api/voucher/[id]/verify` → polling entrega el enlace → "Abrir en despacho") ✓; modo
auto probado en vivo dos veces (1 solo resumen; conductor distinto por rotación de cola: Ana Salazar/Pedro Morales)
con capturas `artifacts/wa-sim/auto-*.png`; `asignacion-sugerencia.spec.ts` realineado a la copy nueva.

**F12 — Conductor pulido + landing premium (2026-06-10):** (1) **Driver:** el aviso de éxito persistente se
eliminó (el toast confirma; ya no aparece "Servicio terminado confirmado." colgado al iniciar el siguiente viaje) y
cualquier mensaje muere al cambiar de estado; home muestra **"Empezar"** cuando el viaje recién llega y **"Abrir
viaje"** solo si ya está en curso, y un viaje cerrado **desaparece** del inicio (verdad del servidor; el broadcast
solo refresca). **Puck por modo:** triángulo de navegación SOLO conduciendo; en vista mapa un punto elegante
(anillo blanco + esmeralda). **Ruta sin flechas:** trazo degradado (lineGradient + lineMetrics) con glow; los
chevrons se retiraron por toscos. **Cámara 1ª persona:** zoom 17.2 cercano, rumbo medido en la calle inmediata
(~80 m desde el puck, que ahora recorta el tramo ya recorrido) + **brújula del teléfono** (`watchHeadingAsync`)
como respaldo cuando no hay rumbo GPS; overview **panorámico** (bounds = inicio + fin + ruta). Verificado con
**simulación de manejo real** (61 fixes GPS por Av. del Ejército→Pardo): la vía recede frontal y el mapa gira con
las maniobras (`artifacts/driver-live/45-47, 51-52`). "Código"→**"Reserva"** en driver/pasajero/wa-sim/landing.
LogBox silencia solo el error transitorio de tiles del emulador. (2) **Landing premium (cult-ui vía shadcn MCP):**
hero con `GradientHeading` plateado gigante, **mockup de teléfono con el chat real del flujo** (mensaje →
confirmación → "Seguir mi taxi en vivo" → pase QR) flotando con chip "Llega en 12 min", trust row, pasos en
`MinimalCard`, panel "en vivo" con ruta SVG degradada del mismo lenguaje visual del producto, animaciones CSS puras
(sin librerías de motion; respetan `prefers-reduced-motion`). Componentes instalados: `gradient-heading`,
`minimal-card`, `neumorph-eyebrow` (`@cult-ui` registrado en `apps/web/components.json`). Gotcha documentado:
`GradientHeading` con `asChild` deja el texto fuera del span con `bg-clip-text` → texto invisible; usar children
directos. El e2e del landing (heading + CTA) se conserva. Capturas: `artifacts/landing/hero-*.png`,
`mobile-full.png`. **Pendiente conocido:** la suite e2e corre **en dos fases** (counter-qr consume el voucher que
voucher-flow asume virgen): 7/8 + re-seed + 1/1, igual que en S9.

**F8 — Tema coherente con el sistema + cero tecnicismos (2026-06-07):** segundo pase de coherencia tras el F6/F3.7.
(1) **Tema = sistema + override discreto, nunca pantallas mezcladas.** Web ya seguía `prefers-color-scheme`; se
añadió el cambio claro/oscuro discreto en `BrandHeader` (cubre admin/counter) y se migraron las superficies que
quedaban en claro forzado (admin/*, bienestar, audit-table, login, ui/input·label) a tokens semánticos
(`bg-surface`, `text-foreground`, `border-border`, con variante `dark:text-product-200` en títulos). El **driver**
pasó de "dark-first hardcodeado" (con `perfil`/`incidencia` en claro = mezcla) a **tokens semánticos vía
`global.css` + `darkMode:'class'`**: una sola definición controla ambos modos, así que es imposible que una pantalla
quede clara y otra oscura. Sigue al sistema por defecto y el conductor fuerza modo en **Perfil → Apariencia**
(`ThemeProvider` + `expo-secure-store`); la `StatusBar` y la tab bar se adaptan; el mapa del conductor usa estilo
**día/noche** según el tema (igual que el pasajero). (2) **Sin JSON ni jerga visible:** se eliminó el `JSON.stringify`
del simulador de WhatsApp y el `payload` crudo del detalle de reserva; la auditoría muestra un **resumen legible**
("Nuevo estado: en camino · Origen: sugerencia copiloto") en vez de JSON. wa-sim: "WA Sim/Sprint 4"→"WhatsApp/Reservas",
"Extracción"→"Lectura del mensaje". (3) **Login del conductor limpio:** email usa el teclado del sistema; el PIN abre
el teclado numérico propio **solo al tocarlo** y nunca coexisten (se descarta el del sistema) → sin redundancia ni
pantalla corrompida. (4) **Solape del toggle:** medido con Playwright (móvil/desktop/landing) → **0 px²**.
Verificación: `typecheck`+`lint` web/driver ✅, `turbo test` 51 ✅, `expo export android` EXIT 0, `pnpm e2e` **8/8**
en dos fases (specs `wa-sim`/`admin-asignacion`/`asignacion-sugerencia` realineados a la copy humanizada).

**F6 — Despacho simplificado, primer pase (2026-06-07):** `/admin`, detalle de reserva, actividad, resumen y
bienestar se humanizaron para despacho real: se retiraron rutas internas visibles (`/admin`), "Realtime/Polling",
"Algoritmo", "score", "cola" como dato principal, JSON/payload abierto y etiquetas densas. La recomendación de
asignación ahora se presenta como **Conductor sugerido**; los criterios internos viven en **Ver motivos**. La
actividad deja el detalle técnico colapsado; Bienestar habla de **casos por resolver** y no de incidencias. En
paralelo, pasajero recibió controles de mapa separados por modo normal/fullscreen, mapa claro/oscuro, tráfico
atenuado y acciones ordenadas (mensaje + llamada + valoración por 5 estrellas). Driver conserva navegación
full-screen y copy humana ("Conexión", "En vivo con tráfico", sin "Push fallido").

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

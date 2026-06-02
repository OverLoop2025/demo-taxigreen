# Diseño UI/UX Detallado — Demo Taxi Green

> Documento de maquetación exhaustiva paso a paso, pantalla por pantalla, botón por botón, color por color. Pensado para ser llevado a Figma y luego a código (Next.js + Tailwind + shadcn/ui) sin ambigüedades.
>
> **Estado epistémico**: `Propuesta de diseño` derivada de `vision_final_perfecta.md` (esencia, principios y capa de Bienestar) + `vision_final_taxigreen_refinada.md` (las 5 caras del copiloto) + `PLAN_SOFTWARE_DEMO.md` (alcance técnico). Es una hipótesis de diseño, no una decisión cerrada con el cliente. Cada pantalla incluye notas de qué se valida.
>
> **Nota post-Figma 2026-05-30**: este documento es referencia visual histórica y queda subordinado al glosario `08_SOFTWARE_PRODUCTO/00_INSTRUCCIONES_SAGRADAS/GLOSARIO_FLUJOS_TAXIGREEN.md`. Donde aparezcan etiquetas antiguas como "Salida del aeropuerto" o "Llegada al aeropuerto", usar la semántica actual: **Recojo en aeropuerto = Aeropuerto Jorge Chávez → ciudad** y **Traslado hacia aeropuerto = ciudad/hotel/casa/oficina → Jorge Chávez**. El flujo protagonista actual es recojo en aeropuerto hacia Av. Pardo 123, Miraflores; hotel/concierge es solicitante, no origen físico.
>
> **Convención**: medidas en `px` salvo cuando se indique `rem`; colores en hex; tipografía Inter (sistema) + JetBrains Mono (tabular/monos). Todo el sistema usa el grid de 8 px de Tailwind.

---

## Índice

0. Filosofía de diseño
1. Sistema de diseño (tokens)
2. Iconografía y assets
3. Componentes base (todos los estados)
4. Patrones de UI y layouts
5. Accesibilidad
6. Voz, tono y microcopy
7. Cara 1 — PWA Pasajero
8. Cara 2 — PWA Conductor
9. Cara 3 — Web Despachador
10. Cara 4 — Web Supervisor de counter
11. Cara 5 — Portal Empresa cliente
12. Simulador WhatsApp (módulo demo)
13. Capa transversal — Bienestar / Incidencias (todas las vistas)
14. Flujos completos paso a paso
15. Estados vacíos, error, loading, offline
16. Notas para Figma y handoff

---

## 0. Filosofía de diseño

**Tres palabras**: serio, cálido, transparente.

- **Serio** porque el cliente (Taxi Green) opera con corporativos en el aeropuerto. La estética no puede parecer "startup juvenil"; debe transmitir confiabilidad de empresa formal con 25 años de operación.
- **Cálido** porque la promesa del producto es bienestar: el pasajero que pierde un objeto, el conductor cansado a las 3 a. m., el operador que ya está harto del Excel. Cada pantalla debe sentirse humana, no industrial.
- **Transparente** porque el diferenciador es la trazabilidad. Si algo ocurre, el sistema lo dice de frente: "esto pasó, esto estamos haciendo, esto sigue". Nada de animaciones de humo que oculten estados.

**Principios visuales** (heredados de `vision_final_perfecta.md` §15):

1. Una sola acción primaria por pantalla. Si hay dos, el diseño falló.
2. Lo importante es grande. Lo accesorio es chico. No hay grises medios decorativos.
3. Color = significado, no estética. Verde Taxi Green = identidad y éxito. Ámbar = atención. Rojo = problema real, no advertencia menor. Azul = información neutra. Nada de gradientes decorativos.
4. Cero scroll oculto. Si hay más contenido, debe haber un indicador visible (chevron, fade, contador).
5. Cero modal anidado. Si un flujo necesita más de un modal, conviértelo en pantalla completa o drawer lateral.
6. Cero spinner mudo. Toda espera muestra qué se está haciendo ("Buscando conductor cercano…") y un tiempo estimado cuando exista.
7. Cero formulario largo de un solo respiro. Si tiene más de 5 campos, se divide en pasos con barra de progreso visible.
8. Cero negación sin alternativa. Si no se puede hacer algo, la pantalla ofrece qué sí se puede hacer.
9. Mobile-first real: las dos caras de pasajero y conductor se diseñan primero a 375 px (iPhone SE), luego se escalan. Las caras de despacho/supervisor/empresa se diseñan a 1280 px y luego se adaptan.
10. Animaciones funcionales, no decorativas. Si quitas la animación y la información sigue clara, la animación está bien. Si quitas la animación y deja de entenderse, la animación está mal.

---

## 1. Sistema de diseño (tokens)

### 1.1 Paleta de color

#### Marca

| Token | Hex | Uso |
|---|---|---|
| `brand/900` | `#0B3B1F` | Texto sobre fondos claros muy enfatizado, encabezados hero |
| `brand/800` | `#0F5530` | Pressed state de botón primario, links visitados |
| `brand/700` | `#137A43` | Botón primario por defecto, ícono activo, focus ring de marca |
| `brand/600` | `#1A9756` | Hover de botón primario, acentos importantes |
| `brand/500` | `#22B96B` | Indicador de estado "asignado/en ruta", éxito light |
| `brand/400` | `#5CCE92` | Hover de chip, fondos sutiles destacados |
| `brand/300` | `#8FDFB5` | Bordes verdes suaves, fondo de avatar conductor |
| `brand/200` | `#C2EFD6` | Fondo de toast de éxito, fondo de badge verde |
| `brand/100` | `#E4F8EE` | Fondo de sección destacada (banner informativo verde) |
| `brand/50` | `#F4FCF8` | Fondo de página de feedback positivo |

> **Nota epistémica**: el verde elegido se inspira en la identidad histórica de Taxi Green (`Inferencia`, debe validarse con el cliente mostrando ejemplos). Es un verde algo más oscuro y saturado que el verde lima clásico, para alejarse de estética de fast-food y acercarse a estética de empresa formal.

#### Neutros

| Token | Hex | Uso |
|---|---|---|
| `gray/950` | `#0A0F0C` | Texto principal sobre blanco |
| `gray/900` | `#111815` | Texto principal alternativo (un punto menos contraste) |
| `gray/800` | `#1F2A24` | Encabezados secundarios |
| `gray/700` | `#384842` | Texto de cuerpo principal |
| `gray/600` | `#56685F` | Texto secundario, labels |
| `gray/500` | `#7A8C82` | Placeholder, ayudas, ícono inactivo |
| `gray/400` | `#A0AFA6` | Bordes destacados, iconos deshabilitados |
| `gray/300` | `#C2CDC6` | Bordes normales |
| `gray/200` | `#DDE4E0` | Divisores, bordes sutiles, fondo de skeleton |
| `gray/150` | `#E8EDEA` | Fondo de input |
| `gray/100` | `#F1F4F2` | Fondo de tarjeta secundaria, hover de fila de tabla |
| `gray/50` | `#F7F9F8` | Fondo de página general |
| `white` | `#FFFFFF` | Fondo de tarjeta principal, fondo de modal |

#### Semánticos

| Token | Hex | Uso |
|---|---|---|
| `success/700` | `#0F7A3A` | Texto sobre fondo success/200 |
| `success/500` | `#16A34A` | Ícono check de éxito, borde de toast success |
| `success/200` | `#BBF7D0` | Fondo de banner success |
| `success/50` | `#ECFDF3` | Fondo de toast success |
| `warning/700` | `#9A6700` | Texto sobre fondo warning |
| `warning/500` | `#D97706` | Ícono y borde warning |
| `warning/200` | `#FED7AA` | Fondo de chip warning |
| `warning/50` | `#FFFBEB` | Fondo de banner warning |
| `danger/700` | `#B42318` | Texto sobre fondo danger |
| `danger/500` | `#E0341C` | Ícono error, botón destructivo, borde de error |
| `danger/200` | `#FECDCA` | Fondo de chip danger |
| `danger/50` | `#FEF3F2` | Fondo de banner danger |
| `info/700` | `#1849A9` | Texto info |
| `info/500` | `#2563EB` | Ícono info, link |
| `info/200` | `#BFDBFE` | Chip info |
| `info/50` | `#EFF6FF` | Banner info |

#### Acentos Bienestar (capa transversal)

La capa de Bienestar usa un sub-acento color púrpura suave para distinguirla visualmente sin gritar. La intención es que cuando aparezca un componente de Bienestar (un banner, un botón "Reportar"), el usuario perciba instintivamente "esto es soporte/cuidado", no urgencia agresiva.

| Token | Hex | Uso |
|---|---|---|
| `care/700` | `#5B21B6` | Texto enfatizado de Bienestar |
| `care/500` | `#7C3AED` | Ícono de Bienestar, botón "Reportar" en estados normales |
| `care/300` | `#C4B5FD` | Borde de tarjeta de incidencia |
| `care/100` | `#EDE9FE` | Fondo de tarjeta de incidencia |
| `care/50` | `#F5F3FF` | Fondo de banner Bienestar |

> **Cuándo usar `care/*` vs `danger/*`**: incidencia abierta (objeto perdido, queja menor) usa `care`. Incidencia con riesgo (sospecha de seguridad, escalada urgente) usa `danger`. La transición de color es parte del lenguaje: el usuario aprende que si una tarjeta cambia de púrpura a rojo, algo se está tomando con más severidad.

#### Estados específicos de viaje (mapa)

| Token | Hex | Uso |
|---|---|---|
| `trip/pending` | `#F59E0B` | Punto en mapa, reserva pendiente de asignar |
| `trip/assigned` | `#22B96B` | Conductor asignado, en camino al pasajero |
| `trip/onboard` | `#1A9756` | Pasajero a bordo, viaje en curso |
| `trip/completed` | `#0F5530` | Viaje completado (histórico en mapa) |
| `trip/canceled` | `#E0341C` | Viaje cancelado |
| `trip/incident` | `#7C3AED` | Viaje con incidencia abierta |

### 1.2 Tipografía

**Familia principal**: `Inter` (variable). Pesos cargados: 400, 500, 600, 700, 800. Variable axis: `slnt 0..−10` para énfasis ocasional.
**Familia monoespaciada**: `JetBrains Mono` 400, 500, 700 para datos tabulares (placas, IDs de reserva, valores monetarios alineados).
**Numerales**: `font-feature-settings: "tnum" 1, "lnum" 1` en cualquier contexto numérico (precios, conteos, horas).

#### Escala tipográfica

| Token | Tamaño / Line-height | Peso | Uso |
|---|---|---|---|
| `display/xl` | 56 / 64 | 800 | Hero de landing/onboarding |
| `display/lg` | 44 / 52 | 800 | Encabezado de paso final ("¡Listo!") |
| `display/md` | 36 / 44 | 700 | Encabezado de pantalla principal |
| `display/sm` | 28 / 36 | 700 | Encabezado de modal grande |
| `heading/xl` | 24 / 32 | 700 | Título de tarjeta importante |
| `heading/lg` | 20 / 28 | 600 | Título de sección |
| `heading/md` | 18 / 26 | 600 | Título de tarjeta normal |
| `heading/sm` | 16 / 24 | 600 | Subtítulo o tarjeta compacta |
| `body/lg` | 17 / 26 | 400 | Cuerpo de lectura larga (mensajes del copiloto) |
| `body/md` | 15 / 22 | 400 | Cuerpo por defecto |
| `body/sm` | 13 / 20 | 400 | Texto secundario, ayudas |
| `body/xs` | 11 / 16 | 500 | Etiquetas, captions, microcopy |
| `mono/md` | 15 / 22 | 500 | Placa, ID, monto en tabla |
| `mono/sm` | 13 / 20 | 500 | Timestamp |
| `mono/xs` | 11 / 16 | 500 | Códigos cortos |
| `button/lg` | 16 / 24 | 600 | CTA primario móvil |
| `button/md` | 14 / 20 | 600 | Botón por defecto |
| `button/sm` | 13 / 18 | 600 | Botón compacto / chip |

**Tracking (letter-spacing)**:
- `display/*`: −1%
- `heading/*`: −0.5%
- `body/*`: 0%
- `button/*`: 0.5%
- `mono/*`: 0%

### 1.3 Espaciado (grid de 4 px, alineado a Tailwind)

| Token | px | Uso |
|---|---|---|
| `space/0.5` | 2 | Borde hairline interno |
| `space/1` | 4 | Separación entre ícono y texto pequeño |
| `space/2` | 8 | Separación entre elementos relacionados |
| `space/3` | 12 | Padding interno de chip |
| `space/4` | 16 | Padding interno de tarjeta compacta |
| `space/5` | 20 | Separación entre tarjetas en lista |
| `space/6` | 24 | Padding interno de tarjeta principal |
| `space/8` | 32 | Margen entre secciones en página |
| `space/10` | 40 | Margen vertical de hero |
| `space/12` | 48 | Margen entre bloques mayores en desktop |
| `space/16` | 64 | Padding superior de página en desktop |
| `space/20` | 80 | Espaciado de respiración hero |
| `space/24` | 96 | Padding extra para footers landing |

### 1.4 Radios (border-radius)

| Token | px | Uso |
|---|---|---|
| `radius/none` | 0 | Líneas divisorias, tabla densa |
| `radius/xs` | 4 | Chip pequeño, badge |
| `radius/sm` | 8 | Input, botón compacto, tag |
| `radius/md` | 12 | Botón estándar, tarjeta secundaria |
| `radius/lg` | 16 | Tarjeta principal, modal en móvil |
| `radius/xl` | 24 | Tarjeta hero, bottom sheet móvil |
| `radius/2xl` | 32 | Modal grande, panel lateral |
| `radius/full` | 9999 | Avatar, botón circular flotante (FAB) |

### 1.5 Sombras

| Token | Valor CSS | Uso |
|---|---|---|
| `shadow/xs` | `0 1px 2px rgba(15,30,20,0.05)` | Borde activo sutil de input |
| `shadow/sm` | `0 1px 3px rgba(15,30,20,0.08), 0 1px 2px rgba(15,30,20,0.06)` | Tarjeta en reposo |
| `shadow/md` | `0 4px 8px rgba(15,30,20,0.08), 0 2px 4px rgba(15,30,20,0.06)` | Tarjeta hover, dropdown |
| `shadow/lg` | `0 12px 24px rgba(15,30,20,0.10), 0 4px 8px rgba(15,30,20,0.06)` | Modal, popover importante |
| `shadow/xl` | `0 24px 48px rgba(15,30,20,0.14), 0 8px 16px rgba(15,30,20,0.08)` | Bottom sheet elevado, drawer |
| `shadow/focus/brand` | `0 0 0 4px rgba(34,185,107,0.25)` | Anillo de foco verde marca |
| `shadow/focus/danger` | `0 0 0 4px rgba(224,52,28,0.25)` | Anillo de foco rojo (botón destructivo enfocado) |
| `shadow/inset` | `inset 0 1px 2px rgba(15,30,20,0.06)` | Input enfocado |

### 1.6 Motion / Animaciones

Todas las animaciones obedecen a este principio: **150–250 ms con `ease-out` para entrar, 150 ms con `ease-in` para salir, 400–600 ms con `cubic-bezier(0.22, 1, 0.36, 1)` para movimientos significativos**.

| Token | Curva / Duración | Uso |
|---|---|---|
| `motion/fast-in` | `cubic-bezier(0, 0, 0.2, 1)` 150 ms | Tooltip, hover suave |
| `motion/fast-out` | `cubic-bezier(0.4, 0, 1, 1)` 100 ms | Cierre de hover |
| `motion/standard` | `cubic-bezier(0.22, 1, 0.36, 1)` 250 ms | Apertura de drawer, modal |
| `motion/expressive` | `cubic-bezier(0.34, 1.56, 0.64, 1)` 450 ms | Confirmación de éxito, check animado |
| `motion/calm` | `cubic-bezier(0.4, 0, 0.2, 1)` 500 ms | Aparición de contenido del copiloto (un beat extra para que se "respire") |

**Reducción de movimiento**: si el sistema operativo tiene `prefers-reduced-motion: reduce`, todas las animaciones se reducen a fade simple de 150 ms y se eliminan rebotes/elásticos. Sin excepciones.

### 1.7 Capas (z-index)

| Token | Valor | Uso |
|---|---|---|
| `z/base` | 0 | Contenido normal |
| `z/raised` | 10 | Tarjeta destacada, sticky header de sección |
| `z/dropdown` | 100 | Menús desplegables |
| `z/sticky` | 200 | Header global, bottom nav |
| `z/overlay` | 800 | Backdrop de modal |
| `z/modal` | 900 | Modal, drawer |
| `z/popover` | 1000 | Popover sobre modal |
| `z/toast` | 1100 | Toasts |
| `z/copilot` | 1200 | Copilot widget flotante |
| `z/critical` | 9999 | Alerta de seguridad bloqueante |

### 1.8 Breakpoints

| Token | min-width | Uso |
|---|---|---|
| `bp/xs` | 0 | iPhone SE 375 px de referencia |
| `bp/sm` | 480 | Móvil grande |
| `bp/md` | 768 | Tablet |
| `bp/lg` | 1024 | Desktop pequeño / iPad pro |
| `bp/xl` | 1280 | Desktop estándar (despacho) |
| `bp/2xl` | 1536 | Desktop grande |

---

## 2. Iconografía y assets

**Set principal**: `lucide-react` (24 px nominal, stroke 1.75). Razones:
1. Estilo line consistente, lejos de la estética cartoon.
2. Compatible con shadcn/ui.
3. Licencia ISC.

**Tamaños canónicos**: 16, 18, 20, 24, 28, 32, 40, 48.

**Color por contexto**:
- Sobre fondo claro neutro: `gray/700`
- Activo / acción primaria: `brand/700`
- Atención: `warning/500`
- Peligro: `danger/500`
- Bienestar: `care/500`
- Sobre fondo oscuro: `white` con opacidad 90%.

**Íconos clave por dominio**:
- Reserva → `CalendarClock`
- Conductor → `SteeringWheel` (custom SVG, no existe en lucide; alternativa `CircleUserRound` con overlay)
- Pasajero → `User`
- Vuelo → `Plane`
- Mapa / ruta → `MapPinned`, `Navigation2`, `Route`
- Tracking en vivo → `Radio`
- Voucher → `Ticket`
- Comprobante → `FileText`, `Receipt`
- Empresa cliente → `Building2`
- Copiloto → `Sparkles` + `MessageCircle` combinados (logo custom)
- Bienestar / incidencia → `LifeBuoy` (general), `Search` (objeto perdido), `ShieldCheck` (seguridad), `MessageSquareWarning` (queja)
- Notificación → `Bell`
- Despacho urgente → `Siren` (en rojo `danger/500`)

**Pictogramas custom (4 en total, vectoriales, paleta de marca)**:
1. Pictograma "auto verde con valija" para empty state de pasajero.
2. Pictograma "punto en mapa con halo" para tracking.
3. Pictograma "manos sosteniendo objeto" para Bienestar / objeto perdido.
4. Pictograma "constancia con sello" para confirmación de cierre de incidencia.

Estos 4 pictogramas se diseñan en Figma a 240 × 240 px, exportables a SVG, máximo 4 colores cada uno (verde marca + dos neutros + un acento).

**Logo Taxi Green**: provisional para demo. Tipografía `Inter 800` con kerning ajustado, hoja de palma estilizada como punto sobre la "i" de "Taxi". Versión horizontal (192 × 40), versión cuadrada (64 × 64), versión mono blanca, versión mono negra. **Validar con cliente antes de exportar a producción** (`Por validar`).

---

## 3. Componentes base — estados completos

### 3.1 Botones

Cinco variantes × cinco estados × tres tamaños.

#### Variantes

| Variante | Fondo reposo | Texto reposo | Borde | Uso |
|---|---|---|---|---|
| `primary` | `brand/700` | `white` | sin borde | Acción principal de la pantalla |
| `secondary` | `white` | `brand/700` | 1 px `brand/700` | Acción secundaria importante |
| `ghost` | `transparent` | `gray/800` | sin borde | Acción terciaria, dentro de tarjeta |
| `destructive` | `danger/500` | `white` | sin borde | Cancelar viaje, eliminar reserva |
| `care` | `care/500` | `white` | sin borde | Acción de Bienestar (no es destructiva ni neutra) |

#### Estados (idénticos para todas las variantes, valores específicos para `primary`)

| Estado | Cambio visual `primary` |
|---|---|
| Reposo | `brand/700` |
| Hover | `brand/600`, sombra `shadow/sm` |
| Pressed (active) | `brand/800`, traslada Y +1 px, sombra `shadow/xs` |
| Focus (teclado) | mismo color reposo + `shadow/focus/brand` |
| Loading | mismo color reposo, texto oculto, spinner 16 px centrado, ancho conservado |
| Disabled | `gray/200` fondo, `gray/500` texto, sin sombra, cursor `not-allowed` |

#### Tamaños

| Tamaño | Altura | Padding H | Tipografía | Ícono interno |
|---|---|---|---|---|
| `sm` | 32 px | 12 px | `button/sm` | 14 px |
| `md` | 40 px | 16 px | `button/md` | 16 px |
| `lg` | 48 px | 20 px | `button/lg` | 20 px |
| `xl` | 56 px | 24 px | `button/lg` 17/24 | 22 px |

> En móvil, el CTA principal usa siempre `xl` y se ancla al borde inferior con padding seguro (`env(safe-area-inset-bottom)` + 16 px). En desktop por defecto se usa `md`; en hero se usa `lg`.

#### Botones con ícono

- Ícono izquierdo + texto: separación 8 px.
- Texto + ícono derecho (más común para "Siguiente →"): separación 8 px.
- Solo ícono (icon-button): cuadrado, mismo alto que el botón estándar, ícono centrado. Requiere `aria-label` obligatorio.

#### Botón flotante (FAB)

- Tamaño 56 × 56 px, `radius/full`, `shadow/lg`.
- Posición móvil: bottom 24 px, right 16 px. En pantallas con bottom nav, se eleva a bottom 88 px.
- Solo se usa una vez por pantalla. En la PWA del pasajero, el FAB es el botón "Pedir taxi" en el home cuando hay scroll.

### 3.2 Inputs

#### Anatomía base

```
[Label encima]
[Ícono opcional] [Placeholder o valor] [Ícono derecho opcional / botón clear]
[Ayuda o error debajo]
```

Altura por defecto 48 px (toque cómodo). Padding horizontal 14 px. Radio `radius/sm` (8 px). Borde 1 px `gray/300`. Fondo `white`. Texto `gray/900` `body/md`. Placeholder `gray/500`.

#### Estados

| Estado | Borde | Fondo | Texto |
|---|---|---|---|
| Reposo | `gray/300` | `white` | `gray/900` (valor) / `gray/500` (placeholder) |
| Hover (cursor sobre, sin focus) | `gray/400` | `white` | — |
| Focus | `brand/700` 2 px + `shadow/focus/brand` | `white` | — |
| Lleno válido | `gray/300` | `white` | — |
| Error | `danger/500` 2 px | `white` | `danger/700` debajo con ícono `AlertCircle` 14 px |
| Disabled | `gray/200` | `gray/100` | `gray/500` |
| Read-only | `gray/200` | `gray/50` | `gray/700` |

Ayuda debajo en `body/sm` `gray/600`. Error reemplaza ayuda en `body/sm` `danger/700`. Contador de caracteres (cuando aplica) a la derecha en `body/xs` `gray/500`.

#### Variantes

- **Texto** (default).
- **Email** — teclado `email`, validación al `blur`.
- **Teléfono** — máscara `+51 9## ### ###`. Prefijo `+51` fijo no editable a la izquierda con divisor.
- **Numérico** — teclado numérico, alineación a la derecha cuando es monto.
- **Password** — botón "ojo" para revelar a la derecha, con `aria-pressed`.
- **PIN** (6 dígitos, conductor) — 6 cuadrados de 48 × 56 px, separación 8 px, autofocus que avanza al teclear; backspace retrocede; pegado completo.
- **Búsqueda** — ícono `Search` izquierdo, ícono `X` derecho cuando hay valor.
- **Direcciones** (autocomplete Mapbox) — al escribir, dropdown bajo el input con hasta 5 sugerencias; cada sugerencia tiene ícono `MapPin`, dirección principal en `body/md` y secundaria (distrito) en `body/sm gray/600`. Tecla flecha navega; Enter selecciona.

#### Textarea

Altura mínima 96 px, máxima 240 px, redimensión vertical permitida. Mismo borde y estados que input. Contador de caracteres siempre visible para campos de incidencia (máx 1000 caracteres).

### 3.3 Selects y combos

- **Select nativo en móvil** (usa el picker del SO) para velocidad y accesibilidad real.
- **Combobox custom en desktop** (búsqueda dentro): popover con `shadow/lg`, máximo 8 items visibles, scroll interno.
- Estado vacío del combobox: ilustración pequeña 64 px + texto `body/sm` "Sin resultados" + botón link "Borrar búsqueda".

### 3.4 Switches, checkboxes, radio

#### Switch

- Track 36 × 20 px, knob 16 × 16 px.
- Off: track `gray/300`, knob `white`.
- On: track `brand/700`, knob `white`.
- Focus: anillo `shadow/focus/brand`.
- Disabled: track `gray/200`, knob `gray/100`.
- Animación: 200 ms `motion/standard` desplazando el knob.

#### Checkbox

- 20 × 20 px, `radius/xs`, borde 1.5 px.
- Off: borde `gray/400`.
- On: fondo `brand/700`, check `white` ícono `Check` 14 px.
- Indeterminate: fondo `brand/700`, ícono `Minus` 14 px.
- Focus: anillo `shadow/focus/brand`.

#### Radio

- 20 × 20 px circular.
- Off: borde 1.5 px `gray/400`.
- On: borde 5 px `brand/700`, centro blanco visible.

### 3.5 Tarjetas

| Variante | Fondo | Borde | Sombra | Radio |
|---|---|---|---|---|
| `card/default` | `white` | 1 px `gray/200` | `shadow/sm` | `radius/lg` |
| `card/raised` | `white` | sin borde | `shadow/md` | `radius/lg` |
| `card/flat` | `gray/50` | 1 px `gray/200` | sin sombra | `radius/md` |
| `card/highlight` | `brand/50` | 1 px `brand/300` | sin sombra | `radius/lg` |
| `card/care` | `care/50` | 1 px `care/300` | sin sombra | `radius/lg` |
| `card/danger` | `danger/50` | 1 px `danger/200` | sin sombra | `radius/lg` |

Padding interno por defecto 24 px (`space/6`). Padding compacto 16 px (`space/4`).

Encabezado de tarjeta:
- Título `heading/md`.
- Subtítulo `body/sm` `gray/600`.
- Acción de la tarjeta a la derecha: icon-button o link `body/sm` `brand/700`.

Pie de tarjeta:
- Separador 1 px `gray/200` arriba.
- Layout: contenido a la izquierda, CTA a la derecha.

### 3.6 Listas

- Separador 1 px `gray/200` entre filas (no entre tarjetas).
- Altura mínima de fila: 64 px en móvil, 56 px en desktop.
- Estado hover desktop: fondo `gray/100`.
- Estado seleccionado: fondo `brand/50`, borde izquierdo 3 px `brand/700`.
- Estructura típica: `[Avatar/Ícono 40 px] [Bloque texto: título + subtítulo] [Meta a la derecha: hora o badge]`.

### 3.7 Modales y bottom sheets

#### Modal desktop

- Ancho 480 px (estrecho), 640 px (medio), 800 px (ancho).
- Backdrop `rgba(10,15,12,0.5)` con blur 4 px, cierre al hacer clic fuera salvo en modales de confirmación destructiva o seguridad.
- Animación de entrada: backdrop fade 150 ms, modal scale 0.96→1 + fade 250 ms `motion/standard`.
- Animación de salida: scale 1→0.96 + fade 150 ms `motion/fast-out`.
- Header: título `heading/lg` + botón cerrar (`X`, icon-button 32 × 32 a la derecha).
- Body padding 24 px.
- Footer: separador 1 px `gray/200` + alineación derecha. Botones de derecha a izquierda: primario, secundario, ghost.

#### Bottom sheet móvil

- Ancho 100% pantalla, sube desde abajo.
- Borde superior `radius/xl` (24 px).
- "Handle" gris (`gray/300`) de 36 × 4 px centrado arriba.
- Tres alturas: 40%, 70%, 95%. Se puede arrastrar entre ellas.
- Drag-down más allá del 40% cierra la sheet.

### 3.8 Toasts

- Posición: bottom-center móvil (sobre bottom nav), top-right desktop.
- Tamaño: ancho máximo 400 px, padding 16 px, radio `radius/md`.
- Estructura: `[Ícono 20 px] [Texto] [Acción opcional / Cerrar X]`.
- Duración por defecto 5 s; toasts de error 8 s; toasts con acción "Deshacer" 10 s.
- Variantes (fondo / borde izquierdo 4 px / ícono):
  - success → `success/50` / `success/500` / `CheckCircle`
  - warning → `warning/50` / `warning/500` / `AlertTriangle`
  - danger → `danger/50` / `danger/500` / `XCircle`
  - info → `info/50` / `info/500` / `Info`
  - care → `care/50` / `care/500` / `LifeBuoy`

### 3.9 Badges y chips

#### Badge (no interactivo, etiqueta)

- Altura 20 px, padding H 8 px, tipografía `body/xs`, radio `radius/xs`.
- Variantes:
  - neutral → `gray/100` / `gray/700`
  - brand → `brand/100` / `brand/800`
  - success → `success/50` / `success/700`
  - warning → `warning/50` / `warning/700`
  - danger → `danger/50` / `danger/700`
  - care → `care/100` / `care/700`

#### Chip (interactivo, filtro)

- Altura 32 px, padding H 12 px, radio `radius/full`, borde 1 px `gray/300`.
- Estado activo: fondo `brand/700`, texto `white`, sin borde.
- Hover sobre inactivo: fondo `gray/100`.

#### Estado de reserva (badge especializado)

| Estado | Etiqueta | Fondo | Texto | Ícono |
|---|---|---|---|---|
| Pendiente confirmación | "Por confirmar" | `warning/50` | `warning/700` | `Clock` |
| Confirmada | "Confirmada" | `brand/100` | `brand/800` | `CheckCircle2` |
| Conductor en camino | "Conductor llegando" | `brand/100` | `brand/800` | `Navigation2` |
| Conductor llegó | "Llegó al punto" | `brand/200` | `brand/900` | `MapPin` |
| En curso | "En viaje" | `brand/500` | `white` | `Radio` |
| Completada | "Completada" | `success/50` | `success/700` | `Check` |
| Cancelada | "Cancelada" | `gray/100` | `gray/700` | `X` |
| Incidencia abierta | "Con incidencia" | `care/100` | `care/700` | `LifeBuoy` |

### 3.10 Avatar

- Tamaños 24, 32, 40, 48, 56, 64, 80 px.
- Si hay foto: `radius/full`, object-fit cover.
- Si no hay foto: iniciales sobre fondo `brand/300` con texto `brand/900`.
- Indicador de estado (en avatar de conductor): punto 8 × 8 px en esquina inferior derecha, `success/500` (en línea), `gray/400` (offline), `warning/500` (pausa).

### 3.11 Tabla

- Cabecera fija al hacer scroll.
- Texto cabecera `body/xs` mayúsculas `gray/600` tracking 0.5%.
- Filas alto mínimo 56 px, padding vertical 12 px.
- Bordes solo horizontales 1 px `gray/200`.
- Hover de fila `gray/50`.
- Fila seleccionada `brand/50`.
- Densidad alternativa "compacta": filas 40 px (para tablas largas de despacho).
- Ordenable: ícono `ArrowUpDown` o `ArrowUp/ArrowDown` cuando activo.
- Sticky columna izquierda en tablas anchas (despacho).

### 3.12 Skeleton loader

- Fondo base `gray/200`, gradiente animado 1.5 s loop horizontal.
- Tres formas: rectángulo (texto), círculo (avatar), línea fina (separador).
- Se usa cuando la espera supera 300 ms y no se puede mostrar contenido parcial.

### 3.13 Empty state

- Pictograma 160 × 160 px centrado (uno de los 4 pictogramas custom o ícono lucide 48 px sobre círculo `brand/100`).
- Título `heading/md` centrado.
- Subtítulo `body/md` `gray/600`, máx 320 px de ancho centrado.
- CTA primario debajo cuando hay acción clara.

### 3.14 Progress

- **Barra lineal**: alto 6 px, radio 3 px, track `gray/200`, fill `brand/700`. Acompañada de % o texto a la derecha.
- **Barra de pasos** (wizard): círculos numerados 32 × 32 conectados por línea 2 px. Activo `brand/700` lleno; completado `brand/700` lleno con ícono `Check`; pendiente `gray/300` borde con número `gray/600`.
- **Spinner**: 16 / 24 / 32 px, rotación 1 s, color hereda.

### 3.15 Tooltip

- Fondo `gray/900`, texto `white` `body/xs`, padding 8 × 6 px, radio `radius/xs`.
- Apertura 400 ms tras hover; salida 0 ms.
- Flecha 6 px.
- En móvil: tap muestra 3 s y cierra solo.

### 3.16 Stepper (asistente multi-paso)

- En desktop: horizontal, alineado izquierda.
- En móvil: barra de progreso lineal con texto "Paso 2 de 4 · Datos del vuelo" arriba.

### 3.17 Mapa (componente)

- Estilo Mapbox custom "Taxi Green Light": base muy clara, calles `white`, agua `#D6E5EC`, edificios `#EBEFEC`, etiquetas `gray/700`.
- Estilo "Taxi Green Dark" para tracking nocturno del despacho: base `#0F1916`, calles `#1F2A24`, agua `#0B2734`, etiquetas `white`.
- Marcadores: chips redondos 32 × 32 con avatar/ícono. Conductor activo lleva un halo `brand/500` con animación pulso 2 s loop suave.
- Ruta dibujada con polyline 4 px `brand/700` con sombra exterior 6 px `brand/300` 0.3 opacidad.
- Controles: zoom +/− abajo derecha, locate-me arriba derecha.

---

## 4. Patrones de UI y layouts

### 4.1 Layout PWA Pasajero (móvil 375–480 px)

```
┌─────────────────────────────────────┐
│  [Logo TG]            [Bell]        │  ← Header 56 px, sticky, white
├─────────────────────────────────────┤
│                                     │
│  Contenido scrollable               │
│  padding 16 px lateral              │
│                                     │
├─────────────────────────────────────┤
│  [Inicio] [Reservas] [Ayuda] [Yo]   │  ← Bottom nav 64 px + safe area
└─────────────────────────────────────┘
```

- Header sticky con `shadow/xs` cuando hay scroll.
- Bottom nav con 4 items, ícono 24 px + label `body/xs`. Activo `brand/700`, inactivo `gray/500`.
- "Ayuda" abre directamente la capa Bienestar (objeto perdido, queja, contacto).

### 4.2 Layout PWA Conductor

Similar al de pasajero pero el bottom nav es de 3 items: `[Inicio] [Historial] [Yo]`. La pantalla principal tiene un estado dominante: "Libre" / "Asignado" / "En viaje" / "Pausa". El color del header cambia con el estado: blanco en libre, `brand/100` cuando asignado o en viaje (con borde inferior `brand/700` 2 px).

### 4.3 Layout Web Despachador (desktop 1280+ px)

```
┌─────────────────────────────────────────────────────────────┐
│ Logo │ Reservas  Mapa  Conductores  Reportes      Buscar 🔍 │  ← Top nav 64 px
├──────┼──────────────────────────────────────────────────────┤
│      │                                                       │
│ Side │  Workspace principal                                  │
│ nav  │                                                       │
│ 240px│                                                       │
│      │                                                       │
└──────┴──────────────────────────────────────────────────────┘
```

- Side nav fija con secciones colapsables. Activo: fondo `brand/50`, borde izquierdo 3 px `brand/700`, texto `brand/800`.
- Top nav con buscador global (placeholder "Buscar reserva, conductor, pasajero, vuelo…").
- Avatar del usuario arriba derecha con dropdown (perfil, configuración, salir).

### 4.4 Layout Counter aeropuerto (tablet 1024 px landscape, también soporta 768 px)

- Vista de "control de torre" minimalista: una sola pantalla, sin scroll vertical principal.
- Columna izquierda 40%: lista de vuelos próximos con conteo de pasajeros esperados.
- Columna derecha 60%: mapa con conductores cercanos y panel de asignación rápida.

### 4.5 Layout Portal Empresa cliente

- Similar al despachador pero más sobrio: paleta más neutra, side nav con 4 items (`Resumen, Viajes, Colaboradores, Facturación`), sin acciones de despacho.

### 4.6 Patrón de "tarjeta de viaje vivo"

Componente reutilizado en pasajero y despacho. Tres estados visuales bien marcados:

1. **Asignación** — fondo `brand/50`, encabezado "Asignando conductor", ícono pulsante.
2. **En camino al pasajero** — foto del conductor, placa, ETA grande tipográfica (`display/md` brand), línea sutil.
3. **En viaje** — fondo `white`, ETA al destino y velocidad promedio. Botones secundarios: "Compartir viaje", "Reportar algo".

### 4.7 Header global con barra de bienestar

Cuando hay una incidencia abierta del usuario, aparece una **barra superior persistente** debajo del header normal, color `care/100`, texto `care/700`, ícono `LifeBuoy`, mensaje breve ("Estamos atendiendo tu objeto perdido — ver detalle"). Clic lleva al detalle de incidencia. Si la incidencia es de seguridad, la barra es `danger/100` con texto `danger/700`.

---

## 5. Accesibilidad

- **Contraste**: mínimo WCAG AA (4.5:1 texto normal, 3:1 texto grande y elementos de UI). Combinaciones bandera verde:
  - `brand/700` sobre `white` → 4.7:1 ✓
  - `white` sobre `brand/700` → 4.7:1 ✓
  - `gray/600` sobre `white` → 5.0:1 ✓
  - `care/700` sobre `care/50` → ≥ 7:1 ✓
- **Focus visible siempre**. No se elimina `outline` salvo cuando se reemplaza por un anillo equivalente.
- **Tamaño táctil mínimo** 44 × 44 px. Botones móviles cumplen.
- **Etiquetas obligatorias**: cada input tiene `label` explícito o `aria-label`.
- **Anuncios para lector de pantalla**:
  - Cambios de estado de viaje → `aria-live="polite"` en una región oculta.
  - Apertura de modales → `role="dialog"`, `aria-labelledby`, foco devuelto al cerrar.
  - Toasts → `role="status"` (info/success) o `role="alert"` (warning/danger).
- **Navegación por teclado completa**: Tab, Shift+Tab, Enter, Esc, Flechas en listas. Skip-link "Saltar al contenido" en cada cara.
- **Idioma**: `html lang="es-PE"`. Para nombres propios en otro idioma, se usa `lang` específico.
- **Reduced motion**: respetado en todas las animaciones (ver §1.6).
- **Modo alto contraste**: tokens preparados (no se entrega un theme dark completo en demo, solo el mapa nocturno). Roadmap.

---

## 6. Voz, tono y microcopy

**Persona del producto**: como un colega senior que ya operó taxis durante años y ahora te ayuda con paciencia y precisión. Nunca paternalista, nunca cool-cool. Habla peruano neutro (no usa "vos", no usa modismos cerrados, no usa "ahorita" como muletilla excesiva).

**Reglas**:

- Frases cortas. Máximo 14 palabras por oración.
- Verbo en imperativo amable para botones: "Confirmar", "Reportar", "Asignar", "Reintentar". Nunca "Confirmar reserva ahora", se queda en "Confirmar".
- Errores explican qué pasó y qué hacer. Nunca "Algo salió mal".
- Vacíos invitan: "Aún no tienes reservas. Cuando agendes la primera, aparecerá aquí."
- Confirmaciones celebran lo justo: "Listo, tu viaje quedó agendado." No "¡¡¡Felicidades por tu reserva!!!".
- Para Bienestar, el tono es más cálido y humano: "Lamentamos que esto pase. Vamos a ayudarte." Pero no se cae en frases vacías. Siempre se ofrece próximo paso concreto.

**Glosario del producto (consistencia)**:
- **Reserva** (no "booking", no "viaje" cuando aún no empezó).
- **Viaje** (cuando ya inició).
- **Conductor** (no "chofer", aunque ambos son válidos en Perú, el documento de visión usa "conductor"; conservar consistencia).
- **Despacho** (no "operador" salvo cuando es claro).
- **Voucher** (es el término que usan los corporativos; mantener).
- **Comprobante** (cuando es boleta o factura SUNAT).
- **Empresa cliente** (no "cuenta" ni "tenant"; al usuario empresarial le hablamos como empresa).
- **Incidencia** (genérico). **Objeto perdido**, **queja**, **falla del servicio**, **incidente de seguridad** (específicos).

**Mensajes clave estandarizados**:

- Error de red: "No pudimos conectar. Vamos a reintentar en unos segundos."
- Sesión vencida: "Tu sesión expiró por seguridad. Vuelve a entrar."
- Acción exitosa de reserva: "Reserva creada. Te avisaremos cuando tengas conductor."
- Asignación de conductor lograda: "Tu conductor es Juan Pérez. Llega en aproximadamente 8 minutos."
- Conductor llega: "Tu conductor llegó al punto de encuentro."
- Inicio de viaje: "Empezó tu viaje. Compartimos seguimiento con [contacto] si lo activaste."
- Fin del viaje: "Llegaste. Te enviamos el comprobante a [correo]."
- Reporte de incidencia recibido: "Recibimos tu reporte. Un humano lo está revisando."
- Resolución de incidencia: "Resolvimos tu caso. ¿Te parece bien cómo lo cerramos?"

---

## 7. Cara 1 — PWA Pasajero

> **Premisa**: el pasajero entra desde un enlace QR (counter del aeropuerto), un link SMS/WhatsApp o un favorito guardado. **No se descarga de tienda**. Es PWA. La primera carga muestra prompt nativo "Añadir a inicio" tras la primera reserva exitosa.

### 7.1 Pantalla 1.A — Landing / entrada por enlace

**Cuándo aparece**: el pasajero abre el link por primera vez sin sesión activa.

**Layout** (móvil 375 × 812 px):

```
┌─────────────────────────────────────┐
│           [Logo Taxi Green]         │  ← Header centrado 80 px
├─────────────────────────────────────┤
│                                     │
│  [Pictograma "auto verde" 160 px]   │  ← 32 px de margen superior
│                                     │
│  Tu viaje al/del                    │  ← display/sm
│  aeropuerto, listo.                 │
│                                     │
│  Reserva en 30 segundos. Llegas     │  ← body/md gray/600
│  con un conductor verificado.       │
│                                     │
│  [Pedir taxi ahora       →]         │  ← Botón primary xl, full width
│                                     │
│  [Ya tengo una reserva]             │  ← Botón ghost md
│                                     │
│  Hace 25 años atendemos vuelos      │  ← body/sm gray/500
│  del Jorge Chávez. Conductores      │
│  verificados. Tarifa cerrada.       │
│                                     │
└─────────────────────────────────────┘
```

**Botones**:
- **"Pedir taxi ahora"** (`primary xl`, fondo `brand/700`, texto `white`, ancho 100% menos 32 px de márgenes, ícono `ArrowRight` 20 px a la derecha): lleva a **1.B Reserva — paso 1**.
- **"Ya tengo una reserva"** (`ghost md`, texto `brand/700`): lleva a **1.D Mis reservas** con prompt de login por código.

**Colores específicos**: fondo de pantalla `gray/50`, pictograma con paleta `brand/700` + `brand/300` + `gray/200`. Footer microcopy en `gray/500`.

**Microinteracciones**: al cargar, pictograma hace fade-in 250 ms + traslación Y −8 px → 0. Texto entra con stagger 60 ms entre títulos y subtítulo. El botón primary aparece al final con scale 0.96→1.

**Por validar**: ¿el pasajero corporativo accede con un código de empresa preconfigurado o como invitado anónimo? Se asume invitado anónimo en demo, pero la pantalla debe dejar espacio para un futuro botón "Tengo código de empresa".

### 7.2 Pantalla 1.B — Reserva paso 1: tipo de viaje

**Header**: botón `ArrowLeft` icon-button 40 × 40 a la izquierda; título "Nueva reserva" `heading/lg`; a la derecha texto `Paso 1 de 4` en `body/sm gray/600`.

**Body**:
```
¿Cómo quieres viajar?           ← heading/xl

[Tarjeta seleccionable A]
  ╔═════════════════════════════════╗
  ║  ✈  Salida del aeropuerto      ║  ← Ícono Plane 40 px brand/700
  ║  Te recogemos al llegar.        ║  ← body/sm gray/600
  ║  Necesitamos tu vuelo.          ║
  ╚═════════════════════════════════╝

[Tarjeta seleccionable B]
  ╔═════════════════════════════════╗
  ║  🧳  Llegada al aeropuerto     ║  ← Ícono Luggage 40 px brand/700
  ║  Te llevamos para que tomes     ║
  ║  tu vuelo a tiempo.             ║
  ╚═════════════════════════════════╝

[Tarjeta seleccionable C]
  ╔═════════════════════════════════╗
  ║  📍  Otro origen y destino     ║  ← Ícono MapPinned
  ║  Viaje fuera del aeropuerto.    ║
  ╚═════════════════════════════════╝
```

**Tarjeta seleccionable** (componente reutilizable):
- Altura mínima 96 px, padding 16 px, radio `radius/lg`.
- Reposo: borde 1 px `gray/200`, fondo `white`.
- Hover: borde `gray/400`, `shadow/sm`.
- Seleccionada: borde 2 px `brand/700`, fondo `brand/50`, ícono check 20 px arriba derecha en `brand/700`.
- Estructura: ícono 40 px a la izquierda, bloque texto (título `heading/sm`, subtítulo `body/sm gray/600`).
- Click selecciona y habilita el CTA inferior.

**CTA inferior**: barra sticky a 16 px del borde inferior con padding-bottom safe area.
- Botón `primary xl` "Continuar →" (deshabilitado mientras no haya selección).

**Por validar**: ¿qué porcentaje de reservas reales son "otro origen-destino"? Si es marginal, se puede ocultar esa opción detrás de un "Ver más opciones" para reducir cognitive load en la demo.

### 7.3 Pantalla 1.C — Reserva paso 2: datos del vuelo (si A o B)

**Si se eligió "Salida del aeropuerto" (recojo en el aero):**

```
Datos de tu vuelo               ← heading/xl

Aerolínea (opcional)
[ Input texto                 ]  ← autocomplete con top 12 aerolíneas

Número de vuelo
[ LP_____ ]                       ← input con máscara

Fecha y hora de llegada
[ 25/05/2026  03:45 a.m. ▼ ]     ← input date+time

[ ⓘ Si nos das el número, monitoreamos el vuelo y ajustamos el horario por ti. ]
                                  ← Banner info/50 padding 12, ícono Info, body/sm info/700

Punto de encuentro
[ Sala de llegadas - Sector A ▼ ] ← select con 4 opciones:
                                     Sala de llegadas - Sector A
                                     Sala de llegadas - Sector B
                                     Parqueo VIP
                                     Indicarle al conductor por chat

¿A dónde te llevamos?
[ Buscar dirección…            ]  ← input con autocomplete Mapbox

[Mapa preview 200 px con el destino marcado, una vez elegido]

Pasajeros
[−]  2  [+]                       ← stepper numérico

Equipaje
[ ] Solo carry-on
[x] Maletas grandes (1 o más)
[ ] Equipaje especial (taco, surf, mascota)

Notas para el conductor (opcional)
[ Textarea max 200 caracteres ]
```

**Si "Llegada al aeropuerto" (te llevamos al aero):**

```
¿Desde dónde te recogemos?
[ Buscar dirección… ]
[Mapa preview]

¿Cuándo?
[ Hoy ▼ ] [ 16:30 ▼ ]

¿Vuelo de salida?
[ Aerolínea ▼ ] [ Núm vuelo ]    ← opcional pero recomendado
Hora de despegue
[ ___:___ ]

[ ⓘ Calculamos hora ideal de recojo para que llegues con margen. ]

Pasajeros, equipaje, notas       ← mismo bloque que arriba
```

**Validaciones inline**:
- Número de vuelo: 2 letras + 3-4 dígitos (ej. LP2456). Si no coincide, ayuda en `warning/700`: "Revisa el formato. Suele ser dos letras y números (ej. LA2456)."
- Fecha pasada: error `danger/700` "La fecha ya pasó. Elige una futura."
- Más de 5 días en el futuro: ayuda informativa "Reservar con tanta anticipación está bien, pero podríamos pedirte una confirmación 24 h antes."

**CTA inferior**: "Continuar →" `primary xl`. Si campos obligatorios faltan, el botón está disabled y al intentar tocarlo hace shake 200 ms y enfoca el primer campo faltante.

### 7.4 Pantalla 1.D — Reserva paso 3: datos del pasajero

```
Tus datos                         ← heading/xl
Solo te pedimos lo necesario.    ← body/md gray/600

Nombre y apellido
[ ____________________________ ]

Teléfono
[ +51 ] [ 9## ### ### ]           ← prefijo fijo + máscara

Correo (para tu comprobante)
[ ____________________________ ]

¿Quieres comprobante con RUC?
[ ◯ No, boleta a nombre personal
  ⦿ Sí, factura para mi empresa ]
                                  ← Radios apilados

[Si "Sí, factura":]
RUC
[ ____________________________ ]
Razón social
[ ____________________________ ]
                                  ← Botón link "Buscar RUC en SUNAT" si se valida online

¿Compartir el viaje con alguien?
[ Switch ]  Compartir seguimiento por SMS o WhatsApp
[Si activo:]
[ +51 9## ### ### ]              ← teléfono de contacto

[ ⓘ Le enviaremos un enlace público para ver tu ruta en vivo. ]
```

**Privacidad explícita**: debajo de los campos sensibles, microcopy `body/xs gray/500`: "Tus datos quedan solo en Taxi Green. No los compartimos con terceros."

### 7.5 Pantalla 1.E — Reserva paso 4: confirmación

```
[Header con barra de progreso 100%]

¡Casi listo! Revisa tu reserva    ← heading/xl

╔═══════════════════════════════╗
║ Salida del aeropuerto         ║  ← heading/md
║ Vuelo LA2456 · 25/05 03:45    ║  ← body/md gray/700
║ Recojo: Sala Sector A         ║
║ Destino: Av Pardo 123, Mira-  ║
║ flores                        ║
║ 2 pasajeros · 2 maletas       ║
║ ─────────────                 ║
║ Tarifa estimada               ║
║ S/ 65.00                      ║  ← display/sm brand/700, mono/lg
║                               ║
║ [ Editar datos ]              ║  ← Botón ghost md
╚═══════════════════════════════╝

Te enviaremos confirmación por SMS y correo.

[Botón primary xl "Confirmar reserva"]

Al confirmar aceptas los         ← body/xs gray/500
términos y la política de
privacidad de Taxi Green.
```

**Microinteracción de confirmación**:
1. Al pulsar "Confirmar reserva", el botón pasa a estado loading con texto "Creando reserva…".
2. La pantalla hace fade rápido al éxito (300 ms).
3. Aparece pantalla 1.F.

**Por validar**: ¿la tarifa se muestra estimada o exacta? La evidencia dice "tarifa cerrada", lo cual sugiere exacta. Para la demo: tarifa exacta calculada por una tabla de distancias estática + recargo nocturno (`Hipótesis razonable`). Mostrar exacta es más confiable; estimada introduce duda. Marcar como `Por validar` con el cliente: "¿siempre cerrada o a veces estimada?".

### 7.6 Pantalla 1.F — Reserva confirmada (estado de éxito)

**Animación de entrada**: fondo `brand/50` ocupa toda la pantalla 250 ms; aparece círculo `brand/700` 96 × 96 con ícono `Check` blanco 56 px que dibuja su trazo con `motion/expressive` (rebote suave); el círculo se contrae a 64 px y se acomoda arriba; el texto entra debajo.

```
        [✓ círculo verde]
        
        Tu reserva está lista     ← display/sm

        Te avisaremos en cuanto
        tengas conductor.         ← body/md gray/700

╔═══════════════════════════════╗
║ Reserva #TG-20260525-0341     ║  ← mono/md gray/700
║ Tarifa S/ 65.00               ║  ← heading/md brand/800
║                               ║
║ Llegada estimada del vuelo:   ║
║ Hoy 03:45 a.m.                ║  ← body/md
║                               ║
║ Te recogemos en:              ║
║ Sala Sector A                 ║  ← body/md
╚═══════════════════════════════╝

[Botón primary xl "Ver mi viaje"]
[Botón ghost md "Compartir reserva"]

Recibirás un SMS y un correo con
tu comprobante apenas el viaje
empiece.
```

**Aquí se ofrece el prompt PWA**: 8 segundos después de mostrar esta pantalla (si el SO lo permite), aparece un bottom sheet con "Guarda Taxi Green en tu inicio para verlo en un toque. [Cómo]". Botón "Cómo" abre instrucciones específicas iOS/Android.

### 7.7 Pantalla 1.G — Mi viaje (viaje en curso) — la pantalla más importante

Esta es la pantalla que el pasajero abrirá una y otra vez. Debe ser auto-explicativa, calmante, y mostrar siempre el siguiente paso.

#### Sub-estado G1: "Esperando asignación"

```
┌─────────────────────────────────────┐
│  [Bell con punto]    Reserva       │  ← Header con badge "Por confirmar"
├─────────────────────────────────────┤
│                                     │
│  ╔═══════════════════════════════╗ │
│  ║  ⏳  Buscando un conductor   ║ │  ← heading/md brand/800
│  ║      para ti                  ║ │
│  ║                               ║ │
│  ║  Sale en ~12 minutos          ║ │  ← body/md
│  ║  Vuelo LA2456 · 03:45 a.m.    ║ │
│  ║                               ║ │
│  ║  [Indicador pulse 6 puntos]   ║ │  ← animación
│  ╚═══════════════════════════════╝ │
│                                     │
│  ¿Algo cambió con tu vuelo?         │  ← heading/sm
│                                     │
│  [Mi vuelo se retrasó]    [→]       │  ← lista de acciones rápidas
│  [Quiero cancelar]        [→]       │
│  [Hablar con alguien]     [→]       │
│                                     │
└─────────────────────────────────────┘
```

**Color de banner G1**: `card/highlight` (`brand/50` + borde `brand/300`).

#### Sub-estado G2: "Conductor asignado, en camino al pasajero"

```
╔═══════════════════════════════════╗
║  [Avatar 56 px del conductor]    ║
║  Juan Pérez · Tu conductor       ║  ← heading/md
║  ⭐ 4.9 (487 viajes)              ║  ← body/sm gray/600
║                                  ║
║  Llega en  8 min                 ║  ← display/md brand/700 (countdown)
║                                  ║
║  Toyota Yaris blanco             ║  ← body/md
║  Placa  ABC-123                  ║  ← mono/md
║                                  ║
║  [Botón ghost "Llamar al        ║  ← icon Phone 18 px
║   conductor"]                    ║
║  [Botón ghost "Enviar mensaje"] ║  ← icon MessageCircle
╚═══════════════════════════════════╝

[Mapa 320 px alto con punto pasajero estático
 y punto conductor en movimiento]

[CTA "Compartir mi viaje en vivo"]  ← Botón secondary md, ícono Share2
[CTA secundaria "Reportar algo"]    ← Botón care md, ícono LifeBuoy
```

**ETA countdown**: cada 30 s se recalcula con Mapbox Directions; si la diferencia es < 1 min se anima un tick que sube/baja, si es > 1 min se anima como flip-card.

**Color de banner**: fondo `white`, borde sutil `gray/200`. El componente más prominente es la foto + ETA.

#### Sub-estado G3: "Conductor llegó al punto"

Cambio visual fuerte:
- El header global pasa a fondo `brand/100`, borde inferior 2 px `brand/700`, texto "Tu conductor llegó".
- El cuerpo muestra el coche + placa más grande, y dos botones primarios: "Ya lo vi" (confirma el encuentro) y "No lo encuentro" (abre flujo de ayuda).
- Vibración suave del dispositivo si está permitido (1 pulso de 200 ms).

```
╔═══════════════════════════════════╗
║  Tu conductor está aquí          ║  ← display/sm brand/900
║                                  ║
║  [Foto del auto 240 px]          ║
║  Toyota Yaris blanco             ║  ← heading/md
║  Placa  ABC-123                  ║  ← mono/lg, copiable con tap-hold
║                                  ║
║  En el sector indicado:          ║
║  Sala de llegadas, Sector A      ║
║                                  ║
║  [Ya lo vi]   [No lo encuentro]  ║  ← dos botones a 50/50
╚═══════════════════════════════════╝
```

#### Sub-estado G4: "En viaje"

```
[Mapa pantalla completa con ruta dibujada,
 punto del auto avanzando, punto destino brillando]

Drawer inferior contraído 30%:
╔═══════════════════════════════════╗
║  Camino a Av Pardo 123           ║  ← heading/md
║  ETA  4:38 a.m. · 23 min         ║  ← display/sm brand/700
║                                  ║
║  ⬇ Tirar hacia arriba para ver  ║  ← handle + body/xs gray/500
╚═══════════════════════════════════╝

Drawer expandido 70%:
║  Conductor: Juan · ABC-123        
║  Velocidad promedio: 42 km/h      
║  [Compartir]   [Reportar]         
║  Tarifa: S/ 65.00                 
║  Pagas al final con tarjeta o      
║  efectivo, como acordaste.        
```

#### Sub-estado G5: "Viaje finalizado"

Animación: el mapa se desvanece y aparece pantalla blanca con check.

```
        [✓ verde]
        Llegaste

        Esperamos que el viaje haya sido cómodo.

╔═══════════════════════════════╗
║ Reserva #TG-20260525-0341     ║
║ Total cobrado                 ║
║ S/ 65.00                      ║  ← display/md brand/700
║ Pago: efectivo                ║
║                               ║
║ Comprobante enviado a         ║
║ gianella.caballero@…          ║  ← body/md gray/700
║ [Ver comprobante]             ║  ← botón ghost
╚═══════════════════════════════╝

¿Cómo estuvo el viaje?           ← heading/md
[ ⭐ ⭐ ⭐ ⭐ ⭐ ]                 ← estrellas 40 px tap

[Si rating ≤ 3, aparece]:
¿Qué pudo ser mejor?
[chips: "Tiempo de espera", "Trato del conductor", "Limpieza", "Ruta", "Otro"]
[Textarea opcional]

[Botón primary "Enviar feedback"]
[Botón ghost "Saltar"]

----
¿Algo quedó pendiente?           ← heading/sm
[Botón care md "Olvidé algo en el auto"]
[Botón ghost "Reportar otro tema"]
```

> **Cruce con Bienestar**: el botón "Olvidé algo en el auto" es un atajo de un solo tap que **inicia inmediatamente el flujo de objeto perdido** prefilled con la reserva, sin volver a pedir datos. Esta es una de las dos grandes "wow" de la demo.

### 7.8 Pantalla 1.H — Mis reservas

Lista vertical de tarjetas, agrupadas:

- "Próximas" (1–3 visibles arriba).
- "Pasadas" (colapsable, último mes).

Cada tarjeta de reserva:
- Badge de estado a la izquierda arriba.
- Título: "Salida del aeropuerto" / "Llegada al aeropuerto" / "Viaje libre".
- Subtítulo: fecha + hora.
- Línea con vuelo (si aplica).
- Pie con código de reserva en mono.
- Hover/tap → detalle (igual que pantalla 1.G según estado).

Empty state si no hay reservas: pictograma "auto verde con valija" + "Aún no tienes reservas. Cuando agendes la primera, aparecerá aquí." + CTA "Pedir taxi".

### 7.9 Pantalla 1.I — Ayuda / Bienestar (entrada lateral)

Esta pantalla es la **puerta única** del usuario hacia la capa de Bienestar.

```
Ayuda                            ← display/sm
¿Qué necesitas?                  ← body/md gray/600

╔═══════════════════════════════════╗
║ [LifeBuoy 32 px care/700]        ║
║ Olvidé algo en un viaje          ║  ← heading/md
║ Lo encontramos contigo en horas. ║  ← body/sm gray/600
║                          [→]     ║
╚═══════════════════════════════════╝  ← card/care

╔═══════════════════════════════════╗
║ [MessageSquareWarning 32 px]     ║
║ Tengo una queja o sugerencia     ║
║ Cuéntanos qué pasó.              ║
║                          [→]     ║
╚═══════════════════════════════════╝

╔═══════════════════════════════════╗
║ [ShieldCheck 32 px care/700]     ║
║ Reportar algo de seguridad       ║
║ Lo tratamos con prioridad.       ║
║                          [→]     ║
╚═══════════════════════════════════╝

╔═══════════════════════════════════╗
║ [Phone 32 px]                    ║
║ Hablar con una persona ahora     ║
║ 24/7 disponible.                 ║
║                          [→]     ║
╚═══════════════════════════════════╝

────────────

Preguntas frecuentes              ← heading/sm
[ Cómo cambio mi reserva     ▶ ]
[ Tarifas y comprobantes     ▶ ]
[ Política de cancelación    ▶ ]
[ Privacidad de mis datos    ▶ ]
```

Los detalles de los flujos de incidencia se especifican en la §13.

### 7.10 Pantalla 1.J — Yo (perfil minimalista)

- Avatar grande con iniciales o foto.
- Nombre, correo, teléfono editables inline (cada uno con su modal de edición).
- Lista de empresas asociadas si aplica (`Hipótesis`).
- Idioma del producto.
- Política de privacidad / términos (links).
- Botón "Cerrar sesión" `ghost` con color `danger/500`.

---

## 8. Cara 2 — PWA Conductor

> **Premisa**: el conductor instala como PWA en su teléfono. Login por número de celular + PIN de 6 dígitos. Su pantalla principal vive en modo "always-on" mientras está en turno (con bloqueo a vista única para evitar distracciones).

### 8.1 Pantalla 2.A — Login conductor

```
[Logo Taxi Green]                ← centrado top 40 px

¡Hola! ¿Tu número?              ← heading/xl
[ +51 ] [ 9## ### ### ]

[Continuar →]                    ← primary lg
```

Tras enviar el número:
```
Ingresa tu PIN
[ □ □ □ □ □ □ ]                  ← inputs PIN 48×56

[ ¿Olvidaste tu PIN? ]
```

Tras 3 intentos fallidos: bloqueo 5 minutos con countdown visible.

### 8.2 Pantalla 2.B — Inicio cuando "Libre"

```
┌─────────────────────────────────────┐
│  [Avatar 32] Juan Pérez            │  ← Header con avatar + nombre
│  [Switch "En turno"]               │  ← Switch a la derecha
├─────────────────────────────────────┤
│                                     │
│  Estás disponible                  │  ← display/sm brand/800
│                                     │
│  [Pictograma "auto verde reposando"]│
│                                     │
│  Cuando llegue una reserva para ti, │
│  la verás aquí.                    │  ← body/md gray/600
│                                     │
│  Hoy en turno: 3h 25m              │  ← heading/sm
│  Viajes completados: 4              │
│  Ganancias estimadas: S/ 180.00     │  ← mono/md brand/700
│                                     │
│  [Ver mi historial]                 │  ← botón ghost
│                                     │
└─────────────────────────────────────┘
```

Si el switch "En turno" está off: fondo del header `gray/100`, texto "Estás fuera de turno" y el bloque de estadísticas desaparece.

### 8.3 Pantalla 2.C — Nueva asignación recibida (sub-estado de 2.B)

**Importantísimo**: cuando llega una asignación, la PWA debe llamar la atención sin ser invasiva.

1. Notificación push del SO.
2. Si la app está abierta: bottom sheet sube automáticamente al 70% con animación `motion/expressive`, vibración pulso 200/100/200.
3. Sonido suave (preconfigurado, no agresivo). Configurable.

```
╔═══════════════════════════════════╗
║  [Handle gris]                   ║
║                                  ║
║  Tienes un viaje                 ║  ← display/sm brand/900
║  ───────                         ║
║                                  ║
║  Recoger en  8 minutos           ║  ← heading/md
║  Aeropuerto Jorge Chávez,        ║
║  Sala Sector A                   ║
║                                  ║
║  Llevar a:                       ║
║  Av Pardo 123, Miraflores        ║
║                                  ║
║  Vuelo LA2456 · 03:45 a.m.       ║
║  Pasajeros: 2  Equipaje: 2       ║
║                                  ║
║  Tarifa fija  S/ 65.00           ║  ← display/sm brand/700
║                                  ║
║  ⏱  Tienes 30s para responder    ║  ← countdown body/sm warning/700
║                                  ║
║  [ Aceptar ]      [ Rechazar ]   ║  ← primary lg / ghost lg
╚═══════════════════════════════════╝
```

**Countdown**: barra lineal arriba de los botones que se contrae de derecha a izquierda en 30 s. A 5 s restantes la barra se pone `warning/500`.

Si rechaza: bottom sheet pequeña pidiendo motivo (estoy lejos / con pasajero / otro). Devuelve a 2.B.

Si acepta: anima check rápido y pasa a 2.D.

### 8.4 Pantalla 2.D — Camino al pasajero

Vista mapa pantalla completa con ruta dibujada. Drawer inferior contraído:

```
╔═══════════════════════════════════╗
║  Vas a recoger a Gianella C.     ║
║  ETA  04:32 a.m.  · 8 min        ║  ← display/sm brand/700
║                                  ║
║  Sala Sector A · LA2456          ║
║                                  ║
║  [Llegué]   [Llamar pasajero]    ║
╚═══════════════════════════════════╝
```

Expandible para ver más: notas del pasajero ("Llevo perrito en jaula"), número de pasajeros, equipaje, dirección destino.

Botón **"Llegué"** (`primary xl`): solo se activa cuando GPS detecta que el conductor está a < 100 m del punto. Si lo aprieta antes, aparece tooltip "Te avisamos cuando estés más cerca". Esta restricción evita marcar llegada antes de tiempo (`Inferencia`, deriva de discusiones de operación; `Por validar`).

### 8.5 Pantalla 2.E — Esperando al pasajero

Tras "Llegué":

```
╔═══════════════════════════════════╗
║  Esperando a Gianella C.         ║  ← display/sm
║                                  ║
║  Tiempo de espera                ║
║  03:22                           ║  ← mono/xl 56 px tabular
║                                  ║
║  [Llamar] [Mensaje]              ║
║  [El pasajero llegó]             ║  ← primary lg
║  [No aparece — reportar]         ║  ← ghost md, lleva a Bienestar
╚═══════════════════════════════════╝
```

### 8.6 Pantalla 2.F — Viaje en curso

Vista mapa con ruta al destino. Drawer:

```
║  Llevando a Gianella C.          ║
║  Av Pardo 123, Miraflores        ║
║  ETA  04:55 · 23 min             ║
║                                  ║
║  [Terminar viaje]                ║  ← primary, deshabilitado hasta acercarse al destino
║  [Reportar algo]                 ║  ← care
```

### 8.7 Pantalla 2.G — Finalizar viaje

Modal al pulsar "Terminar viaje":

```
¿Confirmas el final del viaje?    ← heading/lg

Tarifa cerrada: S/ 65.00          ← display/sm brand/700

Método de cobro                   ← heading/sm
[ ⦿ Efectivo ]
[ ◯ Yape / Plin ]
[ ◯ Tarjeta (POS) ]
[ ◯ Cargo a empresa (voucher) ]

[Si Yape/Plin]:
Marca cuando el pasajero pagó
[Switch "Pago confirmado"]

[Confirmar fin de viaje]          ← primary lg
[Cancelar]
```

Tras confirmar: pantalla de éxito breve "Viaje finalizado · S/ 65.00 registrados", regreso a 2.B con stats actualizadas.

### 8.8 Pantalla 2.H — Historial conductor

Lista cronológica de viajes con: fecha/hora, pasajero (iniciales o nombre corto), origen-destino abreviado, tarifa, método de cobro. Filtros: día, semana, mes. Sumas al pie por filtro.

### 8.9 Pantalla 2.I — Yo (conductor)

- Datos personales (read-only para demo).
- Documentos vigentes (licencia, SOAT, revisión técnica) con fechas de vencimiento y badge de estado.
- Mi vehículo asignado.
- Configuración: sonido de notificaciones, vibración, idioma.
- Cerrar sesión.

---

## 9. Cara 3 — Web Despachador (desktop)

> **Premisa**: el despachador trabaja en monitor 1920 × 1080 o 1280 × 720 mínimo. Necesita densidad de información, no minimalismo. Pero sin caos. Cada elemento debe tener su lugar.

### 9.1 Pantalla 3.A — Login

Formulario sobrio centrado: logo arriba, "Acceso de equipo", email + contraseña + botón "Entrar". 2FA tras login (TOTP).

### 9.2 Pantalla 3.B — Dashboard principal

Layout maestro descrito en §4.3. La pantalla principal (módulo "Hoy") muestra:

#### Bloque superior — KPIs del día
4 tarjetas en grid 4 col:

```
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Reservas hoy  │ │ En viaje      │ │ Conductores   │ │ Incidencias   │
│  42           │ │  6            │ │  18 / 24      │ │  2            │
│  ↑ 8% vs ayer │ │  next: 03:45  │ │  activos      │ │  abiertas     │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
```

Cada KPI: número grande `display/lg` brand. Delta abajo con flecha. Color del número:
- Reservas → `gray/950`
- En viaje → `brand/700`
- Conductores → `gray/950` con `(activos/total)`
- Incidencias → `care/700` si > 0, `gray/500` si 0

Click en KPI abre la sección correspondiente filtrada.

#### Bloque medio — Vuelos próximos (timeline)

Timeline horizontal con vuelos del día agrupados por hora. Cada bloque muestra: aerolínea, vuelo, hora prevista, hora real (si difiere se ve en `warning/700`), conteo de pasajeros con reserva, estado de cobertura ("✓ Cubierto", "⚠ 1 sin asignar"). Click abre detalle.

#### Bloque inferior — Reservas que requieren atención

Lista con tabs: "Sin asignar (3)", "Atrasadas (1)", "Pendientes de confirmación (0)", "Con incidencia (2)". Tabla con columnas: código, pasajero, vuelo, hora estimada, estado, acción rápida (botón ghost "Asignar" o "Resolver").

### 9.3 Pantalla 3.C — Reservas (tabla principal)

Filtros laterales o superiores: fecha/rango, tipo de viaje, estado, empresa cliente, vuelo. Búsqueda por código o nombre arriba. Tabla con columnas: código, pasajero, ruta, fecha-hora, conductor, estado, tarifa, comprobante. Row hover muestra ícono `Eye` para abrir detalle en drawer lateral derecho 480 px.

#### Drawer detalle de reserva

```
┌──────────────────────────────────┐
│ Reserva #TG-20260525-0341  [X]  │
├──────────────────────────────────┤
│ [Badge estado]                   │
│                                  │
│ Pasajero                         │
│ Gianella Caballero               │
│ +51 999 888 777                  │
│ gianella@unmsm.edu.pe            │
│                                  │
│ Viaje                            │
│ Aero → Av Pardo 123 (Miraflores)│
│ 25/05 03:45 · LA2456             │
│                                  │
│ Conductor                        │
│ Juan Pérez · ABC-123             │
│ [Cambiar conductor]              │
│                                  │
│ Tarifa S/ 65.00 · Efectivo      │
│                                  │
│ [Línea de tiempo]:               │
│ ✓ Creada       03:12 a.m.        │
│ ✓ Asignada     03:14 a.m.        │
│ ✓ En camino    03:18 a.m.        │
│ ◯ Recojo       —                 │
│ ◯ Finalizada   —                 │
│                                  │
│ [Acciones]                       │
│ [Cancelar reserva] (destructive) │
│ [Reasignar]                      │
│ [Ver mapa en vivo]               │
│ [Ver incidencias asociadas]      │
└──────────────────────────────────┘
```

### 9.4 Pantalla 3.D — Mapa operacional en vivo

- Mapa pantalla completa con conductores como puntos verdes pulsantes.
- Sidebar derecha 320 px con lista de viajes en curso (avatar + ETA + estado).
- Filtros superiores: "Todos / Asignados / Libres / En pausa".
- Click en conductor: popover con datos + acción "Asignar manualmente reserva pendiente".

### 9.5 Pantalla 3.E — Conductores (gestión)

Tabla: avatar, nombre, placa, estado (En turno / Libre / Asignado / En viaje / Pausa / Offline), viajes del día, evaluación promedio. Click abre perfil completo.

### 9.6 Pantalla 3.F — Bandeja de ingesta multicanal (módulo demo)

Muestra mensajes entrantes desde el simulador WhatsApp + correos simulados. Pipeline visual:

```
[Mensaje entrante]
   ↓
[Copiloto extrae datos] ─── confianza 92%
   ↓
[Borrador de reserva visible]
   ↓
[Botones: "Aprobar y crear" / "Editar" / "Devolver al cliente con pregunta"]
```

Detalle en §12 (simulador WhatsApp).

### 9.7 Pantalla 3.G — Reportes

Tabs: "Operación", "Financiero", "Bienestar". Cada tab tiene gráficos (recharts) y exportación a Excel.

#### Tab "Bienestar"
- Conteo de incidencias por categoría (barra horizontal).
- Tiempo promedio de resolución (líneas).
- Tasa de cierre con confirmación positiva (gauge).
- Tabla de incidencias activas con drill-down.

### 9.8 Pantalla 3.H — Configuración del despachador

- Datos de usuario, cambio de contraseña, 2FA.
- Notificaciones (sonido para nuevas incidencias críticas).
- Preferencias de zona horaria (default America/Lima).

---

## 10. Cara 4 — Web Supervisor de counter (aeropuerto)

> **Premisa**: persona física en el counter del aeropuerto, con tablet o monitor compartido, gestionando llegadas. Necesita rapidez y cero ambigüedad.

### 10.1 Layout principal

```
┌─────────────────────────────────────────────────────────────┐
│ Counter Jorge Chávez · Turno noche · Carla M.       [Salir] │
├─────────────────────────┬───────────────────────────────────┤
│ Vuelos próximos         │  Asignación rápida                │
│ ─────────────           │                                   │
│ [LA2456] LATAM          │  Reserva siguiente:               │
│ Hoy 03:45 · 12 pax res  │  Gianella C. — vuelo LA2456       │
│ Cobertura: 10/12 ✓      │                                   │
│                         │  Sugerencias del copiloto:        │
│ [LP2110] Latam          │  ┌─────────────────────────────┐ │
│ Hoy 04:30 · 8 pax res   │  │ Juan P. — ABC-123          │ │
│                         │  │ 240 m · libre desde 02:50  │ │
│ [AV245] Avianca         │  │ [Asignar]                  │ │
│ Hoy 05:10 · 5 pax res   │  └─────────────────────────────┘ │
│ Cobertura: 0/5 ⚠        │  ┌─────────────────────────────┐ │
│                         │  │ Pedro R. — XYZ-987         │ │
│                         │  │ 320 m · libre desde 02:40  │ │
│                         │  │ [Asignar]                  │ │
│                         │  └─────────────────────────────┘ │
│                         │                                   │
│                         │  [Asignar manual]                 │
└─────────────────────────┴───────────────────────────────────┘
```

### 10.2 Detalles

- **Lista vuelos**: cada vuelo es expandible para ver lista de pasajeros con reserva, con avatar inicial, hora estimada, estado de cobertura.
- **Sugerencias del copiloto**: muestra los 3 mejores conductores libres ordenados por distancia y disponibilidad. Cada uno con badge "Recomendado" si cumple criterio óptimo. Se muestran las razones: "Más cercano · Mejor evaluación reciente · Sin recargo nocturno". Click "Asignar" cierra la asignación.
- **Botón "Asignar manual"**: abre modal con buscador de conductor.
- **Indicadores de cobertura**:
  - ✓ verde si todos los pasajeros tienen conductor asignado.
  - ⚠ ámbar si faltan pocos.
  - ✗ rojo si faltan muchos y el vuelo está cerca.

### 10.3 Vista de seguimiento de un vuelo en aterrizaje

Botón "Iniciar recepción" cuando el vuelo aterriza. Pantalla "torre de control" muestra:
- Lista de pasajeros esperados.
- Conductor asignado a cada uno (con foto).
- Estado: "Esperando salida del pasajero" / "Encontrado" / "En camino al auto" / "En viaje".
- Botón rápido "Marcar como encontrado" (en caso el pasajero llegue al counter en persona).

### 10.4 Botones del supervisor

- "Asignar" (primary).
- "Reasignar" (secondary).
- "Cancelar reserva" (destructive, con confirmación).
- "Crear reserva manual" (secondary, abre formulario en modal).
- "Reportar incidente" (care).

---

## 11. Cara 5 — Portal Empresa cliente

> **Premisa**: persona del área de viajes corporativos o gerencia. Entra una o dos veces por semana. Quiere ver gastos, viajes recientes, pedir comprobantes y manejar a sus colaboradores autorizados.

### 11.1 Layout

Side nav 4 ítems: Resumen, Viajes, Colaboradores, Facturación.

### 11.2 Resumen

```
┌─ Resumen · TechCorp Perú S.A.C. · Mayo 2026 ──────────┐
│                                                        │
│  Gasto del mes        Viajes        Colaboradores      │
│  S/ 4,820.00         32            12 activos         │
│  ↑ 12% vs abril       ↑ 4 vs abril                     │
│                                                        │
│  [Gráfico de líneas — gasto diario últimos 30 días]   │
│                                                        │
│  Próximos viajes (3)                                  │
│  ─────────                                            │
│  [Lista de viajes futuros agendados con voucher]     │
│                                                        │
│  Últimos viajes (5)                                   │
│  ─────────                                            │
│  [Lista compacta]                                     │
└────────────────────────────────────────────────────────┘
```

### 11.3 Viajes

Tabla con filtros por colaborador, fecha, estado, código de proyecto/centro de costo. Cada fila clicable abre el detalle del viaje (read-only desde la perspectiva empresa). Botón "Exportar Excel".

### 11.4 Colaboradores

Lista de usuarios autorizados a pedir vouchers a cuenta de la empresa. Cada uno con: foto, nombre, correo, teléfono, centro de costo, viajes del mes, gasto del mes. Acciones: agregar, editar límites mensuales, deshabilitar.

### 11.5 Facturación

- Comprobantes emitidos el mes (PDF descargables).
- Saldo a pagar / pagado.
- Datos fiscales (RUC, razón social, dirección fiscal).
- Botón "Solicitar nota de crédito" (abre formulario).

### 11.6 Notificaciones del portal

Bell arriba derecha con un panel desplegable: "Voucher emitido a Juan P.", "Comprobante listo para LA2456", "Incidencia reportada por colaborador X".

---

## 12. Simulador WhatsApp (módulo demo)

> **Premisa explícita**: el simulador NO es integración real con la API de WhatsApp Business. Es una pantalla de demo que reproduce visualmente la experiencia de pedir un taxi por WhatsApp para demostrar la **ingesta multicanal del copiloto**. Esto debe quedar claro frente al cliente; el documento de PLAN_SOFTWARE_DEMO §3 lo declara como "Simulado".

### 12.1 Layout dual

Pantalla dividida 50/50:

- **Izquierda**: visual de WhatsApp Web/móvil (replica) con conversación.
- **Derecha**: panel "Cocina del copiloto" mostrando en tiempo real cómo procesa el mensaje.

### 12.2 Visual WhatsApp (izquierda)

- Fondo crema típico de WhatsApp `#ECE5DD` (referenciar pero adaptar; no es necesario clonar pixel-perfect).
- Burbujas a la izquierda en blanco (`#FFFFFF`), a la derecha en verde claro (`#DCF8C6`).
- Mensaje del "pasajero ficticio":

```
"Hola buenas, necesito un taxi para mañana,
mi vuelo llega a las 3:45am, LATAM 2456,
somos 2 personas, vamos a Miraflores"

[Hora: 22:34]
```

- Indicador "Taxi Green está escribiendo…" 2 s.
- Respuesta del bot/Taxi Green:

```
"¡Hola! Recibido. Te confirmo:
✓ Recojo: Aero Jorge Chávez, sala llegadas
✓ Vuelo LA2456 - 25/05 03:45
✓ 2 pasajeros
✓ Destino: Miraflores

¿Me confirmas tu dirección exacta en
Miraflores y un correo para el
comprobante?"
```

### 12.3 Panel "Cocina del copiloto" (derecha)

Cabecera: `Ingesta · Asistente de extracción` `heading/lg`.

#### Bloque 1 — Mensaje recibido

```
╔═══════════════════════════════════╗
║ Mensaje original                  ║
║ [Texto completo en mono/sm]       ║
║ Canal: WhatsApp simulado          ║
║ Hora: 22:34                       ║
╚═══════════════════════════════════╝
```

#### Bloque 2 — Extracción del LLM (animada paso a paso)

```
Extrayendo datos…                  ← spinner

[Datos detectados]:
  Tipo de viaje:   Salida del aeropuerto  ✓ confianza 95%
  Vuelo:           LA2456                  ✓ confianza 98%
  Fecha/hora:      25/05/2026 03:45        ✓ confianza 92%
  Pasajeros:       2                       ✓ confianza 99%
  Destino:         Miraflores              ⚠ confianza 70% (falta dirección exacta)
  Equipaje:        no especificado         ◯
```

Cada campo aparece con stagger 200 ms (`motion/calm`) y un check ✓ o warning ⚠.

#### Bloque 3 — Decisión sugerida

```
Sugerencia del copiloto:
"Pedir dirección exacta del destino
y correo para comprobante."

[Botón secondary "Editar antes de responder"]
[Botón primary "Enviar respuesta sugerida"]
[Botón ghost "Escribir manualmente"]
```

#### Bloque 4 — Borrador de reserva

```
[Card highlight] Borrador (no creado aún)
  Estado: incompleto
  Falta: dirección exacta, correo
  
[Botón "Ver borrador completo"] → abre drawer 3.C
```

### 12.4 Estado tras la siguiente respuesta del pasajero

Cuando el pasajero ficticio responde con la dirección y correo, todo el panel derecho se actualiza:

- Bloque 2 muestra todos los campos con ✓ y confianza > 90%.
- Bloque 3 cambia a: "Listo para crear reserva. ¿Confirmas?"
- Bloque 4 ofrece botón primary "Aprobar y crear reserva".

Al aprobar: animación de éxito + transición a pantalla 3.C con la reserva ya creada.

### 12.5 Botones operativos

- "Enviar respuesta sugerida": envía mensaje al hilo del simulador.
- "Editar antes de responder": abre textarea con la sugerencia editable.
- "Escribir manualmente": textarea vacío.
- "Aprobar y crear reserva": confirma y persiste.
- "Descartar conversación": cierra el hilo sin crear nada (con confirmación).

### 12.6 Nota visual de claridad para el cliente

Banner superior amarillo claro `warning/50`: "Demo · Esto es una simulación de cómo el copiloto procesa mensajes. En producción se conectaría con WhatsApp Business API o el canal real."

> **Decisión epistémica**: este banner se mantiene visible en demo. **No** se oculta para "vender mejor". La transparencia es valor del producto y del proceso comercial.

---

## 13. Capa transversal — Bienestar / Incidencias (todas las vistas)

> Esta sección desarrolla la capa que en `vision_final_perfecta.md §3.bis` está descrita estratégicamente. Aquí se especifican las pantallas concretas.

### 13.1 Principios visuales de la capa

1. **Color y tono distintivos**: paleta `care/*`. Nunca rojo agresivo salvo en incidentes de seguridad reales.
2. **Botón "Reportar" siempre accesible**: desde pasajero (en ayuda, en viaje en curso, en historial), desde conductor (en viaje, en historial), desde despachador (en cualquier reserva).
3. **Un solo formulario corto y guiado**: nunca formularios enormes. Tres preguntas máximo en el primer paso.
4. **Estado en vivo visible**: el usuario ve qué pasa después de reportar. Siempre.
5. **Resolución con humano**: en casos sensibles. Se indica claramente "una persona del equipo está revisando esto".

### 13.2 Pasajero — Pantalla 13.A: Reportar objeto perdido

Acceso: botón "Olvidé algo en el auto" desde la pantalla de fin de viaje, desde el historial, o desde la pantalla de Ayuda.

```
[Header con back arrow]
Olvidé algo en el auto            ← display/sm
Vamos a ayudarte a recuperarlo.   ← body/md gray/600

¿En qué viaje fue?                ← heading/md
[Card seleccionada con la reserva
 más reciente, o lista si vienes
 desde Ayuda]

¿Qué se quedó?                    ← heading/md
[ Textarea: Describe el objeto.
   Ej: cartera negra de cuero
   con DNI y tarjetas             ]
  contador 0/300

¿Dónde lo dejaste en el auto?     ← heading/sm
[ chips:
  Asiento delantero
  Asiento trasero
  Maletera
  No estoy seguro/a ]
  selección múltiple

[Sube una foto si te ayuda recordar
 (opcional)]
[Botón ghost "Adjuntar foto"]     ← max 3 fotos, 5MB c/u

¿Cómo quieres que te contactemos? ← heading/sm
[ ⦿ WhatsApp / SMS (mismo nro)
  ◯ Llamada
  ◯ Correo                       ]

[Enviar reporte]                   ← primary xl
[Cancelar]                         ← ghost
```

**Microinteracción al enviar**:
1. Botón cambia a estado loading "Enviando…" 800 ms.
2. Pantalla hace fade a 13.B (confirmación).

### 13.3 Pasajero — Pantalla 13.B: Reporte recibido (confirmación)

```
[Ícono LifeBuoy 96 px care/700 en círculo care/100]

Recibimos tu reporte               ← display/sm

Una persona del equipo está        ← body/md gray/700
revisando esto contigo. Te
contactaremos lo antes posible,
máximo en 2 horas.

╔═══════════════════════════════╗
║ Caso #INC-20260525-0142       ║  ← mono/md
║ Estado:  En revisión          ║  ← badge care
║ Reportado: 25/05 04:32 a.m.   ║
║                               ║
║ Próximo paso esperado:        ║
║ Contacto del despacho         ║
║                               ║
║ Tiempo restante estimado:     ║
║ ⏱ 1h 58 min                   ║
╚═══════════════════════════════╝

[Ver detalle del caso]
[Volver al inicio]
```

### 13.4 Pasajero — Pantalla 13.C: Detalle de incidencia

```
[Header back] [Caso #INC...]
[Badge care "En revisión"]

Objeto perdido                    ← display/sm
Cartera negra de cuero            ← body/lg

Línea de tiempo                   ← heading/sm
─────────
✓ 04:32  Tú reportaste el caso
✓ 04:35  El despacho lo recibió
◯ Próximo: contacto del despacho
◯ Resolución

Datos del viaje                   ← heading/sm
Reserva #TG-20260525-0341
Conductor Juan Pérez · ABC-123
25/05 03:45 a.m.

[Mensajes con el equipo]          ← heading/sm
─────────
[Burbuja del usuario: descripción inicial]
[Burbuja del equipo: "Recibimos tu caso..."]

[Textarea "Escribe a tu agente"]
[Botón Send]

Acciones                          ← heading/sm
[Adjuntar más información]
[Llamar al equipo]
[Marcar como resuelto por mi cuenta]
```

**Cuando el conductor confirma haber encontrado el objeto**, esta pantalla muestra un banner de éxito arriba: "¡Buenas noticias! Juan encontró tu cartera. El equipo te contactará para coordinar la entrega."

### 13.5 Pasajero — Pantalla 13.D: Reportar queja o problema del servicio

Similar a 13.A pero con categorías diferentes:

```
¿Qué pasó?                        ← heading/md
[ chips selección única:
  Trato del conductor
  Vehículo en mal estado
  Llegó muy tarde
  Cobro incorrecto
  No respetó la ruta
  Otro ]

Cuéntanos con tus palabras:
[Textarea 0/500]

Adjuntar (opcional):
[Botón ghost "Foto o audio"]

¿Cómo te contactamos?
[mismo bloque que 13.A]

[Enviar queja]
```

### 13.6 Pasajero — Pantalla 13.E: Reportar incidente de seguridad (flujo crítico)

Visualmente diferente desde el primer tap:

```
[Header con fondo danger/50, ícono ShieldCheck]
Reportar un incidente de seguridad

Esto se atiende con prioridad.    ← body/lg danger/700
Si estás en peligro inmediato,
llama al 105 (Policía).

[Botón danger lg "Llamar a la policía 105"] ← tel:105

──── O ────

¿Qué pasó?                        ← heading/md
[chips:
  Me siento inseguro/a en este viaje
  El conductor no es quien debería ser
  Acoso o conducta inapropiada
  Robo o intento de robo
  Otro grave ]

Describe lo necesario para entender:
[Textarea]

¿Estás en el viaje ahora?
[ ⦿ Sí, ahora mismo
  ◯ No, ya terminó ]

[Si "Sí, ahora mismo"]:
[Banner danger/50] "Vamos a contactarte de inmediato y alertaremos al equipo de operación. Mantén el teléfono cerca."
[Botón danger xl "Enviar y pedir ayuda ahora"]

[Si "No, ya terminó"]:
[Botón care lg "Enviar reporte"]
```

**Tras enviar**: pantalla 13.B pero con paleta `danger`, mensaje "Recibimos tu reporte. Un humano del equipo va a contactarte en máximo 15 minutos." y countdown 15 min visible.

> **Diferenciador clave** (`Hipótesis estratégica`, refuerza vision_final_perfecta §3.bis): la transparencia y la cercanía en este flujo es exactamente lo que apps grandes hacen mal. Aquí se muestra que Taxi Green prioriza este tipo de casos.

### 13.7 Despachador — Pantalla 13.F: Cola de incidencias

Tabla con incidencias activas:

| Estado | Tipo | Pasajero | Conductor | Reportado | SLA | Asignado a | Acción |
|---|---|---|---|---|---|---|---|
| 🟣 En revisión | Objeto perdido | Gianella C. | Juan P. | hace 12 min | 2h | Carla M. | Abrir |
| 🔴 Seguridad — activo | Incidente | Pedro G. | Luis V. | hace 3 min | 15 min | — sin asignar | URGENTE |
| 🟣 En atención | Queja | Ana T. | Juan P. | hace 1h | 24h | Diego H. | Abrir |

Filtros: tipo, estado, prioridad, conductor involucrado.
Búsqueda por código.

Las filas de seguridad activas tienen fondo `danger/50` y borde izquierdo 4 px `danger/500`, parpadean (pulso 1 s) hasta ser tomadas por alguien.

### 13.8 Despachador — Pantalla 13.G: Detalle/atención de incidencia

Layout master-detail:

- Izquierda 60%: timeline, mensajes con el pasajero, archivos adjuntos, datos del viaje, datos del conductor.
- Derecha 40%: panel de acciones.

```
[Panel acciones]

Estado actual: En atención         ← badge care
[Cambiar estado ▼]
   ◯ En revisión
   ⦿ En atención
   ◯ Esperando respuesta del usuario
   ◯ Resuelta — pendiente confirmación
   ◯ Cerrada

Asignar a:
[Carla M. ▼]

Notas internas:
[Textarea con visibilidad solo equipo]

Adjuntar constancia
[Botón "Generar constancia PDF"] → genera doc plantilla

[Mensaje al pasajero]:
[Textarea con plantillas pre-cargadas:
  - "Estamos investigando…"
  - "Encontramos tu objeto"
  - "Necesitamos más datos"
  - "Caso cerrado"]
[Enviar]

[Botón "Contactar al conductor"]   ← abre modal de mensaje al conductor
[Botón "Cerrar caso"]              ← care, requiere confirmación + nota interna
[Botón "Escalar a coordinación"]   ← warning, lleva a un nivel superior (rol)
```

### 13.9 Conductor — Pantalla 13.H: Recibir solicitud de búsqueda de objeto perdido

Cuando un pasajero reporta objeto perdido en uno de sus viajes recientes, el conductor recibe una notificación:

```
[Bottom sheet]
Pasajero olvidó algo en tu auto

Reserva 03:45 LA2456 · Gianella C.
"Cartera negra de cuero"
Probable: asiento trasero o maletera

¿Puedes revisar?

[Botón primary "Lo encontré"]
[Botón secondary "No lo encuentro"]
[Botón ghost "Revisar más tarde"]
```

Al pulsar "Lo encontré":
```
Confirma qué encontraste:
[Textarea opcional descripción]
[Botón ghost "Adjuntar foto"]
[Estado del objeto: ⦿ Intacto / ◯ Dañado]

[Botón primary "Notificar al equipo"]
```

Tras notificar: confirmación visual de éxito + indicación de "El equipo coordinará entrega contigo".

### 13.10 Supervisor counter — Pantalla 13.I: Reporte rápido

Botón "Reportar incidente" siempre visible en la pantalla del supervisor. Al pulsarlo: modal corto con: tipo (seguridad, queja del pasajero, falla del conductor, otro), descripción, vincular a reserva si aplica, foto opcional, prioridad. Envía y vuelve.

### 13.11 Empresa cliente — Pantalla 13.J: Incidencias del colaborador

El portal empresa muestra incidencias asociadas a sus colaboradores, con respeto a privacidad: ven que existe el caso y estado general, pero los mensajes detallados son privados del colaborador con Taxi Green.

### 13.12 Constancia PDF (output)

Cuando se cierra una incidencia, se puede generar una **constancia** firmada digitalmente con:
- Logo Taxi Green
- Datos del caso (código, fecha, tipo)
- Resumen breve
- Línea de tiempo
- Persona del equipo responsable
- Firma (digital, hash + timestamp)
- QR de verificación

Esta constancia se enviaría por correo y queda en la app del pasajero para descarga.

---

## 14. Flujos completos paso a paso

### 14.1 Flujo "Reserva nueva por enlace" (pasajero)

1. Pasajero abre link → 1.A.
2. Toca "Pedir taxi" → 1.B.
3. Elige tipo "Salida del aeropuerto" → 1.C.
4. Completa vuelo + destino + pasajeros → tap "Continuar".
5. Completa datos personales → tap "Continuar".
6. Revisa resumen 1.E → tap "Confirmar reserva".
7. Ve éxito 1.F (animación check).
8. Sistema dispara SMS al pasajero + push al despachador "Nueva reserva sin asignar".
9. Despachador (o copiloto) asigna conductor.
10. Pasajero recibe push "Tienes conductor" → 1.G estado G2.
11. Conductor llega → G3 (header verde brillante, vibración).
12. Pasajero toca "Ya lo vi" → conductor recibe "Pasajero confirmó encuentro".
13. Conductor toca "Iniciar viaje" en su lado → 1.G entra a G4.
14. Mapa en vivo.
15. Llegan al destino → conductor toca "Terminar".
16. 1.G muestra G5 con tarifa + opción de calificar y opción de reportar objeto perdido.
17. Pasajero recibe comprobante por correo.

### 14.2 Flujo "Asignación de un viaje" (despachador)

1. Llega reserva pendiente al dashboard 3.B → bloque "Reservas que requieren atención".
2. Click en reserva → drawer 3.C.
3. Botón "Asignar" → panel lateral muestra los 3 mejores conductores sugeridos.
4. Click "Asignar a Juan P." → confirmación + estado de la reserva cambia a "Conductor en camino".
5. Conductor recibe pantalla 2.C.
6. Despachador puede seguir todo en 3.D (mapa en vivo).

### 14.3 Flujo "Objeto perdido" (estrella de la demo)

1. Pasajero termina su viaje (G5).
2. Toca "Olvidé algo en el auto".
3. Pantalla 13.A precargada con la reserva.
4. Llena qué objeto y dónde lo dejó.
5. Envía → 13.B (recibido, 2h SLA).
6. **En paralelo**: el caso aparece en cola del despachador (13.F) con estado "En revisión".
7. Despachador abre 13.G, asigna a Carla M.
8. Carla envía mensaje al conductor (a través del modal de 13.G).
9. Conductor recibe 13.H, revisa su auto.
10. Conductor pulsa "Lo encontré" + adjunta foto.
11. **Pasajero (Gianella)** recibe push: "Encontramos tu cartera". 13.C muestra banner verde.
12. Carla coordina punto y horario de entrega vía chat dentro de 13.G/13.C.
13. Conductor o supervisor entrega el objeto.
14. Carla cambia estado a "Resuelta — pendiente confirmación".
15. Gianella confirma recepción dentro de la app.
16. Sistema cierra el caso, dispara constancia PDF al correo + a Gianella en app.
17. Encuesta breve post-resolución (NPS).

### 14.4 Flujo "Ingesta multicanal" (demo del copiloto)

1. Operador abre simulador 12.
2. Lee el mensaje del pasajero ficticio.
3. Ve cómo el copiloto extrae datos en tiempo real (campos aparecen uno por uno con confianza).
4. Acepta sugerencia "Pedir dirección exacta".
5. La respuesta sugerida llega al hilo.
6. Pasajero ficticio responde.
7. Copiloto completa todos los campos.
8. Operador hace clic "Aprobar y crear reserva".
9. La reserva se crea en el sistema (visible en 3.C).

### 14.5 Flujo "Incidente de seguridad" (caso límite)

1. Pasajero, durante viaje, toca "Reportar" → "Algo de seguridad" → 13.E.
2. Elige "Me siento inseguro/a" y "Sí, ahora mismo".
3. Envía → mensaje al sistema con flag de alta prioridad.
4. Despachador ve fila roja parpadeante en 13.F.
5. Despachador toma el caso (auto-asignación al primer despachador disponible si nadie reacciona en 60 s).
6. Llama al pasajero por la línea operativa.
7. En paralelo, el sistema muestra mapa en vivo del viaje y datos del conductor.
8. Si el caso escala, despachador puede activar protocolo (ej. notificar a policía manualmente, contactar al conductor, activar grabación dependiendo del marco legal — `Por validar` con cliente y marco legal peruano).
9. Caso queda registrado para auditoría.

---

## 15. Estados vacíos, error, loading, offline

### 15.1 Estados vacíos por pantalla clave

| Pantalla | Vacío | Pictograma / Ícono | Microcopy | CTA |
|---|---|---|---|---|
| 1.H Mis reservas | sin reservas | Pictograma "auto verde con valija" | "Aún no tienes reservas." | "Pedir taxi" |
| 1.I Ayuda > FAQ | sin búsqueda | — | (vista llena por defecto) | — |
| 3.B Dashboard > Atención | nada que atender | Pictograma "punto en mapa" | "Todo en orden por ahora." | — |
| 3.G Reportes | sin datos | Ícono BarChart3 64 px | "Aún no hay datos para este rango." | "Cambiar rango" |
| 13.F Cola incidencias | sin incidencias | Pictograma "constancia con sello" | "No hay incidencias abiertas." | — |
| 2.B Conductor inicio | fuera de turno | Pictograma "auto reposando" | "Estás fuera de turno." | (switch En turno) |

### 15.2 Errores

| Tipo | Visualización |
|---|---|
| Error de conexión | Banner naranja sticky arriba: "Sin conexión. Reintentaremos solos." con spinner pequeño |
| Timeout (después de 10 s) | Toast warning: "Está tardando más de lo normal. ¿Reintentar?" con botón "Reintentar" |
| Error 500 servidor | Pantalla error: pictograma "auto detenido" + "Tuvimos un problema. Ya lo sabemos. Intenta de nuevo en un minuto." + botón "Reintentar" |
| Error 401 sesión vencida | Modal: "Tu sesión expiró por seguridad. Vuelve a entrar." con botón "Volver a entrar" → login |
| Error 403 sin permiso | Pantalla con texto sobrio: "No tienes acceso a esta sección. Si crees que es un error, contacta a tu administrador." |
| Error 404 | Página con pictograma "mapa perdido" + "No encontramos lo que buscas." + botón "Volver al inicio" |
| Error validación | Inline en el campo (ver §3.2) |

### 15.3 Loading

- **< 300 ms**: no se muestra nada (UI optimista).
- **300 ms – 2 s**: skeleton del contenido específico.
- **2 s – 8 s**: skeleton + texto pequeño "Procesando…" o el verbo específico.
- **> 8 s**: skeleton + barra de progreso indeterminada + opción de cancelar cuando aplica.

### 15.4 Offline (PWA)

- Si la PWA está abierta y se pierde conexión, banner naranja sticky superior.
- Pantallas anteriores quedan accesibles con datos en caché.
- Acciones que requieren red se ponen en cola con "Pendiente de enviar" visible y se reenvían al volver red.
- Indicador discreto en cada acción encolada.

---

## 16. Notas para Figma y handoff

### 16.1 Organización del archivo Figma

Páginas Figma sugeridas:
1. **Cover** — pieza principal de presentación, fecha, autor, versión.
2. **Design Tokens** — referencia de colores, tipografía, sombras, radios.
3. **Components** — biblioteca de componentes con variantes y propiedades.
4. **Patterns** — patrones de layout, navegación, mapa.
5. **Iconography & Assets** — set de íconos lucide + pictogramas custom.
6. **PWA Pasajero** — todas las pantallas + flujo.
7. **PWA Conductor** — idem.
8. **Web Despachador** — idem.
9. **Counter Supervisor** — idem.
10. **Empresa Cliente** — idem.
11. **Simulador WhatsApp** — pantallas duales.
12. **Bienestar** — pantallas de incidencias por superficie.
13. **Estados** — empty, error, loading, offline.
14. **Prototype** — un solo prototipo navegable que cubra los 3 flujos estrella (reserva nueva, objeto perdido, asignación despachador).

### 16.2 Variables Figma (modo claro únicamente por ahora)

Crear colección `Taxi Green Primitives` con todos los tokens de §1.1 a §1.7. Luego una colección `Taxi Green Semantic` que mapee primitivos a roles (`color/background/page`, `color/text/primary`, etc.). Los componentes solo usan tokens semánticos, nunca primitivos directamente. Esto facilita el roadmap a dark mode sin rehacer componentes.

### 16.3 Estilos de texto Figma

Crear estilos por cada token tipográfico de §1.2. Nombres jerárquicos: `display/xl`, `display/lg`, `heading/xl`, `body/md`, `mono/sm`, `button/lg`, etc. Idéntico a Tailwind.

### 16.4 Componentes con variantes

Cada componente complejo (botón, input, tarjeta) debe estar como component set con propiedades booleanas o enum:
- Button: `variant` (primary/secondary/ghost/destructive/care), `size` (sm/md/lg/xl), `state` (default/hover/pressed/focus/loading/disabled), `iconLeft` (boolean), `iconRight` (boolean).
- Input: `state`, `size`, `hasIcon`, `hasError`, `hasHelp`.
- Card: `variant`, `padding`.
- Badge: `variant`, `withIcon`.

### 16.5 Auto-layout obligatorio

Todos los componentes usan auto-layout para que el handoff a Tailwind/CSS sea directo. No se permiten espaciados manuales con offsets X/Y.

### 16.6 Reglas de naming

- Frames: `[Cara]/[Pantalla]/[Subestado]` ej. `Pasajero/Mi Viaje/Conductor llegó`.
- Componentes: `Component/Variant=primary,Size=lg,State=hover`.
- Estilos: usar `/` para jerarquía.

### 16.7 Especificaciones para developer handoff

- Mapear cada estilo Figma a su token Tailwind correspondiente (extender la `tailwind.config.ts`).
- Documento `tokens.json` exportable (Figma Tokens plugin) con los valores de §1.
- Cada pantalla incluye anotaciones de comportamiento (hover, animaciones, condiciones).
- Las pantallas con animaciones complejas (1.F éxito, 13.E seguridad) tienen un .lottie o video corto adjunto explicando la secuencia.

### 16.8 Prototype interactivo

Para presentación al cliente, prototipo navegable que cubra:
1. **Flujo estrella 1**: Pasajero hace reserva por enlace → viaje en curso → fin → reporta objeto perdido → ve resolución.
2. **Flujo estrella 2**: Despachador recibe la reserva, asigna conductor, ve mapa, atiende la incidencia.
3. **Flujo estrella 3**: Operador ve simulador WhatsApp recibir mensaje, copiloto extrae datos, aprueba creación de reserva.

Cada flujo dura entre 90 s y 180 s al ritmo de presentación.

### 16.9 Versionado

El archivo Figma sigue versionado semántico simple:
- `v0.1` — Wireframes baja fidelidad para validación interna.
- `v0.5` — Alta fidelidad mid-fi (sin todos los estados).
- `v1.0` — Listo para handoff a desarrollo (pixel-perfect, todos los estados, prototipo).
- `v1.x` — Iteraciones tras feedback del cliente.

---

## Notas finales epistémicas

> **Estado de este diseño**: `Propuesta integral` derivada del análisis. Es exhaustiva en estructura, pero cada decisión visual concreta (paleta exacta, peso del verde, tipografía Inter vs Manrope, voz del producto) está marcada implícitamente como `Por validar` con dos pruebas:
>
> 1. **Prueba con el cliente Taxi Green** — mostrar 3 variaciones de paleta y tipografía, ver cuál transmite mejor su marca actual sin caer en estética startup.
> 2. **Prueba con usuarios reales** — pasajeros frecuentes del aeropuerto haciendo un test moderado del prototipo: ¿entiendes esta pantalla? ¿qué harías aquí?
>
> Las decisiones de capa de Bienestar (color púrpura, tono, formulario de 3 preguntas, SLA visible) deben validarse en simulacro real: invitar a alguien que perdió algo recientemente, pedirle que use el flujo, escuchar dónde duda o se frustra.
>
> Lo que NO debe cambiar (núcleo del producto, no del diseño):
> - El botón "Olvidé algo" como atajo de un tap desde fin de viaje.
> - La barra persistente de Bienestar cuando hay caso abierto.
> - La transparencia explícita en la demo de que el simulador es simulado.
> - La distinción visual entre incidencia normal (`care`) y de seguridad (`danger`).
> - El principio de "una sola acción primaria por pantalla".
>
> Todo lo demás es ajustable con datos.

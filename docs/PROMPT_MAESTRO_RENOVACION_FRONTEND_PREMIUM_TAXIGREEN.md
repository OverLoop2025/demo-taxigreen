# PROMPT MAESTRO — Renovación frontend premium Taxi Green

## 0. Misión

Actúa como **ingeniero senior, arquitecto frontend senior, diseñador de producto senior y auditor UX extremadamente exigente**.

Debes revisar el repositorio `demo-taxigreen` de punta a punta antes de tocar código, con prioridad en:

- `/docs`
- `CLAUDE.md`
- `README.md`
- `07_PLAN_EJECUCION/`
- `apps/web`
- `apps/driver`
- `packages/rutas`
- `packages/ingesta`
- `packages/ia`
- `packages/asignacion`

El objetivo no es “maquillar pantallas”. El objetivo es convertir la demo en una experiencia **simple, premium, humana, inmediata y entendible sin manual**.

La demo debe sentirse como un producto real de movilidad: clara como Uber, directa como inDrive, visual como Waze y más limpia que una herramienta administrativa tradicional.

No busques dependencia psicológica ni artificios. Busca algo mejor: **claridad instantánea, confianza, control y deseo natural de volver a usarlo porque no exige pensar**.

---

## 1. Ley sagrada de producto

Esta regla gobierna todo:

> Si una persona necesita leer demasiado, pensar demasiado o preguntar cómo usarlo, la interfaz está mal.

Cada pantalla debe responder en menos de 3 segundos:

1. ¿Dónde estoy?
2. ¿Qué está pasando?
3. ¿Qué debo hacer ahora?
4. ¿Qué puedo ignorar por el momento?

Todo lo demás debe estar oculto, resumido, agrupado o disponible solo bajo demanda.

---

## 2. Reglas inviolables de interfaz

### 2.1. Cero términos técnicos para usuarios finales

Quedan prohibidos en superficies visibles para pasajeros, conductores, counter y operador común:

- ETA
- Realtime
- Polling
- HMAC
- idempotente
- token
- tenant
- payload
- JSON
- algoritmo
- LLM
- IA como etiqueta principal visible
- score
- pesos
- cola
- match
- pax
- auditoría
- sprint
- wa-sim
- fallback
- fuente
- estimación de respaldo
- routing
- endpoint
- dev client
- Mapbox no disponible
- latitud / longitud
- coordenadas

Pueden existir internamente, pero no en la experiencia comercial.

### 2.2. Diccionario obligatorio de reemplazos

| Texto actual | Reemplazo humano |
|---|---|
| ETA 8 min | Llega en 8 min |
| Ruta real | Ruta actualizada |
| Estimación | Calculando ruta |
| Realtime activo | En vivo |
| Polling 10s | Actualizando |
| Push registrado | Avisos activos |
| HMAC + auditoría | QR protegido |
| Consumir QR | Confirmar acceso |
| Idempotente | De un solo uso |
| Cola | Turno |
| Pesos | Motivos |
| Score | Recomendado |
| Match | Encaja |
| Algoritmo | Modo seguro |
| IA | Copiloto |
| JSON | Detalle técnico |
| WA Sim | WhatsApp |
| Asignación manual | Elegir conductor |
| Marcar excepción | Necesita revisión |
| Rating | Calificación |
| Pax | Personas |
| Tenant | Empresa |
| Estado por_liquidar | Viaje cerrado |

### 2.3. Una pantalla, una acción principal

En cada momento debe existir una sola acción dominante.

Ejemplos:

- Counter antes de validar: **Validar QR**
- Counter después de validar: **Confirmar acceso**
- Counter después de confirmar: **Siguiente pasajero**
- Conductor antes de salir: **Voy al punto**
- Conductor en punto: **Ya llegué**
- Conductor con pasajero: **Iniciar viaje**
- Conductor al destino: **Finalizar**
- Pasajero en viaje: **Ver ruta**
- Pasajero después del viaje: **Calificar viaje**

Los botones secundarios deben ser discretos o estar dentro de “Más opciones”.

### 2.4. Revelar solo cuando corresponde

No mostrar acciones prematuras.

Ejemplos obligatorios:

- No mostrar “Descargar PDF” si el comprobante aún no existe.
- No mostrar “Confirmar acceso” si el QR aún no fue validado.
- No mostrar datos técnicos de ruta si el usuario solo necesita ver el avance.
- No mostrar calificación antes de finalizar el viaje.
- No mostrar formulario de objeto olvidado antes de cerrar el servicio, salvo acceso discreto de soporte.
- No mostrar información de vuelo como bloque principal durante el viaje; el mapa manda.

### 2.5. El mapa manda durante el viaje

Cuando el actor está en un tramo activo, la pantalla principal debe ser el mapa.

No se aceptan pantallas de viaje basadas en muchas tarjetas apiladas.

La estructura correcta es:

```txt
Mapa a pantalla completa
+ banner superior breve
+ controles mínimos
+ tarjeta inferior deslizable
+ acción principal fija
```

---

## 3. Diagnóstico actual del repo

### 3.1. El producto ya tiene una base fuerte

El repositorio ya llegó a Sprint 9 con:

- monorepo funcional;
- web Next.js;
- app conductor React Native + Expo;
- link pasajero;
- counter QR de un solo uso;
- WhatsApp simulator;
- rutas Mapbox + fallback determinista;
- Supabase Realtime;
- pruebas y build verificados.

No se debe rehacer desde cero.

### 3.2. El problema no es arquitectura; es experiencia

El problema actual es que la experiencia todavía se siente construida por capas técnicas:

- demasiadas tarjetas;
- demasiados términos internos;
- demasiada explicación;
- demasiados estados visibles;
- demasiados datos al mismo nivel;
- mapa demasiado pequeño;
- acciones visibles antes de ser necesarias;
- copy con tono de documentación;
- pantallas que parecen panel interno, no producto premium.

### 3.3. Hallazgos críticos por superficie

#### Landing `/`

Problemas:

- Usa términos como “trazable”, “cola operativa”, “ETA”, “Guion demo”.
- Explica demasiado.
- Se siente como presentación de arquitectura, no como servicio.

Debe convertirse en:

- “Pide tu Taxi Green por WhatsApp.”
- “Te esperamos en el punto exacto.”
- “Sigue tu viaje en vivo.”
- “Sin instalar app.”

#### Pasajero `/p/[token]`

Problemas:

- El mapa actual está dentro de una tarjeta de altura fija.
- La pantalla apila conductor, unidad, punto, mapa, línea de tiempo, botones, destino, comprobante e incidencia.
- La información del vuelo y reserva compite con lo importante: ruta, conductor y punto de encuentro.
- Muestra textos explicativos como “El hotel solicitó el servicio; no es el punto de recojo”.
- Muestra términos como “Ruta real”, “Estimación”, “ETA”.
- Puede mostrar “Descargar PDF” junto a “Preparar comprobante”, aunque la acción correcta debe ser progresiva.

Debe convertirse en:

```txt
Pantalla principal:
- mapa grande
- “Tu Taxi Green llega en X min”
- placa + conductor
- punto exacto
- botón llamar

Tarjeta deslizable:
- contraída: conductor, placa, llegada, punto
- media: origen, destino, vuelo, hora
- completa: código, comprobante, soporte, calificación
```

El pasajero debe poder tocar el mapa para verlo en pantalla completa.

#### App conductor `/asignacion/[id]`

Problemas:

- Usa `ScrollView`.
- Muestra tarjeta de viaje, punto, mapa, filas de origen/destino/hora/unidad, red, ubicación y acción.
- El mapa es `h-80`, no una vista de navegación.
- Muestra “ETA”, “Ruta real con tráfico”, “Estimación de respaldo”.
- El conductor tiene que bajar visualmente para encontrar información.

Debe convertirse en modo navegación:

```txt
Mapa full-screen
+ arriba: “Ve a Salida 3, columna F2”
+ centro: ruta y marcador
+ derecha: recentrar / llamar
+ abajo: tarjeta con pasajero, punto, destino
+ botón principal fijo: “Voy al punto”, “Ya llegué”, “Iniciar viaje”, “Finalizar”
```

#### App conductor home

Problemas:

- Muestra “Realtime”, “Push”, “Push no provisionado”.
- Es útil para debugging, pero no para un conductor real.

Debe mostrar:

- “Disponible”
- “En pausa”
- “Tienes un viaje”
- placa/unidad
- abrir viaje

Lo técnico debe ir en un panel oculto de diagnóstico.

#### Counter `/counter`

Problemas:

- Dice “Validación operativa”.
- Explica “consume el QR de forma idempotente”.
- Muestra “HMAC + auditoría”.
- Tiene pasos “Walk-in aeropuerto” y “Entrega y auditoría” que parecen módulo interno no terminado.
- El input dice “token QR”.

Debe convertirse en:

```txt
Título: Validar pasajero
Acción principal: Escanear QR
Alternativa: Escribir código
Después de validar: mostrar pasajero, punto, destino
Después de confirmar: “Acceso confirmado”
```

No mostrar “Confirmar acceso” hasta que el QR sea válido.

#### Admin / despacho

Problemas:

- `/admin` muestra `/admin`, tenant, Realtime, Polling, auditoría.
- La tabla tiene muchas columnas.
- El detalle de reserva muestra demasiados campos al mismo nivel.
- El copiloto muestra Cola, Match, Score, pesos.
- “Humano confirma antes de despachar” suena a documentación, no a producto.

Debe convertirse en:

```txt
Despacho
- Pendientes
- En camino
- En punto
- A bordo
- Cerrados

Cada reserva:
- pasajero
- punto
- destino
- hora
- conductor/unidad
- acción clara
```

El copiloto debe decir:

> Recomendado: Luis Ramírez · ABC-123  
> Está listo, conoce el aeropuerto y la unidad encaja con el viaje.

Los detalles técnicos pueden ir en “Ver motivos”.

#### WhatsApp / copiloto

Problemas:

- Se llama “WA Sim”.
- Muestra “Sprint 4”.
- Muestra “Extracción”, “Confianza”, “JSON”, “Algoritmo”, “IA”.
- Permite crear reserva desde 70% de confianza.
- No tiene flujo premium de confirmación explícita del cliente.
- No simula bien el comportamiento de un asistente que pregunta lo que falta.

Debe convertirse en:

```txt
Bandeja WhatsApp
+ conversaciones
+ chat
+ panel de reserva sugerida
+ modo copiloto
```

Reglas del copiloto:

- Menos de 80%: pregunta automáticamente los datos que faltan.
- 80% a 94%: pregunta solo lo crítico o resuelve contradicciones.
- 95% a 100% con datos obligatorios: muestra resumen y pide confirmación.
- Solo con confirmación explícita crea reserva.
- Si hay contradicción, caso raro o riesgo: pasa a operador.
- Al crear reserva: envía link pasajero, código y QR.

---

## 4. Arquitectura frontend objetivo

### 4.1. Componentes nuevos recomendados

#### Web pasajero

```txt
apps/web/src/app/p/[token]/components/
  PassengerTripShell.tsx
  PassengerMapHero.tsx
  PassengerBottomSheet.tsx
  PassengerTripSummary.tsx
  PassengerPrimaryAction.tsx
  PassengerSupportPanel.tsx
  PassengerReceiptPanel.tsx
  PassengerRatingPanel.tsx
  PassengerMapFullscreen.tsx
```

#### Driver

```txt
apps/driver/src/components/navigation/
  DriverNavigationScreen.tsx
  DriverNavigationMap.tsx
  NavigationTopBanner.tsx
  TripBottomSheet.tsx
  NavigationActionBar.tsx
  MapControls.tsx
  RouteUnavailablePanel.tsx
```

#### Counter

```txt
apps/web/src/app/counter/components/
  CounterValidationShell.tsx
  QRScannerPanel.tsx
  ManualCodePanel.tsx
  ValidatedPassengerCard.tsx
  CounterPrimaryAction.tsx
```

#### WhatsApp copiloto

```txt
apps/web/src/app/wa-sim/components/
  WhatsappInboxShell.tsx
  ConversationList.tsx
  ConversationThread.tsx
  CopilotPanel.tsx
  ReservationDraftCard.tsx
  MissingDataPrompt.tsx
  ConfirmationPreview.tsx
  TechnicalDetailsDrawer.tsx
```

#### Compartidos

```txt
apps/web/src/components/product/
  BottomSheet.tsx
  FullscreenMapButton.tsx
  PrimaryActionBar.tsx
  StatusText.tsx
  ProgressiveAction.tsx
  DebugDetails.tsx
```

---

## 5. Rediseño mapa estilo Waze / Uber / inDrive

### 5.1. Para conductor

Debe ser prioridad máxima.

La pantalla activa del conductor deja de ser una pantalla de scroll y pasa a ser una pantalla de navegación.

#### Layout

```txt
SafeAreaView flex-1
  MapView absolute full-screen
  NavigationTopBanner absolute top
  MapControls absolute right
  TripBottomSheet absolute bottom
  PrimaryActionBar fixed bottom
```

#### Banner superior

Estados:

| Estado | Texto |
|---|---|
| asignado | Ve al punto de encuentro |
| en_camino | Dirígete a Salida 3, columna F2 |
| en_punto | Espera al pasajero |
| a_bordo | Lleva al pasajero al destino |
| finalizado | Viaje terminado |

No usar “ETA”. Usar “Llegas en X min”.

#### Bottom sheet conductor

Contraído:

- pasajero
- punto
- llegada estimada
- botón llamar

Medio:

- punto exacto
- destino
- vuelo
- placa

Completo:

- código
- teléfono
- notas
- soporte
- detalles técnicos ocultos

#### Cámara del mapa

Usar seguimiento del conductor cuando el viaje está activo.

Requisitos:

- botón recentrar;
- no hacer fitBounds en cada refresh;
- si conductor se mueve, marcador se mueve sin resetear zoom;
- conservar fallback textual si Mapbox nativo no carga;
- usar `followUserLocation` / cámara de Mapbox si está disponible;
- no bloquear acciones si el mapa falla.

### 5.2. Para pasajero

La pantalla debe sentirse como seguimiento real, no como ficha.

#### Estado inicial

```txt
Mapa ocupa 70-85% de pantalla
Bottom sheet contraído
```

#### Tocar mapa

Al tocar el mapa:

- se abre pantalla completa;
- se ocultan tarjetas secundarias;
- aparece botón “Cerrar”;
- aparece botón “Centrar taxi”;
- aparece barra inferior con llegada, conductor y placa.

#### Información visible sin expandir

- “Tu taxi llega en X min”
- conductor
- placa
- punto exacto
- botón llamar

#### Información en expansión

- vuelo
- hora
- destino
- código
- comprobante
- soporte

### 5.3. Instrucciones paso a paso

Para demo comercial no hace falta navegación real completa, pero sí debe verse como navegación.

Implementación por fases:

#### Fase visual inmediata

- generar instrucción superior según estado:
  - “Ve a Salida 3, columna F2”
  - “Sigue hacia Av. Pardo 123”
  - “Estás cerca del punto”
- usar distancia restante y duración ya calculadas;
- no agregar complejidad si no hay instrucciones reales.

#### Fase Mapbox real

Extender `packages/rutas`:

```txt
RouteResult
  steps?: RouteStep[]

RouteStep
  instruction: string
  distanceMeters: number
  durationSeconds: number
  maneuverType?: string
  modifier?: string
```

Mapbox Directions debe pedir:

```txt
steps=true
language=es
banner_instructions=true
voice_units=metric
geometries=geojson
overview=full
annotations=duration,distance
```

Parsear `routes[0].legs[].steps[]`.

Mantener fallback determinista sin steps.

---

## 6. Copiloto WhatsApp premium

### 6.1. Nombre de producto

No usar “WA Sim”.

Usar:

- “WhatsApp”
- “Bandeja WhatsApp”
- “Copiloto de reservas”
- “Modo seguro”

### 6.2. Modos

```txt
Modo seguro     -> determinista, activo siempre
Modo copiloto   -> demostrativo, apagado por defecto
Modo manual     -> operador crea o corrige
```

No mostrar “IA” como promesa central. La palabra “IA” puede existir en un toggle interno, no como mensaje comercial.

### 6.3. Política de confianza

Crear un módulo de decisión:

```txt
packages/ingesta/src/confidence-policy.ts
```

Reglas:

```txt
< 80%
  No crear reserva.
  Preguntar automáticamente datos faltantes.
  Mostrar al operador: “Faltan datos”.

80% - 94%
  No crear reserva todavía.
  Preguntar solo lo crítico.
  Si hay contradicción, pedir aclaración.

95% - 100% + campos obligatorios completos
  Mostrar resumen.
  Pedir confirmación explícita:
  “¿Confirmas esta reserva?”

Confirmación explícita del usuario
  Crear reserva.

Cualquier contradicción fuerte
  Pasar a operador.
```

Campos obligatorios:

- tipo de viaje;
- pasajero;
- teléfono;
- origen;
- destino;
- fecha y hora;
- forma de pago.

### 6.4. Mensajes automáticos sugeridos

#### Faltan datos

> Para reservarlo necesito un dato más: ¿a qué hora debe estar el taxi?

#### Datos casi completos

> Tengo casi todo. ¿Confirmas que el recojo es en Salida 3, columna F2 y el destino es Av. Pardo 123?

#### Resumen antes de crear

> Listo, te confirmo: recojo en Salida 3, columna F2, destino Av. Pardo 123, pasajero Ana Torres, vuelo LA2456.  
> ¿Confirmas la reserva?

#### Reserva creada

> Reserva confirmada.  
> Código: TG-2026-0001  
> Punto: Salida 3, columna F2  
> Sigue tu taxi aquí: /p/[token]

### 6.5. UI del copiloto

Panel lateral debe mostrar:

```txt
Reserva sugerida
- pasajero
- teléfono
- punto
- destino
- hora
- vuelo

Estado:
- Falta dato
- Listo para confirmar
- Confirmado
- Requiere operador
```

Ocultar:

- JSON
- porcentaje como elemento principal
- campos técnicos
- fuente técnica

Permitir “Ver detalle técnico” solo en acordeón.

---

## 7. QR, comprobante y revelado progresivo

### 7.1. Counter

Estado inicial:

```txt
Validar pasajero
[Escanear QR]
[Escribir código]
```

Después de escanear válido:

```txt
Pasajero encontrado
Nombre
Punto
Destino
Vuelo
[Confirmar acceso]
```

Después de confirmar:

```txt
Acceso confirmado
Este QR ya no puede usarse otra vez.
[Siguiente pasajero]
```

No mostrar:

- HMAC;
- idempotente;
- token;
- firma;
- payload;
- auditoría.

### 7.2. Comprobante pasajero

Antes de finalizar viaje:

- no mostrar comprobante.

Después de finalizar:

```txt
¿Necesitas comprobante?
[DNI opcional]
[Preparar comprobante]
```

Después de preparar:

```txt
Comprobante listo
[Descargar PDF]
```

No mostrar descargar antes de preparar.

### 7.3. QR descargable

Si existe una función de descargar QR:

- no mostrarla antes de validar;
- si el QR ya fue validado, mostrar solo si aporta valor;
- si no aporta al flujo, eliminarla o moverla a “Más opciones”.

---

## 8. Plan de mini-sprints

## Mini Sprint F0 — Auditoría read-only y mapa de superficies

### Objetivo

No tocar código. Entender todo.

### Lectura obligatoria

- `README.md`
- `CLAUDE.md`
- `docs/DOCUMENTACION_TECNICA.md`
- `docs/ESTADO_SPRINT_9.md`
- `docs/PLAN_RUTAS_TIEMPO_REAL_S9.md`
- `docs/DEUDA_TECNICA.md`
- `docs/GUIA_PRUEBAS_DEMO.md`
- `apps/web/src/app`
- `apps/web/src/components`
- `apps/driver/app`
- `apps/driver/src/components`
- `apps/driver/src/features`
- `packages/rutas`
- `packages/ingesta`
- `packages/ia`
- `packages/asignacion`

### Entregable

Crear un documento:

```txt
docs/PLAN_RENOVACION_FRONTEND_PREMIUM.md
```

Debe incluir:

- inventario de pantallas;
- copy prohibido detectado;
- componentes a modificar;
- cambios por prioridad;
- riesgos;
- plan de pruebas.

### Criterio de aceptación

Nada de código modificado salvo el documento.

---

## Mini Sprint F1 — Limpieza global de lenguaje y reglas UI

### Objetivo

Eliminar términos técnicos de todas las superficies visibles.

### Archivos probables

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/counter/*`
- `apps/web/src/app/p/[token]/*`
- `apps/web/src/app/admin/**/*`
- `apps/web/src/app/wa-sim/**/*`
- `apps/driver/app/**/*`
- `apps/driver/src/components/**/*`

### Tareas

1. Crear diccionario de copy.
2. Crear helper de estados humanos.
3. Reemplazar labels técnicos.
4. Mover información técnica a `DebugDetails`.
5. Mantener tests verdes.

### Criterio de aceptación

- No aparece “ETA” en UI visible.
- No aparece “Realtime” en UI visible.
- No aparece “Polling” en UI visible.
- No aparece “HMAC” en UI visible.
- No aparece “Score” ni “pesos” en UI visible.
- No aparece “cola” en UI visible, salvo documentación técnica o debug oculto.

---

## Mini Sprint F2 — Pasajero map-first

### Objetivo

Convertir `/p/[token]` en una experiencia centrada en mapa.

### Archivos probables

- `apps/web/src/app/p/[token]/seguimiento-cliente.tsx`
- nuevos componentes bajo `apps/web/src/app/p/[token]/components`

### Tareas

1. Extraer `PassengerMap`.
2. Crear `PassengerMapHero`.
3. Crear `PassengerBottomSheet`.
4. Agregar modo pantalla completa al tocar mapa.
5. Mover conductor, unidad, punto, destino y vuelo al bottom sheet.
6. Mostrar solo lo importante contraído.
7. Hacer que comprobante, calificación y soporte aparezcan según estado.
8. Ocultar descarga de PDF hasta que exista.
9. Eliminar coordenadas visibles.
10. Mantener fallback humano si mapa falla.

### Criterio de aceptación

- En móvil, el primer impacto visual es el mapa.
- El usuario ve conductor, placa, llegada y punto sin hacer scroll.
- Los detalles secundarios están ocultos o colapsados.
- No hay tarjetas apiladas compitiendo con el mapa.

---

## Mini Sprint F3 — Conductor modo navegación

### Objetivo

Convertir `apps/driver/app/(auth)/asignacion/[id].tsx` en navegación full-screen.

### Archivos probables

- `apps/driver/app/(auth)/asignacion/[id].tsx`
- `apps/driver/src/components/map/AssignmentMap.tsx`
- `apps/driver/src/components/navigation/*`
- `apps/driver/src/features/routing/use-route.ts`

### Tareas

1. Eliminar `ScrollView` como estructura principal.
2. Crear `DriverNavigationScreen`.
3. Crear mapa absoluto full-screen.
4. Crear banner superior.
5. Crear bottom sheet.
6. Crear action bar fija.
7. Mantener secuencia de estados existente.
8. Agregar botón recentrar.
9. No resetear zoom por cada posición.
10. Preservar fallback textual.

### Criterio de aceptación

- La pantalla parece una navegación real.
- El conductor no necesita hacer scroll para la acción principal.
- La acción siguiente siempre está visible.
- El mapa no bloquea el flujo si falla.

---

## Mini Sprint F4 — Counter premium y QR progresivo

### Objetivo

Hacer que el counter sea directo, elegante y sin tecnicismos.

### Archivos probables

- `apps/web/src/app/counter/page.tsx`
- `apps/web/src/app/counter/voucher-validator.tsx`

### Tareas

1. Cambiar título a “Validar pasajero”.
2. Cámara como primera acción.
3. Código manual como alternativa.
4. Eliminar HMAC, idempotente, token.
5. Mostrar resultado solo después de validar.
6. Mostrar confirmar solo con QR válido.
7. Mostrar siguiente pasajero después de confirmar.
8. Ocultar secciones futuras no implementadas.

### Criterio de aceptación

- El counter puede usarse sin explicación.
- No hay botones innecesarios antes del estado correcto.
- El operador sabe qué hacer en cada momento.

---

## Mini Sprint F5 — WhatsApp copiloto premium

### Objetivo

Convertir el simulador en una bandeja WhatsApp con copiloto seguro.

### Archivos probables

- `apps/web/src/app/wa-sim/whatsapp-simulator.tsx`
- `apps/web/src/app/wa-sim/actions.ts`
- `packages/ingesta/src/extractor.ts`
- nuevo `packages/ingesta/src/confidence-policy.ts`
- tests de ingesta y e2e WhatsApp

### Tareas

1. Cambiar nombre visual de “WA Sim” a “WhatsApp”.
2. Crear panel “Reserva sugerida”.
3. Ocultar JSON por defecto.
4. Implementar política de confianza.
5. Preguntar datos faltantes automáticamente.
6. Exigir confirmación explícita antes de crear.
7. Al crear, simular envío de link, código y QR.
8. Casos raros pasan a operador.

### Criterio de aceptación

- No se crea reserva sin confirmación.
- El flujo muestra por qué falta algo sin lenguaje técnico.
- El operador no ve JSON salvo que lo abra.
- El copiloto se siente útil, no riesgoso.

---

## Mini Sprint F6 — Despacho simplificado

### Objetivo

Reducir ruido en `/admin` y detalle de reserva.

### Archivos probables

- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/components/admin/admin-reservas-live.tsx`
- `apps/web/src/app/admin/reservas/[id]/page.tsx`
- `apps/web/src/app/admin/reservas/[id]/reserva-detalle.tsx`
- `apps/web/src/app/admin/reservas/[id]/sugerencia-card.tsx`

### Tareas

1. Quitar `/admin` visual.
2. Ocultar tenant/email de sesión.
3. Reemplazar tabla densa por lista clara o tabla más limpia.
4. Agrupar campos del detalle.
5. Cambiar “Copiloto recomienda” a una tarjeta humana.
6. Ocultar score/pesos/cola en detalle técnico.
7. Simplificar acciones.

### Criterio de aceptación

- El operador entiende qué reserva atender.
- La recomendación del copiloto se entiende sin saber de algoritmos.
- Los detalles técnicos no contaminan la pantalla principal.

---

## Mini Sprint F7 — Soporte, calificación y comprobante

### Objetivo

Hacer que el cierre del viaje sea simple y elegante.

### Tareas

1. Calificación en una sola pregunta inicial.
2. Detalles solo si algo fue malo.
3. Comprobante progresivo.
4. Objeto olvidado con texto corto.
5. Caso creado con seguimiento claro.
6. No saturar al pasajero al finalizar.

### Criterio de aceptación

- Después del viaje, el pasajero ve máximo 2 acciones.
- El formulario no parece trámite.
- El soporte se siente humano.

---

## Mini Sprint F8 — Pruebas, demo comercial y cierre

### Objetivo

Validar que no se rompió nada.

### Comandos obligatorios

```bash
pnpm turbo run typecheck lint test build
pnpm e2e
pnpm --filter @taxigreen/driver exec expo export --platform android
```

### Smoke manual obligatorio

- `/`
- `/wa-sim`
- `/counter`
- `/admin`
- `/admin/reservas/[id]`
- `/p/tg_demo_passenger_001`
- app driver login
- app driver home
- app driver asignación activa
- flujo QR
- flujo comprobante
- flujo objeto olvidado

### Criterio de aceptación

- Sin errores de TypeScript.
- Sin tests rotos.
- Sin términos prohibidos en UI visible.
- Mapa pasajero grande.
- Mapa conductor full-screen.
- Counter progresivo.
- WhatsApp copiloto con confirmación.
- Documentación actualizada.

---

## 9. Prompt listo para pegar en Opus / Codex

```txt
Actúa como ingeniero senior, arquitecto frontend senior y diseñador de producto senior.

Debes trabajar en el repo `demo-taxigreen`. Antes de modificar código, lee exhaustivamente:

- README.md
- CLAUDE.md
- docs/DOCUMENTACION_TECNICA.md
- docs/ESTADO_SPRINT_9.md
- docs/PLAN_RUTAS_TIEMPO_REAL_S9.md
- docs/DEUDA_TECNICA.md
- docs/GUIA_PRUEBAS_DEMO.md
- 07_PLAN_EJECUCION/PLAN_SOFTWARE.md
- 07_PLAN_EJECUCION/SPRINT.md
- apps/web/src/app
- apps/web/src/components
- apps/driver/app
- apps/driver/src/components
- apps/driver/src/features
- packages/rutas
- packages/ingesta
- packages/ia
- packages/asignacion

Misión:
Renovar el frontend de Taxi Green para que la demo sea ultra simple, premium, humana, intuitiva y entendible sin manual.

Regla máxima:
Si una pantalla necesita explicación, está mal.

No debes rehacer el producto desde cero. Debes conservar la arquitectura actual, tests, flujo protagonista y decisiones cerradas.

No tocar:
- plugin Figma;
- schema de base de datos salvo necesidad justificada;
- reglas de negocio cerradas;
- patrón determinista primero;
- fallback de rutas;
- secuencia de estados del conductor;
- QR de un solo uso.

Prioridades:
1. Eliminar términos técnicos de UI visible.
2. Rediseñar pasajero `/p/[token]` como experiencia map-first.
3. Rediseñar app conductor activa como navegación full-screen.
4. Simplificar counter con revelado progresivo.
5. Convertir WhatsApp simulator en bandeja premium con copiloto seguro.
6. Simplificar despacho y detalle de reserva.
7. Hacer comprobante/calificación/soporte progresivos.
8. Mantener todo verde.

Términos prohibidos en UI visible:
ETA, Realtime, Polling, HMAC, idempotente, token, tenant, JSON, algoritmo, LLM, score, pesos, cola, match, pax, auditoría, sprint, WA Sim, fallback, fuente, estimación, routing, endpoint, dev client, coordenadas.

Reemplaza con lenguaje humano:
- ETA -> Llega en
- Realtime -> En vivo
- Polling -> Actualizando
- HMAC -> QR protegido
- idempotente -> de un solo uso
- cola -> turno
- score/pesos -> motivos
- algoritmo -> modo seguro
- WA Sim -> WhatsApp
- estimación -> calculando ruta

Flujo mapa:
- Pasajero: mapa grande, bottom sheet deslizable, fullscreen al tocar mapa.
- Conductor: mapa full-screen estilo navegación, banner superior, bottom sheet, acción fija.
- No apilar tarjetas una tras otra en viaje activo.
- La información secundaria va en bottom sheet o “Ver detalles”.

Counter:
- Primero solo validar.
- Luego mostrar datos.
- Luego confirmar acceso.
- Luego siguiente pasajero.
- No mostrar acciones prematuras.

WhatsApp copiloto:
- Menos de 80% de confianza: preguntar faltantes.
- 80%-94%: pedir aclaración crítica.
- 95%-100% + campos completos: mostrar resumen y pedir confirmación.
- Crear reserva solo con confirmación explícita.
- Si hay contradicción o riesgo: operador humano.
- Al crear: simular envío de link pasajero, código y QR.

Proceso:
1. Haz auditoría read-only.
2. Entrega inventario de pantallas y problemas.
3. Implementa por mini-sprints, no todo mezclado.
4. Mantén cambios pequeños y verificables.
5. Al final corre:
   - pnpm turbo run typecheck lint test build
   - pnpm e2e
   - pnpm --filter @taxigreen/driver exec expo export --platform android
6. Actualiza docs:
   - docs/PLAN_RENOVACION_FRONTEND_PREMIUM.md
   - docs/DEUDA_TECNICA.md si aparece deuda
   - docs/ESTADO_RENOVACION_FRONTEND.md

Formato de entrega:
- resumen ejecutivo;
- archivos cambiados;
- decisiones tomadas;
- pruebas ejecutadas con resultado;
- riesgos restantes;
- próximos pasos.

No entregues una solución cosmética. El resultado debe parecer producto premium real.
```

---

## 10. Checklist final de aceptación

### Copy

- [ ] No hay “ETA” visible.
- [ ] No hay “Realtime” visible.
- [ ] No hay “Polling” visible.
- [ ] No hay “HMAC” visible.
- [ ] No hay “idempotente” visible.
- [ ] No hay “Score” visible.
- [ ] No hay “pesos” visible.
- [ ] No hay “cola” visible.
- [ ] No hay “WA Sim” visible.
- [ ] No hay “JSON” visible salvo drawer técnico.
- [ ] No hay coordenadas visibles para pasajero.

### Pasajero

- [ ] Mapa ocupa la mayor parte de la pantalla.
- [ ] Se puede abrir mapa en pantalla completa.
- [ ] Bottom sheet tiene estados contraído / medio / completo.
- [ ] Conductor, placa, llegada y punto se ven sin scroll.
- [ ] Vuelo/reserva/comprobante están en detalles.
- [ ] PDF solo aparece cuando está listo.
- [ ] Soporte aparece sin saturar.

### Conductor

- [ ] No hay scroll principal en viaje activo.
- [ ] Mapa full-screen.
- [ ] Acción principal siempre visible.
- [ ] Bottom sheet contiene los datos secundarios.
- [ ] Botón recentrar.
- [ ] Fallback no rompe el flujo.
- [ ] Estados secuenciales preservados.

### Counter

- [ ] Pantalla inicial solo valida.
- [ ] Confirmar aparece solo si QR válido.
- [ ] Siguiente pasajero aparece solo después de confirmar.
- [ ] No hay lenguaje técnico.
- [ ] Cámara prioritaria.

### WhatsApp

- [ ] “WA Sim” reemplazado por “WhatsApp”.
- [ ] Copiloto no crea sin confirmación.
- [ ] Faltantes se preguntan automáticamente.
- [ ] JSON oculto.
- [ ] Modo IA apagado por defecto.
- [ ] Modo seguro determinista activo.

### Admin

- [ ] Lista de reservas limpia.
- [ ] Detalle agrupado.
- [ ] Copiloto humano.
- [ ] Score/pesos/cola ocultos.
- [ ] Acciones claras.

### Pruebas

- [ ] `pnpm turbo run typecheck lint test build`
- [ ] `pnpm e2e`
- [ ] `pnpm --filter @taxigreen/driver exec expo export --platform android`
- [ ] Smoke manual web.
- [ ] Smoke manual app conductor.
- [ ] Smoke QR.
- [ ] Smoke WhatsApp copiloto.

---

## 11. Criterio de dureza

No aprobar si:

- el mapa sigue siendo una tarjeta pequeña;
- el conductor sigue usando scroll durante el viaje;
- el pasajero ve muchas tarjetas antes del mapa;
- aparecen términos técnicos;
- hay dos botones principales compitiendo;
- el counter muestra acciones antes de validar;
- el copiloto crea reserva sin confirmación explícita;
- se pierde el fallback determinista;
- se rompe la secuencia de estados;
- se rompen pruebas;
- se toca el plugin Figma;
- se mezcla todo en un único cambio gigante sin trazabilidad.

La renovación debe sentirse como producto, no como documentación interactiva.

# Auditoria Figma WOW - Taxi Green

## Alcance revisado

- Plugin actual: `figma-plugin-taxigreen-master` genera 14 paginas desde cero y usa `documentAccess: dynamic-page`.
- Inventario: 64 pantallas/estados definidos en `code.js`; `screens.master.json` documenta 62 pantallas funcionales mas 4 estados.
- Prototipo: no hay targets rotos por id; el cableado se registra mediante `registerAction()` y se materializa con `setReactionsAsync()` + `actions[]`.
- Skill discovery: se uso `find-skills` y se verifico el CLI local (`npx skills find [query]`). La busqueda remota quedo en spinner sin devolver resultados; localmente solo estan instaladas `find-skills` de proyecto y global. No se instalaron skills nuevas.

## Que esta bien actualmente

- Arquitectura del plugin limpia: reset de archivo, paginas separadas, helpers reutilizables y carga de fuentes.
- Compatibilidad correcta con Figma actual: `documentAccess: dynamic-page`, `loadAllPagesAsync()`, `setReactionsAsync()` y `actions[]`.
- Cobertura amplia de superficies: pasajero, conductor, despachador, counter, empresa, WhatsApp, bienestar y estados.
- Registro centralizado de pantallas y acciones, lo que permite auditar targets.
- La capa de Bienestar ya existe con paleta propia, cola de incidencias, detalle y constancia.
- El flujo de pasajero tiene estados G1-G5, lo cual permite vender tracking sin app.

## Que se ve promedio

- La portada funciona como resumen, pero no como venta ejecutiva. Falta dramatizar la operacion aeroportuaria, la promesa comercial y el alcance real/simulado/aplazado.
- `13 Prototype` presenta tres cards equivalentes; no ordena la demo como una narrativa de 12 minutos con un flujo protagonista.
- Muchas pantallas son tarjetas genericas con listas de texto; se sienten mas blueprint que producto premium.
- El mapa actual es una reticula abstracta; no comunica aeropuerto, ruta, puntos operativos ni tracking vivo.
- El WhatsApp muestra chat y extraccion, pero la dualidad "canal del cliente + cocina del copiloto" todavia no tiene suficiente presencia visual.
- La app conductor es funcional, pero no parece una app nativa de trabajo con botones enormes, baja friccion y estados dominantes.
- Los vouchers/QR y constancias son declarativos; no parecen piezas reales emitidas por una operacion formal.
- La empresa cliente tiene mas peso del que el PLAN_SOFTWARE v4 permite para la demo protagonista.

## Pantallas con mayor potencial comercial

- `10 Simulador WhatsApp / 12.A-12.C`: demuestra "canal del cliente primero" y copiloto con aprobacion humana.
- `07 Admin Operativo / 3.B-3.C`: demuestra operacion viva y humano en control.
- `06 App Conductor / 2.C-2.G`: demuestra adopcion realista del conductor.
- `05 PWA Pasajero / 1.G2-1.G5`: demuestra pasajero sin app, tracking y comprobante.
- `11 Bienestar / 13.A-13.K`: demuestra bienestar como promesa y diferenciacion frente a apps genericas.
- `08 Counter Supervisor / 4.B-4.C`: soporte secundario para cobertura aeropuerto.

## Hero screens propuestas

- `00 Cover`: portada ejecutiva "Taxi Green Airport Ops Premium".
- `13 Prototype`: mapa narrativo de demo con una ruta A-Z protagonista.
- `10 Simulador WhatsApp / 12.B`: extraccion completa + borrador + aprobacion humana.
- `07 Admin Operativo / 3.B`: torre de control viva del dia.
- `07 Admin Operativo / 3.C`: asignacion humana con sugerencia explicable.
- `06 App Conductor / 2.C`: nueva asignacion con decision rapida.
- `05 PWA Pasajero / 1.G2`: link de tracking premium sin app.
- `05 PWA Pasajero / 1.G5`: cierre con comprobante y calificacion.
- `11 Bienestar / 13.F-13.G`: cola y resolucion de objeto perdido.

## Conexiones debiles o faltantes

- Inicio de demo en `13 Prototype`: existe, pero no prioriza un unico flujo protagonista.
- WhatsApp `12.B` salta directo a `dispatch.3C`; `12.C Reserva creada` queda sin inbound target y se pierde el momento voucher.
- `dispatch.3C -> driver.2C` existe, pero no queda claro que el operador aprobo la sugerencia.
- `driver.2G` vuelve a `driver.2B`; el flujo comercial deberia continuar hacia tracking/fin del pasajero para cerrar la historia.
- `pwa.passenger.1G2` tiene "Compartir mi viaje" apuntando a `1.G4`, saltandose llegada y encuentro.
- `wellbeing.13A -> 13B -> 13C` deja al pasajero ver resolucion directa; para la demo comercial conviene llevar tambien a cola/despacho y resolucion humana.
- `wellbeing.13G -> wellbeing.13C` cruza de desktop a mobile sin explicitar que es vista del pasajero; debe haber microcopy y un cierre mas realista.
- Back buttons usan accion `BACK` real, pero no todos los desktop tienen una ruta visible de retorno. Se reforzaran acciones clave.

## Contradicciones con PLAN_SOFTWARE.md v4

- La demo actual reparte protagonismo entre tres flujos; v4 exige UN flujo A-Z en 12 minutos.
- Aun existe foco amplio en empresa, reportes y multiples superficies; v4 dice que eso se enuncia, no roba protagonismo.
- El flujo protagonista correcto empieza en Hotel/WhatsApp, no en formulario de pasajero por enlace.
- La app conductor en v4 es React Native + Expo; la demo Figma puede mostrar app, pero debe evitar hablar como PWA conductor principal.
- La capa de IA debe ser agnostica con fallback determinista visible; el diseño actual menciona copiloto, pero no distingue construido/simulado/aplazado con suficiente honestidad.
- Bienestar en demo es una sola incidencia simplificada, objeto olvidado; el plugin muestra mas tipologias como si fueran equivalentes.

## Contradicciones con DISEÑO_UI_DETALLADO.md

- Se incumple a ratos "una sola accion primaria" por exceso de botones equivalentes en acciones inferiores.
- Los mapas y vouchers no alcanzan el nivel de componente definido.
- Falta una sensacion clara de componentes con variantes reales; hoy hay frames ejemplares, no suficientes componentes Figma reutilizables.
- El simulador WhatsApp no tiene todavia layout dual fuerte ni banner de transparencia visual suficientemente protagonista.
- La capa Bienestar usa buen tono, pero algunas pantallas aun se sienten mas ticketera que acompanamiento humano.
- Las pantallas desktop usan estructura uniforme; despacho y counter deberian sentirse como operacion viva, no dashboard generico.

## Direccion de arte propuesta

**Taxi Green Airport Ops Premium**

- Base visual: verde profundo Taxi Green como autoridad, verde vivo como estado operativo, amarillo del logo como atencion selectiva, neutros calidos para calma y confianza.
- Fondos: capas sobrias tipo cabina/torre de control, bandas sutiles y superficies claras; sin gradientes decorativos excesivos.
- Tarjetas: bordes finos, radios contenidos, sombras elegantes y mayor jerarquia por densidad, no por decoracion.
- Mapas: mas creibles, con agua/costa, vias principales, ruta, pines, halos de conductor y etiquetas operativas.
- Estados de viaje: timeline visual y proximo paso siempre visible.
- Voucher/QR: pieza realista con codigo, QR construido con rectangulos, datos de viaje, comprobante y sello.
- WhatsApp: dos mundos evidentes: chat del cliente a la izquierda, cocina del copiloto y aprobacion humana a la derecha.
- Conductor: UI grande, nativa, estado dominante, CTA enorme, sin ruido.
- Pasajero: link sobrio, premium y tranquilizador; mapa + conductor + placa + ETA.
- Bienestar: cuidado humano, SLA visible y trazabilidad sin tono policial.

## Cambios a implementar y por que

1. Reescribir portada y `13 Prototype` para vender la narrativa correcta: Hotel/WhatsApp -> copiloto -> operador -> conductor -> pasajero sin app -> comprobante -> objeto olvidado -> resolucion.
2. Crear componentes visuales mas especificos en `code.js`: hero step, airport map, driver card, trip card, voucher QR, incident card y componentes reales Figma cuando sea viable.
3. Pulir tokens, sombras, radios, botones, badges y tarjetas para que el archivo se sienta premium y consistente.
4. Mejorar logo vectorial si no se embebe `logo.jpg`: circulo verde, G blanca fuerte, flecha amarilla y sombra sobria. Se evitara red externa.
5. Reforzar pantallas protagonista sin agregar volumen innecesario: WhatsApp, despacho, asignacion, conductor, tracking pasajero, fin de viaje, objeto olvidado, cola, resolucion.
6. Corregir cableado real: incluir `12.C`, conectar conductor con tracking/fin de pasajero, llevar objeto perdido a cola de incidencias y volver a resolucion.
7. Actualizar `screens.master.json` solo si cambia la narrativa/cableado documentado, manteniendo inventario sin inflar pantallas.

## Ajuste por feedback de narrativa

- El primer punto de contacto se reencuadra como **canal de entrada**, no como PWA. La pantalla `1.A` pasa a mostrar WhatsApp, web publica, QR/counter y recepcion/hotel como origenes posibles.
- El pasajero sigue usando un link, pero ese link aparece **despues** de la reserva: tracking, voucher, comprobante y bienestar.
- El rol administrador queda nombrado como **Admin operativo**: Carla valida sugerencias, asigna conductor, atiende incidencias y conserva trazabilidad.
- La capa Bienestar se presenta integrada al cierre del viaje y a la cola del admin operativo; no como adorno separado.
- Los fondos de pantallas pasan a lienzos suaves con matices (`canvasChannel`, `canvasPassenger`, `canvasOps`, `canvasMint`, `care50`) para evitar una sensacion blanca generica.

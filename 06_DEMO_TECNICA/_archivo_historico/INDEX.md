# Carpeta `06_DEMO_TECNICA` — Índice de entregables

Esta carpeta contiene los entregables técnicos derivados del análisis de la visión.

> **Estado epistémico de toda la carpeta**: `Propuesta integrada` derivada de `05_FINAL/vision_final_perfecta.md` (esencia y principios), `04_SINTESIS_TRABAJO/vision_final_taxigreen_refinada.md` (las 5 caras del copiloto y el alcance) y la nueva capa transversal de Bienestar añadida a la visión. No es decisión cerrada con el cliente.

## Documentos

### 1. [`PLAN_SOFTWARE_DEMO.md`](./PLAN_SOFTWARE_DEMO.md) — Plan técnico para construir la demo real

Cubre:
- Alcance: qué se construye real, qué se simula, qué queda fuera.
- Stack elegido con justificación (Next.js 15 + Postgres + Claude API + Mapbox).
- Arquitectura modular (no microservicios) y multi-tenant.
- Modelo de datos completo (15+ tablas incluyendo capa de Bienestar).
- Diseño técnico de la capa transversal de Incidencias (state machine, SLAs, auditoría).
- Seguridad, RBAC, observabilidad, deploy.
- Plan día por día de 18–22 días de construcción.
- Guion de presentación de 15 minutos con dos arcos narrativos (viaje normal + objeto perdido).
- Riesgos y mitigaciones.

**Usarlo cuando**: planifiques los sprints, decidas qué construir en qué orden, o presentes el alcance al cliente.

### 2. [`DISEÑO_UI_DETALLADO.md`](./DISEÑO_UI_DETALLADO.md) — Blueprint exhaustivo de UI/UX

Cubre:
- Filosofía de diseño (serio, cálido, transparente).
- Sistema de diseño completo: paletas (marca, neutros, semánticos, Bienestar `care/*`), tipografía Inter + JetBrains Mono con escala, espaciado, radios, sombras, motion, breakpoints.
- Iconografía (lucide-react + 4 pictogramas custom).
- Componentes base con todos los estados: botones, inputs, selects, switches, checkboxes, radios, tarjetas, listas, modales, bottom sheets, toasts, badges, chips, avatares, tablas, skeletons, empty states, progress, tooltips, steppers, mapa.
- Patrones de layout por superficie.
- Accesibilidad (WCAG AA verificado).
- Voz, tono y microcopy con glosario.
- Pantalla por pantalla de las 5 caras:
  - **Pasajero PWA**: landing, reserva 4 pasos, confirmación, mi viaje (5 sub-estados), mis reservas, ayuda, perfil.
  - **Conductor PWA**: login, libre, asignación, en camino, esperando, en viaje, finalizar, historial, perfil.
  - **Despachador web**: dashboard, reservas, mapa en vivo, conductores, ingesta multicanal, reportes, configuración.
  - **Counter supervisor**: torre de control de vuelos.
  - **Empresa cliente**: resumen, viajes, colaboradores, facturación.
- Simulador WhatsApp dual (chat + "cocina del copiloto").
- Capa de Bienestar — pantallas concretas para reportar objeto perdido, queja, incidente de seguridad; cola del despachador; vista del conductor; constancia PDF.
- Flujos completos paso a paso.
- Estados vacíos, error, loading, offline.
- Notas para Figma y handoff a desarrollo.

**Usarlo cuando**: maquetes en Figma, escribas componentes en código, o necesites resolver alguna duda de UX.

### 3. [`../05_FINAL/vision_final_perfecta.md`](../05_FINAL/vision_final_perfecta.md) — Visión actualizada con capa de Bienestar

La visión principal ahora incluye la sección **3.bis — Capa transversal de Bienestar y resolución de incidencias** con principios, 10 categorías de incidencia, flujos detallados, justificación estratégica, métricas de bienestar (TPR, TR, % cierre con confirmación positiva, NPS post-incidente) y delimitación de qué entra en demo vs roadmap. También se actualizó la tabla de actores y se añadieron los principios 11 "Bienestar como promesa" y 12 "Seguridad antes que velocidad".

**Usarlo cuando**: presentes al cliente la filosofía, defiendas decisiones de scope, o vuelvas a alinear al equipo sobre por qué este producto es diferente.

## Flujos estrella de la demo

Los tres flujos que el plan y el diseño cubren end-to-end:

1. **Reserva nueva por enlace** — del QR del aeropuerto al comprobante en el correo, con tracking en vivo.
2. **Objeto perdido** — del fin de viaje al cierre del caso en horas, con constancia y confirmación del pasajero. Estrella diferenciadora.
3. **Ingesta multicanal con copiloto** — del mensaje suelto de WhatsApp a la reserva confirmada en el sistema, con extracción asistida y aprobación humana.

## Próximos pasos sugeridos

1. **Validación con el cliente Taxi Green** sobre las hipótesis marcadas como `Por validar` en los tres documentos (especialmente: tarifa fija siempre o estimada, política de cancelación, marco de seguridad y eventual contacto con autoridades, política de privacidad para empresas).
2. **Wireframes baja fidelidad en Figma** siguiendo §16 de `DISEÑO_UI_DETALLADO.md`.
3. **Setup de repositorio** según §11 de `PLAN_SOFTWARE_DEMO.md` y arranque de día 1.
4. **Prototipo navegable Figma** de los tres flujos estrella para una primera validación visual antes de codificar.

## Lo que falta y conviene priorizar

- **Roadmap de validación comercial**: el archivo `05_FINAL/roadmap_validacion.md` está vacío. Sería el cuarto pilar — define qué medir tras la demo y cómo decidir si pasar a piloto pagado.
- **Preguntas para el cliente**: `05_FINAL/preguntas_para_cliente.md` también está vacío. Conviene listar 10–15 preguntas críticas a llevar a la próxima reunión.
- **Pitch de reunión**: `05_FINAL/pitch_reunion.md` vacío. El guion de 15 min de `PLAN_SOFTWARE_DEMO.md §12` puede ser su base.

Si alguno de estos tres documentos vacíos te resulta útil ahora, dime cuál y lo armo siguiendo la misma disciplina epistémica.

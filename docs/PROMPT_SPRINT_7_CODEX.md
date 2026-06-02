# Prompt Sprint 7 — Taxi Green Demo

Uso: copiar y pegar este bloque para ejecutar solo Sprint 7. No iniciar Sprint 8 sin nueva instrucción.

```text
Trabajas en el monorepo de la demo de Taxi Green, en /home/jose/dev/demo-taxigreen.
Eres full-stack senior con experiencia real en React Native + Expo, Mapbox nativo, ubicación foreground, APIs
seguras para mobile y Realtime.
Ejecuta SOLO Sprint 7. No empieces Sprint 8.

ANTES DE TOCAR CÓDIGO, LEE EN ESTE ORDEN:
1. CLAUDE.md
2. AGENTS.md
3. docs/ESTADO_SPRINT_6.md
4. docs/ESTADO_SPRINT_5.md
5. docs/DOCUMENTACION_TECNICA.md
6. docs/GUIA_PRUEBAS_DEMO.md
7. 07_PLAN_EJECUCION/SPRINT.md §Sprint 7
8. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §2.6, §7.2 y decisiones de app conductor
9. _FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md
10. _FUENTE_DESARROLLO/GLOSARIO_FLUJOS_TAXIGREEN.md
11. _FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md
12. apps/driver actual, apps/web/src/app/api/conductor/*, apps/web/src/lib/conductor-token.ts,
    apps/web/src/lib/supabase/server.ts y apps/web/src/app/admin/reservas/[id]/actions.ts

DECISIONES CERRADAS:
- S0-S6 están cerrados. No desordenes schema, seed, voucher, PDF, auditoría, /admin, /wa-sim, la heurística S5 ni el
  contrato móvil S6.
- App conductor = React Native + Expo SDK 51. No usar Capacitor.
- Pasajero sigue siendo link /p/[token], no app nativa.
- Humano en control: /admin asigna; la app conductor acepta/avanza estados, no recalcula ni redescubre conductor/unidad.
- S6 ya tiene login email+PIN, JWT Bearer en SecureStore, registro push degradable, Realtime `conductor-{id}` y
  placeholder /asignacion/[id].
- S7 completa la asignación activa: datos, mapa, estados de viaje, ubicación foreground y APIs móviles.
- Android físico/Expo Go es parte del cierre. iOS queda fuera de demo.

ALCANCE = SOLO SPRINT 7:
Completar la pantalla de asignación activa del conductor y el backend móvil de estados.

ENTREGABLES CORE:
1. apps/web:
   - GET /api/conductor/asignacion/[id]: Bearer conductor, tenant-safe, devuelve solo reservas asignadas al conductor.
     Debe incluir pasajero, vuelo, origen, punto_encuentro, destino, voucher, tipo_viaje, fecha_hora_servicio,
     estado_reserva, viaje actual, conductor y unidad.
   - POST /api/conductor/asignacion/[id]/estado {estado_nuevo}: Bearer conductor, valida transición secuencial:
     asignado -> en_camino -> en_punto -> a_bordo -> finalizado. Actualiza viaje.estado y reservas.estado cuando aplique:
       en_camino/en_punto/a_bordo => reserva.en_curso
       finalizado => reserva.por_liquidar o finalizada según plan vigente; si hay duda, elegir por_liquidar por
       CLAUDE.md §4.4/§4.5 y documentarlo.
     Registra auditoría por cada cambio y emite broadcast en `reserva-{id}`.
   - No crear tablas nuevas. Usar viajes/reservas existentes.
2. apps/driver:
   - app/(auth)/asignacion/[id].tsx deja de ser placeholder:
     - carga detalle vía GET anterior;
     - header claro con pasajero, vuelo, voucher, punto "Salida 3, columna F2";
     - mapa @rnmapbox/maps con marcador conductor, punto de recojo y destino;
     - si falta token Mapbox, degradar a panel de ruta textual sin romper acciones;
     - botones gigantes secuenciales: "En camino" -> "Llegué" -> "Pasajero a bordo" -> "Servicio terminado".
   - src/features/location:
     - solicitar permiso foreground;
     - watchPositionAsync mientras viaje activo, timeInterval 3000 y distanceInterval 10;
     - emitir broadcast `posicion` al canal `reserva-{id}` con lat/lng/heading/speed/ts;
     - cleanup al salir o finalizar.
   - src/features/assignment o equivalente:
     - tipos y cliente para GET/POST de asignación;
     - estado local optimista solo después de respuesta OK, sin saltar pasos.
   - UX conductor 45-60: texto grande, botones min 64px, una acción primaria visible, nada de ruido.
3. Seguridad:
   - Todo endpoint conductor usa `verifyConductorToken`.
   - Ningún conductor puede leer o modificar reserva de otro conductor/tenant.
   - No exponer hashes ni datos internos.
4. Tests:
   - Unit tests de transición de estados si extraes helper.
   - Tests web de auth Bearer/tenant si aplica.
   - E2E web existente sigue verde.
   - Smoke manual documentado para Android/Expo.

CRITERIOS DE ACEPTACIÓN:
- Login `conductor1@taxigreen.demo / 1234` entra a Home.
- Desde /admin, asignar reserva al conductor; Home recibe asignación por Realtime.
- Abrir /asignacion/[id] muestra datos del protagonista y ruta aeropuerto -> Av. Pardo 123.
- Pulsar secuencia completa cambia estado backend y se refleja en /admin/auditoria.
- Ubicación foreground emite `posicion` por Supabase Realtime mientras el viaje está activo.
- Sin Mapbox token, la pantalla sigue operable con ruta textual.
- `pnpm turbo run typecheck lint test build` verde.
- `pnpm e2e` verde.
- Documentar si Android físico/push/location real no pudo probarse por entorno.

REGLAS NO NEGOCIABLES:
- No construir app pasajero.
- No implementar tracking pasajero /p/[token] en S7; eso es S8.
- No tocar la decisión determinista de asignación S5.
- No introducir RLS ni nuevas tablas.
- No usar AsyncStorage para JWT.
- No activar background location; solo foreground.
- No permitir saltos de estado ni acciones idempotentes peligrosas sin validación.

CIERRE:
- Crear docs/ESTADO_SPRINT_7.md con implementado, verificación, bugs/mejoras y pendientes reales.
- Actualizar docs/GUIA_PRUEBAS_DEMO.md con el flujo conductor S7.
- Dejar docs/PROMPT_SPRINT_8_CODEX.md listo.
- Actualizar docs/DOCUMENTACION_TECNICA.md, CLAUDE.md y AGENTS.md si cambia el estado operativo.
- Detenerte al terminar Sprint 7. No empieces Sprint 8.
```

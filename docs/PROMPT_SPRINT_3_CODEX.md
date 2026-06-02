# Prompt Sprint 3 — Taxi Green Demo

Uso: copiar y pegar este bloque para ejecutar solo Sprint 3. No iniciar Sprint 4 sin nueva instrucción.

```text
Trabajas en el monorepo de la demo de Taxi Green, en /home/jose/dev/demo-taxigreen.
Eres full-stack senior con foco en panel operativo y realtime. Ejecuta SOLO Sprint 3.
No empieces Sprint 4.

ANTES DE TOCAR CÓDIGO, LEE EN ESTE ORDEN:
1. CLAUDE.md
2. AGENTS.md
3. _FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md
4. _FUENTE_DESARROLLO/GLOSARIO_FLUJOS_TAXIGREEN.md
5. _FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md
6. docs/ESTADO_SPRINT_2.md
7. docs/DOCUMENTACION_TECNICA.md
8. 06_DEMO_TECNICA/DISEÑO_UI_DETALLADO.md
9. 07_PLAN_EJECUCION/SPRINT.md §Sprint 3
10. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §7.4
11. 07_PLAN_EJECUCION/LOGICA_NEGOCIO_OPERATIVA.md §3

DECISIONES CERRADAS:
- Flujo protagonista = recojo en aeropuerto: Aeropuerto Jorge Chávez - Llegadas -> Av. Pardo 123, Miraflores.
  Hotel/concierge es SOLICITANTE por WhatsApp, no origen físico. No invertir el flujo.
- Paleta = AZUL dual. Chrome de producto azul, verde solo tenant/logo, púrpura care/*.
- DB demo = 10 tablas exactas. No crear tablas nuevas en S3.
- Backend = Next.js route handlers/server actions sobre monolito modular.
- IA apagada por defecto y fuera de S3.

ESTADO REAL TRAS S2:
- Schema, seed, Auth.js, guards y recordAudit listos.
- Voucher QR HMAC, comprobante PDF visual, RENIEC lookup y /admin/auditoria implementados.
- Storage firmado queda condicionado a service role + bucket privado `comprobantes`.

ALCANCE = SOLO SPRINT 3:
Construir panel /admin operativo con Supabase Realtime y asignación manual conductor/unidad separadas.

ENTREGABLES:
1. apps/web/src/lib/supabase/client.ts y server.ts:
   - Cliente browser con anon key.
   - Cliente server/admin solo si variables están disponibles.
2. apps/web/src/app/admin/page.tsx:
   - RSC con query inicial Prisma de reservas del tenant.
   - Lista escaneable de reservas, estado, origen/destino, pasajero, voucher.
3. apps/web/src/components/admin/admin-reservas-live.tsx:
   - Client component que se suscribe a Supabase Realtime `postgres_changes` en tabla `reservas`
     filtrando por `tenant_id`.
   - Actualiza filas sin refresh.
   - Polling fallback cada 10s si Realtime no está configurado.
4. apps/web/src/app/admin/reservas/[id]/page.tsx:
   - Detalle de reserva, pasajero, solicitante, origen, punto de encuentro, destino, voucher.
   - Muestra conductor/unidad vigentes y auditoría relacionada.
5. apps/web/src/app/admin/reservas/[id]/actions.ts:
   - Server Actions `asignarConductor`, `asignarVehiculo`, `marcarExcepcion`.
   - Cada acción valida rol, filtra tenant, actualiza DB y llama `recordAudit`.
6. Selector conductor:
   - Conductores activos del tenant.
   - Orden por `tiempo_en_cola_desde ASC`.
   - Mostrar nombre, rating, total_viajes, tiempo en cola y vehículo vigente.
7. Selector vehículo:
   - Vehículos del tenant ordenados por placa.
   - Mostrar placa, marca, modelo, tipo, capacidad.
8. Broadcast Supabase:
   - Después de commit DB exitoso, emitir `reserva-{id}` con evento `asignacion`.
   - Payload `{reserva_id, conductor_id, vehiculo_id}`.
9. apps/web/src/app/admin/metricas/page.tsx:
   - Cards calculadas desde Prisma: reservas hoy, asignaciones hoy, conductores activos, vouchers emitidos.
10. tests/e2e/admin-asignacion.spec.ts:
   - Login admin.
   - Abrir reserva seed.
   - Asignar conductor.
   - Ver `recordAudit action=reserva_asignada`.

PROHIBIDO EN SPRINT 3:
- Crear tablas nuevas.
- Activar RLS.
- Construir IA, ingesta WhatsApp, app conductor o tracking pasajero.
- Cambiar paleta.
- Automatizar asignación sin confirmación humana.

CRITERIOS DE ACEPTACIÓN:
- Login admin -> ve lista de reservas en /admin.
- 2 pestañas /admin reciben cambios vía Realtime sin refresh cuando Supabase está configurado.
- Sin Supabase env, polling fallback mantiene la lista funcional.
- Asignar conductor + unidad en <=3 clicks.
- Auditoría refleja `reserva_asignada` con payload completo.
- `pnpm turbo run typecheck lint test build` verde.
- Smoke S3 documentado en docs/ESTADO_SPRINT_3.md.

CIERRE:
- Actualiza/crea docs/ESTADO_SPRINT_3.md con implementado, verificación, pendientes reales y riesgos.
- Deja docs/PROMPT_SPRINT_4_CODEX.md listo.
- Detente al terminar Sprint 3. No empieces Sprint 4.
```

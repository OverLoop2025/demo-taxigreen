# Estado Sprint 3 — Taxi Green Demo

Fecha de cierre: 2026-06-01

## 1. Alcance implementado

Sprint 3 construye el panel operativo `/admin` sin tocar el schema de 10 tablas.

- `apps/web/src/lib/supabase/client.ts`: cliente browser con anon key para Realtime.
- `apps/web/src/lib/supabase/server.ts`: cliente server/admin con service role y helper de broadcast.
- `apps/web/src/lib/admin/reservas.ts`: consultas Prisma serializables para lista, detalle, selectores y métricas.
- `apps/web/src/app/admin/page.tsx`: despacho operativo con query inicial RSC y lista viva.
- `apps/web/src/components/admin/admin-reservas-live.tsx`: suscripción `postgres_changes` a `reservas` filtrada por `tenant_id`, refresco de filas y polling de respaldo cada 10s.
- `apps/web/src/app/api/admin/reservas/route.ts`: endpoint protegido para refresco silencioso del cliente.
- `apps/web/src/app/admin/reservas/[id]/page.tsx`: detalle de reserva, pasajero, solicitante, origen, punto de encuentro, destino, voucher, conductor/unidad y auditoría.
- `apps/web/src/app/admin/reservas/[id]/actions.ts`: Server Actions `asignarConductor`, `asignarVehiculo`, `marcarExcepcion`.
- `apps/web/src/app/admin/reservas/[id]/reserva-detalle.tsx`: selector manual de conductor y unidad separados.
- `apps/web/src/app/admin/metricas/page.tsx`: cards calculadas desde Prisma.
- `tests/e2e/admin-asignacion.spec.ts`: login admin, abrir reserva seed, asignar conductor/unidad y verificar auditoría.

## 2. Decisiones técnicas

- No se crearon tablas nuevas, no se activó RLS y no se modificó la paleta.
- La asignación usa `reservas.conductor_id` para el conductor y `conductores.vehiculo_id` para la unidad vigente, según `LOGICA_NEGOCIO_OPERATIVA §3`.
- `asignarConductor` puede recibir también `vehiculo_id` para cumplir el flujo de <=3 clicks: elegir conductor, elegir unidad, confirmar.
- Cada acción humana escribe `recordAudit` con `fuenteDecision: null`.
- Después del commit DB exitoso se emite broadcast en `reserva-{id}` con payload `{reserva_id, conductor_id, vehiculo_id}` para preparar S6.
- `/admin` refresca por Realtime y mantiene polling de respaldo cada 10s para entornos sin `NEXT_PUBLIC_SUPABASE_URL`/anon key o sin publicación Realtime.

## 3. Supabase real configurado

Además de las claves ya cableadas en `.env` gitignored:

- Bucket privado `comprobantes` creado en Supabase Storage.
- `public.reservas` agregado a la publicación `supabase_realtime`.
- `public.reservas` configurado con `REPLICA IDENTITY FULL`.
- `GRANT SELECT ON public.reservas TO anon, authenticated, service_role` aplicado para que `postgres_changes` entregue eventos al cliente anon.

Smoke Realtime real:

```text
Realtime reservas OK=true statuses=SUBSCRIBED,CLOSED
```

Smoke Storage real:

```text
GET /api/comprobantes/{reserva_id}/pdf
status=200 | x-comprobante-renderer: puppeteer | signed_url=yes
```

## 4. Verificación ejecutada

Comandos verdes:

```bash
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/web lint
pnpm --filter @taxigreen/web test
pnpm --filter @taxigreen/web build
pnpm turbo run typecheck lint test build
pnpm e2e
```

Resultado CI local:

```text
pnpm turbo run typecheck lint test build -> 52/52 tasks verdes
```

Resultado E2E:

```text
3 passed
- smoke landing
- voucher QR firmado
- admin asigna conductor y unidad, y auditoría registra reserva_asignada
```

Smoke manual con `next start`:

- `db:seed` contra Supabase: verde.
- Login admin real: verde.
- `/admin`: lista seed visible.
- `/admin/reservas/{id}`: detalle y selectores visibles.
- Server Action de asignación: actualiza reserva/viaje/conductor, audita `reserva_asignada` y emite broadcast.
- `/admin/auditoria?action=reserva_asignada`: evento visible con payload completo.
- `/admin/metricas`: cards calculadas desde Prisma.
- Después de E2E se ejecutó `db:seed` nuevamente para devolver la reserva protagonista al estado canónico del guion.

## 5. Pendientes reales / riesgos

- Realtime quedó validado en Supabase, pero depende de que la publicación y grants se conserven en el proyecto. Si se resetea la DB, repetir los pasos del §3 (verificado vivo el 2026-06-01: `reservas` en publicación + `REPLICA IDENTITY FULL` + `GRANT SELECT` a `anon/authenticated/service_role`).
- El broadcast server-side **ya no usa el fallback REST deprecado**: la auditoría de cierre lo migró a `channel.httpSend(...)` (REST explícito, soportado desde supabase-js 2.37+). Verificado que devuelve `{success:true}` y que la advertencia desapareció del log. Ver §7.
- S4 necesitará dependencias nuevas (`chrono-node`, Vercel AI SDK/Anthropic, `gray-matter`, MSW si se testea LLM mockeado) y, si se activa geocoding real, `NEXT_PUBLIC_MAPBOX_TOKEN`.
- `ANTHROPIC_API_KEY` sigue siendo opcional: con `IA_HABILITADA=false`, S4 debe funcionar determinista.

## 6. Handoff a Sprint 4

Sprint 4 debe empezar desde `docs/PROMPT_SPRINT_4_CODEX.md`.

Reglas que no se deben romper:

- Flujo protagonista: hotel/concierge solicita, origen físico Aeropuerto Jorge Chávez - Llegadas, punto Salida 3 columna F2, destino Av. Pardo 123, Miraflores.
- `packages/ingesta` no debe importar `packages/ia`; la dependencia correcta es `ia -> ingesta`.
- Toda capacidad LLM pasa por `withFallback`.
- Con `IA_HABILITADA=false`, `/wa-sim` debe crear una reserva correcta usando solo determinismo.
- No avanzar a S5 sin `pnpm turbo run typecheck lint test build`, E2E y smoke S4.

## 7. Auditoría de cierre (2026-06-01, revisión post-Codex)

Se auditó S3 leyendo **todo** el código (no solo el reporte) y ejecutando smoke real contra Supabase +
`next start`. Resultado: **S3 cerrado de punta a punta**. CI `pnpm turbo run typecheck lint test build` →
**52/52 verde** (0 cached tras los cambios). E2E `pnpm e2e` → **3/3 verde** (smoke landing + voucher QR +
admin asignación/auditoría).

### 7.1. Verificación end-to-end ejecutada

- `GET /admin` sin sesión → **307** a `/login-admin?callbackUrl=%2Fadmin`. `GET /api/admin/reservas` sin sesión → **401**.
- E2E admin: login real admin → abre `TG-2026-0001` → asigna conductor+unidad → ve `reserva_asignada` en auditoría. Verde.
- **Storage privado + URL firmada (pendiente que venía de S2): CERRADO.** `GET /api/comprobantes/{id}/pdf` →
  200, `x-comprobante-renderer: puppeteer`, PDF 32 KB, header `x-supabase-signed-url` real. La URL firmada
  **descarga** el PDF (200, `%PDF-1.4`); el acceso **sin** firma da **400** → bucket `comprobantes` es privado de verdad.
- **Realtime real:** publicación `supabase_realtime` incluye `reservas`, `REPLICA IDENTITY FULL` y `GRANT SELECT`
  a `anon/authenticated/service_role` confirmados vivos en el proyecto.

### 7.2. Bugs / inconsistencias corregidos en esta auditoría

1. **🐞 Broadcast con API deprecada (latente, afectaría a S6).** `broadcastReservaAsignacion` usaba
   `channel.send({type:'broadcast'...})` sin suscripción previa → supabase-js caía a un **fallback REST
   marcado como deprecado** (warning en cada asignación). Como S6 (app conductor) dependerá de que ese
   broadcast llegue, se migró a `channel.httpSend('asignacion', payload)` (REST explícito y soportado).
   Verificado: `{success:true}` y warning eliminado del log. Archivo: `apps/web/src/lib/supabase/server.ts`.
2. **🐞 CI/Deploy: versión de pnpm desincronizada (rompería el primer push).** Los workflows fijaban
   `pnpm/action-setup@v4` con `version: 9`, pero `package.json` declara `packageManager: pnpm@10.33.0` y el
   lockfile es 9.0 (pnpm 10). `action-setup@v4` **falla** si recibe ambos ("Multiple versions of pnpm
   specified"). Se quitó el `version:` para que lea `packageManager`; `engines.pnpm` ahora `>=10` y
   `engines.node` `>=22 <25`. Archivos: `.github/workflows/{ci,deploy-web}.yml`, `package.json`.
3. **🐞 `deploy-web.yml`: `if` de job usaba contexto `secrets` (inválido).** GitHub no expone `secrets` en
   un `if` a nivel de job ("Unrecognized named-value: 'secrets'"). Se pasó `RAILWAY_TOKEN` a `env` de job y se
   condicionaron los steps con `env`. (Deploy real sigue siendo alcance S9.)
4. **UX suelta en detalle de reserva.** El mensaje de resultado solo se renderizaba bajo el primer formulario;
   "Cambiar solo unidad" y "Marcar excepción" no daban confirmación visible. Se movió a un banner compartido
   arriba del panel de acciones. Archivo: `apps/web/src/app/admin/reservas/[id]/reserva-detalle.tsx`.
5. **TypeScript:** se añadió `noImplicitReturns` a `tsconfig.base.json` (CI sigue 52/52). Resto de flags
   estrictos evaluados y documentados como recomendación en `docs/DEUDA_TECNICA.md §4`.

### 7.3. Observaciones no bloqueantes (documentadas, no son bug)

- `marcarExcepcion` sobrescribe el jsonb `sugerencia_copiloto` y fuerza `necesita_revision` sin condición.
  Aceptable en demo (acción terminal del operador). Detalle en `docs/DEUDA_TECNICA.md §3`.
- `useEffect` de `admin-reservas-live.tsx` no lista `refreshReservas` en deps; funcionalmente correcto (la
  función hace fetch fresco) y el ESLint del repo no exige `react-hooks/exhaustive-deps`.

### 7.4. Lo que NO se validó en S3 (por diseño, alcance S9) — ver `docs/DEUDA_TECNICA.md`

- **Deploy Railway real** y **PDF Puppeteer en Railway** (no solo local): alcance **S9**. Workflow listo y
  corregido; falta `RAILWAY_TOKEN` y verificar el binario de Chromium en la nube.
- QR "un solo uso" (escaneo counter): alcance **S9**.

DB dejada en baseline canónico: reseed idempotente + auditoría purgada a solo `seed_sprint_1` (25 → 1).
Servidor apagado, sin puerto 3000 corriendo.

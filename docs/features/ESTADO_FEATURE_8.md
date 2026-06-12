# ESTADO Feature 8 — Reserva guiada + preferencia de vehículo (+ pulido transversal)

**Fecha:** 2026-06-12
**Fuente de verdad:** [`MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md`](MASTER_FLUJO_COMERCIAL_Y_LIBERTAD.md) (§3.3, §6.1)
**Veredicto:** Feature 8 cerrada. El plan maestro comercial F5-F8 queda completo en código y verificado. Esta entrega incluye además el paquete de pulido visual pedido fuera del master (mapa conductor, mostrador, admin).

---

## 1. Implementado

### Reserva guiada (`/wa-sim`)

- "Necesito reservar un taxi" (intención pura, sin datos) abre el **flujo guiado**: servicio → particular/empresa → quién cubre → personas → equipaje (3 niveles) → vehículo (default "el mejor disponible") → datos finales en un mensaje.
- Cada respuesta numerada se **traduce a lenguaje natural** y alimenta el MISMO extractor (un solo motor de borrador, sin segundo parser). El cliente puede romper el guion con texto libre en cualquier paso.
- Tras el último paso, el flujo normal del copiloto continúa (aclaraciones, resumen con tarifa, confirmación).

### Preferencia de vehículo en la tarifa

- `calcularCotizacionDemo` acepta `vehiculoPreferencia`: sedán ×1.00 · camioneta ×1.15 · van/minivan ×1.40, en ambas ramas (tarifario fijo y coordenadas), con el redondeo a 0.50 existente. Categoría desconocida o sin preferencia ⇒ ×1.00.
- La cotización congelada al confirmar ya incluye el factor: nadie recalcula aguas abajo (C6 intacto). `w3·match_tipo` del score ya consumía la preferencia desde F5.

### Pulido transversal (pedido explícito del usuario)

- **Mapa conductor (Waze):**
  - **Maniobra dinámica por GPS** (`guidance.ts` + `location` de cada maniobra desde Mapbox): el banner proyecta el GPS sobre la polilínea y muestra el primer giro que sigue POR DELANTE con su distancia real. Esto corrige de raíz el giro invertido reportado ("gire a la derecha" con la ruta doblando a la izquierda): el banner mostraba estáticamente `pasos[1]` del cálculo original, ya ejecutado.
  - **"La ruta no se traza":** diagnóstico real contra prod — el throttle del servidor (2.5 s) devuelve estimación de 2 vértices cuando el GPS cambia de tramo dos veces seguidas al abrir la pantalla; el cliente la descarta y quedaba sin línea ni reintento. Fix: reintento automático (3.2 s, máx. 2 por tramo) en `use-route.ts`. Variables Mapbox verificadas en Railway (estaban bien).
  - **Limpieza visual:** logo y attribution de Mapbox ocultos; banner superior solo con la maniobra; panel inferior mínimo (destino + llegada + acción) sin cobro ni "Con tráfico actual"; ya no tapa el puck.
- **Mostrador:** botón **"Mostrar letrero al pasajero"** → pantalla completa (intenta landscape) con el nombre en tipografía gigante + vuelo, se cierra con un toque. Disponible al revisar el pase y tras confirmar acceso.
- **Admin:** lista renovada a **tarjetas** (pasajero y ruta primero, chips de estado/mostrador/comercial), resumen en 3 números (Servicios / Por asignar / En curso) y bandeja F7 arriba.
- **Barrido de copy:** `title` y footer ya no dicen "Demo"; sin "Mapbox" visible en superficies.

## 2. Cambios por archivo

- `apps/web/src/app/wa-sim/whatsapp-simulator.tsx` — motor guiado (pasos, traducciones, integración con el extractor).
- `packages/pagos/src/index.ts` (+ tests ×2) — multiplicador de vehículo.
- `apps/web/src/app/wa-sim/actions.ts` — `cotizarReserva` pasa la preferencia.
- `packages/rutas/src/{types.ts,providers/mapbox-directions.ts}` — `location` por maniobra.
- `apps/driver/src/features/routing/{guidance.ts (NUEVO),use-route.ts}` — guía dinámica + retry de trazado.
- `apps/driver/app/(auth)/asignacion/[id].tsx` + `src/components/map/AssignmentMap.tsx` — banner/panel limpios, sin marca Mapbox.
- `apps/web/src/app/counter/voucher-validator.tsx` — `LetreroPasajero` fullscreen.
- `apps/web/src/components/admin/admin-reservas-live.tsx` — tarjetas + stats.
- `apps/web/src/app/{layout.tsx,page.tsx}` — copy sin "Demo".

## 3. Verificación (corrida final F6+F7+F8)

```bash
pnpm turbo run typecheck lint test build                       # EXIT 0
pnpm --filter @taxigreen/database db:seed-operacional
E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test --workers=1   # 11/11
pnpm --filter @taxigreen/database db:seed-guion
E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test tests/e2e/voucher-flow.spec.ts  # 1/1
pnpm --filter @taxigreen/driver exec expo export --platform android        # EXIT 0
pnpm --filter @taxigreen/database db:seed-operacional          # DB restaurada
```

- Web 88/88 · Pagos 31/31 · Playwright 11/11 (2.4 m) contra `next start` fresco en `:3100`.
- Smoke prod de rutas: login conductor 200, `/api/rutas/calcular` con `reserva_id` → `fuente=mapbox`, 716 vértices, 17 pasos; segunda llamada inmediata → `throttle_estimacion` (comportamiento que el retry del cliente ahora absorbe).

## 4. Riesgos / deuda

- El letrero usa la Fullscreen API del navegador: en iPad/Safari el lock de orientación puede no aplicar (el fullscreen sí). Suficiente para la tablet Android de demo.
- La maniobra dinámica depende de `location` en los pasos (presente tras este deploy); sin ella cae al comportamiento anterior (fallback documentado en `guidance.ts`).

## 5. Próximo prompt

No aplica: el master comercial F5-F8 queda completo. Trabajo futuro solo a pedido explícito (MVP: WABA real, pasarela real, exclusión temporal del conductor que cancela, polling de respaldo de luz verde).

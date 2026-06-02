# Estado Sprint 4 — Taxi Green Demo

Fecha de cierre: 2026-06-01

## 1. Alcance implementado

Sprint 4 construye el Wow #1: ingesta desde WhatsApp con determinismo primero, LLM opcional y simulador visual `/wa-sim`.

- `packages/ingesta`: extractor determinista con Zod, diccionarios peruanos, normalización de fecha Lima, RUC, vuelo, teléfono, pago, hotel/aeropuerto/zona y preguntas de aclaración.
- `packages/ingesta/src/test-suite/whatsapps.ts`: 15 muestras de WhatsApp peruanas, incluido el flujo protagonista.
- `packages/ia`: `AnthropicProvider` real con AI SDK, loader de prompts con frontmatter, prompt `ingesta-whatsapp.v1.md`, prompt de aclaración y `extraerReservaConFallback`.
- `packages/ia/src/extractor-llm.ts`: el LLM solo estructura; campos verificables se cruzan contra el determinista.
- `apps/web/src/app/api/ingesta/extraer/route.ts`: endpoint `POST` de extracción.
- `apps/web/src/app/wa-sim`: simulador WhatsApp Web con 3 conversaciones seed, extracción, confianza, JSON, aclaraciones y creación de reserva.
- `apps/web/src/app/wa-sim/actions.ts`: crea reserva en las 10 tablas existentes, guarda `raw_ingesta`, `sugerencia_copiloto` y audita `reserva_ingesta_whatsapp_creada`.
- `tests/e2e/wa-sim.spec.ts`: login admin, abre `/wa-sim`, extrae protagonista, crea reserva y verifica detalle `/admin`.

No se crearon tablas nuevas, no se activó RLS y no se inició Sprint 5.

## 2. Decisiones técnicas

- `packages/ingesta` no importa `packages/ia`; la dependencia sigue siendo `ia -> ingesta`.
- `IA_HABILITADA=false` no llama al LLM y responde `fuente='algoritmo'`.
- Si `IA_HABILITADA=true` pero falta `ANTHROPIC_API_KEY`, hay timeout o error, `withFallback` vuelve al resultado determinista.
- El hotel/concierge se guarda como solicitante; el origen físico protagonista queda `Aeropuerto Jorge Chávez - Llegadas`.
- `/wa-sim` usa verde WhatsApp dentro del simulador; no cambia la paleta azul del producto.
- La reserva creada desde `/wa-sim` queda en `necesita_revision` para que el humano conserve control operativo.
- El E2E antiguo de voucher se robusteció: ahora altera el cuerpo firmado del token HMAC, no el último carácter base64url de la firma.

## 3. Verificación ejecutada

Comandos verdes:

```bash
pnpm --filter @taxigreen/ingesta typecheck
pnpm --filter @taxigreen/ingesta lint
pnpm --filter @taxigreen/ingesta test
pnpm --filter @taxigreen/ia typecheck
pnpm --filter @taxigreen/ia lint
pnpm --filter @taxigreen/ia test
pnpm --filter @taxigreen/web typecheck
pnpm --filter @taxigreen/web lint
pnpm turbo run typecheck lint test build
pnpm e2e
```

Resultados:

```text
packages/ingesta tests -> 4/4
packages/ia tests -> 3/3
apps/web unit -> 5/5
pnpm turbo run typecheck lint test build -> 52/52 tasks verdes
pnpm e2e -> 4/4 verde
```

Smoke API real con `next start`:

```text
POST /api/ingesta/extraer
fuente=algoritmo
confianza=1
origen=Aeropuerto Jorge Chávez - Llegadas
destino=Av. Pardo 123, Miraflores
pasajero=Valeria Mendoza
vuelo=LA2456
pago=voucher_hotel
```

Smoke visual:

- Capturas desktop `1440x900` y mobile `390x844` de `/wa-sim` revisadas sin solapes ni texto roto.
- `/wa-sim` abre usable desde el primer viewport y mantiene el chat como experiencia principal.

DB tras E2E:

- El E2E creó reservas `TG-WA-*` de prueba en Supabase durante la verificación.
- Se limpiaron esas reservas y su auditoría asociada para no ensuciar el baseline demo.
- La reserva protagonista `TG-2026-0001` se mantiene.

## 4. Bugs / mejoras encontradas durante cierre

- Test voucher HMAC frágil: cambiar el último carácter base64url de la firma podía no alterar los bytes decodificados. Se corrigió el test para tampear el cuerpo firmado.
- El parser inicialmente clasificaba como `city` un mensaje de counter con vuelo/llegada pero sin palabra “aeropuerto”. Se corrigió la heurística: presencia de `vuelo/flight` implica recojo aeropuerto salvo indicación contraria.
- La captura visual posterior a extracción mostró que `pasajero_nombre` podía absorber la siguiente frase (`Valeria Mendoza. Llega`). Se ajustó la regex y se agregó aserción explícita del pasajero protagonista.
- Vitest quedó instalado en versión 4 por defecto en paquetes nuevos; se alineó a `^2.1.9` como el resto del repo para evitar peer mismatch con Vite 5.

## 5. Pendientes reales / riesgos

- No se probó llamada Anthropic real porque `ANTHROPIC_API_KEY` no está configurada. No bloquea S4: los tests cubren IA off, LLM ok mockeado y fallback por error.
- `normalizarDireccion` usa diccionario local; Mapbox queda opcional para un sprint posterior si se quiere geocoding real.
- `/wa-sim` crea reservas como actor sistema `wa-sim`. Para producción/webhook real se necesitaría secreto WABA o firma entrante; fuera del alcance demo S4.
- El servidor local quedó levantado en `http://localhost:3000` para revisión manual.

## 6. Handoff a Sprint 5

Sprint 5 debe empezar desde `docs/PROMPT_SPRINT_5_CODEX.md`.

Reglas que no se deben romper:

- El LLM de asignación solo puede redactar la razón; no puede cambiar conductor/unidad.
- La decisión operativa base debe salir de `packages/asignacion`.
- `recordAudit` debe registrar `fuente_decision` al aceptar sugerencia o hacer override humano.
- Con `IA_HABILITADA=false`, la sugerencia debe aparecer con razón corta determinista y badge algoritmo.
- No avanzar a S6 sin `pnpm turbo run typecheck lint test build`, E2E y smoke S5.

## 7. Auditoría de cierre (2026-06-01, revisión post-Codex)

Se auditó S4 leyendo **todo** el código (ingesta determinista, capa IA, `/wa-sim`, Server Action, endpoint y
tests) y ejecutando verificación real. Por ser el sprint más largo se buscó específicamente seguridad,
consistencia de dependencias y caminos latentes. Resultado: **S4 cerrado**, con 5 correcciones aplicadas.
CI `pnpm turbo run typecheck lint test build` → **52/52 verde**; `pnpm e2e` → **4/4 verde**.

### 7.1. 🐞 Bugs / riesgos corregidos

1. **Seguridad — `/wa-sim` era una superficie de escritura abierta.** La página `/wa-sim`, el endpoint
   `POST /api/ingesta/extraer` y la Server Action `crearReservaDesdeIngesta` **no exigían sesión** (el
   middleware solo cubría `/admin` y `/counter`). Un usuario no autenticado podía crear reservas en la DB.
   Corregido: `/wa-sim` añadido al matcher del middleware con rol `admin_tenant|despachador`; `requireRole`
   en la Server Action (defensa en profundidad ante POST directo); chequeo de sesión + 401 en el endpoint de
   extracción. Verificado: sin sesión `/wa-sim`→307 a login y `/api/ingesta/extraer`→401; con sesión, E2E 4/4.
2. **Dependencias — doble versión de Zod.** `packages/ia` usaba `zod@4.4.3` y el resto del repo `zod@3`.
   Unificado a `zod@^3.25.76` (peer-compatible con `ai@6`). Detalle en `docs/DEUDA_TECNICA.md §4`.
3. **`withFallback` no limpiaba el timer del timeout.** Si el LLM resolvía antes del timeout, el `setTimeout`
   quedaba vivo y su promesa rechazaba luego (unhandled rejection latente). Se agregó `clearTimeout` en éxito y
   error. Archivo: `packages/ia/src/fallback.ts`.
4. **UX `/wa-sim`.** El botón "Crear reserva" se habilita desde 70% pero podía fallar server-side si faltaba un
   campo obligatorio, sin explicar por qué. Se añadió una línea de ayuda contextual (umbral de confianza /
   control humano). No cambia el flujo del E2E.
5. **Riesgos documentados (no corregidos por diseño):** carga de prompts `.md` bajo bundling de Next cuando
   `IA on` (degrada a determinista, no crashea) y AI SDK v6 vs "SDK 4" documentado. Ver
   `docs/DEUDA_TECNICA.md §3`.

### 7.2. Lo que verifiqué que SÍ está correcto

- Patrón determinista-primero intacto: `ingesta` no importa `ia`; `IA_HABILITADA=false` ⇒ `fuente=algoritmo`.
- Flujo protagonista (E2E real contra Supabase): extrae `Aeropuerto Jorge Chávez - Llegadas`,
  `Av. Pardo 123, Miraflores`, `LA2456`, `Datos suficientes`, crea `TG-WA-*` y la muestra en `/admin` con
  auditoría `reserva_ingesta_whatsapp_creada`.
- Hotel/concierge = solicitante; el origen físico nunca lo reemplaza (cubierto por unit test + E2E).
- Validación de RUC peruano (módulo 11), normalización de fecha Lima, y no-invención de datos faltantes.
- El parser no mete números de vuelo (p. ej. `LA2456`) como hora; `pasajero_nombre` ya no absorbe la frase
  siguiente (corte en `.`).

DB dejada en baseline canónico: 2 reservas `TG-WA-*` del E2E borradas, auditoría purgada a solo
`seed_sprint_1` (33 → 1), reseed idempotente. Servidor apagado (no quedó puerto 3000 corriendo).

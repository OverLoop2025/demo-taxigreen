# Prompt Sprint 6 — Taxi Green Demo

Uso: copiar y pegar este bloque para ejecutar solo Sprint 6. No iniciar Sprint 7 sin nueva instrucción.

```text
Trabajas en el monorepo de la demo de Taxi Green, en /home/jose/dev/demo-taxigreen.
Eres full-stack senior con experiencia real en React Native + Expo, Auth móvil, push notifications y Realtime.
Ejecuta SOLO Sprint 6. No empieces Sprint 7.

ANTES DE TOCAR CÓDIGO, LEE EN ESTE ORDEN:
1. CLAUDE.md
2. AGENTS.md
3. docs/ESTADO_SPRINT_5.md
4. docs/DOCUMENTACION_TECNICA.md
5. docs/GUIA_PRUEBAS_DEMO.md
6. 07_PLAN_EJECUCION/SPRINT.md §Sprint 6
7. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §2.6 y §7.2
8. _FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md
9. _FUENTE_DESARROLLO/GLOSARIO_FLUJOS_TAXIGREEN.md
10. _FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md
11. apps/driver actual + apps/web/src/app/admin/reservas/[id]/actions.ts + apps/web/src/lib/supabase/server.ts

DECISIONES CERRADAS:
- S0-S5 están cerrados. No desordenes schema, seed, voucher, PDF, auditoría, /admin, Realtime, /wa-sim ni la heurística S5.
- App conductor = React Native + Expo SDK 51. No usar Capacitor.
- Pasajero sigue siendo link /p/[token], no app nativa.
- Humano en control: /admin asigna; la app conductor recibe y confirma estados en sprints posteriores.
- En S6 la pantalla /asignacion/[id] puede ser placeholder; el mapa/estados completos son S7.
- Android físico/Expo Go es parte del cierre. iOS queda fuera de demo.
- Push debe degradar con claridad si faltan credenciales reales; no debe romper login ni Realtime.

ALCANCE = SOLO SPRINT 6:
Construir la app conductor mínima: scaffolding navegable, login email+PIN, persistencia segura, registro push y escucha Realtime de asignación.

ENTREGABLES CORE:
1. apps/driver:
   - app.json revisado con scheme, package Android, plugins Expo y permisos necesarios.
   - app/_layout.tsx con providers: AuthProvider, RealtimeProvider/infra mínima y Toast/estado global si aplica.
   - app/index.tsx: splash breve + redirect según sesión.
   - app/login.tsx: email + PIN de 4 dígitos con numpad grande; botones táctiles min 64px.
   - app/(auth)/_layout.tsx con tabs simples.
   - app/(auth)/home.tsx con saludo, estado de turno y próxima asignación si existe.
   - app/(auth)/asignacion/[id].tsx placeholder navegable para S7.
   - app/(auth)/perfil.tsx con datos conductor y logout.
   - src/features/auth/use-auth.ts + types: login/logout, secure-store, estado hidratado.
   - src/features/api/client.ts: fetch/axios con baseURL desde env y Authorization Bearer.
   - src/features/push/: pedir permiso, obtener Expo push token, enviarlo al backend, listeners foreground/tap.
   - src/features/realtime/: cliente Supabase y suscripción a canal de conductor/reserva.
   - src/components/: TouchButton, NumPad, BottomSheet o equivalentes sobrios, gigantes y legibles.
2. apps/web:
   - /api/conductor/login POST {email,pin}: valida contra helper PIN real, emite JWT/Bearer para RN, registra auditoría.
   - /api/conductor/fcm-token POST {token}: valida Bearer, guarda en usuarios.fcm_token.
   - Al asignar desde /admin: además del broadcast Supabase existente, preparar envío push. Si faltan credenciales reales,
     debe degradar con log/handoff claro sin romper asignación.
3. Seguridad:
   - JWT en expo-secure-store, nunca AsyncStorage.
   - Endpoint móvil no expone password_hash ni pin_hash.
   - Tokens Bearer con expiración razonable y validación server-side.
4. Tests:
   - Unit tests de helper auth móvil / endpoint login si aplica.
   - E2E web existente sigue verde.
   - Smoke manual documentado para Expo/Android.

CRITERIOS DE ACEPTACIÓN:
- `cd apps/driver && pnpm start` abre Expo.
- En Android físico o emulador: login `conductor1@taxigreen.demo / 1234` entra a Home.
- Backend guarda token push en `usuarios.fcm_token` cuando Expo entrega token.
- Desde `/admin`, aceptar/asignar una reserva emite broadcast que la app recibe o deja log verificable.
- Tap en notificación, si hay push real disponible, navega a `/(auth)/asignacion/[id]`.
- `pnpm turbo run typecheck lint test build` verde.
- `pnpm e2e` verde.
- Documentar cualquier credencial faltante y si el smoke push fue real o degradado.

REGLAS NO NEGOCIABLES:
- No crear app pasajero.
- No implementar mapa/estados completos de viaje en S6; eso es S7.
- No tocar la decisión determinista de asignación S5.
- No usar AsyncStorage para JWT.
- No introducir RLS ni nuevas tablas salvo que el prompt lo autorice explícitamente. `usuarios.fcm_token` ya existe.
- UI conductor: botones grandes, textos claros, poco ruido, apta para conductor 45-60 en uso diario.

CIERRE:
- Actualiza/crea docs/ESTADO_SPRINT_6.md con implementado, verificación, bugs/mejoras y pendientes reales.
- Actualiza docs/GUIA_PRUEBAS_DEMO.md con la sección de app conductor.
- Deja docs/PROMPT_SPRINT_7_CODEX.md listo.
- Actualiza docs/DOCUMENTACION_TECNICA.md, CLAUDE.md y AGENTS.md si cambia el estado operativo.
- Detente al terminar Sprint 6. No empieces Sprint 7.
```


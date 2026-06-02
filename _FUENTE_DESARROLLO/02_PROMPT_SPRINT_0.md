



























# Prompt de arranque — Sprint 0 (Codex / Claude / agente de programación)

**Uso:** este es el primer prompt que recibe el agente de programación. Ejecuta **solo Sprint 0** (cimentación). No construye features. Refleja `07_PLAN_EJECUCION/SPRINT.md §Sprint 0` e incorpora el contrato de flujo físico para que el repo no nazca con el flujo invertido.

**Reemplaza** al `PROMPT_CODEX_SOFTWARE_S0_S1_ACTUALIZADO.md` (archivado en `_historico_proceso/`).

---

## Prompt (copiar y pegar)

```text
Trabajas en el software demo de Taxi Green. Eres ingeniero senior full-stack con
experiencia en monorepos modernos y React Native + Expo.

ANTES DE TOCAR CÓDIGO, LEE EN ESTE ORDEN:
1. _FUENTE_DESARROLLO/01_FUENTE_DE_VERDAD.md
2. _FUENTE_DESARROLLO/GLOSARIO_FLUJOS_TAXIGREEN.md
3. _FUENTE_DESARROLLO/CONTRATO_FLUJO_PROTAGONISTA.md
4. _FUENTE_DESARROLLO/04_DECISIONES_ABIERTAS.md
5. 07_PLAN_EJECUCION/PLAN_SOFTWARE.md  (§2, §7)
6. 07_PLAN_EJECUCION/SPRINT.md          (§0 y Sprint 0)

DECISIÓN CANÓNICA DE FLUJO (no la inviertas):
- Flujo protagonista = Recojo en aeropuerto: Aeropuerto Jorge Chávez -> Av. Pardo 123, Miraflores.
- Hotel/concierge = solicitante por WhatsApp, NO origen físico.
- Pasajero final = quien viaja, físicamente en el aeropuerto al recoger.
- Punto de encuentro = Salida 3, columna F2. Counter walk-in también es Aeropuerto -> Lima.
- Objeto olvidado = soporte del viaje dentro de /p/[token], no app separada.

ALCANCE DE ESTA TAREA = SOLO SPRINT 0 (CIMENTACIÓN). NADA MÁS.
Creas la base de un monorepo con dos apps. NO implementas features, modelos de
datos, auth ni UI más allá de placeholders. NO toques el plugin Figma
(06_DEMO_TECNICA/figma-plugin-taxigreen-master/).

CONTEXTO DURO:
- Stack: 07_PLAN_EJECUCION/PLAN_SOFTWARE.md §7.2.
- Estructura de carpetas requerida: 07_PLAN_EJECUCION/SPRINT.md §0.2 (coincidir 100%).
- tsconfig "strict": true, "noUncheckedIndexedAccess": true. Sin "any" implícito.
- pnpm 9 único package manager. Turborepo 2 con caching. Node 22 LTS (.nvmrc en raíz).
- Variables de entorno tipadas con zod en apps/web/src/lib/env.ts y apps/driver/src/lib/env.ts.

ENTREGABLES SPRINT 0:
1.  package.json raíz con scripts: dev, build, lint, typecheck, test, e2e (delegan a turbo).
2.  pnpm-workspace.yaml con apps/* y packages/*.
3.  turbo.json con pipelines: typecheck, lint, test, build, dev (persistent).
4.  apps/web: Next.js 15.4 + React 19 (RSC) + Tailwind 3.4 + shadcn/ui init + Auth.js v5 stub
    + Sentry dummy + Pino logger.
5.  apps/driver: Expo SDK 51 + expo-router 3 + NativeWind 4, con plugins instalados pero
    sin uso (placeholders): expo-location, expo-notifications, expo-secure-store, expo-camera,
    expo-task-manager, expo-local-authentication, @rnmapbox/maps.
6.  apps/driver/app.json: name "Taxi Green Conductor", slug "taxigreen-driver",
    scheme "taxigreendriver", android.package "pe.taxigreen.driver".
7.  packages/database: Prisma 6 + schema.prisma VACÍO + cliente singleton.
8.  packages/{shared, ia(src/+prompts/), ingesta, asignacion, bienestar, voucher,
    comprobantes, auditoria}: package.json + tsconfig + index.ts placeholder.
9.  packages/integraciones/{reniec, lap-atu}: package.json + index.ts placeholder.
10. infra/docker-compose.yml con Postgres 17 + PostGIS local opcional.
11. .github/workflows/ci.yml: install -> typecheck -> lint -> test -> build con caché.
12. .env.example en raíz + apps/web + apps/driver con TODAS las variables comentadas.
13. README.md raíz con Quick Start (clone -> pnpm i -> supabase setup -> pnpm turbo run dev).

PROHIBIDO EN SPRINT 0:
- Implementar features, modelos, auth o UI más allá de placeholders.
- Crear las 10 tablas (eso es Sprint 1). schema.prisma queda vacío.
- Instalar dependencias no justificadas en PLAN_SOFTWARE.md §7.2.
- Usar npm o yarn. Tocar el plugin Figma.

CRITERIOS DE ACEPTACIÓN (Sprint 0 DoD):
- pnpm install resuelve todos los workspaces sin warnings críticos.
- pnpm turbo run dev --filter=web arranca Next en :3000 y responde 200.
- cd apps/driver && pnpm start arranca Expo Metro y muestra QR (Expo Go funcional).
- pnpm turbo run typecheck lint test build  -> todo verde.
- CI corre verde en un PR de prueba.
- Railway despliega apps/web (página "/" placeholder) y responde 200.
- Supabase con extensiones postgis + pgcrypto habilitadas.
- .env.example completo en los tres lugares.
- Estructura de carpetas coincide 100% con SPRINT.md §0.2.

FORMATO DE SALIDA:
Devuelve archivos uno por uno con su path como comentario en la primera línea. Al final,
muestra el output esperado de: pnpm install · pnpm turbo run typecheck lint test build ·
pnpm turbo run dev --filter=web · cd apps/driver && pnpm start.

Si tienes dudas, marca con `// TODO confirmar` o `// DECISIÓN: ...` y sigue. No preguntes.

AL TERMINAR: detente. Reporta CI verde y el smoke test. NO empieces Sprint 1 sin
una nueva instrucción.
```

---

## Después de Sprint 0

Sprint 1 (schema 10 tablas **+ deltas de `LOGICA_NEGOCIO_OPERATIVA §8`** + seed protagonista + Auth.js v5) usa el prompt de `07_PLAN_EJECUCION/SPRINT.md §S1.4`. **Antes de Sprint 1**, resolver la decisión de identidad visual (`04_DECISIONES_ABIERTAS.md`), porque S1 define los design tokens.

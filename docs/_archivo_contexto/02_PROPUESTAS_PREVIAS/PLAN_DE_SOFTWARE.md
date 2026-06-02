# Plan de software — Demo Taxi Green

**Documento complementario.** Acompaña a [PROPUESTA_DEMO.md](PROPUESTA_DEMO.md) y se concentra en todo lo que la propuesta no entró a detallar: justificación técnica profunda frente a la voz del cliente, contratos de API y eventos, especificación criptográfica del QR, estrategia de tracking GPS, seguridad, sprints accionables con criterios de aceptación, definition of done, plan de despliegue y checklist pre-demo. Mientras la propuesta vende, este documento construye.

**Audiencia:** equipo de implementación. Lectura asumida: ya leyó la propuesta y tiene contexto de negocio.
**Fecha:** 2026-05-19.

---

## Índice

1. Cómo se lee este documento
2. Confrontación tecnológica con la voz del cliente
3. Principios de ingeniería que guían la build
4. Arquitectura de software en profundidad
5. Estructura del monorepo
6. Modelo de datos completo (DDL, índices, invariantes)
7. Contrato de API REST
8. Contrato de eventos WebSocket
9. Especificación del QR-Voucher
10. Sistema de notificaciones push
11. Geolocalización y tracking
12. Seguridad
13. Datos semilla y escenarios de demo
14. Sprints concretos (Sprint 0 a Sprint 5)
15. Definition of Done — global y por sprint
16. Estrategia de testing pragmática para preventa
17. CI/CD y despliegue
18. Configuración de entornos y manejo de secretos
19. Observabilidad mínima para demo
20. Presupuesto de performance
21. Convenciones de código
22. Internacionalización ES/EN
23. Resiliencia y manejo de errores
24. Accesibilidad básica
25. Checklist pre-demo (D-7, D-3, D-1, D-0)
26. Plan de contingencia en vivo
27. Métricas técnicas de éxito de la demo
28. Apéndices

---

## 1. Cómo se lee este documento

- Las secciones 2 y 3 son **contractuales**: si no se respetan, la demo no se sostiene.
- Las secciones 4 a 13 son **especificación**: cualquier desarrollador con experiencia puede implementar leyendo solo estas.
- La sección 14 es el **plan de ejecución**: cinco sprints de tres días útiles cada uno (15 días útiles, ~21 calendario con buffer). Cada sprint tiene backlog, criterios de aceptación y riesgos.
- Las secciones 15 a 27 son **disciplinas operativas**: qué se considera "hecho", cómo se prueba, cómo se despliega, cómo se rescata la demo si algo falla en vivo.

Lo que **no** está en este documento (y por qué):
- Justificación de la oportunidad comercial → está en [PROPUESTA_DEMO.md §1–§3](PROPUESTA_DEMO.md).
- Decisiones de UX visual / paleta / tipografía → propuesta §11.
- Guion de presentación al cliente → propuesta §15.
- Anti-patrones de presentación → propuesta §16.

---

## 2. Confrontación tecnológica con la voz del cliente

Raúl dejó tres pedidos técnicos explícitos en la transcripción que merecen una respuesta argumentada, no obediente. Esta sección documenta esa respuesta de forma que pueda defenderse en cualquier reunión.

### 2.1 "Sugiero MongoDB" — respondemos PostgreSQL + PostGIS

**Lo que dijo Raúl, textual:**
> *"Con una base no relacional, ¿cierto? Claro, tiene que ser no relacional y yo sugeriría que sea Mongo. Pero tengo buenas referencias de Mongo, no he hecho ningún proyecto en Mongo, pero me parece que está dentro de los tops en ese tipo, pero tal vez tengas una mejor propuesta y ahí ya me cuentas."*

**Lectura honesta de la frase.** El cliente reconoce dos cosas:
1. No ha hecho proyectos con Mongo. Su preferencia es **referencial**, no experimental.
2. Abre explícitamente la puerta a una propuesta mejor.

Esa apertura es invitación, no una concesión a regañadientes. Si la propuesta es sólida, será aceptada.

**Análisis del dominio.** El modelo de negocio de Taxi Green es **relacional en estado puro**:

| Hecho del dominio | Forma de los datos | Carácter |
|---|---|---|
| Una reserva pertenece a un pasajero | 1:N pasajero→reservas | Relacional |
| Una reserva puede asignarse a un conductor y a una unidad, por separado | N:1 conductor, N:1 unidad | Relacional con FKs |
| El mismo conductor puede operar distintas unidades en distintos turnos | N:M conductor↔unidad mediado por viaje | Relacional |
| Un viaje genera un comprobante | 1:1 viaje→comprobante | Relacional |
| Un comprobante puede ser boleta o factura, según haya RUC | Polimorfismo | Manejable en SQL con tipo + columnas nullable |
| Posiciones GPS del conductor en el tiempo | 1:N conductor→posiciones, alta cardinalidad | Time-series, encaja en SQL con índice compuesto |
| Búsqueda geográfica ("conductores a 2 km del aeropuerto") | Geo-spatial | **Decisivo** |

El último punto es el que rompe el empate. **PostGIS** es la extensión geo-espacial de PostgreSQL — el estándar oro del sector. Uber, Lyft, Cabify y Grab operan sobre Postgres + PostGIS o variantes propietarias inspiradas en él. MongoDB tiene índices `2dsphere`, pero su rendimiento y expresividad para consultas como *"dame los conductores disponibles dentro de un radio de N metros, ordenados por distancia al punto P, filtrados por tipo de unidad"* es notoriamente inferior. Para Taxi Green, donde la asignación geográfica es el caso de uso central, esto es un veto técnico.

**Comparación tabulada para usar en reunión:**

| Criterio | PostgreSQL + PostGIS | MongoDB |
|---|---|---|
| Naturaleza de los datos | Relacional puro, ya identificado | Forzaríamos a documentos anidados o referencias manuales |
| Geo-spatial queries | Estándar oro del sector ride-hailing | Funciona pero no es competitivo |
| Transacciones ACID multi-tabla (asignar conductor+unidad atómicamente) | Nativo, robusto | Soporta transacciones desde 4.0 pero performance penalizada |
| Integridad referencial (no asignar un conductor inexistente) | Foreign keys garantizadas por la DB | A nivel de aplicación |
| Costo de hosting demo (Supabase / Neon / Railway) | Gratis | Atlas free tier limitado |
| Comunidad y talento en Perú | Enorme | Menor |
| Multi-tenancy futuro (SaaS) | Row-level security nativo | Lógica a mano |
| Migraciones versionadas | Maduro (Prisma migrate, TypeORM, Knex) | Inmaduro |
| Curva de aprendizaje del equipo | Conocido | Conocido por reputación pero menos en práctica |

**Concesión planeada.** Si Raúl, tras escuchar el argumento, insiste en "que no sea SQL", la alternativa de respaldo aceptable es **Firebase Firestore**: real-time nativo, multiplataforma, costo cero en demo, validado por Qorinti en su V2.5000. No MongoDB self-hosted, que es el peor de los tres mundos para esta demo.

**Decisión final.** PostgreSQL 16 + PostGIS 3.4. Cliente preparado con script `docker-compose` que lo levanta en 30 segundos.

### 2.2 "Manejemos microservicios" — respondemos monolito modular

**Lo que dijo Raúl, textual:**
> *"El back-end a su vez, sabes que puedes tener un montón de microservicios ahí para el back-end, ¿no? En la medida que desde el front-end puedas llamar donde quiera que esté el microservicio que es parte del back-end, pues ya no interesaría. Entonces tenemos un proyecto, un VPS, por ejemplo, para el front-end, después tenemos otro VPS para el back-end o muchos VPS para distintos microservicios."*

**Lectura honesta.** Raúl está mezclando dos cosas: separación arquitectónica (front, back, DB en proyectos distintos, deployables independientemente) y microservicios (back-end fragmentado en servicios autónomos, comunicados por red). La primera es buena ingeniería; la segunda es una decisión de escala que para una demo y para un V1 está fuera de presupuesto y de necesidad.

**El costo real de los microservicios** (lo que no se ve en diagramas bonitos):

| Costo | Microservicios | Monolito modular |
|---|---|---|
| Coordinación entre servicios (transacciones distribuidas, sagas, compensación) | Alto, requiere ingeniería seria | No existe |
| Observabilidad (tracing distribuido, correlación de logs) | Indispensable, complejo | Logs en un solo proceso |
| DevOps (orquestación, service discovery, circuit breakers) | Kubernetes o equivalente | Un `docker-compose up` |
| Latencia (cada llamada cruza red) | 10–50 ms por hop | Llamada a función, microsegundos |
| Tiempo de bootstrapping | Semanas | Horas |
| Costo de hosting | Múltiples VPS, base | Un VPS o serverless |
| Talento requerido | Equipo de 4+ con SRE | Una persona |

**La solución correcta**, que cumple el espíritu del pedido sin pagar el costo: **monolito modular bien organizado, deployable de forma independiente del frontend y de la base de datos**.

- El **backend** (NestJS) está internamente dividido en módulos por dominio: `auth`, `users`, `reservations`, `assignments`, `tracking`, `qr`, `notifications`, `receipts`, `admin`. Cada módulo tiene controllers, services, repositories y DTOs propios. Las dependencias entre módulos son explícitas y unidireccionales.
- El **frontend móvil** (Flutter) es un proyecto separado, deployable a stores.
- El **frontend web** (Next.js) es otro proyecto separado, deployable a Vercel.
- La **base de datos** es un servicio gestionado (Supabase / Railway Postgres) o un contenedor independiente.

Eso cumple "front, back y DB pueden vivir en distintas nubes" — porque pueden. Y cuando uno de los módulos del backend necesite extraerse a microservicio (por carga real, no por moda), el límite ya existe en el código y la extracción es un trabajo de días, no de meses.

**Frase para reunión:** *"Tomamos en cuenta tu sugerencia. La arquitectura es modular y desacoplada — cada componente puede vivir donde quieras — pero el backend es un solo servicio internamente dividido en módulos. Cuando el volumen lo justifique, cualquier módulo puede extraerse como microservicio sin reescribir nada. Hacerlo desde el día 1 cuesta tiempo y no resuelve ningún problema real que tengamos."*

### 2.3 "Front en Google Cloud, back en Azure, DB en Mongo Atlas" — respondemos portabilidad

**Lo que dijo Raúl, textual:**
> *"El front-end lo podemos tener, por ejemplo, en Google Cloud, el back-end lo podemos tener en Azure, por ejemplo, y la base de datos la podemos tener en la nube de Mongo. No debemos depender de una sola digamos los componentes arquitectónicos."*

**Lectura honesta.** El cliente quiere **independencia de proveedor**. No es que necesite que cada cosa esté en una nube distinta hoy; lo que no quiere es estar atado a un proveedor mañana. Eso es preocupación legítima.

**La respuesta correcta:** dockerizar todo, usar configuración por variables de entorno, evitar servicios propietarios que aten. La aplicación queda apta para correr en:
- Railway, Render, Fly.io (PaaS modernos)
- DigitalOcean, Linode, Hetzner (VPS clásicos)
- AWS Elastic Beanstalk, GCP Cloud Run, Azure App Service (clouds grandes)
- On-premise (si el cliente lo pide)

Demo desplegada en **Railway + Supabase + Vercel** porque es lo más rápido y barato — pero la decisión es reversible en horas, no meses. Ese es el punto.

**Frase para reunión:** *"Diseñamos pensando exactamente en lo que pediste: la aplicación es portable. Hoy la corremos donde sea más barato y rápido para la demo; cuando se produzca, eligen ustedes el proveedor y movemos. La separación que pediste vive en la arquitectura, no en la elección de marca del cloud."*

### 2.4 "Las tecnologías más modernas, con mayor comunidad" — confirmamos

**Lo que dijo Raúl, textual:**
> *"Habría que usar las más presentes y las que tienen mayor soporte, se actualizan con frecuencia, que tienen una mayor comunidad de usuarios."*

Este criterio es sano y lo respetamos en toda elección. Cada tecnología elegida cumple:

| Tecnología | Última versión estable a 2026-05 | Tamaño de comunidad | Soporte | Madurez |
|---|---|---|---|---|
| Flutter 3.x | 3.27+ | Top 10 global frameworks móviles | Google + comunidad enorme | 8+ años producción |
| Next.js 15 | 15.x | Top 3 frameworks web JS | Vercel + comunidad | 10+ años |
| NestJS | 10.x | Top backend Node | Comunidad muy activa | 7+ años |
| PostgreSQL | 16 | Estándar oro DBs relacionales | Comunidad open + comerciales | 28 años |
| Socket.IO | 4.x | Estándar de facto real-time JS | Activo | 14 años |
| Mapbox GL | v3 | Top 3 mapas web/móvil | Empresa estable | 14 años |
| Firebase Cloud Messaging | v1 API | Estándar para push | Google | 10+ años |

Ninguna elección es exótica, ninguna es legacy, ninguna está en deprecación.

---

## 3. Principios de ingeniería que guían la build

Acuerdo del equipo antes de escribir la primera línea. Estos principios son **no negociables** durante los 15 días de sprint. Cualquier conflicto se resuelve consultando esta sección.

1. **La demo es un producto, no un prototipo.** Cero `console.log` olvidados, cero TODOs en código mostrable, cero placeholder text ("lorem ipsum"). Lo que el cliente ve, está terminado.
2. **Real-time o no es demo.** Cada cambio relevante de estado se refleja en menos de 1 segundo en todas las pantallas conectadas. Si algo no es real-time, no se muestra en presentación.
3. **Determinismo.** La demo se ensaya con datos semilla idénticos. Las mismas tres reservas, los mismos cinco conductores, las mismas tres unidades. Nada al azar.
4. **Fail loud.** En desarrollo: errores claros, stacktraces completos. En demo: errores capturados y reemplazados por estado neutro, jamás un toast rojo en frente del cliente.
5. **Reversibilidad.** Toda acción crítica del admin (asignar, cancelar) puede deshacerse. Cero "¿está seguro?" — pero todo regresable.
6. **Una sola fuente de verdad.** El backend es la verdad. El frontend deriva. Cero estado duplicado mantenido a mano.
7. **No optimizar lo que no se ha medido.** Performance budget en §20. Si está dentro, no se toca.
8. **No abstraer antes de tiempo.** Tres usos del mismo patrón antes de extraer una abstracción. Para 15 días, dos a lo sumo.
9. **No mock lo que se puede hacer real barato.** El GPS es real porque es barato hacerlo real. La pasarela es mock porque hacerlo real cuesta semanas. La línea está en costo, no en virtud.
10. **El código tiene que sobrevivir al proyecto.** Si Taxi Green compra, este código es la base del V1. Por lo tanto, las decisiones de hoy importan en 12 meses.

---

## 4. Arquitectura de software en profundidad

### 4.1 Diagrama de despliegue (físico)

```
                  ┌────────────────────────────────────────────────┐
                  │   Internet                                     │
                  └────────────────────────────────────────────────┘
                              │
                              │ HTTPS, WSS
                              ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │  Vercel          │  │  Railway         │  │  Supabase        │
   │  apps/web        │  │  apps/api        │  │  Postgres+PostGIS│
   │  Next.js 15      │  │  NestJS 10       │  │  + Storage       │
   │  edge runtime    │  │  Node 20         │  │  managed         │
   └──────────────────┘  └─────────┬────────┘  └────────▲─────────┘
                                   │                    │
                                   │ TCP                │ SQL
                                   ├────────────────────┘
                                   │
   ┌──────────────────┐  ┌─────────▼────────┐  ┌──────────────────┐
   │ Mapbox API       │◄─┤  apps/api        ├─►│  Firebase Cloud  │
   │ tiles + geocoder │  │  exposes:        │  │  Messaging       │
   └──────────────────┘  │  REST /api/v1    │  │  push only       │
                         │  WS /socket      │  └──────────────────┘
                         └─────────┬────────┘
                                   │
                                   │ HTTPS, WSS
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
   ┌──────────────────────┐         ┌──────────────────────┐
   │  Android phone /     │         │  iOS phone /         │
   │  emulator            │         │  TestFlight          │
   │  apps/mobile         │         │  apps/mobile         │
   │  Flutter             │         │  Flutter             │
   └──────────────────────┘         └──────────────────────┘
```

### 4.2 Diagrama de comunicación (lógico)

```
┌─────────────┐  REST: login, reservar, pagar (mock), ver historial  ┌─────────┐
│  Passenger  ├──────────────────────────────────────────────────────┤   API   │
│   (mobile)  ├──────────────────────────────────────────────────────┤  NestJS │
│             │  WS: position updates from driver, status changes    │         │
└─────────────┘                                                      │         │
                                                                     │         │
┌─────────────┐  REST: login, accept assignment, update status      │         │
│   Driver    ├──────────────────────────────────────────────────────┤         │
│   (mobile)  ├──────────────────────────────────────────────────────┤         │
│             │  WS: position broadcast 5s, new assignment           │         │
└─────────────┘                                                      │         │
                                                                     │         │
┌─────────────┐  REST: list reservations, assign driver+unit         │         │
│   Admin     ├──────────────────────────────────────────────────────┤         │
│   (web)     ├──────────────────────────────────────────────────────┤         │
│             │  WS: reservation:* events, fleet:position events     │         │
└─────────────┘                                                      │         │
                                                                     │         │
┌─────────────┐  REST: list arrivals, scan QR, assign in-airport     │         │
│ Supervisor  ├──────────────────────────────────────────────────────┤         │
│   (web)     ├──────────────────────────────────────────────────────┤         │
│             │  WS: same as admin                                   │         │
└─────────────┘                                                      └─────────┘
```

### 4.3 Capas dentro del backend (NestJS)

Cada módulo NestJS sigue la misma estructura:

```
src/modules/<module>/
  <module>.module.ts        // Wiring
  <module>.controller.ts    // HTTP endpoints (REST)
  <module>.gateway.ts       // WebSocket events (si aplica)
  <module>.service.ts       // Business logic
  repositories/             // Acceso a DB via Prisma
  dto/                      // Request/response shapes con class-validator
  entities/                 // Tipos de dominio
  events/                   // Definición de eventos emitidos
  tests/                    // Unit tests (no exhaustivo, solo crítico)
```

Reglas:
- Los controllers nunca contienen lógica de negocio. Solo: parsear, delegar al service, devolver.
- Los services nunca tocan HTTP. Reciben dominios, devuelven dominios o lanzan excepciones tipadas.
- Los repositories nunca lanzan errores HTTP. Solo errores de dominio.
- Los DTOs validan en la frontera (request) y serializan en la frontera (response). Cero leak de campos internos (`password_hash`, `qr_hmac` interno).
- Cada módulo expone una **interfaz pública** (su `Service`) que otros módulos pueden inyectar. La implementación es privada.

### 4.4 Inversión de dependencias

`assignments.service` no llama directamente a `notifications.service` ni a `tracking.service`. Emite eventos de dominio:

```ts
this.eventBus.emit(new ReservationAssignedEvent(reservation, driver, unit));
```

Los handlers (`NotificationsModule`, `TrackingModule`, `AnalyticsModule`) se suscriben. Esto desacopla y prepara extracción a microservicios si algún día se justifica.

### 4.5 Tres frontends, un design system

Tanto Flutter como Next.js consumen los mismos tokens de diseño (paleta, tipografía, radios, sombras, espaciados). Se mantienen en `packages/design-tokens` como JSON, y se compilan a:
- `packages/design-tokens/dart` → `final taxiGreenColors = ...` para Flutter.
- `packages/design-tokens/css` → variables CSS para Next.js.

Cambiar un color institucional es una sola edición. Eso protege contra incoherencia visual entre app y web — uno de los problemas que sufre `taxigreen.com.pe` hoy entre `/green/` y `/t/`.

---

## 5. Estructura del monorepo

```
demo-taxigreen/
├── apps/
│   ├── api/                # NestJS — backend único
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── reservations/
│   │   │   │   ├── assignments/
│   │   │   │   ├── tracking/
│   │   │   │   ├── qr/
│   │   │   │   ├── notifications/
│   │   │   │   ├── receipts/
│   │   │   │   ├── ratings/
│   │   │   │   ├── shared/      # guards, interceptors, decorators
│   │   │   │   └── infra/       # prisma, fcm, mapbox clients
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── test/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── mobile/             # Flutter — pasajero y conductor en una sola app
│   │   ├── lib/
│   │   │   ├── app.dart
│   │   │   ├── main.dart
│   │   │   ├── core/        # tema, router, di, env
│   │   │   ├── data/        # repositories, datasources, models
│   │   │   ├── domain/      # entities, usecases
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── passenger/
│   │   │   │   │   ├── home/
│   │   │   │   │   ├── booking/
│   │   │   │   │   ├── tracking/
│   │   │   │   │   ├── history/
│   │   │   │   │   └── receipt/
│   │   │   │   └── driver/
│   │   │   │       ├── home/
│   │   │   │       ├── assignment/
│   │   │   │       ├── trip/
│   │   │   │       └── history/
│   │   │   └── shared/      # widgets, utils
│   │   ├── assets/
│   │   ├── android/
│   │   ├── ios/
│   │   └── pubspec.yaml
│   │
│   └── web/                # Next.js — admin y supervisor
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/login/
│       │   │   ├── (admin)/dashboard/
│       │   │   ├── (admin)/reservations/[id]/
│       │   │   ├── (admin)/fleet/
│       │   │   ├── (supervisor)/airport/
│       │   │   └── (supervisor)/scan/
│       │   ├── components/  # shadcn/ui based
│       │   ├── lib/         # api client, ws client, auth
│       │   └── styles/
│       ├── public/
│       ├── next.config.ts
│       └── package.json
│
├── packages/
│   ├── shared-types/       # TS types compartidos api ↔ web
│   ├── design-tokens/      # Paleta, tipografía exportable a Dart y CSS
│   └── qr-protocol/        # Especificación común QR (TS + Dart)
│
├── infra/
│   ├── docker-compose.yml  # Postgres + api en local
│   ├── scripts/
│   │   ├── seed.sh
│   │   ├── reset-demo.sh
│   │   └── rehearse.sh
│   └── nginx/              # Solo para deploy avanzado
│
├── docs/
│   ├── PROPUESTA_DEMO.md
│   ├── PLAN_DE_SOFTWARE.md (este archivo)
│   ├── api-spec.md
│   ├── runbook-demo.md
│   └── adr/                # Architecture Decision Records
│
├── .github/
│   └── workflows/
│       ├── api-ci.yml
│       └── web-ci.yml
│
├── package.json            # workspaces root
├── pnpm-workspace.yaml
└── README.md
```

**Herramienta de monorepo:** pnpm workspaces. Más simple y menos opinionado que Nx o Turborepo para este tamaño. Si el proyecto crece a SaaS, se migra a Turborepo.

---

## 6. Modelo de datos completo

### 6.1 Esquema (DDL Postgres, equivalente Prisma)

```sql
-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- búsqueda fuzzy de nombres

-- =========================================================
-- IDENTIDAD Y EMPRESAS
-- =========================================================
CREATE TYPE user_role AS ENUM (
  'PASSENGER', 'DRIVER', 'ADMIN', 'SUPERVISOR', 'PLATFORM_OWNER'
);

CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ruc           VARCHAR(11) UNIQUE NOT NULL,
  legal_name    VARCHAR(200) NOT NULL,
  trade_name    VARCHAR(200),
  billing_email VARCHAR(150),
  phone         VARCHAR(20),
  is_provider   BOOLEAN NOT NULL DEFAULT false,  -- true para Taxi Green
  is_corporate  BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  phone         VARCHAR(20),
  photo_url     VARCHAR(500),
  role          user_role NOT NULL,
  company_id    UUID REFERENCES companies(id),  -- nullable para pasajero individual
  locale        VARCHAR(5) NOT NULL DEFAULT 'es-PE',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =========================================================
-- CONDUCTORES Y UNIDADES (por separado, como pidió Raúl)
-- =========================================================
CREATE TYPE driver_status AS ENUM (
  'OFFLINE', 'AVAILABLE', 'BUSY', 'AT_AIRPORT'
);

CREATE TABLE drivers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE NOT NULL REFERENCES users(id),
  national_id         VARCHAR(15) UNIQUE NOT NULL,  -- DNI o CE
  license_number      VARCHAR(20) UNIQUE NOT NULL,
  license_category    VARCHAR(5) NOT NULL,         -- A1, A2, etc.
  license_expires_at  DATE NOT NULL,
  speaks_english      BOOLEAN NOT NULL DEFAULT false,
  rating_avg          NUMERIC(3,2) DEFAULT 5.00,
  rating_count        INT DEFAULT 0,
  status              driver_status NOT NULL DEFAULT 'OFFLINE',
  is_approved         BOOLEAN NOT NULL DEFAULT true,  -- asumido true en demo
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE unit_type AS ENUM (
  'SEDAN', 'CAMIONETA', 'VAN', 'VAN_MASTER'
);

CREATE TABLE units (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate             VARCHAR(10) UNIQUE NOT NULL,
  brand             VARCHAR(50) NOT NULL,
  model             VARCHAR(50) NOT NULL,
  year              SMALLINT NOT NULL,
  type              unit_type NOT NULL,
  pax_capacity      SMALLINT NOT NULL,
  luggage_capacity  SMALLINT NOT NULL,
  color             VARCHAR(30),
  photo_url         VARCHAR(500),
  soat_expires_at   DATE NOT NULL,
  techrev_expires_at DATE NOT NULL,
  active            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- TARIFAS (plana por tipo + zona, suficiente para demo)
-- =========================================================
CREATE TABLE tariffs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_type   unit_type NOT NULL,
  zone_label  VARCHAR(80) NOT NULL,  -- "Lima Centro → Aeropuerto"
  base_amount NUMERIC(8,2) NOT NULL,
  toll_amount NUMERIC(8,2) NOT NULL DEFAULT 12.60,
  active      BOOLEAN NOT NULL DEFAULT true
);

-- =========================================================
-- RESERVAS Y VIAJES (entidad central)
-- =========================================================
CREATE TYPE reservation_status AS ENUM (
  'PENDING_ASSIGNMENT',  -- recién creada, paga, esperando admin
  'ASSIGNED',            -- conductor + unidad asignados
  'EN_ROUTE_TO_PICKUP',  -- conductor en camino al pasajero
  'IN_PROGRESS',         -- viaje empezó
  'COMPLETED',           -- viaje terminado
  'RATED',               -- pasajero calificó
  'SETTLED',             -- pago liquidado al conductor (fuera de demo)
  'CANCELLED',
  'NO_SHOW'
);

CREATE TYPE direction AS ENUM ('TO_AIRPORT', 'FROM_AIRPORT', 'POINT_TO_POINT');
CREATE TYPE receipt_type AS ENUM ('BOLETA', 'FACTURA');

CREATE TABLE reservations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_code           VARCHAR(15) UNIQUE NOT NULL,  -- TG-2026-04829
  passenger_id          UUID NOT NULL REFERENCES users(id),
  company_id            UUID REFERENCES companies(id),  -- para corporativo
  direction             direction NOT NULL,

  -- Origen
  origin_label          VARCHAR(300) NOT NULL,
  origin_point          GEOGRAPHY(POINT, 4326) NOT NULL,
  origin_reference      VARCHAR(300),

  -- Destino
  destination_label     VARCHAR(300) NOT NULL,
  destination_point     GEOGRAPHY(POINT, 4326) NOT NULL,
  destination_reference VARCHAR(300),

  -- Servicio
  scheduled_at          TIMESTAMPTZ NOT NULL,
  unit_type             unit_type NOT NULL,
  pax_count             SMALLINT NOT NULL DEFAULT 1,
  luggage_count         SMALLINT NOT NULL DEFAULT 0,
  include_toll          BOOLEAN NOT NULL DEFAULT true,

  -- Vuelo (si direction = FROM_AIRPORT)
  flight_number         VARCHAR(10),
  flight_airline        VARCHAR(80),
  flight_eta            TIMESTAMPTZ,

  -- Tarifa
  fare_amount           NUMERIC(8,2) NOT NULL,
  toll_amount           NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_amount          NUMERIC(8,2) NOT NULL,

  -- Comprobante
  receipt_type          receipt_type NOT NULL DEFAULT 'BOLETA',
  receipt_ruc           VARCHAR(11),
  receipt_legal_name    VARCHAR(200),

  -- Asignación
  assigned_driver_id    UUID REFERENCES drivers(id),
  assigned_unit_id      UUID REFERENCES units(id),
  assigned_by_user_id   UUID REFERENCES users(id),
  assigned_at           TIMESTAMPTZ,

  -- QR
  qr_token              VARCHAR(255) UNIQUE,        -- token público
  qr_signature          VARCHAR(64),                -- HMAC, no expone
  qr_issued_at          TIMESTAMPTZ,

  -- Estado
  status                reservation_status NOT NULL DEFAULT 'PENDING_ASSIGNMENT',

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_passenger ON reservations(passenger_id);
CREATE INDEX idx_reservations_driver ON reservations(assigned_driver_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_scheduled ON reservations(scheduled_at);
CREATE INDEX idx_reservations_public_code ON reservations(public_code);
CREATE INDEX idx_reservations_qr_token ON reservations(qr_token);

CREATE TABLE trips (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id      UUID UNIQUE NOT NULL REFERENCES reservations(id),
  started_at          TIMESTAMPTZ,
  ended_at            TIMESTAMPTZ,
  distance_km         NUMERIC(7,3),
  duration_min        INT,
  polyline_recorded   TEXT,  -- encoded polyline, formato Google
  passenger_confirmed BOOLEAN NOT NULL DEFAULT false,
  driver_confirmed    BOOLEAN NOT NULL DEFAULT false
);

-- =========================================================
-- POSICIONES GPS (time-series-ish, alta cardinalidad)
-- =========================================================
CREATE TABLE driver_positions (
  id            BIGSERIAL PRIMARY KEY,
  driver_id     UUID NOT NULL REFERENCES drivers(id),
  trip_id       UUID REFERENCES trips(id),
  point         GEOGRAPHY(POINT, 4326) NOT NULL,
  heading       NUMERIC(5,2),         -- grados, 0..360
  speed_kmh     NUMERIC(6,2),
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_driver_positions_driver_time
  ON driver_positions(driver_id, recorded_at DESC);

CREATE INDEX idx_driver_positions_point
  ON driver_positions USING GIST(point);

-- Retención: para demo no se hace cleanup. En producción, una partición
-- mensual o un cron de purge a 30 días.

-- =========================================================
-- PAGOS Y COMPROBANTES (simulados en demo)
-- =========================================================
CREATE TYPE payment_method AS ENUM (
  'CARD', 'YAPE', 'PLIN', 'CASH', 'CORPORATE_CREDIT'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'
);

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id  UUID UNIQUE NOT NULL REFERENCES reservations(id),
  method          payment_method NOT NULL,
  amount          NUMERIC(8,2) NOT NULL,
  status          payment_status NOT NULL,
  gateway_ref     VARCHAR(100),       -- mock en demo
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE receipts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id  UUID UNIQUE NOT NULL REFERENCES reservations(id),
  type            receipt_type NOT NULL,
  series          VARCHAR(4) NOT NULL,  -- B001, F001
  number          INT NOT NULL,
  total           NUMERIC(8,2) NOT NULL,
  pdf_url         VARCHAR(500),
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  sunat_mock_id   VARCHAR(50)
);

CREATE UNIQUE INDEX idx_receipts_series_number ON receipts(series, number);

-- =========================================================
-- CALIFICACIONES (3 separadas, como pidió Raúl)
-- =========================================================
CREATE TABLE ratings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id      UUID UNIQUE NOT NULL REFERENCES reservations(id),
  service_rating      SMALLINT NOT NULL CHECK (service_rating BETWEEN 1 AND 5),
  driver_rating       SMALLINT NOT NULL CHECK (driver_rating BETWEEN 1 AND 5),
  unit_rating         SMALLINT NOT NULL CHECK (unit_rating BETWEEN 1 AND 5),
  comment             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- NOTIFICACIONES Y AUDITORÍA
-- =========================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  kind        VARCHAR(50) NOT NULL,
  title       VARCHAR(150) NOT NULL,
  body        VARCHAR(500) NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE TABLE audit_log (
  id              BIGSERIAL PRIMARY KEY,
  actor_id        UUID REFERENCES users(id),
  action          VARCHAR(100) NOT NULL,
  resource_type   VARCHAR(50) NOT NULL,
  resource_id     UUID,
  payload         JSONB,
  ip              INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- TOKENS DEVICE (para FCM push)
-- =========================================================
CREATE TABLE device_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  token       VARCHAR(500) UNIQUE NOT NULL,
  platform    VARCHAR(10) NOT NULL,  -- 'ios', 'android'
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.2 Invariantes de negocio que la DB enforces

1. Un `public_code` siempre tiene el formato `TG-YYYY-NNNNN` (validado en service, no en check constraint).
2. Una reserva en estado `IN_PROGRESS` tiene siempre `assigned_driver_id` y `assigned_unit_id` no nulos.
3. Una reserva en estado `RATED` tiene siempre una fila en `ratings`.
4. `qr_token` se genera solo al pasar a estado `ASSIGNED` (o, en flujo aeropuerto, al crear la reserva si se trata de meet-and-greet pasajero invitado).
5. `driver_positions` se inserta solo si el driver tiene un trip activo o está marcado `AVAILABLE` con app abierta.
6. La unicidad de `(series, number)` en receipts simula la unicidad SUNAT.

### 6.3 Estrategia de migraciones

Prisma migrate. Cada cambio de esquema es una migración versionada con timestamp en `apps/api/prisma/migrations/`. En demo nunca se reescribe migration; se añade. Eso protege contra perder estado en ensayos.

---

## 7. Contrato de API REST

Base URL: `/api/v1`. JSON. Bearer token JWT en `Authorization: Bearer <token>`. Errores en formato:

```json
{
  "error": {
    "code": "RESERVATION_NOT_FOUND",
    "message": "La reserva solicitada no existe o fue cancelada.",
    "details": {}
  }
}
```

Códigos HTTP: 200, 201, 204, 400, 401, 403, 404, 409 (conflicto de estado), 422 (validación), 500.

### 7.1 Endpoints completos para la demo

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/auth/login` | público | Login con email + password, devuelve JWT + perfil |
| POST | `/auth/refresh` | público | Renueva access token con refresh token |
| POST | `/auth/logout` | autenticado | Invalida refresh token |
| GET | `/me` | autenticado | Perfil del usuario actual |
| PUT | `/me` | autenticado | Actualiza perfil (foto, nombre, teléfono) |
| POST | `/me/device-tokens` | autenticado | Registra token FCM |
| **PASAJERO** | | | |
| POST | `/reservations` | PASSENGER | Crea reserva. Body: ver §7.2.1 |
| GET | `/reservations` | PASSENGER | Lista mis reservas, paginado |
| GET | `/reservations/:id` | PASSENGER, ADMIN | Detalle |
| POST | `/reservations/:id/pay` | PASSENGER | Procesa pago (mock). Body: método |
| GET | `/reservations/:id/qr` | PASSENGER | QR como SVG o data URL |
| GET | `/reservations/:id/receipt.pdf` | PASSENGER | PDF del comprobante |
| POST | `/reservations/:id/share` | PASSENGER | Genera link público temporal de tracking |
| POST | `/reservations/:id/cancel` | PASSENGER | Cancela (si políticas lo permiten) |
| POST | `/reservations/:id/rate` | PASSENGER | Califica (3 estrellas separadas) |
| POST | `/reservations/:id/confirm-arrival` | PASSENGER | "Ya llegué a destino" |
| GET | `/reservations/:id/track` (público con token) | anónimo con token | Posición del conductor (compartir viaje) |
| **CONDUCTOR** | | | |
| GET | `/driver/assignments` | DRIVER | Mis asignaciones activas |
| POST | `/driver/status` | DRIVER | Online/offline/at-airport |
| POST | `/driver/positions` | DRIVER | Reporta posición (batch acepta hasta 10) |
| POST | `/driver/reservations/:id/start` | DRIVER | "Iniciar viaje" |
| POST | `/driver/reservations/:id/complete` | DRIVER | "Servicio atendido" |
| **ADMIN** | | | |
| GET | `/admin/reservations` | ADMIN | Lista con filtros: estado, fecha, dirección |
| POST | `/admin/reservations/:id/assign` | ADMIN | Asigna conductor + unidad |
| POST | `/admin/reservations/:id/unassign` | ADMIN | Quita asignación |
| GET | `/admin/drivers` | ADMIN | Lista de conductores con estado |
| GET | `/admin/units` | ADMIN | Lista de unidades |
| GET | `/admin/fleet/positions` | ADMIN | Snapshot de posiciones actuales |
| GET | `/admin/stats/today` | ADMIN | KPIs del día (reservas, % cumplimiento, etc.) |
| **SUPERVISOR (aeropuerto)** | | | |
| GET | `/supervisor/arrivals` | SUPERVISOR | Reservas FROM_AIRPORT pendientes hoy |
| POST | `/supervisor/qr/validate` | SUPERVISOR | Valida QR escaneado, devuelve detalles |
| POST | `/supervisor/reservations/:id/assign` | SUPERVISOR | Asigna en aeropuerto |
| **CATÁLOGOS** | | | |
| GET | `/catalog/unit-types` | autenticado | Lista de tipos con tarifas indicativas |
| POST | `/catalog/fare-estimate` | autenticado | Calcula tarifa para origen/destino/tipo |
| GET | `/catalog/airlines` | autenticado | Autocomplete de aerolíneas |

### 7.2 Ejemplos de payload

#### 7.2.1 Crear reserva

Request `POST /api/v1/reservations`:
```json
{
  "direction": "TO_AIRPORT",
  "origin": {
    "label": "Av. Pardo 610, Miraflores",
    "lat": -12.1213, "lng": -77.0298,
    "reference": "Edificio Torre Pardo, frente al parque"
  },
  "destination": {
    "label": "Aeropuerto Internacional Jorge Chávez",
    "lat": -12.0219, "lng": -77.1143
  },
  "scheduledAt": "2026-05-21T22:00:00-05:00",
  "unitType": "CAMIONETA",
  "paxCount": 1,
  "luggageCount": 2,
  "includeToll": true,
  "receiptType": "FACTURA",
  "receiptRuc": "20100070970",
  "receiptLegalName": "LATAM Airlines Perú S.A."
}
```

Response 201:
```json
{
  "id": "7f3e...",
  "publicCode": "TG-2026-04829",
  "fareAmount": 65.00,
  "tollAmount": 12.60,
  "totalAmount": 77.60,
  "status": "PENDING_ASSIGNMENT",
  "paymentRequired": true,
  "paymentUrl": "/api/v1/reservations/7f3e.../pay"
}
```

#### 7.2.2 Asignar conductor y unidad (admin)

Request `POST /api/v1/admin/reservations/7f3e.../assign`:
```json
{
  "driverId": "abc123...",
  "unitId": "def456...",
  "notifyPassenger": true,
  "notifyDriver": true
}
```

Response 200:
```json
{
  "status": "ASSIGNED",
  "assignedAt": "2026-05-21T20:15:32Z",
  "qrToken": "eyJ0...",
  "driver": { "id": "...", "fullName": "Luis Ramírez", "rating": 4.9, "photoUrl": "..." },
  "unit": { "id": "...", "plate": "BTW-431", "brand": "Toyota", "model": "Hilux" }
}
```

#### 7.2.3 Estimar tarifa

Request `POST /api/v1/catalog/fare-estimate`:
```json
{
  "origin": { "lat": -12.1213, "lng": -77.0298 },
  "destination": { "lat": -12.0219, "lng": -77.1143 },
  "unitType": "CAMIONETA",
  "includeToll": true
}
```

Response 200:
```json
{
  "distanceKm": 11.8,
  "estimatedMinutes": 27,
  "fareAmount": 65.00,
  "tollAmount": 12.60,
  "totalAmount": 77.60,
  "breakdown": {
    "base": 30.00,
    "perKm": 2.5,
    "unitTypeSurcharge": 5.50
  }
}
```

### 7.3 Versionado

Todas las rutas viven bajo `/api/v1`. Cualquier cambio breaking implica `/v2`. Para la demo no se cambia versión.

### 7.4 Idempotencia

`POST /reservations` y `POST /driver/positions` aceptan header `Idempotency-Key`. Si se repite con la misma key dentro de 24 h, se devuelve el resultado original. Crítico para reintentos del cliente móvil con red intermitente.

### 7.5 Paginación

Listados aceptan `?cursor=<base64>&limit=<n>`. Cursor-based, no offset. Performance estable.

---

## 8. Contrato de eventos WebSocket

Socket.IO sobre namespace único `/socket`. Tras conectar, el cliente se autentica con JWT en el handshake. Tras autenticar, se une automáticamente a sus rooms según rol.

### 8.1 Rooms

| Room | Quién entra | Qué recibe |
|---|---|---|
| `user:{userId}` | el propio usuario | sus notificaciones |
| `reservation:{reservationId}` | pasajero, conductor, admin de esa reserva | todos los eventos de esa reserva |
| `admin:global` | todos los ADMIN | todas las reservas nuevas, todas las posiciones |
| `supervisor:airport` | todos los SUPERVISOR | reservas FROM_AIRPORT |
| `driver:active` | todos los DRIVER online | broadcast de nuevas asignaciones potenciales (V2, no demo) |

### 8.2 Eventos servidor → cliente

| Evento | Payload | Quién lo recibe |
|---|---|---|
| `reservation:created` | `{ reservation }` | admin:global, supervisor:airport (si aplica) |
| `reservation:assigned` | `{ reservation, driver, unit }` | reservation room, driver, passenger |
| `reservation:status_changed` | `{ reservationId, from, to, timestamp }` | reservation room, admin:global |
| `reservation:cancelled` | `{ reservationId, reason }` | reservation room, admin:global |
| `driver:position` | `{ driverId, lat, lng, heading, speedKmh, timestamp }` | admin:global, room del trip si en curso |
| `passenger:notification` | `{ kind, title, body, payload }` | user:{userId} |
| `trip:started` | `{ tripId, reservationId, startedAt }` | reservation room |
| `trip:completed` | `{ tripId, reservationId, distance, duration }` | reservation room, admin:global |

### 8.3 Eventos cliente → servidor

Mínimos. El cliente prefiere REST para acciones imperativas (mejor para idempotencia y debugging). El único evento útil cliente→servidor es:

| Evento | Payload | Emisor |
|---|---|---|
| `driver:heartbeat` | `{ lat, lng, heading, speedKmh }` | DRIVER cada 5 s mientras está online |

Las demás acciones (asignar, completar, calificar) se hacen vía REST y el servidor emite los eventos resultantes.

### 8.4 Reconexión

Socket.IO reconecta automáticamente con backoff exponencial (1s, 2s, 4s, 8s, hasta 30s). Al reconectar, el cliente solicita resincronización vía REST (`GET /reservations` o `GET /admin/reservations`). El estado real-time es **derivado**, nunca la verdad. Esto protege contra pantallas inconsistentes si la red falla.

---

## 9. Especificación del QR-Voucher

El QR es la pieza criptográfica más importante de la demo. Debe ser **a prueba de fotos** (no clonable con captura de pantalla, validable offline si fuera necesario, expirable).

### 9.1 Formato del payload

Codificación: **base64url** (sin padding) de un JSON compacto.

```json
{
  "rid": "7f3e...",                 // reservation id
  "pcd": "TG-2026-04829",           // public code para legibilidad
  "pid": "abc...",                  // passenger id
  "ts":  1716329732,                // issued at, unix
  "exp": 1716416132,                // expires at, unix (24h after ts)
  "ver": 1
}
```

### 9.2 Firma

Tras serializar el JSON a base64url, se calcula:

```
signature = base64url( HMAC_SHA256(serverSecret, payload) )
token     = payload + "." + signature
```

`serverSecret` vive en variable de entorno, nunca en el cliente. La rotación de secret invalida todos los QR existentes (en demo no se rota).

### 9.3 Contenido del QR físico

El QR no contiene el token crudo. Contiene una URL:

```
https://taxigreen.demo/qr/v/{token}
```

Eso permite que **cualquier cámara de celular pueda escanearlo** (no requiere la app), abriendo el navegador y mostrando el detalle público de la reserva. La validación criptográfica de identidad ocurre cuando el supervisor escanea desde su panel autenticado.

### 9.4 Validación server-side

```ts
// Pseudo-código
function validateQrToken(token: string): ValidationResult {
  const [payloadB64, signatureB64] = token.split('.');
  if (!payloadB64 || !signatureB64) return invalid('MALFORMED');

  const expected = hmacSha256(serverSecret, payloadB64);
  if (!constantTimeEqual(expected, base64UrlDecode(signatureB64))) {
    return invalid('BAD_SIGNATURE');
  }

  const payload = JSON.parse(base64UrlDecode(payloadB64));
  if (payload.exp < nowUnix()) return invalid('EXPIRED');

  const reservation = await reservationsRepo.findById(payload.rid);
  if (!reservation) return invalid('NOT_FOUND');
  if (reservation.status === 'CANCELLED') return invalid('CANCELLED');

  return valid(reservation);
}
```

`constantTimeEqual` previene timing attacks (irrelevante en demo, importante en producción; lo dejamos hecho de una vez).

### 9.5 Renderizado en pasajero

La pantalla "Mi reserva" muestra:
- QR generado vía `qr_flutter` (Flutter) o `qrcode` (Node) en SVG.
- Información humana legible debajo: código de reserva, fecha, conductor (si ya asignado), unidad.
- Reload automático cada 60 s para reflejar cambios de estado del backend (con backoff si falla).

### 9.6 Escaneo en supervisor

El panel del supervisor usa `BarcodeDetector` (API nativa del browser donde está disponible) o `@zxing/library` como fallback universal. La cámara se solicita con `getUserMedia({video: { facingMode: 'environment' }})`. Tras detectar un QR, se llama a `POST /supervisor/qr/validate` y la UI muestra:

```
✓ Reserva válida
Pasajero:   Ana López
Vuelo:      LATAM LA2477  (aterrizó hace 22 min)
Destino:    San Juan de Lurigancho
Unidad:     CAMIONETA
[Asignar conductor + unidad]
```

---

## 10. Sistema de notificaciones push

### 10.1 Stack

- **FCM** (Firebase Cloud Messaging) HTTP v1 API. Único uso de Firebase en todo el sistema. No Auth, no Firestore, solo push.
- En Flutter, paquete `firebase_messaging`.
- En el backend, `firebase-admin` para enviar.

### 10.2 Registro de tokens

Cuando la app móvil arranca:
1. Pide permisos de notificación (iOS / Android 13+).
2. Obtiene token FCM del dispositivo.
3. POST `/me/device-tokens` con `{token, platform}`.
4. Renueva en cada `onTokenRefresh`.

### 10.3 Eventos que disparan push

| Evento | Destinatario | Título | Body |
|---|---|---|---|
| Reserva creada | passenger | "Reserva confirmada" | "Código TG-2026-XXXXX. Estamos buscando tu conductor." |
| Conductor asignado | passenger | "Conductor en camino" | "Luis con BTW-431 te recogerá a las 22:00." |
| Conductor asignado | driver | "Nuevo servicio" | "Recoger a Ana en San Isidro, 22:00." |
| Conductor a 5 min | passenger | "Tu Taxi Green está cerca" | "BTW-431 llega en ~5 min." |
| Viaje iniciado | passenger | "Buen viaje" | "Camino al aeropuerto. Ver ruta en vivo." |
| Viaje completado | passenger | "Servicio finalizado" | "Tu comprobante está listo. Califica tu viaje." |

### 10.4 Deeplinks

Cada push lleva `data: { kind, reservationId, screen }`. La app, al abrirla, navega directo a la pantalla relevante. Eso es lo que da la sensación premium en la demo: el cliente toca el push y aparece donde tiene que aparecer.

### 10.5 Fallback si FCM falla

Si el push no llega (red del cliente bloquea Google), el WebSocket lo cubre. La app muestra un toast in-app idéntico al push, derivado del evento WebSocket. El cliente nunca percibe que FCM falló.

---

## 11. Geolocalización y tracking

### 11.1 Permisos

Flutter solicita permisos en orden:
1. `Location.requestService()` — pide al usuario habilitar GPS si está apagado.
2. `Location.requestPermission()` — `whileInUse` es suficiente para demo.
3. Background location no se solicita en demo (complica el flujo de permisos).

### 11.2 Estrategia de envío

| Estado del conductor | Frecuencia |
|---|---|
| OFFLINE | sin envíos |
| AVAILABLE | cada 30 s |
| BUSY (viaje en curso) | cada 5 s |
| AT_AIRPORT | cada 60 s |

Implementación: timer en la app del conductor + `flutter_background_geolocation` solo si se aprueba. Para demo, se asume app en foreground.

### 11.3 Batching

Las posiciones se envían en batch de hasta 5 puntos por request a `POST /driver/positions`. Eso reduce overhead de red y batería. Si el batch falla, se reintenta exponencialmente con jitter (1s, 3s, 9s, 27s).

### 11.4 Rendering en frontends

- **Pasajero**: ve la posición del conductor asignado interpolada suavemente en el mapa. Si llegan dos puntos consecutivos, se anima la transición durante el intervalo. Eso da sensación de movimiento continuo, no saltos.
- **Admin**: ve toda la flota como puntos. Refresh cada 5 s sin movimiento.
- **Supervisor**: solo se ven los conductores `AT_AIRPORT`.

### 11.5 Simulación para escenario controlado

Para ensayo y para la demo (cuando los dispositivos están quietos en una sala), existe un comando:

```bash
pnpm demo:simulate-trip --reservationId=TG-2026-04829 --speed=30
```

Este script genera puntos GPS interpolados a lo largo de la ruta calculada por Mapbox Directions, a 30 km/h. Eso permite ver el marcador moviéndose en vivo aun sin que el dispositivo se mueva físicamente. El script se ejecuta desde la laptop de presentación al momento de "iniciar viaje" en la demo.

---

## 12. Seguridad

Demo no significa inseguro. Las prácticas básicas están desde el día 1.

| Aspecto | Implementación |
|---|---|
| Password storage | bcrypt cost 12 |
| JWT | HS256, access 24h, refresh 30d, secret en env var |
| HTTPS | obligatorio en producción, Railway/Vercel lo dan automático |
| CORS | allowlist explícita: dominio web, scheme `taxigreen://` (deep link mobile) |
| Rate limiting | `@nestjs/throttler` 100 req/min por IP, 1000 req/h |
| SQL injection | Prisma ORM, queries parametrizadas siempre |
| XSS | Next.js auto-escapa; en mobile no aplica directamente |
| CSRF | n/a (API stateless con JWT) |
| Headers de seguridad | `helmet` en NestJS: HSTS, X-Content-Type, X-Frame-Options |
| Secretos | `.env` nunca committeado; en producción, variables del PaaS |
| Auditoría | tabla `audit_log` registra acciones críticas (asignar, cancelar) |
| Permisos | Guards en NestJS por rol; cada endpoint declara `@Roles('ADMIN')` |
| QR firmado | HMAC-SHA256, secret rotable |
| Comunicación frontend ↔ backend | exclusivamente HTTPS/WSS |
| Logs sin secretos | regla de filtros en logger — no se loggean passwords, tokens, payloads de pago |

Lo que **no** está en la demo y debe estar en V1:
- 2FA para admin.
- Bloqueo de cuenta tras N intentos fallidos.
- Rotación automática de tokens.
- Encriptación a nivel de columna para campos sensibles.
- Pentest formal.

---

## 13. Datos semilla y escenarios de demo

### 13.1 Seed determinista

`apps/api/prisma/seed.ts` carga:

- **2 empresas**: GREEN AIRPORT S.A. (proveedor, RUC 20100070970) y LATAM Airlines Perú S.A. (corporativo, RUC 20100070970 — placeholder).
- **5 usuarios**:
  - `ana@latam.pe` / `demo1234` — pasajera ejecutiva (Ana López)
  - `carlos@gmail.com` / `demo1234` — pasajero individual
  - `luis@taxigreen.pe` / `demo1234` — conductor (Luis Ramírez)
  - `diego@taxigreen.pe` / `demo1234` — conductor 2 (Diego Vega, habla inglés)
  - `pedro@taxigreen.pe` / `demo1234` — supervisor aeropuerto
  - `admin@taxigreen.pe` / `demo1234` — administrador
- **3 unidades**:
  - `BTW-431` Toyota Hilux CAMIONETA
  - `JKL-892` Hyundai Accent SEDAN
  - `MNP-105` Toyota Hiace VAN
- **6 tarifas** (combinaciones zona × tipo).
- **2 reservas pre-cargadas**:
  - Una `COMPLETED` ayer (para mostrar historial).
  - Una `PENDING_ASSIGNMENT` programada en 2 horas (para mostrar tracking en vivo si la presentación se atrasa).

### 13.2 Reset rápido entre ensayos

```bash
pnpm demo:reset
```

Ejecuta:
1. Trunca todas las tablas excepto `companies`, `users`, `drivers`, `units`, `tariffs`.
2. Reseed las 2 reservas demo.
3. Marca conductores como AVAILABLE.

Tiempo total: ~3 segundos. Crítico para ensayar el guion 5 veces en una tarde sin acumular ruido.

### 13.3 Modo "presentación"

Variable de entorno `DEMO_MODE=true` activa:
- Ocultar pantallas internas (logs, errores técnicos).
- Acelerar timers (push "conductor llegó" se dispara a los 15 s en lugar de esperar)
- Auto-recovery: si algún componente falla, se reintenta silenciosamente sin alert.

---

## 14. Sprints concretos

Cinco sprints de tres días útiles cada uno. Total: **15 días útiles ≈ 3 semanas calendario**. Cada sprint termina con un demo interno funcional, no con código a medias.

### Sprint 0 — Cimientos y diseño (días 1–3)

**Objetivo:** que el día 4 cualquier desarrollador del equipo pueda `git clone && pnpm install && pnpm dev` y tener todo corriendo en menos de 10 minutos.

**Backlog:**
- D1: Mockup Figma de las 14 pantallas core (passenger 6, driver 4, admin 3, supervisor 1). Definición final de paleta, tipografía, iconografía.
- D1: Decisión de design tokens, exportados a Dart y CSS.
- D1: Estructura del monorepo, `pnpm-workspace.yaml`, README maestro.
- D2: Esqueleto `apps/api` con NestJS + Prisma + Postgres en Docker. Migración inicial. Seeds básicos.
- D2: Esqueleto `apps/mobile` con Flutter, router, theme, splash. Compila a Android e iOS.
- D2: Esqueleto `apps/web` con Next.js 15, Tailwind, shadcn/ui, autenticación shell.
- D3: Auth end-to-end: login funciona en mobile y web contra `/auth/login`. JWT guard en backend.
- D3: WebSocket gateway base — el cliente conecta y se suscribe a su `user:{id}` room.
- D3: CI básico (GitHub Actions): lint + build + test smoke en cada PR.

**Criterios de aceptación:**
- [ ] `pnpm demo:reset && pnpm dev` levanta todo en menos de 30 s.
- [ ] Cualquier dev puede loguearse como Ana o como admin desde sus apps.
- [ ] Figma con 14 pantallas listo y aprobado por el equipo.
- [ ] No hay TODOs en código mostrable.

**Riesgos:**
- Curva de Flutter si el equipo es JS-first → mitigación: pareo el día 2.
- Bug raro de Apple Silicon con Postgres en Docker → mitigación: imagen `postgis/postgis:16-3.4` probada en Mac y Linux.

---

### Sprint 1 — Flujo de reserva pasajero (días 4–6)

**Objetivo:** el pasajero puede crear una reserva real (TO_AIRPORT) y verla en su lista. La reserva queda en `PENDING_ASSIGNMENT` y aparece en el panel admin en vivo.

**Backlog:**
- D4: Mobile — pantalla "Home pasajero" con dos CTAs: "Llévame al aeropuerto" / "Recógeme del aeropuerto".
- D4: Mobile — pantalla de búsqueda de origen con autocomplete (Mapbox Geocoding API). Permiso GPS real.
- D4: Mobile — pantalla de configuración de reserva (fecha/hora, tipo de unidad, pax, maletas, peaje).
- D4: Backend — `/catalog/fare-estimate` con Mapbox Directions API real.
- D5: Mobile — pantalla de comprobante (boleta/factura con RUC).
- D5: Mobile — pasarela de pago mock con animación y delay.
- D5: Backend — `/reservations` POST + `/reservations/:id/pay` mock.
- D6: Mobile — pantalla "Mi reserva" con QR generado.
- D6: Mobile — pantalla "Mis reservas" (lista).
- D6: Web admin — lista de reservas con WebSocket real-time. Aparece la reserva sin recargar.

**Criterios de aceptación:**
- [ ] Ana puede crear una reserva completa de Miraflores al aeropuerto en menos de 90 segundos.
- [ ] El QR es escaneable con cualquier app de cámara (abre URL pública).
- [ ] La tarifa se calcula con Mapbox real, no hardcoded.
- [ ] Cuando Ana paga, el admin ve la reserva entrar en vivo, sin recargar.

**Riesgos:**
- Cuota gratuita de Mapbox Geocoding → mitigación: usar cuenta de desarrollo + cache local de geocoder para Aeropuerto Jorge Chávez (consulta más frecuente).

---

### Sprint 2 — Asignación + conductor + notificaciones (días 7–9)

**Objetivo:** el admin asigna conductor + unidad. El conductor recibe push, abre la app, ve su asignación. El pasajero recibe push. Estado se sincroniza en las tres pantallas en menos de 1 segundo.

**Backlog:**
- D7: Web admin — panel detalle de reserva con selectores de conductor y unidad. Botón "Asignar".
- D7: Backend — `/admin/reservations/:id/assign`. Genera QR, dispara eventos.
- D7: Mobile — modo conductor (toggle de rol en home). Lista de "Mis asignaciones".
- D8: Mobile — pantalla detalle de asignación (conductor): datos del pasajero, mapa, botón "Iniciar viaje".
- D8: Backend + FCM — push notifications reales. Registro de tokens, envío al asignar.
- D8: Mobile — recepción de push, navegación deeplink.
- D9: Mobile (pasajero) — pantalla "Conductor en camino" con foto, datos, placa, botones llamar/WhatsApp.
- D9: Web admin — toast en vivo cuando hay nueva reserva, sonido suave (`new Audio('/sounds/ding.mp3').play()`).
- D9: Pulido: animaciones de transición, estados de carga, estados vacíos.

**Criterios de aceptación:**
- [ ] El push de "conductor asignado" llega al teléfono del pasajero en menos de 3 s tras la asignación.
- [ ] El conductor abre el push y aparece directo en la pantalla de la asignación.
- [ ] El admin ve el cambio de estado sin recargar.
- [ ] Si FCM falla, el WebSocket muestra el toast equivalente.

**Riesgos:**
- Configuración de FCM iOS requiere cuenta Apple Developer → mitigación: si no se tiene, demo iOS se hace por Android emulator espejado en pantalla; el resto del cliente no nota la diferencia.

---

### Sprint 3 — Tracking en vivo + flujo aeropuerto + supervisor (días 10–12)

**Objetivo:** el conductor "se mueve" en el mapa del pasajero y del admin. El flujo aeropuerto → destino funciona end-to-end con escaneo de QR por el supervisor.

**Backlog:**
- D10: Mobile (conductor) — emisión de posición cada 5 s vía WebSocket.
- D10: Backend — persistencia en `driver_positions` + rebroadcast a admin y reservation room.
- D10: Mobile (pasajero) — mapa con marcador del conductor interpolado.
- D10: Web admin — mapa de flota con marcadores en vivo.
- D11: Script de simulación de viaje (`pnpm demo:simulate-trip`).
- D11: Mobile (pasajero) — flujo FROM_AIRPORT: campos de vuelo, sin GPS requerido.
- D11: Web supervisor — pantalla `/supervisor/airport` con lista de arrivals.
- D12: Web supervisor — escaneo de QR con cámara del browser (`@zxing/library`).
- D12: Web supervisor — pantalla post-escaneo con asignación in-situ.
- D12: Compartir viaje: link público `/track/:token` (público, no requiere login).

**Criterios de aceptación:**
- [ ] El marcador del conductor se mueve suavemente en el mapa del pasajero y del admin.
- [ ] El supervisor puede escanear un QR generado en el celular del pasajero desde una laptop o tablet en menos de 2 segundos.
- [ ] El link de compartir viaje funciona desde cualquier navegador, incluso sin login.
- [ ] `pnpm demo:simulate-trip` mueve el marcador realista a 30 km/h por la ruta calculada.

**Riesgos:**
- BarcodeDetector no está en Safari → mitigación: `@zxing/library` cubre todos los browsers.

---

### Sprint 4 — Cierre + comprobante + calificación + polish (días 13–15)

**Objetivo:** el viaje termina, llega comprobante con apariencia SUNAT, el pasajero califica con tres estrellas separadas, y la demo está al 100% pulida.

**Backlog:**
- D13: Backend — `/driver/reservations/:id/complete` + `/reservations/:id/confirm-arrival`. Lógica de cruce.
- D13: Backend — generación de comprobante PDF con Puppeteer + plantilla HTML mock SUNAT.
- D13: Mobile (pasajero) — pantalla post-viaje con tres sliders de calificación.
- D13: Mobile — pantalla historial con detalle de viaje pasado, descarga de comprobante.
- D14: Web admin — vista de detalle de viaje completado con timeline, mapa de recorrido, comprobante.
- D14: Pulido visual exhaustivo: micro-animaciones, sonidos, copy en español de Perú.
- D14: Modo presentación (`DEMO_MODE=true`).
- D15: Ensayo completo del guion 3 veces seguidas, cronometradas.
- D15: Grabación de video de respaldo.
- D15: Deploy a Railway + Vercel + Supabase. URL final compartible.

**Criterios de aceptación:**
- [ ] El comprobante PDF se ve presentable, con serie, número, RUC, detalle.
- [ ] La calificación de 3 estrellas separadas funciona y aparece en el panel admin.
- [ ] El video de respaldo cubre los dos flujos completos sin cortes.
- [ ] La demo se ejecuta en 10–12 minutos exactos, con margen para Q&A.
- [ ] Todo está deployed y accesible vía URLs públicas.

**Riesgos:**
- Tiempo se acaba en pulido → mitigación: cortar features no críticas (multi-empresa placeholder, etc.) antes que sacrificar calidad de los flujos centrales.

---

## 15. Definition of Done — global

Aplica a cualquier tarea, en cualquier sprint:

1. El código compila sin warnings (`flutter analyze`, `tsc --noEmit`, `eslint`).
2. Cero `TODO`, cero `FIXME`, cero `console.log` en código mostrable.
3. Cero hardcoded strings en pantallas (todos los textos pasan por el sistema de i18n, aun si en demo solo hay español).
4. Cero secretos en código (todo en env vars).
5. La feature se prueba manualmente en los 3 frontends que la tocan, no solo en uno.
6. El happy path está demo-grade: animado, con feedback visual, sin saltos.
7. El path de error está manejado: si la red falla, no se rompe la pantalla.
8. La feature aparece en el ensayo del guion.
9. La feature tiene su nota en `docs/runbook-demo.md` (cómo demostrarla en vivo).

---

## 16. Estrategia de testing pragmática para preventa

**No vamos a escribir 80% de coverage para una demo.** Sería derrochar tiempo. Lo que sí escribimos:

| Tipo | Cobertura objetivo | Razón |
|---|---|---|
| Tests unitarios | Solo lógica crítica: cálculo de tarifa, validación de QR, transiciones de estado | Estas son las funciones que si fallan, falla la demo en vivo |
| Tests de integración | Solo el flujo de asignación (admin → driver → passenger) | Es el flujo más frágil por la sincronización |
| Tests e2e (Playwright) | Solo el happy path del flujo casa→aeropuerto en la web admin | Smoke test pre-demo |
| Tests manuales | El guion completo, 3 veces el día previo | La verdadera prueba |

**Lo que no testeamos en demo:**
- UI screenshots / visual regression.
- Performance bajo carga.
- Cross-browser exhaustivo (solo Chrome y Safari).
- Accesibilidad automatizada (manual pasa).
- Internacionalización en EN.

Tiempo total invertido en testing: ~10% del esfuerzo. Suficiente para demo, insuficiente para producción — y eso está bien declarado.

---

## 17. CI/CD y despliegue

### 17.1 CI

GitHub Actions, dos workflows:
- `api-ci.yml`: en push a cualquier rama, corre lint + typecheck + build. En push a `main`, deploya a Railway.
- `web-ci.yml`: igual pero deploya a Vercel.

Mobile no tiene CI en demo. Se compila localmente y se sube APK a Firebase App Distribution manualmente.

### 17.2 Despliegue

| Componente | Plataforma | Comando |
|---|---|---|
| Backend | Railway (free + USD 5 incluido) | `railway up` desde `apps/api/` |
| DB | Supabase Postgres free tier (500 MB) | URL en env var del backend |
| Web | Vercel free tier | `vercel --prod` desde `apps/web/` |
| Mobile Android | Firebase App Distribution | `flutter build apk --release && firebase appdistribution:distribute ...` |
| Mobile iOS | TestFlight (requiere cuenta Apple Dev) | Manual desde Xcode |

### 17.3 URLs públicas de demo

- `https://api.taxigreen.demo` — backend
- `https://taxigreen.demo` — web admin/supervisor
- `https://taxigreen.demo/track/:token` — pública, compartir viaje
- Mobile: APK descargable + link TestFlight

(URLs reales se definen al deployar; los dominios pueden ser `*.up.railway.app` y `*.vercel.app` si no se compra dominio para demo.)

### 17.4 Rollback

`railway redeploy <previous-deploy-id>` revierte el backend en 30 s. Vercel revierte con un clic. Esa es toda la estrategia de rollback necesaria para una demo.

---

## 18. Configuración de entornos y manejo de secretos

### 18.1 Variables de entorno

```
# apps/api/.env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taxigreen
JWT_ACCESS_SECRET=<generado, 64 chars>
JWT_REFRESH_SECRET=<generado, 64 chars>
QR_HMAC_SECRET=<generado, 64 chars>
MAPBOX_TOKEN=pk....
FCM_SERVICE_ACCOUNT_JSON=<base64 del json>
DEMO_MODE=false
CORS_ORIGINS=http://localhost:3001,taxigreen://

# apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3000/socket
NEXT_PUBLIC_MAPBOX_TOKEN=pk....

# apps/mobile/.env (vía flutter_dotenv o dart-define)
API_URL=http://localhost:3000/api/v1
WS_URL=ws://localhost:3000/socket
MAPBOX_TOKEN=pk....
```

### 18.2 Reglas

- `.env` jamás se committea. `.env.example` sí.
- Secretos en producción se setean en el dashboard del PaaS, nunca en git.
- El secret HMAC del QR es el único que requiere rotación urgente si se compromete (revoca todos los QR existentes).
- El token público de Mapbox puede vivir en el cliente; el secreto (si lo hubiera) no.

### 18.3 Por entorno

| Entorno | Branch | DB | Logs | DEMO_MODE |
|---|---|---|---|---|
| local | feature/* | docker-compose | debug | false |
| staging | develop | Supabase staging | info | false |
| demo | main | Supabase demo | warn | **true** |

---

## 19. Observabilidad mínima para demo

| Componente | Herramienta | Qué se registra |
|---|---|---|
| Backend logs | Pino + Railway console | request id, user id, latency, errores |
| Backend errors | Sentry free tier | excepciones no manejadas |
| Web errors | Sentry free tier | errores en cliente |
| Métricas | n/a | no se monitoran en demo |
| Uptime | n/a | no se aplica a demo |

Si algo falla en producción durante la presentación, Sentry recibe el evento en segundos y se puede revisar en post-mortem. Para la demo en sí, los logs en Railway son suficientes para diagnóstico rápido.

---

## 20. Presupuesto de performance

| Métrica | Objetivo demo | Razón |
|---|---|---|
| Login → home (mobile) | < 1.5 s | percepción de "rápido" |
| Crear reserva (request total) | < 1 s | sin loaders eternos |
| Tarifa estimada (Mapbox + cálculo) | < 800 ms | feedback inmediato |
| Aparición de reserva en panel admin | < 1 s post-creación | demuestra real-time |
| Push notification end-to-end | < 3 s | umbral de "magia" |
| Posición del conductor refrescada | < 1 s | demuestra tracking |
| Generación de PDF de comprobante | < 2 s | aceptable post-viaje |
| Tamaño APK release | < 25 MB | descarga rápida en demo |

Cada métrica se verifica en el ensayo. Si alguna supera el objetivo, se diagnostica antes del día de demo.

---

## 21. Convenciones de código

### 21.1 Backend (TypeScript)

- `eslint-config-airbnb-base` + `@typescript-eslint/strict`.
- Prettier con `printWidth: 100`, `singleQuote: true`, `trailingComma: 'all'`.
- Naming: `camelCase` en variables, `PascalCase` en clases/interfaces/types, `UPPER_SNAKE` en constantes.
- Archivos: `kebab-case.ts`.
- Cada `Service` es una clase con métodos públicos pocos y bien nombrados; sin "helpers" sueltos.
- DTOs con `class-validator` (`@IsUUID`, `@IsEnum`, etc.). Validación automática en controllers.
- Errores de dominio extienden una clase base `DomainError`; el filtro global los traduce a HTTP.

### 21.2 Web (TypeScript / React)

- Server components por default; client components solo donde hay estado o interactividad.
- shadcn/ui como base; nunca CSS in JS suelto.
- Hooks custom en `lib/hooks/`.
- Cliente API en `lib/api.ts` — un solo módulo que abstrae fetch + auth + errores.
- Cliente WebSocket en `lib/ws.ts` — un singleton.

### 21.3 Mobile (Dart / Flutter)

- `flutter_lints` activado, todo warning como error.
- Riverpod 2 para estado (provider, notifier, consumer).
- `go_router` para navegación declarativa.
- Cada feature en `lib/features/<feature>/` con `presentation/`, `data/`, `domain/`.
- Widgets con menos de 200 líneas; si crece, se parte.

### 21.4 Git

- `main` siempre deployable.
- `develop` integración continua.
- Branches: `feature/<sprint>-<descripción-corta>`.
- Commits convencionales (`feat:`, `fix:`, `chore:`).
- PRs con descripción mínima (qué + por qué); revisión cruzada incluso en equipo de 1 (auto-revisión 24h después).

---

## 22. Internacionalización ES/EN

Aunque la demo se presenta en español, el cliente principal de Taxi Green es el viajero internacional. Por eso:

- Toda string de UI pasa por `intl` (Flutter) y `next-intl` (Next.js).
- Archivo `es-PE.json` 100% completo en sprint 0; `en-US.json` arranca como espejo.
- Un toggle de idioma en el menú del pasajero, deshabilitado en demo pero **visible**. Cuando Raúl pregunte, la respuesta es: *"sí, está preparado; en V1 lo activamos."*
- Fechas y monedas con `Intl.DateTimeFormat` y `Intl.NumberFormat`. Soles peruanos siempre como `S/ 65.00`.

---

## 23. Resiliencia y manejo de errores

### 23.1 En el frontend mobile

| Situación | Comportamiento |
|---|---|
| Sin conexión al abrir app | Pantalla "Sin conexión" con botón "Reintentar" |
| Sin conexión durante reserva | Botón de pago muestra spinner; al volver red, reintenta |
| Token JWT expirado | Refresh automático silencioso; si falla, redirige a login |
| Push no llega | WebSocket cubre vía toast in-app |
| WebSocket cae | Reconexión automática + resync vía REST |
| GPS sin permiso | Pantalla explicativa con CTA "Activar GPS" |

### 23.2 En el frontend web

| Situación | Comportamiento |
|---|---|
| WebSocket cae | Banner amarillo "Reconectando..." en el top; UI sigue funcional con datos cacheados |
| Request 500 | Toast "Algo salió mal" + botón "Reintentar"; **nunca** stacktrace |
| Sesión expirada | Modal de re-login sin perder el contexto de la pantalla actual |
| Cámara denegada | Mensaje claro con instrucciones para habilitar |

### 23.3 En el backend

- Cualquier excepción no manejada pasa por el filtro global y devuelve `{error: {code: 'INTERNAL'}}` sin stack.
- Sentry recibe el detalle.
- Transacciones con timeout de 5 s.
- Conexión a DB con retry exponencial al boot.

---

## 24. Accesibilidad básica

No se hace WCAG completo para demo. Sí se hace:
- Contraste mínimo AA en colores principales.
- Tamaños de fuente ≥ 14 px en mobile.
- Touch targets ≥ 44 × 44 px en mobile.
- Labels en todos los inputs (`aria-label` en web, `Semantics` en Flutter).
- Navegación por teclado en panel admin (la persona detrás del mostrador de Taxi Green la va a usar).

---

## 25. Checklist pre-demo

### 25.1 D-7 (una semana antes)

- [ ] Sprint 4 completado al 80%.
- [ ] Primer ensayo completo del guion. Cronómetro: ≤ 13 min.
- [ ] URLs públicas funcionando.
- [ ] Cuentas de Mapbox y Firebase con cuota suficiente verificada.
- [ ] APK Android y build iOS disponibles.

### 25.2 D-3

- [ ] Pulido visual finalizado.
- [ ] Modo presentación (`DEMO_MODE=true`) validado.
- [ ] Video de respaldo grabado (al menos un take limpio de 11 min).
- [ ] Ensayo del guion frente a una persona externa (test fresco).

### 25.3 D-1

- [ ] Reset completo de datos. Solo seeds.
- [ ] Verificación de las 6 cuentas de demo (login funciona).
- [ ] Verificación de push (envío de prueba a cada dispositivo).
- [ ] Verificación de cámara del browser para escaneo QR.
- [ ] Verificación de WiFi del lugar de presentación (probar hotspot móvil como plan B).
- [ ] Carga de batería al 100% en todos los dispositivos.
- [ ] Cables, hubs y adaptadores listos.
- [ ] Slide 1 del deck abierta y minimizada.

### 25.4 D-0 (día de la demo)

Una hora antes:
- [ ] `pnpm demo:reset` en backend.
- [ ] Push de prueba a Ana, Luis y Pedro.
- [ ] Test de cámara del navegador.
- [ ] Test de internet del lugar.
- [ ] Modo "No molestar" en todos los dispositivos para evitar pushes ajenos.
- [ ] Si hay WiFi débil: tethering del celular del presentador.

Diez minutos antes:
- [ ] Todos los dispositivos en la pantalla correcta.
- [ ] OBS Studio listo si se va a usar multi-vista.
- [ ] Video de respaldo cargado en otra pestaña, listo para reemplazar la demo en vivo si algo falla.

---

## 26. Plan de contingencia en vivo

Reglas claras para cuando algo falla mientras el cliente mira:

1. **Cero disculpas técnicas largas.** Una frase: *"Pasamos al siguiente módulo y luego revisamos esto."* y se sigue. La calma es un mensaje en sí mismo.
2. **Si push no llega al pasajero:** se muestra el toast in-app (WebSocket) y se continúa. Esto está cubierto por diseño.
3. **Si el GPS no funciona en el dispositivo:** se activa la simulación con `pnpm demo:simulate-trip`. El presentador 2 lo ejecuta desde la laptop.
4. **Si el backend cae:** se cambia a video de respaldo sin pausa. *"Aquí pueden ver el mismo flujo grabado."*
5. **Si el internet del lugar cae:** se levanta el hotspot del celular. Se reconecta en menos de 30 s.
6. **Si algo se rompe y no se puede recuperar:** se pasa al deck y se prometen ensayos privados de seguimiento. La venta no se cierra por una caída, se cierra por la conversación entera.

Tener a alguien del equipo en sala dedicado a contingencia, sin hablar, listo para intervenir, vale el costo.

---

## 27. Métricas técnicas de éxito de la demo

Después del ensayo final, todo lo siguiente debe ser cierto:

| Métrica | Objetivo |
|---|---|
| Tiempo total de la demo en vivo | 10–12 min |
| Reservas creadas en demo sin errores | 2 de 2 |
| Push recibidos en menos de 3 s | 6 de 6 (3 por flujo × 2 flujos) |
| QR escaneados exitosamente al primer intento | 2 de 2 |
| Marcador del conductor visible y fluido | 100% del tiempo |
| Sin recargas manuales en panel admin | cero recargas |
| Sin errores visibles al cliente | cero |
| Tiempo entre asignación y push al pasajero | < 3 s |
| Tiempo de generación de PDF | < 2 s |
| Demo completable sin internet del lugar (con tethering) | sí |

---

## 28. Apéndices

### A. Comandos esenciales

```bash
# Levantar todo en local
pnpm install
docker-compose up -d           # postgres
pnpm --filter api prisma:migrate
pnpm --filter api prisma:seed
pnpm dev                       # arranca api + web + mobile (con flutter run)

# Resets
pnpm demo:reset                # truncate + reseed
pnpm demo:reset-positions      # solo posiciones GPS

# Simulaciones
pnpm demo:simulate-trip --reservationId=TG-2026-04829 --speed=30
pnpm demo:send-test-push --to=ana@latam.pe

# Ensayos
pnpm demo:rehearse             # corre el guion automatizado contra el backend
```

### B. Glosario

| Término | Significado |
|---|---|
| QR-Voucher | Código QR firmado con HMAC, prepagado, válido por 24 h |
| Meet-and-greet | Recepción presencial del pasajero en el aeropuerto por personal de Taxi Green |
| Dispatch | Asignación de conductor + unidad a una reserva |
| PSE | Proveedor de Servicios Electrónicos (SUNAT) |
| Idempotency-Key | Header HTTP que permite reintentar requests sin duplicar efectos |
| Row-level security | Mecanismo de Postgres para aislar datos por tenant a nivel DB |
| Real-time | Propagación de cambios de estado en menos de 1 s entre clientes conectados |

### C. ADRs (Architecture Decision Records)

Cada decisión grande tiene su ADR breve en `docs/adr/`:
- `adr-001-postgres-over-mongo.md`
- `adr-002-monolith-over-microservices.md`
- `adr-003-flutter-over-react-native.md`
- `adr-004-nestjs-over-fastapi.md`
- `adr-005-socketio-over-raw-ws.md`
- `adr-006-mapbox-over-google-maps.md`
- `adr-007-qr-with-hmac.md`

Cada uno con 4 secciones: Contexto, Decisión, Consecuencias, Alternativas consideradas. Tres a cinco párrafos cada uno.

### D. Referencias técnicas externas

Lecturas previas recomendadas al equipo antes de empezar:
- Documentación Prisma: https://www.prisma.io/docs (no copiar; entender el modelo)
- NestJS WebSockets: https://docs.nestjs.com/websockets/gateways
- Flutter Riverpod 2: https://riverpod.dev
- shadcn/ui: https://ui.shadcn.com
- Mapbox Directions API: https://docs.mapbox.com/api/navigation/directions/
- FCM HTTP v1: https://firebase.google.com/docs/cloud-messaging/migrate-v1
- PostGIS basics: https://postgis.net/workshops/postgis-intro/

---

*Fin del plan de software. Documento operativo: cualquier modificación de scope o de decisiones técnicas debe registrarse aquí antes de pasar a código. Lo que no está en este documento o en [PROPUESTA_DEMO.md](PROPUESTA_DEMO.md) no se construye en demo.*

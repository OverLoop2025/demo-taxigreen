# Guía de pruebas manuales — Taxi Green Demo

**Última actualización:** 2026-06-03  
**Cubre:** Sprint 0-8  
**Objetivo:** que una persona no técnica pueda levantar la app, entrar a las pantallas y comprobar el flujo construido.

---

## 1. Qué se puede probar hoy

Hoy la demo ya permite comprobar este recorrido:

1. Entrar como operador/admin.
2. Abrir el panel `/admin`.
3. Simular una conversación WhatsApp en `/wa-sim`.
4. Extraer datos de reserva de forma determinista.
5. Crear una reserva real en la base de datos.
6. Abrir el detalle de esa reserva.
7. Ver una recomendación de conductor + unidad.
8. Aceptar la recomendación o decidir asignar manualmente.
9. Ver auditoría de lo ocurrido.
10. Abrir link pasajero `/p/[token]` con tracking, estado, comprobante, calificación e incidencia.
11. Abrir la app conductor en Expo/dev client.
12. Ingresar como conductor con email + PIN.
13. Abrir la asignación activa del conductor.
14. Avanzar estados del viaje: En camino, Llegué, Pasajero a bordo, Servicio terminado.
15. Emitir ubicación foreground por Supabase Realtime mientras el viaje está activo.
16. Finalizar el viaje y probar comprobante/calificación desde el link pasajero.
17. Reportar objeto olvidado y responderlo desde la app conductor.
18. Ver el caso en `/bienestar/[caso]` y la bandeja `/admin/bienestar`.

La app conductor ya tiene login, sesión segura, Home, Perfil, push degradable, recepción Realtime de asignaciones,
detalle activo, estados secuenciales, ubicación foreground, tracking pasajero, comprobante/calificación y objeto
olvidado E2E básico. Todavía faltan counter final, landing, reset/deploy y video respaldo.

---

## 2. Requisitos antes de empezar

Trabaja siempre desde WSL y desde esta carpeta:

```bash
cd /home/jose/dev/demo-taxigreen
```

Necesitas tener:

- Node disponible.
- pnpm disponible.
- `.env` raíz con `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `HMAC_SECRET` y claves Supabase ya cableadas.
- `apps/web/.env` o `apps/web/.env.local` con las mismas variables web si se va a levantar Next desde `apps/web`.

Para comprobar que estás en la carpeta correcta:

```bash
pwd
```

Debe responder:

```text
/home/jose/dev/demo-taxigreen
```

---

## 3. Primer arranque desde cero

Instala dependencias:

```bash
pnpm install
```

Aplica migraciones a la base de datos:

```bash
pnpm --filter @taxigreen/database db:deploy
```

Carga o refresca datos demo:

```bash
pnpm --filter @taxigreen/database db:seed
```

Este seed es idempotente: puedes correrlo varias veces y no debería duplicar la reserva protagonista.

Construye la app web:

```bash
pnpm --filter @taxigreen/web build
```

Levanta el servidor:

```bash
pnpm --filter @taxigreen/web start
```

Cuando veas algo como esto, ya puedes abrir el navegador:

```text
Local: http://localhost:3000
Ready
```

Para abrir también la app conductor:

```bash
cd /home/jose/dev/demo-taxigreen/apps/driver
pnpm start
```

En Android físico escanea el QR con Expo Go. Si estás usando un teléfono real, `apps/driver/.env` debe apuntar al
backend con la IP visible desde el teléfono:

```text
EXPO_PUBLIC_API_URL=http://<IP-LAN>:3000
```

No uses `localhost` en el teléfono: ahí `localhost` es el propio teléfono, no tu WSL.

---

## 4. Credenciales demo

Operador/admin:

```text
URL: http://localhost:3000/login-admin
Email: admin@taxigreen.demo
Contraseña: demo1234
```

Supervisor counter:

```text
URL: http://localhost:3000/login-counter
Email: counter@taxigreen.demo
Contraseña: demo1234
```

Conductores sembrados para la app móvil:

```text
conductor1@taxigreen.demo / PIN 1234
conductor2@taxigreen.demo / PIN 2345
conductor3@taxigreen.demo / PIN 3456
conductor4@taxigreen.demo / PIN 4567
conductor5@taxigreen.demo / PIN 5678
conductor6@taxigreen.demo / PIN 6789
```

---

## 5. Flujo principal para probar manualmente

### Paso 1 — Entra al panel admin

Abre:

```text
http://localhost:3000/login-admin
```

Ingresa con:

```text
admin@taxigreen.demo
demo1234
```

Debes llegar a:

```text
http://localhost:3000/admin
```

Qué revisar:

- Debe verse el título "Despacho operativo".
- Debe aparecer la reserva protagonista `TG-2026-0001`.
- La UI debe verse azul, sobria y de operación.

### Paso 2 — Abre WhatsApp Sim

Abre:

```text
http://localhost:3000/wa-sim
```

Qué revisar:

- Debe verse una interfaz tipo WhatsApp Web.
- La conversación Hilton/concierge debe mencionar Aeropuerto Jorge Chávez, Av. Pardo 123, Miraflores y vuelo LA2456.

### Paso 3 — Extrae datos

Haz clic en:

```text
Extraer
```

Qué debería pasar:

- El panel lateral muestra datos extraídos.
- Debe aparecer `fuente=algoritmo` si `IA_HABILITADA=false`.
- Debe aparecer confianza alta.
- Deben verse:
  - Origen: `Aeropuerto Jorge Chávez - Llegadas`
  - Destino: `Av. Pardo 123, Miraflores`
  - Vuelo: `LA2456`
  - Punto de encuentro: `Salida 3, columna F2`

### Paso 4 — Crea la reserva

Haz clic en:

```text
Crear reserva
```

La app debe llevarte a una URL similar a:

```text
http://localhost:3000/admin/reservas/<id>
```

El título debe empezar con:

```text
Reserva TG-WA-
```

### Paso 5 — Revisa la sugerencia del copiloto

En el detalle de reserva, mira la columna derecha.

Debe aparecer:

```text
Copiloto recomienda
```

Qué revisar:

- Badge `Algoritmo` si la IA está apagada.
- Nombre del conductor sugerido.
- Placa y tipo de unidad.
- Score sobre 100.
- Factores:
  - Cola
  - Distancia
  - Match
  - Capacidad
- Botones:
  - `Aceptar sugerencia`
  - `Asignar otro`

Importante: la sugerencia es una ayuda. El operador humano decide.

### Paso 6A — Acepta la sugerencia

Haz clic en:

```text
Aceptar sugerencia
```

Qué revisar:

- La reserva queda en estado `asignada`.
- En "Asignación vigente" debe aparecer conductor y unidad.
- La tarjeta de recomendación deja de recalcularse para esa reserva porque ya fue decidida.
- En auditoría debe existir un evento `reserva_asignada` con `origen: sugerencia_copiloto`.

Para ver la auditoría global:

```text
http://localhost:3000/admin/auditoria?action=reserva_asignada
```

### Paso 6B — Asignar otro

Si quieres probar control humano:

1. Crea otra reserva desde `/wa-sim`.
2. En su detalle, haz clic en `Asignar otro`.
3. Luego usa el formulario "Asignación manual".
4. Haz clic en `Asignar conductor y unidad`.

Qué revisar:

- Debe quedar auditoría `reserva_sugerencia_override`.
- Después debe quedar auditoría `reserva_asignada` por la asignación manual.

---

## 6. App conductor en Expo

### Paso 1 — Configura el entorno móvil

Edita `apps/driver/.env`:

```text
EXPO_PUBLIC_API_URL=http://<IP-LAN>:3000
EXPO_PUBLIC_SUPABASE_URL=https://ikitmdoasrvtnotsfkzk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_EXPO_PROJECT_ID=<project-id-opcional-para-push-real>
EXPO_PUBLIC_MAPBOX_TOKEN=<pk-opcional-para-mapa-nativo>
```

Para login y Realtime necesitas `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL` y
`EXPO_PUBLIC_SUPABASE_ANON_KEY`. Para push real necesitas además `EXPO_PUBLIC_EXPO_PROJECT_ID` y Android físico.
Para mapa nativo necesitas `EXPO_PUBLIC_MAPBOX_TOKEN` y dev client/EAS; en Expo Go común se usa fallback textual.

### Paso 2 — Abre Expo

En una terminal:

```bash
cd /home/jose/dev/demo-taxigreen/apps/driver
pnpm start
```

Escanea el QR con Expo Go en Android.

### Paso 3 — Ingresa como conductor

Usa:

```text
Email: conductor1@taxigreen.demo
PIN: 1234
```

Resultado esperado:

- Debes entrar a `Inicio`.
- Debe verse el nombre `Raúl Quispe`.
- Debe verse la unidad `ABC-123`.
- Debe aparecer un estado de Realtime.
- Push puede aparecer como registrado o degradado con razón clara:
  - `requiere Android fisico`;
  - `falta projectId Expo`;
  - `permiso denegado`.

### Paso 4 — Envía una asignación desde admin

Con la app abierta en Home:

1. En web, abre `/admin`.
2. Crea o abre una reserva pendiente.
3. Acepta la sugerencia o asigna manualmente a `Raúl Quispe`.

Resultado esperado:

- La reserva queda `asignada`.
- El backend emite broadcast `reserva-{id}` y `conductor-{conductorId}`.
- En la app, la sección "Próxima asignación" debe mostrar una reserva recibida si Realtime está suscrito.
- Si push real está disponible, al tocar la notificación debe abrir `Asignación recibida`.

### Paso 5 — Abre la asignación activa

En la app conductor, toca:

```text
Abrir asignación
```

También puedes abrirla desde push si ya tienes push real configurado.

Resultado esperado:

- Debe verse el pasajero `Pasajero final del huésped` o el pasajero de la reserva creada.
- Debe verse el vuelo `LA2456`.
- Debe verse el voucher `TG-2026-0001` o `TG-WA-*`.
- Debe verse muy grande el punto:

```text
Salida 3, columna F2
```

- La ruta debe decir Aeropuerto Jorge Chávez -> Av. Pardo 123, Miraflores.
- Si no tienes Mapbox/dev client, verás una ruta textual. Eso es normal: las acciones siguen funcionando.

### Paso 6 — Avanza los estados del viaje

Pulsa en orden:

```text
En camino
Llegué
Pasajero a bordo
Servicio terminado
```

Qué revisar:

- Solo aparece una acción principal a la vez.
- La app no debe permitir saltarse pasos.
- Después de `En camino`, la reserva queda `en_curso`.
- Después de `Servicio terminado`, la reserva queda `por_liquidar`.
- En `/admin/auditoria` deben aparecer eventos `driver_estado_viaje_actualizado`.

### Paso 7 — Verifica ubicación foreground

Con la pantalla de asignación abierta y el viaje en `En camino`, `Llegué` o `Pasajero a bordo`, la app pide permiso de
ubicación foreground.

Resultado esperado:

- La tarjeta "Ubicación" debe mostrar `Enviando posición`.
- Se emite broadcast `posicion` al canal Supabase `reserva-{id}` cada 3 segundos o cada 10 metros.
- Si el teléfono niega permiso, la tarjeta lo muestra como permiso denegado y el viaje sigue operable.

Nota importante:

```text
@rnmapbox/maps no corre en Expo Go común. Para mapa nativo necesitas dev client/EAS + Mapbox token.
```

En Expo Go sin dev client, el fallback textual es el comportamiento esperado.

### Paso 8 — Verifica token push en DB

Abre Prisma Studio:

```bash
pnpm --filter @taxigreen/database db:studio
```

En la tabla `usuarios`, busca `conductor1@taxigreen.demo`.

Resultado esperado si hubo push real:

```text
fcm_token = ExpoPushToken[...] o ExponentPushToken[...]
```

Si estás en emulador, sin permisos o sin `EXPO_PUBLIC_EXPO_PROJECT_ID`, ese campo puede quedar vacío. Eso es normal;
login, Realtime y estados de viaje no dependen de push.

---

## 7. Link pasajero y bienestar

### Paso 1 — Abre el link pasajero protagonista

Abre:

```text
http://localhost:3000/p/tg_demo_passenger_001
```

Resultado esperado:

- Debe verse `Recojo en aeropuerto`.
- Debe verse el conductor `Raúl Quispe`.
- Debe verse la unidad `ABC-123`.
- Debe verse el vuelo `LA2456`.
- Debe verse muy prominente:

```text
Salida 3, columna F2
```

- Debe verse el destino:

```text
Av. Pardo 123, Miraflores
```

Si falta `NEXT_PUBLIC_MAPBOX_TOKEN`, verás ruta textual. Eso es normal: estados, llamadas, comprobante e incidencias
siguen funcionando.

### Paso 2 — Verifica estados en vivo

Con `/p/tg_demo_passenger_001` abierto, en la app conductor avanza:

```text
En camino
Llegué
Pasajero a bordo
Servicio terminado
```

Resultado esperado en el link pasajero:

- El timeline cambia sin refrescar si Realtime está activo.
- Si Realtime falla, el polling actualiza cada 10 segundos.
- La ubicación aparece como coordenadas o marcador si el conductor emite `posicion`.

### Paso 3 — Finaliza y prueba comprobante

Después de `Servicio terminado`, el link pasajero muestra:

```text
Comprobante y calificación
```

Puedes:

1. Dejar el DNI vacío y preparar comprobante.
2. O ingresar el DNI demo:

```text
44556677
```

3. Pulsar `RENIEC`.
4. Pulsar `Preparar comprobante`.
5. Pulsar `Descargar PDF`.

Resultado esperado:

- El PDF se abre desde el endpoint tokenizado del pasajero.
- En auditoría queda `comprobante_pasajero_preparado` y/o `comprobante_pdf_generado`.

### Paso 4 — Calificación triple

En el mismo bloque, califica:

- Servicio
- Conductor
- Unidad

Si pones 3 o menos en algún eje, escribe un motivo breve. Luego pulsa:

```text
Guardar calificación
```

Resultado esperado:

- En `reservas.calificacion` queda un JSON con los tres ejes.
- En auditoría queda `reserva_calificada`.

### Paso 5 — Reporta objeto olvidado

En el link pasajero, escribe:

```text
Olvidé una cartera negra en el asiento posterior.
```

Pulsa:

```text
Reportar objeto olvidado
```

Resultado esperado:

- Se crea una incidencia `objeto_olvidado`.
- En el link aparece un enlace `Ver caso`.
- En `/admin/bienestar` aparece la incidencia activa.
- Si la app conductor está abierta y Realtime está activo, Home muestra una tarjeta `Objeto olvidado`.

### Paso 6 — Responde desde app conductor

En la app conductor, toca:

```text
Responder incidencia
```

Luego pulsa:

```text
Sí encontré
```

Resultado esperado:

- El caso en `/bienestar/[caso]` cambia a `Objeto encontrado`.
- El pasajero puede elegir:
  - `Entregar en recepción del hotel hoy`
  - `Recoger en oficina Taxi Green mañana`
- Al elegir una opción, el caso queda cerrado.

### Paso 7 — Bandeja bienestar admin

Abre:

```text
http://localhost:3000/admin/bienestar
```

Resultado esperado:

- Deben verse incidencias activas.
- Cada card muestra voucher, pasajero, conductor, unidad, severidad y estado.

---

## 8. Otras pantallas útiles

Panel admin:

```text
http://localhost:3000/admin
```

Detalle de reserva protagonista:

```text
http://localhost:3000/admin
```

Haz clic en:

```text
TG-2026-0001
```

Métricas:

```text
http://localhost:3000/admin/metricas
```

Auditoría:

```text
http://localhost:3000/admin/auditoria
```

Link pasajero protagonista:

```text
http://localhost:3000/p/tg_demo_passenger_001
```

Voucher QR PNG:

```text
http://localhost:3000/api/voucher/TG-2026-0001/qr
```

---

## 9. Cómo ver la base de datos

La forma más amigable:

```bash
pnpm --filter @taxigreen/database db:studio
```

Se abrirá Prisma Studio. Tablas principales para mirar:

- `reservas`: reservas creadas.
- `conductores`: conductores, cola y unidad vigente.
- `vehiculos`: unidades.
- `viajes`: viaje creado al asignar.
- `auditoria`: eventos importantes.
- `comprobantes`: comprobante seed.
- `incidencias`: incidencia seed de objeto olvidado.

Qué comprobar después de aceptar una sugerencia:

- En `reservas`, la nueva reserva debe tener `estado = asignada`.
- En `reservas`, `conductor_id` debe estar lleno.
- En `viajes`, debe existir un viaje para esa reserva.
- En `auditoria`, debe existir `reserva_asignada`.
- En `auditoria.fuente_decision`, debe verse `fuente = algoritmo` o `fuente = llm`.
- En `usuarios`, `fcm_token` puede poblarse cuando la app conductor obtiene Expo Push Token real.
- En `reservas.calificacion`, debe aparecer la calificación triple al guardarla desde `/p/[token]`.
- En `incidencias.timeline`, deben aparecer acciones del pasajero y conductor.

---

## 10. Comandos de verificación técnica

Para correr todo el pipeline:

```bash
pnpm turbo run typecheck lint test build
```

Debe terminar con:

```text
52 successful, 52 total
```

Para correr pruebas end-to-end:

```bash
pnpm e2e
```

Antes de `pnpm e2e`, la app web debe estar levantada en:

```text
http://localhost:3000
```

Resultado esperado al cierre de Sprint 8:

```text
6 passed
```

Para comprobar que la app móvil bundlea de verdad:

```bash
cd /home/jose/dev/demo-taxigreen
pnpm --filter @taxigreen/driver exec expo export --platform android
```

Debe terminar con `Android Bundled` y `EXIT 0`.

---

## 11. Cómo apagar y volver a levantar

Si el servidor está corriendo en la terminal, presiona:

```text
Ctrl + C
```

Para ver si el puerto 3000 está ocupado:

```bash
ss -ltnp | rg ':3000\b' || true
```

Si está libre, vuelve a levantar:

```bash
pnpm --filter @taxigreen/web start
```

Si cambiaste código, antes vuelve a construir:

```bash
pnpm --filter @taxigreen/web build
pnpm --filter @taxigreen/web start
```

---

## 12. Limpieza de datos de prueba

Durante pruebas manuales y E2E se crean reservas `TG-WA-*`.

Para restaurar la reserva protagonista sin borrar las reservas creadas por pruebas:

```bash
pnpm --filter @taxigreen/database db:seed
```

El seed garantiza la reserva protagonista:

```text
TG-2026-0001
```

Para volver a un baseline completamente limpio de demo, borra solo datos `TG-WA-*`, limpia tokens push demo y luego
reseed:

```bash
pnpm --filter @taxigreen/database exec tsx --eval '
import { prisma } from "@taxigreen/database";

async function main() {
  const extras = await prisma.reservas.findMany({
    where: { voucher_codigo: { startsWith: "TG-WA-" } },
    select: { id: true },
  });
  const ids = extras.map((r) => r.id);
  if (ids.length > 0) {
    await prisma.incidencias.deleteMany({ where: { reserva_id: { in: ids } } });
    await prisma.comprobantes.deleteMany({ where: { reserva_id: { in: ids } } });
    await prisma.viajes.deleteMany({ where: { reserva_id: { in: ids } } });
    await prisma.auditoria.deleteMany({ where: { target_id: { in: ids } } });
    await prisma.reservas.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.usuarios.updateMany({ where: { fcm_token: { not: null } }, data: { fcm_token: null } });
}

main().finally(() => prisma.$disconnect());
'

pnpm --filter @taxigreen/database db:seed

pnpm --filter @taxigreen/database exec tsx --eval '
import { prisma } from "@taxigreen/database";

async function main() {
  await prisma.auditoria.deleteMany({ where: { id: { not: "auditoria-demo-seed-s1" } } });
}

main().finally(() => prisma.$disconnect());
'
```

No uses `db:reset` salvo que realmente quieras borrar y reconstruir la base completa.

---

## 13. Qué falta construir en próximos sprints

### Sprint 9

Cierre demo:

- Counter final.
- Landing pulida.
- Reset demo.
- Deploy.
- Video de respaldo.

---

## 14. Qué hacer si algo falla

Si no puedes entrar:

- Verifica que estás usando `admin@taxigreen.demo / demo1234`.
- Verifica que `AUTH_SECRET` exista en `.env`.

Si no carga `/admin`:

- Verifica que el servidor esté corriendo.
- Verifica que la DB tenga migraciones:

```bash
pnpm --filter @taxigreen/database db:deploy
```

Si no ves datos:

```bash
pnpm --filter @taxigreen/database db:seed
```

Si falla el QR o comprobante:

- Revisa `HMAC_SECRET`.
- Para PDF real con Puppeteer, revisa Chromium local o el fallback documentado en Sprint 2.

Si no aparece badge `IA`:

- Es normal si `IA_HABILITADA=false`.
- Para probar IA real necesitas `IA_HABILITADA=true` y `ANTHROPIC_API_KEY`.
- Aunque falle IA, la demo debe seguir funcionando con `Algoritmo`.

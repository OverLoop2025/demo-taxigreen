# Guía de pruebas manuales — Taxi Green Demo

**Última actualización:** 2026-06-02  
**Cubre:** Sprint 0-7  
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
10. Abrir link pasajero y endpoints de voucher/comprobante ya construidos.
11. Abrir la app conductor en Expo/dev client.
12. Ingresar como conductor con email + PIN.
13. Abrir la asignación activa del conductor.
14. Avanzar estados del viaje: En camino, Llegué, Pasajero a bordo, Servicio terminado.
15. Emitir ubicación foreground por Supabase Realtime mientras el viaje está activo.

La app conductor ya tiene login, sesión segura, Home, Perfil, push degradable, recepción Realtime de asignaciones,
detalle activo, estados secuenciales y ubicación foreground. Todavía faltan tracking visual del pasajero final y flujo
de objeto olvidado completo. Eso está descrito al final en "Lo que falta".

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

## 7. Otras pantallas útiles

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

## 8. Cómo ver la base de datos

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

---

## 9. Comandos de verificación técnica

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

Resultado esperado al cierre de Sprint 7:

```text
5 passed
```

Para comprobar que la app móvil bundlea de verdad:

```bash
cd /home/jose/dev/demo-taxigreen
pnpm --filter @taxigreen/driver exec expo export --platform android
```

Debe terminar con `Android Bundled` y `EXIT 0`.

---

## 10. Cómo apagar y volver a levantar

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

## 11. Limpieza de datos de prueba

Durante pruebas manuales y E2E se crean reservas `TG-WA-*`.

Si quieres volver a un baseline limpio, la opción más segura es reseed:

```bash
pnpm --filter @taxigreen/database db:seed
```

El seed garantiza la reserva protagonista:

```text
TG-2026-0001
```

No uses `db:reset` salvo que realmente quieras borrar y reconstruir la base completa.

---

## 12. Qué falta construir en próximos sprints

### Sprint 8

Experiencia pasajero:

- Tracking en `/p/[token]`.
- Comprobante visible.
- Flujo de incidencia de objeto olvidado.

### Sprint 9

Cierre demo:

- Counter final.
- Landing pulida.
- Reset demo.
- Deploy.
- Video de respaldo.

---

## 13. Qué hacer si algo falla

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

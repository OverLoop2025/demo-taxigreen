# QA movil Android con ojos reales

Estado: creado el 2026-06-06 tras instalar toolchain Android/Expo/Maestro y validar capturas reales de
`apps/driver`. **Actualizado 2026-06-06 (tarde):** método recomendado = **dev client + Metro** (ver §0),
no el APK preview congelado. **Actualizado 2026-06-07:** `scrcpy` quedó instalado en Windows; la ruta
realista para validar Mapbox nativo es Android físico por Wi-Fi ADB + mirror.

Objetivo: que Claude/Codex pueda revisar la app del conductor con pantallas reales, no solo por lectura de codigo.

---

## 00. VER EL MAPA NATIVO (Mapbox) — el punto que BlueStacks NO resuelve ⛔🗺️

**Problema:** BlueStacks no soporta bien el GL de `@rnmapbox/maps` → el mapa nativo sale **vacío/negro**
(el resto de la UI sí se ve). No sirve para validar el mapa, que es justo lo crítico.

**Solución robusta recomendada (a ejecutar por el usuario), de mayor a menor robustez:**

1. **Android físico por Wi-Fi ADB (+ `scrcpy` para mirror en vivo) — MEJOR.** GPU real → Mapbox pinta perfecto,
   y es el hardware objetivo real. Pasos:
   - Teléfono: Opciones de desarrollador → Depuración USB (y "Depuración inalámbrica" en Android 11+).
   - Una vez por USB: `adb tcpip 5555`; luego inalámbrico: `adb connect <IP_DEL_TELÉFONO>:5555`
     (mismo Wi-Fi; con WSL en `mirrored` la IP LAN es alcanzable). En Android 11+ se puede emparejar sin cable.
   - Mirror en vivo para "ver en tiempo real": `scrcpy -s <IP>:5555` (instala `scrcpy` en Windows o WSL).
   - Luego el **mismo loop §0** (dev client + Metro + `adb reverse tcp:8081`/`tcp:3000` + deep link). El mapa renderiza.
   - Para que el dev client llegue al backend local por `127.0.0.1`, `adb reverse` ya lo cubre (no depende de mirrored).

2. **Emulador AVD con KVM — buena, sin hardware extra.** Falta sólo el permiso de KVM:
   - `sudo gpasswd -a "$USER" kvm` y **reabrir WSL** (cerrar todas las terminales / `wsl --shutdown`). Verificar: `groups` incluye `kvm` y `emulator -accel-check` OK.
   - Arrancar con GPU: `emulator -avd taxigreen_pixel -gpu swiftshader_indirect` (o `-gpu host` si WSLg expone GPU).
     Usar **imagen Google APIs** (no ATD) para Mapbox estable. Display por WSLg.
   - Mismo loop §0 apuntando `--udid emulator-5554`.

3. **Genymotion Desktop** — emulador comercial con buen GL (suele pintar Mapbox); otra herramienta/licencia.

**Proxy mientras tanto:** el mapa **web** del pasajero (`/p/[token]`, Mapbox GL JS) **sí pinta** con token y
usa la misma geometría/anti-recta; `pnpm visual:web` lo captura. Sirve para validar la *ruta/geometría*, no el
look nativo. **Recomendación final: opción 1 (físico + scrcpy) o, sin hardware, opción 2 (AVD+KVM).** BlueStacks
queda sólo para UI no-mapa.

### Estado verificado el 2026-06-07

- `adb devices -l` ve sólo BlueStacks como `emulator-5554` (`SM-S908E`). Sirve para UI general; no sirve para
  validar Mapbox nativo porque el render GL queda negro/vacío.
- `scrcpy` 4.0 está instalado por `winget` en Windows. En esta sesión el PATH de Windows no lo tomó todavía, así
  que usar ruta absoluta:
  `/mnt/c/Users/User/AppData/Local/Microsoft/WinGet/Packages/Genymobile.scrcpy_Microsoft.Winget.Source_8wekyb3d8bbwe/scrcpy-win64-v4.0/scrcpy.exe`.
- `/dev/kvm` existe y el usuario `jose` ya fue agregado al grupo `kvm`. En la sesion actual `groups` puede no mostrarlo
  hasta reiniciar WSL, pero `sg kvm -c 'emulator -accel-check'` devuelve `KVM ... usable`.
- AVD+KVM fue probado con `taxigreen_pixel` en `emulator-5580`: login, home y pantalla de viaje cargan correctamente.
  Mapbox nativo sigue quedando negro con `-gpu swiftshader_indirect` y tambien con `-gpu host` (WSLg expone `llvmpipe`,
  no GPU real). La red del emulador funciona (`ping api.mapbox.com = 0`) y la ruta llega como `En vivo con trafico`,
  por lo que el bloqueo restante es renderer/GL nativo del emulador, no backend.
- En la pantalla nativa de asignación se ocultó el `StatusBar` sólo durante navegación para evitar que los iconos/
  números del sistema se dibujen encima del mapa full-screen.

### Loop exacto para Android físico + scrcpy

En el teléfono:

1. Activar Opciones de desarrollador.
2. Activar Depuración USB y Depuración inalámbrica.
3. En Android 11+, abrir "Emparejar dispositivo con código" y copiar `IP:PUERTO_DE_PAIRING`, `código` y luego el
   puerto normal de conexión ADB que muestra "Depuración inalámbrica".

En WSL:

```bash
export JAVA_HOME="$HOME/.local/share/jdks/temurin-17"
export ANDROID_HOME="$HOME/.local/share/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$HOME/.maestro/bin:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

adb pair <IP_DEL_TELEFONO>:<PUERTO_PAIRING>
adb connect <IP_DEL_TELEFONO>:<PUERTO_ADB>
adb -s <IP_DEL_TELEFONO>:<PUERTO_ADB> reverse tcp:8081 tcp:8081
adb -s <IP_DEL_TELEFONO>:<PUERTO_ADB> reverse tcp:3000 tcp:3000
```

Para verlo en vivo en Windows:

```bash
/mnt/c/Users/User/AppData/Local/Microsoft/WinGet/Packages/Genymobile.scrcpy_Microsoft.Winget.Source_8wekyb3d8bbwe/scrcpy-win64-v4.0/scrcpy.exe -s <IP_DEL_TELEFONO>:<PUERTO_ADB>
```

Luego usar el mismo dev-client de §0: backend local en `:3000`, Metro en `:8081`, deep link
`taxigreendriver://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081`.

Artefactos de esta verificacion:

- `artifacts/maestro/avd-kvm-05-after-login.png` — home real en AVD+KVM.
- `artifacts/maestro/avd-kvm-08-map-final.png` — mapa negro con `swiftshader_indirect`.
- `artifacts/maestro/avd-kvm-10-map-gpu-host-final.png` — mapa negro con `-gpu host`/`llvmpipe`.

Veredicto actualizado: para validar el mapa nativo de verdad, la ruta ganadora sigue siendo **Android físico + Wi-Fi
ADB + scrcpy**. AVD+KVM queda útil para QA visual de toda la UI salvo Mapbox.

---

## 0. MÉTODO RECOMENDADO — dev client + Metro (código EN VIVO de la rama) ⭐

> **Por qué.** El APK `preview`/`development` compilado por EAS es un **snapshot congelado** que además apunta
> a `EXPO_PUBLIC_API_URL` de **producción (Railway)**. Sirve para ver "qué hay en prod", **NO** para ver lo que
> estamos desarrollando en la rama. Para iterar el frontend con ojos reales hay que correr el **dev client**
> (shell nativo) cargando el **JS en vivo desde Metro** y apuntando al **backend local**.

Esto corre **exactamente el código de la rama** y refleja cada cambio con Fast Refresh.

### Requisitos
- BlueStacks abierto en Windows (WSL en `networkingMode=mirrored` → el puerto ADB es alcanzable como `127.0.0.1`).
  Nota: BlueStacks reasigna el puerto ADB por instancia (visto `5555` y `5556`); confírmalo con PowerShell:
  `powershell.exe -NoProfile -Command "Get-NetTCPConnection -State Listen | ? { $_.LocalPort -in 5555,5556,5565,5585,5625 } | Select LocalAddress,LocalPort"`
- Toolchain de §"Herramientas instaladas" en el PATH (`source` del bloque de variables).

### Pasos
```bash
source <(cat <<'EOF'
export JAVA_HOME="$HOME/.local/share/jdks/temurin-17"
export ANDROID_HOME="$HOME/.local/share/android-sdk"
export PATH="$HOME/.maestro/bin:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
EOF
)
D=127.0.0.1:5555    # ajustar al puerto real de BlueStacks
cd /home/jose/dev/demo-taxigreen

# 1) Backend local con guion sembrado (conductor1 = Raúl Quispe queda con asignación activa)
pnpm --filter @taxigreen/database db:seed-guion
pnpm --filter @taxigreen/web build && pnpm --filter @taxigreen/web exec next start -p 3000 &   # o next dev -p 3000

# 2) Apuntar el driver al backend local (apps/driver/.env, gitignored)
#    EXPO_PUBLIC_API_URL="http://127.0.0.1:3000"   (restaurar a Railway al terminar)

# 3) Instalar el dev client y arrancar Metro (watch, SIN CI=1)
adb connect $D
adb -s $D install -r -d /tmp/taxigreen-apks/taxigreen-driver-development.apk
( cd apps/driver && EXPO_NO_TELEMETRY=1 nohup pnpm exec expo start --dev-client --port 8081 >/tmp/metro.log 2>&1 </dev/null & )

# 4) CLAVE: reenviar el localhost de Android a WSL (Metro y backend)
adb -s $D reverse tcp:8081 tcp:8081
adb -s $D reverse tcp:3000 tcp:3000

# 5) Abrir el dev client apuntando a Metro (carga el JS de la rama)
adb -s $D shell am force-stop pe.taxigreen.driver
adb -s $D shell am start -a android.intent.action.VIEW \
  -d "taxigreendriver://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"

# 6) Capturar / interactuar
adb -s $D exec-out screencap -p > /tmp/shot.png            # captura
adb -s $D shell input tap <x> <y>                          # tap (PIN 1234, botones, etc.)
adb -s $D shell uiautomator dump /sdcard/w.xml && adb -s $D shell cat /sdcard/w.xml   # bounds de nodos
```

Login conductor: `conductor1@taxigreen.demo` / PIN `1234`. Tras login, el home muestra "Abrir viaje"
(asignación vigente del backend local) → pantalla de navegación full-screen.

### Verificado el 2026-06-06 (tarde)
Capturas reales en vivo del código de la rama (dev client conectado a `http://127.0.0.1:8081`, Fast refresh ON):
login balanceado, home sin jerga con iconos de tabs, y pantalla de navegación full-screen con transición de
estados (`Voy al punto → Ya llegué → Iniciar viaje → Finalizar`). El **mapa nativo queda vacío en BlueStacks**
(limitación de GL del emulador, ver §"Hallazgo técnico"); en dispositivo físico y en la web sí pinta.

## Resultado actual

Se logro una ruta funcional con **BlueStacks + ADB**:

- Dispositivo detectado: `127.0.0.1:5556`.
- Modelo Android reportado: `SM-S908E`.
- ABI: `x86_64,x86,arm64-v8a,armeabi-v7a,armeabi`.
- APK EAS preview instalado correctamente.
- Captura real generada:
  - `artifacts/maestro/driver-bluestacks-login.png`
  - `artifacts/maestro/bluestacks-home.png`

El APK preview usado:

- Build EAS: `a47e0370-9c55-4bdc-984c-f5d5a6fa060f`
- APK: `https://expo.dev/artifacts/eas/mj7fyGCuK8YYHQ2qaRaLRM.apk`
- Local: `/tmp/taxigreen-apks/taxigreen-driver-preview-f3.apk`
- SHA-256: `a04ee7af0523ad2ae2e8b8df865f372fab7a29718a6b72c99eedb2277823a23b`

## Herramientas instaladas

En WSL, sin sudo:

- JDK Temurin 17: `$HOME/.local/share/jdks/temurin-17`
- Android SDK: `$HOME/.local/share/android-sdk`
- Android Platform Tools / Emulator / Build Tools 35
- AVDs:
  - `taxigreen_pixel`
  - `taxigreen_atd`
- Maestro CLI `2.6.0`

Variables utiles:

```bash
export JAVA_HOME="$HOME/.local/share/jdks/temurin-17"
export ANDROID_HOME="$HOME/.local/share/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$HOME/.maestro/bin:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

## Ruta recomendada para capturas

1. Abrir BlueStacks manualmente desde Windows.

   WSL pudo conectarse a BlueStacks cuando ya estaba abierto. Relanzarlo desde WSL con PowerShell/Explorer no fue
   estable, asi que la forma limpia es abrirlo desde el acceso directo de Windows.

2. Confirmar que BlueStacks expone ADB.

```bash
powershell.exe -NoProfile -Command \
  'Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 5556,5625 } | Select-Object LocalAddress,LocalPort,OwningProcess'
```

La instancia usada fue `Pie64`, puerto `5556`.

3. Conectar desde WSL.

```bash
adb connect 127.0.0.1:5556
adb devices -l
```

Debe verse algo como:

```text
127.0.0.1:5556 device product:b0qxxx model:SM_S908E device:b0q
```

4. Instalar el APK actual, si quieres asegurar que BlueStacks corre el build correcto.

```bash
adb -s 127.0.0.1:5556 install -r -d /tmp/taxigreen-apks/taxigreen-driver-preview-f3.apk
```

5. Capturar login/home con el script ADB directo.

```bash
DRIVER_DEVICE_UDID=127.0.0.1:5556 \
DRIVER_APK=/tmp/taxigreen-apks/taxigreen-driver-preview-f3.apk \
INSTALL_APK=0 \
CLEAR_STATE=1 \
pnpm visual:driver:adb
```

El script:

- abre `pe.taxigreen.driver`;
- orienta retrato;
- guarda `driver-adb-01-login.png`;
- ingresa PIN `1234`;
- guarda `driver-adb-02-pin.png`;
- intenta entrar;
- guarda `driver-adb-03-home.png`;
- si existe `Abrir asignacion`, entra y guarda `driver-adb-04-asignacion.png`.

## Maestro

Maestro quedo instalado y los flows existen en `.maestro/`:

- `.maestro/01-login.yaml`
- `.maestro/02-asignacion-activa.yaml`
- `.maestro/03-flujo-estados.yaml`

Comando esperado cuando el dispositivo soporta bien el driver de Maestro:

```bash
JAVA_HOME="$HOME/.local/share/jdks/temurin-17" \
ANDROID_HOME="$HOME/.local/share/android-sdk" \
PATH="$HOME/.maestro/bin:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH" \
maestro test --udid 127.0.0.1:5556 .maestro/01-login.yaml
```

Hallazgo actual: en BlueStacks, Maestro fallo antes del flow instalando su server interno y dejo el dispositivo ADB
`offline`. Por eso la ruta recomendada para capturas locales queda en `pnpm visual:driver:adb`. Maestro sigue siendo
util para un Android fisico o un emulador con KVM estable.

## Emuladores WSL

Se instalaron AVDs reales, pero WSL no tiene permiso sobre `/dev/kvm`:

```bash
emulator -accel-check
```

El emulador informa que el usuario no pertenece al grupo `kvm`. Sin KVM:

- Pixel/ATD arrancan en software/TCG y son muy lentos.
- `@rnmapbox/maps` puede provocar ANR en `com.mapbox.common.LifecycleService` antes de que la app termine de iniciar.
- ATD devuelve screenshots negros aun cuando UIAutomator ve los nodos.

Para habilitar KVM hay que ejecutar desde la terminal del usuario:

```bash
sudo gpasswd -a "$USER" kvm
```

Luego cerrar/reabrir WSL o reiniciar la sesion. Verificar:

```bash
groups
emulator -accel-check
```

Cuando KVM este activo, los AVDs `taxigreen_pixel` y `taxigreen_atd` deberian servir tambien para Maestro.

## Hallazgo tecnico importante

`@rnmapbox/maps` se inicializa a nivel nativo al arrancar el proceso Android. Aunque `AssignmentMap.tsx` carga el
modulo de forma diferida en JS, el SDK nativo igualmente inicializa servicios Mapbox durante startup del proceso.
En Android fisico/BlueStacks acelerado no bloqueo el login; en emulador WSL sin KVM si genero ANR.

Recomendacion futura para CI visual headless:

- usar BlueStacks/Android fisico/KVM para QA visual nativa; o
- crear un perfil de build QA sin plugin nativo Mapbox y validar el fallback textual; o
- mantener el mapa nativo fuera de la ruta de CI visual y cubrirlo en smoke fisico.

## Artefactos utiles ya generados

Conservar como evidencia visual inicial:

- `artifacts/maestro/driver-bluestacks-login.png` — login real del APK preview en BlueStacks.
- `artifacts/maestro/bluestacks-home.png` — home BlueStacks con app instalada.
- `artifacts/maestro/driver-after-main-wait.png` — login real observado previamente en dev-client.

Las capturas de 15 KB completamente negras son diagnostico del problema de framebuffer WSL/ATD, no evidencia visual
de la app.

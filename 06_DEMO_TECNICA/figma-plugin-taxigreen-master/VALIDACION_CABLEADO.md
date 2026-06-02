# Validacion de Cableado - Taxi Green Figma Plugin

Fecha: 2026-05-29

## Validado localmente

Comandos ejecutados desde `06_DEMO_TECNICA/figma-plugin-taxigreen-master`:

```bash
node --check code.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest OK')"
node -e "JSON.parse(require('fs').readFileSync('screens.master.json','utf8')); console.log('screens OK')"
node scripts/validate-prototype.js
```

Resultado:

- `code.js`: sintaxis OK.
- `manifest.json`: JSON OK.
- `screens.master.json`: JSON OK.
- `scripts/validate-prototype.js`: OK.

Salida relevante del validador:

```text
Prototype validation OK
- Screens in code.js: 64
- Registry ids: 66
- Code edges checked: 96
- Master flow ids checked: 31
- Required protagonist route: OK
```

## Ruta protagonista validada

```text
cover.00
prototype.home
pwa.passenger.1A
whatsapp.12A
whatsapp.12B
whatsapp.12C
dispatch.3C
driver.2C
driver.2D
pwa.passenger.1G2
pwa.passenger.1G3
pwa.passenger.1G4
pwa.passenger.1G5
wellbeing.13A
wellbeing.13B
wellbeing.13F
wellbeing.13G
wellbeing.13H
wellbeing.13K
```

## Validacion semantica del flujo

La ruta anterior se interpreta con este contrato de negocio:

- Flujo protagonista: **Recojo en aeropuerto**.
- Solicitante: hotel/concierge por WhatsApp.
- Pasajero final: huesped que llega a Lima y esta fisicamente en el aeropuerto.
- Origen fisico: Aeropuerto Jorge Chavez, llegadas.
- Punto de encuentro: Salida 3, columna F2.
- Destino fisico: Av. Pardo 123, Miraflores.
- Counter: ruta secundaria walk-in Aeropuerto -> destino en Lima.
- Objeto olvidado: soporte del mismo viaje dentro de `/p/[token]`, no app separada.

Esta validacion semantica complementa la validacion tecnica: un cableado puede ser correcto y aun asi fallar si el texto presenta al hotel como origen fisico. En esta version, el hotel debe leerse siempre como solicitante/canal.

## Que valida el script

- IDs duplicados en `code.js`.
- Targets inexistentes declarados en `screens.master.json`.
- Flujo protagonista completo y alineado con `validation.requiredProtagonistPath`.
- Edges obligatorios en `code.js`, incluyendo `12B -> 12C`, `12C -> 3C`, `2D -> 1G2`, `1G2 -> 1G3 -> 1G4 -> 1G5`, `1G5 -> 13A`, `13G -> 13H -> 13K`.
- Acciones visibles definidas en la metadata de pantallas sin destino.
- Pantallas sin inbound que no esten marcadas como `entry`, `support` o `archive`.

## Pendiente de revisar en Figma

- Confirmar que `setReactionsAsync()` materializa `actions[]` en cada boton visible del canvas.
- Revisar visualmente que `13 Prototype` de aproximadamente 70% del peso a la ruta A-Z.
- Confirmar que botones secundarios de compartir/exportar se perciban como ghost/secundarios.
- Probar manualmente el flujo desde `00 Cover` hasta `13.K Constancia PDF` en modo Prototype.

## Nota de alcance

La validacion local no puede inspeccionar la API viva de Figma ni confirmar que cada reaccion quedo persistida en el archivo despues de ejecutar el plugin. Eso debe revisarse dentro de Figma Desktop tras correr el generador.

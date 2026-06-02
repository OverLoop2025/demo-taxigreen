# Taxi Green Master Figma Generator

Generador local para crear un Figma nuevo, completo y navegable desde cero, siguiendo:

- `../FLUJO_NEGOCIO_CANONICO.md`
- `../CONTRATO_NARRATIVO_DEMO.md`
- `../ESPECIFICACION_PANTALLAS_PREMIUM.md`
- `../MAPA_ALINEACION_PLAN_FIGMA.md`
- `../../07_PLAN_EJECUCION/LOGICA_NEGOCIO_OPERATIVA.md`
- `../AUDITORIA_FIGMA_WOW.md`
- `../DISEÑO_UI_DETALLADO.md`
- `../logo.jpg`

La direccion visual actual es **Taxi Green Airport Ops Premium**: operacion aeroportuaria formal, servicio premium, copiloto con humano en control y soporte de objeto olvidado integrado al viaje.

La direccion fisica del flujo protagonista es **Aeropuerto Jorge Chavez -> Av. Pardo 123, Miraflores**. El hotel/concierge aparece como solicitante por WhatsApp; no es el origen fisico del viaje. El punto de recojo es llegadas, **Salida 3, columna F2**.

La demo usa una identidad dual:

- **Producto/chrome:** azul ejecutivo `#0B0952` + `#227FDE`.
- **Tenant Taxi Green:** verde del logo y acentos de marca.
- **Bienestar/soporte:** purpura `care` solo para el arco de objeto olvidado.

Este plugin reemplaza las versiones de continuación. No asume que existe avance previo.

## Importante

Ejecuta este plugin en un archivo Figma nuevo o duplicado. El plugin está en modo **clean slate**: limpia las páginas del archivo actual y genera la estructura completa desde cero.

## Cómo ejecutarlo

1. Abre Figma Desktop.
2. Crea un archivo nuevo de diseño.
3. Ve a `Plugins` -> `Development` -> `Import plugin from manifest...`.
4. Selecciona:

   `06_DEMO_TECNICA/figma-plugin-taxigreen-master/manifest.json`

5. Ejecuta `Taxi Green Master Figma Generator`.

## Qué genera

14 páginas, tal como pide la especificación:

1. `00 Cover`
2. `01 Design Tokens`
3. `02 Components`
4. `03 Patterns`
5. `04 Iconography & Assets`
6. `05 Entrada y Link Pasajero`
7. `06 App Conductor`
8. `07 Admin Operativo`
9. `08 Counter Supervisor`
10. `09 Empresa Cliente`
11. `10 Canal WhatsApp`
12. `11 Bienestar Integrado`
13. `12 Estados`
14. `13 Prototype`

También crea un prototipo navegable con:

- Flujo protagonista A-Z: `00 Cover` -> `13 Prototype` -> entrada multicanal -> WhatsApp de hotel/concierge como solicitante -> voucher -> aprobacion humana -> app conductor al aeropuerto -> link pasajero -> viaje a Miraflores -> comprobante/rating -> objeto olvidado -> constancia.
- Ruta de apoyo de counter aeropuerto: walk-in Aeropuerto -> destino en Lima, tarifa cerrada y cola de conductores hacia el mismo despacho.
- Arco final de objeto olvidado desde `/p/[token]`, tratado como soporte del mismo viaje, no como app separada.
- Empresa cliente queda como lamina anzuelo/futuro, fuera del recorrido protagonista.
- Back buttons, bottom nav móvil, top nav/side nav desktop y accesos de login para despachador, counter y empresa.
- Reacciones Figma actuales con `actions[]` y `setReactionsAsync`, compatible con `documentAccess: dynamic-page`.

El plugin no abre una ventana UI propia: al ejecutarlo trabaja directo sobre el canvas, cambia a la página `13 Prototype` y deja seleccionado `TG Master/Prototype Map`.

## Fuente estructurada

`screens.master.json` documenta el inventario de páginas, pantallas y conexiones. `code.js` contiene el generador ejecutable.

## Validacion local

Desde esta carpeta:

```bash
node --check code.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest OK')"
node -e "JSON.parse(require('fs').readFileSync('screens.master.json','utf8')); console.log('screens OK')"
node scripts/validate-prototype.js
```

El script valida IDs duplicados, targets inexistentes, ruta protagonista completa, pantallas sin inbound no marcadas como entry/support/archive y acciones visibles sin destino en la metadata del plugin. Las reacciones reales de Figma (`setReactionsAsync`) se validan al ejecutar el plugin en Figma.

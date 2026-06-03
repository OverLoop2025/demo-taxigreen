// Entry físico del monorepo (pnpm + node-linker=isolated).
//
// `"main": "expo-router/entry"` rompe el dev client EAS: Metro resuelve el entry
// al `.pnpm` de la RAÍZ del workspace, pero el dev client pide la ruta relativa a
// `apps/driver/`, donde no existe `.pnpm` con linker aislado → 404 "Unable to
// resolve module ./node_modules/.pnpm/expo-router@.../entry".
//
// Con un entry local (`apps/driver/index.js`) el bundle arranca desde un archivo
// real del proyecto y el import de `expo-router/entry` se resuelve como módulo
// normal (Metro sí maneja los symlinks de `.pnpm`). No requiere reconstruir el APK:
// el dev client toma el entry del manifest de Metro en cada conexión.
import 'expo-router/entry';

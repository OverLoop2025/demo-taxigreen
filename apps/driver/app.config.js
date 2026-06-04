// app.config.js — Configuración (dinámica) de Expo, fuente ÚNICA (apps/driver).
//
// Antes coexistían app.json + app.config.js, lo que expo-doctor marcaba como
// ambigüedad ("app.config.js no usa los valores de app.json"). Ahora toda la
// configuración vive aquí y app.json fue eliminado.
//
// El download token de Mapbox (`sk....`, permiso DOWNLOADS:READ) es SECRETO y NO
// se versiona: se inyecta en build desde el entorno. En EAS Build se expone vía el
// secret `MAPBOX_DOWNLOAD_TOKEN`; en local queda vacío y el mapa nativo cae a su
// fallback textual (Sprint 7). El token público de runtime va por EXPO_PUBLIC_*.
//
// Nota: NO se declara `newArchEnabled`. En Expo SDK 51 la nueva arquitectura está
// desactivada por defecto, y declararla a nivel raíz rompe el schema (expo-doctor).
const mapboxDownloadToken = process.env.MAPBOX_DOWNLOAD_TOKEN ?? '';

module.exports = {
  name: 'Taxi Green Conductor',
  slug: 'taxigreen-driver',
  scheme: 'taxigreendriver',
  version: '0.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#0B0952',
  },
  assetBundlePatterns: ['**/*'],
  android: {
    package: 'pe.taxigreen.driver',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'POST_NOTIFICATIONS',
      'CAMERA',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
    ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-notifications',
    'expo-location',
    'expo-task-manager',
    'expo-camera',
    'expo-local-authentication',
    ['@rnmapbox/maps', { RNMapboxMapsDownloadToken: mapboxDownloadToken }],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: '9934ffa9-6f7e-46ae-9499-40c46973d57c',
    },
  },
  owner: 'overloop',
};

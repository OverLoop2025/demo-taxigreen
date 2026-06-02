// app.config.js — Configuración dinámica de Expo (apps/driver).
//
// Motivo: el download token de Mapbox (`sk....`, permiso DOWNLOADS:READ) es SECRETO
// y NO debe vivir en app.json (que se versiona). Aquí se inyecta en tiempo de build
// desde el entorno: en EAS Build se expone vía el secret `MAPBOX_DOWNLOAD_TOKEN`;
// en local queda vacío y el mapa cae a su fallback textual (Sprint 7).
//
// Todo lo demás (nombre, slug, permisos, plugins, projectId EAS) sigue en app.json
// como fuente base; aquí solo se sobreescribe el token del plugin @rnmapbox/maps.
const appJson = require('./app.json');

const mapboxDownloadToken = process.env.MAPBOX_DOWNLOAD_TOKEN ?? '';

const plugins = (appJson.expo.plugins ?? []).map((plugin) => {
  if (Array.isArray(plugin) && plugin[0] === '@rnmapbox/maps') {
    return [
      '@rnmapbox/maps',
      { ...plugin[1], RNMapboxMapsDownloadToken: mapboxDownloadToken },
    ];
  }
  return plugin;
});

module.exports = {
  ...appJson.expo,
  plugins,
};

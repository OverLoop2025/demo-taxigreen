import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DriverLocation } from '@/features/location';
import { env } from '@/lib/env';
import type { DriverAssignment } from '@/features/assignment/types';
import type { DriverRouteResult } from '@/features/routing/use-route';
import { useThemePref } from '@/features/theme/theme-provider';

declare const require: (moduleName: string) => unknown;

type MapboxComponent = ComponentType<Record<string, unknown> & { children?: ReactNode }>;

type MapboxApi = {
  setAccessToken: (token: string) => Promise<string | null> | string | null | void;
  setTelemetryEnabled?: (enabled: boolean) => void;
  MapView: MapboxComponent;
  Camera: MapboxComponent;
  ShapeSource: MapboxComponent;
  VectorSource: MapboxComponent;
  LineLayer: MapboxComponent;
  SymbolLayer: MapboxComponent;
  MarkerView: MapboxComponent;
};

export type AssignmentMapMode = 'overview' | 'drive';

function toCoordinate(point: { lat: number | null; lng: number | null }) {
  return typeof point.lat === 'number' && typeof point.lng === 'number' ? [point.lng, point.lat] : null;
}

// Rumbo (grados, 0=N) de `from` a `to`. Sirve para orientar la cámara "hacia
// adelante" (course-up) cuando el GPS no entrega heading (p. ej. en emulador).
function bearingDeg(from: number[], to: number[]) {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  if (lng1 === undefined || lat1 === undefined || lng2 === undefined || lat2 === undefined) return 0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Rumbo "de la vía por delante": recorre la ruta acumulando metros desde el puck
// (coords[0]) hasta ~`aheadMeters` y toma el rumbo a ese punto. Promediar un tramo
// real (no un único vértice) hace que la calzada quede FRONTAL (recede recta hacia
// arriba) en vez de ladeada por un giro cercano. Cae al último punto si la ruta es corta.
function headingAlongRoute(coordinates: number[][], aheadMeters = 140) {
  const start = coordinates[0];
  if (!start || coordinates.length < 2) return null;
  let acc = 0;
  for (let i = 1; i < coordinates.length; i += 1) {
    const prev = coordinates[i - 1];
    const cur = coordinates[i];
    if (!prev || !cur) continue;
    acc += distanceMetersLngLat(prev, cur);
    if (acc >= aheadMeters) return bearingDeg(start, cur);
  }
  const last = coordinates[coordinates.length - 1];
  return last ? bearingDeg(start, last) : null;
}

// Punto sobre la ruta a ~`meters` del inicio (interpolado en el segmento donde se
// alcanza). Sirve para sesgar la cámara hacia adelante: si centramos ahí, el puck
// (inicio) queda en el tercio inferior y la vía por delante llena la pantalla.
function pointAhead(coordinates: number[][], meters: number): number[] | null {
  const start = coordinates[0];
  if (!start || coordinates.length < 2) return null;
  let acc = 0;
  for (let i = 1; i < coordinates.length; i += 1) {
    const prev = coordinates[i - 1];
    const cur = coordinates[i];
    if (!prev || !cur) continue;
    const seg = distanceMetersLngLat(prev, cur);
    if (acc + seg >= meters) {
      const t = seg > 0 ? (meters - acc) / seg : 0;
      const lng0 = prev[0];
      const lat0 = prev[1];
      const lng1 = cur[0];
      const lat1 = cur[1];
      if (lng0 === undefined || lat0 === undefined || lng1 === undefined || lat1 === undefined) return cur;
      return [lng0 + (lng1 - lng0) * t, lat0 + (lat1 - lat0) * t];
    }
    acc += seg;
  }
  return coordinates[coordinates.length - 1] ?? null;
}

function fallbackRoute(assignment: DriverAssignment) {
  return `${assignment.origen.texto} → ${assignment.destino.texto}`;
}

function distanceLabel(value: number | null) {
  if (typeof value !== 'number') return 'Distancia estimada';
  if (value < 1000) return `${Math.round(value)} m`;
  return `${(value / 1000).toFixed(1)} km`;
}

function etaLabel(value: number | null) {
  if (typeof value !== 'number') return 'Calculando llegada';
  return `Llega en ${Math.max(0, Math.ceil(value / 60))} min`;
}

function distanceMetersLngLat(a: number[], b: number[]) {
  const lng1 = a[0];
  const lat1 = a[1];
  const lng2 = b[0];
  const lat2 = b[1];
  if (
    typeof lng1 !== 'number' ||
    typeof lat1 !== 'number' ||
    typeof lng2 !== 'number' ||
    typeof lat2 !== 'number'
  ) {
    return Number.POSITIVE_INFINITY;
  }
  const earth = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Índice del vértice de la ruta más cercano a `point` (escaneo lineal; las rutas
// urbanas tienen cientos de vértices, no miles). Base para recortar lo recorrido
// y para medir el rumbo de la vía donde el conductor ESTÁ, no donde estaba.
function nearestVertexIndex(coordinates: number[][], point: number[]) {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < coordinates.length; i += 1) {
    const vertex = coordinates[i];
    if (!vertex) continue;
    const distance = distanceMetersLngLat(point, vertex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

// Ruta "por delante" estilo Waze: descarta el tramo ya recorrido (la línea nace
// SIEMPRE en el puck) y se engancha a la geometría real desde el vértice más
// cercano al GPS. Entre recálculos del backend, esto mantiene la línea pegada
// al conductor en vez de dejar una cola por detrás.
function routeAheadOfDriver(coordinates: number[][], driver: number[] | null) {
  if (!driver || coordinates.length <= 2) return coordinates;
  const from = nearestVertexIndex(coordinates, driver);
  const ahead = coordinates.slice(from);
  if (ahead.length < 2) return coordinates;
  const first = ahead[0];
  if (first && distanceMetersLngLat(driver, first) >= 8) {
    return [driver, ...ahead];
  }
  return ahead;
}

function boundsForCoordinates(coordinates: number[][]) {
  const valid = coordinates.filter(
    (point): point is [number, number] =>
      typeof point[0] === 'number' &&
      Number.isFinite(point[0]) &&
      typeof point[1] === 'number' &&
      Number.isFinite(point[1]),
  );

  if (valid.length < 2) return null;

  const lngs = valid.map(([lng]) => lng);
  const lats = valid.map(([, lat]) => lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  if (minLng === maxLng && minLat === maxLat) return null;

  return {
    ne: [maxLng, maxLat],
    sw: [minLng, minLat],
    paddingTop: 170,
    paddingBottom: 330,
    paddingLeft: 52,
    paddingRight: 52,
  };
}

function useMapboxApi(enabled: boolean) {
  const [api, setApi] = useState<MapboxApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setApi(null);
      setError(null);
      return;
    }

    let mounted = true;
    Promise.resolve()
      .then(() => require('@rnmapbox/maps'))
      .then(async (module) => {
        if (!mounted) return;
        const record = module as { default?: unknown };
        const mapbox = (record.default ?? module) as MapboxApi;
        await Promise.resolve(mapbox.setAccessToken(env.EXPO_PUBLIC_MAPBOX_TOKEN ?? ''));
        mapbox.setTelemetryEnabled?.(false);
        setApi(mapbox);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setApi(null);
        setError('El mapa se está preparando. Puedes seguir con el viaje sin problema.');
      });

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { api, error };
}

export function AssignmentMap({
  assignment,
  driverLocation,
  route,
  fill = false,
  mode = 'overview',
  recenterKey = 0,
  compassHeading = null,
}: {
  assignment: DriverAssignment;
  driverLocation: DriverLocation | null;
  route: DriverRouteResult;
  /** Modo navegación: el mapa ocupa todo el contenedor padre (sin tarjeta ni borde). */
  fill?: boolean;
  /** overview = ruta completa; drive = cámara de conductor. */
  mode?: AssignmentMapMode;
  /** Cambia cuando el usuario toca "ubicarme" o "vista general". */
  recenterKey?: number;
  /** Brújula del teléfono (grados); orienta el mapa cuando no hay rumbo GPS ni ruta. */
  compassHeading?: number | null;
}) {
  const token = env.EXPO_PUBLIC_MAPBOX_TOKEN;
  const { api: Mapbox, error } = useMapboxApi(Boolean(token));
  const dark = useThemePref().resolved === 'dark';

  // Base SOBRIA (sin escudos de carretera negros ni arcoíris de tráfico que tapen
  // la ruta). Sobre ella pintamos NUESTRA capa de tráfico tenue + la ruta dominante.
  const styleURL = dark
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11';
  // Ruta principal dominante: trazo brillante sobre un casing oscuro/contrastado.
  const routeLineColor = dark ? '#22F3B2' : '#0BA57A';
  const routeCasingColor = dark ? '#04231C' : '#063D30';
  // Degradado a lo largo de la línea (requiere lineMetrics en el ShapeSource):
  // más luminoso donde nace (el puck) y asentándose al verde de marca hacia
  // adelante. Sustituye a las flechas punteadas: limpio y fluido, como Waze.
  const routeGradient = useMemo(
    () =>
      [
        'interpolate',
        ['linear'],
        ['line-progress'],
        0, dark ? '#8CFFDD' : '#6EE7B7',
        0.12, dark ? '#22F3B2' : '#10B981',
        1, dark ? '#0FBE8C' : '#059669',
      ] as unknown,
    [dark],
  );

  // Tráfico secundario TENUE (como en la web): finito y semitransparente para que
  // nunca compita con la ruta. Color por nivel de congestión, en versión apagada.
  const trafficColor = useMemo(
    () =>
      [
        'match',
        ['get', 'congestion'],
        'low', dark ? '#2c5d4c' : '#cfe8db',
        'moderate', dark ? '#6f6233' : '#efdcb0',
        'heavy', dark ? '#7a4a35' : '#eec7ad',
        'severe', dark ? '#7d3a36' : '#e7b3ab',
        'transparent',
      ] as unknown,
    [dark],
  );

  const origin = toCoordinate(assignment.origen);
  const destination = toCoordinate(assignment.destino);
  const driver = driverLocation ? [driverLocation.lng, driverLocation.lat] : origin;
  const driveMode = fill && mode === 'drive' && Boolean(driver);
  // Sólo se traza geometría REAL de Mapbox (>2 vértices = ruta por calles). Si aún
  // no hay ruta real, se muestran sólo los marcadores; nunca una recta de 2 puntos.
  const rawRouteCoordinates =
    route.geometry?.coordinates && route.geometry.coordinates.length > 2 ? route.geometry.coordinates : [];
  const routeCoordinates = driveMode ? routeAheadOfDriver(rawRouteCoordinates, driver) : rawRouteCoordinates;
  const hasRoute = routeCoordinates.length > 2;
  const center = origin ?? destination ?? driver ?? [-77.08, -12.06];
  // Vista general PANORÁMICA: siempre abarca del punto de inicio al punto final
  // (más la ruta si existe), aunque el tramo vivo sea más corto que el viaje.
  const overviewCoordinates = [
    ...(hasRoute ? routeCoordinates : []),
    ...[origin, destination].filter((point): point is number[] => Boolean(point)),
  ];
  const overviewBounds = boundsForCoordinates(overviewCoordinates);

  // Rumbo "hacia adelante": usa el heading real del GPS si existe; si no (emulador),
  // lo deriva de la ruta (un punto algo más adelante) para una vista course-up.
  const forwardPoint = hasRoute
    ? routeCoordinates[Math.min(8, routeCoordinates.length - 1)] ?? destination
    : destination ?? origin;
  const gpsHeadingUsable =
    typeof driverLocation?.heading === 'number' &&
    Number.isFinite(driverLocation.heading) &&
    driverLocation.heading > 0 &&
    typeof driverLocation.speed === 'number' &&
    driverLocation.speed > 0.8;
  // Rumbo FRONTAL: en modo conductor routeCoordinates ya está recortada al tramo
  // por delante (nace en el puck), así que medir ~80 m desde su inicio alinea la
  // cámara con la vía donde el conductor ESTÁ ahora (calcado a Waze). Prioridad:
  // GPS real en movimiento → calle inmediata → brújula del teléfono → punto
  // adelante → norte.
  const courseHeading = gpsHeadingUsable
    ? driverLocation.heading
    : headingAlongRoute(routeCoordinates, 80) ??
      compassHeading ??
      (driver && forwardPoint ? bearingDeg(driver, forwardPoint) : 0);

  // Centro de cámara SESGADO hacia adelante: en vez de centrar en el puck, centra
  // en un punto ~55 m por delante sobre la ruta. Así el puck baja al tercio inferior
  // (perspectiva de conductor) y la vía por delante domina la pantalla, sin depender
  // sólo del padding. Fuera de navegación, centro normal.
  const driveCenter =
    driveMode && hasRoute ? pointAhead(routeCoordinates, 40) ?? driver : driver;

  const estado = assignment.viaje?.estado;
  const showPickupMarker = !driveMode || estado !== 'a_bordo';
  const showDestinationMarker = !driveMode || estado === 'a_bordo';

  const routeShape = useMemo(
    () => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: hasRoute ? routeCoordinates : [],
      },
    }),
    [hasRoute, routeCoordinates],
  );

  if (!token || !Mapbox) {
    return (
      <View
        className={
          fill
            ? 'justify-center bg-background px-5 py-5'
            : 'min-h-72 rounded-xl border border-border bg-surface px-5 py-5'
        }
        style={fill ? styles.fillContainer : undefined}
      >
        <Text className="text-sm font-bold uppercase tracking-wide text-brand-deep">Tu ruta</Text>
        <Text className="mt-2 text-2xl font-bold text-foreground">{'Aeropuerto → Miraflores'}</Text>
        <Text className="mt-2 text-base font-bold text-brand-deep">
          {etaLabel(route.duracionSegundos)} · {distanceLabel(route.distanciaMetros)}
        </Text>
        <Text className="mt-3 text-base leading-6 text-foreground-muted">{fallbackRoute(assignment)}</Text>
        <View className="mt-4 rounded-2xl border border-border bg-surface-muted px-4 py-4">
          <Text className="text-base font-bold text-foreground">{assignment.puntoEncuentro ?? 'Punto pendiente'}</Text>
          <Text className="mt-1 text-sm leading-5 text-foreground-muted">
            {error ?? 'Puedes continuar el servicio mientras preparamos la vista del mapa.'}
          </Text>
        </View>
      </View>
    );
  }

  const { Camera, LineLayer, MapView, MarkerView, ShapeSource, VectorSource } = Mapbox;
  const ornamentBottom = fill ? 238 : 10;

  return (
    <View
      className={
        fill ? 'bg-surface-muted' : 'h-80 overflow-hidden rounded-xl border border-border bg-surface-muted'
      }
      style={fill ? styles.fillContainer : undefined}
    >
      <MapView
        attributionEnabled
        attributionPosition={{ bottom: ornamentBottom, left: 8 }}
        compassEnabled={false}
        logoEnabled
        logoPosition={{ bottom: ornamentBottom, left: 38 }}
        scaleBarEnabled={false}
        gestureSettings={{
          doubleTapToZoomInEnabled: true,
          doubleTouchToZoomOutEnabled: true,
          pinchZoomEnabled: true,
          pitchEnabled: true,
          rotateEnabled: true,
          panEnabled: true,
        }}
        style={styles.map}
        styleURL={styleURL}
      >
        {driveMode ? (
          <Camera
            key={`drive-${recenterKey}`}
            centerCoordinate={driveCenter}
            zoomLevel={17.2}
            pitch={60}
            heading={courseHeading}
            animationMode="easeTo"
            animationDuration={750}
            // Centro levemente adelante (puck en el tercio inferior) + padding moderado
            // para no empujarlo fuera. Encuadre cercano de conductor tipo Waze.
            padding={{ paddingTop: 300, paddingBottom: 24, paddingLeft: 0, paddingRight: 0 }}
          />
        ) : (
          <Camera
            key={`overview-${recenterKey}-${hasRoute ? routeCoordinates.length : 'fallback'}`}
            bounds={overviewBounds ?? undefined}
            centerCoordinate={overviewBounds ? undefined : center}
            zoomLevel={overviewBounds ? undefined : 11.5}
            pitch={0}
            heading={0}
            animationMode="easeTo"
            animationDuration={900}
          />
        )}

        {/* Tráfico propio y tenue (no compite con la ruta). */}
        <VectorSource id="taxigreen-traffic" url="mapbox://mapbox.mapbox-traffic-v1">
          <LineLayer
            id="taxigreen-traffic-line"
            sourceLayerID="traffic"
            style={{
              lineColor: trafficColor,
              lineWidth: ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 2.4, 17, 3.5],
              lineOpacity: 0.45,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </VectorSource>

        {hasRoute ? (
          <ShapeSource id="taxigreen-route" lineMetrics shape={routeShape}>
            {/* Halo suave exterior: hace "flotar" la ruta sobre el mapa sin ensuciar. */}
            <LineLayer
              id="taxigreen-route-glow"
              style={{
                lineColor: routeLineColor,
                lineWidth: ['interpolate', ['linear'], ['zoom'], 10, 14, 16, 26, 18, 34],
                lineOpacity: dark ? 0.28 : 0.18,
                lineBlur: 8,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <LineLayer
              id="taxigreen-route-casing"
              style={{
                lineColor: routeCasingColor,
                lineWidth: ['interpolate', ['linear'], ['zoom'], 10, 7, 16, 15, 18, 19],
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.9,
              }}
            />
            {/* Trazo principal con degradado fluido (sin flechas punteadas). */}
            <LineLayer
              id="taxigreen-route-line"
              style={{
                lineGradient: routeGradient,
                lineWidth: ['interpolate', ['linear'], ['zoom'], 10, 4.5, 16, 11, 18, 14],
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        ) : null}

        {driver ? (
          <MarkerView coordinate={driver} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
            {driveMode ? (
              /* Conduciendo: flecha de navegación clásica que en course-up apunta
                 siempre a la vía por delante (glanceable al volante). */
              <View style={styles.puckHalo}>
                <View style={styles.puckCore}>
                  <View style={styles.puckArrow} />
                </View>
              </View>
            ) : (
              /* Vista mapa: punto de presencia discreto y pulido (sin flecha; aquí
                 no hay rumbo que señalar). */
              <View style={styles.dotHalo}>
                <View style={styles.dotCore} />
              </View>
            )}
          </MarkerView>
        ) : null}

        {origin && showPickupMarker ? (
          <MarkerView coordinate={origin} anchor={{ x: 0.5, y: 1 }}>
            <View className="items-center">
              <View className="rounded-lg bg-brand-deep px-3 py-2">
                <Text className="text-xs font-bold text-white">Recojo</Text>
              </View>
              <View className="h-4 w-4 rotate-45 bg-brand-deep" />
            </View>
          </MarkerView>
        ) : null}

        {destination && showDestinationMarker ? (
          <MarkerView coordinate={destination} anchor={{ x: 0.5, y: 1 }}>
            <View className="items-center">
              <View className="rounded-lg bg-green-600 px-3 py-2">
                <Text className="text-xs font-bold text-white">Destino</Text>
              </View>
              <View className="h-4 w-4 rotate-45 bg-green-600" />
            </View>
          </MarkerView>
        ) : null}
      </MapView>
      {fill ? null : (
        <View className="absolute bottom-3 left-3 right-3 rounded-xl bg-surface px-4 py-3">
          <Text className="text-sm font-bold text-foreground">
            {etaLabel(route.duracionSegundos)} · {distanceLabel(route.distanciaMetros)}
          </Text>
          <Text className="mt-1 text-xs font-semibold text-foreground-muted">
            {route.fuente === 'mapbox' ? 'Con tráfico actual' : 'Calculando la mejor ruta'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fillContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    flex: 1,
  },
  puckHalo: {
    height: 76,
    width: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  puckCore: {
    height: 50,
    width: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  puckArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ffffff',
    marginBottom: 3,
  },
  dotHalo: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  dotCore: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#10B981',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
});

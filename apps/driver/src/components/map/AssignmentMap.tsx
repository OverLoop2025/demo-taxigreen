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
  MarkerView: MapboxComponent;
};

function toCoordinate(point: { lat: number | null; lng: number | null }) {
  return typeof point.lat === 'number' && typeof point.lng === 'number' ? [point.lng, point.lat] : null;
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
}: {
  assignment: DriverAssignment;
  driverLocation: DriverLocation | null;
  route: DriverRouteResult;
  /** Modo navegación: el mapa ocupa todo el contenedor padre (sin tarjeta ni borde). */
  fill?: boolean;
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
  // Sólo se traza geometría REAL de Mapbox (>2 vértices = ruta por calles). Si aún
  // no hay ruta real, se muestran sólo los marcadores; nunca una recta de 2 puntos.
  const routeCoordinates =
    route.geometry?.coordinates && route.geometry.coordinates.length > 2 ? route.geometry.coordinates : [];
  const hasRoute = routeCoordinates.length > 2;
  const center = origin ?? destination ?? driver ?? [-77.08, -12.06];

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

  return (
    <View
      className={
        fill ? 'bg-surface-muted' : 'h-80 overflow-hidden rounded-xl border border-border bg-surface-muted'
      }
      style={fill ? styles.fillContainer : undefined}
    >
      <MapView
        attributionEnabled={false}
        compassEnabled={false}
        logoEnabled={false}
        scaleBarEnabled={false}
        style={styles.map}
        styleURL={styleURL}
      >
        <Camera centerCoordinate={center} zoomLevel={11.5} animationMode="easeTo" animationDuration={800} />

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
          <ShapeSource id="taxigreen-route" shape={routeShape}>
            <LineLayer
              id="taxigreen-route-casing"
              style={{
                lineColor: routeCasingColor,
                lineWidth: ['interpolate', ['linear'], ['zoom'], 10, 7, 16, 13],
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.95,
              }}
            />
            <LineLayer
              id="taxigreen-route-line"
              style={{
                lineColor: routeLineColor,
                lineWidth: ['interpolate', ['linear'], ['zoom'], 10, 4.5, 16, 8.5],
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        ) : null}

        {driver ? (
          <MarkerView coordinate={driver} anchor={{ x: 0.5, y: 0.5 }}>
            <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand">
              <Text className="text-base font-black text-white">T</Text>
            </View>
          </MarkerView>
        ) : null}

        {origin ? (
          <MarkerView coordinate={origin} anchor={{ x: 0.5, y: 1 }}>
            <View className="items-center">
              <View className="rounded-lg bg-brand-deep px-3 py-2">
                <Text className="text-xs font-bold text-white">Recojo</Text>
              </View>
              <View className="h-4 w-4 rotate-45 bg-brand-deep" />
            </View>
          </MarkerView>
        ) : null}

        {destination ? (
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
});

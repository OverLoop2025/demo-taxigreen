import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import type { DriverLocation } from '@/features/location';
import { env } from '@/lib/env';
import type { DriverAssignment } from '@/features/assignment/types';
import type { DriverRouteResult } from '@/features/routing/use-route';

declare const require: (moduleName: string) => unknown;

type MapboxComponent = ComponentType<Record<string, unknown> & { children?: ReactNode }>;

type MapboxApi = {
  setAccessToken: (token: string) => void;
  setTelemetryEnabled?: (enabled: boolean) => void;
  MapView: MapboxComponent;
  Camera: MapboxComponent;
  ShapeSource: MapboxComponent;
  LineLayer: MapboxComponent;
  MarkerView: MapboxComponent;
};

function toCoordinate(point: { lat: number | null; lng: number | null }) {
  return typeof point.lat === 'number' && typeof point.lng === 'number' ? [point.lng, point.lat] : null;
}

function fallbackRoute(assignment: DriverAssignment) {
  return `${assignment.origen.texto} -> ${assignment.destino.texto}`;
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
      .then((module) => {
        if (!mounted) return;
        const record = module as { default?: unknown };
        const mapbox = (record.default ?? module) as MapboxApi;
        mapbox.setAccessToken(env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');
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
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';

  // Estilo de navegación día/noche (look Waze/inDrive) coherente con el sistema.
  const styleURL = dark
    ? 'mapbox://styles/mapbox/navigation-night-v1'
    : 'mapbox://styles/mapbox/navigation-day-v1';
  // Ruta principal dominante: trazo brillante sobre un casing oscuro.
  const routeLineColor = dark ? '#22F3B2' : '#00A876';
  const routeCasingColor = dark ? '#001F19' : '#06382F';

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
            ? 'flex-1 justify-center bg-background px-5 py-5'
            : 'min-h-72 rounded-xl border border-border bg-surface px-5 py-5'
        }
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

  const { Camera, LineLayer, MapView, MarkerView, ShapeSource } = Mapbox;

  return (
    <View
      className={
        fill ? 'flex-1 bg-surface-muted' : 'h-80 overflow-hidden rounded-xl border border-border bg-surface-muted'
      }
    >
      <MapView style={styles.map} styleURL={styleURL}>
        <Camera centerCoordinate={center} zoomLevel={11.5} animationMode="easeTo" animationDuration={800} />
        {hasRoute ? (
          <ShapeSource id="taxigreen-route" shape={routeShape}>
            <LineLayer
              id="taxigreen-route-casing"
              style={{
                lineColor: routeCasingColor,
                lineWidth: 9,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.9,
              }}
            />
            <LineLayer
              id="taxigreen-route-line"
              style={{
                lineColor: routeLineColor,
                lineWidth: 6,
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
            {route.fuente === 'mapbox' ? 'En vivo con tráfico' : 'Calculando la mejor ruta'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

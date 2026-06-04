import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  if (typeof value !== 'number') return 'ETA calculándose';
  return `ETA ${Math.max(0, Math.ceil(value / 60))} min`;
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
        setError('Mapbox requiere dev client nativo; usando ruta textual.');
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
}: {
  assignment: DriverAssignment;
  driverLocation: DriverLocation | null;
  route: DriverRouteResult;
}) {
  const token = env.EXPO_PUBLIC_MAPBOX_TOKEN;
  const { api: Mapbox, error } = useMapboxApi(Boolean(token));

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
      <View className="min-h-72 rounded-xl border border-product/20 bg-blue-50 px-5 py-5">
        <Text className="text-sm font-bold uppercase tracking-wide text-product">Ruta operativa</Text>
        <Text className="mt-2 text-2xl font-bold text-product-deep">{'Aeropuerto -> Miraflores'}</Text>
        <Text className="mt-2 text-base font-bold text-product">
          {etaLabel(route.duracionSegundos)} · {distanceLabel(route.distanciaMetros)} ·{' '}
          {route.fuente === 'mapbox' ? 'Ruta real' : 'Estimación'}
        </Text>
        <Text className="mt-3 text-base leading-6 text-gray-700">{fallbackRoute(assignment)}</Text>
        <View className="mt-4 rounded-lg bg-white px-4 py-4">
          <Text className="text-base font-bold text-product-deep">{assignment.puntoEncuentro ?? 'Punto pendiente'}</Text>
          <Text className="mt-1 text-sm leading-5 text-gray-600">
            {error ?? 'Configura Mapbox/dev client para ver el mapa nativo. Las acciones del viaje siguen operativas.'}
          </Text>
        </View>
      </View>
    );
  }

  const { Camera, LineLayer, MapView, MarkerView, ShapeSource } = Mapbox;

  return (
    <View className="h-80 overflow-hidden rounded-xl border border-product/20 bg-gray-200">
      <MapView style={styles.map} styleURL="mapbox://styles/mapbox/dark-v11">
        <Camera centerCoordinate={center} zoomLevel={11.5} animationMode="easeTo" animationDuration={800} />
        {hasRoute ? (
          <ShapeSource id="taxigreen-route" shape={routeShape}>
            <LineLayer
              id="taxigreen-route-line"
              style={{
                lineColor: '#38BDF8',
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        ) : null}

        {driver ? (
          <MarkerView coordinate={driver} anchor={{ x: 0.5, y: 0.5 }}>
            <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-product">
              <Text className="text-base font-black text-white">T</Text>
            </View>
          </MarkerView>
        ) : null}

        {origin ? (
          <MarkerView coordinate={origin} anchor={{ x: 0.5, y: 1 }}>
            <View className="items-center">
              <View className="rounded-lg bg-product-deep px-3 py-2">
                <Text className="text-xs font-bold text-white">Recojo</Text>
              </View>
              <View className="h-4 w-4 rotate-45 bg-product-deep" />
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
      <View className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/95 px-4 py-3">
        <Text className="text-sm font-bold text-product-deep">
          {etaLabel(route.duracionSegundos)} · {distanceLabel(route.distanciaMetros)}
        </Text>
        <Text className="mt-1 text-xs font-semibold text-gray-500">
          {route.fuente === 'mapbox' ? 'Ruta real por calles' : 'Estimación operativa'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

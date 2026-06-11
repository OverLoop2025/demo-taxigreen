import { bannerConductor, accionConductor, formatLlegada } from '@taxigreen/shared';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { TouchButton } from '@/components/TouchButton';
import { AssignmentMap } from '@/components/map/AssignmentMap';
import { ApiError } from '@/features/api/client';
import {
  changeDriverAssignmentState,
  getDriverAssignment,
} from '@/features/assignment/client';
import {
  getNextTripAction,
  isTrackingState,
  tripStatusLabel,
} from '@/features/assignment/transitions';
import type { Coordinates, DriverAssignment, EstadoViaje, NextTripAction } from '@/features/assignment/types';
import { useAuth } from '@/features/auth/use-auth';
import { useLocationTracking } from '@/features/location';
import { useNetworkStatus } from '@/features/network/use-network-status';
import { useDriverRoute } from '@/features/routing/use-route';
import type { AssignmentMapMode } from '@/components/map/AssignmentMap';

function KeepAwakeGate() {
  useKeepAwake('taxigreen-driver-trip-active');
  return null;
}

function normalizeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

function serviceTimeLabel(value: string) {
  return new Date(value).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Línea grande de llegada en el banner. Nunca "ETA": lenguaje de cliente.
function etaHumano(estado: EstadoViaje | null | undefined, duracionSegundos: number | null) {
  if (estado === 'en_punto') return 'Esperando al pasajero';
  if (estado === 'finalizado') return 'Servicio cerrado';
  const minutos = typeof duracionSegundos === 'number' ? Math.ceil(duracionSegundos / 60) : null;
  return formatLlegada(minutos);
}

// Origen de la ruta en lenguaje humano y sobrio (sin "Mapbox"/"estimación"/"en vivo").
function rutaFuenteHumano(fuente: 'mapbox' | 'estimacion') {
  return fuente === 'mapbox' ? 'Con tráfico actual' : 'Calculando la mejor ruta';
}

// Distancia compacta para la guía de maniobra ("En 450 m" / "En 1.2 km").
function maniobraDistancia(metros: number | null) {
  if (typeof metros !== 'number' || metros <= 0) return 'Ahora';
  if (metros < 1000) return `En ${Math.round(metros / 10) * 10} m`;
  return `En ${(metros / 1000).toFixed(1)} km`;
}

// Icono glanceable según el giro (estilo navegador), más grueso y centrado que texto Unicode.
function maniobraIcon(tipo: string | undefined, modifier: string | null | undefined) {
  if (tipo === 'arrive') return 'radio-button-on';
  if (tipo === 'roundabout' || tipo === 'rotary') return 'sync';
  const m = modifier ?? '';
  if (m.includes('left')) {
    if (m.includes('uturn')) return 'return-up-back';
    return 'arrow-back';
  }
  if (m.includes('right')) {
    if (m.includes('uturn')) return 'return-up-forward';
    return 'arrow-forward';
  }
  if (m.includes('uturn')) return 'return-up-back';
  return 'arrow-up';
}

function ubicacionHumana(status: string) {
  if (status === 'tracking') return 'Ubicación activa';
  if (status === 'requesting_permission') return 'Pidiendo permiso';
  if (status === 'permission_denied') return 'Permiso pendiente';
  if (status === 'realtime_disabled') return 'Ubicación limitada';
  if (status === 'error') return 'Revisar ubicación';
  return 'Lista';
}

function accionPrincipalLabel(estado: EstadoViaje | null, fallback: NextTripAction) {
  if (estado === 'asignado') return 'Iniciar ruta';
  return (estado ? accionConductor(estado) : null) ?? fallback.label;
}

function distanciaRutaHumana(metros: number | null) {
  if (typeof metros !== 'number') return 'Trazando ruta';
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1)} km`;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Cobro estimado ESTABLE del viaje (origen→destino), no del tramo vivo: no fluctúa
// con el GPS. Tarifa simple Lima (mockup de demo; el pago real es "otro costal").
function cobroEstimado(origen: Coordinates, destino: Coordinates): string | null {
  if (
    typeof origen.lat !== 'number' ||
    typeof origen.lng !== 'number' ||
    typeof destino.lat !== 'number' ||
    typeof destino.lng !== 'number'
  ) {
    return null;
  }
  const km = haversineKm({ lat: origen.lat, lng: origen.lng }, { lat: destino.lat, lng: destino.lng }) * 1.3;
  const monto = 7.5 + 3.2 * km;
  const redondeado = Math.round(monto / 0.5) * 0.5;
  return `S/ ${redondeado.toFixed(2)}`;
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View className="flex-row items-baseline justify-between gap-3">
      <Text className="text-sm font-semibold text-foreground-muted">{label}</Text>
      <Text className="flex-1 text-right text-base font-bold text-foreground" numberOfLines={1}>
        {value || 'Pendiente'}
      </Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl bg-surface-muted px-3 py-3">
      <Text className="text-xs font-bold uppercase tracking-wide text-foreground-muted">{label}</Text>
      <Text className="mt-1 text-sm font-bold text-foreground" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function AssignmentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reservaId = normalizeParam(id);
  const { session } = useAuth();
  const network = useNetworkStatus();
  const [assignment, setAssignment] = useState<DriverAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<NextTripAction | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [mapModeOverride, setMapModeOverride] = useState<AssignmentMapMode | null>(null);
  const [mapRecenterKey, setMapRecenterKey] = useState(0);
  const autoRetryArmed = useRef(false);
  const prevOnlineRef = useRef<boolean | null>(null);

  const estadoViaje = assignment?.viaje?.estado ?? null;
  const trackingActive = isTrackingState(estadoViaje);
  const tracking = useLocationTracking(reservaId ?? null, trackingActive);
  const route = useDriverRoute({
    assignment,
    driverLocation: tracking.lastLocation,
    token: session?.token,
  });
  const nextAction = useMemo(() => getNextTripAction(estadoViaje), [estadoViaje]);
  const defaultMapMode: AssignmentMapMode =
    estadoViaje === 'en_camino' || estadoViaje === 'a_bordo' ? 'drive' : 'overview';
  const mapMode = mapModeOverride ?? defaultMapMode;
  const driverModeUi = mapMode === 'drive' && (estadoViaje === 'en_camino' || estadoViaje === 'a_bordo');

  const loadAssignment = useCallback(async (silent = false) => {
    if (!reservaId || !session?.token) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await getDriverAssignment(reservaId, session.token);
      setAssignment(response);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'No se pudo cargar este viaje.';
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [reservaId, session?.token]);

  useEffect(() => {
    void loadAssignment();
  }, [loadAssignment]);

  // Reconnect re-sync: cuando el network pasa de offline → online, refrescar sin
  // spinner para recuperar broadcasts Supabase Realtime perdidos durante la desconexión.
  useEffect(() => {
    const prev = prevOnlineRef.current;
    prevOnlineRef.current = network.isOnline;
    if (prev !== null && prev !== true && network.isOnline === true && !loading && !submitting) {
      void loadAssignment(true);
    }
  }, [network.isOnline, loadAssignment, loading, submitting]);

  const submitAction = useCallback(
    async (action: NextTripAction) => {
      if (!reservaId || !session?.token || submitting) return;

      if (network.isOnline === false) {
        setPendingRetry(action);
        autoRetryArmed.current = true;
        setNotice('Sin conexión. La acción quedó lista para reintentar.');
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        const response = await changeDriverAssignmentState({
          reservaId,
          token: session.token,
          estadoNuevo: action.estado,
        });
        setAssignment(response.asignacion);
        setPendingRetry(null);
        autoRetryArmed.current = false;
        // El toast ya confirma la acción; un aviso persistente envejece mal (p. ej.
        // "Servicio terminado confirmado" colgado al iniciar el siguiente viaje).
        showToast(`${action.label} confirmado`);
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : 'No se pudo confirmar la acción.';
        // 409: el servidor divergió del estado local (admin cambió estado, doble submit, etc.).
        // Re-sincronizar silenciosamente y limpiar el pendingRetry para no repetir el mismo POST.
        if (submitError instanceof ApiError && submitError.status === 409) {
          setPendingRetry(null);
          autoRetryArmed.current = false;
          void loadAssignment(true);
        } else {
          setPendingRetry(action);
          autoRetryArmed.current = false;
        }
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [network.isOnline, reservaId, session?.token, submitting],
  );

  useEffect(() => {
    if (!pendingRetry || network.isOnline !== true || submitting || !autoRetryArmed.current) return;
    autoRetryArmed.current = false;
    void submitAction(pendingRetry);
  }, [network.isOnline, pendingRetry, submitAction, submitting]);

  useEffect(() => {
    setMapModeOverride(null);
    setMapRecenterKey((value) => value + 1);
    // Mensajes de la fase anterior nunca sobreviven a un cambio de estado.
    setNotice(null);
  }, [estadoViaje]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <ActivityIndicator color="#10B981" size="large" />
        <Text className="mt-4 text-lg font-bold text-foreground">Cargando viaje</Text>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View className="flex-1 justify-center bg-background px-6">
        <View className="rounded-2xl border border-border bg-surface px-5 py-6">
          <Text className="text-2xl font-bold text-foreground">No se encontró este viaje</Text>
          <Text className="mt-3 text-base leading-6 text-foreground-muted">
            Puede que haya sido reasignado o no pertenezca a tu conductor.
          </Text>
          {error ? <Text className="mt-3 text-base font-semibold text-red-500">{error}</Text> : null}
          <TouchButton label="Volver al inicio" className="mt-5" onPress={() => router.replace('/(auth)/home')} />
        </View>
      </View>
    );
  }

  const estadoBanner: EstadoViaje = estadoViaje ?? 'asignado';
  const punto = assignment.puntoEncuentro ?? 'Salida 3, columna F2';
  const destino = assignment.destino.texto;
  const mostrandoDestino = estadoViaje === 'a_bordo' || estadoViaje === 'finalizado';
  const focalLabel = mostrandoDestino ? 'Destino' : 'Punto de encuentro';
  const focalValue = mostrandoDestino ? destino : punto;
  const unidadLabel = assignment.unidad
    ? `${assignment.unidad.placa} · ${assignment.unidad.marca} ${assignment.unidad.modelo}`
    : 'Unidad pendiente';
  const ubicacionLabel = ubicacionHumana(tracking.status);

  // Próxima maniobra para la guía tipo navegador. Sin progreso GPS real en la demo,
  // mostramos la primera maniobra de giro (paso 1) y la distancia hasta ella (la
  // longitud del tramo de salida). Si sólo hay un paso, usamos ese.
  const pasos = route.route.pasos;
  const maniobraIdx = pasos.length > 1 ? 1 : 0;
  const maniobra = pasos[maniobraIdx] ?? null;
  const distanciaManiobra =
    pasos.length > 1 ? pasos[0]?.distanciaMetros ?? null : maniobra?.distanciaMetros ?? null;
  const tieneManiobra = mapMode === 'drive' && Boolean(maniobra) && estadoViaje !== 'finalizado';
  const routeSubtitle =
    route.status === 'calculating'
      ? 'Trazando desde tu ubicación'
      : rutaFuenteHumano(route.route.fuente);
  // Cálculo puro y barato (no hook): seguro tras los early returns. El cobro es
  // estable (origen→destino), así que no fluctúa con el GPS.
  const cobro = cobroEstimado(assignment.origen, assignment.destino);

  return (
    <View className="flex-1 bg-background">
      <StatusBar hidden />
      {trackingActive ? <KeepAwakeGate /> : null}

      {/* Mapa de fondo a pantalla completa (estilo navegación). */}
      <View style={styles.mapLayer}>
        <AssignmentMap
          fill
          assignment={assignment}
          compassHeading={tracking.compassHeading}
          driverLocation={tracking.lastLocation}
          mode={mapMode}
          recenterKey={mapRecenterKey}
          route={route.route}
        />
      </View>

      {/* Banner superior estilo navegador: maniobra real + llegada. Recuadro
          oscuro de alto contraste (patrón Waze/Maps) para lectura al volante. */}
      <View className="absolute inset-x-0 top-0 px-3 pb-3 pt-12">
        <View className="overflow-hidden rounded-3xl bg-ink-900 shadow-2xl">
          <View className="flex-row items-center gap-3 px-4 py-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio"
              onPress={() => router.replace('/(auth)/home')}
              className="h-10 w-10 items-center justify-center rounded-full bg-ink-700"
            >
              <Text className="text-3xl font-bold leading-7 text-white">‹</Text>
            </Pressable>
            {tieneManiobra ? (
              <>
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand">
                  <Ionicons
                    name={maniobraIcon(maniobra?.tipo, maniobra?.modifier)}
                    size={42}
                    color="#0A0A0B"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-3xl font-black leading-9 text-white" numberOfLines={1}>
                    {maniobraDistancia(distanciaManiobra)}
                  </Text>
                  <Text className="text-lg font-bold leading-6 text-zinc-300" numberOfLines={2}>
                    {maniobra?.instruccion}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand">
                  <Ionicons
                    name={mapMode === 'drive' ? 'navigate' : 'map'}
                    size={30}
                    color="#0A0A0B"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {mapMode === 'drive' ? tripStatusLabel(estadoViaje) : 'Ruta del viaje'}
                  </Text>
                  <Text className="text-xl font-bold leading-7 text-white" numberOfLines={2}>
                    {mapMode === 'drive'
                      ? bannerConductor(estadoBanner, { punto, destino })
                      : `${assignment.origen.texto} → ${assignment.destino.texto}`}
                  </Text>
                </View>
              </>
            )}
          </View>
          <View className="flex-row items-center justify-between bg-ink-800 px-4 py-3">
            <Text className="text-base font-bold text-white">
              {etaHumano(estadoViaje, route.route.duracionSegundos)}
            </Text>
            <Text className="text-xs font-semibold text-zinc-400">{routeSubtitle}</Text>
          </View>
        </View>
      </View>

      {/* Controles de mapa: pulgares grandes, fuera del banner y del panel. */}
      <View className="absolute right-4 top-56 gap-3">
        {defaultMapMode === 'drive' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ubicarme"
            onPress={() => {
              setMapModeOverride('drive');
              setMapRecenterKey((value) => value + 1);
            }}
            className={`h-14 w-14 items-center justify-center rounded-full border shadow-xl ${
              mapMode === 'drive' ? 'border-brand bg-brand' : 'border-border bg-surface'
            }`}
          >
            <Ionicons name="navigate" size={24} color={mapMode === 'drive' ? '#0A0A0B' : '#10B981'} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver ruta completa"
          onPress={() => {
            setMapModeOverride('overview');
            setMapRecenterKey((value) => value + 1);
          }}
          className={`h-14 w-14 items-center justify-center rounded-full border shadow-xl ${
            mapMode === 'overview' ? 'border-brand bg-brand' : 'border-border bg-surface'
          }`}
        >
          <Ionicons name="map-outline" size={24} color={mapMode === 'overview' ? '#0A0A0B' : '#10B981'} />
        </Pressable>
      </View>

      {driverModeUi ? (
        <View className="absolute inset-x-3 bottom-5 rounded-3xl border border-white/10 bg-ink-900/95 px-4 pb-4 pt-4 shadow-2xl">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand">
              <Ionicons name="flag" size={26} color="#0A0A0B" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-wide text-zinc-400">Destino</Text>
              <Text className="mt-0.5 text-xl font-black text-white" numberOfLines={1}>
                {destino}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-zinc-400" numberOfLines={1}>
                {etaHumano(estadoViaje, route.route.duracionSegundos)} · {distanciaRutaHumana(route.route.distanciaMetros)} · {routeSubtitle}
              </Text>
            </View>
          </View>

          {error ? (
            <View className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3">
              <Text className="text-sm font-semibold text-red-300">{error}</Text>
            </View>
          ) : null}

          <View className="mt-4">
            {pendingRetry ? (
              <TouchButton
                label={`Reintentar: ${accionPrincipalLabel(estadoBanner, pendingRetry)}`}
                loading={submitting}
                onPress={() => submitAction(pendingRetry)}
              />
            ) : nextAction ? (
              <TouchButton
                label={accionPrincipalLabel(estadoViaje, nextAction)}
                loading={submitting}
                onPress={() => submitAction(nextAction)}
              />
            ) : (
              <TouchButton label="Actualizar" tone="secondary" onPress={() => loadAssignment()} />
            )}
          </View>
        </View>
      ) : (
        <View className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-surface px-5 pb-8 pt-3 shadow-2xl">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Ver menos' : 'Ver más detalles'}
            onPress={() => setExpanded((value) => !value)}
            className="items-center pb-3"
          >
            <View className="h-1.5 w-12 rounded-full bg-border" />
          </Pressable>

          <Text className="text-xs font-bold uppercase tracking-wide text-foreground-muted">{focalLabel}</Text>
          <Text className="mt-1 text-2xl font-bold leading-8 text-foreground" numberOfLines={2}>
            {focalValue}
          </Text>
          <Text className="mt-1 text-base text-foreground-muted" numberOfLines={1}>
            {assignment.pasajero.nombre} · {assignment.vuelo.codigo ?? 'Vuelo por confirmar'}
          </Text>

          {cobro ? (
            <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-brand/40 bg-surface-muted px-4 py-3">
              <Text className="text-sm font-bold uppercase tracking-wide text-foreground-muted">Cobro estimado</Text>
              <Text className="text-xl font-black text-foreground">{cobro}</Text>
            </View>
          ) : null}

          {expanded ? (
            <View className="mt-4 gap-3">
              <DetailRow label="Recojo en" value={assignment.origen.texto} />
              <DetailRow label="Destino" value={assignment.destino.texto} />
              <DetailRow label="Hora" value={serviceTimeLabel(assignment.fechaHoraServicio)} />
              <DetailRow label="Unidad" value={unidadLabel} />
              <DetailRow label="Reserva" value={assignment.voucherCodigo} />
              <View className="mt-1 flex-row gap-3">
                <MiniStat label="Ubicación" value={ubicacionLabel} />
                <MiniStat label="Conexión" value={network.label} />
              </View>
            </View>
          ) : null}

          {notice ? (
            <View className="mt-4 rounded-xl border border-brand/30 bg-brand/15 px-4 py-3">
              <Text className="text-sm font-semibold text-brand-deep">{notice}</Text>
            </View>
          ) : null}

          {error || tracking.error ? (
            <View className="mt-4 rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-3">
              <Text className="text-sm font-semibold text-red-500">{error ?? tracking.error}</Text>
            </View>
          ) : null}

          <View className="mt-5">
            {estadoViaje === 'finalizado' ? (
              <>
                <Text className="mb-3 text-sm leading-5 text-foreground-muted">
                  Servicio terminado. El cierre final continúa desde el seguimiento del pasajero.
                </Text>
                <TouchButton label="Volver al inicio" onPress={() => router.replace('/(auth)/home')} />
              </>
            ) : pendingRetry ? (
              <>
                <Text className="mb-3 text-sm leading-5 text-foreground-muted">
                  Hay una acción pendiente. Se reintentará cuando vuelva la conexión, o puedes forzar el intento.
                </Text>
                <TouchButton
                  label={`Reintentar: ${accionPrincipalLabel(estadoBanner, pendingRetry)}`}
                  loading={submitting}
                  onPress={() => submitAction(pendingRetry)}
                />
              </>
            ) : nextAction ? (
              <TouchButton
                label={accionPrincipalLabel(estadoViaje, nextAction)}
                loading={submitting}
                onPress={() => submitAction(nextAction)}
              />
            ) : (
              <TouchButton label="Actualizar" tone="secondary" onPress={() => loadAssignment()} />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});

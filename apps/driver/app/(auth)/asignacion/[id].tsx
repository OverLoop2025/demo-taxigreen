import { bannerConductor, accionConductor, formatLlegada } from '@taxigreen/shared';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, ToastAndroid, View } from 'react-native';
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
import type { DriverAssignment, EstadoViaje, NextTripAction } from '@/features/assignment/types';
import { useAuth } from '@/features/auth/use-auth';
import { useLocationTracking } from '@/features/location';
import { useNetworkStatus } from '@/features/network/use-network-status';
import { useDriverRoute } from '@/features/routing/use-route';

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

// Origen de la ruta en lenguaje humano (sin "Mapbox"/"estimación").
function rutaFuenteHumano(fuente: 'mapbox' | 'estimacion') {
  return fuente === 'mapbox' ? 'En vivo con tráfico' : 'Calculando la mejor ruta';
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
        setNotice(`${action.label} confirmado.`);
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
  const ubicacionLabel = tracking.status === 'tracking' ? 'Enviando posición' : tracking.status.replaceAll('_', ' ');

  return (
    <View className="flex-1 bg-background">
      <StatusBar hidden />
      {trackingActive ? <KeepAwakeGate /> : null}

      {/* Mapa de fondo a pantalla completa (estilo navegación). */}
      <View className="absolute inset-0">
        <AssignmentMap fill assignment={assignment} driverLocation={tracking.lastLocation} route={route.route} />
      </View>

      {/* Banner superior: instrucción de navegación + llegada. */}
      <View className="absolute inset-x-0 top-0 px-4 pb-3 pt-12">
        <View className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-lg">
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio"
              onPress={() => router.replace('/(auth)/home')}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface-muted"
            >
              <Text className="text-3xl font-bold leading-7 text-foreground">‹</Text>
            </Pressable>
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                {tripStatusLabel(estadoViaje)}
              </Text>
              <Text className="text-xl font-bold leading-7 text-foreground" numberOfLines={2}>
                {bannerConductor(estadoBanner, { punto, destino })}
              </Text>
            </View>
          </View>
          <View className="mt-3 flex-row items-center justify-between rounded-xl bg-surface-muted px-3 py-2">
            <Text className="text-base font-bold text-foreground">{etaHumano(estadoViaje, route.route.duracionSegundos)}</Text>
            <Text className="text-xs font-semibold text-foreground-muted">{rutaFuenteHumano(route.route.fuente)}</Text>
          </View>
        </View>
      </View>

      {/* Panel inferior: foco de la fase + una acción principal. */}
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

        {expanded ? (
          <View className="mt-4 gap-3">
            <DetailRow label="Recojo en" value={assignment.origen.texto} />
            <DetailRow label="Destino" value={assignment.destino.texto} />
            <DetailRow label="Hora" value={serviceTimeLabel(assignment.fechaHoraServicio)} />
            <DetailRow label="Unidad" value={unidadLabel} />
            <DetailRow label="Código" value={assignment.voucherCodigo} />
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
                label={`Reintentar: ${accionConductor(estadoBanner) ?? pendingRetry.label}`}
                loading={submitting}
                onPress={() => submitAction(pendingRetry)}
              />
            </>
          ) : nextAction ? (
            <TouchButton
              label={(estadoViaje ? accionConductor(estadoViaje) : null) ?? nextAction.label}
              loading={submitting}
              onPress={() => submitAction(nextAction)}
            />
          ) : (
            <TouchButton label="Actualizar" tone="secondary" onPress={() => loadAssignment()} />
          )}
        </View>
      </View>
    </View>
  );
}

import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, ToastAndroid, View } from 'react-native';
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

function etaLabel(estado: EstadoViaje | null | undefined) {
  if (estado === 'en_camino') return 'ETA 8 min al punto';
  if (estado === 'en_punto') return 'Esperando pasajero';
  if (estado === 'a_bordo') return 'ETA 23 min al destino';
  if (estado === 'finalizado') return 'Servicio cerrado';
  return 'Listo para iniciar';
}

function dynamicEtaLabel(estado: EstadoViaje | null | undefined, duracionSegundos: number | null) {
  if (estado === 'en_punto') return 'Esperando pasajero';
  if (estado === 'finalizado') return 'Servicio cerrado';
  if (typeof duracionSegundos === 'number') {
    const minutes = Math.max(0, Math.ceil(duracionSegundos / 60));
    if (estado === 'a_bordo') return `ETA ${minutes} min al destino`;
    return `ETA ${minutes} min al punto`;
  }
  return etaLabel(estado);
}

function routeSourceLabel(source: 'mapbox' | 'estimacion') {
  return source === 'mapbox' ? 'Ruta real con tráfico' : 'Estimación de respaldo';
}

function StatusPill({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-white/15 px-4 py-2">
      <Text className="text-sm font-bold text-white">{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View className="rounded-lg bg-gray-50 px-4 py-3">
      <Text className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</Text>
      <Text className="mt-1 text-base font-bold text-product-deep">{value || 'Pendiente'}</Text>
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
      const message = loadError instanceof Error ? loadError.message : 'No se pudo cargar la asignación.';
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
        const message = submitError instanceof Error ? submitError.message : 'No se pudo cambiar el estado.';
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
      <View className="flex-1 items-center justify-center bg-gray-100 px-6">
        <ActivityIndicator color="#227FDE" size="large" />
        <Text className="mt-4 text-lg font-bold text-product-deep">Cargando asignación</Text>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View className="flex-1 justify-center bg-gray-100 px-6">
        <View className="rounded-2xl bg-white px-5 py-6">
          <Text className="text-2xl font-bold text-product-deep">No se encontró esta asignación</Text>
          <Text className="mt-3 text-base leading-6 text-gray-600">
            Puede que haya sido reasignada o no pertenezca a tu conductor.
          </Text>
          {error ? <Text className="mt-3 text-base font-semibold text-red-600">{error}</Text> : null}
          <TouchButton label="Volver al inicio" className="mt-5" onPress={() => router.replace('/(auth)/home')} />
        </View>
      </View>
    );
  }

  return (
    <>
      {trackingActive ? <KeepAwakeGate /> : null}
      <ScrollView className="flex-1 bg-gray-100" contentContainerClassName="px-5 pb-8 pt-10">
        <View className="rounded-2xl bg-product-deep px-5 py-5">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <Text className="text-base font-semibold text-white/70">Viaje activo</Text>
            <StatusPill label={tripStatusLabel(estadoViaje)} />
          </View>
          <Text className="mt-4 text-3xl font-bold leading-9 text-white">{assignment.pasajero.nombre}</Text>
          <Text className="mt-2 text-lg font-semibold text-white/80">
            {assignment.vuelo.codigo ?? 'Vuelo por confirmar'} · {assignment.voucherCodigo}
          </Text>
          <Text className="mt-3 text-base font-semibold text-white">
            {dynamicEtaLabel(estadoViaje, route.route.duracionSegundos)}
          </Text>
          <Text className="mt-1 text-sm font-semibold text-white/70">{routeSourceLabel(route.route.fuente)}</Text>
        </View>

        <View className="mt-4 rounded-2xl bg-white px-5 py-5">
          <Text className="text-sm font-bold uppercase tracking-wide text-gray-500">Punto de encuentro</Text>
          <Text className="mt-2 text-3xl font-bold leading-9 text-product-deep">
            {assignment.puntoEncuentro ?? 'Salida 3, columna F2'}
          </Text>
          <Text className="mt-2 text-base leading-6 text-gray-600">
            Recoge en {assignment.origen.texto}. El hotel es solicitante, no origen físico.
          </Text>
        </View>

        <View className="mt-4">
          <AssignmentMap assignment={assignment} driverLocation={tracking.lastLocation} route={route.route} />
        </View>

        <View className="mt-4 gap-3">
          <InfoRow label="Origen físico" value={assignment.origen.texto} />
          <InfoRow label="Destino" value={assignment.destino.texto} />
          <InfoRow label="Hora servicio" value={serviceTimeLabel(assignment.fechaHoraServicio)} />
          <InfoRow
            label="Unidad"
            value={
              assignment.unidad
                ? `${assignment.unidad.placa} · ${assignment.unidad.marca} ${assignment.unidad.modelo}`
                : 'Unidad pendiente'
            }
          />
        </View>

        <View className="mt-4 flex-row gap-3">
          <View className="min-h-20 flex-1 rounded-2xl bg-white px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-wide text-gray-500">Ubicación</Text>
            <Text className="mt-1 text-base font-bold text-product-deep">
              {tracking.status === 'tracking' ? 'Enviando posición' : tracking.status.replaceAll('_', ' ')}
            </Text>
          </View>
          <View className="min-h-20 flex-1 rounded-2xl bg-white px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-wide text-gray-500">Red</Text>
            <Text className="mt-1 text-base font-bold text-product-deep">{network.label}</Text>
          </View>
        </View>

        {notice ? (
          <View className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <Text className="text-base font-semibold text-product-deep">{notice}</Text>
          </View>
        ) : null}

        {error || tracking.error ? (
          <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <Text className="text-base font-semibold text-red-700">{error ?? tracking.error}</Text>
          </View>
        ) : null}

        <View className="mt-5 rounded-2xl bg-white px-5 py-5">
          <Text className="text-xl font-bold text-product-deep">Siguiente acción</Text>
          {estadoViaje === 'finalizado' ? (
            <>
              <Text className="mt-3 text-base leading-6 text-gray-600">
                Servicio terminado. La reserva quedó por liquidar; el cierre comercial sigue en el link del pasajero.
              </Text>
              <TouchButton label="Volver al inicio" className="mt-5" onPress={() => router.replace('/(auth)/home')} />
            </>
          ) : pendingRetry ? (
            <>
              <Text className="mt-3 text-base leading-6 text-gray-600">
                Hay una acción pendiente. Se reintentará cuando vuelva la conexión, o puedes forzar el intento.
              </Text>
              <TouchButton
                label={`Reintentar: ${pendingRetry.label}`}
                loading={submitting}
                className="mt-5"
                onPress={() => submitAction(pendingRetry)}
              />
            </>
          ) : nextAction ? (
            <>
              <Text className="mt-3 text-base leading-6 text-gray-600">{nextAction.helper}</Text>
              <TouchButton
                label={nextAction.label}
                loading={submitting}
                className="mt-5"
                onPress={() => submitAction(nextAction)}
              />
            </>
          ) : (
            <>
              <Text className="mt-3 text-base leading-6 text-gray-600">
                El viaje no tiene una acción disponible. Actualiza la asignación o vuelve al inicio.
              </Text>
              <TouchButton label="Actualizar" tone="secondary" className="mt-5" onPress={() => loadAssignment()} />
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

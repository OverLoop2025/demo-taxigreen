import { bannerConductor, accionConductor, formatLlegada } from '@taxigreen/shared';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, ToastAndroid, View } from 'react-native';
import { DraggableSheet } from '@/components/DraggableSheet';
import { SpeedBadge } from '@/components/SpeedBadge';
import { TouchButton } from '@/components/TouchButton';
import { AssignmentMap } from '@/components/map/AssignmentMap';
import { ApiError } from '@/features/api/client';
import {
  cancelDriverAssignment,
  changeDriverAssignmentState,
  getDriverAssignment,
  type MotivoCancelacion,
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
import { useRealtime } from '@/features/realtime';
import { proximaManiobra } from '@/features/routing/guidance';
import { useDriverRoute } from '@/features/routing/use-route';
import type { AssignmentMapMode } from '@/components/map/AssignmentMap';

function KeepAwakeGate() {
  useKeepAwake('taxigreen-driver-trip-active');
  return null;
}

function normalizeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// F7: motivos cerrados de cancelación (mismo catálogo que valida el servidor).
const MOTIVOS_CANCELACION: Array<{ valor: MotivoCancelacion; etiqueta: string }> = [
  { valor: 'problema_mecanico', etiqueta: 'Problema mecánico' },
  { valor: 'no_llego_a_tiempo', etiqueta: 'No llego a tiempo' },
  { valor: 'emergencia_personal', etiqueta: 'Emergencia personal' },
  { valor: 'error_de_asignacion', etiqueta: 'Error de asignación' },
  { valor: 'otro', etiqueta: 'Otro' },
];

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
  if (fallback.bloqueada) return fallback.label;
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

function isValidLatLng(point: Coordinates): point is Coordinates & { lat: number; lng: number } {
  return (
    typeof point.lat === 'number' &&
    Number.isFinite(point.lat) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    typeof point.lng === 'number' &&
    Number.isFinite(point.lng) &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

// Cobro estimado ESTABLE del viaje (origen→destino), no del tramo vivo: no fluctúa
// con el GPS. Tarifa simple Lima (mockup de demo; el pago real es "otro costal").
function cobroEstimado(origen: Coordinates, destino: Coordinates): string | null {
  if (!isValidLatLng(origen) || !isValidLatLng(destino)) {
    return null;
  }
  const km = haversineKm({ lat: origen.lat, lng: origen.lng }, { lat: destino.lat, lng: destino.lng }) * 1.3;
  const monto = 7.5 + 3.2 * km;
  const redondeado = Math.max(15, Math.round(monto / 0.5) * 0.5);
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
  const { clearLastAbordaje, lastAbordaje } = useRealtime();
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
  // F7: hoja de cancelación con motivo (el despacho reasigna otra unidad).
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState<MotivoCancelacion | null>(null);
  const [cancelComentario, setCancelComentario] = useState('');
  const [cancelSending, setCancelSending] = useState(false);
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
  const nextAction = useMemo(
    () => getNextTripAction(estadoViaje, assignment?.abordaje),
    [assignment?.abordaje, estadoViaje],
  );
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
      if (action.bloqueada) return;

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
    if (!lastAbordaje || lastAbordaje.reservaId !== reservaId) return;
    setNotice('Mostrador validó el pase. Ya puedes iniciar la ruta.');
    void loadAssignment(true);
    clearLastAbordaje();
  }, [clearLastAbordaje, lastAbordaje, loadAssignment, reservaId]);

  useEffect(() => {
    setMapModeOverride(null);
    setMapRecenterKey((value) => value + 1);
    // Mensajes de la fase anterior nunca sobreviven a un cambio de estado.
    setNotice(null);
  }, [estadoViaje]);

  // F7: cancelable solo antes de subir al pasajero; después es una incidencia.
  const puedeCancelar =
    estadoViaje === 'asignado' || estadoViaje === 'en_camino' || estadoViaje === 'en_punto';

  const submitCancel = useCallback(async () => {
    if (!reservaId || !session?.token || !cancelMotivo || cancelSending) return;
    setCancelSending(true);
    try {
      await cancelDriverAssignment({
        reservaId,
        token: session.token,
        motivo: cancelMotivo,
        comentario: cancelComentario.trim() || undefined,
      });
      showToast('Viaje cancelado. El despacho asignará otra unidad.');
      router.replace('/(auth)/home');
    } catch (cancelError) {
      setCancelSending(false);
      setError(cancelError instanceof Error ? cancelError.message : 'No se pudo cancelar el viaje.');
      setCancelOpen(false);
    }
  }, [cancelComentario, cancelMotivo, cancelSending, reservaId, router, session?.token]);

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
  const punto = assignment.puntoEncuentro ?? assignment.origen.texto;
  const destino = assignment.destino.texto;
  const mostrandoDestino = estadoViaje === 'a_bordo' || estadoViaje === 'finalizado';
  const focalLabel = mostrandoDestino
    ? 'Destino'
    : assignment.abordaje?.requiereCounter
      ? 'Punto de encuentro'
      : 'Punto de recojo';
  const focalValue = mostrandoDestino ? destino : punto;
  const unidadLabel = assignment.unidad
    ? `${assignment.unidad.placa} · ${assignment.unidad.marca} ${assignment.unidad.modelo}`
    : 'Unidad pendiente';
  const ubicacionLabel = ubicacionHumana(tracking.status);
  // `abordaje` puede faltar si el backend aún no expone Feature 1: fail-open (no bloquear).
  const abordajeBloqueado = Boolean(
    estadoViaje === 'asignado' &&
      assignment.abordaje?.requiereCounter &&
      !assignment.abordaje?.autorizado,
  );
  const sinMostradorListo = Boolean(
    estadoViaje === 'asignado' &&
      assignment.abordaje &&
      !assignment.abordaje.requiereCounter,
  );

  // Próxima maniobra REAL según el avance del conductor sobre la ruta: el GPS se
  // proyecta sobre la polilínea y se elige el primer giro que sigue por delante.
  // Así el banner nunca anuncia un giro ya ejecutado (ni el lado equivocado).
  const guiaManiobra = proximaManiobra({
    pasos: route.route.pasos,
    geometry: route.route.geometry,
    gps: tracking.lastLocation
      ? { lat: tracking.lastLocation.lat, lng: tracking.lastLocation.lng }
      : null,
  });
  const maniobra = guiaManiobra?.paso ?? null;
  const distanciaManiobra = guiaManiobra?.distanciaMetros ?? null;
  const tieneManiobra = mapMode === 'drive' && Boolean(maniobra) && estadoViaje !== 'finalizado';
  const routeSubtitle =
    route.status === 'calculating'
      ? 'Trazando desde tu ubicación'
      : rutaFuenteHumano(route.route.fuente);
  // Cálculo puro y barato (no hook): seguro tras los early returns. El cobro es
  // estable (origen→destino), así que no fluctúa con el GPS.
  const cobro = assignment.cobro?.montoEtiqueta ?? cobroEstimado(assignment.origen, assignment.destino);
  const cobroLabel = assignment.cobro ? 'Cobro' : 'Cobro estimado';
  const cobroEstado = assignment.comercial?.pagoConductor ?? assignment.cobro?.estadoLabel ?? null;

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
          {tieneManiobra ? null : (
            <View className="flex-row items-center justify-between bg-ink-800 px-4 py-3">
              <Text className="text-base font-bold text-white">
                {etaHumano(estadoViaje, route.route.duracionSegundos)}
              </Text>
              <Text className="text-xs font-semibold text-zinc-400">{routeSubtitle}</Text>
            </View>
          )}
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
        /* Modo conductor: panel mínimo (patrón Waze) — velocímetro a la izquierda,
           destino + ETA en el centro. El cobro y detalles viven en la vista de resumen. */
        <View className="absolute inset-x-3 bottom-5 rounded-3xl border border-white/10 bg-ink-900/95 px-4 pb-3 pt-3 shadow-2xl">
          <View className="flex-row items-center gap-3">
            {/* Velocímetro: siempre visible en modo conductor, nunca superpuesto */}
            <SpeedBadge speedMs={tracking.lastLocation?.speed ?? null} />
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand">
              <Ionicons name="flag" size={18} color="#0A0A0B" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-black leading-6 text-white" numberOfLines={1}>
                {destino}
              </Text>
              <Text className="mt-0.5 text-sm font-semibold text-zinc-400" numberOfLines={1}>
                {etaHumano(estadoViaje, route.route.duracionSegundos)} · {distanciaRutaHumana(route.route.distanciaMetros)}
              </Text>
            </View>
          </View>

          {error ? (
            <View className="mt-2 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-2">
              <Text className="text-sm font-semibold text-red-300">{error}</Text>
            </View>
          ) : null}

          <View className="mt-3">
            {pendingRetry ? (
              <TouchButton
                label={`Reintentar: ${accionPrincipalLabel(estadoBanner, pendingRetry)}`}
                loading={submitting}
                onPress={() => submitAction(pendingRetry)}
              />
            ) : nextAction ? (
              <TouchButton
                label={accionPrincipalLabel(estadoViaje, nextAction)}
                disabled={nextAction.bloqueada}
                loading={submitting}
                onPress={() => submitAction(nextAction)}
              />
            ) : (
              <TouchButton label="Actualizar" tone="secondary" onPress={() => loadAssignment()} />
            )}
          </View>
          {puedeCancelar ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setCancelOpen(true)}
              className="mt-2 items-center py-1"
            >
              <Text className="text-sm font-semibold text-zinc-500">No puedo continuar este viaje</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <DraggableSheet
          containerStyle={styles.overviewSheetAnchor}
          cardClassName="rounded-t-3xl border-t border-border bg-surface px-5 pb-8 pt-3 shadow-2xl"
          onSwipeUp={() => setExpanded(true)}
          onSwipeDown={() => setExpanded(false)}
          onTap={() => setExpanded((value) => !value)}
          dragUpLimit={-72}
          dragDownLimit={56}
        >
          {mapMode === 'drive' ? (
            /* En modo conductor con sheet overview: velocímetro integrado en la cabecera */
            <View className="mb-1 flex-row items-center gap-3">
              <SpeedBadge speedMs={tracking.lastLocation?.speed ?? null} />
              <View className="flex-1">
                <Text className="text-xs font-bold uppercase tracking-wide text-foreground-muted">{focalLabel}</Text>
                <Text className="text-xl font-bold leading-7 text-foreground" numberOfLines={1}>{focalValue}</Text>
                <Text className="mt-0.5 text-sm text-foreground-muted" numberOfLines={1}>
                  {assignment.pasajero.nombre} · {assignment.vuelo.codigo ?? 'Vuelo por confirmar'}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text className="text-xs font-bold uppercase tracking-wide text-foreground-muted">{focalLabel}</Text>
              <Text className="mt-1 text-2xl font-bold leading-8 text-foreground" numberOfLines={2}>
                {focalValue}
              </Text>
              <Text className="mt-1 text-base text-foreground-muted" numberOfLines={1}>
                {assignment.pasajero.nombre} · {assignment.vuelo.codigo ?? 'Vuelo por confirmar'}
              </Text>
            </>
          )}

          {cobro ? (
            <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-brand/40 bg-surface-muted px-4 py-3">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold uppercase tracking-wide text-foreground-muted">{cobroLabel}</Text>
                {cobroEstado ? (
                  <Text className="mt-0.5 text-xs font-semibold text-foreground-muted" numberOfLines={1}>
                    {cobroEstado}
                  </Text>
                ) : null}
              </View>
              <Text className="text-xl font-black text-foreground">{cobro}</Text>
            </View>
          ) : null}

          {abordajeBloqueado ? (
            <View className="mt-3 rounded-2xl border border-amber-400/40 bg-amber-400/15 px-4 py-3">
              <Text className="text-sm font-bold text-foreground">Esperando validación del mostrador</Text>
              <Text className="mt-1 text-sm leading-5 text-foreground-muted">
                El pasajero validará su pase al llegar. Te avisaremos cuando puedas iniciar.
              </Text>
            </View>
          ) : null}

          {sinMostradorListo ? (
            <View className="mt-3 rounded-2xl border border-brand/40 bg-brand/15 px-4 py-3">
              <Text className="text-sm font-bold text-foreground">Listo para ir al punto de recojo</Text>
              <Text className="mt-1 text-sm leading-5 text-foreground-muted">
                Este traslado no requiere mostrador. Inicia cuando estés listo.
              </Text>
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
                disabled={nextAction.bloqueada}
                loading={submitting}
                onPress={() => submitAction(nextAction)}
              />
            ) : (
              <TouchButton label="Actualizar" tone="secondary" onPress={() => loadAssignment()} />
            )}
          </View>
          {puedeCancelar ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setCancelOpen(true)}
              className="mt-3 items-center py-1"
            >
              <Text className="text-sm font-semibold text-foreground-muted">
                No puedo continuar este viaje
              </Text>
            </Pressable>
          ) : null}
        </DraggableSheet>
      )}

      {/* F7: hoja de cancelación con motivo. El despacho reasigna otra unidad y el
          pasajero recibe la disculpa con su nueva unidad por el canal del chat. */}
      {cancelOpen ? (
        <View className="absolute inset-0 justify-end bg-black/60">
          <Pressable className="flex-1" onPress={() => setCancelOpen(false)} />
          <DraggableSheet
            cardClassName="rounded-t-3xl bg-surface px-5 pb-8 pt-5"
            onSwipeDown={() => setCancelOpen(false)}
            dragUpLimit={0}
            dragDownLimit={240}
          >
            <Text className="text-xl font-bold text-foreground">¿Por qué no puedes continuar?</Text>
            <Text className="mt-1 text-sm leading-5 text-foreground-muted">
              El despacho asignará otra unidad para cuidar el tiempo del pasajero.
            </Text>
            <View className="mt-4 gap-2">
              {MOTIVOS_CANCELACION.map((opcion) => {
                const activo = cancelMotivo === opcion.valor;
                return (
                  <Pressable
                    key={opcion.valor}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: activo }}
                    onPress={() => setCancelMotivo(opcion.valor)}
                    className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
                      activo ? 'border-brand bg-brand/10' : 'border-border bg-surface-muted'
                    }`}
                  >
                    <View
                      className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                        activo ? 'border-brand' : 'border-border'
                      }`}
                    >
                      {activo ? <View className="h-2.5 w-2.5 rounded-full bg-brand" /> : null}
                    </View>
                    <Text className="text-base font-semibold text-foreground">{opcion.etiqueta}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              className="mt-3 min-h-12 rounded-2xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground"
              placeholder="Cuéntanos brevemente (opcional)"
              placeholderTextColor="#71717A"
              value={cancelComentario}
              onChangeText={setCancelComentario}
              multiline
            />
            <View className="mt-4 gap-2">
              <TouchButton
                label="Confirmar cancelación"
                tone="danger"
                disabled={!cancelMotivo}
                loading={cancelSending}
                onPress={() => void submitCancel()}
              />
              <TouchButton label="Volver" tone="secondary" onPress={() => setCancelOpen(false)} />
            </View>
          </DraggableSheet>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  overviewSheetAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

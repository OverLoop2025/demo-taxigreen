import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { TouchButton } from '@/components/TouchButton';
import { getActiveDriverAssignment } from '@/features/assignment/client';
import type { DriverAssignment } from '@/features/assignment/types';
import { useAuth } from '@/features/auth/use-auth';
import { registerForPushNotifications, type PushRegistrationState } from '@/features/push';
import { useRealtime } from '@/features/realtime';

// Indicador humano de conexión (sin "Realtime"/"Push"): solo dice si recibe viajes.
function conexionViva(status: string) {
  return status === 'subscribed';
}

export default function HomeScreen() {
  const router = useRouter();
  const { conductor, session } = useAuth();
  const { status: realtimeStatus, lastAssignment, lastIncident } = useRealtime();
  const [onDuty, setOnDuty] = useState(true);
  const [, setPushState] = useState<PushRegistrationState>({ status: 'idle' });
  const [activeAssignment, setActiveAssignment] = useState<DriverAssignment | null>(null);
  const pushAttempted = useRef(false);

  useEffect(() => {
    if (!session?.token || pushAttempted.current) return;
    pushAttempted.current = true;
    registerForPushNotifications(session.token)
      .then(setPushState)
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'No se pudo registrar push.';
        setPushState({ status: 'error', message });
      });
  }, [session?.token]);

  // Carga de la asignación vigente: el conductor ve su viaje al abrir la app aunque
  // no haya un broadcast en curso (no depende del push). Se refresca también ante
  // cada broadcast (incluida una REASIGNACIÓN de unidad por el despacho) y al volver
  // a esta pantalla, para que la unidad mostrada sea siempre la del viaje vigente.
  const loadActiveAssignment = useCallback(() => {
    if (!session?.token) return () => undefined;
    let cancelled = false;
    getActiveDriverAssignment(session.token)
      .then((response) => {
        if (!cancelled) setActiveAssignment(response.asignacion);
      })
      .catch(() => {
        if (!cancelled) setActiveAssignment(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  useEffect(() => loadActiveAssignment(), [loadActiveAssignment, lastAssignment?.receivedAt]);

  useFocusEffect(loadActiveAssignment);

  const enLinea = conexionViva(realtimeStatus);
  // La verdad del servidor manda: el broadcast solo dispara el refetch (arriba).
  // Así un viaje cerrado nunca "revive" en el home por un aviso viejo.
  const assignmentReservaId = activeAssignment?.id ?? null;
  const passengerName = activeAssignment?.pasajero.nombre ?? null;
  // "Empezar" cuando el viaje recién llega (aún no inicia ruta); si el chofer ya
  // está dentro del flujo y volvió al inicio, la acción es retomar: "Abrir viaje".
  const viajeEnCurso =
    activeAssignment?.viaje?.estado === 'en_camino' ||
    activeAssignment?.viaje?.estado === 'en_punto' ||
    activeAssignment?.viaje?.estado === 'a_bordo';
  const ctaViaje = viajeEnCurso ? 'Abrir viaje' : 'Empezar';
  const tituloViaje = viajeEnCurso ? 'Viaje en curso' : 'Tienes un viaje';
  // Unidad COHERENTE: la del viaje vigente (la que eligió el despacho, que puede ser
  // una reasignación temporal) manda sobre la unidad predefinida del conductor.
  const unidadDelViaje = activeAssignment?.unidad ?? null;
  const vehicle = unidadDelViaje ?? conductor?.vehiculo ?? null;
  const unidadLabel = unidadDelViaje ? 'Unidad del viaje' : 'Tu unidad';
  // ¿La unidad del viaje difiere de la predefinida? Entonces es una reasignación.
  const unidadReasignada = Boolean(
    unidadDelViaje && conductor?.vehiculo && unidadDelViaje.id !== conductor.vehiculo.id,
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-10 pt-14">
      {/* Hero: saludo + turno */}
      <View className="rounded-3xl border border-border bg-surface px-5 py-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-foreground-muted">Conductor</Text>
          <View className="flex-row items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1">
            <View className={`h-2 w-2 rounded-full ${enLinea ? 'bg-brand-glow' : 'bg-amber-400'}`} />
            <Text className="text-xs font-bold text-brand-deep">{enLinea ? 'Activo' : 'Conectando'}</Text>
          </View>
        </View>
        <Text className="mt-1 text-2xl font-bold text-foreground">{conductor?.nombre ?? 'Conductor'}</Text>

        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-surface-muted px-4 py-3">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Tu estado</Text>
            <Text className="text-lg font-bold text-foreground">{onDuty ? 'Disponible' : 'En pausa'}</Text>
          </View>
          <Switch value={onDuty} onValueChange={setOnDuty} trackColor={{ false: '#9CA3AF', true: '#10B981' }} thumbColor="#FFFFFF" />
        </View>
      </View>

      {/* Unidad */}
      <View className="mt-4 flex-row items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand/15">
          <Ionicons name="car-sport" size={24} color="#10B981" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{unidadLabel}</Text>
            {unidadReasignada ? (
              <View className="rounded-full bg-brand/15 px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase tracking-wide text-brand-deep">Reasignada</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-xl font-bold text-foreground">{vehicle?.placa ?? 'Sin unidad'}</Text>
          <Text className="text-sm font-medium text-foreground-muted">
            {vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Solicita una unidad al despacho.'}
          </Text>
        </View>
      </View>

      {/* Viaje vigente — CTA protagonista */}
      {assignmentReservaId ? (
        <View className="mt-4 overflow-hidden rounded-3xl border border-border bg-surface">
          <View className="bg-brand px-5 py-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="navigate" size={18} color="#0A0A0B" />
              <Text className="text-base font-bold text-ink-900">{tituloViaje}</Text>
            </View>
          </View>
          <View className="px-5 py-5">
            <Text className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Pasajero</Text>
            <Text className="mt-1 text-xl font-bold text-foreground">{passengerName ?? 'Listo para revisar'}</Text>
            <TouchButton
              label={ctaViaje}
              className="mt-4"
              onPress={() =>
                router.push({
                  pathname: '/(auth)/asignacion/[id]',
                  params: { id: assignmentReservaId },
                })
              }
            />
          </View>
        </View>
      ) : (
        <View className="mt-4 items-center rounded-3xl border border-border bg-surface px-5 py-8">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-muted">
            <Ionicons name="time-outline" size={26} color="#9CA3AF" />
          </View>
          <Text className="mt-3 text-lg font-bold text-foreground">Sin viajes ahora</Text>
          <Text className="mt-1 text-center text-sm leading-5 text-foreground-muted">
            Mantente disponible. Te avisamos al instante cuando llegue tu próximo viaje.
          </Text>
        </View>
      )}

      {/* Objeto olvidado (soporte) */}
      {lastIncident ? (
        <Pressable
          className="mt-4 flex-row items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4"
          onPress={() =>
            router.push({
              pathname: '/(auth)/incidencia/[id]' as never,
              params: {
                id: lastIncident.incidenciaId,
                reservaId: lastIncident.reservaId,
                descripcion: lastIncident.descripcion,
              },
            })
          }
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/20">
            <Ionicons name="bag-handle-outline" size={22} color="#A855F7" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-purple-500">Objeto olvidado</Text>
            <Text className="text-sm text-foreground-muted" numberOfLines={1}>
              {lastIncident.descripcion}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

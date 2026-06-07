import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

  // Carga inicial de la asignación vigente: el conductor ve su viaje al abrir la
  // app aunque no haya un broadcast en curso (no depende del push).
  useEffect(() => {
    if (!session?.token) return;
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

  const vehicle = conductor?.vehiculo;
  const enLinea = conexionViva(realtimeStatus);
  // El broadcast en vivo manda; si no hay, mostramos la asignación cargada al abrir.
  const assignmentReservaId = lastAssignment?.reservaId ?? activeAssignment?.id ?? null;
  const passengerName = lastAssignment ? null : (activeAssignment?.pasajero.nombre ?? null);

  return (
    <ScrollView className="flex-1 bg-ink-900" contentContainerClassName="px-5 pb-10 pt-14">
      {/* Hero: saludo + turno */}
      <View className="rounded-3xl border border-ink-line bg-ink-800 px-5 py-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-zinc-400">Conductor</Text>
          <View className="flex-row items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1">
            <View className={`h-2 w-2 rounded-full ${enLinea ? 'bg-brand-glow' : 'bg-amber-400'}`} />
            <Text className="text-xs font-bold text-brand-glow">{enLinea ? 'En línea' : 'Conectando'}</Text>
          </View>
        </View>
        <Text className="mt-1 text-2xl font-bold text-white">{conductor?.nombre ?? 'Conductor'}</Text>

        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-ink-700 px-4 py-3">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Tu estado</Text>
            <Text className="text-lg font-bold text-white">{onDuty ? 'Disponible' : 'En pausa'}</Text>
          </View>
          <Switch value={onDuty} onValueChange={setOnDuty} trackColor={{ false: '#3F3F46', true: '#10B981' }} thumbColor="#FFFFFF" />
        </View>
      </View>

      {/* Unidad */}
      <View className="mt-4 flex-row items-center gap-4 rounded-2xl border border-ink-line bg-ink-800 px-5 py-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand/15">
          <Ionicons name="car-sport" size={24} color="#34D399" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Tu unidad</Text>
          <Text className="text-xl font-bold text-white">{vehicle?.placa ?? 'Sin unidad'}</Text>
          <Text className="text-sm font-medium text-zinc-400">
            {vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Solicita una unidad al despacho.'}
          </Text>
        </View>
      </View>

      {/* Viaje vigente — CTA protagonista */}
      {assignmentReservaId ? (
        <View className="mt-4 overflow-hidden rounded-3xl border border-ink-line bg-ink-800">
          <View className="bg-brand px-5 py-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="navigate" size={18} color="#0A0A0B" />
              <Text className="text-base font-bold text-ink-900">Tienes un viaje</Text>
            </View>
          </View>
          <View className="px-5 py-5">
            <Text className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Pasajero</Text>
            <Text className="mt-1 text-xl font-bold text-white">{passengerName ?? 'Listo para revisar'}</Text>
            <TouchButton
              label="Abrir viaje"
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
        <View className="mt-4 items-center rounded-3xl border border-ink-line bg-ink-800 px-5 py-8">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-ink-700">
            <Ionicons name="time-outline" size={26} color="#71717A" />
          </View>
          <Text className="mt-3 text-lg font-bold text-white">Sin viajes ahora</Text>
          <Text className="mt-1 text-center text-sm leading-5 text-zinc-400">
            Mantente disponible. Te avisamos al instante cuando llegue tu próximo viaje.
          </Text>
        </View>
      )}

      {/* Objeto olvidado (soporte) */}
      {lastIncident ? (
        <Pressable
          className="mt-4 flex-row items-center gap-3 rounded-2xl border border-ink-line bg-ink-800 px-5 py-4"
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
            <Ionicons name="bag-handle-outline" size={22} color="#C4B5FD" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-purple-300">Objeto olvidado</Text>
            <Text className="text-sm text-zinc-400" numberOfLines={1}>
              {lastIncident.descripcion}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71717A" />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

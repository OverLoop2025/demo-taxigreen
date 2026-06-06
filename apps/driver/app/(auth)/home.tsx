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
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-5 pb-10 pt-14">
      {/* Hero: saludo + turno */}
      <View className="rounded-3xl bg-product-deep px-5 py-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-white/70">Conductor</Text>
          <View className="flex-row items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <View className={`h-2 w-2 rounded-full ${enLinea ? 'bg-green-400' : 'bg-amber-400'}`} />
            <Text className="text-xs font-semibold text-white/85">{enLinea ? 'En línea' : 'Conectando'}</Text>
          </View>
        </View>
        <Text className="mt-1 text-2xl font-bold text-white">{conductor?.nombre ?? 'Conductor'}</Text>

        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wide text-white/60">Tu estado</Text>
            <Text className="text-lg font-bold text-white">{onDuty ? 'Disponible' : 'En pausa'}</Text>
          </View>
          <Switch value={onDuty} onValueChange={setOnDuty} trackColor={{ false: '#475569', true: '#22C55E' }} />
        </View>
      </View>

      {/* Unidad */}
      <View className="mt-4 flex-row items-center gap-4 rounded-2xl bg-white px-5 py-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-product/10">
          <Ionicons name="car-sport" size={24} color="#227FDE" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tu unidad</Text>
          <Text className="text-xl font-bold text-product-deep">{vehicle?.placa ?? 'Sin unidad'}</Text>
          <Text className="text-sm font-medium text-gray-500">
            {vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Solicita una unidad al despacho.'}
          </Text>
        </View>
      </View>

      {/* Viaje vigente — CTA protagonista */}
      {assignmentReservaId ? (
        <View className="mt-4 overflow-hidden rounded-3xl bg-white">
          <View className="bg-product px-5 py-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="navigate" size={18} color="#FFFFFF" />
              <Text className="text-base font-bold text-white">Tienes un viaje</Text>
            </View>
          </View>
          <View className="px-5 py-5">
            <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pasajero</Text>
            <Text className="mt-1 text-xl font-bold text-product-deep">
              {passengerName ?? 'Listo para revisar'}
            </Text>
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
        <View className="mt-4 items-center rounded-3xl bg-white px-5 py-8">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="time-outline" size={26} color="#94A3B8" />
          </View>
          <Text className="mt-3 text-lg font-bold text-product-deep">Sin viajes ahora</Text>
          <Text className="mt-1 text-center text-sm leading-5 text-gray-500">
            Mantente disponible. Te avisamos al instante cuando llegue tu próximo viaje.
          </Text>
        </View>
      )}

      {/* Objeto olvidado (soporte) */}
      {lastIncident ? (
        <Pressable
          className="mt-4 flex-row items-center gap-3 rounded-2xl bg-white px-5 py-4"
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
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-purple-100">
            <Ionicons name="bag-handle-outline" size={22} color="#6D28D9" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-purple-800">Objeto olvidado</Text>
            <Text className="text-sm text-gray-600" numberOfLines={1}>
              {lastIncident.descripcion}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { TouchButton } from '@/components/TouchButton';
import { getActiveDriverAssignment } from '@/features/assignment/client';
import type { DriverAssignment } from '@/features/assignment/types';
import { useAuth } from '@/features/auth/use-auth';
import { registerForPushNotifications, type PushRegistrationState } from '@/features/push';
import { useRealtime } from '@/features/realtime';

function realtimeLabel(status: string) {
  if (status === 'subscribed') return 'Realtime activo';
  if (status === 'connecting') return 'Conectando realtime';
  if (status === 'error') return 'Realtime con error';
  return 'Realtime sin configurar';
}

function pushLabel(state: PushRegistrationState) {
  if (state.status === 'registered') return 'Push registrado';
  if (state.status === 'skipped') {
    if (state.reason === 'device_required') return 'Push: requiere Android fisico';
    if (state.reason === 'missing_project_id') return 'Push: falta projectId Expo';
    return 'Push: permiso denegado';
  }
  // No es un fallo del flujo: el APK standalone no tiene credenciales FCM, así que
  // Expo no puede emitir token. Las asignaciones igual llegan por Realtime.
  if (state.status === 'error') return 'Push no provisionado';
  return 'Push pendiente';
}

// Cuando el push no quedó registrado, aclaramos que la entrega NO depende de él.
function pushHint(state: PushRegistrationState) {
  if (state.status === 'registered' || state.status === 'idle') return null;
  return 'Las asignaciones llegan por Realtime.';
}

export default function HomeScreen() {
  const router = useRouter();
  const { conductor, session } = useAuth();
  const { status: realtimeStatus, lastAssignment, lastIncident } = useRealtime();
  const [onDuty, setOnDuty] = useState(true);
  const [pushState, setPushState] = useState<PushRegistrationState>({ status: 'idle' });
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
  // app aunque no haya un broadcast Realtime en curso (no depende del push).
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
  // El broadcast en vivo manda; si no hay, mostramos la asignación cargada al abrir.
  const assignmentReservaId = lastAssignment?.reservaId ?? activeAssignment?.id ?? null;
  const assignmentNombre = lastAssignment ? null : activeAssignment?.pasajero.nombre ?? null;

  return (
    <ScrollView className="flex-1 bg-gray-100" contentContainerClassName="px-5 pb-8 pt-12">
      <View className="rounded-2xl bg-product-deep px-5 py-5">
        <Text className="text-base font-semibold text-white/70">Turno conductor</Text>
        <Text className="mt-1 text-3xl font-bold text-white">{conductor?.nombre ?? 'Conductor'}</Text>
        <View className="mt-4 flex-row items-center justify-between rounded-xl bg-white/10 px-4 py-4">
          <View>
            <Text className="text-sm font-semibold text-white/70">Estado</Text>
            <Text className="text-xl font-bold text-white">{onDuty ? 'Disponible' : 'En pausa'}</Text>
          </View>
          <Switch value={onDuty} onValueChange={setOnDuty} trackColor={{ false: '#6B7280', true: '#227FDE' }} />
        </View>
      </View>

      <View className="mt-4 rounded-2xl bg-white px-5 py-5">
        <Text className="text-xl font-bold text-product-deep">Unidad asignada</Text>
        <Text className="mt-2 text-3xl font-bold text-product">{vehicle?.placa ?? 'Sin unidad'}</Text>
        <Text className="mt-1 text-base font-semibold text-gray-600">
          {vehicle ? `${vehicle.marca} ${vehicle.modelo} · ${vehicle.tipo}` : 'Solicita asignación al despacho.'}
        </Text>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="min-h-20 flex-1 rounded-2xl bg-white px-4 py-4">
          <Text className="text-sm font-bold uppercase tracking-wide text-gray-500">Realtime</Text>
          <Text className="mt-1 text-base font-bold text-product-deep">{realtimeLabel(realtimeStatus)}</Text>
        </View>
        <View className="min-h-20 flex-1 rounded-2xl bg-white px-4 py-4">
          <Text className="text-sm font-bold uppercase tracking-wide text-gray-500">Push</Text>
          <Text className="mt-1 text-base font-bold text-product-deep">{pushLabel(pushState)}</Text>
          {pushHint(pushState) ? (
            <Text className="mt-1 text-xs leading-4 text-gray-500">{pushHint(pushState)}</Text>
          ) : null}
        </View>
      </View>

      <View className="mt-4 rounded-2xl bg-white px-5 py-5">
        <Text className="text-xl font-bold text-product-deep">Próxima asignación</Text>
        {assignmentReservaId ? (
          <>
            <Text className="mt-3 text-base font-semibold text-gray-500">
              {lastAssignment ? 'Reserva recibida' : 'Asignación vigente'}
            </Text>
            <Text className="mt-1 text-2xl font-bold text-product-deep">
              {assignmentNombre ?? assignmentReservaId.slice(0, 8)}
            </Text>
            <Text className="mt-1 text-base text-gray-600">Lista para revisar en la pantalla de asignación.</Text>
            <TouchButton
              label="Abrir asignación"
              className="mt-5"
              onPress={() =>
                router.push({
                  pathname: '/(auth)/asignacion/[id]',
                  params: { id: assignmentReservaId },
                })
              }
            />
          </>
        ) : (
          <>
            <Text className="mt-3 text-base leading-6 text-gray-600">
              Cuando despacho confirme una reserva para ti, aparecerá aquí sin que tengas que refrescar.
            </Text>
            <TouchButton label="Esperando despacho" tone="secondary" disabled className="mt-5" />
          </>
        )}
      </View>

      {lastIncident ? (
        <View className="mt-4 rounded-2xl bg-white px-5 py-5">
          <Text className="text-sm font-bold uppercase tracking-wide text-purple-700">Objeto olvidado</Text>
          <Text className="mt-2 text-xl font-bold text-product-deep">{lastIncident.descripcion}</Text>
          <Text className="mt-2 text-base text-gray-600">
            Caso recibido del viaje {lastIncident.reservaId.slice(0, 8)}.
          </Text>
          <TouchButton
            label="Responder incidencia"
            className="mt-5"
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
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

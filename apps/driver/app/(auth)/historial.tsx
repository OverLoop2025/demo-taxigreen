import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { getDriverTrips } from '@/features/assignment/client';
import { tripStatusLabel } from '@/features/assignment/transitions';
import type { DriverTripSummary } from '@/features/assignment/types';
import { useAuth } from '@/features/auth/use-auth';

function fechaHumana(value: string) {
  return new Date(value).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Etiqueta de cierre: terminado vs cancelado, para que el historial diga el desenlace.
function cierreLabel(trip: DriverTripSummary) {
  if (trip.estadoReserva === 'cancelada') return 'Cancelado';
  if (trip.estadoViaje === 'finalizado' || trip.estadoReserva === 'por_liquidar') return 'Terminado';
  if (trip.estadoReserva === 'finalizada') return 'Terminado';
  return tripStatusLabel(trip.estadoViaje);
}

function TripRoute({ trip }: { trip: DriverTripSummary }) {
  return (
    <View className="mt-3 gap-2">
      <View className="flex-row items-center gap-2">
        <View className="h-2.5 w-2.5 rounded-full bg-brand" />
        <Text className="flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>
          {trip.origenTexto}
        </Text>
      </View>
      <View className="ml-[4px] h-4 w-0.5 bg-border" />
      <View className="flex-row items-center gap-2">
        <Ionicons name="flag" size={12} color="#10B981" />
        <Text className="flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>
          {trip.destinoTexto}
        </Text>
      </View>
    </View>
  );
}

export default function HistorialScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [activos, setActivos] = useState<DriverTripSummary[]>([]);
  const [historial, setHistorial] = useState<DriverTripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!session?.token) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const response = await getDriverTrips(session.token);
        setActivos(response.activos);
        setHistorial(response.historial);
      } catch {
        setError('No se pudo cargar tu historial. Desliza para reintentar.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session?.token],
  );

  // Refresca al entrar a la pestaña: el cierre de un viaje lo mueve aquí al instante.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openTrip = (id: string) =>
    router.push({ pathname: '/(auth)/asignacion/[id]', params: { id } });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#10B981" size="large" />
        <Text className="mt-4 text-base font-bold text-foreground">Cargando tus viajes</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pb-10 pt-14"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load(true);
          }}
          tintColor="#10B981"
        />
      }
    >
      <Text className="text-2xl font-bold text-foreground">Tus viajes</Text>
      <Text className="mt-1 text-sm text-foreground-muted">Tu viaje en curso y los que ya cerraste.</Text>

      {error ? (
        <View className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-3">
          <Text className="text-sm font-semibold text-red-500">{error}</Text>
        </View>
      ) : null}

      {/* Viaje activo: destacado y accionable. */}
      {activos.length > 0 ? (
        <View className="mt-5">
          <Text className="text-xs font-bold uppercase tracking-wide text-foreground-muted">En curso</Text>
          {activos.map((trip) => (
            <Pressable
              key={trip.id}
              onPress={() => openTrip(trip.id)}
              className="mt-3 overflow-hidden rounded-3xl border border-brand/50 bg-surface"
            >
              <View className="flex-row items-center justify-between bg-brand px-5 py-3">
                <View className="flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-ink-900" />
                  <Text className="text-sm font-bold text-ink-900">{tripStatusLabel(trip.estadoViaje)}</Text>
                </View>
                <Text className="text-xs font-bold text-ink-900">Abrir ›</Text>
              </View>
              <View className="px-5 py-4">
                <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                  {trip.pasajeroNombre}
                </Text>
                <TripRoute trip={trip} />
                <Text className="mt-3 text-xs font-semibold text-foreground-muted">
                  {fechaHumana(trip.fechaHoraServicio)}
                  {trip.unidadEtiqueta ? ` · ${trip.unidadEtiqueta}` : ''}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Historial cerrado. */}
      <View className="mt-6">
        <Text className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Historial</Text>
        {historial.length === 0 ? (
          <View className="mt-3 items-center rounded-3xl border border-border bg-surface px-5 py-8">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-muted">
              <Ionicons name="time-outline" size={26} color="#9CA3AF" />
            </View>
            <Text className="mt-3 text-base font-bold text-foreground">Aún sin viajes cerrados</Text>
            <Text className="mt-1 text-center text-sm leading-5 text-foreground-muted">
              Cuando termines un servicio aparecerá aquí con sus detalles.
            </Text>
          </View>
        ) : (
          historial.map((trip) => (
            <Pressable
              key={trip.id}
              onPress={() => openTrip(trip.id)}
              className="mt-3 rounded-2xl border border-border bg-surface px-5 py-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                  {trip.pasajeroNombre}
                </Text>
                <View
                  className={`rounded-full px-3 py-1 ${
                    trip.estadoReserva === 'cancelada' ? 'bg-red-500/15' : 'bg-surface-muted'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      trip.estadoReserva === 'cancelada' ? 'text-red-500' : 'text-foreground-muted'
                    }`}
                  >
                    {cierreLabel(trip)}
                  </Text>
                </View>
              </View>
              <TripRoute trip={trip} />
              <Text className="mt-3 text-xs font-semibold text-foreground-muted">
                {fechaHumana(trip.finalizadoEn ?? trip.fechaHoraServicio)}
                {trip.unidadEtiqueta ? ` · ${trip.unidadEtiqueta}` : ''}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

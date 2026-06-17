import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AuthorCredit } from '@/components/AuthorCredit';
import { ThemeControl } from '@/components/ThemeControl';
import { TouchButton } from '@/components/TouchButton';
import { getActiveDriverAssignment } from '@/features/assignment/client';
import type { DriverAssignment } from '@/features/assignment/types';
import { useAuth } from '@/features/auth/use-auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { conductor, session, logout } = useAuth();
  const [activeAssignment, setActiveAssignment] = useState<DriverAssignment | null>(null);

  // La unidad NO es del conductor: la asigna el despacho y puede cambiar por viaje.
  // Mostramos la del viaje vigente (fresca) y, si no hay viaje, la habitual del login.
  useFocusEffect(
    useCallback(() => {
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
    }, [session?.token]),
  );

  const unidadDelViaje = activeAssignment?.unidad ?? null;
  const vehicle = unidadDelViaje ?? conductor?.vehiculo ?? null;
  const unidadTitulo = unidadDelViaje ? 'Unidad de tu viaje actual' : 'Unidad habitual';

  async function closeSession() {
    await logout();
    router.replace('/login');
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-8 pt-12">
      <View className="rounded-2xl border border-border bg-surface px-5 py-5">
        <Text className="text-sm font-bold uppercase tracking-wide text-foreground-muted">Conductor</Text>
        <Text className="mt-2 text-3xl font-bold text-foreground">{conductor?.nombre ?? 'Conductor'}</Text>
        <Text className="mt-1 text-base font-semibold text-foreground-muted">{conductor?.email}</Text>
      </View>

      <View className="mt-4 rounded-2xl border border-border bg-surface px-5 py-5">
        <Text className="text-xl font-bold text-foreground">Mi información</Text>
        <View className="mt-4 gap-3">
          <Text className="text-lg text-foreground">Licencia: {conductor?.licencia ?? 'Sin licencia'}</Text>
          <Text className="text-lg text-foreground">Calificación: {conductor?.rating.toFixed(1) ?? '0.0'}</Text>
          <Text className="text-lg text-foreground">Viajes: {conductor?.totalViajes ?? 0}</Text>
        </View>
      </View>

      {/* Unidad asignada por el despacho (no es propiedad del conductor). */}
      <View className="mt-4 rounded-2xl border border-border bg-surface px-5 py-5">
        <View className="flex-row items-center gap-2">
          <Ionicons name="car-sport-outline" size={18} color="#10B981" />
          <Text className="text-xs font-bold uppercase tracking-wide text-foreground-muted">{unidadTitulo}</Text>
        </View>
        {vehicle ? (
          <View className="mt-3">
            <Text className="text-2xl font-bold tracking-wider text-foreground">{vehicle.placa}</Text>
            <Text className="mt-1 text-base font-medium text-foreground-muted">
              {vehicle.marca} {vehicle.modelo}
            </Text>
          </View>
        ) : (
          <Text className="mt-3 text-base font-medium text-foreground-muted">Sin unidad asignada por ahora.</Text>
        )}
        <Text className="mt-3 text-sm leading-5 text-foreground-muted">
          El despacho te asigna la unidad y puede cambiarla según el viaje.
        </Text>
      </View>

      <View className="mt-4 rounded-2xl border border-border bg-surface px-5 py-5">
        <ThemeControl />
      </View>

      <TouchButton label="Cerrar sesión" tone="danger" className="mt-5" onPress={closeSession} />

      {/* Crédito de autoría discreto (espejo del de la web). */}
      <AuthorCredit className="mt-8" />
    </ScrollView>
  );
}

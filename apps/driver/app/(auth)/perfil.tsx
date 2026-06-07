import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { ThemeControl } from '@/components/ThemeControl';
import { TouchButton } from '@/components/TouchButton';
import { useAuth } from '@/features/auth/use-auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { conductor, logout } = useAuth();
  const vehicle = conductor?.vehiculo;

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
          <Text className="text-lg text-foreground">
            Unidad: {vehicle ? `${vehicle.placa} · ${vehicle.marca} ${vehicle.modelo}` : 'Sin unidad'}
          </Text>
        </View>
      </View>

      <View className="mt-4 rounded-2xl border border-border bg-surface px-5 py-5">
        <ThemeControl />
      </View>

      <TouchButton label="Cerrar sesión" tone="danger" className="mt-5" onPress={closeSession} />
    </ScrollView>
  );
}

import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
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
    <ScrollView className="flex-1 bg-gray-100" contentContainerClassName="px-5 pb-8 pt-12">
      <View className="rounded-2xl bg-white px-5 py-5">
        <Text className="text-sm font-bold uppercase tracking-wide text-gray-500">Conductor</Text>
        <Text className="mt-2 text-3xl font-bold text-product-deep">{conductor?.nombre ?? 'Conductor'}</Text>
        <Text className="mt-1 text-base font-semibold text-gray-600">{conductor?.email}</Text>
      </View>

      <View className="mt-4 rounded-2xl bg-white px-5 py-5">
        <Text className="text-xl font-bold text-product-deep">Datos operativos</Text>
        <View className="mt-4 gap-3">
          <Text className="text-lg text-gray-700">Licencia: {conductor?.licencia ?? 'Sin licencia'}</Text>
          <Text className="text-lg text-gray-700">Rating: {conductor?.rating.toFixed(2) ?? '0.00'}</Text>
          <Text className="text-lg text-gray-700">Viajes: {conductor?.totalViajes ?? 0}</Text>
          <Text className="text-lg text-gray-700">
            Unidad: {vehicle ? `${vehicle.placa} · ${vehicle.marca} ${vehicle.modelo}` : 'Sin unidad'}
          </Text>
        </View>
      </View>

      <TouchButton label="Cerrar sesión" tone="danger" className="mt-5" onPress={closeSession} />
    </ScrollView>
  );
}

import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/use-auth';
import { extractReservaId } from '@/features/push/use-notification-observer';

export default function Index() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'hydrating') return;
    let cancelled = false;

    const timeout = setTimeout(() => {
      void (async () => {
        if (status !== 'authenticated') {
          if (!cancelled) router.replace('/login');
          return;
        }

        // Cold-start desde un tap de push: abrir directo la asignación. Se decide
        // aquí (no en el observer) para evitar competir con este mismo redirect.
        const lastResponse = await Notifications.getLastNotificationResponseAsync().catch(() => null);
        const reservaId = lastResponse
          ? extractReservaId(lastResponse.notification.request.content.data)
          : null;
        if (cancelled) return;

        if (reservaId) {
          router.replace({ pathname: '/(auth)/asignacion/[id]', params: { id: reservaId } });
        } else {
          router.replace('/(auth)/home');
        }
      })();
    }, 650);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [router, status]);

  return (
    <View className="flex-1 items-center justify-center bg-product-deep px-6">
      <Text className="text-3xl font-bold text-white">Taxi Green</Text>
      <Text className="mt-2 text-lg font-semibold text-white/80">Conductor</Text>
      <ActivityIndicator className="mt-8" color="#FFFFFF" size="large" />
    </View>
  );
}

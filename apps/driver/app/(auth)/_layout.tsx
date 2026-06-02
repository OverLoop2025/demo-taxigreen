import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/features/auth/use-auth';

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === 'anonymous') {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#227FDE',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
        tabBarStyle: {
          minHeight: 68,
          paddingTop: 8,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="asignacion/[id]" options={{ href: null }} />
    </Tabs>
  );
}

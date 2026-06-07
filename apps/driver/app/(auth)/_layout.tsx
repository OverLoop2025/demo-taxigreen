import { Ionicons } from '@expo/vector-icons';
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
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#71717A',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', paddingBottom: 6 },
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          backgroundColor: '#0A0A0B',
          borderTopColor: '#1C1C20',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size ?? 22} color={color} />
          ),
        }}
      />
      {/* Pantallas a pantalla completa: sin barra de tabs (inmersión de navegación). */}
      <Tabs.Screen name="asignacion/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="incidencia/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}

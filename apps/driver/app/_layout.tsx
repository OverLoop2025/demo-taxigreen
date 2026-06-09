import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/features/auth/use-auth';
import { useNotificationObserver } from '@/features/push/use-notification-observer';
import { RealtimeProvider } from '@/features/realtime';
import { ThemeProvider, useThemePref } from '@/features/theme/theme-provider';

function AppShell() {
  useNotificationObserver();
  const dark = useThemePref().resolved === 'dark';
  return (
    <>
      {/* La barra de estado se adapta al modo (texto claro en oscuro y viceversa). */}
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RealtimeProvider>
          <AppShell />
        </RealtimeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

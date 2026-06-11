import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { AuthProvider } from '@/features/auth/use-auth';
import { useNotificationObserver } from '@/features/push/use-notification-observer';
import { RealtimeProvider } from '@/features/realtime';
import { ThemeProvider, useThemePref } from '@/features/theme/theme-provider';

// Solo afecta el toast de desarrollo: la carga de tiles puede abortarse de forma
// transitoria con la cámara en movimiento (sobre todo en emulador con GL por
// software) y RNMapbox lo reporta como error aunque el mapa se recupera solo.
LogBox.ignoreLogs([/Mapbox \[error\] RNMBXMapView/]);

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

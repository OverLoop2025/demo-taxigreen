import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/features/auth/use-auth';
import { useNotificationObserver } from '@/features/push/use-notification-observer';
import { RealtimeProvider } from '@/features/realtime';

function AppShell() {
  useNotificationObserver();
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <AppShell />
      </RealtimeProvider>
    </AuthProvider>
  );
}

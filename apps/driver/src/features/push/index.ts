import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiFetch } from '@/features/api/client';
import { env } from '@/lib/env';

export type PushRegistrationState =
  | { status: 'idle' }
  | { status: 'registered'; token: string }
  | { status: 'skipped'; reason: 'device_required' | 'permissions_denied' | 'missing_project_id' }
  | { status: 'error'; message: string };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function resolveProjectId() {
  const constants = Constants as typeof Constants & {
    easConfig?: { projectId?: string };
    expoConfig?: { extra?: { eas?: { projectId?: string } } };
  };

  return (
    env.EXPO_PUBLIC_EXPO_PROJECT_ID ??
    constants.easConfig?.projectId ??
    constants.expoConfig?.extra?.eas?.projectId ??
    null
  );
}

export async function registerForPushNotifications(authToken: string): Promise<PushRegistrationState> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('asignacion', {
      name: 'Asignaciones',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#227FDE',
      sound: 'default',
    });
  }

  if (!Device.isDevice) {
    return { status: 'skipped', reason: 'device_required' };
  }

  const permission = await Notifications.getPermissionsAsync();
  const finalPermission =
    permission.status === 'granted' ? permission : await Notifications.requestPermissionsAsync();

  if (finalPermission.status !== 'granted') {
    return { status: 'skipped', reason: 'permissions_denied' };
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    return { status: 'skipped', reason: 'missing_project_id' };
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await apiFetch('/api/conductor/fcm-token', {
      method: 'POST',
      token: authToken,
      body: { token, plataforma: 'expo' },
    });
    return { status: 'registered', token };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo registrar push.';
    return { status: 'error', message };
  }
}

import { prisma } from '@taxigreen/database';

type PushResult =
  | { ok: true; provider: 'expo'; ticket: unknown }
  | {
      ok: false;
      reason:
        | 'missing_token'
        | 'conductor_not_found'
        | 'fcm_not_configured'
        | 'expo_push_failed'
        | 'expo_push_timeout';
      detail?: string;
    };

function isExpoPushToken(token: string) {
  return /^(ExpoPushToken|ExponentPushToken)\[[^\]]+\]$/.test(token);
}

export async function sendConductorAssignmentPush({
  tenantId,
  reservaId,
  conductorId,
  vehiculoId,
}: {
  tenantId: string;
  reservaId: string;
  conductorId: string;
  vehiculoId: string | null;
}): Promise<PushResult> {
  const conductor = await prisma.conductores.findFirst({
    where: { id: conductorId, tenant_id: tenantId },
    select: {
      id: true,
      usuario: { select: { fcm_token: true } },
    },
  });

  if (!conductor) {
    return { ok: false, reason: 'conductor_not_found' };
  }

  const token = conductor.usuario.fcm_token;
  if (!token) {
    return { ok: false, reason: 'missing_token' };
  }

  if (!isExpoPushToken(token)) {
    return { ok: false, reason: 'fcm_not_configured' };
  }

  const reserva = await prisma.reservas.findFirst({
    where: { id: reservaId, tenant_id: tenantId },
    select: {
      voucher_codigo: true,
      pasajero_nombre: true,
      origen_texto: true,
      destino_texto: true,
    },
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'accept-encoding': 'gzip, deflate',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title: 'Nueva asignación Taxi Green',
        body: reserva
          ? `${reserva.voucher_codigo} · ${reserva.pasajero_nombre}`
          : 'Tienes una nueva reserva asignada.',
        data: {
          reservaId,
          conductorId,
          vehiculoId,
          screen: 'asignacion',
          origen: reserva?.origen_texto ?? null,
          destino: reserva?.destino_texto ?? null,
        },
        sound: 'default',
        channelId: 'asignacion',
        priority: 'high',
      }),
    });

    const ticket = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      return { ok: false, reason: 'expo_push_failed', detail: response.statusText };
    }
    return { ok: true, provider: 'expo', ticket };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'push error';
    return {
      ok: false,
      reason: message.toLowerCase().includes('abort') ? 'expo_push_timeout' : 'expo_push_failed',
      detail: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

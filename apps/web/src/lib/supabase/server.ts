import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

let adminClient: SupabaseClient | null = null;

type BroadcastPayload =
  | string
  | number
  | boolean
  | null
  | { [key: string]: BroadcastPayload }
  | BroadcastPayload[];

export function getSupabaseAdminClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  adminClient ??= createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}

export async function broadcastReservaAsignacion({
  reservaId,
  conductorId,
  vehiculoId,
}: {
  reservaId: string;
  conductorId: string | null;
  vehiculoId: string | null;
}) {
  return sendRealtimeBroadcast(`reserva-${reservaId}`, 'asignacion', {
    reserva_id: reservaId,
    conductor_id: conductorId,
    vehiculo_id: vehiculoId,
  });
}

export async function broadcastConductorAsignacion({
  reservaId,
  conductorId,
  vehiculoId,
}: {
  reservaId: string;
  conductorId: string;
  vehiculoId: string | null;
}) {
  return sendRealtimeBroadcast(`conductor-${conductorId}`, 'asignacion', {
    reserva_id: reservaId,
    conductor_id: conductorId,
    vehiculo_id: vehiculoId,
  });
}

export async function broadcastReservaEstado({
  reservaId,
  estadoReserva,
  estadoViaje,
  viajeId,
  conductorId,
}: {
  reservaId: string;
  estadoReserva: string;
  estadoViaje: string;
  viajeId: string;
  conductorId: string;
}) {
  return sendRealtimeBroadcast(`reserva-${reservaId}`, 'estado', {
    reserva_id: reservaId,
    viaje_id: viajeId,
    conductor_id: conductorId,
    estado_reserva: estadoReserva,
    estado_viaje: estadoViaje,
    ts: new Date().toISOString(),
  });
}

export async function broadcastReservaAbordaje({
  reservaId,
  counterValidadoEn,
}: {
  reservaId: string;
  counterValidadoEn: string;
}) {
  return sendRealtimeBroadcast(`reserva-${reservaId}`, 'abordaje', {
    reserva_id: reservaId,
    estado_abordaje: 'autorizado',
    counter_validado_en: counterValidadoEn,
  });
}

export async function broadcastConductorAbordaje({
  conductorId,
  reservaId,
  counterValidadoEn,
}: {
  conductorId: string;
  reservaId: string;
  counterValidadoEn: string;
}) {
  return sendRealtimeBroadcast(`conductor-${conductorId}`, 'abordaje', {
    conductor_id: conductorId,
    reserva_id: reservaId,
    estado_abordaje: 'autorizado',
    counter_validado_en: counterValidadoEn,
  });
}

export async function broadcastReservaIncidencia({
  reservaId,
  incidenciaId,
  estado,
  tipologia,
  descripcion,
}: {
  reservaId: string;
  incidenciaId: string;
  estado: string;
  tipologia: string;
  descripcion: string;
}) {
  return sendRealtimeBroadcast(`reserva-${reservaId}`, 'incidencia', {
    reserva_id: reservaId,
    incidencia_id: incidenciaId,
    estado,
    tipologia,
    descripcion,
    ts: new Date().toISOString(),
  });
}

export async function broadcastConductorIncidencia({
  conductorId,
  reservaId,
  incidenciaId,
  estado,
  tipologia,
  descripcion,
}: {
  conductorId: string;
  reservaId: string;
  incidenciaId: string;
  estado: string;
  tipologia: string;
  descripcion: string;
}) {
  return sendRealtimeBroadcast(`conductor-${conductorId}`, 'incidencia', {
    conductor_id: conductorId,
    reserva_id: reservaId,
    incidencia_id: incidenciaId,
    estado,
    tipologia,
    descripcion,
    ts: new Date().toISOString(),
  });
}

async function sendRealtimeBroadcast(
  channelName: string,
  event: string,
  payload: Record<string, BroadcastPayload>,
) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, reason: 'missing_supabase_admin' as const };
  }

  // Broadcast server-side sin suscripción previa: usamos `httpSend` (REST
  // explícito). `channel.send()` sin `subscribe` cae a un fallback REST que
  // supabase-js marca como deprecado y dejará de funcionar en el futuro; como
  // S6 (app conductor) dependerá de que este broadcast llegue, lo emitimos por
  // la vía soportada. Ref: RealtimeChannel.httpSend (>=2.37.0).
  const channel = supabase.channel(channelName);
  try {
    const result = await channel.httpSend(event, payload);
    return { ok: result.success, response: result };
  } catch (error) {
    // El broadcast es best-effort: si `httpSend` rechaza (red caída, Supabase
    // lento) NUNCA debe tumbar la mutación que ya escribió en DB. Sin este catch,
    // una excepción aquí hacía que p.ej. `POST /api/incidencias` devolviera 500
    // tras crear la incidencia → el pasajero reintentaba y se duplicaba el caso.
    const detail = error instanceof Error ? error.message : 'broadcast_error';
    return { ok: false, reason: 'broadcast_error' as const, detail };
  } finally {
    await supabase.removeChannel(channel).catch(() => undefined);
  }
}

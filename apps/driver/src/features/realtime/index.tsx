import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/use-auth';
import { getDriverSupabaseClient } from './client';
import type { AssignmentPayload } from './types';

type RealtimeStatus = 'disabled' | 'connecting' | 'subscribed' | 'error';

type RealtimeContextValue = {
  status: RealtimeStatus;
  lastAssignment: AssignmentPayload | null;
  clearLastAssignment: () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

function normalizePayload(payload: unknown): AssignmentPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const reservaId = record.reserva_id;
  const conductorId = record.conductor_id;
  const vehiculoId = record.vehiculo_id;

  if (typeof reservaId !== 'string') return null;
  return {
    reservaId,
    conductorId: typeof conductorId === 'string' ? conductorId : null,
    vehiculoId: typeof vehiculoId === 'string' ? vehiculoId : null,
    receivedAt: new Date().toISOString(),
  };
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [status, setStatus] = useState<RealtimeStatus>('disabled');
  const [lastAssignment, setLastAssignment] = useState<AssignmentPayload | null>(null);

  useEffect(() => {
    const conductorId = session?.conductor.conductorId;
    const supabase = getDriverSupabaseClient();
    if (!conductorId || !supabase) {
      setStatus('disabled');
      return;
    }

    setStatus('connecting');
    const channel = supabase
      .channel(`conductor-${conductorId}`)
      .on('broadcast', { event: 'asignacion' }, (event) => {
        const payload = normalizePayload(event.payload);
        if (payload) {
          setLastAssignment(payload);
        }
      })
      .subscribe((nextStatus) => {
        if (nextStatus === 'SUBSCRIBED') setStatus('subscribed');
        if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') setStatus('error');
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.conductor.conductorId]);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      status,
      lastAssignment,
      clearLastAssignment: () => setLastAssignment(null),
    }),
    [lastAssignment, status],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime debe usarse dentro de RealtimeProvider');
  }
  return context;
}

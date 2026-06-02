'use client';

import Link from 'next/link';
import { RefreshCw, Satellite, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AdminReservaRow } from '@/lib/admin/reservas';

type RealtimeStatus = 'connecting' | 'subscribed' | 'polling' | 'error';

function statusLabel(status: RealtimeStatus) {
  switch (status) {
    case 'subscribed':
      return 'Realtime activo';
    case 'polling':
      return 'Polling 10s';
    case 'error':
      return 'Realtime sin configurar';
    default:
      return 'Conectando';
  }
}

function statusClasses(status: RealtimeStatus) {
  if (status === 'subscribed') return 'border-success/30 bg-success/10 text-success';
  if (status === 'polling') return 'border-warning/30 bg-warning/10 text-warning';
  if (status === 'error') return 'border-danger/30 bg-danger/10 text-danger';
  return 'border-product/30 bg-product-muted text-product';
}

function estadoClasses(estado: string) {
  if (estado === 'asignada' || estado === 'confirmada') {
    return 'bg-success/10 text-success';
  }
  if (estado === 'necesita_revision' || estado === 'ingesta_pendiente') {
    return 'bg-warning/10 text-warning';
  }
  if (estado === 'cancelada') {
    return 'bg-danger/10 text-danger';
  }
  return 'bg-product-muted text-product-deep';
}

export function AdminReservasLive({
  initialReservas,
  tenantId,
}: {
  initialReservas: AdminReservaRow[];
  tenantId: string;
}) {
  const [reservas, setReservas] = useState(initialReservas);
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const loadingRef = useRef(false);

  async function refreshReservas() {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await fetch('/api/admin/reservas', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`No se pudo refrescar reservas (${response.status})`);
      }
      const data = (await response.json()) as { reservas: AdminReservaRow[] };
      setReservas(data.reservas);
      setLastSync(new Date());
    } catch {
      setStatus((current) => (current === 'subscribed' ? current : 'error'));
    } finally {
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    setReservas(initialReservas);
  }, [initialReservas]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

    if (!supabase) {
      setStatus('polling');
    } else {
      channel = supabase
        .channel(`reservas-${tenantId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reservas',
            filter: `tenant_id=eq.${tenantId}`,
          },
          () => {
            setStatus('subscribed');
            void refreshReservas();
          },
        )
        .subscribe((subscriptionStatus) => {
          if (subscriptionStatus === 'SUBSCRIBED') {
            setStatus('subscribed');
          }
          if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
            setStatus('polling');
          }
        });
    }

    const polling = window.setInterval(() => {
      void refreshReservas();
    }, 10_000);

    return () => {
      window.clearInterval(polling);
      if (channel) {
        void supabase?.removeChannel(channel);
      }
    };
  }, [tenantId]);

  const totals = useMemo(() => {
    const sinAsignar = reservas.filter((reserva) => !reserva.conductorId).length;
    const conVoucher = reservas.filter((reserva) => reserva.voucherEmitido).length;
    return { sinAsignar, conVoucher };
  }, [reservas]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-md bg-white px-3 py-2 text-neutral-600 ring-1 ring-border">
            {reservas.length} reservas
          </span>
          <span className="rounded-md bg-white px-3 py-2 text-neutral-600 ring-1 ring-border">
            {totals.sinAsignar} sin asignar
          </span>
          <span className="rounded-md bg-white px-3 py-2 text-neutral-600 ring-1 ring-border">
            {totals.conVoucher} con voucher
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${statusClasses(
              status,
            )}`}
          >
            {status === 'subscribed' ? <Satellite className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {statusLabel(status)}
          </span>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-xs font-medium text-product hover:bg-product-muted"
            onClick={() => void refreshReservas()}
            type="button"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sincronizar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-white">
        <div className="grid grid-cols-[1.1fr_1.1fr_1.5fr_1fr_1fr_0.8fr] gap-4 border-b border-border bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase text-neutral-500">
          <span>Reserva</span>
          <span>Pasajero</span>
          <span>Ruta</span>
          <span>Conductor</span>
          <span>Unidad</span>
          <span>Estado</span>
        </div>
        <div className="divide-y divide-border">
          {reservas.map((reserva) => (
            <Link
              className="grid grid-cols-[1.1fr_1.1fr_1.5fr_1fr_1fr_0.8fr] gap-4 px-4 py-3 text-sm transition hover:bg-product-muted/70"
              href={`/admin/reservas/${reserva.id}`}
              key={reserva.id}
            >
              <span className="min-w-0">
                <span className="block font-semibold text-product-deep">{reserva.voucherCodigo}</span>
                <span className="block text-xs text-neutral-500">
                  {reserva.fechaHoraServicioLabel}
                  {reserva.vueloCodigo ? ` · ${reserva.vueloCodigo}` : ''}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-neutral-900">{reserva.pasajeroNombre}</span>
                <span className="block truncate text-xs text-neutral-500">{reserva.pasajeroTelefono}</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-neutral-900">{reserva.origenTexto}</span>
                <span className="block truncate text-xs text-neutral-500">{reserva.destinoTexto}</span>
              </span>
              <span className="truncate text-neutral-700">{reserva.conductorNombre ?? 'Pendiente'}</span>
              <span className="truncate text-neutral-700">{reserva.vehiculoLabel ?? 'Pendiente'}</span>
              <span>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${estadoClasses(reserva.estado)}`}>
                  {reserva.estado.replaceAll('_', ' ')}
                </span>
              </span>
            </Link>
          ))}
          {reservas.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-500">
              Aún no hay reservas operativas para este tenant.
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        {lastSync ? `Última sincronización ${lastSync.toLocaleTimeString('es-PE')}` : 'Sincronización inicial lista'}
      </p>
    </section>
  );
}

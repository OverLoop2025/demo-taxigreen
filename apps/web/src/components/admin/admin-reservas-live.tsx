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
      return 'En vivo';
    case 'polling':
      return 'Actualizando';
    case 'error':
      return 'Conexión intermitente';
    default:
      return 'Conectando';
  }
}

function statusClasses(status: RealtimeStatus) {
  if (status === 'subscribed') return 'border-success/30 bg-success/10 text-success';
  if (status === 'polling') return 'border-warning/30 bg-warning/10 text-warning';
  if (status === 'error') return 'border-danger/30 bg-danger/10 text-danger';
  return 'border-product/30 bg-product-muted dark:bg-product-900/40 text-product';
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
  return 'bg-product-muted dark:bg-product-900/40 text-product-deep dark:text-product-200';
}

function estadoLabel(estado: string) {
  const labels: Record<string, string> = {
    ingesta_pendiente: 'Por revisar',
    necesita_revision: 'Necesita revisión',
    confirmada: 'Confirmada',
    asignada: 'Asignada',
    en_curso: 'En camino',
    por_liquidar: 'Cerrada',
    cancelada: 'Cancelada',
  };
  return labels[estado] ?? estado.replaceAll('_', ' ');
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
    const sinAsignar = reservas.filter((reserva) => !reserva.conductorId && !reserva.cancelada).length;
    const enCurso = reservas.filter((reserva) => reserva.estado === 'en_curso').length;
    const necesitanUnidad = reservas.filter((reserva) => reserva.necesitaNuevaUnidad);
    return { sinAsignar, enCurso, necesitanUnidad };
  }, [reservas]);

  return (
    <section className="space-y-4">
      {/* Resumen en tarjetas: tres números que importan, nada más. */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { valor: reservas.length, etiqueta: 'Servicios' },
          { valor: totals.sinAsignar, etiqueta: 'Por asignar' },
          { valor: totals.enCurso, etiqueta: 'En curso' },
        ].map((stat) => (
          <div className="rounded-2xl border border-border bg-surface px-4 py-3" key={stat.etiqueta}>
            <p className="text-2xl font-bold text-foreground">{stat.valor}</p>
            <p className="text-xs font-medium text-foreground-muted">{stat.etiqueta}</p>
          </div>
        ))}
      </div>

      {/* F7: bandeja prioritaria — un conductor canceló y el pasajero espera unidad. */}
      {totals.necesitanUnidad.length > 0 ? (
        <div className="rounded-2xl border border-amber-400/50 bg-amber-50 p-4 dark:bg-amber-400/10">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
            {totals.necesitanUnidad.length === 1
              ? 'Un servicio necesita nueva unidad'
              : `${totals.necesitanUnidad.length} servicios necesitan nueva unidad`}
          </p>
          <div className="mt-2 grid gap-2">
            {totals.necesitanUnidad.map((reserva) => (
              <Link
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm shadow-sm transition hover:bg-surface-muted"
                href={`/admin/reservas/${reserva.id}`}
                key={`urgente-${reserva.id}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">
                    {reserva.pasajeroNombre} · {reserva.voucherCodigo}
                  </span>
                  <span className="block truncate text-xs text-foreground-muted">
                    El conductor no pudo continuar. {reserva.fechaHoraServicioLabel}
                  </span>
                </span>
                <span className="shrink-0 rounded-lg bg-product px-3 py-1.5 text-xs font-bold text-white">
                  Asignar unidad
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${statusClasses(
            status,
          )}`}
        >
          {status === 'subscribed' ? <Satellite className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {statusLabel(status)}
        </span>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-medium text-product hover:bg-surface-muted"
          onClick={() => void refreshReservas()}
          type="button"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      {/* Tarjetas por servicio: lo humano primero (quién viaja, a dónde, con quién). */}
      <div className="grid gap-3 lg:grid-cols-2">
        {reservas.map((reserva) => (
          <Link
            className={`rounded-2xl border bg-surface p-4 transition hover:border-product/60 hover:shadow-md ${
              reserva.necesitaNuevaUnidad ? 'border-amber-400/60' : 'border-border'
            } ${reserva.cancelada ? 'opacity-70' : ''}`}
            href={`/admin/reservas/${reserva.id}`}
            key={reserva.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">{reserva.pasajeroNombre}</p>
                <p className="truncate text-xs text-foreground-muted">
                  {reserva.voucherCodigo} · {reserva.fechaHoraServicioLabel}
                  {reserva.vueloCodigo ? ` · ${reserva.vueloCodigo}` : ''}
                </p>
              </div>
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${estadoClasses(reserva.estado)}`}>
                {estadoLabel(reserva.estado)}
              </span>
            </div>

            <p className="mt-3 truncate text-sm text-foreground">{reserva.origenTexto}</p>
            <p className="truncate text-sm text-foreground-muted">→ {reserva.destinoTexto}</p>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2">
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {reserva.conductorNombre
                  ? `${reserva.conductorNombre}${reserva.vehiculoLabel ? ` · ${reserva.vehiculoLabel}` : ''}`
                  : reserva.necesitaNuevaUnidad
                    ? 'Necesita nueva unidad'
                    : 'Unidad por asignar'}
              </span>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {reserva.pago ? reserva.pago.montoEtiqueta : ''}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  reserva.abordaje.requiereMostrador
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300'
                    : 'bg-success/10 text-success'
                }`}
              >
                {reserva.abordaje.requiereMostrador ? 'Mostrador' : 'Sin mostrador'}
              </span>
              <span className="inline-flex rounded-full bg-product/10 px-2 py-0.5 text-[11px] font-semibold text-product">
                {reserva.comercial.resumen}
              </span>
              {reserva.cancelada ? (
                <span className="inline-flex rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
                  {reserva.cancelada.por === 'pasajero' ? 'Canceló el pasajero' : 'Cancelada'}
                  {reserva.cancelada.motivo ? ` · ${reserva.cancelada.motivo}` : ''}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
        {reservas.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-4 py-10 text-center text-sm text-foreground-muted lg:col-span-2">
            Aún no hay servicios para esta empresa.
          </div>
        ) : null}
      </div>

      <p className="text-xs text-foreground-muted">
        {lastSync ? `Actualizado ${lastSync.toLocaleTimeString('es-PE')}` : 'Lista actualizada'}
      </p>
    </section>
  );
}

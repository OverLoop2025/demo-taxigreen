'use client';

import { CheckCircle2, Clock, MapPin, PackageSearch, Phone, Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PublicIncidentData } from '@/lib/incidencias';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  initialIncident: PublicIncidentData;
  token: string | null;
};

function actionLabel(action: unknown) {
  if (typeof action !== 'string') return 'Actualización';
  if (action === 'reporte_objeto_olvidado') return 'Reporte recibido';
  if (action === 'objeto_encontrado') return 'Conductor encontró el objeto';
  if (action === 'objeto_no_visto') return 'Conductor no lo vio';
  if (action === 'objeto_revisar') return 'Conductor revisará la unidad';
  if (action === 'incidencia_cerrada_pasajero') return 'Caso cerrado';
  if (action === 'incidencia_reabierta_pasajero') return 'Caso escalado';
  return action.replaceAll('_', ' ');
}

function hasDriverFound(timeline: unknown[]) {
  return timeline.some((item) => {
    if (!item || typeof item !== 'object') return false;
    const action = (item as Record<string, unknown>).action;
    return action === 'objeto_encontrado';
  });
}

function caseStatusLabel(estado: string) {
  if (estado === 'abierta') return 'Abierta';
  if (estado === 'en_resolucion') return 'Objeto encontrado';
  if (estado === 'escalada') return 'Escalada a operador';
  if (estado === 'cerrada' || estado === 'resuelta') return 'Cerrada';
  return estado.replaceAll('_', ' ');
}

async function fetchIncident(id: string) {
  const response = await fetch(`/api/incidencias/${id}`, { cache: 'no-store' });
  if (!response.ok) return null;
  return (await response.json()) as PublicIncidentData;
}

export function BienestarCasoClient({ initialIncident, token }: Props) {
  const [incident, setIncident] = useState(initialIncident);
  const [status, setStatus] = useState<string | null>(null);
  const canChooseDelivery = Boolean(token && hasDriverFound(incident.timeline) && incident.estado !== 'cerrada');
  const channelName = useMemo(() => `reserva-${incident.reservaId}`, [incident.reservaId]);

  const refresh = useCallback(async () => {
    const next = await fetchIncident(initialIncident.id);
    if (next) setIncident(next);
  }, [initialIncident.id]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'incidencia' }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const closeCase = async (opcion: 'hotel_hoy' | 'oficina_manana', resuelto = true) => {
    if (!token) return;
    setStatus('Actualizando caso...');
    const response = await fetch(`/api/incidencias/${incident.id}/cerrar`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token_pasajero: token,
        opcion_entrega: opcion,
        resuelto,
      }),
    });
    if (!response.ok) {
      setStatus('No se pudo actualizar el caso.');
      return;
    }
    setStatus(resuelto ? 'Caso cerrado con opción de entrega.' : 'Caso escalado al operador.');
    await refresh();
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto min-h-screen w-full max-w-xl px-4 py-5">
        <div className="rounded-md bg-care px-5 py-5 text-white">
          <span className="rounded bg-white/15 px-2 py-1 text-xs font-semibold">Taxi Green · Bienestar</span>
          <h1 className="mt-4 text-2xl font-semibold leading-tight">Objeto olvidado</h1>
          <p className="mt-2 text-sm text-white/75">
            Caso {incident.id.slice(0, 8)} · {caseStatusLabel(incident.estado)}
          </p>
        </div>

        <div className="mt-4 grid gap-4">
          <section className="rounded-md border border-border bg-surface p-4">
            <div className="flex gap-3">
              <PackageSearch className="mt-1 h-5 w-5 text-care" />
              <div>
                <p className="text-xs font-semibold uppercase text-foreground-muted">Descripción</p>
                <h2 className="mt-1 text-lg font-semibold text-product-deep dark:text-product-200">{incident.descripcion}</h2>
                <p className="mt-2 text-sm text-foreground-muted">
                  Reserva {incident.voucherCodigo} · {incident.severidad}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-product" />
              <h2 className="text-base font-semibold text-product-deep dark:text-product-200">Viaje relacionado</h2>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-foreground-muted">
              <p>{incident.ruta.origen}</p>
              <p className="font-semibold text-product-deep dark:text-product-200">{incident.ruta.puntoEncuentro}</p>
              <p>{incident.ruta.destino}</p>
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-foreground-muted">Conductor</p>
                <h2 className="mt-1 text-lg font-semibold text-product-deep dark:text-product-200">{incident.conductor.nombre}</h2>
                <p className="mt-1 text-sm text-foreground-muted">{incident.conductor.unidad ?? 'Unidad asignada'}</p>
              </div>
              {incident.conductor.telefono ? (
                <a
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-product text-white"
                  href={`tel:${incident.conductor.telefono.replace(/[^\d+]/g, '')}`}
                >
                  <Phone className="h-5 w-5" />
                </a>
              ) : null}
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-product" />
              <h2 className="text-base font-semibold text-product-deep dark:text-product-200">Timeline</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {incident.timeline.map((item, index) => {
                const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
                return (
                  <div className="rounded-md bg-surface-muted p-3" key={`${index}-${String(record.action)}`}>
                    <p className="text-sm font-semibold text-product-deep dark:text-product-200">{actionLabel(record.action)}</p>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {typeof record.actor === 'string' ? record.actor : 'sistema'} ·{' '}
                      {typeof record.ts === 'string' ? record.ts : incident.updatedAt}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {canChooseDelivery ? (
            <section className="rounded-md border border-success/30 bg-surface p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h2 className="text-base font-semibold text-product-deep dark:text-product-200">Objeto encontrado</h2>
              </div>
              <div className="mt-4 grid gap-2">
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-product px-4 text-sm font-semibold text-white"
                  type="button"
                  onClick={() => closeCase('hotel_hoy')}
                >
                  Entregar en recepción del hotel hoy
                </button>
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-product bg-surface px-4 text-sm font-semibold text-product"
                  type="button"
                  onClick={() => closeCase('oficina_manana')}
                >
                  Recoger en oficina Taxi Green mañana
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-danger bg-surface px-4 text-sm font-semibold text-danger"
                  type="button"
                  onClick={() => closeCase('oficina_manana', false)}
                >
                  <Send className="h-4 w-4" />
                  Necesito ayuda de un operador
                </button>
              </div>
            </section>
          ) : null}

          {status ? <p className="text-sm font-medium text-foreground-muted">{status}</p> : null}
        </div>
      </section>
    </main>
  );
}

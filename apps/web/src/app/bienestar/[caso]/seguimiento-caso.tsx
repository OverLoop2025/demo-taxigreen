'use client';

import { Building2, Car, CheckCircle2, Clock, MapPin, PackageSearch, Phone, Send, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthorCredit } from '@/components/brand/author-credit';
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
  if (estado === 'abierta') return 'En revisión';
  if (estado === 'en_resolucion') return 'Objeto encontrado';
  if (estado === 'escalada') return 'Con un operador';
  if (estado === 'cerrada' || estado === 'resuelta') return 'Resuelto';
  return estado.replaceAll('_', ' ');
}

// Frase tranquilizadora según el estado del caso (lenguaje humano, no técnico).
function caseHeadline(estado: string, encontrado: boolean) {
  if (estado === 'cerrada' || estado === 'resuelta') return '¡Listo! Tu objeto está a salvo';
  if (encontrado || estado === 'en_resolucion') return '¡Buenas noticias! Encontramos tu objeto';
  if (estado === 'escalada') return 'Un operador está cuidando tu caso';
  return 'Estamos buscando tu objeto';
}

const PASOS_CASO = ['Reportado', 'En revisión', 'Encontrado', 'Entrega'] as const;

function pasoActual(estado: string, encontrado: boolean) {
  if (estado === 'cerrada' || estado === 'resuelta') return 3;
  if (encontrado || estado === 'en_resolucion') return 2;
  return 1; // abierta/escalada → el conductor ya fue avisado
}

// Fecha/hora amable (es-PE). Acepta ISO o cualquier string ya formateado.
function fmtFecha(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return value;
  return new Date(value).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actorLabel(actor: unknown) {
  if (actor === 'pasajero') return 'Tú';
  if (actor === 'conductor') return 'Conductor';
  if (actor === 'operador' || actor === 'usuario') return 'Taxi Green';
  return 'Taxi Green';
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

  const encontrado = hasDriverFound(incident.timeline);
  const paso = pasoActual(incident.estado, encontrado);
  const cerrado = incident.estado === 'cerrada' || incident.estado === 'resuelta';
  const objeto = incident.descripcion.replace(/^Olvidé en el vehículo:\s*/iu, '').replace(/\.$/u, '');

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Hero tranquilizador */}
      <header className="relative isolate overflow-hidden bg-care px-5 pb-7 pt-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(40rem_24rem_at_90%_-20%,rgba(255,255,255,0.22),transparent)]" />
        <div className="relative mx-auto w-full max-w-xl">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> Taxi Green · Bienestar
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              {caseStatusLabel(incident.estado)}
            </span>
          </div>
          <div className="mt-5 flex items-start gap-3">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              {cerrado ? <CheckCircle2 className="h-6 w-6" /> : <PackageSearch className="h-6 w-6" />}
            </span>
            <div>
              <h1 className="text-2xl font-bold leading-tight">{caseHeadline(incident.estado, encontrado)}</h1>
              <p className="mt-1 text-sm text-white/80">
                Cuidamos {objeto ? <span className="font-semibold text-white">{objeto}</span> : 'tu objeto'} de tu viaje. Aquí ves el avance en vivo.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-xl flex-1 px-5 py-5">
        {/* Stepper de progreso */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            {PASOS_CASO.map((label, i) => {
              const done = i <= paso;
              const current = i === paso && !cerrado;
              return (
                <div className="flex flex-1 flex-col items-center text-center" key={label}>
                  <div className="flex w-full items-center">
                    <span className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : done ? 'bg-care' : 'bg-border'}`} />
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        done ? 'bg-care text-white' : 'bg-surface-muted text-foreground-muted'
                      } ${current ? 'ring-4 ring-care/20' : ''}`}
                    >
                      {i < paso || cerrado ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className={`h-0.5 flex-1 ${i === PASOS_CASO.length - 1 ? 'opacity-0' : i < paso ? 'bg-care' : 'bg-border'}`} />
                  </div>
                  <span className={`mt-1.5 text-[11px] font-medium ${done ? 'text-foreground' : 'text-foreground-muted'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          {/* Qué olvidaste */}
          <section className="rounded-2xl border border-care/20 bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-care/15 text-care">
                <PackageSearch className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Lo que buscamos</p>
                <h2 className="mt-0.5 text-lg font-bold text-foreground">{objeto || incident.descripcion}</h2>
              </div>
            </div>
            <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-xs text-foreground-muted">
              Reserva <span className="font-semibold text-foreground">{incident.voucherCodigo}</span> · Caso #{incident.id.slice(0, 8)}
            </p>
          </section>

          {/* Quién te ayuda */}
          <section className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Quién te ayuda</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-product/10 text-product">
                  <Car className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-foreground">{incident.conductor.nombre}</h2>
                  <p className="text-sm text-foreground-muted">{incident.conductor.unidad ?? 'Tu conductor del viaje'}</p>
                </div>
              </div>
              {incident.conductor.telefono ? (
                <a
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-product px-4 text-sm font-semibold text-white"
                  href={`tel:${incident.conductor.telefono.replace(/[^\d+]/g, '')}`}
                >
                  <Phone className="h-4 w-4" /> Llamar
                </a>
              ) : null}
            </div>
            <div className="mt-3 grid gap-1 rounded-xl bg-surface-muted px-3 py-2.5 text-sm text-foreground-muted">
              <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-product" /> {incident.ruta.origen}</p>
              <p className="flex items-center gap-2 font-medium text-foreground"><MapPin className="h-3.5 w-3.5 text-product" /> {incident.ruta.destino}</p>
            </div>
          </section>

          {/* Opciones de entrega cuando el objeto fue encontrado */}
          {canChooseDelivery ? (
            <section className="rounded-2xl border border-success/30 bg-success/10 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h2 className="text-base font-bold text-foreground">¿Cómo te lo entregamos?</h2>
              </div>
              <p className="mt-1 text-sm text-foreground-muted">Elige la opción más cómoda para ti. Sin costo adicional.</p>
              <div className="mt-3 grid gap-2">
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-product px-4 text-sm font-semibold text-white transition active:scale-[0.99]"
                  onClick={() => closeCase('hotel_hoy')}
                  type="button"
                >
                  <Building2 className="h-4 w-4" /> En la recepción de mi hotel hoy
                </button>
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-product bg-surface px-4 text-sm font-semibold text-product transition active:scale-[0.99]"
                  onClick={() => closeCase('oficina_manana')}
                  type="button"
                >
                  <MapPin className="h-4 w-4" /> Recoger en la oficina Taxi Green mañana
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground-muted"
                  onClick={() => closeCase('oficina_manana', false)}
                  type="button"
                >
                  <Send className="h-4 w-4" /> Prefiero hablar con un operador
                </button>
              </div>
            </section>
          ) : null}

          {/* Avance del caso */}
          <section className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-product" />
              <h2 className="text-base font-bold text-foreground">Avance del caso</h2>
            </div>
            <ol className="mt-4 grid gap-0">
              {incident.timeline.map((item, index) => {
                const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
                const ultimo = index === incident.timeline.length - 1;
                return (
                  <li className="flex gap-3" key={`${index}-${String(record.action)}`}>
                    <div className="flex flex-col items-center">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${ultimo ? 'bg-care ring-4 ring-care/15' : 'bg-product'}`} />
                      {!ultimo ? <span className="w-px flex-1 bg-border" /> : null}
                    </div>
                    <div className={ultimo ? 'pb-0' : 'pb-4'}>
                      <p className="text-sm font-semibold text-foreground">{actionLabel(record.action)}</p>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        {actorLabel(record.actor)} · {fmtFecha(record.ts, fmtFecha(incident.updatedAt, 'Hace un momento'))}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {status ? <p className="text-sm font-medium text-foreground-muted">{status}</p> : null}

          {/* Reaseguro */}
          <div className="flex items-center justify-center gap-2 rounded-xl bg-surface-muted px-4 py-3 text-center text-xs text-foreground-muted">
            <ShieldCheck className="h-4 w-4 shrink-0 text-care" />
            Guardamos tu objeto con cuidado. Te avisamos por WhatsApp ante cualquier novedad.
          </div>

          <AuthorCredit className="text-center" />
        </div>
      </section>
    </main>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { BadgeCheck, CarFront, RotateCcw, Sparkles } from 'lucide-react';
import type { SugerenciaAsignacion } from '@taxigreen/asignacion';
import { aceptarSugerenciaAsignacion, registrarOverrideSugerencia } from './actions';

type ActionResult = {
  ok: boolean;
  message: string;
};

type ServerAction = (formData: FormData) => Promise<ActionResult>;

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function turnoLabel(minutes: number | null) {
  if (minutes === null) return 'turno por confirmar';
  if (minutes < 60) return `${minutes} min en turno`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} h ${rest} min en turno`;
}

function recommendationReason(sugerencia: SugerenciaAsignacion) {
  const factores = sugerencia.factores;
  const capacidad = `${factores.capacidadUnidad} espacios para ${factores.pasajerosRequeridos} personas`;
  return `Está listo para salir: lleva ${turnoLabel(factores.minutosEnCola)}, está a ${factores.distanciaKm.toFixed(
    1,
  )} km del punto y la unidad encaja con el viaje (${capacidad}).`;
}

export function SugerenciaCard({ sugerencia }: { sugerencia: SugerenciaAsignacion | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  if (!sugerencia) {
    return (
      <section className="rounded-md border border-border bg-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-product" />
          <h2 className="text-base font-semibold text-product-deep dark:text-product-200">Conductor sugerido</h2>
        </div>
        <p className="text-sm text-foreground-muted">
          Aún no hay una opción clara. Puedes elegir conductor y unidad manualmente.
        </p>
      </section>
    );
  }

  function runAction(event: FormEvent<HTMLFormElement>, action: ServerAction) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const nextResult = await action(formData);
      setResult(nextResult);
      router.refresh();
    });
  }

  const factores = sugerencia.factores;
  const factorRows = [
    {
      label: 'Turno',
      value: factores.ordenCola === null ? 'Por confirmar' : `#${factores.ordenCola} · ${turnoLabel(factores.minutosEnCola)}`,
    },
    { label: 'Distancia', value: `${factores.distanciaKm.toFixed(1)} km` },
    { label: 'Encaja', value: pct(factores.matchScore) },
    {
      label: 'Personas',
      value: `${factores.capacidadUnidad}/${factores.pasajerosRequeridos}`,
    },
  ];

  return (
    <section className="rounded-md border border-product/20 bg-surface p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-product" />
          <div>
            <h2 className="text-base font-semibold text-product-deep dark:text-product-200">Conductor sugerido</h2>
            <p className="text-xs text-foreground-muted">El operador confirma la salida.</p>
          </div>
        </div>
        <span className="inline-flex h-7 items-center rounded-md border border-product/20 bg-product-muted px-2 text-xs font-semibold text-product-deep dark:bg-product-900/40 dark:text-product-200">
          Modo seguro
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-product text-sm font-bold text-white">
            {initials(sugerencia.conductor.nombre)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-product-deep dark:text-product-200">
              {sugerencia.conductor.nombre}
            </p>
            <p className="text-xs text-foreground-muted">
              Calificación {sugerencia.conductor.rating.toFixed(1)} · {sugerencia.conductor.totalViajes} viajes
            </p>
          </div>
        </div>
        <div className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
          <div className="flex items-center gap-2 font-semibold text-product-deep dark:text-product-200">
            <CarFront className="h-4 w-4 text-product" />
            {sugerencia.vehiculo.placa}
          </div>
          <p className="mt-0.5 text-xs text-foreground-muted">
            {sugerencia.vehiculo.marca} {sugerencia.vehiculo.modelo} · {sugerencia.vehiculo.tipo}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-product-muted dark:bg-product-900/40 px-3 py-3">
        <p className="text-sm leading-6 text-product-deep dark:text-product-200">{recommendationReason(sugerencia)}</p>
      </div>

      <details className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-xs text-foreground-muted">
        <summary className="cursor-pointer font-semibold text-foreground">Ver motivos</summary>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {factorRows.map((row) => (
            <div className="rounded-md bg-surface-muted px-3 py-2" key={row.label}>
              <span className="block font-semibold uppercase text-foreground-muted">{row.label}</span>
              <span className="mt-1 block text-sm font-semibold text-product-deep dark:text-product-200">{row.value}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 leading-5">
          Prioriza el turno del conductor, la distancia al punto y que la unidad tenga espacio suficiente para el
          viaje. Prioridad interna: {sugerencia.score}/100.
        </p>
      </details>

      {result ? (
        <div
          className={`mt-4 rounded-md border px-3 py-2 ${
            result.ok ? 'border-success/30 bg-success/10' : 'border-danger/30 bg-danger/10'
          }`}
          role="status"
        >
          <p className={`text-sm font-medium ${result.ok ? 'text-success' : 'text-danger'}`}>
            {result.message}
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <form onSubmit={(event) => runAction(event, aceptarSugerenciaAsignacion)}>
          <input name="reserva_id" type="hidden" value={sugerencia.reservaId} />
          <input name="conductor_id" type="hidden" value={sugerencia.conductor.id} />
          <input name="vehiculo_id" type="hidden" value={sugerencia.vehiculo.id} />
          <input name="fuente" type="hidden" value={sugerencia.fuente} />
          <input name="motivo" type="hidden" value={sugerencia.motivo ?? ''} />
          <input name="modelo" type="hidden" value={sugerencia.modelo ?? ''} />
          <input name="razon" type="hidden" value={sugerencia.razon} />
          <input name="score" type="hidden" value={sugerencia.score} />
          <input name="factores_json" type="hidden" value={JSON.stringify(sugerencia.factores)} />
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-product px-4 text-sm font-semibold text-white hover:bg-product-deep disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            <BadgeCheck className="h-4 w-4" />
            Confirmar recomendación
          </button>
        </form>

        <form onSubmit={(event) => runAction(event, registrarOverrideSugerencia)}>
          <input name="reserva_id" type="hidden" value={sugerencia.reservaId} />
          <input name="razon_original_sugerida" type="hidden" value={sugerencia.razon} />
          <input name="fuente_original" type="hidden" value={sugerencia.fuente} />
          <input name="score_original" type="hidden" value={sugerencia.score} />
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-product px-4 text-sm font-semibold text-product hover:bg-surface-muted disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            <RotateCcw className="h-4 w-4" />
            Elegir otro
          </button>
        </form>
      </div>
    </section>
  );
}

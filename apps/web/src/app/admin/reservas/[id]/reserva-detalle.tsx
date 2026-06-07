'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { AlertTriangle, Car, CheckCircle2, UserRound } from 'lucide-react';
import type { SugerenciaAsignacion } from '@taxigreen/asignacion';
import type {
  AdminConductorOption,
  AdminReservaDetalle,
  AdminVehiculoOption,
} from '@/lib/admin/reservas';
import { asignarConductor, asignarVehiculo, marcarExcepcion } from './actions';
import { SugerenciaCard } from './sugerencia-card';

function queueLabel(minutes: number | null) {
  if (minutes === null) return 'Turno por confirmar';
  if (minutes < 60) return `${minutes} min en turno`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} h ${rest} min en turno`;
}

function conductorOptionLabel(conductor: AdminConductorOption) {
  return `${conductor.nombre} · Calificación ${conductor.rating.toFixed(1)} · ${conductor.totalViajes} viajes · ${queueLabel(
    conductor.minutosEnCola,
  )}`;
}

function resultText(result: { ok: boolean; message: string } | null) {
  if (!result) return null;
  return (
    <p className={`text-sm font-medium ${result.ok ? 'text-success' : 'text-danger'}`}>
      {result.message}
    </p>
  );
}

export function ReservaDetalleActions({
  conductores,
  reserva,
  sugerencia,
  vehiculos,
}: {
  conductores: AdminConductorOption[];
  reserva: AdminReservaDetalle;
  sugerencia: SugerenciaAsignacion | null;
  vehiculos: AdminVehiculoOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);

  function runAction(
    event: FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<{ ok: boolean; message: string }>,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      setState(result);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {reserva.estado === 'necesita_revision' || reserva.estado === 'ingesta_pendiente' || sugerencia ? (
        <SugerenciaCard sugerencia={sugerencia} />
      ) : null}

      {state ? (
        <div
          className={`rounded-md border px-4 py-3 ${
            state.ok
              ? 'border-success/30 bg-success/10'
              : 'border-danger/30 bg-danger/10'
          }`}
          role="status"
        >
          {resultText(state)}
        </div>
      ) : null}
      <form
        className="rounded-md border border-border bg-surface p-5"
        onSubmit={(event) => runAction(event, asignarConductor)}
      >
        <input name="reserva_id" type="hidden" value={reserva.id} />
        <div className="mb-4 flex items-center gap-2">
          <UserRound className="h-4 w-4 text-product" />
          <h2 className="text-base font-semibold text-product-deep dark:text-product-200">Elegir conductor</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground-muted">Conductor</span>
            <select
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-product focus:ring-2 focus:ring-product-muted"
              defaultValue={reserva.conductorId ?? conductores[0]?.id ?? ''}
              name="conductor_id"
            >
              {conductores.map((conductor) => (
                <option key={conductor.id} value={conductor.id}>
                  {conductorOptionLabel(conductor)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground-muted">Unidad</span>
            <select
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-product focus:ring-2 focus:ring-product-muted"
              defaultValue={reserva.vehiculoId ?? vehiculos[0]?.id ?? ''}
              name="vehiculo_id"
            >
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.id} value={vehiculo.id}>
                  {vehiculo.placa} · {vehiculo.marca} {vehiculo.modelo} · {vehiculo.tipo} · {vehiculo.capacidad} personas
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-2 text-xs text-foreground-muted lg:grid-cols-2">
          {conductores.slice(0, 3).map((conductor, index) => (
            <div className="rounded-md bg-surface-muted px-3 py-2" key={conductor.id}>
              Turno #{index + 1} · {conductor.nombre} · {queueLabel(conductor.minutosEnCola)}
              {conductor.vehiculoActual ? ` · ${conductor.vehiculoActual}` : ''}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-product px-4 text-sm font-semibold text-white hover:bg-product-deep disabled:opacity-60"
            disabled={isPending || conductores.length === 0 || vehiculos.length === 0}
            type="submit"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirmar conductor y unidad
          </button>
        </div>
      </form>

      <form
        className="rounded-md border border-border bg-surface p-5"
        onSubmit={(event) => runAction(event, asignarVehiculo)}
      >
        <input name="reserva_id" type="hidden" value={reserva.id} />
        <div className="mb-4 flex items-center gap-2">
          <Car className="h-4 w-4 text-product" />
          <h2 className="text-base font-semibold text-product-deep dark:text-product-200">Cambiar unidad</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            className="h-10 flex-1 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-product focus:ring-2 focus:ring-product-muted"
            defaultValue={reserva.vehiculoId ?? vehiculos[0]?.id ?? ''}
            name="vehiculo_id"
          >
            {vehiculos.map((vehiculo) => (
              <option key={vehiculo.id} value={vehiculo.id}>
                {vehiculo.placa} · {vehiculo.marca} {vehiculo.modelo} · {vehiculo.capacidad} personas
              </option>
            ))}
          </select>
          <button
            className="h-10 rounded-md border border-product px-4 text-sm font-semibold text-product hover:bg-surface-muted disabled:opacity-60"
            disabled={isPending || !reserva.conductorId || vehiculos.length === 0}
            type="submit"
          >
            Actualizar
          </button>
        </div>
      </form>

      <form
        className="rounded-md border border-warning/30 bg-warning/5 p-5"
        onSubmit={(event) => runAction(event, marcarExcepcion)}
      >
        <input name="reserva_id" type="hidden" value={reserva.id} />
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h2 className="text-base font-semibold text-product-deep dark:text-product-200">Necesita revisión</h2>
        </div>
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-warning focus:ring-2 focus:ring-warning/20"
          name="motivo"
          placeholder="Ej. Vuelo retrasado, pasajero pidió cambiar unidad, falta dato de contacto."
        />
        <button
          className="mt-3 h-10 rounded-md bg-warning px-4 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          Marcar para revisión
        </button>
      </form>
    </div>
  );
}

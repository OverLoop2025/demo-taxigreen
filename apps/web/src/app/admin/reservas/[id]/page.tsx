import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { sugerirAsignacionConRazonamiento } from '@taxigreen/ia';
import { BrandHeader } from '@/components/brand-header';
import {
  getConductoresActivos,
  getReservaDetalle,
  getVehiculosTenant,
} from '@/lib/admin/reservas';
import { requireRole } from '@/lib/auth';
import { ReservaDetalleActions } from './reserva-detalle';

export const dynamic = 'force-dynamic';

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-neutral-500">{label}</dt>
      <dd className="mt-1 text-sm text-neutral-900">{value || '—'}</dd>
    </div>
  );
}

function estadoClasses(estado: string) {
  if (estado === 'asignada' || estado === 'confirmada') return 'bg-success/10 text-success';
  if (estado === 'necesita_revision' || estado === 'ingesta_pendiente') return 'bg-warning/10 text-warning';
  if (estado === 'cancelada') return 'bg-danger/10 text-danger';
  return 'bg-product-muted text-product-deep';
}

function reservaAdmiteSugerencia(estado: string) {
  return estado === 'necesita_revision' || estado === 'ingesta_pendiente' || estado === 'confirmada';
}

async function getSugerenciaSegura(reservaId: string, tenantId: string) {
  try {
    return await sugerirAsignacionConRazonamiento(reservaId, {
      tenantId,
      logger: (event) => {
        console.info('[asignacion]', event);
      },
    });
  } catch (error) {
    console.warn('[asignacion] No se pudo calcular sugerencia', error);
    return null;
  }
}

export default async function AdminReservaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(['admin_tenant', 'despachador']);
  const tenantId = session.user.tenantId;
  if (!tenantId) notFound();

  const { id } = await params;
  const reserva = await getReservaDetalle(tenantId, id);
  if (!reserva) notFound();

  const debeSugerir = reservaAdmiteSugerencia(reserva.estado);
  const [conductores, vehiculos, sugerencia] = await Promise.all([
    getConductoresActivos(tenantId, reserva.conductorId),
    getVehiculosTenant(tenantId),
    debeSugerir ? getSugerenciaSegura(id, tenantId) : Promise.resolve(null),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <BrandHeader />
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-product">/admin/reservas</p>
            <h1 className="mt-1 text-2xl font-semibold text-product-deep">
              Reserva {reserva.voucherCodigo}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {reserva.tipoViaje.replaceAll('_', ' ')} · {reserva.canalOrigen.replaceAll('_', ' ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-product hover:bg-product-muted" href="/admin">
              Volver al despacho
            </Link>
            <Link className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-product hover:bg-product-muted" href={`/p/${reserva.tokenPasajero}`}>
              Link pasajero
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-md border border-border bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-product-deep">Datos operativos</h2>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${estadoClasses(reserva.estado)}`}>
                  {reserva.estado.replaceAll('_', ' ')}
                </span>
              </div>
              <dl className="grid gap-5 md:grid-cols-2">
                <Field label="Pasajero" value={reserva.pasajeroNombre} />
                <Field label="Teléfono pasajero" value={reserva.pasajeroTelefono} />
                <Field label="Email" value={reserva.pasajeroEmail} />
                <Field label="DNI/RUC" value={reserva.pasajeroDni ?? reserva.pasajeroRuc} />
                <Field label="Solicitante" value={reserva.solicitanteNombre ?? reserva.hotelNombre} />
                <Field label="Contacto solicitante" value={reserva.solicitanteContacto} />
                <Field label="Origen físico" value={reserva.origenTexto} />
                <Field label="Punto de encuentro" value={reserva.puntoEncuentro} />
                <Field label="Destino" value={reserva.destinoTexto} />
                <Field label="Vuelo" value={reserva.vueloCodigo} />
                <Field label="Fecha/hora" value={reserva.fechaHoraServicioLabel} />
                <Field label="Voucher" value={reserva.voucherCodigo} />
              </dl>
            </section>

            <section className="rounded-md border border-border bg-white p-5">
              <h2 className="mb-4 text-base font-semibold text-product-deep">Asignación vigente</h2>
              <dl className="grid gap-5 md:grid-cols-2">
                <Field label="Conductor" value={reserva.conductorNombre ?? 'Pendiente'} />
                <Field
                  label="Rating / viajes"
                  value={
                    reserva.conductorRating
                      ? `${reserva.conductorRating.toFixed(2)} · ${reserva.conductorViajes ?? 0} viajes`
                      : 'Pendiente'
                  }
                />
                <Field label="Unidad" value={reserva.vehiculoLabel ?? 'Pendiente'} />
                <Field label="Comprobante" value={reserva.comprobanteLabel ?? 'Pendiente'} />
              </dl>
            </section>

            <section className="rounded-md border border-border bg-white p-5">
              <h2 className="mb-4 text-base font-semibold text-product-deep">Auditoría relacionada</h2>
              <div className="divide-y divide-border">
                {reserva.auditoria.map((event) => (
                  <div className="grid gap-2 py-3 text-sm md:grid-cols-[0.9fr_1fr_2fr]" key={event.id}>
                    <span className="text-neutral-500">{event.ts}</span>
                    <span className="font-medium text-product-deep">{event.action}</span>
                    <code className="overflow-hidden text-ellipsis rounded bg-neutral-50 px-2 py-1 text-xs text-neutral-700">
                      {event.payload}
                    </code>
                  </div>
                ))}
                {reserva.auditoria.length === 0 ? (
                  <p className="py-6 text-sm text-neutral-500">Sin eventos auditados todavía.</p>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <ReservaDetalleActions
              conductores={conductores}
              reserva={reserva}
              sugerencia={sugerencia}
              vehiculos={vehiculos}
            />

            <section className="rounded-md border border-border bg-white p-5">
              <h2 className="mb-4 text-base font-semibold text-product-deep">Viaje e incidencias</h2>
              <div className="space-y-3 text-sm">
                {reserva.viajes.map((viaje) => (
                  <div className="rounded-md bg-neutral-50 px-3 py-2" key={viaje.id}>
                    <span className="font-medium text-neutral-900">{viaje.estado}</span>
                    <span className="block text-xs text-neutral-500">Actualizado {viaje.updatedAt}</span>
                  </div>
                ))}
                {reserva.incidencias.map((incidencia) => (
                  <div className="rounded-md bg-care-soft px-3 py-2" key={incidencia.id}>
                    <span className="font-medium text-care">{incidencia.tipologia}</span>
                    <span className="block text-xs text-neutral-700">
                      {incidencia.estado} · {incidencia.descripcion}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

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
      <dt className="text-xs font-semibold uppercase text-foreground-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value || '—'}</dd>
    </div>
  );
}

function estadoClasses(estado: string) {
  if (estado === 'asignada' || estado === 'confirmada') return 'bg-success/10 text-success';
  if (estado === 'necesita_revision' || estado === 'ingesta_pendiente') return 'bg-warning/10 text-warning';
  if (estado === 'cancelada') return 'bg-danger/10 text-danger';
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

function tipoViajeLabel(value: string) {
  const labels: Record<string, string> = {
    recojo_aeropuerto: 'Recojo en aeropuerto',
    ida_aeropuerto: 'Traslado al aeropuerto',
    city: 'Servicio en ciudad',
  };
  return labels[value] ?? value.replaceAll('_', ' ');
}

function canalLabel(value: string) {
  const labels: Record<string, string> = {
    whatsapp: 'WhatsApp',
    whatsapp_oficial: 'WhatsApp oficial',
    counter: 'Counter',
    web: 'Web',
  };
  return labels[value] ?? value.replaceAll('_', ' ');
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    reserva_ingesta_whatsapp_creada: 'Reserva creada por WhatsApp',
    reserva_asignada: 'Conductor asignado',
    reserva_sugerencia_override: 'Operador eligió otra opción',
    login_admin: 'Ingreso de operador',
    voucher_qr_emitido: 'QR preparado',
    voucher_qr_verificado: 'QR validado',
    voucher_qr_rechazado: 'QR rechazado',
    comprobante_pdf_generado: 'Comprobante generado',
    reniec_lookup: 'Documento consultado',
  };
  return labels[action] ?? action.replaceAll('_', ' ');
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
            <p className="text-sm font-medium text-product">Detalle del servicio</p>
            <h1 className="mt-1 text-2xl font-semibold text-product-deep dark:text-product-200">
              Reserva {reserva.voucherCodigo}
            </h1>
            <p className="mt-2 text-sm text-foreground-muted">
              {tipoViajeLabel(reserva.tipoViaje)} · {canalLabel(reserva.canalOrigen)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-product hover:bg-surface-muted" href="/admin">
              Volver al despacho
            </Link>
            <Link className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-product hover:bg-surface-muted" href={`/p/${reserva.tokenPasajero}`}>
              Ver seguimiento
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-md border border-border bg-surface p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-product-deep dark:text-product-200">Resumen del servicio</h2>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${estadoClasses(reserva.estado)}`}>
                  {estadoLabel(reserva.estado)}
                </span>
              </div>
              <dl className="grid gap-5 md:grid-cols-2">
                <Field label="Pasajero" value={reserva.pasajeroNombre} />
                <Field label="Teléfono pasajero" value={reserva.pasajeroTelefono} />
                <Field label="Correo" value={reserva.pasajeroEmail} />
                <Field label="Documento" value={reserva.pasajeroDni ?? reserva.pasajeroRuc} />
                <Field label="Solicitante" value={reserva.solicitanteNombre ?? reserva.hotelNombre} />
                <Field label="Contacto solicitante" value={reserva.solicitanteContacto} />
                <Field label="Recojo" value={reserva.origenTexto} />
                <Field label="Punto de encuentro" value={reserva.puntoEncuentro} />
                <Field label="Destino" value={reserva.destinoTexto} />
                <Field label="Vuelo" value={reserva.vueloCodigo} />
                <Field label="Hora de servicio" value={reserva.fechaHoraServicioLabel} />
                <Field label="Código" value={reserva.voucherCodigo} />
              </dl>
            </section>

            <section className="rounded-md border border-border bg-surface p-5">
              <h2 className="mb-4 text-base font-semibold text-product-deep dark:text-product-200">Conductor asignado</h2>
              <dl className="grid gap-5 md:grid-cols-2">
                <Field label="Conductor" value={reserva.conductorNombre ?? 'Pendiente'} />
                <Field
                  label="Calificación"
                  value={
                    reserva.conductorRating
                      ? `${reserva.conductorRating.toFixed(1)} · ${reserva.conductorViajes ?? 0} viajes`
                      : 'Pendiente'
                  }
                />
                <Field label="Unidad" value={reserva.vehiculoLabel ?? 'Pendiente'} />
                <Field label="Comprobante" value={reserva.comprobanteLabel ?? 'Pendiente'} />
              </dl>
            </section>

            <section className="rounded-md border border-border bg-surface p-5">
              <h2 className="mb-4 text-base font-semibold text-product-deep dark:text-product-200">Actividad reciente</h2>
              <div className="divide-y divide-border">
                {reserva.auditoria.map((event) => (
                  <div className="flex items-baseline justify-between gap-3 py-3 text-sm" key={event.id}>
                    <span className="font-medium text-product-deep dark:text-product-200">{actionLabel(event.action)}</span>
                    <span className="shrink-0 text-foreground-muted">{event.ts}</span>
                  </div>
                ))}
                {reserva.auditoria.length === 0 ? (
                  <p className="py-6 text-sm text-foreground-muted">Sin actividad todavía.</p>
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

            <section className="rounded-md border border-border bg-surface p-5">
              <h2 className="mb-4 text-base font-semibold text-product-deep dark:text-product-200">Estado del viaje</h2>
              <div className="space-y-3 text-sm">
                {reserva.viajes.map((viaje) => (
                  <div className="rounded-md bg-surface-muted px-3 py-2" key={viaje.id}>
                    <span className="font-medium text-foreground">{estadoLabel(viaje.estado)}</span>
                    <span className="block text-xs text-foreground-muted">Actualizado {viaje.updatedAt}</span>
                  </div>
                ))}
                {reserva.incidencias.map((incidencia) => (
                  <div className="rounded-md bg-care-soft px-3 py-2" key={incidencia.id}>
                    <span className="font-medium text-care">{incidencia.tipologia.replaceAll('_', ' ')}</span>
                    <span className="block text-xs text-foreground-muted">
                      {estadoLabel(incidencia.estado)} · {incidencia.descripcion}
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

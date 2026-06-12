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
    pendiente: 'Pendiente',
    emitido: 'Emitido',
    anulado: 'Anulado',
  };
  return labels[estado] ?? estado.replaceAll('_', ' ');
}

function tipoViajeLabel(value: string) {
  const labels: Record<string, string> = {
    recojo_aeropuerto: 'Recojo en aeropuerto',
    traslado_aeropuerto: 'Traslado al aeropuerto',
    city: 'Servicio en ciudad',
  };
  return labels[value] ?? value.replaceAll('_', ' ');
}

function canalLabel(value: string) {
  const labels: Record<string, string> = {
    whatsapp: 'WhatsApp',
    whatsapp_oficial: 'WhatsApp oficial',
    counter: 'Mostrador',
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
    voucher_qr_emitido: 'Pase preparado',
    voucher_qr_verificado: 'Pase validado',
    voucher_qr_rechazado: 'Pase rechazado',
    voucher_qr_consumido: 'Pase usado en mostrador',
    abordaje_autorizado: 'Luz verde enviada',
    pago_demo_autorizado: 'Pago autorizado',
    pago_demo_cerrado: 'Pago cerrado',
    comprobante_preparado: 'Comprobante listo',
    comprobante_pasajero_preparado: 'Datos de comprobante actualizados',
    comprobante_pdf_generado: 'Comprobante generado',
    driver_estado_viaje_actualizado: 'Conductor actualizó el viaje',
    driver_inicio_bloqueado_counter: 'Inicio bloqueado por mostrador',
    vehiculo_asignado: 'Unidad actualizada',
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
  const accesoLabel = reserva.abordaje.requiereMostrador
    ? reserva.abordaje.autorizado
      ? 'Requiere mostrador · pase validado'
      : 'Requiere mostrador'
    : 'Sin mostrador';
  const accesoDetalle = !reserva.abordaje.requiereMostrador
    ? 'El conductor puede iniciar directo hacia el punto de recojo.'
    : reserva.abordaje.autorizado
      ? reserva.abordaje.counterValidadoEn
        ? `Validado ${new Date(reserva.abordaje.counterValidadoEn).toLocaleString('es-PE', {
            timeZone: 'America/Lima',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}`
        : 'Validado en aeropuerto'
      : 'El conductor verá el viaje, pero no podrá iniciar hasta la validación del mostrador.';
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
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
              <span>{tipoViajeLabel(reserva.tipoViaje)} · {canalLabel(reserva.canalOrigen)}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  reserva.abordaje.requiereMostrador
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-success/10 text-success'
                }`}
              >
                {reserva.abordaje.requiereMostrador ? 'Requiere mostrador' : 'Sin mostrador'}
              </span>
              <span className="rounded-full bg-product-muted px-3 py-1 text-xs font-semibold text-product-deep">
                {reserva.comercial.resumen}
              </span>
            </div>
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

        {reserva.necesitaNuevaUnidad ? (
          <div className="mb-6 rounded-2xl border border-amber-400/60 bg-amber-50 px-5 py-4 dark:bg-amber-400/10">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              El conductor no pudo continuar este servicio
            </p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              El pasajero sigue esperando: asigna una nueva unidad abajo y el aviso le llegará por su canal.
            </p>
          </div>
        ) : null}

        {reserva.cancelada ? (
          <div className="mb-6 rounded-2xl border border-danger/40 bg-danger/5 px-5 py-4">
            <p className="text-sm font-bold text-danger">
              {reserva.cancelada.por === 'pasajero' ? 'El pasajero canceló esta reserva' : 'Reserva cancelada'}
            </p>
            {reserva.cancelada.motivo ? (
              <p className="mt-1 text-sm text-foreground-muted">Motivo: {reserva.cancelada.motivo}</p>
            ) : null}
          </div>
        ) : null}

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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-product-deep dark:text-product-200">Cliente</h2>
                {reserva.comercial.convenioValidadoDemo ? (
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                    Convenio demo validado
                  </span>
                ) : null}
              </div>
              <dl className="grid gap-5 md:grid-cols-2">
                <Field label="Identidad comercial" value={reserva.comercial.resumen} />
                <Field label="Responsable de pago" value={reserva.comercial.pagoMostrador} />
                <Field label="Personas" value={reserva.comercial.pasajerosCantidad?.toString() ?? 'Pendiente'} />
                <Field label="Equipaje" value={reserva.comercial.equipajeNivel ?? 'Pendiente'} />
                <Field label="Vehículo preferido" value={reserva.comercial.vehiculoPreferencia ?? 'Mejor disponible'} />
                <Field label="Factura" value={reserva.comercial.requiereFactura ? 'Sí requiere factura' : 'No solicitada'} />
              </dl>
            </section>

            <section className="rounded-md border border-border bg-surface p-5">
              <h2 className="mb-4 text-base font-semibold text-product-deep dark:text-product-200">Pago y comprobante</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {reserva.pago ? (
                  <>
                    <div className="rounded-md bg-product-muted p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-product">Tarifa</p>
                      <p className="mt-1 text-2xl font-semibold text-product-deep dark:text-product-200">
                        {reserva.pago.montoEtiqueta}
                      </p>
                    </div>
                    <div className="rounded-md bg-surface-muted p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Pago</p>
                      <p className="mt-1 text-base font-semibold text-foreground">{reserva.pago.estadoLabel}</p>
                      <p className="mt-1 text-sm text-foreground-muted">{reserva.pago.metodoLabel}</p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-md bg-surface-muted p-4 md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Pago</p>
                    <p className="mt-1 text-sm text-foreground-muted">Esta reserva aún no tiene pago registrado.</p>
                  </div>
                )}
                <div className="rounded-md bg-surface-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Comprobante</p>
                  {reserva.comprobante ? (
                    <>
                      <p className="mt-1 text-base font-semibold text-foreground">{reserva.comprobante.label}</p>
                      <p className="mt-1 text-sm text-foreground-muted">
                        {reserva.comprobante.montoEtiqueta} · {estadoLabel(reserva.comprobante.estado)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-foreground-muted">
                      Se prepara automáticamente al finalizar el viaje.
                    </p>
                  )}
                </div>
              </div>
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
                <Field label="Comprobante" value={reserva.comprobanteLabel ?? 'Se prepara al cierre'} />
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

            <section className="rounded-md border border-border bg-surface p-5">
              <h2 className="mb-4 text-base font-semibold text-product-deep dark:text-product-200">Acceso del pasajero</h2>
              <div className="rounded-md bg-surface-muted p-4">
                <p className="text-sm font-semibold text-foreground">{accesoLabel}</p>
                <p className="mt-1 text-sm leading-5 text-foreground-muted">{accesoDetalle}</p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

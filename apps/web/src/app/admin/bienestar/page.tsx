import Link from 'next/link';
import { BrandHeader } from '@/components/brand-header';
import { requireRole } from '@/lib/auth';
import { prisma } from '@taxigreen/database';

export const dynamic = 'force-dynamic';

function statusClass(estado: string) {
  if (estado === 'abierta') return 'bg-warning/10 text-warning';
  if (estado === 'en_resolucion') return 'bg-care-soft text-care';
  if (estado === 'escalada') return 'bg-danger/10 text-danger';
  return 'bg-surface-muted text-foreground-muted';
}

function statusLabel(estado: string) {
  const labels: Record<string, string> = {
    abierta: 'Nuevo caso',
    en_resolucion: 'En atención',
    escalada: 'Prioridad alta',
    cerrada: 'Cerrado',
    resuelta: 'Resuelto',
  };
  return labels[estado] ?? estado.replaceAll('_', ' ');
}

function tipoLabel(value: string) {
  const labels: Record<string, string> = {
    objeto_olvidado: 'Objeto olvidado',
  };
  return labels[value] ?? value.replaceAll('_', ' ');
}

function severidadLabel(value: string) {
  const labels: Record<string, string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    critica: 'Crítica',
  };
  return labels[value] ?? value;
}

export default async function AdminBienestarPage() {
  const session = await requireRole(['admin_tenant', 'despachador']);
  const tenantId = session.user.tenantId;
  const incidencias = tenantId
    ? await prisma.incidencias.findMany({
        where: {
          tenant_id: tenantId,
          deleted_at: null,
          estado: {
            notIn: ['cerrada', 'resuelta'],
          },
        },
        orderBy: [{ severidad: 'desc' }, { created_at: 'asc' }],
        include: {
          reserva: {
            select: {
              voucher_codigo: true,
              pasajero_nombre: true,
              token_pasajero: true,
              origen_texto: true,
              punto_encuentro: true,
              conductor: {
                select: {
                  usuario: {
                    select: { nombre: true, telefono: true },
                  },
                  vehiculo: {
                    select: { placa: true, marca: true, modelo: true },
                  },
                },
              },
            },
          },
        },
      })
    : [];

  return (
    <main className="min-h-screen bg-background">
      <BrandHeader />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-care">Atención al pasajero</p>
            <h1 className="mt-1 text-2xl font-semibold text-product-deep dark:text-product-200">Casos por resolver</h1>
            <p className="mt-2 text-sm text-foreground-muted">
              Objetos olvidados y solicitudes que necesitan seguimiento del equipo.
            </p>
          </div>
          <Link
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-product hover:bg-surface-muted"
            href="/admin"
          >
            Volver al despacho
          </Link>
        </div>

        <div className="grid gap-4">
          {incidencias.map((incidencia) => {
            const unidad = incidencia.reserva.conductor?.vehiculo;
            return (
              <article className="rounded-md border border-border bg-surface p-5" key={incidencia.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-care-soft px-2 py-1 text-xs font-semibold text-care">
                        {tipoLabel(incidencia.tipologia)}
                      </span>
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClass(incidencia.estado)}`}>
                        {statusLabel(incidencia.estado)}
                      </span>
                      <span className="rounded bg-surface-muted px-2 py-1 text-xs font-semibold text-foreground-muted">
                        Prioridad {severidadLabel(incidencia.severidad)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-product-deep dark:text-product-200">{incidencia.descripcion}</h2>
                    <p className="mt-2 text-sm text-foreground-muted">
                      {incidencia.reserva.voucher_codigo} · {incidencia.reserva.pasajero_nombre}
                    </p>
                  </div>
                  <Link
                    className="rounded-md bg-care px-4 py-2 text-sm font-semibold text-white"
                    href={`/bienestar/${incidencia.id}?t=${incidencia.reserva.token_pasajero}`}
                  >
                    Ver caso
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <div className="rounded-md bg-surface-muted p-3">
                    <p className="text-xs font-semibold uppercase text-foreground-muted">Punto</p>
                    <p className="mt-1 font-medium text-foreground">
                      {incidencia.reserva.punto_encuentro ?? incidencia.reserva.origen_texto ?? 'Punto por confirmar'}
                    </p>
                  </div>
                  <div className="rounded-md bg-surface-muted p-3">
                    <p className="text-xs font-semibold uppercase text-foreground-muted">Conductor</p>
                    <p className="mt-1 font-medium text-foreground">
                      {incidencia.reserva.conductor?.usuario.nombre ?? 'Pendiente'}
                    </p>
                  </div>
                  <div className="rounded-md bg-surface-muted p-3">
                    <p className="text-xs font-semibold uppercase text-foreground-muted">Unidad</p>
                    <p className="mt-1 font-medium text-foreground">
                      {unidad ? `${unidad.placa} · ${unidad.marca} ${unidad.modelo}` : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
          {incidencias.length === 0 ? (
            <div className="rounded-md border border-border bg-surface p-6 text-sm text-foreground-muted">
              No hay casos activos.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

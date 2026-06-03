import Link from 'next/link';
import { BrandHeader } from '@/components/brand-header';
import { requireRole } from '@/lib/auth';
import { prisma } from '@taxigreen/database';

export const dynamic = 'force-dynamic';

function statusClass(estado: string) {
  if (estado === 'abierta') return 'bg-warning/10 text-warning';
  if (estado === 'en_resolucion') return 'bg-care-soft text-care';
  if (estado === 'escalada') return 'bg-danger/10 text-danger';
  return 'bg-neutral-100 text-neutral-700';
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
            <p className="text-sm font-medium text-care">/admin/bienestar</p>
            <h1 className="mt-1 text-2xl font-semibold text-product-deep">Bienestar operativo</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Casos activos de objeto olvidado vinculados a reservas reales.
            </p>
          </div>
          <Link
            className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-product hover:bg-product-muted"
            href="/admin"
          >
            Volver al despacho
          </Link>
        </div>

        <div className="grid gap-4">
          {incidencias.map((incidencia) => {
            const unidad = incidencia.reserva.conductor?.vehiculo;
            return (
              <article className="rounded-md border border-border bg-white p-5" key={incidencia.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-care-soft px-2 py-1 text-xs font-semibold text-care">
                        {incidencia.tipologia.replaceAll('_', ' ')}
                      </span>
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClass(incidencia.estado)}`}>
                        {incidencia.estado.replaceAll('_', ' ')}
                      </span>
                      <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">
                        {incidencia.severidad}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-product-deep">{incidencia.descripcion}</h2>
                    <p className="mt-2 text-sm text-neutral-600">
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
                  <div className="rounded-md bg-neutral-50 p-3">
                    <p className="text-xs font-semibold uppercase text-neutral-500">Punto</p>
                    <p className="mt-1 font-medium text-neutral-900">
                      {incidencia.reserva.punto_encuentro ?? 'Salida 3, columna F2'}
                    </p>
                  </div>
                  <div className="rounded-md bg-neutral-50 p-3">
                    <p className="text-xs font-semibold uppercase text-neutral-500">Conductor</p>
                    <p className="mt-1 font-medium text-neutral-900">
                      {incidencia.reserva.conductor?.usuario.nombre ?? 'Pendiente'}
                    </p>
                  </div>
                  <div className="rounded-md bg-neutral-50 p-3">
                    <p className="text-xs font-semibold uppercase text-neutral-500">Unidad</p>
                    <p className="mt-1 font-medium text-neutral-900">
                      {unidad ? `${unidad.placa} · ${unidad.marca} ${unidad.modelo}` : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
          {incidencias.length === 0 ? (
            <div className="rounded-md border border-border bg-white p-6 text-sm text-neutral-600">
              No hay incidencias activas.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

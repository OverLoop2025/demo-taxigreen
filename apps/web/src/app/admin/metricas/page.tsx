import Link from 'next/link';
import { BrandHeader } from '@/components/brand-header';
import { getAdminMetricas } from '@/lib/admin/reservas';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-border bg-white p-5">
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-product-deep">{value}</p>
      <p className="mt-2 text-sm text-neutral-600">{detail}</p>
    </div>
  );
}

export default async function AdminMetricasPage() {
  const session = await requireRole(['admin_tenant', 'despachador']);
  const tenantId = session.user.tenantId;
  const metrics = tenantId
    ? await getAdminMetricas(tenantId)
    : {
        reservasHoy: 0,
        asignacionesHoy: 0,
        conductoresActivos: 0,
        vouchersEmitidos: 0,
        estadoCounts: {},
      };

  const totalEstados = Object.values(metrics.estadoCounts).reduce((sum, value) => sum + value, 0);

  return (
    <main className="min-h-screen bg-background">
      <BrandHeader />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-product">/admin/metricas</p>
            <h1 className="mt-1 text-2xl font-semibold text-product-deep">Métricas operativas</h1>
            <p className="mt-2 text-sm text-neutral-600">Indicadores calculados desde Prisma para el tenant activo.</p>
          </div>
          <Link className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-product hover:bg-product-muted" href="/admin">
            Volver
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard detail="Servicios programados para hoy" label="Reservas hoy" value={metrics.reservasHoy} />
          <MetricCard detail="Eventos reserva_asignada auditados hoy" label="Asignaciones hoy" value={metrics.asignacionesHoy} />
          <MetricCard detail="Conductores activos en el tenant" label="Conductores activos" value={metrics.conductoresActivos} />
          <MetricCard detail="Reservas con voucher emitido" label="Vouchers emitidos" value={metrics.vouchersEmitidos} />
        </div>

        <section className="mt-6 rounded-md border border-border bg-white p-5">
          <h2 className="text-base font-semibold text-product-deep">Reservas por estado</h2>
          <div className="mt-5 space-y-3">
            {Object.entries(metrics.estadoCounts).map(([estado, count]) => {
              const width = totalEstados ? Math.max(6, Math.round((count / totalEstados) * 100)) : 6;
              return (
                <div className="grid grid-cols-[12rem_1fr_3rem] items-center gap-3 text-sm" key={estado}>
                  <span className="truncate text-neutral-700">{estado.replaceAll('_', ' ')}</span>
                  <div className="h-2 overflow-hidden rounded bg-neutral-100">
                    <div className="h-full rounded bg-product" style={{ width: `${width}%` }} />
                  </div>
                  <span className="text-right font-semibold text-product-deep">{count}</span>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

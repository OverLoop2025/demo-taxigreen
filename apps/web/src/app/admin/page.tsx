import { BrandHeader } from '@/components/brand-header';
import { SiteFooter } from '@/components/brand/site-footer';
import { AdminReservasLive } from '@/components/admin/admin-reservas-live';
import { getAdminReservas } from '@/lib/admin/reservas';
import { requireRole } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await requireRole(['admin_tenant', 'despachador']);
  const tenantId = session.user.tenantId;
  const reservas = tenantId ? await getAdminReservas(tenantId) : [];

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <BrandHeader />
      <section className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-product">Panel de despacho</p>
            <h1 className="mt-1 text-2xl font-semibold text-product-deep dark:text-product-200">Servicios de hoy</h1>
            <p className="mt-2 text-sm text-foreground-muted">
              {session.user.email ?? 'Operador'} está viendo los servicios de la empresa en tiempo real.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-product hover:bg-surface-muted" href="/admin/metricas">
              Resumen
            </Link>
            <Link className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-product hover:bg-surface-muted" href="/admin/bienestar">
              Bienestar
            </Link>
            <Link className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-product hover:bg-surface-muted" href="/admin/auditoria">
              Actividad
            </Link>
          </div>
        </div>

        {tenantId ? (
          <AdminReservasLive initialReservas={reservas} tenantId={tenantId} />
        ) : (
          <div className="rounded-md border border-border bg-surface p-5 text-sm text-foreground-muted">
            No se encontró una empresa para esta sesión.
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link className="font-medium text-product hover:text-product-deep dark:hover:text-product-200" href="/admin/auditoria?action=reserva_asignada">
            Ver actividad del despacho
          </Link>
          <Link className="font-medium text-product hover:text-product-deep dark:hover:text-product-200" href="/admin/metricas">
            Ver resumen del día
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

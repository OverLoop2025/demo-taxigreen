import { BrandHeader } from '@/components/brand-header';
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
    <main className="min-h-screen bg-background">
      <BrandHeader />
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-product">/admin</p>
            <h1 className="mt-1 text-2xl font-semibold text-product-deep">Despacho operativo</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Sesión activa: {session.user.email ?? 'operador'} · reservas del tenant en vivo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-product hover:bg-product-muted" href="/admin/metricas">
              Métricas
            </Link>
            <Link className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-product hover:bg-product-muted" href="/admin/bienestar">
              Bienestar
            </Link>
            <Link className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-product hover:bg-product-muted" href="/admin/auditoria">
              Auditoría
            </Link>
          </div>
        </div>

        {tenantId ? (
          <AdminReservasLive initialReservas={reservas} tenantId={tenantId} />
        ) : (
          <div className="rounded-md border border-border bg-white p-5 text-sm text-neutral-600">
            No se encontró tenant en la sesión actual.
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link className="font-medium text-product hover:text-product-deep" href="/admin/auditoria?action=reserva_asignada">
            Ver auditoría operativa
          </Link>
          <Link className="font-medium text-product hover:text-product-deep" href="/admin/metricas">
            Ver tablero de métricas
          </Link>
        </div>
      </section>
    </main>
  );
}

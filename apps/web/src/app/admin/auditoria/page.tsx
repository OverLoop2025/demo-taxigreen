import Link from 'next/link';
import { BrandHeader } from '@/components/brand-header';
import { AuditTable, type AuditRow } from '@/components/admin/audit-table';
import { requireRole } from '@/lib/auth';
import { prisma } from '@taxigreen/database';

export const dynamic = 'force-dynamic';

type Search = {
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
  page?: string;
};

function toDate(value: string | undefined, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}-05:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function pageHref(params: Search, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== 'page') query.set(key, value);
  }
  query.set('page', String(page));
  return `/admin/auditoria?${query.toString()}`;
}

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await requireRole(['admin_tenant', 'despachador']);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const pageSize = 20;
  const where = {
    ...(session.user.tenantId ? { tenant_id: session.user.tenantId } : {}),
    ...(params.action ? { action: { contains: params.action } } : {}),
    ...(params.actor ? { actor_tipo: { contains: params.actor } } : {}),
    ...((params.from || params.to) && {
      ts: {
        ...(toDate(params.from) ? { gte: toDate(params.from) } : {}),
        ...(toDate(params.to, true) ? { lte: toDate(params.to, true) } : {}),
      },
    }),
  };

  const [events, total] = await Promise.all([
    prisma.auditoria.findMany({
      where,
      orderBy: { ts: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditoria.count({ where }),
  ]);

  const rows: AuditRow[] = events.map((event) => ({
    id: event.id,
    ts: event.ts.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
    actor: `${event.actor_tipo}${event.actor_id ? `:${event.actor_id}` : ''}`,
    action: event.action,
    target: [event.target_table, event.target_id].filter(Boolean).join(':') || '—',
    payload: event.payload ? JSON.stringify(event.payload) : '—',
  }));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-background">
      <BrandHeader />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-product">/admin/auditoria</p>
            <h1 className="mt-1 text-2xl font-semibold text-product-deep">Auditoría operativa</h1>
          </div>
          <Link className="text-sm font-medium text-product hover:text-product-deep" href="/admin">
            Volver
          </Link>
        </div>

        <form className="mb-5 grid gap-3 md:grid-cols-5">
          <input
            className="h-10 rounded-md border border-border px-3 text-sm"
            defaultValue={params.action}
            name="action"
            placeholder="Acción"
          />
          <input
            className="h-10 rounded-md border border-border px-3 text-sm"
            defaultValue={params.actor}
            name="actor"
            placeholder="Actor"
          />
          <input
            className="h-10 rounded-md border border-border px-3 text-sm"
            defaultValue={params.from}
            name="from"
            type="date"
          />
          <input
            className="h-10 rounded-md border border-border px-3 text-sm"
            defaultValue={params.to}
            name="to"
            type="date"
          />
          <button className="h-10 rounded-md bg-product px-4 text-sm font-medium text-white" type="submit">
            Filtrar
          </button>
        </form>

        <AuditTable data={rows} />

        <nav className="mt-4 flex items-center justify-between text-sm text-neutral-600">
          <span>
            Página {page} de {totalPages} · {total} eventos
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link className="rounded-md border border-border px-3 py-2" href={pageHref(params, page - 1)}>
                Anterior
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link className="rounded-md border border-border px-3 py-2" href={pageHref(params, page + 1)}>
                Siguiente
              </Link>
            ) : null}
          </div>
        </nav>
      </section>
    </main>
  );
}

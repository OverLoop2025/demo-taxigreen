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

function actorLabel(actor: string, id: string | null) {
  const labels: Record<string, string> = {
    sistema: 'Sistema',
    usuario: 'Operador',
    conductor: 'Conductor',
    pasajero: 'Pasajero',
    llm: 'Copiloto',
  };
  const base = labels[actor] ?? actor.replaceAll('_', ' ');
  return id ? `${base} · ${id.slice(0, 8)}` : base;
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    reserva_ingesta_whatsapp_creada: 'Reserva creada por WhatsApp',
    reserva_asignada: 'Conductor asignado',
    reserva_sugerencia_override: 'Operador eligió otra opción',
    login_admin: 'Ingreso de operador',
    login_conductor: 'Ingreso de conductor',
    voucher_qr_emitido: 'QR preparado',
    voucher_qr_verificado: 'QR validado',
    voucher_qr_rechazado: 'QR rechazado',
    comprobante_pdf_generado: 'Comprobante generado',
    reniec_lookup: 'Documento consultado',
    incidencia_creada: 'Caso abierto',
    incidencia_respuesta_conductor: 'Respuesta del conductor',
    incidencia_cerrada: 'Caso cerrado',
  };
  return labels[action] ?? action.replaceAll('_', ' ');
}

// Resumen legible del detalle (nunca JSON crudo): "Nuevo estado: en camino · Origen: copiloto".
function resumenPayload(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '—';
  const labels: Record<string, string> = {
    estado: 'Estado',
    estado_nuevo: 'Nuevo estado',
    estado_anterior: 'Estado anterior',
    conductor: 'Conductor',
    conductor_nombre: 'Conductor',
    vehiculo: 'Unidad',
    placa: 'Placa',
    fuente: 'Origen',
    fuente_decision: 'Origen',
    score: 'Puntaje',
    motivo: 'Motivo',
    voucher: 'Código',
    voucher_codigo: 'Código',
    tipo: 'Tipo',
    resultado: 'Resultado',
    nombre: 'Nombre',
    respuesta: 'Respuesta',
  };
  const human = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value.replaceAll('_', ' ');
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '…';
  };
  const parts: string[] = [];
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (value === null || value === undefined || value === '' || typeof value === 'object') continue;
    parts.push(`${labels[key] ?? key.replaceAll('_', ' ')}: ${human(value)}`);
    if (parts.length >= 4) break;
  }
  return parts.length ? parts.join(' · ') : '—';
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
    actor: actorLabel(event.actor_tipo, event.actor_id),
    action: actionLabel(event.action),
    target: event.target_id ? event.target_id.slice(0, 8) : event.target_table ?? '—',
    payload: resumenPayload(event.payload),
  }));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-background">
      <BrandHeader />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-product">Panel de despacho</p>
            <h1 className="mt-1 text-2xl font-semibold text-product-deep dark:text-product-200">Registro de actividad</h1>
          </div>
          <Link className="text-sm font-medium text-product hover:text-product-deep dark:hover:text-product-200" href="/admin">
            Volver
          </Link>
        </div>

        <form className="mb-5 grid gap-3 md:grid-cols-5">
          <input
            className="h-10 rounded-md border border-border px-3 text-sm"
            defaultValue={params.action}
            name="action"
            placeholder="Buscar acción"
          />
          <input
            className="h-10 rounded-md border border-border px-3 text-sm"
            defaultValue={params.actor}
            name="actor"
            placeholder="Responsable"
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

        <nav className="mt-4 flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Página {page} de {totalPages} · {total} movimientos
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

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

// Diccionario único de acciones en lenguaje de negocio (sin tecnicismos): se usa
// tanto para mostrar la fila como para poblar el selector de filtro.
const ACCION_LABELS: Record<string, string> = {
  login_admin: 'Ingresó un administrador',
  login_counter: 'Ingresó personal de mostrador',
  login_driver: 'Ingresó un conductor',
  login_driver_mobile: 'Ingresó un conductor (app móvil)',
  reserva_ingesta_whatsapp_creada: 'Se creó una reserva por WhatsApp',
  reserva_asignada: 'Se asignó conductor a la reserva',
  vehiculo_asignado: 'Se asignó o cambió la unidad',
  reserva_sugerencia_override: 'El operador eligió otra opción del copiloto',
  reserva_excepcion: 'Se marcó la reserva para revisión',
  reserva_requiere_reasignacion: 'La reserva necesita una nueva unidad',
  reserva_cancelada_pasajero: 'El pasajero canceló la reserva',
  cancelacion_solicitada_pasajero: 'El pasajero pidió cancelar',
  viaje_cancelado_por_conductor: 'El conductor canceló el viaje',
  reserva_calificada: 'El pasajero calificó el servicio',
  driver_estado_viaje_actualizado: 'El conductor avanzó el viaje',
  driver_inicio_bloqueado_counter: 'No pudo iniciar: falta validar en mostrador',
  driver_push_token_registrado: 'El conductor activó los avisos en su teléfono',
  notificacion_conductor_pendiente: 'Se envió un aviso al conductor',
  voucher_qr_emitido: 'Se preparó el pase de abordaje',
  voucher_qr_consumido: 'Se usó el pase en el mostrador',
  voucher_qr_reuso_bloqueado: 'Se bloqueó el reúso de un pase',
  abordaje_autorizado: 'El mostrador dio luz verde al viaje',
  pago_demo_autorizado: 'Se autorizó el pago',
  pago_demo_cerrado: 'Se cerró el pago al terminar',
  pago_demo_anulado_cancelacion: 'Se anuló el pago por cancelación',
  pago_pasajero_capturado_demo: 'El pasajero registró su pago',
  comprobante_preparado: 'Se preparó el comprobante',
  comprobante_pasajero_preparado: 'El pasajero completó sus datos de comprobante',
  comprobante_pdf_generado: 'Se generó el comprobante en PDF',
  reniec_lookup: 'Se consultó un documento de identidad',
  ubicacion_marcada_pasajero: 'El pasajero marcó su ubicación en el mapa',
  incidencia_objeto_olvidado_creada: 'El pasajero reportó un objeto olvidado',
  incidencia_objeto_olvidado_respondida: 'Se respondió un caso de objeto olvidado',
  reporte_objeto: 'Reporte de objeto olvidado',
  reporte_objeto_olvidado: 'Reporte de objeto olvidado',
  objeto_encontrado: 'Se encontró el objeto olvidado',
  entrega_coordinada: 'Se coordinó la entrega del objeto',
};

// Acciones ofrecidas en el selector de filtro, agrupadas por lo que le importa al negocio.
const FILTRO_ACCIONES: Array<{ grupo: string; opciones: Array<{ value: string; label: string }> }> = [
  {
    grupo: 'Reservas y asignación',
    opciones: [
      { value: 'reserva_ingesta_whatsapp_creada', label: 'Reserva creada por WhatsApp' },
      { value: 'reserva_asignada', label: 'Conductor asignado' },
      { value: 'vehiculo_asignado', label: 'Unidad asignada o cambiada' },
      { value: 'reserva_excepcion', label: 'Reserva marcada para revisión' },
      { value: 'reserva_cancelada_pasajero', label: 'Pasajero canceló' },
      { value: 'viaje_cancelado_por_conductor', label: 'Conductor canceló' },
    ],
  },
  {
    grupo: 'Viaje y mostrador',
    opciones: [
      { value: 'driver_estado_viaje_actualizado', label: 'El conductor avanzó el viaje' },
      { value: 'voucher_qr_consumido', label: 'Pase usado en mostrador' },
      { value: 'abordaje_autorizado', label: 'Mostrador dio luz verde' },
      { value: 'ubicacion_marcada_pasajero', label: 'Pasajero marcó ubicación' },
    ],
  },
  {
    grupo: 'Pagos y comprobantes',
    opciones: [
      { value: 'pago_demo_autorizado', label: 'Pago autorizado' },
      { value: 'pago_demo_cerrado', label: 'Pago cerrado' },
      { value: 'comprobante_pdf_generado', label: 'Comprobante generado' },
    ],
  },
  {
    grupo: 'Casos e ingresos',
    opciones: [
      { value: 'incidencia_objeto_olvidado_creada', label: 'Objeto olvidado reportado' },
      { value: 'reserva_calificada', label: 'Servicio calificado' },
      { value: 'login_admin', label: 'Ingreso de administrador' },
      { value: 'login_counter', label: 'Ingreso de mostrador' },
      { value: 'login_driver', label: 'Ingreso de conductor' },
    ],
  },
];

const FILTRO_ACTORES: Array<{ value: string; label: string }> = [
  { value: '', label: 'Cualquier responsable' },
  { value: 'usuario', label: 'Operador / administrador' },
  { value: 'conductor', label: 'Conductor' },
  { value: 'pasajero', label: 'Pasajero' },
  { value: 'sistema', label: 'Sistema / automático' },
];

const ESTADO_VIAJE_FRASE: Record<string, string> = {
  en_camino: 'El conductor inició la ruta',
  en_punto: 'El conductor llegó al punto de encuentro',
  a_bordo: 'Pasajero a bordo · viaje en curso',
  finalizado: 'El conductor finalizó el viaje',
  cancelado: 'El conductor canceló el viaje',
  asignado: 'El conductor recibió la asignación',
};

function actionLabel(action: string, payload?: unknown) {
  // Para el avance del viaje, mostrar el estado concreto si el payload lo trae.
  if (action === 'driver_estado_viaje_actualizado' && payload && typeof payload === 'object') {
    const estado = (payload as { estado_viaje_nuevo?: string }).estado_viaje_nuevo;
    if (estado && ESTADO_VIAJE_FRASE[estado]) return ESTADO_VIAJE_FRASE[estado];
  }
  return ACCION_LABELS[action] ?? action.replaceAll('_', ' ');
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
    action: actionLabel(event.action, event.payload),
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
            <h1 className="mt-1 text-2xl font-semibold text-product-deep dark:text-product-200">
              Quién hizo qué
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">
              Cada movimiento del servicio queda registrado: quién lo hizo, qué hizo y cuándo.
            </p>
          </div>
          <Link className="text-sm font-medium text-product hover:text-product-deep dark:hover:text-product-200" href="/admin">
            Volver
          </Link>
        </div>

        <form className="mb-5 grid gap-3 md:grid-cols-5">
          <label className="md:col-span-2 flex flex-col gap-1 text-xs font-medium text-foreground-muted">
            ¿Qué pasó?
            <select
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
              defaultValue={params.action ?? ''}
              name="action"
            >
              <option value="">Cualquier acción</option>
              {FILTRO_ACCIONES.map((grupo) => (
                <optgroup key={grupo.grupo} label={grupo.grupo}>
                  {grupo.opciones.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-foreground-muted">
            ¿Quién?
            <select
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
              defaultValue={params.actor ?? ''}
              name="actor"
            >
              {FILTRO_ACTORES.map((op) => (
                <option key={op.value || 'todos'} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-foreground-muted">
            Desde
            <input
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
              defaultValue={params.from}
              name="from"
              type="date"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-foreground-muted">
            Hasta
            <input
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
              defaultValue={params.to}
              name="to"
              type="date"
            />
          </label>
          <button className="h-10 self-end rounded-md bg-product px-4 text-sm font-medium text-white md:col-span-5 md:w-40" type="submit">
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

import { EstadoReserva } from '@taxigreen/database';
import { sugerirAsignacionConRazonamiento } from '@taxigreen/ia';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { asignarReservaCore } from '@/lib/admin/asignar-core';
import { getConductoresActivos, getReservaDetalle, getVehiculosTenant } from '@/lib/admin/reservas';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// El mostrador (rol supervisor) es autosuficiente: puede ver al conductor asignado o
// sugerido y asignar/cambiar conductor+unidad sin abrir el panel admin. Admin y
// despachador también pueden usar esta ruta.
const ROLES_PERMITIDOS = new Set(['supervisor', 'admin_tenant', 'despachador']);

const ESTADOS_BLOQUEADOS = new Set<string>([
  EstadoReserva.cancelada,
  EstadoReserva.por_liquidar,
  EstadoReserva.en_curso,
]);

async function requireCounterContext() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || !role || !ROLES_PERMITIDOS.has(role)) {
    return { error: NextResponse.json({ error: 'no_autorizado' }, { status: 401 }) } as const;
  }
  if (!session.user.tenantId) {
    return { error: NextResponse.json({ error: 'sin_tenant' }, { status: 400 }) } as const;
  }
  return { actorId: session.user.id, tenantId: session.user.tenantId } as const;
}

export async function GET(_request: Request, { params }: { params: Promise<{ reservaId: string }> }) {
  const ctx = await requireCounterContext();
  if ('error' in ctx) return ctx.error;
  const { tenantId } = ctx;
  const { reservaId } = await params;

  const detalle = await getReservaDetalle(tenantId, reservaId);
  if (!detalle) {
    return NextResponse.json({ error: 'reserva_no_encontrada' }, { status: 404 });
  }

  const puedeAsignar = !ESTADOS_BLOQUEADOS.has(detalle.estado);

  // La sugerencia del copiloto es best-effort (puede fallar sin conductores libres).
  let sugerencia: {
    conductorId: string;
    conductorNombre: string;
    vehiculoId: string | null;
    placa: string | null;
    razon: string;
    fuente: string;
  } | null = null;
  if (puedeAsignar) {
    try {
      const s = await sugerirAsignacionConRazonamiento(reservaId, { tenantId });
      if (s) {
        sugerencia = {
          conductorId: s.conductor.id,
          conductorNombre: s.conductor.nombre,
          vehiculoId: s.vehiculo?.id ?? null,
          placa: s.vehiculo?.placa ?? null,
          razon: s.razon,
          fuente: s.fuente,
        };
      }
    } catch {
      sugerencia = null;
    }
  }

  const [conductores, vehiculos] = await Promise.all([
    getConductoresActivos(tenantId, detalle.conductorId),
    getVehiculosTenant(tenantId),
  ]);

  return NextResponse.json({
    puedeAsignar,
    asignado: detalle.conductorId
      ? {
          conductorId: detalle.conductorId,
          conductorNombre: detalle.conductorNombre,
          vehiculoId: detalle.vehiculoId,
          vehiculoLabel: detalle.vehiculoLabel,
        }
      : null,
    sugerencia,
    conductores,
    vehiculos,
  });
}

const postSchema = z.object({
  conductorId: z.string().min(1),
  vehiculoId: z.string().min(1).nullable().optional(),
  fuente: z.enum(['algoritmo', 'llm']).optional(),
  razon: z.string().max(600).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ reservaId: string }> }) {
  const ctx = await requireCounterContext();
  if ('error' in ctx) return ctx.error;
  const { actorId, tenantId } = ctx;
  const { reservaId } = await params;

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 });
  }

  try {
    const result = await asignarReservaCore({
      actorId,
      tenantId,
      reservaId,
      conductorId: parsed.data.conductorId,
      vehiculoId: parsed.data.vehiculoId ?? null,
      fuenteDecision: {
        fuente: parsed.data.fuente ?? 'algoritmo',
        motivo: 'asignacion_mostrador',
        modelo: null,
      },
      payloadExtra: { origen: 'mostrador', razon_sugerida: parsed.data.razon ?? null },
      successMessage: 'Conductor asignado desde el mostrador.',
    });
    if (!result.ok) {
      return NextResponse.json({ error: 'asignacion_fallida', message: result.message }, { status: 409 });
    }
    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo asignar.';
    return NextResponse.json({ error: 'asignacion_fallida', message }, { status: 409 });
  }
}

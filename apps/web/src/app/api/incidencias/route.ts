import { clasificarIncidenciaDeterminista } from '@taxigreen/bienestar';
import { recordAudit } from '@taxigreen/auditoria';
import {
  EstadoIncidencia,
  SeveridadIncidencia,
  TipologiaIncidencia,
  prisma,
} from '@taxigreen/database';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendConductorIncidentPush } from '@/lib/push';
import { broadcastConductorIncidencia, broadcastReservaIncidencia } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  token_pasajero: z.string().min(8),
  descripcion: z.string().trim().min(8).max(900),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'incidencia_invalida' }, { status: 400 });
  }

  const reserva = await prisma.reservas.findFirst({
    where: {
      token_pasajero: parsed.data.token_pasajero,
      deleted_at: null,
    },
    select: {
      id: true,
      tenant_id: true,
      voucher_codigo: true,
      conductor_id: true,
    },
  });

  if (!reserva) {
    return NextResponse.json({ error: 'token_no_encontrado' }, { status: 404 });
  }

  const clasificacion = clasificarIncidenciaDeterminista(parsed.data.descripcion);
  if (clasificacion.tipologia !== 'objeto_olvidado') {
    return NextResponse.json(
      {
        error: 'solo_objeto_olvidado_demo',
        clasificacion,
      },
      { status: 422 },
    );
  }

  // Dedup: si ya existe un caso de objeto olvidado activo (no cerrado/resuelto)
  // para esta reserva, lo reutilizamos en lugar de crear otro. Evita que un doble
  // tap, un reintento por timeout o una red intermitente generen casos duplicados
  // sobre el mismo viaje (la tabla no tiene unique reserva_id+tipologia en demo).
  const existing = await prisma.incidencias.findFirst({
    where: {
      reserva_id: reserva.id,
      tipologia: TipologiaIncidencia.objeto_olvidado,
      deleted_at: null,
      estado: { notIn: [EstadoIncidencia.cerrada, EstadoIncidencia.resuelta] },
    },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      tipologia: true,
      severidad: true,
      estado: true,
      descripcion: true,
    },
  });

  if (existing) {
    return NextResponse.json({
      ok: true,
      incidencia: existing,
      deduplicado: true,
      caso_url: `/bienestar/${existing.id}?t=${parsed.data.token_pasajero}`,
    });
  }

  const now = new Date();
  const incidencia = await prisma.incidencias.create({
    data: {
      tenant_id: reserva.tenant_id,
      reserva_id: reserva.id,
      tipologia: TipologiaIncidencia.objeto_olvidado,
      severidad:
        clasificacion.severidad === 'media' ? SeveridadIncidencia.media : SeveridadIncidencia.baja,
      estado: EstadoIncidencia.abierta,
      descripcion: parsed.data.descripcion,
      timeline: [
        {
          ts: now.toISOString(),
          actor: 'pasajero',
          action: 'reporte_objeto_olvidado',
          descripcion: parsed.data.descripcion,
          clasificacion,
        },
      ],
    },
    select: {
      id: true,
      tipologia: true,
      severidad: true,
      estado: true,
      descripcion: true,
    },
  });

  await recordAudit({
    actor: { tipo: 'pasajero', id: 'link_publico' },
    action: 'incidencia_objeto_olvidado_creada',
    target: { table: 'incidencias', id: incidencia.id },
    tenantId: reserva.tenant_id,
    req: { headers: request.headers },
    payload: {
      reserva_id: reserva.id,
      voucher_codigo: reserva.voucher_codigo,
      tipologia: incidencia.tipologia,
      severidad: incidencia.severidad,
      clasificacion,
    },
    fuenteDecision: {
      fuente: 'algoritmo',
      motivo: 'clasificador_bienestar_determinista',
    },
  });

  const broadcastReserva = await broadcastReservaIncidencia({
    reservaId: reserva.id,
    incidenciaId: incidencia.id,
    estado: incidencia.estado,
    tipologia: incidencia.tipologia,
    descripcion: incidencia.descripcion,
  });

  const conductorResults = reserva.conductor_id
    ? await Promise.all([
        broadcastConductorIncidencia({
          conductorId: reserva.conductor_id,
          reservaId: reserva.id,
          incidenciaId: incidencia.id,
          estado: incidencia.estado,
          tipologia: incidencia.tipologia,
          descripcion: incidencia.descripcion,
        }),
        sendConductorIncidentPush({
          tenantId: reserva.tenant_id,
          conductorId: reserva.conductor_id,
          reservaId: reserva.id,
          incidenciaId: incidencia.id,
          descripcion: incidencia.descripcion,
        }),
      ])
    : [];

  return NextResponse.json({
    ok: true,
    incidencia,
    caso_url: `/bienestar/${incidencia.id}?t=${parsed.data.token_pasajero}`,
    delivery: {
      broadcast_reserva: broadcastReserva,
      conductor: conductorResults,
    },
  });
}

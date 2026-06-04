import { recordAudit } from '@taxigreen/auditoria';
import { EstadoReserva, prisma, Rol } from '@taxigreen/database';
import { verifyVoucherToken } from '@taxigreen/voucher';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { findReservaByPublicId } from '@/lib/reservas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  token: z.string().min(20),
  consume: z.boolean().default(false),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reserva = await findReservaByPublicId(id);
  if (!reserva) {
    return NextResponse.json({ error: 'reserva_no_encontrada' }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'token_invalido' }, { status: 400 });
  }

  const verification = verifyVoucherToken(parsed.data.token);
  const matchesReserva =
    verification.ok &&
    verification.payload.reserva_id === reserva.id &&
    verification.payload.codigo_publico === reserva.voucher_codigo &&
    parsed.data.token === reserva.voucher_qr_payload;

  await recordAudit({
    actor: { tipo: 'sistema', id: 'api:voucher:verify' },
    action: matchesReserva ? 'voucher_qr_verificado' : 'voucher_qr_rechazado',
    target: { table: 'reservas', id: reserva.id },
    tenantId: reserva.tenant_id,
    payload: {
      voucher_codigo: reserva.voucher_codigo,
      resultado: matchesReserva ? 'ok' : verification.ok ? 'mismatch' : verification.reason,
    },
  });

  if (!matchesReserva) {
    return NextResponse.json({ ok: false, error: 'token_invalido' }, { status: 400 });
  }

  const alreadyConsumed = await prisma.auditoria.findFirst({
    where: {
      tenant_id: reserva.tenant_id,
      action: 'voucher_qr_consumido',
      target_table: 'reservas',
      target_id: reserva.id,
    },
    orderBy: { ts: 'desc' },
    select: { id: true, ts: true },
  });

  if (alreadyConsumed) {
    await recordAudit({
      actor: { tipo: 'sistema', id: 'api:voucher:verify' },
      action: 'voucher_qr_reuso_bloqueado',
      target: { table: 'reservas', id: reserva.id },
      tenantId: reserva.tenant_id,
      payload: {
        voucher_codigo: reserva.voucher_codigo,
        consumido_en: alreadyConsumed.ts.toISOString(),
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error: 'voucher_ya_validado',
        consumedAt: alreadyConsumed.ts.toISOString(),
        reserva: {
          id: reserva.id,
          voucher_codigo: reserva.voucher_codigo,
          origen_texto: reserva.origen_texto,
          destino_texto: reserva.destino_texto,
          punto_encuentro: reserva.punto_encuentro,
        },
      },
      { status: 409 },
    );
  }

  if (parsed.data.consume) {
    const session = await auth();
    if (session?.user?.role !== Rol.supervisor) {
      return NextResponse.json({ ok: false, error: 'counter_no_autorizado' }, { status: 401 });
    }

    const consumedAt = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`voucher:${reserva.id}`}))`;
      const existing = await tx.auditoria.findFirst({
        where: {
          tenant_id: reserva.tenant_id,
          action: 'voucher_qr_consumido',
          target_table: 'reservas',
          target_id: reserva.id,
        },
        orderBy: { ts: 'desc' },
        select: { ts: true },
      });
      if (existing) return existing.ts;

      await tx.auditoria.create({
        data: {
          tenant_id: reserva.tenant_id,
          actor_tipo: 'usuario',
          actor_id: session.user.id,
          action: 'voucher_qr_consumido',
          target_table: 'reservas',
          target_id: reserva.id,
          payload: {
            voucher_codigo: reserva.voucher_codigo,
            estado_reserva: reserva.estado,
            accion_counter: 'validacion_abordaje',
          },
          fuente_decision: {
            fuente: 'humano',
            rol: session.user.role,
            motivo: 'supervisor_counter_confirma_voucher_un_solo_uso',
          },
        },
      });

      if (reserva.estado === EstadoReserva.confirmada) {
        await tx.reservas.update({
          where: { id: reserva.id },
          data: { estado: EstadoReserva.asignada },
        });
      }

      return new Date();
    });

    return NextResponse.json({
      ok: true,
      consumed: true,
      consumedAt: consumedAt.toISOString(),
      reserva: {
        id: reserva.id,
        voucher_codigo: reserva.voucher_codigo,
        origen_texto: reserva.origen_texto,
        destino_texto: reserva.destino_texto,
        punto_encuentro: reserva.punto_encuentro,
        pasajero_nombre: reserva.pasajero_nombre,
        pasajero_telefono: reserva.pasajero_telefono,
        vuelo_codigo: reserva.vuelo_codigo,
        estado: reserva.estado,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    consumed: false,
    reserva: {
      id: reserva.id,
      voucher_codigo: reserva.voucher_codigo,
      origen_texto: reserva.origen_texto,
      destino_texto: reserva.destino_texto,
      punto_encuentro: reserva.punto_encuentro,
      pasajero_nombre: reserva.pasajero_nombre,
      pasajero_telefono: reserva.pasajero_telefono,
      vuelo_codigo: reserva.vuelo_codigo,
      estado: reserva.estado,
    },
  });
}

import { recordAudit } from '@taxigreen/auditoria';
import { EstadoAbordaje, EstadoReserva, prisma, Rol } from '@taxigreen/database';
import { verifyVoucherToken } from '@taxigreen/voucher';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { requiereCounter } from '@/lib/conductor-asignacion';
import { findReservaByPublicId } from '@/lib/reservas';
import { broadcastConductorAbordaje, broadcastReservaAbordaje } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  token: z.string().min(20),
  consume: z.boolean().default(false),
});

function serializeCounterReserva(reserva: NonNullable<Awaited<ReturnType<typeof findReservaByPublicId>>>) {
  return {
    id: reserva.id,
    voucher_codigo: reserva.voucher_codigo,
    origen_texto: reserva.origen_texto,
    destino_texto: reserva.destino_texto,
    punto_encuentro: reserva.punto_encuentro,
    pasajero_nombre: reserva.pasajero_nombre,
    pasajero_telefono: reserva.pasajero_telefono,
    vuelo_codigo: reserva.vuelo_codigo,
    estado: reserva.estado,
    estado_abordaje: reserva.estado_abordaje,
    counter_validado_en: reserva.counter_validado_en?.toISOString() ?? null,
    conductor: reserva.conductor
      ? {
          nombre: reserva.conductor.usuario.nombre,
          placa: reserva.conductor.vehiculo?.placa ?? null,
        }
      : null,
    pago: null,
  };
}

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

  // Una reserva cancelada nunca habilita abordaje, aunque el token sea criptográficamente válido.
  const reservaCancelada = reserva.estado === EstadoReserva.cancelada;

  await recordAudit({
    actor: { tipo: 'sistema', id: 'api:voucher:verify' },
    action: matchesReserva && !reservaCancelada ? 'voucher_qr_verificado' : 'voucher_qr_rechazado',
    target: { table: 'reservas', id: reserva.id },
    tenantId: reserva.tenant_id,
    payload: {
      voucher_codigo: reserva.voucher_codigo,
      resultado: !matchesReserva
        ? verification.ok
          ? 'mismatch'
          : verification.reason
        : reservaCancelada
          ? 'reserva_cancelada'
          : 'ok',
    },
  });

  if (!matchesReserva) {
    return NextResponse.json({ ok: false, error: 'token_invalido' }, { status: 400 });
  }

  if (reservaCancelada) {
    return NextResponse.json(
      { ok: false, error: 'reserva_cancelada', reserva: serializeCounterReserva(reserva) },
      { status: 409 },
    );
  }

  const alreadyConsumed = await prisma.auditoria.findFirst({
    where: {
      tenant_id: reserva.tenant_id,
      action: 'voucher_qr_consumido',
      target_table: 'reservas',
      target_id: reserva.id,
    },
    orderBy: { ts: 'desc' },
    select: { id: true, ts: true, actor_tipo: true, actor_id: true },
  });

  if (alreadyConsumed) {
    // Self-healing: el QR ya se consumió pero la luz verde no quedó registrada (p. ej.,
    // validaciones hechas contra un backend que aún no escribía estado_abordaje). Sin esta
    // reparación el flujo se bloquea en ambas puntas: el conductor recibe 409
    // counter_pendiente y el counter recibe 409 voucher_ya_validado.
    let reservaActual = reserva;
    if (requiereCounter(reserva.tipo_viaje) && reserva.estado_abordaje !== EstadoAbordaje.autorizado) {
      const counterValidadoEn = reserva.counter_validado_en ?? alreadyConsumed.ts;
      await prisma.$transaction(async (tx) => {
        await tx.reservas.update({
          where: { id: reserva.id },
          data: {
            estado_abordaje: EstadoAbordaje.autorizado,
            counter_validado_en: counterValidadoEn,
            counter_usuario_id:
              alreadyConsumed.actor_tipo === 'usuario' ? alreadyConsumed.actor_id : null,
          },
        });
        await tx.auditoria.create({
          data: {
            tenant_id: reserva.tenant_id,
            actor_tipo: 'sistema',
            actor_id: 'api:voucher:verify',
            action: 'abordaje_autorizado',
            target_table: 'reservas',
            target_id: reserva.id,
            payload: {
              voucher_codigo: reserva.voucher_codigo,
              estado_abordaje: EstadoAbordaje.autorizado,
              counter_validado_en: counterValidadoEn.toISOString(),
              reparacion: 'qr_consumido_sin_luz_verde_registrada',
            },
            fuente_decision: {
              fuente: 'sistema',
              motivo: 'self_healing_abordaje_tras_qr_consumido',
            },
          },
        });
      });

      const counterValidadoEnIso = counterValidadoEn.toISOString();
      await Promise.all([
        broadcastReservaAbordaje({
          reservaId: reserva.id,
          counterValidadoEn: counterValidadoEnIso,
        }),
        reserva.conductor_id
          ? broadcastConductorAbordaje({
              conductorId: reserva.conductor_id,
              reservaId: reserva.id,
              counterValidadoEn: counterValidadoEnIso,
            })
          : Promise.resolve({ ok: false, reason: 'sin_conductor_asignado' as const }),
      ]);
      reservaActual = (await findReservaByPublicId(reserva.id)) ?? reserva;
    }

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
        reserva: serializeCounterReserva(reservaActual),
      },
      { status: 409 },
    );
  }

  if (parsed.data.consume) {
    const session = await auth();
    if (session?.user?.role !== Rol.supervisor) {
      return NextResponse.json({ ok: false, error: 'counter_no_autorizado' }, { status: 401 });
    }

    const consumeResult = await prisma.$transaction(async (tx) => {
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
      if (existing) {
        return {
          consumedAt: existing.ts,
          counterValidadoEn: reserva.counter_validado_en ?? existing.ts,
          conductorId: reserva.conductor_id,
        };
      }

      const counterValidadoEn = new Date();

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

      const updatedReserva = await tx.reservas.update({
        where: { id: reserva.id },
        data: {
          estado_abordaje: EstadoAbordaje.autorizado,
          counter_validado_en: counterValidadoEn,
          counter_usuario_id: session.user.id,
        },
        select: {
          conductor_id: true,
          counter_validado_en: true,
        },
      });

      await tx.auditoria.create({
        data: {
          tenant_id: reserva.tenant_id,
          actor_tipo: 'usuario',
          actor_id: session.user.id,
          action: 'abordaje_autorizado',
          target_table: 'reservas',
          target_id: reserva.id,
          payload: {
            voucher_codigo: reserva.voucher_codigo,
            estado_abordaje: EstadoAbordaje.autorizado,
            counter_validado_en: counterValidadoEn.toISOString(),
          },
          fuente_decision: {
            fuente: 'humano',
            rol: session.user.role,
            motivo: 'counter_da_luz_verde_al_conductor',
          },
        },
      });

      return {
        consumedAt: counterValidadoEn,
        counterValidadoEn: updatedReserva.counter_validado_en ?? counterValidadoEn,
        conductorId: updatedReserva.conductor_id,
      };
    });

    // Los broadcasts se esperan (no fire-and-forget) pero su resultado es interno:
    // la respuesta del endpoint no expone detalles de infraestructura.
    const counterValidadoEnIso = consumeResult.counterValidadoEn.toISOString();
    await Promise.all([
      broadcastReservaAbordaje({
        reservaId: reserva.id,
        counterValidadoEn: counterValidadoEnIso,
      }),
      consumeResult.conductorId
        ? broadcastConductorAbordaje({
            conductorId: consumeResult.conductorId,
            reservaId: reserva.id,
            counterValidadoEn: counterValidadoEnIso,
          })
        : Promise.resolve({ ok: false, reason: 'sin_conductor_asignado' as const }),
    ]);

    const updatedReserva = await findReservaByPublicId(reserva.id);

    return NextResponse.json({
      ok: true,
      consumed: true,
      consumedAt: consumeResult.consumedAt.toISOString(),
      reserva: serializeCounterReserva(updatedReserva ?? reserva),
    });
  }

  return NextResponse.json({
    ok: true,
    consumed: false,
    reserva: serializeCounterReserva(reserva),
  });
}

import { recordAudit } from '@taxigreen/auditoria';
import { prisma } from '@taxigreen/database';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  texto: z.string().trim().min(1).max(240).optional().nullable(),
});

// El pasajero marca su punto exacto en el mapa antes de que el conductor confirme.
// Flujo A (recojo en aeropuerto) → marca el DESTINO; flujo B (traslado) → el ORIGEN.
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'ubicacion_invalida' }, { status: 400 });
  }

  const { token } = await params;
  const reserva = await prisma.reservas.findFirst({
    where: { token_pasajero: token, deleted_at: null },
    select: { id: true, tenant_id: true, voucher_codigo: true, tipo_viaje: true },
  });

  if (!reserva) {
    return NextResponse.json({ error: 'token_no_encontrado' }, { status: 404 });
  }

  const marcaOrigen = reserva.tipo_viaje === 'traslado_aeropuerto';
  const texto =
    parsed.data.texto?.trim() ||
    `Ubicación marcada en el mapa (${parsed.data.lat.toFixed(5)}, ${parsed.data.lng.toFixed(5)})`;

  const data = marcaOrigen
    ? { origen_texto: texto, origen_lat: parsed.data.lat, origen_lng: parsed.data.lng }
    : { destino_texto: texto, destino_lat: parsed.data.lat, destino_lng: parsed.data.lng };

  await prisma.reservas.update({ where: { id: reserva.id }, data });

  await recordAudit({
    actor: { tipo: 'pasajero', id: 'link_ubicacion' },
    action: 'ubicacion_marcada_pasajero',
    target: { table: 'reservas', id: reserva.id },
    tenantId: reserva.tenant_id,
    req: { headers: request.headers },
    payload: {
      voucher_codigo: reserva.voucher_codigo,
      punto: marcaOrigen ? 'origen' : 'destino',
      texto,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
    },
    fuenteDecision: { fuente: 'algoritmo', motivo: 'pin_mapa_pasajero' },
  });

  return NextResponse.json({ ok: true, punto: marcaOrigen ? 'origen' : 'destino', texto });
}

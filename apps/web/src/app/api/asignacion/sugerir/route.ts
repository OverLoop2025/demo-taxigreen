import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sugerirAsignacionConRazonamiento } from '@taxigreen/ia';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z.object({
  reservaId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    const tenantId = session?.user?.tenantId;
    if (!session?.user || !tenantId || (role !== 'admin_tenant' && role !== 'despachador')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());
    const sugerencia = await sugerirAsignacionConRazonamiento(body.reservaId, {
      tenantId,
      logger: (event) => {
        console.info('[asignacion]', event);
      },
    });

    if (!sugerencia) {
      return NextResponse.json({ error: 'Reserva o candidatos no encontrados.' }, { status: 404 });
    }

    return NextResponse.json({ sugerencia });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo sugerir asignación.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { extraerReservaConFallback } from '@taxigreen/ia';
import { extractorInputSchema } from '@taxigreen/ingesta';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Demo: el extractor se consume desde /wa-sim (operador autenticado). El
    // webhook WABA real (MVP) usará firma entrante en vez de sesión. Sin sesión
    // operativa no se permite (cuando IA esté on, esto evita quemar tokens).
    const session = await auth();
    const role = session?.user?.role;
    if (!session?.user || (role !== 'admin_tenant' && role !== 'despachador')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const input = extractorInputSchema.parse(json);
    const resultado = await extraerReservaConFallback(input, {
      logger: (event) => {
        console.info('[ingesta]', event);
      },
    });
    return NextResponse.json(resultado);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo extraer la reserva.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

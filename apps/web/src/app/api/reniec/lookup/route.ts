import { recordAudit } from '@taxigreen/auditoria';
import {
  DocumentoLookupUnavailableError,
  lookupDocumento,
} from '@taxigreen/integraciones-reniec';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  tipo: z.enum(['dni', 'ruc']),
  documento: z.string().regex(/^\d{8}$|^\d{11}$/),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'documento_invalido' }, { status: 400 });
  }

  try {
    const result = await lookupDocumento(parsed.data);
    await recordAudit({
      actor: { tipo: 'sistema', id: 'api:reniec:lookup' },
      action: 'reniec_lookup',
      payload: {
        tipo: parsed.data.tipo,
        documento: parsed.data.documento,
        cache_hit: result.cacheHit,
        fuente: result.payload.fuente,
      },
    });

    return NextResponse.json({
      ok: true,
      cache_hit: result.cacheHit,
      payload: result.payload,
    });
  } catch (error) {
    if (error instanceof DocumentoLookupUnavailableError) {
      console.warn('RENIEC/APIs.net.pe no disponible', error.message);
      return NextResponse.json({ error: 'reniec_no_disponible' }, { status: 503 });
    }
    throw error;
  }
}

import { recordAudit } from '@taxigreen/auditoria';
import {
  renderComprobantePDF,
  renderComprobanteHtml,
  renderFallbackPdf,
} from '@taxigreen/comprobantes';
import { EstadoComprobante, prisma } from '@taxigreen/database';
import { NextResponse } from 'next/server';
import { comprobanteToTemplateInput } from '@/lib/comprobantes';
import { uploadComprobantePdf } from '@/lib/supabase-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function findComprobante(id: string) {
  return prisma.comprobantes.findFirst({
    where: {
      OR: [{ id }, { reserva_id: id }],
    },
    include: {
      reserva: true,
    },
    orderBy: { created_at: 'desc' },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comprobante = await findComprobante(id);
  if (!comprobante) {
    return NextResponse.json({ error: 'comprobante_no_encontrado' }, { status: 404 });
  }

  const input = comprobanteToTemplateInput(comprobante);
  const url = new URL(request.url);
  if (url.searchParams.get('format') === 'html') {
    return new Response(renderComprobanteHtml(input), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  let pdf: Buffer;
  let renderer: 'puppeteer' | 'fallback' = 'puppeteer';
  try {
    pdf = await renderComprobantePDF(input);
  } catch (error) {
    renderer = 'fallback';
    pdf = renderFallbackPdf(input);
    console.warn('PDF Puppeteer no disponible; usando PDF de contingencia local', error);
  }

  const storagePath = `${comprobante.tenant_id}/${comprobante.id}.pdf`;
  const storage = await uploadComprobantePdf(storagePath, pdf);
  await prisma.comprobantes.update({
    where: { id: comprobante.id },
    data: {
      estado: EstadoComprobante.emitido,
      pdf_url: storage.ok ? `supabase://${storagePath}` : `inline://${comprobante.id}.pdf`,
    },
  });
  await recordAudit({
    actor: { tipo: 'sistema', id: 'api:comprobantes:pdf' },
    action: 'comprobante_pdf_generado',
    target: { table: 'comprobantes', id: comprobante.id },
    tenantId: comprobante.tenant_id,
    payload: {
      comprobante: `${comprobante.serie}-${comprobante.correlativo}`,
      renderer,
      storage: storage.ok ? 'supabase_signed_url' : storage.reason,
    },
  });

  if (storage.ok && url.searchParams.get('redirect') === 'signed') {
    return NextResponse.redirect(storage.signedUrl);
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Disposition': `inline; filename="${comprobante.serie}-${comprobante.correlativo}.pdf"`,
      'Content-Type': 'application/pdf',
      'x-comprobante-renderer': renderer,
      ...(storage.ok ? { 'x-supabase-signed-url': storage.signedUrl } : {}),
    },
  });
}

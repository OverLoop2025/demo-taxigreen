import type { ComprobanteTemplateInput } from './types';

function escapePdfText(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

export function renderFallbackPdf(input: ComprobanteTemplateInput) {
  const lines = [
    'Taxi Green Demo',
    `${input.tipo.toUpperCase()} ${input.serie}-${String(input.correlativo).padStart(8, '0')}`,
    `Voucher: ${input.voucherCodigo}`,
    `Pasajero: ${input.pasajeroNombre}`,
    `Origen: ${input.origenTexto}`,
    `Destino: ${input.destinoTexto}`,
    `Monto: S/ ${Number(input.monto).toFixed(2)}`,
    'PDF de contingencia local. No es emision SUNAT real.',
  ];
  const text = lines
    .map((line, index) => `BT /F1 12 Tf 72 ${760 - index * 22} Td (${escapePdfText(line)}) Tj ET`)
    .join('\n');
  const stream = `${text}\n`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}endstream endobj`,
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body));
    body += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(body, 'utf8');
}

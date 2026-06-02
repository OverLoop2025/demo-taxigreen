import type { ComprobanteTemplateInput } from '../types';

export function money(value: string) {
  return `S/ ${Number(value).toFixed(2)}`;
}

export function documentNumber(input: ComprobanteTemplateInput) {
  return `${input.serie}-${String(input.correlativo).padStart(8, '0')}`;
}

export function escapeHtml(value: string | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function shell(input: ComprobanteTemplateInput, title: string, body: string) {
  const emittedAt = input.fechaEmision ?? new Date();
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} ${escapeHtml(documentNumber(input))}</title>
  <style>
    @page { size: A4; margin: 24mm 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, Arial, sans-serif; color: #111827; background: #ffffff; }
    .sheet { border: 1px solid #d1d5db; padding: 28px; min-height: 920px; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #0b0952; padding-bottom: 18px; }
    .brand { color: #0b0952; font-weight: 800; font-size: 24px; letter-spacing: 0; }
    .tenant { display: inline-block; margin-top: 8px; padding: 4px 8px; background: #0b7a3b; color: white; font-size: 11px; font-weight: 700; border-radius: 4px; }
    .box { border: 2px solid #0b0952; padding: 12px 16px; text-align: center; min-width: 210px; }
    .box h1 { margin: 0 0 8px; color: #0b0952; font-size: 17px; }
    .box p { margin: 0; font-weight: 800; font-size: 15px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 22px 0; font-size: 12px; }
    .meta div, .panel { border: 1px solid #e5e7eb; padding: 10px; background: #f9fafb; }
    .label { display: block; color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 12px; }
    th { background: #e8f1fc; color: #0b0952; text-align: left; padding: 10px; border: 1px solid #d1d5db; }
    td { padding: 10px; border: 1px solid #e5e7eb; vertical-align: top; }
    .right { text-align: right; }
    .total { margin-left: auto; margin-top: 18px; width: 260px; border: 1px solid #0b0952; }
    .total div { display: flex; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid #d1d5db; }
    .total div:last-child { border-bottom: 0; background: #0b0952; color: white; font-weight: 800; }
    .footer { margin-top: 26px; color: #6b7280; font-size: 10px; line-height: 1.45; }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="top">
      <div>
        <div class="brand">Taxi Green</div>
        <div class="tenant">Taxi Green Demo</div>
        <p style="margin: 12px 0 0; color:#4b5563; font-size:12px;">Operador formal de taxi aeroportuario</p>
      </div>
      <div class="box">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(documentNumber(input))}</p>
      </div>
    </section>
    <section class="meta">
      <div><span class="label">Fecha de emisión</span>${escapeHtml(emittedAt.toLocaleString('es-PE', { timeZone: 'America/Lima' }))}</div>
      <div><span class="label">Voucher</span>${escapeHtml(input.voucherCodigo)}</div>
      <div><span class="label">Cliente / pasajero</span>${escapeHtml(input.pasajeroNombre)}</div>
      <div><span class="label">Documento</span>${escapeHtml(input.pasajeroDocumento ?? 'No informado')}</div>
    </section>
    ${body}
    <p class="footer">
      Documento visual de demo. No constituye emisión SUNAT real. La integración tributaria queda para MVP.
      La trazabilidad operativa se conserva en auditoría y reserva.
    </p>
  </main>
</body>
</html>`;
}

import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import type { ComprobanteTemplateInput } from './types';

// Render de comprobante con pdf-lib (JS puro): se ve IDÉNTICO en local y en
// producción y no depende de Chromium/Puppeteer (que en Railway no arranca y
// degradaba al PDF de contingencia feo). Es la fuente de verdad del comprobante.

const NAVY = rgb(0.043, 0.035, 0.322); // #0B0952
const GREEN = rgb(0.043, 0.478, 0.231); // #0B7A3B
const BLUE = rgb(0.133, 0.498, 0.871); // #227FDE
const INK = rgb(0.105, 0.117, 0.153); // #1B1E27
const MUTE = rgb(0.42, 0.447, 0.498); // #6B7280
const LINE = rgb(0.85, 0.876, 0.906); // #D9DFE7
const SOFT = rgb(0.965, 0.976, 0.988); // #F6F9FC
const HEADBG = rgb(0.909, 0.945, 0.992); // #E8F1FC

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 44; // margen

function tituloPorTipo(tipo: ComprobanteTemplateInput['tipo']) {
  if (tipo === 'factura') return 'FACTURA ELECTRÓNICA';
  if (tipo === 'ticket') return 'TICKET DE VIAJE';
  return 'BOLETA DE VENTA ELECTRÓNICA';
}

function money(value: string) {
  const n = Number(value);
  return `S/ ${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

// Las fuentes estándar de pdf-lib usan WinAnsi y no codifican flechas/emoji/CJK.
// Normalizamos a algo imprimible (mantiene acentos del español).
function safe(s: string): string {
  const cleaned = String(s ?? '')
    .replaceAll('\u2192', '\u00BB')
    .replaceAll('\u2190', '\u00AB')
    .replaceAll('\u2194', '-');
  let out = '';
  for (const ch of cleaned) {
    const cp = ch.codePointAt(0) ?? 0;
    // Latin + Latin Extended-A/B (acentos y \u00B7) y puntuacion tipografica basica.
    // Se descartan control chars, emoji y CJK que WinAnsi no codifica.
    if ((cp >= 0x20 && cp <= 0x24f) || (cp >= 0x2010 && cp <= 0x2122)) out += ch;
  }
  return out.trim();
}

function docNumber(input: ComprobanteTemplateInput) {
  return `${input.serie}-${String(input.correlativo).padStart(8, '0')}`;
}

// Word-wrap simple respetando el ancho disponible.
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(text).split(/\s+/u);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const tentative = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(tentative, size) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = tentative;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderComprobantePdf(input: ComprobanteTemplateInput): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const text = (
    s: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont = helv,
    color = INK,
  ) => page.drawText(safe(s), { x, y, size, font, color });

  const labeled = (label: string, value: string, x: number, y: number, font: PDFFont = bold) => {
    text(label.toUpperCase(), x, y, 7.5, bold, MUTE);
    text(value, x, y - 13, 10.5, font, INK);
  };

  // Banda superior premium (navy + acento verde).
  page.drawRectangle({ x: 0, y: PAGE_H - 8, width: PAGE_W, height: 8, color: NAVY });
  page.drawRectangle({ x: 0, y: PAGE_H - 8, width: PAGE_W * 0.34, height: 8, color: GREEN });

  // ── Encabezado ────────────────────────────────────────────────────────────
  let y = PAGE_H - 52;
  text('Taxi', M, y, 26, bold, NAVY);
  text('Green', M + helv.widthOfTextAtSize('Taxi ', 26), y, 26, bold, GREEN);

  // Chip de tenant (verde).
  const chip = 'TAXI GREEN DEMO';
  const chipW = bold.widthOfTextAtSize(chip, 8) + 16;
  page.drawRectangle({ x: M, y: y - 24, width: chipW, height: 16, color: GREEN });
  text(chip, M + 8, y - 20, 8, bold, rgb(1, 1, 1));
  text('Operador formal de taxi aeroportuario · RUC 20600000001', M, y - 40, 9, helv, MUTE);

  // Caja del documento (derecha).
  const boxW = 210;
  const boxX = PAGE_W - M - boxW;
  const boxY = y - 46;
  const boxH = 58;
  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxW,
    height: boxH,
    borderColor: NAVY,
    borderWidth: 1.5,
    color: rgb(1, 1, 1),
  });
  const titulo = tituloPorTipo(input.tipo);
  const tSize = titulo.length > 24 ? 10 : 11.5;
  text(titulo, boxX + (boxW - bold.widthOfTextAtSize(titulo, tSize)) / 2, boxY + boxH - 22, tSize, bold, NAVY);
  const num = docNumber(input);
  text('N.°  ' + num, boxX + (boxW - bold.widthOfTextAtSize('N.°  ' + num, 13)) / 2, boxY + 16, 13, bold, INK);

  // Divisor.
  y = boxY - 18;
  page.drawRectangle({ x: M, y, width: PAGE_W - 2 * M, height: 2, color: NAVY });

  // ── Meta (emisión / voucher / cliente / documento) ─────────────────────────
  const emitido = (input.fechaEmision ?? new Date()).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const colL = M;
  const colR = M + (PAGE_W - 2 * M) / 2 + 8;
  y -= 30;
  labeled('Fecha de emisión', emitido, colL, y);
  labeled('Voucher / pase', input.voucherCodigo, colR, y);
  y -= 40;
  const esEmpresa = input.tipo === 'factura';
  labeled(esEmpresa ? 'Razón social' : 'Cliente / pasajero', esEmpresa ? (input.empresaNombre ?? 'Empresa cliente demo') : input.pasajeroNombre, colL, y);
  labeled(esEmpresa ? 'RUC' : 'Documento', input.pasajeroDocumento ?? 'No informado', colR, y);
  if (esEmpresa) {
    y -= 40;
    labeled('Pasajero', input.pasajeroNombre, colL, y);
    if (input.vueloCodigo) labeled('Vuelo', input.vueloCodigo, colR, y);
  }

  // ── Tabla de servicio ──────────────────────────────────────────────────────
  y -= 52;
  const tableX = M;
  const tableW = PAGE_W - 2 * M;
  const importeColW = 110;
  // Cabecera.
  page.drawRectangle({ x: tableX, y: y - 4, width: tableW, height: 24, color: HEADBG });
  text('DESCRIPCIÓN DEL SERVICIO', tableX + 12, y + 4, 9, bold, NAVY);
  text('IMPORTE', tableX + tableW - importeColW + 12, y + 4, 9, bold, NAVY);

  // Fila.
  y -= 8;
  const descTop = y;
  const desc = `Servicio de taxi aeroportuario: ${input.origenTexto} → ${input.destinoTexto}.`;
  const extras: string[] = [];
  if (input.puntoEncuentro) extras.push(`Punto de encuentro: ${input.puntoEncuentro}.`);
  if (input.vueloCodigo && !esEmpresa) extras.push(`Vuelo ${input.vueloCodigo}.`);
  const descLines = wrap(desc, helv, 10, tableW - importeColW - 24);
  const extraLines = extras.flatMap((e) => wrap(e, helv, 9, tableW - importeColW - 24));
  let ty = y - 8;
  for (const l of descLines) {
    text(l, tableX + 12, ty, 10, helv, INK);
    ty -= 15;
  }
  for (const l of extraLines) {
    text(l, tableX + 12, ty, 9, helv, MUTE);
    ty -= 13;
  }
  text(money(input.monto), tableX + tableW - importeColW + 12, descTop - 8, 11, bold, INK);
  const rowBottom = ty - 6;
  const headerTop = descTop + 28; // borde superior de la banda de cabecera
  const headerBottom = descTop + 4; // línea bajo la cabecera
  // Bordes de la tabla: recuadro que envuelve cabecera + fila sin cruzar el texto.
  page.drawRectangle({
    x: tableX,
    y: rowBottom,
    width: tableW,
    height: headerTop - rowBottom,
    borderColor: LINE,
    borderWidth: 1,
  });
  page.drawLine({
    start: { x: tableX, y: headerBottom },
    end: { x: tableX + tableW, y: headerBottom },
    thickness: 1,
    color: LINE,
  });
  page.drawLine({
    start: { x: tableX + tableW - importeColW, y: headerBottom },
    end: { x: tableX + tableW - importeColW, y: rowBottom },
    thickness: 1,
    color: LINE,
  });

  // ── Totales ────────────────────────────────────────────────────────────────
  const monto = Number(input.monto);
  const base = Number.isFinite(monto) ? monto : 0;
  const opGravada = base / 1.18;
  const igv = base - opGravada;
  const totW = 240;
  const totX = PAGE_W - M - totW;
  let totY = rowBottom - 24;
  const totRow = (label: string, value: string, highlight = false) => {
    if (highlight) {
      page.drawRectangle({ x: totX, y: totY - 7, width: totW, height: 24, color: NAVY });
      text(label, totX + 12, totY, 10.5, bold, rgb(1, 1, 1));
      text(value, totX + totW - 12 - bold.widthOfTextAtSize(value, 11.5), totY, 11.5, bold, rgb(1, 1, 1));
    } else {
      text(label, totX + 12, totY, 10, helv, MUTE);
      text(value, totX + totW - 12 - helv.widthOfTextAtSize(value, 10), totY, 10, helv, INK);
    }
    totY -= 22;
  };
  page.drawRectangle({ x: totX, y: totY - 7, width: totW, height: 70, borderColor: LINE, borderWidth: 1 });
  totRow('Operación gravada', money(opGravada.toFixed(2)));
  totRow('IGV (18%)', money(igv.toFixed(2)));
  totRow('IMPORTE TOTAL', money(base.toFixed(2)), true);

  // ── Sello de estado (pagado / por cobrar) ──────────────────────────────────
  const estadoLabel = input.estado === 'emitido' || input.estado === 'pagado' ? 'PAGO REGISTRADO' : 'EMITIDO';
  page.drawRectangle({ x: M, y: totY + 8, width: 150, height: 30, borderColor: BLUE, borderWidth: 1.2, color: SOFT });
  text(estadoLabel, M + 14, totY + 24, 9, bold, BLUE);
  text('Demo · trazabilidad en auditoría', M + 14, totY + 12, 7.5, helv, MUTE);

  // ── Pie ─────────────────────────────────────────────────────────────────────
  const footY = 64;
  page.drawLine({ start: { x: M, y: footY + 16 }, end: { x: PAGE_W - M, y: footY + 16 }, thickness: 1, color: LINE });
  const footer = wrap(
    'Documento visual de demostración. No constituye emisión electrónica SUNAT real; la integración tributaria se completa en el MVP. La trazabilidad operativa del viaje se conserva en la auditoría y la reserva asociada.',
    helv,
    8,
    PAGE_W - 2 * M,
  );
  let fy = footY + 4;
  for (const l of footer) {
    text(l, M, fy, 8, helv, MUTE);
    fy -= 11;
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

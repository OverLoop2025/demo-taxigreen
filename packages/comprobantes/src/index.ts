export { renderFallbackPdf } from './fallback-pdf';
export { renderComprobantePDF } from './render';
// Render primario (JS puro, sin Chromium): se ve igual en local y producción.
export { renderComprobantePdf } from './pdf-render';
export { renderComprobanteHtml } from './templates';
export type { ComprobanteTemplateInput, TipoComprobanteDemo } from './types';

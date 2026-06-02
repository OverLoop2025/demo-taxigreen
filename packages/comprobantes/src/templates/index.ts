import type { ComprobanteTemplateInput } from '../types';
import { renderBoletaHtml } from './boleta';
import { renderFacturaHtml } from './factura';
import { renderTicketHtml } from './ticket';

export function renderComprobanteHtml(input: ComprobanteTemplateInput) {
  switch (input.tipo) {
    case 'factura':
      return renderFacturaHtml(input);
    case 'ticket':
      return renderTicketHtml(input);
    case 'boleta':
      return renderBoletaHtml(input);
  }
}

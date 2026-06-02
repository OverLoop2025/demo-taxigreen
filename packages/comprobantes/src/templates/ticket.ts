import type { ComprobanteTemplateInput } from '../types';
import { escapeHtml, money, shell } from './common';

export function renderTicketHtml(input: ComprobanteTemplateInput) {
  return shell(
    input,
    'TICKET DE SERVICIO',
    `<section class="panel">
      <span class="label">Punto de encuentro</span>
      ${escapeHtml(input.puntoEncuentro ?? 'Por confirmar')}
    </section>
    <table>
      <thead><tr><th>Detalle</th><th>Valor</th></tr></thead>
      <tbody>
        <tr><td>Origen</td><td>${escapeHtml(input.origenTexto)}</td></tr>
        <tr><td>Destino</td><td>${escapeHtml(input.destinoTexto)}</td></tr>
        <tr><td>Importe</td><td>${escapeHtml(money(input.monto))}</td></tr>
      </tbody>
    </table>`,
  );
}

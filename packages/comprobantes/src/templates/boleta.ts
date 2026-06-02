import type { ComprobanteTemplateInput } from '../types';
import { escapeHtml, money, shell } from './common';

export function renderBoletaHtml(input: ComprobanteTemplateInput) {
  return shell(
    input,
    'BOLETA ELECTRÓNICA',
    `<section class="panel">
      <span class="label">Servicio</span>
      Recojo en aeropuerto con traslado formal y trazable.
    </section>
    <table>
      <thead><tr><th>Descripción</th><th>Ruta</th><th class="right">Importe</th></tr></thead>
      <tbody>
        <tr>
          <td>Servicio de taxi aeroportuario</td>
          <td>${escapeHtml(input.origenTexto)} → ${escapeHtml(input.destinoTexto)}</td>
          <td class="right">${escapeHtml(money(input.monto))}</td>
        </tr>
      </tbody>
    </table>
    <section class="total">
      <div><span>Subtotal</span><strong>${escapeHtml(money(input.monto))}</strong></div>
      <div><span>Total</span><strong>${escapeHtml(money(input.monto))}</strong></div>
    </section>`,
  );
}

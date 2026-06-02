import type { ComprobanteTemplateInput } from '../types';
import { escapeHtml, money, shell } from './common';

export function renderFacturaHtml(input: ComprobanteTemplateInput) {
  return shell(
    input,
    'FACTURA ELECTRÓNICA',
    `<section class="panel">
      <span class="label">Razón social referencial</span>
      ${escapeHtml(input.empresaNombre ?? 'Empresa cliente demo')}
    </section>
    <table>
      <thead><tr><th>Código</th><th>Descripción</th><th class="right">Importe</th></tr></thead>
      <tbody>
        <tr>
          <td>SERV-TAXI-AEP</td>
          <td>
            Recojo en aeropuerto: ${escapeHtml(input.origenTexto)} → ${escapeHtml(input.destinoTexto)}.
            ${input.vueloCodigo ? `Vuelo ${escapeHtml(input.vueloCodigo)}.` : ''}
          </td>
          <td class="right">${escapeHtml(money(input.monto))}</td>
        </tr>
      </tbody>
    </table>
    <section class="total">
      <div><span>Valor venta</span><strong>${escapeHtml(money(input.monto))}</strong></div>
      <div><span>IGV demo</span><strong>S/ 0.00</strong></div>
      <div><span>Total</span><strong>${escapeHtml(money(input.monto))}</strong></div>
    </section>`,
  );
}

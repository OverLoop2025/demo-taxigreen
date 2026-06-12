import type { TipoPago } from '../types';

export const PAGO_KEYWORDS: Record<TipoPago, string[]> = {
  efectivo: ['efectivo', 'cash', 'contra entrega'],
  voucher_hotel: ['voucher hotel', 'voucher', 'cargo al hotel', 'paga hotel', 'cuenta hotel'],
  factura_empresa: ['factura empresa', 'facturar a la empresa', 'crédito empresa', 'credito empresa', 'cargo a la empresa'],
  app_pago: ['yape', 'plin', 'tarjeta', 'link de pago', 'app', 'card', 'pos'],
};

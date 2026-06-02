import type { ComprobanteTemplateInput, TipoComprobanteDemo } from '@taxigreen/comprobantes';

type ComprobanteRecord = {
  id: string;
  tipo: TipoComprobanteDemo;
  serie: string;
  correlativo: number;
  monto: { toString(): string };
  estado: string;
  reserva: {
    pasajero_nombre: string;
    pasajero_dni: string | null;
    pasajero_ruc: string | null;
    empresa_nombre: string | null;
    origen_texto: string;
    destino_texto: string;
    punto_encuentro: string | null;
    vuelo_codigo: string | null;
    voucher_codigo: string;
  };
};

export function comprobanteToTemplateInput(comprobante: ComprobanteRecord): ComprobanteTemplateInput {
  return {
    id: comprobante.id,
    tipo: comprobante.tipo,
    serie: comprobante.serie,
    correlativo: comprobante.correlativo,
    monto: comprobante.monto.toString(),
    estado: comprobante.estado,
    pasajeroNombre: comprobante.reserva.pasajero_nombre,
    pasajeroDocumento: comprobante.reserva.pasajero_ruc ?? comprobante.reserva.pasajero_dni,
    empresaNombre: comprobante.reserva.empresa_nombre,
    origenTexto: comprobante.reserva.origen_texto,
    destinoTexto: comprobante.reserva.destino_texto,
    puntoEncuentro: comprobante.reserva.punto_encuentro,
    vueloCodigo: comprobante.reserva.vuelo_codigo,
    voucherCodigo: comprobante.reserva.voucher_codigo,
  };
}

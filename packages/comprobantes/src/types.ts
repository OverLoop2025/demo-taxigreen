export type TipoComprobanteDemo = 'boleta' | 'factura' | 'ticket';

export type ComprobanteTemplateInput = {
  id: string;
  tipo: TipoComprobanteDemo;
  serie: string;
  correlativo: number;
  monto: string;
  estado: string;
  pasajeroNombre: string;
  pasajeroDocumento?: string | null;
  empresaNombre?: string | null;
  origenTexto: string;
  destinoTexto: string;
  puntoEncuentro?: string | null;
  vueloCodigo?: string | null;
  voucherCodigo: string;
  fechaEmision?: Date;
};

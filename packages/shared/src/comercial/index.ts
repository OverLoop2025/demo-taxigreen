export type PerfilPasajero = 'particular' | 'corporativo' | 'hotel';
export type ResponsablePago = 'pasajero' | 'empresa' | 'hotel';
export type TipoPagoComercial = 'efectivo' | 'voucher_hotel' | 'factura_empresa' | 'app_pago' | string;

export type IdentidadComercial = {
  perfilPasajero: PerfilPasajero | string;
  responsablePago: ResponsablePago | string;
  convenioValidadoDemo?: boolean | null;
  requiereFactura?: boolean | null;
  empresaNombre?: string | null;
  hotelNombre?: string | null;
  tipoPago?: TipoPagoComercial | null;
};

function pretty(value: string | null | undefined) {
  if (!value) return null;
  return value.replaceAll('_', ' ');
}

export function perfilPasajeroHumano(value: PerfilPasajero | string | null | undefined) {
  switch (value) {
    case 'hotel':
      return 'Hotel';
    case 'corporativo':
      return 'Corporativo';
    case 'particular':
      return 'Particular';
    default:
      return pretty(value) ?? 'Particular';
  }
}

export function responsablePagoHumano(value: ResponsablePago | string | null | undefined) {
  switch (value) {
    case 'hotel':
      return 'paga el hotel';
    case 'empresa':
      return 'paga la empresa';
    case 'pasajero':
      return 'paga el pasajero';
    default:
      return pretty(value) ? `paga ${pretty(value)}` : 'paga el pasajero';
  }
}

export function metodoPagoFinalHumano(tipoPago: TipoPagoComercial | null | undefined) {
  switch (tipoPago) {
    case 'app_pago':
      return 'tarjeta/app al finalizar';
    case 'efectivo':
      return 'efectivo al finalizar';
    case 'voucher_hotel':
      return 'voucher hotel';
    case 'factura_empresa':
      return 'factura empresa';
    default:
      return 'pago al finalizar';
  }
}

export function pagadorComercialNombre(input: IdentidadComercial) {
  if (input.responsablePago === 'hotel') return input.hotelNombre ?? 'el hotel';
  if (input.responsablePago === 'empresa') return input.empresaNombre ?? 'la empresa';
  return 'el pasajero';
}

export function resumenComercialHumano(input: IdentidadComercial) {
  const perfil = perfilPasajeroHumano(input.perfilPasajero);
  const responsable = responsablePagoHumano(input.responsablePago);
  const convenio =
    input.responsablePago !== 'pasajero' && input.convenioValidadoDemo ? ' · convenio demo validado' : '';
  const factura = input.requiereFactura ? ' · requiere factura' : '';
  return `${perfil} · ${responsable}${convenio}${factura}`;
}

export function pagoChatHumano(input: IdentidadComercial) {
  if (input.responsablePago === 'hotel') {
    return `Pago: lo cubre ${pagadorComercialNombre(input)}`;
  }
  if (input.responsablePago === 'empresa') {
    return `Pago: lo cubre ${pagadorComercialNombre(input)}`;
  }
  return `Pago: ${metodoPagoFinalHumano(input.tipoPago)}`;
}

export function pagoPasajeroHumano(input: IdentidadComercial) {
  if (input.responsablePago === 'hotel') {
    return `Cubierto por ${pagadorComercialNombre(input)}. No se te cobrará este servicio.`;
  }
  if (input.responsablePago === 'empresa') {
    return `Cubierto por ${pagadorComercialNombre(input)}. No se te cobrará este servicio.`;
  }
  return `Pagas al finalizar el viaje: ${metodoPagoFinalHumano(input.tipoPago)}.`;
}

export function pagoMostradorHumano(input: IdentidadComercial) {
  if (input.responsablePago === 'hotel') return `Cubierto por ${pagadorComercialNombre(input)}`;
  if (input.responsablePago === 'empresa') return `Cubierto por ${pagadorComercialNombre(input)}`;
  return `Paga el pasajero al finalizar: ${metodoPagoFinalHumano(input.tipoPago)}`;
}

export function pagoConductorHumano(input: IdentidadComercial) {
  if (input.responsablePago === 'hotel') return 'Cargo al hotel - no cobres al pasajero';
  if (input.responsablePago === 'empresa') return 'Cargo a la empresa - no cobres al pasajero';
  if (input.tipoPago === 'app_pago') return 'Pago por app al finalizar';
  if (input.tipoPago === 'efectivo') return 'Cobra al finalizar: efectivo';
  return `Cobra al finalizar: ${metodoPagoFinalHumano(input.tipoPago)}`;
}

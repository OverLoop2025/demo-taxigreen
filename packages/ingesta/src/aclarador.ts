const PREGUNTAS: Record<string, string> = {
  tipo_viaje: '¿El servicio es recojo en aeropuerto, traslado al aeropuerto o city?',
  solicitante_tipo: '¿Quién solicita el servicio: hotel, empresa o pasajero directo?',
  pasajero_nombre: '¿A nombre de quién va la reserva?',
  pasajero_telefono: '¿Cuál es el teléfono del pasajero?',
  origen_texto: '¿Desde dónde te recogemos? Puedes escribir la dirección o marcarla en el mapa.',
  destino_texto: '¿A qué dirección vas? Puedes escribirla o marcarla en el mapa.',
  fecha_hora_servicio: '¿Para qué fecha y hora necesitas el servicio?',
  vuelo_codigo: '¿Cuál es el número de vuelo?',
  punto_encuentro: '¿Cuál será el punto de encuentro?',
  tipo_pago: '¿El pago será efectivo, voucher hotel, factura empresa o app?',
  perfil_pasajero: '¿La reserva es personal o va asociada a una empresa u hotel?',
  responsable_pago: '¿El servicio lo cubre la empresa/hotel o lo pagas tú?',
  empresa_nombre: '¿A nombre de qué empresa va el servicio?',
  pasajero_ruc: '¿Cuál es el RUC de la empresa para cargar el pago a su cuenta?',
  hotel_nombre: '¿Desde qué hotel se solicita el servicio?',
};

export function preguntasParaCampos(campos: string[]): string[] {
  return campos.map((campo) => PREGUNTAS[campo]).filter((pregunta): pregunta is string => Boolean(pregunta));
}

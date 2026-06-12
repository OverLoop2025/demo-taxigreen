const PREGUNTAS: Record<string, string> = {
  tipo_viaje: '¿El servicio es recojo en aeropuerto, traslado al aeropuerto o city?',
  solicitante_tipo: '¿Quién solicita el servicio: hotel, empresa o pasajero directo?',
  pasajero_nombre: '¿Cuál es el nombre del pasajero?',
  pasajero_telefono: '¿Cuál es el teléfono del pasajero?',
  origen_texto: '¿Cuál es el punto exacto de origen?',
  destino_texto: '¿Cuál es la dirección de destino?',
  fecha_hora_servicio: '¿Para qué fecha y hora exacta se programa el servicio?',
  vuelo_codigo: '¿Cuál es el número de vuelo?',
  punto_encuentro: '¿Cuál será el punto de encuentro en llegadas?',
  tipo_pago: '¿El pago será efectivo, voucher hotel, factura empresa o app?',
  perfil_pasajero: '¿La reserva es particular o va asociada a una empresa u hotel?',
  responsable_pago: '¿El servicio lo cubre la empresa/hotel o lo pagarás tú?',
};

export function preguntasParaCampos(campos: string[]): string[] {
  return campos.map((campo) => PREGUNTAS[campo]).filter((pregunta): pregunta is string => Boolean(pregunta));
}

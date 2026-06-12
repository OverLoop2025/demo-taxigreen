import type { ExtractorInput } from '../types';

export type WhatsappCaso = {
  nombre: string;
  input: ExtractorInput;
  esperadoMinimo: Record<string, string | number | null>;
};

export const FECHA_REFERENCIA_S4 = '2026-05-31T12:00:00-05:00';

export const WHATSAPP_CASOS_S4: WhatsappCaso[] = [
  {
    nombre: 'protagonista hotel jorge chavez pardo',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Hola, soy Mariana del Hilton Lima Miraflores. Necesito recojo en el Jorge Chávez para la huésped Valeria Mendoza. Llega mañana 03:45 en vuelo LA2456. Punto de encuentro Salida 3 columna F2. Destino Av. Pardo 123, Miraflores. Tel pasajera +51 988777666. Mi contacto +51 999111222. 2 pasajeros, 2 maletas. Pago voucher hotel.',
    },
    esperadoMinimo: {
      tipo_viaje: 'recojo_aeropuerto',
      solicitante_tipo: 'hotel',
      origen_texto: 'Aeropuerto Jorge Chávez - Llegadas',
      destino_texto: 'Av. Pardo 123, Miraflores',
      vuelo_codigo: 'LA2456',
      punto_encuentro: 'Salida 3, columna F2',
      tipo_pago: 'voucher_hotel',
    },
  },
  {
    nombre: 'empresa factura san isidro al aeropuerto',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Empresa ACME solicita traslado al aeropuerto desde San Isidro para pasajero Diego Lama. Mañana 21:10, vuelo CM132, tel pasajero 987654321, factura con RUC 20100070970.',
    },
    esperadoMinimo: {
      solicitante_tipo: 'empresa',
      tipo_viaje: 'traslado_aeropuerto',
      tipo_pago: 'factura_empresa',
    },
  },
  {
    nombre: 'pasajera directa efectivo miraflores',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Hola soy Paula Rivas, necesito taxi city a Miraflores hoy 18:30, pago efectivo, mi celular 955111222.',
    },
    esperadoMinimo: { solicitante_tipo: 'pasajero', tipo_viaje: 'city', tipo_pago: 'efectivo' },
  },
  {
    nombre: 'casa andina voucher',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Recepción Casa Andina: recojo aeropuerto para pasajero Marco del Río, vuelo AV141, mañana 06:20. Destino Av. Pardo 123 Miraflores. Voucher hotel. Tel pasajero 966111222.',
    },
    esperadoMinimo: { solicitante_tipo: 'hotel', tipo_pago: 'voucher_hotel' },
  },
  {
    nombre: 'jw marriott app pago',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'JW Marriott pide recojo en LIM para huésped Nora Salas pasado mañana 10:05, vuelo DL150. Destino Barranco. Pago con link de pago, tel huésped 944555666.',
    },
    esperadoMinimo: { hotel_nombre: 'JW Marriott Lima', tipo_pago: 'app_pago' },
  },
  {
    nombre: 'counter llamada manual',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Cliente en counter: pasajera Rosa Pérez llega 13:40 vuelo H2552, destino San Borja, 1 pasajero, 0 maletas, efectivo, tel 988000111.',
    },
    esperadoMinimo: { tipo_viaje: 'recojo_aeropuerto', tipo_pago: 'efectivo' },
  },
  {
    nombre: 'turista a surco con tarjeta',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Hi, taxi from airport to Surco for passenger Carlos Webb tomorrow 09:15 flight AA988, card payment, phone +51 933222111.',
    },
    esperadoMinimo: { tipo_pago: 'app_pago' },
  },
  {
    nombre: 'hotel b barranco',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Hotel B solicita recojo Jorge Chavez para huésped Ana María Solís, vuelo UX175, mañana 05:55, dejar en Barranco. Voucher. Tel huésped 900111222.',
    },
    esperadoMinimo: { hotel_nombre: 'Hotel B', tipo_pago: 'voucher_hotel' },
  },
  {
    nombre: 'empresa ruc invalido no debe aceptar',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Empresa pide traslado al aeropuerto desde Miraflores para pasajero Luis Nuñez mañana 19:20, RUC 20123456789, factura, tel pasajero 977111222.',
    },
    esperadoMinimo: {
      pasajero_ruc: null,
      perfil_pasajero: 'corporativo',
      responsable_pago: 'pasajero',
      tipo_pago: null,
    },
  },
  {
    nombre: 'pago yape',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Necesito recojo aeropuerto para pasajera Silvia Rojas mañana 11:15 vuelo KL744, destino San Isidro, pago yape, cel pasajera 922333444.',
    },
    esperadoMinimo: { tipo_pago: 'app_pago' },
  },
  {
    nombre: 'falta destino',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Concierge hotel: recojo Jorge Chávez para huésped Mateo Ruiz mañana 03:45 vuelo LA2456, voucher hotel, tel huésped 911222333.',
    },
    esperadoMinimo: { destino_texto: null },
  },
  {
    nombre: 'falta hora',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Recojo en aeropuerto para pasajero Renata Flores, vuelo LA2456, destino Av. Pardo 123, Miraflores, efectivo, tel 944111222.',
    },
    esperadoMinimo: { fecha_hora_servicio: null },
  },
  {
    nombre: 'dni valido',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Pasajero Jorge León DNI 44556677, recojo aeropuerto mañana 14:30 vuelo LA2456, destino Miraflores, efectivo, tel 933111222.',
    },
    esperadoMinimo: { pasajero_dni: '44556677' },
  },
  {
    nombre: 'pasado manana',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Hotel solicita recojo aeropuerto para pasajera Carla Mena pasado mañana 07:00 vuelo LP221, destino San Isidro, voucher hotel, tel pasajera 944222333.',
    },
    esperadoMinimo: { tipo_viaje: 'recojo_aeropuerto' },
  },
  {
    nombre: 'city incompleto pide aclaracion',
    input: {
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje: 'Necesito un taxi bonito mañana.',
    },
    esperadoMinimo: { destino_texto: null, tipo_pago: null },
  },
];

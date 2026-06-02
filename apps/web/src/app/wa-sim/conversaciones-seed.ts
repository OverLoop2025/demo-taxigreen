export type ConversacionSeed = {
  id: string;
  nombre: string;
  subtitulo: string;
  fuente: string;
  mensajes: Array<{
    id: string;
    autor: 'cliente' | 'taxigreen';
    texto: string;
    hora: string;
  }>;
};

export const FECHA_SIMULADOR_ISO = '2026-05-31T12:00:00-05:00';

export const conversacionesSeed: ConversacionSeed[] = [
  {
    id: 'protagonista-hotel',
    nombre: 'Hilton Lima Miraflores',
    subtitulo: 'Recojo aeropuerto · voucher hotel',
    fuente: 'WhatsApp oficial',
    mensajes: [
      {
        id: 'm1',
        autor: 'cliente',
        hora: '20:14',
        texto:
          'Hola, soy Mariana del Hilton Lima Miraflores. Necesito recojo en el Jorge Chávez para la huésped Valeria Mendoza. Llega mañana 03:45 en vuelo LA2456. Punto de encuentro Salida 3 columna F2. Destino Av. Pardo 123, Miraflores. Tel pasajera +51 988777666. Mi contacto +51 999111222. 2 pasajeros, 2 maletas. Pago voucher hotel.',
      },
      {
        id: 'm2',
        autor: 'taxigreen',
        hora: '20:15',
        texto: 'Recibido. Validamos datos y dejamos la reserva lista para despacho.',
      },
    ],
  },
  {
    id: 'empresa-factura',
    nombre: 'ACME Perú',
    subtitulo: 'Traslado al aeropuerto · factura',
    fuente: 'WhatsApp empresa',
    mensajes: [
      {
        id: 'm1',
        autor: 'cliente',
        hora: '09:41',
        texto:
          'Empresa ACME solicita traslado al aeropuerto desde San Isidro para pasajero Diego Lama. Mañana 21:10, vuelo CM132, tel pasajero 987654321, factura con RUC 20100070970.',
      },
    ],
  },
  {
    id: 'incompleta-aclaracion',
    nombre: 'Hotel aliado',
    subtitulo: 'Mensaje incompleto · requiere aclaración',
    fuente: 'WhatsApp manual',
    mensajes: [
      {
        id: 'm1',
        autor: 'cliente',
        hora: '17:08',
        texto:
          'Concierge hotel: recojo Jorge Chávez para huésped Mateo Ruiz mañana 03:45 vuelo LA2456, voucher hotel, tel huésped 911222333.',
      },
    ],
  },
];

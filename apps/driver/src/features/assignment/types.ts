export type EstadoViaje =
  | 'asignado'
  | 'en_camino'
  | 'en_punto'
  | 'a_bordo'
  | 'finalizado'
  | 'cancelado';

export type EstadoReserva =
  | 'ingesta_pendiente'
  | 'necesita_revision'
  | 'confirmada'
  | 'asignada'
  | 'en_curso'
  | 'finalizada'
  | 'por_liquidar'
  | 'cancelada';

export type Coordinates = {
  texto: string;
  lat: number | null;
  lng: number | null;
};

export type DriverAssignment = {
  id: string;
  voucherCodigo: string;
  tipoViaje: string;
  fechaHoraServicio: string;
  estadoReserva: EstadoReserva;
  pasajero: {
    nombre: string;
    telefono: string;
    email: string | null;
    dni: string | null;
  };
  vuelo: {
    codigo: string | null;
  };
  origen: Coordinates;
  puntoEncuentro: string | null;
  destino: Coordinates;
  voucher: {
    codigo: string;
    emitidoEn: string | null;
    tokenPasajero: string;
  };
  viaje: {
    id: string;
    estado: EstadoViaje;
    inicioEnCamino: string | null;
    llegadaPunto: string | null;
    pasajeroABordo: string | null;
    finalizadoEn: string | null;
    updatedAt: string;
  } | null;
  conductor: {
    id: string;
    nombre: string;
    telefono: string | null;
    rating: number;
    totalViajes: number;
  };
  unidad: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    tipo: string;
    capacidad: number;
    color: string | null;
    anio: number | null;
  } | null;
};

export type AssignmentStateResponse = {
  ok: true;
  broadcast: unknown;
  asignacion: DriverAssignment;
};

export type DriverTripSummary = {
  id: string;
  tipoViaje: string;
  fechaHoraServicio: string;
  estadoReserva: EstadoReserva;
  estadoViaje: EstadoViaje | null;
  finalizadoEn: string | null;
  activo: boolean;
  pasajeroNombre: string;
  origenTexto: string;
  destinoTexto: string;
  vueloCodigo: string | null;
  unidadEtiqueta: string | null;
};

export type DriverTripsResponse = {
  activos: DriverTripSummary[];
  historial: DriverTripSummary[];
};

export type NextTripAction = {
  estado: EstadoViaje;
  label: string;
  helper: string;
};

export type DriverIncidentPayload = {
  incidenciaId: string;
  reservaId: string;
  tipologia: string;
  estado: string;
  descripcion: string;
  receivedAt: string;
};

export type DriverIncidentResponse = {
  ok: true;
  incidencia: {
    id: string;
    reserva_id: string;
    estado: string;
    descripcion: string;
  };
  broadcast: unknown;
};

export type DriverIncidentAnswer = 'encontrado' | 'no_visto' | 'revisar';

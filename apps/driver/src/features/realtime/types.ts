export type AssignmentPayload = {
  reservaId: string;
  conductorId: string | null;
  vehiculoId: string | null;
  receivedAt: string;
};

export type IncidentPayload = {
  incidenciaId: string;
  reservaId: string;
  tipologia: string;
  estado: string;
  descripcion: string;
  receivedAt: string;
};

export type BoardingPayload = {
  reservaId: string;
  conductorId: string | null;
  counterValidadoEn: string;
  receivedAt: string;
};

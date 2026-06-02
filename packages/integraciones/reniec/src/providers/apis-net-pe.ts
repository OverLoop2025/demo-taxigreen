import type { DocumentoPayload, DocumentoTipo } from '../types';

export class DocumentoLookupUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentoLookupUnavailableError';
  }
}

type ApiPersona = {
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  numeroDocumento?: string;
  nombre?: string;
  razonSocial?: string;
  ruc?: string;
};

function endpoint(tipo: DocumentoTipo, documento: string) {
  const baseUrl = tipo === 'dni' ? 'https://api.apis.net.pe/v2/reniec/dni' : 'https://api.apis.net.pe/v2/sunat/ruc';
  return `${baseUrl}?numero=${encodeURIComponent(documento)}`;
}

export async function lookupApisNetPe(tipo: DocumentoTipo, documento: string): Promise<DocumentoPayload> {
  const token = process.env.RENIEC_API_TOKEN;
  if (!token) {
    throw new DocumentoLookupUnavailableError('RENIEC_API_TOKEN no configurado');
  }

  const response = await fetch(endpoint(tipo, documento), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new DocumentoLookupUnavailableError(`APIs.net.pe respondió ${response.status}`);
  }

  const payload = (await response.json()) as ApiPersona;
  return {
    tipo,
    documento: payload.numeroDocumento ?? payload.ruc ?? documento,
    nombres: payload.nombres ?? payload.nombre ?? payload.razonSocial ?? '',
    apellidoPaterno: payload.apellidoPaterno,
    apellidoMaterno: payload.apellidoMaterno,
    razonSocial: payload.razonSocial,
    fuente: 'apis_net_pe',
  };
}

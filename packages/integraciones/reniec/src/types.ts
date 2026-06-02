export type DocumentoTipo = 'dni' | 'ruc';

export type DocumentoPayload = {
  tipo: DocumentoTipo;
  documento: string;
  nombres: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  razonSocial?: string;
  fuente: 'cache' | 'apis_net_pe';
};

export type LookupDocumentoInput = {
  tipo: DocumentoTipo;
  documento: string;
};

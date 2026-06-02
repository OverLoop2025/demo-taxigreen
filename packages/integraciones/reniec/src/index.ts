import { getCachedDocumento, setCachedDocumento } from './cache';
import { DocumentoLookupUnavailableError, lookupApisNetPe } from './providers/apis-net-pe';
import type { DocumentoPayload, LookupDocumentoInput } from './types';

export async function lookupDocumento({
  tipo,
  documento,
}: LookupDocumentoInput): Promise<{ payload: DocumentoPayload; cacheHit: boolean }> {
  const cached = getCachedDocumento(tipo, documento);
  if (cached) {
    return { payload: cached, cacheHit: true };
  }

  const payload = await lookupApisNetPe(tipo, documento);
  setCachedDocumento(payload);
  return { payload, cacheHit: false };
}

export { DEMO_DOCUMENTOS, getCachedDocumento, seedDemoCache } from './cache';
export { DocumentoLookupUnavailableError };
export type { DocumentoPayload, DocumentoTipo, LookupDocumentoInput } from './types';

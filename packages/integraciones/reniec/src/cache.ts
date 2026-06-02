import type { DocumentoPayload, DocumentoTipo } from './types';

const TTL_MS = 30 * 60 * 1000;

type CacheEntry = {
  payload: DocumentoPayload;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

export const DEMO_DOCUMENTOS: DocumentoPayload[] = [
  {
    tipo: 'dni',
    documento: '44556677',
    nombres: 'Valeria',
    apellidoPaterno: 'Mendoza',
    apellidoMaterno: 'Rojas',
    fuente: 'cache',
  },
  {
    tipo: 'dni',
    documento: '12345678',
    nombres: 'Carla',
    apellidoPaterno: 'Torres',
    apellidoMaterno: 'Salinas',
    fuente: 'cache',
  },
  {
    tipo: 'dni',
    documento: '87654321',
    nombres: 'Raúl',
    apellidoPaterno: 'Quispe',
    apellidoMaterno: 'Flores',
    fuente: 'cache',
  },
];

function key(tipo: DocumentoTipo, documento: string) {
  return `${tipo}:${documento}`;
}

export function seedDemoCache(now = Date.now()) {
  for (const payload of DEMO_DOCUMENTOS) {
    cache.set(key(payload.tipo, payload.documento), {
      payload,
      expiresAt: now + TTL_MS,
    });
  }
}

export function getCachedDocumento(tipo: DocumentoTipo, documento: string, now = Date.now()) {
  const entry = cache.get(key(tipo, documento));
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    cache.delete(key(tipo, documento));
    return null;
  }
  return entry.payload;
}

export function setCachedDocumento(payload: DocumentoPayload, now = Date.now()) {
  cache.set(key(payload.tipo, payload.documento), {
    payload,
    expiresAt: now + TTL_MS,
  });
}

seedDemoCache();

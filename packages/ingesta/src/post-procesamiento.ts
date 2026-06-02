import * as chrono from 'chrono-node';
import { AEROPUERTOS } from './diccionarios/aeropuertos';
import { DIRECCIONES_CANONICAS } from './diccionarios/zonas-lima';
import { PAGO_KEYWORDS } from './diccionarios/pagos-keywords';
import { PREFIJOS_VUELO } from './diccionarios/vuelos-prefijos';
import type { DireccionNormalizada, TipoPago } from './types';

const LIMA_TZ = 'America/Lima';

export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function limpiarNombre(nombre: string): string {
  return nombre
    .replace(/\s+/g, ' ')
    .replace(/[.,;:]+$/g, '')
    .trim();
}

export function extraerTelefono(texto: string, contexto?: RegExp): string | null {
  const area = contexto?.exec(texto)?.[0] ?? texto;
  const match = /(?:\+?51[\s-]*)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/.exec(area);
  if (!match) return null;
  const digits = match[0].replace(/\D/g, '');
  const national = digits.length > 9 ? digits.slice(-9) : digits;
  return national.length === 9 ? `+51${national}` : null;
}

export function extraerDni(texto: string): string | null {
  const match = /\b\d{8}\b/.exec(texto);
  return match?.[0] ?? null;
}

export function extraerRuc(texto: string): string | null {
  const match = /\b(?:10|20)\d{9}\b/.exec(texto);
  if (!match) return null;
  return validarRuc(match[0]) ? match[0] : null;
}

export function validarRuc(ruc: string): boolean {
  if (!/^(10|20)\d{9}$/.test(ruc)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, weight, index) => acc + Number(ruc[index]) * weight, 0);
  const remainder = sum % 11;
  const check = remainder < 2 ? 0 : 11 - remainder;
  return check === Number(ruc[10]);
}

export function extraerVuelo(texto: string): string | null {
  const prefijos = PREFIJOS_VUELO.join('|');
  const match = new RegExp(`\\b(${prefijos})\\s?-?\\s?(\\d{3,4})\\b`, 'i').exec(texto);
  if (!match?.[1] || !match[2]) return null;
  return `${match[1].toUpperCase()}${match[2]}`;
}

export function detectarTipoPago(texto: string): TipoPago | null {
  const normalized = normalizarTexto(texto);
  const entries = Object.entries(PAGO_KEYWORDS) as Array<[TipoPago, string[]]>;
  for (const [tipo, keywords] of entries) {
    if (keywords.some((keyword) => normalized.includes(normalizarTexto(keyword)))) {
      return tipo;
    }
  }
  return null;
}

export function detectarAeropuerto(texto: string) {
  const normalized = normalizarTexto(texto);
  return (
    AEROPUERTOS.find((aeropuerto) =>
      aeropuerto.keywords.some((keyword) => normalized.includes(normalizarTexto(keyword))),
    ) ?? null
  );
}

export function extraerPuntoEncuentro(texto: string): string | null {
  const match = /salida\s*([0-9a-z]+).*?columna\s*([a-z][0-9]?|[0-9]+)/iu.exec(texto);
  if (!match?.[1] || !match[2]) return null;
  return `Salida ${match[1].toUpperCase()}, columna ${match[2].toUpperCase()}`;
}

export function normalizarDireccion(texto: string): DireccionNormalizada | null {
  const normalized = normalizarTexto(texto);
  const direct = DIRECCIONES_CANONICAS.find((direccion) =>
    direccion.aliases.some((alias) => normalized.includes(normalizarTexto(alias))),
  );
  if (direct) {
    return { texto: direct.texto, lat: direct.lat, lng: direct.lng };
  }

  const destinoMatch =
    /(?:destino|a|hacia|llevar(?:lo|la)? a|dejar(?:lo|la)? en)\s+([^.;\n]+(?:miraflores|san isidro|barranco|surco|san borja)[^.;\n]*)/iu.exec(
      texto,
    );
  const extracted = destinoMatch?.[1]?.trim();
  if (extracted) {
    const zona = DIRECCIONES_CANONICAS.find((direccion) =>
      direccion.aliases.some((alias) => normalizarTexto(extracted).includes(normalizarTexto(alias))),
    );
    return {
      texto: limpiarNombre(extracted),
      lat: zona?.lat ?? null,
      lng: zona?.lng ?? null,
    };
  }

  return null;
}

function limaParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day') };
}

function limaIso(year: number, month: number, day: number, hour: number, minute: number): string {
  return new Date(Date.UTC(year, month - 1, day, hour + 5, minute, 0, 0)).toISOString();
}

function extraerHora(texto: string): { hour: number; minute: number } | null {
  const match =
    /(?:a las|mañana|manana|pasado mañana|pasado manana|llega|llegada|hora|para|programa(?:r)?).*?\b([01]?\d|2[0-3])[:h.]([0-5]\d)\b/iu.exec(
      texto,
    ) ?? /\b([01]?\d|2[0-3])[:h.]([0-5]\d)\b/u.exec(texto);
  if (!match?.[1] || !match[2]) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function dayOffset(texto: string): number | null {
  const normalized = normalizarTexto(texto);
  if (normalized.includes('pasado manana')) return 2;
  if (normalized.includes('manana')) return 1;
  if (normalized.includes('hoy')) return 0;
  return null;
}

export function extraerFechaHoraServicio(texto: string, fechaActualIso?: string): string | null {
  const referencia = fechaActualIso ? new Date(fechaActualIso) : new Date();
  const hora = extraerHora(texto);
  const offset = dayOffset(texto);

  if (hora && offset !== null) {
    const base = limaParts(referencia);
    return limaIso(base.year, base.month, base.day + offset, hora.hour, hora.minute);
  }

  const parsed = chrono.es.parseDate(
    texto,
    { instant: referencia, timezone: LIMA_TZ },
    { forwardDate: true },
  );
  if (!parsed) return null;

  if (hora) {
    const parsedParts = limaParts(parsed);
    return limaIso(parsedParts.year, parsedParts.month, parsedParts.day, hora.hour, hora.minute);
  }

  return parsed.toISOString();
}

export function extraerCantidad(texto: string, keyword: 'pasajeros' | 'maletas'): number | null {
  const plural =
    keyword === 'pasajeros'
      ? /(\d+)\s*(?:pasajeros|pax|personas|adultos)\b/iu
      : /(\d+)\s*(?:maletas|equipajes|bags|valijas)\b/iu;
  const match = plural.exec(texto);
  return match?.[1] ? Number(match[1]) : null;
}

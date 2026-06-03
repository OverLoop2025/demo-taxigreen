export type TipologiaBienestar = 'objeto_olvidado' | 'otro';
export type SeveridadBienestar = 'baja' | 'media';

export type ClasificacionIncidencia = {
  tipologia: TipologiaBienestar;
  severidad: SeveridadBienestar;
  confianza: number;
  fuente: 'algoritmo';
  motivo: string;
  señales: string[];
};

const ACCENTED = /[\u0300-\u036f]/g;

const LOSS_KEYWORDS = [
  'olvide',
  'olvidé',
  'olvido',
  'olvidó',
  'deje',
  'dejé',
  'dejo',
  'dejó',
  'perdi',
  'perdí',
  'perdio',
  'perdió',
  'extravio',
  'extravió',
];

const OBJECT_KEYWORDS = [
  'cartera',
  'billetera',
  'casaca',
  'chompa',
  'mochila',
  'maleta',
  'bolso',
  'bolsa',
  'celular',
  'telefono',
  'teléfono',
  'laptop',
  'tablet',
  'documento',
  'dni',
  'pasaporte',
  'llaves',
  'lentes',
  'audifonos',
  'audífonos',
];

const MEDIUM_SEVERITY_KEYWORDS = [
  'cartera',
  'billetera',
  'celular',
  'telefono',
  'teléfono',
  'laptop',
  'tablet',
  'documento',
  'dni',
  'pasaporte',
  'llaves',
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(ACCENTED, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findSignals(text: string, candidates: string[]) {
  const normalizedCandidates = candidates.map(normalize);
  return normalizedCandidates.filter((candidate) => text.includes(candidate));
}

export function clasificarIncidenciaDeterminista(descripcion: string): ClasificacionIncidencia {
  const text = normalize(descripcion);
  const lossSignals = findSignals(text, LOSS_KEYWORDS);
  const objectSignals = findSignals(text, OBJECT_KEYWORDS);
  const signals = [...new Set([...lossSignals, ...objectSignals])];

  if (lossSignals.length > 0 || objectSignals.length > 0) {
    const severitySignals = findSignals(text, MEDIUM_SEVERITY_KEYWORDS);
    const severidad: SeveridadBienestar = severitySignals.length > 0 ? 'media' : 'baja';
    return {
      tipologia: 'objeto_olvidado',
      severidad,
      confianza: lossSignals.length > 0 && objectSignals.length > 0 ? 0.96 : 0.82,
      fuente: 'algoritmo',
      motivo:
        severidad === 'media'
          ? 'Objeto olvidado con posible valor/documento; requiere seguimiento cercano.'
          : 'Reporte compatible con objeto olvidado de baja criticidad.',
      señales: signals,
    };
  }

  return {
    tipologia: 'otro',
    severidad: 'baja',
    confianza: 0.35,
    fuente: 'algoritmo',
    motivo: 'No hay señales suficientes de objeto olvidado dentro del alcance demo.',
    señales: [],
  };
}

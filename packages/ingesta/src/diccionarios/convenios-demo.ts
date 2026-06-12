import { normalizarTexto } from '../post-procesamiento';

export type ConvenioDemo = {
  nombre: string;
  tipo: 'empresa' | 'hotel';
  aliases: string[];
};

export const CONVENIOS_DEMO: ConvenioDemo[] = [
  {
    nombre: 'ACME Perú',
    tipo: 'empresa',
    aliases: ['acme', 'acme peru', 'acme perú', 'empresa acme'],
  },
  {
    nombre: 'Andes Corporate Travel',
    tipo: 'empresa',
    aliases: ['andes corporate', 'andes corporate travel', 'grupo andes'],
  },
  {
    nombre: 'Hotel Costa Verde',
    tipo: 'hotel',
    aliases: ['hotel costa verde', 'costa verde'],
  },
  {
    nombre: 'Hilton Lima Miraflores',
    tipo: 'hotel',
    aliases: ['hilton', 'hilton lima', 'hilton miraflores'],
  },
];

export function detectarConvenioDemo(texto: string, tipo?: ConvenioDemo['tipo']) {
  const normalized = normalizarTexto(texto);
  return (
    CONVENIOS_DEMO.find((convenio) => {
      if (tipo && convenio.tipo !== tipo) return false;
      return convenio.aliases.some((alias) => normalized.includes(normalizarTexto(alias)));
    }) ?? null
  );
}

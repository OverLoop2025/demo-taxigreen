import type { DireccionNormalizada } from '../types';

export type ZonaLima = DireccionNormalizada & {
  aliases: string[];
};

export const DIRECCIONES_CANONICAS: ZonaLima[] = [
  {
    texto: 'Av. Pardo 123, Miraflores',
    lat: -12.1196,
    lng: -77.0365,
    aliases: ['av pardo 123', 'avenida pardo 123', 'pardo 123', 'av. pardo 123'],
  },
  {
    texto: 'San Isidro, Lima',
    lat: -12.0975,
    lng: -77.0364,
    aliases: ['san isidro'],
  },
  {
    texto: 'Barranco, Lima',
    lat: -12.1459,
    lng: -77.0217,
    aliases: ['barranco'],
  },
  {
    texto: 'Surco, Lima',
    lat: -12.145,
    lng: -76.9915,
    aliases: ['surco', 'santiago de surco'],
  },
  {
    texto: 'San Borja, Lima',
    lat: -12.1079,
    lng: -76.9994,
    aliases: ['san borja'],
  },
  {
    texto: 'Miraflores, Lima',
    lat: -12.1211,
    lng: -77.0297,
    aliases: ['miraflores'],
  },
];

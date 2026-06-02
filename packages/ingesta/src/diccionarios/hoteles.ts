export type HotelCanonico = {
  nombre: string;
  aliases: string[];
};

export const HOTELES: HotelCanonico[] = [
  {
    nombre: 'Hilton Lima Miraflores',
    aliases: ['hilton', 'hilton lima', 'hilton miraflores'],
  },
  {
    nombre: 'Casa Andina Premium Miraflores',
    aliases: ['casa andina', 'casa andina premium'],
  },
  {
    nombre: 'JW Marriott Lima',
    aliases: ['jw marriott', 'marriott lima'],
  },
  {
    nombre: 'Hotel B',
    aliases: ['hotel b', 'hotel barranco'],
  },
];

export const HOTEL_KEYWORDS = ['hotel', 'concierge', 'recepcion', 'recepción', 'counter hotel'];

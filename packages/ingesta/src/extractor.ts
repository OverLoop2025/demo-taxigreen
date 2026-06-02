import { preguntasParaCampos } from './aclarador';
import { HOTELES, HOTEL_KEYWORDS } from './diccionarios/hoteles';
import {
  detectarAeropuerto,
  detectarTipoPago,
  extraerCantidad,
  extraerDni,
  extraerFechaHoraServicio,
  extraerPuntoEncuentro,
  extraerRuc,
  extraerTelefono,
  extraerVuelo,
  limpiarNombre,
  normalizarDireccion,
  normalizarTexto,
} from './post-procesamiento';
import {
  extractorInputSchema,
  extraccionReservaResultadoSchema,
  type ExtractorInput,
  type ExtraccionReservaResultado,
  type ReservaExtraida,
  type SolicitanteTipo,
  type TipoViaje,
} from './types';

const CAMPOS_BASE: string[] = [
  'tipo_viaje',
  'solicitante_tipo',
  'pasajero_nombre',
  'pasajero_telefono',
  'origen_texto',
  'destino_texto',
  'fecha_hora_servicio',
  'tipo_pago',
] as const;

const CAMPOS_AEROPUERTO = ['vuelo_codigo', 'punto_encuentro'];

function baseReserva(mensaje: string): ReservaExtraida {
  return {
    canal_origen: 'whatsapp_oficial',
    tipo_viaje: null,
    solicitante_tipo: null,
    solicitante_nombre: null,
    solicitante_contacto: null,
    pasajero_nombre: null,
    pasajero_telefono: null,
    pasajero_email: null,
    pasajero_dni: null,
    pasajero_ruc: null,
    origen_texto: null,
    origen_lat: null,
    origen_lng: null,
    destino_texto: null,
    destino_lat: null,
    destino_lng: null,
    punto_encuentro: null,
    fecha_hora_servicio: null,
    vuelo_codigo: null,
    tipo_pago: null,
    pasajeros: null,
    maletas: null,
    hotel_nombre: null,
    empresa_nombre: null,
    raw_texto: mensaje,
  };
}

function detectarHotel(texto: string): string | null {
  const normalized = normalizarTexto(texto);
  const hotel = HOTELES.find((candidate) =>
    candidate.aliases.some((alias) => normalized.includes(normalizarTexto(alias))),
  );
  if (hotel) return hotel.nombre;
  return HOTEL_KEYWORDS.some((keyword) => normalized.includes(normalizarTexto(keyword)))
    ? 'Concierge hotel'
    : null;
}

function detectarSolicitante(texto: string): {
  tipo: SolicitanteTipo;
  nombre: string | null;
  hotelNombre: string | null;
  empresaNombre: string | null;
} {
  const hotel = detectarHotel(texto);
  if (hotel) {
    return { tipo: 'hotel', nombre: hotel, hotelNombre: hotel, empresaNombre: null };
  }

  const normalized = normalizarTexto(texto);
  const empresaMatch = /(?:empresa|corporativo|facturar a|ruc de)\s+([A-Z0-9ÁÉÍÓÚÑ& .-]{3,60})/u.exec(texto);
  if (normalized.includes('empresa') || normalized.includes('factura') || extraerRuc(texto)) {
    const nombre = empresaMatch?.[1] ? limpiarNombre(empresaMatch[1]) : 'Empresa solicitante';
    return { tipo: 'empresa', nombre, hotelNombre: null, empresaNombre: nombre };
  }

  if (normalized.includes('soy ') || normalized.includes('necesito') || normalized.includes('quiero')) {
    return { tipo: 'pasajero', nombre: null, hotelNombre: null, empresaNombre: null };
  }

  return { tipo: null, nombre: null, hotelNombre: null, empresaNombre: null };
}

function detectarTipoViaje(texto: string): TipoViaje | null {
  const normalized = normalizarTexto(texto);
  const mencionaAeropuerto = Boolean(detectarAeropuerto(texto));
  if (!mencionaAeropuerto && /\b(?:vuelo|flight)\b/u.test(normalized)) return 'recojo_aeropuerto';
  if (!mencionaAeropuerto) return 'city';
  if (/(?:al|hacia|para el)\s+aeropuerto|dejar(?:lo|la)?\s+en\s+el\s+aeropuerto/u.test(normalized)) {
    return 'traslado_aeropuerto';
  }
  if (/(?:recojo|recoger|llega|llegada|arriba|vuelo|en el aeropuerto)/u.test(normalized)) {
    return 'recojo_aeropuerto';
  }
  return 'recojo_aeropuerto';
}

function extraerNombrePasajero(texto: string): string | null {
  const patterns = [
    /(?:hu[eé]sped|pasajer[oa]|cliente)\s+(?:es\s+|se llama\s+|para\s+)?([A-ZÁÉÍÓÚÑ][\p{L}'’-]+(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}'’-]+){0,4})/u,
    /(?:a nombre de|nombre pasajer[oa]:?)\s*([A-ZÁÉÍÓÚÑ][\p{L}'’-]+(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}'’-]+){0,4})/u,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(texto);
    if (match?.[1]) return limpiarNombre(match[1]);
  }

  return null;
}

function extraerTelefonos(texto: string, solicitanteTipo: SolicitanteTipo) {
  const pasajeroTelefono = extraerTelefono(
    texto,
    /(?:tel(?:efono)?|cel(?:ular)?|whatsapp)?\s*(?:del?\s*)?(?:pasajer[oa]|hu[eé]sped|cliente)[^.;\n]*(?:\+?51[\s-]*)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}/iu,
  );
  const solicitanteContacto =
    extraerTelefono(
      texto,
      /(?:mi contacto|contacto concierge|contacto hotel|escr[ií]beme|coordinar conmigo)[^.;\n]*(?:\+?51[\s-]*)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}/iu,
    ) ?? (solicitanteTipo === 'hotel' ? extraerTelefono(texto) : null);

  return {
    pasajeroTelefono:
      pasajeroTelefono ?? (solicitanteTipo === 'pasajero' ? extraerTelefono(texto) : null),
    solicitanteContacto,
  };
}

function camposEsperados(reserva: ReservaExtraida): string[] {
  const campos = [...CAMPOS_BASE];
  if (reserva.tipo_viaje === 'recojo_aeropuerto' || reserva.tipo_viaje === 'traslado_aeropuerto') {
    campos.push(...CAMPOS_AEROPUERTO);
  }
  return campos;
}

function camposExtraidos(reserva: ReservaExtraida): string[] {
  return Object.entries(reserva)
    .filter(([key, value]) => key !== 'raw_texto' && value !== null && value !== '')
    .map(([key]) => key);
}

function missingCampos(reserva: ReservaExtraida, esperados: string[]): string[] {
  return esperados.filter((campo) => {
    const value = reserva[campo as keyof ReservaExtraida];
    return value === null || value === '';
  });
}

export class ExtractorDeterminista {
  extraer(input: ExtractorInput): ExtraccionReservaResultado {
    const parsed = extractorInputSchema.parse(input);
    const reserva = baseReserva(parsed.mensaje);
    const texto = parsed.contextoConversacion
      ? `${parsed.contextoConversacion}\n${parsed.mensaje}`
      : parsed.mensaje;

    const solicitante = detectarSolicitante(texto);
    reserva.solicitante_tipo = solicitante.tipo;
    reserva.solicitante_nombre = solicitante.nombre;
    reserva.hotel_nombre = solicitante.hotelNombre;
    reserva.empresa_nombre = solicitante.empresaNombre;

    reserva.tipo_viaje = detectarTipoViaje(texto);
    reserva.fecha_hora_servicio = extraerFechaHoraServicio(texto, parsed.fechaActualIso);
    reserva.vuelo_codigo = extraerVuelo(texto);
    reserva.punto_encuentro = extraerPuntoEncuentro(texto);
    reserva.tipo_pago = detectarTipoPago(texto);
    reserva.pasajeros = extraerCantidad(texto, 'pasajeros');
    reserva.maletas = extraerCantidad(texto, 'maletas');
    reserva.pasajero_nombre = extraerNombrePasajero(texto);
    reserva.pasajero_dni = extraerDni(texto);
    reserva.pasajero_ruc = extraerRuc(texto);

    const telefonos = extraerTelefonos(texto, reserva.solicitante_tipo);
    reserva.pasajero_telefono = telefonos.pasajeroTelefono;
    reserva.solicitante_contacto = telefonos.solicitanteContacto;

    const aeropuerto = detectarAeropuerto(texto);
    const direccion = normalizarDireccion(texto);
    if (reserva.tipo_viaje === 'recojo_aeropuerto' && aeropuerto) {
      reserva.origen_texto = aeropuerto.llegadaNombre;
      reserva.origen_lat = aeropuerto.lat;
      reserva.origen_lng = aeropuerto.lng;
      reserva.destino_texto = direccion?.texto ?? null;
      reserva.destino_lat = direccion?.lat ?? null;
      reserva.destino_lng = direccion?.lng ?? null;
    } else if (reserva.tipo_viaje === 'traslado_aeropuerto' && aeropuerto) {
      reserva.destino_texto = aeropuerto.llegadaNombre;
      reserva.destino_lat = aeropuerto.lat;
      reserva.destino_lng = aeropuerto.lng;
      reserva.origen_texto = direccion?.texto ?? null;
      reserva.origen_lat = direccion?.lat ?? null;
      reserva.origen_lng = direccion?.lng ?? null;
    } else if (direccion) {
      reserva.destino_texto = direccion.texto;
      reserva.destino_lat = direccion.lat;
      reserva.destino_lng = direccion.lng;
    }

    const esperados = camposEsperados(reserva);
    const extraidos = camposExtraidos(reserva);
    const faltantes = missingCampos(reserva, esperados);
    const confianza = Number(((esperados.length - faltantes.length) / esperados.length).toFixed(2));

    return extraccionReservaResultadoSchema.parse({
      reserva,
      confianza,
      fuente: 'algoritmo',
      motivo: `Reglas determinísticas: ${extraidos.length} campos extraídos, ${faltantes.length} por aclarar.`,
      preguntas_aclaracion: preguntasParaCampos(faltantes),
      campos_extraidos: extraidos,
      campos_esperados: esperados,
    });
  }
}

export function extraerReservaDeterminista(input: ExtractorInput): ExtraccionReservaResultado {
  return new ExtractorDeterminista().extraer(input);
}

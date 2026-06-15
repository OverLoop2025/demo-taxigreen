import { preguntasParaCampos } from './aclarador';
import { AEROPUERTOS, detectarAmbitoVuelo, resolverZonaAeropuerto } from './diccionarios/aeropuertos';
import { detectarConvenioDemo } from './diccionarios/convenios-demo';
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
  type EquipajeNivel,
  type PerfilPasajero,
  type ReservaExtraida,
  type ResponsablePago,
  type SolicitanteTipo,
  type TipoPago,
  type TipoVehiculo,
  type TipoViaje,
} from './types';

// Vitales SIEMPRE, sin importar el perfil. El contacto ya es el propio WhatsApp,
// así que el teléfono no se exige; el NOMBRE no es vital para un particular.
const CAMPOS_BASE: string[] = ['tipo_viaje', 'fecha_hora_servicio'] as const;

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
    perfil_pasajero: null,
    responsable_pago: null,
    convenio_validado_demo: false,
    requiere_factura: false,
    vehiculo_preferencia: null,
    pasajeros_cantidad: null,
    equipaje_nivel: null,
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

function extraerEmpresaNombreTexto(texto: string): string | null {
  const trigger =
    /(?:trabajo en|somos de|colaborador(?:a)? de|analista de|facturar a(?:\s+la\s+empresa)?|empresa|corporativo)/iu.exec(
      texto,
    );
  if (!trigger) return null;

  const afterTrigger = texto.slice(trigger.index + trigger[0].length).trim();
  const stop = /\s+(?:pero|y|para|con|desde|hacia|mañana|manana|hoy|vuelo|traslado|recojo|recoger|necesito|lo\s+cubre|lo\s+paga)\b|[.;:\n]/iu.exec(
    afterTrigger,
  );
  const candidate = (stop ? afterTrigger.slice(0, stop.index) : afterTrigger).trim();
  return candidate.length >= 3 ? limpiarNombre(candidate) : null;
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
  const convenioEmpresa = detectarConvenioDemo(texto, 'empresa');
  const empresaNombre = convenioEmpresa?.nombre ?? extraerEmpresaNombreTexto(texto);
  if (
    convenioEmpresa ||
    normalized.includes('corporativo') ||
    normalized.includes('trabajo en') ||
    normalized.includes('somos de') ||
    normalized.includes('colaborador de') ||
    normalized.includes('colaboradora de') ||
    normalized.includes('analista de') ||
    normalized.includes('empresa ')
  ) {
    const nombre = empresaNombre ?? 'Empresa solicitante';
    return { tipo: 'empresa', nombre, hotelNombre: null, empresaNombre: nombre };
  }

  if (normalized.includes('soy ') || normalized.includes('necesito') || normalized.includes('quiero')) {
    return { tipo: 'pasajero', nombre: null, hotelNombre: null, empresaNombre: null };
  }

  return { tipo: null, nombre: null, hotelNombre: null, empresaNombre: null };
}

function tieneOrigenNoAeroExplicito(texto: string): boolean {
  const normalized = normalizarTexto(texto);
  if (!/(?:desde|recojo en|recogeme en|recógeme en|salgo de|parto de|mi casa|lobby|hotel)/u.test(normalized)) {
    return false;
  }
  return detectarAeropuerto(texto) === null;
}

function tieneSenalCity(texto: string): boolean {
  const normalized = normalizarTexto(texto);
  return /\b(?:city|taxi|traslado|servicio|llevar|destino|hacia|a\s+(?:miraflores|san isidro|barranco|surco|san borja))\b/u.test(
    normalized,
  );
}

function detectarTipoViaje(texto: string): TipoViaje | null {
  const normalized = normalizarTexto(texto);
  const mencionaAeropuerto = Boolean(detectarAeropuerto(texto));
  const mencionaVuelo = /\b(?:vuelo|flight|aterrizo|aterriza|aterriz[oó]|llego|llega)\b/u.test(normalized);
  if (!mencionaAeropuerto && mencionaVuelo && tieneOrigenNoAeroExplicito(texto)) return 'traslado_aeropuerto';
  if (!mencionaAeropuerto && mencionaVuelo) return 'recojo_aeropuerto';
  if (!mencionaAeropuerto) return tieneSenalCity(texto) ? 'city' : null;
  if (/(?:al|hacia|para el)\s+aeropuerto|dejar(?:lo|la)?\s+en\s+el\s+aeropuerto/u.test(normalized)) {
    return 'traslado_aeropuerto';
  }
  if (/(?:recojo|recoger|rec[oó]geme|llega|llegada|arriba|aterrizo|aterriza|vuelo|en el aeropuerto)/u.test(normalized)) {
    return 'recojo_aeropuerto';
  }
  return 'recojo_aeropuerto';
}

function detectarVehiculoPreferencia(texto: string): TipoVehiculo | null {
  const normalized = normalizarTexto(texto);
  if (/\b(?:van|hiace|minibus)\b/u.test(normalized)) return 'van';
  if (/\b(?:minivan|avanza)\b/u.test(normalized)) return 'minivan';
  if (/\b(?:camioneta|suv|amplio|amplia|cross|rav4)\b/u.test(normalized)) return 'camioneta';
  if (/\b(?:sedan|sedán|auto|carro)\b/u.test(normalized)) return 'sedan';
  return null;
}

function detectarEquipajeNivel(texto: string, maletas: number | null): EquipajeNivel | null {
  const normalized = normalizarTexto(texto);
  if (/\b(?:poco equipaje|solo mochila|mochila pequeña|sin equipaje|sin maletas)\b/u.test(normalized)) return 'poco';
  if (/\b(?:equipaje normal|maletas normales|normal de equipaje)\b/u.test(normalized)) return 'normal';
  if (/\b(?:varias maletas|equipaje grande|maletas grandes|mucho equipaje|bastante equipaje)\b/u.test(normalized)) {
    return 'grande';
  }
  if (typeof maletas === 'number') {
    if (maletas === 0) return 'poco';
    if (maletas >= 3) return 'grande';
    return 'normal';
  }
  return null;
}

function detectarIdentidadComercial(texto: string, tipoPagoDetectado: TipoPago | null): {
  perfilPasajero: PerfilPasajero | null;
  responsablePago: ResponsablePago | null;
  convenioValidadoDemo: boolean;
  requiereFactura: boolean;
  hotelNombre: string | null;
  empresaNombre: string | null;
  tipoPago: TipoPago | null;
} {
  const normalized = normalizarTexto(texto);
  const convenioHotel = detectarConvenioDemo(texto, 'hotel');
  const convenioEmpresa = detectarConvenioDemo(texto, 'empresa');
  const hotelNombre = convenioHotel?.nombre ?? detectarHotel(texto);
  const empresaNombre = convenioEmpresa?.nombre ?? extraerEmpresaNombreTexto(texto);
  const pideFactura = normalized.includes('factura') || Boolean(extraerRuc(texto));
  const pagoPersonal = /\b(?:lo pago yo|yo pago|yo asumo|pago yo|esta vez lo pago yo|pago personal|viaje personal)\b/u.test(
    normalized,
  );
  const cubreHotel = /\b(?:cargo al hotel|lo cubre el hotel|cuenta del hotel|paga el hotel|voucher hotel|voucher del hotel)\b/u.test(
    normalized,
  );
  const cubreEmpresa = /\b(?:lo cubre la empresa|paga la empresa|cargo a la empresa|credito empresa|crédito empresa|factura empresa|facturar a la empresa)\b/u.test(
    normalized,
  );
  const asociadoHotel = Boolean(hotelNombre) || normalized.includes('huesped') || normalized.includes('huésped');
  const asociadoEmpresa =
    Boolean(empresaNombre) ||
    normalized.includes('corporativo') ||
    normalized.includes('trabajo en') ||
    normalized.includes('somos de') ||
    normalized.includes('colaborador de') ||
    normalized.includes('colaboradora de') ||
    normalized.includes('analista de') ||
    normalized.includes('empresa ');
  const pasajeroDirecto = /\b(?:soy|necesito|quiero|reserva particular|particular)\b/u.test(normalized);

  let perfilPasajero: PerfilPasajero | null = null;
  if (asociadoHotel) perfilPasajero = 'hotel';
  else if (asociadoEmpresa) perfilPasajero = 'corporativo';
  else if (pasajeroDirecto || pagoPersonal || tipoPagoDetectado === 'efectivo' || tipoPagoDetectado === 'app_pago') {
    perfilPasajero = 'particular';
  }

  let responsablePago: ResponsablePago | null = null;
  // "Lo pago yo" manda aunque se mencione la empresa (caso ACME viaje personal).
  if (pagoPersonal) responsablePago = 'pasajero';
  else if (cubreHotel || tipoPagoDetectado === 'voucher_hotel') responsablePago = 'hotel';
  // Cobro a empresa solo si hay convenio (en la demo no se factura a una empresa
  // desconocida): el RUC identifica/valida a la empresa; sin convenio paga la persona.
  else if (cubreEmpresa || tipoPagoDetectado === 'factura_empresa' || (pideFactura && convenioEmpresa)) {
    responsablePago = convenioEmpresa ? 'empresa' : 'pasajero';
  }
  else if (perfilPasajero === 'corporativo' && pideFactura && !convenioEmpresa) responsablePago = 'pasajero';
  else if (perfilPasajero === 'particular') responsablePago = 'pasajero';
  else if (tipoPagoDetectado === 'efectivo' || tipoPagoDetectado === 'app_pago') responsablePago = 'pasajero';

  const convenioValidadoDemo = Boolean(
    (perfilPasajero === 'hotel' && convenioHotel) || (perfilPasajero === 'corporativo' && convenioEmpresa),
  );

  let tipoPago = tipoPagoDetectado;
  if (responsablePago === 'hotel') tipoPago = 'voucher_hotel';
  if (responsablePago === 'empresa') tipoPago = 'factura_empresa';
  if (responsablePago === 'pasajero' && (tipoPago === 'voucher_hotel' || tipoPago === 'factura_empresa')) {
    tipoPago = null;
  }

  return {
    perfilPasajero,
    responsablePago,
    convenioValidadoDemo,
    requiereFactura: pideFactura || responsablePago === 'empresa',
    hotelNombre,
    empresaNombre,
    tipoPago,
  };
}

// Palabras que NO son nombres propios aunque vengan capitalizadas (lugares,
// keywords). Evita confundir "San Isidro" o "Miraflores" con un nombre.
const NO_ES_NOMBRE = new Set([
  'san isidro',
  'miraflores',
  'barranco',
  'surco',
  'san borja',
  'la molina',
  'lima',
  'aeropuerto',
  'jorge chavez',
  'hotel',
  'taxi',
  'vuelo',
  'manana',
  'hoy',
  'avenida',
  'calle',
  'jiron',
  'salidas',
  'llegadas',
]);

const NOMBRE_PROPIO = `[A-ZÁÉÍÓÚÑ][\\p{L}'’-]+(?:\\s+[A-ZÁÉÍÓÚÑ][\\p{L}'’-]+){0,3}`;

function esNombrePropio(candidato: string): boolean {
  const limpio = limpiarNombre(candidato);
  if (limpio.length < 3 || /\d/.test(limpio)) return false;
  const normal = normalizarTexto(limpio);
  if (NO_ES_NOMBRE.has(normal)) return false;
  // Ninguna palabra del candidato es una keyword de lugar.
  return !normal.split(' ').some((palabra) => NO_ES_NOMBRE.has(palabra));
}

function extraerNombrePasajero(texto: string): string | null {
  const patterns = [
    new RegExp(`(?:hu[eé]sped|pasajer[oa]|cliente)\\s+(?:es\\s+|se llama\\s+|para\\s+)?(${NOMBRE_PROPIO})`, 'u'),
    new RegExp(`(?:a nombre de|nombre pasajer[oa]:?)\\s*(${NOMBRE_PROPIO})`, 'u'),
    // "...para Carlos Ruiz mañana": el lado se valida contra la lista de lugares.
    new RegExp(`\\bpara\\s+(?:el|la|l[oa]s)?\\s*(?:pasajer[oa]\\s+|hu[eé]sped\\s+)?(${NOMBRE_PROPIO})`, 'u'),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(texto);
    if (match?.[1] && esNombrePropio(match[1])) return limpiarNombre(match[1]);
  }

  // Mensaje que es SOLO un nombre propio (respuesta suelta "Carlos Ruiz" a la
  // pregunta del copiloto). Requiere ≥2 palabras para no tragarse direcciones.
  const soloNombre = new RegExp(`^\\s*(${NOMBRE_PROPIO})\\s*$`, 'u').exec(texto.trim());
  if (soloNombre?.[1]) {
    const limpio = limpiarNombre(soloNombre[1]);
    if (limpio.includes(' ') && esNombrePropio(limpio)) return limpio;
  }

  return null;
}

// Nombre dado en primera persona ("soy Carlos", "me llamo Ana", "mi nombre es...").
// Solo se usa para pasajeros directos: en hotel/empresa, "soy X" suele ser el
// solicitante (concierge/analista), no quien viaja.
function extraerNombreDirecto(texto: string): string | null {
  const pattern = new RegExp(`(?:soy|me llamo|mi nombre es)\\s+(${NOMBRE_PROPIO})`, 'iu');
  const match = pattern.exec(texto);
  if (match?.[1] && esNombrePropio(match[1])) return limpiarNombre(match[1]);
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

  // El punto que el cliente debe dar (el aeropuerto se completa solo según el flujo).
  // El número de vuelo NO es vital: es opcional y solo ayuda al counter a ubicar al
  // pasajero (flujo A). En el flujo B no participa el counter, así que nunca se exige.
  if (reserva.tipo_viaje === 'recojo_aeropuerto') {
    campos.push('destino_texto');
  } else if (reserva.tipo_viaje === 'traslado_aeropuerto') {
    campos.push('origen_texto');
  } else {
    campos.push('origen_texto', 'destino_texto');
  }

  campos.push('responsable_pago');

  // El RUC/empresa solo es vital cuando la EMPRESA asume el costo: ahí hay que
  // identificarla para cargarle el gasto. Si el pasajero paga, es irrelevante.
  if (reserva.responsable_pago === 'empresa') {
    campos.push('empresa_nombre', 'pasajero_ruc');
  } else if (reserva.responsable_pago === 'hotel') {
    campos.push('hotel_nombre');
  }

  return [...new Set(campos)];
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

const MERGE_FIELDS: Array<keyof ReservaExtraida> = [
  'canal_origen',
  'tipo_viaje',
  'solicitante_tipo',
  'solicitante_nombre',
  'solicitante_contacto',
  'pasajero_nombre',
  'pasajero_telefono',
  'pasajero_email',
  'pasajero_dni',
  'pasajero_ruc',
  'origen_texto',
  'origen_lat',
  'origen_lng',
  'destino_texto',
  'destino_lat',
  'destino_lng',
  'punto_encuentro',
  'fecha_hora_servicio',
  'vuelo_codigo',
  'tipo_pago',
  'perfil_pasajero',
  'responsable_pago',
  'vehiculo_preferencia',
  'pasajeros_cantidad',
  'equipaje_nivel',
  'pasajeros',
  'maletas',
  'hotel_nombre',
  'empresa_nombre',
];

function present(value: ReservaExtraida[keyof ReservaExtraida]) {
  return value !== null && value !== '';
}

function mergeConContexto(actual: ReservaExtraida, contexto: ReservaExtraida | null): ReservaExtraida {
  if (!contexto) return actual;
  const merged: ReservaExtraida = { ...actual };
  for (const field of MERGE_FIELDS) {
    if (!present(merged[field]) && present(contexto[field])) {
      merged[field] = contexto[field] as never;
    }
  }
  merged.requiere_factura = actual.requiere_factura || contexto.requiere_factura;
  merged.convenio_validado_demo = actual.convenio_validado_demo || contexto.convenio_validado_demo;
  merged.raw_texto = actual.raw_texto;
  return merged;
}

function aplicarCoherenciaComercial(reserva: ReservaExtraida) {
  if (reserva.responsable_pago === 'hotel') {
    reserva.tipo_pago = 'voucher_hotel';
    reserva.perfil_pasajero = reserva.perfil_pasajero ?? 'hotel';
  }
  if (reserva.responsable_pago === 'empresa') {
    reserva.tipo_pago = 'factura_empresa';
    reserva.perfil_pasajero = reserva.perfil_pasajero ?? 'corporativo';
    reserva.requiere_factura = true;
  }
  if (
    reserva.responsable_pago === 'pasajero' &&
    (reserva.tipo_pago === 'voucher_hotel' || reserva.tipo_pago === 'factura_empresa')
  ) {
    reserva.tipo_pago = null;
  }
  if (!reserva.solicitante_tipo) {
    if (reserva.perfil_pasajero === 'hotel') reserva.solicitante_tipo = 'hotel';
    if (reserva.perfil_pasajero === 'corporativo') reserva.solicitante_tipo = 'empresa';
    if (reserva.perfil_pasajero === 'particular') reserva.solicitante_tipo = 'pasajero';
  }
  // El pasajero que asume su propio viaje paga, por defecto, en efectivo. Esto deja
  // SIEMPRE un método de pago para cotizar/crear (antes la tarifa no se mostraba si
  // tipo_pago quedaba nulo) sin reabrir el caso hotel/empresa, que tienen el suyo.
  if (reserva.responsable_pago === 'pasajero' && !reserva.tipo_pago) {
    reserva.tipo_pago = 'efectivo';
  }
  reserva.pasajeros_cantidad = reserva.pasajeros_cantidad ?? reserva.pasajeros;
}

// Aplica los datos explícitos del flujo guiado con prioridad máxima. Solo pisan los
// valores presentes (un null/undefined del override NO borra lo ya extraído).
function aplicarOverrides(reserva: ReservaExtraida, overrides: Partial<ReservaExtraida>) {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null || value === '') continue;
    (reserva as Record<string, unknown>)[key] = value;
  }
}

export class ExtractorDeterminista {
  private extraerParcial(texto: string, fechaActualIso?: string): ReservaExtraida {
    const reserva = baseReserva(texto);
    const solicitante = detectarSolicitante(texto);
    reserva.solicitante_tipo = solicitante.tipo;
    reserva.solicitante_nombre = solicitante.nombre;
    reserva.hotel_nombre = solicitante.hotelNombre;
    reserva.empresa_nombre = solicitante.empresaNombre;

    reserva.tipo_viaje = detectarTipoViaje(texto);
    reserva.fecha_hora_servicio = extraerFechaHoraServicio(texto, fechaActualIso);
    reserva.vuelo_codigo = extraerVuelo(texto);
    reserva.punto_encuentro = extraerPuntoEncuentro(texto);
    const tipoPagoDetectado = detectarTipoPago(texto);
    const comercial = detectarIdentidadComercial(texto, tipoPagoDetectado);
    reserva.tipo_pago = comercial.tipoPago;
    reserva.perfil_pasajero = comercial.perfilPasajero;
    reserva.responsable_pago = comercial.responsablePago;
    reserva.convenio_validado_demo = comercial.convenioValidadoDemo;
    reserva.requiere_factura = comercial.requiereFactura;
    reserva.vehiculo_preferencia = detectarVehiculoPreferencia(texto);
    reserva.pasajeros = extraerCantidad(texto, 'pasajeros');
    reserva.maletas = extraerCantidad(texto, 'maletas');
    reserva.pasajeros_cantidad = reserva.pasajeros;
    reserva.equipaje_nivel = detectarEquipajeNivel(texto, reserva.maletas);
    reserva.pasajero_nombre = extraerNombrePasajero(texto);
    // Particular sin nombre aún: aceptar "soy X / me llamo X" (en hotel/empresa
    // ese "soy" es el solicitante, no el pasajero, por eso se restringe aquí).
    if (!reserva.pasajero_nombre && !reserva.hotel_nombre && !reserva.empresa_nombre) {
      reserva.pasajero_nombre = extraerNombreDirecto(texto);
    }
    reserva.pasajero_dni = extraerDni(texto);
    reserva.pasajero_ruc = extraerRuc(texto);
    reserva.hotel_nombre = comercial.hotelNombre ?? reserva.hotel_nombre;
    reserva.empresa_nombre = comercial.empresaNombre ?? reserva.empresa_nombre;

    const telefonos = extraerTelefonos(texto, reserva.solicitante_tipo);
    reserva.pasajero_telefono = telefonos.pasajeroTelefono;
    reserva.solicitante_contacto = telefonos.solicitanteContacto;

    const aeropuerto = detectarAeropuerto(texto) ?? (reserva.tipo_viaje === 'traslado_aeropuerto' ? AEROPUERTOS[0] : null);
    const direccion = normalizarDireccion(texto);
    const ambito = detectarAmbitoVuelo(texto);
    if (reserva.tipo_viaje === 'recojo_aeropuerto' && aeropuerto) {
      // Flujo A: el aeropuerto es el ORIGEN (llegadas, Piso 1). La zona depende de
      // nac/int; sin esa señal cae al nombre genérico (compat con el protagonista).
      const zona = resolverZonaAeropuerto(aeropuerto, 'recojo_aeropuerto', ambito);
      reserva.origen_texto = zona.texto;
      reserva.origen_lat = zona.lat;
      reserva.origen_lng = zona.lng;
      reserva.punto_encuentro = reserva.punto_encuentro ?? zona.puntoEncuentro;
      reserva.destino_texto = direccion?.texto ?? null;
      reserva.destino_lat = direccion?.lat ?? null;
      reserva.destino_lng = direccion?.lng ?? null;
    } else if (reserva.tipo_viaje === 'traslado_aeropuerto' && aeropuerto) {
      // Flujo B: el aeropuerto es el DESTINO (salidas, Piso 3), no llegadas.
      const zona = resolverZonaAeropuerto(aeropuerto, 'traslado_aeropuerto', ambito);
      reserva.destino_texto = zona.texto;
      reserva.destino_lat = zona.lat;
      reserva.destino_lng = zona.lng;
      reserva.punto_encuentro = reserva.punto_encuentro ?? zona.puntoEncuentro;
      reserva.origen_texto = direccion?.texto ?? null;
      reserva.origen_lat = direccion?.lat ?? null;
      reserva.origen_lng = direccion?.lng ?? null;
    } else if (direccion) {
      reserva.destino_texto = direccion.texto;
      reserva.destino_lat = direccion.lat;
      reserva.destino_lng = direccion.lng;
    }
    aplicarCoherenciaComercial(reserva);
    return reserva;
  }

  extraer(input: ExtractorInput): ExtraccionReservaResultado {
    const parsed = extractorInputSchema.parse(input);
    const actual = this.extraerParcial(parsed.mensaje, parsed.fechaActualIso);
    const contexto = parsed.contextoConversacion
      ? this.extraerParcial(parsed.contextoConversacion, parsed.fechaActualIso)
      : null;
    const reserva = mergeConContexto(actual, contexto);
    // El flujo guiado manda: sus datos explícitos pisan lo inferido por regex.
    if (parsed.overrides) aplicarOverrides(reserva, parsed.overrides);
    aplicarCoherenciaComercial(reserva);

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

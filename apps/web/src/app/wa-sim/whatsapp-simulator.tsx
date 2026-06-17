'use client';

import {
  AlertCircle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Loader2,
  MapPin,
  MessageCircle,
  MessagesSquare,
  PackageSearch,
  Plus,
  QrCode,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  Wand2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ExtraccionReservaResultado, ReservaExtraida } from '@taxigreen/ingesta';
import { pagoChatHumano, resumenComercialHumano } from '@taxigreen/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  asignarConductorAutomatico,
  buscarReservaPorCodigo,
  crearReservaDesdeIngesta,
  obtenerIncidenciaObjetoOlvidado,
  obtenerSeguimientoReserva,
  previsualizarPagoDesdeIngesta,
  type PagoDemoChat,
} from './actions';
import { FECHA_SIMULADOR_ISO, type ConversacionSeed } from './conversaciones-seed';

// ─── Tipos base ──────────────────────────────────────────────────────────────

type Mensaje = ConversacionSeed['mensajes'][number];

type ConfirmacionChat = {
  pasajero: string;
  codigo: string;
  punto: string;
  destino: string;
  fecha: string;
  link: string;
  qrUrl: string;
  tipoViaje: string;
  requiereMostrador: boolean;
  comercial: {
    perfilPasajero: string;
    responsablePago: string;
    convenioValidadoDemo: boolean;
    requiereFactura: boolean;
    resumen: string;
    pagoChat: string;
  };
  pago: PagoDemoChat;
};

// ─── Flujo interactivo ───────────────────────────────────────────────────────

type OpcionInteractiva = {
  valor: string;
  etiqueta: string;
  descripcion?: string;
  emoji?: string;
};

type ComponenteInteractivo =
  | { tipo: 'intent-selector'; opciones: OpcionInteractiva[] }
  | { tipo: 'radio-group'; campo: string; etiqueta: string; opciones: OpcionInteractiva[] }
  | { tipo: 'date-time-picker' }
  | { tipo: 'location-options'; modo: 'destino' | 'origen' }
  | { tipo: 'text-input'; campo: string; placeholder: string; skipLabel?: string; skipValor?: string }
  | { tipo: 'code-lookup' };

// Coordenadas opcionales que un widget de ubicación puede adjuntar a su selección.
type CoordsSeleccion = { lat: number; lng: number } | undefined;

type GuidedStep =
  | 'intent'
  | 'tipo_usuario'
  | 'flujo'
  | 'zona_llegada'
  | 'vuelo'
  | 'nombre_pasajero'
  | 'fecha'
  | 'destino'
  | 'origen_b'
  | 'responsable_pago'
  | 'ruc_empresa'
  | 'vehiculo'
  | 'datos'
  | 'code_lookup';

type ChatMensaje = Mensaje & {
  confirmacion?: ConfirmacionChat;
  enlace?: string;
  interactivo?: ComponenteInteractivo;
};

// ─── Detección de saludo / intención ─────────────────────────────────────────

const CONFIRMACION_CLIENTE = /^\s*(s[ií]\b|s[ií][,.!]|confirmo|claro|ok\b|dale|de acuerdo|correcto)/iu;

// ─── Helpers de formato ───────────────────────────────────────────────────────

function formatFechaCorta(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function horaAhora() {
  return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function formatValue(value: ReservaExtraida[keyof ReservaExtraida]) {
  if (value === null || value === '') return 'Pendiente';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/u.test(value)) {
    return new Date(value).toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return String(value).replaceAll('_', ' ');
}

function fuenteLabel(result: ExtraccionReservaResultado | null) {
  if (!result) return 'Pendiente de lectura';
  return result.fuente === 'llm' ? 'Leído con IA' : 'Lectura automática';
}

function fuenteIcon(result: ExtraccionReservaResultado | null) {
  if (result?.fuente === 'llm') return <Bot aria-hidden="true" className="h-4 w-4" />;
  return <Wand2 aria-hidden="true" className="h-4 w-4" />;
}

function identidadDesdeExtraccion(reserva: ReservaExtraida) {
  const input = {
    perfilPasajero: reserva.perfil_pasajero ?? 'particular',
    responsablePago: reserva.responsable_pago ?? 'pasajero',
    convenioValidadoDemo: reserva.convenio_validado_demo,
    requiereFactura: reserva.requiere_factura,
    empresaNombre: reserva.empresa_nombre,
    hotelNombre: reserva.hotel_nombre,
    tipoPago: reserva.tipo_pago,
  };
  return {
    resumen: resumenComercialHumano(input),
    pagoChat: pagoChatHumano(input),
  };
}

function estadoReserva(result: ExtraccionReservaResultado | null, confirmada: boolean) {
  if (confirmada) return { label: 'Enviada al cliente', tone: 'ok' as const };
  if (!result) return { label: 'Esperando mensaje', tone: 'idle' as const };
  if (result.confianza < 0.7) return { label: 'Faltan datos', tone: 'warn' as const };
  if (result.preguntas_aclaracion.length > 0) return { label: 'Casi listo · confirma un detalle', tone: 'warn' as const };
  return { label: 'Listo para confirmar', tone: 'ok' as const };
}

const ESTADO_TONE: Record<'ok' | 'warn' | 'idle', string> = {
  ok: 'bg-emerald-100 text-emerald-800',
  warn: 'bg-amber-100 text-amber-800',
  idle: 'bg-[#e9edef] text-[#667781]',
};

const FIELD_GROUPS: Array<{ label: string; keys: Array<[keyof ReservaExtraida, string]> }> = [
  {
    label: 'Servicio',
    keys: [
      ['tipo_viaje', 'Tipo'],
      ['fecha_hora_servicio', 'Fecha'],
      ['tipo_pago', 'Pago'],
      ['perfil_pasajero', 'Perfil'],
      ['responsable_pago', 'Responsable'],
      ['vuelo_codigo', 'Vuelo'],
      ['punto_encuentro', 'Encuentro'],
    ],
  },
  {
    label: 'Ruta',
    keys: [
      ['origen_texto', 'Origen'],
      ['destino_texto', 'Destino'],
    ],
  },
  {
    label: 'Personas',
    keys: [
      ['solicitante_tipo', 'Solicita'],
      ['solicitante_nombre', 'Nombre'],
      ['pasajero_nombre', 'Pasajero'],
      ['pasajero_telefono', 'Teléfono'],
      ['pasajeros_cantidad', 'Personas'],
      ['equipaje_nivel', 'Equipaje'],
      ['vehiculo_preferencia', 'Vehículo'],
    ],
  },
];

// ─── Sub-componentes del chat ─────────────────────────────────────────────────

function ConfirmacionMensaje({ data }: { data: ConfirmacionChat }) {
  return (
    <div className="w-[268px] max-w-full">
      <div className="flex items-center gap-2">
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-[#075E54]" />
        <p className="text-sm font-semibold text-[#0a332f]">Reserva confirmada</p>
      </div>
      <div className="mt-2 rounded-lg bg-white p-3 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#667781]">Tu reserva</p>
        <p className="text-base font-bold tracking-wider text-[#0a332f]">{data.codigo}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#3b4a47]">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#075E54]" />
          {data.punto}
        </p>
        <p className="mt-1 text-xs text-[#667781]">
          {data.destino} · {data.fecha}
        </p>
      </div>
      <div className="mt-2 rounded-lg bg-white p-3 shadow-sm">
        <div className="flex items-start gap-2">
          <CreditCard aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#075E54]" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0a332f]">{data.pago.montoEtiqueta}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-[#3b4a47]">
              {data.pago.metodoLabel} · {data.pago.estadoLabel}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[#075E54]">{data.comercial.pagoChat}</p>
          </div>
        </div>
      </div>
      {data.requiereMostrador ? (
        <div className="mt-2 rounded-lg bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <QrCode aria-hidden="true" className="h-4 w-4 text-[#075E54]" />
            <p className="text-sm font-semibold text-[#0a332f]">Tu pase de abordaje</p>
          </div>
          <img
            alt={`Pase de abordaje de la reserva ${data.codigo}`}
            className="mx-auto mt-2 h-40 w-40 rounded-md border border-[#e3ece9]"
            src={data.qrUrl}
          />
          <p className="mt-1 text-center text-[11px] text-[#3b4a47]">
            Muéstralo en el mostrador del aeropuerto para subir a tu taxi.
          </p>
        </div>
      ) : (
        <div className="mt-2 rounded-lg bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="h-4 w-4 text-[#075E54]" />
            <p className="text-sm font-semibold text-[#0a332f]">Seguimiento activo</p>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-[#3b4a47]">
            No necesitas pasar por mostrador. Tu conductor va directo al punto de recojo.
          </p>
          <EnlaceMensaje link={data.link} />
        </div>
      )}
      <p className="mt-2 px-1 text-[11px] leading-4 text-[#3b4a47]">
        {data.requiereMostrador
          ? 'Al validar tu pase en el mostrador te llega aquí el enlace para seguir tu taxi en vivo.'
          : 'Tu conductor irá directo al punto de recojo y podrás seguir el viaje desde ahora.'}
      </p>
    </div>
  );
}

function EnlaceMensaje({ link }: { link: string }) {
  // El mismo componente sirve para el enlace en vivo del viaje y para el seguimiento de
  // un caso de bienestar (objeto olvidado): se adapta por la ruta del enlace.
  const esCaso = link.includes('/bienestar/');
  const Icon = esCaso ? PackageSearch : MapPin;
  const label = esCaso ? 'Ver seguimiento del caso' : 'Seguir mi taxi en vivo';
  return (
    <a
      className={`mt-1 flex w-[248px] max-w-full items-center justify-between rounded-lg px-3 py-2.5 text-white transition ${
        esCaso ? 'bg-[#6D28D9] hover:bg-[#5b21b6]' : 'bg-[#075E54] hover:bg-[#05453e]'
      }`}
      href={link}
      rel="noreferrer"
      target="_blank"
    >
      <span className="flex items-center gap-2">
        <Icon aria-hidden="true" className="h-4 w-4" />
        <span className="text-sm font-semibold">{label}</span>
      </span>
      <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
    </a>
  );
}

// ─── Carga dinámica de Mapbox GL (para el selector de mapa inline) ────────────

type MapboxLngLat = { lng: number; lat: number };
type MapboxMarkerInst = {
  setLngLat: (c: [number, number]) => MapboxMarkerInst;
  getLngLat: () => MapboxLngLat;
  addTo: (m: unknown) => MapboxMarkerInst;
  on: (e: string, h: () => void) => MapboxMarkerInst;
};
type MapboxMapInst = {
  on: (e: string, h: (p: { lngLat: MapboxLngLat }) => void) => void;
  remove: () => void;
};
type MapboxGLLib = {
  accessToken: string;
  Map: new (o: Record<string, unknown>) => MapboxMapInst;
  Marker: new (o?: Record<string, unknown>) => MapboxMarkerInst;
};
function getMapboxGL(): MapboxGLLib | null {
  return (globalThis as unknown as { mapboxgl?: MapboxGLLib }).mapboxgl ?? null;
}
let mbPromise: Promise<MapboxGLLib | null> | null = null;
function loadMapboxGLOnce() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const ex = getMapboxGL();
  if (ex) return Promise.resolve(ex);
  if (mbPromise) return mbPromise;
  mbPromise = new Promise<MapboxGLLib | null>((resolve) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js';
    s.onload = () => resolve(getMapboxGL());
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return mbPromise;
}
async function reverseGeocodeWaSim(coord: MapboxLngLat, token: string): Promise<string | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coord.lng},${coord.lat}.json?access_token=${token}&language=es&limit=1&country=pe`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const d = (await r.json()) as { features?: Array<{ place_name?: string }> };
    return d.features?.[0]?.place_name ?? null;
  } catch {
    return null;
  }
}

// Geocodificación directa: convierte una dirección escrita en coordenadas reales
// para que el conductor pueda trazar la ruta (no solo texto).
async function forwardGeocodeWaSim(
  texto: string,
  token: string,
): Promise<{ lat: number; lng: number; etiqueta: string } | null> {
  try {
    const q = encodeURIComponent(texto);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&language=es&limit=1&country=pe&proximity=-77.0428,-12.0464`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const d = (await r.json()) as {
      features?: Array<{ place_name?: string; center?: [number, number] }>;
    };
    const f = d.features?.[0];
    if (!f?.center) return null;
    return { lng: f.center[0], lat: f.center[1], etiqueta: f.place_name ?? texto };
  } catch {
    return null;
  }
}

// Autocompletado de direcciones (estilo Uber): hasta 5 resultados cercanos a Lima.
async function suggestGeocodeWaSim(
  texto: string,
  token: string,
): Promise<Array<{ lat: number; lng: number; etiqueta: string }>> {
  try {
    const q = encodeURIComponent(texto);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&language=es&limit=5&country=pe&proximity=-77.0428,-12.0464&autocomplete=true`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const d = (await r.json()) as {
      features?: Array<{ place_name?: string; center?: [number, number] }>;
    };
    return (d.features ?? [])
      .filter((f) => Array.isArray(f.center))
      .map((f) => ({ lng: f.center![0], lat: f.center![1], etiqueta: f.place_name ?? texto }));
  } catch {
    return [];
  }
}

// Resuelve un enlace corto de Google Maps (goo.gl / maps.app.goo.gl) a coordenadas
// siguiendo la redirección en el servidor (el cliente no puede por CORS).
async function resolverEnlaceUbicacion(url: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(`/api/ubicacion/resolver?url=${encodeURIComponent(url)}`);
    if (!r.ok) return null;
    const d = (await r.json()) as { ok?: boolean; lat?: number; lng?: number };
    if (d.ok && typeof d.lat === 'number' && typeof d.lng === 'number') {
      return { lat: d.lat, lng: d.lng };
    }
    return null;
  } catch {
    return null;
  }
}

// Extrae coordenadas de un enlace de Google Maps o de un texto con lat,lng.
// Cubre @lat,lng · q=lat,lng · !3dlat!4dlng · "lat, lng" suelto.
function parseLatLngFromText(text: string): { lat: number; lng: number } | null {
  const patterns = [
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/u,
    /[?&]q=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/u,
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/u,
    /(?:^|\s)(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})(?:\s|$)/u,
  ];
  for (const p of patterns) {
    const m = p.exec(text);
    if (m?.[1] && m[2]) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
      }
    }
  }
  return null;
}

// Resolución ÚNICA de una ubicación escrita/pegada → punto trazable. Es la fuente de
// verdad compartida por el widget y por el composer: solo acepta algo que el conductor
// pueda enrutar (coords de enlace, enlace resoluble, o dirección geocodificable).
type ResolucionUbicacion =
  | { ok: true; label: string; coords: { lat: number; lng: number } }
  | { ok: false; motivo: keyof typeof MOTIVOS_UBICACION };

const MOTIVOS_UBICACION = {
  corto: 'Escribe la dirección completa (calle y distrito) o usa el mapa.',
  enlace_no_maps: 'Ese enlace no parece de Google Maps. Pega el de "Compartir ubicación" o usa el mapa.',
  enlace_no_resuelto: 'No pudimos leer la ubicación de ese enlace. Vuelve a copiarlo o márcala en el mapa.',
  direccion_no_geocodificable: 'No reconocimos esa dirección. Escríbela completa (calle y distrito) o márcala en el mapa.',
  sin_token: 'Necesitamos ubicarte en el mapa. Toca "Marcar en el mapa" para fijar el punto.',
} as const;

async function resolverUbicacionDesdeTexto(
  valor: string,
  token: string | null,
): Promise<ResolucionUbicacion> {
  const v = valor.trim();
  if (v.length < 4) return { ok: false, motivo: 'corto' };
  const etiquetaCoords = async (c: { lat: number; lng: number }) => {
    const nombre = token ? await reverseGeocodeWaSim(c, token) : null;
    return nombre ?? `Ubicación compartida (${c.lat.toFixed(5)}, ${c.lng.toFixed(5)})`;
  };
  // 1) Coordenadas explícitas (enlace largo de Google Maps o "lat, lng").
  const directas = parseLatLngFromText(v);
  if (directas) return { ok: true, label: await etiquetaCoords(directas), coords: directas };
  // 2) Enlace: solo de mapas; los cortos (goo.gl) se resuelven en el servidor.
  if (/^https?:\/\//iu.test(v)) {
    const esMapa = /(goo\.gl|maps\.app\.goo\.gl|google\.[^/]+\/maps|maps\.google|g\.co\/kgs)/iu.test(v);
    if (!esMapa) return { ok: false, motivo: 'enlace_no_maps' };
    const resuelto = await resolverEnlaceUbicacion(v);
    if (resuelto) return { ok: true, label: await etiquetaCoords(resuelto), coords: resuelto };
    return { ok: false, motivo: 'enlace_no_resuelto' };
  }
  // 3) Dirección escrita: geocodificar. Si no resuelve, NO la aceptamos.
  if (token) {
    const geo = await forwardGeocodeWaSim(v, token);
    if (geo) return { ok: true, label: geo.etiqueta, coords: { lat: geo.lat, lng: geo.lng } };
    return { ok: false, motivo: 'direccion_no_geocodificable' };
  }
  return { ok: false, motivo: 'sin_token' };
}

// Selector de mapa a PANTALLA COMPLETA (modal). Resuelve el bug del mapa en blanco
// (contenedor de tamaño 0 dentro de la burbuja): aquí el contenedor tiene dimensiones
// estables y se fuerza resize() tras cargar. Incluye "usar mi ubicación" (GPS).
function MapPickerModal({
  modo,
  token,
  onConfirmar,
  onCancelar,
}: {
  modo: 'destino' | 'origen';
  token: string | null;
  onConfirmar: (etiqueta: string, coords: { lat: number; lng: number }) => void;
  onCancelar: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMapInst | null>(null);
  const markerRef = useRef<MapboxMarkerInst | null>(null);
  const [coord, setCoord] = useState<MapboxLngLat>({ lat: -12.0464, lng: -77.0428 });
  const [direccion, setDireccion] = useState<string | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>(token ? 'cargando' : 'error');
  const [localizando, setLocalizando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<Array<{ lat: number; lng: number; etiqueta: string }>>([]);
  const titulo = modo === 'destino' ? '¿A dónde vas?' : '¿Desde dónde te recogemos?';

  const actualizarDesdeMarker = async (lng: number, lat: number) => {
    setCoord({ lat, lng });
    setDireccion('Buscando dirección…');
    const nombre = token ? await reverseGeocodeWaSim({ lat, lng }, token) : null;
    setDireccion(nombre ?? `Punto marcado (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
  };

  const moverA = (lng: number, lat: number) => {
    markerRef.current?.setLngLat([lng, lat]);
    (mapRef.current as unknown as { flyTo?: (o: unknown) => void })?.flyTo?.({
      center: [lng, lat],
      zoom: 15,
    });
    void actualizarDesdeMarker(lng, lat);
  };

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    void loadMapboxGLOnce().then((mb) => {
      if (cancelled || !mb || !containerRef.current) {
        setEstado('error');
        return;
      }
      mb.accessToken = token;
      const map = new mb.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-77.0428, -12.0464],
        zoom: 12,
        attributionControl: false,
      });
      mapRef.current = map;
      const marker = new mb.Marker({ draggable: true, color: '#10B981' })
        .setLngLat([-77.0428, -12.0464])
        .addTo(map);
      markerRef.current = marker;
      marker.on('dragend', () => {
        const c = marker.getLngLat();
        void actualizarDesdeMarker(c.lng, c.lat);
      });
      map.on('click', (ev) => {
        marker.setLngLat([ev.lngLat.lng, ev.lngLat.lat]);
        void actualizarDesdeMarker(ev.lngLat.lng, ev.lngLat.lat);
      });
      // El mapa nace dentro de un modal recién montado: forzar resize evita el
      // render en blanco por contenedor con tamaño 0 en el primer frame. Cubrimos
      // varios caminos: evento 'load', timers escalonados y un ResizeObserver.
      const fixSize = () => (map as unknown as { resize?: () => void }).resize?.();
      (map as unknown as { on: (e: string, h: () => void) => void }).on('load', fixSize);
      setTimeout(fixSize, 60);
      setTimeout(fixSize, 250);
      setTimeout(fixSize, 600);
      if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
        ro = new ResizeObserver(fixSize);
        ro.observe(containerRef.current);
      }
      setEstado('listo');
    });
    return () => {
      cancelled = true;
      ro?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [token]);

  // Autocompletado del buscador (debounce 300ms).
  useEffect(() => {
    if (!token || busqueda.trim().length < 3) {
      setSugerencias([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      void suggestGeocodeWaSim(busqueda.trim(), token).then((r) => {
        if (!cancelled) setSugerencias(r);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [busqueda, token]);

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) return;
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalizando(false);
        moverA(pos.coords.longitude, pos.coords.latitude);
      },
      () => setLocalizando(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const confirmable = estado === 'listo' && Boolean(direccion) && !direccion?.startsWith('Buscando');

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/40">
      <div className="mt-auto flex h-[88vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:mx-auto sm:my-auto sm:h-[80vh] sm:w-[560px] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[#e3ece9] px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-[#0a332f]">{titulo}</h3>
            <p className="text-xs text-[#667781]">Toca el mapa o arrastra el pin al punto exacto.</p>
          </div>
          <button
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f5] text-[#667781] hover:bg-[#e3ece9]"
            onClick={onCancelar}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="relative flex-1">
          {/* h-full w-full es CRÍTICO: mapbox-gl inyecta `.mapboxgl-map { position: relative }`
              por CDN DESPUÉS de Tailwind, ganándole a `absolute` y anulando `inset-0` → el
              contenedor colapsaba a altura 0 y el mapa salía en blanco. Con h-full/w-full el
              elemento toma la altura del padre aunque mapbox lo deje en position:relative. */}
          <div className="absolute inset-0 h-full w-full" ref={containerRef} />
          {estado === 'cargando' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <Loader2 className="h-7 w-7 animate-spin text-[#128C7E]" />
            </div>
          )}
          {estado === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/95 p-6 text-center">
              <p className="text-sm text-[#667781]">No se pudo cargar el mapa. Cierra y escribe la dirección.</p>
            </div>
          )}
          {estado === 'listo' && (
            <>
              <div className="absolute left-3 right-3 top-3 z-10">
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-md">
                  <Search className="h-4 w-4 shrink-0 text-[#667781]" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#0a332f] placeholder:text-[#9aa6a1] focus:outline-none"
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Busca una dirección, lugar o negocio"
                    value={busqueda}
                  />
                  {busqueda ? (
                    <button
                      aria-label="Limpiar"
                      className="text-[#9aa6a1] hover:text-[#667781]"
                      onClick={() => setBusqueda('')}
                      type="button"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
                {sugerencias.length > 0 ? (
                  <div className="mt-1 overflow-hidden rounded-2xl bg-white shadow-lg">
                    {sugerencias.map((s) => (
                      <button
                        className="flex w-full items-start gap-2.5 border-b border-[#f0f2f5] px-4 py-2.5 text-left last:border-0 hover:bg-[#f7fbfa]"
                        key={`${s.lat},${s.lng}`}
                        onClick={() => {
                          moverA(s.lng, s.lat);
                          setBusqueda('');
                          setSugerencias([]);
                        }}
                        type="button"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#128C7E]" />
                        <span className="text-xs leading-4 text-[#0a332f]">{s.etiqueta}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#075E54] shadow-md hover:bg-[#f0faf6] disabled:opacity-60"
                disabled={localizando}
                onClick={usarMiUbicacion}
                type="button"
              >
                {localizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>📡</span>}
                Usar mi ubicación
              </button>
            </>
          )}
        </div>

        <div className="border-t border-[#e3ece9] bg-[#f7fbfa] p-4">
          <p className="mb-3 min-h-[20px] text-sm font-medium text-[#0a332f]">
            {direccion ?? 'Marca tu punto en el mapa'}
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-xl border border-[#c5dfd9] bg-white px-4 py-3 text-sm font-semibold text-[#667781] hover:bg-gray-50"
              onClick={onCancelar}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="flex-1 rounded-xl bg-[#128C7E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#075E54] disabled:opacity-40"
              disabled={!confirmable}
              onClick={() => onConfirmar(direccion ?? `${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}`, coord)}
              type="button"
            >
              Confirmar ubicación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Botón reutilizable "← Atrás" ─────────────────────────────────────────────

function BtnAtras({ onRetroceder }: { onRetroceder: (() => void) | undefined }) {
  if (!onRetroceder) return null;
  return (
    <button
      className="mt-2 text-xs font-medium text-[#667781] underline-offset-2 hover:underline"
      onClick={onRetroceder}
      type="button"
    >
      ← Atrás
    </button>
  );
}

// ─── Componente interactivo del chat ─────────────────────────────────────────

function ComponenteInteractivoChat({
  interactivo,
  contestado,
  seleccionado,
  mapboxToken,
  onSeleccionar,
  onRetroceder,
}: {
  interactivo: ComponenteInteractivo;
  contestado: boolean;
  seleccionado: string | undefined;
  mapboxToken: string | null;
  onSeleccionar: (valor: string, etiqueta: string, coords?: CoordsSeleccion) => void;
  onRetroceder?: () => void;
}) {
  const [fechaVal, setFechaVal] = useState('');
  const [horaVal, setHoraVal] = useState('');
  const [locTexto, setLocTexto] = useState('');
  const [locMode, setLocMode] = useState<null | 'texto' | 'mapa'>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [codigoVal, setCodigoVal] = useState('');
  const [textInputVal, setTextInputVal] = useState('');

  if (contestado) {
    return (
      <div className="mt-2 rounded-lg bg-[#e1f7d5] px-3 py-2 text-xs font-semibold text-[#075E54]">
        ✓ {seleccionado}
      </div>
    );
  }

  switch (interactivo.tipo) {
    case 'intent-selector':
      return (
        <div className="mt-3 flex flex-col gap-2">
          {interactivo.opciones.map((op) => (
            <button
              className="flex items-start gap-3 rounded-xl border border-[#c5dfd9] bg-white px-4 py-3 text-left transition hover:bg-[#e7fde2] active:scale-[0.98]"
              key={op.valor}
              onClick={() => onSeleccionar(op.valor, op.etiqueta)}
              type="button"
            >
              {op.emoji && <span className="text-xl leading-none">{op.emoji}</span>}
              <div>
                <p className="text-sm font-semibold text-[#0a332f]">{op.etiqueta}</p>
                {op.descripcion && <p className="mt-0.5 text-xs leading-4 text-[#667781]">{op.descripcion}</p>}
              </div>
            </button>
          ))}
          <BtnAtras onRetroceder={onRetroceder} />
        </div>
      );

    case 'radio-group':
      return (
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex flex-wrap gap-2">
            {interactivo.opciones.map((op) => (
              <button
                className="flex items-center gap-1.5 rounded-full border-2 border-[#128C7E] bg-white px-4 py-2 text-sm font-semibold text-[#075E54] transition hover:bg-[#e7fde2] active:scale-95"
                key={op.valor}
                onClick={() => onSeleccionar(op.valor, op.etiqueta)}
                type="button"
              >
                {op.emoji && <span>{op.emoji}</span>}
                {op.etiqueta}
              </button>
            ))}
          </div>
          <BtnAtras onRetroceder={onRetroceder} />
        </div>
      );

    case 'date-time-picker': {
      const hoy = new Date().toISOString().split('T')[0] ?? '';
      return (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-[#c5dfd9] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]"
              min={hoy}
              onChange={(e) => setFechaVal(e.target.value)}
              type="date"
              value={fechaVal}
            />
            <input
              className="w-[104px] rounded-lg border border-[#c5dfd9] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]"
              onChange={(e) => setHoraVal(e.target.value)}
              type="time"
              value={horaVal}
            />
          </div>
          <button
            className="rounded-lg bg-[#128C7E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#075E54] disabled:opacity-40"
            disabled={!fechaVal || !horaVal}
            onClick={() => {
              const dt = new Date(`${fechaVal}T${horaVal}`);
              const etiqueta = dt.toLocaleString('es-PE', {
                timeZone: 'America/Lima',
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              });
              onSeleccionar(`${fechaVal}T${horaVal}:00`, etiqueta);
            }}
            type="button"
          >
            Confirmar fecha y hora
          </button>
          <BtnAtras onRetroceder={onRetroceder} />
        </div>
      );
    }

    case 'location-options': {
      const isDestino = interactivo.modo === 'destino';

      // Mapa a pantalla completa (resuelve el render en blanco). Devuelve coords reales.
      if (locMode === 'mapa') {
        return (
          <MapPickerModal
            modo={interactivo.modo}
            token={mapboxToken}
            onCancelar={() => setLocMode(null)}
            onConfirmar={(etiqueta, coords) => onSeleccionar(etiqueta, etiqueta, coords)}
          />
        );
      }

      // Escribir/pegar: SOLO aceptamos algo trazable para el conductor (coords de un
      // enlace, enlace resoluble o dirección geocodificable). Si nada resuelve, se
      // re-pregunta (nunca guardamos basura como "asdasd" ni un enlace literal).
      const confirmarTexto = async () => {
        const valor = locTexto.trim();
        if (valor.length < 4) return;
        setLocError(null);
        setGeoLoading(true);
        try {
          const r = await resolverUbicacionDesdeTexto(valor, mapboxToken);
          if (r.ok) onSeleccionar(r.label, r.label, r.coords);
          else setLocError(MOTIVOS_UBICACION[r.motivo]);
        } finally {
          setGeoLoading(false);
        }
      };

      if (locMode === 'texto') {
        return (
          <div className="mt-3 flex flex-col gap-2">
            <input
              autoFocus
              className="rounded-lg border border-[#c5dfd9] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]"
              onChange={(e) => {
                setLocTexto(e.target.value);
                if (locError) setLocError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && locTexto.trim().length >= 4 && !geoLoading) void confirmarTexto();
              }}
              placeholder={isDestino ? 'Av. Pardo 123, Miraflores  ó  enlace de Google Maps' : 'Hotel Costa Verde, Av. Malecón 200  ó  enlace'}
              value={locTexto}
            />
            {locError ? (
              <p className="rounded-lg bg-[#fdecec] px-3 py-2 text-xs font-medium text-[#b3261e]">{locError}</p>
            ) : (
              <p className="px-1 text-[11px] leading-4 text-[#667781]">
                Pega un enlace de Google Maps o escribe la dirección completa. Si dudas, usa el mapa.
              </p>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-lg border border-[#c5dfd9] bg-white px-3 py-2 text-sm font-medium text-[#667781] transition hover:bg-gray-50"
                onClick={() => setLocMode(null)}
                type="button"
              >
                Volver
              </button>
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#128C7E] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#075E54] disabled:opacity-40"
                disabled={locTexto.trim().length < 4 || geoLoading}
                onClick={() => void confirmarTexto()}
                type="button"
              >
                {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirmar
              </button>
            </div>
          </div>
        );
      }

      // Dos opciones, según pidió el negocio: marcar en mapa o escribir/pegar enlace.
      return (
        <div className="mt-3 flex flex-col gap-2">
          <button
            className="flex items-start gap-3 rounded-xl border border-[#c5dfd9] bg-white px-4 py-3 text-left transition hover:bg-[#e7fde2]"
            onClick={() => setLocMode('mapa')}
            type="button"
          >
            <span className="mt-0.5 text-xl leading-none">🗺️</span>
            <div>
              <p className="text-sm font-semibold text-[#0a332f]">Marcar en el mapa</p>
              <p className="mt-0.5 text-xs leading-4 text-[#667781]">
                {isDestino ? 'Ubica el pin en tu destino exacto' : 'Ubica el pin en tu punto de recojo'}
              </p>
            </div>
          </button>
          <button
            className="flex items-start gap-3 rounded-xl border border-[#c5dfd9] bg-white px-4 py-3 text-left transition hover:bg-[#e7fde2]"
            onClick={() => setLocMode('texto')}
            type="button"
          >
            <span className="mt-0.5 text-xl leading-none">📍</span>
            <div>
              <p className="text-sm font-semibold text-[#0a332f]">Escribir o pegar dirección</p>
              <p className="mt-0.5 text-xs leading-4 text-[#667781]">
                Dirección completa o enlace de Google Maps (sacamos las coordenadas)
              </p>
            </div>
          </button>
          <BtnAtras onRetroceder={onRetroceder} />
        </div>
      );
    }

    case 'text-input': {
      return (
        <div className="mt-3 flex flex-col gap-2">
          <input
            autoFocus
            className="rounded-lg border border-[#c5dfd9] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]"
            onChange={(e) => setTextInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textInputVal.trim().length >= 1) {
                onSeleccionar(textInputVal.trim(), textInputVal.trim());
              }
            }}
            placeholder={interactivo.placeholder}
            value={textInputVal}
          />
          <button
            className="rounded-lg bg-[#128C7E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#075E54] disabled:opacity-40"
            disabled={textInputVal.trim().length < 1}
            onClick={() => onSeleccionar(textInputVal.trim(), textInputVal.trim())}
            type="button"
          >
            Confirmar
          </button>
          {interactivo.skipLabel ? (
            <button
              className="text-xs font-medium text-[#667781] underline-offset-2 hover:underline"
              onClick={() => onSeleccionar(interactivo.skipValor ?? 'skip', interactivo.skipLabel as string)}
              type="button"
            >
              {interactivo.skipLabel}
            </button>
          ) : null}
          <BtnAtras onRetroceder={onRetroceder} />
        </div>
      );
    }

    case 'code-lookup':
      return (
        <div className="mt-3 flex flex-col gap-2">
          <input
            className="rounded-lg border border-[#c5dfd9] bg-white px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#128C7E]"
            maxLength={20}
            onChange={(e) => setCodigoVal(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && codigoVal.trim().length >= 4) {
                onSeleccionar(codigoVal.trim(), codigoVal.trim());
              }
            }}
            placeholder="TG-2026-0001"
            value={codigoVal}
          />
          <button
            className="rounded-lg bg-[#128C7E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#075E54] disabled:opacity-40"
            disabled={codigoVal.trim().length < 4}
            onClick={() => onSeleccionar(codigoVal.trim(), codigoVal.trim())}
            type="button"
          >
            Buscar reserva
          </button>
          <BtnAtras onRetroceder={onRetroceder} />
        </div>
      );
  }
  // Guarda de exhaustividad: el union type cubre todos los casos arriba
  return null;
}

// Identidad de la cotización: si cambia algo que mueve la tarifa, cambia la clave.
// Se usa para no emitir el resumen con una tarifa que aún corresponde a otra versión.
function cotizacionKeyDe(reserva: ReservaExtraida) {
  return [
    reserva.origen_texto,
    reserva.destino_texto,
    reserva.vehiculo_preferencia,
    reserva.pasajeros_cantidad ?? reserva.pasajeros,
    reserva.equipaje_nivel,
    reserva.tipo_pago,
  ].join('|');
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function WhatsappSimulator({
  conversaciones,
  mapboxToken,
}: {
  conversaciones: ConversacionSeed[];
  mapboxToken: string | null;
}) {
  const router = useRouter();

  // Chats manuales (creados con el botón +)
  const [chatsManuales, setChatsManuales] = useState<ConversacionSeed[]>([]);
  const todasConversaciones = useMemo(
    () => [...chatsManuales, ...conversaciones],
    [chatsManuales, conversaciones],
  );

  const initial = conversaciones[0]!;
  const [selectedId, setSelectedId] = useState(initial.id);
  const [messages, setMessages] = useState<ChatMensaje[]>(initial.mensajes);
  const [composer, setComposer] = useState('');
  const [extraccion, setExtraccion] = useState<ExtraccionReservaResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmada, setConfirmada] = useState<ConfirmacionChat | null>(null);
  const [pagoPreview, setPagoPreview] = useState<PagoDemoChat | null>(null);
  const [pagoPreviewLoading, setPagoPreviewLoading] = useState(false);
  const [cotizacionVersion, setCotizacionVersion] = useState(0);
  const [autorizacionPago, setAutorizacionPago] = useState<string | null>(null);
  const [reservaId, setReservaId] = useState<string | null>(null);
  const [datosPedidos, setDatosPedidos] = useState(false);
  const [copilotoAuto, setCopilotoAuto] = useState(false);
  const [esperandoConfirmacionCliente, setEsperandoConfirmacionCliente] = useState(false);
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);
  const [conductorAsignado, setConductorAsignado] = useState<string | null>(null);
  const [guidedStep, setGuidedStep] = useState<GuidedStep | null>(null);
  // Pila de pasos anteriores para poder retroceder en el flujo guiado
  const [guidedHistory, setGuidedHistory] = useState<GuidedStep[]>([]);

  // Mapa de mensajes interactivos ya contestados: id → etiqueta seleccionada
  const [mensajesContestados, setMensajesContestados] = useState<Map<string, string>>(new Map());

  // Refs para guards síncronos (evitan dobles disparos con StrictMode)
  const autoHandledRef = useRef<string | null>(null);
  const enlaceEnviadoRef = useRef(false);
  const autoConfirmingRef = useRef(false);
  const cotizacionKeyRef = useRef<string | null>(null);
  // Bienestar → chat: id de la incidencia de objeto olvidado ya avisada en el chat.
  const incidenciaAvisadaRef = useRef<string | null>(null);
  const pagoPreviewKeyRef = useRef<string | null>(null);
  const resumenEmitidoRef = useRef(0);
  const unidadVistaRef = useRef<string | null>(null);
  const avisoSinUnidadRef = useRef(false);
  const reasignandoRef = useRef(false);

  // Scroll al último mensaje cuando llegan nuevos
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Copiloto en vivo: con el copiloto encendido, cada mensaje del cliente se extrae
  // automáticamente (sin pulsar "Extraer"). Se de-duplica por el último texto del
  // cliente para no re-extraer lo mismo, y no pisa el flujo guiado interactivo.
  const lastAutoExtractRef = useRef<string | null>(null);
  useEffect(() => {
    if (!copilotoAuto || confirmada || guidedStep) return;
    const ultimoCliente = [...messages].reverse().find((m) => m.autor === 'cliente');
    if (!ultimoCliente) return;
    const huella = `${ultimoCliente.id}:${ultimoCliente.texto}`;
    if (lastAutoExtractRef.current === huella) return;
    lastAutoExtractRef.current = huella;
    void extractFromMessages(messages);
  }, [copilotoAuto, messages, confirmada, guidedStep]); // refs internos intencionales

  // Contexto del flujo guiado: accesible síncronamente (ref, no state)
  const guidedTextoRef = useRef<string[]>([]);
  const guidedContextRef = useRef<{
    intent?: 'reservar' | 'consultar' | 'queja';
    tipoUsuario?: 'independiente' | 'corporativo';
    flujo?: 'A' | 'B' | 'C';
  }>({});
  // Overrides estructurados: lo que el cliente eligió/escribió EXPLÍCITAMENTE.
  // Se envían al extractor con prioridad máxima (no se re-derivan por regex), así
  // las ubicaciones con coords, el RUC, el responsable de pago y la fecha quedan
  // guardados de forma estable y nunca se vuelven a preguntar.
  const guidedReservaRef = useRef<Partial<ReservaExtraida>>({});
  const setOverride = (patch: Partial<ReservaExtraida>) => {
    guidedReservaRef.current = { ...guidedReservaRef.current, ...patch };
  };
  // 'puro' = chat nuevo desde cero (cadena fija de preguntas). 'completar' = el
  // copiloto ya leyó un texto libre y solo rellena lo que falta (salta lo conocido).
  const guidedModeRef = useRef<'puro' | 'completar'>('puro');

  const [isPending, startTransition] = useTransition();

  const selected = todasConversaciones.find((c) => c.id === selectedId) ?? initial;

  // ─── Navegación entre conversaciones ──────────────────────────────────────

  function selectConversation(conversation: ConversacionSeed) {
    setSelectedId(conversation.id);
    setMessages(conversation.mensajes);
    setExtraccion(null);
    setError(null);
    setActionMessage(null);
    setConfirmada(null);
    setPagoPreview(null);
    setPagoPreviewLoading(false);
    setCotizacionVersion(0);
    setAutorizacionPago(null);
    setReservaId(null);
    setDatosPedidos(false);
    setEsperandoConfirmacionCliente(false);
    setGuidedStep(null);
    setGuidedHistory([]);
    setEnlaceEnviado(false);
    setConductorAsignado(null);
    setMensajesContestados(new Map());
    autoHandledRef.current = null;
    enlaceEnviadoRef.current = false;
    autoConfirmingRef.current = false;
    cotizacionKeyRef.current = null;
    incidenciaAvisadaRef.current = null;
    resumenEmitidoRef.current = 0;
    unidadVistaRef.current = null;
    avisoSinUnidadRef.current = false;
    reasignandoRef.current = false;
    guidedTextoRef.current = [];
    guidedContextRef.current = {};
    guidedReservaRef.current = {};
    guidedModeRef.current = 'puro';
    lastAutoExtractRef.current = null;
  }

  function nuevoChatManual() {
    const nuevo: ConversacionSeed = {
      id: `manual-${Date.now()}`,
      nombre: `Chat manual ${chatsManuales.length + 1}`,
      subtitulo: 'Escribe como pasajero para probar',
      fuente: 'WhatsApp · prueba manual',
      mensajes: [],
    };
    setChatsManuales((current) => [nuevo, ...current]);
    selectConversation(nuevo);
    // Arrancar flujo guiado inmediatamente: el cliente verá el intent selector sin escribir nada
    preguntarGuiado('intent');
  }

  // Retrocede un paso en el flujo guiado: deshace la última pregunta + respuesta
  function retrocederPaso() {
    if (guidedHistory.length === 0) return;
    const prevHistory = guidedHistory.slice(0, -1);
    const prevStep = guidedHistory[guidedHistory.length - 1]!;

    setGuidedHistory(prevHistory);
    setGuidedStep(prevStep);

    setMessages((msgs) => {
      const arr = [...msgs];

      // Eliminar la pregunta actual de taxigreen (última con widget interactivo)
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i]!.autor === 'taxigreen' && arr[i]!.interactivo) {
          arr.splice(i, 1);
          break;
        }
      }

      // Eliminar la última respuesta del cliente y des-marcar la pregunta anterior
      let prevQId = '';
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i]!.autor === 'cliente') {
          arr.splice(i, 1);
          for (let j = i - 1; j >= 0; j--) {
            if (arr[j]?.autor === 'taxigreen' && arr[j]?.interactivo) {
              prevQId = arr[j]!.id;
              break;
            }
          }
          break;
        }
      }

      if (prevQId) {
        setMensajesContestados((m) => { const n = new Map(m); n.delete(prevQId); return n; });
      }

      return arr;
    });
  }

  // ─── Extracción ───────────────────────────────────────────────────────────

  function extractionPayloadFrom(sourceMessages: ChatMensaje[]) {
    const inbound = sourceMessages
      .filter((m) => m.autor === 'cliente')
      .map((m) => m.texto.trim())
      .filter(Boolean);
    const mensaje = inbound.at(-1) ?? '';
    const previous = inbound.slice(0, -1).join('\n');
    const guiado = guidedTextoRef.current.join('\n');
    const contextoConversacion = [selected.nombre, guiado, previous].filter(Boolean).join('\n');
    return { mensaje, contextoConversacion: contextoConversacion || undefined };
  }

  function overridesActivos(): Partial<ReservaExtraida> | undefined {
    const ov = guidedReservaRef.current;
    return Object.keys(ov).length > 0 ? ov : undefined;
  }

  async function extractFromMessages(sourceMessages: ChatMensaje[]) {
    const payload = extractionPayloadFrom(sourceMessages);
    if (!payload.mensaje) return;
    setLoading(true);
    setError(null);
    setActionMessage(null);
    try {
      const response = await fetch('/api/ingesta/extraer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, overrides: overridesActivos(), fechaActualIso: FECHA_SIMULADOR_ISO }),
      });
      const json = (await response.json()) as unknown;
      if (!response.ok || (typeof json === 'object' && json && 'error' in json)) {
        const err = json as { error?: string };
        throw new Error(err.error ?? 'Extracción fallida.');
      }
      setExtraccion(json as ExtraccionReservaResultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extracción fallida.');
    } finally {
      setLoading(false);
    }
  }

  // Extrae usando el contexto acumulado del flujo guiado + overrides estructurados.
  // Los overrides (ubicación con coords, RUC, pago, fecha) mandan sobre el regex.
  async function extractGuided() {
    const texto = guidedTextoRef.current.join('\n') || selected.nombre;
    if (!texto.trim() && !overridesActivos()) return;
    setLoading(true);
    setError(null);
    setActionMessage(null);
    try {
      const response = await fetch('/api/ingesta/extraer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mensaje: texto || 'reserva guiada',
          contextoConversacion: selected.nombre,
          overrides: overridesActivos(),
          fechaActualIso: FECHA_SIMULADOR_ISO,
        }),
      });
      const json = (await response.json()) as unknown;
      if (!response.ok || (typeof json === 'object' && json && 'error' in json)) {
        const err = json as { error?: string };
        throw new Error(err.error ?? 'Extracción fallida.');
      }
      setExtraccion(json as ExtraccionReservaResultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extracción fallida.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Flujo guiado interactivo ─────────────────────────────────────────────

  function preguntarGuiado(step: GuidedStep) {
    // Guardar el paso actual en la pila de historial antes de avanzar
    setGuidedHistory((prev) => (guidedStep !== null ? [...prev, guidedStep] : prev));
    setGuidedStep(step);

    let texto = '';
    let interactivo: ComponenteInteractivo | undefined;

    switch (step) {
      case 'intent':
        texto = '¡Hola! Bienvenido a Taxi Green. ¿En qué te puedo ayudar hoy?';
        interactivo = {
          tipo: 'intent-selector',
          opciones: [
            { valor: 'reservar', etiqueta: 'Reservar un taxi', descripcion: 'Recojo en aeropuerto, traslado o city', emoji: '🚕' },
            { valor: 'consultar', etiqueta: 'Consultar mi reserva', descripcion: 'Ver estado de una reserva existente', emoji: '📋' },
            { valor: 'queja', etiqueta: 'Reportar un problema', descripcion: 'Objeto olvidado, queja u otra incidencia', emoji: '⚠️' },
          ],
        };
        break;

      case 'tipo_usuario':
        texto = '¿Cómo viajas? Elige una opción:';
        interactivo = {
          tipo: 'radio-group',
          campo: 'perfil_pasajero',
          etiqueta: '¿Cómo viajas?',
          opciones: [
            { valor: 'independiente', etiqueta: 'Viajero independiente', emoji: '👤' },
            { valor: 'corporativo', etiqueta: 'Empresa o corporativo', emoji: '🏢' },
          ],
        };
        break;

      case 'flujo':
        texto = '¿Qué servicio necesitas?';
        interactivo = {
          tipo: 'radio-group',
          campo: 'tipo_viaje',
          etiqueta: '¿Qué servicio?',
          opciones: [
            { valor: 'recojo_aeropuerto', etiqueta: 'Me recogen en el aeropuerto', emoji: '✈️' },
            { valor: 'traslado_aeropuerto', etiqueta: 'Me llevan al aeropuerto', emoji: '🧳' },
            { valor: 'city', etiqueta: 'Traslado en la ciudad', emoji: '🏙️' },
          ],
        };
        break;

      case 'zona_llegada':
        texto = '¿Tu vuelo es nacional o internacional?';
        interactivo = {
          tipo: 'radio-group',
          campo: 'zona_llegada',
          etiqueta: '¿Nacional o internacional?',
          opciones: [
            { valor: 'nacional', etiqueta: 'Nacional (dentro del Perú)', emoji: '🇵🇪' },
            { valor: 'internacional', etiqueta: 'Internacional', emoji: '🌎' },
          ],
        };
        break;

      case 'vuelo':
        // El número de vuelo es opcional: sirve para que el counter ubique al pasajero en el letrero
        texto = '¿Cuál es el número de tu vuelo? (opcional, ayuda al counter a identificarte)';
        interactivo = {
          tipo: 'text-input',
          campo: 'vuelo_codigo',
          placeholder: 'Ej: LA2456, IB123, AM456…',
          skipLabel: 'No tengo / No recuerdo el código',
          skipValor: 'sin_vuelo',
        };
        break;

      case 'ruc_empresa':
        texto = 'Para que tu empresa asuma el gasto, identifícala con su RUC:';
        interactivo = {
          tipo: 'text-input',
          campo: 'pasajero_ruc',
          placeholder: 'RUC de la empresa (11 dígitos)',
          skipLabel: 'No tengo el RUC — lo pago yo',
          skipValor: 'sin_ruc',
        };
        break;

      case 'nombre_pasajero':
        // El counter ubica al pasajero por su nombre en el letrero, así que se pide
        // siempre. Widget de texto (con "Atrás") para mantener la experiencia guiada.
        texto = '¿A nombre de quién va la reserva?';
        interactivo = {
          tipo: 'text-input',
          campo: 'pasajero_nombre',
          placeholder: 'Nombre y apellido del pasajero',
        };
        break;

      case 'fecha':
        texto = '¿Para cuándo necesitas el servicio?';
        interactivo = { tipo: 'date-time-picker' };
        break;

      case 'destino':
        texto = '¿A dónde te dirigimos?';
        interactivo = { tipo: 'location-options', modo: 'destino' };
        break;

      case 'origen_b':
        texto = '¿Desde dónde te recogemos?';
        interactivo = { tipo: 'location-options', modo: 'origen' };
        break;

      case 'responsable_pago':
        texto = '¿El servicio lo cubre tu empresa o lo pagas tú?';
        interactivo = {
          tipo: 'radio-group',
          campo: 'responsable_pago',
          etiqueta: '¿Quién paga?',
          opciones: [
            { valor: 'empresa', etiqueta: 'Lo cubre mi empresa', emoji: '🏢' },
            { valor: 'pasajero', etiqueta: 'Lo pago yo', emoji: '💳' },
          ],
        };
        break;

      case 'vehiculo':
        texto = '¿Cuánto equipaje llevas? (Elige o salta para continuar con el mejor disponible)';
        interactivo = {
          tipo: 'radio-group',
          campo: 'vehiculo',
          etiqueta: '¿Necesitas vehículo especial?',
          opciones: [
            { valor: 'cualquiera', etiqueta: 'El mejor disponible', emoji: '🚗' },
            { valor: 'sedan', etiqueta: 'Sedán', emoji: '🚘' },
            { valor: 'camioneta', etiqueta: 'Camioneta (más espacio)', emoji: '🚙' },
            { valor: 'van', etiqueta: 'Van (grupo grande)', emoji: '🚐' },
          ],
        };
        break;

      case 'code_lookup':
        texto =
          guidedContextRef.current.intent === 'queja'
            ? '¿Cuál es el código de tu reserva? Lo encontrarás en el mensaje de confirmación.'
            : '¿Cuál es el código de tu reserva? (Ej: TG-2026-0001)';
        interactivo = { tipo: 'code-lookup' };
        break;

      case 'datos':
        texto =
          '¡Perfecto! Para terminar, cuéntame en un solo mensaje: nombre del pasajero, teléfono, fecha y hora, vuelo (si aplica), y la dirección de recojo o destino.';
        interactivo = undefined;
        break;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `guia-${step}-${Date.now()}`,
        autor: 'taxigreen',
        hora: horaAhora(),
        texto,
        interactivo,
      },
    ]);
  }

  // Avanza al siguiente paso. En modo 'completar' (copiloto sobre texto libre) NO
  // sigue la cadena fija: re-extrae y deja que pedirDatosInteractivos pida el próximo
  // FALTANTE (así nunca re-pregunta algo ya conocido). En 'puro' sigue la cadena.
  function avanzarGuiado(pasoPuro: GuidedStep) {
    if (guidedModeRef.current === 'completar') {
      setGuidedStep(null);
      void extractGuided();
    } else {
      preguntarGuiado(pasoPuro);
    }
  }

  // Tras la ubicación: corporativo → responsable_pago; particular → vehículo.
  function avanzarTrasUbicacion() {
    avanzarGuiado(guidedContextRef.current.tipoUsuario === 'corporativo' ? 'responsable_pago' : 'vehiculo');
  }

  // Procesa la selección del usuario en un componente interactivo y avanza el flujo.
  // Cada paso fija OVERRIDES estructurados (autoritativos) además del texto sintético
  // que ayuda al regex a resolver el aeropuerto/ámbito.
  function procesarSeleccionInteractiva(valor: string, etiqueta: string, coords?: CoordsSeleccion) {
    const step = guidedStep;
    if (!step) return;

    switch (step) {
      case 'intent':
        guidedContextRef.current = { intent: valor as 'reservar' | 'consultar' | 'queja' };
        if (valor === 'reservar') {
          // El teléfono del pasajero ES el propio WhatsApp; lo fijamos para no pedirlo.
          setOverride({ pasajero_telefono: '959799190' });
          preguntarGuiado('tipo_usuario');
        } else {
          preguntarGuiado('code_lookup');
        }
        return;

      case 'tipo_usuario': {
        const corporativo = valor === 'corporativo';
        guidedContextRef.current.tipoUsuario = corporativo ? 'corporativo' : 'independiente';
        guidedTextoRef.current.push(corporativo ? 'Soy cliente corporativo.' : 'Soy un viajero particular.');
        if (corporativo) {
          setOverride({ perfil_pasajero: 'corporativo' });
        } else {
          // Particular: paga él; no se le pregunta por empresa/RUC nunca.
          setOverride({ perfil_pasajero: 'particular', responsable_pago: 'pasajero' });
        }
        preguntarGuiado('flujo');
        return;
      }

      case 'flujo':
        if (valor === 'recojo_aeropuerto') {
          guidedContextRef.current.flujo = 'A';
          guidedTextoRef.current.push('Necesito que me recojan en el aeropuerto Jorge Chávez.');
          setOverride({ tipo_viaje: 'recojo_aeropuerto' });
          avanzarGuiado('zona_llegada');
        } else if (valor === 'traslado_aeropuerto') {
          guidedContextRef.current.flujo = 'B';
          guidedTextoRef.current.push('Necesito que me lleven al aeropuerto Jorge Chávez.');
          setOverride({ tipo_viaje: 'traslado_aeropuerto' });
          // Flujo B: NO participa el counter ⇒ sin zona ni número de vuelo.
          avanzarGuiado('nombre_pasajero');
        } else {
          guidedContextRef.current.flujo = 'C';
          guidedTextoRef.current.push('Necesito un traslado dentro de la ciudad.');
          setOverride({ tipo_viaje: 'city' });
          avanzarGuiado('nombre_pasajero');
        }
        return;

      case 'zona_llegada':
        guidedTextoRef.current.push(valor === 'nacional' ? 'Mi vuelo es nacional.' : 'Mi vuelo es internacional.');
        preguntarGuiado('vuelo');
        return;

      case 'vuelo':
        if (valor !== 'sin_vuelo') {
          guidedTextoRef.current.push(`Mi vuelo es ${valor}.`);
          setOverride({ vuelo_codigo: valor.toUpperCase() });
        }
        avanzarGuiado('nombre_pasajero');
        return;

      case 'nombre_pasajero':
        setOverride({ pasajero_nombre: valor });
        guidedTextoRef.current.push(`El pasajero se llama ${valor}.`);
        avanzarGuiado('fecha');
        return;

      case 'fecha':
        // `valor` ya viene como ISO (YYYY-MM-DDThh:mm:ss) desde el date-time-picker.
        setOverride({ fecha_hora_servicio: valor });
        guidedTextoRef.current.push(`El servicio es para el ${etiqueta}.`);
        avanzarGuiado(guidedContextRef.current.flujo === 'A' ? 'destino' : 'origen_b');
        return;

      case 'destino':
        setOverride({
          destino_texto: etiqueta,
          destino_lat: coords?.lat ?? null,
          destino_lng: coords?.lng ?? null,
        });
        guidedTextoRef.current.push(`Mi destino es: ${etiqueta}.`);
        avanzarTrasUbicacion();
        return;

      case 'origen_b':
        setOverride({
          origen_texto: etiqueta,
          origen_lat: coords?.lat ?? null,
          origen_lng: coords?.lng ?? null,
        });
        guidedTextoRef.current.push(`El punto de recojo es: ${etiqueta}.`);
        // En city todavía falta el destino; en B la siguiente es pago/vehículo.
        if (guidedContextRef.current.flujo === 'C') avanzarGuiado('destino');
        else avanzarTrasUbicacion();
        return;

      case 'responsable_pago':
        if (valor === 'empresa') {
          guidedTextoRef.current.push('El servicio lo cubre mi empresa.');
          setOverride({ responsable_pago: 'empresa' });
          // Empresa asume el costo ⇒ hay que identificarla con su RUC (siempre se pregunta).
          preguntarGuiado('ruc_empresa');
        } else {
          guidedTextoRef.current.push('Este viaje lo pago yo.');
          setOverride({ responsable_pago: 'pasajero' });
          avanzarGuiado('vehiculo');
        }
        return;

      case 'ruc_empresa':
        if (valor === 'sin_ruc') {
          // Sin identificar la empresa NO puede asumir el costo: lo asume el pasajero.
          guidedTextoRef.current.push('No tengo el RUC; el gasto lo asumo yo.');
          setOverride({ responsable_pago: 'pasajero', pasajero_ruc: null });
        } else {
          // RUC presente ⇒ empresa identificada (demo) ⇒ asume el costo y se factura.
          guidedTextoRef.current.push(`El RUC de la empresa es ${valor}.`);
          setOverride({
            responsable_pago: 'empresa',
            pasajero_ruc: valor,
            empresa_nombre: guidedReservaRef.current.empresa_nombre ?? `Empresa identificada (RUC ${valor})`,
            convenio_validado_demo: true,
            requiere_factura: true,
          });
        }
        avanzarGuiado('vehiculo');
        return;

      case 'vehiculo':
        if (valor === 'sedan') { setOverride({ vehiculo_preferencia: 'sedan' }); guidedTextoRef.current.push('Prefiero un sedán.'); }
        else if (valor === 'camioneta') { setOverride({ vehiculo_preferencia: 'camioneta' }); guidedTextoRef.current.push('Prefiero una camioneta con espacio.'); }
        else if (valor === 'van') { setOverride({ vehiculo_preferencia: 'van' }); guidedTextoRef.current.push('Necesitamos una van para el grupo.'); }
        // 'cualquiera' → sin override (el despacho elige el mejor disponible)
        setGuidedStep(null);
        void extractGuided();
        return;

      case 'code_lookup':
        void lookupReservaEnChat(valor);
        return;

      default:
        return;
    }
  }

  // Cuando el usuario selecciona una opción interactiva (con coords opcionales).
  function respondInteractivo(messageId: string, valor: string, etiqueta: string, coords?: CoordsSeleccion) {
    setMensajesContestados((prev) => new Map(prev).set(messageId, etiqueta));
    setMessages((prev) => [
      ...prev,
      { id: `resp-${Date.now()}`, autor: 'cliente', hora: horaAhora(), texto: etiqueta },
    ]);
    procesarSeleccionInteractiva(valor, etiqueta, coords);
  }

  // Consulta de reserva para el flujo de "consultar/queja"
  async function lookupReservaEnChat(codigo: string) {
    setGuidedStep(null);
    setLoading(true);
    try {
      const resultado = await buscarReservaPorCodigo(codigo);
      if (!resultado.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `lookup-err-${Date.now()}`,
            autor: 'taxigreen',
            hora: horaAhora(),
            texto: `No encontré una reserva con el código ${codigo}. Verifica el código e inténtalo de nuevo, o escríbenos directamente.`,
          },
        ]);
        return;
      }
      const nombre = resultado.nombre ? ` para ${resultado.nombre}` : '';
      const isQueja = guidedContextRef.current.intent === 'queja';
      setMessages((prev) => [
        ...prev,
        {
          id: `lookup-ok-${Date.now()}`,
          autor: 'taxigreen',
          hora: horaAhora(),
          texto: isQueja
            ? `Encontré tu reserva ${resultado.codigo}${nombre}. Estamos registrando tu incidencia. Puedes ver el estado completo de tu viaje aquí:`
            : `Encontré tu reserva ${resultado.codigo}${nombre}. Aquí puedes seguir el estado de tu viaje en tiempo real:`,
          enlace: resultado.link,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ─── Pedir datos al cliente (modo panel derecho) ───────────────────────────

  // Envía la PRIMERA pregunta faltante como componente interactivo (uno por uno,
  // nunca un mensaje "bulk"). Sirve tanto al flujo guiado puro como al copiloto que
  // leyó un texto libre y necesita completar lo que falte.
  function pedirDatosInteractivos() {
    if (!extraccion) return;
    const reserva = extraccion.reserva;
    // El copiloto completa SOLO lo que falta (salta lo ya conocido del texto libre).
    guidedModeRef.current = 'completar';

    // Para el copiloto de texto libre: sembrar el contexto del extractor con el
    // mensaje original, así extractGuided() (que reusa overrides) no parte de cero.
    if (guidedTextoRef.current.length === 0 && reserva.raw_texto) {
      guidedTextoRef.current = [reserva.raw_texto];
    }
    // El teléfono es el propio WhatsApp: lo dejamos listo para no pedirlo.
    if (!reserva.pasajero_telefono && !guidedReservaRef.current.pasajero_telefono) {
      setOverride({ pasajero_telefono: '959799190' });
    }

    // Sincronizar el contexto desde la extracción para tomar la rama correcta.
    if (reserva.tipo_viaje === 'recojo_aeropuerto') guidedContextRef.current.flujo = 'A';
    else if (reserva.tipo_viaje === 'traslado_aeropuerto') guidedContextRef.current.flujo = 'B';
    else if (reserva.tipo_viaje === 'city') guidedContextRef.current.flujo = 'C';
    if (reserva.perfil_pasajero === 'corporativo') guidedContextRef.current.tipoUsuario = 'corporativo';
    else if (reserva.perfil_pasajero) guidedContextRef.current.tipoUsuario = 'independiente';

    const addMsg = (texto: string, interactivo: ComponenteInteractivo) => {
      setMessages((prev) => [
        ...prev,
        { id: `ask-${Date.now()}`, autor: 'taxigreen', hora: horaAhora(), texto, interactivo },
      ]);
      setDatosPedidos(true);
    };

    if (!reserva.tipo_viaje) {
      setGuidedStep('flujo');
      addMsg('¿Qué servicio necesitas?', {
        tipo: 'radio-group',
        campo: 'tipo_viaje',
        etiqueta: '¿Qué servicio?',
        opciones: [
          { valor: 'recojo_aeropuerto', etiqueta: 'Me recogen en el aeropuerto', emoji: '✈️' },
          { valor: 'traslado_aeropuerto', etiqueta: 'Me llevan al aeropuerto', emoji: '🧳' },
          { valor: 'city', etiqueta: 'Traslado en la ciudad', emoji: '🏙️' },
        ],
      });
      return;
    }

    if (!reserva.fecha_hora_servicio) {
      setGuidedStep('fecha');
      addMsg('¿Para cuándo necesitas el servicio?', { tipo: 'date-time-picker' });
      return;
    }

    // Punto de recojo: el cliente lo da en B y en city (en A el origen es el aeropuerto).
    if (!reserva.origen_texto && (reserva.tipo_viaje === 'traslado_aeropuerto' || reserva.tipo_viaje === 'city')) {
      setGuidedStep('origen_b');
      addMsg('¿Desde dónde te recogemos?', { tipo: 'location-options', modo: 'origen' });
      return;
    }

    // Destino: el cliente lo da en A y en city (en B el destino es el aeropuerto).
    if (!reserva.destino_texto && reserva.tipo_viaje !== 'traslado_aeropuerto') {
      setGuidedStep('destino');
      addMsg('¿A dónde te dirigimos?', { tipo: 'location-options', modo: 'destino' });
      return;
    }

    // Nombre del pasajero (para el letrero del counter) — widget de texto.
    if (!reserva.pasajero_nombre) {
      setGuidedStep('nombre_pasajero');
      addMsg('¿A nombre de quién va la reserva?', {
        tipo: 'text-input',
        campo: 'pasajero_nombre',
        placeholder: 'Nombre y apellido del pasajero',
      });
      return;
    }

    // ¿Quién asume el costo? Solo para corporativos sin decidir aún.
    if (reserva.perfil_pasajero === 'corporativo' && !reserva.responsable_pago) {
      setGuidedStep('responsable_pago');
      addMsg('¿El servicio lo cubre tu empresa o lo pagas tú?', {
        tipo: 'radio-group',
        campo: 'responsable_pago',
        etiqueta: '¿Quién paga?',
        opciones: [
          { valor: 'empresa', etiqueta: 'Lo cubre mi empresa', emoji: '🏢' },
          { valor: 'pasajero', etiqueta: 'Lo pago yo', emoji: '💳' },
        ],
      });
      return;
    }

    // RUC: SOLO cuando la empresa asume el costo y aún no la identificamos.
    if (reserva.responsable_pago === 'empresa' && !reserva.pasajero_ruc) {
      setGuidedStep('ruc_empresa');
      addMsg('Para que tu empresa asuma el gasto, identifícala con su RUC:', {
        tipo: 'text-input',
        campo: 'pasajero_ruc',
        placeholder: 'RUC de la empresa (11 dígitos)',
        skipLabel: 'No tengo el RUC — lo pago yo',
        skipValor: 'sin_ruc',
      });
      return;
    }

    // Vehículo (si no se eligió)
    if (!reserva.vehiculo_preferencia) {
      setGuidedStep('vehiculo');
      addMsg('¿Cuánto equipaje llevas? (Elige o salta para continuar con el mejor disponible)', {
        tipo: 'radio-group',
        campo: 'vehiculo',
        etiqueta: '¿Necesitas vehículo especial?',
        opciones: [
          { valor: 'cualquiera', etiqueta: 'El mejor disponible', emoji: '🚗' },
          { valor: 'sedan', etiqueta: 'Sedán', emoji: '🚘' },
          { valor: 'camioneta', etiqueta: 'Camioneta (más espacio)', emoji: '🚙' },
          { valor: 'van', etiqueta: 'Van (grupo grande)', emoji: '🚐' },
        ],
      });
      return;
    }

    // Si todo está cubierto, extraer para refrescar la extracción
    void extractGuided();
  }

  // ─── Enviar mensaje ────────────────────────────────────────────────────────

  function sendMessage() {
    const text = composer.trim();
    if (!text) return;

    const userMsg: ChatMensaje = {
      id: `custom-${Date.now()}`,
      autor: 'cliente',
      hora: horaAhora(),
      texto: text,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setComposer('');

    // Copiloto auto: "Sí" del cliente confirma la reserva
    if (copilotoAuto && esperandoConfirmacionCliente && extraccion && CONFIRMACION_CLIENTE.test(text)) {
      autoConfirmingRef.current = true;
      setEsperandoConfirmacionCliente(false);
      crearYAvisar(extraccion, { auto: true });
      return;
    }

    // Paso "nombre_pasajero": si el usuario escribe en el composer en vez del widget.
    if (guidedStep === 'nombre_pasajero') {
      procesarSeleccionInteractiva(text, text);
      return;
    }

    // Paso de texto "datos" (fallback libre)
    if (guidedStep === 'datos') {
      setGuidedStep(null);
      void extractFromMessages(nextMessages);
      return;
    }

    // Paso de ubicación: si el cliente escribe en el composer en vez de usar el widget,
    // lo resolvemos con la MISMA validación (coords/enlace/dirección). Nunca guardamos
    // texto suelto como ubicación: si no resuelve, pedimos el mapa o un enlace.
    if (guidedStep === 'destino' || guidedStep === 'origen_b') {
      void (async () => {
        const r = await resolverUbicacionDesdeTexto(text, mapboxToken);
        if (r.ok) {
          procesarSeleccionInteractiva(r.label, r.label, r.coords);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `loc-rechazo-${Date.now()}`,
              autor: 'taxigreen',
              hora: horaAhora(),
              texto: `${MOTIVOS_UBICACION[r.motivo]} También puedes tocar "Marcar en el mapa" arriba.`,
            },
          ]);
        }
      })();
      return;
    }

    // Si hay un paso interactivo activo y el usuario escribe texto libre,
    // lo acumulamos como contexto y extraemos igualmente
    if (guidedStep) {
      guidedTextoRef.current.push(text);
      void extractFromMessages(nextMessages);
      setGuidedStep(null);
      return;
    }

    // Cualquier mensaje cuando el chat aún no tiene respuestas de taxigreen ni extracción:
    // arrancar siempre con el intent selector (no asumir intención del texto).
    const hayTaxigreen = messages.some((m) => m.autor === 'taxigreen');
    if (!guidedStep && !extraccion && !confirmada && !hayTaxigreen) {
      guidedTextoRef.current = [text]; // preservar lo que escribió por si elige "Reservar"
      guidedContextRef.current = {};
      guidedModeRef.current = 'puro';
      preguntarGuiado('intent');
      return;
    }

    void extractFromMessages(nextMessages);
  }

  // ─── Crear reserva y avisar al cliente ────────────────────────────────────

  function crearYAvisar(extr: ExtraccionReservaResultado, opciones: { auto: boolean }) {
    if (extr.confianza < 0.7) return;
    setActionMessage(null);
    startTransition(() => {
      void (async () => {
        let result: Awaited<ReturnType<typeof crearReservaDesdeIngesta>>;
        try {
          setAutorizacionPago('Calculando tarifa');
          result = await crearReservaDesdeIngesta(extr);
          if (!result.ok) {
            autoConfirmingRef.current = false;
            setAutorizacionPago(null);
            setActionMessage(`${result.message} ${result.missing.join(', ')}`);
            return;
          }
          setAutorizacionPago('Validando método de pago');
          await new Promise((resolve) => setTimeout(resolve, 420));
          setAutorizacionPago(`${result.pago.estadoLabel} ✓`);
          await new Promise((resolve) => setTimeout(resolve, 420));
        } catch (err) {
          autoConfirmingRef.current = false;
          setAutorizacionPago(null);
          setActionMessage(err instanceof Error ? err.message : 'No se pudo confirmar la reserva.');
          return;
        }
        const confirmacion: ConfirmacionChat = {
          pasajero: result.pasajeroNombre || 'tu pasajero',
          codigo: result.voucherCodigo,
          punto: result.puntoEncuentro ?? result.origenTexto,
          destino: result.destinoTexto,
          fecha: formatFechaCorta(result.fechaHoraServicioIso),
          link: `/p/${result.tokenPasajero}`,
          qrUrl: `/api/voucher/${encodeURIComponent(result.voucherCodigo)}/qr`,
          tipoViaje: result.tipoViaje,
          requiereMostrador: result.requiereMostrador,
          comercial: result.comercial,
          pago: result.pago,
        };
        setMessages((prev) => [
          ...prev,
          {
            id: `ok-${Date.now()}`,
            autor: 'taxigreen',
            hora: horaAhora(),
            texto: result.requiereMostrador
              ? `¡Listo, ${confirmacion.pasajero}! Tu Taxi Green quedó reservado. Te esperamos en ${confirmacion.punto}.`
              : `¡Listo, ${confirmacion.pasajero}! Tu Taxi Green quedó reservado. El recojo será en ${confirmacion.punto}.`,
          },
          { id: `card-${Date.now() + 1}`, autor: 'taxigreen', hora: horaAhora(), texto: '', confirmacion },
        ]);
        setConfirmada(confirmacion);
        setPagoPreview(result.pago);
        setAutorizacionPago(null);
        setReservaId(result.id);
        if (!result.requiereMostrador) {
          enlaceEnviadoRef.current = true;
          setEnlaceEnviado(true);
        }
        if (opciones.auto && !result.requiereMostrador) {
          const asignacion = await asignarConductorAutomatico(result.id);
          if (asignacion.ok) {
            const conductor = `${asignacion.conductorNombre} · ${asignacion.placa}`;
            setConductorAsignado(conductor);
            setMessages((prev) => [
              ...prev,
              {
                id: `driver-${Date.now()}`,
                autor: 'taxigreen',
                hora: horaAhora(),
                texto: `Tu conductor es ${asignacion.conductorNombre}, unidad ${asignacion.placa}. Ya puede iniciar hacia el punto de recojo.`,
              },
            ]);
          } else {
            setActionMessage(asignacion.message);
          }
        }
      })();
    });
  }

  // ─── Efectos ──────────────────────────────────────────────────────────────

  // Polling de voucher validado (trazabilidad A → enlace en vivo)
  useEffect(() => {
    if (!reservaId || !confirmada || enlaceEnviado || !confirmada.requiereMostrador) return;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const seguimiento = await obtenerSeguimientoReserva(reservaId);
          if (!seguimiento.voucherValidado || enlaceEnviadoRef.current) return;
          enlaceEnviadoRef.current = true;
          setEnlaceEnviado(true);
          let conductor = seguimiento.conductor;
          if (copilotoAuto && !conductor) {
            const asignacion = await asignarConductorAutomatico(reservaId);
            if (asignacion.ok) {
              conductor = { nombre: asignacion.conductorNombre, placa: asignacion.placa };
            } else {
              setActionMessage(asignacion.message);
            }
          }
          if (conductor) setConductorAsignado(`${conductor.nombre}${conductor.placa ? ` · ${conductor.placa}` : ''}`);
          setMessages((prev) => [
            ...prev,
            {
              id: `live-${Date.now()}`,
              autor: 'taxigreen',
              hora: horaAhora(),
              texto: conductor
                ? `¡Pase validado! Tu conductor es ${conductor.nombre}${conductor.placa ? `, unidad ${conductor.placa}` : ''}. Sigue tu taxi aquí:`
                : '¡Pase validado! Tu taxi te espera. Sigue tu viaje aquí:',
              enlace: confirmada.link,
            },
          ]);
        } catch {
          // polling best-effort
        }
      })();
    }, 4000);
    return () => clearInterval(timer);
  }, [reservaId, confirmada, enlaceEnviado, copilotoAuto]);

  // Bienestar → chat: si el pasajero reporta un objeto olvidado desde /p, el copiloto
  // lo refleja en ESTE chat con el enlace de seguimiento (espejo del aviso al conductor).
  useEffect(() => {
    if (!reservaId || !confirmada) return;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const incidencia = await obtenerIncidenciaObjetoOlvidado(reservaId);
          if (!incidencia || incidenciaAvisadaRef.current === incidencia.id) return;
          incidenciaAvisadaRef.current = incidencia.id;
          const detalle = incidencia.descripcion.replace(/^Olvidé en el vehículo:\s*/iu, '').replace(/\.$/u, '');
          setMessages((prev) => [
            ...prev,
            {
              id: `incidencia-${incidencia.id}`,
              autor: 'taxigreen',
              hora: horaAhora(),
              texto: `📦 Registramos el objeto olvidado del pasajero${detalle ? ` (${detalle})` : ''}. Ya avisamos al conductor. Sigue el caso aquí:`,
              enlace: incidencia.casoUrl,
            },
          ]);
        } catch {
          // polling best-effort
        }
      })();
    }, 5000);
    return () => clearInterval(timer);
  }, [reservaId, confirmada]);

  // F7: vigilancia de la unidad tras confirmar
  useEffect(() => {
    if (!reservaId || !confirmada) return;
    const pushTaxigreen = (texto: string) => {
      setMessages((prev) => [
        ...prev,
        { id: `unidad-${Date.now()}`, autor: 'taxigreen', hora: horaAhora(), texto },
      ]);
    };
    const disculpa = (nombre: string, placa: string | null) =>
      `Disculpa, tuvimos que cambiar tu unidad para cuidar tu tiempo. Tu nuevo conductor es ${nombre}, unidad ${placa ?? 'por confirmar'}.${enlaceEnviadoRef.current ? ' Tu enlace de seguimiento sigue siendo el mismo.' : ''}`;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const seguimiento = await obtenerSeguimientoReserva(reservaId);
          const actual = seguimiento.conductor
            ? `${seguimiento.conductor.nombre} · ${seguimiento.conductor.placa ?? 'por confirmar'}`
            : null;
          const previa = unidadVistaRef.current;
          if (actual && !previa) {
            unidadVistaRef.current = actual;
            if (avisoSinUnidadRef.current && seguimiento.conductor) {
              avisoSinUnidadRef.current = false;
              setConductorAsignado(actual);
              pushTaxigreen(disculpa(seguimiento.conductor.nombre, seguimiento.conductor.placa));
            }
            return;
          }
          if (actual && previa && actual !== previa) {
            unidadVistaRef.current = actual;
            avisoSinUnidadRef.current = false;
            setConductorAsignado(actual);
            if (seguimiento.conductor) pushTaxigreen(disculpa(seguimiento.conductor.nombre, seguimiento.conductor.placa));
            return;
          }
          if (!actual && previa) {
            unidadVistaRef.current = null;
            if (copilotoAuto && !reasignandoRef.current) {
              reasignandoRef.current = true;
              try {
                const asignacion = await asignarConductorAutomatico(reservaId);
                if (asignacion.ok) {
                  const nueva = `${asignacion.conductorNombre} · ${asignacion.placa}`;
                  unidadVistaRef.current = nueva;
                  avisoSinUnidadRef.current = false;
                  setConductorAsignado(nueva);
                  pushTaxigreen(disculpa(asignacion.conductorNombre, asignacion.placa));
                  return;
                }
              } finally {
                reasignandoRef.current = false;
              }
            }
            if (!avisoSinUnidadRef.current) {
              avisoSinUnidadRef.current = true;
              setConductorAsignado(null);
              pushTaxigreen('Tu unidad tuvo un inconveniente. Ya estamos asignando otra para cuidar tu tiempo; te confirmamos aquí en un momento.');
            }
          }
        } catch {
          // best-effort
        }
      })();
    }, 5000);
    return () => clearInterval(timer);
  }, [reservaId, confirmada, copilotoAuto]);

  // Cotización en tiempo real
  useEffect(() => {
    if (!extraccion) {
      setPagoPreview(null);
      setPagoPreviewLoading(false);
      setCotizacionVersion(0);
      cotizacionKeyRef.current = null;
      return;
    }
    let cancelled = false;
    const reserva = extraccion.reserva;
    const cotizacionKey = cotizacionKeyDe(reserva);
    setPagoPreviewLoading(true);
    previsualizarPagoDesdeIngesta(extraccion)
      .then((result) => {
        if (cancelled) return;
        setPagoPreview(result.ok ? result.pago : null);
        // La clave del preview rastrea a qué extracción pertenece la tarifa, para
        // que el resumen no se emita con una cotización de otra versión.
        pagoPreviewKeyRef.current = result.ok ? cotizacionKey : null;
        if (result.ok && cotizacionKeyRef.current !== cotizacionKey) {
          cotizacionKeyRef.current = cotizacionKey;
          setCotizacionVersion((v) => v + 1);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPagoPreview(null);
          pagoPreviewKeyRef.current = null;
        }
      })
      .finally(() => { if (!cancelled) setPagoPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [extraccion]);

  // Copiloto auto — no actúa mientras el flujo guiado esté en curso
  useEffect(() => {
    if (!copilotoAuto || !extraccion || confirmada || loading || esperandoConfirmacionCliente || autoConfirmingRef.current) return;
    if (guidedStep !== null) return; // flujo guiado tiene prioridad
    if (pagoPreviewLoading) return; // esperar la tarifa para mostrarla en el resumen
    const reserva = extraccion.reserva;

    // ¿Falta algo para poder crear la reserva? (lo que crearReserva exige + el RUC
    // cuando la empresa asume el costo). Si falta, se pide UN widget (nunca bulk).
    const faltaUbicacion =
      (reserva.tipo_viaje === 'recojo_aeropuerto' && !reserva.destino_texto) ||
      (reserva.tipo_viaje === 'traslado_aeropuerto' && !reserva.origen_texto) ||
      (reserva.tipo_viaje === 'city' && (!reserva.origen_texto || !reserva.destino_texto));
    const faltaRucEmpresa = reserva.responsable_pago === 'empresa' && !reserva.pasajero_ruc;
    const faltaPagoCorp = reserva.perfil_pasajero === 'corporativo' && !reserva.responsable_pago;
    // Solo campos que un widget puede pedir (evita quedar en bucle por un aclarador
    // que pida algo sin widget). Cubre todo lo que crearReserva exige para crear.
    const faltaAlgo =
      !reserva.tipo_viaje ||
      !reserva.fecha_hora_servicio ||
      faltaUbicacion ||
      !reserva.pasajero_nombre ||
      faltaPagoCorp ||
      faltaRucEmpresa;

    // El resumen NUNCA se emite sin la tarifa de ESTA extracción. Si la cotización
    // todavía no llega (o corresponde a otra versión), esperamos: el efecto vuelve a
    // correr cuando `pagoPreview` se actualiza. Garantiza "siempre con cotización".
    if (!faltaAlgo) {
      const cotKey = cotizacionKeyDe(reserva);
      if (pagoPreviewLoading || !pagoPreview || pagoPreviewKeyRef.current !== cotKey) return;
    }

    const key = `${selectedId}:${extraccion.reserva.raw_texto}:${faltaAlgo ? 'falta' : 'listo'}:${JSON.stringify(guidedReservaRef.current)}:${Math.round(extraccion.confianza * 100)}`;
    if (autoHandledRef.current === key) return;
    autoHandledRef.current = key;

    if (faltaAlgo) {
      // Pide el PRÓXIMO dato faltante como widget interactivo, uno por uno.
      pedirDatosInteractivos();
      setEsperandoConfirmacionCliente(false);
      return;
    }

    // Todo listo: resumen + tarifa (incluso si la empresa asume el gasto) + confirmación.
    const comercial = identidadDesdeExtraccion(reserva);
    resumenEmitidoRef.current += 1;
    const intro = resumenEmitidoRef.current > 1 ? 'Actualicé tu reserva:' : 'Te confirmo tu reserva:';
    setMessages((prev) => [
      ...prev,
      {
        id: `sum-${Date.now()}`,
        autor: 'taxigreen',
        hora: horaAhora(),
        texto:
          `${intro}\n` +
          `• Recojo: ${reserva.punto_encuentro ?? reserva.origen_texto ?? 'por confirmar'}\n` +
          `• Destino: ${reserva.destino_texto ?? 'por confirmar'}\n` +
          `• Pasajero: ${reserva.pasajero_nombre ?? 'por confirmar'}\n` +
          `• Fecha: ${formatValue(reserva.fecha_hora_servicio)}\n` +
          `• Cliente: ${comercial.resumen}\n` +
          `• Tarifa estimada: ${pagoPreview?.montoEtiqueta ?? 'calculando…'}\n` +
          `• ${comercial.pagoChat}\n` +
          `¿La confirmo? Responde "Sí" y queda lista.`,
      },
    ]);
    setEsperandoConfirmacionCliente(true);
  }, [
    copilotoAuto, extraccion, confirmada, loading, selectedId,
    pagoPreview, pagoPreviewLoading, cotizacionVersion, esperandoConfirmacionCliente, guidedStep,
  ]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const estado = estadoReserva(extraccion, Boolean(confirmada));

  return (
    <main className="min-h-screen bg-[#e7f0ee] text-[#111B21] xl:h-screen xl:overflow-hidden">
      <div className="grid min-h-screen grid-cols-1 xl:h-screen xl:grid-cols-[320px_minmax(420px,1fr)_420px]">

        {/* ── Lista de chats ──────────────────────────────────────────── */}
        <aside className="flex flex-col border-r border-[#c9d7d3] bg-[#f7fbfa] xl:h-screen xl:min-h-0">
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[#d8e3e0] bg-[#075E54] px-5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15">
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h1 className="text-base font-semibold">WhatsApp</h1>
              <p className="text-xs text-white/75">Taxi Green · Reservas</p>
            </div>
            <button
              aria-label="Nuevo chat manual"
              className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15 transition hover:bg-white/25"
              onClick={nuevoChatManual}
              type="button"
            >
              <Plus aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto p-3">
            {todasConversaciones.map((conversation) => (
              <button
                className={cn(
                  'mb-2 grid w-full grid-cols-[42px_1fr] gap-3 rounded-md px-3 py-3 text-left transition',
                  conversation.id === selectedId
                    ? 'bg-[#d8f3e8] text-[#063f38]'
                    : 'bg-white text-[#273936] hover:bg-[#eef7f4]',
                )}
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                type="button"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#128C7E] text-white">
                  <UserRound aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{conversation.nombre}</span>
                  <span className="mt-1 block truncate text-xs text-[#687a76]">{conversation.subtitulo}</span>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Chat ────────────────────────────────────────────────────── */}
        <section className="flex min-h-screen flex-col bg-[#efe7dd] xl:h-screen xl:min-h-0">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#d4cbc0] bg-[#f0f2f5] px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#075E54] text-white">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{selected.nombre}</h2>
                <p className="truncate text-xs text-[#667781]">{selected.fuente}</p>
              </div>
            </div>
            <Button
              className="bg-[#128C7E] hover:bg-[#075E54]"
              disabled={loading}
              onClick={() => void extractFromMessages(messages)}
              type="button"
            >
              {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Wand2 aria-hidden="true" className="h-4 w-4" />}
              Extraer
            </Button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
              {messages.map((message) => {
                const isContestado = Boolean(mensajesContestados.get(message.id));
                const seleccionado = mensajesContestados.get(message.id);
                return (
                  <div
                    className={cn('flex', message.autor === 'cliente' ? 'justify-start' : 'justify-end')}
                    key={message.id}
                  >
                    <div
                      className={cn(
                        'max-w-[86%] rounded-md px-4 py-3 text-sm leading-relaxed shadow-sm',
                        message.autor === 'cliente' ? 'bg-white' : 'bg-[#DCF8C6]',
                      )}
                    >
                      {message.confirmacion ? (
                        <ConfirmacionMensaje data={message.confirmacion} />
                      ) : (
                        <>
                          {message.texto && <p className="whitespace-pre-line">{message.texto}</p>}
                          {message.enlace ? <EnlaceMensaje link={message.enlace} /> : null}
                          {message.interactivo ? (
                            <ComponenteInteractivoChat
                              contestado={isContestado}
                              interactivo={message.interactivo}
                              mapboxToken={mapboxToken}
                              onSeleccionar={(valor, etiqueta, coords) => respondInteractivo(message.id, valor, etiqueta, coords)}
                              onRetroceder={!isContestado && guidedHistory.length > 0 ? retrocederPaso : undefined}
                              seleccionado={seleccionado}
                            />
                          ) : null}
                        </>
                      )}
                      <p className="mt-2 text-right text-[11px] text-[#667781]">{message.hora}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-px" />
            </div>
          </div>

          <footer className="shrink-0 border-t border-[#d4cbc0] bg-[#f0f2f5] p-3">
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <textarea
                className="min-h-12 flex-1 resize-none rounded-md border border-[#d5ddd9] bg-white px-4 py-3 text-sm outline-none focus:border-[#128C7E] focus:ring-2 focus:ring-[#128C7E]/20"
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Escribe o pega un WhatsApp..."
                rows={1}
                value={composer}
              />
              <Button
                aria-label="Enviar mensaje"
                className="h-12 w-12 bg-[#128C7E] px-0 hover:bg-[#075E54]"
                onClick={sendMessage}
                type="button"
              >
                <Send aria-hidden="true" className="h-5 w-5" />
              </Button>
            </div>
          </footer>
        </section>

        {/* ── Panel derecho: reserva sugerida ─────────────────────────── */}
        <aside className="border-l border-[#c9d7d3] bg-[#f7fbfa] xl:h-screen xl:overflow-y-auto">
          <div className="flex h-16 items-center justify-between border-b border-[#d8e3e0] px-5">
            <div>
              <p className="text-xs font-semibold uppercase text-[#128C7E]">Reserva sugerida</p>
              <h2 className="text-base font-semibold text-[#0a332f]">{fuenteLabel(extraccion)}</h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e0f5ef] text-[#075E54]">
              {fuenteIcon(extraccion)}
            </span>
          </div>

          <div className="space-y-4 p-5">
            {/* Modo copiloto */}
            <div
              className={cn(
                'flex items-center justify-between gap-3 rounded-md border p-4 transition',
                copilotoAuto ? 'border-emerald-300 bg-emerald-50' : 'border-[#d8e3e0] bg-white',
              )}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-bold text-[#0a332f]">
                  <Bot aria-hidden="true" className="h-4 w-4 text-[#075E54]" />
                  Modo copiloto
                </p>
                <p className="mt-1 text-xs leading-4 text-[#667781]">
                  {copilotoAuto
                    ? 'El copiloto responde, pide confirmación y coordina el flujo.'
                    : 'Apagado: tú revisas y confirmas cada reserva.'}
                </p>
              </div>
              <button
                aria-checked={copilotoAuto}
                aria-label="Activar modo copiloto"
                className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', copilotoAuto ? 'bg-[#075E54]' : 'bg-[#c9d7d3]')}
                onClick={() => setCopilotoAuto((v) => !v)}
                role="switch"
                type="button"
              >
                <span
                  className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', copilotoAuto ? 'left-6' : 'left-1')}
                />
              </button>
            </div>

            {error ? (
              <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <div className="rounded-md border border-[#d8e3e0] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className={cn('rounded-full px-3 py-1 text-xs font-bold', ESTADO_TONE[estado.tone])}>
                  {estado.label}
                </span>
                {extraccion ? (
                  <span className="text-[11px] font-medium text-[#9aa7a3]">
                    Lectura {Math.round(extraccion.confianza * 100)}%
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[#3b4a47]">
                {extraccion?.motivo ?? 'Pega o elige un WhatsApp para leer la reserva.'}
              </p>
            </div>

            {autorizacionPago ? (
              <section className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  {autorizacionPago.endsWith('✓') ? (
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  )}
                  {autorizacionPago}
                </div>
                <p className="mt-1 text-xs leading-4 text-emerald-800">
                  Dejando la tarifa estimada protegida lista antes de confirmar.
                </p>
              </section>
            ) : null}

            {extraccion && (pagoPreview || pagoPreviewLoading) ? (
              <section className="rounded-md border border-[#d8e3e0] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#0a332f]">
                      <CreditCard aria-hidden="true" className="h-4 w-4 text-[#075E54]" />
                      Tarifa estimada protegida
                    </h3>
                    <p className="mt-1 text-xs leading-4 text-[#667781]">
                      Versión v{cotizacionVersion || 1}. Cambia solo si el cliente corrige destino o condiciones.
                    </p>
                  </div>
                  {pagoPreviewLoading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-[#075E54]" /> : null}
                </div>
                {pagoPreview ? (
                  <div className="mt-3 rounded-md bg-[#f0faf6] p-3">
                    <p className="text-lg font-bold text-[#063f38]">{pagoPreview.montoEtiqueta}</p>
                    <p className="mt-1 text-sm text-[#3b4a47]">
                      {pagoPreview.metodoLabel} · {pagoPreview.estadoLabel}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#075E54]">
                      {identidadDesdeExtraccion(extraccion.reserva).pagoChat}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {extraccion ? (
              <>
                {FIELD_GROUPS.map((group) => (
                  <section className="rounded-md border border-[#d8e3e0] bg-white p-4" key={group.label}>
                    <h3 className="mb-3 text-sm font-semibold text-[#0a332f]">{group.label}</h3>
                    <div className="space-y-2">
                      {group.keys
                        .filter(([key]) => {
                          if (key !== 'punto_encuentro') return true;
                          return (
                            extraccion.reserva.tipo_viaje === 'recojo_aeropuerto' ||
                            Boolean(extraccion.reserva.punto_encuentro)
                          );
                        })
                        .map(([key, label]) => {
                          const value = extraccion.reserva[key];
                          return (
                            <div className="grid grid-cols-[92px_1fr] gap-3 text-sm" data-field={key} key={key}>
                              <span className="text-[#667781]">{label}</span>
                              <span
                                className={cn(
                                  'min-w-0 break-words font-medium',
                                  value === null || value === '' ? 'text-amber-700' : 'text-[#111B21]',
                                )}
                              >
                                {formatValue(value)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </section>
                ))}

                {extraccion.preguntas_aclaracion.length > 0 ? (
                  <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <h3 className="mb-2 flex items-center gap-2 font-semibold">
                      <AlertCircle aria-hidden="true" className="h-4 w-4" />
                      Falta confirmar
                    </h3>
                    <ul className="space-y-1">
                      {extraccion.preguntas_aclaracion.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                    <Button
                      className="mt-3 w-full bg-[#128C7E] hover:bg-[#075E54]"
                      disabled={datosPedidos || Boolean(confirmada)}
                      onClick={pedirDatosInteractivos}
                      type="button"
                    >
                      <MessagesSquare aria-hidden="true" className="h-4 w-4" />
                      {datosPedidos ? 'Pedido enviado al chat' : 'Pedir estos datos al cliente'}
                    </Button>
                  </section>
                ) : (
                  <section className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    Datos completos. Listo para confirmar.
                  </section>
                )}

                {actionMessage ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {actionMessage}
                  </div>
                ) : null}

                {confirmada ? (
                  <section className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                      <p className="text-sm font-semibold">Enviada al cliente</p>
                    </div>
                    <ul className="mt-2 space-y-1.5 text-xs leading-4 text-emerald-800">
                      <li>
                        ✓ Reserva <span className="font-semibold">{confirmada.codigo}</span>
                        {confirmada.requiereMostrador ? ' + pase de abordaje en el chat' : ' + seguimiento directo'}
                      </li>
                      {confirmada.requiereMostrador ? (
                        <li>
                          {enlaceEnviado
                            ? '✓ Pase validado en mostrador · enlace en vivo enviado'
                            : '○ Enlace en vivo: se envía cuando el mostrador valide el pase'}
                        </li>
                      ) : (
                        <li>✓ Sin mostrador · el enlace en vivo ya está disponible</li>
                      )}
                      <li>
                        {conductorAsignado
                          ? `✓ Conductor: ${conductorAsignado}`
                          : confirmada.requiereMostrador
                            ? '○ Conductor: se informa después de validar el pase'
                            : '○ Conductor: despacho lo asignará al servicio'}
                      </li>
                    </ul>
                    {reservaId ? (
                      <Button
                        className="mt-3 w-full border border-[#cfe0db] bg-white text-[#075E54] hover:bg-[#eef7f4]"
                        onClick={() => router.push(`/admin/reservas/${reservaId}`)}
                        type="button"
                      >
                        Abrir en despacho
                      </Button>
                    ) : null}
                  </section>
                ) : copilotoAuto ? (
                  <section className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <Bot aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    {esperandoConfirmacionCliente
                      ? 'El copiloto envió el resumen y espera el "Sí" del cliente para crear la reserva.'
                      : 'El copiloto está conversando con el cliente. Creará la reserva cuando el cliente confirme.'}
                  </section>
                ) : (
                  <>
                    <Button
                      className="h-12 w-full bg-[#075E54] hover:bg-[#05453e]"
                      disabled={isPending || extraccion.confianza < 0.7}
                      onClick={() => crearYAvisar(extraccion, { auto: false })}
                      type="button"
                    >
                      {isPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ClipboardCheck aria-hidden="true" className="h-4 w-4" />}
                      Confirmar y avisar al cliente
                    </Button>
                    <p className="text-center text-xs text-[#667781]">
                      {extraccion.confianza < 0.7
                        ? 'Completa o aclara los datos antes de confirmar.'
                        : extraccion.reserva.tipo_viaje === 'recojo_aeropuerto'
                          ? 'Al confirmar, el cliente recibe su reserva y su pase; el enlace en vivo llega al validar en mostrador.'
                          : 'Al confirmar, el cliente recibe su reserva y el enlace en vivo directo.'}
                    </p>
                  </>
                )}
              </>
            ) : (
              <div className="rounded-md border border-dashed border-[#bdd2cc] bg-white p-6 text-sm text-[#667781]">
                Selecciona una conversación o pega un WhatsApp para extraer los datos de reserva.
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

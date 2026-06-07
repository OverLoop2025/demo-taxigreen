'use client';

import {
  Car,
  CheckCircle2,
  Crosshair,
  FileText,
  MapPin,
  Maximize2,
  PackageSearch,
  Phone,
  Plane,
  Search,
  Send,
  Star,
  UserRound,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { estadoViajePasajero, formatLlegada, type EstadoViaje } from '@taxigreen/shared/copy';
import { BottomSheet, type SheetLevel } from '@/components/product/bottom-sheet';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { PassengerPosition, PassengerRating, PassengerTripData } from '@/lib/pasajero';

type Props = {
  initialData: PassengerTripData;
};

type RouteFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, never>;
    geometry: {
      type: 'LineString';
      coordinates: Array<[number, number]>;
    };
  }>;
};

type RouteState = {
  distanciaMetros: number | null;
  duracionSegundos: number | null;
  duracionSinTraficoSegundos: number | null;
  geometry: PassengerTripData['tracking']['geometry'];
  fuente: PassengerTripData['tracking']['fuente'];
};

type MapboxMap = {
  remove: () => void;
  resize: () => void;
  on: (event: 'load', callback: () => void) => void;
  addSource: (id: string, source: Record<string, unknown>) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  getSource: (id: string) => { setData: (data: RouteFeatureCollection) => void } | undefined;
  fitBounds: (bounds: MapboxBounds, options: Record<string, unknown>) => void;
};

type MapboxMarker = {
  setLngLat: (coordinates: [number, number]) => MapboxMarker;
  addTo: (map: MapboxMap) => MapboxMarker;
  remove: () => void;
};

type MapboxBounds = {
  extend: (coordinates: [number, number]) => MapboxBounds;
};

type MapboxGL = {
  accessToken: string;
  Map: new (options: Record<string, unknown>) => MapboxMap;
  Marker: new (options?: Record<string, unknown>) => MapboxMarker;
  LngLatBounds: new (a: [number, number], b: [number, number]) => MapboxBounds;
};

declare global {
  interface Window {
    mapboxgl?: MapboxGL;
  }
}

let mapboxPromise: Promise<MapboxGL | null> | null = null;

function loadMapboxGl() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  if (mapboxPromise) return mapboxPromise;

  mapboxPromise = new Promise((resolve) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://api.mapbox.com/mapbox-gl-js/v3.5.1/mapbox-gl.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.5.1/mapbox-gl.js';
    script.async = true;
    script.onload = () => resolve(window.mapboxgl ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return mapboxPromise;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Castea el estado de DB (string|null) al tipo de copy humano. */
function toEstadoViaje(estado: string | null): EstadoViaje {
  if (
    estado === 'en_camino' ||
    estado === 'en_punto' ||
    estado === 'a_bordo' ||
    estado === 'finalizado' ||
    estado === 'cancelado'
  ) {
    return estado;
  }
  return 'asignado';
}

function isFinished(data: PassengerTripData) {
  return data.reserva.estado === 'por_liquidar' || data.viaje.estado === 'finalizado';
}

function callHref(value: string | null | undefined) {
  return value ? `tel:${value.replace(/[^\d+]/g, '')}` : undefined;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getCoordinates(point: { lat: number | null; lng: number | null }) {
  return typeof point.lat === 'number' && typeof point.lng === 'number'
    ? ([point.lng, point.lat] as [number, number])
    : null;
}

// Tramo a recalcular en vivo desde el GPS del conductor (siempre conductor→target,
// que Mapbox traza por calles). Devuelve null en fases sin tramo activo
// (en_punto/finalizado): ahí NO se recalcula y se conserva la geometría real del
// servidor. Nunca se sintetiza una recta en el cliente.
function routeTarget(data: PassengerTripData) {
  if (data.viaje.estado === 'a_bordo') return getCoordinates(data.ruta.destino);
  if (data.viaje.estado === 'en_camino' || data.viaje.estado === 'asignado' || data.viaje.estado === null) {
    return getCoordinates(data.ruta.origen);
  }
  return null;
}

function distanceMeters(a: PassengerPosition, b: PassengerPosition) {
  const earth = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Anti-degradación de geometría: una vez que tenemos la curva real de Mapbox NO la
// reemplazamos por la recta de la estimación. Sólo otra curva mapbox (o no tener
// curva previa) cambia la geometría dibujada. Las métricas (distancia/llegada) sí se
// refrescan siempre. Esto elimina el salto curva→recta que producían el refresh de
// 10 s y los recálculos que caían al fallback determinista.
function preferRealGeometry(current: RouteState, incoming: Partial<RouteState>): RouteState {
  const distanciaMetros =
    typeof incoming.distanciaMetros === 'number' ? incoming.distanciaMetros : current.distanciaMetros;
  const duracionSegundos =
    typeof incoming.duracionSegundos === 'number' ? incoming.duracionSegundos : current.duracionSegundos;
  const duracionSinTraficoSegundos =
    incoming.duracionSinTraficoSegundos !== undefined
      ? incoming.duracionSinTraficoSegundos
      : current.duracionSinTraficoSegundos;

  const incomingIsMapbox = incoming.fuente === 'mapbox' && incoming.geometry?.type === 'LineString';
  const currentIsMapbox = current.fuente === 'mapbox' && current.geometry != null;

  if (incomingIsMapbox) {
    return {
      distanciaMetros,
      duracionSegundos,
      duracionSinTraficoSegundos,
      geometry: incoming.geometry ?? current.geometry,
      fuente: 'mapbox',
    };
  }

  if (currentIsMapbox) {
    return { distanciaMetros, duracionSegundos, duracionSinTraficoSegundos, geometry: current.geometry, fuente: current.fuente };
  }

  return {
    distanciaMetros,
    duracionSegundos,
    duracionSinTraficoSegundos,
    geometry: incoming.geometry !== undefined ? incoming.geometry : current.geometry,
    fuente: incoming.fuente ?? current.fuente,
  };
}

/** Minutos de llegada derivados de la ruta (o del tracking del servidor). */
function minutosLlegada(route: RouteState, data: PassengerTripData) {
  const segundos = route.duracionSegundos ?? data.tracking.etaMinutos * 60;
  return Math.max(0, Math.ceil(segundos / 60));
}

/** Fondo a pantalla completa cuando el mapa no carga: humano, sin datos técnicos. */
function MapFallback({ data }: { data: PassengerTripData }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-product-deep to-neutral-900 px-8 pb-[42dvh] pt-8 text-center">
      <div className="max-w-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <MapPin className="h-7 w-7 text-white" />
        </div>
        <p className="mt-4 text-lg font-semibold text-white">Estamos siguiendo tu viaje</p>
        <p className="mt-2 text-sm leading-6 text-white/70">
          {data.ruta.origen.texto} → {data.ruta.destino.texto}
        </p>
      </div>
    </div>
  );
}

function PassengerMap({
  data,
  driverPosition,
  route,
  recenterKey,
}: {
  data: PassengerTripData;
  driverPosition: PassengerPosition | null;
  route: RouteState;
  recenterKey: number;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxRef = useRef<MapboxGL | null>(null);
  const driverMarkerRef = useRef<MapboxMarker | null>(null);
  const originMarkerRef = useRef<MapboxMarker | null>(null);
  const destinationMarkerRef = useRef<MapboxMarker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Sólo se dibuja geometría REAL de Mapbox (>2 vértices = trazado por calles).
  // Si no hay ruta real todavía, `line` queda vacío y no se pinta ninguna línea
  // (jamás una recta de 2 puntos). Los marcadores siguen visibles.
  const line = useMemo(
    () => (route.geometry && route.geometry.coordinates.length > 2 ? route.geometry.coordinates : []),
    [route.geometry],
  );

  // Crea el mapa UNA vez (deps `[token]`): el cleanup recreaba el mapa por cada
  // posición y reseteaba el zoom durante el tracking. Las actualizaciones van abajo.
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;

    let cancelled = false;
    void loadMapboxGl().then((mapboxgl) => {
      if (cancelled || !mapboxgl || !containerRef.current) {
        if (!mapboxgl) setError('mapa_no_disponible');
        return;
      }

      mapboxRef.current = mapboxgl;
      const origin = getCoordinates(data.ruta.origen);
      const destination = getCoordinates(data.ruta.destino);
      const center = origin ?? destination ?? [-77.08, -12.06];
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        // Tema oscuro sobrio (alineado a la paleta azul): el chrome del mapa es
        // negro/azul profundo y la ruta resalta en cian brillante.
        style: 'mapbox://styles/mapbox/dark-v11',
        center,
        zoom: 11.5,
        // Zoom máximo cómodo: evita "perderse" haciendo zoom al vacío.
        maxZoom: 17,
        attributionControl: false,
      });
      mapRef.current = map;

      // Mantener el canvas sincronizado con el tamaño real del contenedor. Sin
      // esto, si el mapa se inicializa antes de que el layout (columna/dvh) se
      // asiente, los gestos quedan desfasados y el paneo se siente "duro".
      if (containerRef.current && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => map.resize());
        observer.observe(containerRef.current);
        resizeObserverRef.current = observer;
      }

      map.on('load', () => {
        if (cancelled) return;
        const routeData: RouteFeatureCollection = {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } }],
        };
        map.addSource('route', { type: 'geojson', data: routeData });
        map.addLayer({
          id: 'route-casing',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#053226',
            'line-width': ['interpolate', ['linear'], ['zoom'], 9, 7, 14, 12, 18, 18],
            'line-opacity': 0.55,
            'line-blur': 0.5,
          },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#34D399',
            'line-width': ['interpolate', ['linear'], ['zoom'], 9, 3, 14, 6, 18, 9],
            'line-opacity': 0.95,
          },
        });

        if (origin) originMarkerRef.current = new mapboxgl.Marker({ color: '#22C55E' }).setLngLat(origin).addTo(map);
        if (destination) {
          destinationMarkerRef.current = new mapboxgl.Marker({ color: '#E2E8F0' }).setLngLat(destination).addTo(map);
        }
        if (driverPosition) {
          driverMarkerRef.current = new mapboxgl.Marker({ color: '#10B981' })
            .setLngLat([driverPosition.lng, driverPosition.lat])
            .addTo(map);
        }

        const framePoints =
          line.length >= 2
            ? line
            : ([origin, destination, driverPosition ? [driverPosition.lng, driverPosition.lat] : null].filter(
                Boolean,
              ) as [number, number][]);
        if (framePoints.length >= 2) {
          const bounds = new mapboxgl.LngLatBounds(framePoints[0]!, framePoints[0]!);
          framePoints.forEach((coordinates) => bounds.extend(coordinates));
          map.fitBounds(bounds, { padding: { top: 90, left: 40, right: 40, bottom: 320 }, duration: 0 });
        }
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      originMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
  }, [token]);

  // Actualiza ruta y conductor SIN recrear el mapa ni re-encajar (evita salto de zoom).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    map.getSource('route')?.setData({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } }],
    });

    if (driverPosition) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLngLat([driverPosition.lng, driverPosition.lat]);
      } else if (mapboxRef.current) {
        driverMarkerRef.current = new mapboxRef.current.Marker({ color: '#10B981' })
          .setLngLat([driverPosition.lng, driverPosition.lat])
          .addTo(map);
      }
    }
  }, [driverPosition, line, ready]);

  // Recentrar bajo demanda (botón). No corre en el primer render (recenterKey=0).
  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl || !ready || recenterKey === 0) return;
    const origin = getCoordinates(data.ruta.origen);
    const destination = getCoordinates(data.ruta.destino);
    const framePoints =
      line.length >= 2
        ? line
        : ([origin, destination, driverPosition ? [driverPosition.lng, driverPosition.lat] : null].filter(
            Boolean,
          ) as [number, number][]);
    if (framePoints.length >= 2) {
      const bounds = new mapboxgl.LngLatBounds(framePoints[0]!, framePoints[0]!);
      framePoints.forEach((coordinates) => bounds.extend(coordinates));
      map.fitBounds(bounds, { padding: { top: 90, left: 40, right: 40, bottom: 280 }, duration: 500 });
    }
  }, [recenterKey]);

  if (!token || error) {
    return <MapFallback data={data} />;
  }

  return <div ref={containerRef} className="absolute inset-0 h-full w-full bg-neutral-900" />;
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-surface-muted p-3">
      <div className="mt-0.5 text-product">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function RatingButtons({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((nivel) => (
          <button
            className={`flex h-10 items-center justify-center rounded-lg border text-sm font-semibold ${
              value === nivel
                ? 'border-product bg-product text-white'
                : 'border-border bg-surface text-foreground hover:bg-surface-muted'
            }`}
            key={nivel}
            type="button"
            onClick={() => onChange(nivel)}
          >
            {nivel}
          </button>
        ))}
      </div>
    </div>
  );
}

function CompletionPanel({ data, refresh }: { data: PassengerTripData; refresh: () => Promise<void> }) {
  const [dni, setDni] = useState(data.pasajero.dni ?? '');
  const [nombreDocumento, setNombreDocumento] = useState('');
  const [documentStatus, setDocumentStatus] = useState<string | null>(null);
  // Revelado progresivo: el PDF sólo se ofrece cuando el comprobante ya existe.
  const [comprobanteListo, setComprobanteListo] = useState(Boolean(data.comprobante.tipo));
  const [rating, setRating] = useState<PassengerRating>(
    data.calificacion ?? { servicio: 5, conductor: 5, unidad: 5, motivo: '', comentario: '' },
  );
  const [ratingStatus, setRatingStatus] = useState<string | null>(null);
  const needsReason = rating.servicio <= 3 || rating.conductor <= 3 || rating.unidad <= 3;

  const lookupDni = async () => {
    if (!/^\d{8}$/.test(dni)) {
      setDocumentStatus('Ingresa un DNI de 8 dígitos o deja el campo vacío.');
      return;
    }
    setDocumentStatus('Consultando tus datos…');
    const response = await fetch('/api/reniec/lookup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tipo: 'dni', documento: dni }),
    });
    const payload = (await response.json().catch(() => null)) as {
      payload?: { nombres?: string; apellido_paterno?: string; apellido_materno?: string };
    } | null;
    if (!response.ok || !payload?.payload) {
      setDocumentStatus('No disponible; puedes continuar sin documento.');
      return;
    }
    const fullName = [payload.payload.nombres, payload.payload.apellido_paterno, payload.payload.apellido_materno]
      .filter(Boolean)
      .join(' ');
    setNombreDocumento(fullName);
    setDocumentStatus(`Datos confirmados: ${fullName}`);
  };

  const emitirComprobante = async () => {
    setDocumentStatus('Preparando tu comprobante…');
    const response = await fetch(`/api/pasajero/${data.token}/comprobante`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tipo: 'boleta', dni: dni || null, nombre: nombreDocumento || null }),
    });
    if (!response.ok) {
      setDocumentStatus('No se pudo preparar el comprobante.');
      return;
    }
    setDocumentStatus('Comprobante listo.');
    setComprobanteListo(true);
    await refresh();
  };

  const saveRating = async () => {
    setRatingStatus('Guardando tu calificación…');
    const response = await fetch(`/api/pasajero/${data.token}/calificacion`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rating),
    });
    if (!response.ok) {
      setRatingStatus('Cuéntanos el motivo si algo estuvo en 3 o menos.');
      return;
    }
    setRatingStatus('¡Gracias! Tu calificación quedó registrada.');
    await refresh();
  };

  return (
    <section className="rounded-2xl border border-success/30 bg-surface p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-5 w-5 text-success" />
        <div>
          <p className="text-xs font-semibold uppercase text-success">Viaje completado</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Comprobante y calificación</h2>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-xl bg-surface-muted p-3">
          <p className="text-sm font-semibold text-foreground">¿Necesitas comprobante?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
              inputMode="numeric"
              maxLength={8}
              placeholder="DNI (opcional)"
              value={dni}
              onChange={(event) => setDni(event.target.value.replace(/\D/g, ''))}
            />
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-product px-4 text-sm font-semibold text-product"
              type="button"
              onClick={lookupDni}
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>
          {documentStatus ? <p className="mt-2 text-sm text-foreground-muted">{documentStatus}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-product px-4 text-sm font-semibold text-white"
              type="button"
              onClick={emitirComprobante}
            >
              <FileText className="h-4 w-4" />
              Preparar comprobante
            </button>
            {comprobanteListo ? (
              <a
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-product"
                href={data.comprobante.pdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                <FileText className="h-4 w-4" />
                Descargar PDF
              </a>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl bg-surface-muted p-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-product" />
            <p className="text-sm font-semibold text-foreground">¿Cómo estuvo tu viaje?</p>
          </div>
          <div className="mt-4 grid gap-4">
            <RatingButtons
              label="Servicio"
              value={rating.servicio}
              onChange={(value) => setRating((current) => ({ ...current, servicio: value }))}
            />
            <RatingButtons
              label="Conductor"
              value={rating.conductor}
              onChange={(value) => setRating((current) => ({ ...current, conductor: value }))}
            />
            <RatingButtons
              label="Vehículo"
              value={rating.unidad}
              onChange={(value) => setRating((current) => ({ ...current, unidad: value }))}
            />
            {needsReason ? (
              <input
                className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
                placeholder="Cuéntanos qué pasó"
                value={rating.motivo ?? ''}
                onChange={(event) => setRating((current) => ({ ...current, motivo: event.target.value }))}
              />
            ) : null}
            <textarea
              className="min-h-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              placeholder="Comentario (opcional)"
              value={rating.comentario ?? ''}
              onChange={(event) => setRating((current) => ({ ...current, comentario: event.target.value }))}
            />
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-product px-4 text-sm font-semibold text-white"
              type="button"
              onClick={saveRating}
            >
              <Send className="h-4 w-4" />
              Enviar calificación
            </button>
            {ratingStatus ? <p className="text-sm text-foreground-muted">{ratingStatus}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function IncidentPanel({ data, refresh }: { data: PassengerTripData; refresh: () => Promise<void> }) {
  const [descripcion, setDescripcion] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const lastIncident = data.incidencias.find((item) => item.tipologia === 'objeto_olvidado');

  const submitIncident = async () => {
    setStatus('Registrando tu caso…');
    const response = await fetch('/api/incidencias', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token_pasajero: data.token, descripcion }),
    });
    const payload = (await response.json().catch(() => null)) as { caso_url?: string; error?: string } | null;
    if (!response.ok) {
      setStatus(
        payload?.error === 'solo_objeto_olvidado_demo'
          ? 'Por ahora solo registramos objetos olvidados.'
          : 'No se pudo registrar.',
      );
      return;
    }
    setDescripcion('');
    setStatus('Caso creado. Taxi Green ya lo está revisando.');
    await refresh();
  };

  return (
    <section className="rounded-2xl border border-care/20 bg-surface p-4">
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <PackageSearch className="h-5 w-5 text-care" />
        <span className="flex-1">
          <span className="block text-sm font-semibold text-foreground">¿Olvidaste algo?</span>
          <span className="block text-xs text-foreground-muted">Cuéntanos y lo buscamos</span>
        </span>
      </button>
      {open ? (
        <div className="mt-3">
          <textarea
            className="min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="Ej.: Olvidé una cartera en el asiento de atrás."
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
          />
          <button
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-care px-4 text-sm font-semibold text-white disabled:opacity-50"
            disabled={descripcion.trim().length < 8}
            type="button"
            onClick={submitIncident}
          >
            <Send className="h-4 w-4" />
            Reportar objeto olvidado
          </button>
          {status ? <p className="mt-2 text-sm text-foreground-muted">{status}</p> : null}
          {lastIncident ? (
            <a className="mt-3 inline-flex text-sm font-semibold text-care" href={lastIncident.casoUrl}>
              Ver mi caso
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

async function fetchPassengerData(token: string) {
  const response = await fetch(`/api/pasajero/${token}`, { cache: 'no-store' });
  if (!response.ok) return null;
  return (await response.json()) as PassengerTripData;
}

function normalizePosition(payload: unknown): PassengerPosition | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.lat !== 'number' || typeof record.lng !== 'number') return null;
  return {
    lat: record.lat,
    lng: record.lng,
    heading: typeof record.heading === 'number' ? record.heading : null,
    speed: typeof record.speed === 'number' ? record.speed : null,
    ts: typeof record.ts === 'string' ? record.ts : new Date().toISOString(),
  };
}

/** Resumen del conductor + placa + llegada + botón llamar (lo esencial, sin scroll). */
function DriverSummary({
  data,
  route,
  finished,
}: {
  data: PassengerTripData;
  route: RouteState;
  finished: boolean;
}) {
  const estado = toEstadoViaje(data.viaje.estado);
  const placa = data.unidad?.placa ?? 'Por confirmar';
  return (
    <div>
      <p className="text-sm font-medium text-foreground-muted">{estadoViajePasajero(estado)}</p>
      <p className="mt-0.5 text-2xl font-semibold text-foreground">
        {finished ? 'Llegaste a tu destino' : formatLlegada(minutosLlegada(route, data))}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-product-deep text-base font-semibold text-white">
          {data.conductor.fotoUrl ? (
            <img src={data.conductor.fotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(data.conductor.nombre) || <UserRound className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{data.conductor.nombre}</p>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-foreground-muted">
            <span>★ {data.conductor.rating?.toFixed(1) ?? '5.0'}</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 font-semibold text-foreground">
              <Car className="h-3.5 w-3.5" /> {placa}
            </span>
          </p>
        </div>
        {data.conductor.telefono ? (
          <a
            aria-label="Llamar al conductor"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-product text-white shadow-sm"
            href={callHref(data.conductor.telefono)}
          >
            <Phone className="h-5 w-5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function PassengerTrackingClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [driverPosition, setDriverPosition] = useState<PassengerPosition | null>(initialData.tracking.posicion);
  const [route, setRoute] = useState<RouteState>({
    distanciaMetros: initialData.tracking.distanciaMetros,
    duracionSegundos: initialData.tracking.duracionSegundos,
    duracionSinTraficoSegundos: initialData.tracking.duracionSinTraficoSegundos,
    geometry: initialData.tracking.geometry,
    fuente: initialData.tracking.fuente,
  });
  // Indicador humano de actualización en vivo (nunca "Realtime"/"Polling").
  const [liveStatus, setLiveStatus] = useState<'en_vivo' | 'actualizando'>('actualizando');
  const [sheetLevel, setSheetLevel] = useState<SheetLevel>('collapsed');
  const [immersive, setImmersive] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const lastRouteCalcRef = useRef<{ position: PassengerPosition; ts: number } | null>(null);
  const finished = isFinished(data);
  const estado = toEstadoViaje(data.viaje.estado);

  const refresh = useCallback(async () => {
    const next = await fetchPassengerData(initialData.token);
    if (next) {
      setData(next);
      if (next.tracking.posicion) setDriverPosition(next.tracking.posicion);
      setRoute((current) =>
        preferRealGeometry(current, {
          distanciaMetros: next.tracking.distanciaMetros,
          duracionSegundos: next.tracking.duracionSegundos,
          duracionSinTraficoSegundos: next.tracking.duracionSinTraficoSegundos,
          geometry: next.tracking.geometry,
          fuente: next.tracking.fuente,
        }),
      );
    }
  }, [initialData.token]);

  useEffect(() => {
    if (!driverPosition || finished) return;
    const target = routeTarget(data);
    if (!target) return;

    const last = lastRouteCalcRef.current;
    const now = Date.now();
    if (last) {
      const movedEnough = distanceMeters(last.position, driverPosition) >= 120;
      const waitedEnough = now - last.ts >= 6000;
      if (!movedEnough || !waitedEnough) return;
    }

    lastRouteCalcRef.current = { position: driverPosition, ts: now };
    const controller = new AbortController();
    void fetch('/api/rutas/calcular', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        token_pasajero: data.token,
        origen: { lat: driverPosition.lat, lng: driverPosition.lng },
        destino: { lat: target[1], lng: target[0] },
        perfil: 'driving-traffic',
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload || typeof payload !== 'object') return;
        const record = payload as Partial<RouteState>;
        setRoute((current) =>
          preferRealGeometry(current, {
            distanciaMetros: typeof record.distanciaMetros === 'number' ? record.distanciaMetros : undefined,
            duracionSegundos: typeof record.duracionSegundos === 'number' ? record.duracionSegundos : undefined,
            duracionSinTraficoSegundos:
              typeof record.duracionSinTraficoSegundos === 'number'
                ? record.duracionSinTraficoSegundos
                : record.duracionSinTraficoSegundos === null
                  ? null
                  : undefined,
            geometry:
              record.geometry?.type === 'LineString' && record.geometry.coordinates.length > 2
                ? record.geometry
                : undefined,
            fuente: record.fuente === 'mapbox' || record.fuente === 'estimacion' ? record.fuente : undefined,
          }),
        );
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [data, driverPosition, finished]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLiveStatus('actualizando');
      return;
    }

    const channel = supabase
      .channel(data.realtimeChannel)
      .on('broadcast', { event: 'estado' }, (event) => {
        const payload = event.payload as Record<string, unknown>;
        setData((current) => ({
          ...current,
          reserva: {
            ...current.reserva,
            estado: typeof payload.estado_reserva === 'string' ? payload.estado_reserva : current.reserva.estado,
          },
          viaje: {
            ...current.viaje,
            estado: typeof payload.estado_viaje === 'string' ? payload.estado_viaje : current.viaje.estado,
            updatedAt: typeof payload.ts === 'string' ? payload.ts : current.viaje.updatedAt,
          },
        }));
        void refresh();
      })
      .on('broadcast', { event: 'posicion' }, (event) => {
        const position = normalizePosition(event.payload);
        if (position) setDriverPosition(position);
      })
      .on('broadcast', { event: 'incidencia' }, () => {
        void refresh();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setLiveStatus('en_vivo');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setLiveStatus('actualizando');
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [data.realtimeChannel, refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const llegadaTexto = finished ? 'Viaje completado' : formatLlegada(minutosLlegada(route, data));

  return (
    <div className="relative flex h-[100dvh] w-full justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      {/* Columna centrada (máx. 480px) en desktop: la experiencia map-first se
          mantiene contenida y limpia como en móvil, sin área vacía a pantalla
          ancha. h-full = altura de viewport, así el bottom sheet (que mide con
          window.innerHeight) sigue calzando exacto. */}
      <main className="relative h-full w-full max-w-[480px] overflow-hidden bg-background shadow-2xl">
        <PassengerMap data={data} driverPosition={driverPosition} route={route} recenterKey={recenterKey} />

      {/* Controles del mapa (siempre visibles) */}
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex flex-col gap-2">
        <button
          type="button"
          aria-label="Centrar el mapa"
          onClick={() => setRecenterKey((value) => value + 1)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/95 text-foreground shadow-md backdrop-blur"
        >
          <Crosshair className="h-5 w-5" />
        </button>
        {!immersive ? (
          <button
            type="button"
            aria-label="Ver el mapa en pantalla completa"
            onClick={() => setImmersive(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/95 text-foreground shadow-md backdrop-blur"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {immersive ? (
        <>
          {/* Modo inmersivo: solo mapa + barra inferior breve. */}
          <button
            type="button"
            onClick={() => setImmersive(false)}
            className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-20 inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface/95 px-4 text-sm font-semibold text-foreground shadow-md backdrop-blur"
          >
            <X className="h-4 w-4" /> Cerrar
          </button>
          <div className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 flex items-center gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{llegadaTexto}</p>
              <p className="truncate text-xs text-foreground-muted">
                {data.conductor.nombre} · {data.unidad?.placa ?? 'Por confirmar'}
              </p>
            </div>
            {data.conductor.telefono ? (
              <a
                aria-label="Llamar al conductor"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-product text-white"
                href={callHref(data.conductor.telefono)}
              >
                <Phone className="h-5 w-5" />
              </a>
            ) : null}
          </div>
        </>
      ) : (
        <>
          {/* Banner superior breve */}
          <div className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-2 shadow-md backdrop-blur">
              <span className="rounded bg-brand-tenant px-2 py-0.5 text-xs font-semibold text-white">Taxi Green</span>
              <span className="truncate text-sm font-medium text-foreground">{estadoViajePasajero(estado)}</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted">
                <span
                  className={`h-2 w-2 rounded-full ${liveStatus === 'en_vivo' ? 'bg-success' : 'bg-warning'}`}
                />
                {liveStatus === 'en_vivo' ? 'En vivo' : 'Actualizando'}
              </span>
            </div>
            <ThemeToggle className="bg-surface/95 shadow-md backdrop-blur" />
          </div>

          <BottomSheet level={sheetLevel} onLevelChange={setSheetLevel}>
            <DriverSummary data={data} route={route} finished={finished} />

            <div className="mt-4 rounded-2xl border-2 border-product/70 bg-product-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-product">Punto de encuentro</p>
              <p className="mt-1 text-xl font-semibold leading-snug text-foreground">
                {data.ruta.puntoEncuentro ?? 'Salida 3, columna F2'}
              </p>
            </div>

            <div className="mt-4 grid gap-2">
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Recojo" value={data.ruta.origen.texto} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Destino" value={data.ruta.destino.texto} />
              <InfoRow
                icon={<Plane className="h-4 w-4" />}
                label="Vuelo"
                value={data.ruta.vueloCodigo ?? 'Por confirmar'}
              />
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label="Pasajero"
                value={`${data.pasajero.nombre} · ${formatDate(data.reserva.fechaHoraServicio)}`}
              />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2 text-sm">
              <span className="text-foreground-muted">Tu código</span>
              <span className="font-semibold tracking-wide text-foreground">{data.reserva.voucherCodigo}</span>
            </div>

            {finished ? (
              <div className="mt-4 grid gap-3">
                <CompletionPanel data={data} refresh={refresh} />
                <IncidentPanel data={data} refresh={refresh} />
              </div>
            ) : null}

            <a
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-product"
              href="tel:+5116111111"
            >
              <Phone className="h-4 w-4" />
              Llamar a Taxi Green
            </a>
          </BottomSheet>
        </>
      )}
      </main>
    </div>
  );
}

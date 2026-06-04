'use client';

import {
  Car,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  PackageSearch,
  Phone,
  Plane,
  Route,
  Search,
  Send,
  Star,
  UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
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

function statusLabel(value: string | null) {
  if (value === 'asignado') return 'Asignado';
  if (value === 'en_camino') return 'En camino';
  if (value === 'en_punto') return 'En el punto';
  if (value === 'a_bordo') return 'A bordo';
  if (value === 'finalizado') return 'Finalizado';
  return 'Confirmado';
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

function buildLine(data: PassengerTripData, driverPosition: PassengerPosition | null) {
  const origin = getCoordinates(data.ruta.origen);
  const destination = getCoordinates(data.ruta.destino);
  const driver =
    driverPosition && typeof driverPosition.lat === 'number' && typeof driverPosition.lng === 'number'
      ? ([driverPosition.lng, driverPosition.lat] as [number, number])
      : null;

  return [driver, origin, destination].filter((item): item is [number, number] => Boolean(item));
}

function routeTarget(data: PassengerTripData) {
  if (data.viaje.estado === 'finalizado') return null;
  if (data.viaje.estado === 'en_punto') return null;
  if (data.viaje.estado === 'a_bordo') return getCoordinates(data.ruta.destino);
  return getCoordinates(data.ruta.origen);
}

function distanceMeters(a: PassengerPosition, b: PassengerPosition) {
  const earth = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(value: number | null) {
  if (typeof value !== 'number') return 'Distancia estimada';
  if (value < 1000) return `${Math.round(value)} m`;
  return `${(value / 1000).toFixed(1)} km`;
}

function routeLabel(route: RouteState) {
  return route.fuente === 'mapbox' ? 'Ruta real' : 'Estimación';
}

// Anti-degradación de geometría: una vez que tenemos la curva real de Mapbox NO la
// reemplazamos por la recta de la estimación. Sólo otra curva mapbox (o no tener
// curva previa) cambia la geometría dibujada. Las métricas (distancia/ETA) sí se
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

function RouteFallback({
  data,
  driverPosition,
  route,
}: {
  data: PassengerTripData;
  driverPosition: PassengerPosition | null;
  route: RouteState;
}) {
  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">Ruta</p>
          <h2 className="mt-1 text-lg font-semibold text-product-deep">Seguimiento operativo</h2>
        </div>
        <span className="rounded-md bg-product-muted px-2 py-1 text-xs font-semibold text-product">
          ETA {data.tracking.etaMinutos} min
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-md bg-product-muted px-2 py-1 text-product">{routeLabel(route)}</span>
        <span className="rounded-md bg-neutral-100 px-2 py-1 text-neutral-600">
          {formatDistance(route.distanciaMetros)}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        <RouteLineItem icon={<MapPin className="h-4 w-4" />} label="Recojo" value={data.ruta.origen.texto} />
        <RouteLineItem
          icon={<Clock className="h-4 w-4" />}
          label="Conductor"
          value={
            driverPosition
              ? `${driverPosition.lat.toFixed(5)}, ${driverPosition.lng.toFixed(5)}`
              : 'Esperando primera posición'
          }
        />
        <RouteLineItem icon={<MapPin className="h-4 w-4" />} label="Destino" value={data.ruta.destino.texto} />
      </div>
    </section>
  );
}

function RouteLineItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-md bg-neutral-50 p-3">
      <div className="mt-1 text-product">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
        <p className="mt-1 text-sm font-medium text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function PassengerMap({
  data,
  driverPosition,
  route,
}: {
  data: PassengerTripData;
  driverPosition: PassengerPosition | null;
  route: RouteState;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxRef = useRef<MapboxGL | null>(null);
  const driverMarkerRef = useRef<MapboxMarker | null>(null);
  const originMarkerRef = useRef<MapboxMarker | null>(null);
  const destinationMarkerRef = useRef<MapboxMarker | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const line = useMemo(
    () => (route.geometry?.coordinates.length ? route.geometry.coordinates : buildLine(data, driverPosition)),
    [data, driverPosition, route.geometry],
  );

  // Crear el mapa UNA sola vez (deps `[token]`). Antes este effect dependía de
  // `driverPosition`/`line`, que cambian cada 3 s, así que el cleanup destruía y
  // recreaba el mapa en cada posición → flicker y reset de zoom durante el
  // tracking en vivo. Las actualizaciones de ruta/marcador van en el effect de
  // abajo. (react-hooks/exhaustive-deps no está activo en este repo.)
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;

    let cancelled = false;
    void loadMapboxGl().then((mapboxgl) => {
      if (cancelled || !mapboxgl || !containerRef.current) {
        if (!mapboxgl) setError('mapbox_no_disponible');
        return;
      }

      mapboxRef.current = mapboxgl;
      const origin = getCoordinates(data.ruta.origen);
      const destination = getCoordinates(data.ruta.destino);
      const center = origin ?? destination ?? [-77.08, -12.06];
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        // Tema oscuro sobrio (alineado a la paleta azul del producto): el chrome
        // del mapa pasa a negro/azul profundo y la ruta resalta en cian brillante.
        style: 'mapbox://styles/mapbox/dark-v11',
        center,
        zoom: 11.5,
        attributionControl: false,
      });
      mapRef.current = map;

      map.on('load', () => {
        if (cancelled) return;
        const routeData: RouteFeatureCollection = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: line,
              },
            },
          ],
        };
        map.addSource('route', { type: 'geojson', data: routeData });
        // Capa inferior (casing): halo azul profundo de marca que da grosor y
        // contraste sobre el mapa oscuro. El grosor escala con el zoom para que la
        // ruta se vea consistente de lejos y de cerca.
        map.addLayer({
          id: 'route-casing',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#0B0952',
            'line-width': ['interpolate', ['linear'], ['zoom'], 9, 7, 14, 12, 18, 18],
            'line-opacity': 0.55,
            'line-blur': 0.5,
          },
        });
        // Capa superior: trazo cian brillante (refresca sobre el oscuro).
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#38BDF8',
            'line-width': ['interpolate', ['linear'], ['zoom'], 9, 3, 14, 6, 18, 9],
            'line-opacity': 0.95,
          },
        });

        // Marcadores con colores que contrastan sobre el tema oscuro.
        if (origin) originMarkerRef.current = new mapboxgl.Marker({ color: '#22C55E' }).setLngLat(origin).addTo(map);
        if (destination) {
          destinationMarkerRef.current = new mapboxgl.Marker({ color: '#E2E8F0' })
            .setLngLat(destination)
            .addTo(map);
        }
        if (driverPosition) {
          driverMarkerRef.current = new mapboxgl.Marker({ color: '#38BDF8' })
            .setLngLat([driverPosition.lng, driverPosition.lat])
            .addTo(map);
        }

        if (line.length >= 2) {
          const bounds = new mapboxgl.LngLatBounds(line[0]!, line[0]!);
          line.forEach((coordinates) => bounds.extend(coordinates));
          map.fitBounds(bounds, { padding: 42, duration: 0 });
        }
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      originMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
    // deps intencionalmente solo [token]: el mapa se crea una vez; ruta y conductor
    // se actualizan en el effect siguiente sin recrearlo.
  }, [token]);

  // Actualizar ruta y conductor SIN recrear el mapa. Crea el marcador del
  // conductor si la primera posición llega después de cargar el mapa. No re-encaja
  // los bounds en cada posición (evita el salto de zoom); el marcador se mueve solo.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const source = map.getSource('route');
    source?.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: line,
          },
        },
      ],
    });

    if (driverPosition) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLngLat([driverPosition.lng, driverPosition.lat]);
      } else if (mapboxRef.current) {
        driverMarkerRef.current = new mapboxRef.current.Marker({ color: '#227FDE' })
          .setLngLat([driverPosition.lng, driverPosition.lat])
          .addTo(map);
      }
    }
  }, [driverPosition, line, ready]);

  if (!token || error) {
    return <RouteFallback data={data} driverPosition={driverPosition} route={route} />;
  }

  return (
    <section className="overflow-hidden rounded-md border border-border bg-white">
      <div ref={containerRef} className="h-72 w-full bg-neutral-900" />
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
        <span className="font-medium text-product-deep">
          ETA {Math.max(0, Math.ceil((route.duracionSegundos ?? data.tracking.etaMinutos * 60) / 60))} min
        </span>
        <span className="inline-flex items-center gap-2 text-neutral-500">
          <Route className="h-4 w-4" />
          {routeLabel(route)} · {formatDistance(route.distanciaMetros)}
        </span>
      </div>
    </section>
  );
}

function DriverCard({ data }: { data: PassengerTripData }) {
  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-product-deep text-lg font-semibold text-white">
          {initials(data.conductor.nombre) || <UserRound className="h-7 w-7" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase text-neutral-500">Tu conductor</p>
          <h2 className="truncate text-xl font-semibold text-product-deep">{data.conductor.nombre}</h2>
          <p className="mt-1 text-sm text-neutral-600">
            ★ {data.conductor.rating?.toFixed(2) ?? '5.00'} · {data.conductor.totalViajes ?? 0} viajes
          </p>
        </div>
        {data.conductor.telefono ? (
          <a
            aria-label="Llamar al conductor"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-product text-white"
            href={callHref(data.conductor.telefono)}
          >
            <Phone className="h-5 w-5" />
          </a>
        ) : null}
      </div>
    </section>
  );
}

function VehicleCard({ data }: { data: PassengerTripData }) {
  const unidad = data.unidad;
  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">Unidad</p>
          <h2 className="mt-1 text-2xl font-semibold text-product-deep">{unidad?.placa ?? 'Por confirmar'}</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {unidad ? `${unidad.marca} ${unidad.modelo} · ${unidad.color ?? 'Taxi Green'}` : 'Asignada por despacho'}
          </p>
        </div>
        <div className="flex h-16 w-20 items-center justify-center rounded-md bg-product-muted text-product">
          <Car className="h-8 w-8" />
        </div>
      </div>
    </section>
  );
}

function MeetingPointCard({ data }: { data: PassengerTripData }) {
  return (
    <section className="rounded-md border-2 border-product bg-white p-5">
      <p className="text-xs font-semibold uppercase text-product">Punto de encuentro</p>
      <h2 className="mt-2 text-3xl font-semibold leading-tight text-product-deep">
        {data.ruta.puntoEncuentro ?? 'Salida 3, columna F2'}
      </h2>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Recojo físico en {data.ruta.origen.texto}. El hotel solicitó el servicio; no es el punto de recojo.
      </p>
    </section>
  );
}

const timelineSteps = [
  { key: 'asignado', label: 'Asignado' },
  { key: 'en_camino', label: 'En camino' },
  { key: 'en_punto', label: 'Llegó' },
  { key: 'a_bordo', label: 'A bordo' },
  { key: 'finalizado', label: 'Finalizado' },
];

function activeStepIndex(estado: string | null) {
  const index = timelineSteps.findIndex((step) => step.key === estado);
  if (index >= 0) return index;
  return 0;
}

function TripTimeline({ data }: { data: PassengerTripData }) {
  const index = activeStepIndex(data.viaje.estado);
  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">Estado del viaje</p>
          <h2 className="mt-1 text-lg font-semibold text-product-deep">{statusLabel(data.viaje.estado)}</h2>
        </div>
        <span className="rounded-md bg-product-muted px-2 py-1 text-xs font-semibold text-product">
          {data.reserva.estado.replaceAll('_', ' ')}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {timelineSteps.map((step, stepIndex) => {
          const active = stepIndex <= index;
          return (
            <div className="min-w-0" key={step.key}>
              <div className={`h-2 rounded-full ${active ? 'bg-product' : 'bg-neutral-200'}`} />
              <p className={`mt-2 truncate text-[11px] font-semibold ${active ? 'text-product-deep' : 'text-neutral-400'}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
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
      <p className="text-sm font-semibold text-product-deep">{label}</p>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            className={`flex h-10 items-center justify-center rounded-md border text-sm font-semibold ${
              value === score
                ? 'border-product bg-product text-white'
                : 'border-border bg-white text-neutral-700 hover:bg-product-muted'
            }`}
            key={score}
            type="button"
            onClick={() => onChange(score)}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

function CompletionPanel({
  data,
  refresh,
}: {
  data: PassengerTripData;
  refresh: () => Promise<void>;
}) {
  const [dni, setDni] = useState(data.pasajero.dni ?? '');
  const [nombreDocumento, setNombreDocumento] = useState('');
  const [documentStatus, setDocumentStatus] = useState<string | null>(null);
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
    setDocumentStatus('Consultando RENIEC demo...');
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
    const fullName = [
      payload.payload.nombres,
      payload.payload.apellido_paterno,
      payload.payload.apellido_materno,
    ]
      .filter(Boolean)
      .join(' ');
    setNombreDocumento(fullName);
    setDocumentStatus(`DNI validado: ${fullName}`);
  };

  const emitirComprobante = async () => {
    setDocumentStatus('Preparando comprobante...');
    const response = await fetch(`/api/pasajero/${data.token}/comprobante`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        tipo: 'boleta',
        dni: dni || null,
        nombre: nombreDocumento || null,
      }),
    });
    if (!response.ok) {
      setDocumentStatus('No se pudo preparar el comprobante.');
      return;
    }
    setDocumentStatus('Comprobante listo para descargar.');
    await refresh();
  };

  const saveRating = async () => {
    setRatingStatus('Guardando calificación...');
    const response = await fetch(`/api/pasajero/${data.token}/calificacion`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rating),
    });
    if (!response.ok) {
      setRatingStatus('Completa el motivo si algún eje tiene 3 o menos.');
      return;
    }
    setRatingStatus('Gracias, calificación registrada.');
    await refresh();
  };

  return (
    <section className="rounded-md border border-success/30 bg-white p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-5 w-5 text-success" />
        <div>
          <p className="text-xs font-semibold uppercase text-success">Viaje finalizado</p>
          <h2 className="mt-1 text-xl font-semibold text-product-deep">Comprobante y calificación</h2>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-md bg-neutral-50 p-3">
          <p className="text-sm font-semibold text-product-deep">Boleta opcional</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className="h-11 rounded-md border border-border px-3 text-sm"
              inputMode="numeric"
              maxLength={8}
              placeholder="DNI opcional"
              value={dni}
              onChange={(event) => setDni(event.target.value.replace(/\D/g, ''))}
            />
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-product px-4 text-sm font-semibold text-product"
              type="button"
              onClick={lookupDni}
            >
              <Search className="h-4 w-4" />
              RENIEC
            </button>
          </div>
          {documentStatus ? <p className="mt-2 text-sm text-neutral-600">{documentStatus}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-product px-4 text-sm font-semibold text-white"
              type="button"
              onClick={emitirComprobante}
            >
              <FileText className="h-4 w-4" />
              Preparar comprobante
            </button>
            <a
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-product"
              href={data.comprobante.pdfUrl}
              target="_blank"
              rel="noreferrer"
            >
              <FileText className="h-4 w-4" />
              Descargar PDF
            </a>
          </div>
        </div>

        <div className="rounded-md bg-neutral-50 p-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-product" />
            <p className="text-sm font-semibold text-product-deep">Calificación triple</p>
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
              label="Unidad"
              value={rating.unidad}
              onChange={(value) => setRating((current) => ({ ...current, unidad: value }))}
            />
            {needsReason ? (
              <input
                className="h-11 rounded-md border border-border px-3 text-sm"
                placeholder="Motivo breve"
                value={rating.motivo ?? ''}
                onChange={(event) => setRating((current) => ({ ...current, motivo: event.target.value }))}
              />
            ) : null}
            <textarea
              className="min-h-24 rounded-md border border-border px-3 py-2 text-sm"
              placeholder="Comentario opcional"
              value={rating.comentario ?? ''}
              onChange={(event) => setRating((current) => ({ ...current, comentario: event.target.value }))}
            />
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-product px-4 text-sm font-semibold text-white"
              type="button"
              onClick={saveRating}
            >
              <Send className="h-4 w-4" />
              Guardar calificación
            </button>
            {ratingStatus ? <p className="text-sm text-neutral-600">{ratingStatus}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function IncidentPanel({
  data,
  refresh,
}: {
  data: PassengerTripData;
  refresh: () => Promise<void>;
}) {
  const [descripcion, setDescripcion] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const lastIncident = data.incidencias.find((item) => item.tipologia === 'objeto_olvidado');

  const submitIncident = async () => {
    setStatus('Registrando incidencia...');
    const response = await fetch('/api/incidencias', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token_pasajero: data.token,
        descripcion,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { caso_url?: string; error?: string } | null;
    if (!response.ok) {
      setStatus(payload?.error === 'solo_objeto_olvidado_demo' ? 'Por ahora solo registramos objeto olvidado.' : 'No se pudo registrar.');
      return;
    }
    setDescripcion('');
    setStatus('Caso creado. Taxi Green ya lo está revisando.');
    await refresh();
  };

  return (
    <section className="rounded-md border border-care/20 bg-white p-4">
      <div className="flex items-start gap-3">
        <PackageSearch className="mt-1 h-5 w-5 text-care" />
        <div>
          <p className="text-xs font-semibold uppercase text-care">Soporte de viaje</p>
          <h2 className="mt-1 text-xl font-semibold text-product-deep">¿Olvidaste algo?</h2>
        </div>
      </div>
      <textarea
        className="mt-4 min-h-28 w-full rounded-md border border-border px-3 py-2 text-sm"
        placeholder="Ej.: Olvidé una cartera/casaca en el asiento posterior."
        value={descripcion}
        onChange={(event) => setDescripcion(event.target.value)}
      />
      <button
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-care px-4 text-sm font-semibold text-white disabled:opacity-50"
        disabled={descripcion.trim().length < 8}
        type="button"
        onClick={submitIncident}
      >
        <Send className="h-4 w-4" />
        Reportar objeto olvidado
      </button>
      {status ? <p className="mt-2 text-sm text-neutral-600">{status}</p> : null}
      {lastIncident ? (
        <a
          className="mt-3 inline-flex text-sm font-semibold text-care hover:text-product-deep"
          href={lastIncident.casoUrl}
        >
          Ver caso {lastIncident.id.slice(0, 8)}
        </a>
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

export function PassengerTrackingClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [driverPosition, setDriverPosition] = useState<PassengerPosition | null>(
    initialData.tracking.posicion,
  );
  const [route, setRoute] = useState<RouteState>({
    distanciaMetros: initialData.tracking.distanciaMetros,
    duracionSegundos: initialData.tracking.duracionSegundos,
    duracionSinTraficoSegundos: initialData.tracking.duracionSinTraficoSegundos,
    geometry: initialData.tracking.geometry,
    fuente: initialData.tracking.fuente,
  });
  const [realtimeStatus, setRealtimeStatus] = useState('Conectando');
  const lastRouteCalcRef = useRef<{ position: PassengerPosition; ts: number } | null>(null);
  const finished = isFinished(data);

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
    if (!target) {
      setRoute((current) => ({
        ...current,
        distanciaMetros: 0,
        duracionSegundos: 0,
        geometry: null,
      }));
      return;
    }

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
            geometry: record.geometry?.type === 'LineString' ? record.geometry : undefined,
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
      setRealtimeStatus('Polling');
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
            estado:
              typeof payload.estado_reserva === 'string' ? payload.estado_reserva : current.reserva.estado,
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
        if (status === 'SUBSCRIBED') setRealtimeStatus('En vivo');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('Polling');
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

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto min-h-screen w-full max-w-xl px-4 py-5">
        <div className="rounded-md bg-product-deep px-5 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="rounded bg-brand-tenant px-2 py-1 text-xs font-semibold">Taxi Green</span>
              <h1 className="mt-4 text-2xl font-semibold leading-tight">Recojo en aeropuerto</h1>
              <p className="mt-2 text-sm text-white/75">
                {data.reserva.voucherCodigo} · {formatDate(data.reserva.fechaHoraServicio)}
              </p>
            </div>
            <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold">{realtimeStatus}</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-white/10 p-3">
              <Plane className="h-5 w-5 text-white/80" />
              <p className="mt-2 text-xs text-white/65">Vuelo</p>
              <p className="text-lg font-semibold">{data.ruta.vueloCodigo ?? 'Por confirmar'}</p>
            </div>
            <div className="rounded-md bg-white/10 p-3">
              <Clock className="h-5 w-5 text-white/80" />
              <p className="mt-2 text-xs text-white/65">Estado</p>
              <p className="text-lg font-semibold">{statusLabel(data.viaje.estado)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <DriverCard data={data} />
          <VehicleCard data={data} />
          <MeetingPointCard data={data} />
          <PassengerMap data={data} driverPosition={driverPosition} route={route} />
          <TripTimeline data={data} />

          <section className="grid grid-cols-2 gap-3">
            <a
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-product text-sm font-semibold text-white"
              href={callHref(data.conductor.telefono)}
            >
              <Phone className="h-4 w-4" />
              Conductor
            </a>
            <a
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-product bg-white text-sm font-semibold text-product"
              href="tel:+5116111111"
            >
              <Phone className="h-4 w-4" />
              Taxi Green
            </a>
          </section>

          <section className="rounded-md border border-border bg-white p-4">
            <p className="text-xs font-semibold uppercase text-neutral-500">Destino</p>
            <h2 className="mt-1 text-lg font-semibold text-product-deep">{data.ruta.destino.texto}</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Pasajero: {data.pasajero.nombre}. Solicitante: {data.solicitante.nombre ?? 'Hotel aliado'}.
            </p>
          </section>

          {finished ? <CompletionPanel data={data} refresh={refresh} /> : null}
          {finished ? <IncidentPanel data={data} refresh={refresh} /> : null}
        </div>
      </section>
    </main>
  );
}

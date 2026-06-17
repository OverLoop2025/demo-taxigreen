'use client';

import {
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  Crosshair,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Maximize2,
  MessageCircle,
  PackageSearch,
  Phone,
  Plane,
  QrCode,
  Send,
  ShieldCheck,
  Smartphone,
  Star,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { estadoViajePasajero, formatLlegada, type EstadoViaje } from '@taxigreen/shared/copy';
import { AuthorCredit } from '@/components/brand/author-credit';
import { BottomSheet, type SheetLevel } from '@/components/product/bottom-sheet';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useTheme, type Theme } from '@/components/theme/theme-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { PassengerPosition, PassengerTripData } from '@/lib/pasajero';

type Props = {
  initialData: PassengerTripData;
  mapboxToken: string | null;
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
  on: (event: 'load' | 'idle' | 'error', callback: () => void) => void;
  addSource: (id: string, source: Record<string, unknown>) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  getStyle: () => { layers?: Array<{ id?: string; type?: string }> };
  setPaintProperty: (layerId: string, property: string, value: unknown) => void;
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

function messageHref(value: string | null | undefined) {
  const phone = value?.replace(/[^\d]/g, '');
  if (!phone) return undefined;
  return `https://wa.me/${phone}`;
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

function RatingStars({ value }: { value: number | null | undefined }) {
  const rating = Math.max(0, Math.min(5, value ?? 5));
  const width = `${(rating / 5) * 100}%`;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span aria-label={`Valoración ${rating.toFixed(1)} de 5`} className="relative inline-block leading-none">
        <span aria-hidden="true" className="tracking-[1px] text-foreground-muted/35">
          ★★★★★
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 overflow-hidden tracking-[1px] text-amber-400"
          style={{ width }}
        >
          ★★★★★
        </span>
      </span>
      <span className="font-medium tabular-nums text-foreground-muted">{rating.toFixed(1)}</span>
    </div>
  );
}

function mapboxStyleForTheme(theme: Theme) {
  return theme === 'dark' ? 'mapbox://styles/mapbox/navigation-night-v1' : 'mapbox://styles/mapbox/navigation-day-v1';
}

function softenTrafficLayers(map: MapboxMap, theme: Theme) {
  const layers = map.getStyle().layers ?? [];
  for (const layer of layers) {
    const layerId = layer.id?.toLowerCase() ?? '';
    if (layer.type !== 'line' || !layerId.includes('traffic')) continue;

    try {
      map.setPaintProperty(layer.id!, 'line-opacity', theme === 'dark' ? 0.2 : 0.24);
      map.setPaintProperty(layer.id!, 'line-width', ['interpolate', ['linear'], ['zoom'], 8, 0.35, 12, 0.75, 16, 1.3]);
      map.setPaintProperty(layer.id!, 'line-blur', 0.45);
    } catch {
      // Algunas capas de estilo de Mapbox no exponen los mismos paint props.
    }
  }
}

function projectRouteToSvg(points: Array<[number, number]>, width: number, height: number) {
  if (points.length === 0) return '';

  const lngs = points.map(([lng]) => lng);
  const lats = points.map(([, lat]) => lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const lngRange = Math.max(maxLng - minLng, 0.0001);
  const latRange = Math.max(maxLat - minLat, 0.0001);
  const padding = 34;
  const scale = Math.min((width - padding * 2) / lngRange, (height - padding * 2) / latRange);
  const usedWidth = lngRange * scale;
  const usedHeight = latRange * scale;
  const offsetX = (width - usedWidth) / 2;
  const offsetY = (height - usedHeight) / 2;
  const step = Math.max(1, Math.floor(points.length / 96));

  return points
    .filter((_, index) => index % step === 0 || index === points.length - 1)
    .map(([lng, lat], index) => {
      const x = offsetX + (lng - minLng) * scale;
      const y = offsetY + usedHeight - (lat - minLat) * scale;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function routePreviewPoints({
  data,
  driverPosition,
  route,
}: {
  data: PassengerTripData;
  driverPosition: PassengerPosition | null;
  route: RouteState;
}) {
  const geometry = route.geometry?.coordinates ?? data.tracking.geometry?.coordinates ?? [];
  if (geometry.length > 2) return geometry;

  return [
    driverPosition ? ([driverPosition.lng, driverPosition.lat] as [number, number]) : null,
    getCoordinates(data.ruta.origen),
    getCoordinates(data.ruta.destino),
  ].filter(Boolean) as Array<[number, number]>;
}

/** Fondo a pantalla completa cuando Mapbox GL no carga: mantiene ruta visible y look de navegación. */
function MapFallback({
  data,
  driverPosition,
  mapTheme,
  route,
}: {
  data: PassengerTripData;
  driverPosition: PassengerPosition | null;
  mapTheme: Theme;
  route: RouteState;
}) {
  const width = 390;
  const height = 620;
  const points = routePreviewPoints({ data, driverPosition, route });
  const path = projectRouteToSvg(points, width, height);
  const dark = mapTheme === 'dark';

  return (
    <div className={`absolute inset-0 overflow-hidden pb-[42dvh] ${dark ? 'bg-[#08130f]' : 'bg-[#eaf2ee]'}`}>
      <div
        className={`absolute inset-0 opacity-80 [background-size:42px_42px] ${
          dark
            ? '[background-image:linear-gradient(90deg,rgba(164,244,215,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(164,244,215,0.06)_1px,transparent_1px)]'
            : '[background-image:linear-gradient(90deg,rgba(9,74,57,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(9,74,57,0.08)_1px,transparent_1px)]'
        }`}
      />
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox={`0 0 ${width} ${height}`}
      >
        <path d="M -20 120 C 80 90 130 145 210 122 S 340 82 430 112" fill="none" stroke={dark ? '#18372f' : '#d1ded8'} strokeWidth="18" />
        <path d="M 22 510 C 92 430 170 462 232 382 S 318 260 420 238" fill="none" stroke={dark ? '#18372f' : '#d1ded8'} strokeWidth="22" />
        <path d="M 36 250 C 112 248 150 302 232 300 S 350 310 430 270" fill="none" stroke={dark ? '#21483e' : '#c5d6cf'} strokeWidth="14" />
        {path ? (
          <>
            <path d={path} fill="none" stroke={dark ? '#001f19' : '#083d31'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="15" opacity={dark ? '0.75' : '0.28'} />
            <path d={path} fill="none" stroke={dark ? '#22f3b2' : '#00a876'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="7" />
            <path d={path} fill="none" stroke="#ffffff" strokeDasharray="2 18" strokeLinecap="round" strokeWidth="2" opacity="0.65" />
          </>
        ) : null}
      </svg>
      <div className="absolute left-1/2 top-[31%] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-product text-white shadow-lg ring-4 ring-white">
        <Car className="h-6 w-6" />
      </div>
      <div className="absolute left-[18%] top-[48%] flex h-9 w-9 items-center justify-center rounded-full bg-white text-product shadow ring-1 ring-product/20">
        <MapPin className="h-5 w-5" />
      </div>
      <div className="absolute right-[18%] top-[21%] flex h-9 w-9 items-center justify-center rounded-full bg-product-deep text-white shadow ring-4 ring-white">
        <MapPin className="h-5 w-5" />
      </div>
      <div className={`absolute left-5 top-[18%] rounded-2xl px-4 py-3 shadow-lg backdrop-blur ${dark ? 'bg-neutral-950/90' : 'bg-white/95'}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-product">Taxi Green</p>
        <p className={`mt-1 text-sm font-semibold ${dark ? 'text-white' : 'text-neutral-950'}`}>Ruta hacia tu punto</p>
      </div>
    </div>
  );
}

function PassengerMap({
  data,
  driverPosition,
  immersive,
  mapTheme,
  route,
  mapboxToken,
  recenterKey,
}: {
  data: PassengerTripData;
  driverPosition: PassengerPosition | null;
  immersive: boolean;
  mapTheme: Theme;
  route: RouteState;
  mapboxToken: string | null;
  recenterKey: number;
}) {
  const token = mapboxToken;
  const styleUrl = mapboxStyleForTheme(mapTheme);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxRef = useRef<MapboxGL | null>(null);
  const driverMarkerRef = useRef<MapboxMarker | null>(null);
  const originMarkerRef = useRef<MapboxMarker | null>(null);
  const destinationMarkerRef = useRef<MapboxMarker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);
  const [visualReady, setVisualReady] = useState(false);
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
    let mapLoaded = false;
    setReady(false);
    setVisualReady(false);
    setError(null);
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
        // Estilo navegación claro/oscuro según tema, cercano a Waze/inDrive.
        style: styleUrl,
        logoPosition: 'bottom-left',
        center,
        zoom: 11.5,
        // Zoom máximo cómodo: evita "perderse" haciendo zoom al vacío.
        maxZoom: 17,
        attributionControl: false,
      });
      mapRef.current = map;
      map.on('error', () => {
        if (!mapLoaded) setError('mapa_no_disponible');
      });

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
        mapLoaded = true;
        setError(null);
        softenTrafficLayers(map, mapTheme);
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
            'line-color': mapTheme === 'dark' ? '#001f19' : '#06382f',
            'line-width': ['interpolate', ['linear'], ['zoom'], 9, 9, 14, 14, 18, 20],
            'line-opacity': mapTheme === 'dark' ? 0.9 : 0.65,
            'line-blur': 0.5,
          },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': mapTheme === 'dark' ? '#22F3B2' : '#00A876',
            'line-width': ['interpolate', ['linear'], ['zoom'], 9, 4, 14, 7, 18, 10],
            'line-opacity': 1,
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
          map.fitBounds(bounds, { padding: { top: 80, left: 28, right: 28, bottom: 300 }, maxZoom: 15.5, duration: 0 });
        }
        setReady(true);
      });
      map.on('idle', () => {
        if (!cancelled) setVisualReady(true);
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
  }, [token, styleUrl, mapTheme]);

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
      map.fitBounds(bounds, { padding: { top: 80, left: 28, right: 28, bottom: 280 }, maxZoom: 15.5, duration: 500 });
    }
  }, [recenterKey]);

  if (!token || error) {
    return <MapFallback data={data} driverPosition={driverPosition} mapTheme={mapTheme} route={route} />;
  }

  return (
    <>
      <style>
        {`
          .passenger-map .mapboxgl-ctrl-bottom-left {
            bottom: calc(42dvh + 0.5rem);
            left: 0.5rem;
          }

          .passenger-map.passenger-map--immersive .mapboxgl-ctrl-bottom-left {
            bottom: calc(env(safe-area-inset-bottom) + 5.75rem);
          }

          .passenger-map .mapboxgl-ctrl-logo {
            opacity: 0.62;
            transform: scale(0.78);
            transform-origin: left bottom;
          }
        `}
      </style>
      {!visualReady ? (
        <MapFallback data={data} driverPosition={driverPosition} mapTheme={mapTheme} route={route} />
      ) : null}
      <div
        ref={containerRef}
        className={`passenger-map ${immersive ? 'passenger-map--immersive' : ''} absolute inset-0 h-full w-full transition-opacity duration-500 ${
          mapTheme === 'dark' ? 'bg-[#08130f]' : 'bg-[#eaf2ee]'
        } ${
          visualReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
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

// Fila de estrellas interactiva (sin etiqueta): el rótulo del eje vive arriba en el
// flujo paso a paso de calificación. Estrellas grandes y centradas para tocar fácil.
function StarRow({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hover, setHover] = useState(0);
  const activo = hover || value;
  return (
    <div className="flex justify-center gap-2" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((nivel) => (
        <button
          aria-label={`${nivel} ${nivel === 1 ? 'estrella' : 'estrellas'}`}
          aria-pressed={value === nivel}
          className="rounded-md p-1 transition-transform hover:scale-110 active:scale-95"
          key={nivel}
          type="button"
          onClick={() => onChange(nivel)}
          onMouseEnter={() => setHover(nivel)}
        >
          <Star
            className={`h-10 w-10 transition-colors ${
              activo >= nivel ? 'fill-product text-product' : 'fill-transparent text-foreground-muted/40'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Patrón QR determinista (estético) para Yape/Plin. No es un QR real: es atmósfera
// de pasarela para la demo. Esquinas con "finder patterns" para que se lea como QR.
function fauxQr(seed: string, size = 23): boolean[][] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0);
  const rand = () => {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    return h / 0xffffffff;
  };
  const g: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => rand() > 0.52),
  );
  const stamp = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const row = g[r0 + r];
        if (row) row[c0 + c] = edge || inner;
      }
  };
  stamp(0, 0);
  stamp(0, size - 7);
  stamp(size - 7, 0);
  return g;
}

const METODOS_PAGO = [
  { id: 'tarjeta', nombre: 'Tarjeta', sub: 'Visa · Mastercard', bg: 'linear-gradient(135deg,#0B7A3B,#0B0952)' },
  { id: 'yape', nombre: 'Yape', sub: 'Escanea y listo', bg: 'linear-gradient(135deg,#742384,#9b2fb0)' },
  { id: 'plin', nombre: 'Plin', sub: 'Escanea y listo', bg: 'linear-gradient(135deg,#0AB6C9,#11859b)' },
  { id: 'paypal', nombre: 'PayPal', sub: 'Cuenta o tarjeta', bg: 'linear-gradient(135deg,#003087,#0070BA)' },
] as const;

type MetodoPago = (typeof METODOS_PAGO)[number]['id'];

// F6: el pasajero paga al finalizar. Pasarela premium SIMULADA (sin red real): el
// pasajero elige tarjeta / Yape / Plin / PayPal o efectivo. La captura es un solo
// POST; los pasos animados son narrativa para que se sienta real y confiable.
function PaymentActions({ data, refresh }: { data: PassengerTripData; refresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'menu' | 'tarjeta' | 'wallet' | 'paypal' | 'procesando' | 'ok'>('menu');
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paso, setPaso] = useState('Procesando tu pago…');
  const [card, setCard] = useState({ num: '4242 4242 4242 4242', name: 'JOSE ALVAREZ', exp: '12/29', cvv: '123' });
  const accion = data.acciones.pago;
  if (!accion) return null;
  const monto = data.pago?.montoEtiqueta ?? '';

  const cerrar = () => {
    setOpen(false);
    setStep('menu');
    setMetodo(null);
    setError(null);
  };

  const capturar = async (body: { accion: 'pagar_app' | 'confirmar_efectivo'; metodo?: MetodoPago }) => {
    setError(null);
    setStep('procesando');
    const narrativa =
      body.accion === 'confirmar_efectivo'
        ? ['Registrando tu pago en efectivo…']
        : body.metodo === 'tarjeta'
          ? ['Conectando con tu banco…', 'Autorizando la tarjeta…']
          : body.metodo === 'paypal'
            ? ['Abriendo PayPal…', 'Confirmando tu cuenta…']
            : ['Esperando tu confirmación…', 'Validando el pago…'];
    for (const t of narrativa) {
      setPaso(t);
      await new Promise((r) => setTimeout(r, 850));
    }
    const response = await fetch(`/api/pasajero/${data.token}/pago`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      setError('No pudimos confirmar el pago. Inténtalo otra vez.');
      setStep(metodo ? (metodo === 'tarjeta' ? 'tarjeta' : metodo === 'paypal' ? 'paypal' : 'wallet') : 'menu');
      return;
    }
    setStep('ok');
    await new Promise((r) => setTimeout(r, 1100));
    await refresh();
    cerrar();
  };

  const elegir = (id: MetodoPago) => {
    setMetodo(id);
    setError(null);
    setStep(id === 'tarjeta' ? 'tarjeta' : id === 'paypal' ? 'paypal' : 'wallet');
  };

  const qr = metodo === 'yape' || metodo === 'plin' ? fauxQr(`${data.token}:${metodo}:${monto}`) : null;
  const acentoWallet = metodo === 'yape' ? '#742384' : '#11859b';

  return (
    <div className="mt-3">
      <button
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-product text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
        type="button"
        onClick={() => {
          setStep('menu');
          setOpen(true);
        }}
      >
        <Lock className="h-4 w-4" />
        Pagar ahora{monto ? ` · ${monto}` : ''}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
          <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:max-w-[420px] sm:rounded-3xl">
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                {step !== 'menu' && step !== 'ok' && step !== 'procesando' ? (
                  <button aria-label="Volver" className="text-muted-foreground hover:text-foreground" onClick={() => setStep('menu')} type="button">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                ) : null}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pagar tu viaje</p>
                  <p className="text-lg font-bold leading-tight text-foreground">{monto}</p>
                </div>
              </div>
              <button aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-full bg-product-muted text-muted-foreground hover:text-foreground" onClick={cerrar} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {step === 'menu' ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">Elige cómo quieres pagar. Es 100% seguro.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {METODOS_PAGO.map((m) => (
                      <button
                        className="flex h-24 flex-col items-start justify-between rounded-2xl p-3 text-left text-white shadow-sm transition active:scale-[0.97]"
                        key={m.id}
                        onClick={() => elegir(m.id)}
                        style={{ backgroundImage: m.bg }}
                        type="button"
                      >
                        {m.id === 'tarjeta' ? <CreditCard className="h-5 w-5" /> : m.id === 'paypal' ? <Wallet className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                        <span>
                          <span className="block text-sm font-bold">{m.nombre}</span>
                          <span className="block text-[11px] opacity-80">{m.sub}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground transition hover:bg-product-muted"
                    onClick={() => void capturar({ accion: 'confirmar_efectivo' })}
                    type="button"
                  >
                    Pagaré en efectivo al conductor
                  </button>
                </div>
              ) : null}

              {step === 'tarjeta' ? (
                <div className="flex flex-col gap-4">
                  {/* Preview de tarjeta */}
                  <div className="relative h-44 overflow-hidden rounded-2xl p-4 text-white shadow-md" style={{ backgroundImage: 'linear-gradient(135deg,#0B7A3B,#0B0952)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold tracking-tight">Taxi Green</span>
                      <CreditCard className="h-5 w-5 opacity-80" />
                    </div>
                    <div className="mt-7 h-7 w-11 rounded-md bg-white/25" />
                    <p className="mt-3 font-mono text-lg tracking-[0.18em]">{card.num || '•••• •••• •••• ••••'}</p>
                    <div className="mt-3 flex items-end justify-between text-[11px]">
                      <span className="max-w-[60%] truncate uppercase">{card.name || 'NOMBRE APELLIDO'}</span>
                      <span>{card.exp || 'MM/YY'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input className="rounded-xl border border-border bg-surface px-3 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-product" inputMode="numeric" maxLength={19}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/gu, '').slice(0, 16);
                        setCard((c) => ({ ...c, num: digits.replace(/(.{4})/gu, '$1 ').trim() }));
                      }}
                      placeholder="Número de tarjeta" value={card.num} />
                    <input className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-product"
                      onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} placeholder="Nombre en la tarjeta" value={card.name} />
                    <div className="flex gap-2">
                      <input className="w-1/2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-product" maxLength={5}
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/gu, '').slice(0, 4);
                          setCard((c) => ({ ...c, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }));
                        }}
                        placeholder="MM/YY" value={card.exp} />
                      <input className="w-1/2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-product" inputMode="numeric" maxLength={4}
                        onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/gu, '').slice(0, 4) }))} placeholder="CVV" value={card.cvv} />
                    </div>
                  </div>
                  {error ? <p className="text-sm text-danger">{error}</p> : null}
                  <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-product text-sm font-semibold text-white disabled:opacity-50"
                    disabled={card.num.replace(/\s/gu, '').length < 15} onClick={() => void capturar({ accion: 'pagar_app', metodo: 'tarjeta' })} type="button">
                    <Lock className="h-4 w-4" /> Pagar {monto}
                  </button>
                </div>
              ) : null}

              {step === 'wallet' && qr ? (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-center text-sm text-muted-foreground">Abre <span className="font-semibold capitalize text-foreground">{metodo}</span> y escanea para pagar {monto}.</p>
                  <div className="rounded-2xl bg-white p-3 shadow-sm" style={{ border: `2px solid ${acentoWallet}` }}>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${qr.length}, 1fr)`, width: 196, height: 196 }}>
                      {qr.flatMap((row, r) => row.map((on, c) => (
                        <div key={`${r}-${c}`} style={{ background: on ? acentoWallet : 'transparent', aspectRatio: '1' }} />
                      )))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <QrCode className="h-4 w-4" /> Escanea con la app de tu banco
                  </div>
                  {error ? <p className="text-sm text-danger">{error}</p> : null}
                  <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white"
                    onClick={() => metodo && void capturar({ accion: 'pagar_app', metodo })} style={{ background: acentoWallet }} type="button">
                    <CheckCircle2 className="h-4 w-4" /> Ya escaneé · confirmar pago
                  </button>
                </div>
              ) : null}

              {step === 'paypal' ? (
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ backgroundImage: 'linear-gradient(135deg,#003087,#0070BA)' }}>
                    <Wallet className="h-7 w-7" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">Te llevaremos a <span className="font-semibold text-foreground">PayPal</span> para confirmar tu pago de {monto} de forma segura.</p>
                  {error ? <p className="text-sm text-danger">{error}</p> : null}
                  <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white"
                    onClick={() => void capturar({ accion: 'pagar_app', metodo: 'paypal' })} style={{ backgroundImage: 'linear-gradient(135deg,#003087,#0070BA)' }} type="button">
                    Continuar con PayPal
                  </button>
                </div>
              ) : null}

              {step === 'procesando' ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <Loader2 className="h-9 w-9 animate-spin text-product" />
                  <p className="text-sm font-medium text-foreground">{paso}</p>
                  <p className="text-xs text-muted-foreground">No cierres esta ventana</p>
                </div>
              ) : null}

              {step === 'ok' ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                    <CheckCircle2 className="h-10 w-10 text-success" />
                  </div>
                  <p className="text-base font-bold text-foreground">¡Pago confirmado!</p>
                  <p className="text-center text-xs text-muted-foreground">Tu comprobante ya está disponible aquí mismo.</p>
                </div>
              ) : null}
            </div>

            {step === 'menu' ? (
              <div className="flex items-center justify-center gap-1.5 border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-product" /> Pago protegido · Taxi Green
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// F6: cancelación escalonada (master §5.3) — el servidor decide la etapa; la UI
// solo adapta el mensaje. En ruta no cancela: registra la solicitud para el equipo.
function CancelPanel({ data, refresh }: { data: PassengerTripData; refresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const etapa = data.acciones.cancelacion;
  if (!etapa) return null;

  const copy = {
    libre: {
      hint: 'Puedes cancelar sin problema: aún no enviamos una unidad.',
      cta: 'Cancelar reserva',
    },
    con_aviso: {
      hint: 'Tu unidad está siendo preparada. Si cancelas ahora, liberamos al conductor.',
      cta: 'Cancelar reserva',
    },
    solicitud: {
      hint: 'Tu conductor ya está en camino. El equipo revisará tu solicitud de inmediato.',
      cta: 'Solicitar cancelación',
    },
  }[etapa];

  const cancelar = async () => {
    setSending(true);
    setStatus(null);
    const response = await fetch(`/api/pasajero/${data.token}/cancelar`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ motivo: motivo.trim() || undefined }),
    });
    const payload = (await response.json().catch(() => null)) as { resultado?: string } | null;
    setSending(false);
    if (!response.ok) {
      setStatus('No se pudo procesar. Llámanos y lo resolvemos.');
      return;
    }
    if (payload?.resultado === 'solicitud_registrada') {
      setStatus('Recibimos tu solicitud. El equipo te contactará en breve.');
      setOpen(false);
      return;
    }
    await refresh();
  };

  if (!open) {
    return (
      <button
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground-muted"
        type="button"
        onClick={() => setOpen(true)}
      >
        <X className="h-4 w-4" />
        {copy.cta}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-border bg-surface-muted p-4">
      <p className="text-sm font-semibold text-foreground">{copy.cta}</p>
      <p className="mt-1 text-sm leading-5 text-foreground-muted">{copy.hint}</p>
      <input
        className="mt-3 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
        placeholder="Motivo (opcional)"
        value={motivo}
        onChange={(event) => setMotivo(event.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <button
          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60"
          type="button"
          disabled={sending}
          onClick={cancelar}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
        </button>
        <button
          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground"
          type="button"
          onClick={() => setOpen(false)}
        >
          Volver
        </button>
      </div>
      {status ? <p className="mt-2 text-sm text-foreground-muted">{status}</p> : null}
    </div>
  );
}

// Comprobante: SOLO la información relevante (pasajero + método de pago) y una descarga
// fiable. Aparece únicamente cuando ya está disponible (tras pagar, si paga el pasajero;
// al terminar, si paga la empresa). Si paga la empresa, se prepara solo para que el botón
// sea un enlace directo, sin formularios ni pasos.
function ComprobanteBlock({ data, refresh }: { data: PassengerTripData; refresh: () => Promise<void> }) {
  const disponible = data.comprobante.disponible;
  const tipoListo = Boolean(data.comprobante.tipo);
  const [preparando, setPreparando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intentado = useRef(false);
  const metodo = data.pago?.metodoLabel ?? 'Cubierto por la empresa';

  useEffect(() => {
    if (!disponible || tipoListo || intentado.current) return;
    intentado.current = true;
    setPreparando(true);
    setError(null);
    void fetch(`/api/pasajero/${data.token}/comprobante`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        tipo: data.comercial.requiereFactura ? 'factura' : 'boleta',
        ruc: data.pasajero.ruc ?? null,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          setError('No pudimos preparar tu comprobante. Reintenta en un momento.');
          intentado.current = false;
          return;
        }
        await refresh();
      })
      .catch(() => {
        setError('No pudimos preparar tu comprobante. Reintenta en un momento.');
        intentado.current = false;
      })
      .finally(() => setPreparando(false));
  }, [disponible, tipoListo, data.token, data.comercial.requiereFactura, data.pasajero.ruc, refresh]);

  if (!disponible) {
    return (
      <div className="rounded-xl bg-surface-muted p-3.5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-product-muted text-product">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Tu comprobante se habilita al pagar</p>
            <p className="mt-0.5 text-xs leading-5 text-foreground-muted">
              Confirma tu pago arriba y aquí mismo aparecerá tu comprobante para descargar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const listoParaDescargar = tipoListo && !preparando;
  return (
    <div className="rounded-xl border border-product/20 bg-product-muted/40 p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-product text-white">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Tu comprobante está listo</p>
          {data.comprobante.etiqueta ? (
            <p className="truncate text-xs text-foreground-muted">{data.comprobante.etiqueta}</p>
          ) : null}
        </div>
      </div>

      <dl className="mt-3 grid gap-1.5 rounded-lg bg-surface px-3 py-2.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-foreground-muted">Pasajero</dt>
          <dd className="truncate font-medium text-foreground">{data.pasajero.nombre}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-foreground-muted">Método de pago</dt>
          <dd className="font-medium text-foreground">{metodo}</dd>
        </div>
      </dl>

      {error ? <p className="mt-2 text-xs font-medium text-danger">{error}</p> : null}

      <a
        aria-disabled={!listoParaDescargar}
        className={`mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
          listoParaDescargar ? 'bg-product text-white active:scale-[0.99]' : 'pointer-events-none bg-product/50 text-white/80'
        }`}
        href={data.comprobante.pdfUrl}
        rel="noreferrer"
        target="_blank"
      >
        {preparando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        {preparando ? 'Preparando comprobante…' : 'Descargar comprobante'}
      </a>
    </div>
  );
}

// Calificación paso a paso: un eje a la vez con transición; al completar los 3 ejes
// aparece el comentario (opcional) y el botón de enviar. Premium y sin fricción.
const RATING_AXES = [
  { key: 'servicio', label: '¿Cómo estuvo tu servicio?', hint: 'Tu experiencia general con Taxi Green', short: 'Servicio' },
  { key: 'conductor', label: '¿Y tu conductor?', hint: 'Trato, manejo y puntualidad', short: 'Conductor' },
  { key: 'unidad', label: '¿Y el vehículo?', hint: 'Comodidad y limpieza', short: 'Vehículo' },
] as const;

type RatingAxisKey = (typeof RATING_AXES)[number]['key'];

function RatingBlock({ data, refresh }: { data: PassengerTripData; refresh: () => Promise<void> }) {
  const yaCalificado = Boolean(data.calificacion);
  const [valores, setValores] = useState<Record<RatingAxisKey, number>>({
    servicio: data.calificacion?.servicio ?? 0,
    conductor: data.calificacion?.conductor ?? 0,
    unidad: data.calificacion?.unidad ?? 0,
  });
  const [step, setStep] = useState(yaCalificado ? RATING_AXES.length : 0);
  const [visible, setVisible] = useState(true);
  const [comentario, setComentario] = useState(data.calificacion?.comentario ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(yaCalificado);

  const completo = valores.servicio > 0 && valores.conductor > 0 && valores.unidad > 0;
  const needsReason =
    (valores.servicio > 0 && valores.servicio <= 3) ||
    (valores.conductor > 0 && valores.conductor <= 3) ||
    (valores.unidad > 0 && valores.unidad <= 3);

  const pick = (key: RatingAxisKey, value: number) => {
    setValores((v) => ({ ...v, [key]: value }));
    // Transición: desvanece el eje actual y revela el siguiente (o el resumen).
    setVisible(false);
    window.setTimeout(() => {
      setStep((s) => Math.min(s + 1, RATING_AXES.length));
      setVisible(true);
    }, 280);
  };

  const irAEje = (index: number) => {
    setVisible(false);
    window.setTimeout(() => {
      setStep(index);
      setVisible(true);
    }, 120);
  };

  const enviar = async () => {
    setEnviando(true);
    setStatus('Guardando tu calificación…');
    const comentarioLimpio = comentario.trim();
    const res = await fetch(`/api/pasajero/${data.token}/calificacion`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...valores,
        comentario: comentarioLimpio || null,
        motivo: needsReason ? comentarioLimpio || null : null,
      }),
    });
    setEnviando(false);
    if (!res.ok) {
      setStatus('No pudimos guardar tu calificación. Reintenta.');
      return;
    }
    setStatus(null);
    setEnviado(true);
    await refresh();
  };

  if (enviado) {
    return (
      <div className="rounded-xl bg-surface-muted p-3.5">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-product text-product" />
          <p className="text-sm font-semibold text-foreground">¡Gracias por calificar tu viaje!</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {RATING_AXES.map((axis) => (
            <div className="rounded-lg bg-surface px-2 py-2 text-center" key={axis.key}>
              <p className="text-[11px] text-foreground-muted">{axis.short}</p>
              <div className="mt-0.5 flex justify-center">
                <RatingStars value={valores[axis.key]} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const enResumen = step >= RATING_AXES.length;
  const eje = RATING_AXES[Math.min(step, RATING_AXES.length - 1)]!;

  return (
    <div className="rounded-xl bg-surface-muted p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-product" />
          <p className="text-sm font-semibold text-foreground">Califica tu viaje</p>
        </div>
        {/* Progreso 1·2·3 */}
        <div className="flex items-center gap-1.5">
          {RATING_AXES.map((axis, i) => (
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                valores[axis.key] > 0 ? 'w-5 bg-product' : i === step && !enResumen ? 'w-5 bg-product/50' : 'w-1.5 bg-foreground-muted/30'
              }`}
              key={axis.key}
            />
          ))}
        </div>
      </div>

      <div className={`mt-4 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'translate-y-1 opacity-0'}`}>
        {!enResumen ? (
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">{eje.label}</p>
            <p className="mt-0.5 text-xs text-foreground-muted">{eje.hint}</p>
            <div className="mt-4">
              <StarRow onChange={(v) => pick(eje.key, v)} value={valores[eje.key]} />
            </div>
            <p className="mt-3 text-[11px] text-foreground-muted/70">Paso {step + 1} de {RATING_AXES.length}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-2">
              {RATING_AXES.map((axis) => (
                <button
                  className="rounded-lg bg-surface px-2 py-2 text-center transition hover:ring-1 hover:ring-product/40"
                  key={axis.key}
                  onClick={() => irAEje(RATING_AXES.findIndex((a) => a.key === axis.key))}
                  type="button"
                >
                  <p className="text-[11px] text-foreground-muted">{axis.short}</p>
                  <div className="mt-0.5 flex justify-center">
                    <RatingStars value={valores[axis.key]} />
                  </div>
                </button>
              ))}
            </div>
            <textarea
              className="min-h-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              onChange={(event) => setComentario(event.target.value)}
              placeholder={needsReason ? '¿Qué podríamos mejorar?' : 'Déjanos un comentario (opcional)'}
              value={comentario}
            />
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-product text-sm font-semibold text-white disabled:opacity-50"
              disabled={!completo || enviando}
              onClick={() => void enviar()}
              type="button"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar calificación
            </button>
            {status ? <p className="text-sm text-foreground-muted">{status}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}

function CompletionPanel({ data, refresh }: { data: PassengerTripData; refresh: () => Promise<void> }) {
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
        <ComprobanteBlock data={data} refresh={refresh} />
        <RatingBlock data={data} refresh={refresh} />
      </div>
    </section>
  );
}

// Objetos olvidados más frecuentes (palabras que el clasificador determinista
// reconoce como objeto_olvidado). "Otros" abre un campo libre para el resto.
const OBJETOS_FRECUENTES = [
  'Billetera o cartera',
  'Celular',
  'Llaves',
  'Documentos o pasaporte',
  'Mochila o maleta',
  'Lentes',
  'Casaca o abrigo',
  'Audífonos',
  'Cargador',
] as const;

function IncidentPanel({ data, refresh }: { data: PassengerTripData; refresh: () => Promise<void> }) {
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [otrosActivo, setOtrosActivo] = useState(false);
  const [otrosTexto, setOtrosTexto] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  // Enlace de seguimiento del caso, para "enviárselo por WhatsApp" al pasajero.
  const [casoEnviado, setCasoEnviado] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const lastIncident = data.incidencias.find((item) => item.tipologia === 'objeto_olvidado');

  const items = [...seleccion];
  if (otrosActivo && otrosTexto.trim()) items.push(otrosTexto.trim());
  // El prefijo garantiza que el clasificador lo reconozca como objeto olvidado.
  const descripcion = items.length ? `Olvidé en el vehículo: ${items.join(', ')}.` : '';

  const toggle = (label: string) => {
    setSeleccion((current) =>
      current.includes(label) ? current.filter((value) => value !== label) : [...current, label],
    );
  };

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
    setSeleccion([]);
    setOtrosActivo(false);
    setOtrosTexto('');
    setStatus('Caso creado. Taxi Green ya lo está revisando.');
    // El enlace de seguimiento del caso se "envía por WhatsApp" al pasajero.
    if (payload?.caso_url) {
      const abs = typeof window !== 'undefined' ? `${window.location.origin}${payload.caso_url}` : payload.caso_url;
      setCasoEnviado(abs);
    }
    await refresh();
  };

  // Enlace de seguimiento del caso (la confirmación dentro de /p; el aviso "por WhatsApp"
  // aparece en el chat simulado de /wa-sim, y el conductor recibe la alerta en su app).
  const casoUrl = casoEnviado ?? lastIncident?.casoUrl ?? null;
  const reportado = Boolean(casoUrl);

  return (
    <section className="overflow-hidden rounded-2xl border border-care/25 bg-surface">
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-care/5"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-care/15 text-care">
          <PackageSearch className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">¿Olvidaste algo en el viaje?</span>
          <span className="block text-xs leading-5 text-foreground-muted">
            {reportado ? 'Tu caso ya está en marcha · toca para ver el detalle' : 'Lo reportas y avisamos al conductor al instante'}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-foreground-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="border-t border-care/15 px-4 pb-4 pt-3">
          {reportado ? (
            <div className="rounded-xl border border-success/30 bg-success/10 p-3.5">
              <p className="flex items-center gap-2 text-sm font-semibold text-success">
                <CheckCircle2 className="h-4 w-4" />
                Caso registrado
              </p>
              <p className="mt-1 text-xs leading-5 text-foreground-muted">
                Te enviamos el enlace de seguimiento a tu chat de WhatsApp y avisamos al conductor de tu viaje.
                Puedes seguir tu caso aquí cuando quieras.
              </p>
              <a
                className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-care px-4 text-sm font-semibold text-white"
                href={casoUrl ?? '#'}
              >
                <PackageSearch className="h-4 w-4" />
                Ver seguimiento del caso
              </a>
            </div>
          ) : (
            <>
              <p className="mb-2.5 text-xs font-medium text-foreground-muted">Toca lo que dejaste. Puedes elegir varios.</p>
              <div className="flex flex-wrap gap-2">
                {OBJETOS_FRECUENTES.map((label) => {
                  const activo = seleccion.includes(label);
                  return (
                    <button
                      aria-pressed={activo}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
                        activo
                          ? 'border-care bg-care text-white shadow-sm'
                          : 'border-border bg-surface text-foreground hover:bg-surface-muted'
                      }`}
                      key={label}
                      onClick={() => toggle(label)}
                      type="button"
                    >
                      {label}
                    </button>
                  );
                })}
                <button
                  aria-pressed={otrosActivo}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
                    otrosActivo
                      ? 'border-care bg-care text-white shadow-sm'
                      : 'border-border bg-surface text-foreground hover:bg-surface-muted'
                  }`}
                  onClick={() => setOtrosActivo((value) => !value)}
                  type="button"
                >
                  Otros
                </button>
              </div>
              {otrosActivo ? (
                <input
                  className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-care/40"
                  onChange={(event) => setOtrosTexto(event.target.value)}
                  placeholder="¿Qué otra cosa olvidaste?"
                  value={otrosTexto}
                />
              ) : null}
              <button
                className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-care px-4 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
                disabled={items.length === 0}
                onClick={submitIncident}
                type="button"
              >
                <Send className="h-4 w-4" />
                Reportar y avisar al conductor
              </button>
              {status ? <p className="mt-2 text-sm text-foreground-muted">{status}</p> : null}
            </>
          )}
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
  const unidad = data.unidad ? `${data.unidad.marca} ${data.unidad.modelo}` : 'Unidad por confirmar';
  const phoneHref = callHref(data.conductor.telefono);
  const chatHref = messageHref(data.conductor.telefono);

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
          <div className="mt-1">
            <RatingStars value={data.conductor.rating} />
          </div>
          <div className="mt-2 flex max-w-full items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-sm">
            <Car className="h-4 w-4 shrink-0 text-product" />
            <div className="min-w-0">
              <p className="font-semibold leading-tight text-foreground">{placa}</p>
              <p className="truncate text-xs leading-tight text-foreground-muted">{unidad}</p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
        {chatHref ? (
          <a
            aria-label="Enviar mensaje al conductor"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-product/20 bg-product-muted text-product shadow-sm"
            href={chatHref}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        ) : null}
        {phoneHref ? (
          <a
            aria-label="Llamar al conductor"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-product text-white shadow-sm"
            href={phoneHref}
          >
            <Phone className="h-5 w-5" />
          </a>
        ) : null}
        </div>
      </div>
    </div>
  );
}

export function PassengerTrackingClient({ initialData, mapboxToken }: Props) {
  const { theme } = useTheme();
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
  const puntoRecojo = data.ruta.puntoEncuentro ?? data.ruta.origen.texto;
  const puntoRecojoLabel = data.reserva.abordaje.requiereMostrador ? 'Punto de encuentro' : 'Punto de recojo';

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
      .on('broadcast', { event: 'abordaje' }, (event) => {
        const payload = event.payload as Record<string, unknown>;
        setData((current) => ({
          ...current,
          reserva: {
            ...current.reserva,
            abordaje: {
              ...current.reserva.abordaje,
              autorizado: true,
              counterValidadoEn:
                typeof payload.counter_validado_en === 'string'
                  ? payload.counter_validado_en
                  : current.reserva.abordaje.counterValidadoEn,
            },
          },
        }));
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
        <PassengerMap
          data={data}
          driverPosition={driverPosition}
          immersive={immersive}
          mapTheme={theme}
          route={route}
          mapboxToken={mapboxToken}
          recenterKey={recenterKey}
        />

        {/* Controles del mapa (siempre visibles) */}
        <div
          className={`absolute right-4 z-20 flex flex-col gap-2 ${
            immersive
              ? 'top-[max(1rem,env(safe-area-inset-top))]'
              : 'top-[calc(max(1rem,env(safe-area-inset-top))+4.25rem)]'
          }`}
        >
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
              <div className="flex shrink-0 gap-2">
                <a
                  aria-label="Enviar mensaje al conductor"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-product/20 bg-product-muted text-product"
                  href={messageHref(data.conductor.telefono)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a
                  aria-label="Llamar al conductor"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-product text-white"
                  href={callHref(data.conductor.telefono)}
                >
                  <Phone className="h-5 w-5" />
                </a>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          {/* Banner superior breve */}
          <div className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-2 shadow-md backdrop-blur">
              <span className="shrink-0 whitespace-nowrap rounded bg-brand-tenant px-2 py-0.5 text-xs font-semibold text-white">
                Taxi Green
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {estadoViajePasajero(estado)}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-foreground-muted">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${liveStatus === 'en_vivo' ? 'bg-success' : 'bg-warning'}`}
                />
                {liveStatus === 'en_vivo' ? 'En vivo' : 'Actualizando'}
              </span>
            </div>
            {/* Modo oscuro discreto: presente pero sin competir con la información del viaje. */}
            <ThemeToggle className="opacity-60 backdrop-blur transition-opacity hover:opacity-100" />
          </div>

          <BottomSheet level={sheetLevel} onLevelChange={setSheetLevel}>
            {data.reserva.cancelada ? (
              <div className="mb-4 rounded-2xl border border-danger/30 bg-danger/10 p-4">
                <div className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 text-danger" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Reserva cancelada</p>
                    <p className="mt-1 text-sm leading-5 text-foreground-muted">
                      {data.reserva.cancelada.por === 'pasajero'
                        ? 'Cancelaste esta reserva. Si la necesitas de nuevo, escríbenos y la reactivamos en minutos.'
                        : 'El equipo canceló esta reserva. Si tienes dudas, llámanos y lo resolvemos.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <DriverSummary data={data} route={route} finished={finished} />

            <div className="mt-4 rounded-2xl border-2 border-product/70 bg-product-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-product">{puntoRecojoLabel}</p>
              <p className="mt-1 text-xl font-semibold leading-snug text-foreground">
                {puntoRecojo}
              </p>
            </div>

            {data.reserva.abordaje.requiereMostrador ? (
              <div
                className={`mt-3 rounded-2xl border p-4 ${
                  data.reserva.abordaje.autorizado
                    ? 'border-success/30 bg-success/10'
                    : 'border-warning/30 bg-warning/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className={`mt-0.5 h-5 w-5 ${
                      data.reserva.abordaje.autorizado ? 'text-success' : 'text-warning'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {data.reserva.abordaje.autorizado ? 'Pase validado' : 'Valida tu pase en mostrador'}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-foreground-muted">
                      {data.reserva.abordaje.autorizado
                        ? 'Taxi Green ya dio luz verde al conductor.'
                        : 'Al llegar al aeropuerto, muestra tu pase de abordaje para activar el recojo.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {data.pago ? (
              <div className="mt-3 rounded-2xl border border-border bg-surface-muted p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-product-muted text-product">
                    {data.pago.estado === 'capturado' ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <CreditCard className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Pago</p>
                    <p className="mt-0.5 text-xl font-semibold text-foreground">{data.pago.montoEtiqueta}</p>
                    <p className="mt-1 text-sm text-foreground-muted">
                      {data.pago.metodoLabel} · {data.pago.estadoLabel}
                    </p>
                    <p className="mt-2 rounded-xl bg-surface px-3 py-2 text-sm font-semibold text-product-deep dark:text-product-200">
                      {data.comercial.pagoPasajero}
                    </p>
                    <PaymentActions data={data} refresh={refresh} />
                  </div>
                </div>
              </div>
            ) : null}

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
              <span className="text-foreground-muted">Tu reserva</span>
              <span className="font-semibold tracking-wide text-foreground">{data.reserva.voucherCodigo}</span>
            </div>

            {finished ? (
              <div className="mt-4 grid gap-3">
                <CompletionPanel data={data} refresh={refresh} />
                <IncidentPanel data={data} refresh={refresh} />
              </div>
            ) : null}

            <CancelPanel data={data} refresh={refresh} />

            <a
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-product"
              href="tel:+5116111111"
            >
              <Phone className="h-4 w-4" />
              Llamar a Taxi Green
            </a>

            <AuthorCredit className="mt-6 text-center" />
          </BottomSheet>
        </>
      )}
      </main>
    </div>
  );
}

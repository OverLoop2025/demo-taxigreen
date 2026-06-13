'use client';

import { MapPin, Check, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type LngLat = { lng: number; lat: number };

type MapboxMarker = {
  setLngLat: (coordinates: [number, number]) => MapboxMarker;
  getLngLat: () => LngLat;
  addTo: (map: unknown) => MapboxMarker;
  on: (event: string, handler: () => void) => MapboxMarker;
};

type MapboxMap = {
  on: (event: string, handler: (payload: { lngLat: LngLat }) => void) => void;
  remove: () => void;
};

type MapboxGL = {
  accessToken: string;
  Map: new (options: Record<string, unknown>) => MapboxMap;
  Marker: new (options?: Record<string, unknown>) => MapboxMarker;
};

// Acceso al global sin augmentar Window (otra vista ya declara window.mapboxgl con
// otra forma; augmentar aquí causaría un choque de tipos globales).
function getGlobalMapbox(): MapboxGL | null {
  return (globalThis as unknown as { mapboxgl?: MapboxGL }).mapboxgl ?? null;
}

let mapboxPromise: Promise<MapboxGL | null> | null = null;

function loadMapboxGl() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const existing = getGlobalMapbox();
  if (existing) return Promise.resolve(existing);
  if (mapboxPromise) return mapboxPromise;
  mapboxPromise = new Promise<MapboxGL | null>((resolve) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js';
    script.onload = () => resolve(getGlobalMapbox());
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return mapboxPromise;
}

async function reverseGeocode(coord: LngLat, token: string): Promise<string | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coord.lng},${coord.lat}.json?access_token=${token}&language=es&limit=1&country=pe`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as { features?: Array<{ place_name?: string }> };
    return data.features?.[0]?.place_name ?? null;
  } catch {
    return null;
  }
}

export function UbicacionCliente({
  token,
  mapboxToken,
  punto,
  inicial,
}: {
  token: string;
  mapboxToken: string | null;
  punto: 'origen' | 'destino';
  inicial: { lat: number; lng: number; texto: string | null; tieneCoordenada: boolean };
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<MapboxMarker | null>(null);
  const [coord, setCoord] = useState<LngLat>({ lng: inicial.lng, lat: inicial.lat });
  const [direccion, setDireccion] = useState<string | null>(inicial.texto);
  const [estado, setEstado] = useState<'editando' | 'guardando' | 'listo'>('editando');
  const [error, setError] = useState<string | null>(null);

  const titulo = punto === 'origen' ? '¿Desde dónde te recogemos?' : '¿A dónde vas?';

  useEffect(() => {
    if (!mapboxToken || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    void loadMapboxGl().then((mapboxgl) => {
      if (cancelled || !mapboxgl || !containerRef.current) {
        if (!mapboxgl) setError('No pudimos cargar el mapa. Escribe tu dirección en el chat.');
        return;
      }
      mapboxgl.accessToken = mapboxToken;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [inicial.lng, inicial.lat],
        zoom: inicial.tieneCoordenada ? 15 : 12,
        attributionControl: false,
      });
      mapRef.current = map;

      const marker = new mapboxgl.Marker({ draggable: true, color: '#10B981' })
        .setLngLat([inicial.lng, inicial.lat])
        .addTo(map);
      markerRef.current = marker;

      const actualizar = async () => {
        const next = marker.getLngLat();
        setCoord(next);
        setDireccion('Buscando dirección…');
        const nombre = await reverseGeocode(next, mapboxToken);
        setDireccion(nombre ?? `Punto marcado (${next.lat.toFixed(5)}, ${next.lng.toFixed(5)})`);
      };

      marker.on('dragend', () => void actualizar());
      // Tocar el mapa también reposiciona el pin (más cómodo en móvil).
      map.on('click', (event) => {
        marker.setLngLat([event.lngLat.lng, event.lngLat.lat]);
        void actualizar();
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapboxToken, inicial.lat, inicial.lng, inicial.tieneCoordenada]);

  const confirmar = async () => {
    setEstado('guardando');
    setError(null);
    const response = await fetch(`/api/ubicacion/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        lat: coord.lat,
        lng: coord.lng,
        texto: direccion && !direccion.startsWith('Buscando') ? direccion : null,
      }),
    });
    if (!response.ok) {
      setEstado('editando');
      setError('No pudimos guardar tu ubicación. Inténtalo otra vez.');
      return;
    }
    setEstado('listo');
  };

  if (!mapboxToken) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-6 text-center">
        <MapPin className="mx-auto h-8 w-8 text-product" />
        <h1 className="text-lg font-semibold text-foreground">{titulo}</h1>
        <p className="text-sm text-foreground-muted">
          El mapa no está disponible ahora. Por favor, escribe tu dirección en el chat de WhatsApp y la
          dejamos lista.
        </p>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0" ref={containerRef} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4">
        <div className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-product" />
            <h1 className="text-base font-semibold text-foreground">{titulo}</h1>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">
            Arrastra el pin o toca el mapa para marcar el punto exacto.
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <div className="mx-auto max-w-md rounded-2xl bg-surface/95 p-4 shadow-lg backdrop-blur">
          {estado === 'listo' ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-success">
              <Check className="h-5 w-5" />
              ¡Ubicación guardada! Ya puedes volver a tu chat de WhatsApp.
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">{direccion ?? 'Marca tu punto en el mapa'}</p>
              {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
              <button
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-product text-sm font-semibold text-white disabled:opacity-60"
                disabled={estado === 'guardando'}
                type="button"
                onClick={confirmar}
              >
                {estado === 'guardando' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Confirmar ubicación
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

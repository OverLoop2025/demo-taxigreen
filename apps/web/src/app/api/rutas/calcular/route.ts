import { calcularRutaEstimada, withRutaFallback, type PuntoGeo, type RutaPerfil } from '@taxigreen/rutas';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { bearerTokenFromRequest, verifyConductorToken } from '@/lib/conductor-token';
import { env } from '@/lib/env';
import { prisma } from '@taxigreen/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const routePayloadSchema = z.object({
  reserva_id: z.string().uuid().optional(),
  token_pasajero: z.string().min(8).optional(),
  origen: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),
  destino: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),
  perfil: z.enum(['driving-traffic', 'driving']).default('driving-traffic'),
});

type RoutePayload = z.infer<typeof routePayloadSchema>;

type CacheEntry = {
  expiresAt: number;
  value: Awaited<ReturnType<typeof withRutaFallback>>;
};

const CACHE_TTL_MS = 45_000;
const MAX_CACHE_ITEMS = 250;
const THROTTLE_MS = 2500;
const routeCache = new Map<string, CacheEntry>();
const throttleByReserva = new Map<string, number>();

function rounded(point: PuntoGeo) {
  return `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
}

function cacheKey(payload: RoutePayload) {
  return [payload.perfil, rounded(payload.origen), rounded(payload.destino)].join('|');
}

function getCache(key: string) {
  const entry = routeCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    routeCache.delete(key);
    return null;
  }
  routeCache.delete(key);
  routeCache.set(key, entry);
  return entry.value;
}

function setCache(key: string, value: CacheEntry['value']) {
  routeCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  while (routeCache.size > MAX_CACHE_ITEMS) {
    const oldest = routeCache.keys().next().value;
    if (!oldest) break;
    routeCache.delete(oldest);
  }
}

function parseQuery(request: Request) {
  const url = new URL(request.url);
  const origenLat = url.searchParams.get('origen_lat');
  const origenLng = url.searchParams.get('origen_lng');
  const destinoLat = url.searchParams.get('destino_lat');
  const destinoLng = url.searchParams.get('destino_lng');
  return {
    reserva_id: url.searchParams.get('reserva_id') ?? undefined,
    token_pasajero: url.searchParams.get('token') ?? url.searchParams.get('token_pasajero') ?? undefined,
    origen: { lat: origenLat ?? undefined, lng: origenLng ?? undefined },
    destino: { lat: destinoLat ?? undefined, lng: destinoLng ?? undefined },
    perfil: (url.searchParams.get('perfil') ?? 'driving-traffic') as RutaPerfil,
  };
}

async function parseBody(request: Request) {
  if (request.method === 'GET') return parseQuery(request);
  return request.json().catch(() => null);
}

async function findScopedReserva(request: Request, payload: RoutePayload) {
  const bearer = bearerTokenFromRequest(request);
  if (bearer) {
    const session = await verifyConductorToken(bearer);
    if (!session || !payload.reserva_id) return null;
    return prisma.reservas.findFirst({
      where: {
        id: payload.reserva_id,
        tenant_id: session.tenantId,
        conductor_id: session.conductorId,
        deleted_at: null,
      },
      select: {
        id: true,
        origen_lat: true,
        origen_lng: true,
        destino_lat: true,
        destino_lng: true,
      },
    });
  }

  if (!payload.token_pasajero) return null;
  return prisma.reservas.findFirst({
    where: {
      token_pasajero: payload.token_pasajero,
      deleted_at: null,
    },
    select: {
      id: true,
      origen_lat: true,
      origen_lng: true,
      destino_lat: true,
      destino_lng: true,
    },
  });
}

function metersBetween(a: PuntoGeo, b: PuntoGeo) {
  return calcularRutaEstimada({ origen: a, destino: b }, { sinuosidad: 1, velocidadKmh: 28 }).distanciaMetros;
}

function matchesKnownDestination(payload: RoutePayload, reserva: NonNullable<Awaited<ReturnType<typeof findScopedReserva>>>) {
  const known = [
    typeof reserva.origen_lat === 'number' && typeof reserva.origen_lng === 'number'
      ? { lat: reserva.origen_lat, lng: reserva.origen_lng }
      : null,
    typeof reserva.destino_lat === 'number' && typeof reserva.destino_lng === 'number'
      ? { lat: reserva.destino_lat, lng: reserva.destino_lng }
      : null,
  ].filter((point): point is PuntoGeo => Boolean(point));

  if (known.length === 0) return true;
  return known.some((point) => metersBetween(point, payload.destino) <= 300);
}

async function handle(request: Request) {
  const parsed = routePayloadSchema.safeParse(await parseBody(request));
  if (!parsed.success) {
    return NextResponse.json({ error: 'payload_invalido', details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const reserva = await findScopedReserva(request, payload);
  if (!reserva) {
    return NextResponse.json({ error: 'credencial_invalida_o_reserva_no_encontrada' }, { status: 401 });
  }

  if (!matchesKnownDestination(payload, reserva)) {
    return NextResponse.json({ error: 'destino_fuera_de_reserva' }, { status: 403 });
  }

  const key = cacheKey(payload);
  const cached = getCache(key);
  if (cached) {
    return NextResponse.json({ ...cached, cache: 'hit' });
  }

  const throttleKey = reserva.id;
  const last = throttleByReserva.get(throttleKey) ?? 0;
  const throttled = Date.now() - last < THROTTLE_MS;
  const value = throttled
    ? calcularRutaEstimada(payload)
    : await withRutaFallback({
        request: payload,
        timeoutMs: 2500,
      });

  throttleByReserva.set(throttleKey, Date.now());
  setCache(key, value);

  return NextResponse.json({
    ...value,
    cache: throttled ? 'throttle_estimacion' : 'miss',
    routing: {
      habilitado: env.RUTAS_HABILITADAS === 'true',
      umbralRecalculoMetros: env.RUTAS_UMBRAL_RECALCULO_M,
      intervaloMinSegundos: env.RUTAS_INTERVALO_MIN_S,
    },
  });
}

export function GET(request: Request) {
  return handle(request);
}

export function POST(request: Request) {
  return handle(request);
}

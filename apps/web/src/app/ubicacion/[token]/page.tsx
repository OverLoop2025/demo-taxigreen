import { prisma } from '@taxigreen/database';
import { notFound } from 'next/navigation';
import { UbicacionCliente } from './ubicacion-cliente';

export const dynamic = 'force-dynamic';

function getMapboxBrowserToken() {
  const explicitPublicToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (explicitPublicToken?.startsWith('pk.')) return explicitPublicToken;
  const reusableDirectionsToken = process.env.MAPBOX_SERVER_TOKEN;
  if (reusableDirectionsToken?.startsWith('pk.')) return reusableDirectionsToken;
  return null;
}

export default async function UbicacionTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reserva = await prisma.reservas.findFirst({
    where: { token_pasajero: token, deleted_at: null },
    select: {
      tipo_viaje: true,
      origen_texto: true,
      origen_lat: true,
      origen_lng: true,
      destino_texto: true,
      destino_lat: true,
      destino_lng: true,
    },
  });

  if (!reserva) {
    notFound();
  }

  // Flujo A (recojo en aeropuerto) → el pasajero marca su DESTINO; flujo B → el ORIGEN.
  const marcaOrigen = reserva.tipo_viaje === 'traslado_aeropuerto';
  const actual = marcaOrigen
    ? { lat: reserva.origen_lat, lng: reserva.origen_lng, texto: reserva.origen_texto }
    : { lat: reserva.destino_lat, lng: reserva.destino_lng, texto: reserva.destino_texto };
  const contraparte = marcaOrigen
    ? { lat: reserva.destino_lat, lng: reserva.destino_lng }
    : { lat: reserva.origen_lat, lng: reserva.origen_lng };

  return (
    <UbicacionCliente
      token={token}
      mapboxToken={getMapboxBrowserToken()}
      punto={marcaOrigen ? 'origen' : 'destino'}
      inicial={{
        lat: actual.lat ?? contraparte.lat ?? -12.0464,
        lng: actual.lng ?? contraparte.lng ?? -77.0428,
        texto: actual.texto,
        tieneCoordenada: typeof actual.lat === 'number' && typeof actual.lng === 'number',
      }}
    />
  );
}

import { notFound } from 'next/navigation';
import { getPassengerTripByToken } from '@/lib/pasajero';
import { PassengerTrackingClient } from './seguimiento-cliente';

export const dynamic = 'force-dynamic';

function getMapboxBrowserToken() {
  const explicitPublicToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (explicitPublicToken?.startsWith('pk.')) return explicitPublicToken;

  const reusableDirectionsToken = process.env.MAPBOX_SERVER_TOKEN;
  if (reusableDirectionsToken?.startsWith('pk.')) return reusableDirectionsToken;

  return null;
}

export default async function PassengerTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPassengerTripByToken(token);

  if (!data) {
    notFound();
  }

  return <PassengerTrackingClient initialData={data} mapboxToken={getMapboxBrowserToken()} />;
}

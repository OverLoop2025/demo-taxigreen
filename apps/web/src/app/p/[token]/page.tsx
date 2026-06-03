import { notFound } from 'next/navigation';
import { getPassengerTripByToken } from '@/lib/pasajero';
import { PassengerTrackingClient } from './seguimiento-cliente';

export const dynamic = 'force-dynamic';

export default async function PassengerTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPassengerTripByToken(token);

  if (!data) {
    notFound();
  }

  return <PassengerTrackingClient initialData={data} />;
}

import { notFound } from 'next/navigation';
import { BrandHeader } from '@/components/brand-header';
import { prisma } from '@taxigreen/database';

export const dynamic = 'force-dynamic';

export default async function PassengerTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reserva = await prisma.reservas.findUnique({
    where: { token_pasajero: token },
    select: {
      pasajero_nombre: true,
      origen_texto: true,
      punto_encuentro: true,
      destino_texto: true,
      vuelo_codigo: true,
      estado: true,
    },
  });

  if (!reserva) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <BrandHeader />
      <section className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm font-medium text-product">Link pasajero</p>
        <h1 className="mt-2 text-2xl font-semibold text-product-deep">
          {reserva.pasajero_nombre}
        </h1>
        <dl className="mt-8 grid gap-4 rounded-md border border-border bg-white p-5 text-sm">
          <div>
            <dt className="font-medium text-neutral-500">Recojo</dt>
            <dd className="mt-1 text-neutral-900">{reserva.origen_texto}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Punto de encuentro</dt>
            <dd className="mt-1 text-neutral-900">{reserva.punto_encuentro}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Destino</dt>
            <dd className="mt-1 text-neutral-900">{reserva.destino_texto}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Vuelo</dt>
            <dd className="mt-1 text-neutral-900">{reserva.vuelo_codigo ?? 'Por confirmar'}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Estado</dt>
            <dd className="mt-1 text-neutral-900">{reserva.estado}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

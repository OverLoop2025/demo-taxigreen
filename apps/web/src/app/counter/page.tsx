import { BrandHeader } from '@/components/brand-header';
import { auth } from '@/lib/auth';
import { VoucherValidator } from './voucher-validator';

export const dynamic = 'force-dynamic';

export default async function CounterPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <BrandHeader />
      <section className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-product">Counter · Aeropuerto Jorge Chávez</p>
            <h1 className="mt-2 text-3xl font-semibold text-product-deep">Validación operativa</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              Verifica el voucher, confirma el punto de encuentro y consume el QR de forma idempotente.
            </p>
          </div>
          <div className="rounded-md border border-border bg-white px-4 py-3 text-sm">
            <p className="font-semibold text-product-deep">Sesión supervisor</p>
            <p className="mt-1 text-neutral-600">{session?.user?.email ?? 'counter@taxigreen.demo'}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-md border border-border bg-white text-sm font-semibold">
          <div className="bg-product px-4 py-3 text-white">Validar voucher</div>
          <div className="px-4 py-3 text-neutral-500">Walk-in aeropuerto</div>
          <div className="px-4 py-3 text-neutral-500">Entrega y auditoría</div>
        </div>
        <div className="mt-6">
          <VoucherValidator />
        </div>
      </section>
    </main>
  );
}

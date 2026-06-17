import { SiteFooter } from '@/components/brand/site-footer';
import { BrandHeader } from '@/components/brand-header';
import { auth } from '@/lib/auth';
import { VoucherValidator } from './voucher-validator';

export const dynamic = 'force-dynamic';

export default async function CounterPage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <BrandHeader />
      <section className="mx-auto w-full max-w-3xl px-5 py-8 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-product">Mostrador Taxi Green · Aeropuerto Jorge Chávez</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">Validar pasajero</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-muted">
              Escanea el pase de abordaje del pasajero para confirmar su acceso. Cada código vale una sola vez.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">Operador</p>
            <p className="mt-1 text-foreground-muted">{session?.user?.email ?? 'Operador activo'}</p>
          </div>
        </div>
        <div className="mt-8">
          <VoucherValidator />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

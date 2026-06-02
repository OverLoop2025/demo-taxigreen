import { BrandHeader } from '@/components/brand-header';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function CounterPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <BrandHeader />
      <section className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm font-medium text-product">/counter</p>
        <h1 className="mt-2 text-2xl font-semibold text-product-deep">Counter aeropuerto</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Sesión activa: {session?.user?.email ?? 'supervisor'}
        </p>
        <div className="mt-8 rounded-md border border-border bg-white p-5">
          <p className="text-sm text-neutral-700">Base de supervisión disponible.</p>
        </div>
      </section>
    </main>
  );
}

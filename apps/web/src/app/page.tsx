import { BrandHeader } from '@/components/brand-header';
import { Button } from '@/components/ui/button';

/**
 * Landing placeholder de Sprint 0. La landing pública real (CTA "Pídelo por
 * WhatsApp") se construye en Sprint 9. Aquí solo enlazamos las superficies
 * internas para verificar que el monorepo arranca (responde 200 en :3000).
 */
const superficies = [
  { href: '/wa-sim', label: 'Simulador WhatsApp (S4)' },
  { href: '/admin', label: 'Despacho /admin (S3)' },
  { href: '/counter', label: 'Counter aeropuerto (S9)' },
  { href: '/p/demo', label: 'Pasajero /p/[token] (S8)' },
  { href: '/bienestar/demo', label: 'Bienestar / objeto olvidado (S8)' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <BrandHeader />
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold text-product-deep">Taxi Green — Demo</h1>
        <p className="mt-3 text-[#4B5563]">
          Cimentación lista (Sprint 0). Flujo protagonista: recojo en el Aeropuerto Jorge Chávez →
          Av. Pardo 123, Miraflores. ¿Necesitas un taxi? <strong>Pídelo por WhatsApp.</strong>
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button>Pídelo por WhatsApp</Button>
          <Button variant="outline">Ver el flujo</Button>
        </div>

        <ul className="mt-10 space-y-2 text-sm text-[#6B7280]">
          {superficies.map((s) => (
            <li key={s.href}>
              <span className="font-medium text-product">{s.label}</span>
              <span className="opacity-60"> — {s.href}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

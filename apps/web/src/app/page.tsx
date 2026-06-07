import { ArrowRight, CheckCircle2, Clock, MapPin, MessageCircle, Plane, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';

const whatsappHref =
  'https://wa.me/51900100100?text=Hola%20Taxi%20Green%2C%20necesito%20un%20recojo%20en%20el%20Aeropuerto%20Jorge%20Ch%C3%A1vez.';

const steps = [
  {
    icon: MessageCircle,
    title: 'Escríbenos por WhatsApp',
    text: 'Comparte tu vuelo, quién viaja y a dónde. Nosotros preparamos tu reserva al instante.',
  },
  {
    icon: Plane,
    title: 'Recibe tu código y el punto exacto',
    text: 'Te enviamos tu código, el conductor, la placa y dónde encontrarlo: Salida 3, columna F2.',
  },
  {
    icon: MapPin,
    title: 'Sigue tu viaje hasta el destino',
    text: 'Tú y el conductor ven el mismo viaje en vivo, con la ruta y tu comprobante al final.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative isolate flex min-h-[86vh] items-center overflow-hidden bg-product-deep px-5 py-8 text-white">
        <img
          src="/taxigreen-logo.jpg"
          alt="Taxi Green"
          className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(5,50,38,0.97),rgba(6,95,70,0.88),rgba(16,185,129,0.5))]" />
        <div className="relative mx-auto w-full max-w-7xl">
          <nav className="flex items-center justify-between">
            <span className="rounded bg-brand-tenant px-3 py-2 text-sm font-semibold">Taxi Green</span>
            <div className="flex items-center gap-3">
              <ThemeToggle className="border-white/25 bg-white/10 text-white hover:bg-white/20" />
              <a className="text-sm font-semibold text-white/80 hover:text-white" href="/login-admin">
                Ingreso operadores
              </a>
            </div>
          </nav>

          <div className="mt-20 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white/85">
              <ShieldCheck className="h-4 w-4" />
              Te esperamos en el punto exacto
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight md:text-7xl">Recojo en el Jorge Chávez</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
              Pide tu taxi por WhatsApp, recibe tu código y sigue tu viaje en vivo hasta tu destino. Sin
              instalar ninguna app.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-product px-5 text-sm font-semibold text-white hover:bg-white hover:text-product-deep"
                href={whatsappHref}
              >
                <MessageCircle className="h-4 w-4" />
                Pídelo por WhatsApp
              </a>
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/25 px-5 text-sm font-semibold text-white hover:bg-white/10"
                href="/p/tg_demo_passenger_001"
              >
                Sigue tu viaje
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-14 px-5 pb-16">
        <div className="relative mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article className="rounded-md border border-border bg-surface p-5 shadow-sm" key={step.title}>
              <step.icon className="h-6 w-6 text-product" />
              <h2 className="mt-4 text-lg font-semibold text-product-deep dark:text-product-200">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface px-5 py-12">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-product">Cómo funciona</p>
            <h2 className="mt-2 text-3xl font-semibold text-product-deep dark:text-product-200">
              Del aeropuerto a tu destino
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-foreground-muted">
              Pídelo por WhatsApp, te confirmamos el conductor y el punto exacto, y sigues tu viaje desde un
              link que se abre en cualquier celular.
            </p>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3 rounded-md bg-surface-muted p-3">
              <Clock className="h-5 w-5 text-product" />
              <span className="font-semibold text-product-deep dark:text-product-200">
                Sigue tu viaje en vivo, con la ruta siempre actualizada
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-surface-muted p-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="font-semibold text-product-deep dark:text-product-200">
                Tu código vale una sola vez para subir seguro
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-foreground-muted">
          <span>Taxi Green · Demo comercial</span>
          <div className="flex gap-4">
            <a className="font-semibold text-product" href="/counter">
              Counter
            </a>
            <a className="font-semibold text-product" href="/wa-sim">
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

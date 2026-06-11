import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Plane,
  QrCode,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { GradientHeading } from '@/components/ui/gradient-heading';
import {
  MinimalCard,
  MinimalCardContent,
  MinimalCardDescription,
  MinimalCardTitle,
} from '@/components/ui/minimal-card';

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

/* QR decorativo del mockup (estático, aria-hidden): evoca el pase real sin llamar a la API. */
function QrArt() {
  const cells = [
    [0, 0], [1, 0], [2, 0], [4, 0], [6, 0], [7, 0], [8, 0],
    [0, 1], [2, 1], [4, 1], [6, 1], [8, 1],
    [0, 2], [1, 2], [2, 2], [5, 2], [6, 2], [7, 2], [8, 2],
    [3, 3], [4, 3], [6, 3],
    [0, 4], [1, 4], [3, 4], [5, 4], [7, 4], [8, 4],
    [2, 5], [4, 5], [5, 5], [8, 5],
    [0, 6], [1, 6], [2, 6], [4, 6], [6, 6], [7, 6],
    [0, 7], [2, 7], [5, 7], [8, 7],
    [0, 8], [1, 8], [2, 8], [4, 8], [6, 8], [7, 8], [8, 8],
  ];
  return (
    <svg aria-hidden="true" className="h-20 w-20" viewBox="0 0 9 9">
      <rect fill="#ffffff" height="9" width="9" />
      {cells.map(([x, y]) => (
        <rect fill="#0f1a16" height="0.92" key={`${x}-${y}`} width="0.92" x={x} y={y} />
      ))}
    </svg>
  );
}

/* Mockup del chat: cuenta el flujo completo (pedir → confirmación → QR + viaje en vivo)
 * con el mismo lenguaje visual del copiloto real de /wa-sim. */
function PhoneMock() {
  return (
    <div className="relative animate-tg-float">
      <div className="w-[300px] rounded-[2.4rem] border border-white/15 bg-zinc-950 p-2.5 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.6)]">
        <div className="overflow-hidden rounded-[1.9rem] bg-[#0b141a]">
          {/* Encabezado del chat */}
          <div className="flex items-center gap-3 bg-[#1f2c33] px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-product text-sm font-black text-white">
              TG
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-sm font-semibold text-white">
                Taxi Green
                <BadgeCheck aria-hidden="true" className="h-4 w-4 text-product-400" />
              </p>
              <p className="text-[11px] text-zinc-400">responde al instante</p>
            </div>
          </div>

          <div className="space-y-2.5 px-3 py-4">
            {/* Cliente */}
            <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[#202c33] px-3 py-2">
              <p className="text-[12.5px] leading-5 text-zinc-100">
                ¡Hola! Llego mañana en el vuelo LA2456. ¿Me recogen en el aeropuerto?
              </p>
              <p className="mt-1 text-right text-[10px] text-zinc-500">20:14</p>
            </div>

            {/* Taxi Green */}
            <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-[#005c4b] px-3 py-2">
              <p className="text-[12.5px] leading-5 text-zinc-50">
                ¡Listo, Valeria! Te esperamos en <span className="font-semibold">Salida 3, columna F2</span>.
              </p>
              <p className="mt-1 text-right text-[10px] text-emerald-100/60">20:15</p>
            </div>

            {/* Tarjeta de confirmación (espejo del copiloto real) */}
            <div className="ml-auto max-w-[88%] rounded-xl rounded-tr-sm bg-[#005c4b] p-2.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-200" />
                <p className="text-[12px] font-bold text-white">Reserva confirmada</p>
              </div>
              <div className="mt-2 rounded-lg bg-white/95 px-2.5 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Tu reserva</p>
                <p className="text-[13px] font-black tracking-wider text-zinc-900">TG-2026-0001</p>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-400 px-2.5 py-2">
                <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-950">
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                  Seguir mi taxi en vivo
                </span>
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 text-emerald-950" />
              </div>
              <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-white/95 px-2.5 py-2">
                <QrArt />
                <div>
                  <p className="text-[10.5px] font-bold text-zinc-900">Tu pase de abordaje</p>
                  <p className="mt-0.5 text-[9.5px] leading-4 text-zinc-500">
                    Muéstralo en el counter para subir a tu taxi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chip flotante de llegada (la promesa del producto, viva) */}
      <div className="absolute -left-10 top-24 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-2xl">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-product opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-product" />
        </span>
        <span className="text-sm font-bold text-zinc-900">Llega en 12 min</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-product-deep px-5 pb-24 pt-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(60rem_38rem_at_85%_-10%,rgba(52,211,153,0.35),transparent),radial-gradient(50rem_32rem_at_-10%_110%,rgba(16,185,129,0.28),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/25 to-transparent" />

        <div className="relative mx-auto w-full max-w-7xl">
          <nav className="flex items-center justify-between">
            <span className="rounded-md bg-brand-tenant px-3 py-2 text-sm font-bold">Taxi Green</span>
            <div className="flex items-center gap-3">
              <ThemeToggle className="border-white/25 bg-white/10 text-white hover:bg-white/20" />
              <a className="text-sm font-semibold text-white/80 transition hover:text-white" href="/login-admin">
                Ingreso operadores
              </a>
            </div>
          </nav>

          <div className="mt-14 grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-tg-fade-up">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-product-400" />
                Te esperamos en el punto exacto
              </p>

              {/* Sin asChild: el texto debe ser hijo directo del span con bg-clip-text
                  para que el degradado pinte los glifos (con asChild queda invisible). */}
              <GradientHeading className="mt-6" size="xxl" variant="light" weight="black">
                Recojo en el <span className="whitespace-nowrap">Jorge Chávez</span>
              </GradientHeading>

              <p className="mt-4 max-w-xl text-lg leading-8 text-white/80">
                Pide tu taxi por WhatsApp, recibe tu código y sigue tu viaje en vivo hasta tu destino.
                Sin instalar ninguna app.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-product px-6 py-3.5 text-base font-bold text-white shadow-[0_12px_32px_-8px_rgba(16,185,129,0.7)] transition hover:-translate-y-0.5 hover:bg-product-500"
                  href={whatsappHref}
                >
                  <MessageCircle aria-hidden="true" className="h-5 w-5" />
                  Pídelo por WhatsApp
                </a>
                <a
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
                  href="/p/tg_demo_passenger_001"
                >
                  Sigue tu viaje
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-white/70">
                <span className="flex items-center gap-2">
                  <Smartphone aria-hidden="true" className="h-4 w-4 text-product-400" />
                  Sin instalar app
                </span>
                <span className="flex items-center gap-2">
                  <QrCode aria-hidden="true" className="h-4 w-4 text-product-400" />
                  QR de un solo uso
                </span>
                <span className="flex items-center gap-2">
                  <Clock aria-hidden="true" className="h-4 w-4 text-product-400" />
                  Viaje en vivo
                </span>
              </div>
            </div>

            <div className="hidden justify-center lg:flex animate-tg-fade-up-delay">
              <PhoneMock />
            </div>
          </div>
        </div>
      </section>

      {/* PASOS */}
      <section className="px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-product">Cómo funciona</p>
          <GradientHeading className="mt-2" size="lg" weight="bold">
            Del aeropuerto a tu destino
          </GradientHeading>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <MinimalCard
                className="bg-surface transition-transform duration-300 hover:-translate-y-1.5"
                key={step.title}
              >
                <MinimalCardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-product/10">
                      <step.icon aria-hidden="true" className="h-5 w-5 text-product" />
                    </span>
                    <span className="text-4xl font-black text-product/15">{index + 1}</span>
                  </div>
                  <MinimalCardTitle className="mt-4 text-foreground">{step.title}</MinimalCardTitle>
                  <MinimalCardDescription className="mt-1 leading-6 text-foreground-muted">
                    {step.text}
                  </MinimalCardDescription>
                </MinimalCardContent>
              </MinimalCard>
            ))}
          </div>
        </div>
      </section>

      {/* EN VIVO */}
      <section className="px-5 pb-16">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-product-deep px-8 py-12 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(40rem_24rem_at_100%_0%,rgba(52,211,153,0.25),transparent)]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-product-400">Siempre a la vista</p>
              <h2 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">
                Tú y tu conductor ven el mismo viaje
              </h2>
              <div className="mt-6 grid gap-3 text-sm">
                <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                  <Clock aria-hidden="true" className="h-5 w-5 shrink-0 text-product-400" />
                  <span className="font-semibold">Sigue tu viaje en vivo, con la ruta siempre actualizada</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                  <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-product-400" />
                  <span className="font-semibold">Tu código vale una sola vez para subir seguro</span>
                </div>
              </div>
            </div>

            {/* Ruta estilizada: el mismo lenguaje visual del mapa del producto. */}
            <svg aria-hidden="true" className="mx-auto w-full max-w-md" viewBox="0 0 360 220">
              <defs>
                <linearGradient id="tg-route" x1="0" x2="1" y1="1" y2="0">
                  <stop offset="0" stopColor="#8CFFDD" />
                  <stop offset="0.5" stopColor="#34D399" />
                  <stop offset="1" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <path
                d="M30 190 C 90 180, 110 130, 170 120 S 290 70, 330 34"
                fill="none"
                opacity="0.25"
                stroke="#34D399"
                strokeLinecap="round"
                strokeWidth="18"
              />
              <path
                d="M30 190 C 90 180, 110 130, 170 120 S 290 70, 330 34"
                fill="none"
                stroke="url(#tg-route)"
                strokeLinecap="round"
                strokeWidth="7"
              />
              <circle cx="30" cy="190" fill="#0b3b2e" r="9" stroke="#8CFFDD" strokeWidth="3" />
              <circle className="animate-pulse" cx="170" cy="120" fill="#ffffff" r="8" />
              <circle cx="170" cy="120" fill="#10B981" r="4.5" />
              <circle cx="330" cy="34" fill="#10B981" r="9" stroke="#ffffff" strokeWidth="3" />
            </svg>
          </div>
        </div>
      </section>

      <footer className="px-5 pb-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-foreground-muted">
          <span>Taxi Green · Demo comercial</span>
          <div className="flex gap-4">
            <a className="font-semibold text-product transition hover:text-product-500" href="/counter">
              Counter
            </a>
            <a className="font-semibold text-product transition hover:text-product-500" href="/wa-sim">
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

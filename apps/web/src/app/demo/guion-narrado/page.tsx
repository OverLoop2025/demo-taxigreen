import { CheckCircle2, Clock, MonitorPlay, QrCode, Route, Smartphone } from 'lucide-react';

const steps = [
  {
    title: 'Reset de ensayo',
    duration: '2 min',
    body: 'Ejecutar db:seed-guion para dejar la reserva protagonista en camino, posiciones pre-cargadas e incidencia activa.',
    command: 'pnpm --filter @taxigreen/database db:seed-guion',
  },
  {
    title: 'WhatsApp -> despacho',
    duration: '4 min',
    body: 'Abrir /wa-sim, extraer datos del mensaje Hilton y mostrar que el hotel es solicitante, no origen físico.',
  },
  {
    title: 'Copiloto con humano en control',
    duration: '3 min',
    body: 'En /admin, abrir TG-2026-0001, mostrar sugerencia, cola, unidad y auditoría de decisión humana.',
  },
  {
    title: 'Ruta en tiempo real',
    duration: '3 min',
    body: 'Abrir seguimiento pasajero y app conductor. Validar llegada/distancia y badge Ruta real o Estimación.',
  },
  {
    title: 'Mostrador y pase one-time',
    duration: '3 min',
    body: 'Entrar como supervisor al mostrador, validar TG-2026-0001, confirmar acceso y reintentar para mostrar bloqueo.',
  },
  {
    title: 'Bienestar y cierre',
    duration: '2 min',
    body: 'Abrir el caso de objeto olvidado, responder desde conductor y cerrar con opción de entrega.',
  },
];

const objections = [
  'No es una app tipo Uber: digitaliza la operación existente de Taxi Green.',
  'La IA no decide: el copiloto sugiere y el operador confirma.',
  'El pasajero no instala app: recibe un enlace seguro de seguimiento.',
  'Ruta y llegada degradan a estimación si Mapbox falla.',
  'La demo no activa RLS ni pagos reales; eso queda para MVP.',
];

export default function DemoScriptPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-md bg-product-deep p-6 text-white">
          <p className="text-sm font-semibold uppercase text-white/65">Ensayo interno</p>
          <h1 className="mt-2 text-3xl font-semibold">Guion narrado Taxi Green</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
            Ruta de presentación para cerrar la demo S0-S9 sin improvisar: WhatsApp, despacho, conductor,
            pasajero, mostrador, bienestar y plan B.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <article className="rounded-md border border-border bg-surface p-5" key={step.title}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-product">Paso {index + 1}</p>
                  <h2 className="mt-1 text-xl font-semibold text-product-deep dark:text-product-200">{step.title}</h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-md bg-product-muted dark:bg-product-900/40 px-2 py-1 text-xs font-semibold text-product">
                  <Clock className="h-4 w-4" />
                  {step.duration}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground-muted">{step.body}</p>
              {step.command ? (
                <code className="mt-4 block overflow-x-auto rounded-md bg-neutral-950 px-3 py-2 text-xs text-white">
                  {step.command}
                </code>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-border bg-surface p-5">
            <Route className="h-6 w-6 text-product" />
            <h2 className="mt-3 text-lg font-semibold text-product-deep dark:text-product-200">Wow ruta</h2>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              Mostrar ruta por calles si Mapbox responde; si no, badge de estimación y operación intacta.
            </p>
          </div>
          <div className="rounded-md border border-border bg-surface p-5">
            <QrCode className="h-6 w-6 text-product" />
            <h2 className="mt-3 text-lg font-semibold text-product-deep dark:text-product-200">Wow mostrador</h2>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              Validar el pase, confirmar acceso y reintentar para enseñar que vale una sola vez.
            </p>
          </div>
          <div className="rounded-md border border-border bg-surface p-5">
            <MonitorPlay className="h-6 w-6 text-product" />
            <h2 className="mt-3 text-lg font-semibold text-product-deep dark:text-product-200">Plan B</h2>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              Si falla red, abrir video respaldo local o Drive en menos de 30 segundos.
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-md border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-product" />
            <h2 className="text-lg font-semibold text-product-deep dark:text-product-200">Checklist Android físico</h2>
          </div>
          <div className="mt-4 grid gap-2">
            {[
              'Login conductor con conductor1@taxigreen.demo / PIN 1234.',
              'Abrir asignación activa y verificar llegada/distancia.',
              'Avanzar estados en orden: en camino, llegué, a bordo, finalizado.',
              'Moverse con el teléfono y confirmar broadcast de posición.',
              'Probar fallback sin red y navegación desde avisos push si están activos.',
            ].map((item) => (
              <div className="flex gap-3 rounded-md bg-surface-muted p-3 text-sm" key={item}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                <span className="font-medium text-foreground-muted">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-md border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold text-product-deep dark:text-product-200">Objeciones frecuentes</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-foreground-muted">
            {objections.map((objection) => (
              <li key={objection}>{objection}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}

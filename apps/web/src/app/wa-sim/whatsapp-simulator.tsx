'use client';

import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FileJson,
  Loader2,
  MessageCircle,
  PanelRightOpen,
  Send,
  ShieldCheck,
  UserRound,
  Wand2,
} from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ExtraccionReservaResultado, ReservaExtraida } from '@taxigreen/ingesta';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { crearReservaDesdeIngesta } from './actions';
import { FECHA_SIMULADOR_ISO, type ConversacionSeed } from './conversaciones-seed';

type Mensaje = ConversacionSeed['mensajes'][number];

const FIELD_GROUPS: Array<{
  label: string;
  keys: Array<[keyof ReservaExtraida, string]>;
}> = [
  {
    label: 'Servicio',
    keys: [
      ['tipo_viaje', 'Tipo'],
      ['fecha_hora_servicio', 'Fecha'],
      ['tipo_pago', 'Pago'],
      ['vuelo_codigo', 'Vuelo'],
      ['punto_encuentro', 'Encuentro'],
    ],
  },
  {
    label: 'Ruta',
    keys: [
      ['origen_texto', 'Origen'],
      ['destino_texto', 'Destino'],
    ],
  },
  {
    label: 'Personas',
    keys: [
      ['solicitante_tipo', 'Solicita'],
      ['solicitante_nombre', 'Nombre'],
      ['pasajero_nombre', 'Pasajero'],
      ['pasajero_telefono', 'Teléfono'],
    ],
  },
];

function formatValue(value: ReservaExtraida[keyof ReservaExtraida]) {
  if (value === null || value === '') return 'Pendiente';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/u.test(value)) {
    return new Date(value).toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return String(value).replaceAll('_', ' ');
}

function confianzaClass(value: number) {
  if (value >= 0.86) return 'bg-emerald-600 text-white';
  if (value >= 0.7) return 'bg-amber-500 text-white';
  return 'bg-red-600 text-white';
}

function fuenteLabel(result: ExtraccionReservaResultado | null) {
  if (!result) return 'Sin extracción';
  return result.fuente === 'llm' ? 'IA' : 'Algoritmo';
}

function fuenteIcon(result: ExtraccionReservaResultado | null) {
  if (result?.fuente === 'llm') return <Bot aria-hidden="true" className="h-4 w-4" />;
  return <Wand2 aria-hidden="true" className="h-4 w-4" />;
}

export function WhatsappSimulator({ conversaciones }: { conversaciones: ConversacionSeed[] }) {
  const router = useRouter();
  const initial = conversaciones[0]!;
  const [selectedId, setSelectedId] = useState(initial.id);
  const [messages, setMessages] = useState<Mensaje[]>(initial.mensajes);
  const [composer, setComposer] = useState('');
  const [extraccion, setExtraccion] = useState<ExtraccionReservaResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = conversaciones.find((conversation) => conversation.id === selectedId) ?? initial;
  const inboundText = useMemo(
    () =>
      messages
        .filter((message) => message.autor === 'cliente')
        .map((message) => message.texto)
        .join('\n'),
    [messages],
  );

  function selectConversation(conversation: ConversacionSeed) {
    setSelectedId(conversation.id);
    setMessages(conversation.mensajes);
    setExtraccion(null);
    setError(null);
    setActionMessage(null);
  }

  async function extractFrom(text: string) {
    setLoading(true);
    setError(null);
    setActionMessage(null);
    try {
      const response = await fetch('/api/ingesta/extraer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mensaje: text,
          contextoConversacion: selected.nombre,
          fechaActualIso: FECHA_SIMULADOR_ISO,
        }),
      });
      const json = (await response.json()) as unknown;
      if (!response.ok) {
        const errorJson = json as { error?: string };
        throw new Error(errorJson.error ?? 'Extracción fallida.');
      }
      if (typeof json === 'object' && json && 'error' in json) {
        const errorJson = json as { error?: string };
        throw new Error(errorJson.error ?? 'Extracción fallida.');
      }
      setExtraccion(json as ExtraccionReservaResultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extracción fallida.');
    } finally {
      setLoading(false);
    }
  }

  function sendMessage() {
    const text = composer.trim();
    if (!text) return;
    const nextMessages = [
      ...messages,
      {
        id: `custom-${Date.now()}`,
        autor: 'cliente',
        hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        texto: text,
      } satisfies Mensaje,
    ];
    setMessages(nextMessages);
    setComposer('');
    void extractFrom(nextMessages.filter((message) => message.autor === 'cliente').map((m) => m.texto).join('\n'));
  }

  function createReservation() {
    if (!extraccion || extraccion.confianza < 0.7) return;
    setActionMessage(null);
    startTransition(() => {
      void (async () => {
        const result = await crearReservaDesdeIngesta(extraccion);
        if (!result.ok) {
          setActionMessage(`${result.message} ${result.missing.join(', ')}`);
          return;
        }
        router.push(`/admin/reservas/${result.id}`);
      })();
    });
  }

  return (
    <main className="min-h-screen bg-[#e7f0ee] text-[#111B21]">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[320px_minmax(420px,1fr)_420px]">
        <aside className="border-r border-[#c9d7d3] bg-[#f7fbfa]">
          <div className="flex h-16 items-center gap-3 border-b border-[#d8e3e0] bg-[#075E54] px-5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15">
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-semibold">WA Sim</h1>
              <p className="text-xs text-white/75">Taxi Green · Sprint 4</p>
            </div>
          </div>

          <nav className="p-3">
            {conversaciones.map((conversation) => (
              <button
                className={cn(
                  'mb-2 grid w-full grid-cols-[42px_1fr] gap-3 rounded-md px-3 py-3 text-left transition',
                  conversation.id === selectedId
                    ? 'bg-[#d8f3e8] text-[#063f38]'
                    : 'bg-white text-[#273936] hover:bg-[#eef7f4]',
                )}
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                type="button"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#128C7E] text-white">
                  <UserRound aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{conversation.nombre}</span>
                  <span className="mt-1 block truncate text-xs text-[#687a76]">{conversation.subtitulo}</span>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex min-h-screen flex-col bg-[#efe7dd]">
          <header className="flex h-16 items-center justify-between border-b border-[#d4cbc0] bg-[#f0f2f5] px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#075E54] text-white">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{selected.nombre}</h2>
                <p className="truncate text-xs text-[#667781]">{selected.fuente}</p>
              </div>
            </div>
            <Button
              className="bg-[#128C7E] hover:bg-[#075E54]"
              disabled={loading}
              onClick={() => void extractFrom(inboundText)}
              type="button"
            >
              {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Wand2 aria-hidden="true" className="h-4 w-4" />}
              Extraer
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
              {messages.map((message) => (
                <div
                  className={cn(
                    'flex',
                    message.autor === 'cliente' ? 'justify-start' : 'justify-end',
                  )}
                  key={message.id}
                >
                  <div
                    className={cn(
                      'max-w-[82%] rounded-md px-4 py-3 text-sm leading-relaxed shadow-sm',
                      message.autor === 'cliente' ? 'bg-white' : 'bg-[#DCF8C6]',
                    )}
                  >
                    <p>{message.texto}</p>
                    <p className="mt-2 text-right text-[11px] text-[#667781]">{message.hora}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="border-t border-[#d4cbc0] bg-[#f0f2f5] p-3">
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <textarea
                className="min-h-12 flex-1 resize-none rounded-md border border-[#d5ddd9] bg-white px-4 py-3 text-sm outline-none focus:border-[#128C7E] focus:ring-2 focus:ring-[#128C7E]/20"
                onChange={(event) => setComposer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Escribe o pega un WhatsApp..."
                rows={1}
                value={composer}
              />
              <Button
                aria-label="Enviar mensaje"
                className="h-12 w-12 bg-[#128C7E] px-0 hover:bg-[#075E54]"
                onClick={sendMessage}
                type="button"
              >
                <Send aria-hidden="true" className="h-5 w-5" />
              </Button>
            </div>
          </footer>
        </section>

        <aside className="border-l border-[#c9d7d3] bg-[#f7fbfa]">
          <div className="flex h-16 items-center justify-between border-b border-[#d8e3e0] px-5">
            <div>
              <p className="text-xs font-semibold uppercase text-[#128C7E]">Extracción</p>
              <h2 className="text-base font-semibold text-[#0a332f]">{fuenteLabel(extraccion)}</h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e0f5ef] text-[#075E54]">
              {fuenteIcon(extraccion)}
            </span>
          </div>

          <div className="space-y-4 p-5">
            {error ? (
              <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-[#d8e3e0] bg-white p-4">
              <div>
                <p className="text-xs text-[#667781]">Confianza</p>
                <p className="mt-1 text-sm font-medium">{extraccion?.motivo ?? 'Pendiente de análisis'}</p>
              </div>
              <span
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-semibold',
                  extraccion ? confianzaClass(extraccion.confianza) : 'bg-[#e9edef] text-[#667781]',
                )}
              >
                {extraccion ? `${Math.round(extraccion.confianza * 100)}%` : '--'}
              </span>
            </div>

            {extraccion ? (
              <>
                {FIELD_GROUPS.map((group) => (
                  <section className="rounded-md border border-[#d8e3e0] bg-white p-4" key={group.label}>
                    <h3 className="mb-3 text-sm font-semibold text-[#0a332f]">{group.label}</h3>
                    <div className="space-y-2">
                      {group.keys.map(([key, label]) => {
                        const value = extraccion.reserva[key];
                        return (
                          <div className="grid grid-cols-[92px_1fr] gap-3 text-sm" key={key}>
                            <span className="text-[#667781]">{label}</span>
                            <span
                              className={cn(
                                'min-w-0 break-words font-medium',
                                value === null || value === '' ? 'text-amber-700' : 'text-[#111B21]',
                              )}
                            >
                              {formatValue(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}

                {extraccion.preguntas_aclaracion.length > 0 ? (
                  <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <h3 className="mb-2 flex items-center gap-2 font-semibold">
                      <PanelRightOpen aria-hidden="true" className="h-4 w-4" />
                      Aclaraciones
                    </h3>
                    <ul className="space-y-1">
                      {extraccion.preguntas_aclaracion.map((pregunta) => (
                        <li key={pregunta}>{pregunta}</li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  <section className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    Datos suficientes para crear reserva.
                  </section>
                )}

                <details className="rounded-md border border-[#d8e3e0] bg-white p-4">
                  <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#0a332f]">
                    <FileJson aria-hidden="true" className="h-4 w-4" />
                    JSON
                  </summary>
                  <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-[#111B21] p-3 text-xs text-[#d9fdd3]">
                    {JSON.stringify(extraccion, null, 2)}
                  </pre>
                </details>

                {actionMessage ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {actionMessage}
                  </div>
                ) : null}

                <Button
                  className="h-12 w-full bg-[#075E54] hover:bg-[#05453e]"
                  disabled={isPending || extraccion.confianza < 0.7}
                  onClick={createReservation}
                  type="button"
                >
                  {isPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ClipboardCheck aria-hidden="true" className="h-4 w-4" />}
                  Crear reserva
                </Button>
                <p className="text-center text-xs text-[#667781]">
                  {extraccion.confianza < 0.7
                    ? 'Confianza por debajo de 70%: completa o aclara datos antes de crear.'
                    : 'El operador confirma; la reserva entra en revisión para mantener el control humano.'}
                </p>
              </>
            ) : (
              <div className="rounded-md border border-dashed border-[#bdd2cc] bg-white p-6 text-sm text-[#667781]">
                Selecciona una conversación o pega un WhatsApp para extraer los datos de reserva.
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

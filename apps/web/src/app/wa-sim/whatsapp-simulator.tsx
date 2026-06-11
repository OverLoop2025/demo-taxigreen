'use client';

import {
  AlertCircle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MapPin,
  MessageCircle,
  MessagesSquare,
  QrCode,
  Send,
  ShieldCheck,
  UserRound,
  Wand2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ExtraccionReservaResultado, ReservaExtraida } from '@taxigreen/ingesta';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  asignarConductorAutomatico,
  crearReservaDesdeIngesta,
  obtenerSeguimientoReserva,
} from './actions';
import { FECHA_SIMULADOR_ISO, type ConversacionSeed } from './conversaciones-seed';

type Mensaje = ConversacionSeed['mensajes'][number];

// Confirmación que el copiloto envía DENTRO del chat al cliente. El pasajero recibe
// primero su reserva + QR (pase de un solo uso); el ENLACE en vivo llega en un
// mensaje aparte recién cuando el counter valida ese pase (revelado progresivo).
type ConfirmacionChat = {
  pasajero: string;
  codigo: string;
  punto: string;
  destino: string;
  fecha: string;
  link: string;
  qrUrl: string;
};

// Mensaje del chat: texto simple (seed/cliente), tarjeta de confirmación rica, o
// botón de enlace en vivo (post-validación del counter).
type ChatMensaje = Mensaje & { confirmacion?: ConfirmacionChat; enlace?: string };

// Respuesta afirmativa del cliente a "¿Confirmas la reserva?" (modo copiloto).
const CONFIRMACION_CLIENTE = /^\s*(s[ií]\b|s[ií][,.!]|confirmo|claro|ok\b|dale|de acuerdo|correcto)/iu;

function formatFechaCorta(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function horaAhora() {
  return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

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

function fuenteLabel(result: ExtraccionReservaResultado | null) {
  if (!result) return 'Pendiente de lectura';
  return result.fuente === 'llm' ? 'Leído con IA' : 'Lectura automática';
}

function fuenteIcon(result: ExtraccionReservaResultado | null) {
  if (result?.fuente === 'llm') return <Bot aria-hidden="true" className="h-4 w-4" />;
  return <Wand2 aria-hidden="true" className="h-4 w-4" />;
}

// Estado humano de la reserva sugerida (líder del panel, no el %): qué falta y qué
// puede hacer el operador ahora. El % queda como dato secundario discreto.
function estadoReserva(result: ExtraccionReservaResultado | null, confirmada: boolean) {
  if (confirmada) return { label: 'Enviada al cliente', tone: 'ok' as const };
  if (!result) return { label: 'Esperando mensaje', tone: 'idle' as const };
  if (result.confianza < 0.7) return { label: 'Faltan datos', tone: 'warn' as const };
  if (result.preguntas_aclaracion.length > 0) return { label: 'Casi listo · confirma un detalle', tone: 'warn' as const };
  return { label: 'Listo para confirmar', tone: 'ok' as const };
}

const ESTADO_TONE: Record<'ok' | 'warn' | 'idle', string> = {
  ok: 'bg-emerald-100 text-emerald-800',
  warn: 'bg-amber-100 text-amber-800',
  idle: 'bg-[#e9edef] text-[#667781]',
};

// Tarjeta que el pasajero recibe en el chat: su pase (QR para el counter) + el
// enlace para seguir el taxi en vivo. Es el corazón de la trazabilidad del flujo.
function ConfirmacionMensaje({ data }: { data: ConfirmacionChat }) {
  return (
    <div className="w-[268px] max-w-full">
      <div className="flex items-center gap-2">
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-[#075E54]" />
        <p className="text-sm font-semibold text-[#0a332f]">Reserva confirmada</p>
      </div>

      <div className="mt-2 rounded-lg bg-white p-3 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#667781]">Tu reserva</p>
        <p className="text-base font-bold tracking-wider text-[#0a332f]">{data.codigo}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#3b4a47]">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#075E54]" />
          {data.punto}
        </p>
        <p className="mt-1 text-xs text-[#667781]">
          {data.destino} · {data.fecha}
        </p>
      </div>

      <div className="mt-2 rounded-lg bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <QrCode aria-hidden="true" className="h-4 w-4 text-[#075E54]" />
          <p className="text-sm font-semibold text-[#0a332f]">Tu pase de abordaje</p>
        </div>
        {/* QR dinámico (PNG firmado servido por /api/voucher/[id]/qr); next/image no aporta aquí. */}
        <img
          alt={`Código QR de la reserva ${data.codigo}`}
          className="mx-auto mt-2 h-40 w-40 rounded-md border border-[#e3ece9]"
          src={data.qrUrl}
        />
        <p className="mt-1 text-center text-[11px] text-[#3b4a47]">
          Muéstralo en el counter del aeropuerto para subir a tu taxi.
        </p>
      </div>
      <p className="mt-2 px-1 text-[11px] leading-4 text-[#3b4a47]">
        Al validar tu pase en el counter te llega aquí el enlace para seguir tu taxi en vivo.
      </p>
    </div>
  );
}

// Botón de enlace en vivo que llega al chat tras la validación del counter.
function EnlaceMensaje({ link }: { link: string }) {
  return (
    <a
      className="mt-1 flex w-[248px] max-w-full items-center justify-between rounded-lg bg-[#075E54] px-3 py-2.5 text-white transition hover:bg-[#05453e]"
      href={link}
      rel="noreferrer"
      target="_blank"
    >
      <span className="flex items-center gap-2">
        <MapPin aria-hidden="true" className="h-4 w-4" />
        <span className="text-sm font-semibold">Seguir mi taxi en vivo</span>
      </span>
      <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
    </a>
  );
}

export function WhatsappSimulator({ conversaciones }: { conversaciones: ConversacionSeed[] }) {
  const router = useRouter();
  const initial = conversaciones[0]!;
  const [selectedId, setSelectedId] = useState(initial.id);
  const [messages, setMessages] = useState<ChatMensaje[]>(initial.mensajes);
  const [composer, setComposer] = useState('');
  const [extraccion, setExtraccion] = useState<ExtraccionReservaResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmada, setConfirmada] = useState<ConfirmacionChat | null>(null);
  const [reservaId, setReservaId] = useState<string | null>(null);
  const [datosPedidos, setDatosPedidos] = useState(false);
  // Modo copiloto: apagado por defecto (modo seguro). Encendido, el copiloto pide
  // datos, resume y crea/asigna cuando EL CLIENTE confirma; el operador solo observa.
  const [copilotoAuto, setCopilotoAuto] = useState(false);
  const [esperandoConfirmacionCliente, setEsperandoConfirmacionCliente] = useState(false);
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);
  const [conductorAsignado, setConductorAsignado] = useState<string | null>(null);
  // Guards SINCRÓNICOS (refs): con StrictMode los efectos corren dos veces en dev y
  // un guard en state (asíncrono) deja pasar duplicados (resumen/enlace dobles).
  const autoHandledRef = useRef<string | null>(null);
  const enlaceEnviadoRef = useRef(false);
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
    setConfirmada(null);
    setReservaId(null);
    setDatosPedidos(false);
    setEsperandoConfirmacionCliente(false);
    autoHandledRef.current = null;
    enlaceEnviadoRef.current = false;
    setEnlaceEnviado(false);
    setConductorAsignado(null);
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

    // Modo copiloto: si estábamos esperando el "Sí" del cliente y este mensaje lo es,
    // la reserva se crea y asigna SOLA (sin clic del operador). El resto de mensajes
    // siguen el flujo normal de lectura.
    if (copilotoAuto && esperandoConfirmacionCliente && extraccion && CONFIRMACION_CLIENTE.test(text)) {
      setEsperandoConfirmacionCliente(false);
      crearYAvisar(extraccion, { auto: true });
      return;
    }

    void extractFrom(nextMessages.filter((message) => message.autor === 'cliente').map((m) => m.texto).join('\n'));
  }

  // El copiloto pide al cliente —EN EL CHAT y sin tecnicismos— los datos que faltan.
  function pedirDatosAlCliente() {
    if (!extraccion || extraccion.preguntas_aclaracion.length === 0) return;
    const cuerpo = extraccion.preguntas_aclaracion.map((pregunta) => `• ${pregunta}`).join('\n');
    setMessages((prev) => [
      ...prev,
      {
        id: `ask-${Date.now()}`,
        autor: 'taxigreen',
        hora: horaAhora(),
        texto: `¡Con gusto coordinamos tu Taxi Green! Para dejarlo listo me confirmas:\n${cuerpo}`,
      },
    ]);
    setDatosPedidos(true);
  }

  // Crea la reserva y responde EN EL CHAT con la confirmación + pase QR. El enlace
  // en vivo NO va aquí: llega solo cuando el counter valida el pase (polling abajo).
  // En modo copiloto (auto=true) además asigna conductor/unidad automáticamente y
  // lo anuncia en el chat; en modo normal esa decisión queda en manos del despacho.
  function crearYAvisar(extr: ExtraccionReservaResultado, opciones: { auto: boolean }) {
    if (extr.confianza < 0.7) return;
    setActionMessage(null);
    startTransition(() => {
      void (async () => {
        const result = await crearReservaDesdeIngesta(extr);
        if (!result.ok) {
          setActionMessage(`${result.message} ${result.missing.join(', ')}`);
          return;
        }
        const confirmacion: ConfirmacionChat = {
          pasajero: result.pasajeroNombre || 'tu pasajero',
          codigo: result.voucherCodigo,
          punto: result.puntoEncuentro ?? result.origenTexto,
          destino: result.destinoTexto,
          fecha: formatFechaCorta(result.fechaHoraServicioIso),
          link: `/p/${result.tokenPasajero}`,
          qrUrl: `/api/voucher/${encodeURIComponent(result.voucherCodigo)}/qr`,
        };
        setMessages((prev) => [
          ...prev,
          {
            id: `ok-${Date.now()}`,
            autor: 'taxigreen',
            hora: horaAhora(),
            texto: `¡Listo, ${confirmacion.pasajero}! Tu Taxi Green quedó reservado. Te esperamos en ${confirmacion.punto}.`,
          },
          {
            id: `card-${Date.now() + 1}`,
            autor: 'taxigreen',
            hora: horaAhora(),
            texto: '',
            confirmacion,
          },
        ]);
        setConfirmada(confirmacion);
        setReservaId(result.id);

        if (opciones.auto) {
          const asignacion = await asignarConductorAutomatico(result.id);
          if (asignacion.ok) {
            setConductorAsignado(`${asignacion.conductorNombre} · ${asignacion.placa}`);
            setMessages((prev) => [
              ...prev,
              {
                id: `drv-${Date.now()}`,
                autor: 'taxigreen',
                hora: horaAhora(),
                texto: `Tu conductor será ${asignacion.conductorNombre}, unidad ${asignacion.placa}. Ya está avisado.`,
              },
            ]);
          } else {
            setActionMessage(asignacion.message);
          }
        }
      })();
    });
  }

  // Trazabilidad del pase: mientras la reserva confirmada espera al counter, el chat
  // consulta el estado; al validarse el QR, el copiloto entrega el enlace en vivo.
  useEffect(() => {
    if (!reservaId || !confirmada || enlaceEnviado) return;
    const timer = setInterval(() => {
      obtenerSeguimientoReserva(reservaId)
        .then((seguimiento) => {
          if (!seguimiento.voucherValidado || enlaceEnviadoRef.current) return;
          enlaceEnviadoRef.current = true;
          setEnlaceEnviado(true);
          if (seguimiento.conductor) {
            setConductorAsignado(
              `${seguimiento.conductor.nombre}${seguimiento.conductor.placa ? ` · ${seguimiento.conductor.placa}` : ''}`,
            );
          }
          setMessages((prev) => [
            ...prev,
            {
              id: `live-${Date.now()}`,
              autor: 'taxigreen',
              hora: horaAhora(),
              texto: '¡Pase validado! Tu taxi te espera. Sigue tu viaje aquí:',
              enlace: confirmada.link,
            },
          ]);
        })
        .catch(() => undefined);
    }, 4000);
    return () => clearInterval(timer);
  }, [reservaId, confirmada, enlaceEnviado]);

  // Modo copiloto: ante cada lectura nueva, decide solo — pide los datos que faltan
  // o envía el resumen y espera la confirmación DEL CLIENTE (nunca crea sin ella).
  useEffect(() => {
    if (!copilotoAuto || !extraccion || confirmada || loading) return;
    const key = `${selectedId}:${inboundText.length}:${extraccion.preguntas_aclaracion.join('|')}:${Math.round(extraccion.confianza * 100)}`;
    if (autoHandledRef.current === key) return;
    autoHandledRef.current = key;

    if (extraccion.preguntas_aclaracion.length > 0) {
      const cuerpo = extraccion.preguntas_aclaracion.map((pregunta) => `• ${pregunta}`).join('\n');
      setMessages((prev) => [
        ...prev,
        {
          id: `ask-${Date.now()}`,
          autor: 'taxigreen',
          hora: horaAhora(),
          texto: `¡Con gusto coordinamos tu Taxi Green! Para dejarlo listo me confirmas:\n${cuerpo}`,
        },
      ]);
      setDatosPedidos(true);
      setEsperandoConfirmacionCliente(false);
      return;
    }

    if (extraccion.confianza >= 0.7) {
      const reserva = extraccion.reserva;
      setMessages((prev) => [
        ...prev,
        {
          id: `sum-${Date.now()}`,
          autor: 'taxigreen',
          hora: horaAhora(),
          texto:
            `Te confirmo tu reserva:\n` +
            `• Recojo: ${reserva.punto_encuentro ?? reserva.origen_texto ?? 'por confirmar'}\n` +
            `• Destino: ${reserva.destino_texto ?? 'por confirmar'}\n` +
            `• Pasajero: ${reserva.pasajero_nombre ?? 'por confirmar'}\n` +
            `• Fecha: ${formatValue(reserva.fecha_hora_servicio)}\n` +
            `¿La confirmo? Responde "Sí" y queda lista.`,
        },
      ]);
      setEsperandoConfirmacionCliente(true);
    }
  }, [copilotoAuto, extraccion, confirmada, loading, selectedId, inboundText.length]);

  const estado = estadoReserva(extraccion, Boolean(confirmada));

  return (
    <main className="min-h-screen bg-[#e7f0ee] text-[#111B21]">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[320px_minmax(420px,1fr)_420px]">
        <aside className="border-r border-[#c9d7d3] bg-[#f7fbfa]">
          <div className="flex h-16 items-center gap-3 border-b border-[#d8e3e0] bg-[#075E54] px-5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15">
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-semibold">WhatsApp</h1>
              <p className="text-xs text-white/75">Taxi Green · Reservas</p>
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
                      'max-w-[86%] rounded-md px-4 py-3 text-sm leading-relaxed shadow-sm',
                      message.autor === 'cliente' ? 'bg-white' : 'bg-[#DCF8C6]',
                    )}
                  >
                    {message.confirmacion ? (
                      <ConfirmacionMensaje data={message.confirmacion} />
                    ) : (
                      <>
                        <p className="whitespace-pre-line">{message.texto}</p>
                        {message.enlace ? <EnlaceMensaje link={message.enlace} /> : null}
                      </>
                    )}
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
              <p className="text-xs font-semibold uppercase text-[#128C7E]">Reserva sugerida</p>
              <h2 className="text-base font-semibold text-[#0a332f]">{fuenteLabel(extraccion)}</h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e0f5ef] text-[#075E54]">
              {fuenteIcon(extraccion)}
            </span>
          </div>

          <div className="space-y-4 p-5">
            {/* Switch del MODO COPILOTO: encendido, el copiloto pregunta, resume y —con
                la confirmación del cliente— crea la reserva y asigna conductor solo. */}
            <div
              className={cn(
                'flex items-center justify-between gap-3 rounded-md border p-4 transition',
                copilotoAuto ? 'border-emerald-300 bg-emerald-50' : 'border-[#d8e3e0] bg-white',
              )}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-bold text-[#0a332f]">
                  <Bot aria-hidden="true" className="h-4 w-4 text-[#075E54]" />
                  Modo copiloto
                </p>
                <p className="mt-1 text-xs leading-4 text-[#667781]">
                  {copilotoAuto
                    ? 'El copiloto responde, pide confirmación al cliente y asigna solo.'
                    : 'Apagado: tú revisas y confirmas cada reserva.'}
                </p>
              </div>
              <button
                aria-checked={copilotoAuto}
                aria-label="Activar modo copiloto"
                className={cn(
                  'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                  copilotoAuto ? 'bg-[#075E54]' : 'bg-[#c9d7d3]',
                )}
                onClick={() => setCopilotoAuto((value) => !value)}
                role="switch"
                type="button"
              >
                <span
                  className={cn(
                    'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
                    copilotoAuto ? 'left-6' : 'left-1',
                  )}
                />
              </button>
            </div>

            {error ? (
              <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <div className="rounded-md border border-[#d8e3e0] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className={cn('rounded-full px-3 py-1 text-xs font-bold', ESTADO_TONE[estado.tone])}>
                  {estado.label}
                </span>
                {extraccion ? (
                  <span className="text-[11px] font-medium text-[#9aa7a3]">
                    Lectura {Math.round(extraccion.confianza * 100)}%
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[#3b4a47]">
                {extraccion?.motivo ?? 'Pega o elige un WhatsApp para leer la reserva.'}
              </p>
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
                      <AlertCircle aria-hidden="true" className="h-4 w-4" />
                      Falta confirmar
                    </h3>
                    <ul className="space-y-1">
                      {extraccion.preguntas_aclaracion.map((pregunta) => (
                        <li key={pregunta}>{pregunta}</li>
                      ))}
                    </ul>
                    <Button
                      className="mt-3 w-full bg-[#128C7E] hover:bg-[#075E54]"
                      disabled={datosPedidos || Boolean(confirmada)}
                      onClick={pedirDatosAlCliente}
                      type="button"
                    >
                      <MessagesSquare aria-hidden="true" className="h-4 w-4" />
                      {datosPedidos ? 'Pedido enviado al chat' : 'Pedir estos datos al cliente'}
                    </Button>
                  </section>
                ) : (
                  <section className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    Datos completos. Listo para confirmar.
                  </section>
                )}

                {actionMessage ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {actionMessage}
                  </div>
                ) : null}

                {confirmada ? (
                  <section className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                      <p className="text-sm font-semibold">Enviada al cliente</p>
                    </div>
                    <ul className="mt-2 space-y-1.5 text-xs leading-4 text-emerald-800">
                      <li>
                        ✓ Reserva <span className="font-semibold">{confirmada.codigo}</span> + pase QR en el chat
                      </li>
                      <li>
                        {enlaceEnviado
                          ? '✓ Pase validado en counter · enlace en vivo enviado'
                          : '○ Enlace en vivo: se envía cuando el counter valide el pase'}
                      </li>
                      <li>
                        {conductorAsignado
                          ? `✓ Conductor: ${conductorAsignado}`
                          : '○ Conductor: lo elige el despacho'}
                      </li>
                    </ul>
                    {reservaId ? (
                      <Button
                        className="mt-3 w-full border border-[#cfe0db] bg-white text-[#075E54] hover:bg-[#eef7f4]"
                        onClick={() => router.push(`/admin/reservas/${reservaId}`)}
                        type="button"
                      >
                        Abrir en despacho
                      </Button>
                    ) : null}
                  </section>
                ) : copilotoAuto ? (
                  <section className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <Bot aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    {esperandoConfirmacionCliente
                      ? 'El copiloto envió el resumen y espera el "Sí" del cliente para crear la reserva y asignar conductor.'
                      : 'El copiloto está conversando con el cliente. Creará la reserva cuando el cliente confirme.'}
                  </section>
                ) : (
                  <>
                    <Button
                      className="h-12 w-full bg-[#075E54] hover:bg-[#05453e]"
                      disabled={isPending || extraccion.confianza < 0.7}
                      onClick={() => crearYAvisar(extraccion, { auto: false })}
                      type="button"
                    >
                      {isPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ClipboardCheck aria-hidden="true" className="h-4 w-4" />}
                      Confirmar y avisar al cliente
                    </Button>
                    <p className="text-center text-xs text-[#667781]">
                      {extraccion.confianza < 0.7
                        ? 'Completa o aclara los datos antes de confirmar.'
                        : 'Al confirmar, el cliente recibe su reserva y su pase QR; el enlace en vivo llega al validar en counter.'}
                    </p>
                  </>
                )}
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

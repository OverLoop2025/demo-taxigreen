'use client';

import {
  AlertCircle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Loader2,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Plus,
  QrCode,
  Send,
  ShieldCheck,
  UserRound,
  Wand2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ExtraccionReservaResultado, ReservaExtraida } from '@taxigreen/ingesta';
import { pagoChatHumano, resumenComercialHumano } from '@taxigreen/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  asignarConductorAutomatico,
  buscarReservaPorCodigo,
  crearReservaDesdeIngesta,
  obtenerSeguimientoReserva,
  previsualizarPagoDesdeIngesta,
  type PagoDemoChat,
} from './actions';
import { FECHA_SIMULADOR_ISO, type ConversacionSeed } from './conversaciones-seed';

// ─── Tipos base ──────────────────────────────────────────────────────────────

type Mensaje = ConversacionSeed['mensajes'][number];

type ConfirmacionChat = {
  pasajero: string;
  codigo: string;
  punto: string;
  destino: string;
  fecha: string;
  link: string;
  qrUrl: string;
  tipoViaje: string;
  requiereMostrador: boolean;
  comercial: {
    perfilPasajero: string;
    responsablePago: string;
    convenioValidadoDemo: boolean;
    requiereFactura: boolean;
    resumen: string;
    pagoChat: string;
  };
  pago: PagoDemoChat;
};

// ─── Flujo interactivo ───────────────────────────────────────────────────────

type OpcionInteractiva = {
  valor: string;
  etiqueta: string;
  descripcion?: string;
  emoji?: string;
};

type ComponenteInteractivo =
  | { tipo: 'intent-selector'; opciones: OpcionInteractiva[] }
  | { tipo: 'radio-group'; campo: string; etiqueta: string; opciones: OpcionInteractiva[] }
  | { tipo: 'date-time-picker' }
  | { tipo: 'location-options'; modo: 'destino' | 'origen' }
  | { tipo: 'code-lookup' };

type GuidedStep =
  | 'intent'
  | 'tipo_usuario'
  | 'flujo'
  | 'zona_llegada'
  | 'nombre_pasajero'
  | 'fecha'
  | 'destino'
  | 'origen_b'
  | 'responsable_pago'
  | 'vehiculo'
  | 'datos'
  | 'code_lookup';

type ChatMensaje = Mensaje & {
  confirmacion?: ConfirmacionChat;
  enlace?: string;
  interactivo?: ComponenteInteractivo;
};

// ─── Detección de saludo / intención ─────────────────────────────────────────

const CONFIRMACION_CLIENTE = /^\s*(s[ií]\b|s[ií][,.!]|confirmo|claro|ok\b|dale|de acuerdo|correcto)/iu;

function esSaludo(texto: string): boolean {
  if (texto.length > 70) return false;
  return /^\s*(hola|buenas?\s*(tardes?|noches?|d[ií]as?)?|buenos?\s*(d[ií]as?|tardes?|noches?)|hi\b|hey\b|buen\s*d[ií]a|saludos|ola|good\s*(morning|evening|afternoon))\s*[!.,]?\s*$/iu.test(texto);
}

function esIntencionDeReserva(texto: string) {
  if (texto.length > 80 || /\d/.test(texto)) return false;
  if (/aeropuerto|hotel|av\.|avenida|calle|jir[oó]n|recojo|recoger|llevar|vuelo/i.test(texto)) return false;
  return /\b(reservar?|necesito|quiero|solicitar)\b[\s\S]*\bun?\s*taxi\b/i.test(texto);
}

// ─── Helpers de formato ───────────────────────────────────────────────────────

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

function formatValue(value: ReservaExtraida[keyof ReservaExtraida]) {
  if (value === null || value === '') return 'Pendiente';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
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

function identidadDesdeExtraccion(reserva: ReservaExtraida) {
  const input = {
    perfilPasajero: reserva.perfil_pasajero ?? 'particular',
    responsablePago: reserva.responsable_pago ?? 'pasajero',
    convenioValidadoDemo: reserva.convenio_validado_demo,
    requiereFactura: reserva.requiere_factura,
    empresaNombre: reserva.empresa_nombre,
    hotelNombre: reserva.hotel_nombre,
    tipoPago: reserva.tipo_pago,
  };
  return {
    resumen: resumenComercialHumano(input),
    pagoChat: pagoChatHumano(input),
  };
}

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

const FIELD_GROUPS: Array<{ label: string; keys: Array<[keyof ReservaExtraida, string]> }> = [
  {
    label: 'Servicio',
    keys: [
      ['tipo_viaje', 'Tipo'],
      ['fecha_hora_servicio', 'Fecha'],
      ['tipo_pago', 'Pago'],
      ['perfil_pasajero', 'Perfil'],
      ['responsable_pago', 'Responsable'],
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
      ['pasajeros_cantidad', 'Personas'],
      ['equipaje_nivel', 'Equipaje'],
      ['vehiculo_preferencia', 'Vehículo'],
    ],
  },
];

// ─── Sub-componentes del chat ─────────────────────────────────────────────────

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
        <div className="flex items-start gap-2">
          <CreditCard aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#075E54]" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0a332f]">{data.pago.montoEtiqueta}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-[#3b4a47]">
              {data.pago.metodoLabel} · {data.pago.estadoLabel}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[#075E54]">{data.comercial.pagoChat}</p>
          </div>
        </div>
      </div>
      {data.requiereMostrador ? (
        <div className="mt-2 rounded-lg bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <QrCode aria-hidden="true" className="h-4 w-4 text-[#075E54]" />
            <p className="text-sm font-semibold text-[#0a332f]">Tu pase de abordaje</p>
          </div>
          <img
            alt={`Pase de abordaje de la reserva ${data.codigo}`}
            className="mx-auto mt-2 h-40 w-40 rounded-md border border-[#e3ece9]"
            src={data.qrUrl}
          />
          <p className="mt-1 text-center text-[11px] text-[#3b4a47]">
            Muéstralo en el mostrador del aeropuerto para subir a tu taxi.
          </p>
        </div>
      ) : (
        <div className="mt-2 rounded-lg bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="h-4 w-4 text-[#075E54]" />
            <p className="text-sm font-semibold text-[#0a332f]">Seguimiento activo</p>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-[#3b4a47]">
            No necesitas pasar por mostrador. Tu conductor va directo al punto de recojo.
          </p>
          <EnlaceMensaje link={data.link} />
        </div>
      )}
      <p className="mt-2 px-1 text-[11px] leading-4 text-[#3b4a47]">
        {data.requiereMostrador
          ? 'Al validar tu pase en el mostrador te llega aquí el enlace para seguir tu taxi en vivo.'
          : 'Tu conductor irá directo al punto de recojo y podrás seguir el viaje desde ahora.'}
      </p>
    </div>
  );
}

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

// ─── Componente interactivo del chat ─────────────────────────────────────────

function ComponenteInteractivoChat({
  interactivo,
  contestado,
  seleccionado,
  onSeleccionar,
}: {
  interactivo: ComponenteInteractivo;
  contestado: boolean;
  seleccionado: string | undefined;
  onSeleccionar: (valor: string, etiqueta: string) => void;
}) {
  const [fechaVal, setFechaVal] = useState('');
  const [horaVal, setHoraVal] = useState('');
  const [locTexto, setLocTexto] = useState('');
  const [locMode, setLocMode] = useState<null | 'texto'>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [codigoVal, setCodigoVal] = useState('');

  if (contestado) {
    return (
      <div className="mt-2 rounded-lg bg-[#e1f7d5] px-3 py-2 text-xs font-semibold text-[#075E54]">
        ✓ {seleccionado}
      </div>
    );
  }

  switch (interactivo.tipo) {
    case 'intent-selector':
      return (
        <div className="mt-3 flex flex-col gap-2">
          {interactivo.opciones.map((op) => (
            <button
              className="flex items-start gap-3 rounded-xl border border-[#c5dfd9] bg-white px-4 py-3 text-left transition hover:bg-[#e7fde2] active:scale-[0.98]"
              key={op.valor}
              onClick={() => onSeleccionar(op.valor, op.etiqueta)}
              type="button"
            >
              {op.emoji && <span className="text-xl leading-none">{op.emoji}</span>}
              <div>
                <p className="text-sm font-semibold text-[#0a332f]">{op.etiqueta}</p>
                {op.descripcion && <p className="mt-0.5 text-xs leading-4 text-[#667781]">{op.descripcion}</p>}
              </div>
            </button>
          ))}
        </div>
      );

    case 'radio-group':
      return (
        <div className="mt-3 flex flex-wrap gap-2">
          {interactivo.opciones.map((op) => (
            <button
              className="flex items-center gap-1.5 rounded-full border-2 border-[#128C7E] bg-white px-4 py-2 text-sm font-semibold text-[#075E54] transition hover:bg-[#e7fde2] active:scale-95"
              key={op.valor}
              onClick={() => onSeleccionar(op.valor, op.etiqueta)}
              type="button"
            >
              {op.emoji && <span>{op.emoji}</span>}
              {op.etiqueta}
            </button>
          ))}
        </div>
      );

    case 'date-time-picker': {
      const hoy = new Date().toISOString().split('T')[0] ?? '';
      return (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-[#c5dfd9] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]"
              min={hoy}
              onChange={(e) => setFechaVal(e.target.value)}
              type="date"
              value={fechaVal}
            />
            <input
              className="w-[104px] rounded-lg border border-[#c5dfd9] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]"
              onChange={(e) => setHoraVal(e.target.value)}
              type="time"
              value={horaVal}
            />
          </div>
          <button
            className="rounded-lg bg-[#128C7E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#075E54] disabled:opacity-40"
            disabled={!fechaVal || !horaVal}
            onClick={() => {
              const dt = new Date(`${fechaVal}T${horaVal}`);
              const etiqueta = dt.toLocaleString('es-PE', {
                timeZone: 'America/Lima',
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              });
              onSeleccionar(`${fechaVal}T${horaVal}:00`, etiqueta);
            }}
            type="button"
          >
            Confirmar fecha y hora
          </button>
        </div>
      );
    }

    case 'location-options': {
      const isDestino = interactivo.modo === 'destino';

      if (locMode === 'texto') {
        return (
          <div className="mt-3 flex flex-col gap-2">
            <input
              autoFocus
              className="rounded-lg border border-[#c5dfd9] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]"
              onChange={(e) => setLocTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && locTexto.trim().length >= 4) {
                  onSeleccionar(locTexto.trim(), locTexto.trim());
                }
              }}
              placeholder={isDestino ? 'Av. Pardo 123, Miraflores  ó  https://maps.app.goo.gl/…' : 'Hotel Costa Verde, Av. Malecón 200, Miraflores'}
              value={locTexto}
            />
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-lg border border-[#c5dfd9] bg-white px-3 py-2 text-sm font-medium text-[#667781] transition hover:bg-gray-50"
                onClick={() => setLocMode(null)}
                type="button"
              >
                Volver
              </button>
              <button
                className="flex-1 rounded-lg bg-[#128C7E] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#075E54] disabled:opacity-40"
                disabled={locTexto.trim().length < 4}
                onClick={() => onSeleccionar(locTexto.trim(), locTexto.trim())}
                type="button"
              >
                Confirmar
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="mt-3 flex flex-col gap-2">
          {!isDestino && (
            <button
              className="flex items-start gap-3 rounded-xl border border-[#c5dfd9] bg-white px-4 py-3 text-left transition hover:bg-[#e7fde2] disabled:opacity-60"
              disabled={geoLoading}
              onClick={() => {
                if (!navigator.geolocation) {
                  setLocMode('texto');
                  return;
                }
                setGeoLoading(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const txt = `Mi ubicación GPS (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)})`;
                    setGeoLoading(false);
                    onSeleccionar(txt, txt);
                  },
                  () => {
                    setGeoLoading(false);
                    setLocMode('texto');
                  },
                  { enableHighAccuracy: true, timeout: 8000 },
                );
              }}
              type="button"
            >
              {geoLoading ? (
                <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-[#128C7E]" />
              ) : (
                <span className="mt-0.5 text-xl leading-none">📡</span>
              )}
              <div>
                <p className="text-sm font-semibold text-[#0a332f]">Compartir mi ubicación GPS</p>
                <p className="mt-0.5 text-xs leading-4 text-[#667781]">El sistema usa tu GPS para encontrarte</p>
              </div>
            </button>
          )}
          <button
            className="flex items-start gap-3 rounded-xl border border-[#c5dfd9] bg-white px-4 py-3 text-left transition hover:bg-[#e7fde2]"
            onClick={() => setLocMode('texto')}
            type="button"
          >
            <span className="mt-0.5 text-xl leading-none">📍</span>
            <div>
              <p className="text-sm font-semibold text-[#0a332f]">
                {isDestino ? 'Escribir o pegar enlace de destino' : 'Escribir dirección de recojo'}
              </p>
              <p className="mt-0.5 text-xs leading-4 text-[#667781]">
                {isDestino ? 'Dirección completa o enlace de Google Maps' : 'Dirección o nombre del lugar'}
              </p>
            </div>
          </button>
          {isDestino && (
            <button
              className="flex items-start gap-3 rounded-xl border border-[#c5dfd9] bg-white px-4 py-3 text-left transition hover:bg-[#e7fde2]"
              onClick={() => setLocMode('texto')}
              type="button"
            >
              <span className="mt-0.5 text-xl leading-none">🗺️</span>
              <div>
                <p className="text-sm font-semibold text-[#0a332f]">Pegar enlace de Google Maps</p>
                <p className="mt-0.5 text-xs leading-4 text-[#667781]">https://maps.app.goo.gl/…</p>
              </div>
            </button>
          )}
        </div>
      );
    }

    case 'code-lookup':
      return (
        <div className="mt-3 flex flex-col gap-2">
          <input
            className="rounded-lg border border-[#c5dfd9] bg-white px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#128C7E]"
            maxLength={20}
            onChange={(e) => setCodigoVal(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && codigoVal.trim().length >= 4) {
                onSeleccionar(codigoVal.trim(), codigoVal.trim());
              }
            }}
            placeholder="TG-2026-0001"
            value={codigoVal}
          />
          <button
            className="rounded-lg bg-[#128C7E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#075E54] disabled:opacity-40"
            disabled={codigoVal.trim().length < 4}
            onClick={() => onSeleccionar(codigoVal.trim(), codigoVal.trim())}
            type="button"
          >
            Buscar reserva
          </button>
        </div>
      );
  }
  // Guarda de exhaustividad: el union type cubre todos los casos arriba
  return null;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function WhatsappSimulator({ conversaciones }: { conversaciones: ConversacionSeed[] }) {
  const router = useRouter();

  // Chats manuales (creados con el botón +)
  const [chatsManuales, setChatsManuales] = useState<ConversacionSeed[]>([]);
  const todasConversaciones = useMemo(
    () => [...chatsManuales, ...conversaciones],
    [chatsManuales, conversaciones],
  );

  const initial = conversaciones[0]!;
  const [selectedId, setSelectedId] = useState(initial.id);
  const [messages, setMessages] = useState<ChatMensaje[]>(initial.mensajes);
  const [composer, setComposer] = useState('');
  const [extraccion, setExtraccion] = useState<ExtraccionReservaResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmada, setConfirmada] = useState<ConfirmacionChat | null>(null);
  const [pagoPreview, setPagoPreview] = useState<PagoDemoChat | null>(null);
  const [pagoPreviewLoading, setPagoPreviewLoading] = useState(false);
  const [cotizacionVersion, setCotizacionVersion] = useState(0);
  const [autorizacionPago, setAutorizacionPago] = useState<string | null>(null);
  const [reservaId, setReservaId] = useState<string | null>(null);
  const [datosPedidos, setDatosPedidos] = useState(false);
  const [copilotoAuto, setCopilotoAuto] = useState(false);
  const [esperandoConfirmacionCliente, setEsperandoConfirmacionCliente] = useState(false);
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);
  const [conductorAsignado, setConductorAsignado] = useState<string | null>(null);
  const [guidedStep, setGuidedStep] = useState<GuidedStep | null>(null);

  // Mapa de mensajes interactivos ya contestados: id → etiqueta seleccionada
  const [mensajesContestados, setMensajesContestados] = useState<Map<string, string>>(new Map());

  // Refs para guards síncronos (evitan dobles disparos con StrictMode)
  const autoHandledRef = useRef<string | null>(null);
  const enlaceEnviadoRef = useRef(false);
  const autoConfirmingRef = useRef(false);
  const cotizacionKeyRef = useRef<string | null>(null);
  const resumenEmitidoRef = useRef(0);
  const unidadVistaRef = useRef<string | null>(null);
  const avisoSinUnidadRef = useRef(false);
  const reasignandoRef = useRef(false);

  // Scroll al último mensaje cuando llegan nuevos
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Contexto del flujo guiado: accesible síncronamente (ref, no state)
  const guidedTextoRef = useRef<string[]>([]);
  const guidedContextRef = useRef<{
    intent?: 'reservar' | 'consultar' | 'queja';
    tipoUsuario?: 'independiente' | 'corporativo';
    flujo?: 'A' | 'B';
  }>({});

  const [isPending, startTransition] = useTransition();

  const selected = todasConversaciones.find((c) => c.id === selectedId) ?? initial;

  // ─── Navegación entre conversaciones ──────────────────────────────────────

  function selectConversation(conversation: ConversacionSeed) {
    setSelectedId(conversation.id);
    setMessages(conversation.mensajes);
    setExtraccion(null);
    setError(null);
    setActionMessage(null);
    setConfirmada(null);
    setPagoPreview(null);
    setPagoPreviewLoading(false);
    setCotizacionVersion(0);
    setAutorizacionPago(null);
    setReservaId(null);
    setDatosPedidos(false);
    setEsperandoConfirmacionCliente(false);
    setGuidedStep(null);
    setEnlaceEnviado(false);
    setConductorAsignado(null);
    setMensajesContestados(new Map());
    autoHandledRef.current = null;
    enlaceEnviadoRef.current = false;
    autoConfirmingRef.current = false;
    cotizacionKeyRef.current = null;
    resumenEmitidoRef.current = 0;
    unidadVistaRef.current = null;
    avisoSinUnidadRef.current = false;
    reasignandoRef.current = false;
    guidedTextoRef.current = [];
    guidedContextRef.current = {};
  }

  function nuevoChatManual() {
    const nuevo: ConversacionSeed = {
      id: `manual-${Date.now()}`,
      nombre: `Chat manual ${chatsManuales.length + 1}`,
      subtitulo: 'Escribe como pasajero para probar',
      fuente: 'WhatsApp · prueba manual',
      mensajes: [],
    };
    setChatsManuales((current) => [nuevo, ...current]);
    selectConversation(nuevo);
  }

  // ─── Extracción ───────────────────────────────────────────────────────────

  function extractionPayloadFrom(sourceMessages: ChatMensaje[]) {
    const inbound = sourceMessages
      .filter((m) => m.autor === 'cliente')
      .map((m) => m.texto.trim())
      .filter(Boolean);
    const mensaje = inbound.at(-1) ?? '';
    const previous = inbound.slice(0, -1).join('\n');
    const guiado = guidedTextoRef.current.join('\n');
    const contextoConversacion = [selected.nombre, guiado, previous].filter(Boolean).join('\n');
    return { mensaje, contextoConversacion: contextoConversacion || undefined };
  }

  async function extractFromMessages(sourceMessages: ChatMensaje[]) {
    const payload = extractionPayloadFrom(sourceMessages);
    if (!payload.mensaje) return;
    setLoading(true);
    setError(null);
    setActionMessage(null);
    try {
      const response = await fetch('/api/ingesta/extraer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, fechaActualIso: FECHA_SIMULADOR_ISO }),
      });
      const json = (await response.json()) as unknown;
      if (!response.ok || (typeof json === 'object' && json && 'error' in json)) {
        const err = json as { error?: string };
        throw new Error(err.error ?? 'Extracción fallida.');
      }
      setExtraccion(json as ExtraccionReservaResultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extracción fallida.');
    } finally {
      setLoading(false);
    }
  }

  // Extrae usando solo el contexto acumulado del flujo guiado (sin messages history)
  async function extractGuided() {
    const texto = guidedTextoRef.current.join('\n');
    if (!texto.trim()) return;
    setLoading(true);
    setError(null);
    setActionMessage(null);
    try {
      const response = await fetch('/api/ingesta/extraer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mensaje: texto,
          contextoConversacion: selected.nombre,
          fechaActualIso: FECHA_SIMULADOR_ISO,
        }),
      });
      const json = (await response.json()) as unknown;
      if (!response.ok || (typeof json === 'object' && json && 'error' in json)) {
        const err = json as { error?: string };
        throw new Error(err.error ?? 'Extracción fallida.');
      }
      setExtraccion(json as ExtraccionReservaResultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extracción fallida.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Flujo guiado interactivo ─────────────────────────────────────────────

  function preguntarGuiado(step: GuidedStep) {
    setGuidedStep(step);

    let texto = '';
    let interactivo: ComponenteInteractivo | undefined;

    switch (step) {
      case 'intent':
        texto = '¡Hola! Bienvenido a Taxi Green. ¿En qué te puedo ayudar hoy?';
        interactivo = {
          tipo: 'intent-selector',
          opciones: [
            { valor: 'reservar', etiqueta: 'Reservar un taxi', descripcion: 'Recojo en aeropuerto, traslado o city', emoji: '🚕' },
            { valor: 'consultar', etiqueta: 'Consultar mi reserva', descripcion: 'Ver estado de una reserva existente', emoji: '📋' },
            { valor: 'queja', etiqueta: 'Reportar un problema', descripcion: 'Objeto olvidado, queja u otra incidencia', emoji: '⚠️' },
          ],
        };
        break;

      case 'tipo_usuario':
        texto = '¿Cómo viajas? Elige una opción:';
        interactivo = {
          tipo: 'radio-group',
          campo: 'perfil_pasajero',
          etiqueta: '¿Cómo viajas?',
          opciones: [
            { valor: 'independiente', etiqueta: 'Viajero independiente', emoji: '👤' },
            { valor: 'corporativo', etiqueta: 'Empresa o corporativo', emoji: '🏢' },
          ],
        };
        break;

      case 'flujo':
        texto = '¿Qué servicio necesitas?';
        interactivo = {
          tipo: 'radio-group',
          campo: 'tipo_viaje',
          etiqueta: '¿Qué servicio?',
          opciones: [
            { valor: 'recojo_aeropuerto', etiqueta: 'Me recogen en el aeropuerto', emoji: '✈️' },
            { valor: 'traslado_aeropuerto', etiqueta: 'Me llevan al aeropuerto', emoji: '🧳' },
            { valor: 'city', etiqueta: 'Traslado en la ciudad', emoji: '🏙️' },
          ],
        };
        break;

      case 'zona_llegada':
        texto = '¿Tu vuelo es nacional o internacional?';
        interactivo = {
          tipo: 'radio-group',
          campo: 'zona_llegada',
          etiqueta: '¿Nacional o internacional?',
          opciones: [
            { valor: 'nacional', etiqueta: 'Nacional (dentro del Perú)', emoji: '🇵🇪' },
            { valor: 'internacional', etiqueta: 'Internacional', emoji: '🌎' },
          ],
        };
        break;

      case 'nombre_pasajero':
        // Texto libre — no es interactivo (el counter lo necesita para el letrero)
        texto = '¿Cuál es el nombre completo del pasajero? El operador del mostrador lo buscará por su nombre.';
        interactivo = undefined;
        break;

      case 'fecha':
        texto = '¿Para cuándo necesitas el servicio?';
        interactivo = { tipo: 'date-time-picker' };
        break;

      case 'destino':
        texto = '¿A dónde te dirigimos?';
        interactivo = { tipo: 'location-options', modo: 'destino' };
        break;

      case 'origen_b':
        texto = '¿Desde dónde te recogemos?';
        interactivo = { tipo: 'location-options', modo: 'origen' };
        break;

      case 'responsable_pago':
        texto = '¿El servicio lo cubre tu empresa o lo pagas tú?';
        interactivo = {
          tipo: 'radio-group',
          campo: 'responsable_pago',
          etiqueta: '¿Quién paga?',
          opciones: [
            { valor: 'empresa', etiqueta: 'Lo cubre mi empresa', emoji: '🏢' },
            { valor: 'pasajero', etiqueta: 'Lo pago yo', emoji: '💳' },
          ],
        };
        break;

      case 'vehiculo':
        texto = '¿Cuánto equipaje llevas? (Elige o salta para continuar con el mejor disponible)';
        interactivo = {
          tipo: 'radio-group',
          campo: 'vehiculo',
          etiqueta: '¿Necesitas vehículo especial?',
          opciones: [
            { valor: 'cualquiera', etiqueta: 'El mejor disponible', emoji: '🚗' },
            { valor: 'sedan', etiqueta: 'Sedán', emoji: '🚘' },
            { valor: 'camioneta', etiqueta: 'Camioneta (más espacio)', emoji: '🚙' },
            { valor: 'van', etiqueta: 'Van (grupo grande)', emoji: '🚐' },
          ],
        };
        break;

      case 'code_lookup':
        texto =
          guidedContextRef.current.intent === 'queja'
            ? '¿Cuál es el código de tu reserva? Lo encontrarás en el mensaje de confirmación.'
            : '¿Cuál es el código de tu reserva? (Ej: TG-2026-0001)';
        interactivo = { tipo: 'code-lookup' };
        break;

      case 'datos':
        texto =
          '¡Perfecto! Para terminar, cuéntame en un solo mensaje: nombre del pasajero, teléfono, fecha y hora, vuelo (si aplica), y la dirección de recojo o destino.';
        interactivo = undefined;
        break;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `guia-${step}-${Date.now()}`,
        autor: 'taxigreen',
        hora: horaAhora(),
        texto,
        interactivo,
      },
    ]);
  }

  // Procesa la selección del usuario en un componente interactivo y avanza el flujo
  function procesarSeleccionInteractiva(valor: string, etiqueta: string) {
    const step = guidedStep;
    if (!step) return;

    switch (step) {
      case 'intent':
        guidedContextRef.current = { intent: valor as 'reservar' | 'consultar' | 'queja' };
        if (valor === 'reservar') {
          preguntarGuiado('tipo_usuario');
        } else {
          preguntarGuiado('code_lookup');
        }
        return;

      case 'tipo_usuario':
        guidedContextRef.current.tipoUsuario = valor as 'independiente' | 'corporativo';
        guidedTextoRef.current.push(valor === 'independiente' ? 'Soy un viajero particular.' : 'Soy cliente corporativo.');
        preguntarGuiado('flujo');
        return;

      case 'flujo':
        if (valor === 'recojo_aeropuerto') {
          guidedContextRef.current.flujo = 'A';
          guidedTextoRef.current.push('Necesito que me recojan en el aeropuerto Jorge Chávez.');
          preguntarGuiado('zona_llegada');
        } else if (valor === 'traslado_aeropuerto') {
          guidedContextRef.current.flujo = 'B';
          guidedTextoRef.current.push('Necesito que me lleven al aeropuerto.');
          preguntarGuiado('fecha');
        } else {
          guidedTextoRef.current.push('Necesito un traslado en la ciudad.');
          preguntarGuiado('fecha');
        }
        return;

      case 'zona_llegada':
        guidedTextoRef.current.push(valor === 'nacional' ? 'Mi vuelo es nacional.' : 'Mi vuelo es internacional.');
        // Flujo A: siempre pedir nombre (el counter lo necesita para el letrero)
        preguntarGuiado('nombre_pasajero');
        return;

      case 'fecha':
        guidedTextoRef.current.push(`El servicio es para el ${etiqueta}.`);
        if (guidedContextRef.current.flujo === 'A') {
          preguntarGuiado('destino');
        } else if (guidedContextRef.current.flujo === 'B') {
          preguntarGuiado('origen_b');
        } else {
          // city
          preguntarGuiado('vehiculo');
        }
        return;

      case 'destino':
        guidedTextoRef.current.push(`Mi destino es: ${etiqueta}.`);
        if (guidedContextRef.current.tipoUsuario === 'corporativo') {
          preguntarGuiado('responsable_pago');
        } else {
          preguntarGuiado('vehiculo');
        }
        return;

      case 'origen_b':
        guidedTextoRef.current.push(`El punto de recojo es: ${etiqueta}.`);
        if (guidedContextRef.current.tipoUsuario === 'corporativo') {
          preguntarGuiado('responsable_pago');
        } else {
          preguntarGuiado('vehiculo');
        }
        return;

      case 'responsable_pago':
        guidedTextoRef.current.push(
          valor === 'empresa' ? 'El servicio lo cubre mi empresa.' : 'Este viaje lo pago yo.',
        );
        preguntarGuiado('vehiculo');
        return;

      case 'vehiculo':
        if (valor === 'sedan') guidedTextoRef.current.push('Prefiero un sedán.');
        else if (valor === 'camioneta') guidedTextoRef.current.push('Prefiero una camioneta con espacio para el equipaje.');
        else if (valor === 'van') guidedTextoRef.current.push('Necesitamos una van para el grupo.');
        // 'cualquiera' → no agrega texto (default)
        setGuidedStep(null);
        void extractGuided();
        return;

      case 'code_lookup':
        void lookupReservaEnChat(valor);
        return;

      default:
        return;
    }
  }

  // Cuando el usuario selecciona una opción interactiva
  function respondInteractivo(messageId: string, valor: string, etiqueta: string) {
    setMensajesContestados((prev) => new Map(prev).set(messageId, etiqueta));
    setMessages((prev) => [
      ...prev,
      { id: `resp-${Date.now()}`, autor: 'cliente', hora: horaAhora(), texto: etiqueta },
    ]);
    procesarSeleccionInteractiva(valor, etiqueta);
  }

  // Consulta de reserva para el flujo de "consultar/queja"
  async function lookupReservaEnChat(codigo: string) {
    setGuidedStep(null);
    setLoading(true);
    try {
      const resultado = await buscarReservaPorCodigo(codigo);
      if (!resultado.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `lookup-err-${Date.now()}`,
            autor: 'taxigreen',
            hora: horaAhora(),
            texto: `No encontré una reserva con el código ${codigo}. Verifica el código e inténtalo de nuevo, o escríbenos directamente.`,
          },
        ]);
        return;
      }
      const nombre = resultado.nombre ? ` para ${resultado.nombre}` : '';
      const isQueja = guidedContextRef.current.intent === 'queja';
      setMessages((prev) => [
        ...prev,
        {
          id: `lookup-ok-${Date.now()}`,
          autor: 'taxigreen',
          hora: horaAhora(),
          texto: isQueja
            ? `Encontré tu reserva ${resultado.codigo}${nombre}. Estamos registrando tu incidencia. Puedes ver el estado completo de tu viaje aquí:`
            : `Encontré tu reserva ${resultado.codigo}${nombre}. Aquí puedes seguir el estado de tu viaje en tiempo real:`,
          enlace: resultado.link,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ─── Pedir datos al cliente (modo panel derecho) ───────────────────────────

  // Envía la PRIMERA pregunta faltante como componente interactivo
  function pedirDatosInteractivos() {
    if (!extraccion) return;
    const reserva = extraccion.reserva;

    // Sincronizar guidedContextRef desde la extracción existente para que
    // procesarSeleccionInteractiva tome la rama correcta (A/B/city) al avanzar.
    if (reserva.tipo_viaje === 'recojo_aeropuerto') {
      guidedContextRef.current.flujo = 'A';
    } else if (reserva.tipo_viaje === 'traslado_aeropuerto') {
      guidedContextRef.current.flujo = 'B';
    } else if (reserva.tipo_viaje) {
      guidedContextRef.current.flujo = undefined;
    }
    if (reserva.perfil_pasajero === 'corporativo') {
      guidedContextRef.current.tipoUsuario = 'corporativo';
    } else if (reserva.perfil_pasajero) {
      guidedContextRef.current.tipoUsuario = 'independiente';
    }

    const addMsg = (texto: string, interactivo: ComponenteInteractivo) => {
      setMessages((prev) => [
        ...prev,
        { id: `ask-${Date.now()}`, autor: 'taxigreen', hora: horaAhora(), texto, interactivo },
      ]);
      setDatosPedidos(true);
    };

    if (!reserva.tipo_viaje) {
      setGuidedStep('flujo');
      addMsg('¿Qué servicio necesitas?', {
        tipo: 'radio-group',
        campo: 'tipo_viaje',
        etiqueta: '¿Qué servicio?',
        opciones: [
          { valor: 'recojo_aeropuerto', etiqueta: 'Me recogen en el aeropuerto', emoji: '✈️' },
          { valor: 'traslado_aeropuerto', etiqueta: 'Me llevan al aeropuerto', emoji: '🧳' },
          { valor: 'city', etiqueta: 'Traslado en la ciudad', emoji: '🏙️' },
        ],
      });
      return;
    }

    if (!reserva.fecha_hora_servicio) {
      setGuidedStep('fecha');
      addMsg('¿Para cuándo necesitas el servicio?', { tipo: 'date-time-picker' });
      return;
    }

    if (!reserva.destino_texto && reserva.tipo_viaje !== 'traslado_aeropuerto') {
      setGuidedStep('destino');
      addMsg('¿A dónde te dirigimos?', { tipo: 'location-options', modo: 'destino' });
      return;
    }

    if (!reserva.origen_texto && reserva.tipo_viaje === 'traslado_aeropuerto') {
      setGuidedStep('origen_b');
      addMsg('¿Desde dónde te recogemos?', { tipo: 'location-options', modo: 'origen' });
      return;
    }

    // Fallback: texto libre con todas las preguntas restantes
    if (extraccion.preguntas_aclaracion.length > 0) {
      const cuerpo = extraccion.preguntas_aclaracion.map((q) => `• ${q}`).join('\n');
      setMessages((prev) => [
        ...prev,
        {
          id: `ask-txt-${Date.now()}`,
          autor: 'taxigreen',
          hora: horaAhora(),
          texto: `¡Con gusto coordinamos tu Taxi Green! Para dejarlo listo me confirmas:\n${cuerpo}`,
        },
      ]);
      setDatosPedidos(true);
    }
  }

  // ─── Enviar mensaje ────────────────────────────────────────────────────────

  function sendMessage() {
    const text = composer.trim();
    if (!text) return;

    const userMsg: ChatMensaje = {
      id: `custom-${Date.now()}`,
      autor: 'cliente',
      hora: horaAhora(),
      texto: text,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setComposer('');

    // Copiloto auto: "Sí" del cliente confirma la reserva
    if (copilotoAuto && esperandoConfirmacionCliente && extraccion && CONFIRMACION_CLIENTE.test(text)) {
      autoConfirmingRef.current = true;
      setEsperandoConfirmacionCliente(false);
      crearYAvisar(extraccion, { auto: true });
      return;
    }

    // Paso de texto "nombre_pasajero" en el flujo guiado
    if (guidedStep === 'nombre_pasajero') {
      guidedTextoRef.current.push(`El pasajero se llama ${text}.`);
      preguntarGuiado('fecha');
      return;
    }

    // Paso de texto "datos" (fallback libre)
    if (guidedStep === 'datos') {
      setGuidedStep(null);
      void extractFromMessages(nextMessages);
      return;
    }

    // Si hay un paso interactivo activo y el usuario escribe texto libre,
    // lo acumulamos como contexto y extraemos igualmente
    if (guidedStep) {
      guidedTextoRef.current.push(text);
      void extractFromMessages(nextMessages);
      setGuidedStep(null);
      return;
    }

    // Saludo puro → intent selector
    if (!guidedStep && !extraccion && !confirmada && esSaludo(text)) {
      guidedTextoRef.current = [];
      guidedContextRef.current = {};
      preguntarGuiado('intent');
      return;
    }

    // Intención simple de reserva ("necesito un taxi")
    if (!guidedStep && !extraccion && !confirmada && esIntencionDeReserva(text)) {
      guidedTextoRef.current = [];
      guidedContextRef.current = {};
      preguntarGuiado('tipo_usuario');
      return;
    }

    void extractFromMessages(nextMessages);
  }

  // ─── Crear reserva y avisar al cliente ────────────────────────────────────

  function crearYAvisar(extr: ExtraccionReservaResultado, opciones: { auto: boolean }) {
    if (extr.confianza < 0.7) return;
    setActionMessage(null);
    startTransition(() => {
      void (async () => {
        let result: Awaited<ReturnType<typeof crearReservaDesdeIngesta>>;
        try {
          setAutorizacionPago('Calculando tarifa');
          result = await crearReservaDesdeIngesta(extr);
          if (!result.ok) {
            autoConfirmingRef.current = false;
            setAutorizacionPago(null);
            setActionMessage(`${result.message} ${result.missing.join(', ')}`);
            return;
          }
          setAutorizacionPago('Validando método de pago');
          await new Promise((resolve) => setTimeout(resolve, 420));
          setAutorizacionPago(`${result.pago.estadoLabel} ✓`);
          await new Promise((resolve) => setTimeout(resolve, 420));
        } catch (err) {
          autoConfirmingRef.current = false;
          setAutorizacionPago(null);
          setActionMessage(err instanceof Error ? err.message : 'No se pudo confirmar la reserva.');
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
          tipoViaje: result.tipoViaje,
          requiereMostrador: result.requiereMostrador,
          comercial: result.comercial,
          pago: result.pago,
        };
        setMessages((prev) => [
          ...prev,
          {
            id: `ok-${Date.now()}`,
            autor: 'taxigreen',
            hora: horaAhora(),
            texto: result.requiereMostrador
              ? `¡Listo, ${confirmacion.pasajero}! Tu Taxi Green quedó reservado. Te esperamos en ${confirmacion.punto}.`
              : `¡Listo, ${confirmacion.pasajero}! Tu Taxi Green quedó reservado. El recojo será en ${confirmacion.punto}.`,
          },
          { id: `card-${Date.now() + 1}`, autor: 'taxigreen', hora: horaAhora(), texto: '', confirmacion },
        ]);
        setConfirmada(confirmacion);
        setPagoPreview(result.pago);
        setAutorizacionPago(null);
        setReservaId(result.id);
        if (!result.requiereMostrador) {
          enlaceEnviadoRef.current = true;
          setEnlaceEnviado(true);
        }
        if (opciones.auto && !result.requiereMostrador) {
          const asignacion = await asignarConductorAutomatico(result.id);
          if (asignacion.ok) {
            const conductor = `${asignacion.conductorNombre} · ${asignacion.placa}`;
            setConductorAsignado(conductor);
            setMessages((prev) => [
              ...prev,
              {
                id: `driver-${Date.now()}`,
                autor: 'taxigreen',
                hora: horaAhora(),
                texto: `Tu conductor es ${asignacion.conductorNombre}, unidad ${asignacion.placa}. Ya puede iniciar hacia el punto de recojo.`,
              },
            ]);
          } else {
            setActionMessage(asignacion.message);
          }
        }
      })();
    });
  }

  // ─── Efectos ──────────────────────────────────────────────────────────────

  // Polling de voucher validado (trazabilidad A → enlace en vivo)
  useEffect(() => {
    if (!reservaId || !confirmada || enlaceEnviado || !confirmada.requiereMostrador) return;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const seguimiento = await obtenerSeguimientoReserva(reservaId);
          if (!seguimiento.voucherValidado || enlaceEnviadoRef.current) return;
          enlaceEnviadoRef.current = true;
          setEnlaceEnviado(true);
          let conductor = seguimiento.conductor;
          if (copilotoAuto && !conductor) {
            const asignacion = await asignarConductorAutomatico(reservaId);
            if (asignacion.ok) {
              conductor = { nombre: asignacion.conductorNombre, placa: asignacion.placa };
            } else {
              setActionMessage(asignacion.message);
            }
          }
          if (conductor) setConductorAsignado(`${conductor.nombre}${conductor.placa ? ` · ${conductor.placa}` : ''}`);
          setMessages((prev) => [
            ...prev,
            {
              id: `live-${Date.now()}`,
              autor: 'taxigreen',
              hora: horaAhora(),
              texto: conductor
                ? `¡Pase validado! Tu conductor es ${conductor.nombre}${conductor.placa ? `, unidad ${conductor.placa}` : ''}. Sigue tu taxi aquí:`
                : '¡Pase validado! Tu taxi te espera. Sigue tu viaje aquí:',
              enlace: confirmada.link,
            },
          ]);
        } catch {
          // polling best-effort
        }
      })();
    }, 4000);
    return () => clearInterval(timer);
  }, [reservaId, confirmada, enlaceEnviado, copilotoAuto]);

  // F7: vigilancia de la unidad tras confirmar
  useEffect(() => {
    if (!reservaId || !confirmada) return;
    const pushTaxigreen = (texto: string) => {
      setMessages((prev) => [
        ...prev,
        { id: `unidad-${Date.now()}`, autor: 'taxigreen', hora: horaAhora(), texto },
      ]);
    };
    const disculpa = (nombre: string, placa: string | null) =>
      `Disculpa, tuvimos que cambiar tu unidad para cuidar tu tiempo. Tu nuevo conductor es ${nombre}, unidad ${placa ?? 'por confirmar'}.${enlaceEnviadoRef.current ? ' Tu enlace de seguimiento sigue siendo el mismo.' : ''}`;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const seguimiento = await obtenerSeguimientoReserva(reservaId);
          const actual = seguimiento.conductor
            ? `${seguimiento.conductor.nombre} · ${seguimiento.conductor.placa ?? 'por confirmar'}`
            : null;
          const previa = unidadVistaRef.current;
          if (actual && !previa) {
            unidadVistaRef.current = actual;
            if (avisoSinUnidadRef.current && seguimiento.conductor) {
              avisoSinUnidadRef.current = false;
              setConductorAsignado(actual);
              pushTaxigreen(disculpa(seguimiento.conductor.nombre, seguimiento.conductor.placa));
            }
            return;
          }
          if (actual && previa && actual !== previa) {
            unidadVistaRef.current = actual;
            avisoSinUnidadRef.current = false;
            setConductorAsignado(actual);
            if (seguimiento.conductor) pushTaxigreen(disculpa(seguimiento.conductor.nombre, seguimiento.conductor.placa));
            return;
          }
          if (!actual && previa) {
            unidadVistaRef.current = null;
            if (copilotoAuto && !reasignandoRef.current) {
              reasignandoRef.current = true;
              try {
                const asignacion = await asignarConductorAutomatico(reservaId);
                if (asignacion.ok) {
                  const nueva = `${asignacion.conductorNombre} · ${asignacion.placa}`;
                  unidadVistaRef.current = nueva;
                  avisoSinUnidadRef.current = false;
                  setConductorAsignado(nueva);
                  pushTaxigreen(disculpa(asignacion.conductorNombre, asignacion.placa));
                  return;
                }
              } finally {
                reasignandoRef.current = false;
              }
            }
            if (!avisoSinUnidadRef.current) {
              avisoSinUnidadRef.current = true;
              setConductorAsignado(null);
              pushTaxigreen('Tu unidad tuvo un inconveniente. Ya estamos asignando otra para cuidar tu tiempo; te confirmamos aquí en un momento.');
            }
          }
        } catch {
          // best-effort
        }
      })();
    }, 5000);
    return () => clearInterval(timer);
  }, [reservaId, confirmada, copilotoAuto]);

  // Cotización en tiempo real
  useEffect(() => {
    if (!extraccion) {
      setPagoPreview(null);
      setPagoPreviewLoading(false);
      setCotizacionVersion(0);
      cotizacionKeyRef.current = null;
      return;
    }
    let cancelled = false;
    const reserva = extraccion.reserva;
    const cotizacionKey = [
      reserva.origen_texto,
      reserva.destino_texto,
      reserva.vehiculo_preferencia,
      reserva.pasajeros_cantidad ?? reserva.pasajeros,
      reserva.equipaje_nivel,
      reserva.tipo_pago,
    ].join('|');
    setPagoPreviewLoading(true);
    previsualizarPagoDesdeIngesta(extraccion)
      .then((result) => {
        if (cancelled) return;
        setPagoPreview(result.ok ? result.pago : null);
        if (result.ok && cotizacionKeyRef.current !== cotizacionKey) {
          cotizacionKeyRef.current = cotizacionKey;
          setCotizacionVersion((v) => v + 1);
        }
      })
      .catch(() => { if (!cancelled) setPagoPreview(null); })
      .finally(() => { if (!cancelled) setPagoPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [extraccion]);

  // Copiloto auto
  useEffect(() => {
    if (!copilotoAuto || !extraccion || confirmada || loading || esperandoConfirmacionCliente || autoConfirmingRef.current) return;
    if (extraccion.confianza >= 0.7 && pagoPreviewLoading) return;
    const key = `${selectedId}:${extraccion.reserva.raw_texto}:${extraccion.preguntas_aclaracion.join('|')}:${Math.round(extraccion.confianza * 100)}`;
    if (autoHandledRef.current === key) return;
    autoHandledRef.current = key;

    if (extraccion.preguntas_aclaracion.length > 0) {
      const cuerpo = extraccion.preguntas_aclaracion.map((q) => `• ${q}`).join('\n');
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
      const comercial = identidadDesdeExtraccion(reserva);
      resumenEmitidoRef.current += 1;
      const intro = resumenEmitidoRef.current > 1 ? 'Actualicé tu reserva:' : 'Te confirmo tu reserva:';
      setMessages((prev) => [
        ...prev,
        {
          id: `sum-${Date.now()}`,
          autor: 'taxigreen',
          hora: horaAhora(),
          texto:
            `${intro}\n` +
            `• Recojo: ${reserva.punto_encuentro ?? reserva.origen_texto ?? 'por confirmar'}\n` +
            `• Destino: ${reserva.destino_texto ?? 'por confirmar'}\n` +
            `• Pasajero: ${reserva.pasajero_nombre ?? 'por confirmar'}\n` +
            `• Fecha: ${formatValue(reserva.fecha_hora_servicio)}\n` +
            `• Cliente: ${comercial.resumen}\n` +
            `• ${comercial.pagoChat}\n` +
            `${pagoPreview ? `• Tarifa estimada protegida v${cotizacionVersion || 1}: ${pagoPreview.montoEtiqueta}\n` : ''}` +
            `¿La confirmo? Responde "Sí" y queda lista.`,
        },
      ]);
      setEsperandoConfirmacionCliente(true);
    }
  }, [
    copilotoAuto, extraccion, confirmada, loading, selectedId,
    pagoPreview, pagoPreviewLoading, cotizacionVersion, esperandoConfirmacionCliente,
  ]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const estado = estadoReserva(extraccion, Boolean(confirmada));

  return (
    <main className="min-h-screen bg-[#e7f0ee] text-[#111B21] xl:h-screen xl:overflow-hidden">
      <div className="grid min-h-screen grid-cols-1 xl:h-screen xl:grid-cols-[320px_minmax(420px,1fr)_420px]">

        {/* ── Lista de chats ──────────────────────────────────────────── */}
        <aside className="flex flex-col border-r border-[#c9d7d3] bg-[#f7fbfa] xl:h-screen xl:min-h-0">
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[#d8e3e0] bg-[#075E54] px-5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15">
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h1 className="text-base font-semibold">WhatsApp</h1>
              <p className="text-xs text-white/75">Taxi Green · Reservas</p>
            </div>
            <button
              aria-label="Nuevo chat manual"
              className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15 transition hover:bg-white/25"
              onClick={nuevoChatManual}
              type="button"
            >
              <Plus aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto p-3">
            {todasConversaciones.map((conversation) => (
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

        {/* ── Chat ────────────────────────────────────────────────────── */}
        <section className="flex min-h-screen flex-col bg-[#efe7dd] xl:h-screen xl:min-h-0">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#d4cbc0] bg-[#f0f2f5] px-5">
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
              onClick={() => void extractFromMessages(messages)}
              type="button"
            >
              {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Wand2 aria-hidden="true" className="h-4 w-4" />}
              Extraer
            </Button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
              {messages.map((message) => {
                const isContestado = Boolean(mensajesContestados.get(message.id));
                const seleccionado = mensajesContestados.get(message.id);
                return (
                  <div
                    className={cn('flex', message.autor === 'cliente' ? 'justify-start' : 'justify-end')}
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
                          {message.texto && <p className="whitespace-pre-line">{message.texto}</p>}
                          {message.enlace ? <EnlaceMensaje link={message.enlace} /> : null}
                          {message.interactivo ? (
                            <ComponenteInteractivoChat
                              contestado={isContestado}
                              interactivo={message.interactivo}
                              onSeleccionar={(valor, etiqueta) => respondInteractivo(message.id, valor, etiqueta)}
                              seleccionado={seleccionado}
                            />
                          ) : null}
                        </>
                      )}
                      <p className="mt-2 text-right text-[11px] text-[#667781]">{message.hora}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-px" />
            </div>
          </div>

          <footer className="shrink-0 border-t border-[#d4cbc0] bg-[#f0f2f5] p-3">
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <textarea
                className="min-h-12 flex-1 resize-none rounded-md border border-[#d5ddd9] bg-white px-4 py-3 text-sm outline-none focus:border-[#128C7E] focus:ring-2 focus:ring-[#128C7E]/20"
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
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

        {/* ── Panel derecho: reserva sugerida ─────────────────────────── */}
        <aside className="border-l border-[#c9d7d3] bg-[#f7fbfa] xl:h-screen xl:overflow-y-auto">
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
            {/* Modo copiloto */}
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
                    ? 'El copiloto responde, pide confirmación y coordina el flujo.'
                    : 'Apagado: tú revisas y confirmas cada reserva.'}
                </p>
              </div>
              <button
                aria-checked={copilotoAuto}
                aria-label="Activar modo copiloto"
                className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', copilotoAuto ? 'bg-[#075E54]' : 'bg-[#c9d7d3]')}
                onClick={() => setCopilotoAuto((v) => !v)}
                role="switch"
                type="button"
              >
                <span
                  className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', copilotoAuto ? 'left-6' : 'left-1')}
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

            {autorizacionPago ? (
              <section className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  {autorizacionPago.endsWith('✓') ? (
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  )}
                  {autorizacionPago}
                </div>
                <p className="mt-1 text-xs leading-4 text-emerald-800">
                  Dejando la tarifa estimada protegida lista antes de confirmar.
                </p>
              </section>
            ) : null}

            {extraccion && (pagoPreview || pagoPreviewLoading) ? (
              <section className="rounded-md border border-[#d8e3e0] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#0a332f]">
                      <CreditCard aria-hidden="true" className="h-4 w-4 text-[#075E54]" />
                      Tarifa estimada protegida
                    </h3>
                    <p className="mt-1 text-xs leading-4 text-[#667781]">
                      Versión v{cotizacionVersion || 1}. Cambia solo si el cliente corrige destino o condiciones.
                    </p>
                  </div>
                  {pagoPreviewLoading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-[#075E54]" /> : null}
                </div>
                {pagoPreview ? (
                  <div className="mt-3 rounded-md bg-[#f0faf6] p-3">
                    <p className="text-lg font-bold text-[#063f38]">{pagoPreview.montoEtiqueta}</p>
                    <p className="mt-1 text-sm text-[#3b4a47]">
                      {pagoPreview.metodoLabel} · {pagoPreview.estadoLabel}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#075E54]">
                      {identidadDesdeExtraccion(extraccion.reserva).pagoChat}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {extraccion ? (
              <>
                {FIELD_GROUPS.map((group) => (
                  <section className="rounded-md border border-[#d8e3e0] bg-white p-4" key={group.label}>
                    <h3 className="mb-3 text-sm font-semibold text-[#0a332f]">{group.label}</h3>
                    <div className="space-y-2">
                      {group.keys
                        .filter(([key]) => {
                          if (key !== 'punto_encuentro') return true;
                          return (
                            extraccion.reserva.tipo_viaje === 'recojo_aeropuerto' ||
                            Boolean(extraccion.reserva.punto_encuentro)
                          );
                        })
                        .map(([key, label]) => {
                          const value = extraccion.reserva[key];
                          return (
                            <div className="grid grid-cols-[92px_1fr] gap-3 text-sm" data-field={key} key={key}>
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
                      {extraccion.preguntas_aclaracion.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                    <Button
                      className="mt-3 w-full bg-[#128C7E] hover:bg-[#075E54]"
                      disabled={datosPedidos || Boolean(confirmada)}
                      onClick={pedirDatosInteractivos}
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
                        ✓ Reserva <span className="font-semibold">{confirmada.codigo}</span>
                        {confirmada.requiereMostrador ? ' + pase de abordaje en el chat' : ' + seguimiento directo'}
                      </li>
                      {confirmada.requiereMostrador ? (
                        <li>
                          {enlaceEnviado
                            ? '✓ Pase validado en mostrador · enlace en vivo enviado'
                            : '○ Enlace en vivo: se envía cuando el mostrador valide el pase'}
                        </li>
                      ) : (
                        <li>✓ Sin mostrador · el enlace en vivo ya está disponible</li>
                      )}
                      <li>
                        {conductorAsignado
                          ? `✓ Conductor: ${conductorAsignado}`
                          : confirmada.requiereMostrador
                            ? '○ Conductor: se informa después de validar el pase'
                            : '○ Conductor: despacho lo asignará al servicio'}
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
                      ? 'El copiloto envió el resumen y espera el "Sí" del cliente para crear la reserva.'
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
                        : extraccion.reserva.tipo_viaje === 'recojo_aeropuerto'
                          ? 'Al confirmar, el cliente recibe su reserva y su pase; el enlace en vivo llega al validar en mostrador.'
                          : 'Al confirmar, el cliente recibe su reserva y el enlace en vivo directo.'}
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

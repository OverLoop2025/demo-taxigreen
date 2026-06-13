'use client';

import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Loader2,
  MapPin,
  Megaphone,
  Plane,
  QrCode,
  RotateCcw,
  Search,
  Users,
  UserRound,
  XCircle,
} from 'lucide-react';
import jsQR from 'jsqr';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type VerifyPayload = {
  ok: boolean;
  error?: string;
  consumed?: boolean;
  consumedAt?: string;
  reserva?: {
    id: string;
    voucher_codigo: string;
    origen_texto: string;
    destino_texto: string;
    punto_encuentro: string | null;
    pasajero_nombre?: string;
    pasajero_telefono?: string;
    vuelo_codigo?: string | null;
    estado?: string;
    estado_abordaje?: string;
    counter_validado_en?: string | null;
    conductor?: {
      nombre: string;
      placa: string | null;
    } | null;
    comercial?: {
      perfilPasajero: string;
      responsablePago: string;
      convenioValidadoDemo: boolean;
      requiereFactura: boolean;
      resumen: string;
      pagoMostrador: string;
    };
    pago?: {
      metodo: string;
      metodoLabel: string;
      estado: string;
      estadoLabel: string;
      monto: string;
      moneda: string;
      montoEtiqueta: string;
      etiqueta: string;
    } | null;
  };
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

// Datos mínimos para mostrar el letrero de llamado en sala.
type LetreroData = {
  nombre: string;
  vuelo: string | null;
  punto: string | null;
  codigo: string;
};

function voucherIdFromTokenOrCode(value: string) {
  const trimmed = value.trim();
  if (/^TG-\d{4}-\d{4}$/i.test(trimmed)) return trimmed.toUpperCase();

  const [body] = trimmed.split('.');
  if (!body) return trimmed;
  try {
    const normalized = body.replaceAll('-', '+').replaceAll('_', '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(atob(padded)) as {
      codigo_publico?: unknown;
    };
    return typeof decoded.codigo_publico === 'string' ? decoded.codigo_publico : trimmed;
  } catch {
    return trimmed;
  }
}

async function resolveToken(value: string) {
  const trimmed = value.trim();
  if (trimmed.includes('.')) return trimmed;

  const voucherId = voucherIdFromTokenOrCode(trimmed);
  const response = await fetch(`/api/voucher/${encodeURIComponent(voucherId)}/qr`, { cache: 'no-store' });
  const token = response.headers.get('x-voucher-token');
  if (!response.ok || !token) throw new Error('voucher_no_encontrado');
  return token;
}

function errorLabel(error: string | undefined) {
  if (error === 'voucher_ya_validado') return 'Este pase ya se usó. Cada código vale una sola vez.';
  if (error === 'token_invalido') return 'El código no corresponde a un pase vigente.';
  if (error === 'counter_no_autorizado') return 'Inicia sesión de operador para confirmar el acceso.';
  if (error === 'reserva_cancelada') return 'Esta reserva fue cancelada. El pase ya no es válido.';
  return 'No se pudo validar el pase.';
}

type Status = 'idle' | 'validating' | 'ready' | 'consuming' | 'consumed' | 'error';

function stepFromStatus(status: Status): 0 | 1 | 2 {
  if (status === 'consumed') return 2;
  if (status === 'ready' || status === 'consuming') return 1;
  return 0;
}

function Stepper({ current }: { current: 0 | 1 | 2 }) {
  const steps = ['Validar', 'Confirmar', 'Listo'];
  const stepItems = steps.map((label, index) => {
    const active = index === current;
    const done = index < current;
    return (
      <div key={label} className="flex min-w-0 flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-2">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            done ? 'bg-success text-white' : active ? 'bg-product text-white' : 'bg-surface-muted text-foreground-muted'
          }`}
        >
          {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
        </span>
        <span className={`text-xs font-semibold sm:text-sm ${active || done ? 'text-foreground' : 'text-foreground-muted'}`}>
          {label}
        </span>
      </div>
    );
  });
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(2rem,0.65fr)_minmax(0,1fr)_minmax(2rem,0.65fr)_minmax(0,1fr)] items-center gap-2">
      {stepItems[0]}
      <span className={`h-px w-full ${current > 0 ? 'bg-product' : 'bg-border'}`} />
      {stepItems[1]}
      <span className={`h-px w-full ${current > 1 ? 'bg-product' : 'bg-border'}`} />
      {stepItems[2]}
    </div>
  );
}

function DataRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-muted px-4 py-3">
      <span className="mt-0.5 text-product">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{label}</p>
        <p className="mt-0.5 font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// Letrero de llamado en sala: la tablet se levanta con el nombre del pasajero en grande
// (patrón "conductor con cartel" del aeropuerto, versión digital). Pantalla
// completa, horizontal si el dispositivo lo permite, y se cierra con un toque.
function LetreroPasajero({
  nombre,
  vuelo,
  punto,
  codigo,
  onClose,
}: LetreroData & { onClose: () => void }) {
  useEffect(() => {
    const root = document.documentElement;
    void root
      .requestFullscreen?.()
      .then(() => {
        const orientation = screen.orientation as unknown as {
          lock?: (value: string) => Promise<void>;
        };
        return orientation.lock?.('landscape')?.catch(() => undefined);
      })
      .catch(() => undefined);
    return () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => undefined);
      }
    };
  }, []);

  // Si el sistema saca el fullscreen (gesto/Escape), el letrero se cierra solo.
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [onClose]);

  return (
    <button
      className="fixed inset-0 z-50 overflow-hidden bg-[#020806] p-4 text-center text-white sm:p-8"
      type="button"
      onClick={onClose}
    >
      <style>{`
        @keyframes tg-sign-sweep {
          0% { transform: translateX(-120%); opacity: 0.35; }
          45% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0.35; }
        }
        @keyframes tg-border-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.28), 0 0 34px rgba(16, 185, 129, 0.28); }
          50% { box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.72), 0 0 72px rgba(52, 211, 153, 0.52); }
        }
      `}</style>
      <span
        aria-hidden="true"
        className="absolute inset-x-[-30%] top-0 h-3 bg-gradient-to-r from-transparent via-emerald-300 to-transparent"
        style={{ animation: 'tg-sign-sweep 2.4s ease-in-out infinite' }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-[-30%] bottom-0 h-3 bg-gradient-to-r from-transparent via-emerald-300 to-transparent"
        style={{ animation: 'tg-sign-sweep 2.4s ease-in-out infinite reverse' }}
      />
      <div
        className="relative flex h-full w-full flex-col items-center justify-center rounded-lg border-4 border-emerald-400 bg-[linear-gradient(135deg,#020806_0%,#063225_52%,#020806_100%)] px-5 py-8"
        style={{ animation: 'tg-border-glow 1.8s ease-in-out infinite' }}
      >
        <p className="text-3xl font-black uppercase text-emerald-300 sm:text-5xl">Taxi Green</p>
        <p className="mt-5 rounded-lg bg-white px-5 py-2 text-xl font-black uppercase text-[#05251c] sm:text-3xl">
          Buscamos a
        </p>
        <p className="mt-6 max-w-full break-words text-6xl font-black uppercase leading-none text-white sm:text-8xl md:text-9xl lg:text-[10rem]">
          {nombre}
        </p>
        <div className="mt-8 grid w-full max-w-5xl gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-300/60 bg-black/35 px-4 py-4">
            <p className="text-sm font-bold uppercase text-emerald-200">Punto</p>
            <p className="mt-1 text-2xl font-black text-white sm:text-3xl">{punto ?? 'Mostrador Taxi Green'}</p>
          </div>
          <div className="rounded-lg border border-emerald-300/60 bg-black/35 px-4 py-4">
            <p className="text-sm font-bold uppercase text-emerald-200">Vuelo</p>
            <p className="mt-1 text-2xl font-black text-white sm:text-3xl">{vuelo ?? 'Por confirmar'}</p>
          </div>
          <div className="rounded-lg border border-emerald-300/60 bg-black/35 px-4 py-4">
            <p className="text-sm font-bold uppercase text-emerald-200">Reserva</p>
            <p className="mt-1 text-2xl font-black text-white sm:text-3xl">{codigo}</p>
          </div>
        </div>
        <p className="mt-8 text-lg font-bold text-white/60">Toca la pantalla para volver</p>
      </div>
    </button>
  );
}

export function VoucherValidator() {
  const [input, setInput] = useState('TG-2026-0001');
  const [token, setToken] = useState<string | null>(null);
  const [payload, setPayload] = useState<VerifyPayload | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  // Letrero externo: datos del pase obtenidos SIN avanzar el estado de validación.
  // Se activa desde "Pasajeros en sala" para llamar al pasajero antes de escanear.
  const [letreroExterno, setLetreroExterno] = useState<LetreroData | null>(null);
  // Lista de pasajeros pendientes de validación
  const [listaVisible, setListaVisible] = useState(false);
  const [pasajerosPendientes, setPasajerosPendientes] = useState<LetreroData[]>([]);
  const [listaLoading, setListaLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const reset = () => {
    setPayload(null);
    setToken(null);
    setStatus('idle');
    setMessage(null);
    setCameraMessage(null);
    setLetreroExterno(null);
  };

  const validate = async (value = input) => {
    setStatus('validating');
    setMessage(null);
    setPayload(null);
    try {
      const resolvedToken = await resolveToken(value);
      const voucherId = voucherIdFromTokenOrCode(resolvedToken);
      const response = await fetch(`/api/voucher/${encodeURIComponent(voucherId)}/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: resolvedToken }),
      });
      const next = (await response.json().catch(() => null)) as VerifyPayload | null;
      if (!next) throw new Error('respuesta_invalida');
      setPayload(next);
      setToken(resolvedToken);
      if (!response.ok || !next.ok) {
        setStatus('error');
        setMessage(errorLabel(next.error));
        return;
      }
      setStatus('ready');
      setMessage('Pase válido. Revisa al pasajero y confirma su acceso.');
    } catch {
      setStatus('error');
      setMessage('No encontramos ese código. Revísalo e inténtalo de nuevo.');
    }
  };

  // Carga la lista de pasajeros con pase pendiente de validación.
  const loadLista = async () => {
    setListaLoading(true);
    try {
      const response = await fetch('/api/counter/pasajeros', { cache: 'no-store' });
      if (response.ok) {
        const data = (await response.json()) as {
          pasajeros: Array<{
            id: string;
            voucher_codigo: string;
            pasajero_nombre: string | null;
            vuelo_codigo: string | null;
            punto_encuentro: string | null;
            origen_texto: string;
          }>;
        };
        setPasajerosPendientes(
          data.pasajeros.map((p) => ({
            nombre: p.pasajero_nombre ?? 'Pasajero',
            vuelo: p.vuelo_codigo,
            punto: p.punto_encuentro ?? p.origen_texto ?? null,
            codigo: p.voucher_codigo,
          })),
        );
      }
    } catch {
      // silently fail
    } finally {
      setListaLoading(false);
    }
  };

  const consume = async () => {
    if (!token) return;
    const voucherId = voucherIdFromTokenOrCode(token);
    setStatus('consuming');
    setMessage(null);
    const response = await fetch(`/api/voucher/${encodeURIComponent(voucherId)}/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, consume: true }),
    });
    const next = (await response.json().catch(() => null)) as VerifyPayload | null;
    if (!next) {
      setStatus('error');
      setMessage('No se pudo confirmar el acceso.');
      return;
    }
    setPayload(next);
    if (!response.ok || !next.ok) {
      setStatus('error');
      setMessage(errorLabel(next.error));
      return;
    }
    setStatus('consumed');
    setMessage(
      next.reserva?.conductor
        ? 'Acceso confirmado. Luz verde enviada al conductor.'
        : 'Acceso confirmado. El conductor recibirá la luz verde al ser asignado.',
    );
  };

  useEffect(() => {
    if (!cameraEnabled) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    let frameId = 0;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraMessage('Tu navegador no permite abrir la cámara. Escribe el código del pase.');
        setCameraEnabled(false);
        return;
      }

      setCameraMessage('Abriendo cámara…');
      try {
        stream = await navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          })
          .catch(() => navigator.mediaDevices.getUserMedia({ video: true }));
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;

        const scan = async () => {
          if (cancelled || !videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            let raw: string | undefined;
            if (detector) {
              const codes = await detector.detect(canvas).catch(() => []);
              raw = codes[0]?.rawValue;
            }
            if (!raw && ctx) {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              raw = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
              })?.data;
            }
            if (raw) {
              setInput(raw);
              setCameraEnabled(false);
              void validate(raw);
              return;
            }
          }
          frameId = window.requestAnimationFrame(scan);
        };
        frameId = window.requestAnimationFrame(scan);
        setCameraMessage('Cámara activa. Acerca el pase al recuadro.');
      } catch {
        setCameraMessage('No se pudo abrir la cámara. Escribe el código del pase.');
        setCameraEnabled(false);
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      if (frameId) window.cancelAnimationFrame(frameId);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [cameraEnabled]); // validate es estable dentro del scope del efecto

  const reserva = payload?.reserva;
  const showConfirm = Boolean(reserva) && (status === 'ready' || status === 'consuming');

  // Letrero activo: solo desde la lista "Pasajeros en sala" (pre-validación).
  const letreroActivo: (LetreroData & { onClose: () => void }) | null = letreroExterno
    ? { ...letreroExterno, onClose: () => setLetreroExterno(null) }
    : null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <Stepper current={stepFromStatus(status)} />

      <div className="mt-6">
        {status === 'consumed' && reserva ? (
          /* ── Paso 3 — acceso confirmado ──────────────────────────────────── */
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-9 w-9 text-success" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-foreground">Acceso confirmado</h2>
            <p className="mt-1 text-base font-medium text-foreground">{reserva.pasajero_nombre ?? 'Pasajero'}</p>
            <p className="mt-1 text-sm text-foreground-muted">
              {payload?.consumedAt
                ? `Validado ${new Date(payload.consumedAt).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
                : 'Validado ahora'}{' '}
              · Este código ya no puede reutilizarse.
            </p>
            <p className="mt-3 rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
              {reserva.conductor
                ? `Luz verde enviada a ${reserva.conductor.nombre}${reserva.conductor.placa ? ` · ${reserva.conductor.placa}` : ''}.`
                : 'El conductor recibirá la luz verde cuando despacho lo asigne.'}
            </p>
            {reserva.pago ? (
              <p className="mt-3 rounded-xl bg-product-muted px-4 py-3 text-sm font-semibold text-product-deep">
                {reserva.pago.montoEtiqueta} · {reserva.pago.estadoLabel}
                {reserva.comercial ? (
                  <span className="mt-1 block text-xs font-medium text-product">{reserva.comercial.pagoMostrador}</span>
                ) : null}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-product px-4 text-sm font-semibold text-white"
                type="button"
                onClick={reset}
              >
                <RotateCcw className="h-4 w-4" />
                Siguiente pasajero
              </button>
            </div>
          </div>
        ) : showConfirm && reserva ? (
          /* ── Paso 2 — revisar pasajero y confirmar acceso ────────────────── */
          /* El pasajero ya está frente al mostrador con su QR — sin letrero aquí */
          <div className="grid gap-4">
            <div className="rounded-2xl bg-product-deep p-5 text-white">
              <p className="text-xs uppercase tracking-wide text-white/70">Pase</p>
              <p className="mt-1 text-3xl font-semibold">{reserva.voucher_codigo}</p>
              <p className="mt-2 text-2xl font-semibold">{reserva.pasajero_nombre ?? 'Pasajero'}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <DataRow
                icon={<MapPin className="h-4 w-4" />}
                label="Punto de encuentro"
                value={reserva.punto_encuentro ?? reserva.origen_texto ?? 'Punto por confirmar'}
              />
              <DataRow icon={<Plane className="h-4 w-4" />} label="Vuelo" value={reserva.vuelo_codigo ?? 'Por confirmar'} />
              <DataRow icon={<MapPin className="h-4 w-4" />} label="Recojo" value={reserva.origen_texto} />
              <DataRow icon={<ArrowRight className="h-4 w-4" />} label="Destino" value={reserva.destino_texto} />
              <DataRow
                icon={<UserRound className="h-4 w-4" />}
                label="Conductor"
                value={
                  reserva.conductor
                    ? `${reserva.conductor.nombre}${reserva.conductor.placa ? ` · ${reserva.conductor.placa}` : ''}`
                    : 'Falta asignar conductor'
                }
              />
              {reserva.pago ? (
                <DataRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Pago"
                  value={`${reserva.pago.montoEtiqueta} · ${reserva.pago.estadoLabel}`}
                />
              ) : null}
              {reserva.comercial ? (
                <DataRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Responsable"
                  value={reserva.comercial.pagoMostrador}
                />
              ) : null}
            </div>

            <button
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-product px-4 text-base font-semibold text-white disabled:opacity-60"
              type="button"
              disabled={status === 'consuming'}
              onClick={consume}
            >
              {status === 'consuming' ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              {reserva.conductor ? 'Confirmar acceso y dar luz verde' : 'Confirmar acceso'}
            </button>
            <div className="flex gap-2">
              <button
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-product"
                type="button"
                onClick={reset}
              >
                Otro código
              </button>
              {reserva.conductor ? (
                <Link
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-product"
                  href={`/admin/reservas/${reserva.id}`}
                >
                  Cambiar unidad
                </Link>
              ) : (
                <Link
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-product"
                  href={`/admin/reservas/${reserva.id}`}
                >
                  Abrir despacho
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* ── Paso 1 — lista de vuelo + escanear o escribir el código ─────── */
          <div className="grid gap-5">

            {/* Lista de pasajeros pendientes en sala */}
            <div className="overflow-hidden rounded-xl border border-border bg-surface-muted">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-surface"
                type="button"
                onClick={() => {
                  if (!listaVisible) void loadLista();
                  setListaVisible(!listaVisible);
                }}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-product" />
                  <span className="text-sm font-semibold text-foreground">Pasajeros en sala</span>
                  {pasajerosPendientes.length > 0 && !listaVisible ? (
                    <span className="rounded-full bg-product px-2 py-0.5 text-xs font-bold text-white">
                      {pasajerosPendientes.length}
                    </span>
                  ) : null}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-foreground-muted transition-transform duration-200 ${listaVisible ? 'rotate-180' : ''}`}
                />
              </button>

              {listaVisible && (
                <div className="border-t border-border">
                  {listaLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-product" />
                    </div>
                  ) : pasajerosPendientes.length === 0 ? (
                    <p className="px-4 py-4 text-center text-sm text-foreground-muted">
                      No hay pasajeros esperando en este momento.
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {pasajerosPendientes.map((p) => (
                        <div key={p.codigo} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{p.nombre}</p>
                            <p className="text-xs text-foreground-muted">
                              {[p.vuelo, p.punto].filter(Boolean).join(' · ')}
                            </p>
                            <p className="text-xs text-foreground-muted">{p.codigo}</p>
                          </div>
                          <button
                            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-product px-3 text-xs font-bold text-white transition hover:bg-product/90"
                            type="button"
                            onClick={() => {
                              setLetreroExterno(p);
                              setInput(p.codigo);
                            }}
                          >
                            <Megaphone className="h-3.5 w-3.5" />
                            Letrero
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold uppercase text-foreground-muted">
              <span className="h-px flex-1 bg-border" />validar pase<span className="h-px flex-1 bg-border" />
            </div>

            {cameraEnabled ? (
              <div className="overflow-hidden rounded-xl border border-border bg-neutral-950">
                <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex items-center justify-between gap-3 bg-neutral-950 px-4 py-3 text-sm text-white">
                  <span>{cameraMessage ?? 'Busca el pase dentro del recuadro.'}</span>
                  <button
                    className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/15"
                    type="button"
                    onClick={() => setCameraEnabled(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-product/40 bg-product-muted/40 text-product transition hover:bg-product-muted/70"
                type="button"
                onClick={() => setCameraEnabled(true)}
              >
                <Camera className="h-8 w-8" />
                <span className="text-base font-semibold">Escanear pase</span>
              </button>
            )}

            <div className="flex items-center gap-3 text-xs font-semibold uppercase text-foreground-muted">
              <span className="h-px flex-1 bg-border" />o escribe el código<span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-2">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  className="h-12 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground placeholder:text-foreground-muted"
                  value={input}
                  placeholder="Código de reserva (TG-2026-0001)"
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void validate();
                  }}
                />
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-product px-5 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={status === 'validating' || input.trim().length < 4}
                  type="button"
                  onClick={() => void validate()}
                >
                  {status === 'validating' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Validar
                </button>
              </div>

            </div>

            {cameraMessage ? <p className="text-sm text-foreground-muted">{cameraMessage}</p> : null}

            {message ? (
              <div
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  status === 'error'
                    ? 'border-danger/30 bg-danger/5 text-danger'
                    : 'border-product/20 bg-product-muted text-product-deep'
                }`}
              >
                {status === 'error' ? (
                  <XCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-product" />
                )}
                <p className="font-medium">{message}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-surface-muted px-4 py-3 text-sm text-foreground-muted">
                <QrCode className="h-5 w-5 shrink-0 text-product" />
                <p>Cada pase vale una sola vez. También puedes escribir el código de la reserva.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Letrero de llamado: externo (paso 1, sin consumir) tiene prioridad sobre el
          de pase validado (pasos 2-3). Nunca cambia el estado de validación. */}
      {letreroActivo ? <LetreroPasajero {...letreroActivo} /> : null}
    </div>
  );
}

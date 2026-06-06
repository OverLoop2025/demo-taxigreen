'use client';

import { ArrowRight, Camera, CheckCircle2, Loader2, MapPin, Plane, QrCode, RotateCcw, Search, UserRound, XCircle } from 'lucide-react';
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
  return 'No se pudo validar el pase.';
}

type Status = 'idle' | 'validating' | 'ready' | 'consuming' | 'consumed' | 'error';

/** Paso actual de la barra de progreso a partir del estado. */
function stepFromStatus(status: Status): 0 | 1 | 2 {
  if (status === 'consumed') return 2;
  if (status === 'ready' || status === 'consuming') return 1;
  return 0;
}

function Stepper({ current }: { current: 0 | 1 | 2 }) {
  // Etiquetas cortas para que las 3 quepan sin cortarse en móvil (la acción completa
  // "Confirmar acceso" vive en el botón). min-w-0 + truncate evitan overflow.
  const steps = ['Validar', 'Confirmar', 'Listo'];
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((label, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <div key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? 'bg-success text-white'
                  : active
                    ? 'bg-product text-white'
                    : 'bg-surface-muted text-foreground-muted'
              }`}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </span>
            <span
              className={`truncate text-xs font-semibold sm:text-sm ${active || done ? 'text-foreground' : 'text-foreground-muted'}`}
            >
              {label}
            </span>
            {index < steps.length - 1 ? <span className="ml-auto hidden h-px flex-1 bg-border sm:block" /> : null}
          </div>
        );
      })}
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

export function VoucherValidator() {
  const [input, setInput] = useState('TG-2026-0001');
  const [token, setToken] = useState<string | null>(null);
  const [payload, setPayload] = useState<VerifyPayload | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const reset = () => {
    setPayload(null);
    setToken(null);
    setStatus('idle');
    setMessage(null);
    setCameraMessage(null);
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
    setMessage('Acceso confirmado. Este código ya no puede reutilizarse.');
  };

  useEffect(() => {
    if (!cameraEnabled) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    let frameId = 0;

    async function startCamera() {
      if (!window.BarcodeDetector) {
        setCameraMessage('Tu navegador no permite escanear. Escribe el código del pase.');
        setCameraEnabled(false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

        const scan = async () => {
          if (cancelled || !videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const codes = await detector.detect(canvas).catch(() => []);
            const raw = codes[0]?.rawValue;
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
        setCameraMessage('Cámara activa. Acerca el QR al recuadro.');
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
  }, [cameraEnabled]);

  const reserva = payload?.reserva;
  const showConfirm = Boolean(reserva) && (status === 'ready' || status === 'consuming');

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <Stepper current={stepFromStatus(status)} />

      <div className="mt-6">
        {status === 'consumed' && reserva ? (
          /* Paso 3 — acceso confirmado */
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
            <button
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-product px-4 text-sm font-semibold text-white sm:w-auto"
              type="button"
              onClick={reset}
            >
              <RotateCcw className="h-4 w-4" />
              Siguiente pasajero
            </button>
          </div>
        ) : showConfirm && reserva ? (
          /* Paso 2 — revisar pasajero y confirmar acceso */
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
                value={reserva.punto_encuentro ?? 'Salida 3, columna F2'}
              />
              <DataRow icon={<Plane className="h-4 w-4" />} label="Vuelo" value={reserva.vuelo_codigo ?? 'Por confirmar'} />
              <DataRow icon={<MapPin className="h-4 w-4" />} label="Recojo" value={reserva.origen_texto} />
              <DataRow icon={<ArrowRight className="h-4 w-4" />} label="Destino" value={reserva.destino_texto} />
            </div>

            <button
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-product px-4 text-base font-semibold text-white disabled:opacity-60"
              type="button"
              disabled={status === 'consuming'}
              onClick={consume}
            >
              {status === 'consuming' ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              Confirmar acceso
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-product"
              type="button"
              onClick={reset}
            >
              Otro código
            </button>
          </div>
        ) : (
          /* Paso 1 — escanear o escribir el código */
          <div className="grid gap-5">
            <div className="flex items-center gap-2 text-foreground">
              <UserRound className="h-5 w-5 text-product" />
              <p className="text-base font-semibold">¿Quién aborda?</p>
            </div>

            {cameraEnabled ? (
              <div className="overflow-hidden rounded-xl border border-border bg-neutral-950">
                <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              <button
                className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-product/40 bg-product-muted/40 text-product transition hover:bg-product-muted/70"
                type="button"
                onClick={() => setCameraEnabled(true)}
              >
                <Camera className="h-8 w-8" />
                <span className="text-base font-semibold">Escanear QR</span>
              </button>
            )}

            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <span className="h-px flex-1 bg-border" />o escribe el código<span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                className="h-12 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground placeholder:text-foreground-muted"
                value={input}
                placeholder="Código del pase (TG-2026-0001)"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void validate();
                }}
              />
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-product px-5 text-sm font-semibold text-white disabled:opacity-50"
                disabled={status === 'validating' || input.trim().length < 4}
                type="button"
                onClick={() => validate()}
              >
                {status === 'validating' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Validar
              </button>
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
                <p>Cada código vale una sola vez. Para la demo puedes escribir TG-2026-0001.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

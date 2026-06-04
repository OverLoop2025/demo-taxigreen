'use client';

import { Camera, CheckCircle2, Loader2, QrCode, RotateCcw, Search, ShieldCheck, XCircle } from 'lucide-react';
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
  if (error === 'voucher_ya_validado') return 'Este QR ya fue validado anteriormente.';
  if (error === 'token_invalido') return 'El QR no corresponde al voucher vigente.';
  if (error === 'counter_no_autorizado') return 'La sesión de counter no está autorizada.';
  return 'No se pudo validar el voucher.';
}

export function VoucherValidator() {
  const [input, setInput] = useState('TG-2026-0001');
  const [token, setToken] = useState<string | null>(null);
  const [payload, setPayload] = useState<VerifyPayload | null>(null);
  const [status, setStatus] = useState<'idle' | 'validating' | 'ready' | 'consuming' | 'consumed' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      setMessage('Voucher válido. Confirma para consumir el QR.');
    } catch {
      setStatus('error');
      setMessage('No se pudo resolver el voucher. Pega el token QR o escribe el código.');
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
      setMessage('No se pudo confirmar el voucher.');
      return;
    }
    setPayload(next);
    if (!response.ok || !next.ok) {
      setStatus('error');
      setMessage(errorLabel(next.error));
      return;
    }
    setStatus('consumed');
    setMessage('QR consumido. El voucher no puede reutilizarse.');
  };

  useEffect(() => {
    if (!cameraEnabled) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    let frameId = 0;

    async function startCamera() {
      if (!window.BarcodeDetector) {
        setCameraMessage('Cámara disponible solo si el navegador soporta BarcodeDetector. Usa validación manual.');
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
        setCameraMessage('Cámara activa. Acerca el QR al encuadre.');
      } catch {
        setCameraMessage('No se pudo abrir la cámara. Usa el input manual.');
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

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-md border border-border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">Validar voucher</p>
            <h2 className="mt-1 text-2xl font-semibold text-product-deep">QR de un solo uso</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md bg-product-muted px-3 py-2 text-sm font-semibold text-product">
            <ShieldCheck className="h-4 w-4" />
            HMAC + auditoría
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            className="h-12 rounded-md border border-border px-3 text-sm font-medium text-product-deep"
            value={input}
            placeholder="Pega token QR o código TG-2026-0001"
            onChange={(event) => setInput(event.target.value)}
          />
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-product px-4 text-sm font-semibold text-product"
            type="button"
            onClick={() => setCameraEnabled((value) => !value)}
          >
            <Camera className="h-4 w-4" />
            Cámara
          </button>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-product px-4 text-sm font-semibold text-white disabled:opacity-50"
            disabled={status === 'validating' || input.trim().length < 4}
            type="button"
            onClick={() => validate()}
          >
            {status === 'validating' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Validar
          </button>
        </div>

        {cameraEnabled ? (
          <div className="mt-5 overflow-hidden rounded-md border border-border bg-neutral-950">
            <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : null}

        {cameraMessage ? <p className="mt-3 text-sm text-neutral-600">{cameraMessage}</p> : null}
        {message ? (
          <div
            className={`mt-4 flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${
              status === 'error'
                ? 'border-danger/30 bg-danger/5 text-danger'
                : 'border-product/20 bg-product-muted text-product-deep'
            }`}
          >
            {status === 'error' ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 text-product" />}
            <p className="font-medium">{message}</p>
          </div>
        ) : null}

        <div className="mt-5 rounded-md bg-neutral-50 p-4">
          <div className="flex items-center gap-2 text-product-deep">
            <QrCode className="h-5 w-5" />
            <p className="text-sm font-semibold">Fallback manual operativo</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Si el navegador no habilita cámara, escribe `TG-2026-0001`. El sistema genera el token vigente,
            verifica firma y bloquea reutilización al confirmar.
          </p>
        </div>
      </section>

      <aside className="rounded-md border border-border bg-white p-5">
        <p className="text-xs font-semibold uppercase text-neutral-500">Resultado</p>
        {payload?.reserva ? (
          <div className="mt-4 grid gap-4">
            <div className="rounded-md bg-product-deep p-4 text-white">
              <p className="text-xs text-white/70">Voucher</p>
              <h3 className="mt-1 text-3xl font-semibold">{payload.reserva.voucher_codigo}</h3>
              <p className="mt-2 text-sm text-white/70">{payload.reserva.estado?.replaceAll('_', ' ') ?? 'asignada'}</p>
            </div>
            <div className="grid gap-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-500">Pasajero</p>
                <p className="mt-1 font-semibold text-product-deep">{payload.reserva.pasajero_nombre ?? 'Pasajero demo'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-500">Recojo</p>
                <p className="mt-1 font-semibold text-product-deep">{payload.reserva.origen_texto}</p>
                <p className="mt-1 text-neutral-600">{payload.reserva.punto_encuentro ?? 'Salida 3, columna F2'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-500">Destino</p>
                <p className="mt-1 font-semibold text-product-deep">{payload.reserva.destino_texto}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-500">Vuelo</p>
                <p className="mt-1 font-semibold text-product-deep">{payload.reserva.vuelo_codigo ?? 'Por confirmar'}</p>
              </div>
            </div>
            {status === 'ready' ? (
              <button
                className="inline-flex h-14 items-center justify-center gap-2 rounded-md bg-product px-4 text-base font-semibold text-white"
                type="button"
                onClick={consume}
              >
                <CheckCircle2 className="h-5 w-5" />
                Confirmar validación
              </button>
            ) : null}
            {status === 'consumed' ? (
              <div className="rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm font-semibold text-success">
                Validado el {payload.consumedAt ? new Date(payload.consumedAt).toLocaleString('es-PE') : 'momento actual'}.
              </div>
            ) : null}
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-product"
              type="button"
              onClick={() => {
                setPayload(null);
                setToken(null);
                setStatus('idle');
                setMessage(null);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Nueva validación
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-md bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
            Escanea o valida manualmente para ver datos de reserva, punto de encuentro y destino.
          </div>
        )}
      </aside>
    </div>
  );
}

import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_VERSION = 'v1';
const DEFAULT_EXPIRES_IN_MS = 8 * 60 * 60 * 1000;
const DEFAULT_HMAC_SECRET = 'taxigreen-demo-hmac-secret-change-before-production';

export type VoucherPayload = {
  reserva_id: string;
  codigo_publico: string;
  issued_at: string;
  expires_at: string;
  v: typeof TOKEN_VERSION;
};

export type CreateVoucherTokenInput = {
  reservaId: string;
  codigoPublico: string;
  issuedAt?: Date;
  expiresInMs?: number;
  secret?: string;
};

export type VerifyVoucherTokenResult =
  | {
      ok: true;
      payload: VoucherPayload;
    }
  | {
      ok: false;
      reason: 'malformed' | 'tampered' | 'expired' | 'version';
    };

function hmacSecret(explicitSecret?: string) {
  return explicitSecret ?? process.env.HMAC_SECRET ?? DEFAULT_HMAC_SECRET;
}

function base64urlJson(payload: VoucherPayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function signBody(body: string, secret?: string) {
  return createHmac('sha256', hmacSecret(secret)).update(body).digest('base64url');
}

export function createVoucherToken({
  reservaId,
  codigoPublico,
  issuedAt = new Date(),
  expiresInMs = DEFAULT_EXPIRES_IN_MS,
  secret,
}: CreateVoucherTokenInput) {
  const payload: VoucherPayload = {
    reserva_id: reservaId,
    codigo_publico: codigoPublico,
    issued_at: issuedAt.toISOString(),
    expires_at: new Date(issuedAt.getTime() + expiresInMs).toISOString(),
    v: TOKEN_VERSION,
  };
  const body = base64urlJson(payload);
  return `${body}.${signBody(body, secret)}`;
}

export function verifyVoucherToken(
  token: string,
  options: { now?: Date; secret?: string } = {},
): VerifyVoucherTokenResult {
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra) {
    return { ok: false, reason: 'malformed' };
  }

  const expected = signBody(body, options.secret);
  const givenBuffer = Buffer.from(signature, 'base64url');
  const expectedBuffer = Buffer.from(expected, 'base64url');
  if (givenBuffer.length !== expectedBuffer.length || !timingSafeEqual(givenBuffer, expectedBuffer)) {
    return { ok: false, reason: 'tampered' };
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as VoucherPayload;
    if (payload.v !== TOKEN_VERSION) {
      return { ok: false, reason: 'version' };
    }
    const now = options.now ?? new Date();
    if (Number.isNaN(Date.parse(payload.expires_at)) || new Date(payload.expires_at) <= now) {
      return { ok: false, reason: 'expired' };
    }
    return { ok: true, payload };
  } catch {
    return { ok: false, reason: 'malformed' };
  }
}

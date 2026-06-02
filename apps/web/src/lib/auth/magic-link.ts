import { createHmac, timingSafeEqual } from 'node:crypto';
import { nanoid } from 'nanoid';
import { AUTH_SECRET } from './secret';

const TOKEN_VERSION = 'v1';
const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type MagicPayload = {
  sub: string;
  iat: number;
  nonce: string;
  v: typeof TOKEN_VERSION;
};

function base64url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function sign(value: string) {
  return createHmac('sha256', AUTH_SECRET).update(value).digest('base64url');
}

export function generateMagicToken(subject = nanoid(21)) {
  const payload: MagicPayload = {
    sub: subject,
    iat: Date.now(),
    nonce: nanoid(16),
    v: TOKEN_VERSION,
  };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function validateMagicToken(token: string, maxAgeMs = DEFAULT_MAX_AGE_MS) {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = sign(body);
  const given = Buffer.from(signature, 'base64url');
  const expectedBuffer = Buffer.from(expected, 'base64url');
  if (given.length !== expectedBuffer.length || !timingSafeEqual(given, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as MagicPayload;
    if (payload.v !== TOKEN_VERSION) return null;
    if (Date.now() - payload.iat > maxAgeMs) return null;
    return payload;
  } catch {
    return null;
  }
}

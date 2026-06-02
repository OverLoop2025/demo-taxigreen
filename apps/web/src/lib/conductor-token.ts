import { jwtVerify, SignJWT } from 'jose';
import { AUTH_SECRET } from '@/lib/auth/secret';

const issuer = 'taxigreen-demo';
const audience = 'taxigreen-driver';
const tokenTtlSeconds = 12 * 60 * 60;

const secretKey = new TextEncoder().encode(AUTH_SECRET);

export type ConductorTokenPayload = {
  userId: string;
  tenantId: string;
  conductorId: string;
  email: string;
  nombre: string;
  role: 'conductor';
};

export const CONDUCTOR_TOKEN_EXPIRES_IN_SECONDS = tokenTtlSeconds;

export async function createConductorToken(payload: ConductorTokenPayload) {
  return new SignJWT({
    role: payload.role,
    tenantId: payload.tenantId,
    conductorId: payload.conductorId,
    email: payload.email,
    nombre: payload.nombre,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${tokenTtlSeconds}s`)
    .sign(secretKey);
}

export async function verifyConductorToken(token: string): Promise<ConductorTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, { issuer, audience });
    if (
      typeof payload.sub !== 'string' ||
      payload.role !== 'conductor' ||
      typeof payload.tenantId !== 'string' ||
      typeof payload.conductorId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.nombre !== 'string'
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      conductorId: payload.conductorId,
      email: payload.email,
      nombre: payload.nombre,
      role: 'conductor',
    };
  } catch {
    return null;
  }
}

export function bearerTokenFromRequest(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

import { describe, expect, it } from 'vitest';
import { createVoucherToken, verifyVoucherToken } from './sign';

const secret = 'test-secret';
const issuedAt = new Date('2026-05-31T12:00:00.000Z');

describe('voucher HMAC', () => {
  it('firma y verifica el payload canonico', () => {
    const token = createVoucherToken({
      reservaId: 'reserva-1',
      codigoPublico: 'TG-2026-0001',
      issuedAt,
      secret,
    });

    const result = verifyVoucherToken(token, {
      now: new Date('2026-05-31T13:00:00.000Z'),
      secret,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.reserva_id).toBe('reserva-1');
      expect(result.payload.codigo_publico).toBe('TG-2026-0001');
    }
  });

  it('rechaza tampering del payload', () => {
    const token = createVoucherToken({
      reservaId: 'reserva-1',
      codigoPublico: 'TG-2026-0001',
      issuedAt,
      secret,
    });
    const [body, signature] = token.split('.');
    const payload = JSON.parse(Buffer.from(String(body), 'base64url').toString('utf8')) as {
      codigo_publico: string;
    };
    payload.codigo_publico = 'TG-ALTERADO';
    const alteredBody = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

    expect(verifyVoucherToken(`${alteredBody}.${signature}`, { secret })).toEqual({
      ok: false,
      reason: 'tampered',
    });
  });

  it('rechaza tokens expirados', () => {
    const token = createVoucherToken({
      reservaId: 'reserva-1',
      codigoPublico: 'TG-2026-0001',
      issuedAt,
      expiresInMs: 60_000,
      secret,
    });

    expect(verifyVoucherToken(token, { now: new Date('2026-05-31T12:02:00.000Z'), secret })).toEqual({
      ok: false,
      reason: 'expired',
    });
  });
});

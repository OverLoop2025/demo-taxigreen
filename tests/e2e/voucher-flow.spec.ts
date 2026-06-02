import { expect, test } from '@playwright/test';

test('voucher QR firmado: PNG, verificación OK y tampering rechazado', async ({ request }) => {
  const qr = await request.get('/api/voucher/TG-2026-0001/qr');
  expect(qr.status()).toBe(200);
  expect(qr.headers()['content-type']).toContain('image/png');

  const token = qr.headers()['x-voucher-token'];
  expect(token).toBeTruthy();

  const valid = await request.post('/api/voucher/TG-2026-0001/verify', {
    data: { token },
  });
  expect(valid.status()).toBe(200);
  await expect(valid).toBeOK();

  const [body, signature] = token?.split('.') ?? [];
  expect(body).toBeTruthy();
  expect(signature).toBeTruthy();
  const tamperedBody = `${body?.slice(0, -1)}${body?.endsWith('a') ? 'b' : 'a'}`;
  const tampered = `${tamperedBody}.${signature}`;
  const invalid = await request.post('/api/voucher/TG-2026-0001/verify', {
    data: { token: tampered },
  });
  expect(invalid.status()).toBe(400);
});

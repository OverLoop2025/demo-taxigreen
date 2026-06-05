import { expect, test } from '@playwright/test';

/**
 * QR de un solo uso (counter). Prueba el contrato de seguridad del abordaje:
 *  - consumir exige sesión de supervisor (401 sin ella),
 *  - el primer consumo gana (200, consumed=true),
 *  - el segundo se bloquea de forma idempotente (409 voucher_ya_validado).
 *
 * Es DESTRUCTIVO: consume el voucher del guion y deja `voucher_qr_consumido` en
 * auditoría. Debe correr sobre una DB recién sembrada:
 *   pnpm --filter @taxigreen/database db:seed-guion
 * (mismo requisito que el resto de la suite E2E, que pasa 7/7 tras reseed).
 */
test('voucher QR one-time: 401 sin supervisor, 200 al consumir, 409 al reusar', async ({ page, request }) => {
  // Token firmado almacenado (el endpoint /qr devuelve el payload persistido).
  const qr = await request.get('/api/voucher/TG-2026-0001/qr');
  expect(qr.status()).toBe(200);
  const token = qr.headers()['x-voucher-token'];
  expect(token).toBeTruthy();

  // 1) Consumir sin sesión de supervisor → 401 (no debe consumir nada todavía).
  const sinSesion = await request.post('/api/voucher/TG-2026-0001/verify', {
    data: { token, consume: true },
  });
  expect(sinSesion.status()).toBe(401);
  expect((await sinSesion.json()).error).toBe('counter_no_autorizado');

  // 2) Login del supervisor de counter.
  await page.goto('/login-counter?callbackUrl=/counter');
  await page.getByLabel('Email').fill('counter@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();
  await page.waitForURL('**/counter');

  // 3) Verificación sin consumir → 200 consumed=false (no quema el voucher).
  const previo = await page.request.post('/api/voucher/TG-2026-0001/verify', {
    data: { token, consume: false },
  });
  expect(previo.status()).toBe(200);
  expect((await previo.json()).consumed).toBe(false);

  // 4) Primer consumo (supervisor) → 200 consumed=true con marca de tiempo.
  const consumo = await page.request.post('/api/voucher/TG-2026-0001/verify', {
    data: { token, consume: true },
  });
  expect(consumo.status()).toBe(200);
  const consumoBody = await consumo.json();
  expect(consumoBody.consumed).toBe(true);
  expect(consumoBody.consumedAt).toBeTruthy();

  // 5) Reuso → 409 voucher_ya_validado (advisory lock + auditoría idempotente).
  const reuso = await page.request.post('/api/voucher/TG-2026-0001/verify', {
    data: { token, consume: true },
  });
  expect(reuso.status()).toBe(409);
  const reusoBody = await reuso.json();
  expect(reusoBody.error).toBe('voucher_ya_validado');
  expect(reusoBody.consumedAt).toBeTruthy();
});

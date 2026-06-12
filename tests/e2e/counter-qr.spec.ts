import { expect, test } from '@playwright/test';

async function crearReservaWa(page: import('@playwright/test').Page) {
  await page.goto('/login-admin?callbackUrl=/wa-sim');
  await page.getByLabel('Email').fill('admin@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();

  await page.waitForURL('**/wa-sim');
  await page.getByRole('button', { name: /Extraer/i }).click();
  await expect(page.getByText(/Listo para confirmar/i).first()).toBeVisible();
  await page.getByRole('button', { name: /Confirmar y avisar al cliente/i }).click();
  await expect(page.getByText('Reserva confirmada').first()).toBeVisible();
  await expect(page.getByRole('img', { name: /Pase de abordaje de la reserva/i })).toBeVisible();

  const codigo = (await page.getByText(/^TG-WA-/).first().textContent())?.trim();
  expect(codigo).toBeTruthy();
  return codigo ?? '';
}

/**
 * Pase de un solo uso (mostrador). Prueba el contrato de seguridad del abordaje sin
 * consumir `TG-2026-0001`: cada corrida crea su propia reserva WhatsApp `TG-WA-*`.
 */
test('pase one-time: 401 sin supervisor, 200 al consumir, 409 al reusar', async ({ page }) => {
  const codigo = await crearReservaWa(page);

  // Token firmado almacenado (el endpoint /qr devuelve el payload persistido).
  const qr = await page.request.get(`/api/voucher/${codigo}/qr`);
  expect(qr.status()).toBe(200);
  const token = qr.headers()['x-voucher-token'];
  expect(token).toBeTruthy();

  // 1) Consumir sin sesión de supervisor → 401 (no debe consumir nada todavía).
  const sinSesion = await page.request.post(`/api/voucher/${codigo}/verify`, {
    data: { token, consume: true },
  });
  expect(sinSesion.status()).toBe(401);
  expect((await sinSesion.json()).error).toBe('counter_no_autorizado');

  // 2) Login del supervisor de mostrador.
  await page.goto('/login-counter?callbackUrl=/counter');
  await page.getByLabel('Email').fill('counter@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();
  await page.waitForURL('**/counter');

  // 3) Verificación sin consumir → 200 consumed=false (no quema el voucher).
  const previo = await page.request.post(`/api/voucher/${codigo}/verify`, {
    data: { token, consume: false },
  });
  expect(previo.status()).toBe(200);
  const previoBody = await previo.json();
  expect(previoBody.consumed).toBe(false);
  expect(previoBody.reserva.pago).toMatchObject({
    estado: 'autorizado',
    moneda: 'PEN',
  });

  // 4) Primer consumo (supervisor) → 200 consumed=true con marca de tiempo.
  const consumo = await page.request.post(`/api/voucher/${codigo}/verify`, {
    data: { token, consume: true },
  });
  expect(consumo.status()).toBe(200);
  const consumoBody = await consumo.json();
  expect(consumoBody.consumed).toBe(true);
  expect(consumoBody.consumedAt).toBeTruthy();
  expect(consumoBody.reserva.pago).toMatchObject({
    estado: 'autorizado',
    moneda: 'PEN',
  });

  // 5) Reuso → 409 voucher_ya_validado (advisory lock + auditoría idempotente).
  const reuso = await page.request.post(`/api/voucher/${codigo}/verify`, {
    data: { token, consume: true },
  });
  expect(reuso.status()).toBe(409);
  const reusoBody = await reuso.json();
  expect(reusoBody.error).toBe('voucher_ya_validado');
  expect(reusoBody.consumedAt).toBeTruthy();
});

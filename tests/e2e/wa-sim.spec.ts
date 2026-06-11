import { expect, test } from '@playwright/test';

test('WhatsApp: confirma con QR en el chat y el enlace en vivo llega tras validar en counter', async ({
  page,
  browser,
}) => {
  await page.goto('/login-admin?callbackUrl=/wa-sim');
  await page.getByLabel('Email').fill('admin@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();

  await page.waitForURL('**/wa-sim');
  await expect(page.getByRole('heading', { name: /WhatsApp/i }).first()).toBeVisible();

  await page.getByRole('button', { name: /Extraer/i }).click();
  await expect(page.getByText('Aeropuerto Jorge Chávez - Llegadas', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Av. Pardo 123, Miraflores', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('LA2456', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Listo para confirmar/i).first()).toBeVisible();

  // Confirmación del operador → el chat recibe la reserva + pase QR, SIN enlace aún
  // (el enlace en vivo es revelado progresivo: llega al validar el pase en counter).
  await page.getByRole('button', { name: /Confirmar y avisar al cliente/i }).click();
  await expect(page.getByText('Reserva confirmada').first()).toBeVisible();
  await expect(page.getByRole('img', { name: /Código QR de la reserva/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Seguir mi taxi en vivo/i })).toHaveCount(0);

  // Código de la reserva recién creada (visible en la tarjeta del chat).
  const codigo = (await page.getByText(/^TG-WA-/).first().textContent())?.trim();
  expect(codigo).toBeTruthy();

  // El counter (supervisor) valida el pase: emisión del QR → token firmado → consumo.
  const counter = await browser.newContext();
  const counterPage = await counter.newPage();
  await counterPage.goto('/login-counter?callbackUrl=/counter');
  await counterPage.getByLabel('Email').fill('counter@taxigreen.demo');
  await counterPage.getByLabel('Contraseña').fill('demo1234');
  await counterPage.getByRole('button', { name: /Ingresar/i }).click();
  await counterPage.waitForURL('**/counter');

  const qrResponse = await counter.request.get(`/api/voucher/${codigo}/qr`);
  expect(qrResponse.ok()).toBeTruthy();
  const token = qrResponse.headers()['x-voucher-token'];
  expect(token).toBeTruthy();

  const verifyResponse = await counter.request.post(`/api/voucher/${codigo}/verify`, {
    data: { token, consume: true },
  });
  expect(verifyResponse.ok()).toBeTruthy();
  await counter.close();

  // El chat detecta la validación (polling) y entrega el enlace en vivo /p/[token].
  await expect(page.getByText(/Pase validado/i).first()).toBeVisible({ timeout: 15_000 });
  const enlaceVivo = page.getByRole('link', { name: /Seguir mi taxi en vivo/i });
  await expect(enlaceVivo).toBeVisible();
  await expect(enlaceVivo).toHaveAttribute('href', /\/p\//);

  // La reserva existe de verdad: desde el chat se abre en despacho.
  await page.getByRole('button', { name: /Abrir en despacho/i }).click();
  await page.waitForURL('**/admin/reservas/**');
  await expect(page.getByRole('heading', { name: /Reserva TG-WA-/i })).toBeVisible();
  await expect(page.getByText('Reserva creada por WhatsApp').first()).toBeVisible();
});

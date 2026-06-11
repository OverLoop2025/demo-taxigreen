import { expect, test } from '@playwright/test';

const DRIVER_CREDENTIALS: Record<string, { email: string; pin: string }> = {
  'Raúl Quispe': { email: 'conductor1@taxigreen.demo', pin: '1234' },
  'Mario Huamán': { email: 'conductor2@taxigreen.demo', pin: '2345' },
  'Lucía Pérez': { email: 'conductor3@taxigreen.demo', pin: '3456' },
  'Javier Ríos': { email: 'conductor4@taxigreen.demo', pin: '4567' },
  'Ana Salazar': { email: 'conductor5@taxigreen.demo', pin: '5678' },
  'Pedro Morales': { email: 'conductor6@taxigreen.demo', pin: '6789' },
};

function driverCredentialsFromOption(label: string) {
  const entry = Object.entries(DRIVER_CREDENTIALS).find(([nombre]) => label.includes(nombre));
  if (!entry) throw new Error(`Conductor demo no reconocido en opción: ${label}`);
  return entry[1];
}

test('counter gate: conductor no inicia recojo hasta validar pase QR', async ({ page, browser }) => {
  await page.goto('/login-admin?callbackUrl=/wa-sim');
  await page.getByLabel('Email').fill('admin@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();

  await page.waitForURL('**/wa-sim');
  await page.getByRole('button', { name: /Extraer/i }).click();
  await expect(page.getByText(/Listo para confirmar/i).first()).toBeVisible();
  await page.getByRole('button', { name: /Confirmar y avisar al cliente/i }).click();
  await expect(page.getByText('Reserva confirmada').first()).toBeVisible();

  const codigo = (await page.getByText(/^TG-WA-/).first().textContent())?.trim();
  expect(codigo).toBeTruthy();

  await page.getByRole('button', { name: /Abrir en despacho/i }).click();
  await page.waitForURL('**/admin/reservas/**');
  const reservaId = page.url().split('/admin/reservas/')[1]?.split(/[?#]/)[0];
  expect(reservaId).toBeTruthy();

  const conductor = page.locator('select[name="conductor_id"]');
  const conductorOption = conductor.locator('option').first();
  const conductorId = await conductorOption.getAttribute('value');
  const conductorLabel = (await conductorOption.textContent()) ?? '';
  expect(conductorId).toBeTruthy();
  await conductor.selectOption(conductorId ?? '');

  const vehiculo = page.locator('select[name="vehiculo_id"]').first();
  const vehiculoId = await vehiculo.locator('option').first().getAttribute('value');
  expect(vehiculoId).toBeTruthy();
  await vehiculo.selectOption(vehiculoId ?? '');

  await page.getByRole('button', { name: /Confirmar conductor y unidad/i }).click();
  await expect(page.getByText(/Reserva asignada y auditada/i)).toBeVisible();

  const driverCredentials = driverCredentialsFromOption(conductorLabel);
  const login = await page.request.post('/api/conductor/login', {
    data: driverCredentials,
  });
  expect(login.status()).toBe(200);
  const loginBody = await login.json();
  const token = loginBody.token as string;
  expect(token).toBeTruthy();

  const blocked = await page.request.post(`/api/conductor/asignacion/${reservaId}/estado`, {
    headers: { authorization: `Bearer ${token}` },
    data: { estado_nuevo: 'en_camino' },
  });
  expect(blocked.status()).toBe(409);
  await expect(blocked.json()).resolves.toMatchObject({
    error: 'counter_pendiente',
    estado_abordaje: 'pendiente_validacion',
  });

  const counter = await browser.newContext();
  const counterPage = await counter.newPage();
  await counterPage.goto('/login-counter?callbackUrl=/counter');
  await counterPage.getByLabel('Email').fill('counter@taxigreen.demo');
  await counterPage.getByLabel('Contraseña').fill('demo1234');
  await counterPage.getByRole('button', { name: /Ingresar/i }).click();
  await counterPage.waitForURL('**/counter');

  const qr = await counterPage.request.get(`/api/voucher/${codigo}/qr`);
  expect(qr.status()).toBe(200);
  const qrToken = qr.headers()['x-voucher-token'];
  expect(qrToken).toBeTruthy();

  const consumed = await counterPage.request.post(`/api/voucher/${codigo}/verify`, {
    data: { token: qrToken, consume: true },
  });
  expect(consumed.status()).toBe(200);
  const consumedBody = await consumed.json();
  expect(consumedBody.consumed).toBe(true);
  expect(consumedBody.reserva.estado_abordaje).toBe('autorizado');
  expect(consumedBody.reserva.conductor).toBeTruthy();
  await counter.close();

  const allowed = await page.request.post(`/api/conductor/asignacion/${reservaId}/estado`, {
    headers: { authorization: `Bearer ${token}` },
    data: { estado_nuevo: 'en_camino' },
  });
  expect(allowed.status()).toBe(200);
  const allowedBody = await allowed.json();
  expect(allowedBody.ok).toBe(true);
  expect(allowedBody.asignacion.abordaje).toMatchObject({
    requiereCounter: true,
    autorizado: true,
  });
  expect(allowedBody.asignacion.viaje.estado).toBe('en_camino');
});

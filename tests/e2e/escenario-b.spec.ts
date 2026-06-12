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

test('escenario B: hotel hacia aeropuerto nace sin mostrador y el conductor inicia directo', async ({
  page,
}) => {
  test.setTimeout(75_000);

  await page.goto('/login-admin?callbackUrl=/wa-sim');
  await page.getByLabel('Email').fill('admin@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();

  await page.waitForURL('**/wa-sim');
  await page.getByRole('button', { name: /Hotel Costa Verde/i }).click();
  await page.getByRole('button', { name: /Extraer/i }).click();

  await expect(page.getByText('Hotel Costa Verde, Av. Malecón 200, Miraflores').first()).toBeVisible();
  await expect(page.getByText('Aeropuerto Jorge Chávez - Llegadas', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('traslado aeropuerto').first()).toBeVisible();
  await expect(page.getByText(/Listo para confirmar/i).first()).toBeVisible();

  await page.getByRole('button', { name: /Confirmar y avisar al cliente/i }).click();
  await expect(page.getByText('Reserva confirmada').first()).toBeVisible();
  await expect(page.getByText(/No necesitas pasar por mostrador/i).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Seguir mi taxi en vivo/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /pase de abordaje|código qr/i })).toHaveCount(0);

  await page.getByRole('button', { name: /Abrir en despacho/i }).click();
  await page.waitForURL('**/admin/reservas/**');
  const reservaId = page.url().split('/admin/reservas/')[1]?.split(/[?#]/)[0];
  expect(reservaId).toBeTruthy();
  await expect(page.getByText(/Sin mostrador/i).first()).toBeVisible();
  const passengerHref = await page.getByRole('link', { name: /Ver seguimiento/i }).getAttribute('href');
  expect(passengerHref).toMatch(/^\/p\//);

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
  const { token } = (await login.json()) as { token: string };
  expect(token).toBeTruthy();

  const started = await page.request.post(`/api/conductor/asignacion/${reservaId}/estado`, {
    headers: { authorization: `Bearer ${token}` },
    data: { estado_nuevo: 'en_camino' },
  });
  expect(started.status()).toBe(200);
  const startedBody = await started.json();
  expect(startedBody.asignacion.abordaje).toMatchObject({
    requiereCounter: false,
    autorizado: true,
  });
  expect(startedBody.asignacion.viaje.estado).toBe('en_camino');

  for (const estado of ['en_punto', 'a_bordo'] as const) {
    const next = await page.request.post(`/api/conductor/asignacion/${reservaId}/estado`, {
      headers: { authorization: `Bearer ${token}` },
      data: { estado_nuevo: estado },
    });
    expect(next.status()).toBe(200);
  }

  const finalizado = await page.request.post(`/api/conductor/asignacion/${reservaId}/estado`, {
    headers: { authorization: `Bearer ${token}` },
    data: { estado_nuevo: 'finalizado' },
  });
  expect(finalizado.status()).toBe(200);
  const finalizadoBody = await finalizado.json();
  expect(finalizadoBody.asignacion.viaje.estado).toBe('finalizado');
  expect(finalizadoBody.asignacion.cobro).toMatchObject({
    estado: 'por_liquidar',
    moneda: 'PEN',
  });

  await page.goto(passengerHref!);
  await expect(page.getByText(/Punto de recojo/i).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Descargar comprobante/i })).toBeVisible();
});

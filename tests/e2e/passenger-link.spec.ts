import { expect, test } from '@playwright/test';

test('link pasajero muestra tracking operativo del flujo protagonista', async ({ page }) => {
  await page.goto('/p/tg_demo_passenger_001');

  await expect(page.getByRole('heading', { name: /Recojo en aeropuerto/i })).toBeVisible();
  await expect(page.getByText('Tu conductor')).toBeVisible();
  await expect(page.getByRole('link', { name: /Llamar al conductor/i })).toBeVisible();
  await expect(page.getByText('ABC-123')).toBeVisible();
  await expect(page.getByText('Salida 3, columna F2')).toBeVisible();
  await expect(page.getByText('LA2456')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Av. Pardo 123, Miraflores' })).toBeVisible();
});

test('routing público valida token pasajero y devuelve estimación segura', async ({ request }) => {
  const response = await request.get('/api/rutas/calcular', {
    params: {
      token: 'tg_demo_passenger_001',
      origen_lat: '-12.0231',
      origen_lng: '-77.112',
      destino_lat: '-12.1196',
      destino_lng: '-77.0365',
      perfil: 'driving-traffic',
    },
  });

  expect(response.status()).toBe(200);
  const payload = (await response.json()) as {
    fuente?: string;
    distanciaMetros?: number;
    duracionSegundos?: number;
    geometry?: { type?: string; coordinates?: unknown[] };
  };
  expect(payload.fuente).toMatch(/^(mapbox|estimacion)$/);
  expect(payload.distanciaMetros).toBeGreaterThan(1000);
  expect(payload.duracionSegundos).toBeGreaterThan(60);
  expect(payload.geometry?.type).toBe('LineString');
  expect(payload.geometry?.coordinates?.length).toBeGreaterThanOrEqual(2);
});

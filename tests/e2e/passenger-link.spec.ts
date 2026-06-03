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

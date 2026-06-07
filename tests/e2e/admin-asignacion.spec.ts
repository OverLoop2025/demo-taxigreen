import { expect, test } from '@playwright/test';

test('admin asigna conductor y unidad, y auditoría registra reserva_asignada', async ({ page }) => {
  await page.goto('/login-admin?callbackUrl=/admin');
  await page.getByLabel('Email').fill('admin@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();

  // pathname exacto: el glob '**/admin' también casa con '?callbackUrl=/admin' y
  // retornaría antes de autenticar. Timeout amplio: /admin hace query a Supabase.
  await page.waitForURL((url) => new URL(url).pathname === '/admin', { timeout: 20000 });
  await expect(page.getByRole('heading', { name: /Servicios de hoy/i })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('TG-2026-0001')).toBeVisible();

  await page.getByText('TG-2026-0001').click();
  await expect(page.getByRole('heading', { name: /Reserva TG-2026-0001/i })).toBeVisible();

  const conductor = page.locator('select[name="conductor_id"]');
  const conductorId = await conductor.locator('option').first().getAttribute('value');
  expect(conductorId).toBeTruthy();
  await conductor.selectOption(conductorId ?? '');

  const vehiculo = page.locator('select[name="vehiculo_id"]').first();
  const vehiculoId = await vehiculo.locator('option').first().getAttribute('value');
  expect(vehiculoId).toBeTruthy();
  await vehiculo.selectOption(vehiculoId ?? '');

  await page.getByRole('button', { name: /Confirmar conductor y unidad/i }).click();
  await expect(page.getByText(/Reserva asignada y auditada/i)).toBeVisible();

  await page.goto('/admin/auditoria?action=reserva_asignada');
  await expect(page.getByText('Conductor asignado').first()).toBeVisible();
  await expect(page.getByText('Operador').first()).toBeVisible();
});

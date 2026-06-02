import { expect, test } from '@playwright/test';

test('copiloto sugiere asignación y el operador la acepta con auditoría', async ({ page }) => {
  await page.goto('/login-admin?callbackUrl=/wa-sim');
  await page.getByLabel('Email').fill('admin@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();

  await page.waitForURL('**/wa-sim');
  await page.getByRole('button', { name: /Extraer/i }).click();
  await expect(page.getByText(/Datos suficientes para crear reserva/i)).toBeVisible();

  await page.getByRole('button', { name: /Crear reserva/i }).click();
  await page.waitForURL('**/admin/reservas/**');
  await expect(page.getByRole('heading', { name: /Reserva TG-WA-/i })).toBeVisible();

  await expect(page.getByRole('heading', { name: /Copiloto recomienda/i })).toBeVisible();
  await expect(page.getByText(/Score \d+\/100/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Aceptar sugerencia/i })).toBeEnabled();

  await page.getByRole('button', { name: /Aceptar sugerencia/i }).click();
  await expect(page.getByRole('button', { name: /Aceptar sugerencia/i })).toBeHidden({
    timeout: 20_000,
  });
  await expect(page.getByText(/Asignación vigente/i)).toBeVisible();

  await page.goto('/admin/auditoria?action=reserva_asignada');
  await expect(page.getByText('reserva_asignada').first()).toBeVisible();
  await expect(page.getByText('sugerencia_copiloto').first()).toBeVisible();
});

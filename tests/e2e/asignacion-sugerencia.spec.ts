import { expect, test } from '@playwright/test';

test('copiloto sugiere asignación y el operador la acepta con auditoría', async ({ page }) => {
  await page.goto('/login-admin?callbackUrl=/wa-sim');
  await page.getByLabel('Email').fill('admin@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();

  await page.waitForURL('**/wa-sim');
  await page.getByRole('button', { name: /Extraer/i }).click();
  await expect(page.getByText(/Listo para confirmar/i).first()).toBeVisible();

  // Flujo F5: el operador confirma EN EL CHAT y desde ahí abre el despacho.
  await page.getByRole('button', { name: /Confirmar y avisar al cliente/i }).click();
  await expect(page.getByText('Reserva confirmada').first()).toBeVisible();
  await page.getByRole('button', { name: /Abrir en despacho/i }).click();
  await page.waitForURL('**/admin/reservas/**');
  await expect(page.getByRole('heading', { name: /Reserva TG-WA-/i })).toBeVisible();

  await expect(page.getByRole('heading', { name: /Conductor sugerido/i })).toBeVisible();
  await expect(page.getByText(/Modo seguro/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Confirmar recomendación/i })).toBeEnabled();

  await page.getByRole('button', { name: /Confirmar recomendación/i }).click();
  await expect(page.getByRole('button', { name: /Confirmar recomendación/i })).toBeHidden({
    timeout: 20_000,
  });
  await expect(page.getByText(/Conductor asignado/i).first()).toBeVisible();

  await page.goto('/admin/auditoria?action=reserva_asignada');
  // El detalle vive en la tabla (no en las <option> ocultas del filtro de acciones).
  await expect(page.locator('table').getByText('Se asignó conductor a la reserva').first()).toBeVisible();
  await expect(page.locator('table').getByText(/sugerencia copiloto/i).first()).toBeVisible();
});

import { expect, test } from '@playwright/test';

test('WA Sim extrae protagonista y crea una reserva visible en /admin', async ({ page }) => {
  await page.goto('/login-admin?callbackUrl=/wa-sim');
  await page.getByLabel('Email').fill('admin@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();

  await page.waitForURL('**/wa-sim');
  await expect(page.getByRole('heading', { name: /WA Sim/i })).toBeVisible();

  await page.getByRole('button', { name: /Extraer/i }).click();
  await expect(page.getByText('Aeropuerto Jorge Chávez - Llegadas', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Av. Pardo 123, Miraflores', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('LA2456', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Datos suficientes para crear reserva/i)).toBeVisible();

  await page.getByRole('button', { name: /Crear reserva/i }).click();
  await page.waitForURL('**/admin/reservas/**');
  await expect(page.getByRole('heading', { name: /Reserva TG-WA-/i })).toBeVisible();
  await expect(page.getByText('reserva_ingesta_whatsapp_creada')).toBeVisible();
});

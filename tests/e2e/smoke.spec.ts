import { test, expect } from '@playwright/test';

/**
 * Smoke E2E dummy (Sprint 0). Asume apps/web corriendo en baseURL.
 * Se ejecuta con `pnpm e2e` cuando el dev server esté arriba.
 */
test('la landing responde y muestra Taxi Green', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Recojo en el Jorge Chávez/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Pídelo por WhatsApp/i })).toBeVisible();
});

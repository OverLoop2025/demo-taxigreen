import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright (web). En Sprint 0 hay un test dummy. Los E2E reales del flujo
 * protagonista llegan por sprint (cada feature lleva su E2E mínimo).
 * Se ejecuta con `pnpm e2e` (no entra al pipeline `turbo run test` de Sprint 0).
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    ...devices['Desktop Chrome'],
  },
});

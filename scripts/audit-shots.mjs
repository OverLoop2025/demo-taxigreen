// Captura de auditoría visual — para VER las vistas reales (no estar ciego).
// Reqs: dev server en :3000 (next dev), token Mapbox local activo.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const OUT = 'artifacts/audit';
mkdirSync(OUT, { recursive: true });

async function loginAdmin(page) {
  await page.goto(`${BASE}/login-admin?callbackUrl=/admin`, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email').fill('admin@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();
  await page.waitForURL((url) => new URL(url).pathname === '/admin', { timeout: 45000 });
  await page.waitForLoadState('networkidle');
}

async function shot(page, name) {
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('  ->', name);
}

async function run(theme) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((t) => {
    try { localStorage.setItem('tg-theme', t); } catch {}
  }, theme);
  const page = await ctx.newPage();

  console.log(`[${theme}] login admin…`);
  await loginAdmin(page);
  await shot(page, `admin-dispatch-${theme}`);

  // Primer reserva del tablero → detalle (aquí aparece el JSON técnico)
  const firstRow = page.locator('a[href^="/admin/reservas/"]').first();
  if (await firstRow.count()) {
    await firstRow.click();
    await page.waitForURL(/\/admin\/reservas\//, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await shot(page, `admin-reserva-${theme}`);
  } else {
    console.log('  (sin filas de reserva)');
  }

  // WhatsApp simulador (¿JSON visible?)
  await page.goto(`${BASE}/wa-sim`, { waitUntil: 'networkidle' });
  await shot(page, `wa-sim-${theme}`);

  // Pasajero (mapa + toggle): desktop y móvil
  await page.goto(`${BASE}/p/tg_demo_passenger_001`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/passenger-desktop-${theme}.png` });
  console.log('  -> passenger-desktop');

  const mob = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mob.addInitScript((t) => { try { localStorage.setItem('tg-theme', t); } catch {} }, theme);
  const mp = await mob.newPage();
  await mp.goto(`${BASE}/p/tg_demo_passenger_001`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(2800);
  await mp.screenshot({ path: `${OUT}/passenger-mobile-${theme}.png` });
  console.log('  -> passenger-mobile');

  await browser.close();
}

for (const theme of ['light', 'dark']) {
  await run(theme);
}
console.log('OK ->', OUT);

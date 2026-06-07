// Mide solapes del botón de tema (claro/oscuro) contra otros botones/enlaces.
import { chromium } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

function overlapArea(a, b) {
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return x * y;
}

async function measure(url, viewport, label) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const toggle = page.locator('button[aria-label*="modo"]').first();
  const tCount = await toggle.count();
  if (!tCount) {
    console.log(`[${label}] sin toggle`);
    await browser.close();
    return;
  }
  const tBox = await toggle.boundingBox();

  // Todos los botones/enlaces interactivos con caja
  const others = page.locator('button, a[href]');
  const n = await others.count();
  const hits = [];
  for (let i = 0; i < n; i++) {
    const el = others.nth(i);
    const aria = (await el.getAttribute('aria-label')) ?? (await el.innerText().catch(() => '')) ?? '';
    if (aria.includes('modo')) continue; // el propio toggle
    const box = await el.boundingBox();
    if (!box) continue;
    const area = overlapArea(tBox, box);
    if (area > 0) hits.push({ aria: aria.slice(0, 40).replace(/\n/g, ' '), area: Math.round(area), box });
  }
  console.log(`[${label}] toggle @ ${JSON.stringify(tBox)}`);
  if (hits.length === 0) console.log('   sin solapes ✅');
  for (const h of hits) console.log(`   SOLAPE ${h.area}px²  "${h.aria}"`);
  await browser.close();
}

await measure('/p/tg_demo_passenger_001', { width: 390, height: 844 }, 'passenger-mobile');
await measure('/p/tg_demo_passenger_001', { width: 1280, height: 900 }, 'passenger-desktop');
await measure('/', { width: 390, height: 844 }, 'landing-mobile');
await measure('/', { width: 1280, height: 900 }, 'landing-desktop');

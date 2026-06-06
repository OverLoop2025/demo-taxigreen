// Evidencia visual de las superficies WEB (apps/web) — Renovación Frontend Premium.
//
// Produce capturas reales (móvil + desktop, claro + oscuro) en artifacts/playwright/
// para que la revisión no sea "a ciegas": se razona sobre el resultado renderizado,
// no solo sobre el código. Es el equivalente web de los flows Maestro del driver.
//
// Uso:
//   pnpm visual:web                # autocontenido: levanta next dev en VISUAL_PORT
//   VISUAL_BASE_URL=http://host pnpm visual:web   # captura contra un server ya levantado
//
// Por qué `next dev` y no `next start`: las superficies con login (counter/admin) usan
// Auth.js con cookies `secure` en producción, que el navegador NO envía sobre
// http://localhost → la sesión se pierde y se captura el login. En dev las cookies no
// son secure y la sesión persiste. Para QA de layout, dev ≈ prod en render. NO correr
// con otro `next dev` activo sobre el mismo .next (se pelean; ver DOCUMENTACION_TECNICA §21).

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = process.env.VISUAL_PORT ?? '3210';
const EXTERNAL = process.env.VISUAL_BASE_URL ?? null;
const BASE = EXTERNAL ?? `http://localhost:${PORT}`;
const OUT = 'artifacts/playwright';
mkdirSync(OUT, { recursive: true });

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1366, height: 850 };

// Cada superficie: nombre, ruta, viewports y si necesita login de counter.
const SURFACES = [
  { name: 'landing', path: '/', viewports: ['mobile', 'desktop'], themes: ['light', 'dark'] },
  {
    name: 'passenger-tracking',
    path: '/p/tg_demo_passenger_001',
    viewports: ['mobile', 'desktop'],
    themes: ['light', 'dark'],
    settle: 4000,
  },
  {
    name: 'counter',
    path: '/counter',
    login: 'counter',
    viewports: ['mobile', 'desktop'],
    themes: ['light', 'dark'],
  },
];

async function waitForServer(url, tries = 90) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) return true;
    } catch {
      /* aún no responde */
    }
    await sleep(1000);
  }
  return false;
}

async function loginCounter(page) {
  // 'load' + networkidle + espera: el form es client-side (Auth.js). Si se llena/
  // envía antes de que React hidrate, el <form> hace GET nativo y no autentica.
  await page.goto(`${BASE}/login-counter?callbackUrl=/counter`, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1200);
  await page.getByLabel('Email').fill('counter@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();
  // Esperar contenido del counter (no waitForURL: el glob **/counter también casa
  // con .../login-counter?callbackUrl=/counter y retornaría antes de autenticar).
  await page.getByRole('heading', { name: 'Validar pasajero' }).waitFor({ timeout: 45000 });
}

async function capture(browser, surface) {
  const results = [];
  for (const vp of surface.viewports) {
    for (const theme of surface.themes ?? ['light']) {
      const viewport = vp === 'mobile' ? MOBILE : DESKTOP;
      const context = await browser.newContext({ viewport });
      if (theme === 'dark') {
        await context.addInitScript(() => window.localStorage.setItem('tg-theme', 'dark'));
      }
      const page = await context.newPage();
      try {
        if (surface.login === 'counter') {
          // loginCounter aterriza en /counter (nav cliente, sesión viva). Re-navegar
          // a la misma ruta perdería la sesión sobre http → solo re-goto si difiere.
          await loginCounter(page);
          if (surface.path !== '/counter') {
            await page.goto(`${BASE}${surface.path}`, { waitUntil: 'domcontentloaded' });
          }
        } else {
          await page.goto(`${BASE}${surface.path}`, { waitUntil: 'domcontentloaded' });
        }
        await page.waitForTimeout(surface.settle ?? 2500);
        const file = `${OUT}/${surface.name}-${vp}-${theme}.png`;
        await page.screenshot({ path: file });
        results.push({ surface: surface.name, vp, theme, file, ok: true });
        console.log(`✓ ${file}`);
      } catch (error) {
        results.push({ surface: surface.name, vp, theme, ok: false, error: String(error).slice(0, 140) });
        console.log(`✗ ${surface.name}-${vp}-${theme}: ${String(error).slice(0, 120)}`);
      } finally {
        await context.close();
      }
    }
  }
  return results;
}

function writeReport(all) {
  const rows = all
    .map((r) =>
      r.ok
        ? `<figure><img src="${r.surface}-${r.vp}-${r.theme}.png" loading="lazy"/><figcaption>${r.surface} · ${r.vp} · ${r.theme}</figcaption></figure>`
        : `<figure class="err"><figcaption>${r.surface} · ${r.vp} · ${r.theme} — ERROR: ${r.error}</figcaption></figure>`,
    )
    .join('\n');
  const html = `<!doctype html><meta charset="utf-8"><title>Visual web — Taxi Green</title>
<style>body{font:14px system-ui;background:#0b1120;color:#e5e7eb;margin:24px}
h1{font-size:18px}figure{display:inline-block;margin:8px;vertical-align:top}
img{max-width:380px;border:1px solid #1f2937;border-radius:8px;background:#fff}
figcaption{margin-top:6px;color:#9ca3af}.err figcaption{color:#f87171}</style>
<h1>Evidencia visual web · ${new Date().toISOString()}</h1>${rows}`;
  writeFileSync(`${OUT}/report.html`, html);
  console.log(`\nReporte: ${OUT}/report.html`);
}

let server = null;
async function main() {
  if (!EXTERNAL) {
    console.log(`Levantando next dev en :${PORT} …`);
    server = spawn('pnpm', ['--filter', '@taxigreen/web', 'exec', 'next', 'dev', '-p', PORT], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore',
    });
  }
  const up = await waitForServer(BASE);
  if (!up) throw new Error(`El servidor no respondió en ${BASE}`);

  // Pre-calentar rutas: en `next dev` cada ruta compila on-demand (la 1ª visita es
  // lenta y hace fallar el login por timeout). Un GET previo las compila.
  const warm = ['/login-counter', '/counter', ...SURFACES.map((s) => s.path)];
  console.log('Pre-calentando rutas …');
  for (const route of [...new Set(warm)]) {
    try {
      await fetch(`${BASE}${route}`, { redirect: 'manual' });
    } catch {
      /* ignora */
    }
  }

  const browser = await chromium.launch();
  const all = [];
  for (const surface of SURFACES) all.push(...(await capture(browser, surface)));
  await browser.close();
  writeReport(all);

  const failed = all.filter((r) => !r.ok);
  if (failed.length) console.log(`\n${failed.length} captura(s) con error.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    if (server?.pid) {
      try {
        process.kill(-server.pid, 'SIGTERM');
      } catch {
        /* ya terminó */
      }
    }
  });

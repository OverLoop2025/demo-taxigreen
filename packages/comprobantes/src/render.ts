import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';
import { renderComprobanteHtml } from './templates';
import type { ComprobanteTemplateInput } from './types';

export type RenderPdfOptions = {
  executablePath?: string;
};

async function executablePath(explicitPath?: string) {
  if (explicitPath) return explicitPath;
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  return chromium.executablePath(process.env.CHROMIUM_PATH);
}

export async function renderComprobantePDF(input: ComprobanteTemplateInput, options: RenderPdfOptions = {}) {
  const html = renderComprobanteHtml(input);
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await executablePath(options.executablePath),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '16mm', right: '12mm', bottom: '16mm', left: '12mm' },
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

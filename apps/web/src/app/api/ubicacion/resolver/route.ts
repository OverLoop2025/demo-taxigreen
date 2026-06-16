import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Solo resolvemos enlaces de mapas de Google (anti-SSRF: lista blanca de hosts).
const HOSTS_PERMITIDOS = new Set([
  'goo.gl',
  'maps.app.goo.gl',
  'g.co',
  'g.page',
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.google.com.pe',
  'www.google.com.pe',
  'google.com.pe',
]);

function extraerCoords(texto: string): { lat: number; lng: number } | null {
  const patrones = [
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/u,
    /[?&!](?:q|ll|center|destination|daddr)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/u,
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/u,
    /\/(-?\d{1,2}\.\d{3,}),(-?\d{1,3}\.\d{3,})/u,
  ];
  for (const p of patrones) {
    const m = p.exec(texto);
    if (m?.[1] && m[2]) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
      }
    }
  }
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url');
  if (!url) {
    return NextResponse.json({ ok: false, error: 'sin_url' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ ok: false, error: 'url_invalida' }, { status: 400 });
  }
  if (parsed.protocol !== 'https:' || !HOSTS_PERMITIDOS.has(parsed.hostname)) {
    return NextResponse.json({ ok: false, error: 'host_no_permitido' }, { status: 400 });
  }

  // ¿La propia URL ya trae coordenadas? (enlace largo).
  const directas = extraerCoords(url);
  if (directas) return NextResponse.json({ ok: true, ...directas });

  // Seguimos la redirección del enlace corto y leemos la URL final + cuerpo.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(parsed.toString(), {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TaxiGreenBot/1.0)' },
    });
    const finalUrl = res.url || parsed.toString();
    const desdeUrl = extraerCoords(finalUrl);
    if (desdeUrl) return NextResponse.json({ ok: true, ...desdeUrl });

    const body = (await res.text()).slice(0, 200_000);
    const desdeBody = extraerCoords(body);
    if (desdeBody) return NextResponse.json({ ok: true, ...desdeBody });

    return NextResponse.json({ ok: false, error: 'sin_coordenadas' }, { status: 422 });
  } catch {
    return NextResponse.json({ ok: false, error: 'no_resuelto' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

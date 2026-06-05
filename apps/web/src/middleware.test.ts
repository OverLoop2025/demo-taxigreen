import { describe, expect, it, beforeEach, vi } from 'vitest';
import { NextRequest, type NextResponse } from 'next/server';

// El middleware lee la sesión vía `getToken` (next-auth/jwt). Lo mockeamos para
// inyectar el rol del usuario y aislar la lógica de autorización por ruta, que es
// la primera línea de defensa del producto (superficies de escritura /admin /wa-sim
// y validación física /counter). Sin este test, un cambio que invierta un `!==`
// abriría una superficie operativa a cualquier rol sin que CI lo note.
const { getTokenMock } = vi.hoisted(() => ({ getTokenMock: vi.fn() }));
vi.mock('next-auth/jwt', () => ({ getToken: getTokenMock }));

import { middleware } from './middleware';

type Role = 'admin_tenant' | 'despachador' | 'supervisor' | 'conductor' | null;

async function run(path: string, role: Role): Promise<NextResponse> {
  getTokenMock.mockResolvedValue(role ? { role } : null);
  return middleware(new NextRequest(`http://localhost${path}`));
}

function isRedirectTo(res: NextResponse, loginPath: string) {
  const location = res.headers.get('location');
  return res.status === 307 && location !== null && location.includes(loginPath);
}

function isPassThrough(res: NextResponse) {
  // NextResponse.next() no fija Location y marca la continuación con este header.
  return res.headers.get('location') === null && res.headers.get('x-middleware-next') === '1';
}

beforeEach(() => {
  getTokenMock.mockReset();
});

describe('middleware de autorización por rol', () => {
  describe('/admin (sólo admin_tenant o despachador)', () => {
    it('redirige a /login-admin al anónimo', async () => {
      expect(isRedirectTo(await run('/admin', null), '/login-admin')).toBe(true);
    });

    it('redirige a /login-admin al supervisor (rol de counter, no de despacho)', async () => {
      expect(isRedirectTo(await run('/admin', 'supervisor'), '/login-admin')).toBe(true);
    });

    it('redirige a /login-admin al conductor (token móvil no abre superficies web)', async () => {
      expect(isRedirectTo(await run('/admin', 'conductor'), '/login-admin')).toBe(true);
    });

    it('deja pasar a despachador', async () => {
      expect(isPassThrough(await run('/admin', 'despachador'))).toBe(true);
    });

    it('deja pasar a admin_tenant', async () => {
      expect(isPassThrough(await run('/admin', 'admin_tenant'))).toBe(true);
    });

    it('protege subrutas profundas como /admin/reservas/123', async () => {
      expect(isRedirectTo(await run('/admin/reservas/123', null), '/login-admin')).toBe(true);
      expect(isPassThrough(await run('/admin/reservas/123', 'despachador'))).toBe(true);
    });
  });

  describe('/wa-sim (escribe reservas: mismo gate operativo que /admin)', () => {
    it('redirige a /login-admin al anónimo', async () => {
      expect(isRedirectTo(await run('/wa-sim', null), '/login-admin')).toBe(true);
    });

    it('redirige a /login-admin al supervisor', async () => {
      expect(isRedirectTo(await run('/wa-sim', 'supervisor'), '/login-admin')).toBe(true);
    });

    it('deja pasar a despachador', async () => {
      expect(isPassThrough(await run('/wa-sim', 'despachador'))).toBe(true);
    });
  });

  describe('/counter (sólo supervisor)', () => {
    it('redirige a /login-counter al anónimo', async () => {
      expect(isRedirectTo(await run('/counter', null), '/login-counter')).toBe(true);
    });

    it('redirige a /login-counter al despachador (no puede consumir vouchers)', async () => {
      expect(isRedirectTo(await run('/counter', 'despachador'), '/login-counter')).toBe(true);
    });

    it('redirige a /login-counter al admin_tenant', async () => {
      expect(isRedirectTo(await run('/counter', 'admin_tenant'), '/login-counter')).toBe(true);
    });

    it('deja pasar al supervisor', async () => {
      expect(isPassThrough(await run('/counter', 'supervisor'))).toBe(true);
    });
  });

  it('preserva el destino original en callbackUrl al redirigir', async () => {
    getTokenMock.mockResolvedValue(null);
    const res = await middleware(new NextRequest('http://localhost/admin/metricas?x=1'));
    const location = res.headers.get('location');
    expect(location).not.toBeNull();
    const url = new URL(location ?? '');
    expect(url.pathname).toBe('/login-admin');
    expect(url.searchParams.get('callbackUrl')).toBe('/admin/metricas?x=1');
  });
});

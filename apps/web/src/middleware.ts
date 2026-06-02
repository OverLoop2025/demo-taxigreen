import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_SECRET } from './lib/auth/secret';

function redirectToLogin(request: NextRequest, loginPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = loginPath;
  url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: AUTH_SECRET });
  const role = typeof token?.role === 'string' ? token.role : null;

  // `/wa-sim` crea reservas en la DB (Server Action) y consume el extractor;
  // se protege con el mismo rol operativo que `/admin` para que no sea una
  // superficie de escritura abierta. El webhook WABA real (MVP) usará firma
  // entrante, no sesión de operador.
  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/wa-sim')) &&
    role !== 'admin_tenant' &&
    role !== 'despachador'
  ) {
    return redirectToLogin(request, '/login-admin');
  }

  if (pathname.startsWith('/counter') && role !== 'supervisor') {
    return redirectToLogin(request, '/login-counter');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/counter/:path*', '/wa-sim/:path*'],
};

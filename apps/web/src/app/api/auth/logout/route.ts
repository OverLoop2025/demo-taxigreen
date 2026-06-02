import { NextResponse } from 'next/server';

const AUTH_COOKIES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
];

export async function GET(request: Request) {
  const url = new URL('/login-admin', request.url);
  const response = NextResponse.redirect(url);
  for (const cookieName of AUTH_COOKIES) {
    response.cookies.delete(cookieName);
  }
  return response;
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  for (const cookieName of AUTH_COOKIES) {
    response.cookies.delete(cookieName);
  }
  return response;
}

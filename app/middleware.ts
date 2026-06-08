import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/forget-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /forget-password → /forgot-password redirect
  if (pathname.startsWith('/forget-password')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace('/forget-password', '/forgot-password');
    return NextResponse.redirect(url);
  }

  // Auth pages এ গেলে — কিছু করো না, client-side handle করবে
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|images|manifest.json).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes — no login needed
const PUBLIC_ROUTES  = ['/', '/login', '/register', '/forgot-password'];
// Auth routes — redirect to dashboard if already logged in
const AUTH_ROUTES    = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check session cookie (Firebase sets this via session management)
  const session = request.cookies.get('session')?.value;

  // If trying to access auth pages while logged in → go to dashboard
  if (session && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If trying to access protected pages without session → go to login
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|images|manifest.json).*)'],
};

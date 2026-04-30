import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/unauthorized'];

const API_ROUTES = ['/api'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow API routes to pass through
  if (API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Allow public routes without cookie check
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }
  
  const sessionCookie = getSessionCookie(request);
  
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)',
  ],
};

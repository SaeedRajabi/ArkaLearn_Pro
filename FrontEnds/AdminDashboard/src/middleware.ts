import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RESERVED_TOP_LEVEL = new Set([
  'dashboard',
  'login',
  'room',
  'svc',
  'api',
  'meetingHub',
  'hubs',
  'manifest.json',
  'sw.js',
  'icons',
]);

function hasAuthCookie(request: NextRequest): boolean {
  return (
    request.cookies.has('AuthCookie') ||
    request.cookies.has('authToken') ||
    request.cookies.has('.AspNetCore.Cookies')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Legacy class links stored as /{slug} instead of /room/{slug}
  const legacyRoomMatch = pathname.match(/^\/([^/]+)\/?$/);
  if (legacyRoomMatch) {
    const segment = legacyRoomMatch[1];
    if (segment && !RESERVED_TOP_LEVEL.has(segment.toLowerCase())) {
      const url = request.nextUrl.clone();
      url.pathname = `/room/${segment}`;
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (!hasAuthCookie(request)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|svc/|meetingHub|hubs/|.*\\..*).*)'],
};

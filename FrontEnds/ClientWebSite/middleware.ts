import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isSiteLocale, SITE_LOCALE_HEADER } from '@/lib/seo/hreflang';

import { SEO_NOINDEX_ROUTE_PREFIXES } from '@/lib/seo/private-routes';

const protectedRoutes = [
  '/account',
  '/professor',
  '/checkout',
  '/learning', // مثال: محیط یادگیری
];

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const CANONICAL_HOST = 'arkasoftware.ir';

function isLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return LOCAL_HOSTS.has(host) || host.endsWith('.local');
}

/** Redirect non-canonical host/port variants to the public canonical URL. */
function redirectToCanonicalHost(request: NextRequest): NextResponse | null {
  const hostname = request.nextUrl.hostname.toLowerCase();
  if (isLocalHost(hostname)) return null;

  const hostHeader = request.headers.get('host')?.toLowerCase() ?? '';
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim().toLowerCase() ?? '';
  const forwardedPort = request.headers.get('x-forwarded-port')?.split(',')[0]?.trim() ?? '';
  const effectiveHost = forwardedHost || hostHeader || hostname;

  const has8443Port =
    effectiveHost.endsWith(':8443') ||
    forwardedPort === '8443' ||
    request.nextUrl.port === '8443';
  const isWwwHost = hostname === `www.${CANONICAL_HOST}` || effectiveHost.startsWith(`www.${CANONICAL_HOST}:`);

  if (!has8443Port && !isWwwHost) return null;

  const canonicalUrl = request.nextUrl.clone();
  canonicalUrl.protocol = 'https:';
  canonicalUrl.hostname = CANONICAL_HOST;
  canonicalUrl.port = '';
  return NextResponse.redirect(canonicalUrl, 308);
}

/** Redirect HTTP to HTTPS (skipped on localhost). */
function redirectHttpToHttps(request: NextRequest): NextResponse | null {
  const hostname = request.nextUrl.hostname;
  if (isLocalHost(hostname)) {
    return null;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  const isHttp =
    forwardedProto === 'http' ||
    (!forwardedProto && request.nextUrl.protocol === 'http:');

  if (!isHttp) {
    return null;
  }

  const httpsUrl = request.nextUrl.clone();
  httpsUrl.protocol = 'https:';
  return NextResponse.redirect(httpsUrl, 308);
}

function applySecurityHeaders(response: NextResponse, request: NextRequest): void {
  const proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase() ??
    request.nextUrl.protocol.replace(':', '');
  if (proto === 'https' && !isLocalHost(request.nextUrl.hostname)) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

const noIndexRoutes = [...SEO_NOINDEX_ROUTE_PREFIXES];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const canonicalRedirect = redirectToCanonicalHost(request);
  if (canonicalRedirect) {
    applySecurityHeaders(canonicalRedirect, request);
    return canonicalRedirect;
  }

  const httpsRedirect = redirectHttpToHttps(request);
  if (httpsRedirect) {
    applySecurityHeaders(httpsRedirect, request);
    return httpsRedirect;
  }

  if (
      pathname.startsWith("/_next/") ||
      pathname === "/favicon.ico" ||
      pathname.startsWith("/brand/") ||
      pathname.startsWith("/icons/") ||
      pathname.startsWith("/fonts/") ||
      pathname.startsWith("/images/") ||
      pathname === "/sw.js" ||
      pathname.startsWith("/workbox-") ||
      pathname === "/manifest.json" ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml" ||
      pathname === "/opengraph-image" ||
      pathname.startsWith("/og")
  ) {
    const response = NextResponse.next();
    applySecurityHeaders(response, request);
    return response;
  }

  // جلوگیری از محتوای تکراری: /index.html -> /
  if (/^\/index\.html?$/i.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const response = NextResponse.redirect(url, 308);
    applySecurityHeaders(response, request);
    return response;
  }


  // Only use middleware as a fast "missing session" gate. Token validity is checked by AuthGuard via API.
  const authToken = request.cookies.get('AuthCookie')?.value ?? request.cookies.get('authToken')?.value;
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // ۱. اگر کاربر لاگین نیست و می‌خواهد به مسیر محافظت شده برود
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    // ذخیره آدرس فعلی برای بازگشت بعد از لاگین
    loginUrl.searchParams.set('returnUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('X-Robots-Tag', 'noindex, follow');
    applySecurityHeaders(response, request);
    return response;
  }

  const langFromQuery = request.nextUrl.searchParams.get('lang');
  const langCookie = request.cookies.get('lang')?.value;
  const resolvedLocale = isSiteLocale(langFromQuery)
    ? langFromQuery
    : isSiteLocale(langCookie)
      ? langCookie
      : 'fa';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SITE_LOCALE_HEADER, resolvedLocale);

  const localizedResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (isSiteLocale(langFromQuery)) {
    localizedResponse.cookies.set('lang', langFromQuery, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
  }

  if (noIndexRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    localizedResponse.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  applySecurityHeaders(localizedResponse, request);
  return localizedResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - manifest.json, sw.js, workbox-*.js, sitemap.xml, robots.txt
     */
    '/((?!api|hubs/|_next/static|_next/image|favicon\\.ico|icons/|fonts/|images/|manifest.json|sw.js|workbox-.*\\.js|sitemap.xml|robots.txt).*)',
  ],
};

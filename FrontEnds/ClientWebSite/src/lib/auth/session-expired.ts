'use client';

import { clearAuthData, notifyUnauthorized } from '@/lib/auth';
import { hasIntentionalLogout } from '@/lib/auth/logout-intent';
import { isLogoutPending } from '@/lib/auth/logout-client';

const AUTH_PUBLIC_API_FRAGMENTS = [
  '/account/login',
  '/account/register',
  '/account/forgot',
  '/account/reset',
  '/account/verify',
  '/account/sendotp',
  '/account/verifyotp',
  '/account/resend',
  '/account/logout',
] as const;

/** Session probes — 401 means "logged out", not "kick user to login". */
const AUTH_SESSION_PROBE_FRAGMENTS = [
  '/user/get-user',
] as const;

export function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return String(input);
}

export function isAuthPublicApiRequest(url: string): boolean {
  const lower = url.toLowerCase();
  return AUTH_PUBLIC_API_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

export function isAppApiRequest(url: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const absolute = new URL(url, window.location.origin);
    const path = absolute.pathname.toLowerCase();
    return path.startsWith('/api/service') || path.startsWith('/hubs/');
  } catch {
    const lower = url.toLowerCase();
    return lower.includes('/api/service') || lower.includes('/hubs/');
  }
}

export function isAuthSessionProbeRequest(url: string): boolean {
  const lower = url.toLowerCase();
  return AUTH_SESSION_PROBE_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

export function shouldHandleUnauthorizedApiResponse(url: string): boolean {
  if (!isAppApiRequest(url)) return false;
  if (isAuthPublicApiRequest(url)) return false;
  if (isAuthSessionProbeRequest(url)) return false;
  return true;
}

export function hadStoredAuthSession(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem('authToken') || localStorage.getItem('currentUser'));
}

/** Clears client auth state and notifies listeners when an authenticated session expired (401). */
export function emitSessionExpired(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasIntentionalLogout()) return false;
  if (isLogoutPending()) return false;
  if (!hadStoredAuthSession()) return false;

  clearAuthData();
  notifyUnauthorized();
  return true;
}

export function buildLoginRedirectUrl(pathname?: string, search?: string): string {
  if (typeof window === 'undefined') return '/login';

  const path = pathname ?? window.location.pathname;
  const query = search ?? window.location.search;

  if (
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password')
  ) {
    return '/login';
  }

  const returnUrl = `${path}${query}`;
  return `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
}

export function isAuthEntryPath(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  );
}

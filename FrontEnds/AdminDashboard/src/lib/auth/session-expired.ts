import { isLoginPath } from '@/lib/auth/routes';
import { expireClientSession, isLogoutPending } from '@/lib/auth/logout-client';
import { navigateToLogin } from '@/lib/auth/auth-navigation';

let redirectScheduled = false;
let expiryToastShown = false;

/** Navigate to login (SPA when AuthProvider registered; avoids duplicate redirects). */
export function redirectToLogin(redirectPath?: string | null): void {
  if (typeof window === 'undefined') return;
  if (isLoginPath(window.location.pathname)) return;
  if (isLogoutPending()) return;

  if (redirectScheduled) return;
  redirectScheduled = true;
  navigateToLogin(redirectPath);
}

/** Clear stale auth state and send the user to login once (prevents login/dashboard loops). */
export function expireSessionAndRedirectToLogin(redirectPath?: string | null): void {
  expireClientSession();
  redirectToLogin(redirectPath);
}

export function shouldShowSessionExpiredToast(): boolean {
  if (expiryToastShown) return false;
  expiryToastShown = true;
  return true;
}

export function resetSessionExpiredToast(): void {
  expiryToastShown = false;
}

function isPublicLiveRoomPage(pathname: string): boolean {
  return pathname === '/room' || pathname.startsWith('/room/');
}

function isRoomSeatApiUrl(url: string): boolean {
  return /(^|\/)room(\/|$|\?)/i.test(url.toLowerCase());
}

/**
 * Whether a failed API call should send the user to login.
 * Skips login page, session probe, and all requests on live room pages.
 */
export function shouldRedirectOnAuthFailure(requestUrl: string | undefined): boolean {
  if (typeof window === 'undefined') return false;
  if (isLoginPath(window.location.pathname)) return false;
  if (isPublicLiveRoomPage(window.location.pathname)) return false;

  const url = String(requestUrl ?? '').toLowerCase();
  if (url.includes('get-user') || url.includes('verify-session')) return false;

  if (isPublicLiveRoomPage(window.location.pathname) && isRoomSeatApiUrl(url)) {
    return false;
  }

  return true;
}

export function resetLoginRedirectGuard(): void {
  redirectScheduled = false;
  resetSessionExpiredToast();
}

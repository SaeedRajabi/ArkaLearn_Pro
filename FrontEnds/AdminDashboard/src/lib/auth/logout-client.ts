import { clearSessionHint } from '@/lib/auth/session-storage';
import { resetLoginRedirectGuard } from '@/lib/auth/session-expired';
import { clearRoomAccessToken } from '@/lib/room-access-token';
import { clearRoomJoinTicket } from '@/lib/room-join-ticket';
import { useAuthStore } from '@/stores/auth-store';

const LOGOUT_PENDING_KEY = 'edcentral-logout-pending';
const FORCE_RELOGIN_KEY = 'edcentral-auth-force-relogin';

/** Set before navigation so session bootstrap does not re-login from stale cookies. */
export function markLogoutPending(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(LOGOUT_PENDING_KEY, '1');
}

export function isLogoutPending(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(LOGOUT_PENDING_KEY) === '1';
}

/** Returns true once per logout flow (consumes the flag). */
export function consumeLogoutPending(): boolean {
  if (typeof window === 'undefined') return false;
  const pending = sessionStorage.getItem(LOGOUT_PENDING_KEY) === '1';
  if (pending) sessionStorage.removeItem(LOGOUT_PENDING_KEY);
  return pending;
}

/** Best-effort removal of dashboard auth cookies on the current host. */
export function clearAuthCookiesClient(): void {
  if (typeof document === 'undefined') return;

  const names = ['AuthCookie', 'authToken', '.AspNetCore.Cookies', '.AspNetCore.Cookie'];
  const paths = ['/', '/svc', '/api', '/svc/Service'];
  const sameSiteVariants = ['None', 'Lax', 'Strict'];
  const host = window.location.hostname;
  const domains: string[] = [];
  if (host) {
    domains.push(host);
    if (host.startsWith('www.')) {
      domains.push(host.slice(4));
    } else if (!host.startsWith('localhost') && !host.startsWith('127.')) {
      domains.push(`www.${host}`);
    }
  }

  const expire = 'Thu, 01 Jan 1970 00:00:00 GMT';

  for (const name of names) {
    for (const path of paths) {
      for (const sameSite of sameSiteVariants) {
        const securePart = sameSite === 'None' ? '; Secure' : '';
        document.cookie = `${name}=; expires=${expire}; path=${path}; SameSite=${sameSite}${securePart}`;
        document.cookie = `${name}=; Max-Age=0; path=${path}; SameSite=${sameSite}${securePart}`;
        for (const domain of domains) {
          document.cookie = `${name}=; expires=${expire}; path=${path}; domain=${domain}; SameSite=${sameSite}${securePart}`;
          document.cookie = `${name}=; Max-Age=0; path=${path}; domain=${domain}; SameSite=${sameSite}${securePart}`;
        }
      }
    }
  }
}

export function markForceRelogin(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(FORCE_RELOGIN_KEY, '1');
}

export function isForceRelogin(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(FORCE_RELOGIN_KEY) === '1';
}

export function clearForceRelogin(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(FORCE_RELOGIN_KEY);
}

/**
 * Clears stale client auth without marking a full logout navigation.
 * Use when the server session is gone but the user should sign in again.
 */
export function expireClientSession(): void {
  clearSessionHint();
  clearRoomAccessToken();
  clearRoomJoinTicket();
  clearAuthCookiesClient();
  markForceRelogin();
  useAuthStore.getState().clearSession();
}

export function clearAllClientAuthState(): void {
  clearSessionHint();
  clearRoomAccessToken();
  clearRoomJoinTicket();
  clearAuthCookiesClient();
  clearForceRelogin();
  resetLoginRedirectGuard();
}

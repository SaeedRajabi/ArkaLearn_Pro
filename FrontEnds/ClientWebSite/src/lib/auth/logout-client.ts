import { clearAuthData } from '@/lib/auth';

const LOGOUT_PENDING_KEY = 'arka-logout-pending';

/** Prevents session bootstrap from restoring auth immediately after logout. */
export function markLogoutPending(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(LOGOUT_PENDING_KEY, '1');
}

export function isLogoutPending(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(LOGOUT_PENDING_KEY) === '1';
}

export function consumeLogoutPending(): boolean {
  if (typeof window === 'undefined') return false;
  const pending = sessionStorage.getItem(LOGOUT_PENDING_KEY) === '1';
  if (pending) sessionStorage.removeItem(LOGOUT_PENDING_KEY);
  return pending;
}

/** Best-effort removal of auth cookies on the current host (HttpOnly cookies need server delete). */
export function clearAuthCookiesClient(): void {
  if (typeof document === 'undefined') return;

  const names = ['AuthCookie', 'authToken', '.AspNetCore.Cookies', '.AspNetCore.Cookie'];
  const paths = ['/', '/api', '/api/Service', '/svc', '/svc/Service'];
  const sameSiteVariants = ['None', 'Lax', 'Strict'];
  const host = window.location.hostname;
  const domainVariants: (string | undefined)[] = [undefined, host];
  if (host.startsWith('www.')) {
    domainVariants.push(host.slice(4));
  } else if (host && !host.startsWith('localhost') && !host.startsWith('127.')) {
    domainVariants.push(`www.${host}`);
  }

  const expire = 'Thu, 01 Jan 1970 00:00:00 GMT';

  for (const name of names) {
    for (const path of paths) {
      for (const domain of domainVariants) {
        for (const sameSite of sameSiteVariants) {
          const domainPart = domain ? `; domain=${domain}` : '';
          const securePart = sameSite === 'None' ? '; Secure' : '';
          const base = `${name}=; expires=${expire}; path=${path}${domainPart}; SameSite=${sameSite}${securePart}`;
          document.cookie = base;
          document.cookie = `${name}=; Max-Age=0; path=${path}${domainPart}; SameSite=${sameSite}${securePart}`;
        }
      }
    }
  }
}

/** Clears all client-side auth artifacts. */
export function clearAllClientAuthState(): void {
  clearAuthData();
  clearAuthCookiesClient();
}

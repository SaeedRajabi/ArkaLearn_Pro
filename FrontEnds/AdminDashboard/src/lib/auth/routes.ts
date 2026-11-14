/** Canonical login URL for the admin dashboard (site root). */
export const LOGIN_PATH = '/';

export function loginPathWithRedirect(redirectPath?: string | null): string {
  if (!redirectPath || redirectPath === LOGIN_PATH) return LOGIN_PATH;
  return `${LOGIN_PATH}?redirect=${encodeURIComponent(redirectPath)}`;
}

export function isLoginPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p === '/' || p === '/login' || p === '/mono-administrator';
}

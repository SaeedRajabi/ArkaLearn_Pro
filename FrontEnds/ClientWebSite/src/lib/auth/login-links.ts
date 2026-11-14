import { isAuthPath } from '@/lib/auth/auth-paths';

/** Build login URL; omit returnUrl for home and auth pages so post-login goes to dashboard. */
export function buildLoginHref(pathname: string | null | undefined): string {
  if (!pathname || pathname === '/' || isAuthPath(pathname)) return '/login';
  return `/login?returnUrl=${encodeURIComponent(pathname)}`;
}

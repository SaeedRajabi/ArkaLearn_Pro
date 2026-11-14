/** Routes that require an authenticated session. */
export const PROTECTED_PATH_PREFIXES = [
  '/account',
  '/professor',
  '/checkout',
  '/learning',
  '/invoices',
  '/payments',
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((route) => pathname.startsWith(route));
}

/** After intentional logout, send the user to the home page instead of login. */
export function shouldRedirectHomeOnLogout(pathname: string): boolean {
  if (pathname === '/support' || pathname.startsWith('/support/')) return true;
  return isProtectedPath(pathname);
}

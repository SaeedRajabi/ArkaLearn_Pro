const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'] as const;

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((path) => pathname === path || pathname.endsWith(path));
}

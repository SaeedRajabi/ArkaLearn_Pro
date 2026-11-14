export type NormalizedRole = 'admin' | 'teacher' | 'student' | 'user';

export function normalizeUserRole(role: string | null | undefined): NormalizedRole {
  const value = (role ?? '').trim().toLowerCase();
  if (value === 'admin' || value === 'administrator' || value === '3') return 'admin';
  if (value === 'teacher' || value === 'professor' || value === '2') return 'teacher';
  if (value === 'student' || value === '1') return 'student';
  return 'user';
}

/** Site owner admin uses the professor dashboard on the client site. */
export function isAdminRole(role: string | null | undefined): boolean {
  return normalizeUserRole(role) === 'admin';
}

export function isProfessorRole(role: string | null | undefined): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === 'teacher' || normalized === 'admin';
}

export function isStudentRole(role: string | null | undefined): boolean {
  return normalizeUserRole(role) === 'student';
}

export function getDefaultDashboardPath(role: string | null | undefined): string {
  return isProfessorRole(role) ? '/professor' : '/account';
}

/** Ignore home/auth pages — those should fall through to the role dashboard. */
export function isMeaningfulReturnUrl(returnUrl?: string | null): boolean {
  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) return false;
  const path = (returnUrl.split('?')[0] ?? '').replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/login' || path === '/register' || path === '/forgot-password' || path === '/reset-password') {
    return false;
  }
  return true;
}

export function resolvePostLoginPath(
  role: string | null | undefined,
  returnUrl?: string | null
): string {
  if (isMeaningfulReturnUrl(returnUrl)) {
    if (isProfessorRole(role) && returnUrl!.startsWith('/account')) return '/professor';
    if (isStudentRole(role) && !isAdminRole(role) && returnUrl!.startsWith('/professor')) {
      return '/account';
    }
    return returnUrl!;
  }
  return getDefaultDashboardPath(role);
}

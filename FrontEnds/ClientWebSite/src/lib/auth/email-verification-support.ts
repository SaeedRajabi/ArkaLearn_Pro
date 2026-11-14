'use client';

export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === 'admin' || r === '3';
}

export function isTeacherRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === 'teacher' || r === '2' || r === 'professor';
}

export function profileSettingsHref(role: string | null | undefined): string {
  return isTeacherRole(role) ? '/professor/profile' : '/account?view=profile';
}

export function requiresEmailVerificationForSupport(
  role: string | null | undefined,
  emailVerified?: boolean
): boolean {
  if (isAdminRole(role)) return false;
  return !emailVerified;
}

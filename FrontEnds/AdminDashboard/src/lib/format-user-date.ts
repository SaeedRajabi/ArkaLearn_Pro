import { format } from 'date-fns';
import type { User } from '@/lib/types';

export function tryParseApiDate(value: string | undefined | null): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateSafe(
  date: Date | null | undefined,
  pattern: string,
  fallback = '—'
): string {
  if (!date || Number.isNaN(date.getTime())) return fallback;
  try {
    return format(date, pattern);
  } catch {
    return fallback;
  }
}

export function formatUserRegistrationDate(
  user: Pick<User, 'registrationDate' | 'registrationDateLabel'>
): string {
  if (user.registrationDateLabel?.trim()) return user.registrationDateLabel.trim();
  return formatDateSafe(user.registrationDate, 'PPP');
}

export function formatUserLastLogin(user: Pick<User, 'lastLogin' | 'lastLoginLabel'>): string {
  if (user.lastLoginLabel?.trim()) return user.lastLoginLabel.trim();
  return formatDateSafe(user.lastLogin, 'PPP p');
}

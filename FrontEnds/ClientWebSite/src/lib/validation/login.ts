const ENGLISH_USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidLoginIdentifier(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (EMAIL_REGEX.test(trimmed)) return true;
  return ENGLISH_USERNAME_REGEX.test(trimmed);
}

export function normalizeLoginIdentifier(value: string): string {
  const trimmed = value.trim();
  if (EMAIL_REGEX.test(trimmed)) return trimmed.toLowerCase();
  return trimmed;
}

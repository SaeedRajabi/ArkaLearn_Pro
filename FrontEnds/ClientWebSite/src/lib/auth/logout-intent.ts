const AUTH_LOGOUT_INTENT_KEY = 'auth_intentional_logout';
const LOGOUT_INTENT_MAX_AGE_MS = 5_000;

export function markIntentionalLogout(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_LOGOUT_INTENT_KEY, String(Date.now()));
}

export function consumeIntentionalLogout(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = sessionStorage.getItem(AUTH_LOGOUT_INTENT_KEY);
  if (!raw) return false;
  sessionStorage.removeItem(AUTH_LOGOUT_INTENT_KEY);
  const ts = Number(raw);
  return Number.isFinite(ts) && Date.now() - ts <= LOGOUT_INTENT_MAX_AGE_MS;
}

export function hasIntentionalLogout(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = sessionStorage.getItem(AUTH_LOGOUT_INTENT_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts) || Date.now() - ts > LOGOUT_INTENT_MAX_AGE_MS) {
    sessionStorage.removeItem(AUTH_LOGOUT_INTENT_KEY);
    return false;
  }
  return true;
}

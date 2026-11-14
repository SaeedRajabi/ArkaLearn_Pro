import { loginPathWithRedirect } from '@/lib/auth/routes';

type NavigateToLoginFn = (redirectPath?: string | null) => void;

let navigateToLoginFn: NavigateToLoginFn | null = null;

/** Register SPA navigation from AuthProvider (falls back to full page load). */
export function registerNavigateToLogin(fn: NavigateToLoginFn | null): void {
  navigateToLoginFn = fn;
}

export function navigateToLogin(redirectPath?: string | null): void {
  if (typeof window === 'undefined') return;

  if (navigateToLoginFn) {
    navigateToLoginFn(redirectPath);
    return;
  }

  window.location.href = loginPathWithRedirect(
    redirectPath ?? window.location.pathname
  );
}

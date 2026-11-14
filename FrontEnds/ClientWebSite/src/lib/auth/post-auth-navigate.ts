import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { suppressNavigationLoading } from '@/lib/auth/navigation-suppress';

/** Soft SPA navigation after logout — keeps Header/Footer mounted (no full reload). */
export function postLogoutNavigate(router: AppRouterInstance, target = '/'): void {
  suppressNavigationLoading(5000);
  router.replace(target);
  // Warm home for subsequent visits / back-forward.
  try {
    router.prefetch(target);
  } catch {
    /* ignore */
  }
}

/** Soft SPA navigation after login — prefetch target in parallel with navigation. */
export function postAuthNavigate(router: AppRouterInstance, target: string): void {
  suppressNavigationLoading(4000);
  try {
    router.prefetch(target);
  } catch {
    /* ignore */
  }
  router.replace(target);
}

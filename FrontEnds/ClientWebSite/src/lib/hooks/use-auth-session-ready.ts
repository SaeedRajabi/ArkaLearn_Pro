'use client';

import { useAuth } from '@/contexts/auth-context';
import type { CurrentUser } from '@/lib/api/account';

/**
 * Auth is usable for authenticated UI once storage hydration finished and a session exists.
 * Background session revalidation (focus / interval) must NOT flip isReady or isBootstrapping —
 * that causes dashboard skeletons to flash repeatedly.
 */
export function useAuthSessionReady(): {
  user: CurrentUser | null;
  isReady: boolean;
  isBootstrapping: boolean;
  refetch: () => Promise<void>;
} {
  const { user, isLoading, isValidating, isAuthenticated, refetch } = useAuth();
  const hasSession = Boolean(user) || isAuthenticated;

  return {
    user,
    isReady: !isLoading && hasSession,
    isBootstrapping: isLoading || (isValidating && !hasSession),
    refetch,
  };
}

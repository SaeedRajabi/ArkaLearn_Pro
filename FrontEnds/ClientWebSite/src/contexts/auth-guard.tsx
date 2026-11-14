'use client';

import { useAuth } from '@/contexts/auth-context';
import { consumeIntentionalLogout, hasIntentionalLogout } from '@/lib/auth/logout-intent';
import { isProtectedPath } from '@/lib/auth/protected-routes';
import { buildLoginRedirectUrl } from '@/lib/auth/session-expired';
import { postLogoutNavigate } from '@/lib/auth/post-auth-navigate';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Protects dashboard routes.
 * Intentional logout uses soft navigation to home (no hard reload / empty shell).
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const lastChildrenRef = useRef<ReactNode>(children);

  if (user) {
    lastChildrenRef.current = children;
  }

  useEffect(() => {
    if (user) return;

    if (consumeIntentionalLogout()) {
      postLogoutNavigate(router, '/');
      return;
    }

    if (!isProtectedPath(pathname)) return;
    if (isLoading) return;

    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(buildLoginRedirectUrl(pathname, search));
  }, [user, isLoading, pathname, router]);

  // Keep last dashboard frame during logout soft-nav (no empty main under Header/Footer).
  if (!user && hasIntentionalLogout() && isProtectedPath(pathname)) {
    return <>{lastChildrenRef.current}</>;
  }

  if (isLoading && !user) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    if (isProtectedPath(pathname)) {
      return (
        <div className="flex min-h-[40vh] w-full items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

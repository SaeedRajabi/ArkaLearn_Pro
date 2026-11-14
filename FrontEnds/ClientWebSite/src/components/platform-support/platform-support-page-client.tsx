'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PlatformSupportWorkspace } from '@/components/platform-support/platform-support-workspace';
import { useAuth } from '@/contexts/auth-context';
import { hasIntentionalLogout } from '@/lib/auth/logout-intent';
import type { Dictionary } from '@/types';

export function PlatformSupportPageClient({ dict }: { dict: Dictionary }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoading) return;
    if (user) return;

    if (hasIntentionalLogout()) {
      router.replace('/');
      return;
    }

    const qs = searchParams.toString();
    const returnPath = qs ? `${pathname}?${qs}` : pathname || '/support';
    router.replace(`/login?returnUrl=${encodeURIComponent(returnPath)}`);
  }, [isLoading, user, router, pathname, searchParams]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <PlatformSupportWorkspace dict={dict} />
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { hasIntentionalLogout } from '@/lib/auth/logout-intent';
import { isProfessorRole } from '@/lib/auth/roles';
import { Loader2 } from 'lucide-react';

export function ProfessorRoleGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if ((isLoading && !user) || !user) return;
    if (!isProfessorRole(user.role)) {
      router.replace('/account');
    }
  }, [user, isLoading, router]);

  if (!user && hasIntentionalLogout()) {
    return <>{children}</>;
  }

  if (isLoading && !user) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isProfessorRole(user.role)) {
    return null;
  }

  return <>{children}</>;
}

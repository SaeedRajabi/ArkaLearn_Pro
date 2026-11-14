'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

export function useRequireVerifiedEmail(dict?: Dictionary) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const t = (key: string, fallback: string) =>
    dict ? getDictValue(dict, key, fallback) : fallback;

  const isVerified = Boolean(user?.emailVerified);
  const needsVerification =
    isAuthenticated && !isLoading && user?.role !== 'admin' && user?.emailVerified === false;

  const requireVerifiedEmail = useCallback(() => {
    if (isLoading) return false;
    if (!isAuthenticated) return false;
    if (user?.role === 'admin') return true;
    if (user?.emailVerified) return true;

    toast({
      variant: 'destructive',
      title: t('dashboard.email.verifyRequiredTitle', 'Verify your email'),
      description: t(
        'dashboard.email.verifyRequiredDescription',
        'Please verify your email from your profile before using this feature.'
      ),
    });
    return false;
  }, [isAuthenticated, isLoading, t, toast, user?.emailVerified, user?.role]);

  return { requireVerifiedEmail, isVerified, needsVerification };
}

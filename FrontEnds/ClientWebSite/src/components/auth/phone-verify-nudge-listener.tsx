'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { consumePhoneVerifyNudge } from '@/lib/api/account';
import { useLanguage } from '@/contexts/language-context';

/** Shows a one-shot toast after Google (or other) login when phone is unverified. */
export function PhoneVerifyNudgeListener() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (user.phoneNumberVerified) return;
    if (!consumePhoneVerifyNudge()) return;

    toast({
      title: t('phoneVerifyWarningTitle', 'Verify your phone number'),
      description: t(
        'phoneVerifyWarningDescription',
        'Please verify your phone number so you can receive notifications about your students and account activity.'
      ),
    });
  }, [isAuthenticated, user?.id, user?.phoneNumberVerified, t, toast]);

  return null;
}

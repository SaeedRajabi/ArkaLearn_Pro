'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

type PhoneVerifyBannerProps = {
  dict?: Dictionary;
  /** Student dashboard uses query/view; professor uses /professor/profile */
  href: string;
  className?: string;
};

export function PhoneVerifyBanner({ dict, href, className }: PhoneVerifyBannerProps) {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user?.id) return null;
  if (user.phoneNumberVerified) return null;

  const title =
    getDictValue(dict, 'phoneVerifyWarningTitle', '') ||
    t('phoneVerifyWarningTitle', 'Verify your phone number');
  const description =
    getDictValue(dict, 'phoneVerifyWarningDescription', '') ||
    t(
      'phoneVerifyWarningDescription',
      'Please verify your phone number so you can receive notifications about your students and account activity.'
    );
  const actionLabel =
    getDictValue(dict, 'phoneVerifyWarningAction', '') ||
    t('phoneVerifyWarningAction', 'Verify phone');

  return (
    <Alert variant="info" className={className}>
      <Phone className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{description}</span>
        <Button asChild size="sm" variant="secondary" className="shrink-0">
          <Link href={href}>{actionLabel}</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

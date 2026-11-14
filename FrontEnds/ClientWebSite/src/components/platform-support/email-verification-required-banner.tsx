'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

export function EmailVerificationRequiredBanner({
  dict,
  profileHref,
}: {
  dict: Dictionary;
  profileHref: string;
}) {
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
      <p className="font-medium text-destructive">
        {t('platform_support.email_required_title', 'Email verification required')}
      </p>
      <p className="mt-1 text-muted-foreground">
        {t(
          'platform_support.email_required_desc',
          'You must verify your email before creating or replying to support tickets.'
        )}
      </p>
      <Button asChild variant="outline" size="sm" className="mt-3">
        <Link href={profileHref}>{t('platform_support.go_verify_email', 'Verify email in profile')}</Link>
      </Button>
    </div>
  );
}

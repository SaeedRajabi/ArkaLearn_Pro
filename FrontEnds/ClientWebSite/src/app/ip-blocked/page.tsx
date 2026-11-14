'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

export default function IpBlockedPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <ShieldAlert className="mb-4 h-14 w-14 text-destructive" />
      <h1 className="text-2xl font-bold">{t('ipBlocked.title')}</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">{t('ipBlocked.description')}</p>
      <Button asChild className="mt-6">
        <Link href="/support/ip-unblock">{t('ipBlocked.requestUnblock')}</Link>
      </Button>
    </div>
  );
}

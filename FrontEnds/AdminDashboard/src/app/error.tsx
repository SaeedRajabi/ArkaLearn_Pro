'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertOctagon } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertOctagon className="h-16 w-16 text-destructive" />
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight">{t('page_error_oops')}</h1>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t('toast_error_title')}</h2>
          <p className="text-muted-foreground text-sm">
            {error.message || t('toast_error_description')}
          </p>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => reset()} variant="default">
            {t('page_error_try_again')}
          </Button>
          <Button onClick={() => (window.location.href = 'https://arkasoftware.ir')} variant="outline">
            {t('page_error_go_home')}
          </Button>
        </div>
      </div>
    </div>
  );
}

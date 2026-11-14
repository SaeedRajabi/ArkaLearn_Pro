'use client';

import * as React from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useBackendStatus } from '@/contexts/backend-status-context';
import { WaveDotsLoader } from './wave-dots-loader';

export function SiteUpdateOverlay() {
  const { phase } = useBackendStatus();
  const { t } = useLanguage();

  const visible = phase === 'offline';

  React.useEffect(() => {
    if (!visible) {
      document.documentElement.classList.remove('site-backend-overlay-open');
      document.body.style.overflow = '';
      return;
    }

    document.documentElement.classList.add('site-backend-overlay-open');
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.classList.remove('site-backend-overlay-open');
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible) return null;

  const title = t('siteUpdate.title', 'سایت در حال به‌روزرسانی است');
  const description = t(
    'siteUpdate.description',
    'لطفاً چند لحظه صبر کنید. در حال برقراری مجدد ارتباط با سرور هستیم.'
  );
  const loadingLabel = t('siteUpdate.loading', 'در حال بارگذاری...');

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="site-update-title"
      aria-describedby="site-update-description"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="mx-auto w-full max-w-lg rounded-2xl border bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <WaveDotsLoader phase="loading" />
        </div>

        <h2 id="site-update-title" className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p id="site-update-description" className="mt-4 leading-7 text-muted-foreground">
          {description}
        </p>
        <p className="mt-6 text-sm text-muted-foreground">{loadingLabel}</p>
      </div>
    </div>
  );
}

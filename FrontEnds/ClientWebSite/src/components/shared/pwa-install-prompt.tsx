'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { BRAND_ICON_192_PATH } from '@/lib/seo/brand';
import {
  isPwaInstalled,
  isPwaInstallPermanentlyDismissed,
  setPwaInstallPermanentlyDismissed,
} from '@/lib/pwa/install-prompt-storage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaInstallPromptProps {
  dict: Dictionary;
  lang?: 'en' | 'fa';
}

export function PwaInstallPrompt({ dict, lang = 'fa' }: PwaInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const isRtl = lang === 'fa';

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const hidePermanentlyIfChecked = useCallback(() => {
    if (doNotShowAgain) setPwaInstallPermanentlyDismissed();
  }, [doNotShowAgain]);

  useEffect(() => {
    if (isPwaInstalled() || isPwaInstallPermanentlyDismissed()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      if (isPwaInstalled() || isPwaInstallPermanentlyDismissed()) return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const onInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      setPwaInstallPermanentlyDismissed();
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setPwaInstallPermanentlyDismissed();
      setShowPrompt(false);
    }
    hidePermanentlyIfChecked();
    setDeferredPrompt(null);
    if (outcome !== 'accepted') setShowPrompt(false);
  };

  const handleDismiss = () => {
    hidePermanentlyIfChecked();
    setShowPrompt(false);
  };

  if (isPwaInstalled() || !showPrompt || !deferredPrompt) return null;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="rounded-xl border bg-card p-4 text-sm shadow-sm font-body"
      role="region"
      aria-label={t('pwa.installTitle', 'Install app')}
    >
      <div className="flex items-start gap-3">
        <Image
          src={BRAND_ICON_192_PATH}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-xl"
          unoptimized
        />
        <div className="min-w-0 flex-1">
      <p className="font-semibold text-foreground">
        {t('pwa.installTitle', 'Install app on your device')}
      </p>
      <p className="mt-1 text-muted-foreground">
        {t('pwa.installDescription', 'Add ArkaSoftware to your home screen for faster access.')}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Checkbox
          id="pwa-never-show"
          checked={doNotShowAgain}
          onCheckedChange={(v) => setDoNotShowAgain(v === true)}
        />
        <Label htmlFor="pwa-never-show" className="cursor-pointer text-sm font-normal">
          {t('pwa.doNotShowAgain', 'Do not show again')}
        </Label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleDismiss}>
          {t('pwa.later', 'Later')}
        </Button>
        <Button size="sm" onClick={() => void handleInstall()}>
          <Download className={isRtl ? 'ml-1 h-4 w-4' : 'mr-1 h-4 w-4'} />
          {t('pwa.install', 'Install')}
        </Button>
      </div>
        </div>
      </div>
    </div>
  );
}

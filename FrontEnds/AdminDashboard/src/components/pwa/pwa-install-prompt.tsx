'use client';

import * as React from 'react';
import Image from 'next/image';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/components/language-provider';
import {
  isPwaInstalled,
  isPwaInstallPermanentlyDismissed,
  setPwaInstallPermanentlyDismissed,
} from '@/lib/pwa/install-prompt-storage';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaInstallPrompt() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [permanentlyDismissed, setPermanentlyDismissed] = React.useState(() =>
    typeof window !== 'undefined' ? isPwaInstallPermanentlyDismissed() : false
  );
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [doNotShowAgain, setDoNotShowAgain] = React.useState(false);

  React.useEffect(() => {
    if (isPwaInstalled() || isPwaInstallPermanentlyDismissed()) {
      setPermanentlyDismissed(true);
      setShowPrompt(false);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      if (isPwaInstallPermanentlyDismissed()) {
        setPermanentlyDismissed(true);
        setShowPrompt(false);
        return;
      }
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const dismiss = () => {
    if (doNotShowAgain) {
      setPwaInstallPermanentlyDismissed();
      setPermanentlyDismissed(true);
    }
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    dismiss();
  };

  if (isPwaInstalled() || permanentlyDismissed || !showPrompt || !deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-md rounded-lg border bg-card p-4 shadow-lg sm:left-auto sm:right-4"
      role="region"
      aria-label={t('pwa_install_title')}
    >
      <div className="flex items-start gap-3">
        <Image
          src="/icons/icon.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-md"
          unoptimized
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold">{t('pwa_install_title')}</p>
          <p className="text-xs text-muted-foreground">{t('pwa_install_description')}</p>
          <div className="flex items-center gap-2">
            <Checkbox
              id="admin-pwa-never-show"
              checked={doNotShowAgain}
              onCheckedChange={(v) => setDoNotShowAgain(v === true)}
            />
            <Label htmlFor="admin-pwa-never-show" className="cursor-pointer text-xs font-normal">
              {t('pwa_install_never_show')}
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => void install()}>
              {t('pwa_install_action')}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={dismiss}>
              {t('pwa_install_dismiss')}
            </Button>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={dismiss}>
          <X className="h-4 w-4" aria-hidden />
          <span className="sr-only">{t('pwa_install_dismiss')}</span>
        </Button>
      </div>
    </div>
  );
}

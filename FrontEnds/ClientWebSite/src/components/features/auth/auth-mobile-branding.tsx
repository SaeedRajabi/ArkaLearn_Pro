'use client';

import { useEffect, useState } from 'react';
import { Logo } from '@/components/shared/logo';
import { isPwaInstalled } from '@/lib/pwa/install-prompt-storage';
import { cn } from '@/lib/utils';
import type { AuthLayoutCopy } from './auth-layout';

interface AuthMobileBrandingProps {
  copy: AuthLayoutCopy;
  dir: 'ltr' | 'rtl';
}

export function AuthMobileBranding({ copy, dir }: AuthMobileBrandingProps) {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isPwaInstalled());
  }, []);

  return (
    <div
      dir={dir}
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary to-primary/90 px-6 py-10 text-primary-foreground lg:hidden',
        standalone && 'lg:block'
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative z-10 mx-auto max-w-md">
        <div className="mb-6">
          <Logo className="text-primary-foreground [&_span]:text-primary-foreground" />
        </div>
        <h1 className="font-headline text-2xl font-bold leading-tight sm:text-3xl">
          {copy.welcomeTitle}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
          {copy.welcomeSubtitle}
        </p>
        <p className="mt-4 text-xs font-medium text-primary-foreground/70">
          {copy.welcomeSocialProof}
        </p>
      </div>
    </div>
  );
}

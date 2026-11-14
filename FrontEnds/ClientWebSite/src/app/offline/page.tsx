'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { BRAND_ICON_192_PATH } from '@/lib/seo/brand';

export default function OfflinePage() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verifyConnection = async () => {
      if (!navigator.onLine) {
        setIsChecking(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`/manifest.json?offline-check=${Date.now()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!cancelled && response.ok) {
          window.location.replace('/');
        }
      } catch {
        if (!cancelled) {
          setIsChecking(false);
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    verifyConnection();
    window.addEventListener('online', verifyConnection);

    return () => {
      cancelled = true;
      window.removeEventListener('online', verifyConnection);
    };
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <Image
        src={BRAND_ICON_192_PATH}
        alt="ArkaSoftware"
        width={64}
        height={64}
        className="h-16 w-16 rounded-2xl"
        unoptimized
      />
      <div className="rounded-full bg-muted p-6">
        <WifiOff className="h-16 w-16 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold">اتصال اینترنت برقرار نیست</h1>
        <p className="mt-2 text-muted-foreground">
          {isChecking
            ? 'در حال بررسی اتصال اینترنت...'
            : 'لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید.'}
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        تلاش مجدد
      </Link>
    </div>
  );
}

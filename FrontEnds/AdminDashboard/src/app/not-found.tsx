'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="mx-auto w-full max-w-4xl text-center">
        <Image
          src="/images/elements/error404-01.png"
          alt={t('page_not_found_title')}
          width={760}
          height={430}
          priority
          className="mx-auto mb-6 h-auto w-full max-w-[520px] md:max-w-[680px]"
        />

        <h1 className="mb-1 text-6xl font-bold tracking-tight text-destructive md:text-7xl">
          404
        </h1>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold md:text-3xl">{t('page_not_found_title')}</h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
            {t('page_not_found_description')}
          </p>
        </div>

        <div className="pt-7">
          <Button asChild className="w-full sm:w-auto">
            <Link href="https://arkasoftware.ir">{t('page_not_found_return_home')}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { PlatformSupportPageClient } from '@/components/platform-support/platform-support-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'پشتیبانی سایت',
  description: 'تیکت پشتیبانی آرکا نرم افزار',
  path: '/support',
  noIndex: true,
});

export default async function SupportPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return (
    <Suspense fallback={<div className="container mx-auto max-w-6xl px-4 py-8" />}>
      <PlatformSupportPageClient dict={dict} />
    </Suspense>
  );
}

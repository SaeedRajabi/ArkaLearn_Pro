import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorSupportPageClient } from '@/components/professor/support/professor-support-page-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = buildPageMetadata({
  title: 'پشتیبانی دانشجویان',
  description: 'پاسخ به سوالات دانشجویان',
  path: '/professor/support',
  noIndex: true,
});

export default async function ProfessorSupportPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return (
    <Suspense fallback={<Skeleton className="h-[min(calc(100dvh-8rem),920px)] w-full rounded-xl" />}>
      <ProfessorSupportPageClient dict={dict} />
    </Suspense>
  );
}

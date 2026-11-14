import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorExamsPageClient } from '@/components/professor/exams/professor-exams-page-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = buildPageMetadata({
  title: 'امتحانات استاد',
  description: 'مدیریت امتحانات استاد',
  path: '/professor/exams',
  noIndex: true,
});

export default async function ProfessorExamsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <ProfessorExamsPageClient dict={dict} />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorQuestionBankPageClient } from '@/components/professor/question-bank/professor-question-bank-page-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = buildPageMetadata({
  title: 'بانک سوالات',
  description: 'مدیریت بانک سوالات امتحانی',
  path: '/professor/question-bank',
  noIndex: true,
});

export default async function ProfessorQuestionBankPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <ProfessorQuestionBankPageClient dict={dict} />
    </Suspense>
  );
}

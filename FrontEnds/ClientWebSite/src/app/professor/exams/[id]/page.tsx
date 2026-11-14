import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorExamDetailPageClient } from '@/components/professor/exams/professor-exam-detail-page-client';
import { Skeleton } from '@/components/ui/skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildPageMetadata({
    title: 'جزئیات امتحان',
    description: 'جزئیات و تصحیح امتحان',
    path: `/professor/exams/${id}`,
    noIndex: true,
  });
}

export default async function ProfessorExamDetailPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <ProfessorExamDetailPageClient dict={dict} examId={Number(id)} />
    </Suspense>
  );
}

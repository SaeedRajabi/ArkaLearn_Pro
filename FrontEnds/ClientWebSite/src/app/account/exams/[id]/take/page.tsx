import type { Metadata } from 'next';

import { cookies } from 'next/headers';

import { getDictionary } from '@/lib/i18n';

import { buildPageMetadata } from '@/lib/seo';

import { StudentExamTakePageClient } from '@/components/account/exams/student-exam-take-page-client';



type Props = { params: Promise<{ id: string }> };



export async function generateMetadata({ params }: Props): Promise<Metadata> {

  const { id } = await params;

  return buildPageMetadata({

    title: 'شرکت در آزمون',

    description: 'صفحه شرکت در آزمون',

    path: `/account/exams/${id}/take`,

    noIndex: true,

  });

}



export default async function StudentExamTakePage({ params }: Props) {

  const { id } = await params;

  const cookieStore = await cookies();

  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';

  const dict = await getDictionary(lang);

  return <StudentExamTakePageClient dict={dict} examId={Number(id)} />;

}


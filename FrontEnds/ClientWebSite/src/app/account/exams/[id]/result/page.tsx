import type { Metadata } from 'next';

import { StudentExamResultRedirect } from '@/components/account/exams/student-exam-result-redirect';

import { buildPageMetadata } from '@/lib/seo';



type Props = { params: Promise<{ id: string }> };



export async function generateMetadata({ params }: Props): Promise<Metadata> {

  const { id } = await params;

  return buildPageMetadata({

    title: 'نتیجه آزمون',

    description: 'نتیجه آزمون دانشجو',

    path: `/account/exams/${id}/result`,

    noIndex: true,

  });

}



export default async function StudentExamResultPage({ params }: Props) {

  const { id } = await params;

  return <StudentExamResultRedirect attemptId={Number(id)} />;

}


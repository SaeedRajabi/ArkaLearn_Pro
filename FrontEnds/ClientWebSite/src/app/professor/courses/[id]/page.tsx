import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorCourseDetailPageClient } from '@/components/professor/courses/professor-course-detail-page-client';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildPageMetadata({
    title: `جزئیات دوره ${id}`,
    description: 'جزئیات دوره استاد',
    path: `/professor/courses/${id}`,
    noIndex: true,
  });
}

export default async function ProfessorCourseDetailPage({ params }: Props) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId) || courseId <= 0) notFound();

  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return <ProfessorCourseDetailPageClient dict={dict} courseId={courseId} />;
}

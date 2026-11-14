import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorCourseDesktopLicensePageClient } from '@/components/professor/courses/professor-course-desktop-license-page-client';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildPageMetadata({
    title: `لایسنس دسکتاپ دوره ${id}`,
    description: 'تنظیمات واترمارک، لایسنس و تحلیل دوره دسکتاپ',
    path: `/professor/courses/${id}/desktop`,
    noIndex: true,
  });
}

export default async function ProfessorCourseDesktopLicensePage({ params }: Props) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId) || courseId <= 0) notFound();

  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return <ProfessorCourseDesktopLicensePageClient dict={dict} courseId={courseId} />;
}

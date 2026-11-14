import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorManagedStudentFilesPageClient } from '@/components/professor/online-rooms/professor-managed-student-files-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'فایل‌های دانشجو',
  description: 'مدیریت فایل‌های دانشجو برای اتاق آنلاین',
  path: '/professor/room-students',
  noIndex: true,
});

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string; from?: string }>;
};

export default async function ProfessorRoomStudentFilesPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { name, from } = await searchParams;
  const studentId = Number(id);
  if (!studentId || Number.isNaN(studentId)) notFound();

  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return (
    <ProfessorManagedStudentFilesPageClient
      dict={dict}
      studentId={studentId}
      studentName={name ? decodeURIComponent(name) : undefined}
      returnTo={from === 'students' ? '/professor/students' : '/professor/online-rooms'}
    />
  );
}

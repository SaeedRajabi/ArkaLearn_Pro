import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorCoursesPageClient } from '@/components/professor/courses/professor-courses-page-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = buildPageMetadata({
  title: 'دوره‌های استاد',
  description: 'مدیریت دوره‌های استاد',
  path: '/professor/courses',
  noIndex: true,
});

function CoursesFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-12 w-full max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default async function ProfessorCoursesPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return (
    <Suspense fallback={<CoursesFallback />}>
      <ProfessorCoursesPageClient dict={dict} />
    </Suspense>
  );
}

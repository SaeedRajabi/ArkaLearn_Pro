import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { getClusterKeywords } from '@/lib/seo/keyword-clusters';
import { CoursesPageClient } from '@/components/courses-page-client';
import { getCoursesList, getPublicCategoryTree } from '@/lib/data-server';
import { pageLayout } from '@/lib/utils/page-layout';
import { cn } from '@/lib/utils';

export const metadata: Metadata = buildPageMetadata({
  title: 'دوره‌های برنامه‌نویسی',
  description: 'آرکا نرم افزار - لیست دوره‌های برنامه‌نویسی و فناوری. از مبتدی تا پیشرفته با بهترین اساتید.',
  path: '/courses',
  keywordsExtra: getClusterKeywords('courses', 'brand'),
});

export default async function CoursesPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  const [{ courses }, categoryTree] = await Promise.all([
    getCoursesList({ pageSize: 200 }),
    getPublicCategoryTree(),
  ]);

  return (
    <div className={cn(pageLayout.shell, 'bg-background')}>
      <div className={cn(pageLayout.container, 'py-8 sm:py-10 lg:py-12')}>
        <CoursesPageClient courses={courses} categoryTree={categoryTree} dict={dict} />
      </div>
    </div>
  );
}

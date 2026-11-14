import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { getClusterKeywords } from '@/lib/seo/keyword-clusters';
import { PageWithBreadcrumb } from '@/components/shared/page-with-breadcrumb';
import { JsonLdBreadcrumb } from '@/components/shared/json-ld-breadcrumb';
import { TeachersPageClient } from '@/components/teachers-page-client';
import { getTeachingCategories, searchTeachers } from '@/lib/api/teachers';

export const metadata: Metadata = buildPageMetadata({
  title: 'آموزش برنامه نویسی|اساتید و مدرسین برنامه‌نویسی',
  description:
    'لیست اساتید و مدرسین تأییدشده آرکا نرم‌افزار — آموزش ASP.NET Core، React، Next.js، C# و سایر مهارت‌های برنامه‌نویسی.',
  path: '/teachers',
  keywordsExtra: getClusterKeywords('teachers', 'brand', 'courses'),
});

export default async function TeachersPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict = dict.teachersPage as Record<string, string>;

  let teachers: Awaited<ReturnType<typeof searchTeachers>>['teachers'] = [];
  let categories: Awaited<ReturnType<typeof getTeachingCategories>> = [];
  try {
    const [searchResult, cats] = await Promise.all([
      searchTeachers({ pageSize: 48 }),
      getTeachingCategories(),
    ]);
    teachers = searchResult.teachers;
    categories = cats;
  } catch {
    teachers = [];
    categories = [];
  }

  return (
    <PageWithBreadcrumb
      title={pageDict.title}
      subtitle={pageDict.subtitle}
      breadcrumbs={[
        { label: pageDict.home, href: '/' },
        { label: pageDict.title, href: '/teachers' },
      ]}
      dict={dict}
    >
      <JsonLdBreadcrumb
        items={[
          { name: lang === 'fa' ? 'خانه' : 'Home', path: '/' },
          { name: pageDict.title, path: '/teachers' },
        ]}
      />
      <TeachersPageClient teachers={teachers} categories={categories} lang={lang} dict={pageDict} />
    </PageWithBreadcrumb>
  );
}

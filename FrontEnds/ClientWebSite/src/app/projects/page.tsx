import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { ProjectsPageClient, type ProjectFacet } from '@/components/projects-page-client';
import { getProjectsList } from '@/lib/data-server';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = buildPageMetadata({
  title: 'پروژه|پروژه‌های برنامه نویسی|پروژه‌ها',
  description:
    'تیم برنامه نویسی آرکا نرم افزار - نمونه پروژه‌ها و محصولات نرم‌افزاری تیم آرکا با فناوری‌های .NET، JavaScript و بیشتر.',
  path: '/projects',
});

const PAGE_SIZE = 9;

type ProjectsSearchParams = {
  q?: string;
  tag?: string;
  tech?: string;
  page?: string;
};

function buildFacets(projects: { tags: string[]; technologies: string[] }[]): {
  tags: ProjectFacet[];
  technologies: ProjectFacet[];
} {
  const countBy = (values: string[]) => {
    const counts = new Map<string, number>();
    values.forEach((value) => {
      const key = value.trim();
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  };

  return {
    tags: countBy(projects.flatMap((p) => Array.from(new Set(p.tags)))),
    technologies: countBy(projects.flatMap((p) => Array.from(new Set(p.technologies)))),
  };
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<ProjectsSearchParams>;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict = dict.projectsPage as Record<string, string>;

  const params = await searchParams;
  const searchQuery = (params.q ?? '').trim();
  const tagFilter = params.tag?.trim() ?? '';
  const techFilter = params.tech?.trim() ?? '';
  const pageNumber = Math.max(1, Number(params.page) || 1);

  const [initialList, facetSource] = await Promise.all([
    getProjectsList({
      pageNumber,
      pageSize: PAGE_SIZE,
      inputValue: searchQuery,
      tag: tagFilter || undefined,
      technology: techFilter || undefined,
    }),
    getProjectsList({ pageSize: 100 }),
  ]);

  // Out-of-range page (stale bookmark, pagination after filters changed):
  // fall back to the first page instead of showing an empty result set.
  let effectivePage = pageNumber;
  let list = initialList;
  if (effectivePage > 1 && list.projects.length === 0 && list.totalCount > 0) {
    effectivePage = 1;
    list = await getProjectsList({
      pageNumber: 1,
      pageSize: PAGE_SIZE,
      inputValue: searchQuery,
      tag: tagFilter || undefined,
      technology: techFilter || undefined,
    });
  }

  const facets = buildFacets(facetSource.projects);

  const breadcrumbs = [
    { label: pageDict.home, href: '/' },
    { label: pageDict.title, href: '/projects' },
  ];

  return (
    <PageWithBreadcrumb
      title={pageDict.title}
      subtitle={pageDict.subtitle}
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      <Suspense fallback={<Skeleton className="h-[60vh] w-full rounded-2xl" />}>
        <ProjectsPageClient
          projects={list.projects}
          totalCount={list.totalCount}
          pageNumber={effectivePage}
          pageSize={PAGE_SIZE}
          searchQuery={searchQuery}
          tagFilter={tagFilter}
          techFilter={techFilter}
          tagFacets={facets.tags}
          techFacets={facets.technologies}
          dict={dict}
        />
      </Suspense>
    </PageWithBreadcrumb>
  );
}

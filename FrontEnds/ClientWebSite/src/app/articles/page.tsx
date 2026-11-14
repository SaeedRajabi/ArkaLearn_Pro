import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { ArticlesPageClient } from '@/components/articles-page-client';
import { getArticlesList } from '@/lib/data-server';
import { pageLayout } from '@/lib/utils/page-layout';
import { cn } from '@/lib/utils';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  if (category?.trim()) {
    const name = category.trim();
    return buildContentMetadata({
      title: `مقالات ${name} | آموزش برنامه‌نویسی`,
      description: `مقالات تخصصی دسته «${name}» در تیم برنامه نویسی آرکا نرم افزار — آموزش برنامه‌نویسی، فناوری و توسعه نرم‌افزار.`,
      path: `/articles?category=${encodeURIComponent(name)}`,
      section: name,
      keywordsExtra: [name, 'مقالات', 'برنامه نویسی', 'آموزش'],
    });
  }
  return buildContentMetadata({
    title: 'مقالات | آموزش برنامه‌نویسی',
    description: 'آرکا نرم افزار - مقالات و آموزش‌های تخصصی برنامه‌نویسی، فناوری و توسعه نرم‌افزار.',
    path: '/articles',
    keywordsExtra: ['مقالات', 'blog', 'programming articles', 'آموزش برنامه نویسی'],
  });
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  // Larger first fetch so featured (likes + comments + rating) can be scored accurately.
  const { articles, totalCount } = await getArticlesList({ pageSize: 80 });

  return (
    <div className={cn(pageLayout.shell, 'bg-background')}>
      <div className={cn(pageLayout.container, 'py-8 sm:py-10 lg:py-12')}>
        <Suspense fallback={null}>
          <ArticlesPageClient
            articles={articles}
            totalCount={totalCount}
            dict={dict}
            initialCategory={category}
          />
        </Suspense>
      </div>
    </div>
  );
}

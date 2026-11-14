import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { SoftwarePageClient } from '@/components/software-page-client';
import { getPublicCategoryTree } from '@/lib/data-server';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; search?: string; categoryId?: string }>;
}): Promise<Metadata> {
  const { tag, search } = await searchParams;
  if (tag?.trim()) {
    const name = tag.trim();
    return buildContentMetadata({
      title: `نرم‌افزارهای ${name}`,
      description: `نرم‌افزارهای مرتبط با «${name}» در آرکا نرم‌افزار.`,
      path: `/software?tag=${encodeURIComponent(name)}`,
      keywordsExtra: [name, 'نرم افزار', 'دانلود'],
    });
  }
  if (search?.trim()) {
    const q = search.trim();
    return buildContentMetadata({
      title: `جستجوی نرم‌افزار: ${q}`,
      description: `نتایج جستجو برای «${q}» در فهرست نرم‌افزارها.`,
      path: `/software?search=${encodeURIComponent(q)}`,
    });
  }
  return buildContentMetadata({
    title: 'نرم‌افزارها | دانلود و معرفی',
    description: 'فهرست نرم‌افزارهای منتشرشده توسط آرکا نرم‌افزار و اساتید — دانلود، معرفی و لایک.',
    path: '/software',
    keywordsExtra: ['نرم افزار', 'دانلود نرم افزار', 'ابزار برنامه نویسی'],
  });
}

export default async function SoftwarePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; search?: string; categoryId?: string }>;
}) {
  const { tag, search, categoryId: categoryIdRaw } = await searchParams;
  const categoryId = categoryIdRaw ? Number(categoryIdRaw) : undefined;
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict: Record<string, string> = (dict.softwarePage ?? {}) as Record<string, string>;

  const categories = await getPublicCategoryTree();

  const breadcrumbs = [
    { label: pageDict.home ?? (lang === 'fa' ? 'خانه' : 'Home'), href: '/' },
    { label: pageDict.title ?? (lang === 'fa' ? 'نرم‌افزارها' : 'Software'), href: '/software' },
    ...(tag?.trim()
      ? [{ label: tag.trim(), href: `/software?tag=${encodeURIComponent(tag.trim())}` }]
      : []),
  ];

  return (
    <PageWithBreadcrumb
      title={
        tag?.trim()
          ? `${pageDict.title ?? 'نرم‌افزارها'} — ${tag.trim()}`
          : pageDict.title ?? (lang === 'fa' ? 'نرم‌افزارها' : 'Software')
      }
      subtitle={pageDict.subtitle}
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      <Suspense fallback={null}>
        <SoftwarePageClient
          dict={dict}
          categories={categories}
          initialTag={tag}
          initialSearch={search}
          initialCategoryId={categoryId}
        />
      </Suspense>
    </PageWithBreadcrumb>
  );
}

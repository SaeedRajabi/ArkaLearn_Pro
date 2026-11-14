import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { BooksPageClient } from '@/components/books-page-client';
import { getBooksList, getPublicCategoryTree } from '@/lib/data-server';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; search?: string; categoryId?: string }>;
}): Promise<Metadata> {
  const { tag, search, categoryId } = await searchParams;
  if (tag?.trim()) {
    const name = tag.trim();
    return buildContentMetadata({
      title: `کتاب‌های ${name} | کتاب‌ها و جزوات`,
      description: `کتاب‌ها و جزوات مرتبط با «${name}» — منتشرشده توسط اساتید تیم برنامه نویسی آرکا نرم افزار.`,
      path: `/books?tag=${encodeURIComponent(name)}`,
      section: name,
      keywordsExtra: [name, 'کتاب', 'جزوات', 'آموزش', 'برنامه نویسی'],
    });
  }
  if (search?.trim()) {
    const q = search.trim();
    return buildContentMetadata({
      title: `جستجوی کتاب: ${q}`,
      description: `نتایج جستجو برای «${q}» در فهرست کتاب‌ها و جزوات اساتید.`,
      path: `/books?search=${encodeURIComponent(q)}`,
      keywordsExtra: [q, 'کتاب', 'جستجو'],
    });
  }
  return buildContentMetadata({
    title: 'کتاب‌ها و جزوات | آموزش برنامه‌نویسی',
    description:
      'فهرست کتاب‌ها و جزوات منتشرشده توسط اساتید آرکا نرم‌افزار — منبعی برای یادگیری عمیق و بهبود سئو آموزشی.',
    path: '/books',
    keywordsExtra: ['کتاب', 'جزوات', 'آموزش برنامه نویسی', 'کتاب برنامه نویسی', 'ISBN'],
  });
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; search?: string; categoryId?: string }>;
}) {
  const { tag, search, categoryId: categoryIdRaw } = await searchParams;
  const categoryId = categoryIdRaw ? Number(categoryIdRaw) : undefined;
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict: Record<string, string> = (dict.booksPage ?? {}) as Record<string, string>;

  const [{ queryResult: books }, categories] = await Promise.all([
    getBooksList({
      pageSize: 96,
      tag: tag?.trim(),
      search: search?.trim(),
      categoryId: categoryId && categoryId > 0 ? categoryId : undefined,
    }),
    getPublicCategoryTree(),
  ]);

  const breadcrumbs = [
    { label: pageDict.home ?? (lang === 'fa' ? 'خانه' : 'Home'), href: '/' },
    { label: pageDict.title ?? (lang === 'fa' ? 'کتاب‌ها' : 'Books'), href: '/books' },
    ...(tag?.trim()
      ? [{ label: tag.trim(), href: `/books?tag=${encodeURIComponent(tag.trim())}` }]
      : []),
  ];

  return (
    <PageWithBreadcrumb
      title={
        tag?.trim()
          ? `${pageDict.title ?? 'کتاب‌ها'} — ${tag.trim()}`
          : pageDict.title ?? (lang === 'fa' ? 'کتاب‌ها و جزوات' : 'Books & notes')
      }
      subtitle={pageDict.subtitle}
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      <Suspense fallback={null}>
        <BooksPageClient
          books={books}
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

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { CategoryBrowsePageClient } from '@/components/category-browse-page-client';
import { getPublicCategoryTree } from '@/lib/data-server';
import {
  buildCategoryBreadcrumbTrail,
  buildCategoryBrowseGroups,
  countCategoryBranchItems,
  loadCategoryContentPools,
} from '@/lib/category-browse';
import { findCategoryInTree } from '@/lib/api/categories';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    return buildContentMetadata({
      title: 'دسته‌بندی',
      description: 'مرور محتوا بر اساس دسته‌بندی',
      path: '/categories',
    });
  }

  const tree = await getPublicCategoryTree();
  const category = findCategoryInTree(tree, categoryId);
  const name = category?.name ?? 'دسته‌بندی';

  return buildContentMetadata({
    title: `${name} | دسته‌بندی`,
    description: `مشاهده دوره‌ها، مقالات، کتاب‌ها و نرم‌افزارهای مرتبط با دسته «${name}».`,
    path: `/categories/${categoryId}`,
    keywordsExtra: [name, 'دسته‌بندی', 'آموزش'],
  });
}

export default async function CategoryBrowsePage({ params }: PageProps) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isFinite(categoryId) || categoryId <= 0) notFound();

  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const headerDic = (dict.header ?? {}) as Record<string, string | undefined>;

  const [tree, pools] = await Promise.all([getPublicCategoryTree(), loadCategoryContentPools()]);
  const category = findCategoryInTree(tree, categoryId);
  if (!category) notFound();

  const groups = buildCategoryBrowseGroups(tree, categoryId, pools);
  const totalItems = countCategoryBranchItems(tree, categoryId, pools);
  const homeLabel = lang === 'fa' ? 'خانه' : 'Home';
  const breadcrumbs = buildCategoryBreadcrumbTrail(tree, categoryId, homeLabel);

  const labels: Record<string, string> = {
    courses: headerDic.courses ?? (lang === 'fa' ? 'دوره‌ها' : 'Courses'),
    articles: headerDic.articles ?? (lang === 'fa' ? 'مقالات' : 'Articles'),
    books: headerDic.books ?? (lang === 'fa' ? 'کتاب‌ها' : 'Books'),
    software: headerDic.software ?? (lang === 'fa' ? 'نرم‌افزار' : 'Software'),
  };

  const childNames = category.children.map((c) => c.name).join(lang === 'fa' ? '، ' : ', ');
  const subtitle =
    category.children.length > 0
      ? lang === 'fa'
        ? `${totalItems} مورد — شامل زیردسته‌ها: ${childNames}`
        : `${totalItems} items — includes: ${childNames}`
      : category.description ||
        (lang === 'fa'
          ? `${totalItems} مورد مرتبط با این دسته`
          : `${totalItems} items in this category`);

  return (
    <PageWithBreadcrumb
      title={category.name}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      <CategoryBrowsePageClient
        lang={lang}
        groups={groups}
        labels={labels}
        totalItems={totalItems}
        categoryName={category.name}
        childCount={category.children.length}
        emptyLabel={
          lang === 'fa'
            ? 'هنوز محتوایی برای این دسته‌بندی ثبت نشده است. لطفاً در پنل ادمین، دوره یا مقاله را به این دسته اختصاص دهید.'
            : 'No content has been added to this category yet. Assign courses or articles to this category in the admin panel.'
        }
      />
    </PageWithBreadcrumb>
  );
}

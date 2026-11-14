import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { BRAND_OG_IMAGE_PATH } from '@/lib/seo/brand';
import { PageWithBreadcrumb } from '@/components/shared';
import { SitemapPageClient } from '@/components/sitemap/sitemap-page-client';
import { getPublicCategoryTree } from '@/lib/data-server';
import {
  attachCategorySection,
  buildSiteMapSections,
} from '@/lib/site-map/build-site-map-sections';

export const revalidate = 3600;

export const metadata: Metadata = buildContentMetadata({
  title: 'نقشه سایت | آرکا نرم افزار',
  description:
    'نقشه کامل صفحات آرکا نرم افزار؛ دسترسی سریع به دوره‌ها، سمینارها، مقالات، پروژه‌ها، دسته‌بندی‌ها و بخش‌های حساب کاربری.',
  path: '/site-map',
  image: BRAND_OG_IMAGE_PATH,
  keywordsExtra: ['نقشه سایت', 'sitemap', 'ArkaSoftware', 'آرکا نرم افزار'],
});

export default async function SiteMapPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict = ((dict as { sitemapPage?: Record<string, string> }).sitemapPage ?? {}) as Record<
    string,
    string
  >;
  const headerDic = (dict as { header?: Record<string, string> }).header ?? {};
  const footerDic = (dict as { footer?: Record<string, string> }).footer ?? {};

  const categories = await getPublicCategoryTree();
  let sections = attachCategorySection(
    buildSiteMapSections({ lang, headerDic, pageDic: pageDict, footerDic }),
    categories,
    lang
  );
  sections = sections.filter(
    (section) => section.id !== 'categories' || section.nodes.length > 0
  );

  const breadcrumbs = [
    { label: pageDict.home ?? (lang === 'fa' ? 'خانه' : 'Home'), href: '/' },
    { label: pageDict.title ?? (lang === 'fa' ? 'نقشه سایت' : 'Sitemap'), href: '/site-map' },
  ];

  return (
    <PageWithBreadcrumb
      title={pageDict.title ?? (lang === 'fa' ? 'نقشه سایت' : 'Sitemap')}
      subtitle={pageDict.subtitle ?? ''}
      breadcrumbs={breadcrumbs}
      dict={dict}
      withContainer={false}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <SitemapPageClient lang={lang} dict={pageDict} sections={sections} />
      </div>
    </PageWithBreadcrumb>
  );
}

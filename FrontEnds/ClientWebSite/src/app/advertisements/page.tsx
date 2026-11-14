import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { AdvertisementsPageClient } from '@/components/advertisements/advertisements-page-client';

export const metadata: Metadata = buildContentMetadata({
  title: 'آگهی‌های تدریس',
  description: 'لیست اساتید با آگهی تدریس خصوصی و انجام پروژه در آرکا نرم‌افزار.',
  path: '/advertisements',
  keywordsExtra: ['آگهی تدریس', 'استاد', 'تدریس خصوصی', 'پروژه'],
});

export default async function AdvertisementsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict = dict.advertisementsPage as Record<string, string>;

  const breadcrumbs = [
    { label: pageDict.home, href: '/' },
    { label: pageDict.title, href: '/advertisements' },
  ];

  return (
    <PageWithBreadcrumb
      title={pageDict.title}
      subtitle={pageDict.subtitle}
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      <AdvertisementsPageClient dict={dict} />
    </PageWithBreadcrumb>
  );
}

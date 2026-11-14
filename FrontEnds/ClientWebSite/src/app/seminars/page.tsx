import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { getSeminarsList } from '@/lib/data-server';
import { SeminarsPageClient } from '@/components/seminars-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'سمینار برنامه نویسی|سمینارها',
  description: 'تیم برنامه نویسی آرکا نرم افزار- سمینارها و وبینارهای زنده برنامه‌نویسی و فناوری. ثبت‌نام در سمینارهای آنلاین.',
  path: '/seminars',
});

export default async function SeminarsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict:any = await getDictionary(lang);
  const pageDict:any = dict.seminarsPage;

  const { seminars } = await getSeminarsList({ pageSize: 24 });

  const breadcrumbs = [
    { label: (pageDict as any).home, href: '/' },
    { label: (pageDict as any).title, href: '/seminars' },
  ];

  return (
    <PageWithBreadcrumb
      title={(pageDict as any).title}
      subtitle={(pageDict as any).subtitle}
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      <SeminarsPageClient seminars={seminars} dict={dict} />
    </PageWithBreadcrumb>
  );
}

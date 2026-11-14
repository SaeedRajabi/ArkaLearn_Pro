import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorOverviewPage } from '@/components/professor/professor-overview-page';

export const metadata: Metadata = buildPageMetadata({
  title: 'داشبورد استاد',
  description: 'مدیریت پروفایل عمومی استاد در آرکا نرم افزار',
  path: '/professor',
  noIndex: true,
});

export default async function ProfessorPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return <ProfessorOverviewPage dict={dict} />;
}

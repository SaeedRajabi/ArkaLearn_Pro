import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorAnalyticsPageClient } from '@/components/professor/professor-analytics-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'تحلیل درآمد استاد',
  description: 'آنالیز و تحلیل درآمدهای استاد',
  path: '/professor/analytics',
  noIndex: true,
});

export default async function ProfessorAnalyticsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorAnalyticsPageClient dict={dict} />;
}

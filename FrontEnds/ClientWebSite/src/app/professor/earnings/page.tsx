import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorEarningsPageClient } from '@/components/professor/earnings/professor-earnings-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'درآمدهای استاد',
  description: 'تحلیل درآمد و درخواست تسویه حساب استاد',
  path: '/professor/earnings',
  noIndex: true,
});

export default async function ProfessorEarningsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorEarningsPageClient dict={dict} />;
}

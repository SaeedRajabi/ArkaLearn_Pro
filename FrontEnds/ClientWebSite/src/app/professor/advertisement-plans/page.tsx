import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorAdvertisementPlansClient } from '@/components/professor/advertisements/professor-advertisement-plans-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'پلن‌های آگهی',
  description: 'خرید پلن تبلیغات و مدیریت XP',
  path: '/professor/advertisement-plans',
  noIndex: true,
});

export default async function ProfessorAdvertisementPlansPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return <ProfessorAdvertisementPlansClient dict={dict} />;
}

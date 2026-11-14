import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorManualBumpClient } from '@/components/professor/advertisements/professor-manual-bump-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'به‌روزرسانی دستی آگهی',
  description: 'بالا بردن دستی آگهی در لیست عمومی',
  path: '/professor/manual-bump',
  noIndex: true,
});

export default async function ProfessorManualBumpPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return <ProfessorManualBumpClient dict={dict} />;
}

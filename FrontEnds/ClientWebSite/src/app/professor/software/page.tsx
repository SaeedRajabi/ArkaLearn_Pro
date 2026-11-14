import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorSoftwarePageClient } from '@/components/professor/software/professor-software-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'نرم‌افزارهای استاد',
  description: 'مدیریت نرم‌افزارهای منتشرشده استاد',
  path: '/professor/software',
  noIndex: true,
});

export default async function ProfessorSoftwarePage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorSoftwarePageClient dict={dict} />;
}

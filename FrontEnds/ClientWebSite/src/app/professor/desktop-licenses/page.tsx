import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorDesktopLicensesHubPageClient } from '@/components/professor/students/professor-desktop-licenses-hub-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'مدیریت لایسنس دسکتاپ',
  description: 'مدیریت لایسنس‌های دسکتاپ آرکا برای دانشجویان و دوره‌ها',
  path: '/professor/desktop-licenses',
  noIndex: true,
});

export default async function ProfessorDesktopLicensesPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorDesktopLicensesHubPageClient dict={dict} />;
}

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorEducationPlansPageClient } from '@/components/professor/education/professor-education-plans-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'پلن‌های آموزشی استاد',
  description: 'مدیریت پلن‌های آموزشی خصوصی',
  path: '/professor/education-plans',
  noIndex: true,
});

export default async function ProfessorEducationPlansPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorEducationPlansPageClient dict={dict} />;
}

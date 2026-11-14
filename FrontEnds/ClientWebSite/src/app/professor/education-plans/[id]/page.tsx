import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorEducationPlanDetailPageClient } from '@/components/professor/education/professor-education-plan-detail-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'جزئیات پلن آموزشی',
  description: 'جزئیات پلن آموزشی استاد',
  path: '/professor/education-plans',
  noIndex: true,
});

export default async function ProfessorEducationPlanDetailPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorEducationPlanDetailPageClient dict={dict} />;
}

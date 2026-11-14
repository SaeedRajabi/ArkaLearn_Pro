import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorProfilePageClient } from '@/components/professor/professor-profile-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'پروفایل استاد',
  description: 'ویرایش پروفایل عمومی استاد',
  path: '/professor/profile',
  noIndex: true,
});

export default async function ProfessorProfilePage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorProfilePageClient dict={dict} />;
}

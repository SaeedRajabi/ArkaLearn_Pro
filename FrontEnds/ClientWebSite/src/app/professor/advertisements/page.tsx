import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ProfessorAdvertisementPageClient } from '@/components/professor/advertisements/professor-advertisement-page-client';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Professor advertisements',
  description: 'Manage your teaching and project advertisements.',
  path: '/professor/advertisements',
});

export default async function ProfessorAdvertisementsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorAdvertisementPageClient dict={dict} />;
}

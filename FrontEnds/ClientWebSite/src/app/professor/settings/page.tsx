import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorSettingsPageClient } from '@/components/professor/professor-settings-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'تنظیمات داشبورد استاد',
  description: 'تنظیمات داشبورد استاد',
  path: '/professor/settings',
  noIndex: true,
});

export default async function ProfessorSettingsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorSettingsPageClient dict={dict} />;
}

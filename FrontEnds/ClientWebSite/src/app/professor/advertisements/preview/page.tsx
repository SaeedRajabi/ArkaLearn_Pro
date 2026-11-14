import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorAdvertisementPreviewClient } from '@/components/professor/advertisements/professor-advertisement-preview-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'پیش‌نمایش آگهی',
  description: 'پیش‌نمایش آگهی تدریس استاد',
  path: '/professor/advertisements/preview',
  noIndex: true,
});

export default async function ProfessorAdvertisementPreviewPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return <ProfessorAdvertisementPreviewClient dict={dict} />;
}

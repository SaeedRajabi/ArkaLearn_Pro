import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorOnlineRoomsPageClient } from '@/components/professor/online-rooms/professor-online-rooms-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'اتاق‌های آنلاین استاد',
  description: 'مدیریت اتاق‌های آنلاین و دانشجویان خصوصی',
  path: '/professor/online-rooms',
  noIndex: true,
});

export default async function ProfessorOnlineRoomsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorOnlineRoomsPageClient dict={dict} />;
}

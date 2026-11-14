import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorRoomDetailPageClient } from '@/components/professor/online-rooms/professor-room-detail-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'جزئیات اتاق آنلاین',
  description: 'مدیریت اتاق آنلاین و فایل‌های آموزشی',
  path: '/professor/online-rooms',
  noIndex: true,
});

export default async function ProfessorRoomDetailPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorRoomDetailPageClient dict={dict} />;
}

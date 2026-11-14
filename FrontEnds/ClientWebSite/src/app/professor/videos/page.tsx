import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorPromotionalVideosPageClient } from '@/components/professor/videos/professor-promotional-videos-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'ویدیوهای استاد',
  description: 'مدیریت ویدیوهای تبلیغاتی استاد',
  path: '/professor/videos',
  noIndex: true,
});

export default async function ProfessorVideosPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorPromotionalVideosPageClient dict={dict} />;
}

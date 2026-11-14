import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorDesktopAppPageClient } from '@/components/professor/desktop-app/professor-desktop-app-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'اپلیکیشن ویندوز',
  description: 'دانلود اپلیکیشن دسکتاپ آرکا نرم‌افزار برای اساتید',
  path: '/professor/desktop-app',
  noIndex: true,
});

export default async function ProfessorDesktopAppPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorDesktopAppPageClient dict={dict} />;
}

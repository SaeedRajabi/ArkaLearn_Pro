import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorRemoteAssistPageClient } from '@/components/professor/remote-assist/professor-remote-assist-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'کمک از راه دور',
  description: 'اتصال به نشست ریموت دانشجو و مشاهده تاریخچه',
  path: '/professor/remote-assist',
  noIndex: true,
});

export default async function ProfessorRemoteAssistPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorRemoteAssistPageClient dict={dict} />;
}

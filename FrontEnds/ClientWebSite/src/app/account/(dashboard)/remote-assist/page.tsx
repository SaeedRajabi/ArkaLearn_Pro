import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { StudentRemoteAssistPageClient } from '@/components/account/remote-assist/student-remote-assist-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'کمک از راه دور',
  description: 'تاریخچه نشست‌های ریموت و تأیید دسترسی',
  path: '/account/remote-assist',
  noIndex: true,
});

export default async function AccountRemoteAssistPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <StudentRemoteAssistPageClient dict={dict} />;
}

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorWalletPageClient } from '@/components/professor/wallet/professor-wallet-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'کیف پول استاد',
  description: 'مدیریت کیف پول و تراکنش‌های مالی استاد',
  path: '/professor/wallet',
  noIndex: true,
});

export default async function ProfessorWalletPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return <ProfessorWalletPageClient dict={dict} />;
}

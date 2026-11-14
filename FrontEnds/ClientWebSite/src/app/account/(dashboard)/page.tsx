import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import DashboardPage from '@/components/account/profile-settings-form';

export const metadata: Metadata = buildPageMetadata({
  title: 'حساب کاربری',
  description: 'آرکا نرم افزار - اطلاعات پروفایل و مدیریت حساب کاربری',
  path: '/account',
  noIndex: true,
});

export default async function AccountPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return <DashboardPage dict={dict} />;
}

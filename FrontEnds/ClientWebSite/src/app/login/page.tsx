import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { AuthLayout, LoginPageClient } from '@/components/features/auth';

export const metadata: Metadata = buildPageMetadata({
  title: 'ورود',
  description: 'ورود به حساب کاربری آموزشگاه آرکا نرم افزار.',
  path: '/login',
  noIndex: true,
});

export default async function LoginPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict:any = await getDictionary(lang);
  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  return (
    <AuthLayout copy={dict.login} dir={dir}>
      <LoginPageClient dict={dict.login} />
    </AuthLayout>
  );
}

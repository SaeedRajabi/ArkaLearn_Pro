import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { AuthLayout, ForgotPasswordPageClient } from '@/components/features/auth';

export const metadata: Metadata = buildPageMetadata({
  title: 'بازیابی رمز عبور',
  description: 'آرکا نرم افزار - بازیابی رمز عبور حساب کاربری ArkaSoftware-Edu.',
  path: '/forgot-password',
  noIndex: true,
});

export default async function ForgotPasswordPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict:any = await getDictionary(lang);
  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  return (
    <AuthLayout copy={dict.login} dir={dir}>
      <ForgotPasswordPageClient dict={dict.forgotPassword} lang={lang} />
    </AuthLayout>
  );
}

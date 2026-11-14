import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { AuthLayout } from '@/components/features/auth';
import ResetPasswordPageClient from '@/components/reset-password-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'تغییر رمز عبور',
  description: 'آرکا نرم افزار - تنظیم رمز عبور جدید.',
  path: '/reset-password',
  noIndex: true,
});

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const dir = lang === 'fa' ? 'rtl' : 'ltr';
  const params = await searchParams;
  const token = params.token ?? '';

  return (
    <AuthLayout copy={dict.login} dir={dir}>
      <ResetPasswordPageClient dict={dict.resetPassword} lang={lang} token={token} />
    </AuthLayout>
  );
}

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { AuthLayout, RegisterPageClient } from '@/components/features/auth';

export const metadata: Metadata = buildPageMetadata({
  title: 'ثبت‌نام',
  description: 'ثبت‌نام در آرکا نرم افزار ArkaSoftware و دسترسی به دوره‌ها و سمینارها.',
  path: '/register',
  noIndex: true,
});

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict:any = await getDictionary(lang);
  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  return (
    <AuthLayout copy={dict.login} dir={dir}>
      <RegisterPageClient dict={dict.register} />
    </AuthLayout>
  );
}

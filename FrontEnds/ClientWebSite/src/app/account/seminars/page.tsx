import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { MyRegisteredSeminars } from '@/components/my-registered-seminars';

export const metadata: Metadata = buildPageMetadata({
  title: 'سمینارهای ثبت‌نام‌شده',
  description: 'لیست سمینارهای ثبت‌نام‌شده و اطلاعات ورود به اتاق گفتگو.',
  path: '/account/seminars',
  noIndex: true,
});

export default async function AccountSeminarsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  const breadcrumbs = [
    { label: dict.coursesPage?.home ?? 'خانه', href: '/' },
    { label: lang === 'en' ? 'Account' : 'حساب کاربری', href: '/account' },
    { label: lang === 'en' ? 'My Seminars' : 'سمینارهای من', href: '/account/seminars' },
  ];

  const pageDict = {
    title: lang === 'en' ? 'My Registered Seminars' : 'سمینارهای ثبت‌نام‌شده',
    empty: lang === 'en' ? 'You have not registered for any seminar yet.' : 'هنوز در هیچ سمیناری ثبت‌نام نکرده‌اید.',
    roomLink: lang === 'en' ? 'Room link' : 'لینک اتاق',
    username: lang === 'en' ? 'Username (email)' : 'نام کاربری (ایمیل)',
    passwordSentByEmail: lang === 'en' ? 'Password was sent to your email.' : 'رمز ورود به ایمیل شما ارسال شده است.',
    copy: lang === 'en' ? 'Copy' : 'کپی',
    copied: lang === 'en' ? 'Copied!' : 'کپی شد!',
    enterRoom: lang === 'en' ? 'Enter room' : 'ورود به اتاق',
    loginRequired: lang === 'en' ? 'Please log in to see your seminars.' : 'لطفاً وارد شوید تا سمینارهای خود را ببینید.',
  };

  return (
    <PageWithBreadcrumb
      title={pageDict.title}
      subtitle={lang === 'en' ? 'Room link and username for each seminar' : 'لینک اتاق و نام کاربری برای هر سمینار'}
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      <MyRegisteredSeminars dict={pageDict} lang={lang} />
    </PageWithBreadcrumb>
  );
}

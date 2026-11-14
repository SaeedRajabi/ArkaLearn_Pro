import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { getClusterKeywords } from '@/lib/seo/keyword-clusters';
import { PageWithBreadcrumb } from '@/components/shared';
import { CommunityQaList } from '@/components/features/qa/community-qa-list';

export const metadata: Metadata = buildPageMetadata({
  title: 'پرسش و پاسخ برنامه‌نویسی',
  description:
    'انجمن پرسش و پاسخ آرکا نرم‌افزار — سؤالات برنامه‌نویسی، ASP.NET Core، React، Next.js و توسعه نرم‌افزار را بپرسید و پاسخ بگیرید.',
  path: '/qa',
  keywordsExtra: getClusterKeywords('qa', 'brand', 'courses'),
});

export default async function CommunityQaPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict = (dict.communityQa ?? {}) as Record<string, string>;

  const breadcrumbs = [
    { label: dict.header?.courses ? (lang === 'fa' ? 'خانه' : 'Home') : 'Home', href: '/' },
    { label: pageDict.title ?? (lang === 'fa' ? 'پرسش و پاسخ' : 'Community Q&A'), href: '/qa' },
  ];

  return (
    <PageWithBreadcrumb
      title={pageDict.title ?? (lang === 'fa' ? 'پرسش و پاسخ جامعه' : 'Community Q&A')}
      subtitle={
        pageDict.subtitle ??
        (lang === 'fa'
          ? 'سؤال بپرسید، پاسخ دهید و با دیگر کاربران گفتگو کنید.'
          : 'Ask questions, answer others, and join live discussions.')
      }
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      <CommunityQaList dict={dict} lang={lang} />
    </PageWithBreadcrumb>
  );
}

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { CommunityQaThread } from '@/components/features/qa/community-qa-thread';

type PageProps = {
  params: Promise<{ threadId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { threadId } = await params;
  return buildPageMetadata({
    title: `Discussion #${threadId}`,
    description: 'Community discussion thread on ArkaSoftware.',
    path: `/qa/${threadId}`,
  });
}

export default async function CommunityQaThreadPage({ params }: PageProps) {
  const { threadId } = await params;
  const id = Number(threadId);
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict = (dict.communityQa ?? {}) as Record<string, string>;

  const breadcrumbs = [
    { label: lang === 'fa' ? 'خانه' : 'Home', href: '/' },
    { label: pageDict.title ?? (lang === 'fa' ? 'پرسش و پاسخ' : 'Community Q&A'), href: '/qa' },
    { label: pageDict.thread ?? (lang === 'fa' ? 'بحث' : 'Discussion'), href: `/qa/${threadId}` },
  ];

  return (
    <PageWithBreadcrumb
      title={pageDict.threadTitle ?? (lang === 'fa' ? 'بحث' : 'Discussion')}
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      {Number.isFinite(id) && id > 0 ? (
        <CommunityQaThread threadId={id} dict={dict} lang={lang} />
      ) : (
        <p className="text-muted-foreground text-center py-12">
          {pageDict.invalidThread ?? 'Invalid discussion link.'}
        </p>
      )}
    </PageWithBreadcrumb>
  );
}

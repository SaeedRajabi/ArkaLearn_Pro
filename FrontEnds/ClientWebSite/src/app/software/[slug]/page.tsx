import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getSoftwareDetailBySlug } from '@/lib/data-server';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { buildMetaDescription } from '@/lib/seo/meta-helpers';
import { SoftwareDetailContent } from '@/components/features/software/software-detail-content';
import { JsonLdBreadcrumb } from '@/components/shared/json-ld-breadcrumb';
import { PageWithBreadcrumb } from '@/components/shared';
import { getSoftwareCoverImageUrl } from '@/lib/utils/image-url';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const software = await getSoftwareDetailBySlug(slug);
  if (!software) return { robots: { index: false, follow: true } };

  const description =
    software.metaDescription?.trim() ||
    buildMetaDescription(software.shortDescription, software.longDescriptionHtml, 160) ||
    software.title;

  return buildContentMetadata({
    title: software.seoTitle?.trim() || software.title,
    description,
    path: `/software/${slug}`,
    image: software.ogImageUrl || getSoftwareCoverImageUrl(software.coverImageUrl),
    tags: software.tags,
    keywordsExtra: [...software.tags, 'نرم افزار', 'دانلود'].filter(Boolean),
  });
}

export default async function SoftwareDetailPage({ params }: Props) {
  const { slug } = await params;
  const software = await getSoftwareDetailBySlug(slug);
  if (!software) notFound();

  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict = (dict.softwarePage ?? {}) as Record<string, string>;

  const breadcrumbs = [
    { label: pageDict.home ?? (lang === 'fa' ? 'خانه' : 'Home'), href: '/' },
    { label: pageDict.title ?? (lang === 'fa' ? 'نرم‌افزارها' : 'Software'), href: '/software' },
    { label: software.title, href: `/software/${encodeURIComponent(software.slug)}` },
  ];

  return (
    <>
      <JsonLdBreadcrumb items={breadcrumbs.map((b) => ({ name: b.label, path: b.href }))} />
      <PageWithBreadcrumb
        title={software.title}
        subtitle={software.shortDescription}
        breadcrumbs={breadcrumbs}
        dict={dict}
      >
        <SoftwareDetailContent software={software} dict={dict} lang={lang} />
      </PageWithBreadcrumb>
    </>
  );
}

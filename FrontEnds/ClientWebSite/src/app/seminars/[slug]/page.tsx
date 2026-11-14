import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getSeminarById } from '@/lib/data-server';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { buildMetaDescription } from '@/lib/seo/meta-helpers';
import {
  SeminarDetailHeader,
  SeminarDetailTabs,
  SeminarDetailSidebar,
} from '@/components/features/seminars';
import { DetailExploreLinks } from '@/components/shared/detail-explore-links';
import { JsonLdEvent } from '@/components/shared/json-ld-event';
import { JsonLdBreadcrumb } from '@/components/shared/json-ld-breadcrumb';
import {Seminar} from "@/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seminar = await getSeminarById(Number(slug));
  if (!seminar) return { robots: { index: false, follow: true } };
  const title = seminar.seoTitle?.trim() || seminar.title;
  const description =
    seminar.metaDescription?.trim() ||
    buildMetaDescription(seminar.description, seminar.title, 160);
  return buildContentMetadata({
    title,
    description,
    path: `/seminars/${slug}`,
    image: seminar.ogImageUrl || seminar.imageUrl,
    tags: seminar.tags,
    section: seminar.category,
    keywordsExtra: seminar.tags,
  });
}

export default async function SeminarPage({ params }: Props) {
   const { slug } =await params;
  const seminar:Seminar|null = await getSeminarById(Number(slug));
  if (!seminar) notFound();
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict: any = await getDictionary(lang);
  const description = buildMetaDescription(seminar.description, seminar.title, 200);
  const startIso = seminar.startDateTime;
  const endIso = seminar.endDateTime;

  return (
    <article>
      <JsonLdEvent
        title={seminar.title}
        description={description}
        path={`/seminars/${slug}`}
        image={seminar.imageUrl}
        startDate={startIso}
        endDate={endIso}
        isFree={seminar.isFree}
        price={seminar.price}
        performerName={seminar.speaker || seminar.instructor?.name}
        tags={seminar.tags}
      />
      <JsonLdBreadcrumb
        items={[
          { name: lang === 'fa' ? 'خانه' : 'Home', path: '/' },
          { name: lang === 'fa' ? 'سمینارها' : 'Seminars', path: '/seminars' },
          { name: seminar.title, path: `/seminars/${slug}` },
        ]}
      />
      <SeminarDetailHeader seminar={seminar} dict={dict} lang={lang} />
      <div className="bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2">
            <SeminarDetailTabs seminar={seminar} dict={dict} lang={lang} />
          </div>
          <div className="space-y-6">
            <SeminarDetailSidebar seminar={seminar} dict={dict} lang={lang} />
            <DetailExploreLinks lang={lang} tags={seminar.tags} />
          </div>
        </div>
      </div>
      </div>
    </article>
  );
}

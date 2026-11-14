import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { getContentByTag } from '@/lib/seo/tag-content';
import { slugToTag } from '@/lib/seo/tag-utils';
import { getCourseUrl } from '@/lib/course-slug';
import { getProjectDetailHref } from '@/lib/project-url';
import { JsonLdBreadcrumb } from '@/components/shared/json-ld-breadcrumb';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = slugToTag(slug);
  if (!tag) return {};
  return buildContentMetadata({
    title: `${tag} | موضوعات و آموزش برنامه‌نویسی`,
    description: `مقالات، دوره‌ها، سمینارها و پروژه‌های مرتبط با ${tag} در آموزشگاه آرکا نرم افزار (ArkaSoftware) — آموزش تخصصی برنامه‌نویسی و فناوری.`,
    path: `/tags/${slug}`,
    keywordsExtra: [tag, 'برنامه نویسی', 'programming', 'آرکا نرم افزار', 'ArkaSoftware'],
    tags: [tag],
  });
}

export default async function TagDetailPage({ params }: Props) {
  const { slug } = await params;
  const tag = slugToTag(slug);
  if (!tag) notFound();

  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const isRtl = lang === 'fa';

  const content = await getContentByTag(tag).catch(() => null);
  if (!content) notFound();

  const total =
    content.articles.length +
    content.courses.length +
    content.seminars.length +
    content.projects.length;

  if (total === 0) notFound();

  const breadcrumbs = [
    { label: isRtl ? 'خانه' : 'Home', href: '/' },
    { label: isRtl ? 'موضوعات' : 'Topics', href: '/tags' },
    { label: tag, href: `/tags/${slug}` },
  ];

  const section = (title: string, items: { href: string; label: string; image?: string; desc?: string }[]) => {
    if (!items.length) return null;
    return (
      <section className="space-y-4">
        <h2 className="font-headline text-2xl font-bold">{title}</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary"
              >
                {item.image && (
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                    <Image src={item.image} alt="" fill className="object-cover" sizes="96px" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold line-clamp-2">{item.label}</p>
                  {item.desc && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.desc}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <PageWithBreadcrumb
      title={tag}
      subtitle={
        isRtl
          ? `${total} محتوای مرتبط در مقالات، دوره‌ها، سمینارها و پروژه‌ها`
          : `${total} related items across articles, courses, seminars, and projects`
      }
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      <JsonLdBreadcrumb
        items={[
          { name: isRtl ? 'خانه' : 'Home', path: '/' },
          { name: isRtl ? 'موضوعات' : 'Topics', path: '/tags' },
          { name: tag, path: `/tags/${slug}` },
        ]}
      />
      <div className="space-y-10">
        {section(
          isRtl ? 'مقالات' : 'Articles',
          content.articles.map((a) => ({
            href: `/articles/${a.slug}`,
            label: a.title,
            image: a.thumbnailUrl,
            desc: a.summary,
          }))
        )}
        {section(
          isRtl ? 'دوره‌ها' : 'Courses',
          content.courses.map((c) => ({
            href: getCourseUrl({ id: c.id, slug: c.slug, title: c.title }),
            label: c.title,
            image: c.titleImage,
            desc: c.shortDescription,
          }))
        )}
        {section(
          isRtl ? 'سمینارها' : 'Seminars',
          content.seminars.map((s) => ({
            href: `/seminars/${s.id}`,
            label: s.title,
            image: s.thumbnailUrl,
            desc: s.description,
          }))
        )}
        {section(
          isRtl ? 'پروژه‌ها' : 'Projects',
          content.projects.map((p) => ({
            href: getProjectDetailHref(p),
            label: p.title,
            image: p.thumbnailUrl,
            desc: p.shortDescription,
          }))
        )}
      </div>
    </PageWithBreadcrumb>
  );
}

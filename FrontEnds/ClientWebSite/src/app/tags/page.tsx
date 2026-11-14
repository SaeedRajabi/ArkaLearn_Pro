import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { getTagCatalog } from '@/lib/seo/tag-content';
import { JsonLdBreadcrumb } from '@/components/shared/json-ld-breadcrumb';

export const metadata: Metadata = buildContentMetadata({
  title: 'موضوعات و برچسب‌ها | آموزش برنامه‌نویسی',
  description:
    'جستجوی موضوعات، تکنولوژی‌ها و برچسب‌های مقالات، دوره‌ها، سمینارها و پروژه‌های آرکا نرم افزار — از ASP.NET Core و React تا پروژه‌های عملی.',
  path: '/tags',
  keywordsExtra: ['برچسب', 'موضوعات', 'tags', 'programming topics', 'آموزش برنامه نویسی'],
});

export default async function TagsIndexPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const isRtl = lang === 'fa';

  const catalog = await getTagCatalog().catch(() => []);

  const breadcrumbs = [
    { label: isRtl ? 'خانه' : 'Home', href: '/' },
    { label: isRtl ? 'موضوعات' : 'Topics', href: '/tags' },
  ];

  return (
    <PageWithBreadcrumb
      title={isRtl ? 'موضوعات و برچسب‌ها' : 'Topics & tags'}
      subtitle={
        isRtl
          ? 'هر برچسب به مقالات، دوره‌ها، سمینارها و پروژه‌های مرتبط لینک می‌شود.'
          : 'Each tag links to related articles, courses, seminars, and projects.'
      }
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      <JsonLdBreadcrumb
        items={[
          { name: isRtl ? 'خانه' : 'Home', path: '/' },
          { name: isRtl ? 'موضوعات' : 'Topics', path: '/tags' },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {catalog.map((entry) => (
          <Link
            key={entry.slug}
            href={`/tags/${entry.slug}`}
            className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary hover:bg-primary/5"
          >
            <p className="font-semibold text-foreground">{entry.tag}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {entry.count} {isRtl ? 'مورد مرتبط' : 'related items'}
            </p>
          </Link>
        ))}
      </div>
      {catalog.length === 0 && (
        <p className="text-muted-foreground">
          {isRtl ? 'برچسبی یافت نشد.' : 'No tags found yet.'}
        </p>
      )}
    </PageWithBreadcrumb>
  );
}

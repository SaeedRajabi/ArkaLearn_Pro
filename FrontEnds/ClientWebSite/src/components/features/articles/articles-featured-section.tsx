'use client';

import Link from 'next/link';
import type { ArticleListItem } from '@/types';
import { RemoteImage } from '@/components/shared/remote-image';
import { getArticleImageUrl } from '@/lib/utils/image-url';
import { Button } from '@/components/ui/button';
import { estimateReadMinutes } from './articles-blog-utils';

type Dict = Record<string, string>;

interface ArticlesFeaturedSectionProps {
  article: ArticleListItem | null;
  dict: Dict;
  lang: 'en' | 'fa';
}

export function ArticlesFeaturedSection({ article, dict, lang }: ArticlesFeaturedSectionProps) {
  if (!article) return null;

  const locale = lang === 'fa' ? 'fa-IR' : 'en-US';
  const dateStr = article.publishedAt || article.createdAt;
  const parsed = dateStr ? new Date(dateStr) : null;
  const formattedDate =
    parsed && !Number.isNaN(parsed.getTime())
      ? parsed.toLocaleDateString(locale, { dateStyle: 'medium' })
      : dateStr || '';
  const minutes = estimateReadMinutes(article);
  const tag = article.tags?.[0] || (lang === 'fa' ? 'راهنما' : 'Guide');

  return (
    <section className="space-y-5">
      <div className="text-center sm:text-start">
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          {dict.featuredTitle ?? (lang === 'fa' ? 'مقاله ویژه' : 'Featured article')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {dict.featuredSubtitle ??
            (lang === 'fa'
              ? 'منتخب بر اساس بیشترین تعامل مخاطبان'
              : 'Selected by highest audience engagement')}
        </p>
      </div>

      <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] dark:shadow-[0_16px_40px_-28px_rgba(0,0,0,0.55)]">
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">
              {article.categoryName ? (
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                  {article.categoryName}
                </span>
              ) : null}
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                {tag}
              </span>
            </div>

            <h3 className="text-xl font-extrabold leading-8 text-foreground sm:text-2xl lg:text-[1.7rem] lg:leading-10">
              <Link href={`/articles/${article.slug}`} className="hover:text-primary">
                {article.title}
              </Link>
            </h3>

            {article.summary ? (
              <p className="line-clamp-3 text-sm leading-7 text-muted-foreground sm:text-base">{article.summary}</p>
            ) : null}

            <p className="text-xs text-muted-foreground sm:text-sm">
              {(dict.authorLabel ?? (lang === 'fa' ? 'نویسنده' : 'Author'))}:{' '}
              {article.authorName || (lang === 'fa' ? 'تیم آرکا نرم‌افزار' : 'ArkaSoftware Team')}
              <span className="mx-2 text-border">·</span>
              {(dict.readMinutes ?? (lang === 'fa' ? '{n} دقیقه مطالعه' : '{n} min read')).replace(
                '{n}',
                minutes.toLocaleString(locale)
              )}
              {formattedDate ? (
                <>
                  <span className="mx-2 text-border">·</span>
                  {formattedDate}
                </>
              ) : null}
            </p>

            <div>
              <Button asChild className="mt-1 h-11 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                <Link href={`/articles/${article.slug}`}>
                  {dict.readArticle ?? (lang === 'fa' ? 'مطالعه مقاله' : 'Read article')}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative min-h-[220px] bg-muted lg:min-h-full">
            <RemoteImage
              src={getArticleImageUrl(article.thumbnailUrl)}
              alt={article.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </article>
    </section>
  );
}

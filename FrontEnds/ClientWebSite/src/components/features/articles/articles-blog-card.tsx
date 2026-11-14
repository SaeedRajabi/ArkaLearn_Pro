'use client';

import Link from 'next/link';
import type { ArticleListItem } from '@/types';
import { RemoteImage } from '@/components/shared/remote-image';
import { getArticleImageUrl } from '@/lib/utils/image-url';
import { estimateReadMinutes, categoryToneClass } from './articles-blog-utils';

type Dict = Record<string, string>;

interface ArticlesBlogCardProps {
  article: ArticleListItem;
  dict: Dict;
  lang: 'en' | 'fa';
  toneIndex?: number;
}

export function ArticlesBlogCard({ article, dict, lang, toneIndex = 0 }: ArticlesBlogCardProps) {
  const locale = lang === 'fa' ? 'fa-IR' : 'en-US';
  const dateStr = article.publishedAt || article.createdAt;
  const parsed = dateStr ? new Date(dateStr) : null;
  const formattedDate =
    parsed && !Number.isNaN(parsed.getTime())
      ? parsed.toLocaleDateString(locale, { dateStyle: 'medium' })
      : dateStr || '';
  const minutes = estimateReadMinutes(article);
  const badge = article.categoryName || article.tags?.[0] || (lang === 'fa' ? 'مقاله' : 'Article');

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_30px_-24px_rgba(15,23,42,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] dark:shadow-[0_12px_30px_-24px_rgba(0,0,0,0.55)]">
      <Link href={`/articles/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-muted">
        <RemoteImage
          src={getArticleImageUrl(article.thumbnailUrl)}
          alt={article.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-0.5 font-medium ${categoryToneClass(toneIndex)}`}>
            {badge}
          </span>
          <span className="text-muted-foreground">
            {(dict.readMinutes ?? (lang === 'fa' ? '{n} دقیقه مطالعه' : '{n} min read')).replace(
              '{n}',
              minutes.toLocaleString(locale)
            )}
          </span>
        </div>

        <h3 className="line-clamp-2 text-base font-bold leading-7 text-foreground">
          <Link href={`/articles/${article.slug}`} className="hover:text-primary">
            {article.title}
          </Link>
        </h3>

        {article.summary ? (
          <p className="line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{article.summary}</p>
        ) : (
          <div className="flex-1" />
        )}

        <div className="mt-1 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
          <span className="text-muted-foreground">{formattedDate}</span>
          <Link
            href={`/articles/${article.slug}`}
            className="font-medium text-primary hover:underline"
          >
            {dict.readMore ?? (lang === 'fa' ? 'مطالعه بیشتر' : 'Read more')}
          </Link>
        </div>
      </div>
    </article>
  );
}

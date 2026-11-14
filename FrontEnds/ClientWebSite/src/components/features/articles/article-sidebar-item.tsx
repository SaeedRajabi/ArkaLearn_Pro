'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ArticleListItem } from '@/types';
import { cn } from '@/lib/utils';
import { getArticleImageUrl } from '@/lib/utils/image-url';
import { CalendarDays } from 'lucide-react';

interface ArticleSidebarItemProps {
  article: ArticleListItem;
  isRtl: boolean;
  isActive?: boolean;
}

export function ArticleSidebarItem({ article, isRtl, isActive }: ArticleSidebarItemProps) {
  const dateStr = article.publishedAt ?? article.createdAt;

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={cn(
        'group flex gap-3 rounded-lg border p-2.5 transition-colors',
        isActive
          ? 'border-primary/40 bg-primary/5'
          : 'border-transparent bg-muted/30 hover:border-border hover:bg-muted/50'
      )}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
        <Image
          src={getArticleImageUrl(article.thumbnailUrl)}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="56px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
          {article.title}
        </p>
        {article.categoryName && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{article.categoryName}</p>
        )}
        {dateStr && (
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {dateStr}
          </p>
        )}
      </div>
    </Link>
  );
}

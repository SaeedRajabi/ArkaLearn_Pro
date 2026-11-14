import Image from 'next/image';
import { CalendarDays } from 'lucide-react';
import type { Article } from '@/types';
import { SeoTagLink } from '@/components/shared/seo-tag-link';

interface ArticleHeroProps {
  article: Article;
  lang: 'en' | 'fa';
}

export function ArticleHero({ article, lang }: ArticleHeroProps) {
  const title = lang === 'en' ? article.title_en : article.title;
  const dateStr = article.publishDate;
  const tags = Array.isArray(article.tags)
    ? article.tags
    : article.tags?.$values ?? [];

  return (
    <div
      className="relative flex min-h-[400px] w-full flex-col justify-end bg-black text-white"
    >
      <Image
        src={article.imageUrl}
        alt={title}
        fill
        className="object-cover opacity-50"
        data-ai-hint={article.imageHint}
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="container relative mx-auto flex h-full min-h-[280px] flex-col justify-end px-4 py-12">
        <div className="flex max-w-4xl flex-col justify-end">
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <SeoTagLink
                key={tag}
                tag={tag}
                variant="secondary"
                className="border-transparent bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 hover:text-white"
              />
            ))}
          </div>
          <h1 className="font-headline mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <div className="flex items-center gap-4 text-gray-200">
            <span>{article.author}</span>
            <span>&bull;</span>
            {dateStr && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{dateStr}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

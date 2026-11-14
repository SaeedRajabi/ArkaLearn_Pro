"use client";
import Link from 'next/link';
import { ArticleEngagementBar } from '@/components/article-engagement-bar';
import ArticleComments from '@/components/article-comments';
import { ArticleDetailSidebar } from './article-detail-sidebar';
import type { Article, ArticleListItem } from '@/types';
import type { ArticleCategoryStat } from '@/lib/data-server';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';
import { RichHtmlContent } from '@/components/shared/rich-html-content';
import { ArrowLeft, ArrowRight, CalendarDays, FolderOpen, Tags, UserRound } from 'lucide-react';
import { SeoTagLink } from '@/components/shared/seo-tag-link';

interface ArticleDetailContentProps {
  article: Article;
  categoryArticles: ArticleListItem[];
  recentArticles: ArticleListItem[];
  categories: ArticleCategoryStat[];
  dict: Dictionary;
  lang: 'en' | 'fa';
}

export function ArticleDetailContent({
  article,
  categoryArticles,
  recentArticles,
  categories,
  dict,
  lang,
}: ArticleDetailContentProps) {
    const articleId = Number(article.id);
    const isRtl = lang === 'fa';
    const pageDict = dict.articlesPage as Record<string, string>;
    const tags = Array.isArray(article.tags)
        ? article.tags
        : article.tags?.$values ?? [];

    return (
    <div className="space-y-12 py-12">
      <div
        className={cn(
          'grid gap-6 lg:gap-8',
          'lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)_minmax(220px,280px)]',
          'xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(240px,300px)]',
          isRtl &&
            'lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_minmax(220px,260px)] xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)_minmax(240px,280px)]'
        )}
      >
        <aside className={cn('space-y-4 lg:sticky lg:top-28 lg:self-start', isRtl ? 'lg:order-3' : 'lg:order-1')}>
          <div className="rounded-xl border bg-background p-5 shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
            <Link
              href="/articles"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {pageDict.backToArticles ?? (isRtl ? 'بازگشت به دسته‌بندی مقالات' : 'Back to article categories')}
            </Link>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <FolderOpen className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">{pageDict.category ?? (isRtl ? 'دسته‌بندی' : 'Category')}</p>
                  <p className="text-muted-foreground">{article.categoryName || pageDict.uncategorized || (isRtl ? 'بدون دسته‌بندی' : 'Uncategorized')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">{pageDict.author ?? (isRtl ? 'نویسنده' : 'Author')}</p>
                  <p className="text-muted-foreground">{article.author || 'ادمین آرکا نرم افزار'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">{pageDict.publishedAt ?? (isRtl ? 'تاریخ انتشار' : 'Published')}</p>
                  <p className="text-muted-foreground">{article.publishDate}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-background p-5 shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <Tags className="h-4 w-4 text-primary" />
              {pageDict.tags ?? (isRtl ? 'برچسب‌ها' : 'Tags')}
            </div>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <SeoTagLink key={tag} tag={tag} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{pageDict.noTags ?? (isRtl ? 'برچسبی برای این مقاله ثبت نشده است.' : 'No tags were added for this article.')}</p>
            )}
          </div>

          {article.summary && (
            <div className="rounded-xl border bg-background p-5 text-sm leading-7 text-muted-foreground shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
              <p className="mb-2 font-semibold text-foreground">{pageDict.articleSummary ?? (isRtl ? 'خلاصه مقاله' : 'Article summary')}</p>
              {article.summary}
            </div>
          )}
        </aside>

        <div className={cn('min-w-0 rounded-xl bg-background p-6 shadow-sm sm:p-8 xl:p-10', 'lg:order-2')}>
            <RichHtmlContent html={article.content ?? ''} dir={isRtl ? 'rtl' : 'ltr'} />
        </div>

        <ArticleDetailSidebar
          article={article}
          categoryArticles={categoryArticles}
          recentArticles={recentArticles}
          categories={categories}
          dict={dict}
          lang={lang}
        />
      </div>

      <ArticleEngagementBar
        articleId={articleId}
        initialLikes={article.likes ?? 0}
        initialDislikes={article.dislikes ?? 0}
        dict={dict}
      />

      <div className="rounded-xl bg-background p-6 shadow-sm sm:p-10">
        <ArticleComments article={article} dict={dict} />
      </div>
    </div>
  );
}

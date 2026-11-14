'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Search } from 'lucide-react';
import type { ArticleListItem, Dictionary } from '@/types';
import { Input } from '@/components/ui/input';
import { searchArticles } from '@/lib/api/articles';
import { getArticleImageUrl } from '@/lib/utils/image-url';
import { ArticlesBlogHero } from '@/components/features/articles/articles-blog-hero';
import { ArticlesFeaturedSection } from '@/components/features/articles/articles-featured-section';
import { ArticlesCategoriesSection } from '@/components/features/articles/articles-categories-section';
import { ArticlesBlogCard } from '@/components/features/articles/articles-blog-card';
import { ArticlesNewsletter } from '@/components/features/articles/articles-newsletter';
import {
  collectArticleCategories,
  pickFeaturedArticle,
} from '@/components/features/articles/articles-blog-utils';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 9;

function normalizeClientArticle(row: Record<string, unknown>): ArticleListItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    summary: String(row.summary ?? row.Summary ?? ''),
    slug: String(row.slug ?? row.Slug ?? ''),
    thumbnailUrl: getArticleImageUrl(
      (row.thumbnailUrl ?? row.ThumbnailUrl) as string | undefined
    ),
    isPublished: Boolean(row.isPublished ?? row.IsPublished ?? true),
    publishedAt: (row.publishedAt ?? row.PublishedAt ?? null) as string | null,
    categoryName: (row.categoryName ?? row.CategoryName) as string | undefined,
    categoryId:
      row.categoryId != null || row.CategoryId != null
        ? Number(row.categoryId ?? row.CategoryId)
        : undefined,
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    likeCount: Number(row.likeCount ?? row.LikeCount ?? 0) || 0,
    commentCount: Number(row.commentCount ?? row.CommentCount ?? 0) || 0,
    averageRating: Number(row.averageRating ?? row.AverageRating ?? 0) || 0,
    authorName: String(row.authorName ?? row.AuthorName ?? '') || undefined,
    tags: Array.isArray(row.tags)
      ? (row.tags as string[])
      : Array.isArray(row.Tags)
        ? (row.Tags as string[])
        : undefined,
  };
}

interface ArticlesPageClientProps {
  articles: ArticleListItem[];
  totalCount: number;
  dict: Dictionary;
  initialCategory?: string;
}

export function ArticlesPageClient({
  articles: initialArticles,
  totalCount: initialTotal,
  dict,
  initialCategory,
}: ArticlesPageClientProps) {
  const pageDict = (dict.articlesPage ?? {}) as Record<string, string>;
  const lang = (dict.header as { articles?: string }).articles === 'Articles' ? 'en' : 'fa';
  const isRtl = lang === 'fa';

  const featured = useMemo(() => pickFeaturedArticle(initialArticles), [initialArticles]);
  const categories = useMemo(() => collectArticleCategories(initialArticles), [initialArticles]);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory?.trim() || '');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ArticleListItem[]>(initialArticles.slice(0, PAGE_SIZE));
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();

  const selectedCategoryId = useMemo(() => {
    if (!selectedCategory) return undefined;
    const match = categories.find((c) => c.name === selectedCategory);
    return typeof match?.id === 'number' ? match.id : undefined;
  }, [categories, selectedCategory]);

  const loadPage = useCallback(
    (nextPage: number, query: string, categoryName: string, categoryId?: number) => {
      startTransition(async () => {
        try {
          const data = await searchArticles({
            inputValue: query,
            pageNumber: nextPage,
            pageSize: PAGE_SIZE,
            needTotalCount: true,
            publishedOnly: true,
            categoryId,
          });
          let rows = data.queryResult.map((row) =>
            normalizeClientArticle(row as unknown as Record<string, unknown>)
          );

          // Fallback name filter when categoryId is unavailable from derived chips.
          if (categoryName && categoryId == null) {
            rows = rows.filter((a) => a.categoryName === categoryName);
          }

          if (sort === 'popular') {
            rows = [...rows].sort((a, b) => {
              const scoreA =
                (a.likeCount ?? 0) + (a.commentCount ?? 0) + (a.averageRating ?? 0) * 5;
              const scoreB =
                (b.likeCount ?? 0) + (b.commentCount ?? 0) + (b.averageRating ?? 0) * 5;
              return scoreB - scoreA;
            });
          }

          setItems(rows);
          setTotalCount(data.totalCount || rows.length);
          setPage(nextPage);
        } catch (error) {
          console.error('Failed to load articles', error);
        }
      });
    },
    [sort]
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 320);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadPage(1, searchQuery, selectedCategory, selectedCategoryId);
  }, [searchQuery, selectedCategory, selectedCategoryId, sort, loadPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-12 sm:space-y-14 lg:space-y-16">
      <ArticlesBlogHero
        dict={pageDict}
        featured={featured}
        totalCount={initialTotal}
        lang={lang}
        onScrollToArticles={() => scrollToId('articles-latest')}
        onScrollToCategories={() => scrollToId('articles-categories')}
      />

      <ArticlesFeaturedSection article={featured} dict={pageDict} lang={lang} />

      <ArticlesCategoriesSection
        categories={categories}
        selectedName={selectedCategory}
        dict={pageDict}
        lang={lang}
        onSelect={(name) => {
          setSelectedCategory(name);
          setPage(1);
        }}
      />

      <section id="articles-latest" className="scroll-mt-28 space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                pageDict.searchPlaceholder ??
                (lang === 'fa' ? 'جستجو در مقالات...' : 'Search articles...')
              }
              className="h-11 rounded-xl border-border bg-muted/40 pe-3 ps-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">
              {pageDict.allCategoriesFilter ??
                (lang === 'fa' ? 'همه دسته‌بندی‌ها' : 'All categories')}
            </option>
            {categories.map((cat) => (
              <option key={String(cat.id)} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'newest' | 'popular')}
            className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="newest">
              {pageDict.sortNewest ?? (lang === 'fa' ? 'جدیدترین' : 'Newest')}
            </option>
            <option value="popular">
              {pageDict.sortPopular ?? (lang === 'fa' ? 'محبوب‌ترین' : 'Most popular')}
            </option>
          </select>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
            {pageDict.latestTitle ?? (lang === 'fa' ? 'جدیدترین مقالات' : 'Latest articles')}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {pageDict.latestSubtitle ??
              (lang === 'fa' ? 'محتوای تازه برای یادگیری مداوم' : 'Fresh content for continuous learning')}
          </p>
        </div>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">
            {pageDict.noArticlesInCategory ??
              (lang === 'fa' ? 'مقاله‌ای یافت نشد.' : 'No articles found.')}
          </p>
        ) : (
          <div
            className={cn(
              'grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
              isPending && 'opacity-70 transition-opacity'
            )}
          >
            {items.map((article, index) => (
              <ArticlesBlogCard
                key={String(article.id)}
                article={article}
                dict={pageDict}
                lang={lang}
                toneIndex={index}
              />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<Array<number | 'ellipsis'>>((acc, n, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1];
                  if (typeof prev === 'number' && n - prev > 1) acc.push('ellipsis');
                }
                acc.push(n);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => loadPage(item, searchQuery, selectedCategory, selectedCategoryId)}
                    className={cn(
                      'h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition',
                      page === item
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:border-primary/40'
                    )}
                  >
                    {item.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')}
                  </button>
                )
              )}
            {page < totalPages ? (
              <button
                type="button"
                onClick={() =>
                  loadPage(page + 1, searchQuery, selectedCategory, selectedCategoryId)
                }
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground hover:border-primary/40"
              >
                {pageDict.nextPage ?? (lang === 'fa' ? 'بعدی' : 'Next')}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <ArticlesNewsletter dict={pageDict} lang={lang} />
    </div>
  );
}

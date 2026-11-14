import type { ArticleListItem } from '@/types';

/** Higher engagement wins: likes + comments + weighted average rating. */
export function articleEngagementScore(article: ArticleListItem): number {
  const likes = Number(article.likeCount ?? 0) || 0;
  const comments = Number(article.commentCount ?? 0) || 0;
  const rating = Number(article.averageRating ?? 0) || 0;
  return likes + comments + rating * 5;
}

export function pickFeaturedArticle(articles: ArticleListItem[]): ArticleListItem | null {
  if (!articles.length) return null;
  return [...articles].sort((a, b) => {
    const scoreDiff = articleEngagementScore(b) - articleEngagementScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    const dateA = Date.parse(a.publishedAt || a.createdAt || '') || 0;
    const dateB = Date.parse(b.publishedAt || b.createdAt || '') || 0;
    return dateB - dateA;
  })[0] ?? null;
}

export function estimateReadMinutes(article: ArticleListItem): number {
  const text = `${article.title ?? ''} ${article.summary ?? ''}`;
  return Math.max(4, Math.min(25, Math.ceil(text.length / 280)));
}

export function collectArticleCategories(articles: ArticleListItem[]): Array<{
  id: number | string;
  name: string;
  count: number;
  description?: string;
}> {
  const map = new Map<string, { id: number | string; name: string; count: number }>();
  for (const article of articles) {
    const name = article.categoryName?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        id: article.categoryId ?? name,
        name,
        count: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

const CATEGORY_TONES = [
  'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
] as const;

export function categoryToneClass(index: number): string {
  return CATEGORY_TONES[index % CATEGORY_TONES.length];
}

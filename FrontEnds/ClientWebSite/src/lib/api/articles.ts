import { apiRequest, buildQuery } from './client';
import type {
  ArticleCommentQri,
  ArticleQri,
  ArticleReactionSummary,
  PagedData,
  PagedResponseRaw,
  SearchArticleQri,
  FavoriteArticleQri,
} from './types';
import { normalizePagedResponse } from './types';
import { getUserImageUrl } from '@/lib/utils/image-url';

const BASE = 'Article';

function normalizeArray<T>(raw: T[] | { $values?: T[] } | null | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && '$values' in raw && Array.isArray((raw as { $values?: T[] }).$values))
    return (raw as { $values: T[] }).$values;
  return [];
}

export async function getArticleById(id: number): Promise<ArticleQri | null> {
  try {
    const path = `${BASE}/GetById${buildQuery({ id })}`;
    return await apiRequest<ArticleQri>(path);
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 204) {
      return null;
    }
    throw e;
  }
}

export async function getArticleBySlug(slug: string): Promise<ArticleQri | null> {
  try {
    const path = `${BASE}/GetBySlug${buildQuery({ slug })}`;
    return await apiRequest<ArticleQri>(path);
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 204) {
      return null;
    }
    throw e;
  }
}

export async function searchArticles(params: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
  publishedOnly?: boolean;
  categoryId?: number;
}): Promise<PagedData<SearchArticleQri>> {
  const {
    inputValue = '',
    pageNumber = 1,
    pageSize = 12,
    needTotalCount = true,
    publishedOnly = true,
    categoryId,
  } = params;
  const q: Record<string, string | number | boolean> = {
    inputValue,
    pageNumber,
    pageSize,
    needTotalCount,
    publishedOnly,
  };
  if (categoryId != null) q.categoryId = categoryId;
  const path = `${BASE}/Search${buildQuery(q)}`;
  const raw = await apiRequest<PagedResponseRaw<SearchArticleQri>>(path);
  return normalizePagedResponse(raw);
}

function normalizeArticleComment(comment: ArticleCommentQri): ArticleCommentQri {
  const record = comment as ArticleCommentQri & {
    Id?: number;
    ArticleId?: number;
    ArticleTitle?: string | null;
    Rating?: number;
    Text?: string;
    Likes?: number;
    IsApproved?: boolean;
    TimeStamp?: string;
    ParentId?: number | null;
    Author?: ArticleCommentQri['author'];
    Replies?: ArticleCommentQri['replies'];
  };
  const replies = record.replies ?? record.Replies;

  return {
    id: Number(record.id ?? record.Id ?? 0),
    articleId: Number(record.articleId ?? record.ArticleId ?? 0),
    articleTitle: record.articleTitle ?? record.ArticleTitle,
    rating: Number(record.rating ?? record.Rating ?? 0),
    text: String(record.text ?? record.Text ?? ''),
    likes: Number(record.likes ?? record.Likes ?? 0),
    isApproved: Boolean(record.isApproved ?? record.IsApproved),
    timeStamp: String(record.timeStamp ?? record.TimeStamp ?? ''),
    parentId: record.parentId ?? record.ParentId ?? null,
    author: normalizeCommentAuthor(record.author ?? record.Author ?? null),
    replies: normalizeArray(replies).map(normalizeArticleComment),
  };
}

function normalizeCommentAuthor(author: ArticleCommentQri['author'] | null | undefined): ArticleCommentQri['author'] | null {
  if (!author) return null;
  return {
    ...author,
    avatarUrl: author.avatarUrl ? getUserImageUrl(author.avatarUrl) : author.avatarUrl,
  };
}

export async function getArticleComments(articleId: number): Promise<PagedData<ArticleCommentQri>> {
  const raw = await apiRequest<PagedResponseRaw<ArticleCommentQri>>(
    `${BASE}/get-comments${buildQuery({
      articleId,
      onlyApproved: true,
      pageNumber: 1,
      pageSize: 100,
      needTotalCount: true,
    })}`
  );
  const data = normalizePagedResponse(raw);

  return {
    ...data,
    queryResult: data.queryResult.map(normalizeArticleComment),
  };
}

export async function addArticleComment(params: {
  articleId: number;
  content: string;
  rating?: number;
  like?: number;
  parentId?: number | null;
}): Promise<string> {
  const result = await apiRequest<{ result?: string } | string>(`${BASE}/add-comment`, {
    method: 'POST',
    body: {
      articleId: params.articleId,
      content: params.content,
      rating: params.rating ?? 0,
      like: params.like ?? 0,
      parentId: params.parentId ?? null,
    },
  });

  return typeof result === 'string' ? result : result?.result ?? 'OK';
}

export async function getArticleReactionSummary(articleId: number): Promise<ArticleReactionSummary> {
  const result = await apiRequest<ArticleReactionSummary>(
    `${BASE}/reaction-summary${buildQuery({ articleId })}`
  );
  const record = result as ArticleReactionSummary & { Likes?: number; Dislikes?: number; MyReaction?: number };

  return {
    likes: Number(record.likes ?? record.Likes ?? 0),
    dislikes: Number(record.dislikes ?? record.Dislikes ?? 0),
    myReaction: Number(record.myReaction ?? record.MyReaction ?? 0) as -1 | 0 | 1,
  };
}

export async function setArticleReaction(articleId: number, reaction: -1 | 0 | 1): Promise<ArticleReactionSummary> {
  const result = await apiRequest<ArticleReactionSummary>(`${BASE}/react`, {
    method: 'POST',
    body: { articleId, reaction },
  });
  const record = result as ArticleReactionSummary & { Likes?: number; Dislikes?: number; MyReaction?: number };

  return {
    likes: Number(record.likes ?? record.Likes ?? 0),
    dislikes: Number(record.dislikes ?? record.Dislikes ?? 0),
    myReaction: Number(record.myReaction ?? record.MyReaction ?? reaction) as -1 | 0 | 1,
  };
}

export async function addArticleToFavorites(articleId: number): Promise<string> {
  const result = await apiRequest<{ result?: string }>(`${BASE}/AddToFavorites`, {
    method: 'POST',
    body: { articleId },
  });
  return (result as { result?: string })?.result ?? 'OK';
}

export async function removeArticleFromFavorites(articleId: number): Promise<string> {
  const result = await apiRequest<{ result?: string }>(`${BASE}/RemoveFromFavorites`, {
    method: 'POST',
    body: { articleId },
  });
  return (result as { result?: string })?.result ?? 'OK';
}

export async function getMyFavoriteArticleIds(): Promise<number[]> {
  const raw = await apiRequest<number[] | { $values?: number[] }>(`${BASE}/GetMyFavoriteArticleIds`);
  return normalizeArray(raw).map((x) => Number(x)).filter((x) => !Number.isNaN(x));
}

export async function getMyFavoriteArticles(): Promise<FavoriteArticleQri[]> {
  const raw = await apiRequest<FavoriteArticleQri[] | { $values?: FavoriteArticleQri[] }>(`${BASE}/GetMyFavoriteArticles`);
  return normalizeArray(raw);
}

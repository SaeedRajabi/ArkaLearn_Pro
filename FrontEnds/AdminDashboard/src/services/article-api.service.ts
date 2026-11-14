import apiClient from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/parse-api-error-messages';
import { apiWriteUpdate } from '@/lib/api-write';

/** آیتم مقاله در پاسخ جستجو */
export type SearchArticleItem = {
  id: number;
  title: string;
  summary: string;
  slug: string;
  thumbnailUrl?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  categoryName?: string | null;
  createdAt: string;
  tags?: string[];
};

/** پاسخ صفحه‌بندی شده */
type QueryResultWrapper = {
  $id?: string;
  $values?: SearchArticleItem[] | Record<string, unknown>[];
};

type PagedResponse = {
  queryResult?: SearchArticleItem[] | QueryResultWrapper | null;
  totalCount?: number;
  QueryResult?: SearchArticleItem[] | QueryResultWrapper | null;
  TotalCount?: number;
};

function extractQueryResultArray(raw: PagedResponse): unknown[] {
  const qr = raw?.queryResult ?? raw?.QueryResult;
  if (qr == null) return [];
  if (Array.isArray(qr)) return qr;
  const withValues = qr as QueryResultWrapper;
  const arr = withValues?.$values;
  return Array.isArray(arr) ? arr : [];
}

function normalizeSearchItem(raw: Record<string, unknown>): SearchArticleItem {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    summary: String(raw.summary ?? raw.Summary ?? ''),
    slug: String(raw.slug ?? raw.Slug ?? ''),
    thumbnailUrl: (raw.thumbnailUrl ?? raw.ThumbnailUrl) as string | null | undefined,
    isPublished: Boolean(raw.isPublished ?? raw.IsPublished),
    publishedAt: (raw.publishedAt ?? raw.PublishedAt) as string | null | undefined,
    categoryName: (raw.categoryName ?? raw.CategoryName) as string | null | undefined,
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
    tags: normalizeStringArray(raw.tags ?? raw.Tags),
  };
}

function normalizeStringArray(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { $values?: unknown[] }).$values)
      ? (raw as { $values: unknown[] }).$values
      : [];

  return list
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length > 0);
}

/** جزئیات کامل مقاله */
export type ArticleByIdResponse = {
  id?: number;
  title?: string;
  summary?: string;
  content?: string;
  slug?: string;
  thumbnailUrl?: string | null;
  isPublished?: boolean;
  publishedAt?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  authorUserId?: number;
  authorName?: string | null;
  createdAt?: string;
  tags?: string[];
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};

/** پارامترهای جستجوی مقاله */
export type SearchArticlesParams = {
  inputValue?: string;
  publishedOnly?: boolean;
  categoryId?: number | null;
  authorUserId?: string | number | null;
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
  skipCount?: number;
};

const BASE = '/Article';

export async function searchArticles(params: SearchArticlesParams = {}): Promise<{
  items: SearchArticleItem[];
  totalCount: number;
}> {
  const { data } = await apiClient.get<PagedResponse>(`${BASE}/Search`, {
    params: {
      inputValue: params.inputValue ?? '',
      publishedOnly: params.publishedOnly,
      categoryId: params.categoryId,
      authorUserId: params.authorUserId != null ? String(params.authorUserId) : undefined,
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 50,
      needTotalCount: params.needTotalCount ?? true,
      skipCount: params.skipCount ?? 0,
    },
  });
  const rawList = extractQueryResultArray(data ?? {});
  const list = rawList.map((item) => normalizeSearchItem(item as Record<string, unknown>));
  let totalCount = Number(data?.totalCount ?? data?.TotalCount ?? 0);
  if (totalCount === 0 && list.length > 0) totalCount = list.length;
  return { items: list, totalCount };
}

export async function getArticleById(articleId: string): Promise<ArticleByIdResponse | null> {
  const { data } = await apiClient.get<ArticleByIdResponse>(`${BASE}/GetById`, {
    params: { ArticleId: articleId },
    timeout: 10_000,
  });
  if (!data || (data.id == null && !data.title)) return null;
  const raw = data as Record<string, unknown>;
  const tagsRaw = raw.tags ?? raw.Tags;
  const tags = normalizeStringArray(tagsRaw);
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    summary: String(raw.summary ?? raw.Summary ?? ''),
    content: String(raw.content ?? raw.Content ?? ''),
    slug: String(raw.slug ?? raw.Slug ?? ''),
    thumbnailUrl: (raw.thumbnailUrl ?? raw.ThumbnailUrl) as string | null | undefined,
    isPublished: Boolean(raw.isPublished ?? raw.IsPublished),
    publishedAt: (raw.publishedAt ?? raw.PublishedAt) as string | null | undefined,
    categoryId: (raw.categoryId ?? raw.CategoryId) as number | null | undefined,
    categoryName: (raw.categoryName ?? raw.CategoryName) as string | null | undefined,
    authorUserId: Number(raw.authorUserId ?? raw.AuthorUserId ?? 0),
    authorName: (raw.authorName ?? raw.AuthorName) as string | null | undefined,
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
    tags,
    seoTitle: (raw.seoTitle ?? raw.SeoTitle) as string | null | undefined,
    metaDescription: (raw.metaDescription ?? raw.MetaDescription) as string | null | undefined,
    ogImageUrl: (raw.ogImageUrl ?? raw.OgImageUrl) as string | null | undefined,
  };
}

export type AddArticlePayload = {
  title: string;
  summary: string;
  content: string;
  slug: string;
  thumbnailFile?: File | null;
  /** Path from media library when no file upload */
  libraryThumbnailUrl?: string | null;
  categoryId?: number | null;
  isPublished: boolean;
  tags?: string[];
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};

export type UpdateArticlePayload = {
  id: number;
  title: string;
  summary: string;
  content: string;
  slug: string;
  thumbnailUrl?: string | null;
  categoryId?: number | null;
  isPublished: boolean;
  tags?: string[];
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};

/** آپلود تصویر مقاله؛ فایل را به سرور می‌فرستد و مسیر نسبی (مثل /images/articles/xxx.png) برمی‌گرداند. */
export async function uploadArticleThumbnail(file: File): Promise<string> {
  const form = new FormData();
  form.append('thumbnailFile', file);
  const { data } = await apiClient.post<{ url?: string }>(`${BASE}/UploadThumbnail`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const url = (data as { url?: string })?.url;
  if (!url) throw new Error('Upload failed');
  return url;
}

/** افزودن مقاله با ارسال فایل عکس به صورت FormData */
export async function addArticle(payload: AddArticlePayload): Promise<string> {
  const form = new FormData();
  form.append('Title', payload.title);
  form.append('Summary', payload.summary);
  form.append('Content', payload.content);
  form.append('Slug', payload.slug);
  form.append('IsPublished', String(payload.isPublished));
  form.append('TagsJson', JSON.stringify(payload.tags ?? []));
  if (payload.seoTitle) form.append('SeoTitle', payload.seoTitle);
  if (payload.metaDescription) form.append('MetaDescription', payload.metaDescription);
  if (payload.ogImageUrl) form.append('OgImageUrl', payload.ogImageUrl);
  if (payload.categoryId != null) form.append('CategoryId', String(payload.categoryId));
  if (payload.thumbnailFile) form.append('ThumbnailUrl', payload.thumbnailFile);
  else if (payload.libraryThumbnailUrl) form.append('LibraryThumbnailUrl', payload.libraryThumbnailUrl);
  try {
    const { data } = await apiClient.post<string>(`${BASE}/Add`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return typeof data === 'string' ? data : String(data ?? '');
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to save article.'));
  }
}

export async function updateArticle(payload: UpdateArticlePayload): Promise<void> {
  await apiWriteUpdate(`${BASE}/Update`, {
    ...payload,
    tagsJson: payload.tags ? JSON.stringify(payload.tags) : undefined,
    TagsJson: payload.tags ? JSON.stringify(payload.tags) : undefined,
    seoTitle: payload.seoTitle,
    metaDescription: payload.metaDescription,
    ogImageUrl: payload.ogImageUrl,
  });
}

export async function deleteArticle(articleId: string | number): Promise<void> {
  await apiClient.delete(`${BASE}/Delete`, { params: { id: articleId } });
}

/** نویسنده نظر */
export type ArticleCommentAuthor = {
  id: number;
  fullName: string;
  userName: string;
  avatarUrl: string;
};

/** آیتم نظر مقاله */
export type ArticleCommentItem = {
  id: number;
  articleId?: number;
  articleTitle?: string | null;
  rating: number;
  text: string;
  likes: number;
  isApproved: boolean;
  timeStamp: string;
  author?: ArticleCommentAuthor | null;
  parentId?: number | null;
  replies?: ArticleCommentItem[];
};

function extractCommentArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { $values?: unknown[] }).$values)) {
    return (raw as { $values: Record<string, unknown>[] }).$values;
  }
  return [];
}

function normalizeArticleComment(rawComment: Record<string, unknown>): ArticleCommentItem {
  const authorRaw = (rawComment.author ?? rawComment.Author) as Record<string, unknown> | null | undefined;
  const repliesRaw = rawComment.replies ?? rawComment.Replies;

  return {
    id: Number(rawComment.id ?? rawComment.Id),
    articleId: Number(rawComment.articleId ?? rawComment.ArticleId ?? 0),
    articleTitle: (rawComment.articleTitle ?? rawComment.ArticleTitle) as string | null | undefined,
    rating: Number(rawComment.rating ?? rawComment.Rating ?? 0),
    text: String(rawComment.text ?? rawComment.Text ?? ''),
    likes: Number(rawComment.likes ?? rawComment.Likes ?? 0),
    isApproved: Boolean(rawComment.isApproved ?? rawComment.IsApproved),
    timeStamp: String(rawComment.timeStamp ?? rawComment.TimeStamp ?? ''),
    author: authorRaw
      ? {
          id: Number(authorRaw.id ?? authorRaw.Id),
          fullName: String(authorRaw.fullName ?? authorRaw.FullName ?? ''),
          userName: String(authorRaw.userName ?? authorRaw.UserName ?? ''),
          avatarUrl: String(authorRaw.avatarUrl ?? authorRaw.AvatarUrl ?? ''),
        }
      : null,
    parentId: (rawComment.parentId ?? rawComment.ParentId) as number | null | undefined,
    replies: extractCommentArray(repliesRaw).map(normalizeArticleComment),
  };
}

/** دریافت نظرات یک مقاله یا همه نظرات (ArticleId=0) */
export async function getArticleComments(
  articleId?: string | number | null,
  options?: { pageNumber?: number; pageSize?: number; onlyApproved?: boolean }
): Promise<{ items: ArticleCommentItem[]; totalCount: number }> {
  const id = articleId != null && articleId !== '' ? Number(articleId) : 0;
  const { data } = await apiClient.get<{
    queryResult?: ArticleCommentItem[] | { $values?: ArticleCommentItem[] };
    totalCount?: number;
  }>(`${BASE}/get-comments`, {
    params: {
      ArticleId: id,
      OnlyApproved: options?.onlyApproved ?? false,
      PageNumber: options?.pageNumber ?? 1,
      PageSize: options?.pageSize ?? 50,
    },
  });
  const raw = data?.queryResult ?? (data as Record<string, unknown>)?.QueryResult;
  const list = extractCommentArray(raw);
  const totalCount = Number((data as Record<string, unknown>)?.totalCount ?? (data as Record<string, unknown>)?.TotalCount ?? 0);
  const items = list.map(normalizeArticleComment);
  return { items, totalCount: totalCount || items.length };
}

export async function approveArticleComment(
  articleId: number | string,
  commentId: number | string,
  isApproved: boolean
): Promise<void> {
  await apiWriteUpdate(`${BASE}/approve-comment`, {
    articleId: Number(articleId),
    commentId: Number(commentId),
    isApproved,
  });
}

export async function deleteArticleComment(
  articleId: number | string,
  commentId: number | string
): Promise<void> {
  await apiClient.delete(`${BASE}/delete-comment`, {
    params: {
      ArticleId: Number(articleId),
      CommentId: Number(commentId),
    },
  });
}

export type AddArticleCommentPayload = {
  articleId: number;
  content: string;
  rating?: number;
  like?: number;
  parentId?: number | null;
};

export async function addArticleComment(payload: AddArticleCommentPayload): Promise<string> {
  const { data } = await apiClient.post<string>(`${BASE}/add-comment`, {
    articleId: payload.articleId,
    content: payload.content,
    rating: payload.rating ?? 0,
    like: payload.like ?? 0,
    parentId: payload.parentId ?? null,
  });
  return typeof data === 'string' ? data : String(data ?? '');
}

import { apiRequest, buildQuery } from './client';
import { normalizePagedResponse, type PagedData, type PagedResponseRaw } from './types';

const BASE = 'Article';

export type ProfessorArticleListItem = {
  id: number;
  title: string;
  summary: string;
  slug: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  categoryName?: string;
  createdAt: string;
  tags: string[];
};

export type ProfessorArticleDetail = {
  id: number;
  title: string;
  summary: string;
  content: string;
  slug: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  categoryId?: number;
  categoryName?: string;
  authorUserId?: number;
  authorName?: string;
  createdAt: string;
  tags: string[];
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.$values)) return obj.$values.map(String).filter(Boolean);
  }
  return [];
}

function mapListItem(row: Record<string, unknown>): ProfessorArticleListItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    summary: String(row.summary ?? row.Summary ?? ''),
    slug: String(row.slug ?? row.Slug ?? ''),
    thumbnailUrl: String(row.thumbnailUrl ?? row.ThumbnailUrl ?? '') || undefined,
    isPublished: Boolean(row.isPublished ?? row.IsPublished),
    publishedAt: String(row.publishedAt ?? row.PublishedAt ?? '') || undefined,
    categoryName: String(row.categoryName ?? row.CategoryName ?? '') || undefined,
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    tags: parseTags(row.tags ?? row.Tags),
  };
}

function mapDetail(row: Record<string, unknown>): ProfessorArticleDetail {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    summary: String(row.summary ?? row.Summary ?? ''),
    content: String(row.content ?? row.Content ?? ''),
    slug: String(row.slug ?? row.Slug ?? ''),
    thumbnailUrl: String(row.thumbnailUrl ?? row.ThumbnailUrl ?? '') || undefined,
    isPublished: Boolean(row.isPublished ?? row.IsPublished),
    publishedAt: String(row.publishedAt ?? row.PublishedAt ?? '') || undefined,
    categoryId:
      row.categoryId != null
        ? Number(row.categoryId)
        : row.CategoryId != null
          ? Number(row.CategoryId)
          : undefined,
    categoryName: String(row.categoryName ?? row.CategoryName ?? '') || undefined,
    authorUserId:
      row.authorUserId != null
        ? Number(row.authorUserId)
        : row.AuthorUserId != null
          ? Number(row.AuthorUserId)
          : undefined,
    authorName: String(row.authorName ?? row.AuthorName ?? '') || undefined,
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    tags: parseTags(row.tags ?? row.Tags),
    seoTitle: (row.seoTitle ?? row.SeoTitle) as string | null | undefined,
    metaDescription: (row.metaDescription ?? row.MetaDescription) as string | null | undefined,
    ogImageUrl: (row.ogImageUrl ?? row.OgImageUrl) as string | null | undefined,
  };
}

function unwrapDetail(raw: unknown): ProfessorArticleDetail | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? obj;
  const row =
    layer && typeof layer === 'object' && !Array.isArray(layer)
      ? (layer as Record<string, unknown>)
      : obj;
  const detail = mapDetail(row);
  return detail.id > 0 ? detail : null;
}

export async function getMyArticles(params?: {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedData<ProfessorArticleListItem>> {
  const raw = await apiRequest<PagedResponseRaw<Record<string, unknown>>>(
    `${BASE}/GetMyArticles${buildQuery({
      inputValue: params?.search ?? '',
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 50,
      needTotalCount: true,
    })}`,
    { credentials: 'include' }
  );

  const paged = normalizePagedResponse(raw);
  return {
    ...paged,
    queryResult: paged.queryResult.map((row) => mapListItem(row as Record<string, unknown>)),
  };
}

export async function getProfessorArticleById(articleId: number): Promise<ProfessorArticleDetail | null> {
  const raw = await apiRequest<unknown>(
    `${BASE}/GetById${buildQuery({ articleId })}`,
    { credentials: 'include' }
  );
  return unwrapDetail(raw);
}

export async function uploadArticleThumbnail(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const raw = await apiRequest<unknown>(`${BASE}/UploadThumbnail`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!raw || typeof raw !== 'object') throw new Error('Upload failed');
  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? obj;
  const url =
    layer && typeof layer === 'object'
      ? String((layer as Record<string, unknown>).url ?? (layer as Record<string, unknown>).Url ?? '')
      : String(obj.url ?? obj.Url ?? '');
  if (!url) throw new Error('Upload did not return a URL.');
  return url;
}

export async function addProfessorArticle(payload: {
  title: string;
  summary: string;
  content: string;
  slug: string;
  thumbnailFile?: File | null;
  categoryId?: number | null;
  isPublished: boolean;
  tags?: string[];
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
}): Promise<void> {
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

  await apiRequest(`${BASE}/Add`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
}

export async function updateProfessorArticle(payload: {
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
}): Promise<void> {
  await apiRequest(`${BASE}/Update`, {
    method: 'POST',
    credentials: 'include',
    body: {
      id: payload.id,
      title: payload.title,
      summary: payload.summary,
      content: payload.content,
      slug: payload.slug,
      thumbnailUrl: payload.thumbnailUrl ?? '',
      categoryId: payload.categoryId ?? null,
      isPublished: payload.isPublished,
      tagsJson: JSON.stringify(payload.tags ?? []),
      seoTitle: payload.seoTitle,
      metaDescription: payload.metaDescription,
      ogImageUrl: payload.ogImageUrl,
    },
  });
}

export async function deleteProfessorArticle(articleId: number): Promise<void> {
  await apiRequest(`${BASE}/Delete${buildQuery({ id: articleId })}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

export function slugifyArticleTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-\u0600-\u06FF]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'article';
}

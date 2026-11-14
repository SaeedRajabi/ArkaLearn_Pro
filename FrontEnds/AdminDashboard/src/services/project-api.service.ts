import apiClient, { resolveStaticAssetUrl } from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';

export type ProjectGalleryItem = {
  title: string;
  shortDescription: string;
  imageUrl: string;
  sortOrder: number;
};

export type SearchProjectItem = {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  tags?: string[];
  technologies?: string[];
};

export type ProjectByIdResponse = {
  id?: number;
  title?: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  thumbnailUrl?: string | null;
  introVideoUrl?: string | null;
  gitHubUrl?: string | null;
  projectUrl?: string | null;
  technologies?: string[];
  gallery?: ProjectGalleryItem[];
  isPublished?: boolean;
  publishedAt?: string | null;
  authorUserId?: number;
  authorName?: string | null;
  createdAt?: string;
  tags?: string[];
};

type QueryResultWrapper = {
  $values?: Record<string, unknown>[];
};

type PagedResponse = {
  queryResult?: SearchProjectItem[] | QueryResultWrapper | null;
  totalCount?: number;
  QueryResult?: SearchProjectItem[] | QueryResultWrapper | null;
  TotalCount?: number;
};

function extractQueryResultArray(raw: PagedResponse): unknown[] {
  const qr = raw?.queryResult ?? raw?.QueryResult;
  if (qr == null) return [];
  if (Array.isArray(qr)) return qr;
  const arr = (qr as QueryResultWrapper)?.$values;
  return Array.isArray(arr) ? arr : [];
}

function unwrapApiPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const nested = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const inner = nested as Record<string, unknown>;
    if (inner.id != null || inner.Id != null || inner.title != null || inner.Title != null) {
      return inner;
    }
  }
  return obj;
}

function extractList(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'object') return [];

  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.$values)) return obj.$values;
  if (typeof obj.data === 'object' && obj.data != null) return extractList(obj.data);
  if (typeof obj.Data === 'object' && obj.Data != null) return extractList(obj.Data);
  return [];
}

function normalizeStringArray(raw: unknown): string[] {
  const list = extractList(raw);
  return list
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        const row = item as Record<string, unknown>;
        const name = row.tagName ?? row.TagName ?? row.name ?? row.Name ?? row.title ?? row.Title;
        if (name != null) return String(name).trim();
      }
      return String(item ?? '').trim();
    })
    .filter(Boolean);
}

function parseGalleryJson(raw: unknown): ProjectGalleryItem[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    return normalizeGallery(JSON.parse(raw));
  } catch {
    return [];
  }
}

function normalizeGallery(raw: unknown): ProjectGalleryItem[] {
  const fromJson =
    typeof raw === 'string'
      ? parseGalleryJson(raw)
      : raw == null
        ? parseGalleryJson(undefined)
        : [];

  const list = fromJson.length > 0 ? fromJson : extractList(raw);
  return list.map((item, index) => {
    const row = item as Record<string, unknown>;
    return {
      title: String(row.title ?? row.Title ?? ''),
      shortDescription: String(row.shortDescription ?? row.ShortDescription ?? ''),
      imageUrl: String(row.imageUrl ?? row.ImageUrl ?? ''),
      sortOrder: Number(row.sortOrder ?? row.SortOrder ?? index),
    };
  });
}

function normalizeSearchItem(raw: Record<string, unknown>): SearchProjectItem {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    slug: String(raw.slug ?? raw.Slug ?? ''),
    shortDescription: String(raw.shortDescription ?? raw.ShortDescription ?? ''),
    thumbnailUrl: (raw.thumbnailUrl ?? raw.ThumbnailUrl) as string | null | undefined,
    isPublished: Boolean(raw.isPublished ?? raw.IsPublished),
    publishedAt: (raw.publishedAt ?? raw.PublishedAt) as string | null | undefined,
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
    tags: normalizeStringArray(raw.tags ?? raw.Tags),
    technologies: normalizeStringArray(raw.technologies ?? raw.Technologies),
  };
}

function parseStringListJson(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    return normalizeStringArray(JSON.parse(raw));
  } catch {
    return [];
  }
}

function normalizeProjectDetail(raw: Record<string, unknown>): ProjectByIdResponse {
  const tagsRaw = raw.tags ?? raw.Tags ?? raw.tagsJson ?? raw.TagsJson;
  const galleryRaw = raw.gallery ?? raw.Gallery ?? raw.galleryJson ?? raw.GalleryJson;
  const technologiesRaw = raw.technologies ?? raw.Technologies ?? raw.technologiesJson ?? raw.TechnologiesJson;

  let technologies = normalizeStringArray(technologiesRaw);
  if (technologies.length === 0 && typeof technologiesRaw === 'string') {
    technologies = parseStringListJson(technologiesRaw);
  }

  let tags = normalizeStringArray(tagsRaw);
  if (tags.length === 0 && typeof tagsRaw === 'string') {
    tags = parseStringListJson(tagsRaw);
  }

  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    slug: String(raw.slug ?? raw.Slug ?? ''),
    shortDescription: String(raw.shortDescription ?? raw.ShortDescription ?? ''),
    longDescription: String(raw.longDescription ?? raw.LongDescription ?? ''),
    thumbnailUrl: (raw.thumbnailUrl ?? raw.ThumbnailUrl) as string | null | undefined,
    introVideoUrl: (raw.introVideoUrl ?? raw.IntroVideoUrl) as string | null | undefined,
    gitHubUrl: (raw.gitHubUrl ?? raw.GitHubUrl) as string | null | undefined,
    projectUrl: (raw.projectUrl ?? raw.ProjectUrl) as string | null | undefined,
    technologies,
    gallery: normalizeGallery(galleryRaw),
    isPublished: Boolean(raw.isPublished ?? raw.IsPublished),
    publishedAt: (raw.publishedAt ?? raw.PublishedAt) as string | null | undefined,
    authorUserId: Number(raw.authorUserId ?? raw.AuthorUserId ?? 0),
    authorName: (raw.authorName ?? raw.AuthorName) as string | null | undefined,
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
    tags,
  };
}

const BASE = '/Project';

export type SearchProjectsParams = {
  inputValue?: string;
  tag?: string;
  technology?: string;
  publishedOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
  skipCount?: number;
};

export async function searchProjects(params: SearchProjectsParams = {}): Promise<{
  items: SearchProjectItem[];
  totalCount: number;
}> {
  const { data } = await apiClient.get<PagedResponse>(`${BASE}/Search`, {
    params: {
      inputValue: params.inputValue ?? '',
      tag: params.tag ?? '',
      technology: params.technology ?? '',
      publishedOnly: params.publishedOnly,
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

export async function getProjectById(projectId: string): Promise<ProjectByIdResponse | null> {
  try {
    const { data } = await apiClient.get<Record<string, unknown>>(`${BASE}/GetById`, {
      params: { ProjectId: projectId, projectId },
    });
    const raw = unwrapApiPayload(data);
    if (!raw) return null;
    const normalized = normalizeProjectDetail(raw);
    if (!normalized.id && !normalized.title) return null;
    return normalized;
  } catch {
    return null;
  }
}

export type AddProjectPayload = {
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  thumbnailFile?: File | null;
  introVideoUrl?: string;
  gitHubUrl?: string;
  projectUrl?: string;
  technologiesJson?: string;
  galleryJson?: string;
  tagsJson?: string;
  isPublished: boolean;
};

export async function addProject(payload: AddProjectPayload): Promise<string> {
  const form = new FormData();
  form.append('Title', payload.title);
  form.append('Slug', payload.slug);
  form.append('ShortDescription', payload.shortDescription);
  form.append('LongDescription', payload.longDescription);
  if (payload.thumbnailFile) form.append('ThumbnailUrl', payload.thumbnailFile);
  if (payload.introVideoUrl) form.append('IntroVideoUrl', payload.introVideoUrl);
  if (payload.gitHubUrl) form.append('GitHubUrl', payload.gitHubUrl);
  if (payload.projectUrl) form.append('ProjectUrl', payload.projectUrl);
  if (payload.technologiesJson) form.append('TechnologiesJson', payload.technologiesJson);
  if (payload.galleryJson) form.append('GalleryJson', payload.galleryJson);
  if (payload.tagsJson) form.append('TagsJson', payload.tagsJson);
  form.append('IsPublished', String(payload.isPublished));
  const { data } = await apiClient.post<string>(`${BASE}/Add`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return typeof data === 'string' ? data : String(data ?? '');
}

export type UpdateProjectPayload = {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  thumbnailUrl?: string | null;
  introVideoUrl?: string | null;
  gitHubUrl?: string | null;
  projectUrl?: string | null;
  technologiesJson?: string;
  galleryJson?: string;
  tagsJson?: string;
  isPublished: boolean;
};

export async function updateProject(payload: UpdateProjectPayload): Promise<void> {
  await apiWriteUpdate(`${BASE}/Update`, payload);
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/Delete`, { params: { id } });
}

export async function uploadProjectThumbnail(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<{ url?: string }>(`${BASE}/UploadThumbnail`, form);
  const url = data?.url ?? '';
  return url ? resolveStaticAssetUrl(url) : '';
}

export async function uploadProjectGalleryImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<{ url?: string }>(`${BASE}/UploadGalleryImage`, form);
  const url = data?.url ?? '';
  return url ? resolveStaticAssetUrl(url) : '';
}

export async function uploadProjectIntroVideo(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<{ url?: string }>(`${BASE}/UploadIntroVideo`, form);
  const url = data?.url ?? '';
  return url ? resolveStaticAssetUrl(url) : '';
}

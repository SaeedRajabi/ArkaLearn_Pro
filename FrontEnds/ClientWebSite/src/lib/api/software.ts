import { apiRequest, buildQuery } from './client';
import { normalizePagedResponse, type PagedData } from './types';

const BASE = 'Software';

export type SoftwareListItem = {
  id: number;
  teacherId?: number;
  title: string;
  shortDescription: string;
  coverImageUrl?: string;
  categoryId?: number;
  categoryName?: string;
  categoryPath?: string[];
  slug: string;
  tags: string[];
  downloadCount: number;
  likeCount: number;
  isLikedByViewer: boolean;
  isPlatformOwned: boolean;
  approvalStatus?: string;
  teacherDisplayName?: string;
  teacherUserName?: string;
  teacherAvatarUrl?: string;
};

export type SoftwareDetail = SoftwareListItem & {
  longDescriptionHtml: string;
  installerFileUrl?: string;
  installerFileName?: string;
  seoTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
};

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.$values)) return obj.$values.map(String).filter(Boolean);
  }
  return [];
}

function mapListItem(row: Record<string, unknown>): SoftwareListItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    teacherId:
      row.teacherId != null
        ? Number(row.teacherId)
        : row.TeacherId != null
          ? Number(row.TeacherId)
          : undefined,
    title: String(row.title ?? row.Title ?? ''),
    shortDescription: String(row.shortDescription ?? row.ShortDescription ?? ''),
    coverImageUrl: String(row.coverImageUrl ?? row.CoverImageUrl ?? '') || undefined,
    categoryId:
      row.categoryId != null
        ? Number(row.categoryId)
        : row.CategoryId != null
          ? Number(row.CategoryId)
          : undefined,
    categoryName: String(row.categoryName ?? row.CategoryName ?? '') || undefined,
    categoryPath: parseTags(row.categoryPath ?? row.CategoryPath),
    slug: String(row.slug ?? row.Slug ?? ''),
    tags: parseTags(row.tags ?? row.Tags),
    downloadCount: Number(row.downloadCount ?? row.DownloadCount ?? 0),
    likeCount: Number(row.likeCount ?? row.LikeCount ?? 0),
    isLikedByViewer: Boolean(row.isLikedByViewer ?? row.IsLikedByViewer),
    isPlatformOwned: Boolean(row.isPlatformOwned ?? row.IsPlatformOwned),
    approvalStatus: String(row.approvalStatus ?? row.ApprovalStatus ?? '') || undefined,
    teacherDisplayName: String(row.teacherDisplayName ?? row.TeacherDisplayName ?? '') || undefined,
    teacherUserName: String(row.teacherUserName ?? row.TeacherUserName ?? '') || undefined,
    teacherAvatarUrl: String(row.teacherAvatarUrl ?? row.TeacherAvatarUrl ?? '') || undefined,
  };
}

function mapDetail(row: Record<string, unknown>): SoftwareDetail {
  return {
    ...mapListItem(row),
    longDescriptionHtml: String(row.longDescriptionHtml ?? row.LongDescriptionHtml ?? ''),
    installerFileUrl: String(row.installerFileUrl ?? row.InstallerFileUrl ?? '') || undefined,
    installerFileName: String(row.installerFileName ?? row.InstallerFileName ?? '') || undefined,
    seoTitle: String(row.seoTitle ?? row.SeoTitle ?? '') || undefined,
    metaDescription: String(row.metaDescription ?? row.MetaDescription ?? '') || undefined,
    ogImageUrl: String(row.ogImageUrl ?? row.OgImageUrl ?? '') || undefined,
  };
}

export async function searchSoftware(params?: {
  search?: string;
  tag?: string;
  categoryId?: number;
  teacherId?: number;
  pageNumber?: number;
  pageSize?: number;
  forEdit?: boolean;
  platformOnly?: boolean;
}): Promise<PagedData<SoftwareListItem>> {
  const raw = await apiRequest<unknown>(
    `${BASE}/Search${buildQuery({
      search: params?.search,
      tag: params?.tag,
      categoryId: params?.categoryId,
      teacherId: params?.teacherId,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 24,
      forEdit: params?.forEdit,
      platformOnly: params?.platformOnly,
    })}`,
    params?.forEdit ? { credentials: 'include' } : undefined
  );

  if (!raw || typeof raw !== 'object') {
    return { queryResult: [], totalCount: 0, pageNumber: 1, pageSize: 24 };
  }

  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? obj;
  const paged = normalizePagedResponse(layer as Parameters<typeof normalizePagedResponse>[0]);
  return {
    ...paged,
    queryResult: paged.queryResult.map((row) => mapListItem(row as unknown as Record<string, unknown>)),
  };
}

function unwrapSoftwareDetail(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const candidates = [obj.data, obj.Data, obj.queryResult, obj.QueryResult, obj._data, obj];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    const row = candidate as Record<string, unknown>;
    if (row.id ?? row.Id ?? row.slug ?? row.Slug) return row;
  }
  return null;
}

export async function getSoftwareBySlug(
  slug: string,
  options?: { headers?: HeadersInit }
): Promise<SoftwareDetail | null> {
  const normalizedSlug = decodeURIComponent(slug.trim());
  if (!normalizedSlug) return null;

  const raw = await apiRequest<unknown>(
    `${BASE}/GetBySlug${buildQuery({ slug: normalizedSlug })}`,
    { headers: options?.headers, credentials: 'include' }
  );

  const row = unwrapSoftwareDetail(raw);
  if (!row) return null;
  const item = mapDetail(row);
  return item.id > 0 || item.slug ? item : null;
}

function unwrapCommandNumber(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (!raw || typeof raw !== 'object') return 0;
  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? obj;
  if (typeof layer === 'number') return layer;
  if (layer && typeof layer === 'object') {
    const inner = layer as Record<string, unknown>;
    const value = inner.data ?? inner.Data ?? inner.queryResult ?? inner.QueryResult;
    if (typeof value === 'number') return value;
  }
  return 0;
}

export async function recordSoftwareDownload(softwareId: number): Promise<number> {
  if (!Number.isFinite(softwareId) || softwareId <= 0) {
    return 0;
  }

  const raw = await apiRequest<unknown>(`${BASE}/RecordDownload`, {
    method: 'POST',
    body: { softwareId, SoftwareId: softwareId },
  });
  return unwrapCommandNumber(raw);
}

export async function toggleSoftwareLike(softwareId: number): Promise<{ likeCount: number; isLiked: boolean }> {
  const raw = await apiRequest<unknown>(`${BASE}/ToggleLike`, {
    method: 'POST',
    credentials: 'include',
    body: { softwareId },
  });
  if (!raw || typeof raw !== 'object') return { likeCount: 0, isLiked: false };
  const obj = raw as Record<string, unknown>;
  const layer = (obj.data ?? obj.Data ?? obj) as Record<string, unknown>;
  return {
    likeCount: Number(layer.likeCount ?? layer.LikeCount ?? 0),
    isLiked: Boolean(layer.isLiked ?? layer.IsLiked),
  };
}

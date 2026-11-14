import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';

export type SoftwareListItem = {
  id: number;
  title: string;
  shortDescription: string;
  coverImageUrl?: string;
  categoryId?: number;
  categoryName?: string;
  slug: string;
  tags: string[];
  downloadCount: number;
  likeCount: number;
  isPlatformOwned: boolean;
  sortOrder?: number;
};

export type SoftwareDetail = SoftwareListItem & {
  longDescriptionHtml: string;
  installerFileUrl?: string;
  installerFileName?: string;
  seoTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
};

type PagedResponse = {
  queryResult?: SoftwareListItem[] | { $values?: unknown[] };
  totalCount?: number;
};

function extractList(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'object') return [];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.$values)) return obj.$values;
  const qr = obj.queryResult ?? obj.QueryResult;
  if (Array.isArray(qr)) return qr;
  if (qr && typeof qr === 'object' && Array.isArray((qr as { $values?: unknown[] }).$values)) {
    return (qr as { $values: unknown[] }).$values;
  }
  return [];
}

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return [];
}

function mapListItem(row: Record<string, unknown>): SoftwareListItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    shortDescription: String(row.shortDescription ?? row.ShortDescription ?? ''),
    coverImageUrl: String(row.coverImageUrl ?? row.CoverImageUrl ?? '') || undefined,
    categoryId:
      row.categoryId != null ? Number(row.categoryId) : row.CategoryId != null ? Number(row.CategoryId) : undefined,
    categoryName: String(row.categoryName ?? row.CategoryName ?? '') || undefined,
    slug: String(row.slug ?? row.Slug ?? ''),
    tags: parseTags(row.tags ?? row.Tags),
    downloadCount: Number(row.downloadCount ?? row.DownloadCount ?? 0),
    likeCount: Number(row.likeCount ?? row.LikeCount ?? 0),
    isPlatformOwned: Boolean(row.isPlatformOwned ?? row.IsPlatformOwned ?? true),
    sortOrder: Number(row.sortOrder ?? row.SortOrder ?? 0),
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

function unwrapPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const nested = obj.data ?? obj.Data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) return nested as Record<string, unknown>;
  return obj;
}

function unwrapDetailPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const candidates = [
    obj.data,
    obj.Data,
    obj.queryResult,
    obj.QueryResult,
    obj._data,
    obj,
  ];
  for (const candidate of candidates) {
    const unwrapped = unwrapPayload(candidate);
    if (unwrapped && (unwrapped.id ?? unwrapped.Id ?? unwrapped.slug ?? unwrapped.Slug)) {
      return unwrapped;
    }
  }
  return unwrapPayload(obj);
}

export async function getPlatformSoftwareBySlug(slug: string): Promise<SoftwareDetail | null> {
  if (!slug.trim()) return null;
  const response = await apiClient.get<unknown>('/Software/GetBySlug', { params: { slug: slug.trim() } });
  const layer = unwrapDetailPayload(response.data);
  if (!layer) return null;
  const detail = mapDetail(layer);
  return detail.id > 0 || detail.slug ? detail : null;
}

export async function searchPlatformSoftware(params?: {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: SoftwareListItem[]; totalCount: number }> {
  const response = await apiClient.get<PagedResponse>('/Software/Search', {
    params: {
      search: params?.search ?? '',
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 50,
      forEdit: true,
      platformOnly: true,
    },
  });
  const raw = response.data as Record<string, unknown>;
  const list = extractList(raw?.queryResult ?? raw?.QueryResult ?? raw);
  return {
    items: list.map((row) => mapListItem(row as Record<string, unknown>)).filter((s) => s.id > 0),
    totalCount: Number(raw?.totalCount ?? raw?.TotalCount ?? list.length),
  };
}

export async function savePlatformSoftware(payload: {
  softwareId?: number;
  title: string;
  shortDescription: string;
  longDescriptionHtml: string;
  coverImageUrl?: string;
  installerFileUrl?: string;
  installerFileName?: string;
  categoryId?: number | null;
  tags?: string[];
  sortOrder?: number;
  seoTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
}): Promise<number> {
  const body: Record<string, unknown> = {
    softwareId: payload.softwareId ?? 0,
    title: payload.title,
    shortDescription: payload.shortDescription,
    longDescriptionHtml: payload.longDescriptionHtml,
    coverImageUrl: payload.coverImageUrl ?? '',
    categoryId: payload.categoryId ?? null,
    tags: payload.tags ?? [],
    sortOrder: payload.sortOrder ?? 0,
    seoTitle: payload.seoTitle ?? '',
    metaDescription: payload.metaDescription ?? '',
    ogImageUrl: payload.ogImageUrl ?? '',
  };
  if (payload.installerFileUrl?.trim()) {
    body.installerFileUrl = payload.installerFileUrl.trim();
    body.installerFileName = payload.installerFileName?.trim() ?? '';
  }
  const response = await apiWriteUpdate<number>('/Software/SavePlatformSoftware', body);
  return Number(response ?? 0);
}

export async function deletePlatformSoftware(softwareId: number): Promise<void> {
  await apiClient.delete('/Software/Delete', { data: { softwareId } });
}

export async function uploadSoftwareCover(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post('/Software/UploadCover', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const payload = unwrapPayload(response.data);
  const url = String(payload?.url ?? payload?.Url ?? '');
  if (!url) throw new Error('Cover upload failed.');
  return url;
}

export async function uploadSoftwareInstaller(file: File): Promise<{ url: string; fileName: string }> {
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post('/Software/UploadInstaller', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const payload = unwrapPayload(response.data);
  const url = String(payload?.url ?? payload?.Url ?? '');
  const fileName = String(payload?.fileName ?? payload?.FileName ?? file.name);
  if (!url) throw new Error('Installer upload failed.');
  return { url, fileName };
}

export function mapSoftwareForEdit(row: Record<string, unknown>): SoftwareDetail {
  return mapDetail(row);
}

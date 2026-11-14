import apiClient from '@/lib/apiClient';
import { asLongId, isValidLongId } from '@/lib/id';
import { getApiErrorMessage } from '@/lib/parse-api-error-messages';
import { apiWriteUpdate } from '@/lib/api-write';

export type MediaAssetItem = {
  id: string;
  ownerUserId: string;
  ownerName?: string | null;
  fileUrl: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  mediaType: number;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
  width?: number | null;
  height?: number | null;
  approvalStatus: number;
  rejectionReason?: string | null;
  isRejectionDismissed: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type MediaAssetOwnerItem = {
  ownerUserId: string;
  ownerName: string;
  mediaCount: number;
  lastUploadedAtUtc?: string | null;
};

export type PagedMediaAssets = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: MediaAssetItem[];
};

export type PagedMediaAssetOwners = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: MediaAssetOwnerItem[];
};

export type MediaSelection = {
  id: string;
  fileUrl: string;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
  mimeType: string;
};

export const MEDIA_APPROVAL = {
  pending: 0,
  approved: 1,
  rejected: 2,
} as const;

export const ALLOWED_UPLOAD_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.jpg,.jpeg,.png,.webp,.gif,.svg,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.avi,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.exe,.msi,.dmg,.pkg,.deb,.rpm,.apk';

function normalizeMediaType(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'image' || normalized === '0') return 0;
  if (normalized === 'video' || normalized === '1') return 1;
  if (normalized === 'audio' || normalized === '2') return 2;
  if (normalized === 'document' || normalized === '3') return 3;
  if (normalized === 'other' || normalized === 'archive' || normalized === '4') return 4;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeMediaAsset(raw: Record<string, unknown>): MediaAssetItem {
  return {
    id: asLongId(raw.id ?? raw.Id ?? 0),
    ownerUserId: asLongId(raw.ownerUserId ?? raw.OwnerUserId ?? 0),
    ownerName: (raw.ownerName ?? raw.OwnerName) as string | null | undefined,
    fileUrl: String(raw.fileUrl ?? raw.FileUrl ?? ''),
    originalFileName: String(raw.originalFileName ?? raw.OriginalFileName ?? ''),
    mimeType: String(raw.mimeType ?? raw.MimeType ?? ''),
    fileSizeBytes: Number(raw.fileSizeBytes ?? raw.FileSizeBytes ?? 0),
    mediaType: normalizeMediaType(raw.mediaType ?? raw.MediaType),
    title: (raw.title ?? raw.Title) as string | null | undefined,
    altText: (raw.altText ?? raw.AltText) as string | null | undefined,
    caption: (raw.caption ?? raw.Caption) as string | null | undefined,
    description: (raw.description ?? raw.Description) as string | null | undefined,
    width: (raw.width ?? raw.Width) as number | null | undefined,
    height: (raw.height ?? raw.Height) as number | null | undefined,
    approvalStatus: Number(raw.approvalStatus ?? raw.ApprovalStatus ?? 1),
    rejectionReason: (raw.rejectionReason ?? raw.RejectionReason) as string | null | undefined,
    isRejectionDismissed: Boolean(raw.isRejectionDismissed ?? raw.IsRejectionDismissed ?? false),
    createdAtUtc: String(raw.createdAtUtc ?? raw.CreatedAtUtc ?? ''),
    updatedAtUtc: String(raw.updatedAtUtc ?? raw.UpdatedAtUtc ?? ''),
  };
}

function normalizeOwner(raw: Record<string, unknown>): MediaAssetOwnerItem {
  return {
    ownerUserId: asLongId(raw.ownerUserId ?? raw.OwnerUserId ?? 0),
    ownerName: String(raw.ownerName ?? raw.OwnerName ?? ''),
    mediaCount: Number(raw.mediaCount ?? raw.MediaCount ?? 0),
    lastUploadedAtUtc: (raw.lastUploadedAtUtc ?? raw.LastUploadedAtUtc) as string | null | undefined,
  };
}

function normalizePaged(raw: Record<string, unknown>): PagedMediaAssets {
  const itemsRaw = raw.items ?? raw.Items;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map((item) => normalizeMediaAsset(item as Record<string, unknown>))
    : itemsRaw && typeof itemsRaw === 'object' && Array.isArray((itemsRaw as { $values?: unknown[] }).$values)
      ? (itemsRaw as { $values: Record<string, unknown>[] }).$values.map(normalizeMediaAsset)
      : [];

  return {
    page: Number(raw.page ?? raw.Page ?? 1),
    pageSize: Number(raw.pageSize ?? raw.PageSize ?? 24),
    totalCount: Number(raw.totalCount ?? raw.TotalCount ?? items.length),
    items,
  };
}

function normalizeOwnersPaged(raw: Record<string, unknown>): PagedMediaAssetOwners {
  const itemsRaw = raw.items ?? raw.Items;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map((item) => normalizeOwner(item as Record<string, unknown>))
    : itemsRaw && typeof itemsRaw === 'object' && Array.isArray((itemsRaw as { $values?: unknown[] }).$values)
      ? (itemsRaw as { $values: Record<string, unknown>[] }).$values.map(normalizeOwner)
      : [];

  return {
    page: Number(raw.page ?? raw.Page ?? 1),
    pageSize: Number(raw.pageSize ?? raw.PageSize ?? 10),
    totalCount: Number(raw.totalCount ?? raw.TotalCount ?? items.length),
    items,
  };
}

const BASE = '/Media';

export async function listMediaAssets(params: {
  ownerUserId?: string;
  mediaType?: number;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PagedMediaAssets> {
  const { data } = await apiClient.get<Record<string, unknown>>(`${BASE}/List`, {
    params: {
      ownerUserId:
        params.ownerUserId && isValidLongId(params.ownerUserId) ? params.ownerUserId : undefined,
      mediaType: params.mediaType,
      search: params.search ?? '',
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 24,
    },
  });
  const payload = (data as { _data?: Record<string, unknown> })?._data ?? data ?? {};
  return normalizePaged(payload as Record<string, unknown>);
}

export async function listMediaAssetOwners(params: {
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PagedMediaAssetOwners> {
  const { data } = await apiClient.get<Record<string, unknown>>(`${BASE}/ListOwners`, {
    params: {
      search: params.search ?? '',
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    },
  });
  const payload = (data as { _data?: Record<string, unknown> })?._data ?? data ?? {};
  return normalizeOwnersPaged(payload as Record<string, unknown>);
}

export type MediaUploadResult = {
  id: string;
  fileUrl: string;
};

function parseMediaUploadResult(raw: unknown): MediaUploadResult {
  let cur: unknown = raw;
  for (let depth = 0; depth < 4; depth++) {
    if (cur == null) break;
    if (typeof cur === 'number' || typeof cur === 'string') {
      return { id: asLongId(cur), fileUrl: '' };
    }
    if (typeof cur !== 'object' || Array.isArray(cur)) break;
    const obj = cur as Record<string, unknown>;
    if ('id' in obj || 'Id' in obj || 'fileUrl' in obj || 'FileUrl' in obj) {
      return {
        id: asLongId(obj.id ?? obj.Id ?? 0),
        fileUrl: String(obj.fileUrl ?? obj.FileUrl ?? ''),
      };
    }
    cur = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult;
  }
  return { id: '0', fileUrl: '' };
}

export async function uploadMediaAsset(
  input: {
    file: File;
    ownerUserId?: string;
    title?: string;
    altText?: string;
    caption?: string;
    description?: string;
    encryptForDesktop?: boolean;
    preferredFileName?: string;
  },
  onProgress?: (percent: number) => void
): Promise<MediaUploadResult> {
  const form = new FormData();
  form.append('file', input.file);
  if (input.ownerUserId && isValidLongId(input.ownerUserId)) {
    form.append('ownerUserId', input.ownerUserId);
  }
  if (input.title) form.append('title', input.title);
  if (input.altText) form.append('altText', input.altText);
  if (input.caption) form.append('caption', input.caption);
  if (input.description) form.append('description', input.description);
  if (input.encryptForDesktop) form.append('encryptForDesktop', 'true');
  if (input.preferredFileName?.trim()) {
    form.append('preferredFileName', input.preferredFileName.trim());
  }
  try {
    const { data } = await apiClient.post<unknown>(`${BASE}/Upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    });
    const result = parseMediaUploadResult(data);
    if (!isValidLongId(result.id)) {
      throw new Error('Media upload failed.');
    }
    if (!result.fileUrl?.trim()) {
      throw new Error('Media upload returned no file URL.');
    }
    onProgress?.(100);
    return result;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Media upload failed.'));
  }
}

export async function updateMediaAssetMetadata(input: {
  id: string;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
}): Promise<void> {
  await apiWriteUpdate(`${BASE}/UpdateMetadata`, input);
}

export async function deleteMediaAsset(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/Delete`, { params: { id: asLongId(id) } });
}

export async function rejectMediaAsset(id: string, reason: string): Promise<void> {
  await apiWriteUpdate(`${BASE}/Reject`, { id: asLongId(id), reason });
}

export async function dismissMediaRejection(id: string): Promise<void> {
  await apiWriteUpdate(`${BASE}/DismissRejection`, { id });
}

export function mediaAssetToSelection(item: MediaAssetItem): MediaSelection {
  return {
    id: item.id,
    fileUrl: item.fileUrl,
    title: item.title,
    altText: item.altText,
    caption: item.caption,
    description: item.description,
    mimeType: item.mimeType,
  };
}

export function isMediaSelectable(item: MediaAssetItem): boolean {
  return item.approvalStatus === MEDIA_APPROVAL.approved;
}

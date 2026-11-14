import { apiRequest, buildQuery } from './client';
import { API_BASE_URL } from './config';

export type MediaAssetItem = {
  id: number;
  ownerUserId: number;
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

export type PagedMediaAssets = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: MediaAssetItem[];
};

export type MediaSelection = {
  id: number;
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
  'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.jpg,.jpeg,.png,.webp,.gif,.svg,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.avi,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar';

const BASE = 'Media';

function normalizeArray<T>(raw: T[] | { $values?: T[] } | null | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && Array.isArray((raw as { $values?: T[] }).$values))
    return (raw as { $values: T[] }).$values;
  return [];
}

function normalizeMediaAsset(raw: Record<string, unknown>): MediaAssetItem {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    ownerUserId: Number(raw.ownerUserId ?? raw.OwnerUserId ?? 0),
    ownerName: (raw.ownerName ?? raw.OwnerName) as string | null | undefined,
    fileUrl: String(raw.fileUrl ?? raw.FileUrl ?? ''),
    originalFileName: String(raw.originalFileName ?? raw.OriginalFileName ?? ''),
    mimeType: String(raw.mimeType ?? raw.MimeType ?? ''),
    fileSizeBytes: Number(raw.fileSizeBytes ?? raw.FileSizeBytes ?? 0),
    mediaType: Number(raw.mediaType ?? raw.MediaType ?? 0),
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

function normalizePaged(raw: Record<string, unknown>): PagedMediaAssets {
  const items = normalizeArray(raw.items ?? raw.Items).map((item) =>
    normalizeMediaAsset(item as Record<string, unknown>)
  );
  return {
    page: Number(raw.page ?? raw.Page ?? 1),
    pageSize: Number(raw.pageSize ?? raw.PageSize ?? 24),
    totalCount: Number(raw.totalCount ?? raw.TotalCount ?? items.length),
    items,
  };
}

export async function listMediaAssets(params: {
  ownerUserId?: number;
  mediaType?: number;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PagedMediaAssets> {
  const q: Record<string, string | number> = {
    search: params.search ?? '',
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 24,
  };
  if (params.ownerUserId != null) q.ownerUserId = params.ownerUserId;
  if (params.mediaType != null) q.mediaType = params.mediaType;

  const raw = await apiRequest<Record<string, unknown>>(`${BASE}/List${buildQuery(q)}`);
  const payload = (raw as { _data?: Record<string, unknown> })._data ?? raw;
  return normalizePaged(payload as Record<string, unknown>);
}

export async function uploadMediaAsset(
  input: {
    file: File;
    title?: string;
    altText?: string;
    caption?: string;
    description?: string;
    encryptForDesktop?: boolean;
  },
  onProgress?: (percent: number) => void
): Promise<{ id: number; fileUrl: string }> {
  const form = new FormData();
  form.append('file', input.file);
  if (input.title) form.append('title', input.title);
  if (input.altText) form.append('altText', input.altText);
  if (input.caption) form.append('caption', input.caption);
  if (input.description) form.append('description', input.description);
  if (input.encryptForDesktop) form.append('encryptForDesktop', 'true');

  // Use XHR for upload progress (fetch has no reliable progress API).
  const result = await new Promise<{ id: number; fileUrl: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL.replace(/\/$/, '')}/${BASE}/Upload`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
        return;
      }
      try {
        const parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        let cur: unknown = parsed;
        for (let i = 0; i < 4; i++) {
          if (cur == null) break;
          if (typeof cur === 'number' || typeof cur === 'string') {
            resolve({ id: Number(cur), fileUrl: '' });
            return;
          }
          if (typeof cur !== 'object' || Array.isArray(cur)) break;
          const obj = cur as Record<string, unknown>;
          if ('id' in obj || 'Id' in obj || 'fileUrl' in obj || 'FileUrl' in obj) {
            resolve({
              id: Number(obj.id ?? obj.Id ?? 0),
              fileUrl: String(obj.fileUrl ?? obj.FileUrl ?? ''),
            });
            return;
          }
          cur = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult;
        }
        resolve({ id: 0, fileUrl: '' });
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = () => reject(new Error('Media upload failed.'));
    xhr.send(form);
  });

  if (!result.id) throw new Error('Media upload failed.');
  if (!result.fileUrl?.trim()) throw new Error('Media upload returned no file URL.');
  onProgress?.(100);
  return result;
}

export async function updateMediaAssetMetadata(input: {
  id: number;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
}): Promise<void> {
  await apiRequest(`${BASE}/UpdateMetadata`, { method: 'PUT', body: input });
}

export async function deleteMediaAsset(id: number): Promise<void> {
  await apiRequest(`${BASE}/Delete${buildQuery({ id })}`, { method: 'DELETE' });
}

export async function dismissMediaRejection(id: number): Promise<void> {
  await apiRequest(`${BASE}/DismissRejection`, { method: 'POST', body: { id } });
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

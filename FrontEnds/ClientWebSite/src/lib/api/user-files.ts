import { apiRequest, buildQuery } from './client';

const BASE = 'UserFile';

export interface UserFileItem {
  id: number;
  userId: number;
  parentId: number | null;
  name: string;
  isFolder: boolean;
  fileUrl: string | null;
  fileSize: number;
  createdAt: string;
}

function extractCollection(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];

  const record = raw as Record<string, unknown>;
  const candidates = [record.$values, record.data, record.Data, record._data, record._Data];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (
      candidate &&
      typeof candidate === 'object' &&
      Array.isArray((candidate as { $values?: unknown[] }).$values)
    ) {
      return (candidate as { $values: unknown[] }).$values;
    }
  }

  return [];
}

function normalizeUserFile(raw: unknown): UserFileItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  return {
    id: Number(item.id ?? item.Id ?? 0),
    userId: Number(item.userId ?? item.UserId ?? 0),
    parentId: item.parentId ?? item.ParentId ? Number(item.parentId ?? item.ParentId) : null,
    name: String(item.name ?? item.Name ?? ''),
    isFolder: Boolean(item.isFolder ?? item.IsFolder),
    fileUrl: item.fileUrl ?? item.FileUrl ? String(item.fileUrl ?? item.FileUrl) : null,
    fileSize: Number(item.fileSize ?? item.FileSize ?? 0),
    createdAt: String(item.createdAt ?? item.CreatedAt ?? ''),
  };
}

export function getUserFileDownloadUrl(fileId: number): string {
  return `/api/download/user-file?fileId=${encodeURIComponent(String(fileId))}`;
}

export function toUserFileDownloadUrl(fileUrl?: string | null): string {
  if (!fileUrl) return '#';

  if (/^https?:\/\//i.test(fileUrl)) {
    try {
      const parsed = new URL(fileUrl);
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === 'arkasoftware.ir' ||
        host.endsWith('.arkasoftware.ir')
      ) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return fileUrl;
    }
  }

  return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
}

export async function getMyUserFiles(parentId?: number | null): Promise<UserFileItem[]> {
  const raw = await apiRequest<unknown>(
    `${BASE}/GetMyFiles${buildQuery({ parentId: parentId ?? undefined, _: Date.now() })}`,
    {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    }
  );

  return extractCollection(raw)
    .map(normalizeUserFile)
    .filter((item): item is UserFileItem => Boolean(item?.id));
}

/** Best-effort: notify teachers after the student finishes downloading a shared file. */
export async function notifyUserFileDownloadCompleted(fileId: number): Promise<void> {
  if (!fileId || fileId <= 0) return;
  try {
    await apiRequest(`${BASE}/NotifyDownloadCompleted`, {
      method: 'POST',
      body: { fileId },
    });
  } catch {
    // Non-blocking for the download UX.
  }
}

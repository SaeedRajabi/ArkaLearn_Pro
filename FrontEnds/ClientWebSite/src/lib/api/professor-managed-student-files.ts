import { apiRequest, buildQuery } from './client';

const BASE = 'UserFile';

export interface ManagedStudentFileItem {
  id: number;
  userId: number;
  parentId: number | null;
  name: string;
  isFolder: boolean;
  fileUrl: string | null;
  fileSize: number;
  createdAt: string;
}

export const MAX_MANAGED_STUDENT_FILE_BYTES = 3 * 1024 * 1024 * 1024;

function extractCollection(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];

  let cur: unknown = raw;
  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(cur)) return cur;
    if (!cur || typeof cur !== 'object') return [];
    const record = cur as Record<string, unknown>;
    for (const key of ['$values', 'data', 'Data', 'queryResult', 'QueryResult']) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate;
    }
    const next = record.data ?? record.Data ?? record.queryResult ?? record.QueryResult;
    if (next == null || next === cur) break;
    cur = next;
  }
  return [];
}

function normalizeFile(raw: unknown): ManagedStudentFileItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const id = Number(item.id ?? item.Id ?? 0);
  if (!id) return null;
  return {
    id,
    userId: Number(item.userId ?? item.UserId ?? 0),
    parentId: item.parentId ?? item.ParentId ? Number(item.parentId ?? item.ParentId) : null,
    name: String(item.name ?? item.Name ?? ''),
    isFolder: Boolean(item.isFolder ?? item.IsFolder),
    fileUrl: item.fileUrl ?? item.FileUrl ? String(item.fileUrl ?? item.FileUrl) : null,
    fileSize: Number(item.fileSize ?? item.FileSize ?? 0),
    createdAt: String(item.createdAt ?? item.CreatedAt ?? ''),
  };
}

export async function getManagedStudentFiles(
  studentId: number,
  parentId?: number | null
): Promise<ManagedStudentFileItem[]> {
  const raw = await apiRequest<unknown>(
    `${BASE}/GetFiles${buildQuery({
      userId: studentId,
      parentId: parentId && parentId > 0 ? parentId : undefined,
      _: Date.now(),
    })}`,
    {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    }
  );
  return extractCollection(raw)
    .map(normalizeFile)
    .filter((item): item is ManagedStudentFileItem => Boolean(item?.id));
}

export async function createManagedStudentFolder(
  studentId: number,
  name: string,
  parentId?: number | null
): Promise<number> {
  const raw = await apiRequest<unknown>(`${BASE}/CreateFolder`, {
    method: 'POST',
    body: {
      userId: studentId,
      name: name.trim(),
      parentId: parentId && parentId > 0 ? parentId : null,
    },
  });
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && raw.trim()) return Number(raw) || 0;

  let cur: unknown = raw;
  for (let depth = 0; depth < 6; depth++) {
    if (cur == null || typeof cur !== 'object' || Array.isArray(cur)) break;
    const obj = cur as Record<string, unknown>;
    const direct = Number(obj.id ?? obj.Id ?? 0);
    if (direct > 0) return direct;
    const next = obj.data ?? obj.Data ?? obj._data ?? obj.result ?? obj.Result;
    if (typeof next === 'number' && next > 0) return next;
    if (typeof next === 'string' && Number(next) > 0) return Number(next);
    if (next === cur || next == null) break;
    cur = next;
  }
  return 0;
}

export async function renameManagedStudentFile(
  fileId: number,
  studentId: number,
  name: string
): Promise<void> {
  await apiRequest(`${BASE}/Rename`, {
    method: 'POST',
    body: { fileId, userId: studentId, name: name.trim() },
  });
}

export async function deleteManagedStudentFile(fileId: number, studentId: number): Promise<void> {
  await apiRequest(`${BASE}/Delete`, {
    method: 'POST',
    body: { fileId, userId: studentId },
  });
}

export async function uploadManagedStudentFile(
  studentId: number,
  file: File,
  parentId?: number | null
): Promise<void> {
  if (file.size > MAX_MANAGED_STUDENT_FILE_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }
  const { createUserFileChunkedUploadTask } = await import('@/lib/upload/user-file-chunked-upload');
  const task = createUserFileChunkedUploadTask(studentId, file, parentId);
  await task.start();
}

export { createUserFileChunkedUploadTask } from '@/lib/upload/user-file-chunked-upload';
export type {
  ChunkedUploadProgress,
  ChunkedUploadStatus,
  UserFileChunkedUploadComplete,
  UserFileChunkedUploadTask,
} from '@/lib/upload/user-file-chunked-upload';

export function toManagedStudentFileDownloadUrl(fileUrl?: string | null): string {
  if (!fileUrl) return '#';
  return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
}

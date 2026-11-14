import apiClient from '@/lib/apiClient';
import axios from 'axios';
import { asLongId } from '@/lib/id';

const BASE = '/UserFile';

export interface UserFileItem {
  id: number;
  userId: string;
  parentId: number | null;
  name: string;
  isFolder: boolean;
  fileUrl: string | null;
  fileSize: number;
  createdAt: string;
}

function unwrapApiPayload(payload: unknown): unknown {
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) return payload;

  let cur = payload as Record<string, unknown>;
  for (let depth = 0; depth < 6; depth++) {
    if (Array.isArray(cur)) return cur;

    const next =
      (cur.data && typeof cur.data === 'object' && !Array.isArray(cur.data)
        ? (cur.data as Record<string, unknown>)
        : null) ??
      (cur.Data && typeof cur.Data === 'object' && !Array.isArray(cur.Data)
        ? (cur.Data as Record<string, unknown>)
        : null) ??
      (cur._data !== undefined ? cur._data : null) ??
      (cur.result && typeof cur.result === 'object' && !Array.isArray(cur.result)
        ? (cur.result as Record<string, unknown>)
        : null);

    if (next === null || next === cur) break;
    cur = next as Record<string, unknown>;
  }

  return cur;
}

function normalizeUserFileItem(item: unknown): UserFileItem | null {
  if (!item || typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;
  const id = Number(o.id ?? o.Id ?? 0);
  if (!id) return null;

  const parentRaw = o.parentId ?? o.ParentId;
  const parentId =
    parentRaw == null || parentRaw === '' ? null : Number(parentRaw);

  return {
    id,
    userId: asLongId(o.userId ?? o.UserId),
    parentId: Number.isNaN(parentId as number) ? null : parentId,
    name: String(o.name ?? o.Name ?? ''),
    isFolder: Boolean(o.isFolder ?? o.IsFolder),
    fileUrl: (o.fileUrl ?? o.FileUrl ?? null) as string | null,
    fileSize: Number(o.fileSize ?? o.FileSize ?? 0),
    createdAt: String(o.createdAt ?? o.CreatedAt ?? ''),
  };
}

function extractUserFileList(raw: unknown): UserFileItem[] {
  const unwrapped = unwrapApiPayload(raw);
  if (Array.isArray(unwrapped)) {
    return unwrapped.map(normalizeUserFileItem).filter(Boolean) as UserFileItem[];
  }

  if (unwrapped && typeof unwrapped === 'object') {
    const obj = unwrapped as Record<string, unknown>;
    const candidates = [obj.$values, obj.queryResult, obj.items, obj.list];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.map(normalizeUserFileItem).filter(Boolean) as UserFileItem[];
      }
      if (candidate && typeof candidate === 'object' && '$values' in (candidate as object)) {
        const inner = (candidate as { $values: unknown[] }).$values ?? [];
        return inner.map(normalizeUserFileItem).filter(Boolean) as UserFileItem[];
      }
    }
  }

  return [];
}

function unwrapCreatedId(raw: unknown): number {
  const unwrapped = unwrapApiPayload(raw);
  if (typeof unwrapped === 'number') return unwrapped;
  if (typeof unwrapped === 'string' && unwrapped.trim()) return Number(unwrapped);
  if (unwrapped && typeof unwrapped === 'object') {
    const o = unwrapped as Record<string, unknown>;
    const id = Number(o.id ?? o.Id ?? o.data ?? o.Data ?? 0);
    if (id > 0) return id;
  }
  return Number(raw ?? 0) || 0;
}

export async function getUserFiles(
  userId: string | number,
  parentId?: number | null,
  options?: { cacheBust?: boolean }
): Promise<UserFileItem[]> {
  const params: Record<string, string> = { userId: String(userId) };
  if (parentId != null && parentId > 0) {
    params.parentId = String(parentId);
  }
  // Always bust browser/proxy caches so deleted/uploaded files stay in sync after refresh.
  if (options?.cacheBust !== false) {
    params._ = String(Date.now());
  }

  const res = await apiClient.get<unknown>(`${BASE}/GetFiles`, {
    params,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  return extractUserFileList(res.data);
}

export async function createUserFolder(
  userId: string | number,
  name: string,
  parentId?: number | null
): Promise<number> {
  const payload = {
    userId,
    name: name.trim(),
    parentId: parentId != null && parentId > 0 ? parentId : null,
  };
  const res = await apiClient.post<unknown>(`${BASE}/CreateFolder`, payload);
  return unwrapCreatedId(res.data);
}

export async function renameUserFile(fileId: number, userId: string | number, name: string): Promise<void> {
  // POST — IIS/iisnode often blocks PUT with 405; API accepts POST on Rename.
  await apiClient.post(`${BASE}/Rename`, {
    fileId,
    userId,
    name: name.trim(),
  });
}

export async function deleteUserFile(fileId: number, userId: string | number): Promise<void> {
  // POST — IIS/iisnode often blocks DELETE with 405; API accepts POST on Delete.
  await apiClient.post(`${BASE}/Delete`, { fileId, userId });
}

/** 3 GB — matches API UserFileController limit */
export const MAX_USER_FILE_BYTES = 3 * 1024 * 1024 * 1024;

export async function uploadUserFile(
  userId: string | number,
  file: File,
  parentId?: number | null,
  onProgress?: (percent: number) => void
): Promise<{ url: string; size: number; name: string }> {
  const task = createUserFileChunkedUploadTask(userId, file, parentId, {
    onProgress: (progress) => onProgress?.(progress.percentage),
  });
  const result = await task.start();
  return {
    url: result.fileUrl,
    size: result.fileSize || file.size,
    name: result.name || file.name,
  };
}

export type UserFileUploadStatus =
  | 'queued'
  | 'uploading'
  | 'paused'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'canceled';

export type UserFileUploadProgress = {
  status: UserFileUploadStatus;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  uploadedChunks: number;
  totalChunks: number;
  errorMessage?: string;
};

export type UserFileChunkedUploadComplete = {
  userId: string;
  name: string;
  fileUrl: string;
  fileSize: number;
};

type InitMultipartUploadResponse = {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
};

type CreateUserFileChunkedUploadTaskOptions = {
  chunkSizeBytes?: number;
  parallelChunks?: number;
  onProgress?: (progress: UserFileUploadProgress) => void;
};

const DEFAULT_CHUNK_SIZE_BYTES = 2 * 1024 * 1024;
const DEFAULT_PARALLEL_CHUNKS = 4;
const MAX_PARALLEL_CHUNKS = 8;

function normalizeUserFileChunkedUploadComplete(raw: unknown): UserFileChunkedUploadComplete {
  const row = unwrapApiPayload(raw) as Record<string, unknown>;
  return {
    userId: asLongId(row.userId ?? row.UserId),
    name: String(row.name ?? row.Name ?? ''),
    fileUrl: String(row.fileUrl ?? row.FileUrl ?? ''),
    fileSize: Number(row.fileSize ?? row.FileSize ?? 0),
  };
}

function normalizeInitMultipartUploadResponse(raw: unknown): InitMultipartUploadResponse {
  const row = unwrapApiPayload(raw) as Record<string, unknown>;
  return {
    uploadId: String(row.uploadId ?? row.UploadId ?? ''),
    chunkSize: Number(row.chunkSize ?? row.ChunkSize ?? DEFAULT_CHUNK_SIZE_BYTES),
    totalChunks: Number(row.totalChunks ?? row.TotalChunks ?? 0),
  };
}

async function initUserFileMultipartUpload(args: {
  userId: string | number;
  parentId?: number | null;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
}): Promise<InitMultipartUploadResponse> {
  const { data } = await apiClient.post<unknown>(`${BASE}/UploadFileInit`, {
    userId: args.userId,
    parentId: args.parentId != null && args.parentId > 0 ? args.parentId : null,
    fileName: args.fileName,
    fileSize: args.fileSize,
    chunkSize: args.chunkSize,
    totalChunks: args.totalChunks,
  });
  const parsed = normalizeInitMultipartUploadResponse(data);
  if (!parsed.uploadId || parsed.totalChunks <= 0) throw new Error('Upload initialization failed.');
  return parsed;
}

async function uploadUserFileChunkPart(args: {
  uploadId: string;
  chunkIndex: number;
  chunk: Blob;
  signal?: AbortSignal;
}): Promise<void> {
  const form = new FormData();
  form.append('uploadId', args.uploadId);
  form.append('chunkIndex', String(args.chunkIndex));
  form.append('chunk', args.chunk, `${args.uploadId}-${args.chunkIndex}.part`);
  await apiClient.post(`${BASE}/UploadFileChunk`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal: args.signal,
  });
}

type CompleteUploadResult =
  | { ok: true; data: UserFileChunkedUploadComplete }
  | { ok: false; kind: 'session_expired' | 'incomplete'; missingChunkIndexes?: number[]; message: string };

function isSessionExpiredMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('session not found') ||
    m.includes('expired') ||
    m.includes('not found or expired')
  );
}

function extractErrorPayload(error: unknown): { status?: number; message: string; data?: Record<string, unknown> } {
  if (axios.isAxiosError(error)) {
    const data = (error.response?.data ?? {}) as Record<string, unknown>;
    const message = String(data.message ?? data.Message ?? error.message ?? 'Upload failed.');
    return { status: error.response?.status, message, data };
  }
  if (error instanceof Error) return { message: error.message };
  return { message: 'Upload failed.' };
}

async function completeUserFileMultipartUpload(uploadId: string): Promise<CompleteUploadResult> {
  try {
    const { data } = await apiClient.post<unknown>(`${BASE}/UploadFileComplete`, { uploadId });
    return { ok: true, data: normalizeUserFileChunkedUploadComplete(data) };
  } catch (error) {
    const parsed = extractErrorPayload(error);
    if (parsed.status === 404 || isSessionExpiredMessage(parsed.message)) {
      return { ok: false, kind: 'session_expired', message: parsed.message };
    }
    if (parsed.status === 409) {
      const missingRaw = parsed.data?.missingChunkIndexes ?? parsed.data?.MissingChunkIndexes;
      const missing = Array.isArray(missingRaw)
        ? missingRaw.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x >= 0)
        : undefined;
      return {
        ok: false,
        kind: 'incomplete',
        missingChunkIndexes: missing,
        message: parsed.message || 'Upload is incomplete.',
      };
    }
    throw error;
  }
}

async function abortUserFileMultipartUpload(uploadId: string): Promise<void> {
  await apiClient.post(`${BASE}/UploadFileAbort`, { uploadId });
}

export class UserFileChunkedUploadTask {
  readonly file: File;
  readonly userId: string | number;
  readonly parentId?: number | null;

  private readonly options: CreateUserFileChunkedUploadTaskOptions;
  private uploadId: string | null = null;
  private chunkSize = DEFAULT_CHUNK_SIZE_BYTES;
  private totalChunks = 0;
  private queue: number[] = [];
  private uploadedChunkIndexes = new Set<number>();
  private inFlightControllers = new Map<number, AbortController>();
  private uploadedBytes = 0;
  private runningPromise: Promise<UserFileChunkedUploadComplete> | null = null;
  private completionResult: UserFileChunkedUploadComplete | null = null;
  private status: UserFileUploadStatus = 'queued';
  private errorMessage: string | undefined;

  constructor(
    userId: string | number,
    file: File,
    parentId?: number | null,
    options?: CreateUserFileChunkedUploadTaskOptions
  ) {
    this.userId = userId;
    this.file = file;
    this.parentId = parentId;
    this.options = options ?? {};
    this.emitProgress();
  }

  get currentStatus(): UserFileUploadStatus {
    return this.status;
  }

  get progress(): UserFileUploadProgress {
    const total = Math.max(0, this.file.size);
    const uploaded = Math.min(total, this.uploadedBytes);
    const percentage = total > 0 ? Math.min(100, Math.round((uploaded / total) * 100)) : 0;
    return {
      status: this.status,
      uploadedBytes: uploaded,
      totalBytes: total,
      percentage,
      uploadedChunks: this.uploadedChunkIndexes.size,
      totalChunks: this.totalChunks,
      errorMessage: this.errorMessage,
    };
  }

  async start(): Promise<UserFileChunkedUploadComplete> {
    if (this.status === 'completed' && this.completionResult) return this.completionResult;
    if (this.status === 'uploading' && this.runningPromise) return this.runningPromise;
    if (this.status === 'finalizing' && this.runningPromise) return this.runningPromise;
    if (this.status === 'paused') return this.resume();
    if (this.status === 'canceled') throw new Error('Upload has been canceled.');

    // Retry after failure: create a new session if the previous one was lost.
    await this.ensureSessionInitialized(!this.uploadId);
    this.rebuildQueue();
    this.status = 'uploading';
    this.errorMessage = undefined;
    this.emitProgress();
    this.runningPromise = this.runUpload();
    return this.runningPromise;
  }

  async resume(): Promise<UserFileChunkedUploadComplete> {
    if (this.status !== 'paused') return this.start();
    if (!this.uploadId) {
      await this.ensureSessionInitialized(true);
    } else {
      this.rebuildQueue();
    }
    this.status = 'uploading';
    this.errorMessage = undefined;
    this.emitProgress();
    this.runningPromise = this.runUpload();
    return this.runningPromise;
  }

  pause(): void {
    if (this.status !== 'uploading') return;
    this.status = 'paused';
    for (const controller of this.inFlightControllers.values()) controller.abort();
    this.emitProgress();
  }

  async cancel(): Promise<void> {
    if (this.status === 'completed' || this.status === 'canceled') return;
    this.status = 'canceled';
    for (const controller of this.inFlightControllers.values()) controller.abort();
    const uploadId = this.uploadId;
    this.emitProgress();
    if (uploadId) {
      try {
        await abortUserFileMultipartUpload(uploadId);
      } catch {
        /* best effort */
      }
    }
  }

  private rebuildQueue(forceMissing?: number[]): void {
    if (this.totalChunks <= 0) return;
    if (forceMissing && forceMissing.length > 0) {
      for (const index of forceMissing) {
        this.uploadedChunkIndexes.delete(index);
      }
      this.recomputeUploadedBytes();
    }
    this.queue = Array.from({ length: this.totalChunks }, (_, index) => index).filter(
      (index) => !this.uploadedChunkIndexes.has(index)
    );
  }

  private recomputeUploadedBytes(): void {
    let bytes = 0;
    for (const index of this.uploadedChunkIndexes) {
      const start = index * this.chunkSize;
      const end = Math.min(this.file.size, start + this.chunkSize);
      bytes += Math.max(0, end - start);
    }
    this.uploadedBytes = bytes;
  }

  private resetSessionLocally(): void {
    this.uploadId = null;
    this.uploadedChunkIndexes.clear();
    this.uploadedBytes = 0;
    this.queue = [];
  }

  private async ensureSessionInitialized(forceNew = false): Promise<void> {
    if (this.uploadId && !forceNew) return;

    if (forceNew && this.uploadId) {
      try {
        await abortUserFileMultipartUpload(this.uploadId);
      } catch {
        /* best effort */
      }
      this.resetSessionLocally();
    }

    const desiredChunkSize = this.options.chunkSizeBytes ?? DEFAULT_CHUNK_SIZE_BYTES;
    const optimisticTotalChunks = Math.max(1, Math.ceil(this.file.size / desiredChunkSize));
    const init = await initUserFileMultipartUpload({
      userId: this.userId,
      parentId: this.parentId,
      fileName: this.file.name,
      fileSize: this.file.size,
      chunkSize: desiredChunkSize,
      totalChunks: optimisticTotalChunks,
    });

    this.uploadId = init.uploadId;
    this.chunkSize = init.chunkSize > 0 ? init.chunkSize : desiredChunkSize;
    this.totalChunks = init.totalChunks > 0 ? init.totalChunks : optimisticTotalChunks;
    this.uploadedChunkIndexes.clear();
    this.uploadedBytes = 0;
    this.queue = Array.from({ length: this.totalChunks }, (_, index) => index);
    this.emitProgress();
  }

  private async runUpload(): Promise<UserFileChunkedUploadComplete> {
    const parallel = Math.min(
      MAX_PARALLEL_CHUNKS,
      Math.max(1, this.options.parallelChunks ?? DEFAULT_PARALLEL_CHUNKS)
    );

    try {
      await this.ensureSessionInitialized();

      // Retry loop: incomplete complete responses and expired sessions can recover mid-run.
      for (let attempt = 0; attempt < 3; attempt++) {
        if (!this.uploadId) {
          await this.ensureSessionInitialized(true);
        }

        const workers = Array.from({ length: parallel }, () => this.workerLoop());
        await Promise.all(workers);

        if (this.status === 'paused') throw new Error('__upload_paused__');
        if (this.status === 'canceled') throw new Error('__upload_canceled__');

        this.status = 'finalizing';
        this.emitProgress();
        const complete = await completeUserFileMultipartUpload(this.uploadId!);
        if (complete.ok) {
          this.completionResult = complete.data;
          this.status = 'completed';
          this.emitProgress();
          return complete.data;
        }

        if (complete.kind === 'session_expired') {
          this.resetSessionLocally();
          await this.ensureSessionInitialized(true);
          this.status = 'uploading';
          this.emitProgress();
          continue;
        }

        this.status = 'uploading';
        if (complete.missingChunkIndexes && complete.missingChunkIndexes.length > 0) {
          this.rebuildQueue(complete.missingChunkIndexes);
        } else {
          this.uploadedChunkIndexes.clear();
          this.uploadedBytes = 0;
          this.rebuildQueue();
        }
        this.emitProgress();
      }

      throw new Error('Upload could not be completed after multiple recovery attempts.');
    } catch (error) {
      if (this.status === 'paused' || this.status === 'canceled') throw error;
      this.status = 'failed';
      this.errorMessage = error instanceof Error ? error.message : 'Upload failed.';
      this.emitProgress();
      throw error;
    } finally {
      this.runningPromise = null;
    }
  }

  private async workerLoop(): Promise<void> {
    while (this.status === 'uploading') {
      const chunkIndex = this.queue.shift();
      if (chunkIndex == null) return;
      if (this.uploadedChunkIndexes.has(chunkIndex)) continue;

      try {
        await this.uploadChunk(chunkIndex);
      } catch (error) {
        const canceledByController =
          error instanceof DOMException
            ? error.name === 'AbortError'
            : axios.isAxiosError(error)
              ? error.code === 'ERR_CANCELED'
              : false;

        const latestStatus = this.currentStatus;
        if (
          (latestStatus === 'paused' || latestStatus === 'canceled') &&
          canceledByController
        ) {
          if (!this.uploadedChunkIndexes.has(chunkIndex) && latestStatus === 'paused') {
            this.queue.push(chunkIndex);
          }
          return;
        }

        const parsed = extractErrorPayload(error);
        if (parsed.status === 404 || isSessionExpiredMessage(parsed.message)) {
          // Drop dead session so start/resume can re-init cleanly.
          this.resetSessionLocally();
        }
        throw error;
      }
    }
  }

  private async uploadChunk(chunkIndex: number): Promise<void> {
    if (!this.uploadId) {
      await this.ensureSessionInitialized(true);
    }

    const start = chunkIndex * this.chunkSize;
    const end = Math.min(this.file.size, start + this.chunkSize);
    const chunk = this.file.slice(start, end);
    const controller = new AbortController();
    this.inFlightControllers.set(chunkIndex, controller);

    try {
      await uploadUserFileChunkPart({
        uploadId: this.uploadId!,
        chunkIndex,
        chunk,
        signal: controller.signal,
      });
      if (!this.uploadedChunkIndexes.has(chunkIndex)) {
        this.uploadedChunkIndexes.add(chunkIndex);
        this.uploadedBytes += chunk.size;
        this.emitProgress();
      }
    } finally {
      this.inFlightControllers.delete(chunkIndex);
    }
  }

  private emitProgress(): void {
    this.options.onProgress?.(this.progress);
  }
}

export function createUserFileChunkedUploadTask(
  userId: string | number,
  file: File,
  parentId?: number | null,
  options?: CreateUserFileChunkedUploadTaskOptions
): UserFileChunkedUploadTask {
  return new UserFileChunkedUploadTask(userId, file, parentId, options);
}

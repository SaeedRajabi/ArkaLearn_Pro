import { API_BASE_URL, API_PROXY_BASE_PATH } from '@/lib/api/config';
import { parseJsonWithLongIds } from '@/lib/parse-json-with-long-ids';

export type ChunkedUploadStatus =
  | 'queued'
  | 'uploading'
  | 'paused'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'canceled';

export type ChunkedUploadProgress = {
  status: ChunkedUploadStatus;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  uploadedChunks: number;
  totalChunks: number;
  errorMessage?: string;
};

export type UserFileChunkedUploadComplete = {
  userId: number;
  name: string;
  fileUrl: string;
  fileSize: number;
};

type InitResponse = {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
};

type CreateUserFileChunkedUploadTaskOptions = {
  chunkSizeBytes?: number;
  parallelChunks?: number;
  onProgress?: (progress: ChunkedUploadProgress) => void;
};

const BASE = 'UserFile';
const DEFAULT_CHUNK_SIZE_BYTES = 2 * 1024 * 1024;
const DEFAULT_PARALLEL_CHUNKS = 4;
const MAX_PARALLEL_CHUNKS = 8;

function buildUrl(path: string): string {
  const cleanPath = path
    .replace(/^\//, '')
    .replace(new RegExp(`^${API_PROXY_BASE_PATH.replace(/^\//, '').replace(/\//g, '\\/')}/?`, 'i'), '');
  return `${API_BASE_URL.replace(/\/$/, '')}/${cleanPath}`;
}

function unwrapPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? raw;
  return (typeof layer === 'object' && layer !== null ? layer : raw) as Record<string, unknown>;
}

async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const text = await res.text();
  const parsed = text ? parseJsonWithLongIds(text) : {};
  if (!res.ok) {
    const msg =
      typeof parsed === 'object' && parsed !== null
        ? String((parsed as Record<string, unknown>).message ?? (parsed as Record<string, unknown>).Message ?? res.statusText)
        : res.statusText;
    const err = new Error(msg || `HTTP ${res.status}`) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = parsed;
    throw err;
  }
  return parsed as T;
}

async function postForm(path: string, form: FormData, signal?: AbortSignal): Promise<void> {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    body: form,
    signal,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = res.statusText;
    let parsed: unknown;
    try {
      parsed = text ? parseJsonWithLongIds(text) : {};
      if (parsed && typeof parsed === 'object') {
        msg = String((parsed as Record<string, unknown>).message ?? (parsed as Record<string, unknown>).Message ?? msg);
      }
    } catch {
      /* ignore */
    }
    const err = new Error(msg || `HTTP ${res.status}`) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = parsed;
    throw err;
  }
}

async function initUserFileMultipartUpload(args: {
  userId: number;
  parentId?: number | null;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
}): Promise<InitResponse> {
  const raw = await postJson<unknown>(`${BASE}/UploadFileInit`, {
    userId: args.userId,
    parentId: args.parentId && args.parentId > 0 ? args.parentId : null,
    fileName: args.fileName,
    fileSize: args.fileSize,
    chunkSize: args.chunkSize,
    totalChunks: args.totalChunks,
  });
  const row = unwrapPayload(raw);
  const uploadId = String(row.uploadId ?? row.UploadId ?? '');
  const chunkSize = Number(row.chunkSize ?? row.ChunkSize ?? DEFAULT_CHUNK_SIZE_BYTES);
  const totalChunks = Number(row.totalChunks ?? row.TotalChunks ?? 0);
  if (!uploadId || totalChunks <= 0) throw new Error('Upload initialization failed.');
  return { uploadId, chunkSize, totalChunks };
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
  await postForm(`${BASE}/UploadFileChunk`, form, args.signal);
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

function extractErrorInfo(error: unknown): { status?: number; message: string; data?: Record<string, unknown> } {
  if (error && typeof error === 'object' && 'status' in error) {
    const err = error as { status?: number; message?: string; data?: unknown };
    const data =
      err.data && typeof err.data === 'object' ? (err.data as Record<string, unknown>) : undefined;
    return {
      status: err.status,
      message: String(data?.message ?? data?.Message ?? err.message ?? 'Upload failed.'),
      data,
    };
  }
  if (error instanceof Error) return { message: error.message };
  return { message: 'Upload failed.' };
}

async function completeUserFileMultipartUpload(uploadId: string): Promise<CompleteUploadResult> {
  try {
    const raw = await postJson<unknown>(`${BASE}/UploadFileComplete`, { uploadId });
    const row = unwrapPayload(raw);
    return {
      ok: true,
      data: {
        userId: Number(row.userId ?? row.UserId ?? 0),
        name: String(row.name ?? row.Name ?? ''),
        fileUrl: String(row.fileUrl ?? row.FileUrl ?? ''),
        fileSize: Number(row.fileSize ?? row.FileSize ?? 0),
      },
    };
  } catch (error) {
    const parsed = extractErrorInfo(error);
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
  await postJson(`${BASE}/UploadFileAbort`, { uploadId });
}

export class UserFileChunkedUploadTask {
  readonly file: File;
  readonly userId: number;
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
  private status: ChunkedUploadStatus = 'queued';
  private errorMessage: string | undefined;

  constructor(
    userId: number,
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

  get currentStatus(): ChunkedUploadStatus {
    return this.status;
  }

  get progress(): ChunkedUploadProgress {
    const total = Math.max(0, this.file.size);
    const uploaded = Math.min(total, this.uploadedBytes);
    const percentage = this.status === 'completed' ? 100 : total > 0 ? Math.min(99, Math.floor((uploaded / total) * 100)) : 0;
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
            : error instanceof Error && /abort/i.test(error.message);

        if ((this.status === 'paused' || this.status === 'canceled') && canceledByController) {
          if (!this.uploadedChunkIndexes.has(chunkIndex) && this.status === 'paused') {
            this.queue.push(chunkIndex);
          }
          return;
        }

        const parsed = extractErrorInfo(error);
        if (parsed.status === 404 || isSessionExpiredMessage(parsed.message)) {
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
  userId: number,
  file: File,
  parentId?: number | null,
  options?: CreateUserFileChunkedUploadTaskOptions
): UserFileChunkedUploadTask {
  return new UserFileChunkedUploadTask(userId, file, parentId, options);
}

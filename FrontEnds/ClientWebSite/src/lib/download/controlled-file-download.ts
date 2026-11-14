export type ControlledDownloadStatus =
  | 'idle'
  | 'picking'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error';

export type ControlledDownloadProgress = {
  receivedBytes: number;
  totalBytes: number;
  percent: number;
  speedBps: number;
};

export type ControlledDownloadSnapshot = {
  status: ControlledDownloadStatus;
  progress: ControlledDownloadProgress;
  savePath: string;
  errorMessage: string;
  supportsSavePicker: boolean;
};

type Listener = (snapshot: ControlledDownloadSnapshot) => void;

type FilePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{ description?: string; accept: Record<string, string[]> }>;
  }) => Promise<FileSystemFileHandle>;
};

function getSuggestedExtension(fileName: string): string {
  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
  return ext || '.bin';
}

function buildMimeAccept(fileName: string): Record<string, string[]> {
  const ext = getSuggestedExtension(fileName).toLowerCase();
  if (ext === '.mp4') return { 'video/mp4': ['.mp4'] };
  if (ext === '.webm') return { 'video/webm': ['.webm'] };
  if (ext === '.mov') return { 'video/quicktime': ['.mov'] };
  if (ext === '.pdf') return { 'application/pdf': ['.pdf'] };
  if (ext === '.zip') return { 'application/zip': ['.zip'] };
  return { 'application/octet-stream': [ext] };
}

function parseTotalBytes(response: Response, fallback: number): number {
  const contentRange = response.headers.get('content-range');
  if (contentRange) {
    const match = /\/(\d+)\s*$/i.exec(contentRange);
    if (match) return Number(match[1]);
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const parsed = Number(contentLength);
    if (!Number.isNaN(parsed) && parsed > 0) {
      if (response.status === 206) {
        return fallback > 0 ? fallback : parsed;
      }
      return parsed;
    }
  }

  return fallback;
}

export class ControlledFileDownload {
  private listener: Listener | null = null;
  private status: ControlledDownloadStatus = 'idle';
  private receivedBytes = 0;
  private totalBytes = 0;
  private speedBps = 0;
  private savePath = '';
  private errorMessage = '';
  private abortController: AbortController | null = null;
  private fileHandle: FileSystemFileHandle | null = null;
  private writer: FileSystemWritableFileStream | null = null;
  private fallbackChunks: Uint8Array[] = [];
  private downloadUrl = '';
  private fileName = '';
  private expectedFileSize = 0;
  private lastProgressAt = 0;
  private lastProgressBytes = 0;
  private cancelRequested = false;

  readonly supportsSavePicker =
    typeof window !== 'undefined' &&
    typeof (window as FilePickerWindow).showSaveFilePicker === 'function';

  subscribe(listener: Listener): () => void {
    this.listener = listener;
    listener(this.snapshot());
    return () => {
      if (this.listener === listener) {
        this.listener = null;
      }
    };
  }

  snapshot(): ControlledDownloadSnapshot {
    const percent =
      this.totalBytes > 0 ? Math.min(100, Math.round((this.receivedBytes / this.totalBytes) * 100)) : 0;

    return {
      status: this.status,
      progress: {
        receivedBytes: this.receivedBytes,
        totalBytes: this.totalBytes,
        percent,
        speedBps: this.speedBps,
      },
      savePath: this.savePath,
      errorMessage: this.errorMessage,
      supportsSavePicker: this.supportsSavePicker,
    };
  }

  private emit() {
    this.listener?.(this.snapshot());
  }

  private setStatus(status: ControlledDownloadStatus) {
    this.status = status;
    this.emit();
  }

  private updateProgress(receivedBytes: number, totalBytes?: number) {
    const now = performance.now();
    if (typeof totalBytes === 'number' && totalBytes > 0) {
      this.totalBytes = totalBytes;
    }

    if (this.lastProgressAt > 0) {
      const elapsed = (now - this.lastProgressAt) / 1000;
      const delta = receivedBytes - this.lastProgressBytes;
      if (elapsed > 0.2 && delta >= 0) {
        this.speedBps = delta / elapsed;
      }
    }

    this.receivedBytes = receivedBytes;
    this.lastProgressAt = now;
    this.lastProgressBytes = receivedBytes;
    this.emit();
  }

  private getDownloadUrl(): string {
    return this.downloadUrl;
  }

  async pickSaveLocation(): Promise<boolean> {
    if (!this.supportsSavePicker) {
      this.savePath = this.fileName;
      this.emit();
      return true;
    }

    this.setStatus('picking');
    try {
      const handle = await (window as FilePickerWindow).showSaveFilePicker!({
        suggestedName: this.fileName,
        types: [
          {
            description: this.fileName,
            accept: buildMimeAccept(this.fileName),
          },
        ],
      });
      this.fileHandle = handle;
      this.savePath = handle.name;
      this.setStatus('idle');
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        this.setStatus('idle');
        return false;
      }
      this.errorMessage = error instanceof Error ? error.message : 'Could not choose save location.';
      this.setStatus('error');
      return false;
    }
  }

  prepare(config: { downloadUrl: string; fileName: string; fileSize?: number }) {
    this.cancelRequested = false;
    this.abortController?.abort();
    this.abortController = null;
    void this.closeWriter();
    this.fileHandle = null;
    this.writer = null;
    this.fallbackChunks = [];
    this.downloadUrl = config.downloadUrl;
    this.fileName = config.fileName;
    this.expectedFileSize = config.fileSize ?? 0;
    this.totalBytes = this.expectedFileSize;
    this.receivedBytes = 0;
    this.speedBps = 0;
    this.savePath = '';
    this.errorMessage = '';
    this.lastProgressAt = 0;
    this.lastProgressBytes = 0;
    this.setStatus('idle');
  }

  async start(): Promise<void> {
    if (!this.downloadUrl || !this.fileName) return;

    if (this.supportsSavePicker && !this.fileHandle) {
      const picked = await this.pickSaveLocation();
      if (!picked) return;
    } else if (!this.savePath) {
      this.savePath = this.fileName;
      this.emit();
    }

    if (!this.supportsSavePicker && this.expectedFileSize > 150 * 1024 * 1024) {
      this.triggerNativeDownload();
      return;
    }

    await this.runDownloadFrom(0);
  }

  private triggerNativeDownload() {
    const anchor = document.createElement('a');
    anchor.href = this.getDownloadUrl();
    anchor.download = this.fileName;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    this.receivedBytes = this.expectedFileSize;
    this.totalBytes = this.expectedFileSize;
    this.speedBps = 0;
    this.setStatus('completed');
  }

  pause() {
    if (this.status !== 'downloading') return;
    this.abortController?.abort();
    this.abortController = null;
    this.speedBps = 0;
    this.setStatus('paused');
  }

  async resume() {
    if (this.status !== 'paused') return;
    await this.runDownloadFrom(this.receivedBytes);
  }

  cancel() {
    this.cancelRequested = true;
    this.abortController?.abort();
    this.abortController = null;
    void this.closeWriter();
    this.fileHandle = null;
    this.writer = null;
    this.fallbackChunks = [];
    this.speedBps = 0;
    this.setStatus('cancelled');
  }

  private resetInternals() {
    this.abortController?.abort();
    this.abortController = null;
    void this.closeWriter();
    this.fileHandle = null;
    this.writer = null;
    this.fallbackChunks = [];
    this.receivedBytes = 0;
    this.totalBytes = 0;
    this.speedBps = 0;
    this.errorMessage = '';
    this.lastProgressAt = 0;
    this.lastProgressBytes = 0;
  }

  private async ensureWriter(): Promise<void> {
    if (this.writer) return;

    if (this.fileHandle) {
      this.writer = await this.fileHandle.createWritable();
      return;
    }
  }

  private async closeWriter() {
    if (!this.writer) return;
    try {
      await this.writer.close();
    } catch {
      /* ignore */
    }
    this.writer = null;
  }

  private async runDownloadFrom(startByte: number): Promise<void> {
    this.abortController = new AbortController();
    this.setStatus('downloading');

    try {
      await this.ensureWriter();

      const headers: HeadersInit = {};
      if (startByte > 0) {
        headers.Range = `bytes=${startByte}-`;
      }

      const response = await fetch(this.getDownloadUrl(), {
        method: 'GET',
        credentials: 'include',
        headers,
        signal: this.abortController.signal,
        cache: 'no-store',
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`Download failed with status ${response.status}.`);
      }

      const totalBytes = parseTotalBytes(response, this.expectedFileSize);
      if (totalBytes > 0) {
        this.totalBytes = totalBytes;
      }

      const body = response.body;
      if (!body) {
        throw new Error('Download stream is not available.');
      }

      const reader = body.getReader();
      let received = startByte;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value?.length) continue;

        if (this.writer) {
          await this.writer.write(value);
        } else {
          this.fallbackChunks.push(value);
        }

        received += value.length;
        this.updateProgress(received, totalBytes);
      }

      if (!this.writer) {
        const blob = new Blob(this.fallbackChunks, { type: 'application/octet-stream' });
        this.triggerBrowserDownload(blob, this.fileName);
        this.fallbackChunks = [];
      } else {
        await this.closeWriter();
      }

      if (this.totalBytes > 0 && this.receivedBytes < this.totalBytes) {
        throw new Error('Download ended before the full file was received.');
      }

      this.speedBps = 0;
      this.setStatus('completed');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (this.cancelRequested) {
          this.cancelRequested = false;
          return;
        }
        if (this.status === 'downloading') {
          this.speedBps = 0;
          this.setStatus('paused');
        }
        return;
      }

      await this.closeWriter();
      this.errorMessage = error instanceof Error ? error.message : 'Download failed.';
      this.setStatus('error');
    } finally {
      this.abortController = null;
    }
  }

  private triggerBrowserDownload(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }
}

export function formatDownloadSpeed(bytesPerSecond: number, locale: string): string {
  if (!bytesPerSecond) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const index = Math.min(Math.floor(Math.log(bytesPerSecond) / Math.log(1024)), units.length - 1);
  const value = bytesPerSecond / Math.pow(1024, index);
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${units[index]}`;
}

export function formatDownloadBytes(bytes: number, locale: string): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${units[index]}`;
}

'use client';

import { create } from 'zustand';
import {
  createUserFileChunkedUploadTask,
  type UserFileChunkedUploadTask,
  type UserFileUploadProgress,
  type UserFileUploadStatus,
} from '@/services/user-file-service';

export type GlobalUploadJobStatus = UserFileUploadStatus;

export type GlobalUploadJob = {
  id: string;
  kind: 'user-file';
  fileName: string;
  fileSize: number;
  percent: number;
  status: GlobalUploadJobStatus;
  errorMessage?: string;
  /** Route to open when the admin clicks the dock alert. */
  returnPath: string;
  /** i18n key for the section label shown in the dock. */
  contextKey: string;
  meta: {
    userId: string;
    parentId: number | null;
  };
};

type EnqueueUserFileArgs = {
  userId: string | number;
  file: File;
  parentId?: number | null;
  returnPath: string;
  contextKey?: string;
};

type UploadQueueState = {
  jobs: GlobalUploadJob[];
  enqueueUserFile: (args: EnqueueUserFileArgs) => string;
  pause: (id: string) => void;
  resume: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  remove: (id: string) => void;
  getFile: (id: string) => File | undefined;
  getTask: (id: string) => UserFileChunkedUploadTask | undefined;
};

/** Keep File/Task outside Zustand state so route changes never drop the transfer. */
const userFileTasks = new Map<string, UserFileChunkedUploadTask>();
const fileHandles = new Map<string, File>();

function patchJob(id: string, patch: Partial<GlobalUploadJob>) {
  useUploadQueueStore.setState((state) => ({
    jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...patch } : job)),
  }));
}

function applyProgress(id: string, progress: UserFileUploadProgress) {
  patchJob(id, {
    percent: progress.percentage,
    status: progress.status,
    errorMessage: progress.errorMessage,
  });
}

function cleanupHandles(id: string) {
  userFileTasks.delete(id);
  fileHandles.delete(id);
}

export const useUploadQueueStore = create<UploadQueueState>((set, get) => ({
  jobs: [],

  enqueueUserFile: ({ userId, file, parentId = null, returnPath, contextKey }) => {
    const id = `user-file-${userId}-${file.name}-${file.size}-${Date.now()}`;
    const normalizedParentId =
      parentId != null && Number(parentId) > 0 ? Number(parentId) : null;

    const task = createUserFileChunkedUploadTask(userId, file, normalizedParentId, {
      chunkSizeBytes: 2 * 1024 * 1024,
      parallelChunks: 4,
      onProgress: (progress) => applyProgress(id, progress),
    });

    userFileTasks.set(id, task);
    fileHandles.set(id, file);

    const job: GlobalUploadJob = {
      id,
      kind: 'user-file',
      fileName: file.name,
      fileSize: file.size,
      percent: task.progress.percentage,
      status: task.progress.status,
      returnPath,
      contextKey: contextKey || 'global_upload_context_student_files',
      meta: {
        userId: String(userId),
        parentId: normalizedParentId,
      },
    };

    set((state) => ({ jobs: [...state.jobs, job] }));

    void task
      .start()
      .then(() => {
        applyProgress(id, { ...task.progress, status: 'completed', percentage: 100 });
        window.setTimeout(() => {
          const current = get().jobs.find((row) => row.id === id);
          if (current?.status === 'completed') {
            get().remove(id);
          }
        }, 8000);
      })
      .catch((error: unknown) => {
        const latest = task.progress;
        if (latest.status === 'paused' || latest.status === 'canceled') return;
        const message = error instanceof Error ? error.message : '';
        if (message === '__upload_paused__' || message === '__upload_canceled__') return;
        applyProgress(id, {
          ...latest,
          status: 'failed',
          errorMessage: latest.errorMessage || message || 'Upload failed.',
        });
      });

    return id;
  },

  pause: (id) => {
    userFileTasks.get(id)?.pause();
  },

  resume: async (id) => {
    const task = userFileTasks.get(id);
    if (!task) return;
    try {
      await (task.currentStatus === 'paused' ? task.resume() : task.start());
      applyProgress(id, { ...task.progress, status: 'completed', percentage: 100 });
      window.setTimeout(() => {
        const current = get().jobs.find((row) => row.id === id);
        if (current?.status === 'completed') get().remove(id);
      }, 8000);
    } catch (error: unknown) {
      const latest = task.progress;
      if (latest.status === 'paused' || latest.status === 'canceled') return;
      const message = error instanceof Error ? error.message : '';
      if (message === '__upload_paused__' || message === '__upload_canceled__') return;
      applyProgress(id, {
        ...latest,
        status: 'failed',
        errorMessage: latest.errorMessage || message || 'Upload failed.',
      });
    }
  },

  cancel: async (id) => {
    const task = userFileTasks.get(id);
    if (task) {
      try {
        await task.cancel();
      } catch {
        /* ignore abort errors */
      }
    }
    get().remove(id);
  },

  remove: (id) => {
    cleanupHandles(id);
    set((state) => ({ jobs: state.jobs.filter((job) => job.id !== id) }));
  },

  getFile: (id) => fileHandles.get(id),
  getTask: (id) => userFileTasks.get(id),
}));

export function selectJobsForReturnPath(returnPath: string) {
  return (state: UploadQueueState) =>
    state.jobs.filter((job) => job.returnPath === returnPath);
}

export function isUploadJobActive(status: GlobalUploadJobStatus): boolean {
  return (
    status === 'queued' ||
    status === 'uploading' ||
    status === 'finalizing' ||
    status === 'paused'
  );
}

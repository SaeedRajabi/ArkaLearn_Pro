'use client';

import { Pause, Play, Square, File as FileIcon, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { ChunkedUploadStatus } from '@/lib/upload/user-file-chunked-upload';
import { cn } from '@/lib/utils';

type Props = {
  file: File;
  progress: number;
  status: ChunkedUploadStatus;
  errorMessage?: string;
  isRtl?: boolean;
  labels: {
    uploaded: string;
    paused: string;
    queued: string;
    canceled: string;
    failed: string;
    pause: string;
    resume: string;
    cancel: string;
    retry: string;
  };
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function ResumableUploadItem({
  file,
  progress,
  status,
  errorMessage,
  isRtl,
  labels,
  onPause,
  onResume,
  onCancel,
  onRetry,
}: Props) {
  const isUploading = status === 'uploading' || status === 'finalizing';

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
      <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium" title={file.name}>
          {file.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(file.size)}</span>
          {isUploading ? (
            <div className="min-w-[80px] flex-1">
              <Progress value={progress} className="h-1.5" />
            </div>
          ) : null}
          {status === 'completed' && <span className="font-medium text-green-600">{labels.uploaded}</span>}
          {status === 'paused' && <span className="font-medium text-amber-600">{labels.paused}</span>}
          {status === 'queued' && <span className="font-medium">{labels.queued}</span>}
          {status === 'canceled' && <span className="font-medium text-destructive">{labels.canceled}</span>}
          {status === 'failed' && <span className="font-medium text-destructive">{labels.failed}</span>}
        </div>
        {errorMessage ? <p className="mt-0.5 truncate text-[11px] text-destructive">{errorMessage}</p> : null}
      </div>
      <div className={cn('flex shrink-0 items-center gap-1', isRtl && 'flex-row-reverse')}>
        {isUploading ? <span className="text-xs tabular-nums">{Math.round(progress)}%</span> : null}
        {status === 'finalizing' ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
        {status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : null}
        {status === 'failed' ? <XCircle className="h-5 w-5 text-destructive" /> : null}

        {status === 'uploading' ? (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title={labels.pause} onClick={onPause}>
            <Pause className="h-4 w-4" />
          </Button>
        ) : null}
        {status === 'paused' ? (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title={labels.resume} onClick={onResume}>
            <Play className="h-4 w-4" />
          </Button>
        ) : null}
        {(status === 'queued' || status === 'failed') && onRetry ? (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title={labels.retry} onClick={onRetry}>
            <Play className="h-4 w-4" />
          </Button>
        ) : null}
        {(status === 'queued' || status === 'uploading' || status === 'paused' || status === 'failed') && onCancel ? (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title={labels.cancel} onClick={onCancel}>
            <Square className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

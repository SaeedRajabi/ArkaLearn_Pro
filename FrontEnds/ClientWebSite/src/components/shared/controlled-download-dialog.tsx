'use client';

import * as React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FolderOpen,
  HardDriveDownload,
  Pause,
  Play,
  Square,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ControlledFileDownload,
  formatDownloadBytes,
  formatDownloadSpeed,
  type ControlledDownloadSnapshot,
} from '@/lib/download/controlled-file-download';
import { cn } from '@/lib/utils';

export type ControlledDownloadLabels = {
  title: string;
  subtitle: string;
  savePath: string;
  savePathPlaceholder: string;
  browse: string;
  fallbackHint: string;
  ready: string;
  picking: string;
  downloading: string;
  paused: string;
  pausedHint: string;
  completed: string;
  cancelled: string;
  error: string;
  success: string;
  progressHint: string;
  done: string;
  start: string;
  pause: string;
  resume: string;
  stop: string;
  close: string;
};

type ControlledDownloadDialogProps = {
  labels: ControlledDownloadLabels;
  fileName: string | null;
  fileSize?: number;
  downloadUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  isRtl: boolean;
  onBeforeStart?: () => Promise<void>;
};

const INITIAL_SNAPSHOT: ControlledDownloadSnapshot = {
  status: 'idle',
  progress: { receivedBytes: 0, totalBytes: 0, percent: 0, speedBps: 0 },
  savePath: '',
  errorMessage: '',
  supportsSavePicker: false,
};

export function ControlledDownloadDialog({
  labels,
  fileName,
  fileSize = 0,
  downloadUrl,
  open,
  onOpenChange,
  locale,
  isRtl,
  onBeforeStart,
}: ControlledDownloadDialogProps) {
  const controllerRef = React.useRef<ControlledFileDownload | null>(null);
  const [snapshot, setSnapshot] = React.useState<ControlledDownloadSnapshot>(INITIAL_SNAPSHOT);
  const [beforeStartError, setBeforeStartError] = React.useState('');

  if (!controllerRef.current) {
    controllerRef.current = new ControlledFileDownload();
  }

  React.useEffect(() => {
    const controller = controllerRef.current!;
    return controller.subscribe(setSnapshot);
  }, []);

  React.useEffect(() => {
    if (!open || !downloadUrl || !fileName) return;
    controllerRef.current?.prepare({
      downloadUrl,
      fileName,
      fileSize,
    });
  }, [open, downloadUrl, fileName, fileSize]);

  React.useEffect(() => {
    if (!open) {
      controllerRef.current?.cancel();
      setBeforeStartError('');
    }
  }, [open]);

  const handlePickLocation = async () => {
    await controllerRef.current?.pickSaveLocation();
  };

  const handleStart = async () => {
    setBeforeStartError('');
    try {
      await onBeforeStart?.();
    } catch (error) {
      setBeforeStartError(error instanceof Error ? error.message : labels.error);
      return;
    }
    await controllerRef.current?.start();
  };

  const statusLabel = React.useMemo(() => {
    switch (snapshot.status) {
      case 'picking':
        return labels.picking;
      case 'downloading':
        return labels.downloading;
      case 'paused':
        return labels.paused;
      case 'completed':
        return labels.completed;
      case 'cancelled':
        return labels.cancelled;
      case 'error':
        return labels.error;
      default:
        return labels.ready;
    }
  }, [labels, snapshot.status]);

  const canStart =
    snapshot.status === 'idle' && (!snapshot.supportsSavePicker || Boolean(snapshot.savePath));
  const isActive =
    snapshot.status === 'downloading' || snapshot.status === 'paused' || snapshot.status === 'picking';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="border-b bg-gradient-to-br from-primary/10 via-background to-background px-6 py-5">
          <DialogHeader className="space-y-3 text-start">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/15 p-3 text-primary">
                <HardDriveDownload className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-xl">{labels.title}</DialogTitle>
                <DialogDescription className="mt-1 line-clamp-2">
                  {fileName ?? labels.subtitle}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          {fileName ? (
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {fileSize > 0 ? (
                  <Badge variant="secondary">{formatDownloadBytes(fileSize, locale)}</Badge>
                ) : null}
                <span className="text-muted-foreground">{statusLabel}</span>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="controlled-download-save-path">{labels.savePath}</Label>
            <div className="flex gap-2">
              <Input
                id="controlled-download-save-path"
                readOnly
                value={
                  snapshot.savePath ||
                  (snapshot.supportsSavePicker ? labels.savePathPlaceholder : fileName ?? '')
                }
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void handlePickLocation()}
                disabled={!snapshot.supportsSavePicker || isActive}
              >
                <FolderOpen className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                {labels.browse}
              </Button>
            </div>
            {!snapshot.supportsSavePicker ? (
              <p className="text-xs text-muted-foreground">{labels.fallbackHint}</p>
            ) : null}
          </div>

          <div className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{snapshot.progress.percent}%</span>
              <span className="text-muted-foreground">
                {formatDownloadBytes(snapshot.progress.receivedBytes, locale)}
                {snapshot.progress.totalBytes > 0
                  ? ` / ${formatDownloadBytes(snapshot.progress.totalBytes, locale)}`
                  : ''}
              </span>
            </div>
            <Progress value={snapshot.progress.percent} className="h-2.5" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDownloadSpeed(snapshot.progress.speedBps, locale)}</span>
              <span>
                {snapshot.status === 'completed'
                  ? labels.done
                  : snapshot.status === 'paused'
                    ? labels.pausedHint
                    : labels.progressHint}
              </span>
            </div>
          </div>

          {(snapshot.status === 'error' || beforeStartError) && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{beforeStartError || snapshot.errorMessage || labels.error}</span>
            </div>
          )}

          {snapshot.status === 'completed' ? (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{labels.success}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {snapshot.status === 'downloading' ? (
              <Button type="button" variant="outline" onClick={() => controllerRef.current?.pause()}>
                <Pause className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                {labels.pause}
              </Button>
            ) : snapshot.status === 'paused' ? (
              <Button type="button" onClick={() => void controllerRef.current?.resume()}>
                <Play className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                {labels.resume}
              </Button>
            ) : snapshot.status === 'idle' ? (
              <Button type="button" onClick={() => void handleStart()} disabled={!canStart}>
                <Download className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                {labels.start}
              </Button>
            ) : null}

            {isActive ? (
              <Button type="button" variant="destructive" onClick={() => controllerRef.current?.cancel()}>
                <Square className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                {labels.stop}
              </Button>
            ) : null}
          </div>

          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
            {labels.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

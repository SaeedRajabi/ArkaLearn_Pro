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
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import type { UserFileItem } from '@/lib/api/user-files';
import { notifyUserFileDownloadCompleted } from '@/lib/api/user-files';
import {
  ControlledFileDownload,
  formatDownloadBytes,
  formatDownloadSpeed,
  type ControlledDownloadSnapshot,
} from '@/lib/download/controlled-file-download';
import { cn } from '@/lib/utils';

type UserFileDownloadDialogProps = {
  dict: Dictionary;
  file: UserFileItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  isRtl: boolean;
};

const INITIAL_SNAPSHOT: ControlledDownloadSnapshot = {
  status: 'idle',
  progress: { receivedBytes: 0, totalBytes: 0, percent: 0, speedBps: 0 },
  savePath: '',
  errorMessage: '',
  supportsSavePicker: false,
};

export function UserFileDownloadDialog({
  dict,
  file,
  open,
  onOpenChange,
  locale,
  isRtl,
}: UserFileDownloadDialogProps) {
  const t = React.useCallback((key: string, fallback: string) => getDictValue(dict, key, fallback), [dict]);
  const controllerRef = React.useRef<ControlledFileDownload | null>(null);
  const notifiedDownloadIdsRef = React.useRef<Set<number>>(new Set());
  const [snapshot, setSnapshot] = React.useState<ControlledDownloadSnapshot>(INITIAL_SNAPSHOT);

  if (!controllerRef.current) {
    controllerRef.current = new ControlledFileDownload();
  }

  React.useEffect(() => {
    const controller = controllerRef.current!;
    return controller.subscribe(setSnapshot);
  }, []);

  React.useEffect(() => {
    if (!open || !file || file.isFolder) return;
    controllerRef.current?.prepare({
      downloadUrl: `/api/download/user-file?fileId=${encodeURIComponent(String(file.id))}`,
      fileName: file.name,
      fileSize: file.fileSize,
    });
  }, [open, file]);

  React.useEffect(() => {
    if (!open) {
      controllerRef.current?.cancel();
    }
  }, [open]);

  React.useEffect(() => {
    if (snapshot.status !== 'completed' || !file?.id || file.isFolder) return;
    if (notifiedDownloadIdsRef.current.has(file.id)) return;
    notifiedDownloadIdsRef.current.add(file.id);
    void notifyUserFileDownloadCompleted(file.id);
  }, [snapshot.status, file]);

  const handlePickLocation = async () => {
    await controllerRef.current?.pickSaveLocation();
  };

  const handleStart = async () => {
    await controllerRef.current?.start();
  };

  const statusLabel = React.useMemo(() => {
    switch (snapshot.status) {
      case 'picking':
        return t('dashboard.files.downloadModal.picking', 'Choosing save location…');
      case 'downloading':
        return t('dashboard.files.downloadModal.downloading', 'Downloading…');
      case 'paused':
        return t('dashboard.files.downloadModal.paused', 'Paused');
      case 'completed':
        return t('dashboard.files.downloadModal.completed', 'Download completed');
      case 'cancelled':
        return t('dashboard.files.downloadModal.cancelled', 'Download cancelled');
      case 'error':
        return t('dashboard.files.downloadModal.error', 'Download failed');
      default:
        return t('dashboard.files.downloadModal.ready', 'Ready to download');
    }
  }, [snapshot.status, t]);

  const canStart =
    snapshot.status === 'idle' &&
    (!snapshot.supportsSavePicker || Boolean(snapshot.savePath));
  const isActive = snapshot.status === 'downloading' || snapshot.status === 'paused' || snapshot.status === 'picking';

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
                <DialogTitle className="truncate text-xl">
                  {t('dashboard.files.downloadModal.title', 'Download file')}
                </DialogTitle>
                <DialogDescription className="mt-1 line-clamp-2">
                  {file?.name ?? t('dashboard.files.downloadModal.subtitle', 'Manage download progress and save location.')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          {file && (
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">{formatDownloadBytes(file.fileSize, locale)}</Badge>
                <span className="text-muted-foreground">{statusLabel}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="download-save-path">
              {t('dashboard.files.downloadModal.savePath', 'Save location')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="download-save-path"
                readOnly
                value={
                  snapshot.savePath ||
                  (snapshot.supportsSavePicker
                    ? t('dashboard.files.downloadModal.savePathPlaceholder', 'Choose where to save the file')
                    : file?.name ?? '')
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
                {t('dashboard.files.downloadModal.browse', 'Browse')}
              </Button>
            </div>
            {!snapshot.supportsSavePicker && (
              <p className="text-xs text-muted-foreground">
                {t(
                  'dashboard.files.downloadModal.fallbackHint',
                  'Your browser will save the file to the default Downloads folder after the transfer completes.'
                )}
              </p>
            )}
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
                  ? t('dashboard.files.downloadModal.done', 'Done')
                  : snapshot.status === 'paused'
                    ? t('dashboard.files.downloadModal.pausedHint', 'Resume to continue')
                    : t('dashboard.files.downloadModal.progressHint', 'Resumable secure download')}
              </span>
            </div>
          </div>

          {snapshot.status === 'error' && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{snapshot.errorMessage || t('dashboard.files.downloadModal.error', 'Download failed')}</span>
            </div>
          )}

          {snapshot.status === 'completed' && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t('dashboard.files.downloadModal.success', 'The file was saved successfully.')}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {snapshot.status === 'downloading' ? (
              <Button type="button" variant="outline" onClick={() => controllerRef.current?.pause()}>
                <Pause className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                {t('dashboard.files.downloadModal.pause', 'Pause')}
              </Button>
            ) : snapshot.status === 'paused' ? (
              <Button type="button" onClick={() => void controllerRef.current?.resume()}>
                <Play className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                {t('dashboard.files.downloadModal.resume', 'Resume')}
              </Button>
            ) : snapshot.status === 'idle' ? (
              <Button type="button" onClick={() => void handleStart()} disabled={!canStart}>
                <Download className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                {t('dashboard.files.downloadModal.start', 'Start download')}
              </Button>
            ) : null}

            {isActive && (
              <Button type="button" variant="destructive" onClick={() => controllerRef.current?.cancel()}>
                <Square className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                {t('dashboard.files.downloadModal.stop', 'Stop')}
              </Button>
            )}
          </div>

          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
            {t('dashboard.files.downloadModal.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { ControlledDownloadDialog, type ControlledDownloadLabels } from '@/components/shared/controlled-download-dialog';

type SoftwareDownloadDialogProps = {
  dict: Dictionary;
  slug: string;
  softwareId: number;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  isRtl: boolean;
  onBeforeStart?: () => Promise<void>;
};

function buildSoftwareDownloadLabels(dict: Dictionary): ControlledDownloadLabels {
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);
  return {
    title: t('softwarePage.downloadModal.title', 'Download software'),
    subtitle: t('softwarePage.downloadModal.subtitle', 'Manage download progress and save location.'),
    savePath: t('softwarePage.downloadModal.savePath', 'Save location'),
    savePathPlaceholder: t(
      'softwarePage.downloadModal.savePathPlaceholder',
      'Choose where to save the installer'
    ),
    browse: t('softwarePage.downloadModal.browse', 'Browse'),
    fallbackHint: t(
      'softwarePage.downloadModal.fallbackHint',
      'Your browser will save the file to the default Downloads folder after the transfer completes.'
    ),
    ready: t('softwarePage.downloadModal.ready', 'Ready to download'),
    picking: t('softwarePage.downloadModal.picking', 'Choosing save location…'),
    downloading: t('softwarePage.downloadModal.downloading', 'Downloading…'),
    paused: t('softwarePage.downloadModal.paused', 'Paused'),
    pausedHint: t('softwarePage.downloadModal.pausedHint', 'Resume to continue'),
    completed: t('softwarePage.downloadModal.completed', 'Download completed'),
    cancelled: t('softwarePage.downloadModal.cancelled', 'Download cancelled'),
    error: t('softwarePage.downloadModal.error', 'Download failed'),
    success: t('softwarePage.downloadModal.success', 'The installer was saved successfully.'),
    progressHint: t('softwarePage.downloadModal.progressHint', 'Resumable secure download'),
    done: t('softwarePage.downloadModal.done', 'Done'),
    start: t('softwarePage.downloadModal.start', 'Start download'),
    pause: t('softwarePage.downloadModal.pause', 'Pause'),
    resume: t('softwarePage.downloadModal.resume', 'Resume'),
    stop: t('softwarePage.downloadModal.stop', 'Stop'),
    close: t('softwarePage.downloadModal.close', 'Close'),
  };
}

export function SoftwareDownloadDialog({
  dict,
  slug,
  softwareId,
  fileName,
  open,
  onOpenChange,
  locale,
  isRtl,
  onBeforeStart,
}: SoftwareDownloadDialogProps) {
  const downloadUrl =
    slug.trim() || softwareId > 0
      ? `/api/download/software?${new URLSearchParams({
          ...(slug.trim() ? { slug: slug.trim() } : {}),
          ...(softwareId > 0 ? { softwareId: String(softwareId) } : {}),
        }).toString()}`
      : null;

  return (
    <ControlledDownloadDialog
      labels={buildSoftwareDownloadLabels(dict)}
      fileName={fileName}
      downloadUrl={downloadUrl}
      open={open}
      onOpenChange={onOpenChange}
      locale={locale}
      isRtl={isRtl}
      onBeforeStart={onBeforeStart}
    />
  );
}

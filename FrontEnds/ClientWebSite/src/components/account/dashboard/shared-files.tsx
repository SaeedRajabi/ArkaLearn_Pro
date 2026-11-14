'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Download, FileText, Folder, FolderOpen, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { getMyUserFiles, type UserFileItem } from '@/lib/api/user-files';
import { UserFileDownloadDialog } from '@/components/account/dashboard/user-file-download-dialog';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

type FolderCrumb = {
  id: number | null;
  name: string;
};

function formatBytes(bytes: number, locale: string): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${units[index]}`;
}

function formatDate(value: string, locale: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function SharedFiles({ dict }: { dict: Dictionary }) {
  const { dir, locale } = useLanguage();
  const [files, setFiles] = useState<UserFileItem[]>([]);
  const [folderPath, setFolderPath] = useState<FolderCrumb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadFile, setDownloadFile] = useState<UserFileItem | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const isRtl = dir === 'rtl';

  const t = useCallback((key: string, fallback: string) => getDictValue(dict, key, fallback), [dict]);
  const rootLabel = t('dashboard.files.root', 'My files');
  const activeFolder = folderPath[folderPath.length - 1] ?? { id: null, name: rootLabel };

  const breadcrumbs = useMemo<FolderCrumb[]>(() => {
    if (folderPath.length === 0) return [{ id: null, name: rootLabel }];
    return [{ id: null, name: rootLabel }, ...folderPath];
  }, [folderPath, rootLabel]);

  const loadFiles = useCallback(async (parentId: number | null) => {
    setIsLoading(true);
    setError(null);
    try {
      setFiles(await getMyUserFiles(parentId));
    } catch {
      setError(t('dashboard.files.loadFailed', 'We could not load your files. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadFiles(activeFolder.id);
  }, [activeFolder.id, loadFiles]);

  const openFolder = (folder: UserFileItem) => {
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const goToBreadcrumb = (index: number) => {
    if (index === 0) {
      setFolderPath([]);
      return;
    }

    setFolderPath((prev) => prev.slice(0, index));
  };

  const openDownloadDialog = (file: UserFileItem) => {
    setDownloadFile(file);
    setDownloadOpen(true);
  };

  const renderSkeleton = () => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-xl border p-4">
          <Skeleton className="mb-4 h-10 w-10 rounded-lg" />
          <Skeleton className="mb-2 h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            {t('dashboard.files.title', 'Shared Files')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.files.subtitle', 'Files shared with you by the admin or your teacher.')}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadFiles(activeFolder.id)} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin', isRtl ? 'ml-2' : 'mr-2')} />
          {t('dashboard.files.refresh', 'Refresh')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <nav className="flex max-w-full items-center gap-2 overflow-x-auto rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <div key={`${crumb.id ?? 'root'}-${index}`} className="flex shrink-0 items-center gap-2">
              {index > 0 && <ChevronRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />}
              <button
                type="button"
                className={cn('transition hover:text-foreground', index === breadcrumbs.length - 1 && 'font-medium text-foreground')}
                onClick={() => goToBreadcrumb(index)}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </nav>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? renderSkeleton() : files.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <Folder className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium">{t('dashboard.files.empty', 'No files have been shared yet.')}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('dashboard.files.emptyHint', 'When the admin shares files with you, they will appear here.')}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'group rounded-xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm',
                  file.isFolder && 'cursor-pointer'
                )}
                role={file.isFolder ? 'button' : undefined}
                tabIndex={file.isFolder ? 0 : undefined}
                onClick={() => file.isFolder && openFolder(file)}
                onKeyDown={(event) => {
                  if (file.isFolder && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    openFolder(file);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2 text-primary">
                    {file.isFolder ? <Folder className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium" title={file.name}>{file.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">
                        {file.isFolder ? t('dashboard.files.folder', 'Folder') : formatBytes(file.fileSize, locale)}
                      </Badge>
                      <span>{formatDate(file.createdAt, locale)}</span>
                    </div>
                  </div>
                </div>

                {!file.isFolder && file.fileUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={(event) => {
                      event.stopPropagation();
                      openDownloadDialog(file);
                    }}
                  >
                    <Download className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                    {t('dashboard.files.download', 'Download')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <UserFileDownloadDialog
        dict={dict}
        file={downloadFile}
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        locale={locale}
        isRtl={isRtl}
      />
    </Card>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  Download,
  File as FileIcon,
  Folder,
  FolderPlus,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DownloadStorageUsage } from '@/components/shared/download-storage-usage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { HeaderActionMenu } from '@/components/shared/header-action-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue, formatDictTemplate } from '@/lib/i18n-client';
import {
  createManagedStudentFolder,
  createUserFileChunkedUploadTask,
  deleteManagedStudentFile,
  getManagedStudentFiles,
  MAX_MANAGED_STUDENT_FILE_BYTES,
  renameManagedStudentFile,
  toManagedStudentFileDownloadUrl,
  type ChunkedUploadProgress,
  type ManagedStudentFileItem,
  type UserFileChunkedUploadTask,
} from '@/lib/api/professor-managed-student-files';
import { getApiErrorMessage } from '@/lib/api/client';
import { ResumableUploadItem } from '@/components/shared/resumable-upload-item';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type Props = {
  dict: Dictionary;
  studentId: number;
  studentName?: string;
  returnTo?: string;
};

type UploadQueueItem = {
  id: string;
  file: File;
  task: UserFileChunkedUploadTask;
  progress: ChunkedUploadProgress;
};

export function ProfessorManagedStudentFilesPageClient({ dict, studentId, studentName, returnTo = '/professor/online-rooms' }: Props) {
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const dictRef = React.useRef(dict);
  const localeRef = React.useRef(locale);
  dictRef.current = dict;
  localeRef.current = locale;

  const t = React.useCallback(
    (key: string, fb: string) => getDictValue(dict, key, fb),
    [dict]
  );
  const rootLabel = t('professorDashboard.roomStudents.files.root', isRtl ? 'ریشه' : 'Root');

  const [files, setFiles] = React.useState<ManagedStudentFileItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentFolderId, setCurrentFolderId] = React.useState<number | null>(null);
  const [folderPath, setFolderPath] = React.useState<{ id: number | null; name: string }[]>([
    { id: null, name: '' },
  ]);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [creatingFolder, setCreatingFolder] = React.useState(false);
  const [uploadItems, setUploadItems] = React.useState<UploadQueueItem[]>([]);
  const uploadItemsRef = React.useRef(uploadItems);
  uploadItemsRef.current = uploadItems;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileToDelete, setFileToDelete] = React.useState<ManagedStudentFileItem | null>(null);
  const [fileToRename, setFileToRename] = React.useState<ManagedStudentFileItem | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [actionBusy, setActionBusy] = React.useState(false);

  const loadFiles = React.useCallback(
    async (parentId: number | null, opts?: { silent?: boolean }) => {
      if (studentId <= 0) return;
      if (!opts?.silent) setLoading(true);
      const rtl = localeRef.current === 'fa';
      const translate = (key: string, fb: string) => getDictValue(dictRef.current, key, fb);
      try {
        const data = await getManagedStudentFiles(studentId, parentId);
        setFiles(data);
      } catch {
        toast({
          variant: 'destructive',
          title: translate('professorDashboard.roomStudents.files.errorTitle', rtl ? 'خطا' : 'Error'),
          description: translate(
            'professorDashboard.roomStudents.files.loadFailed',
            rtl ? 'بارگذاری فایل‌ها انجام نشد.' : 'Could not load files.'
          ),
        });
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [studentId]
  );

  const duplicateNameMessage = React.useCallback(
    () =>
      t(
        'professorDashboard.roomStudents.files.duplicateName',
        isRtl
          ? 'پوشه یا فایلی با این نام در این مسیر از قبل وجود دارد.'
          : 'A folder or file with this name already exists here.'
      ),
    [isRtl, t]
  );

  const hasSiblingName = React.useCallback(
    (name: string, excludeId?: number) => {
      const normalized = name.trim().toLowerCase();
      if (!normalized) return false;
      if (files.some((f) => f.id !== excludeId && f.name.trim().toLowerCase() === normalized)) {
        return true;
      }
      return uploadItems.some((item) => item.file.name.trim().toLowerCase() === normalized);
    },
    [files, uploadItems]
  );

  const resolveMutationError = React.useCallback(
    (error: unknown, fallback: string) => {
      const message = getApiErrorMessage(error, '');
      if (/already exists/i.test(message)) return duplicateNameMessage();
      return message || fallback;
    },
    [duplicateNameMessage]
  );

  React.useEffect(() => {
    void loadFiles(currentFolderId);
  }, [studentId, currentFolderId, loadFiles]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    if (hasSiblingName(name)) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.roomStudents.files.errorTitle', isRtl ? 'خطا' : 'Error'),
        description: duplicateNameMessage(),
      });
      return;
    }
    setCreatingFolder(true);
    try {
      const createdId = await createManagedStudentFolder(studentId, name, currentFolderId);
      setNewFolderName('');
      if (createdId > 0) {
        setFiles((prev) => {
          if (prev.some((f) => f.id === createdId)) return prev;
          return [
            {
              id: createdId,
              userId: studentId,
              parentId: currentFolderId,
              name,
              isFolder: true,
              fileUrl: null,
              fileSize: 0,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      }
      await loadFiles(currentFolderId, { silent: true });
      toast({
        title: t('professorDashboard.roomStudents.files.folderCreated', isRtl ? 'پوشه ایجاد شد' : 'Folder created'),
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.roomStudents.files.errorTitle', isRtl ? 'خطا' : 'Error'),
        description: resolveMutationError(
          error,
          t(
            'professorDashboard.roomStudents.files.createFailed',
            isRtl ? 'ایجاد پوشه انجام نشد.' : 'Could not create folder.'
          )
        ),
      });
    } finally {
      setCreatingFolder(false);
    }
  };

  const uploadLabels = React.useMemo(
    () => ({
      uploaded: t('professorDashboard.roomStudents.files.uploadSuccess', isRtl ? 'آپلود شد' : 'Uploaded'),
      paused: t('professorDashboard.roomStudents.files.uploadPaused', isRtl ? 'متوقف شده' : 'Paused'),
      queued: t('professorDashboard.roomStudents.files.uploadQueued', isRtl ? 'در صف' : 'Queued'),
      canceled: t('professorDashboard.roomStudents.files.uploadCanceled', isRtl ? 'لغو شد' : 'Canceled'),
      failed: t('professorDashboard.roomStudents.files.uploadFailed', isRtl ? 'آپلود ناموفق' : 'Upload failed'),
      pause: t('professorDashboard.roomStudents.files.pauseUpload', isRtl ? 'توقف' : 'Pause'),
      resume: t('professorDashboard.roomStudents.files.resumeUpload', isRtl ? 'ادامه' : 'Resume'),
      cancel: t('professorDashboard.roomStudents.files.cancelUpload', isRtl ? 'لغو' : 'Cancel'),
      retry: t('professorDashboard.roomStudents.files.retryUpload', isRtl ? 'تلاش مجدد' : 'Retry'),
    }),
    [isRtl, t]
  );

  const isUploadingActive = uploadItems.some(
    (item) => item.progress.status === 'uploading' || item.progress.status === 'finalizing'
  );

  const updateUploadProgress = React.useCallback((itemId: string, progress: ChunkedUploadProgress) => {
    setUploadItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, progress } : item)));
  }, []);

  const runUpload = React.useCallback(
    async (itemId: string) => {
      const current = uploadItemsRef.current.find((item) => item.id === itemId);
      if (!current) return;

      try {
        const result =
          current.progress.status === 'paused' ? await current.task.resume() : await current.task.start();
        toast({
          title: t('professorDashboard.roomStudents.files.uploadSuccess', isRtl ? 'فایل آپلود شد' : 'File uploaded'),
          description: result.name || current.file.name,
        });
        await loadFiles(currentFolderId, { silent: true });
        setUploadItems((prev) => prev.filter((item) => item.id !== itemId));
      } catch (error) {
        const latest = uploadItemsRef.current.find((item) => item.id === itemId);
        if (!latest || latest.task.currentStatus === 'paused' || latest.task.currentStatus === 'canceled') return;
        toast({
          variant: 'destructive',
          title: t('professorDashboard.roomStudents.files.errorTitle', isRtl ? 'خطا' : 'Error'),
          description: resolveMutationError(
            error,
            t('professorDashboard.roomStudents.files.uploadFailed', isRtl ? 'آپلود انجام نشد.' : 'Upload failed.')
          ),
        });
      }
    },
    [currentFolderId, isRtl, loadFiles, resolveMutationError, t, toast]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!selected) return;

    if (selected.size > MAX_MANAGED_STUDENT_FILE_BYTES) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.roomStudents.files.errorTitle', isRtl ? 'خطا' : 'Error'),
        description: t(
          'professorDashboard.roomStudents.files.tooLarge',
          isRtl ? 'حجم فایل بیش از ۳ گیگابایت است.' : 'File exceeds the 3 GB limit.'
        ),
      });
      return;
    }

    if (hasSiblingName(selected.name)) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.roomStudents.files.errorTitle', isRtl ? 'خطا' : 'Error'),
        description: duplicateNameMessage(),
      });
      return;
    }

    const id = `${selected.name}-${selected.size}-${Date.now()}`;
    const task = createUserFileChunkedUploadTask(studentId, selected, currentFolderId, {
      chunkSizeBytes: 2 * 1024 * 1024,
      parallelChunks: 4,
      onProgress: (progress) => updateUploadProgress(id, progress),
    });

    setUploadItems((prev) => [...prev, { id, file: selected, task, progress: task.progress }]);
    void runUpload(id);
  };

  const navigateToFolder = (folder: ManagedStudentFileItem) => {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const target = folderPath[index];
    setCurrentFolderId(target.id);
    setFolderPath((prev) => prev.slice(0, index + 1));
  };

  const handleRename = async () => {
    const nextName = renameValue.trim();
    if (!fileToRename || !nextName) return;
    if (hasSiblingName(nextName, fileToRename.id)) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.roomStudents.files.errorTitle', isRtl ? 'خطا' : 'Error'),
        description: duplicateNameMessage(),
      });
      return;
    }
    setActionBusy(true);
    try {
      await renameManagedStudentFile(fileToRename.id, studentId, nextName);
      setFiles((prev) => prev.map((f) => (f.id === fileToRename.id ? { ...f, name: nextName } : f)));
      setFolderPath((prev) =>
        prev.map((crumb) => (crumb.id === fileToRename.id ? { ...crumb, name: nextName } : crumb))
      );
      setFileToRename(null);
      toast({
        title: t('professorDashboard.roomStudents.files.renameSuccess', isRtl ? 'نام تغییر کرد' : 'Renamed'),
      });
      await loadFiles(currentFolderId, { silent: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.roomStudents.files.errorTitle', isRtl ? 'خطا' : 'Error'),
        description: resolveMutationError(
          error,
          t(
            'professorDashboard.roomStudents.files.renameFailed',
            isRtl ? 'تغییر نام انجام نشد.' : 'Rename failed.'
          )
        ),
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;
    setActionBusy(true);
    try {
      await deleteManagedStudentFile(fileToDelete.id, studentId);
      if (fileToDelete.isFolder && currentFolderId === fileToDelete.id) {
        const parentCrumb = folderPath[folderPath.length - 2];
        setCurrentFolderId(parentCrumb?.id ?? null);
        setFolderPath((prev) => prev.slice(0, -1));
      } else {
        setFolderPath((prev) => prev.filter((crumb) => crumb.id !== fileToDelete.id));
      }
      setFileToDelete(null);
      toast({
        title: t('professorDashboard.roomStudents.files.deleteSuccess', isRtl ? 'حذف شد' : 'Deleted'),
      });
      await loadFiles(currentFolderId);
    } catch {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.roomStudents.files.errorTitle', isRtl ? 'خطا' : 'Error'),
        description: t(
          'professorDashboard.roomStudents.files.deleteFailed',
          isRtl ? 'حذف انجام نشد.' : 'Delete failed.'
        ),
      });
    } finally {
      setActionBusy(false);
    }
  };

  const title = studentName
    ? formatDictTemplate(
        t('professorDashboard.roomStudents.files.titleFor', isRtl ? 'فایل‌های {name}' : 'Files for {name}'),
        { name: studentName }
      )
    : t('professorDashboard.roomStudents.files.title', isRtl ? 'مدیریت فایل دانشجو' : 'Student files');

  return (
    <div className="w-full space-y-6 text-start" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={returnTo}>
            <ArrowLeft className={cn('h-5 w-5', isRtl && 'rotate-180')} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {t(
              'professorDashboard.roomStudents.files.subtitle',
              isRtl
                ? 'پوشه و فایل‌های اختصاصی این دانشجو برای استفاده در اتاق آنلاین.'
                : 'Folders and files for this student in online rooms.'
            )}
          </p>
        </div>
      </div>

      <DownloadStorageUsage refreshKey={files} />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-full items-center gap-2 overflow-x-auto whitespace-nowrap text-sm text-muted-foreground">
            {folderPath.map((crumb, index) => (
              <div key={crumb.id ?? 'root'} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />}
                <button
                  type="button"
                  onClick={() => navigateToBreadcrumb(index)}
                  className={cn(
                    'hover:text-foreground transition-colors',
                    index === folderPath.length - 1 && 'font-medium text-foreground'
                  )}
                >
                  {crumb.id === null ? rootLabel : crumb.name}
                </button>
              </div>
            ))}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2">
              <Input
                placeholder={t(
                  'professorDashboard.roomStudents.files.newFolderPlaceholder',
                  isRtl ? 'نام پوشه جدید…' : 'New folder name…'
                )}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full sm:w-40"
              />
              <Button onClick={() => void handleCreateFolder()} disabled={creatingFolder || !newFolderName.trim()}>
                {creatingFolder ? <Loader2 className="h-4 w-4 animate-spin sm:me-2" /> : <FolderPlus className="h-4 w-4 sm:me-2" />}
                <span className="hidden sm:inline">
                  {t('professorDashboard.roomStudents.files.createFolder', isRtl ? 'ایجاد پوشه' : 'Create folder')}
                </span>
              </Button>
            </div>
            <div className="relative">
              <Input
                type="file"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
              <Button variant="secondary">
                <UploadCloud className="h-4 w-4 sm:me-2" />
                <span className="hidden sm:inline">
                  {t('professorDashboard.roomStudents.files.upload', isRtl ? 'آپلود فایل' : 'Upload file')}
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {uploadItems.length > 0 ? (
            <div className="mb-6 space-y-2">
              {uploadItems.map((item) => (
                <ResumableUploadItem
                  key={item.id}
                  file={item.file}
                  progress={item.progress.percentage}
                  status={item.progress.status}
                  errorMessage={item.progress.errorMessage}
                  isRtl={isRtl}
                  labels={uploadLabels}
                  onPause={() => item.task.pause()}
                  onResume={() => void runUpload(item.id)}
                  onRetry={() => void runUpload(item.id)}
                  onCancel={() => void item.task.cancel().then(() => {
                    setUploadItems((prev) => prev.filter((row) => row.id !== item.id));
                  })}
                />
              ))}
              {isUploadingActive ? (
                <p className="text-xs text-muted-foreground">
                  {t('professorDashboard.roomStudents.files.uploading', isRtl ? 'در حال آپلود…' : 'Uploading…')}
                </p>
              ) : null}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : files.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed py-12 text-center text-muted-foreground">
              <Folder className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p>{t('professorDashboard.roomStudents.files.empty', isRtl ? 'فایلی وجود ندارد.' : 'No files yet.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group relative flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  onClick={() => (file.isFolder ? navigateToFolder(file) : undefined)}
                  onKeyDown={(e) => {
                    if (file.isFolder && (e.key === 'Enter' || e.key === ' ')) navigateToFolder(file);
                  }}
                  role={file.isFolder ? 'button' : undefined}
                  tabIndex={file.isFolder ? 0 : undefined}
                >
                  <div className="shrink-0">
                    {file.isFolder ? (
                      <Folder className="h-8 w-8 fill-blue-500/20 text-blue-500" />
                    ) : (
                      <FileIcon className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.isFolder
                        ? t('professorDashboard.roomStudents.files.folder', isRtl ? 'پوشه' : 'Folder')
                        : formatSize(file.fileSize)}
                    </p>
                  </div>
                  {!file.isFolder && file.fileUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn('absolute opacity-0 group-hover:opacity-100', isRtl ? 'left-10' : 'right-10')}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(toManagedStudentFileDownloadUrl(file.fileUrl), '_blank');
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <HeaderActionMenu
                    className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    items={[
                      {
                        id: 'rename',
                        label: t('professorDashboard.roomStudents.files.rename', isRtl ? 'تغییر نام' : 'Rename'),
                        icon: <Pencil className="h-4 w-4 shrink-0" />,
                        onClick: () => {
                          setFileToRename(file);
                          setRenameValue(file.name);
                        },
                      },
                      {
                        id: 'delete',
                        label: t('professorDashboard.roomStudents.files.delete', isRtl ? 'حذف' : 'Delete'),
                        icon: <Trash2 className="h-4 w-4 shrink-0" />,
                        destructive: true,
                        onClick: () => setFileToDelete(file),
                      },
                    ]}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={fileToRename != null} onOpenChange={(open) => !open && setFileToRename(null)}>
        <DialogContent className="sm:max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {t('professorDashboard.roomStudents.files.renameTitle', isRtl ? 'تغییر نام' : 'Rename')}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            disabled={actionBusy}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleRename();
            }}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFileToRename(null)} disabled={actionBusy}>
              {t('professorDashboard.roomStudents.cancel', isRtl ? 'انصراف' : 'Cancel')}
            </Button>
            <Button onClick={() => void handleRename()} disabled={actionBusy || !renameValue.trim()}>
              {actionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('professorDashboard.roomStudents.save', isRtl ? 'ذخیره' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={fileToDelete != null} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('professorDashboard.roomStudents.files.deleteTitle', isRtl ? 'حذف فایل' : 'Delete file')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {fileToDelete?.isFolder
                ? t(
                    'professorDashboard.roomStudents.files.deleteFolderConfirm',
                    isRtl ? `پوشه «${fileToDelete.name}» حذف شود؟` : `Delete folder "${fileToDelete.name}"?`
                  )
                : t(
                    'professorDashboard.roomStudents.files.deleteFileConfirm',
                    isRtl ? `فایل «${fileToDelete?.name ?? ''}» حذف شود؟` : `Delete file "${fileToDelete?.name ?? ''}"?`
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionBusy}>
              {t('professorDashboard.roomStudents.cancel', isRtl ? 'انصراف' : 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionBusy}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {actionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('professorDashboard.roomStudents.files.delete', isRtl ? 'حذف' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

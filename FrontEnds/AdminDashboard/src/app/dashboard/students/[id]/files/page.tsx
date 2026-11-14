'use client';

import { useState, useEffect, useRef, useCallback, useMemo, type ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getUserFiles,
  createUserFolder,
  deleteUserFile,
  renameUserFile,
  UserFileItem,
  MAX_USER_FILE_BYTES,
} from '@/services/user-file-service';
import { resolveStaticAssetUrl } from '@/lib/api-config';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DownloadStorageUsage } from '@/components/shared/download-storage-usage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Folder, File as FileIcon, UploadCloud, FolderPlus, ArrowLeft, Download, ChevronRight, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/components/language-provider';
import { asLongId } from '@/lib/id';
import { getApiErrorMessage } from '@/lib/parse-api-error-messages';
import { UploadingFile } from '@/components/seminar/uploading-file';
import type { RoomFileUploadStatus } from '@/services/room-service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  isUploadJobActive,
  useUploadQueueStore,
} from '@/stores/upload-queue-store';

export default function StudentFilesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const userId = asLongId(params?.id);
  const returnPath = `/dashboard/students/${userId}/files`;

  const [files, setFiles] = useState<UserFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: number | null; name: string }[]>([
    { id: null, name: t('student_files_root') },
  ]);

  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileToDelete, setFileToDelete] = useState<UserFileItem | null>(null);
  const [fileToRename, setFileToRename] = useState<UserFileItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const allUploadJobs = useUploadQueueStore((s) => s.jobs);
  const enqueueUserFile = useUploadQueueStore((s) => s.enqueueUserFile);
  const pauseUpload = useUploadQueueStore((s) => s.pause);
  const resumeUpload = useUploadQueueStore((s) => s.resume);
  const cancelUpload = useUploadQueueStore((s) => s.cancel);
  const removeUpload = useUploadQueueStore((s) => s.remove);
  const getUploadFile = useUploadQueueStore((s) => s.getFile);

  const uploadJobs = useMemo(
    () => allUploadJobs.filter((job) => job.returnPath === returnPath),
    [allUploadJobs, returnPath]
  );

  const handledTerminalIdsRef = useRef<Set<string>>(new Set());

  const loadFiles = useCallback(async (parentId: number | null, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await getUserFiles(userId, parentId);
      setFiles(data);
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title'),
        description: t('student_files_load_failed'),
      });
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [userId, t, toast]);

  const hasSiblingName = (name: string, excludeId?: number) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return false;
    if (files.some((f) => f.id !== excludeId && f.name.trim().toLowerCase() === normalized)) {
      return true;
    }
    return uploadJobs.some(
      (item) =>
        item.meta.parentId === currentFolderId &&
        isUploadJobActive(item.status) &&
        item.fileName.trim().toLowerCase() === normalized
    );
  };

  const duplicateNameMessage = () => t('student_files_duplicate_name');
  const resolveMutationError = (error: unknown, fallbackKey: string) => {
    const message = getApiErrorMessage(error, '');
    if (/already exists/i.test(message)) return duplicateNameMessage();
    return message || t(fallbackKey);
  };

  useEffect(() => {
    if (userId) {
      void loadFiles(currentFolderId);
    }
    // Intentionally omit loadFiles — toast identity can change every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentFolderId]);

  useEffect(() => {
    setFolderPath((prev) => {
      if (prev[0]?.name === t('student_files_root')) return prev;
      const next = [...prev];
      if (next[0]) next[0] = { ...next[0], name: t('student_files_root') };
      return next;
    });
  }, [t]);

  // Surface terminal upload results while this page is mounted (upload itself lives in the global store).
  useEffect(() => {
    for (const job of uploadJobs) {
      if (handledTerminalIdsRef.current.has(job.id)) continue;

      if (job.status === 'completed') {
        handledTerminalIdsRef.current.add(job.id);
        toast({ title: t('toast_success_title'), description: t('student_files_upload_success') });
        void loadFiles(currentFolderId, { silent: true });
        removeUpload(job.id);
        continue;
      }

      if (job.status === 'failed') {
        handledTerminalIdsRef.current.add(job.id);
        toast({
          variant: 'destructive',
          title: t('error_title'),
          description: job.errorMessage || t('student_files_upload_failed'),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to upload job terminal states
  }, [uploadJobs]);

  const handleCreateFolder = async () => {
    const folderName = newFolderName.trim();
    if (!folderName) return;
    if (hasSiblingName(folderName)) {
      toast({
        variant: 'destructive',
        title: t('error_title'),
        description: duplicateNameMessage(),
      });
      return;
    }
    setIsCreatingFolder(true);
    try {
      const createdId = await createUserFolder(userId, folderName, currentFolderId);
      setNewFolderName('');

      if (createdId > 0) {
        setFiles((prev) => {
          if (prev.some((f) => f.id === createdId)) return prev;
          const optimistic: UserFileItem = {
            id: createdId,
            userId,
            parentId: currentFolderId,
            name: folderName,
            isFolder: true,
            fileUrl: null,
            fileSize: 0,
            createdAt: new Date().toISOString(),
          };
          return [optimistic, ...prev];
        });
      }

      await loadFiles(currentFolderId, { silent: true });
      toast({ title: t('toast_success_title'), description: t('student_files_folder_created') });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error_title'),
        description: resolveMutationError(error, 'student_files_create_failed'),
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (file.size > MAX_USER_FILE_BYTES) {
      toast({
        variant: 'destructive',
        title: t('error_title'),
        description: t('student_files_upload_too_large'),
      });
      return;
    }

    if (hasSiblingName(file.name)) {
      toast({
        variant: 'destructive',
        title: t('error_title'),
        description: duplicateNameMessage(),
      });
      return;
    }

    enqueueUserFile({
      userId,
      file,
      parentId: currentFolderId,
      returnPath,
      contextKey: 'global_upload_context_student_files',
    });
  };

  const isUploadingActive = uploadJobs.some((item) => isUploadJobActive(item.status));

  const navigateToFolder = (folder: UserFileItem) => {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const target = folderPath[index];
    setCurrentFolderId(target.id);
    setFolderPath((prev) => prev.slice(0, index + 1));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const openRenameDialog = (file: UserFileItem) => {
    setFileToRename(file);
    setRenameValue(file.name);
  };

  const handleRename = async () => {
    const nextName = renameValue.trim();
    if (!fileToRename || !nextName) return;
    if (hasSiblingName(nextName, fileToRename.id)) {
      toast({
        variant: 'destructive',
        title: t('error_title'),
        description: duplicateNameMessage(),
      });
      return;
    }
    setActionBusy(true);
    try {
      await renameUserFile(fileToRename.id, userId, nextName);
      setFiles((prev) => prev.map((f) => (f.id === fileToRename.id ? { ...f, name: nextName } : f)));
      setFolderPath((prev) =>
        prev.map((crumb) => (crumb.id === fileToRename.id ? { ...crumb, name: nextName } : crumb))
      );
      setFileToRename(null);
      toast({ title: t('toast_success_title'), description: t('student_files_rename_success') });
      await loadFiles(currentFolderId, { silent: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error_title'),
        description: resolveMutationError(error, 'student_files_rename_failed'),
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;
    setActionBusy(true);
    try {
      await deleteUserFile(fileToDelete.id, userId);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      if (fileToDelete.isFolder && currentFolderId === fileToDelete.id) {
        const parentCrumb = folderPath[folderPath.length - 2];
        setCurrentFolderId(parentCrumb?.id ?? null);
        setFolderPath((prev) => prev.slice(0, -1));
      } else {
        setFolderPath((prev) => prev.filter((crumb) => crumb.id !== fileToDelete.id));
      }
      setFileToDelete(null);
      toast({ title: t('toast_success_title'), description: t('student_files_delete_success') });
      await loadFiles(currentFolderId);
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title'),
        description: t('student_files_delete_failed'),
      });
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/students')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{t('student_files_title')}</h1>
        </div>
      </div>

      <DownloadStorageUsage refreshKey={files} />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap max-w-full pb-2 sm:pb-0">
            {folderPath.map((crumb, index) => (
              <div key={crumb.id ?? 'root'} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="h-4 w-4" />}
                <button
                  type="button"
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`hover:text-foreground transition-colors ${index === folderPath.length - 1 ? 'font-medium text-foreground' : ''}`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Input
                placeholder={t('student_files_new_folder_placeholder')}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full sm:w-40"
              />
              <Button onClick={handleCreateFolder} disabled={isCreatingFolder || !newFolderName.trim()}>
                <FolderPlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('student_files_create')}</span>
              </Button>
            </div>
            <div className="relative">
              <Input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
              <Button variant="secondary">
                <UploadCloud className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('student_files_upload')}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {uploadJobs.length > 0 ? (
            <div className="mb-6 space-y-2">
              {uploadJobs.map((item) => {
                const file = getUploadFile(item.id);
                if (!file) return null;
                return (
                  <UploadingFile
                    key={item.id}
                    file={file}
                    progress={item.percent}
                    status={item.status as RoomFileUploadStatus}
                    errorMessage={item.errorMessage}
                    onPause={() => pauseUpload(item.id)}
                    onResume={() => void resumeUpload(item.id)}
                    onRetry={() => void resumeUpload(item.id)}
                    onCancel={() => {
                      void cancelUpload(item.id);
                    }}
                  />
                );
              })}
              {isUploadingActive ? (
                <p className="text-xs text-muted-foreground">{t('student_files_uploading')}</p>
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
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('student_files_empty')}</p>
              <p className="text-sm mt-1">{t('student_files_empty_hint')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group relative flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => (file.isFolder ? navigateToFolder(file) : undefined)}
                  onKeyDown={(e) => {
                    if (file.isFolder && (e.key === 'Enter' || e.key === ' ')) navigateToFolder(file);
                  }}
                  role={file.isFolder ? 'button' : undefined}
                  tabIndex={file.isFolder ? 0 : undefined}
                >
                  <div className="shrink-0">
                    {file.isFolder ? (
                      <Folder className="h-8 w-8 text-blue-500 fill-blue-500/20" />
                    ) : (
                      <FileIcon className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.isFolder ? t('student_files_folder') : formatSize(file.fileSize)}
                    </p>
                  </div>
                  {!file.isFolder && file.fileUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 absolute right-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(resolveStaticAssetUrl(file.fileUrl), '_blank');
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">{t('actions')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => openRenameDialog(file)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        {t('student_files_rename')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setFileToDelete(file)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('student_files_delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={fileToRename != null}
        onOpenChange={(open) => {
          if (!open) setFileToRename(null);
        }}
      >
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t('student_files_rename_title')}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={t('student_files_rename_placeholder')}
            disabled={actionBusy}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleRename();
            }}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFileToRename(null)} disabled={actionBusy}>
              {t('cancel')}
            </Button>
            <Button onClick={() => void handleRename()} disabled={actionBusy || !renameValue.trim()}>
              {t('student_files_rename_save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={fileToDelete != null}
        onOpenChange={(open) => {
          if (!open) setFileToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('student_files_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {fileToDelete?.isFolder
                ? t('student_files_delete_folder_confirm', { name: fileToDelete.name })
                : t('student_files_delete_file_confirm', { name: fileToDelete?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionBusy}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionBusy}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {t('student_files_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

'use client';

import * as React from 'react';
import {
  ExternalLink,
  FileUp,
  FolderOpen,
  HardDrive,
  Loader2,
  Music,
  Presentation,
  Trash2,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
import { IconSelectPicker } from '@/components/shared/icon-select-picker';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  deleteProfessorRoomFile,
  getProfessorRoomFileDisplayTitle,
  getProfessorRoomFileTypeLabel,
  getProfessorRoomFiles,
  ProfessorRoomFileType,
  uploadProfessorRoomFile,
  type ProfessorRoomFile,
} from '@/lib/api/professor-rooms';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;

function stripFileExtension(name: string): string {
  const trimmed = name.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0) return trimmed;
  return trimmed.slice(0, dot);
}

type Props = {
  dict: Dictionary;
  roomId: number;
  onFilesChanged?: () => void;
};

type FileTypeMeta = {
  icon: LucideIcon;
  label: string;
  badgeClass: string;
  iconWrapClass: string;
};

function formatFileSize(bytes: number, isRtl: boolean): string {
  if (bytes <= 0) return isRtl ? '۰ بایت' : '0 B';
  if (bytes < 1024) return isRtl ? `${bytes} بایت` : `${bytes} B`;
  if (bytes < 1024 * 1024) return isRtl ? `${(bytes / 1024).toFixed(1)} کیلوبایت` : `${(bytes / 1024).toFixed(1)} KB`;
  return isRtl ? `${(bytes / (1024 * 1024)).toFixed(2)} مگابایت` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileTypeMeta(fileType: number, isRtl: boolean): FileTypeMeta {
  const label = getProfessorRoomFileTypeLabel(fileType, isRtl);
  switch (fileType) {
    case ProfessorRoomFileType.Video:
      return {
        icon: Video,
        label,
        badgeClass: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
        iconWrapClass: 'bg-sky-500/15 text-sky-600 ring-sky-500/20',
      };
    case ProfessorRoomFileType.Audio:
      return {
        icon: Music,
        label,
        badgeClass: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400',
        iconWrapClass: 'bg-violet-500/15 text-violet-600 ring-violet-500/20',
      };
    case ProfessorRoomFileType.Recording:
      return {
        icon: HardDrive,
        label,
        badgeClass: 'border-muted-foreground/25 bg-muted text-muted-foreground',
        iconWrapClass: 'bg-muted text-muted-foreground ring-border',
      };
    case ProfessorRoomFileType.SharedFile:
      return {
        icon: FolderOpen,
        label,
        badgeClass: 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400',
        iconWrapClass: 'bg-teal-500/15 text-teal-600 ring-teal-500/20',
      };
    case ProfessorRoomFileType.Slide:
    default:
      return {
        icon: Presentation,
        label,
        badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        iconWrapClass: 'bg-amber-500/15 text-amber-600 ring-amber-500/20',
      };
  }
}

function resolveFileUrl(fileUrl: string): string | null {
  const trimmed = fileUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (typeof window !== 'undefined' && trimmed.startsWith('/')) {
    return `${window.location.origin}${trimmed}`;
  }
  return trimmed;
}

function RoomFileRow({
  file,
  isRtl,
  openLabel,
  deleteLabel,
  onDelete,
  deleting,
}: {
  file: ProfessorRoomFile;
  isRtl: boolean;
  openLabel: string;
  deleteLabel: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  const meta = getFileTypeMeta(file.fileType, isRtl);
  const Icon = meta.icon;
  const href = resolveFileUrl(file.fileUrl);
  const displayTitle = getProfessorRoomFileDisplayTitle(file);
  const showOriginalName = file.fileName.trim() && file.fileName.trim() !== displayTitle;

  return (
    <article
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        'group flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-4',
        'shadow-sm transition-all duration-200',
        'hover:border-primary/25 hover:shadow-md hover:shadow-primary/5'
      )}
    >
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105',
          meta.iconWrapClass
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </div>

      <div className="min-w-0 flex-1 text-start">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground" title={displayTitle}>
          {displayTitle}
        </h3>
        {file.description?.trim() ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{file.description.trim()}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{formatFileSize(file.fileSize, isRtl)}</span>
          {showOriginalName ? (
            <>
              <span aria-hidden>•</span>
              <span className="truncate" title={file.fileName}>
                {file.fileName}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        <Badge variant="outline" className={cn('px-2.5 py-0.5 text-xs font-medium', meta.badgeClass)}>
          {meta.label}
        </Badge>
        <div className="flex items-center gap-1.5">
          {href ? (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-background/60" asChild>
              <a href={href} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{openLabel}</span>
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={deleting}
            onClick={onDelete}
            aria-label={deleteLabel}
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{deleteLabel}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProfessorRoomFilesPanel({ dict, roomId, onFilesChanged }: Props) {
  const { toast } = useToast();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);

  const [files, setFiles] = React.useState<ProfessorRoomFile[]>([]);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [listRefreshing, setListRefreshing] = React.useState(false);
  const [fileType, setFileType] = React.useState<string>(String(ProfessorRoomFileType.Slide));
  const [fileTitle, setFileTitle] = React.useState('');
  const [fileDescription, setFileDescription] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [deletingFileId, setDeletingFileId] = React.useState<number | null>(null);
  const [fileToDelete, setFileToDelete] = React.useState<ProfessorRoomFile | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const loadFiles = React.useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (silent) {
        setListRefreshing(true);
      } else {
        setInitialLoading(true);
      }

      try {
        const list = await getProfessorRoomFiles(roomId);
        setFiles(list);
      } catch {
        if (!silent) setFiles([]);
      } finally {
        if (silent) {
          setListRefreshing(false);
        } else {
          setInitialLoading(false);
        }
      }
    },
    [roomId]
  );

  React.useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const fileTypeOptions = React.useMemo(
    () => [
      {
        value: String(ProfessorRoomFileType.Video),
        label: getProfessorRoomFileTypeLabel(ProfessorRoomFileType.Video, isRtl),
        icon: Video,
      },
      {
        value: String(ProfessorRoomFileType.Audio),
        label: getProfessorRoomFileTypeLabel(ProfessorRoomFileType.Audio, isRtl),
        icon: Music,
      },
      {
        value: String(ProfessorRoomFileType.Slide),
        label: getProfessorRoomFileTypeLabel(ProfessorRoomFileType.Slide, isRtl),
        icon: Presentation,
      },
      {
        value: String(ProfessorRoomFileType.SharedFile),
        label: getProfessorRoomFileTypeLabel(ProfessorRoomFileType.SharedFile, isRtl),
        icon: FolderOpen,
      },
    ],
    [isRtl]
  );

  const acceptByType = (type: number) => {
    if (type === ProfessorRoomFileType.Video) return '.ogv,.ogg,.webm,.mp4';
    if (type === ProfessorRoomFileType.Audio) return '.mp3,.wav,.ogg,.oga';
    if (type === ProfessorRoomFileType.Slide) {
      return '.jpg,.jpeg,.png,.gif,.pdf,.ppt,.pptx,.doc,.docx,.txt,.zip,.html,.htm';
    }
    return '*/*';
  };

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      toast({
        title: t('professorDashboard.onlineRooms.fileTooLarge', isRtl ? 'فایل بیش از حد مجاز است' : 'File is too large'),
        description: t('professorDashboard.onlineRooms.fileMaxSize', isRtl ? 'حداکثر ۵۰ مگابایت' : 'Maximum 50 MB'),
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    if (!fileTitle.trim()) {
      setFileTitle(stripFileExtension(file.name).slice(0, MAX_TITLE_LENGTH));
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setFileTitle('');
    setFileDescription('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      inputRef.current?.click();
      return;
    }

    const title = fileTitle.trim();
    if (!title) {
      toast({
        title: t('professorDashboard.onlineRooms.fileTitleRequired', isRtl ? 'عنوان فایل الزامی است' : 'File title is required'),
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      await uploadProfessorRoomFile(
        roomId,
        Number(fileType),
        selectedFile,
        { title, description: fileDescription.trim() || undefined },
        setProgress
      );
      toast({
        title: t('professorDashboard.onlineRooms.fileUploaded', isRtl ? 'فایل آپلود شد' : 'File uploaded'),
      });
      resetUploadForm();
      await loadFiles({ silent: true });
      onFilesChanged?.();
    } catch (error) {
      toast({
        title: t('professorDashboard.onlineRooms.fileUploadFailed', isRtl ? 'آپلود انجام نشد' : 'Upload failed'),
        description: getApiErrorMessage(error, ''),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const openFileLabel = t('professorDashboard.onlineRooms.openFile', isRtl ? 'باز کردن' : 'Open');
  const deleteFileLabel = t('professorDashboard.onlineRooms.deleteFile', isRtl ? 'حذف' : 'Delete');
  const deleteFileTitle = t('professorDashboard.onlineRooms.deleteFileTitle', isRtl ? 'حذف فایل' : 'Delete file');
  const deleteFileConfirm = t(
    'professorDashboard.onlineRooms.deleteFileConfirm',
    isRtl ? 'آیا از حذف «{name}» مطمئن هستید؟' : 'Are you sure you want to delete "{name}"?'
  );
  const deleteFileConfirmButton = t(
    'professorDashboard.onlineRooms.deleteFileConfirmButton',
    isRtl ? 'بله، حذف شود' : 'Yes, delete'
  );
  const cancelLabel = t('professorDashboard.onlineRooms.cancel', isRtl ? 'انصراف' : 'Cancel');
  const fileDeletedLabel = t('professorDashboard.onlineRooms.fileDeleted', isRtl ? 'فایل حذف شد' : 'File deleted');
  const fileDeleteFailedLabel = t(
    'professorDashboard.onlineRooms.fileDeleteFailed',
    isRtl ? 'حذف فایل انجام نشد' : 'Could not delete file'
  );
  const uploadedCountLabel = t(
    'professorDashboard.onlineRooms.uploadedFilesCount',
    isRtl ? 'فایل آپلود شده' : 'Uploaded files'
  );

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    const deletedId = fileToDelete.id;
    setDeletingFileId(deletedId);
    setFileToDelete(null);
    setFiles((prev) => prev.filter((file) => file.id !== deletedId));
    try {
      await deleteProfessorRoomFile(roomId, deletedId);
      toast({ title: fileDeletedLabel });
      await loadFiles({ silent: true });
      onFilesChanged?.();
    } catch (error) {
      await loadFiles({ silent: true });
      toast({
        title: fileDeleteFailedLabel,
        description: getApiErrorMessage(error, ''),
        variant: 'destructive',
      });
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <Card dir={isRtl ? 'rtl' : 'ltr'} className="overflow-hidden">
      <CardHeader className="text-start">
        <CardTitle>{t('professorDashboard.onlineRooms.filesTitle', isRtl ? 'رسانه و فایل‌های اتاق' : 'Room media & files')}</CardTitle>
        <CardDescription>
          {t(
            'professorDashboard.onlineRooms.filesDescription',
            isRtl
              ? 'ویدیو، صوت، اسلاید و اسناد آموزشی را با عنوان و توضیحات مناسب برای جلسه آنلاین و بهبود سئو آپلود کنید.'
              : 'Upload videos, audio, slides, and documents with a clear title and description for sessions and SEO.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('professorDashboard.onlineRooms.fileType', isRtl ? 'نوع فایل' : 'File type')}</Label>
              <IconSelectPicker
                value={fileType}
                onChange={setFileType}
                options={fileTypeOptions}
                isRtl={isRtl}
                disabled={uploading}
                placeholder={t('professorDashboard.onlineRooms.fileType', isRtl ? 'نوع فایل' : 'File type')}
                ariaLabel={t('professorDashboard.onlineRooms.fileType', isRtl ? 'نوع فایل' : 'File type')}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="room-file-title">
                {t('professorDashboard.onlineRooms.fileTitle', isRtl ? 'عنوان فایل' : 'File title')}
                <span className="text-destructive"> *</span>
              </Label>
              <Input
                id="room-file-title"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                disabled={uploading}
                placeholder={t(
                  'professorDashboard.onlineRooms.fileTitlePlaceholder',
                  isRtl ? 'مثلاً: معرفی دوره ASP.NET Core' : 'e.g. ASP.NET Core course intro'
                )}
                className="text-start"
                dir={isRtl ? 'rtl' : 'ltr'}
                maxLength={MAX_TITLE_LENGTH}
              />
              <p className="text-xs text-muted-foreground">
                {t(
                  'professorDashboard.onlineRooms.fileTitleHint',
                  isRtl
                    ? 'عنوانی کوتاه و واضح برای نمایش و بهبود سئو انتخاب کنید.'
                    : 'Use a clear, concise title for display and SEO.'
                )}
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="room-file-description">
                {t('professorDashboard.onlineRooms.fileDescription', isRtl ? 'توضیحات فایل' : 'File description')}
              </Label>
              <Textarea
                id="room-file-description"
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                disabled={uploading}
                placeholder={t(
                  'professorDashboard.onlineRooms.fileDescriptionPlaceholder',
                  isRtl
                    ? 'توضیح کوتاه درباره محتوا، مخاطب و کاربرد فایل در جلسه…'
                    : 'Brief description of content, audience, and how this file is used…'
                )}
                className="min-h-[96px] resize-y text-start"
                dir={isRtl ? 'rtl' : 'ltr'}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <p className="text-xs text-muted-foreground">
                {t(
                  'professorDashboard.onlineRooms.fileDescriptionHint',
                  isRtl
                    ? 'توضیحات به درک بهتر محتوا و بهبود سئو کمک می‌کند.'
                    : 'Descriptions help users understand the content and improve SEO.'
                )}
              </p>
            </div>
          </div>

          <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
            <div className="min-w-0 text-start">
              <p className="text-sm font-medium text-foreground">
                {t('professorDashboard.onlineRooms.selectedFile', isRtl ? 'فایل انتخاب‌شده' : 'Selected file')}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {selectedFile
                  ? selectedFile.name
                  : t('professorDashboard.onlineRooms.noFileSelected', isRtl ? 'هنوز فایلی انتخاب نشده' : 'No file selected yet')}
              </p>
            </div>
            <div className={cn('flex flex-wrap gap-2', isRtl ? 'justify-end' : 'justify-start')}>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={acceptByType(Number(fileType))}
                onChange={onFileSelected}
              />
              <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
                {t('professorDashboard.onlineRooms.chooseFile', isRtl ? 'انتخاب فایل' : 'Choose file')}
              </Button>
              <Button type="button" className="gap-2 shadow-sm" disabled={uploading || !selectedFile || !fileTitle.trim()} onClick={() => void handleUpload()}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                {t('professorDashboard.onlineRooms.uploadFile', isRtl ? 'آپلود فایل' : 'Upload file')}
              </Button>
            </div>
          </div>
        </div>

        {uploading ? (
          <div className="space-y-2 rounded-xl border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('professorDashboard.onlineRooms.uploading', isRtl ? 'در حال آپلود…' : 'Uploading…')}
              </span>
              <span className="font-medium text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">{uploadedCountLabel}</h3>
            <div className="flex items-center gap-2">
              {listRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
              {!initialLoading ? (
                <Badge variant="secondary" className="font-normal">
                  {files.length}
                </Badge>
              ) : null}
            </div>
          </div>

          {initialLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[6.5rem] w-full rounded-2xl" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/80 bg-muted/15 px-6 py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <FolderOpen className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium text-muted-foreground">
                {t('professorDashboard.onlineRooms.noFiles', isRtl ? 'هنوز فایلی آپلود نشده است.' : 'No files uploaded yet.')}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground/80">
                {t(
                  'professorDashboard.onlineRooms.noFilesHint',
                  isRtl
                    ? 'نوع فایل را انتخاب کنید و با دکمه آپلود، اولین فایل را اضافه کنید.'
                    : 'Choose a file type and use Upload file to add your first item.'
                )}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {files.map((file) => (
                <RoomFileRow
                  key={file.id}
                  file={file}
                  isRtl={isRtl}
                  openLabel={openFileLabel}
                  deleteLabel={deleteFileLabel}
                  deleting={deletingFileId === file.id}
                  onDelete={() => setFileToDelete(file)}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={fileToDelete != null} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteFileTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteFileConfirm.replace('{name}', fileToDelete ? getProfessorRoomFileDisplayTitle(fileToDelete) : '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRtl ? 'flex-row-reverse gap-2' : ''}>
            <AlertDialogCancel disabled={deletingFileId != null}>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingFileId != null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deletingFileId != null ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                deleteFileConfirmButton
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

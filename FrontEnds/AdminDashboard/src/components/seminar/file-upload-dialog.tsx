
'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { ScrollArea } from '../ui/scroll-area';
import { File as FileIcon, Download, Trash2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadingFile } from './uploading-file';
import { useLanguage } from '@/components/language-provider';
import {
  createRoomChunkedUploadTask,
  RoomFileType,
  type RoomChunkedUploadTask,
  type RoomFileUploadProgress,
} from '@/services/room-service';
import { resolveStaticAssetUrl } from '@/lib/api-config';


export interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploader: string;
  url: string;
}

type FileUploadDialogProps = {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  sharedFiles: SharedFile[];
  roomId: number;
  uploadedBy: string;
  onUploadCompletedAction: (file: SharedFile) => void;
  onDeleteAction: (fileId: string) => void;
  isOrganizer: boolean;
};

type UploadQueueItem = {
  id: string;
  file: File;
  task: RoomChunkedUploadTask;
  progress: RoomFileUploadProgress;
};

export function FileUploadDialog({
  isOpen,
  onOpenChangeAction,
  sharedFiles,
  roomId,
  uploadedBy,
  onUploadCompletedAction,
  onDeleteAction,
  isOrganizer,
}: FileUploadDialogProps) {
  const { t } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const onUploadCompleted = onUploadCompletedAction;
  const onDelete = onDeleteAction;
  const { toast } = useToast();
  const [uploadItems, setUploadItems] = useState<UploadQueueItem[]>([]);

  const updateProgress = useCallback((itemId: string, progress: RoomFileUploadProgress) => {
    setUploadItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, progress } : item))
    );
  }, []);

  const createQueueItem = useCallback(
    (file: File): UploadQueueItem => {
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const task = createRoomChunkedUploadTask(roomId, RoomFileType.SharedFile, file, {
        chunkSizeBytes: 2 * 1024 * 1024,
        parallelChunks: 4,
        onProgress: (progress) => updateProgress(id, progress),
      });
      return {
        id,
        file,
        task,
        progress: task.progress,
      };
    },
    [roomId, updateProgress]
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const nextItems = acceptedFiles.map(createQueueItem);
    setUploadItems((prev) => [...prev, ...nextItems]);
  }, [createQueueItem]);

  const isUploading = uploadItems.some(
    (item) => item.progress.status === 'uploading' || item.progress.status === 'finalizing'
  );
  const canStartUploads = uploadItems.some((item) =>
    item.progress.status === 'queued' ||
    item.progress.status === 'paused' ||
    item.progress.status === 'failed'
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: false,
  });

  const runUpload = useCallback(async (itemId: string) => {
    const current = uploadItems.find((item) => item.id === itemId);
    if (!current) return;

    try {
      const result =
        current.progress.status === 'paused' ? await current.task.resume() : await current.task.start();

      const uploadedFile: SharedFile = {
        id: `${result.roomId}-${Date.now()}-${itemId}`,
        name: result.fileName || current.file.name,
        size: result.fileSize || current.file.size,
        type: current.file.type,
        uploader: uploadedBy,
        url: resolveStaticAssetUrl(result.fileUrl),
      };

      onUploadCompleted(uploadedFile);
      toast({
        title: t('seminar_file_uploaded_title'),
        description: t('seminar_file_uploaded_description', { fileName: current.file.name }),
      });
    } catch (error) {
      if (current.task.currentStatus === 'paused' || current.task.currentStatus === 'canceled') {
        return;
      }
      toast({
        variant: 'destructive',
        title: t('seminar_action_failed_title'),
        description: t('seminar_upload_failed'),
      });
    }
  }, [onUploadCompleted, t, toast, uploadItems, uploadedBy]);

  const handleStartUploads = useCallback(() => {
    if (!canStartUploads) {
      toast({
        variant: 'destructive',
        title: t('seminar_no_files_selected_title'),
        description: t('seminar_no_files_selected_description'),
      });
      return;
    }
    uploadItems.forEach((item) => {
      if (
        item.progress.status === 'queued' ||
        item.progress.status === 'paused' ||
        item.progress.status === 'failed'
      ) {
        void runUpload(item.id);
      }
    });
  }, [canStartUploads, runUpload, t, toast, uploadItems]);

  const handlePause = useCallback((itemId: string) => {
    const item = uploadItems.find((it) => it.id === itemId);
    if (!item) return;
    item.task.pause();
  }, [uploadItems]);

  const handleResume = useCallback((itemId: string) => {
    void runUpload(itemId);
  }, [runUpload]);

  const handleCancelUpload = useCallback((itemId: string) => {
    const item = uploadItems.find((it) => it.id === itemId);
    if (!item) return;
    void item.task.cancel();
  }, [uploadItems]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open && isUploading) return;
        onOpenChange(open);
    }}>
        <DialogContent className="sm:max-w-md h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('seminar_share_files_title')}</DialogTitle>
          <DialogDescription>
            {t('seminar_share_files_description')}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="shared-files" className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shared-files">{t('seminar_shared_files_tab')}</TabsTrigger>
            <TabsTrigger value="upload">{t('seminar_upload_new_file_tab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="shared-files" className="mt-4 flex-1">
            <ScrollArea className="h-full">
              {sharedFiles.length > 0 ? (
                <div className="space-y-1 pr-4">
                  {sharedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between rounded-md border p-1.5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className='flex flex-col overflow-hidden'>
                          <span className="text-xs font-medium truncate">{file.name}</span>
                           <span className="text-[10px] text-muted-foreground">
                            {t('seminar_shared_file_meta', {
                              size: formatFileSize(file.size),
                              uploader: file.uploader,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <a href={file.url} download={file.name}>
                          <Button variant="outline" size="icon" className="h-6 w-6">
                              <Download className="h-3 w-3" />
                          </Button>
                        </a>
                        {isOrganizer && (
                          <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => onDelete(file.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <p>{t('seminar_no_shared_files')}</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upload" className="mt-4 flex-1 flex flex-col">
            <div
              {...getRootProps()}
              className={cn(
                "flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors",
                isDragActive && "border-primary bg-primary/10",
                isUploading && "cursor-not-allowed opacity-50"
              )}
            >
              <input {...getInputProps()} />
              <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
              {isDragActive ? (
                <p>{t('seminar_drop_files_here')}</p>
              ) : (
                <p>{t('seminar_drag_drop_or_select')}</p>
              )}
            </div>

            {uploadItems.length > 0 && (
              <div className='mt-4'>
                <h4 className="font-medium text-sm mb-2">{t('seminar_files_to_upload')}</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2 pr-4">
                    {uploadItems.map((item) => (
                       <UploadingFile 
                            key={item.id}
                            file={item.file}
                            progress={item.progress.percentage}
                            status={item.progress.status}
                            errorMessage={item.progress.errorMessage}
                            onPause={() => handlePause(item.id)}
                            onResume={() => handleResume(item.id)}
                            onRetry={() => handleResume(item.id)}
                            onCancel={() => {
                              void handleCancelUpload(item.id);
                            }}
                        />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            
             <div className="flex justify-end pt-4">
                <Button onClick={handleStartUploads} disabled={!canStartUploads}>
                  {isUploading ? t('seminar_uploading') : t('seminar_upload_files')}
                </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

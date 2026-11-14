
'use client';

import { Progress } from '../ui/progress';
import { FileIcon, CheckCircle2, Loader2, Pause, Play, Square, XCircle } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { Button } from '../ui/button';
import type { RoomFileUploadStatus } from '@/services/room-service';

interface UploadingFileProps {
    file: File;
    progress: number;
    status: RoomFileUploadStatus;
    errorMessage?: string;
    onPause?: () => void;
    onResume?: () => void;
    onCancel?: () => void;
    onRetry?: () => void;
}

export function UploadingFile({
    file,
    progress,
    status,
    errorMessage,
    onPause,
    onResume,
    onCancel,
    onRetry,
}: UploadingFileProps) {
    const { t } = useLanguage();
    const isUploading = status === 'uploading' || status === 'finalizing';

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="flex items-center gap-3 p-2 bg-muted rounded-md text-sm">
            <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-grow overflow-hidden">
                <p className="truncate font-medium">{file.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    {isUploading && (
                        <div className="w-20">
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}
                    {status === 'completed' && <span className='text-green-500 font-medium'>{t('seminar_uploaded')}</span>}
                    {status === 'paused' && <span className='text-amber-600 font-medium'>{t('seminar_upload_paused')}</span>}
                    {status === 'queued' && <span className='text-muted-foreground font-medium'>{t('seminar_upload_queued')}</span>}
                    {status === 'canceled' && <span className='text-destructive font-medium'>{t('seminar_upload_canceled')}</span>}
                    {status === 'failed' && <span className='text-destructive font-medium'>{t('seminar_upload_failed')}</span>}
                </div>
                {errorMessage ? <p className="truncate text-[11px] text-destructive mt-0.5">{errorMessage}</p> : null}
            </div>
             <div className="flex items-center gap-1 flex-shrink-0">
                {isUploading && <span className="text-xs tabular-nums">{Math.round(progress)}%</span>}
                {status === 'finalizing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {status === 'failed' && <XCircle className="h-5 w-5 text-destructive" />}

                {status === 'uploading' ? (
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onPause}>
                        <Pause className="h-4 w-4" />
                    </Button>
                ) : null}
                {status === 'paused' ? (
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onResume}>
                        <Play className="h-4 w-4" />
                    </Button>
                ) : null}
                {(status === 'queued' || status === 'failed') ? (
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onRetry}>
                        <Play className="h-4 w-4" />
                    </Button>
                ) : null}
                {(status === 'queued' || status === 'uploading' || status === 'paused' || status === 'failed') ? (
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
                        <Square className="h-4 w-4" />
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

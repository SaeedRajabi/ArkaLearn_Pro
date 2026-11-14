'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@/components/auth-provider';
import { useLanguage } from '@/components/language-provider';
import {
  getRoomsByOwnerId,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoomPermanently,
  getRoomFiles,
  createRoomChunkedUploadTask,
  type RoomChunkedUploadTask,
  type RoomFileUploadProgress,
  type RoomListItem,
  type RoomDetail,
} from '@/services/room-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Copy, Check, Loader2, FolderOpen, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { RoomFormApi, type RoomFormSaveOptions } from './room-form-api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import Link from 'next/link';
import { getRoomFileTypeLabel, getRoomStatusLabel } from '@/lib/utils/localized-ui';

const PAGE_SIZE = 10;

export function RoomsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t,locale } = useLanguage();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetail | null>(null);
  const [roomDetailLoading, setRoomDetailLoading] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filesModalRoomId, setFilesModalRoomId] = useState<number | null>(null);
  const [slugByRoomId, setSlugByRoomId] = useState<Record<number, string>>({});
  const [roomFormKey, setRoomFormKey] = useState(0);
  const loadSeqRef = useRef(0);

  const userId = user?.id ? Number(user.id) : 0;

  const loadRooms = useCallback(async (options?: { cacheBust?: boolean; pageNumber?: number }) => {
    if (!userId) return;
    const seq = ++loadSeqRef.current;
    const page = options?.pageNumber ?? pageNumber;
    setLoading(true);
    try {
      const res = await getRoomsByOwnerId({
        userId,
        pageNumber: page,
        pageSize: PAGE_SIZE,
        cacheBust: options?.cacheBust ?? true,
      });
      if (seq !== loadSeqRef.current) return;
      const list = Array.isArray(res.queryResult) ? res.queryResult : [];
      setRooms(list);
      setTotalCount(res.totalCount ?? list.length);
    } catch (err: unknown) {
      if (seq !== loadSeqRef.current) return;
      const bodyStr =
        axios.isAxiosError(err) && typeof err.response?.data === 'string' ? err.response.data : '';
      const msgStr = err instanceof Error ? err.message : '';
      const isConnRefused =
        (axios.isAxiosError(err) &&
          (err.code === 'ECONNREFUSED' ||
            err.code === 'ERR_NETWORK' ||
            msgStr.includes('ECONNREFUSED') ||
            bodyStr.includes('ECONNREFUSED') ||
            bodyStr.includes('Failed to proxy'))) ||
        (err &&
          typeof err === 'object' &&
          'cause' in err &&
          (err as { cause?: { code?: string } }).cause?.code === 'ECONNREFUSED') ||
        (typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code?: string }).code === 'ECONNREFUSED');
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: isConnRefused ? t('rooms_dashboard_load_failed_econn') : t('rooms_dashboard_load_failed'),
      });
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [pageNumber, t, toast, userId]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const openCreateForm = () => {
    setSelectedRoom(null);
    setIsFormOpen(true);
  };

  const openEditForm = async (room: RoomListItem) => {
    setRoomDetailLoading(true);
    setIsFormOpen(true);
    setSelectedRoom(null);
    try {
      const detail = await getRoomById(room.roomId, { cacheBust: true });
      setSelectedRoom(detail ?? null);
      setRoomFormKey((k) => k + 1);
      if (detail?.slug) setSlugByRoomId((prev) => ({ ...prev, [room.roomId]: detail.slug! }));
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('rooms_dashboard_detail_load_failed'),
      });
    } finally {
      setRoomDetailLoading(false);
    }
  };

  const handleSaveRoom = async (
    data: Parameters<typeof updateRoom>[0] | Parameters<typeof createRoom>[0],
    options?: RoomFormSaveOptions
  ) => {
    if (!userId) return;
    setSaving(true);
    try {
      let savedRoomId = 0;
      if ('roomId' in data && data.roomId) {
        savedRoomId = data.roomId;
        await updateRoom(data);
        toast({
          title: t('toast_settings_saved_title'),
          description: t('rooms_dashboard_updated_success'),
        });
      } else {
        const created = await createRoom(data as Parameters<typeof createRoom>[0]);
        savedRoomId = created.roomId;
        setPageNumber(1);
        toast({
          title: t('toast_settings_saved_title'),
          description: t('rooms_dashboard_created_success'),
        });
        await loadRooms({ cacheBust: true, pageNumber: 1 });
        setIsFormOpen(false);
        setSelectedRoom(null);
        return;
      }
      if (savedRoomId > 0) {
        const fresh = await getRoomById(savedRoomId, { cacheBust: true });
        if (fresh) {
          setSelectedRoom(fresh);
          setRoomFormKey((k) => k + 1);
          if (fresh.slug) setSlugByRoomId((prev) => ({ ...prev, [savedRoomId]: fresh.slug! }));
        }
      }
      setIsFormOpen(false);
      setSelectedRoom(null);
      await loadRooms({ cacheBust: true, pageNumber });
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('rooms_dashboard_save_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (room: RoomListItem) => {
    if (!window.confirm(t('permanent_delete_description').replace('{name}', room.title))) return;
    try {
      await deleteRoomPermanently(room.roomId);
      setRooms((prev) => prev.filter((r) => r.roomId !== room.roomId));
      setTotalCount((c) => Math.max(0, c - 1));
      setSlugByRoomId((prev) => {
        const next = { ...prev };
        delete next[room.roomId];
        return next;
      });
      toast({
        title: t('permanent_delete_success_title'),
        description: t('permanent_delete_success_description').replace('{name}', room.title),
      });
      await loadRooms({ cacheBust: true });
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('permanent_delete_failed'),
      });
    }
  };

  const copyRoomLink = (slug: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/room/${slug}` : '';
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
      toast({
        title: t('toast_settings_saved_title'),
        description: t('rooms_dashboard_link_copied'),
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight">{t('rooms_dashboard_title')}</h1>
          <p className="text-muted-foreground">{t('rooms_dashboard_description')}</p>
        </div>
        <Button onClick={openCreateForm}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('rooms_dashboard_create_button')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('rooms_dashboard_list_title')}</CardTitle>
          <CardDescription>{t('rooms_dashboard_list_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rooms.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t('rooms_dashboard_empty')}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}}>{t('courseTable_col_title')}</TableHead>
                    <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}}>{t('courseTable_col_status')}</TableHead>
                    <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}}>{t('courseTable_col_actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => {
                    const slug = slugByRoomId[room.roomId] ?? room.slug ?? '';
                    const linkSegment = slug || String(room.roomId);
                    return (
                      <TableRow key={room.roomId}>
                        <TableCell className="font-medium">{room.title}</TableCell>
                        <TableCell>{getRoomStatusLabel(room.status, t)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditForm(room)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => void handleDeleteRoom(room)}
                              title={t('actions_delete_permanently')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFilesModalRoomId(room.roomId)}
                              title={t('room_api_room_files_title')}
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => copyRoomLink(linkSegment)}>
                              {copiedSlug === linkSegment ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/rooms/${room.roomId}`}>
                                <FolderOpen className="h-4 w-4 mr-2" />
                                {t('room_details_details_button')}
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/room/${linkSegment}`} target="_blank">
                                {t('rooms_dashboard_open_room_button')}
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pageNumber > 1) setPageNumber((p) => p - 1);
                        }}
                        className={pageNumber <= 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPageNumber(p);
                          }}
                          isActive={pageNumber === p}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pageNumber < totalPages) setPageNumber((p) => p + 1);
                        }}
                        className={pageNumber >= totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setSelectedRoom(null);
            setRoomDetailLoading(false);
            setRoomFormKey((k) => k + 1);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRoom ? t('rooms_dashboard_edit_title') : t('rooms_dashboard_create_title')}
            </DialogTitle>
            <DialogDescription>{t('rooms_dashboard_form_description')}</DialogDescription>
          </DialogHeader>
          {roomDetailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RoomFormApi
              key={`room-form-${selectedRoom?.roomId ?? 'new'}-${roomFormKey}`}
              room={selectedRoom}
              userId={userId}
              onSaveAction={handleSaveRoom}
              onCancelAction={() => setIsFormOpen(false)}
              onRoomDetailUpdatedAction={setSelectedRoom}
            />
          )}
          {saving && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filesModalRoomId != null && (
        <RoomFilesModal
          roomId={filesModalRoomId}
          onClose={() => setFilesModalRoomId(null)}
          onUploadDone={() => void loadRooms({ cacheBust: true })}
        />
      )}
    </div>
  );
}

function RoomFilesModal({
  roomId,
  onClose,
  onUploadDone,
}: {
  roomId: number;
  onClose: () => void;
  onUploadDone: () => void;
}) {
  const { t } = useLanguage();

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('rooms_dashboard_files_modal_title')}</DialogTitle>
          <DialogDescription>{t('rooms_dashboard_files_modal_description')}</DialogDescription>
        </DialogHeader>
        <RoomFilesSection roomId={roomId} onUploadDone={onUploadDone} />
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {t('actions_close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RoomFilesSection({ roomId, onUploadDone }: { roomId: number; onUploadDone: () => void }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [files, setFiles] = useState<Awaited<ReturnType<typeof getRoomFiles>>>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getRoomFiles(roomId);
      setFiles(list);
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('room_api_room_files_load_failed'),
      });
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [roomId, t, toast]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUploadDone = () => {
    loadFiles();
    onUploadDone();
    setShowUploadForm(false);
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t('room_api_files_loading')}</p>;

  if (showUploadForm) {
    return (
      <NewRoomFileUploadForm
        roomId={roomId}
        onClose={() => setShowUploadForm(false)}
        onUploadDone={handleUploadDone}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowUploadForm(true)}>{t('room_api_add_file_button')}</Button>
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('room_api_room_files_empty')}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between rounded border p-2">
              <span>{file.fileName}</span>
              <span className="text-muted-foreground">
                {getRoomFileTypeLabel(file.fileType, t)} • {(file.fileSize / 1024).toFixed(1)} KB
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewRoomFileUploadForm({
  roomId,
  onClose,
  onUploadDone,
}: {
  roomId: number;
  onClose: () => void;
  onUploadDone: () => void;
}) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [fileType, setFileType] = useState<1 | 2 | 3>(3);
  const [file, setFile] = useState<File | null>(null);
  const [uploadTask, setUploadTask] = useState<RoomChunkedUploadTask | null>(null);
  const [uploadProgress, setUploadProgress] = useState<RoomFileUploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const acceptedByType: Record<number, string> = {
    1: 'ogv, ogg, webm, mp4',
    2: 'mp3, wav, ogg, oga',
    3: 'jpg, jpeg, png, gif, pdf, ppt, pptx, doc, docx, txt, zip, html, htm, odt, odp, rtf, wps, docm, dot, dotx',
  };
  const accept =
    fileType === 1
      ? '.ogv,.ogg,.webm,.mp4'
      : fileType === 2
        ? '.mp3,.wav,.ogg,.oga'
        : '.jpg,.jpeg,.png,.gif,.pdf,.ppt,.pptx,.doc,.docx,.txt,.zip,.html,.htm,.odt,.odp,.rtf,.wps,.docm,.dot,.dotx';
  const maxSize = 50 * 1024 * 1024;
  const isUploading = uploadProgress?.status === 'uploading' || uploadProgress?.status === 'finalizing';
  const isPaused = uploadProgress?.status === 'paused';

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;
    if (nextFile.size > maxSize) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('room_api_upload_too_large'),
      });
      return;
    }
    setFile(nextFile);
    setUploadTask(null);
    setUploadProgress(null);
    setUploadError(null);
  };

  const ensureTask = (): RoomChunkedUploadTask | null => {
    if (uploadTask) return uploadTask;
    if (!file) return null;
    const task = createRoomChunkedUploadTask(roomId, fileType, file, {
      chunkSizeBytes: 2 * 1024 * 1024,
      parallelChunks: 4,
      onProgress: setUploadProgress,
    });
    setUploadTask(task);
    setUploadProgress(task.progress);
    return task;
  };

  const handleUpload = async () => {
    const task = ensureTask();
    if (!task || !file) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('room_api_upload_choose_file'),
      });
      return;
    }
    try {
      setUploadError(null);
      await task.start();
      toast({
        title: t('toast_settings_saved_title'),
        description: t('room_api_upload_success'),
      });
      setFile(null);
      setUploadTask(null);
      setUploadProgress(null);
      onUploadDone();
    } catch {
      if (task.currentStatus === 'paused' || task.currentStatus === 'canceled') return;
      setUploadError(t('room_api_upload_failed'));
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('room_api_upload_failed'),
      });
    }
  };

  const handlePause = () => uploadTask?.pause();

  const handleResume = async () => {
    if (!uploadTask) return;
    try {
      await uploadTask.resume();
      toast({
        title: t('toast_settings_saved_title'),
        description: t('room_api_upload_success'),
      });
      setUploadTask(null);
      setUploadProgress(null);
      setFile(null);
      onUploadDone();
    } catch {
      if (uploadTask.currentStatus === 'paused' || uploadTask.currentStatus === 'canceled') return;
      setUploadError(t('room_api_upload_failed'));
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('room_api_upload_failed'),
      });
    }
  };

  const handleCancelUpload = async () => {
    if (!uploadTask) return;
    await uploadTask.cancel();
    setUploadTask(null);
    setUploadProgress(null);
    setUploadError(null);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="font-medium">{t('room_api_upload_title')}</p>
      <p className="text-sm text-muted-foreground">{t('room_api_upload_select_type')}</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { type: 1 as const, icon: 'V' },
          { type: 2 as const, icon: 'A' },
          { type: 3 as const, icon: 'S' },
        ].map(({ type, icon }) => (
          <Button
            key={type}
            type="button"
            variant={fileType === type ? 'default' : 'outline'}
            className="flex h-auto flex-col gap-1 py-4"
            onClick={() => setFileType(type)}
          >
            <span className="text-xl">{icon}</span>
            <span>{getRoomFileTypeLabel(type, t)}</span>
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{t('room_api_upload_allowed_formats')}</p>
      <p className="text-xs text-red-600">{acceptedByType[fileType]}</p>
      <div className="flex flex-col gap-2">
        <input type="file" accept={accept} onChange={handleSelectFile} className="text-sm" />
        {file && <span className="text-sm">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>}
      </div>
      {uploadProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {uploadProgress.status === 'paused'
                ? t('seminar_upload_paused')
                : uploadProgress.status === 'uploading' || uploadProgress.status === 'finalizing'
                  ? t('seminar_uploading')
                  : uploadProgress.status === 'completed'
                    ? t('seminar_uploaded')
                    : uploadProgress.status === 'canceled'
                      ? t('seminar_upload_canceled')
                      : uploadProgress.status === 'failed'
                        ? t('seminar_upload_failed')
                        : t('seminar_upload_queued')}
            </span>
            <span>{uploadProgress.percentage}%</span>
          </div>
          <Progress value={uploadProgress.percentage} />
          {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t('actions_cancel')}
        </Button>
        {isUploading ? (
          <Button variant="outline" onClick={handlePause}>
            {t('seminar_upload_pause_action')}
          </Button>
        ) : null}
        {isPaused ? (
          <Button variant="outline" onClick={() => void handleResume()}>
            {t('seminar_upload_resume_action')}
          </Button>
        ) : null}
        {uploadTask ? (
          <Button variant="destructive" onClick={() => void handleCancelUpload()}>
            {t('seminar_upload_cancel_action')}
          </Button>
        ) : null}
        <Button onClick={() => void handleUpload()} disabled={!file || isUploading}>
          {isUploading ? t('room_api_uploading') : t('room_api_upload_button')}
        </Button>
      </div>
    </div>
  );
}

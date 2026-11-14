'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/components/language-provider';
import type { RoomDetail, RoomFileItem, RoomManagedSeatSummary } from '@/services/room-service';
import {
  getRoomFiles,
  getRoomById,
  createRoomChunkedUploadTask,
  type RoomChunkedUploadTask,
  type RoomFileUploadProgress,
  setRoomUserBlocked,
  assignManagedStudentsToRoom,
  type CreateRoomPayload,
  type UpdateRoomPayload,
  RoomFileType,
} from '@/services/room-service';
import { searchManagedRoomStudents, deleteManagedRoomStudent, type ManagedRoomStudentRow } from '@/services/managed-room-students-service';
import { Checkbox } from '@/components/ui/checkbox';
import { getRoomFileTypeLabel } from '@/lib/utils/localized-ui';
import { Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
import { AddManagedRoomStudentModal } from '@/app/dashboard/students/components/add-managed-room-student-modal';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { cn } from '@/lib/utils';

const NONE_SELECT_VALUE = '__none__';

export type RoomFormSaveOptions = { managedStudentIds?: number[] };

type RoomFormApiProps = {
  room?: RoomDetail | null;
  userId: number;
  onSaveAction: (data: CreateRoomPayload | UpdateRoomPayload, options?: RoomFormSaveOptions) => void;
  onCancelAction: () => void;
  /** Keeps parent room detail in sync after live assignment updates (edit mode). */
  onRoomDetailUpdatedAction?: (detail: RoomDetail) => void;
};

const defaultBaseUrl =
  typeof window !== 'undefined' ? window.location.origin : 'https://admin-dashboard.arkasoftware.ir';

export function RoomFormApi({
  room,
  userId,
  onSaveAction,
  onCancelAction,
  onRoomDetailUpdatedAction,
}: RoomFormApiProps) {
  const onSave = onSaveAction;
  const onCancel = onCancelAction;
  const [files, setFiles] = useState<RoomFileItem[]>([]);
  const [catalogStudents, setCatalogStudents] = useState<ManagedRoomStudentRow[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<ManagedRoomStudentRow | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<ManagedRoomStudentRow | null>(null);
  const [deleteStudentBusy, setDeleteStudentBusy] = useState(false);
  const [seatSummaries, setSeatSummaries] = useState<RoomManagedSeatSummary[]>([]);
  const [studentSeatFilter, setStudentSeatFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [seatToggleBusyId, setSeatToggleBusyId] = useState<number | null>(null);
  const [assignBusy, setAssignBusy] = useState(false);
  const isEdit = !!room?.roomId;

  const assignedManagedStudentIdsKey = useMemo(
    () => (room?.assignedManagedRoomStudentIds ?? []).join(','),
    [room?.assignedManagedRoomStudentIds]
  );
  const { t } = useLanguage();
  const { toast } = useToast();

  const loadCatalogStudents = useCallback(() => {
    return searchManagedRoomStudents({ pageNumber: 1, pageSize: 200, inputValue: '' })
      .then((r) => {
        setCatalogStudents(r.list);
      })
      .catch(() => {
        setCatalogStudents([]);
      });
  }, []);

  const formSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, { message: t('room_api_title_required') }),
        slug: z
          .string()
          .min(1, { message: t('room_api_slug_required') })
          .regex(/^[a-z0-9-]+$/i, { message: t('room_api_slug_invalid') }),
        baseUrl: z.string().url().optional().or(z.literal('')),
        roomCapacity: z.coerce.number().min(1).max(500),
        isGuest: z.boolean(),
        guestQuantity: z.coerce.number().min(0).max(200),
        teacherEntersFirst: z.boolean(),
        maxSessionTime: z.coerce.number().min(1).max(480),
        status: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        defaultMediaFileId: z.string().optional(),
        defaultSlideFileId: z.string().optional(),
      }),
    [t]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: room?.title ?? '',
      slug: room?.slug ?? '',
      baseUrl: defaultBaseUrl,
      roomCapacity: room?.capacity ?? 50,
      isGuest: room?.isGuest ?? false,
      guestQuantity: room?.guestQuantity ?? 10,
      teacherEntersFirst: room?.teacherEntersFirst ?? false,
      maxSessionTime: room?.maxSessionTime ?? 60,
      status: (room?.status ?? 1) as 1 | 2 | 3,
      defaultMediaFileId: room?.defaultMediaFileId != null ? String(room.defaultMediaFileId) : '',
      defaultSlideFileId: room?.defaultSlideFileId != null ? String(room.defaultSlideFileId) : '',
    },
  });

  useEffect(() => {
    if (room?.roomId) {
      form.reset({
        title: room.title ?? '',
        slug: room.slug ?? '',
        baseUrl: defaultBaseUrl,
        roomCapacity: room.capacity,
        isGuest: room.isGuest,
        guestQuantity: room.guestQuantity,
        teacherEntersFirst: room.teacherEntersFirst ?? false,
        maxSessionTime: room.maxSessionTime,
        status: room.status as 1 | 2 | 3,
        defaultMediaFileId: room.defaultMediaFileId != null ? String(room.defaultMediaFileId) : '',
        defaultSlideFileId: room.defaultSlideFileId != null ? String(room.defaultSlideFileId) : '',
      });
      getRoomFiles(room.roomId).then(setFiles);
    } else {
      setFiles([]);
    }
  }, [form, room?.defaultMediaFileId, room?.defaultSlideFileId, room?.guestQuantity, room?.isGuest, room?.maxSessionTime, room?.roomId, room?.slug, room?.status, room?.title, room?.capacity, room?.teacherEntersFirst]);

  const allowGuests = form.watch('isGuest');

  useEffect(() => {
    void loadCatalogStudents();
  }, [loadCatalogStudents]);

  useEffect(() => {
    const ids = room?.assignedManagedRoomStudentIds ?? [];
    setSelectedStudentIds(ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n)));
  }, [room?.roomId, assignedManagedStudentIdsKey]);

  const syncRoomAssignmentsFromServer = useCallback(
    async (roomId: number, fallbackIds: number[]) => {
      const detail = await getRoomById(roomId, { cacheBust: true });
      if (!detail) {
        setSelectedStudentIds(fallbackIds);
        return;
      }
      const ids = (detail.assignedManagedRoomStudentIds ?? [])
        .map((x) => Number(x))
        .filter((n) => !Number.isNaN(n));
      setSelectedStudentIds(ids);
      setSeatSummaries((detail.managedSeatSummaries ?? []).map((x) => ({ ...x })));
      onRoomDetailUpdatedAction?.(detail);
    },
    [onRoomDetailUpdatedAction]
  );

  useEffect(() => {
    if (!room?.roomId) {
      setSeatSummaries([]);
      return;
    }
    const src = room.managedSeatSummaries ?? [];
    setSeatSummaries(src.map((x) => ({ ...x })));
  }, [room?.roomId, room?.managedSeatSummaries]);

  const getSeatForCatalogStudent = useCallback((managedStudentId: number) => {
    return seatSummaries.find((x) => x.managedRoomStudentId === managedStudentId) ?? null;
  }, [seatSummaries]);

  const catalogStudentsFiltered = useMemo(() => {
    return catalogStudents.filter((s) => {
      if (studentSeatFilter === 'all') return true;
      const assigned = selectedStudentIds.includes(s.id);
      if (!assigned) return false;
      const seat = seatSummaries.find((x) => x.managedRoomStudentId === s.id);
      const blocked = seat?.isBlocked === true;
      if (studentSeatFilter === 'active') return !blocked;
      return blocked;
    });
  }, [catalogStudents, studentSeatFilter, selectedStudentIds, seatSummaries]);

  const onToggleSeatBlocked = useCallback(
    async (managedStudentId: number, nextBlocked: boolean) => {
      if (!room?.roomId) return;
      const seat = seatSummaries.find((x) => x.managedRoomStudentId === managedStudentId);
      if (!seat) return;
      setSeatToggleBusyId(managedStudentId);
      try {
        await setRoomUserBlocked(room.roomId, seat.roomUserId, nextBlocked);
        setSeatSummaries((prev) =>
          prev.map((x) =>
            x.managedRoomStudentId === managedStudentId ? { ...x, isBlocked: nextBlocked } : x
          )
        );
        toast({
          title: t('toast_settings_saved_title'),
          description: t('room_api_seat_block_updated'),
        });
      } catch {
        toast({
          variant: 'destructive',
          title: t('validation_error_title'),
          description: t('room_api_seat_block_failed'),
        });
      } finally {
        setSeatToggleBusyId(null);
      }
    },
    [room?.roomId, seatSummaries, t, toast]
  );

  async function toggleStudent(id: number) {
    const previous = selectedStudentIds;
    const next = previous.includes(id) ? previous.filter((x) => x !== id) : [...previous, id];
    setSelectedStudentIds(next);

    if (!isEdit || !room?.roomId) return;

    setAssignBusy(true);
    try {
      await assignManagedStudentsToRoom(room.roomId, next);
      await syncRoomAssignmentsFromServer(room.roomId, next);
    } catch {
      setSelectedStudentIds(previous);
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('rooms_dashboard_save_failed'),
      });
    } finally {
      setAssignBusy(false);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const baseUrl = values.baseUrl || defaultBaseUrl;
    if (isEdit && room) {
      const payload: UpdateRoomPayload = {
        roomId: room.roomId,
        title: values.title,
        slug: values.slug,
        baseUrl,
        roomCapacity: values.roomCapacity,
        isGuest: values.isGuest,
        guestQuantity: values.guestQuantity,
        status: values.status,
        maxSessionTime: values.maxSessionTime,
        defaultMediaFileId: values.defaultMediaFileId ? Number(values.defaultMediaFileId) : null,
        defaultSlideFileId: values.defaultSlideFileId ? Number(values.defaultSlideFileId) : null,
        teacherEntersFirst: values.teacherEntersFirst,
      };
      onSave(payload);
      return;
    }

    const payload: CreateRoomPayload = {
      title: values.title,
      slug: values.slug.toLowerCase().replace(/\s+/g, '-'),
      baseUrl,
      roomCapacity: values.roomCapacity,
      isGuest: values.isGuest,
      guestQuantity: values.guestQuantity,
      firstAdminInput: false,
      teacherEntersFirst: values.teacherEntersFirst,
      status: values.status,
      maxSessionTime: values.maxSessionTime,
      userId,
    };
    onSave(payload);
  }

  const videoFiles = files.filter((f) => f.fileType === RoomFileType.Video);
  const audioFiles = files.filter((f) => f.fileType === RoomFileType.Audio);
  const slideFiles = files.filter((f) => f.fileType === RoomFileType.Slide);
  const mediaOptions = [...videoFiles, ...audioFiles];

  return (
    <>
      <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(onSubmit)(e);
        }}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('room_api_title_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('room_api_title_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('room_api_slug_label')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('room_api_slug_placeholder')}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                />
              </FormControl>
              <FormDescription>
                {t('room_api_slug_description', { slug: field.value || '...' })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="baseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('room_api_base_url_label')}</FormLabel>
              <FormControl>
                <Input placeholder={defaultBaseUrl} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roomCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('room_api_capacity_label')}</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={500} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxSessionTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('room_api_session_time_label')}</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={480} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('room_api_status_label')}</FormLabel>
              <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">{t('room_api_status_active')}</SelectItem>
                  <SelectItem value="2">{t('room_api_status_inactive')}</SelectItem>
                  <SelectItem value="3">{t('room_api_status_suspended')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isGuest"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t('room_api_guest_access_label')}</FormLabel>
                <FormDescription>{t('room_api_guest_access_description')}</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teacherEntersFirst"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t('room_api_teacher_enters_first_label')}</FormLabel>
                <FormDescription>{t('room_api_teacher_enters_first_description')}</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {allowGuests && (
          <FormField
            control={form.control}
            name="guestQuantity"
            render={({ field }) => (
              <FormItem className="rounded-lg border p-4">
                <FormLabel>{t('room_api_guest_quantity_label', { value: field.value ?? 10 })}</FormLabel>
                <FormControl>
                  <Slider
                    value={[field.value ?? 10]}
                    onValueChange={(vals) => field.onChange(vals[0])}
                    min={1}
                    max={200}
                    step={1}
                    className="mt-2"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        {!isEdit && (
          <p className="rounded-lg border p-3 text-sm text-muted-foreground">
            {t('room_api_create_files_hint')}
          </p>
        )}
        {isEdit && room && (
          <>
            <RoomFilesSectionInline
              roomId={room.roomId}
              onUploadDone={() => getRoomFiles(room.roomId).then(setFiles)}
            />
            <FormField
              control={form.control}
              name="defaultMediaFileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('room_api_default_media_label')}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === NONE_SELECT_VALUE ? '' : value)}
                    value={field.value || NONE_SELECT_VALUE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('room_api_none_select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_SELECT_VALUE}>{t('room_api_none_select')}</SelectItem>
                      {mediaOptions.map((file) => (
                        <SelectItem key={file.id} value={String(file.id)}>
                          {file.fileName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultSlideFileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('room_api_default_slide_label')}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === NONE_SELECT_VALUE ? '' : value)}
                    value={field.value || NONE_SELECT_VALUE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('room_api_none_select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_SELECT_VALUE}>{t('room_api_none_select')}</SelectItem>
                      {slideFiles.map((file) => (
                        <SelectItem key={file.id} value={String(file.id)}>
                          {file.fileName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        {!isEdit ? (
          <p className="rounded-lg border p-3 text-sm text-muted-foreground">
            {t('room_api_assign_students_moved_hint')}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('actions_cancel')}
          </Button>
          <Button type="submit">{isEdit ? t('save_changes') : t('room_api_create_button')}</Button>
        </div>
      </form>
      </Form>

      <AddManagedRoomStudentModal
        open={studentModalOpen}
        studentToEdit={studentToEdit}
        onOpenChangeAction={(o) => {
          setStudentModalOpen(o);
          if (!o) setStudentToEdit(null);
        }}
        onCreatedAction={(createdId) => {
          void loadCatalogStudents().then(() => {
            if (createdId != null && createdId > 0) {
              void toggleStudent(createdId);
            }
          });
        }}
      />

      <AlertDialog
        open={!!studentToDelete}
        onOpenChange={(o) => {
          if (!o) setStudentToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('room_students_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {studentToDelete
                ? t('room_students_delete_description', {
                    name: `${studentToDelete.firstName} ${studentToDelete.lastName} (${studentToDelete.userName})`,
                  })
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStudentBusy}>{t('actions_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteStudentBusy}
              className={cn(buttonVariants({ variant: 'destructive' }))}
              onClick={(ev) => {
                ev.preventDefault();
                const target = studentToDelete;
                if (!target) return;
                setDeleteStudentBusy(true);
                void deleteManagedRoomStudent(target.id)
                  .then(() => {
                    toast({
                      title: t('toast_settings_saved_title'),
                      description: t('room_students_deleted'),
                    });
                    const removedId = target.id;
                    setStudentToDelete(null);
                    setSelectedStudentIds((prev) => prev.filter((x) => x !== removedId));
                    void loadCatalogStudents();
                  })
                  .catch(() => {
                    toast({
                      variant: 'destructive',
                      title: t('validation_error_title'),
                      description: t('room_students_delete_failed'),
                    });
                  })
                  .finally(() => setDeleteStudentBusy(false));
              }}
            >
              {deleteStudentBusy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {t('actions_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SeatStatusIcon({ blocked }: { blocked: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-full border-2',
        blocked
          ? 'border-red-600 bg-red-50 text-red-600'
          : 'border-emerald-600 bg-emerald-50 text-emerald-700'
      )}
    >
      {blocked ? (
        <X className="h-3 w-3 shrink-0" strokeWidth={2.75} aria-hidden />
      ) : (
        <Check className="h-3 w-3 shrink-0" strokeWidth={2.75} aria-hidden />
      )}
    </span>
  );
}

function RoomFilesSectionInline({
  roomId,
  onUploadDone,
}: {
  roomId: number;
  onUploadDone: () => void;
}) {
  const [files, setFiles] = useState<RoomFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getRoomFiles(roomId)
      .then((list) => {
        if (!isMounted) return;
        setFiles(list);
      })
      .catch(() => {
        if (!isMounted) return;
        toast({
          variant: 'destructive',
          title: t('validation_error_title'),
          description: t('room_api_room_files_load_failed'),
        });
        setFiles([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [roomId, t, toast]);

  const handleUploadDone = () => {
    getRoomFiles(roomId).then(setFiles).catch(() => setFiles([]));
    onUploadDone();
    setShowUpload(false);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('room_api_files_loading')}</p>;
  }

  if (showUpload) {
    return (
      <RoomFileUploadInline
        roomId={roomId}
        onClose={() => setShowUpload(false)}
        onUploadDone={handleUploadDone}
      />
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('room_api_room_files_title')}</span>
        <Button type="button" size="sm" onClick={() => setShowUpload(true)}>
          {t('room_api_add_file_button')}
        </Button>
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('room_api_room_files_empty')}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {files.map((file) => (
            <li key={file.id} className="flex justify-between rounded border p-2">
              <span>{file.fileName}</span>
              <span className="text-muted-foreground">
                {getRoomFileTypeLabel(file.fileType, t)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoomFileUploadInline({
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
  const accept =
    fileType === 1
      ? '.ogv,.ogg,.webm,.mp4'
      : fileType === 2
        ? '.mp3,.wav,.ogg,.oga'
        : '.jpg,.jpeg,.png,.gif,.pdf,.ppt,.pptx,.doc,.docx,.txt,.zip,.html,.htm,.odt,.odp,.rtf,.wps,.docm,.dot,.dotx';
  const maxSize = 50 * 1024 * 1024;
  const isUploading = uploadProgress?.status === 'uploading' || uploadProgress?.status === 'finalizing';
  const isPaused = uploadProgress?.status === 'paused';

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadTask(null);
      setUploadProgress(null);
      setFile(null);
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
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">{t('room_api_upload_title')}</p>
      <p className="text-xs text-muted-foreground">{t('room_api_upload_select_type')}</p>
      <div className="flex gap-2">
        {[RoomFileType.Video, RoomFileType.Audio, RoomFileType.Slide].map((type) => (
          <Button
            key={type}
            type="button"
            variant={fileType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFileType(type)}
          >
            {getRoomFileTypeLabel(type, t)}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t('room_api_upload_allowed_formats')}</p>
      <p className="text-xs text-red-600">{accept}</p>
      <input type="file" accept={accept} onChange={handleSelect} className="text-sm" />
      {file && <span className="block text-sm">{file.name}</span>}
      {uploadProgress ? (
        <div className="space-y-1">
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
      ) : null}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          {t('actions_cancel')}
        </Button>
        {isUploading ? (
          <Button type="button" variant="outline" size="sm" onClick={handlePause}>
            {t('seminar_upload_pause_action')}
          </Button>
        ) : null}
        {isPaused ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void handleResume()}>
            {t('seminar_upload_resume_action')}
          </Button>
        ) : null}
        {uploadTask ? (
          <Button type="button" variant="destructive" size="sm" onClick={() => void handleCancelUpload()}>
            {t('seminar_upload_cancel_action')}
          </Button>
        ) : null}
        <Button type="button" size="sm" onClick={() => void handleUpload()} disabled={!file || isUploading}>
          {isUploading ? t('room_api_uploading') : t('room_api_upload_button')}
        </Button>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CircleOff, FileVideo, Loader2, Presentation, Settings, UserPlus, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { IconSelectPicker } from '@/components/shared/icon-select-picker';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  assignManagedStudentsToRoom,
  getProfessorRoomById,
  getProfessorRoomFileDisplayTitle,
  getProfessorRoomFiles,
  openProfessorRoom,
  ProfessorRoomFileType,
  updateProfessorRoom,
  type ProfessorRoomDetail,
} from '@/lib/api/professor-rooms';
import { searchMyManagedRoomStudents, type ManagedRoomStudent } from '@/lib/api/professor-managed-students';
import { ProfessorRoomFormDialog } from '@/components/professor/online-rooms/professor-room-form-dialog';
import { ProfessorRoomFilesPanel } from '@/components/professor/online-rooms/professor-room-files-panel';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type Props = { dict: Dictionary };

const NONE = '__none__';

function statusLabel(status: number, isRtl: boolean) {
  if (status === 1) return isRtl ? 'فعال' : 'Active';
  if (status === 2) return isRtl ? 'غیرفعال' : 'Inactive';
  if (status === 3) return isRtl ? 'معلق' : 'Suspended';
  return String(status);
}

export function ProfessorRoomDetailPageClient({ dict }: Props) {
  const params = useParams();
  const { toast } = useToast();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);

  const roomId = Number(params?.id);
  const [room, setRoom] = React.useState<ProfessorRoomDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [entering, setEntering] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [students, setStudents] = React.useState<ManagedRoomStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<number[]>([]);
  const [assigning, setAssigning] = React.useState(false);
  const [mediaOptions, setMediaOptions] = React.useState<{ id: number; name: string }[]>([]);
  const [slideOptions, setSlideOptions] = React.useState<{ id: number; name: string }[]>([]);
  const [defaultMediaId, setDefaultMediaId] = React.useState(NONE);
  const [defaultSlideId, setDefaultSlideId] = React.useState(NONE);
  const [savingDefaults, setSavingDefaults] = React.useState(false);

  const applyFileOptions = React.useCallback(
    (files: Awaited<ReturnType<typeof getProfessorRoomFiles>>, detail: ProfessorRoomDetail | null) => {
      if (detail) {
        setSelectedStudentIds(detail.assignedManagedRoomStudentIds ?? []);
        setDefaultMediaId(() => {
          const next =
            detail.defaultMediaFileId != null ? String(detail.defaultMediaFileId) : NONE;
          if (next === NONE) return NONE;
          const media = files.filter(
            (f) => f.fileType === ProfessorRoomFileType.Video || f.fileType === ProfessorRoomFileType.Audio
          );
          return media.some((f) => String(f.id) === next) ? next : NONE;
        });
        setDefaultSlideId(() => {
          const next =
            detail.defaultSlideFileId != null ? String(detail.defaultSlideFileId) : NONE;
          if (next === NONE) return NONE;
          const slides = files.filter((f) => f.fileType === ProfessorRoomFileType.Slide);
          return slides.some((f) => String(f.id) === next) ? next : NONE;
        });
      }

      const media = files.filter(
        (f) => f.fileType === ProfessorRoomFileType.Video || f.fileType === ProfessorRoomFileType.Audio
      );
      const slides = files.filter((f) => f.fileType === ProfessorRoomFileType.Slide);
      setMediaOptions(media.map((f) => ({ id: f.id, name: getProfessorRoomFileDisplayTitle(f) })));
      setSlideOptions(slides.map((f) => ({ id: f.id, name: getProfessorRoomFileDisplayTitle(f) })));
    },
    []
  );

  const load = React.useCallback(async () => {
    if (!roomId || Number.isNaN(roomId)) {
      setRoom(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [detail, files] = await Promise.all([
        getProfessorRoomById(roomId),
        getProfessorRoomFiles(roomId),
      ]);
      setRoom(detail);
      applyFileOptions(files, detail);
    } catch {
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }, [applyFileOptions, roomId]);

  const refreshFileOptions = React.useCallback(async () => {
    if (!roomId || Number.isNaN(roomId)) return;
    try {
      const files = await getProfessorRoomFiles(roomId);
      applyFileOptions(files, room);
    } catch {
      // keep current options on silent refresh failure
    }
  }, [applyFileOptions, room, roomId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const noneLabel = t('professorDashboard.onlineRooms.none', isRtl ? 'بدون انتخاب' : 'None');

  const defaultMediaOptions = React.useMemo(
    () => [
      { value: NONE, label: noneLabel, icon: CircleOff },
      ...mediaOptions.map((o) => ({ value: String(o.id), label: o.name, icon: FileVideo })),
    ],
    [mediaOptions, noneLabel]
  );

  const defaultSlideOptions = React.useMemo(
    () => [
      { value: NONE, label: noneLabel, icon: CircleOff },
      ...slideOptions.map((o) => ({ value: String(o.id), label: o.name, icon: Presentation })),
    ],
    [slideOptions, noneLabel]
  );

  const openAssign = async () => {
    setAssignOpen(true);
    try {
      const res = await searchMyManagedRoomStudents({ pageSize: 200 });
      setStudents(res.list);
    } catch {
      setStudents([]);
    }
  };

  const saveAssignments = async () => {
    if (!room) return;
    setAssigning(true);
    try {
      await assignManagedStudentsToRoom(room.roomId, selectedStudentIds);
      toast({
        title: t('professorDashboard.onlineRooms.assignSuccess', isRtl ? 'دانشجویان اختصاص داده شدند' : 'Students assigned'),
      });
      setAssignOpen(false);
      void load();
    } catch (error) {
      toast({
        title: t('professorDashboard.onlineRooms.assignFailed', isRtl ? 'اختصاص انجام نشد' : 'Assignment failed'),
        description: getApiErrorMessage(error, ''),
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const saveDefaultFiles = async () => {
    if (!room) return;
    setSavingDefaults(true);
    try {
      await updateProfessorRoom({
        roomId: room.roomId,
        defaultMediaFileId: defaultMediaId === NONE ? null : Number(defaultMediaId),
        defaultSlideFileId: defaultSlideId === NONE ? null : Number(defaultSlideId),
      });
      toast({
        title: t('professorDashboard.onlineRooms.defaultsSaved', isRtl ? 'پیش‌فرض‌ها ذخیره شد' : 'Defaults saved'),
      });
      void load();
    } catch (error) {
      toast({
        title: t('professorDashboard.onlineRooms.defaultsFailed', isRtl ? 'ذخیره انجام نشد' : 'Save failed'),
        description: getApiErrorMessage(error, ''),
        variant: 'destructive',
      });
    } finally {
      setSavingDefaults(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          {t('professorDashboard.onlineRooms.notFound', isRtl ? 'اتاق یافت نشد.' : 'Room not found.')}
        </p>
        <Button asChild variant="outline">
          <Link href="/professor/online-rooms">
            {t('professorDashboard.educationPlans.backToList', isRtl ? 'بازگشت' : 'Back')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', isRtl && 'text-right')} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/professor/online-rooms">
            <ArrowLeft className={cn('h-4 w-4', isRtl && 'rotate-180')} />
            {t('professorDashboard.educationPlans.backToList', isRtl ? 'بازگشت' : 'Back')}
          </Link>
        </Button>
        <Badge variant="outline">{statusLabel(room.status, isRtl)}</Badge>
        {room.slug ? <Badge variant="secondary">{room.slug}</Badge> : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{room.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('professorDashboard.onlineRooms.capacity', isRtl ? 'ظرفیت' : 'Capacity')}: {room.capacity} ·{' '}
            {t('professorDashboard.onlineRooms.sessionTime', isRtl ? 'مدت جلسه' : 'Session')}: {room.maxSessionTime}{' '}
            {isRtl ? 'دقیقه' : 'min'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={entering}
            onClick={() => {
              setEntering(true);
              void openProfessorRoom({
                roomId: room.roomId,
                slug: room.slug,
                classRoomLink: room.classRoomLink,
              })
                .catch((error) =>
                  toast({
                    title: t('professorDashboard.educationPlans.enterRoomFailed', isRtl ? 'ورود انجام نشد' : 'Enter failed'),
                    description: getApiErrorMessage(error, ''),
                    variant: 'destructive',
                  })
                )
                .finally(() => setEntering(false));
            }}
          >
            {entering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            {t('professorDashboard.educationPlans.enterRoom', isRtl ? 'ورود به اتاق' : 'Enter room')}
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Settings className="h-4 w-4" />
            {t('professorDashboard.onlineRooms.editRoom', isRtl ? 'ویرایش' : 'Edit')}
          </Button>
          <Button variant="outline" onClick={() => void openAssign()}>
            <UserPlus className="h-4 w-4" />
            {t('professorDashboard.onlineRooms.assignStudents', isRtl ? 'اختصاص دانشجو' : 'Assign students')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="files">
            {t('professorDashboard.onlineRooms.filesTab', isRtl ? 'فایل‌ها' : 'Files')}
          </TabsTrigger>
          <TabsTrigger value="settings">
            {t('professorDashboard.onlineRooms.settingsTab', isRtl ? 'تنظیمات پیش‌فرض' : 'Defaults')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files">
          <ProfessorRoomFilesPanel
            dict={dict}
            roomId={room.roomId}
            onFilesChanged={() => void refreshFileOptions()}
          />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>
                {t('professorDashboard.onlineRooms.defaultMediaTitle', isRtl ? 'رسانه و اسلاید پیش‌فرض' : 'Default media & slide')}
              </CardTitle>
              <CardDescription>
                {t(
                  'professorDashboard.onlineRooms.defaultMediaHint',
                  isRtl
                    ? 'فایل‌هایی که هنگام شروع جلسه به‌صورت خودکار بارگذاری می‌شوند.'
                    : 'Files loaded automatically when a session starts.'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('professorDashboard.onlineRooms.defaultMedia', isRtl ? 'رسانه پیش‌فرض' : 'Default media')}</Label>
                <IconSelectPicker
                  value={defaultMediaId}
                  onChange={setDefaultMediaId}
                  options={defaultMediaOptions}
                  isRtl={isRtl}
                  placeholder={noneLabel}
                  ariaLabel={t('professorDashboard.onlineRooms.defaultMedia', isRtl ? 'رسانه پیش‌فرض' : 'Default media')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('professorDashboard.onlineRooms.defaultSlide', isRtl ? 'اسلاید پیش‌فرض' : 'Default slide')}</Label>
                <IconSelectPicker
                  value={defaultSlideId}
                  onChange={setDefaultSlideId}
                  options={defaultSlideOptions}
                  isRtl={isRtl}
                  placeholder={noneLabel}
                  ariaLabel={t('professorDashboard.onlineRooms.defaultSlide', isRtl ? 'اسلاید پیش‌فرض' : 'Default slide')}
                />
              </div>
              <Button disabled={savingDefaults} onClick={() => void saveDefaultFiles()}>
                {savingDefaults ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('professorDashboard.educationPlans.save', isRtl ? 'ذخیره' : 'Save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProfessorRoomFormDialog
        dict={dict}
        open={editOpen}
        onOpenChange={setEditOpen}
        room={room}
        onSaved={() => void load()}
      />

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('professorDashboard.onlineRooms.assignStudents', isRtl ? 'اختصاص دانشجو' : 'Assign students')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {students.map((s) => {
              const checked = selectedStudentIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/40"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => {
                      setSelectedStudentIds((prev) =>
                        value ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                      );
                    }}
                  />
                  <div>
                    <p className="font-medium">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.userName}</p>
                  </div>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              {t('professorDashboard.educationPlans.cancel', isRtl ? 'انصراف' : 'Cancel')}
            </Button>
            <Button disabled={assigning} onClick={() => void saveAssignments()}>
              {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('professorDashboard.educationPlans.save', isRtl ? 'ذخیره' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

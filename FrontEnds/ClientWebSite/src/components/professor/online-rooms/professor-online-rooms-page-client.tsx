'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  FolderOpen,
  Globe,
  Loader2,
  Mail,
  MonitorPlay,
  Pencil,
  PlusCircle,
  Search,
  Settings,
  Sparkles,
  User,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  assignManagedStudentsToRoom,
  getProfessorRoomById,
  getProfessorRooms,
  openProfessorRoom,
  type ProfessorRoomListItem,
} from '@/lib/api/professor-rooms';
import { ProfessorRoomFormDialog } from '@/components/professor/online-rooms/professor-room-form-dialog';
import { ProfessorManagedStudentFormDialog } from '@/components/professor/online-rooms/professor-managed-student-form-dialog';
import {
  searchMyManagedRoomStudents,
  type ManagedRoomStudent,
} from '@/lib/api/professor-managed-students';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type Props = { dict: Dictionary };

function RtlSearchInput({
  isRtl,
  value,
  onChange,
  placeholder,
}: {
  isRtl: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className={cn('flex w-full', isRtl ? 'justify-end' : 'justify-start')} dir="ltr">
      <div className="relative w-full sm:max-w-lg">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          dir={isRtl ? 'rtl' : 'ltr'}
          className={cn(
            'h-11 w-full rounded-xl border-border/70 bg-background/80 pl-10 pr-4 shadow-sm',
            isRtl ? 'text-right' : 'text-left'
          )}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function getRoomStatusMeta(status: string, isRtl: boolean) {
  const normalized = status.trim().toLowerCase();
  if (!normalized || normalized === 'active' || normalized === '1' || normalized.includes('فعال')) {
    return {
      label: isRtl ? 'فعال' : 'Active',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    };
  }
  if (normalized.includes('inactive') || normalized.includes('غیرفعال')) {
    return {
      label: isRtl ? 'غیرفعال' : 'Inactive',
      className: 'border-muted-foreground/20 bg-muted text-muted-foreground',
    };
  }
  return {
    label: status || (isRtl ? 'نامشخص' : 'Unknown'),
    className: 'border-primary/20 bg-primary/10 text-primary',
  };
}

function RoomCard({
  room,
  isRtl,
  t,
  onEnter,
  onAssign,
}: {
  room: ProfessorRoomListItem;
  isRtl: boolean;
  t: (key: string, fb: string) => string;
  onEnter: () => void;
  onAssign: () => void;
}) {
  const status = getRoomStatusMeta(room.status, isRtl);
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <article
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card',
        'shadow-sm transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/5'
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-1 opacity-80',
          isRtl
            ? 'bg-gradient-to-r from-primary via-primary/60 to-transparent'
            : 'bg-gradient-to-l from-primary via-primary/60 to-transparent'
        )}
      />

      {/* RTL: آیکون (راست) → متن (وسط) → برچسب (چپ) */}
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        {/* موبایل: ردیف آیکون + برچسب */}
        <div className="flex items-center justify-between gap-3 border-b border-border/50 p-4 lg:hidden">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <MonitorPlay className="h-6 w-6 text-primary" strokeWidth={1.75} />
          </div>
          <Badge variant="outline" className={cn('shrink-0 px-2.5 py-0.5 text-xs font-medium', status.className)}>
            {status.label}
          </Badge>
        </div>

        {/* ۱. آیکون — دسکتاپ */}
        <div
          className={cn(
            'relative hidden shrink-0 items-center justify-center overflow-hidden lg:flex',
            'bg-gradient-to-br from-primary/15 via-primary/5 to-background p-8 lg:w-44 xl:w-52',
            'border-border/60',
            isRtl ? 'lg:border-l' : 'lg:border-r'
          )}
        >
          <div className="absolute -end-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute -bottom-8 -start-4 h-20 w-20 rounded-full bg-primary/5 blur-xl" />
          <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-background/80 shadow-inner ring-1 ring-primary/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
            <MonitorPlay className="h-9 w-9 text-primary" strokeWidth={1.75} />
          </div>
        </div>

        {/* ۲. متن و دکمه‌ها */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
          <div className="space-y-2 text-start">
            <Link
              href={`/professor/online-rooms/${room.roomId}`}
              className="block text-lg font-bold leading-snug text-foreground transition-colors hover:text-primary sm:text-xl"
            >
              {room.title || t('professorDashboard.onlineRooms.untitled', isRtl ? 'اتاق بدون عنوان' : 'Untitled room')}
            </Link>
            {room.slug ? (
              <p className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted/70 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{room.slug}</span>
              </p>
            ) : null}
          </div>

          {room.serviceName ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="truncate">{room.serviceName}</span>
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <Button size="sm" className="gap-2 shadow-sm" onClick={onEnter}>
              <Video className="h-4 w-4" />
              {t('professorDashboard.educationPlans.enterRoom', isRtl ? 'ورود به اتاق' : 'Enter room')}
              <ArrowIcon className="h-3.5 w-3.5 opacity-70" />
            </Button>
            <Button size="sm" variant="outline" className="gap-2 bg-background/60" asChild>
              <Link href={`/professor/online-rooms/${room.roomId}`}>
                <Settings className="h-4 w-4" />
                {t('professorDashboard.onlineRooms.manageRoom', isRtl ? 'مدیریت' : 'Manage')}
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="gap-2 bg-background/60" onClick={onAssign}>
              <UserPlus className="h-4 w-4" />
              {t('professorDashboard.onlineRooms.assignStudents', isRtl ? 'اختصاص دانشجو' : 'Assign students')}
            </Button>
          </div>
        </div>

        {/* ۳. برچسب وضعیت — دسکتاپ */}
        <div
          className={cn(
            'hidden shrink-0 items-start px-5 py-6 lg:flex',
            isRtl ? 'justify-start' : 'justify-end'
          )}
        >
          <Badge variant="outline" className={cn('shrink-0 px-2.5 py-0.5 text-xs font-medium', status.className)}>
            {status.label}
          </Badge>
        </div>
      </div>
    </article>
  );
}

function StudentCard({
  student,
  isRtl,
  t,
  onEdit,
  onFiles,
}: {
  student: ManagedRoomStudent;
  isRtl: boolean;
  t: (key: string, fb: string) => string;
  onEdit: () => void;
  onFiles: () => void;
}) {
  const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.trim().toUpperCase() || '?';
  const fullName = `${student.firstName} ${student.lastName}`.trim();

  return (
    <article
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card',
        'shadow-sm transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-70',
          isRtl
            ? 'bg-gradient-to-r from-primary/80 via-primary/40 to-transparent'
            : 'bg-gradient-to-l from-primary/80 via-primary/40 to-transparent'
        )}
      />

      <div className="flex items-center gap-4 p-4 sm:p-5">
        {/* آواتار — سمت راست در RTL */}
        <div className="relative shrink-0">
          {student.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.photoUrl}
              alt={fullName}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-primary/15"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-background text-base font-bold text-primary ring-2 ring-primary/15">
              {initials}
            </div>
          )}
          <span className="absolute -bottom-1 -start-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card">
            <User className="h-3 w-3 text-white" />
          </span>
        </div>

        {/* متن — وسط */}
        <div className="min-w-0 flex-1 text-start">
          <p className="truncate text-base font-bold text-foreground sm:text-lg">{fullName || student.userName}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{student.userName}</p>
          {student.email ? (
            <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 truncate text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="truncate">{student.email}</span>
            </p>
          ) : null}
        </div>

        {/* نشان و اقدامات */}
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <span className="hidden items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">
            {isRtl ? 'دانشجو' : 'Student'}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
              {t('professorDashboard.roomStudents.edit', isRtl ? 'ویرایش' : 'Edit')}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onFiles}>
              <FolderOpen className="h-3.5 w-3.5" />
              {t('professorDashboard.roomStudents.files.manage', isRtl ? 'فایل‌ها' : 'Files')}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyRoomsState({
  isRtl,
  t,
  onCreate,
}: {
  isRtl: boolean;
  t: (key: string, fb: string) => string;
  onCreate: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Video className="h-8 w-8 text-primary" />
      </div>
      <p className="text-lg font-semibold">
        {t('professorDashboard.onlineRooms.noRooms', isRtl ? 'هنوز اتاقی ایجاد نشده است.' : 'No rooms yet.')}
      </p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t(
          'professorDashboard.onlineRooms.noRoomsHint',
          isRtl
            ? 'اولین اتاق آنلاین خود را بسازید و دانشجویان دوره‌ها و سمینارهایتان را به آن اختصاص دهید.'
            : 'Create your first online room and assign students from your courses and seminars.'
        )}
      </p>
      <Button className="mt-6 gap-2" onClick={onCreate}>
        <PlusCircle className="h-4 w-4" />
        {t('professorDashboard.onlineRooms.addRoom', isRtl ? 'اتاق جدید' : 'New room')}
      </Button>
    </div>
  );
}

export function ProfessorOnlineRoomsPageClient({ dict }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);

  const [rooms, setRooms] = React.useState<ProfessorRoomListItem[]>([]);
  const [students, setStudents] = React.useState<ManagedRoomStudent[]>([]);
  const [loadingRooms, setLoadingRooms] = React.useState(true);
  const [loadingStudents, setLoadingStudents] = React.useState(true);
  const [roomSearch, setRoomSearch] = React.useState('');
  const [studentSearch, setStudentSearch] = React.useState('');

  const [roomDialogOpen, setRoomDialogOpen] = React.useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<ManagedRoomStudent | null>(null);

  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [assignRoomId, setAssignRoomId] = React.useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<number[]>([]);
  const [assigning, setAssigning] = React.useState(false);

  const loadRooms = React.useCallback(async () => {
    const userId = Number(user?.id);
    if (!userId) {
      setRooms([]);
      setLoadingRooms(false);
      return;
    }
    setLoadingRooms(true);
    try {
      const res = await getProfessorRooms({ userId, roomTitle: roomSearch, pageSize: 100 });
      setRooms(res.rooms);
    } catch {
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [roomSearch, user?.id]);

  const loadStudents = React.useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await searchMyManagedRoomStudents({ inputValue: studentSearch, pageSize: 200 });
      setStudents(res.list);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [studentSearch]);

  React.useEffect(() => {
    const timer = setTimeout(() => void loadRooms(), 300);
    return () => clearTimeout(timer);
  }, [loadRooms]);

  React.useEffect(() => {
    const timer = setTimeout(() => void loadStudents(), 300);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  const openAddStudent = () => {
    setEditingStudent(null);
    setStudentDialogOpen(true);
  };

  const openEditStudent = (student: ManagedRoomStudent) => {
    setEditingStudent(student);
    setStudentDialogOpen(true);
  };

  const openStudentFiles = (student: ManagedRoomStudent) => {
    const name = encodeURIComponent(`${student.firstName} ${student.lastName}`.trim());
    router.push(`/professor/room-students/${student.id}/files?name=${name}`);
  };

  const handleRoomSaved = async (roomId: number) => {
    await loadRooms();
    router.push(`/professor/online-rooms/${roomId}`);
  };

  const openAssignDialog = async (roomId: number) => {
    setAssignRoomId(roomId);
    setAssignDialogOpen(true);
    setAssigning(true);
    try {
      const detail = await getProfessorRoomById(roomId);
      setSelectedStudentIds(detail?.assignedManagedRoomStudentIds ?? []);
    } catch {
      setSelectedStudentIds([]);
    } finally {
      setAssigning(false);
    }
  };

  const saveAssignments = async () => {
    if (!assignRoomId) return;
    setAssigning(true);
    try {
      await assignManagedStudentsToRoom(assignRoomId, selectedStudentIds);
      toast({
        title: t('professorDashboard.onlineRooms.assignSuccess', isRtl ? 'دانشجویان اختصاص داده شدند' : 'Students assigned'),
      });
      setAssignDialogOpen(false);
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

  const handleEnterRoom = (room: ProfessorRoomListItem) => {
    void openProfessorRoom({ roomId: room.roomId, slug: room.slug }).catch((error) =>
      toast({
        title: t('professorDashboard.educationPlans.enterRoomFailed', isRtl ? 'ورود انجام نشد' : 'Enter failed'),
        description: getApiErrorMessage(error, ''),
        variant: 'destructive',
      })
    );
  };

  const title = t('professorDashboard.menu.onlineRooms', isRtl ? 'اتاق‌های آنلاین' : 'Online rooms');
  const subtitle = t(
    'professorDashboard.onlineRooms.subtitle',
    isRtl
      ? 'اتاق‌های آنلاین بسازید و دانشجویان دوره‌ها و سمینارهای خود را به اتاق اختصاص دهید.'
      : 'Create online rooms and assign students from your courses and seminars.'
  );

  return (
    <div className="w-full space-y-6 text-start" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
        </div>
        <Button className="shrink-0 gap-2 shadow-sm" onClick={() => setRoomDialogOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          {t('professorDashboard.onlineRooms.addRoom', isRtl ? 'اتاق جدید' : 'New room')}
        </Button>
      </div>

      <div className="flex w-full flex-col gap-5">
        <div className={cn('flex w-full flex-wrap gap-3', isRtl ? 'justify-end' : 'justify-start')} dir="ltr">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-4 py-1.5 text-sm">
            <Video className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{t('professorDashboard.onlineRooms.roomsTab', isRtl ? 'اتاق‌ها' : 'Rooms')}:</span>
            <span className="font-semibold">{loadingRooms ? '…' : rooms.length}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-4 py-1.5 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{t('professorDashboard.onlineRooms.studentsTab', isRtl ? 'دانشجویان من' : 'My students')}:</span>
            <span className="font-semibold">{loadingStudents ? '…' : students.length}</span>
          </div>
        </div>

        <Tabs defaultValue="rooms" className="w-full space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className={cn('flex w-full', isRtl ? 'justify-end' : 'justify-start')} dir="ltr">
            <TabsList
              dir={isRtl ? 'rtl' : 'ltr'}
              className="inline-flex h-auto justify-start gap-1 rounded-xl bg-muted/50 p-1"
            >
              <TabsTrigger value="rooms" className="gap-2 rounded-lg px-4 py-2 data-[state=active]:shadow-sm">
                <Video className="h-4 w-4" />
                {t('professorDashboard.onlineRooms.roomsTab', isRtl ? 'اتاق‌ها' : 'Rooms')}
              </TabsTrigger>
              <TabsTrigger value="students" className="gap-2 rounded-lg px-4 py-2 data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                {t('professorDashboard.onlineRooms.studentsTab', isRtl ? 'دانشجویان من' : 'My students')}
              </TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="rooms" className="mt-0 w-full space-y-5">
          <RtlSearchInput
            isRtl={isRtl}
            value={roomSearch}
            onChange={setRoomSearch}
            placeholder={t('professorDashboard.onlineRooms.searchRooms', isRtl ? 'جستجوی اتاق…' : 'Search rooms…')}
          />

          {loadingRooms ? (
            <div className="flex w-full flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <EmptyRoomsState isRtl={isRtl} t={t} onCreate={() => setRoomDialogOpen(true)} />
          ) : (
            <div className="flex w-full flex-col gap-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.roomId}
                  room={room}
                  isRtl={isRtl}
                  t={t}
                  onEnter={() => handleEnterRoom(room)}
                  onAssign={() => void openAssignDialog(room.roomId)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="mt-0 w-full space-y-5">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <RtlSearchInput
              isRtl={isRtl}
              value={studentSearch}
              onChange={setStudentSearch}
              placeholder={t('professorDashboard.onlineRooms.searchStudents', isRtl ? 'جستجوی دانشجو…' : 'Search students…')}
            />
            <Button className="shrink-0 gap-2" onClick={openAddStudent}>
              <UserPlus className="h-4 w-4" />
              {t('professorDashboard.onlineRooms.addStudent', isRtl ? 'دانشجوی جدید' : 'New student')}
            </Button>
          </div>

          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="flex w-full items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"
          >
            <p className="flex-1 text-start leading-relaxed">
              {t(
                'professorDashboard.roomStudents.credentialsHint',
                isRtl
                  ? 'برای هر دانشجو نام کاربری و رمز ورود اختصاص دهید تا بتواند وارد اتاق آنلاین شود. فقط دانشجویان دوره‌ها یا سمینارهای شما در این لیست نمایش داده می‌شوند.'
                  : 'Set a username and password for each student to join online rooms. Only students enrolled in your courses or seminars are listed.'
              )}
            </p>
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          </div>

          {loadingStudents ? (
            <div className="flex w-full flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.5rem] w-full rounded-2xl" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex w-full flex-col items-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center">
              <Users className="mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">
                {t(
                  'professorDashboard.onlineRooms.noStudents',
                  isRtl ? 'هنوز دانشجویی در دوره‌ها یا سمینارهای شما ثبت‌نام نکرده است.' : 'No students from your courses or seminars yet.'
                )}
              </p>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-3">
              {students.map((s) => (
                <StudentCard
                  key={s.id}
                  student={s}
                  isRtl={isRtl}
                  t={t}
                  onEdit={() => openEditStudent(s)}
                  onFiles={() => openStudentFiles(s)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        </Tabs>
      </div>

      <ProfessorRoomFormDialog
        dict={dict}
        open={roomDialogOpen}
        onOpenChange={setRoomDialogOpen}
        onSaved={handleRoomSaved}
      />

      <ProfessorManagedStudentFormDialog
        dict={dict}
        open={studentDialogOpen}
        onOpenChange={setStudentDialogOpen}
        student={editingStudent}
        onSaved={() => void loadStudents()}
      />

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader className="text-start">
            <DialogTitle>
              {t('professorDashboard.onlineRooms.assignStudents', isRtl ? 'اختصاص دانشجو به اتاق' : 'Assign students to room')}
            </DialogTitle>
          </DialogHeader>
          {assigning && students.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((s) => {
                const checked = selectedStudentIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                      checked ? 'border-primary/40 bg-primary/5' : 'border-border/70 hover:bg-muted/40'
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setSelectedStudentIds((prev) =>
                          value ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                        );
                      }}
                    />
                    <div className="min-w-0 flex-1 text-start">
                      <p className="font-medium">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{s.userName}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          <DialogFooter className={cn('gap-2 sm:gap-0', isRtl && 'sm:flex-row-reverse')}>
            <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
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

'use client';



import { useEffect, useState, useCallback } from 'react';

import { useParams, useRouter } from 'next/navigation';

import {
  assignManagedStudentsToRoom,
  deleteRoomSession,
  endRoomSessionById,
  getRoomById,
  getRoomFiles,
  getRoomMembers,
  getRoomSessions,
  loadRoomParticipantsSnapshot,
  removeRoomSeat,
  RoomFileItem,
  RoomMemberItem,
  RoomSessionItem,
  setRoomSessionIgnored,
  setRoomUserBlocked,
  updateRoomUserOnlineStatus,
} from '@/services/room-service';
import { useToast } from '@/hooks/use-toast';

import type { SeminarRoom } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  ArrowLeft,
  Users,
  MonitorPlay,
  Clock,
  File,
  Video,
  Calendar,
  Download,
  Presentation,
  MoreHorizontal,
  Plus,
  Pencil,
} from 'lucide-react';
import { RoomAssignStudentsDialog } from '@/components/seminar/room-assign-students-dialog';
import { AddManagedRoomStudentModal } from '@/app/dashboard/students/components/add-managed-room-student-modal';
import { searchManagedRoomStudents, type ManagedRoomStudentRow } from '@/services/managed-room-students-service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { format } from 'date-fns';

import { useLanguage } from '@/components/language-provider';

import { Skeleton } from '@/components/ui/skeleton';

import { getRoomFileTypeLabel } from '@/lib/utils/localized-ui';

function sessionDurationMs(session: RoomSessionItem): number {
  if (session.isIgnored) return 0;
  if (session.duration) {
    const parts = session.duration.split('.')[0].split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const s = parseInt(parts[2], 10) || 0;
      return ((h * 60 + m) * 60 + s) * 1000;
    }
  }
  if (session.endTime && session.startTime) {
    return Math.max(0, new Date(session.endTime).getTime() - new Date(session.startTime).getTime());
  }
  if (session.status === 'Active' && session.startTime) {
    return Math.max(0, Date.now() - new Date(session.startTime).getTime());
  }
  return 0;
}

function formatTotalDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${totalSeconds}s`;
}

export default function RoomDetailsPage() {

  const params = useParams();

  const router = useRouter();

  const { t, locale } = useLanguage();

  const roomId = Number(params?.id);



  const [room, setRoom] = useState<SeminarRoom | null>(null);
  const [roomDetail, setRoomDetail] = useState<Awaited<ReturnType<typeof getRoomById>>>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [studentEditOpen, setStudentEditOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<ManagedRoomStudentRow | null>(null);

  const [files, setFiles] = useState<RoomFileItem[]>([]);

  const [sessions, setSessions] = useState<RoomSessionItem[]>([]);

  const [sessionTotalCount, setSessionTotalCount] = useState(0);

  const [members, setMembers] = useState<RoomMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionActionId, setSessionActionId] = useState<number | null>(null);
  const [memberActionId, setMemberActionId] = useState<number | null>(null);
  const { toast } = useToast();



  useEffect(() => {

    if (!roomId) return;



    const fetchData = async () => {

      try {

        const [roomData, filesData, sessionsData, participantsSnapshot] = await Promise.all([

          getRoomById(roomId),

          getRoomFiles(roomId),

          getRoomSessions(roomId),

          loadRoomParticipantsSnapshot(roomId, { cacheBust: true }),

        ]);



        if (!roomData) {

          setLoading(false);

          return;

        }



        const mappedRoom: SeminarRoom = {

          id: String(roomData.roomId),

          name: roomData.title ?? '',

          organizerId: String(roomData.userId),

          participants: (roomData.assignedManagedRoomStudentIds ?? []).map(String),

          participantRoles: {},

          allowGuests: roomData.isGuest,

          duration: roomData.maxSessionTime,

          guestLimit: roomData.guestQuantity,

          teacherEntersFirst: roomData.teacherEntersFirst ?? false,

          slug: roomData.slug ?? null,

        };



        setRoom(mappedRoom);
        setRoomDetail(participantsSnapshot?.detail ?? roomData);

        setFiles(filesData);

        setSessions(sessionsData.queryResult);

        setSessionTotalCount(sessionsData.totalCount ?? sessionsData.queryResult.length);
        setMembers(participantsSnapshot?.members ?? []);

      } catch (error) {

        console.error('Failed to load room details:', error);

      } finally {

        setLoading(false);

      }

    };



    void fetchData();

  }, [roomId]);

  useEffect(() => {
    if (!roomId || loading) return;
    const timer = setInterval(() => {
      void getRoomMembers(roomId, { cacheBust: true }).then(setMembers).catch(() => undefined);
    }, 15000);
    return () => clearInterval(timer);
  }, [roomId, loading]);

  const applyParticipantsSnapshot = useCallback(
    (snapshot: NonNullable<Awaited<ReturnType<typeof loadRoomParticipantsSnapshot>>>) => {
      setRoomDetail(snapshot.detail);
      setMembers(snapshot.members);
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              participants: (snapshot.detail.assignedManagedRoomStudentIds ?? []).map(String),
            }
          : prev
      );
    },
    []
  );

  const syncParticipants = useCallback(async () => {
    if (!roomId) return;
    const snapshot = await loadRoomParticipantsSnapshot(roomId, { cacheBust: true });
    if (snapshot) applyParticipantsSnapshot(snapshot);
  }, [roomId, applyParticipantsSnapshot]);

  const refreshSessions = useCallback(async () => {
    if (!roomId) return;
    const sessionsData = await getRoomSessions(roomId);
    setSessions(sessionsData.queryResult);
    setSessionTotalCount(sessionsData.totalCount ?? sessionsData.queryResult.length);
  }, [roomId]);

  const getSessionStatusLabel = (status: string) => {

    if (status === 'Active') return t('room_session_status_active');

    if (status === 'Completed') return t('room_session_status_completed');

    return status;

  };



  const formatDuration = (durationStr?: string) => {

    if (!durationStr) return '—';

    const parts = durationStr.split('.')[0].split(':');

    if (parts.length === 3) {

      const h = parseInt(parts[0], 10);

      const m = parseInt(parts[1], 10);

      const s = parseInt(parts[2], 10);

      if (h > 0) return `${h}h ${m}m`;

      return `${m}m ${s}s`;

    }

    return durationStr;

  };



  const getFileIcon = (type: number) => {

    switch (type) {

      case 1:

        return <Video className="h-4 w-4 text-blue-500" />;

      case 2:

        return <MonitorPlay className="h-4 w-4 text-green-500" />;

      case 3:

        return <Presentation className="h-4 w-4 text-orange-500" />;

      case 4:

        return <Video className="h-4 w-4 text-red-500" />;

      case 5:

        return <File className="h-4 w-4 text-purple-500" />;

      default:

        return <File className="h-4 w-4 text-gray-500" />;

    }

  };



  if (loading) {

    return (

      <div className="space-y-6 p-6">

        <Skeleton className="h-8 w-64" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <Skeleton className="h-40 col-span-2" />

          <Skeleton className="h-40 col-span-1" />

        </div>

      </div>

    );

  }



  if (!room) {

    return (

      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">

        <h2 className="text-2xl font-bold">{t('room_details_not_found')}</h2>

        <Button onClick={() => router.push('/dashboard/rooms')}>{t('room_details_back_to_rooms')}</Button>

      </div>

    );

  }



  const isRtl = locale === 'fa';
  const textAlign = isRtl ? 'text-right' : 'text-left';
  const totalSessionDurationMs = sessions.reduce((acc, s) => acc + sessionDurationMs(s), 0);

  const assignedManagedIds = roomDetail?.assignedManagedRoomStudentIds ?? [];

  const unassignMember = async (managedRoomStudentId: number | undefined) => {
    if (!managedRoomStudentId) return;
    const next = assignedManagedIds.filter((id) => id !== managedRoomStudentId);
    setMembers((prev) => prev.filter((m) => m.managedRoomStudentId !== managedRoomStudentId));
    try {
      await assignManagedStudentsToRoom(roomId, next);
      await syncParticipants();
    } catch {
      await syncParticipants();
      toast({ variant: 'destructive', title: t('toast_error_title'), description: t('toast_error_description') });
    }
  };

  const openEditMember = async (managedRoomStudentId: number | undefined) => {
    if (!managedRoomStudentId) return;
    try {
      const result = await searchManagedRoomStudents({
        pageNumber: 1,
        pageSize: 50,
        inputValue: '',
      });
      const row = result.list.find((s) => s.id === managedRoomStudentId) ?? null;
      if (!row) {
        toast({ variant: 'destructive', title: t('validation_error_title'), description: t('toast_error_description') });
        return;
      }
      setStudentToEdit(row);
      setStudentEditOpen(true);
    } catch {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('toast_error_description') });
    }
  };

  const patchSession = (sessionId: number, patch: Partial<RoomSessionItem>) => {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...patch } : s)));
  };

  const removeSessionFromList = (sessionId: number) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setSessionTotalCount((count) => Math.max(0, count - 1));
  };

  const runSessionAction = async (
    sessionId: number,
    action: () => Promise<void>,
    options?: { onOptimistic?: () => void; onRollback?: () => void }
  ) => {
    setSessionActionId(sessionId);
    options?.onOptimistic?.();
    try {
      await action();
      void refreshSessions();
    } catch {
      options?.onRollback?.();
      toast({ variant: 'destructive', title: t('toast_error_title'), description: t('toast_error_description') });
    } finally {
      setSessionActionId(null);
    }
  };

  const runMemberAction = async (
    roomUserId: number,
    action: () => Promise<void>,
    options?: { onOptimistic?: () => void }
  ) => {
    setMemberActionId(roomUserId);
    options?.onOptimistic?.();
    try {
      await action();
      await syncParticipants();
    } catch {
      await syncParticipants();
      toast({ variant: 'destructive', title: t('toast_error_title'), description: t('toast_error_description') });
    } finally {
      setMemberActionId(null);
    }
  };

  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-4">

        <div className="flex items-center gap-4">

          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/rooms')}>

            <ArrowLeft className="h-5 w-5" />

          </Button>

          <div>

            <h1 className="text-2xl font-bold tracking-tight">{room.name}</h1>

            <p className="text-muted-foreground text-sm flex items-center gap-2 flex-wrap">

              {t('room_details_id_label')}: {room.id}

              {room.slug ? (

                <span>

                  • {t('room_details_slug_label')}: {room.slug}

                </span>

              ) : null}

            </p>

          </div>

        </div>

        <Button onClick={() => window.open(`/room/${room.slug || room.id}`, '_blank')}>

          {t('room_details_join_room')}

        </Button>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Card className="md:col-span-2">

          <CardHeader>

            <CardTitle>{t('room_details_settings')}</CardTitle>

          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-4">

            <div className="space-y-1">

              <span className="text-sm text-muted-foreground flex items-center gap-2">

                <Clock className="h-4 w-4" /> {t('room_details_max_duration')}

              </span>

              <p className="font-medium">

                {room.duration} {t('room_details_minutes')}

              </p>

            </div>

            <div className="space-y-1">

              <span className="text-sm text-muted-foreground flex items-center gap-2">

                <Users className="h-4 w-4" /> {t('room_details_participants')}

              </span>

              <p className="font-medium">

                {assignedManagedIds.length} {t('room_details_assigned')}

              </p>

            </div>

            <div className="space-y-1">

              <span className="text-sm text-muted-foreground">{t('room_details_teacher_enters_first')}</span>

              <p className="font-medium">{room.teacherEntersFirst ? t('yes') : t('no')}</p>

            </div>

            <div className="space-y-1">

              <span className="text-sm text-muted-foreground">{t('room_details_allow_guests')}</span>

              <p className="font-medium">

                {room.allowGuests ? t('room_details_guest_max', { limit: room.guestLimit ?? 0 }) : t('no')}

              </p>

            </div>

          </CardContent>

        </Card>

        <Card>

          <CardHeader>

            <CardTitle>{t('room_details_quick_stats')}</CardTitle>

          </CardHeader>

          <CardContent className="space-y-4">

            <div className="flex justify-between items-center">

              <span className="text-sm text-muted-foreground">{t('room_details_total_sessions')}</span>

              <Badge variant="secondary">{sessionTotalCount}</Badge>

            </div>

            <div className="flex justify-between items-center">

              <span className="text-sm text-muted-foreground">{t('room_details_total_session_time')}</span>

              <Badge variant="secondary">{formatTotalDuration(totalSessionDurationMs)}</Badge>

            </div>

            <div className="flex justify-between items-center">

              <span className="text-sm text-muted-foreground">{t('room_details_total_files')}</span>

              <Badge variant="secondary">{files.length}</Badge>

            </div>

            <div className="flex justify-between items-center">

              <span className="text-sm text-muted-foreground">{t('room_details_storage_used')}</span>

              <Badge variant="secondary">

                {(files.reduce((acc, f) => acc + f.fileSize, 0) / (1024 * 1024)).toFixed(2)} MB

              </Badge>

            </div>

          </CardContent>

        </Card>

      </div>

      <Tabs dir={isRtl ? 'rtl' : 'ltr'} defaultValue="sessions" className="w-full">

        <TabsList>

          <TabsTrigger value="sessions">{t('room_details_tab_sessions')}</TabsTrigger>

          <TabsTrigger value="files">{t('room_details_tab_files')}</TabsTrigger>

        </TabsList>



        <TabsContent value="sessions" className="mt-4">

          <Card>

            <CardHeader>

              <CardTitle>{t('room_details_session_history')}</CardTitle>

              <CardDescription>{t('room_details_session_history_desc')}</CardDescription>

            </CardHeader>

            <CardContent>

              {sessions.length === 0 ? (

                <div className="text-center py-8 text-muted-foreground">{t('room_details_no_sessions')}</div>

              ) : (

                <div className="relative overflow-x-auto" dir={isRtl ? 'rtl' : 'ltr'}>

                  <table className={`w-full text-sm ${textAlign}`}>

                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">

                      <tr>

                        <th className={`px-4 py-3 ${textAlign}`}>{t('room_details_col_actions')}</th>

                        <th className={`px-4 py-3 ${textAlign}`}>{t('room_details_col_date')}</th>

                        <th className={`px-4 py-3 ${textAlign}`}>{t('room_details_col_status')}</th>

                        <th className={`px-4 py-3 ${textAlign}`}>{t('room_details_col_started_by')}</th>

                        <th className={`px-4 py-3 ${textAlign}`}>{t('room_details_col_duration')}</th>

                      </tr>

                    </thead>

                    <tbody>

                      {sessions.map((session) => (

                        <tr
                          key={session.id}
                          className={`border-b last:border-0 ${session.isIgnored ? 'text-yellow-600 dark:text-yellow-400' : ''}`}
                        >

                          <td className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>

                            <DropdownMenu>

                              <DropdownMenuTrigger asChild>

                                <Button variant="ghost" size="icon" disabled={sessionActionId === session.id}>

                                  <MoreHorizontal className="h-4 w-4" />

                                </Button>

                              </DropdownMenuTrigger>

                              <DropdownMenuContent align={isRtl ? 'start' : 'end'}>

                                {session.status === 'Active' ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void runSessionAction(
                                        session.id,
                                        () => endRoomSessionById(roomId, session.id),
                                        {
                                          onOptimistic: () =>
                                            patchSession(session.id, { status: 'Completed' }),
                                          onRollback: () =>
                                            patchSession(session.id, { status: session.status }),
                                        }
                                      )
                                    }
                                  >
                                    {t('room_session_action_end')}
                                  </DropdownMenuItem>
                                ) : null}

                                <DropdownMenuItem
                                  onClick={() => {
                                    const nextIgnored = !session.isIgnored;
                                    void runSessionAction(
                                      session.id,
                                      () => setRoomSessionIgnored(roomId, session.id, nextIgnored),
                                      {
                                        onOptimistic: () => patchSession(session.id, { isIgnored: nextIgnored }),
                                        onRollback: () =>
                                          patchSession(session.id, { isIgnored: session.isIgnored }),
                                      }
                                    );
                                  }}
                                >
                                  {session.isIgnored
                                    ? t('room_session_action_unignore')
                                    : t('room_session_action_ignore')}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (!window.confirm(t('room_session_delete_confirm'))) return;
                                    const snapshot = sessions;
                                    const snapshotCount = sessionTotalCount;
                                    void runSessionAction(
                                      session.id,
                                      () => deleteRoomSession(roomId, session.id),
                                      {
                                        onOptimistic: () => removeSessionFromList(session.id),
                                        onRollback: () => {
                                          setSessions(snapshot);
                                          setSessionTotalCount(snapshotCount);
                                        },
                                      }
                                    );
                                  }}
                                >
                                  {t('room_session_action_delete')}
                                </DropdownMenuItem>

                              </DropdownMenuContent>

                            </DropdownMenu>

                          </td>

                          <td className={`px-4 py-3 font-medium ${textAlign}`}>

                            <span className={`inline-flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>

                              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />

                              {format(new Date(session.startTime), 'PPp')}

                            </span>

                          </td>

                          <td className={`px-4 py-3 ${textAlign}`}>

                            <Badge variant={session.status === 'Active' ? 'default' : 'secondary'}>

                              {getSessionStatusLabel(session.status)}

                              {session.isIgnored ? ` · ${t('room_session_ignored_badge')}` : ''}

                            </Badge>

                          </td>

                          <td className={`px-4 py-3 ${textAlign}`}>{session.startedByUserId || t('unknown')}</td>

                          <td className={`px-4 py-3 ${textAlign}`}>{formatDuration(session.duration)}</td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </CardContent>

          </Card>

          <Card className="mt-6">

            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">

              <div>
                <CardTitle>{t('room_details_members_title')}</CardTitle>
                <CardDescription>{t('room_details_members_desc')}</CardDescription>
              </div>

              <Button type="button" size="sm" onClick={() => setAssignDialogOpen(true)}>
                <Plus className="h-4 w-4 me-2" />
                {t('room_details_add_members_button')}
              </Button>

            </CardHeader>

            <CardContent>

              {members.length === 0 ? (

                <div className="text-center py-8 text-muted-foreground">{t('room_details_no_members')}</div>

              ) : (

                <div className="relative overflow-x-auto" dir={isRtl ? 'rtl' : 'ltr'}>

                  <table className={`w-full text-sm ${textAlign}`}>

                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">

                      <tr>

                        <th className={`px-4 py-3 ${textAlign}`}>{t('room_details_col_actions')}</th>

                        <th className={`px-4 py-3 ${textAlign}`}>{t('room_details_col_member_name')}</th>

                        <th className={`px-4 py-3 ${textAlign}`}>{t('room_details_col_username')}</th>

                        <th className={`px-4 py-3 ${textAlign}`}>{t('room_details_col_online_status')}</th>

                        <th className={`px-4 py-3 ${textAlign}`}>{t('room_details_col_blocked')}</th>

                      </tr>

                    </thead>

                    <tbody>

                      {members.map((member) => (

                        <tr key={member.roomUserId} className="border-b last:border-0">

                          <td className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>

                            <DropdownMenu>

                              <DropdownMenuTrigger asChild>

                                <Button variant="ghost" size="icon" disabled={memberActionId === member.roomUserId}>

                                  <MoreHorizontal className="h-4 w-4" />

                                </Button>

                              </DropdownMenuTrigger>

                              <DropdownMenuContent align={isRtl ? 'start' : 'end'}>

                                {member.isOnline ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void runMemberAction(
                                        member.roomUserId,
                                        () => updateRoomUserOnlineStatus(roomId, member.roomUserId, false),
                                        {
                                          onOptimistic: () =>
                                            setMembers((prev) =>
                                              prev.map((m) =>
                                                m.roomUserId === member.roomUserId ? { ...m, isOnline: false } : m
                                              )
                                            ),
                                        }
                                      )
                                    }
                                  >
                                    {t('room_member_action_kick_from_room')}
                                  </DropdownMenuItem>
                                ) : null}

                                <DropdownMenuItem
                                  onClick={() => void openEditMember(member.managedRoomStudentId)}
                                >
                                  <Pencil className="h-4 w-4 me-2" />
                                  {t('actions_edit')}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() =>
                                    void runMemberAction(
                                      member.roomUserId,
                                      () => setRoomUserBlocked(roomId, member.roomUserId, !member.isBlocked),
                                      {
                                        onOptimistic: () =>
                                          setMembers((prev) =>
                                            prev.map((m) =>
                                              m.roomUserId === member.roomUserId
                                                ? { ...m, isBlocked: !m.isBlocked }
                                                : m
                                            )
                                          ),
                                      }
                                    )
                                  }
                                >
                                  {member.isBlocked
                                    ? t('room_member_action_unblock')
                                    : t('room_member_action_block')}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (!window.confirm(t('room_member_delete_confirm'))) return;
                                    void runMemberAction(
                                      member.roomUserId,
                                      () => removeRoomSeat(roomId, member.roomUserId),
                                      {
                                        onOptimistic: () =>
                                          setMembers((prev) =>
                                            prev.filter((m) => m.roomUserId !== member.roomUserId)
                                          ),
                                      }
                                    );
                                  }}
                                >
                                  {t('room_member_action_delete')}
                                </DropdownMenuItem>

                              </DropdownMenuContent>

                            </DropdownMenu>

                          </td>

                          <td className={`px-4 py-3 font-medium ${textAlign}`}>{member.fullName || '—'}</td>

                          <td className={`px-4 py-3 ${textAlign}`}>{member.userName}</td>

                          <td className={`px-4 py-3 ${textAlign}`}>

                            <Badge variant={member.isOnline ? 'default' : 'secondary'}>

                              {member.isOnline ? t('room_member_in_room') : t('room_member_not_in_room')}

                            </Badge>

                          </td>

                          <td className={`px-4 py-3 ${textAlign}`}>

                            <Badge variant={member.isBlocked ? 'destructive' : 'outline'}>

                              {member.isBlocked ? t('yes') : t('no')}

                            </Badge>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </CardContent>

          </Card>

        </TabsContent>



        <TabsContent value="files" className="mt-4">

          <Card>

            <CardHeader>

              <CardTitle>{t('room_details_files_title')}</CardTitle>

              <CardDescription>{t('room_details_files_desc')}</CardDescription>

            </CardHeader>

            <CardContent>

              {files.length === 0 ? (

                <div className="text-center py-8 text-muted-foreground">{t('room_details_no_files')}</div>

              ) : (

                <div className="relative overflow-x-auto">

                  <table className={`w-full text-sm ${textAlign}`}>

                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">

                      <tr>

                        <th className="px-4 py-3">{t('room_details_col_file_name')}</th>

                        <th className="px-4 py-3">{t('room_details_col_type')}</th>

                        <th className="px-4 py-3">{t('room_details_col_size')}</th>

                        <th className="px-4 py-3">{t('room_details_col_uploaded_by')}</th>

                        <th className={`px-4 py-3 ${locale === 'fa' ? 'text-left' : 'text-right'}`}>{t('room_details_col_action')}</th>

                      </tr>

                    </thead>

                    <tbody>

                      {files.map((file) => (

                        <tr key={file.id} className="border-b last:border-0">

                          <td className="px-4 py-3 font-medium">

                            <span className="inline-flex items-center gap-2 max-w-[200px]">

                              {getFileIcon(file.fileType)}

                              <span className="truncate">{file.fileName}</span>

                            </span>

                          </td>

                          <td className="px-4 py-3">

                            <Badge variant="outline">{getRoomFileTypeLabel(file.fileType, t)}</Badge>

                          </td>

                          <td className="px-4 py-3">{(file.fileSize / (1024 * 1024)).toFixed(2)} MB</td>

                          <td className="px-4 py-3">{file.uploadedByUserId || t('admin_label')}</td>

                          <td className={`px-4 py-3 ${locale === 'fa' ? 'text-left' : 'text-right'}`}>

                            <Button variant="ghost" size="sm" asChild>

                              <a

                                href={file.fileUrl.startsWith('http') ? file.fileUrl : `https://localhost:4001${file.fileUrl}`}

                                target="_blank"

                                rel="noopener noreferrer"

                              >

                                <Download className="h-4 w-4 mr-2" /> {t('room_details_download')}

                              </a>

                            </Button>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </CardContent>

          </Card>

        </TabsContent>

      </Tabs>

      <RoomAssignStudentsDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        roomId={roomId}
        assignedManagedStudentIds={assignedManagedIds}
        onAssigned={syncParticipants}
      />

      <AddManagedRoomStudentModal
        open={studentEditOpen}
        studentToEdit={studentToEdit}
        onOpenChangeAction={(open) => {
          setStudentEditOpen(open);
          if (!open) setStudentToEdit(null);
        }}
        onCreatedAction={() => {
          void syncParticipants();
        }}
      />

    </div>

  );

}



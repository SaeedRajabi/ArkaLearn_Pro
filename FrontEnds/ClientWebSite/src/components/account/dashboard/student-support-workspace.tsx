'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  StudentSupportTeacherPanel,
  type StudentSupportTeacherRow,
} from '@/components/account/dashboard/student-support-teacher-panel';
import { TeacherStoriesPanel } from '@/components/support/teacher-stories-panel';
import { getDictValue } from '@/lib/i18n-client';
import { isValidLongId } from '@/lib/id';
import type { Dictionary } from '@/types';
import { Loader2 } from 'lucide-react';

const SupportChatWorkspace = dynamic(
  () =>
    import('@/components/account/dashboard/my-student-support').then((m) => m.SupportChatWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[240px] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    ),
  }
);

type StudentSupportWorkspaceProps = {
  dict: Dictionary;
  onMobileChatViewChange?: (inChatView: boolean) => void;
};

export function StudentSupportWorkspace({
  dict,
  onMobileChatViewChange,
}: StudentSupportWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const [selectedTeacher, setSelectedTeacher] = React.useState<StudentSupportTeacherRow | null>(null);
  const [teachersRefreshToken, setTeachersRefreshToken] = React.useState(0);

  React.useEffect(() => {
    const teacherId = (searchParams.get('teacher') || '').trim();
    if (!isValidLongId(teacherId)) {
      setSelectedTeacher(null);
      return;
    }
    if (selectedTeacher?.teacherUserId === teacherId) return;

    setSelectedTeacher({
      teacherUserId: teacherId,
      displayName: searchParams.get('teacherName') || `${t('supportChat.teacher', 'Teacher')} #${teacherId}`,
      email: null,
      source: 'url',
      topicCount: 0,
      unreadCount: 0,
    });
  }, [searchParams, selectedTeacher?.teacherUserId, t]);

  const updateTeacherUrl = React.useCallback(
    (teacher: StudentSupportTeacherRow | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('conversation');
      if (teacher) {
        params.set('teacher', teacher.teacherUserId);
        params.set('teacherName', teacher.displayName);
      } else {
        params.delete('teacher');
        params.delete('teacherName');
      }
      const qs = params.toString();
      const base = typeof window !== 'undefined' ? window.location.pathname : '/account/dashboard';
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    },
    [router, searchParams]
  );

  const handleSelectTeacher = React.useCallback(
    (teacher: StudentSupportTeacherRow) => {
      setSelectedTeacher(teacher);
      updateTeacherUrl(teacher);
    },
    [updateTeacherUrl]
  );

  const handleBackToTeachers = React.useCallback(() => {
    setSelectedTeacher(null);
    setTeachersRefreshToken((value) => value + 1);
    updateTeacherUrl(null);
    onMobileChatViewChange?.(false);
  }, [onMobileChatViewChange, updateTeacherUrl]);

  if (!selectedTeacher) {
    return (
      <div className="space-y-4">
        <TeacherStoriesPanel />
        <StudentSupportTeacherPanel
          dict={dict}
          onSelectTeacher={handleSelectTeacher}
          refreshToken={teachersRefreshToken}
        />
      </div>
    );
  }

  return (
    <SupportChatWorkspace
      dict={dict}
      mode="student"
      filterTeacherUserId={selectedTeacher.teacherUserId}
      teacherDisplayName={selectedTeacher.displayName}
      onBackToTeachers={handleBackToTeachers}
      onMobileChatViewChange={onMobileChatViewChange}
    />
  );
}

export function StudentSupportChatsView({ dict }: { dict: Dictionary }) {
  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const [mobileInChat, setMobileInChat] = React.useState(false);

  return (
    <div className="space-y-4">
      {!mobileInChat ? (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('supportChat.title', 'Online support')}</h1>
          <p className="text-muted-foreground">
            {t(
              'supportChat.chatsSubtitleTeachersFirst',
              'Select a teacher, then view and continue your conversations with them.'
            )}
          </p>
        </div>
      ) : null}
      <StudentSupportWorkspace dict={dict} onMobileChatViewChange={setMobileInChat} />
    </div>
  );
}

export function MyStudentSupport({ dict }: { dict: Dictionary }) {
  return <StudentSupportChatsView dict={dict} />;
}

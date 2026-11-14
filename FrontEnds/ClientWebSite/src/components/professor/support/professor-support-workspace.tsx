'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SupportChatWorkspace } from '@/components/account/dashboard/my-student-support';
import { ProfessorGrantSupportMonthsCard } from '@/components/professor/support/professor-grant-support-months-card';
import { ProfessorSupportStudentPanel } from '@/components/professor/support/professor-support-student-panel';
import { TeacherStoriesPanel } from '@/components/support/teacher-stories-panel';
import type { SupportStudentRow } from '@/lib/api/support-chat';
import { getDictValue } from '@/lib/i18n-client';
import { isValidLongId } from '@/lib/id';
import type { Dictionary } from '@/types';

type ProfessorSupportWorkspaceProps = {
  dict: Dictionary;
  onMobileChatViewChange?: (inChatView: boolean) => void;
};

export function ProfessorSupportWorkspace({
  dict,
  onMobileChatViewChange,
}: ProfessorSupportWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const [selectedStudent, setSelectedStudent] = React.useState<SupportStudentRow | null>(null);
  const [studentsRefreshToken, setStudentsRefreshToken] = React.useState(0);

  React.useEffect(() => {
    const studentId = (searchParams.get('student') || '').trim();
    if (!isValidLongId(studentId)) {
      setSelectedStudent(null);
      return;
    }
    if (selectedStudent?.studentUserId === studentId) return;

    setSelectedStudent({
      studentUserId: studentId,
      displayName: searchParams.get('studentName') || `${t('supportChat.student', 'Student')} #${studentId}`,
      email: null,
      topicCount: 0,
      unreadCount: 0,
    });
  }, [searchParams, selectedStudent?.studentUserId, t]);

  const updateStudentUrl = React.useCallback(
    (student: SupportStudentRow | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('conversation');
      if (student) {
        params.set('student', student.studentUserId);
        params.set('studentName', student.displayName);
      } else {
        params.delete('student');
        params.delete('studentName');
      }
      const qs = params.toString();
      router.replace(qs ? `/professor/support?${qs}` : '/professor/support', { scroll: false });
    },
    [router, searchParams]
  );

  const handleSelectStudent = React.useCallback(
    (student: SupportStudentRow) => {
      setSelectedStudent(student);
      updateStudentUrl(student);
    },
    [updateStudentUrl]
  );

  const handleBackToStudents = React.useCallback(() => {
    setSelectedStudent(null);
    setStudentsRefreshToken((value) => value + 1);
    updateStudentUrl(null);
  }, [updateStudentUrl]);

  if (!selectedStudent) {
    return (
      <div className="space-y-4">
        <TeacherStoriesPanel canPublish />
        <ProfessorSupportStudentPanel
          dict={dict}
          onSelectStudent={handleSelectStudent}
          refreshToken={studentsRefreshToken}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProfessorGrantSupportMonthsCard
        dict={dict}
        studentUserId={selectedStudent.studentUserId}
        studentName={selectedStudent.displayName}
      />
      <SupportChatWorkspace
        dict={dict}
        mode="teacher"
        filterStudentUserId={selectedStudent.studentUserId}
        studentDisplayName={selectedStudent.displayName}
        onBackToStudents={handleBackToStudents}
        onStudentsRefresh={() => setStudentsRefreshToken((value) => value + 1)}
        onMobileChatViewChange={onMobileChatViewChange}
      />
    </div>
  );
}

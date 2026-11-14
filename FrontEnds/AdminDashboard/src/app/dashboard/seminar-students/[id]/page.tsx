'use client';

import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { mockSeminarUsers } from '@/lib/seminar-mock-data';
import { StudentProfile } from '@/components/seminar/students/student-profile';

export default function SeminarStudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const student = mockSeminarUsers.find((u) => u.id === studentId);

  if (!student) {
    notFound();
  }

  return <StudentProfile student={student} />;
}

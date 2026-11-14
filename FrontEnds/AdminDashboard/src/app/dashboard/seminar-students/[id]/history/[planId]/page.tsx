'use client';

import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { mockSeminarUsers } from '@/lib/seminar-mock-data';
import { PlanHistoryDetails } from '@/components/seminar/students/plan-history-details';

export default function PlanHistoryDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const planId = params?.planId as string;

  const student = mockSeminarUsers.find((u) => u.id === studentId);
  const planHistoryItem = student?.planHistory?.find((p) => p.id === planId);

  if (!student || !planHistoryItem) {
    notFound();
  }

  const paymentsForPlan =
    student.paymentHistory?.filter((p) => p.planId === planHistoryItem.id) || [];

  const classesForPlan = (student.classSchedule || []).filter((c) => {
    if (!planHistoryItem.startDate) return false;
    const classDate = new Date(c.date);
    const planStartDate = new Date(planHistoryItem.startDate);
    const planEndDate = planHistoryItem.endDate
      ? new Date(planHistoryItem.endDate)
      : new Date();
    return classDate >= planStartDate && classDate <= planEndDate;
  });

  return (
    <PlanHistoryDetails
      student={student}
      plan={planHistoryItem}
      payments={paymentsForPlan}
      classes={classesForPlan}
    />
  );
}

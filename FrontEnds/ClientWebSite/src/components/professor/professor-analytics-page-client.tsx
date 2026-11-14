'use client';

import { ProfessorRevenueChart } from '@/components/professor/dashboard/professor-revenue-chart';
import type { Dictionary } from '@/types';

export function ProfessorAnalyticsPageClient({ dict }: { dict: Dictionary }) {
  return <ProfessorRevenueChart dict={dict} />;
}

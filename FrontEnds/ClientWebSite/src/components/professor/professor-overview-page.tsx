'use client';

import { ProfessorDashboardStats } from '@/components/professor/dashboard/professor-dashboard-stats';
import { ProfessorAdPlanStatusPanel } from '@/components/professor/dashboard/professor-ad-plan-status-panel';
import { ProfessorXpPanel } from '@/components/professor/dashboard/professor-xp-panel';
import { ProfessorRevenueChart } from '@/components/professor/dashboard/professor-revenue-chart';
import type { Dictionary } from '@/types';

export function ProfessorOverviewPage({ dict }: { dict: Dictionary }) {
  return (
    <div className="space-y-6">
      <ProfessorDashboardStats dict={dict} />
      <ProfessorAdPlanStatusPanel dict={dict} />
      <ProfessorXpPanel dict={dict} />
      <ProfessorRevenueChart dict={dict} />
    </div>
  );
}

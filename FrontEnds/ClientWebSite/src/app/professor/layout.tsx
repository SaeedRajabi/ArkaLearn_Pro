import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { AuthGuard } from '@/contexts/auth-guard';
import { ProfessorRoleGuard } from '@/components/professor/professor-role-guard';
import { ProfessorDashboardShell } from '@/components/professor/dashboard/professor-dashboard-layout';

export default async function ProfessorLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return (
    <AuthGuard>
      <ProfessorRoleGuard>
        <ProfessorDashboardShell dict={dict}>{children}</ProfessorDashboardShell>
      </ProfessorRoleGuard>
    </AuthGuard>
  );
}

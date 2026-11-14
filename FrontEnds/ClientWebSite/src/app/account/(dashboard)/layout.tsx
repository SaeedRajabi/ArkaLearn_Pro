import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { StudentDashboardShell } from '@/components/account/dashboard/student-dashboard-shell';

export default async function AccountDashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return <StudentDashboardShell dict={dict}>{children}</StudentDashboardShell>;
}

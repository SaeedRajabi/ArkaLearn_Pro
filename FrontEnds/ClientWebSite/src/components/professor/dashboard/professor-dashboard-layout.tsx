'use client';

import * as React from 'react';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';
import { ProfessorDashboardProvider } from './professor-dashboard-context';
import { ProfessorDashboardHero } from './professor-dashboard-hero';
import { ProfessorDashboardMobileNav } from './professor-dashboard-mobile-nav';
import {
  ProfessorDashboardMain,
  ProfessorNavPendingProvider,
} from './professor-dashboard-nav-pending';
import { ProfessorDashboardSidebar } from './professor-dashboard-sidebar';
import './professor-dashboard.css';

function ProfessorDashboardShellInner({
  dict,
  children,
}: {
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';

  return (
    <div className="professor-dashboard min-h-screen" dir={dir}>
      <ProfessorDashboardHero dict={dict} />

      <div className="container px-4 pb-10">
        <div className="mb-4 lg:hidden">
          <ProfessorDashboardMobileNav dict={dict} />
        </div>

        <div
          className={cn(
            'flex flex-col gap-6 lg:gap-8',
            isRtl ? 'lg:flex-row' : 'lg:flex-row-reverse'
          )}
        >
          <aside className="hidden w-full shrink-0 lg:block lg:w-72">
            <ProfessorDashboardSidebar dict={dict} />
          </aside>

          <ProfessorDashboardMain>{children}</ProfessorDashboardMain>
        </div>
      </div>
    </div>
  );
}

export function ProfessorDashboardShell({
  dict,
  children,
}: {
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <ProfessorDashboardProvider>
      <ProfessorNavPendingProvider>
        <ProfessorDashboardShellInner dict={dict}>{children}</ProfessorDashboardShellInner>
      </ProfessorNavPendingProvider>
    </ProfessorDashboardProvider>
  );
}

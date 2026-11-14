'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';
import { StudentDashboardProvider } from './student-dashboard-context';
import { StudentDashboardHero } from './student-dashboard-hero';
import { StudentDashboardMobileNav } from './student-dashboard-mobile-nav';
import { StudentDashboardSidebar } from './student-dashboard-sidebar';
import { StudentDashboardNavProvider, useStudentDashboardNav } from './student-dashboard-nav-context';
import { PhoneVerifyBanner } from '@/components/auth/phone-verify-banner';
import './student-dashboard.css';

function StudentDashboardShellInner({
  dict,
  enrolledCoursesCount,
  children,
}: {
  dict: Dictionary;
  enrolledCoursesCount: number;
  children: React.ReactNode;
}) {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { activeView, setActiveView } = useStudentDashboardNav();

  return (
    <div dir={dir} className="student-dashboard min-h-screen">
      <StudentDashboardHero
        dict={dict}
        setActiveView={setActiveView}
        enrolledCoursesCount={enrolledCoursesCount}
      />

      <div className="container px-4 pb-10">
        <div className="mb-4">
          <PhoneVerifyBanner dict={dict} href="/account?view=profile" className="mb-4" />
          <StudentDashboardMobileNav dict={dict} activeView={activeView} setActiveView={setActiveView} />
        </div>

        <div
          className={cn(
            'flex flex-col gap-6 lg:gap-8',
            isRtl ? 'lg:flex-row' : 'lg:flex-row-reverse'
          )}
        >
          <aside className="hidden w-full shrink-0 lg:block lg:w-72">
            <StudentDashboardSidebar
              dict={dict}
              activeView={activeView}
              setActiveView={setActiveView}
              enrolledCoursesCount={enrolledCoursesCount}
            />
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function StudentDashboardShell({
  dict,
  children,
}: {
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const [enrolledCourseSlugs, setEnrolledCourseSlugs] = React.useState<string[]>([]);

  React.useEffect(() => {
    const slugs = JSON.parse(localStorage.getItem('enrolledCourseSlugs') || '[]');
    setEnrolledCourseSlugs(Array.isArray(slugs) ? slugs : []);
  }, []);

  return (
    <StudentDashboardProvider>
      <Suspense fallback={children}>
        <StudentDashboardNavProvider>
          <StudentDashboardShellInner dict={dict} enrolledCoursesCount={enrolledCourseSlugs.length}>
            {children}
          </StudentDashboardShellInner>
        </StudentDashboardNavProvider>
      </Suspense>
    </StudentDashboardProvider>
  );
}

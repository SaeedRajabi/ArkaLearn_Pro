'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { resolveUserProfileImageUrl } from '@/lib/utils/image-url';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

import { Sidebar, type DashboardView } from './dashboard/sidebar';
import { Overview } from './dashboard/overview';
import { MyCourses } from './dashboard/my-courses';
import { MySeminars } from './dashboard/my-seminars';
import { MyEducationPlans } from './dashboard/my-education-plans';
import { Invoices } from './dashboard/invoices';
import { SharedFiles } from './dashboard/shared-files';
import { Favorites } from './dashboard/favorites';
import { ProfileForm } from './dashboard/profile-form';
import { PhoneChangeForm } from './dashboard/phone-change-form';
import { PhoneVerifyForm } from './dashboard/phone-verify-form';
import { EmailVerifyForm } from './dashboard/email-verify-form';
import { EmailChangeForm } from './dashboard/email-change-form';
import { StudentDashboardContent } from './dashboard/student-dashboard-content';
import { isProfessorRole } from '@/lib/auth/roles';

interface DashboardPageProps {
  dict: Dictionary;
}

export default function DashboardPage({ dict }: DashboardPageProps) {
  const { dir } = useLanguage();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const [enrolledCourseSlugs, setEnrolledCourseSlugs] = useState<string[]>([]);
  const isRtl = dir === 'rtl';
  const showStudentHero = !user?.role || !isProfessorRole(user.role);

  useEffect(() => {
    const slugs = JSON.parse(localStorage.getItem('enrolledCourseSlugs') || '[]');
    setEnrolledCourseSlugs(Array.isArray(slugs) ? slugs : []);

    const purchaseCompleted = localStorage.getItem('purchaseCompleted');
    if (purchaseCompleted) {
      setActiveView('my-courses');
      localStorage.removeItem('purchaseCompleted');
    }

    const viewParam = new URLSearchParams(window.location.search).get('view');
    const validViews: DashboardView[] = [
      'dashboard',
      'my-courses',
      'my-seminars',
      'education-plans',
      'invoices',
      'shared-files',
      'favorites',
      'profile',
    ];
    if (viewParam && validViews.includes(viewParam as DashboardView)) {
      setActiveView(viewParam as DashboardView);
    }
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Overview dict={dict} enrolledCoursesCount={enrolledCourseSlugs.length} />;
      case 'my-courses':
        return <MyCourses dict={dict} />;
      case 'my-seminars':
        return <MySeminars dict={dict} />;
      case 'education-plans':
        return <MyEducationPlans dict={dict} />;
      case 'invoices':
        return <Invoices dict={dict} />;
      case 'shared-files':
        return <SharedFiles dict={dict} />;
      case 'favorites':
        return <Favorites dict={dict} />;
      case 'profile':
        return (
          <div className="space-y-6">
            <ProfileForm dict={dict} user={user} />
            <EmailVerifyForm dict={dict} user={user} />
            <EmailChangeForm dict={dict} user={user} />
            <PhoneVerifyForm dict={dict} user={user} />
            <PhoneChangeForm dict={dict} />
          </div>
        );
      default:
        return <Overview dict={dict} enrolledCoursesCount={enrolledCourseSlugs.length} />;
    }
  };

  if (showStudentHero) {
    return <StudentDashboardContent dict={dict} />;
  }

  const userInitials =
    user?.userName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ||
    user?.userName?.slice(0, 2).toUpperCase() ||
    'U';
  const dashboardTitle = getDictValue(dict, 'dashboard.title', 'Dashboard');
  const dashboardSubtitle = getDictValue(
    dict,
    'dashboard.subtitle',
    'Welcome to your personal dashboard. Manage your courses and account settings here.'
  );
  const welcomeBack = getDictValue(dict, 'dashboard.welcome.back', 'Welcome back,');
  const activeStudent = getDictValue(dict, 'dashboard.welcome.activeStudent', 'Active Student');
  const activeProfessor = getDictValue(dict, 'professorDashboard.welcome.activeProfessor', 'Active Professor');
  const roleBadge = user?.role && isProfessorRole(user.role) ? activeProfessor : activeStudent;

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <div className="border-b bg-gradient-to-b from-muted/40 to-background pb-6 pt-8 sm:pb-8 sm:pt-12">
        <div className="container px-4 text-center">
          <h1 className="mb-3 text-2xl font-bold font-headline tracking-tight sm:text-4xl">{dashboardTitle}</h1>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-lg">{dashboardSubtitle}</p>
        </div>
      </div>

      <div className="container px-4 py-5 sm:py-8">
        <div className={cn('flex flex-col gap-6 lg:gap-8', isRtl ? 'lg:flex-row' : 'lg:flex-row-reverse')}>
          <aside className="hidden w-full shrink-0 self-start lg:sticky lg:top-24 lg:block lg:w-64">
            <Sidebar
              dict={dict}
              activeView={activeView}
              setActiveView={setActiveView}
              enrolledCoursesCount={enrolledCourseSlugs.length}
            />
          </aside>

          <main className="min-w-0 flex-1">
            <div
              className={cn(
                'mb-6 flex flex-col items-center gap-4 rounded-xl border bg-card p-4 shadow-sm sm:mb-8 sm:gap-6 sm:p-6',
                isRtl ? 'sm:flex-row-reverse' : 'sm:flex-row'
              )}
            >
              <Avatar className="h-20 w-20 border-4 border-background shadow-md sm:h-24 sm:w-24">
                <AvatarImage src={resolveUserProfileImageUrl(user?.profileImage)} alt={user?.fullName || 'User'} />
                <AvatarFallback className="text-xl">{userInitials}</AvatarFallback>
              </Avatar>
              <div className={cn('flex-1 text-center', isRtl ? 'sm:text-right' : 'sm:text-left')}>
                <h2 className="mb-1 text-xl font-bold font-headline sm:text-2xl">
                  {welcomeBack} {user?.userName || user?.fullName || 'User'}!
                </h2>
                <p className="mb-2 text-sm text-muted-foreground">{user?.email || ''}</p>
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  {roleBadge}
                </span>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{renderActiveView()}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

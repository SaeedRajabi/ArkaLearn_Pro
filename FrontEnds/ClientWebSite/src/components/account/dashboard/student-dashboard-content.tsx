'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { Dictionary } from '@/types';
import { Overview } from './overview';
import { MyCourses } from './my-courses';
import { MyExams } from './my-exams';
import { MySeminars } from './my-seminars';
import { MyEducationPlans } from './my-education-plans';
import { Invoices } from './invoices';
import { SharedFiles } from './shared-files';
import { Favorites } from './favorites';
import { StudentSupportChatsView, StudentSupportFreezeView } from './my-student-support';
import { ProfileForm } from './profile-form';
import { PhoneChangeForm } from './phone-change-form';
import { PhoneVerifyForm } from './phone-verify-form';
import { EmailVerifyForm } from './email-verify-form';
import { EmailChangeForm } from './email-change-form';
import { StudentWalletPanel } from './student-wallet-panel';
import { getStudentDashboardViewLabel } from './student-dashboard-nav';
import { useStudentDashboardNav } from './student-dashboard-nav-context';

export function StudentDashboardContent({ dict }: { dict: Dictionary }) {
  const { user } = useAuth();
  const { activeView } = useStudentDashboardNav();
  const [enrolledCourseSlugs, setEnrolledCourseSlugs] = useState<string[]>([]);

  useEffect(() => {
    const slugs = JSON.parse(localStorage.getItem('enrolledCourseSlugs') || '[]');
    setEnrolledCourseSlugs(Array.isArray(slugs) ? slugs : []);
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Overview dict={dict} enrolledCoursesCount={enrolledCourseSlugs.length} />;
      case 'my-courses':
        return <MyCourses dict={dict} />;
      case 'my-exams':
        return <MyExams dict={dict} />;
      case 'my-seminars':
        return <MySeminars dict={dict} />;
      case 'education-plans':
        return <MyEducationPlans dict={dict} />;
      case 'invoices':
        return <Invoices dict={dict} />;
      case 'wallet':
        return <StudentWalletPanel dict={dict} />;
      case 'shared-files':
        return <SharedFiles dict={dict} />;
      case 'support-chats':
        return <StudentSupportChatsView dict={dict} />;
      case 'support-freeze':
        return <StudentSupportFreezeView dict={dict} />;
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

  const activeLabel = getStudentDashboardViewLabel(dict, activeView);

  return (
    <>
      <div className="mb-4 lg:hidden">
        <h2 className="text-lg font-semibold">{activeLabel}</h2>
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{renderActiveView()}</div>
    </>
  );
}

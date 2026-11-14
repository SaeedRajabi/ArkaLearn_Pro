'use client';

import {
  LayoutDashboard,
  BookCopy,
  Presentation,
  ClipboardList,
  FileCheck,
  FileText,
  FolderDown,
  Heart,
  MessageCircle,
  User,
  LogOut,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

import type { DashboardView } from './student-dashboard-nav';

export type { DashboardView };

export function getDashboardMenuItems(dict: Dictionary) {
  return [
    { id: 'dashboard' as const, icon: LayoutDashboard, label: getDictValue(dict, 'dashboard.menu.dashboard', 'Dashboard') },
    { id: 'my-courses' as const, icon: BookCopy, label: getDictValue(dict, 'dashboard.menu.myCourses', 'My Courses') },
    { id: 'my-exams' as const, icon: FileCheck, label: getDictValue(dict, 'dashboard.menu.myExams', 'My Exams') },
    { id: 'my-seminars' as const, icon: Presentation, label: getDictValue(dict, 'dashboard.menu.mySeminars', 'My Seminars') },
    {
      id: 'education-plans' as const,
      icon: ClipboardList,
      label: getDictValue(dict, 'dashboard.menu.educationPlans', 'Educational Plans'),
    },
    { id: 'invoices' as const, icon: FileText, label: getDictValue(dict, 'dashboard.menu.invoices', 'Invoices') },
    { id: 'wallet' as const, icon: Wallet, label: getDictValue(dict, 'dashboard.menu.wallet', 'Wallet') },
    { id: 'shared-files' as const, icon: FolderDown, label: getDictValue(dict, 'dashboard.menu.sharedFiles', 'Shared Files') },
    { id: 'support-chats' as const, icon: MessageCircle, label: getDictValue(dict, 'dashboard.menu.supportChats', 'Conversations') },
    { id: 'favorites' as const, icon: Heart, label: getDictValue(dict, 'dashboard.menu.favorites', 'Favorites') },
    { id: 'profile' as const, icon: User, label: getDictValue(dict, 'dashboard.menu.profile', 'Edit Profile') },
  ];
}

interface SidebarProps {
  dict: Dictionary;
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  enrolledCoursesCount: number;
  variant?: 'default' | 'student';
}

export function Sidebar({ dict, activeView, setActiveView, enrolledCoursesCount, variant = 'default' }: SidebarProps) {
  const { logout } = useAuth();
  const menuItems = getDashboardMenuItems(dict);
  const isStudent = variant === 'student';

  return (
    <nav
      className={cn(
        isStudent
          ? 'student-dashboard__sidebar space-y-1 rounded-2xl border bg-card p-2 shadow-sm'
          : 'flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm'
      )}
    >
      <div className={cn(isStudent ? 'space-y-1' : 'flex-1 overflow-y-auto')}>
        {menuItems.map((item) => {
          const active = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isStudent
                  ? active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-muted hover:text-primary'
                  : cn(
                      'rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary',
                      active && 'bg-muted text-primary'
                    )
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-start">{item.label}</span>
              {item.id === 'my-courses' && enrolledCoursesCount > 0 ? (
                <span
                  className={cn(
                    'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[10px]',
                    isStudent && active
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  {enrolledCoursesCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isStudent
            ? 'text-destructive hover:bg-destructive/10'
            : 'mt-auto border-t p-4 text-muted-foreground hover:text-primary'
        )}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>{getDictValue(dict, 'dashboard.menu.logout', 'Logout')}</span>
      </button>
    </nav>
  );
}

'use client';

import * as React from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import {
  getStudentDashboardNavEntries,
  isStudentDashboardNavGroupActive,
  type DashboardView,
} from './student-dashboard-nav';

function StudentDashboardNavGroupSection({
  group,
  activeView,
  setActiveView,
  enrolledCoursesCount,
}: {
  group: ReturnType<typeof getStudentDashboardNavEntries>[number] & { type: 'group' };
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  enrolledCoursesCount: number;
}) {
  const isActive = isStudentDashboardNavGroupActive(activeView, group);
  const [expanded, setExpanded] = React.useState(isActive);

  React.useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  return (
    <div className="student-dashboard__sidebar-group">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive ? 'text-primary' : 'text-foreground hover:bg-muted hover:text-primary'
        )}
      >
        <group.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-start">{group.label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="mt-0.5 space-y-0.5 border-s-2 border-primary/15 ps-2 ms-3">
          {group.items.map((item) => {
            const active = activeView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-primary'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-start">{item.label}</span>
                {item.id === 'my-courses' && enrolledCoursesCount > 0 ? (
                  <span
                    className={cn(
                      'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[10px]',
                      active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary text-primary-foreground'
                    )}
                  >
                    {enrolledCoursesCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function StudentDashboardSidebar({
  dict,
  activeView,
  setActiveView,
  enrolledCoursesCount,
}: {
  dict: Dictionary;
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  enrolledCoursesCount: number;
}) {
  const { logout } = useAuth();
  const navEntries = getStudentDashboardNavEntries(dict);

  return (
    <nav className="student-dashboard__sidebar space-y-1 rounded-2xl border bg-card p-2 shadow-sm">
      {navEntries.map((entry) => {
        if (entry.type === 'link') {
          const active = activeView === entry.id;
          const Icon = entry.icon;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setActiveView(entry.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-muted hover:text-primary'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-start">{entry.label}</span>
            </button>
          );
        }

        return (
          <StudentDashboardNavGroupSection
            key={entry.id}
            group={entry}
            activeView={activeView}
            setActiveView={setActiveView}
            enrolledCoursesCount={enrolledCoursesCount}
          />
        );
      })}

      <button
        type="button"
        onClick={() => void logout()}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>{getDictValue(dict, 'dashboard.menu.logout', 'Logout')}</span>
      </button>
    </nav>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import {
  getProfessorDashboardNavEntries,
  isProfessorDashboardNavActive,
  isProfessorDashboardNavGroupActive,
} from './professor-dashboard-nav';
import { useProfessorNavPending } from './professor-dashboard-nav-pending';

function ProfessorDashboardNavGroupSection({
  group,
  pathname,
}: {
  group: ReturnType<typeof getProfessorDashboardNavEntries>[number] & { type: 'group' };
  pathname: string;
}) {
  const { beginPendingNavigation } = useProfessorNavPending();
  const isActive = isProfessorDashboardNavGroupActive(pathname, group);
  const [expanded, setExpanded] = React.useState(isActive);

  React.useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive, pathname]);

  return (
    <div className="professor-dashboard__sidebar-group">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          'professor-dashboard__sidebar-group-trigger flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
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
        <div className="professor-dashboard__sidebar-group-items mt-0.5 space-y-0.5">
          {group.items.map((item) => {
            const active = isProfessorDashboardNavActive(pathname, item.href, item.exact);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => beginPendingNavigation(item.href)}
                className={cn(
                  'professor-dashboard__sidebar-link professor-dashboard__sidebar-sublink flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-primary'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function ProfessorDashboardSidebar({ dict }: { dict: Dictionary }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { beginPendingNavigation } = useProfessorNavPending();
  const navEntries = getProfessorDashboardNavEntries(dict);

  return (
    <nav className="professor-dashboard__sidebar space-y-1 rounded-2xl border bg-card p-2 shadow-sm">
      {navEntries.map((entry) => {
        if (entry.type === 'link') {
          const active = isProfessorDashboardNavActive(pathname, entry.href, entry.exact);
          const Icon = entry.icon;

          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={() => beginPendingNavigation(entry.href)}
              className={cn(
                'professor-dashboard__sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-muted hover:text-primary'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{entry.label}</span>
            </Link>
          );
        }

        return <ProfessorDashboardNavGroupSection key={entry.id} group={entry} pathname={pathname} />;
      })}

      <button
        type="button"
        onClick={() => void logout()}
        className="professor-dashboard__sidebar-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>{getDictValue(dict, 'dashboard.menu.logout', 'Log out')}</span>
      </button>
    </nav>
  );
}

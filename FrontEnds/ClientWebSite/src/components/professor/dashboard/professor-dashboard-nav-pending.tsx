'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ProfessorNavPendingContextValue = {
  pendingHref: string | null;
  beginPendingNavigation: (href: string) => void;
};

const ProfessorNavPendingContext = React.createContext<ProfessorNavPendingContextValue>({
  pendingHref: null,
  beginPendingNavigation: () => undefined,
});

export function useProfessorNavPending() {
  return React.useContext(ProfessorNavPendingContext);
}

function normalizePath(href: string): string {
  try {
    const url = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://local');
    return url.pathname.replace(/\/$/, '') || '/';
  } catch {
    return href.split('?')[0]?.replace(/\/$/, '') || href;
  }
}

export function ProfessorNavPendingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);
  const pathnameNorm = normalizePath(pathname);
  const clearTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const beginPendingNavigation = React.useCallback(
    (href: string) => {
      const next = normalizePath(href);
      if (!next || next === pathnameNorm) return;
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      setPendingHref(next);
    },
    [pathnameNorm]
  );

  React.useEffect(() => {
    if (!pendingHref) return;
    if (pathnameNorm !== pendingHref && !pathnameNorm.startsWith(`${pendingHref}/`)) {
      return;
    }

    // Wait until the new route children have committed before revealing them.
    // Clearing immediately caused a blank/white flash between skeleton and content.
    clearTimerRef.current = setTimeout(() => {
      clearTimerRef.current = null;
      setPendingHref(null);
    }, 120);

    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };
  }, [pathnameNorm, pendingHref]);

  React.useEffect(() => {
    if (!pendingHref) return;
    const timer = window.setTimeout(() => setPendingHref(null), 12000);
    return () => window.clearTimeout(timer);
  }, [pendingHref]);

  const value = React.useMemo(
    () => ({ pendingHref, beginPendingNavigation }),
    [pendingHref, beginPendingNavigation]
  );

  return (
    <ProfessorNavPendingContext.Provider value={value}>{children}</ProfessorNavPendingContext.Provider>
  );
}

/** Instant content-area skeleton while professor dashboard section routes change. */
export function ProfessorDashboardContentSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ProfessorDashboardMain({ children }: { children: React.ReactNode }) {
  const { pendingHref } = useProfessorNavPending();
  const isPending = pendingHref != null;

  return (
    <main className="relative min-w-0 flex-1">
      {/* Keep route children mounted so Next can stream the next page without a remount/white flash. */}
      <div
        className={cn(
          'min-w-0',
          isPending && 'pointer-events-none invisible absolute inset-x-0 top-0'
        )}
        aria-hidden={isPending}
      >
        {children}
      </div>
      {isPending ? (
        <div className="relative z-10 min-w-0">
          <ProfessorDashboardContentSkeleton />
        </div>
      ) : null}
    </main>
  );
}

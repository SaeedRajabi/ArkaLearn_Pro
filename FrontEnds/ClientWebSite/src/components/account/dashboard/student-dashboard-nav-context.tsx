'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  STUDENT_DASHBOARD_VIEW_HREFS,
  STUDENT_DASHBOARD_VIEWS,
  normalizeDashboardView,
  type DashboardView,
} from './student-dashboard-nav';

function viewToPath(view: DashboardView): string {
  const dedicated = STUDENT_DASHBOARD_VIEW_HREFS[view];
  if (dedicated) return dedicated;
  return view === 'dashboard' ? '/account' : `/account?view=${view}`;
}

function resolveDedicatedView(pathname: string | null): DashboardView | null {
  if (!pathname) return null;
  if (pathname.startsWith('/account/desktop-app')) return 'desktop-app';
  if (pathname.startsWith('/account/remote-assist')) return 'remote-assist';
  return null;
}

function isDedicatedAccountRoute(pathname: string | null): boolean {
  return resolveDedicatedView(pathname) != null;
}

function viewFromLocation(pathname: string | null, searchParams: URLSearchParams): DashboardView {
  const dedicated = resolveDedicatedView(pathname);
  if (dedicated) return dedicated;
  return normalizeDashboardView(searchParams.get('view')) ?? 'dashboard';
}

type StudentDashboardNavContextValue = {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
};

const StudentDashboardNavContext = React.createContext<StudentDashboardNavContextValue | null>(null);

export function StudentDashboardNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeView, setActiveViewState] = React.useState<DashboardView>(() =>
    viewFromLocation(pathname, searchParams)
  );

  React.useEffect(() => {
    setActiveViewState(viewFromLocation(pathname, searchParams));

    const purchaseCompleted = localStorage.getItem('purchaseCompleted');
    if (purchaseCompleted) {
      setActiveViewState('my-courses');
      localStorage.removeItem('purchaseCompleted');
      window.history.replaceState(null, '', viewToPath('my-courses'));
    }

    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveViewState(viewFromLocation(window.location.pathname, params));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [pathname, searchParams]);

  const setActiveView = React.useCallback(
    (view: DashboardView) => {
      if (!STUDENT_DASHBOARD_VIEWS.includes(view)) return;

      const dedicated = STUDENT_DASHBOARD_VIEW_HREFS[view];
      if (dedicated) {
        setActiveViewState(view);
        router.push(dedicated);
        return;
      }

      // Leaving a dedicated route back into the account view switcher.
      if (isDedicatedAccountRoute(pathname)) {
        setActiveViewState(view);
        router.push(viewToPath(view));
        return;
      }

      setActiveViewState(view);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', viewToPath(view));
      }
    },
    [pathname, router]
  );

  const value = React.useMemo(
    () => ({ activeView, setActiveView }),
    [activeView, setActiveView]
  );

  return (
    <StudentDashboardNavContext.Provider value={value}>{children}</StudentDashboardNavContext.Provider>
  );
}

export function useStudentDashboardNav(): StudentDashboardNavContextValue {
  const ctx = React.useContext(StudentDashboardNavContext);
  if (!ctx) {
    throw new Error('useStudentDashboardNav must be used within StudentDashboardNavProvider');
  }
  return ctx;
}

export type { DashboardView };

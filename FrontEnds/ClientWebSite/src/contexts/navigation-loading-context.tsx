'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import { shouldSuppressNavigationLoading } from '@/lib/auth/navigation-suppress';

export type NavigationLoadPhase = 'idle' | 'loading' | 'complete';

interface NavigationLoadingContextValue {
  phase: NavigationLoadPhase;
  /** Start global main-content loading (for programmatic `router.push`). */
  beginLoading: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextValue>({
  phase: 'idle',
  beginLoading: () => undefined,
});

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext);
}

function isInternalNavigationHref(href: string): boolean {
  if (!href || href.startsWith('#')) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
    return false;
  }
  try {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return href.startsWith('/');
  }
}

/** Professor dashboard uses in-content skeletons; skip global progress/overlay. */
function isProfessorDashboardSoftNavigation(nextHref?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith('/professor')) return false;
  if (!nextHref) return true;
  try {
    const nextPath = new URL(nextHref, window.location.href).pathname;
    return nextPath.startsWith('/professor');
  } catch {
    return nextHref.startsWith('/professor');
  }
}

/** Auth soft transitions (login → dashboard, logout → home). */
function isAuthSoftNavigation(nextHref?: string | null): boolean {
  if (shouldSuppressNavigationLoading()) return true;
  if (typeof window === 'undefined' || !nextHref) return false;
  try {
    const nextPath = new URL(nextHref, window.location.href).pathname;
    const currentPath = window.location.pathname;
    // Leaving protected areas toward home, or entering dashboards from auth pages.
    if (nextPath === '/' && (currentPath.startsWith('/account') || currentPath.startsWith('/professor'))) {
      return true;
    }
    if (
      (nextPath.startsWith('/account') || nextPath.startsWith('/professor')) &&
      (currentPath.startsWith('/login') || currentPath.startsWith('/register'))
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const [phase, setPhase] = useState<NavigationLoadPhase>('idle');
  const phaseRef = useRef(phase);
  const routeKeyRef = useRef(`${pathname}?${search}`);
  const isFirstRouteRef = useRef(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const softNavActiveRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    hideTimerRef.current = null;
    safetyTimerRef.current = null;
  }, []);

  const beginLoading = useCallback(() => {
    if (shouldSuppressNavigationLoading() || isAuthSoftNavigation()) {
      softNavActiveRef.current = true;
      return;
    }
    clearTimers();
    phaseRef.current = 'loading';
    setPhase('loading');

    safetyTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'loading') {
        phaseRef.current = 'idle';
        setPhase('idle');
      }
    }, 20000);
  }, [clearTimers]);

  const scheduleIdle = useCallback(
    (delayMs: number) => {
      hideTimerRef.current = setTimeout(() => {
        phaseRef.current = 'idle';
        setPhase('idle');
      }, delayMs);
    },
    []
  );

  /** Ends navigation loading and always returns UI to idle (avoids stuck "complete" dots). */
  const settleNavigation = useCallback(() => {
    clearTimers();

    if (phaseRef.current === 'loading') {
      phaseRef.current = 'complete';
      setPhase('complete');
      scheduleIdle(350);
      return;
    }

    if (phaseRef.current === 'complete') {
      phaseRef.current = 'idle';
      setPhase('idle');
      return;
    }
  }, [clearTimers, scheduleIdle]);

  const finishLoading = useCallback(() => {
    settleNavigation();
  }, [settleNavigation]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const currentRoute = `${pathname}?${search}`;

    if (isFirstRouteRef.current) {
      isFirstRouteRef.current = false;
      routeKeyRef.current = currentRoute;
      return;
    }

    if (routeKeyRef.current !== currentRoute) {
      routeKeyRef.current = currentRoute;
      softNavActiveRef.current = false;
      settleNavigation();
    }
  }, [pathname, search, settleNavigation]);

  // Failsafe: never keep the overlay visible after the route has settled.
  useEffect(() => {
    const failsafe = setTimeout(() => {
      if (phaseRef.current === 'idle') return;
      clearTimers();
      phaseRef.current = 'idle';
      setPhase('idle');
    }, 1200);

    return () => clearTimeout(failsafe);
  }, [pathname, search, clearTimers]);

  useEffect(() => {
    const originalStart = NProgress.start.bind(NProgress);
    const originalDone = NProgress.done.bind(NProgress);

    NProgress.start = (...args: Parameters<typeof NProgress.start>) => {
      if (
        softNavActiveRef.current ||
        shouldSuppressNavigationLoading() ||
        isProfessorDashboardSoftNavigation() ||
        isAuthSoftNavigation()
      ) {
        softNavActiveRef.current = true;
        return NProgress;
      }
      beginLoading();
      return originalStart(...args);
    };

    NProgress.done = (...args: Parameters<typeof NProgress.done>) => {
      if (softNavActiveRef.current) {
        softNavActiveRef.current = false;
        return originalDone(...args);
      }
      finishLoading();
      return originalDone(...args);
    };

    return () => {
      NProgress.start = originalStart;
      NProgress.done = originalDone;
      clearTimers();
    };
  }, [beginLoading, clearTimers, finishLoading]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || !isInternalNavigationHref(href)) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      try {
        const next = new URL(href, window.location.href);
        const current = new URL(window.location.href);
        if (
          next.pathname === current.pathname &&
          next.search === current.search &&
          next.hash === current.hash
        ) {
          return;
        }

        if (isProfessorDashboardSoftNavigation(href) || isAuthSoftNavigation(href)) {
          softNavActiveRef.current = true;
          return;
        }
      } catch {
        /* proceed */
      }

      beginLoading();
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [beginLoading]);

  return (
    <NavigationLoadingContext.Provider value={{ phase, beginLoading }}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}

'use client';

import { useEffect } from 'react';

function shouldShowInitialLoading(): boolean {
  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

    if (navEntries.length > 0) {
      const navEntry = navEntries[0];
      if (navEntry.type === 'reload') return true;
      if (navEntry.type === 'navigate' && navEntry.transferSize > 0) return true;
      return false;
    }

    return !sessionStorage.getItem('_app_has_shown_loading');
  } catch {
    return !sessionStorage.getItem('_app_has_shown_loading');
  }
}

function dismissInitialLoadingScreen() {
  document.getElementById('initial-loading-screen')?.remove();
}

/**
 * Keeps the inline first-paint splash (#initial-loading-screen) visible until the
 * page is ready, then removes it. Does not render a second loading UI.
 */
export function InitialLoading() {
  useEffect(() => {
    const initialLoadingScreen = document.getElementById('initial-loading-screen');

    if (!initialLoadingScreen && !shouldShowInitialLoading()) {
      return;
    }

    if (!shouldShowInitialLoading()) {
      dismissInitialLoadingScreen();
      return;
    }

    try {
      sessionStorage.setItem('_app_has_shown_loading', 'true');
    } catch {
      /* ignore */
    }

    const finish = () => {
      dismissInitialLoadingScreen();
    };

    if (document.readyState === 'complete') {
      finish();
      return;
    }

    window.addEventListener('load', finish, { once: true });
    return () => window.removeEventListener('load', finish);
  }, []);

  return null;
}

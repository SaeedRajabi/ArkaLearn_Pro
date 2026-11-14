'use client';

import { Suspense } from 'react';
import { NavigationLoadingProvider } from '@/contexts/navigation-loading-context';

/**
 * useSearchParams() inside the provider can re-suspend on client navigations.
 * Using `fallback={null}` made the entire site shell flash white; keep showing
 * the current tree while the provider resolves.
 */
export function NavigationLoadingBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <NavigationLoadingProvider>{children}</NavigationLoadingProvider>
    </Suspense>
  );
}

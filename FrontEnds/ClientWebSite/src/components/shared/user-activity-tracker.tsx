'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getOrCreateVisitorKey, trackUserActivity } from '@/lib/api/user-activity';

const MIN_TRACK_INTERVAL_MS = 1500;

export function UserActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const lastTrackedRef = useRef<string>('');
  const lastAtRef = useRef(0);

  useEffect(() => {
    const route = `${pathname}${search ? `?${search}` : ''}`;
    const now = Date.now();

    // Deduplicate rapid re-renders of the same route; always track the first visit.
    if (lastTrackedRef.current === route && now - lastAtRef.current < MIN_TRACK_INTERVAL_MS) {
      return;
    }

    lastTrackedRef.current = route;
    lastAtRef.current = now;

    const visitorKey = getOrCreateVisitorKey();
    const pageTitle = typeof document !== 'undefined' ? document.title : '';
    const referrer = typeof document !== 'undefined' ? document.referrer : '';

    void trackUserActivity({
      visitorKey,
      actionType: 'PageView',
      actionTitle: pageTitle ? `بازدید: ${pageTitle}` : `بازدید از ${route}`,
      pagePath: route,
      pageTitle,
      referrer,
      siteSource: 'client',
      metadataJson: JSON.stringify({
        language: typeof navigator !== 'undefined' ? navigator.language : '',
        screen: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
      }),
    });
  }, [pathname, search]);

  return null;
}

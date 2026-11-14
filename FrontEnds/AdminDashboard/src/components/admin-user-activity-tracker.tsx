'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackAdminUserActivity } from '@/services/user-activity-api.service';

const VISITOR_KEY_STORAGE = 'arka_admin_visitor_key';
const MIN_TRACK_INTERVAL_MS = 1500;

function getOrCreateVisitorKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = localStorage.getItem(VISITOR_KEY_STORAGE);
    if (existing) return existing;
    const created = crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(VISITOR_KEY_STORAGE, created);
    return created;
  } catch {
    return crypto.randomUUID().replace(/-/g, '');
  }
}

export function AdminUserActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const lastTrackedRef = useRef('');
  const lastAtRef = useRef(0);

  useEffect(() => {
    const route = `${pathname}${search ? `?${search}` : ''}`;
    const now = Date.now();
    if (lastTrackedRef.current === route && now - lastAtRef.current < MIN_TRACK_INTERVAL_MS) return;
    lastTrackedRef.current = route;
    lastAtRef.current = now;

    void trackAdminUserActivity({
      visitorKey: getOrCreateVisitorKey(),
      pagePath: route,
      pageTitle: typeof document !== 'undefined' ? document.title : '',
      actionTitle: typeof document !== 'undefined' && document.title
        ? `بازدید ادمین: ${document.title}`
        : `بازدید ادمین: ${route}`,
    });
  }, [pathname, search]);

  return null;
}

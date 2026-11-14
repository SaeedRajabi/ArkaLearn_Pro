'use client';

import * as React from 'react';
import { checkBackendHealth } from '@/lib/api/health';

export type SiteBackendPhase = 'online' | 'offline';

type BackendStatusContextValue = {
  phase: SiteBackendPhase;
  retryHealthCheck: () => Promise<void>;
};

const BackendStatusContext = React.createContext<BackendStatusContextValue>({
  phase: 'online',
  retryHealthCheck: async () => {},
});

export function useBackendStatus() {
  return React.useContext(BackendStatusContext);
}

/** Consecutive failed health checks before showing the overlay. */
const OFFLINE_THRESHOLD = 3;
/** Consecutive successful health checks before hiding the overlay. */
const ONLINE_THRESHOLD = 2;
const NORMAL_POLL_MS = 60_000;
const WATCH_POLL_MS = 10_000;

type PollMode = 'normal' | 'watch' | 'offline';

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = React.useState<SiteBackendPhase>('online');
  const [pollMode, setPollMode] = React.useState<PollMode>('normal');
  const phaseRef = React.useRef<SiteBackendPhase>('online');
  const failureStreakRef = React.useRef(0);
  const successStreakRef = React.useRef(0);
  const pollTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPhaseSafe = React.useCallback((next: SiteBackendPhase) => {
    phaseRef.current = next;
    setPhase(next);
    setPollMode(next === 'offline' ? 'offline' : 'normal');
  }, []);

  const runHealthCheck = React.useCallback(async () => {
    const result = await checkBackendHealth();

    if (result.ok) {
      failureStreakRef.current = 0;
      successStreakRef.current += 1;

      if (
        phaseRef.current === 'offline' &&
        successStreakRef.current >= ONLINE_THRESHOLD
      ) {
        successStreakRef.current = 0;
        setPhaseSafe('online');
        return;
      }

      if (phaseRef.current === 'online') {
        setPollMode('normal');
      }
      return;
    }

    successStreakRef.current = 0;
    failureStreakRef.current += 1;

    if (
      phaseRef.current === 'online' &&
      failureStreakRef.current >= OFFLINE_THRESHOLD
    ) {
      setPhaseSafe('offline');
      return;
    }

    if (phaseRef.current === 'online' && failureStreakRef.current > 0) {
      setPollMode('watch');
    }
  }, [setPhaseSafe]);

  const retryHealthCheck = React.useCallback(async () => {
    await runHealthCheck();
  }, [runHealthCheck]);

  React.useEffect(() => {
    void runHealthCheck();
  }, [runHealthCheck]);

  React.useEffect(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    const delay =
      pollMode === 'normal' ? NORMAL_POLL_MS : WATCH_POLL_MS;

    pollTimerRef.current = setTimeout(() => {
      void runHealthCheck();
    }, delay);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [pollMode, phase, runHealthCheck]);

  const value = React.useMemo(
    () => ({ phase, retryHealthCheck }),
    [phase, retryHealthCheck]
  );

  return <BackendStatusContext.Provider value={value}>{children}</BackendStatusContext.Provider>;
}

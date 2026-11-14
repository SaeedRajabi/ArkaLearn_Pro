'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

type UseMobileAudioUnlockOptions = {
  enabled: boolean;
  teacherAudioRef: RefObject<HTMLAudioElement | null>;
  retryKey?: string | number;
};

export function useMobileAudioUnlock({
  enabled,
  teacherAudioRef,
  retryKey,
}: UseMobileAudioUnlockOptions) {
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const unlockedRef = useRef(false);

  const tryPlayTeacherAudio = useCallback(async () => {
    const el = teacherAudioRef.current;
    if (!el) return false;
    try {
      el.muted = false;
      await el.play();
      return true;
    } catch {
      return false;
    }
  }, [teacherAudioRef]);

  useEffect(() => {
    if (!enabled) {
      setNeedsUnlock(false);
      return;
    }
    if (unlockedRef.current) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const ok = await tryPlayTeacherAudio();
        if (cancelled) return;
        if (!ok) {
          setNeedsUnlock(true);
        } else {
          unlockedRef.current = true;
          setNeedsUnlock(false);
        }
      })();
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, tryPlayTeacherAudio, retryKey]);

  const unlockAudio = useCallback(async () => {
    const ok = await tryPlayTeacherAudio();
    if (ok) {
      unlockedRef.current = true;
      setNeedsUnlock(false);
    }
    return ok;
  }, [tryPlayTeacherAudio]);

  return { needsUnlock, unlockAudio };
}

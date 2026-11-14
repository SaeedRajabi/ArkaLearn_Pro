'use client';

import * as React from 'react';

const CLOSE_DELAY_MS = 150;

export function useHoverFlyout(initialOpen = false) {
  const [open, setOpen] = React.useState(initialOpen);
  const closeTimerRef = React.useRef<number | undefined>(undefined);

  const openFlyout = React.useCallback(() => {
    if (closeTimerRef.current !== undefined) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = undefined;
    }
    setOpen(true);
  }, []);

  const closeFlyout = React.useCallback(() => {
    if (closeTimerRef.current !== undefined) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = undefined;
    }, CLOSE_DELAY_MS);
  }, []);

  const toggleFlyout = React.useCallback(() => {
    setOpen((current) => !current);
  }, []);

  React.useEffect(
    () => () => {
      if (closeTimerRef.current !== undefined) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  return { open, setOpen, openFlyout, closeFlyout, toggleFlyout };
}

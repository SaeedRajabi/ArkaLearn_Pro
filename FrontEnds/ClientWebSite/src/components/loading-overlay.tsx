'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LoaderCircle } from 'lucide-react';

export function LoadingOverlay() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
    </div>,
    document.body
  );
}

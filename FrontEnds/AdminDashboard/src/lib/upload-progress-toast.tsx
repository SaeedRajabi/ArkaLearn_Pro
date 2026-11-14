'use client';

import * as React from 'react';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

type UploadProgressToast = {
  update: (percent: number) => void;
  dismiss: () => void;
};

function buildDescription(percent: number, fileName?: string) {
  return (
    <div className="mt-1 w-[260px] space-y-2">
      {fileName ? (
        <p className="truncate text-xs text-muted-foreground" title={fileName}>
          {fileName}
        </p>
      ) : null}
      <div className="flex items-center justify-between text-xs tabular-nums">
        <span>{Math.min(100, Math.max(0, percent))}%</span>
      </div>
      <Progress value={Math.min(100, Math.max(0, percent))} className="h-2" />
    </div>
  );
}

/** Bottom-right toast that updates upload percent while a file is transferring. */
export function createUploadProgressToast(title: string, fileName?: string): UploadProgressToast {
  const handle = toast({
    title,
    description: buildDescription(0, fileName),
    duration: Infinity,
  });

  let lastShown = -1;
  return {
    update(percent: number) {
      const next = Math.min(100, Math.max(0, Math.round(percent)));
      if (next === lastShown) return;
      lastShown = next;
      handle.update({
        id: handle.id,
        title,
        description: buildDescription(next, fileName),
        duration: Infinity,
      });
    },
    dismiss() {
      handle.dismiss();
    },
  };
}

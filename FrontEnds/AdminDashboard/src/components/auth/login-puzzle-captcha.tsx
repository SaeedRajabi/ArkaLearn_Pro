'use client';

import * as React from 'react';
import { Check, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  targetPercent: number;
  tolerancePercent?: number;
  disabled?: boolean;
  title: string;
  hint: string;
  verifyLabel: string;
  refreshLabel: string;
  onRefresh: () => void;
  onVerified: (slidePercent: number) => void;
};

export function LoginPuzzleCaptcha({
  targetPercent,
  tolerancePercent = 4,
  disabled,
  title,
  hint,
  verifyLabel,
  refreshLabel,
  onRefresh,
  onVerified,
}: Props) {
  const [value, setValue] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [matched, setMatched] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setValue(0);
    setMatched(false);
  }, [targetPercent]);

  const withinTolerance = Math.abs(value - targetPercent) <= tolerancePercent;

  const updateFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / Math.max(rect.width, 1);
    setValue(Math.round(Math.min(100, Math.max(0, ratio * 100))));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || matched) return;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || disabled || matched) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleVerify = () => {
    if (!withinTolerance || disabled) return;
    setMatched(true);
    onVerified(value);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Shield className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={onRefresh}
          disabled={disabled}
          aria-label={refreshLabel}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={trackRef}
        className="relative h-12 select-none overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Target notch */}
        <div
          className="absolute top-1 bottom-1 w-10 -translate-x-1/2 rounded-md border-2 border-dashed border-primary/50 bg-primary/10"
          style={{ left: `${targetPercent}%` }}
          aria-hidden
        />
        {/* Sliding piece */}
        <div
          className={cn(
            'absolute top-1 bottom-1 flex w-10 -translate-x-1/2 cursor-grab items-center justify-center rounded-md bg-primary text-primary-foreground shadow-md active:cursor-grabbing',
            matched && 'bg-emerald-600',
            dragging && 'scale-105'
          )}
          style={{ left: `${value}%` }}
        >
          {matched ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">⋮⋮</span>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {value}% / {targetPercent}%
        </p>
        <Button
          type="button"
          size="sm"
          className="rounded-lg"
          disabled={disabled || matched || !withinTolerance}
          onClick={handleVerify}
        >
          {matched ? <Check className="me-1.5 h-3.5 w-3.5" /> : null}
          {verifyLabel}
        </Button>
      </div>
    </div>
  );
}

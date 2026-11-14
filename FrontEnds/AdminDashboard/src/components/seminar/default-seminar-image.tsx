'use client';

import { cn } from '@/lib/utils';

/**
 * تصویر پیش‌فرض سمینار با برند ArkaSoftware TechEdu — وقتی ادمین عکسی انتخاب نکرده باشد.
 */
export function DefaultSeminarImage({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-gradient-to-br from-primary/15 via-background to-primary/10 border border-border rounded-lg text-center p-8',
        className
      )}
    >
      <div className="text-2xl font-bold tracking-tight text-primary">
        ArkaSoftware <span className="text-primary/80">TechEdu</span>
      </div>
      <div className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        سمینار / Seminar
      </div>
    </div>
  );
}

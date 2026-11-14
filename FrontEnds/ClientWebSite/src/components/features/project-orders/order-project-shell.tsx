'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
};

export function OrderProjectShell({ children, sidebar, className }: Props) {
  return (
    <div className={cn('min-h-[calc(100vh-12rem)] bg-muted/20 py-8 sm:py-10 lg:py-14', className)}>
      <div className="container max-w-6xl">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-10">
          <div className="min-w-0">{children}</div>
          <div className="min-w-0 lg:sticky lg:top-24">{sidebar}</div>
        </div>
      </div>
    </div>
  );
}

export function OrderProjectMainCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border bg-card p-6 shadow-sm sm:p-8', className)}>
      {children}
    </div>
  );
}

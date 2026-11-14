'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  icon: LucideIcon;
  lang: 'en' | 'fa';
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function TeacherProfileSection({ title, icon: Icon, lang, subtitle, children, className }: Props) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm',
        lang === 'fa' && 'text-right',
        className
      )}
    >
      <div className="flex items-start gap-3 border-b bg-muted/30 px-6 py-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-headline text-xl font-bold tracking-tight">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

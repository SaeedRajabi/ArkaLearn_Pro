'use client';

import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SupportMessageDeliveryStatus } from '@/lib/api/support-chat';

type Props = {
  status?: SupportMessageDeliveryStatus | null;
  className?: string;
};

export function SupportMessageDeliveryTicks({ status, className }: Props) {
  if (!status) return null;

  if (status === 'sent') {
    return (
      <Check
        className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground/80', className)}
        aria-hidden
      />
    );
  }

  return (
    <CheckCheck
      className={cn(
        'h-3.5 w-3.5 shrink-0',
        status === 'read' ? 'text-sky-500' : 'text-muted-foreground/80',
        className
      )}
      aria-hidden
    />
  );
}

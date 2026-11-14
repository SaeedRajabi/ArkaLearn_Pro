'use client';

import { Check, Circle, Phone, ClipboardList, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderProjectFlowStep } from './project-order-types';
import { getVisibleFlowSteps } from './project-order-types';

type Props = {
  current: OrderProjectFlowStep;
  otpEnabled: boolean;
  t: (key: string, def: string) => string;
  isRtl?: boolean;
};

export function OrderProjectProgress({ current, otpEnabled, t, isRtl }: Props) {
  const visibleSteps = getVisibleFlowSteps(otpEnabled);
  const currentIdx = visibleSteps.indexOf(current);

  const steps = [
    {
      id: 'contact' as const,
      label: t('projectOrder.steps.contact', 'Contact info'),
      icon: ClipboardList,
    },
    ...(otpEnabled
      ? [
          {
            id: 'verify' as const,
            label: t('projectOrder.steps.verify', 'Phone verification'),
            icon: Phone,
          },
        ]
      : []),
    {
      id: 'project' as const,
      label: t('projectOrder.steps.project', 'Project details'),
      icon: FileText,
    },
    {
      id: 'done' as const,
      label: t('projectOrder.steps.done', 'Submitted'),
      icon: Check,
    },
  ];

  return (
    <ol className="space-y-0" dir={isRtl ? 'rtl' : 'ltr'}>
      {steps.map((step, index) => {
        const stepIdx = visibleSteps.indexOf(step.id);
        const isComplete = currentIdx > stepIdx;
        const isCurrent = current === step.id;
        const Icon = step.icon;

        return (
          <li key={step.id} className="relative flex gap-3 pb-6 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                className={cn(
                  'absolute top-8 h-[calc(100%-1.25rem)] w-px',
                  isRtl ? 'right-4' : 'left-4',
                  isComplete ? 'bg-primary' : 'bg-border'
                )}
                aria-hidden
              />
            ) : null}

            <span
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                isComplete && 'border-primary bg-primary text-primary-foreground',
                isCurrent && !isComplete && 'border-primary bg-primary/10 text-primary',
                !isComplete && !isCurrent && 'border-muted-foreground/30 bg-muted/40 text-muted-foreground'
              )}
            >
              {isComplete ? <Check className="h-4 w-4" /> : isCurrent ? <Icon className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
            </span>

            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  'text-sm font-medium',
                  isCurrent ? 'text-foreground' : isComplete ? 'text-foreground/80' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </p>
              {isCurrent && step.id !== 'done' ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t('projectOrder.steps.inProgress', 'In progress')}
                </p>
              ) : null}
              {isComplete ? (
                <p className="mt-0.5 text-xs text-primary">
                  {t('projectOrder.steps.completed', 'Completed')}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatCountdownUnit, parseSeminarUtcDateTime } from '@/lib/utils/seminar-datetime';

type CountdownLabels = {
  title: string;
  live: string;
  ended: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

type SeminarCountdownProps = {
  date: string;
  time?: string;
  startDateTime?: string;
  endDateTime?: string;
  isExpired?: boolean;
  labels: CountdownLabels;
  compact?: boolean;
  lang?: 'fa' | 'en';
};

function getTargetDate(date: string, time?: string, startDateTime?: string) {
  if (startDateTime) {
    const direct = parseSeminarUtcDateTime(startDateTime);
    if (direct) return direct;
  }

  if (!date) return null;
  const normalizedTime = time && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : '00:00';
  const parsed = new Date(`${date}T${normalizedTime}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getRemaining(target: Date | null) {
  if (!target) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  // Countdown = exact seminar start datetime minus current client time.
  const total = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  return { total, days, hours, minutes, seconds };
}

export function SeminarCountdown({
  date,
  time,
  startDateTime,
  endDateTime,
  isExpired,
  labels,
  compact = false,
  lang = 'fa',
}: SeminarCountdownProps) {
  const target = useMemo(() => getTargetDate(date, time, startDateTime), [date, time, startDateTime]);
  const endTarget = useMemo(() => {
    if (!endDateTime) return null;
    return parseSeminarUtcDateTime(endDateTime);
  }, [endDateTime]);
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    setRemaining(getRemaining(target));
    const interval = window.setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => window.clearInterval(interval);
  }, [target]);

  const items = [
    { label: labels.days, value: remaining.days },
    { label: labels.hours, value: remaining.hours },
    { label: labels.minutes, value: remaining.minutes },
    { label: labels.seconds, value: remaining.seconds },
  ];

  const pastEnd = isExpired || (endTarget != null && endTarget.getTime() <= Date.now());
  const stateLabel = pastEnd
    ? labels.ended
    : !target
      ? labels.ended
      : remaining.total <= 0
        ? labels.live
        : labels.title;

  return (
    <div
      className={cn(
        'rounded-3xl border bg-background/85 p-4 shadow-lg shadow-primary/5 backdrop-blur dark:bg-card/85',
        compact ? 'space-y-3' : 'space-y-4'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">{stateLabel}</p>
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl bg-primary/10 px-2 py-3 text-center dark:bg-primary/15">
            <div className={cn('font-extrabold text-primary', compact ? 'text-xl' : 'text-2xl md:text-3xl')}>
              {formatCountdownUnit(item.value, lang)}
            </div>
            <div className="mt-1 text-[11px] font-medium text-muted-foreground md:text-xs">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

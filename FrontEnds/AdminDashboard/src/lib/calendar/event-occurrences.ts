import { eachDayOfInterval, endOfMonth, startOfMonth } from 'date-fns';
import {
  endOfMonth as endOfMonthJalali,
  startOfMonth as startOfMonthJalali,
} from 'date-fns-jalali';

export type CalendarRepeatMode = 'single' | 'odd-days' | 'even-days' | 'date-range';

export type CalendarEventOccurrence = {
  start: Date;
  end: Date;
};

type BuildOccurrenceOptions = {
  start: Date;
  end: Date;
  repeatMode: CalendarRepeatMode;
  rangeStart?: Date;
  rangeEnd?: Date;
  locale: string;
};

function copyTimeToDay(day: Date, source: Date): Date {
  const result = new Date(day);
  result.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds()
  );
  return result;
}

/**
 * Expands a calendar event into concrete occurrences. In the class schedule:
 * even days are Saturday/Monday/Wednesday and odd days are Sunday/Tuesday/Thursday.
 * Friday is intentionally excluded from both patterns.
 */
export function buildCalendarEventOccurrences({
  start,
  end,
  repeatMode,
  rangeStart,
  rangeEnd,
  locale,
}: BuildOccurrenceOptions): CalendarEventOccurrence[] {
  const durationMs = end.getTime() - start.getTime();
  if (!Number.isFinite(durationMs) || durationMs < 0) return [];
  if (repeatMode === 'single') return [{ start: new Date(start), end: new Date(end) }];

  let days: Date[] = [];
  if (repeatMode === 'date-range') {
    if (!rangeStart || !rangeEnd || rangeEnd < rangeStart) return [];
    days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  } else {
    const isJalali = locale === 'fa';
    const monthStart = isJalali ? startOfMonthJalali(start) : startOfMonth(start);
    const monthEnd = isJalali ? endOfMonthJalali(start) : endOfMonth(start);
    const weekdays = repeatMode === 'odd-days'
      ? new Set([0, 2, 4]) // Sunday, Tuesday, Thursday
      : new Set([6, 1, 3]); // Saturday, Monday, Wednesday
    days = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter((day) =>
      weekdays.has(day.getDay())
    );
  }

  return days.map((day) => {
    const occurrenceStart = copyTimeToDay(day, start);
    return {
      start: occurrenceStart,
      end: new Date(occurrenceStart.getTime() + durationMs),
    };
  });
}

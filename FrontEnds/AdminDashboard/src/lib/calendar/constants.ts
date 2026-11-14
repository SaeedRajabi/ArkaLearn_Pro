import type { CalendarEventCategory } from '@/services/calendar-api.service';
import { parseUtcApiDateTime } from '@/lib/utils/localized-dates';

export const CALENDAR_CATEGORY_META: Record<
  CalendarEventCategory,
  { labelKey: string; color: string; bg: string; border: string }
> = {
  0: {
    labelKey: 'calendar_category_business',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-500/15 hover:bg-violet-500/25',
    border: 'border-violet-400/40',
  },
  1: {
    labelKey: 'calendar_category_online_class',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-500/15 hover:bg-sky-500/25',
    border: 'border-sky-400/40',
  },
  2: {
    labelKey: 'calendar_category_seminar',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/15 hover:bg-amber-500/25',
    border: 'border-amber-400/40',
  },
  3: {
    labelKey: 'calendar_category_personal',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/15 hover:bg-rose-500/25',
    border: 'border-rose-400/40',
  },
  4: {
    labelKey: 'calendar_category_other',
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-500/15 hover:bg-teal-500/25',
    border: 'border-teal-400/40',
  },
};

export type CalendarEventTimeStatus = 'upcoming' | 'ongoing' | 'completed';

export const CALENDAR_EVENT_STATUS_STYLE = {
  ongoing: {
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/20 hover:bg-amber-500/30',
    border: 'border-amber-500/50',
  },
  completed: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/20 hover:bg-emerald-500/30',
    border: 'border-emerald-500/50',
  },
} as const;

export function getCalendarEventTimeStatus(
  startUtc: string,
  endUtc: string,
  now: Date = new Date()
): CalendarEventTimeStatus {
  const start = parseUtcApiDateTime(startUtc) ?? new Date(startUtc);
  const end = parseUtcApiDateTime(endUtc) ?? new Date(endUtc);
  const time = now.getTime();
  if (time >= end.getTime()) return 'completed';
  if (time >= start.getTime()) return 'ongoing';
  return 'upcoming';
}

export function resolveCalendarEventStyles(
  event: { category: CalendarEventCategory; startUtc: string; endUtc: string },
  now: Date = new Date()
): { color: string; bg: string; border: string } {
  const status = getCalendarEventTimeStatus(event.startUtc, event.endUtc, now);
  if (status === 'ongoing') return CALENDAR_EVENT_STATUS_STYLE.ongoing;
  if (status === 'completed') return CALENDAR_EVENT_STATUS_STYLE.completed;
  return CALENDAR_CATEGORY_META[event.category];
}

export const ALL_CALENDAR_CATEGORIES: CalendarEventCategory[] = [0, 1, 2, 3, 4];

export type CalendarViewMode = 'month' | 'week' | 'day' | 'list';

export function eventOccursOnDay(start: Date, end: Date, day: Date): boolean {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  return start <= dayEnd && end >= dayStart;
}

export function toAllDayRange(start: Date, end: Date): { startUtc: string; endUtc: string } {
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(23, 59, 59, 999);
  return { startUtc: startDay.toISOString(), endUtc: endDay.toISOString() };
}

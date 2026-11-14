import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getMonth,
  getYear,
  isSameDay,
  isSameMonth,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  addMonths as addMonthsJalali,
  eachDayOfInterval as eachDayOfIntervalJalali,
  endOfMonth as endOfMonthJalali,
  endOfWeek as endOfWeekJalali,
  format as formatJalali,
  getMonth as getMonthJalali,
  getYear as getYearJalali,
  isSameDay as isSameDayJalali,
  isSameMonth as isSameMonthJalali,
  setMonth as setMonthJalali,
  setYear as setYearJalali,
  startOfMonth as startOfMonthJalali,
  startOfWeek as startOfWeekJalali,
  subMonths as subMonthsJalali,
} from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import type { AppLocale } from '@/lib/utils/locale-format';
import { isPersianLocale, toLocaleDigits } from '@/lib/utils/locale-format';

export type CalendarDayCell = {
  date: Date;
  label: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

const WEEKDAY_LABELS_FA = ['شنبه', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه'];
const WEEKDAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getWeekdayLabels(locale: AppLocale): string[] {
  if (isPersianLocale(locale)) {
    return WEEKDAY_LABELS_FA;
  }
  return WEEKDAY_LABELS_EN;
}

export function getMonthYearLabel(viewDate: Date, locale: AppLocale): string {
  if (isPersianLocale(locale)) {
    const month = formatJalali(viewDate, 'MMMM', { locale: faIR });
    const year = toLocaleDigits(formatJalali(viewDate, 'yyyy', { locale: faIR }), locale);
    return `${month} ${year}`;
  }
  return format(viewDate, 'MMMM yyyy', { locale: enUS });
}

export function buildMonthGrid(
  viewDate: Date,
  selected: Date | undefined,
  locale: AppLocale,
  today = new Date()
): CalendarDayCell[] {
  if (isPersianLocale(locale)) {
    const monthStart = startOfMonthJalali(viewDate);
    const monthEnd = endOfMonthJalali(viewDate);
    const gridStart = startOfWeekJalali(monthStart, { weekStartsOn: 6 });
    const gridEnd = endOfWeekJalali(monthEnd, { weekStartsOn: 6 });
    const days = eachDayOfIntervalJalali({ start: gridStart, end: gridEnd });

    return days.map((date) => ({
      date,
      label: toLocaleDigits(formatJalali(date, 'd', { locale: faIR }), locale),
      inCurrentMonth: isSameMonthJalali(date, viewDate),
      isToday: isSameDayJalali(date, today),
      isSelected: selected ? isSameDayJalali(date, selected) : false,
    }));
  }

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return days.map((date) => ({
    date,
    label: format(date, 'd', { locale: enUS }),
    inCurrentMonth: isSameMonth(date, viewDate),
    isToday: isSameDay(date, today),
    isSelected: selected ? isSameDay(date, selected) : false,
  }));
}

export function shiftMonth(viewDate: Date, delta: number, locale: AppLocale): Date {
  return isPersianLocale(locale)
    ? delta > 0
      ? addMonthsJalali(viewDate, delta)
      : subMonthsJalali(viewDate, Math.abs(delta))
    : delta > 0
      ? addMonths(viewDate, delta)
      : subMonths(viewDate, Math.abs(delta));
}

export function getMonthIndex(viewDate: Date, locale: AppLocale): number {
  return isPersianLocale(locale) ? getMonthJalali(viewDate) : getMonth(viewDate);
}

export function getYearValue(viewDate: Date, locale: AppLocale): number {
  return isPersianLocale(locale) ? getYearJalali(viewDate) : getYear(viewDate);
}

export function setMonthYear(
  viewDate: Date,
  monthIndex: number,
  year: number,
  locale: AppLocale
): Date {
  if (isPersianLocale(locale)) {
    const withYear = setYearJalali(viewDate, year);
    return setMonthJalali(withYear, monthIndex);
  }

  const withYear = setYear(viewDate, year);
  return setMonth(withYear, monthIndex);
}

export function getMonthOptions(locale: AppLocale): { value: number; label: string }[] {
  const anchor = new Date();

  if (isPersianLocale(locale)) {
    return Array.from({ length: 12 }, (_, index) => {
      const monthDate = setMonthJalali(startOfMonthJalali(anchor), index);
      return {
        value: index,
        label: formatJalali(monthDate, 'MMMM', { locale: faIR }),
      };
    });
  }

  return Array.from({ length: 12 }, (_, index) => ({
    value: index,
    label: format(setMonth(new Date(2021, 0, 1), index), 'MMMM', { locale: enUS }),
  }));
}

export function getYearOptions(viewDate: Date, locale: AppLocale, span = 10): number[] {
  const current = getYearValue(viewDate, locale);
  const years: number[] = [];
  for (let y = current - span; y <= current + span; y += 1) {
    years.push(y);
  }
  return years;
}

export function mergeDateTime(base: Date, hours: number, minutes: number): Date {
  const next = new Date(base);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function parseTimeParts(date: Date): { hours24: number; minutes: number; isPm: boolean; hours12: number } {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const isPm = hours24 >= 12;
  const hours12 = hours24 % 12 || 12;
  return { hours24, minutes, isPm, hours12 };
}

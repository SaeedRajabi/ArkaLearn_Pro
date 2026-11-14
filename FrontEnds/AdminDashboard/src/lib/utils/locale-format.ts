import { format as formatGregorian } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { format as formatJalali } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const LTR_ISOLATE_START = '\u2066';
const LTR_ISOLATE_END = '\u2069';

/** Keep HH:mm and numeric segments readable in RTL (hours before minutes). */
export function wrapLtr(value: string): string {
  return `${LTR_ISOLATE_START}${value}${LTR_ISOLATE_END}`;
}

export type AppLocale = 'fa' | 'en' | string;

export function isPersianLocale(locale: AppLocale): boolean {
  return locale === 'fa' || locale.startsWith('fa');
}

export function toLocaleDigits(value: string | number, locale: AppLocale): string {
  const str = String(value);
  if (!isPersianLocale(locale)) return str;
  return str.replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

export function fromLocaleDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

export function formatLocaleTime(
  value: string | Date | null | undefined,
  locale: AppLocale,
  use12Hour = false
): string {
  const date = value instanceof Date ? value : value ? new Date(value) : undefined;
  if (!date || Number.isNaN(date.getTime())) return '—';

  if (isPersianLocale(locale) || !use12Hour) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const label = `${hh}:${mm}`;
    const formatted = isPersianLocale(locale) ? toLocaleDigits(label, locale) : label;
    return isPersianLocale(locale) ? wrapLtr(formatted) : formatted;
  }

  return formatGregorian(date, 'h:mm a', { locale: enUS });
}

export function formatPickerInputDateTime(date: Date, locale: AppLocale): string {
  if (isPersianLocale(locale)) {
    const datePart = toLocaleDigits(formatJalali(date, 'yyyy/MM/dd', { locale: faIR }), locale);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const timePart = toLocaleDigits(`${hh}:${mm}`, locale);
    return wrapLtr(`${datePart} — ${timePart}`);
  }
  const datePart = formatGregorian(date, 'yyyy/MM/dd', { locale: enUS });
  const timePart = formatGregorian(date, 'HH:mm', { locale: enUS });
  return `${datePart} — ${timePart}`;
}

export function formatPickerInputDate(date: Date, locale: AppLocale): string {
  if (isPersianLocale(locale)) {
    return toLocaleDigits(formatJalali(date, 'yyyy/MM/dd', { locale: faIR }), locale);
  }
  return formatGregorian(date, 'yyyy/MM/dd', { locale: enUS });
}

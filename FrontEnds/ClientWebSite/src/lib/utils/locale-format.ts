import { format as formatGregorian } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { format as formatJalali } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export type AppLocale = 'fa' | 'en' | string;

export function parseApiDate(value: string | Date | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function isPersianLocale(locale: AppLocale): boolean {
  return locale === 'fa' || locale.startsWith('fa');
}

/** Convert Western digits to Persian when locale is fa. */
export function toLocaleDigits(value: string | number, locale: AppLocale): string {
  const str = String(value);
  if (!isPersianLocale(locale)) return str;
  return str.replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

/** Normalize Persian/Arabic digits to Western for parsing. */
export function fromLocaleDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

export function formatLocaleNumber(
  value: number,
  locale: AppLocale,
  options?: Intl.NumberFormatOptions
): string {
  const tag = isPersianLocale(locale) ? 'fa-IR' : 'en-US';
  return new Intl.NumberFormat(tag, options).format(value);
}

export function formatLocaleDate(
  value: string | Date | null | undefined,
  locale: AppLocale,
  style: 'short' | 'medium' | 'long' = 'medium'
): string {
  const date = parseApiDate(value);
  if (!date) return '—';

  if (isPersianLocale(locale)) {
    const pattern =
      style === 'short' ? 'yyyy/MM/dd' : style === 'long' ? 'd MMMM yyyy' : 'd MMM yyyy';
    return toLocaleDigits(formatJalali(date, pattern, { locale: faIR }), locale);
  }

  const pattern = style === 'short' ? 'MM/dd/yyyy' : style === 'long' ? 'PPPP' : 'PP';
  return formatGregorian(date, pattern, { locale: enUS });
}

export function formatLocaleTime(
  value: string | Date | null | undefined,
  locale: AppLocale,
  use12Hour = true
): string {
  const date = parseApiDate(value);
  if (!date) return '—';

  if (isPersianLocale(locale)) {
    const hours24 = date.getHours();
    const minutes = date.getMinutes();
    const isPm = hours24 >= 12;
    const hours12 = hours24 % 12 || 12;
    const period = isPm ? 'ب.ظ' : 'ق.ظ';
    const hh = String(hours12).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return toLocaleDigits(`${hh} : ${mm} ${period}`, locale);
  }

  if (use12Hour) {
    return formatGregorian(date, 'h:mm a', { locale: enUS });
  }
  return formatGregorian(date, 'HH:mm', { locale: enUS });
}

export function formatLocaleDateTime(
  value: string | Date | null | undefined,
  locale: AppLocale
): string {
  const date = parseApiDate(value);
  if (!date) return '—';

  if (isPersianLocale(locale)) {
    const datePart = formatJalali(date, 'd MMMM yyyy', { locale: faIR });
    const timePart = formatLocaleTime(date, locale);
    return `${toLocaleDigits(datePart, locale)} — ${timePart}`;
  }

  return formatGregorian(date, 'PPP p', { locale: enUS });
}

/** Input display: YYYY/MM/DD — HH:MM (Jalali when fa). */
export function formatPickerInputDateTime(date: Date, locale: AppLocale): string {
  if (isPersianLocale(locale)) {
    const datePart = toLocaleDigits(formatJalali(date, 'yyyy/MM/dd', { locale: faIR }), locale);
    const timePart = formatLocaleTime(date, locale);
    return `${datePart} — ${timePart}`;
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

/** Display project dates from API (ISO or pre-formatted Persian strings). */
export function formatProjectDisplayDate(
  value: string | null | undefined,
  locale: AppLocale
): string {
  if (!value?.trim()) return '—';

  const parsed = parseApiDate(value);
  if (parsed) {
    return formatLocaleDate(parsed, locale, 'medium');
  }

  return isPersianLocale(locale) ? toLocaleDigits(value, locale) : value;
}

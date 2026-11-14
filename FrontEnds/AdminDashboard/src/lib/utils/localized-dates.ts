import { format as formatGregorian } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { format as formatJalali } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import { wrapLtr } from '@/lib/utils/locale-format';

export type AdminLocale = 'fa' | 'en' | string;

export function parseApiDate(value: string | Date | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Parse API UTC datetime for local display/editing (handles ISO strings without Z). */
export function parseUtcApiDateTime(value: string | Date | null | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;

  const raw = value.trim();
  if (!raw) return undefined;

  if (/[zZ]$/.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw)) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const normalized = raw.includes('T') ? raw : `${raw}T00:00:00`;
  const date = new Date(`${normalized}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Display date only (Persian calendar when locale is fa). */
export function formatAdminDate(value: string | Date | null | undefined, locale: AdminLocale): string {
  const date = parseApiDate(value);
  if (!date) return '—';
  if (locale === 'fa') {
    return formatJalali(date, 'd MMMM yyyy', { locale: faIR });
  }
  return formatGregorian(date, 'PPP', { locale: enUS });
}

/** Display date and time (Persian calendar when locale is fa). */
export function formatAdminDateTime(value: string | Date | null | undefined, locale: AdminLocale): string {
  const date = parseUtcApiDateTime(value);
  if (!date) return '—';
  if (locale === 'fa') {
    const datePart = formatJalali(date, 'd MMMM yyyy', { locale: faIR });
    const timePart = wrapLtr(
      `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    );
    return `${datePart}، ${timePart}`;
  }
  return formatGregorian(date, 'PPP p', { locale: enUS });
}

/** UTC day start for API payloads (education plan start date). */
export function dateToUtcStartIso(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  return new Date(Date.UTC(y, m, d, 0, 0, 0, 0)).toISOString();
}

/** UTC day end for API payloads (education plan end date). */
export function dateToUtcEndIso(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  return new Date(Date.UTC(y, m, d, 23, 59, 59, 999)).toISOString();
}

/** Map API ISO string to a local Date for pickers (date portion only). */
export function apiIsoToLocalDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const parsed = parseApiDate(iso);
  if (!parsed) return undefined;
  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

/** yyyy-MM-dd for APIs that store a calendar date without time. */
export function dateToApiDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse yyyy-MM-dd (or ISO) into a local Date for pickers. */
export function apiDateStringToLocalDate(value: string | undefined): Date | undefined {
  if (!value?.trim()) return undefined;
  const datePart = value.trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return parseApiDate(value);
}

export function getPickerLocale(locale: AdminLocale) {
  return locale === 'fa' ? faIR : enUS;
}

export function formatPickerDayLabel(date: Date, locale: AdminLocale): string {
  return locale === 'fa'
    ? formatJalali(date, 'd MMMM yyyy', { locale: faIR })
    : formatGregorian(date, 'PPP', { locale: enUS });
}

export function formatPickerDateTimeLabel(date: Date, locale: AdminLocale): string {
  return formatAdminDateTime(date, locale);
}

export type SiteLocale = 'fa' | 'en';

export function parseSeminarUtcDateTime(value?: string | null): Date | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  if (/[zZ]$/.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw)) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const normalized = raw.includes('T') ? raw : `${raw}T00:00:00`;
  const date = new Date(`${normalized}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatSeminarDateLabel(iso: string | undefined, lang: SiteLocale): string {
  const date = parseSeminarUtcDateTime(iso);
  if (!date) return '';

  if (lang === 'fa') {
    return date.toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'persian',
    });
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatSeminarShortDate(iso: string | undefined, lang: SiteLocale): string {
  const date = parseSeminarUtcDateTime(iso);
  if (!date) return '';

  if (lang === 'fa') {
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'persian',
    });
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatSeminarTime24(iso: string | undefined, lang: SiteLocale): string {
  const date = parseSeminarUtcDateTime(iso);
  if (!date) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const formatted = `${hours}:${minutes}`;

  if (lang === 'fa') {
    return toPersianDigits(formatted);
  }

  return formatted;
}

export function formatSeminarTimeRange(
  startIso: string | undefined,
  endIso: string | undefined,
  lang: SiteLocale
): string {
  const start = formatSeminarTime24(startIso, lang);
  const end = formatSeminarTime24(endIso, lang);
  if (!start) return '-';
  if (!end || start === end) return start;
  return lang === 'fa' ? `${start} تا ${end}` : `${start} - ${end}`;
}

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

export function formatCountdownUnit(value: number, lang: SiteLocale): string {
  const normalized = String(Math.max(0, value)).padStart(2, '0');
  return lang === 'fa' ? toPersianDigits(normalized) : normalized;
}

export function deriveSeminarLocalDateKey(iso: string | undefined): string {
  const date = parseSeminarUtcDateTime(iso);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function deriveSeminarLocalTime24(iso: string | undefined): string {
  const date = parseSeminarUtcDateTime(iso);
  if (!date) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

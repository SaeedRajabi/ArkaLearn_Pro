const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const toPersianDigits = (value: string | number): string =>
    String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);

// lib/format/digits.ts
export const formatDigits = (value: string | number, locale: string): string =>
    locale === 'fa' ? toPersianDigits(value) : String(value);

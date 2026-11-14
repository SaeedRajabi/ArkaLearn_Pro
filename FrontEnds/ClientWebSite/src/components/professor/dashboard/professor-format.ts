export function formatCompactCount(value: number, locale: string): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCurrency(amount: number, locale: string): string {
  if (locale.startsWith('fa')) {
    return `${new Intl.NumberFormat('fa-IR').format(amount)} تومان`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    amount
  );
}

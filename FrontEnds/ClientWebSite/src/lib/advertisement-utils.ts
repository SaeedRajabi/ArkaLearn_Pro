export function formatActiveDuration(
  memberSinceUtc: string | undefined,
  labels: { days: string; months: string; years: string }
): string {
  if (!memberSinceUtc) return '—';
  const start = new Date(memberSinceUtc);
  if (Number.isNaN(start.getTime())) return '—';

  const days = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
  if (days < 30) return `${days} ${labels.days}`;
  if (days < 365) return `${Math.floor(days / 30)} ${labels.months}`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (months > 0) return `${years} ${labels.years} ${months} ${labels.months}`;
  return `${years} ${labels.years}`;
}

export function formatPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('fa-IR').format(value);
}

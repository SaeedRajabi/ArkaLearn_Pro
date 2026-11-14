/** Normalize API id fields (often snowflake longs) to exact string values. */
export function asLongId(value: unknown): string {
  if (value == null || value === '') return '0';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || '0';
  }
  if (typeof value === 'number') {
    if (Number.isSafeInteger(value)) return String(value);
    return String(value);
  }
  if (typeof value === 'bigint') return value.toString();
  const asString = String(value).trim();
  return asString || '0';
}

export function isValidLongId(value: string): boolean {
  return /^\d+$/.test(value) && value !== '0';
}

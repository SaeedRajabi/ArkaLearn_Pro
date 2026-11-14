import type { Dictionary } from '@/types';

/**
 * دسترسی ایمن به مقادیر تودرتوی دیکشنری
 */
export function getDictValue(dict: Dictionary, path: string, fallback: string = ''): string {
  if (!dict) return fallback;

  const record = dict as Record<string, unknown>;
  const flatValue = record[path];
  if (typeof flatValue === 'string') return flatValue;

  const keys = path.split('.');
  let value: unknown = dict;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return fallback;
    }
  }
  return typeof value === 'string' ? value : fallback;
}

/** Replace `{key}` placeholders in a localized template string. */
export function formatDictTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template
  );
}

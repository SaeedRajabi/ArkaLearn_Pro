/** Unwrap list payloads from API (plain array, legacy $values, or { data }). */
export function unwrapApiList<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];

  if (typeof raw !== 'object') return [];

  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.$values)) return obj.$values as T[];
  if (Array.isArray(obj.queryResult)) return obj.queryResult as T[];
  if (Array.isArray(obj.QueryResult)) return obj.QueryResult as T[];

  const dataLayer = obj.data ?? obj.Data;
  if (Array.isArray(dataLayer)) return dataLayer as T[];

  if (dataLayer && typeof dataLayer === 'object') {
    const inner = dataLayer as Record<string, unknown>;
    if (Array.isArray(inner.$values)) return inner.$values as T[];
    if (Array.isArray(inner.queryResult)) return inner.queryResult as T[];
    if (Array.isArray(inner.QueryResult)) return inner.QueryResult as T[];
  }

  return [];
}

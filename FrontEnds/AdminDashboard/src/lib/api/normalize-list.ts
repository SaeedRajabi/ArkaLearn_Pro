/** Unwrap list payloads from API (plain array, legacy $values, or nested data/queryResult). */
export function unwrapApiList<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];

  if (typeof raw !== 'object') return [];

  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.$values)) return obj.$values as T[];
  if (Array.isArray(obj.queryResult)) return obj.queryResult as T[];
  if (Array.isArray(obj.QueryResult)) return obj.QueryResult as T[];

  const dataLayer = obj.data ?? obj.Data ?? obj.result ?? obj.Result;
  if (Array.isArray(dataLayer)) return dataLayer as T[];

  if (dataLayer && typeof dataLayer === 'object') {
    const inner = dataLayer as Record<string, unknown>;
    if (Array.isArray(inner.$values)) return inner.$values as T[];
    if (Array.isArray(inner.queryResult)) return inner.queryResult as T[];
    if (Array.isArray(inner.QueryResult)) return inner.QueryResult as T[];
  }

  return [];
}

export function unwrapApiObject(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? obj.result ?? obj.Result ?? obj.queryResult ?? obj.QueryResult;
  if (layer && typeof layer === 'object' && !Array.isArray(layer)) {
    return layer as Record<string, unknown>;
  }
  return obj;
}

export function readPagedTotalCount(raw: unknown, fallback: number): number {
  const layer = unwrapApiObject(raw);
  const total = Number(layer.totalCount ?? layer.TotalCount ?? 0);
  if (total > 0) return total;
  const root = raw as Record<string, unknown> | null | undefined;
  const rootTotal = Number(root?.totalCount ?? root?.TotalCount ?? 0);
  return rootTotal > 0 ? rootTotal : fallback;
}

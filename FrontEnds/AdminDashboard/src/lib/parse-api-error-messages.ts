/** Normalizes ASP.NET BadRequest payloads and similar shapes to user-facing strings. */
export function parseApiErrorMessages(data: unknown): string[] {
  if (data == null) return [];
  if (typeof data === 'string') return data.trim() ? [data.trim()] : [];
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && 'message' in item) {
          return String((item as { message: unknown }).message).trim();
        }
        return String(item).trim();
      })
      .filter(Boolean);
  }
  if (typeof data === 'object' && '$values' in data) {
    const inner = (data as { $values: unknown }).$values;
    return parseApiErrorMessages(inner);
  }
  if (typeof data === 'object' && data !== null) {
    const o = data as Record<string, unknown>;
    const m = o.message ?? o.Message;
    if (typeof m === 'string' && m.trim()) return [m.trim()];
    const em = o.errorMessages ?? o.ErrorMessages ?? o.errors;
    if (em !== undefined) return parseApiErrorMessages(em);
  }
  return [];
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    const messages = parseApiErrorMessages(response?.data);
    if (messages.length > 0) return messages.join(' ');
  }
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}

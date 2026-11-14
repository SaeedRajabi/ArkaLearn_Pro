import { resolveUserFacingError } from '@/lib/errors/user-facing-message';

/** ApplicationServiceStatus.Exist from backend */
export const API_STATUS_EXIST = 6;

type CommandEnvelope = {
  status?: number;
  Status?: number;
  messages?: unknown;
  Messages?: unknown;
};

function unwrapEnvelope(raw: unknown): CommandEnvelope | null {
  if (!raw || typeof raw !== 'object') return null;
  let cur = raw as Record<string, unknown>;
  for (let depth = 0; depth < 5; depth++) {
    const status = cur.status ?? cur.Status;
    if (typeof status === 'number') return cur as CommandEnvelope;
    const next =
      (cur.data && typeof cur.data === 'object' && !Array.isArray(cur.data)
        ? (cur.data as Record<string, unknown>)
        : null) ??
      (cur.Data && typeof cur.Data === 'object' && !Array.isArray(cur.Data)
        ? (cur.Data as Record<string, unknown>)
        : null) ??
      (cur.result && typeof cur.result === 'object' && !Array.isArray(cur.result)
        ? (cur.result as Record<string, unknown>)
        : null) ??
      (cur.Result && typeof cur.Result === 'object' && !Array.isArray(cur.Result)
        ? (cur.Result as Record<string, unknown>)
        : null);
    if (!next || next === cur) break;
    cur = next;
  }
  return cur as CommandEnvelope;
}

/** HTTP 2xx command/edit responses without an explicit status field are treated as success. */
export function isCommandResponseSuccess(raw: unknown, httpStatus: number): boolean {
  if (httpStatus < 200 || httpStatus >= 300) return false;
  const status = getCommandStatus(raw);
  if (status === undefined) return true;
  return status === 1;
}

export function getCommandStatus(raw: unknown): number | undefined {
  const env = unwrapEnvelope(raw);
  if (!env) return undefined;
  const status = env.status ?? env.Status;
  return typeof status === 'number' ? status : undefined;
}

export function getCommandMessages(raw: unknown): string[] {
  const env = unwrapEnvelope(raw);
  const messages = env?.messages ?? env?.Messages;
  if (Array.isArray(messages)) return messages.map((m) => String(m));
  if (messages && typeof messages === 'object' && '$values' in (messages as object)) {
    return ((messages as { $values: unknown[] }).$values ?? []).map((m) => String(m));
  }
  return [];
}

export function isDuplicateTitleResponse(raw: unknown): boolean {
  if (getCommandStatus(raw) === API_STATUS_EXIST) return true;
  const fromError = (raw as { response?: { data?: unknown } })?.response?.data;
  if (fromError && getCommandStatus(fromError) === API_STATUS_EXIST) return true;
  const text = getCommandMessages(raw).concat(getCommandMessages(fromError)).join(' ').toLowerCase();
  return text.includes('already exists') || text.includes('is exist');
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const ax = error as { response?: { data?: unknown } };
  const data = ax?.response?.data;

  if (typeof data === 'string' && data.trim()) return data.trim();
  if (Array.isArray(data) && data.length > 0) {
    return data.map((item) => String(item)).filter(Boolean).join('\n');
  }

  const msgs = getCommandMessages(data);
  if (msgs.length > 0) return msgs[0];
  if (isDuplicateTitleResponse(data)) {
    return msgs[0] || 'An item with this title already exists.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getUserFacingApiErrorMessage(error: unknown, fallback = ''): string {
  const raw = getApiErrorMessage(error, fallback);
  return resolveUserFacingError(error, raw || fallback);
}

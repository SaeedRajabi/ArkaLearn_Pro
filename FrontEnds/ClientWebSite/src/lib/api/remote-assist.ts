import { apiRequest } from './client';

const BASE = 'RemoteAssist';

export type RemoteAssistSession = {
  sessionId: number;
  /** Exact id for API calls (avoids JS number precision loss). */
  sessionIdKey: string;
  requesterUserId: number;
  acceptedByTeacherUserId?: number | null;
  oneTimeSessionCode: string;
  sessionUsername: string;
  sessionPassword?: string | null;
  status: string;
  createdAtUtc: string;
  codeExpiresAtUtc: string;
  acceptedAtUtc?: string | null;
  endedAtUtc?: string | null;
  consentRequestedAtUtc?: string | null;
  allowRemoteControl: boolean;
  allowClipboard: boolean;
  allowFileTransfer: boolean;
  allowAudio: boolean;
  allowLockLocalInput: boolean;
  requesterDisplayName?: string | null;
  requesterPhoneNumber?: string | null;
  helperDisplayName?: string | null;
  isRequesterOnline: boolean;
};

export type RemoteAssistSessionAccepted = {
  sessionId: number;
  requesterUserId: number;
  acceptedByTeacherUserId: number;
  status: string;
  acceptedAtUtc: string;
  consentRequestedAtUtc?: string | null;
  session?: RemoteAssistSession | null;
};

export type RemoteAssistHistoryPage = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  items: RemoteAssistSession[];
};

export type RemoteAssistConsentPayload = {
  sessionId: number;
  allowRemoteControl: boolean;
  allowClipboard: boolean;
  allowFileTransfer: boolean;
  allowAudio: boolean;
  allowLockLocalInput: boolean;
};

function unwrap<T>(raw: unknown): T {
  const root = raw as Record<string, unknown> | null | undefined;
  if (!root) return {} as T;
  const data = (root.data ?? root.Data ?? root) as Record<string, unknown>;
  return (data.queryResult ?? data.QueryResult ?? data) as T;
}

function asIso(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return new Date(value as string | number | Date).toISOString();
  } catch {
    return String(value);
  }
}

function asLongId(value: unknown): string {
  if (value == null || value === '') return '0';
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value));
  const text = String(value).trim();
  return /^\d+$/.test(text) ? text : '0';
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0' || normalized === '') return false;
  }
  return fallback;
}

export function normalizeRemoteAssistSession(raw: Record<string, unknown>): RemoteAssistSession {
  return {
    sessionId: Number(asLongId(raw.sessionId ?? raw.SessionId)),
    sessionIdKey: asLongId(raw.sessionId ?? raw.SessionId),
    requesterUserId: Number(asLongId(raw.requesterUserId ?? raw.RequesterUserId)),
    acceptedByTeacherUserId:
      raw.acceptedByTeacherUserId != null || raw.AcceptedByTeacherUserId != null
        ? Number(asLongId(raw.acceptedByTeacherUserId ?? raw.AcceptedByTeacherUserId))
        : null,
    oneTimeSessionCode: String(raw.oneTimeSessionCode ?? raw.OneTimeSessionCode ?? ''),
    sessionUsername: String(raw.sessionUsername ?? raw.SessionUsername ?? ''),
    sessionPassword: (raw.sessionPassword ?? raw.SessionPassword ?? null) as string | null,
    status: String(raw.status ?? raw.Status ?? ''),
    createdAtUtc: asIso(raw.createdAtUtc ?? raw.CreatedAtUtc),
    codeExpiresAtUtc: asIso(raw.codeExpiresAtUtc ?? raw.CodeExpiresAtUtc),
    acceptedAtUtc: (raw.acceptedAtUtc ?? raw.AcceptedAtUtc ?? null)
      ? asIso(raw.acceptedAtUtc ?? raw.AcceptedAtUtc)
      : null,
    endedAtUtc: (raw.endedAtUtc ?? raw.EndedAtUtc ?? null)
      ? asIso(raw.endedAtUtc ?? raw.EndedAtUtc)
      : null,
    consentRequestedAtUtc: (raw.consentRequestedAtUtc ?? raw.ConsentRequestedAtUtc ?? null)
      ? asIso(raw.consentRequestedAtUtc ?? raw.ConsentRequestedAtUtc)
      : null,
    allowRemoteControl: Boolean(raw.allowRemoteControl ?? raw.AllowRemoteControl ?? true),
    allowClipboard: Boolean(raw.allowClipboard ?? raw.AllowClipboard ?? false),
    allowFileTransfer: Boolean(raw.allowFileTransfer ?? raw.AllowFileTransfer ?? false),
    allowAudio: Boolean(raw.allowAudio ?? raw.AllowAudio ?? false),
    allowLockLocalInput: Boolean(raw.allowLockLocalInput ?? raw.AllowLockLocalInput ?? false),
    requesterDisplayName: (raw.requesterDisplayName ?? raw.RequesterDisplayName ?? null) as string | null,
    requesterPhoneNumber: (raw.requesterPhoneNumber ?? raw.RequesterPhoneNumber ?? null) as string | null,
    helperDisplayName: (raw.helperDisplayName ?? raw.HelperDisplayName ?? null) as string | null,
    isRequesterOnline: asBoolean(raw.isRequesterOnline ?? raw.IsRequesterOnline),
  };
}

function normalizeAccepted(raw: Record<string, unknown>): RemoteAssistSessionAccepted {
  const sessionRaw = (raw.session ?? raw.Session) as Record<string, unknown> | null | undefined;
  return {
    sessionId: Number(raw.sessionId ?? raw.SessionId ?? 0),
    requesterUserId: Number(raw.requesterUserId ?? raw.RequesterUserId ?? 0),
    acceptedByTeacherUserId: Number(raw.acceptedByTeacherUserId ?? raw.AcceptedByTeacherUserId ?? 0),
    status: String(raw.status ?? raw.Status ?? ''),
    acceptedAtUtc: asIso(raw.acceptedAtUtc ?? raw.AcceptedAtUtc),
    consentRequestedAtUtc: (raw.consentRequestedAtUtc ?? raw.ConsentRequestedAtUtc ?? null)
      ? asIso(raw.consentRequestedAtUtc ?? raw.ConsentRequestedAtUtc)
      : null,
    session: sessionRaw ? normalizeRemoteAssistSession(sessionRaw) : null,
  };
}

function asItemArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const nested = (value as Record<string, unknown>).$values;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

function findHistoryPage(raw: unknown): Record<string, unknown> | null {
  let cursor: unknown = raw;
  for (let depth = 0; depth < 6 && cursor && typeof cursor === 'object'; depth += 1) {
    const obj = cursor as Record<string, unknown>;
    if (asItemArray(obj.items).length > 0 || asItemArray(obj.Items).length > 0 || 'pageNumber' in obj || 'PageNumber' in obj) {
      if ('items' in obj || 'Items' in obj || 'pageNumber' in obj || 'PageNumber' in obj) {
        return obj;
      }
    }
    cursor =
      obj.queryResult ?? obj.QueryResult ?? obj.data ?? obj.Data ?? obj.result ?? obj.Result;
  }
  return null;
}

function normalizeHistoryPage(raw: unknown): RemoteAssistHistoryPage {
  const page = findHistoryPage(raw) ?? (unwrap<Record<string, unknown>>(raw) || {});
  const itemsRaw = asItemArray(page.items ?? page.Items);
  return {
    pageNumber: Number(page.pageNumber ?? page.PageNumber ?? 1),
    pageSize: Number(page.pageSize ?? page.PageSize ?? 20),
    totalCount: Number(page.totalCount ?? page.TotalCount ?? itemsRaw.length),
    items: itemsRaw
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => normalizeRemoteAssistSession(item)),
  };
}

export async function ensureRemoteAssistSession(): Promise<RemoteAssistSession> {
  const raw = await apiRequest<unknown>(`${BASE}/EnsureSession`, { method: 'POST' });
  return normalizeRemoteAssistSession(unwrap<Record<string, unknown>>(raw));
}

export async function changeRemoteAssistPassword(body: {
  sessionId: number;
  newPassword?: string | null;
}): Promise<RemoteAssistSession> {
  const raw = await apiRequest<unknown>(`${BASE}/ChangePassword`, {
    method: 'POST',
    body: {
      sessionId: body.sessionId,
      newPassword: body.newPassword ?? undefined,
    },
  });
  return normalizeRemoteAssistSession(unwrap<Record<string, unknown>>(raw));
}

export async function requestRemoteAssistConnect(body: {
  oneTimeSessionCode: string;
  sessionUsername: string;
  sessionPassword: string;
}): Promise<RemoteAssistSessionAccepted> {
  const raw = await apiRequest<unknown>(`${BASE}/RequestConnect`, {
    method: 'POST',
    body: {
      oneTimeSessionCode: body.oneTimeSessionCode.trim(),
      sessionUsername: body.sessionUsername.trim(),
      sessionPassword: body.sessionPassword,
    },
  });
  return normalizeAccepted(unwrap<Record<string, unknown>>(raw));
}

export async function requestRemoteAssistReconnect(
  studentUserId: number | string
): Promise<RemoteAssistSessionAccepted> {
  const raw = await apiRequest<unknown>(`${BASE}/Reconnect`, {
    method: 'POST',
    body: { studentUserId },
  });
  return normalizeAccepted(unwrap<Record<string, unknown>>(raw));
}

export async function confirmRemoteAssistConsent(
  body: RemoteAssistConsentPayload
): Promise<RemoteAssistSession> {
  const raw = await apiRequest<unknown>(`${BASE}/ConfirmConsent`, {
    method: 'POST',
    body,
  });
  return normalizeRemoteAssistSession(unwrap<Record<string, unknown>>(raw));
}

export async function denyRemoteAssistConsent(sessionId: number): Promise<RemoteAssistSession> {
  const raw = await apiRequest<unknown>(`${BASE}/DenyConsent`, {
    method: 'POST',
    body: { sessionId },
  });
  return normalizeRemoteAssistSession(unwrap<Record<string, unknown>>(raw));
}

export async function endRemoteAssistSession(sessionId: number): Promise<void> {
  await apiRequest(`${BASE}/End`, {
    method: 'POST',
    body: { sessionId },
  });
}

export async function deleteRemoteAssistHistory(params?: {
  sessionId?: number | string | null;
  studentUserId?: number | string | null;
  teacherUserId?: number | string | null;
}): Promise<number> {
  const sessionId =
    params?.sessionId != null && String(params.sessionId).trim() !== '' && String(params.sessionId) !== '0'
      ? String(params.sessionId).trim()
      : undefined;
  const studentUserId =
    params?.studentUserId != null && String(params.studentUserId).trim() !== '' && String(params.studentUserId) !== '0'
      ? String(params.studentUserId).trim()
      : undefined;
  const teacherUserId =
    params?.teacherUserId != null && String(params.teacherUserId).trim() !== '' && String(params.teacherUserId) !== '0'
      ? String(params.teacherUserId).trim()
      : undefined;

  const raw = await apiRequest<unknown>(`${BASE}/DeleteHistory`, {
    method: 'POST',
    body: {
      sessionId,
      studentUserId,
      teacherUserId,
    },
  });

  // Command Edit returns raw data (int) or wrapped envelope.
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && /^\d+$/.test(raw)) return Number(raw);

  const unwrapped = unwrap<Record<string, unknown> | number>(raw);
  if (typeof unwrapped === 'number') return unwrapped;
  if (unwrapped && typeof unwrapped === 'object') {
    const value =
      (unwrapped as Record<string, unknown>).queryResult ??
      (unwrapped as Record<string, unknown>).QueryResult ??
      (unwrapped as Record<string, unknown>).data ??
      (unwrapped as Record<string, unknown>).Data;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  }
  return 0;
}

export async function getMyActiveRemoteAssistSession(): Promise<RemoteAssistSession | null> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyActive`);
  const value = unwrap<Record<string, unknown> | null>(raw);
  if (!value || typeof value !== 'object') return null;
  const sessionId = Number(value.sessionId ?? value.SessionId ?? 0);
  if (!sessionId) return null;
  return normalizeRemoteAssistSession(value);
}

export async function getRemoteAssistHistory(params?: {
  studentUserId?: number | string | null;
  teacherUserId?: number | string | null;
  pageNumber?: number;
  pageSize?: number;
}): Promise<RemoteAssistHistoryPage> {
  const search = new URLSearchParams();
  // Prefer string ids to avoid JS number precision loss on large snowflake ids.
  const student =
    params?.studentUserId != null && String(params.studentUserId).trim() !== '' && String(params.studentUserId) !== '0'
      ? String(params.studentUserId).trim()
      : null;
  // Do not send teacherUserId for self-history; server scopes teachers by ActorUserId.
  // Only admins need an explicit teacher filter.
  const teacher =
    params?.teacherUserId != null && String(params.teacherUserId).trim() !== '' && String(params.teacherUserId) !== '0'
      ? String(params.teacherUserId).trim()
      : null;
  if (student) search.set('studentUserId', student);
  if (teacher) search.set('teacherUserId', teacher);
  search.set('pageNumber', String(params?.pageNumber ?? 1));
  search.set('pageSize', String(params?.pageSize ?? 20));
  const qs = search.toString();
  const raw = await apiRequest<unknown>(`${BASE}/History?${qs}`);
  return normalizeHistoryPage(raw);
}

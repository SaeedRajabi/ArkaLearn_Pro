import apiClient from '@/lib/apiClient';

const BASE = 'RemoteAssist';

export type RemoteAssistSession = {
  sessionId: number;
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

function unwrap<T>(raw: unknown): T {
  const root = raw as Record<string, unknown> | null | undefined;
  if (!root) return {} as T;
  const data = (root.data ?? root.Data ?? root.result ?? root.Result ?? root) as Record<string, unknown>;
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
    if ('items' in obj || 'Items' in obj || 'pageNumber' in obj || 'PageNumber' in obj) {
      return obj;
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

export async function requestRemoteAssistConnect(body: {
  oneTimeSessionCode: string;
  sessionUsername: string;
  sessionPassword: string;
}): Promise<RemoteAssistSessionAccepted> {
  const { data } = await apiClient.post(
    `${BASE}/RequestConnect`,
    {
      oneTimeSessionCode: body.oneTimeSessionCode.trim(),
      sessionUsername: body.sessionUsername.trim(),
      sessionPassword: body.sessionPassword,
    },
    { withCredentials: true }
  );
  return normalizeAccepted(unwrap<Record<string, unknown>>(data));
}

export async function endRemoteAssistSession(sessionId: number): Promise<void> {
  await apiClient.post(`${BASE}/End`, { sessionId }, { withCredentials: true });
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

  const { data } = await apiClient.post(
    `${BASE}/DeleteHistory`,
    { sessionId, studentUserId, teacherUserId },
    { withCredentials: true }
  );

  if (typeof data === 'number') return data;
  if (typeof data === 'string' && /^\d+$/.test(data)) return Number(data);

  const unwrapped = unwrap<Record<string, unknown> | number | string>(data);
  if (typeof unwrapped === 'number') return unwrapped;
  if (typeof unwrapped === 'string' && /^\d+$/.test(unwrapped)) return Number(unwrapped);
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

export async function getRemoteAssistHistory(params?: {
  studentUserId?: number | string | null;
  teacherUserId?: number | string | null;
  pageNumber?: number;
  pageSize?: number;
}): Promise<RemoteAssistHistoryPage> {
  const studentUserId =
    params?.studentUserId != null && String(params.studentUserId).trim() !== ''
      ? String(params.studentUserId).trim()
      : undefined;
  const teacherUserId =
    params?.teacherUserId != null && String(params.teacherUserId).trim() !== ''
      ? String(params.teacherUserId).trim()
      : undefined;

  const { data } = await apiClient.get(`${BASE}/History`, {
    params: {
      studentUserId: studentUserId && studentUserId !== '0' ? studentUserId : undefined,
      teacherUserId: teacherUserId && teacherUserId !== '0' ? teacherUserId : undefined,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 20,
    },
    withCredentials: true,
  });
  return normalizeHistoryPage(data);
}

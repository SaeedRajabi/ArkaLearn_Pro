import { apiRequest, buildQuery, getApiErrorMessage } from './client';
import { unwrapApiList } from '@/lib/api/normalize-list';
import { API_BASE_URL } from './config';

const BASE = 'SupportTicket';
const REQUEST_TIMEOUT_MS = 30_000;

async function platformSupportRequest<T>(path: string, options?: Parameters<typeof apiRequest>[1]): Promise<T> {
  return apiRequest<T>(path, { timeoutMs: REQUEST_TIMEOUT_MS, credentials: 'include', ...options });
}

export const PLATFORM_TICKET_MESSAGE_PAGE_SIZE = 10;

export type PlatformSupportDepartment =
  | 'Support'
  | 'Services'
  | 'Sales'
  | 'SoftwareDevelopment';

export type PlatformSupportTicketRow = {
  id: number;
  displayNumber: number;
  displayCode: string;
  subject: string;
  status: string;
  department: PlatformSupportDepartment | string;
  createdDateTime?: string | null;
  lastMessageAtUtc?: string | null;
  lastMessagePreview?: string | null;
};

export type PlatformSupportTicketMessageRow = {
  id: number;
  senderUserId: number;
  senderName: string;
  contentHtml: string;
  sentAtUtc: string;
  isMine: boolean;
  isStaffMessage: boolean;
  isDeleted?: boolean;
  editedAtUtc?: string | null;
  replyToMessageId?: number | null;
  replyToSenderName?: string | null;
  replyToContentPreview?: string | null;
};

export type PlatformSupportTicketDetail = {
  id: number;
  displayNumber: number;
  displayCode: string;
  ticketSource: string;
  subject: string;
  status: string;
  department: string;
  requesterName: string;
  requesterEmail: string;
  requesterAvatarUrl?: string | null;
  requesterUserId?: number | null;
  message?: string | null;
  adminReply?: string | null;
  firstViewedAtUtc?: string | null;
  closedAtUtc?: string | null;
  rating?: number | null;
  ratingComment?: string | null;
  createdDateTime?: string | null;
  hasMoreOlderMessages: boolean;
  messages: PlatformSupportTicketMessageRow[];
};

export type PlatformTicketMessagePostedPayload = {
  ticketId: number;
  messageId: number;
  senderUserId: number;
  senderName: string;
  contentHtml: string;
  sentAtUtc: string;
  isStaffMessage: boolean;
  requesterUserId: number;
  status: string;
  subject: string;
  replyToMessageId?: number | null;
  replyToSenderName?: string | null;
  replyToContentPreview?: string | null;
};

export type PlatformTicketOpenedPayload = {
  ticketId: number;
  displayNumber: number;
  displayCode: string;
  subject: string;
  department: string;
  status: string;
  requesterUserId: number;
  requesterName: string;
  lastMessagePreview?: string | null;
};

export type PlatformTicketStatusChangedPayload = {
  ticketId: number;
  status: string;
  requesterUserId: number;
};

function unwrapDetail(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? raw;
  return (typeof layer === 'object' && layer !== null && !Array.isArray(layer) ? layer : raw) as Record<
    string,
    unknown
  >;
}

function unwrapApiObject(raw: unknown): Record<string, unknown> | null {
  const payload = unwrapDetail(raw);
  if (!payload || Object.keys(payload).length === 0) return null;
  return payload;
}

function unwrapApiListPayload(raw: unknown): unknown[] {
  if (!raw || typeof raw !== 'object') return unwrapApiList(raw);
  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? raw;
  return unwrapApiList(layer);
}

function mapTicketRow(raw: Record<string, unknown>): PlatformSupportTicketRow {
  const displayNumber = Number(raw.displayNumber ?? raw.DisplayNumber ?? 0);
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    displayNumber,
    displayCode: String(raw.displayCode ?? raw.DisplayCode ?? `ARKS-${String(displayNumber).padStart(6, '0')}`),
    subject: String(raw.subject ?? raw.Subject ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
    department: String(raw.department ?? raw.Department ?? ''),
    createdDateTime: (raw.createdDateTime ?? raw.CreatedDateTime ?? null) as string | null,
    lastMessageAtUtc: (raw.lastMessageAtUtc ?? raw.LastMessageAtUtc ?? null) as string | null,
    lastMessagePreview: (raw.lastMessagePreview ?? raw.LastMessagePreview ?? null) as string | null,
  };
}

function mapMessageRow(raw: Record<string, unknown>): PlatformSupportTicketMessageRow {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    senderUserId: Number(raw.senderUserId ?? raw.SenderUserId ?? 0),
    senderName: String(raw.senderName ?? raw.SenderName ?? ''),
    contentHtml: String(raw.contentHtml ?? raw.ContentHtml ?? ''),
    sentAtUtc: String(raw.sentAtUtc ?? raw.SentAtUtc ?? ''),
    isMine: Boolean(raw.isMine ?? raw.IsMine),
    isStaffMessage: Boolean(raw.isStaffMessage ?? raw.IsStaffMessage),
    isDeleted: Boolean(raw.isDeleted ?? raw.IsDeleted),
    editedAtUtc: (raw.editedAtUtc ?? raw.EditedAtUtc ?? null) as string | null,
    replyToMessageId:
      raw.replyToMessageId != null || raw.ReplyToMessageId != null
        ? Number(raw.replyToMessageId ?? raw.ReplyToMessageId)
        : null,
    replyToSenderName: (raw.replyToSenderName ?? raw.ReplyToSenderName ?? null) as string | null,
    replyToContentPreview: (raw.replyToContentPreview ?? raw.ReplyToContentPreview ?? null) as string | null,
  };
}

function mapDetail(raw: Record<string, unknown>): PlatformSupportTicketDetail {
  const displayNumber = Number(raw.displayNumber ?? raw.DisplayNumber ?? 0);
  const messagesRaw = raw.messages ?? raw.Messages;
  const messages = unwrapApiList<Record<string, unknown>>(messagesRaw).map(mapMessageRow);
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    displayNumber,
    displayCode: String(raw.displayCode ?? raw.DisplayCode ?? `ARKS-${String(displayNumber).padStart(6, '0')}`),
    ticketSource: String(raw.ticketSource ?? raw.TicketSource ?? ''),
    subject: String(raw.subject ?? raw.Subject ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
    department: String(raw.department ?? raw.Department ?? ''),
    requesterName: String(raw.requesterName ?? raw.RequesterName ?? ''),
    requesterEmail: String(raw.requesterEmail ?? raw.RequesterEmail ?? ''),
    requesterAvatarUrl: (raw.requesterAvatarUrl ?? raw.RequesterAvatarUrl ?? null) as string | null,
    requesterUserId:
      raw.requesterUserId != null || raw.RequesterUserId != null
        ? Number(raw.requesterUserId ?? raw.RequesterUserId)
        : null,
    message: (raw.message ?? raw.Message ?? null) as string | null,
    adminReply: (raw.adminReply ?? raw.AdminReply ?? null) as string | null,
    firstViewedAtUtc: (raw.firstViewedAtUtc ?? raw.FirstViewedAtUtc ?? null) as string | null,
    closedAtUtc: (raw.closedAtUtc ?? raw.ClosedAtUtc ?? null) as string | null,
    rating: raw.rating != null || raw.Rating != null ? Number(raw.rating ?? raw.Rating) : null,
    ratingComment: (raw.ratingComment ?? raw.RatingComment ?? null) as string | null,
    createdDateTime: (raw.createdDateTime ?? raw.CreatedDateTime ?? null) as string | null,
    hasMoreOlderMessages: Boolean(raw.hasMoreOlderMessages ?? raw.HasMoreOlderMessages),
    messages,
  };
}

export function mapRealtimePlatformMessage(
  payload: PlatformTicketMessagePostedPayload,
  currentUserId: number
): PlatformSupportTicketMessageRow {
  return {
    id: payload.messageId,
    senderUserId: payload.senderUserId,
    senderName: payload.senderName,
    contentHtml: payload.contentHtml,
    sentAtUtc: payload.sentAtUtc,
    isMine: !payload.isStaffMessage && payload.senderUserId === currentUserId,
    isStaffMessage: payload.isStaffMessage,
    replyToMessageId: payload.replyToMessageId ?? null,
    replyToSenderName: payload.replyToSenderName ?? null,
    replyToContentPreview: payload.replyToContentPreview ?? null,
  };
}

export async function getMyPlatformSupportTickets(): Promise<PlatformSupportTicketRow[]> {
  const raw = await platformSupportRequest<unknown>(`${BASE}/Platform/GetMy`);
  return unwrapApiListPayload(raw)
    .map((row) => mapTicketRow(row as Record<string, unknown>))
    .filter((row) => row.id > 0);
}

export async function getPlatformSupportTicket(
  ticketId: number,
  messageTake = PLATFORM_TICKET_MESSAGE_PAGE_SIZE,
  beforeMessageId?: number
): Promise<PlatformSupportTicketDetail | null> {
  const raw = await platformSupportRequest<unknown>(
    `${BASE}/Platform/GetById${buildQuery({ ticketId, messageTake, beforeMessageId })}`
  );
  const payload = unwrapApiObject(raw);
  if (!payload || Object.keys(payload).length === 0) return null;
  return mapDetail(payload);
}

export async function createPlatformSupportTicket(payload: {
  subject: string;
  department: PlatformSupportDepartment;
  contentHtml: string;
}): Promise<number> {
  const raw = await platformSupportRequest<unknown>(`${BASE}/Platform/Create`, {
    method: 'POST',
    body: {
      subject: payload.subject.trim(),
      department: payload.department,
      contentHtml: payload.contentHtml,
    },
  });

  const parseId = (value: unknown): number => {
    const id = Number(typeof value === 'string' || typeof value === 'number' ? value : 0);
    return Number.isFinite(id) && id > 0 ? id : 0;
  };

  if (typeof raw === 'string' || typeof raw === 'number') {
    const direct = parseId(raw);
    if (direct > 0) return direct;
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const layer = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? obj;
    const fromLayer = parseId(layer);
    if (fromLayer > 0) return fromLayer;
    if (layer && typeof layer === 'object' && !Array.isArray(layer)) {
      const nested = layer as Record<string, unknown>;
      const fromNested = parseId(nested.id ?? nested.Id ?? nested.data ?? nested.Data);
      if (fromNested > 0) return fromNested;
    }
    const fromObj = parseId(obj.id ?? obj.Id);
    if (fromObj > 0) return fromObj;
  }

  throw new Error('Invalid ticket id returned.');
}

export async function sendPlatformSupportTicketMessage(payload: {
  ticketId: number;
  contentHtml: string;
  replyToMessageId?: number;
}): Promise<number> {
  const raw = await platformSupportRequest<unknown>(`${BASE}/Platform/SendMessage`, {
    method: 'POST',
    body: payload,
  });
  const id = Number(String(raw ?? '').trim());
  return Number.isFinite(id) && id > 0 ? id : 0;
}

export async function closePlatformSupportTicket(payload: {
  ticketId: number;
  rating?: number;
  ratingComment?: string;
}): Promise<void> {
  await platformSupportRequest(`${BASE}/Platform/Close`, { method: 'POST', body: payload });
}

async function uploadPlatformFile(endpoint: string, file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}/${BASE}/Platform/${endpoint}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  if (!res.ok) {
    const parsed = await res.json().catch(() => null);
    throw new Error(getApiErrorMessage(parsed, 'Upload failed'));
  }
  const data = (await res.json()) as { url?: string };
  if (!data?.url) throw new Error('Upload failed');
  return data.url;
}

export const uploadPlatformSupportImage = (file: File) => uploadPlatformFile('UploadImage', file);
export const uploadPlatformSupportAudio = (file: File) => uploadPlatformFile('UploadAudio', file);
export const uploadPlatformSupportVideo = (file: File) => uploadPlatformFile('UploadVideo', file);

export function stripPlatformMessageHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export { getApiErrorMessage as getPlatformSupportErrorMessage };

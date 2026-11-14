import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';
import { getBackendApiOrigin } from '@/lib/api-config';
import { unwrapApiList, unwrapApiObject } from '@/lib/api/normalize-list';

const ADMIN_BASE = 'SupportTicketAdmin';
const LEGACY_BASE = 'SupportTicket';

export const ADMIN_PLATFORM_TICKET_MESSAGE_PAGE_SIZE = 10;

export type SupportTicketStatus = 'Open' | 'Replied' | 'UnderReview' | 'Answered' | 'Closed' | string;

export type SearchSupportTicketItem = {
  id: number;
  displayNumber: number;
  displayCode: string;
  ticketSource: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  department: string;
  requesterName: string;
  requesterEmail: string;
  createdDateTime: string;
  lastMessageAtUtc?: string | null;
  lastMessagePreview?: string | null;
};

export type PlatformSupportTicketMessage = {
  id: number;
  senderUserId: number;
  senderName: string;
  contentHtml: string;
  sentAtUtc: string;
  isMine: boolean;
  isStaffMessage: boolean;
  replyToMessageId?: number | null;
  replyToSenderName?: string | null;
  replyToContentPreview?: string | null;
};

export type SupportTicketDetail = {
  id: number;
  displayNumber: number;
  displayCode: string;
  ticketSource: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  department: string;
  requesterName: string;
  requesterEmail: string;
  requesterAvatarUrl?: string | null;
  adminReply?: string | null;
  repliedAt?: string | null;
  repliedByUserId?: number | null;
  firstViewedAtUtc?: string | null;
  closedAtUtc?: string | null;
  rating?: number | null;
  ratingComment?: string | null;
  createdDateTime: string;
  hasMoreOlderMessages: boolean;
  messages: PlatformSupportTicketMessage[];
};

type PagedResponse = {
  queryResult?: SearchSupportTicketItem[] | { $values?: SearchSupportTicketItem[] };
  totalCount?: number;
  QueryResult?: SearchSupportTicketItem[] | { $values?: SearchSupportTicketItem[] };
  TotalCount?: number;
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if ('data' in obj && obj.data && typeof obj.data === 'object') return unwrap<T>(obj.data);
  return obj as T;
}

function extractList(raw: PagedResponse): SearchSupportTicketItem[] {
  const qr = raw.queryResult ?? raw.QueryResult;
  if (Array.isArray(qr)) return qr;
  if (qr && typeof qr === 'object' && Array.isArray((qr as { $values?: unknown[] }).$values)) {
    return (qr as { $values: SearchSupportTicketItem[] }).$values;
  }
  return [];
}

function mapSearchItem(row: Record<string, unknown>): SearchSupportTicketItem {
  const displayNumber = Number(row.displayNumber ?? row.DisplayNumber ?? 0);
  return {
    id: Number(row.id ?? row.Id ?? 0),
    displayNumber,
    displayCode: String(row.displayCode ?? row.DisplayCode ?? `ARKS-${String(displayNumber).padStart(6, '0')}`),
    ticketSource: String(row.ticketSource ?? row.TicketSource ?? 'Contact'),
    subject: String(row.subject ?? row.Subject ?? ''),
    message: String(row.message ?? row.Message ?? ''),
    status: String(row.status ?? row.Status ?? 'Open'),
    department: String(row.department ?? row.Department ?? ''),
    requesterName: String(row.requesterName ?? row.RequesterName ?? ''),
    requesterEmail: String(row.requesterEmail ?? row.RequesterEmail ?? ''),
    createdDateTime: String(row.createdDateTime ?? row.CreatedDateTime ?? ''),
    lastMessageAtUtc: (row.lastMessageAtUtc ?? row.LastMessageAtUtc ?? null) as string | null,
    lastMessagePreview: (row.lastMessagePreview ?? row.LastMessagePreview ?? null) as string | null,
  };
}

function mapMessage(row: Record<string, unknown>): PlatformSupportTicketMessage {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    senderUserId: Number(row.senderUserId ?? row.SenderUserId ?? 0),
    senderName: String(row.senderName ?? row.SenderName ?? ''),
    contentHtml: String(row.contentHtml ?? row.ContentHtml ?? ''),
    sentAtUtc: String(row.sentAtUtc ?? row.SentAtUtc ?? ''),
    isMine: Boolean(row.isMine ?? row.IsMine),
    isStaffMessage: Boolean(row.isStaffMessage ?? row.IsStaffMessage),
    replyToMessageId:
      row.replyToMessageId != null || row.ReplyToMessageId != null
        ? Number(row.replyToMessageId ?? row.ReplyToMessageId)
        : null,
    replyToSenderName: (row.replyToSenderName ?? row.ReplyToSenderName ?? null) as string | null,
    replyToContentPreview: (row.replyToContentPreview ?? row.ReplyToContentPreview ?? null) as string | null,
  };
}

function mapDetail(row: Record<string, unknown>): SupportTicketDetail {
  const displayNumber = Number(row.displayNumber ?? row.DisplayNumber ?? 0);
  const messagesRaw = row.messages ?? row.Messages;
  const messages = unwrapApiList<Record<string, unknown>>(messagesRaw).map(mapMessage);
  return {
    id: Number(row.id ?? row.Id ?? 0),
    displayNumber,
    displayCode: String(row.displayCode ?? row.DisplayCode ?? `ARKS-${String(displayNumber).padStart(6, '0')}`),
    ticketSource: String(row.ticketSource ?? row.TicketSource ?? 'Contact'),
    subject: String(row.subject ?? row.Subject ?? ''),
    message: String(row.message ?? row.Message ?? ''),
    status: String(row.status ?? row.Status ?? 'Open'),
    department: String(row.department ?? row.Department ?? ''),
    requesterName: String(row.requesterName ?? row.RequesterName ?? ''),
    requesterEmail: String(row.requesterEmail ?? row.RequesterEmail ?? ''),
    requesterAvatarUrl: (row.requesterAvatarUrl ?? row.RequesterAvatarUrl ?? null) as string | null,
    adminReply: (row.adminReply ?? row.AdminReply ?? null) as string | null,
    repliedAt: (row.repliedAt ?? row.RepliedAt ?? null) as string | null,
    repliedByUserId:
      row.repliedByUserId != null || row.RepliedByUserId != null
        ? Number(row.repliedByUserId ?? row.RepliedByUserId)
        : null,
    firstViewedAtUtc: (row.firstViewedAtUtc ?? row.FirstViewedAtUtc ?? null) as string | null,
    closedAtUtc: (row.closedAtUtc ?? row.ClosedAtUtc ?? null) as string | null,
    rating: row.rating != null || row.Rating != null ? Number(row.rating ?? row.Rating) : null,
    ratingComment: (row.ratingComment ?? row.RatingComment ?? null) as string | null,
    createdDateTime: String(row.createdDateTime ?? row.CreatedDateTime ?? ''),
    hasMoreOlderMessages: Boolean(row.hasMoreOlderMessages ?? row.HasMoreOlderMessages),
    messages,
  };
}

export async function searchSupportTickets(params: {
  inputValue?: string;
  status?: string;
  ticketSource?: string;
  department?: string;
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
}): Promise<{ items: SearchSupportTicketItem[]; totalCount: number }> {
  const res = await apiClient.get<unknown>(`${ADMIN_BASE}/Search`, {
    params: {
      inputValue: params.inputValue ?? '',
      status: params.status ?? '',
      ticketSource: params.ticketSource ?? '',
      department: params.department ?? '',
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
      needTotalCount: params.needTotalCount ?? true,
    },
    withCredentials: true,
  });
  const payload = unwrap<PagedResponse>(res.data) ?? {};
  const list = extractList(payload).map((x) => mapSearchItem(x as unknown as Record<string, unknown>));
  return {
    items: list,
    totalCount: Number(payload.totalCount ?? payload.TotalCount ?? list.length),
  };
}

export async function getSupportTicketById(
  ticketId: number,
  messageTake = ADMIN_PLATFORM_TICKET_MESSAGE_PAGE_SIZE,
  beforeMessageId?: number,
): Promise<SupportTicketDetail | null> {
  const res = await apiClient.get<unknown>(`${ADMIN_BASE}/GetById`, {
    params: { ticketId, messageTake, beforeMessageId },
    withCredentials: true,
  });
  const payload = unwrapApiObject(res.data);
  if (!payload || Object.keys(payload).length === 0) return null;
  return mapDetail(payload);
}

export async function replySupportTicket(payload: {
  ticketId: number;
  replyMessage: string;
}): Promise<void> {
  await apiWriteUpdate(`/${LEGACY_BASE}/Reply`, payload);
}

export async function sendAdminPlatformTicketMessage(payload: {
  ticketId: number;
  contentHtml: string;
  replyToMessageId?: number;
}): Promise<void> {
  await apiClient.post(
    `${ADMIN_BASE}/SendMessage`,
    {
      ticketId: payload.ticketId,
      contentHtml: payload.contentHtml,
      replyToMessageId: payload.replyToMessageId,
    },
    { withCredentials: true },
  );
}

async function uploadPlatformFile(action: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`${ADMIN_BASE}/${action}`, formData, {
    withCredentials: true,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const payload = unwrapApiObject(response.data);
  const url = (payload.url ?? payload.Url) as string | undefined;
  if (!url) throw new Error('Upload failed');
  return url.startsWith('http') ? url : `${getBackendApiOrigin()}${url.startsWith('/') ? url : `/${url}`}`;
}

export const uploadAdminPlatformTicketImage = (file: File) => uploadPlatformFile('UploadImage', file);
export const uploadAdminPlatformTicketAudio = (file: File) => uploadPlatformFile('UploadAudio', file);
export const uploadAdminPlatformTicketVideo = (file: File) => uploadPlatformFile('UploadVideo', file);

export function stripPlatformTicketHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

import apiClient from '@/lib/apiClient';
import { getBackendApiOrigin } from '@/lib/api-config';
import { readPagedTotalCount, unwrapApiList, unwrapApiObject } from '@/lib/api/normalize-list';
import { asLongId } from '@/lib/id';

const ADMIN_BASE = 'SupportChatAdmin';
const CHAT_BASE = 'SupportChat';

export const ADMIN_SUPPORT_MESSAGE_PAGE_SIZE = 10;

export type AdminSupportTeacherRow = {
  teacherId: string;
  teacherUserId: string;
  displayName: string;
  studentCount: number;
  conversationCount: number;
};

export type AdminSupportConversationRow = {
  id: string;
  subject: string;
  status: string;
  studentUserId: string;
  studentName: string;
  createdAtUtc: string;
  lastMessageAtUtc?: string | null;
  lastMessagePreview?: string | null;
};

export type AdminSupportMessageRow = {
  id: string;
  senderUserId: string;
  senderName: string;
  contentHtml: string;
  sentAtUtc: string;
  isMine: boolean;
  isStaffMessage?: boolean;
  isDeleted?: boolean;
  editedAtUtc?: string | null;
  replyToMessageId?: string | null;
  replyToSenderName?: string | null;
  replyToContentPreview?: string | null;
  deliveryStatus?: 'sent' | 'delivered' | 'read' | null;
};

export type AdminSupportConversationDetail = {
  id: string;
  subject: string;
  status: string;
  studentUserId: string;
  teacherUserId: string;
  studentName: string;
  teacherName: string;
  createdAtUtc: string;
  hasRating: boolean;
  hasMoreOlderMessages: boolean;
  messages: AdminSupportMessageRow[];
};

function normalizeTeacher(raw: Record<string, unknown>): AdminSupportTeacherRow {
  return {
    teacherId: asLongId(raw.teacherId ?? raw.TeacherId),
    teacherUserId: asLongId(raw.teacherUserId ?? raw.TeacherUserId),
    displayName: String(raw.displayName ?? raw.DisplayName ?? ''),
    studentCount: Number(raw.studentCount ?? raw.StudentCount ?? 0),
    conversationCount: Number(raw.conversationCount ?? raw.ConversationCount ?? 0),
  };
}

function normalizeConversation(raw: Record<string, unknown>): AdminSupportConversationRow {
  return {
    id: asLongId(raw.id ?? raw.Id),
    subject: String(raw.subject ?? raw.Subject ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
    studentUserId: asLongId(raw.studentUserId ?? raw.StudentUserId),
    studentName: String(raw.studentName ?? raw.StudentName ?? ''),
    createdAtUtc: String(raw.createdAtUtc ?? raw.CreatedAtUtc ?? ''),
    lastMessageAtUtc: (raw.lastMessageAtUtc ?? raw.LastMessageAtUtc ?? null) as string | null,
    lastMessagePreview: (raw.lastMessagePreview ?? raw.LastMessagePreview ?? null) as string | null,
  };
}

function normalizeMessage(raw: Record<string, unknown>): AdminSupportMessageRow {
  const replyRaw = raw.replyToMessageId ?? raw.ReplyToMessageId;
  return {
    id: asLongId(raw.id ?? raw.Id),
    senderUserId: asLongId(raw.senderUserId ?? raw.SenderUserId),
    senderName: String(raw.senderName ?? raw.SenderName ?? ''),
    contentHtml: String(raw.contentHtml ?? raw.ContentHtml ?? ''),
    sentAtUtc: String(raw.sentAtUtc ?? raw.SentAtUtc ?? ''),
    isMine: Boolean(raw.isMine ?? raw.IsMine),
    isStaffMessage: Boolean(raw.isStaffMessage ?? raw.IsStaffMessage),
    isDeleted: Boolean(raw.isDeleted ?? raw.IsDeleted),
    editedAtUtc: (raw.editedAtUtc ?? raw.EditedAtUtc ?? null) as string | null,
    replyToMessageId: replyRaw != null && replyRaw !== '' ? asLongId(replyRaw) : null,
    replyToSenderName: (raw.replyToSenderName ?? raw.ReplyToSenderName ?? null) as string | null,
    replyToContentPreview: (raw.replyToContentPreview ?? raw.ReplyToContentPreview ?? null) as string | null,
    deliveryStatus: (() => {
      const value = String(raw.deliveryStatus ?? raw.DeliveryStatus ?? '').toLowerCase();
      if (value === 'sent' || value === 'delivered' || value === 'read') return value;
      return null;
    })(),
  };
}

function normalizeDetail(raw: Record<string, unknown>): AdminSupportConversationDetail {
  const messagesRaw = raw.messages ?? raw.Messages;
  const messages = unwrapApiList<Record<string, unknown>>(messagesRaw).map(normalizeMessage);

  return {
    id: asLongId(raw.id ?? raw.Id),
    subject: String(raw.subject ?? raw.Subject ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
    studentUserId: asLongId(raw.studentUserId ?? raw.StudentUserId),
    teacherUserId: asLongId(raw.teacherUserId ?? raw.TeacherUserId),
    studentName: String(raw.studentName ?? raw.StudentName ?? ''),
    teacherName: String(raw.teacherName ?? raw.TeacherName ?? ''),
    createdAtUtc: String(raw.createdAtUtc ?? raw.CreatedAtUtc ?? ''),
    hasRating: Boolean(raw.hasRating ?? raw.HasRating),
    hasMoreOlderMessages: Boolean(raw.hasMoreOlderMessages ?? raw.HasMoreOlderMessages),
    messages,
  };
}

export async function searchAdminSupportTeachers(params: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: AdminSupportTeacherRow[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 7;
  const response = await apiClient.get(`${ADMIN_BASE}/SearchTeachers`, {
    params: {
      InputValue: params.inputValue ?? '',
      PageNumber: pageNumber,
      PageSize: pageSize,
      NeedTotalCount: true,
    },
    withCredentials: true,
  });
  const paged = unwrapApiObject(response.data);
  const items = unwrapApiList<Record<string, unknown>>(paged.queryResult ?? paged.QueryResult ?? response.data)
    .map(normalizeTeacher);
  return { items, totalCount: readPagedTotalCount(response.data, items.length) };
}

export async function getAdminTeacherSupportConversations(
  teacherUserId: string,
): Promise<AdminSupportConversationRow[]> {
  const response = await apiClient.get(`${ADMIN_BASE}/GetTeacherConversations`, {
    params: { teacherUserId: asLongId(teacherUserId) },
    withCredentials: true,
  });
  return unwrapApiList<Record<string, unknown>>(response.data).map(normalizeConversation);
}

export async function getAdminSupportConversation(params: {
  teacherUserId: string;
  conversationId: string;
  messageTake?: number;
  beforeMessageId?: string;
}): Promise<AdminSupportConversationDetail | null> {
  const response = await apiClient.get(`${ADMIN_BASE}/GetConversationById`, {
    params: {
      teacherUserId: asLongId(params.teacherUserId),
      conversationId: asLongId(params.conversationId),
      messageTake: params.messageTake ?? ADMIN_SUPPORT_MESSAGE_PAGE_SIZE,
      beforeMessageId: params.beforeMessageId ? asLongId(params.beforeMessageId) : undefined,
    },
    withCredentials: true,
  });
  const detail = unwrapApiObject(response.data);
  if (!detail || Object.keys(detail).length === 0) return null;
  return normalizeDetail(detail);
}

export async function sendAdminSupportStaffMessage(params: {
  teacherUserId: string;
  conversationId: string;
  contentHtml: string;
  replyToMessageId?: string;
}): Promise<void> {
  await apiClient.post(
    `${ADMIN_BASE}/SendStaffMessage`,
    {
      teacherUserId: asLongId(params.teacherUserId),
      conversationId: asLongId(params.conversationId),
      contentHtml: params.contentHtml,
      replyToMessageId: params.replyToMessageId ? asLongId(params.replyToMessageId) : undefined,
    },
    { withCredentials: true },
  );
}

async function uploadSupportFile(action: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`${CHAT_BASE}/${action}`, formData, {
    withCredentials: true,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const payload = unwrapApiObject(response.data);
  const url = (payload.url ?? payload.Url) as string | undefined;
  if (!url) throw new Error('Upload failed');
  return url.startsWith('http') ? url : `${getBackendApiOrigin()}${url.startsWith('/') ? url : `/${url}`}`;
}

export const uploadAdminSupportChatImage = (file: File) => uploadSupportFile('UploadImage', file);
export const uploadAdminSupportChatAudio = (file: File) => uploadSupportFile('UploadAudio', file);
export const uploadAdminSupportChatVideo = (file: File) => uploadSupportFile('UploadVideo', file);

export function stripSupportMessageHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

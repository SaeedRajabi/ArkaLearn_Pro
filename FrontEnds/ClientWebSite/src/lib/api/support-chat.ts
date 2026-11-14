import { apiRequest, getApiErrorMessage } from './client';
import { unwrapApiList } from '@/lib/api/normalize-list';
import { asLongId, isValidLongId } from '@/lib/id';
import { API_BASE_URL } from './config';

const BASE = 'SupportChat';

export const SUPPORT_MESSAGE_PAGE_SIZE = 10;

export type SupportTeacherOption = {
  teacherUserId: string;
  displayName: string;
  email?: string | null;
  source: string;
};

export type SupportStudentRow = {
  studentUserId: string;
  displayName: string;
  email?: string | null;
  topicCount: number;
  unreadCount: number;
  lastMessageAtUtc?: string | null;
  lastMessagePreview?: string | null;
};

export const PROFESSOR_SUPPORT_STUDENTS_PAGE_SIZE = 5;

export type SupportConversationRow = {
  id: number;
  subject: string;
  status: string;
  studentUserId: number;
  teacherUserId: number;
  otherParticipantName: string;
  otherParticipantEmail?: string | null;
  createdAtUtc: string;
  lastMessageAtUtc?: string | null;
  unreadCount: number;
  lastMessagePreview?: string | null;
};

export type SupportMessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export type SupportMessageRow = {
  id: number;
  senderUserId: number;
  senderName: string;
  contentHtml: string;
  sentAtUtc: string;
  isMine: boolean;
  isDeleted?: boolean;
  editedAtUtc?: string | null;
  replyToMessageId?: number | null;
  replyToSenderName?: string | null;
  replyToContentPreview?: string | null;
  deliveryStatus?: SupportMessageDeliveryStatus | null;
};

export type SupportConversationDetail = {
  id: number;
  subject: string;
  status: string;
  studentUserId: number;
  teacherUserId: number;
  studentName: string;
  teacherName: string;
  createdAtUtc: string;
  hasRating: boolean;
  hasMoreOlderMessages: boolean;
  studentLastReadAtUtc?: string | null;
  teacherLastReadAtUtc?: string | null;
  messages: SupportMessageRow[];
};

export type SupportChatMessagePostedPayload = {
  conversationId: number;
  messageId: number;
  senderUserId: number;
  senderName: string;
  contentHtml: string;
  sentAtUtc: string;
  subject: string;
  studentUserId: number;
  teacherUserId: number;
  replyToMessageId?: number | null;
  replyToSenderName?: string | null;
  replyToContentPreview?: string | null;
};

export type SupportChatMessageUpdatedPayload = {
  conversationId: number;
  messageId: number;
  senderUserId: number;
  contentHtml: string;
  editedAtUtc?: string | null;
  studentUserId: number;
  teacherUserId: number;
};

export type SupportChatMessageDeletedPayload = {
  conversationId: number;
  messageId: number;
  studentUserId: number;
  teacherUserId: number;
};

export type SupportChatMessagesDeliveredPayload = {
  conversationId: number;
  recipientUserId: number;
  studentUserId: number;
  teacherUserId: number;
  messageIds: number[];
  deliveredAtUtc: string;
};

export type SupportChatMessagesReadPayload = {
  conversationId: number;
  readerUserId: number;
  studentUserId: number;
  teacherUserId: number;
  studentLastReadAtUtc?: string | null;
  teacherLastReadAtUtc?: string | null;
};

export type SupportChatConversationUpdatedPayload = {
  conversationId: number;
  subject: string;
  studentUserId: number;
  teacherUserId: number;
};

export type SupportChatConversationDeletedPayload = {
  conversationId: number;
  studentUserId: number;
  teacherUserId: number;
};

export type SupportChatClientSettings = {
  notificationSoundKey: string;
  unreadSmsDelayMinutes: number;
};

function extractList(raw: unknown): unknown[] {
  return unwrapApiList(raw);
}

const REQUEST_TIMEOUT_MS = 30_000;

async function supportRequest<T>(path: string, options?: Parameters<typeof apiRequest>[1]): Promise<T> {
  return apiRequest<T>(path, { timeoutMs: REQUEST_TIMEOUT_MS, ...options });
}

function num(row: Record<string, unknown>, camel: string, pascal: string) {
  return Number(row[camel] ?? row[pascal] ?? 0);
}

function str(row: Record<string, unknown>, camel: string, pascal: string) {
  return String(row[camel] ?? row[pascal] ?? '');
}

function mapTeacher(row: Record<string, unknown>): SupportTeacherOption {
  return {
    teacherUserId: asLongId(row.teacherUserId ?? row.TeacherUserId),
    displayName: str(row, 'displayName', 'DisplayName'),
    email: (row.email ?? row.Email ?? null) as string | null,
    source: str(row, 'source', 'Source'),
  };
}

function mapStudent(row: Record<string, unknown>): SupportStudentRow {
  return {
    studentUserId: asLongId(row.studentUserId ?? row.StudentUserId),
    displayName: str(row, 'displayName', 'DisplayName'),
    email: (row.email ?? row.Email ?? null) as string | null,
    topicCount: num(row, 'topicCount', 'TopicCount'),
    unreadCount: num(row, 'unreadCount', 'UnreadCount'),
    lastMessageAtUtc: (row.lastMessageAtUtc ?? row.LastMessageAtUtc ?? null) as string | null,
    lastMessagePreview: (row.lastMessagePreview ?? row.LastMessagePreview ?? null) as string | null,
  };
}

function mapConversation(row: Record<string, unknown>): SupportConversationRow {
  return {
    id: num(row, 'id', 'Id'),
    subject: str(row, 'subject', 'Subject'),
    status: str(row, 'status', 'Status').toLowerCase(),
    studentUserId: num(row, 'studentUserId', 'StudentUserId'),
    teacherUserId: num(row, 'teacherUserId', 'TeacherUserId'),
    otherParticipantName: str(row, 'otherParticipantName', 'OtherParticipantName'),
    otherParticipantEmail: (row.otherParticipantEmail ?? row.OtherParticipantEmail ?? null) as string | null,
    createdAtUtc: str(row, 'createdAtUtc', 'CreatedAtUtc'),
    lastMessageAtUtc: (row.lastMessageAtUtc ?? row.LastMessageAtUtc ?? null) as string | null,
    unreadCount: num(row, 'unreadCount', 'UnreadCount'),
    lastMessagePreview: (row.lastMessagePreview ?? row.LastMessagePreview ?? null) as string | null,
  };
}

function mapDeliveryStatus(raw: Record<string, unknown>): SupportMessageDeliveryStatus | null {
  const value = String(raw.deliveryStatus ?? raw.DeliveryStatus ?? '').toLowerCase();
  if (value === 'sent' || value === 'delivered' || value === 'read') return value;
  return null;
}

function mapMessage(row: Record<string, unknown>): SupportMessageRow {
  return {
    id: num(row, 'id', 'Id'),
    senderUserId: num(row, 'senderUserId', 'SenderUserId'),
    senderName: str(row, 'senderName', 'SenderName'),
    contentHtml: str(row, 'contentHtml', 'ContentHtml'),
    sentAtUtc: str(row, 'sentAtUtc', 'SentAtUtc'),
    isMine: Boolean(row.isMine ?? row.IsMine),
    isDeleted: Boolean(row.isDeleted ?? row.IsDeleted),
    editedAtUtc: (row.editedAtUtc ?? row.EditedAtUtc ?? null) as string | null,
    replyToMessageId: (row.replyToMessageId ?? row.ReplyToMessageId ?? null) as number | null,
    replyToSenderName: (row.replyToSenderName ?? row.ReplyToSenderName ?? null) as string | null,
    replyToContentPreview: (row.replyToContentPreview ?? row.ReplyToContentPreview ?? null) as string | null,
    deliveryStatus: mapDeliveryStatus(row),
  };
}

function unwrapDetail(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? raw;
  return (typeof layer === 'object' && layer !== null ? layer : raw) as Record<string, unknown>;
}

function mapDetail(raw: unknown): SupportConversationDetail {
  const row = unwrapDetail(raw);
  const messagesRaw = row.messages ?? row.Messages;
  return {
    id: num(row, 'id', 'Id'),
    subject: str(row, 'subject', 'Subject'),
    status: str(row, 'status', 'Status').toLowerCase(),
    studentUserId: num(row, 'studentUserId', 'StudentUserId'),
    teacherUserId: num(row, 'teacherUserId', 'TeacherUserId'),
    studentName: str(row, 'studentName', 'StudentName'),
    teacherName: str(row, 'teacherName', 'TeacherName'),
    createdAtUtc: str(row, 'createdAtUtc', 'CreatedAtUtc'),
    hasRating: Boolean(row.hasRating ?? row.HasRating),
    hasMoreOlderMessages: Boolean(row.hasMoreOlderMessages ?? row.HasMoreOlderMessages),
    studentLastReadAtUtc: (row.studentLastReadAtUtc ?? row.StudentLastReadAtUtc ?? null) as string | null,
    teacherLastReadAtUtc: (row.teacherLastReadAtUtc ?? row.TeacherLastReadAtUtc ?? null) as string | null,
    messages: extractList(messagesRaw).map((m) => mapMessage(m as Record<string, unknown>)),
  };
}

export async function getStudentSupportTeachers(): Promise<SupportTeacherOption[]> {
  const raw = await supportRequest<unknown>(`${BASE}/GetStudentTeachers`);
  return extractList(raw).map((x) => mapTeacher(x as Record<string, unknown>));
}

export async function getMySupportConversations(studentUserId?: string): Promise<SupportConversationRow[]> {
  const params = new URLSearchParams();
  const normalizedStudentId = asLongId(studentUserId);
  if (isValidLongId(normalizedStudentId)) {
    params.set('studentUserId', normalizedStudentId);
  }
  const qs = params.toString();
  const raw = await supportRequest<unknown>(`${BASE}/GetMyConversations${qs ? `?${qs}` : ''}`);
  return extractList(raw).map((x) => mapConversation(x as Record<string, unknown>));
}

export async function getMySupportStudents(params?: {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}): Promise<{ items: SupportStudentRow[]; totalCount: number; pageNumber: number; pageSize: number }> {
  const query = new URLSearchParams();
  query.set('pageNumber', String(params?.pageNumber ?? 1));
  query.set('pageSize', String(params?.pageSize ?? PROFESSOR_SUPPORT_STUDENTS_PAGE_SIZE));
  if (params?.search?.trim()) query.set('search', params.search.trim());

  const raw = await supportRequest<unknown>(`${BASE}/GetMySupportStudents?${query.toString()}`);
  const layer =
    raw && typeof raw === 'object'
      ? ((raw as Record<string, unknown>).data ??
          (raw as Record<string, unknown>).Data ??
          raw) as Record<string, unknown>
      : {};

  const items = extractList(layer.queryResult ?? layer.QueryResult).map((x) =>
    mapStudent(x as Record<string, unknown>)
  );
  return {
    items,
    totalCount: num(layer, 'totalCount', 'TotalCount'),
    pageNumber: num(layer, 'pageNumber', 'PageNumber') || params?.pageNumber || 1,
    pageSize: num(layer, 'pageSize', 'PageSize') || params?.pageSize || PROFESSOR_SUPPORT_STUDENTS_PAGE_SIZE,
  };
}

export async function getSupportConversation(
  conversationId: number,
  options?: { messageTake?: number; beforeMessageId?: number }
): Promise<SupportConversationDetail> {
  const messageTake = options?.messageTake ?? SUPPORT_MESSAGE_PAGE_SIZE;
  const params = new URLSearchParams({
    conversationId: String(conversationId),
    messageTake: String(messageTake),
  });
  if (options?.beforeMessageId != null && options.beforeMessageId > 0) {
    params.set('beforeMessageId', String(options.beforeMessageId));
  }
  const raw = await supportRequest<unknown>(`${BASE}/GetById?${params.toString()}`);
  return mapDetail(raw);
}

export async function openSupportConversation(payload: {
  teacherUserId: number | string;
  subject: string;
  initialMessageHtml?: string;
}): Promise<number> {
  const teacherUserId = asLongId(payload.teacherUserId);
  if (!isValidLongId(teacherUserId)) {
    throw new Error('Teacher is required.');
  }
  const subject = payload.subject.trim();
  const initialMessageHtml = payload.initialMessageHtml?.trim();

  const body: Record<string, unknown> = {
    teacherUserId,
    subject,
    TeacherUserId: teacherUserId,
    Subject: subject,
  };
  if (initialMessageHtml) {
    body.initialMessageHtml = initialMessageHtml;
    body.InitialMessageHtml = initialMessageHtml;
  }

  const raw = await supportRequest<unknown>(`${BASE}/Open`, { method: 'POST', body });
  const layer = unwrapDetail(raw);
  const id = Number(layer.id ?? layer.Id ?? raw);
  return Number.isFinite(id) ? id : Number(String(raw));
}

export { getApiErrorMessage as getSupportChatErrorMessage };

export async function sendSupportMessage(payload: {
  conversationId: number;
  contentHtml: string;
  replyToMessageId?: number;
}): Promise<number> {
  const raw = await supportRequest<unknown>(`${BASE}/SendMessage`, { method: 'POST', body: payload });
  const layer = unwrapDetail(raw);
  const id = Number(layer.id ?? layer.Id ?? layer.data ?? raw);
  if (Number.isFinite(id) && id > 0) return id;
  const asString = String(raw ?? '').trim();
  const parsed = Number(asString);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function updateSupportConversationSubject(payload: {
  conversationId: number;
  subject: string;
}): Promise<void> {
  await supportRequest(`${BASE}/UpdateSubject`, { method: 'POST', body: payload });
}

export async function deleteSupportConversation(conversationId: number): Promise<void> {
  await supportRequest(`${BASE}/DeleteConversation`, { method: 'POST', body: { conversationId } });
}

export async function updateSupportMessage(payload: {
  conversationId: number;
  messageId: number;
  contentHtml: string;
}): Promise<void> {
  await supportRequest(`${BASE}/UpdateMessage`, { method: 'POST', body: payload });
}

export async function deleteSupportMessage(payload: {
  conversationId: number;
  messageId: number;
}): Promise<void> {
  await supportRequest(`${BASE}/DeleteMessage`, { method: 'POST', body: payload });
}

export async function markSupportConversationRead(conversationId: number): Promise<void> {
  await supportRequest(`${BASE}/MarkRead`, { method: 'POST', body: { conversationId } });
}

export async function markSupportMessagesDelivered(
  conversationId: number,
  messageIds: number[]
): Promise<void> {
  const ids = messageIds.filter((id) => id > 0);
  if (ids.length === 0) return;
  await supportRequest(`${BASE}/MarkDelivered`, {
    method: 'POST',
    body: { conversationId, messageIds: ids },
  });
}

export async function closeSupportConversation(conversationId: number): Promise<void> {
  await supportRequest(`${BASE}/Close`, { method: 'POST', body: { conversationId } });
}

export async function reopenSupportConversation(conversationId: number): Promise<void> {
  await supportRequest(`${BASE}/Reopen`, { method: 'POST', body: { conversationId } });
}

export async function submitSupportConversationRating(payload: {
  conversationId: number;
  ratingLevel: number;
  feedback?: string;
}): Promise<void> {
  await supportRequest(`${BASE}/SubmitRating`, {
    method: 'POST',
    body: {
      conversationId: payload.conversationId,
      ratingLevel: payload.ratingLevel,
      feedback: payload.feedback?.trim() || undefined,
    },
  });
}

export async function getSupportChatClientSettings(): Promise<SupportChatClientSettings> {
  const raw = await supportRequest<unknown>(`${BASE}/GetClientSettings`);
  const row = unwrapDetail(raw);
  return {
    notificationSoundKey: str(row, 'notificationSoundKey', 'NotificationSoundKey') || 'chime',
    unreadSmsDelayMinutes: num(row, 'unreadSmsDelayMinutes', 'UnreadSmsDelayMinutes') || 10,
  };
}

export function mapRealtimeMessage(payload: Record<string, unknown>, currentUserId?: number | string): SupportMessageRow {
  const senderUserId = num(payload, 'senderUserId', 'SenderUserId');
  const mineId = currentUserId != null ? Number(asLongId(currentUserId)) : 0;
  return {
    id: num(payload, 'messageId', 'MessageId'),
    senderUserId,
    senderName: str(payload, 'senderName', 'SenderName'),
    contentHtml: str(payload, 'contentHtml', 'ContentHtml'),
    sentAtUtc: str(payload, 'sentAtUtc', 'SentAtUtc'),
    isMine: mineId > 0 ? senderUserId === mineId : false,
    replyToMessageId: (payload.replyToMessageId ?? payload.ReplyToMessageId ?? null) as number | null,
    replyToSenderName: (payload.replyToSenderName ?? payload.ReplyToSenderName ?? null) as string | null,
    replyToContentPreview: (payload.replyToContentPreview ?? payload.ReplyToContentPreview ?? null) as string | null,
    deliveryStatus: null,
  };
}

export function stripSupportMessageHtml(html: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent ?? div.innerText ?? '').replace(/\s+/g, ' ').trim();
  }
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function uploadFile(endpoint: string, file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${BASE}/${endpoint}`;
  const res = await fetch(url, { method: 'POST', body: form, credentials: 'include' });
  if (!res.ok) throw new Error('Upload failed');
  const json = (await res.json()) as { url?: string };
  return String(json.url ?? '');
}

export const uploadSupportChatImage = (file: File) => uploadFile('UploadImage', file);
export const uploadSupportChatAudio = (file: File) => uploadFile('UploadAudio', file);
export const uploadSupportChatVideo = (file: File) => uploadFile('UploadVideo', file);

export type TeacherStoryMediaKind = 0 | 1 | 2; // None | Image | Video

export type TeacherStoryItem = {
  id: number;
  teacherUserId: number;
  teacherName: string;
  teacherAvatarUrl?: string | null;
  caption: string;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  mediaKind: TeacherStoryMediaKind;
  durationSeconds: number;
  hasUnseen: boolean;
  createdAtUtc: string;
  expiresAtUtc: string;
};

function normalizeTeacherStory(raw: unknown): TeacherStoryItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = num(row, 'id', 'Id');
  if (!id) return null;
  return {
    id,
    teacherUserId: num(row, 'teacherUserId', 'TeacherUserId'),
    teacherName: str(row, 'teacherName', 'TeacherName') || 'استاد',
    teacherAvatarUrl: (row.teacherAvatarUrl ?? row.TeacherAvatarUrl ?? null) as string | null,
    caption: str(row, 'caption', 'Caption'),
    mediaUrl: (row.mediaUrl ?? row.MediaUrl ?? null) as string | null,
    thumbnailUrl: (row.thumbnailUrl ?? row.ThumbnailUrl ?? null) as string | null,
    mediaKind: (num(row, 'mediaKind', 'MediaKind') || 0) as TeacherStoryMediaKind,
    durationSeconds: num(row, 'durationSeconds', 'DurationSeconds') || 5,
    hasUnseen: Boolean(row.hasUnseen ?? row.HasUnseen ?? true),
    createdAtUtc: str(row, 'createdAtUtc', 'CreatedAtUtc'),
    expiresAtUtc: str(row, 'expiresAtUtc', 'ExpiresAtUtc'),
  };
}

export async function getActiveTeacherStories(): Promise<TeacherStoryItem[]> {
  const raw = await supportRequest<unknown>(`${BASE}/GetActiveStories`);
  return unwrapApiList(raw).map(normalizeTeacherStory).filter((x): x is TeacherStoryItem => Boolean(x));
}

export async function publishTeacherStory(payload: {
  caption: string;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  mediaKind: TeacherStoryMediaKind;
  durationSeconds?: number;
}): Promise<number> {
  const raw = await supportRequest<unknown>(`${BASE}/PublishStory`, {
    method: 'POST',
    body: {
      caption: payload.caption,
      mediaUrl: payload.mediaUrl || undefined,
      thumbnailUrl: payload.thumbnailUrl || undefined,
      mediaKind: payload.mediaKind,
      durationSeconds: payload.durationSeconds,
    },
  });
  if (typeof raw === 'number') return raw;
  const detail = unwrapDetail(raw);
  return num(detail, 'result', 'Result') || num(detail, 'data', 'Data') || num(detail, 'id', 'Id');
}

export async function registerTeacherStoryView(storyId: number): Promise<void> {
  await supportRequest(`${BASE}/RegisterStoryView`, {
    method: 'POST',
    body: { storyId },
  });
}

export async function deleteTeacherStory(storyId: number): Promise<void> {
  await supportRequest(`${BASE}/DeleteStory`, {
    method: 'POST',
    body: { storyId },
  });
}

export async function uploadTeacherStoryMedia(
  file: File,
  mediaKind: 'image' | 'video'
): Promise<{ url: string; mediaKind: TeacherStoryMediaKind }> {
  const form = new FormData();
  form.append('file', file);
  form.append('mediaKind', mediaKind);
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${BASE}/UploadStoryMedia`;
  const res = await fetch(url, { method: 'POST', body: form, credentials: 'include' });
  if (!res.ok) throw new Error('Upload failed');
  const json = (await res.json()) as { url?: string; mediaKind?: number };
  return {
    url: String(json.url ?? ''),
    mediaKind: (json.mediaKind === 2 ? 2 : 1) as TeacherStoryMediaKind,
  };
}

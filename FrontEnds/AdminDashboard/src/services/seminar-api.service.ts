import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';
import { getApiErrorMessage, isDuplicateTitleResponse } from '@/lib/api-command-result';
import type { Seminar } from '@/lib/types';

/** پاسخ یک سمینار از API جستجو */
export type SearchSeminarItem = {
  id: number;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  capacity: number;
  registeredCount: number;
  price: number;
  isFree: boolean;
  status: number;
  thumbnailUrl?: string | null;
  roomId?: number | null;
  roomTitle?: string | null;
};

/** شکل ReferenceHandler.Preserve در ASP.NET: آرایه داخل $values */
type QueryResultWrapper = {
  $id?: string;
  $values?: SearchSeminarItem[] | Record<string, unknown>[];
};

/** پاسخ صفحه‌بندی شده جستجوی سمینار */
type SearchResponse = {
  queryResult?: SearchSeminarItem[] | QueryResultWrapper | null;
  totalCount?: number;
  QueryResult?: SearchSeminarItem[] | QueryResultWrapper | null;
  TotalCount?: number;
  pageNumber?: number;
  pageSize?: number;
};

function extractQueryResultArray(raw: SearchResponse): unknown[] {
  const qr = raw?.queryResult ?? raw?.QueryResult;
  if (qr == null) return [];
  if (Array.isArray(qr)) return qr;
  const withValues = qr as QueryResultWrapper;
  const arr = withValues?.$values;
  return Array.isArray(arr) ? arr : [];
}

/** نرمال‌سازی آیتم خام از API (پشتیبانی از PascalCase) */
function normalizeSearchItem(raw: Record<string, unknown>): SearchSeminarItem {
  const startTime = (raw.startTime ?? raw.StartTime) as string;
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    description: (raw.description ?? raw.Description) as string | null | undefined,
    startTime: startTime ?? new Date().toISOString(),
    endTime: (raw.endTime ?? raw.EndTime) as string ?? '',
    capacity: Number(raw.capacity ?? raw.Capacity ?? 0),
    registeredCount: Number(raw.registeredCount ?? raw.RegisteredCount ?? 0),
    price: Number(raw.price ?? raw.Price ?? 0),
    isFree: Boolean(raw.isFree ?? raw.IsFree),
    status: Number(raw.status ?? raw.Status ?? 0),
    thumbnailUrl: (raw.thumbnailUrl ?? raw.ThumbnailUrl) as string | null | undefined,
    roomId: (raw.roomId ?? raw.RoomId) as number | null | undefined,
    roomTitle: (raw.roomTitle ?? raw.RoomTitle) as string | null | undefined,
  };
}

const BASE = '/Seminar';

/** پاسخ API GetById سمینار */
export type SeminarByIdResponse = {
  id?: number;
  title?: string;
  description?: string | null;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  registeredCount?: number;
  price?: number;
  isFree?: boolean;
  status?: number;
  entryLink?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  tagsJson?: string | null;
  prerequisites?: string | null;
  faqsJson?: string | null;
  roomId?: number | null;
  roomTitle?: string | null;
  roomLink?: string | null;
  isPublic?: boolean;
  isExpired?: boolean;
  canRegister?: boolean;
  hasRecording?: boolean;
  recordingVideoUrl?: string | null;
};

function mapStatus(status: number): Seminar['status'] {
  switch (status) {
    case 0:
      return 'Draft';
    case 1:
      return 'Published';
    case 2:
      return 'Ongoing';
    case 3:
      return 'Completed';
    case 4:
      return 'Cancelled';
    default:
      return 'Upcoming';
  }
}

function toSeminar(item: SearchSeminarItem): Seminar {
  const start = new Date(item.startTime);
  const end = item.endTime ? new Date(item.endTime) : undefined;
  return {
    id: String(item.id),
    title: item.title,
    date: start,
    endTime: end,
    location: item.roomTitle ?? 'Online',
    attendees: item.registeredCount,
    status: mapStatus(item.status),
    statusNumeric: item.status,
    description: item.description ?? undefined,
    category: '',
    level: '',
    roomId: item.roomId != null ? String(item.roomId) : undefined,
    price: Number(item.price),
    isFree: item.isFree,
    capacity: item.capacity,
    thumbnailUrl: item.thumbnailUrl ?? undefined,
  };
}

export type SearchSeminarsParams = {
  inputValue?: string;
  status?: number;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
  skipCount?: number;
};

export async function searchSeminars(params: SearchSeminarsParams = {}): Promise<{
  items: Seminar[];
  totalCount: number;
}> {
  const { data } = await apiClient.get<SearchResponse>(`${BASE}/Search`, {
    params: {
      inputValue: params.inputValue ?? '',
      status: params.status,
      from: params.from,
      to: params.to,
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 50,
      needTotalCount: params.needTotalCount ?? true,
      skipCount: params.skipCount ?? 0,
    },
  });
  // پشتیبانی از queryResult به صورت آرایه یا { $id, $values: [] } (ReferenceHandler.Preserve)
  const rawList = extractQueryResultArray(data ?? {});
  const list = rawList.map((item) => normalizeSearchItem(item as Record<string, unknown>));
  let totalCount = Number(data?.totalCount ?? data?.TotalCount ?? 0);
  if (totalCount === 0 && list.length > 0) totalCount = list.length; // رفع باگ سرور که گاهی totalCount=0 برمی‌گرداند
  return {
    items: list.map(toSeminar),
    totalCount,
  };
}

export type AddSeminarPayload = {
  title: string;
  description: string;
  startTime: string; // ISO
  endTime: string;
  capacity: number;
  price: number;
  isFree: boolean;
  status: number; // 0 Draft, 1 Published, 2 Ongoing, 3 Completed, 4 Cancelled
  isPublic?: boolean;
  entryLink?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  recordingVideoUrl?: string | null;
  roomId?: number | null;
  tagsJson?: string | null;
  prerequisites?: string | null;
  faqsJson?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};

export type SeminarRegistrationRow = {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  hasPaid: boolean;
  registeredAt: string;
};

/** دریافت یک سمینار با شناسه (برای صفحه جزئیات) */
export async function getSeminarById(seminarId: string): Promise<Seminar | null> {
  const { data } = await apiClient.get<SeminarByIdResponse>(`${BASE}/GetById`, {
    params: { SeminarId: seminarId },
    timeout: 10_000,
  });
  if (!data || (data.id == null && !data.title)) return null;
  const raw = data as Record<string, unknown>;
  const id = Number(raw.id ?? raw.Id ?? 0);
  const startTime = (raw.startTime ?? raw.StartTime) as string;
  const endTime = (raw.endTime ?? raw.EndTime) as string;
  const start = startTime ? new Date(startTime) : new Date();
  const end = endTime ? new Date(endTime) : undefined;
  let tags: string[] | undefined;
  try {
    const tagsJson = (raw.tagsJson ?? raw.TagsJson) as string | null | undefined;
    if (tagsJson) tags = JSON.parse(tagsJson) as string[];
  } catch {
    tags = undefined;
  }
  let faqs: { id: string; question: string; answer: string }[] | undefined;
  try {
    const faqsJson = (raw.faqsJson ?? raw.FaqsJson) as string | null | undefined;
    if (faqsJson) {
      const parsed = JSON.parse(faqsJson) as Array<{ id?: string; question?: string; answer?: string }>;
      if (Array.isArray(parsed)) {
        faqs = parsed.map((f, index) => ({
          id: f.id ? String(f.id) : `faq-${index}`,
          question: String(f.question ?? ''),
          answer: String(f.answer ?? ''),
        }));
      }
    }
  } catch {
    faqs = undefined;
  }
  return {
    id: String(id || seminarId),
    title: String(raw.title ?? raw.Title ?? ''),
    description: (raw.description ?? raw.Description) as string | undefined,
    date: start,
    endTime: end,
    location: (raw.roomTitle ?? raw.RoomTitle) as string ?? 'Online',
    attendees: Number(raw.registeredCount ?? raw.RegisteredCount ?? 0),
    status: mapStatus(Number(raw.status ?? raw.Status ?? 0)),
    statusNumeric: Number(raw.status ?? raw.Status ?? 0),
    isPublic: Boolean(raw.isPublic ?? raw.IsPublic ?? true),
    isExpired: Boolean(raw.isExpired ?? raw.IsExpired ?? false),
    canRegister: Boolean(raw.canRegister ?? raw.CanRegister ?? false),
    hasRecording: Boolean(raw.hasRecording ?? raw.HasRecording ?? false),
    recordingVideoUrl: (raw.recordingVideoUrl ?? raw.RecordingVideoUrl) as string | null | undefined,
    category: '',
    level: '',
    roomId: raw.roomId != null || raw.RoomId != null ? String(raw.roomId ?? raw.RoomId) : undefined,
    price: Number(raw.price ?? raw.Price ?? 0),
    thumbnailUrl: (raw.thumbnailUrl ?? raw.ThumbnailUrl) as string | null | undefined,
    videoUrl: (raw.videoUrl ?? raw.VideoUrl) as string | null | undefined,
    tags,
    prerequisites: (raw.prerequisites ?? raw.Prerequisites) as string | null | undefined,
    faqs,
    capacity: Number(raw.capacity ?? raw.Capacity ?? 0) || undefined,
    isFree: (() => {
      const v = raw.isFree ?? raw.IsFree;
      if (v === undefined || v === null) return undefined;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v === 'true' || v === '1';
      if (typeof v === 'number') return v !== 0;
      return undefined;
    })(),
    entryLink: (raw.entryLink ?? raw.EntryLink) as string | null | undefined,
    roomLink: (raw.roomLink ?? raw.RoomLink) as string | null | undefined,
  };
}

/** پس از Add، سرور شناسه سمینار جدید را برمی‌گرداند. */
export type UpdateSeminarPayload = AddSeminarPayload & { id: number };

function normalizeSeminarRoomId(roomId: number | null | undefined): number | null {
  return roomId != null && Number.isFinite(roomId) && roomId > 0 ? roomId : null;
}

function buildSeminarCommandBody(payload: AddSeminarPayload & { id?: number }) {
  const normalizedRoomId = normalizeSeminarRoomId(payload.roomId ?? null);
  const body = {
    id: payload.id,
    title: payload.title,
    description: payload.description,
    startTime: payload.startTime,
    endTime: payload.endTime,
    capacity: payload.capacity,
    price: payload.price,
    isFree: payload.isFree,
    status: payload.status,
    isPublic: payload.isPublic ?? true,
    roomId: normalizedRoomId,
    tagsJson: payload.tagsJson ?? null,
    prerequisites: payload.prerequisites ?? null,
    faqsJson: payload.faqsJson ?? null,
    entryLink: payload.entryLink ?? null,
    thumbnailUrl: payload.thumbnailUrl ?? null,
    videoUrl: payload.videoUrl ?? null,
    recordingVideoUrl: payload.recordingVideoUrl ?? null,
    seoTitle: payload.seoTitle ?? null,
    metaDescription: payload.metaDescription ?? null,
    ogImageUrl: payload.ogImageUrl ?? null,
  };

  return {
    ...body,
    Id: body.id,
    Title: body.title,
    Description: body.description,
    StartTime: body.startTime,
    EndTime: body.endTime,
    Capacity: body.capacity,
    Price: body.price,
    IsFree: body.isFree,
    Status: body.status,
    IsPublic: body.isPublic,
    RoomId: body.roomId,
    TagsJson: body.tagsJson,
    Prerequisites: body.prerequisites,
    FaqsJson: body.faqsJson,
    EntryLink: body.entryLink,
    ThumbnailUrl: body.thumbnailUrl,
    VideoUrl: body.videoUrl,
    RecordingVideoUrl: body.recordingVideoUrl,
    SeoTitle: body.seoTitle,
    MetaDescription: body.metaDescription,
    OgImageUrl: body.ogImageUrl,
  };
}

export async function addSeminar(payload: AddSeminarPayload): Promise<string> {
  try {
    const { data } = await apiClient.post<string>(`${BASE}/Add`, buildSeminarCommandBody(payload));
    if (isDuplicateTitleResponse(data)) {
      throw new Error(getApiErrorMessage(data, 'A seminar with this title already exists.'));
    }
    return typeof data === 'string' ? data : String(data ?? '');
  } catch (e) {
    throw new Error(getApiErrorMessage(e, 'Failed to create seminar.'));
  }
}

/** آپلود تصویر و ویدیو سمینار؛ ذخیره در wwwroot/seminars/image و video. */
export async function uploadSeminarMedia(
  seminarId: number,
  options?: {
    thumbnailFile?: File | null;
    videoFile?: File | null;
    recordingFile?: File | null;
    mediaKind?: 'intro' | 'recording';
  }
): Promise<void> {
  const form = new FormData();
  form.append('seminarId', String(seminarId));
  if (options?.thumbnailFile) form.append('thumbnailFile', options.thumbnailFile);
  if (options?.videoFile) form.append('videoFile', options.videoFile);
  if (options?.recordingFile) {
    form.append('recordingFile', options.recordingFile);
    form.append('mediaKind', 'recording');
  }
  await apiClient.post(`${BASE}/UploadMedia`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function getSeminarRegistrations(
  seminarId: string,
  options?: { pageNumber?: number; pageSize?: number }
): Promise<{ items: SeminarRegistrationRow[]; totalCount: number }> {
  const { data } = await apiClient.get<{
    queryResult?: Record<string, unknown>[] | { $values?: Record<string, unknown>[] };
    totalCount?: number;
  }>(`${BASE}/GetRegistrations`, {
    params: {
      SeminarId: seminarId,
      PageNumber: options?.pageNumber ?? 1,
      PageSize: options?.pageSize ?? 200,
      NeedTotalCount: true,
    },
  });
  const raw = data?.queryResult ?? (data as Record<string, unknown>)?.QueryResult;
  const list = Array.isArray(raw) ? raw : (raw as { $values?: Record<string, unknown>[] })?.$values ?? [];
  const items = list.map((r) => ({
    id: Number(r.id ?? r.Id ?? 0),
    userId: Number(r.userId ?? r.UserId ?? 0),
    fullName: String(r.userFullName ?? r.UserFullName ?? ''),
    email: String(r.email ?? r.Email ?? r.userName ?? r.UserName ?? ''),
    hasPaid: Boolean(r.hasPaid ?? r.HasPaid),
    registeredAt: String(r.registeredAt ?? r.RegisteredAt ?? ''),
  }));
  const totalCount = Number((data as Record<string, unknown>)?.totalCount ?? (data as Record<string, unknown>)?.TotalCount ?? items.length);
  return { items, totalCount };
}

export async function updateSeminarStatus(
  id: number,
  status: number,
  isPublic?: boolean
): Promise<void> {
  await apiWriteUpdate(`${BASE}/UpdateStatus`, { id, status, isPublic });
}

export async function approveSeminarComment(commentId: number, isApproved: boolean): Promise<void> {
  await apiWriteUpdate(`${BASE}/approve-comment`, { commentId, isApproved });
}

export async function updateSeminar(payload: UpdateSeminarPayload): Promise<void> {
  try {
    const { data } = await apiWriteUpdate(`${BASE}/Update`, buildSeminarCommandBody(payload));
    if (isDuplicateTitleResponse(data)) {
      throw new Error(getApiErrorMessage(data, 'A seminar with this title already exists.'));
    }
  } catch (e) {
    throw new Error(getApiErrorMessage(e, 'Failed to update seminar.'));
  }
}

export async function deleteSeminarPermanently(seminarId: string | number): Promise<void> {
  await apiClient.delete(`${BASE}/Delete`, { params: { seminarId } });
}

/** نویسنده نظر سمینار */
export type SeminarCommentAuthor = {
  id: number;
  fullName: string;
  userName: string;
  avatarUrl: string;
};

/** یک نظر سمینار (با پاسخ‌ها) */
export type SeminarCommentItem = {
  id: number;
  rating: number;
  text: string;
  likes: number;
  isApproved: boolean;
  timeStamp: string;
  author?: SeminarCommentAuthor | null;
  parentId?: number | null;
  replies?: SeminarCommentItem[];
};

/** دریافت نظرات یک سمینار */
export async function getSeminarComments(
  seminarId: string,
  options?: { pageNumber?: number; pageSize?: number; onlyApproved?: boolean }
): Promise<{ items: SeminarCommentItem[]; totalCount: number }> {
  const { data } = await apiClient.get<{
    queryResult?: SeminarCommentItem[] | { $values?: SeminarCommentItem[] };
    totalCount?: number;
  }>(`${BASE}/get-comments`, {
    params: {
      SeminarId: seminarId,
      OnlyApproved: options?.onlyApproved ?? true,
      PageNumber: options?.pageNumber ?? 1,
      PageSize: options?.pageSize ?? 50,
    },
  });
  const raw = data?.queryResult ?? (data as Record<string, unknown>)?.QueryResult;
  const list = Array.isArray(raw) ? raw : (raw as { $values?: SeminarCommentItem[] })?.$values ?? [];
  const totalCount = Number((data as Record<string, unknown>)?.totalCount ?? (data as Record<string, unknown>)?.TotalCount ?? 0);
  const items = (list as Record<string, unknown>[]).map((c) => {
    const authorRaw = (c.author ?? c.Author) as Record<string, unknown> | null | undefined;
    return {
    id: Number(c.id ?? c.Id),
    rating: Number(c.rating ?? c.Rating ?? 0),
    text: String(c.text ?? c.Text ?? ''),
    likes: Number(c.likes ?? c.Likes ?? 0),
    isApproved: Boolean(c.isApproved ?? c.IsApproved),
    timeStamp: String(c.timeStamp ?? c.TimeStamp ?? ''),
    author: authorRaw
      ? {
          id: Number(authorRaw.id ?? authorRaw.Id),
          fullName: String(authorRaw.fullName ?? authorRaw.FullName ?? ''),
          userName: String(authorRaw.userName ?? authorRaw.UserName ?? ''),
          avatarUrl: String(authorRaw.avatarUrl ?? authorRaw.AvatarUrl ?? ''),
        }
      : null,
    parentId: (c.parentId ?? c.ParentId) as number | null | undefined,
    replies: ((c.replies ?? c.Replies) as SeminarCommentItem[] | undefined) ?? [],
  };
  }) as SeminarCommentItem[];
  return { items, totalCount: totalCount || items.length };
}

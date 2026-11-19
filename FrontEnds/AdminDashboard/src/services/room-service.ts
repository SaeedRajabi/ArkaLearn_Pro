import type { AxiosProgressEvent } from 'axios';
import axios from 'axios';
import apiClient from '@/lib/apiClient';
import { normalizeRoomEntryUrl } from '@/lib/room-entry-url';
import { apiWriteDelete, apiWriteUpdate } from '@/lib/api-write';
import { getCommandMessages, isCommandResponseSuccess } from '@/lib/api-command-result';
import { searchManagedRoomStudents } from '@/services/managed-room-students-service';

async function assertCommandOk(response: { data: unknown; status: number }, fallback: string): Promise<void> {
  if (isCommandResponseSuccess(response.data, response.status)) return;
  const msgs = getCommandMessages(response.data);
  throw new Error(msgs[0] || fallback);
}

export type RoomListItem = {
  roomId: number;
  title: string;
  slug?: string | null;
  serviceName: string;
  status: string;
};

export type RoomsPagedResponse = {
  queryResult: RoomListItem[] | null;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

/** Room detail from API (GetRoomById / GetBySlug) */
export type RoomDetail = {
  roomId: number;
  title: string | null;
  slug: string | null;
  capacity: number;
  classRoomLink: string | null;
  isGuest: boolean;
  guestQuantity: number;
  firstAdminInput: boolean;
  status: number; // 1 Active, 2 Inactive, 3 Suspended
  maxSessionTime: number;
  defaultMediaFileId: number | null;
  defaultSlideFileId: number | null;
  userId: number;
  hasLinkedSeminar?: boolean;
  linkedSeminarId?: number | null;
  /** From API after migration; default false when absent. */
  teacherEntersFirst?: boolean;
  /** Room user (seat) ids — matches login JWT userId for catalog-linked students. */
  assignedRoomUserIds?: number[];
  /** Catalog managed student ids for admin room form checkboxes. */
  assignedManagedRoomStudentIds?: number[];
  /** Per-seat block state for managed students in this room (edit form / room-scoped UI). */
  managedSeatSummaries?: RoomManagedSeatSummary[];
};

export type RoomManagedSeatSummary = {
  roomUserId: number;
  managedRoomStudentId: number;
  isBlocked: boolean;
};

/** Room file (video/audio/slide) */
export type RoomFileItem = {
  id: number;
  roomId: number;
  fileType: number; // 1 Video, 2 Audio, 3 Slide, 4 Recording, 5 SharedFile
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedByUserId?: string;
};

export const RoomFileType = { Video: 1, Audio: 2, Slide: 3, Recording: 4, SharedFile: 5 } as const;

const BASE = '/Room';

function normalizeRoomListItem(item: unknown): RoomListItem | null {
  if (!item || typeof item !== 'object') return null;
  const row = item as Record<string, unknown>;
  const roomId = Number(row.roomId ?? row.RoomId ?? 0);
  if (!roomId) return null;
  return {
    roomId,
    title: String(row.title ?? row.Title ?? ''),
    slug: (row.slug ?? row.Slug ?? null) as string | null | undefined,
    serviceName: String(row.serviceName ?? row.ServiceName ?? 'Not Service'),
    status: String(row.status ?? row.Status ?? ''),
  };
}

/** استخراج آرایه از queryResult (حالت مستقیم آرایه یا شیء با $values) */
function toRoomList(value: unknown): RoomListItem[] {
  const rawItems: unknown[] = [];
  if (Array.isArray(value)) rawItems.push(...value);
  else if (value && typeof value === 'object' && '$values' in value && Array.isArray((value as { $values: unknown }).$values)) {
    rawItems.push(...(value as { $values: unknown[] }).$values);
  }
  return rawItems.map(normalizeRoomListItem).filter(Boolean) as RoomListItem[];
}

function unwrapRoomsPagedPayload(payload: unknown): {
  queryResult?: unknown;
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
} {
  let cur: unknown = payload;
  for (let depth = 0; depth < 8; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) break;
    const obj = cur as Record<string, unknown>;
    if ('queryResult' in obj || 'QueryResult' in obj) {
      return {
        queryResult: obj.queryResult ?? obj.QueryResult,
        totalCount: Number(obj.totalCount ?? obj.TotalCount ?? 0) || undefined,
        pageNumber: Number(obj.pageNumber ?? obj.PageNumber ?? 0) || undefined,
        pageSize: Number(obj.pageSize ?? obj.PageSize ?? 0) || undefined,
      };
    }
    const next = obj.data ?? obj.Data ?? obj.result ?? obj.Result;
    if (next === cur) break;
    cur = next;
  }
  return {};
}

function toRoomFiles(value: unknown): RoomFileItem[] {
  const normalizeRoomFile = (item: unknown): RoomFileItem | null => {
    if (!item || typeof item !== 'object') return null;
    const row = item as Record<string, unknown>;
    const id = Number(row.id ?? row.Id ?? 0);
    const roomId = Number(row.roomId ?? row.RoomId ?? 0);
    const fileType = Number(row.fileType ?? row.FileType ?? 0);
    const fileName = String(row.fileName ?? row.FileName ?? '');
    const fileUrl = String(row.fileUrl ?? row.FileUrl ?? '');
    const fileSize = Number(row.fileSize ?? row.FileSize ?? 0);
    const uploadedByUserId = row.uploadedByUserId ?? row.UploadedByUserId as string | undefined;
    if (!id || !roomId || !fileName) return null;
    return { id, roomId, fileType, fileName, fileUrl, fileSize, uploadedByUserId: uploadedByUserId ? String(uploadedByUserId) : undefined };
  };

  if (Array.isArray(value)) return value.map(normalizeRoomFile).filter(Boolean) as RoomFileItem[];
  if (value && typeof value === 'object' && '$values' in value && Array.isArray((value as { $values: unknown }).$values)) {
    return ((value as { $values: unknown[] }).$values).map(normalizeRoomFile).filter(Boolean) as RoomFileItem[];
  }
  return [];
}

/**
 * لیست اتاق‌های گفتگوی مالک با صفحه‌بندی
 */
export async function getRoomsByOwnerId(params: {
  userId: number;
  roomTitle?: string;
  pageNumber?: number;
  pageSize?: number;
  cacheBust?: boolean;
}): Promise<RoomsPagedResponse> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 10;
  const res = await apiClient.get<unknown>(`${BASE}/GetAllRoom`, {
    params: {
      userId: params.userId,
      roomTitle: params.roomTitle ?? '',
      pageNumber,
      pageSize,
      needTotalCount: true,
      skipCount: (pageNumber - 1) * pageSize,
      ...(params.cacheBust ? { _: Date.now() } : {}),
    },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });
  const base = unwrapRoomsPagedPayload(res.data);
  const list = toRoomList(base.queryResult);
  return {
    queryResult: list,
    totalCount: base.totalCount ?? list.length,
    pageNumber: base.pageNumber ?? pageNumber,
    pageSize: base.pageSize ?? pageSize,
  };
}

/** Unwrap nested API envelopes (data / result) until room fields appear. */
function unwrapRoomDetailPayload(payload: unknown): Record<string, unknown> | null {
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) return null;

  let cur = payload as Record<string, unknown>;
  for (let depth = 0; depth < 6; depth++) {
    if ('roomId' in cur || 'RoomId' in cur) return cur;

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

  return 'roomId' in cur || 'RoomId' in cur ? cur : null;
}

function normalizeRoomDetail(raw: unknown): RoomDetail | null {
  if (!raw || typeof raw !== 'object') return null;
  const layer = unwrapRoomDetailPayload(raw);
  if (!layer) return null;
  const id = Number(layer.roomId ?? layer.RoomId ?? 0);
  if (!id) return null;
  const idsRaw = layer.assignedRoomUserIds ?? layer.AssignedRoomUserIds;
  let assignedRoomUserIds: number[] = [];
  if (Array.isArray(idsRaw)) assignedRoomUserIds = idsRaw.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  else if (idsRaw && typeof idsRaw === 'object' && '$values' in (idsRaw as object))
    assignedRoomUserIds = ((idsRaw as { $values: unknown[] }).$values ?? []).map((x) => Number(x)).filter((n) => !Number.isNaN(n));

  const managedRaw = layer.assignedManagedRoomStudentIds ?? layer.AssignedManagedRoomStudentIds;
  let assignedManagedRoomStudentIds: number[] = [];
  if (Array.isArray(managedRaw))
    assignedManagedRoomStudentIds = managedRaw.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  else if (managedRaw && typeof managedRaw === 'object' && '$values' in (managedRaw as object))
    assignedManagedRoomStudentIds = ((managedRaw as { $values: unknown[] }).$values ?? [])
      .map((x) => Number(x))
      .filter((n) => !Number.isNaN(n));

  const slug = (layer.slug ?? layer.Slug ?? null) as string | null;
  const rawClassRoomLink = (layer.classRoomLink ?? layer.ClassRoomLink ?? null) as string | null;

  return {
    roomId: id,
    title: (layer.title ?? layer.Title ?? null) as string | null,
    slug,
    capacity: Number(layer.capacity ?? layer.Capacity ?? 0),
    classRoomLink: normalizeRoomEntryUrl(rawClassRoomLink, slug),
    isGuest: Boolean(layer.isGuest ?? layer.IsGuest),
    guestQuantity: Number(layer.guestQuantity ?? layer.GuestQuantity ?? 0),
    firstAdminInput: Boolean(layer.firstAdminInput ?? layer.FirstAdminInput),
    status: Number(layer.status ?? layer.Status ?? 1),
    maxSessionTime: Number(layer.maxSessionTime ?? layer.MaxSessionTime ?? 60),
    defaultMediaFileId:
      layer.defaultMediaFileId != null || layer.DefaultMediaFileId != null
        ? Number(layer.defaultMediaFileId ?? layer.DefaultMediaFileId)
        : null,
    defaultSlideFileId:
      layer.defaultSlideFileId != null || layer.DefaultSlideFileId != null
        ? Number(layer.defaultSlideFileId ?? layer.DefaultSlideFileId)
        : null,
    userId: Number(layer.userId ?? layer.UserId ?? 0),
    hasLinkedSeminar: Boolean(layer.hasLinkedSeminar ?? layer.HasLinkedSeminar ?? false),
    linkedSeminarId:
      layer.linkedSeminarId != null || layer.LinkedSeminarId != null
        ? Number(layer.linkedSeminarId ?? layer.LinkedSeminarId)
        : null,
    teacherEntersFirst: Boolean(layer.teacherEntersFirst ?? layer.TeacherEntersFirst ?? false),
    assignedRoomUserIds,
    assignedManagedRoomStudentIds,
    managedSeatSummaries: parseManagedSeatSummaries(
      layer.managedSeatSummaries ?? layer.ManagedSeatSummaries
    ),
  };
}

function parseManagedSeatSummaries(raw: unknown): RoomManagedSeatSummary[] {
  const normalizeOne = (item: unknown): RoomManagedSeatSummary | null => {
    if (!item || typeof item !== 'object') return null;
    const o = item as Record<string, unknown>;
    const roomUserId = Number(o.roomUserId ?? o.RoomUserId ?? 0);
    const managedRoomStudentId = Number(o.managedRoomStudentId ?? o.ManagedRoomStudentId ?? 0);
    const isBlocked = Boolean(o.isBlocked ?? o.IsBlocked);
    if (!roomUserId || !managedRoomStudentId) return null;
    return { roomUserId, managedRoomStudentId, isBlocked };
  };

  if (Array.isArray(raw)) {
    return raw.map(normalizeOne).filter(Boolean) as RoomManagedSeatSummary[];
  }
  if (raw && typeof raw === 'object' && '$values' in (raw as object)) {
    const inner = (raw as { $values: unknown[] }).$values ?? [];
    return inner.map(normalizeOne).filter(Boolean) as RoomManagedSeatSummary[];
  }
  return [];
}

export async function setRoomUserBlocked(roomId: number, roomUserId: number, blocked: boolean): Promise<void> {
  await apiWriteUpdate(`${BASE}/SetRoomUserBlocked`, {
    roomId,
    roomUserId,
    blocked,
  });
}

export async function getRoomById(
  roomId: number,
  options?: { cacheBust?: boolean }
): Promise<RoomDetail | null> {
  const res = await apiClient.get<unknown>(`${BASE}/GetRoomById`, {
    params: options?.cacheBust ? { roomId, _: Date.now() } : { roomId },
  });
  return normalizeRoomDetail(res.data);
}

/** برای صفحه ورود به اتاق با لینک (بدون نیاز به لاگین) */
export async function getRoomBySlug(slug: string): Promise<RoomDetail | null> {
  const res = await apiClient.get<unknown>(`${BASE}/GetBySlug`, {
    params: { slug },
  });
  return normalizeRoomDetail(res.data);
}

export type CreateRoomPayload = {
  title: string;
  slug: string;
  baseUrl: string;
  roomCapacity: number;
  isGuest: boolean;
  guestQuantity: number;
  firstAdminInput: boolean;
  teacherEntersFirst: boolean;
  status: number;
  maxSessionTime: number;
  userId: number;
};

export async function createRoom(payload: CreateRoomPayload): Promise<{ roomId: number; roomLink: string; slug: string }> {
  const res = await apiClient.post<{ roomId: number; roomLink: string; slug: string } | { data?: { roomId: number; roomLink: string; slug: string } }>(`${BASE}/Add`, payload);
  const data = res.data && typeof res.data === 'object' && 'roomId' in res.data
    ? res.data
    : (res.data as { data?: { roomId: number; roomLink: string; slug: string } })?.data ?? res.data;
  return data as { roomId: number; roomLink: string; slug: string };
}

export type UpdateRoomPayload = {
  roomId: number;
  title?: string;
  slug?: string;
  baseUrl?: string;
  roomCapacity?: number;
  isGuest?: boolean;
  guestQuantity?: number;
  status?: number;
  maxSessionTime?: number;
  defaultMediaFileId?: number | null;
  defaultSlideFileId?: number | null;
  teacherEntersFirst?: boolean;
};

export async function updateRoom(payload: UpdateRoomPayload): Promise<void> {
  await apiWriteUpdate(`${BASE}/Update`, payload);
}

export async function deleteRoomPermanently(roomId: number): Promise<void> {
  const res = await apiWriteDelete(`${BASE}/Delete`, { roomId });
  await assertCommandOk(res, 'Failed to delete room');
}

export async function assignManagedStudentsToRoom(roomId: number, managedStudentIds: number[]): Promise<void> {
  const res = await apiClient.post(`${BASE}/AssignManagedStudents`, {
    roomId,
    managedStudentIds,
  });
  await assertCommandOk(res, 'Failed to assign students');
}

export type RoomLoginResponse = {
  userData: {
    token: string;
    joinTicket?: string;
    meetingRole?: string;
    userId: string;
    role: string;
    userName: string;
    displayName: string;
    avatarUrl?: string | null;
  };
};

export async function issueStaffJoinTicket(roomId: number): Promise<{
  joinTicket: string;
  meetingRole: string;
}> {
  const res = await apiClient.post<unknown>(`${BASE}/IssueStaffJoinTicket`, { roomId });
  const raw = res.data as Record<string, unknown>;
  const layer =
    raw && typeof raw === 'object' && 'joinTicket' in raw
      ? raw
      : raw?.data && typeof raw.data === 'object'
        ? (raw.data as Record<string, unknown>)
        : raw;
  const joinTicket = String(layer?.joinTicket ?? '');
  if (!joinTicket) throw new Error('Missing join ticket');
  return {
    joinTicket,
    meetingRole: String(layer?.meetingRole ?? 'teacher'),
  };
}

export async function issueGuestJoinTicket(roomId: number, displayName: string): Promise<{
  joinTicket: string;
  meetingRole: string;
  guestId: string;
  displayName: string;
}> {
  const res = await apiClient.post<unknown>(`${BASE}/IssueGuestJoinTicket`, { roomId, displayName });
  const raw = res.data as Record<string, unknown>;
  const layer =
    raw && typeof raw === 'object' && 'joinTicket' in raw
      ? raw
      : raw?.data && typeof raw.data === 'object'
        ? (raw.data as Record<string, unknown>)
        : raw;
  const joinTicket = String(layer?.joinTicket ?? '');
  const guestId = String(layer?.guestId ?? '');
  if (!joinTicket || !guestId) throw new Error('Missing guest join ticket');
  return {
    joinTicket,
    meetingRole: String(layer?.meetingRole ?? 'guest'),
    guestId,
    displayName: String(layer?.displayName ?? displayName),
  };
}

export async function forceEndActiveMeeting(roomId: number): Promise<void> {
  const res = await apiWriteUpdate(`${BASE}/ForceEndActiveMeeting`, { roomId });
  await assertCommandOk(res, 'Failed to end meeting');
}

export async function endRoomSessionById(roomId: number, sessionId: number): Promise<void> {
  const res = await apiWriteUpdate(`${BASE}/EndSessionById`, { roomId, sessionId });
  await assertCommandOk(res, 'Failed to end session');
}

export async function deleteRoomSession(roomId: number, sessionId: number): Promise<void> {
  const payload = { roomId, sessionId };
  try {
    const res = await apiWriteUpdate(`${BASE}/DeleteSession`, payload);
    await assertCommandOk(res, 'Failed to delete session');
    return;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status !== 404) throw error;
  }
  const fallback = await apiWriteUpdate(`${BASE}/DeleteRoomSession`, payload);
  await assertCommandOk(fallback, 'Failed to delete session');
}

export async function setRoomSessionIgnored(roomId: number, sessionId: number, ignored: boolean): Promise<void> {
  const res = await apiWriteUpdate(`${BASE}/SetSessionIgnored`, { roomId, sessionId, ignored });
  await assertCommandOk(res, 'Failed to update session');
}

export async function removeRoomSeat(roomId: number, roomUserId: number): Promise<void> {
  const res = await apiWriteUpdate(`${BASE}/RemoveRoomSeat`, { roomId, roomUserId });
  await assertCommandOk(res, 'Failed to remove participant');
}

export type RoomMemberItem = {
  roomUserId: number;
  managedRoomStudentId?: number;
  fullName: string;
  userName: string;
  createAt: string;
  /** True when the student is connected to the live room (SignalR). */
  isOnline: boolean;
  isBlocked: boolean;
};

function mapRoomMemberRow(item: unknown): RoomMemberItem | null {
  if (!item || typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;
  const roomUserId = Number(o.roomUserId ?? o.RoomUserId ?? o.userId ?? o.UserId ?? 0);
  if (!roomUserId) return null;
  const managedRoomStudentId = Number(o.managedRoomStudentId ?? o.ManagedRoomStudentId ?? 0);
  return {
    roomUserId,
    managedRoomStudentId: managedRoomStudentId > 0 ? managedRoomStudentId : undefined,
    fullName: String(o.fullName ?? o.FullName ?? ''),
    userName: String(o.userName ?? o.UserName ?? ''),
    createAt: String(o.createAt ?? o.CreateAt ?? ''),
    isOnline: Boolean(o.isOnline ?? o.IsOnline),
    isBlocked: Boolean(o.isBlocked ?? o.IsBlocked),
  };
}

/** Unwrap paged/query API payloads (data/result envelopes, PascalCase, $values). */
function unwrapQueryResultRows(payload: unknown): unknown[] {
  let cur: unknown = payload;
  for (let depth = 0; depth < 6; depth++) {
    if (Array.isArray(cur)) return cur;
    if (!cur || typeof cur !== 'object') break;

    const layer = cur as Record<string, unknown>;
    const queryResult = layer.queryResult ?? layer.QueryResult;
    if (Array.isArray(queryResult)) return queryResult;
    if (queryResult && typeof queryResult === 'object' && '$values' in (queryResult as object)) {
      const values = (queryResult as { $values: unknown[] }).$values;
      if (Array.isArray(values)) return values;
    }

    const next = layer.data ?? layer.Data ?? layer.result ?? layer.Result;
    if (next && next !== cur) {
      cur = next;
      continue;
    }
    break;
  }
  return [];
}

async function buildMembersFromSeatSummaries(detail: RoomDetail): Promise<RoomMemberItem[]> {
  const summaries = detail.managedSeatSummaries ?? [];
  if (!summaries.length) return [];

  const catalog = await searchManagedRoomStudents({ pageNumber: 1, pageSize: 500, inputValue: '' });
  return summaries.map((seat) => {
    const student = catalog.list.find((s) => s.id === seat.managedRoomStudentId);
    const fullName = student ? `${student.firstName} ${student.lastName}`.trim() : '';
    return {
      roomUserId: seat.roomUserId,
      managedRoomStudentId: seat.managedRoomStudentId,
      fullName: fullName || '—',
      userName: student?.userName ?? '—',
      createAt: '',
      isOnline: false,
      isBlocked: seat.isBlocked,
    };
  });
}

export async function getRoomMembers(
  roomId: number,
  options?: { pageSize?: number; cacheBust?: boolean }
): Promise<RoomMemberItem[]> {
  const pageSize = options?.pageSize ?? 200;
  const params: Record<string, string> = {
    roomId: String(roomId),
    pageNumber: '1',
    pageSize: String(pageSize),
    needTotalCount: 'false',
    skipCount: '0',
  };
  if (options?.cacheBust) {
    params._ = String(Date.now());
  }
  const res = await apiClient.get<unknown>(`${BASE}/GetAllUserInRoom`, { params });
  const rows = unwrapQueryResultRows(res.data);
  return rows.map(mapRoomMemberRow).filter(Boolean) as RoomMemberItem[];
}

export type RoomParticipantsSnapshot = {
  detail: RoomDetail;
  members: RoomMemberItem[];
};

/** Reload room detail + participant rows (cache-safe after assign/remove). */
export async function loadRoomParticipantsSnapshot(
  roomId: number,
  options?: { cacheBust?: boolean }
): Promise<RoomParticipantsSnapshot | null> {
  const cacheBust = options?.cacheBust ?? true;
  const [members, detail] = await Promise.all([
    getRoomMembers(roomId, { cacheBust }),
    getRoomById(roomId, { cacheBust }),
  ]);
  if (!detail) return null;

  const resolvedMembers =
    members.length > 0 || !(detail.managedSeatSummaries?.length)
      ? members
      : await buildMembersFromSeatSummaries(detail);

  return { detail, members: resolvedMembers };
}

export async function updateRoomUserOnlineStatus(
  roomId: number,
  roomUserId: number,
  isOnline: boolean
): Promise<void> {
  const res = await apiWriteUpdate(`${BASE}/user/update-status`, {
    roomId,
    userId: roomUserId,
    isOnline,
  });
  await assertCommandOk(res, 'Failed to update online status');
}

/** Thrown when `/Account/UserLoginIntoRoom` fails (enrollment, blocked, wrong password, or bad response). */
export class RoomLoginFailedError extends Error {
  readonly serverMessages: string[];
  readonly httpStatus: number | undefined;

  constructor(serverMessages: string[], httpStatus: number | undefined, message?: string) {
    super(message ?? serverMessages[0] ?? 'Room login failed');
    this.name = 'RoomLoginFailedError';
    this.serverMessages = serverMessages;
    this.httpStatus = httpStatus;
  }
}

/** Normalizes ASP.NET BadRequest payloads and similar shapes to user-facing strings. */
function parseApiErrorMessages(data: unknown): string[] {
  if (data == null) return [];
  if (typeof data === 'string') return data.trim() ? [data.trim()] : [];
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && 'message' in item) return String((item as { message: unknown }).message).trim();
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

/** Marks a room seat offline (used on disconnect / tab close without full cookie logout). */
export async function releaseRoomSeatSession(roomId: number, userId: number): Promise<void> {
  try {
    await updateRoomUserOnlineStatus(roomId, userId, false);
  } catch {
    /* best effort */
  }
}

/** Full room-seat logout (clears server session for students). */
export async function logoutRoomSeat(roomId: number, userId: number): Promise<void> {
  try {
    await apiClient.post('/Account/UserRoomLogout', {
      roomId,
      userId,
    });
  } catch {
    /* best effort */
  }
}

export async function loginRoomUser(roomId: number, userName: string, password: string): Promise<RoomLoginResponse> {
  try {
    const res = await apiClient.post<unknown>(`/Account/UserLoginIntoRoom`, {
      roomId,
      userName,
      password,
      isGuest: false,
    });
    const raw = res.data as Record<string, unknown> | undefined;
    const layer =
      raw && typeof raw === 'object' && 'userData' in raw
        ? raw
        : raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object'
          ? (raw.data as Record<string, unknown>)
          : raw;
    const ud = layer && typeof layer === 'object' && 'userData' in layer ? (layer as RoomLoginResponse).userData : undefined;
    if (!ud?.token) {
      throw new RoomLoginFailedError([], res.status, 'Invalid room login response');
    }
    return { userData: ud };
  } catch (e: unknown) {
    if (e instanceof RoomLoginFailedError) throw e;
    if (axios.isAxiosError(e)) {
      const msgs = parseApiErrorMessages(e.response?.data);
      const status = e.response?.status;
      if (msgs.length > 0) {
        throw new RoomLoginFailedError(msgs, status);
      }
      if (e.response) {
        throw new RoomLoginFailedError([], status, `HTTP ${status ?? 'error'}`);
      }
      throw new RoomLoginFailedError([], undefined);
    }
    throw e;
  }
}

export async function getRoomFiles(roomId: number): Promise<RoomFileItem[]> {
  const extractRoomFiles = (payload: unknown): RoomFileItem[] => {
    const raw = payload as Record<string, unknown> | null | undefined;
    const dataLayer = (raw && typeof raw === 'object' && 'data' in raw
      ? (raw as { data?: unknown }).data
      : raw) as Record<string, unknown> | unknown;

    if (Array.isArray(dataLayer)) return toRoomFiles(dataLayer);

    const queryResult = dataLayer && typeof dataLayer === 'object' && 'queryResult' in (dataLayer as Record<string, unknown>)
      ? (dataLayer as { queryResult?: unknown }).queryResult
      : dataLayer;
    return toRoomFiles(queryResult);
  };

  const requestFiles = async (params: Record<string, number>) => {
    const res = await apiClient.get<unknown>(`${BASE}/GetRoomFiles`, { params });
    return extractRoomFiles(res.data);
  };

  try {
    return await requestFiles({ RoomId: roomId });
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    // برخی مسیرها مدل‌بایندینگ را با roomId انجام می‌دهند.
    if (status === 400) {
      try {
        return await requestFiles({ roomId });
      } catch (fallbackError) {
        const fallbackStatus = (fallbackError as { response?: { status?: number } })?.response?.status;
        if (fallbackStatus === 400 || fallbackStatus === 404 || fallbackStatus === 204) return [];
        throw fallbackError;
      }
    }
    // در نبود فایل/یا پاسخ نامعتبر موقت، UI را با لیست خالی نگه می‌داریم.
    if (status === 400 || status === 404 || status === 204) return [];
    throw error;
  }
}

export type RoomSessionItem = {
  id: number;
  roomId: number;
  startTime: string;
  endTime?: string;
  duration?: string;
  status: string;
  startedByUserId?: string;
  isIgnored?: boolean;
};

export type RoomSessionsPagedResponse = {
  queryResult: RoomSessionItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
};

/** queryResult may be a JSON array or a .NET serializer wrapper `{ $values: [...] }`. */
function toRoomSessionQueryResultRows(queryResultUnknown: unknown): unknown[] {
  if (queryResultUnknown == null) return [];
  if (Array.isArray(queryResultUnknown)) return queryResultUnknown;
  if (
    typeof queryResultUnknown === 'object' &&
    '$values' in queryResultUnknown &&
    Array.isArray((queryResultUnknown as { $values: unknown[] }).$values)
  ) {
    return (queryResultUnknown as { $values: unknown[] }).$values;
  }
  return [];
}

function parseDurationField(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'totalSeconds' in (v as object)) {
    const ts = Number((v as { totalSeconds?: unknown }).totalSeconds);
    if (!Number.isNaN(ts) && ts >= 0) {
      const s = Math.floor(ts % 60);
      const m = Math.floor((ts / 60) % 60);
      const h = Math.floor(ts / 3600);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }
  return String(v);
}

function mapRoomSessionRow(item: unknown): RoomSessionItem | null {
  if (!item || typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;
  const id = Number(o.id ?? o.Id ?? 0);
  if (!id) return null;
  return {
    id,
    roomId: Number(o.roomId ?? o.RoomId ?? 0),
    startTime: String(o.startTime ?? o.StartTime ?? ''),
    endTime: o.endTime != null || o.EndTime != null ? String(o.endTime ?? o.EndTime) : undefined,
    duration: parseDurationField(o.duration ?? o.Duration),
    status: String(o.status ?? o.Status ?? ''),
    startedByUserId:
      o.startedByUserId != null || o.StartedByUserId != null
        ? String(o.startedByUserId ?? o.StartedByUserId)
        : undefined,
    isIgnored: Boolean(o.isIgnored ?? o.IsIgnored),
  };
}

function parseRoomSessionsPagedPayload(data: unknown, pageNumber: number, pageSize: number): RoomSessionsPagedResponse | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (!('queryResult' in d) && !('QueryResult' in d)) return null;

  const rawRows = toRoomSessionQueryResultRows(d.queryResult ?? d.QueryResult);
  const items = rawRows.map(mapRoomSessionRow).filter(Boolean) as RoomSessionItem[];

  return {
    queryResult: items,
    pageNumber: Number(d.pageNumber ?? d.PageNumber ?? pageNumber),
    pageSize: Number(d.pageSize ?? d.PageSize ?? pageSize),
    totalCount: Number(d.totalCount ?? d.TotalCount ?? items.length),
  };
}

export async function getRoomSessions(roomId: number, pageNumber = 1, pageSize = 100): Promise<RoomSessionsPagedResponse> {
  const request = async (usePascalRoomId: boolean) => {
    const params = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });
    params.append(usePascalRoomId ? 'RoomId' : 'roomId', String(roomId));
    params.set('_', String(Date.now()));
    const res = await apiClient.get<unknown>(`${BASE}/GetRoomSessions`, { params });
    return res.data;
  };

  const tryParse = (raw: unknown): RoomSessionsPagedResponse | null => {
    const direct = parseRoomSessionsPagedPayload(raw, pageNumber, pageSize);
    if (direct) return direct;
    if (raw && typeof raw === 'object' && 'data' in raw) {
      const nested = (raw as { data?: unknown }).data;
      return parseRoomSessionsPagedPayload(nested, pageNumber, pageSize);
    }
    return null;
  };

  try {
    const raw = await request(false);
    const parsed = tryParse(raw);
    if (parsed) return parsed;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status !== 400) throw error;
  }

  try {
    const raw = await request(true);
    const parsed = tryParse(raw);
    if (parsed) return parsed;
  } catch {
    // fall through
  }

  return { queryResult: [], pageNumber, pageSize, totalCount: 0 };
}

export async function uploadRoomFile(
  roomId: number,
  fileType: number,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ roomId: number; fileName: string; fileUrl: string }> {
  const form = new FormData();
  form.append('roomId', String(roomId));
  form.append('fileType', String(fileType));
  form.append('file', file);
  const { data } = await apiClient.post<{ roomId: number; fileName: string; fileUrl: string }>(`${BASE}/UploadFile`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (!onProgress) return;
      const total = event.total ?? 0;
      if (total <= 0) {
        onProgress(0);
        return;
      }
      const percent = Math.min(100, Math.max(0, Math.round((event.loaded / total) * 100)));
      onProgress(percent);
    },
  });
  return data!;
}

export type RoomFileUploadStatus =
  | 'queued'
  | 'uploading'
  | 'paused'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'canceled';

export type RoomFileUploadProgress = {
  status: RoomFileUploadStatus;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  uploadedChunks: number;
  totalChunks: number;
  errorMessage?: string;
};

export type RoomChunkedUploadComplete = {
  roomId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: number;
};

type InitMultipartUploadResponse = {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
};

type CreateRoomChunkedUploadTaskOptions = {
  chunkSizeBytes?: number;
  parallelChunks?: number;
  onProgress?: (progress: RoomFileUploadProgress) => void;
};

const DEFAULT_CHUNK_SIZE_BYTES = 2 * 1024 * 1024;
const DEFAULT_PARALLEL_CHUNKS = 4;
const MAX_PARALLEL_CHUNKS = 8;

function normalizeChunkedUploadComplete(raw: unknown): RoomChunkedUploadComplete {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    roomId: Number(row.roomId ?? row.RoomId ?? 0),
    fileName: String(row.fileName ?? row.FileName ?? ''),
    fileUrl: String(row.fileUrl ?? row.FileUrl ?? ''),
    fileSize: Number(row.fileSize ?? row.FileSize ?? 0),
    fileType: Number(row.fileType ?? row.FileType ?? 0),
  };
}

function normalizeInitMultipartUploadResponse(raw: unknown): InitMultipartUploadResponse {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    uploadId: String(row.uploadId ?? row.UploadId ?? ''),
    chunkSize: Number(row.chunkSize ?? row.ChunkSize ?? DEFAULT_CHUNK_SIZE_BYTES),
    totalChunks: Number(row.totalChunks ?? row.TotalChunks ?? 0),
  };
}

async function initRoomFileMultipartUpload(args: {
  roomId: number;
  fileType: number;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
}): Promise<InitMultipartUploadResponse> {
  const { data } = await apiClient.post<unknown>(`${BASE}/UploadFileInit`, {
    roomId: args.roomId,
    fileType: args.fileType,
    fileName: args.fileName,
    fileSize: args.fileSize,
    chunkSize: args.chunkSize,
    totalChunks: args.totalChunks,
  });
  const parsed = normalizeInitMultipartUploadResponse(data);
  if (!parsed.uploadId || parsed.totalChunks <= 0) {
    throw new Error('Upload initialization failed.');
  }
  return parsed;
}

async function uploadRoomFileChunkPart(args: {
  uploadId: string;
  chunkIndex: number;
  chunk: Blob;
  signal?: AbortSignal;
}): Promise<void> {
  const form = new FormData();
  form.append('uploadId', args.uploadId);
  form.append('chunkIndex', String(args.chunkIndex));
  form.append('chunk', args.chunk, `${args.uploadId}-${args.chunkIndex}.part`);
  await apiClient.post(`${BASE}/UploadFileChunk`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal: args.signal,
  });
}

async function completeRoomFileMultipartUpload(uploadId: string): Promise<RoomChunkedUploadComplete> {
  const { data } = await apiClient.post<unknown>(`${BASE}/UploadFileComplete`, { uploadId });
  return normalizeChunkedUploadComplete(data);
}

async function abortRoomFileMultipartUpload(uploadId: string): Promise<void> {
  await apiClient.post(`${BASE}/UploadFileAbort`, { uploadId });
}

export class RoomChunkedUploadTask {
  readonly file: File;
  readonly roomId: number;
  readonly fileType: number;

  private readonly options: CreateRoomChunkedUploadTaskOptions;
  private uploadId: string | null = null;
  private chunkSize = DEFAULT_CHUNK_SIZE_BYTES;
  private totalChunks = 0;
  private queue: number[] = [];
  private uploadedChunkIndexes = new Set<number>();
  private inFlightControllers = new Map<number, AbortController>();
  private uploadedBytes = 0;
  private runningPromise: Promise<RoomChunkedUploadComplete> | null = null;
  private completionResult: RoomChunkedUploadComplete | null = null;
  private status: RoomFileUploadStatus = 'queued';
  private errorMessage: string | undefined;

  constructor(
    roomId: number,
    fileType: number,
    file: File,
    options?: CreateRoomChunkedUploadTaskOptions
  ) {
    this.roomId = roomId;
    this.fileType = fileType;
    this.file = file;
    this.options = options ?? {};
    this.emitProgress();
  }

  get currentStatus(): RoomFileUploadStatus {
    return this.status;
  }

  get progress(): RoomFileUploadProgress {
    const total = Math.max(0, this.file.size);
    const uploaded = Math.min(total, this.uploadedBytes);
    const percentage = this.status === 'completed' ? 100 : total > 0 ? Math.min(99, Math.floor((uploaded / total) * 100)) : 0;
    return {
      status: this.status,
      uploadedBytes: uploaded,
      totalBytes: total,
      percentage,
      uploadedChunks: this.uploadedChunkIndexes.size,
      totalChunks: this.totalChunks,
      errorMessage: this.errorMessage,
    };
  }

  async start(): Promise<RoomChunkedUploadComplete> {
    if (this.status === 'completed' && this.completionResult) return this.completionResult;
    if (this.status === 'uploading' && this.runningPromise) return this.runningPromise;
    if (this.status === 'finalizing' && this.runningPromise) return this.runningPromise;
    if (this.status === 'paused') return this.resume();
    if (this.status === 'canceled') throw new Error('Upload has been canceled.');

    await this.ensureSessionInitialized();
    this.status = 'uploading';
    this.errorMessage = undefined;
    this.emitProgress();

    this.runningPromise = this.runUpload();
    return this.runningPromise;
  }

  async resume(): Promise<RoomChunkedUploadComplete> {
    if (this.status !== 'paused') return this.start();
    this.status = 'uploading';
    this.errorMessage = undefined;
    this.emitProgress();
    this.runningPromise = this.runUpload();
    return this.runningPromise;
  }

  pause(): void {
    if (this.status !== 'uploading') return;
    this.status = 'paused';
    for (const controller of this.inFlightControllers.values()) {
      controller.abort();
    }
    this.emitProgress();
  }

  async cancel(): Promise<void> {
    if (this.status === 'completed' || this.status === 'canceled') return;
    this.status = 'canceled';
    for (const controller of this.inFlightControllers.values()) {
      controller.abort();
    }
    const uploadId = this.uploadId;
    this.emitProgress();
    if (uploadId) {
      try {
        await abortRoomFileMultipartUpload(uploadId);
      } catch {
        // best effort
      }
    }
  }

  private async ensureSessionInitialized(): Promise<void> {
    if (this.uploadId) return;

    const desiredChunkSize = this.options.chunkSizeBytes ?? DEFAULT_CHUNK_SIZE_BYTES;
    const optimisticTotalChunks = Math.max(1, Math.ceil(this.file.size / desiredChunkSize));
    const init = await initRoomFileMultipartUpload({
      roomId: this.roomId,
      fileType: this.fileType,
      fileName: this.file.name,
      fileSize: this.file.size,
      chunkSize: desiredChunkSize,
      totalChunks: optimisticTotalChunks,
    });

    this.uploadId = init.uploadId;
    this.chunkSize = init.chunkSize > 0 ? init.chunkSize : desiredChunkSize;
    this.totalChunks = init.totalChunks > 0 ? init.totalChunks : optimisticTotalChunks;
    if (this.queue.length === 0) {
      this.queue = Array.from({ length: this.totalChunks }, (_, index) => index);
    }
    this.emitProgress();
  }

  private async runUpload(): Promise<RoomChunkedUploadComplete> {
    const parallel = Math.min(
      MAX_PARALLEL_CHUNKS,
      Math.max(1, this.options.parallelChunks ?? DEFAULT_PARALLEL_CHUNKS)
    );

    try {
      const workers = Array.from({ length: parallel }, () => this.workerLoop());
      await Promise.all(workers);

      if (this.status === 'paused') {
        throw new Error('__upload_paused__');
      }
      if (this.status === 'canceled') {
        throw new Error('__upload_canceled__');
      }

      this.status = 'finalizing';
      this.emitProgress();
      const result = await completeRoomFileMultipartUpload(this.uploadId!);
      this.completionResult = result;
      this.status = 'completed';
      this.emitProgress();
      return result;
    } catch (error) {
      if (this.status === 'paused' || this.status === 'canceled') {
        throw error;
      }
      this.status = 'failed';
      this.errorMessage = error instanceof Error ? error.message : 'Upload failed.';
      this.emitProgress();
      throw error;
    } finally {
      this.runningPromise = null;
    }
  }

  private async workerLoop(): Promise<void> {
    while (this.status === 'uploading') {
      const chunkIndex = this.queue.shift();
      if (chunkIndex == null) return;
      if (this.uploadedChunkIndexes.has(chunkIndex)) continue;

      try {
        await this.uploadChunk(chunkIndex);
      } catch (error) {
        const canceledByController =
          error instanceof DOMException
            ? error.name === 'AbortError'
            : axios.isAxiosError(error)
              ? error.code === 'ERR_CANCELED'
              : false;

        const latestStatus: RoomFileUploadStatus = this.status;
        if ((latestStatus === 'paused' as RoomFileUploadStatus ||
            latestStatus === 'canceled' as RoomFileUploadStatus) &&
            canceledByController) {
          if (!this.uploadedChunkIndexes.has(chunkIndex) &&
              latestStatus === 'paused' as RoomFileUploadStatus) {
            this.queue.push(chunkIndex);
          }
          return;
        }
        throw error;
      }
    }
  }

  private async uploadChunk(chunkIndex: number): Promise<void> {
    const start = chunkIndex * this.chunkSize;
    const end = Math.min(this.file.size, start + this.chunkSize);
    const chunk = this.file.slice(start, end);
    const controller = new AbortController();
    this.inFlightControllers.set(chunkIndex, controller);

    try {
      await uploadRoomFileChunkPart({
        uploadId: this.uploadId!,
        chunkIndex,
        chunk,
        signal: controller.signal,
      });
      if (!this.uploadedChunkIndexes.has(chunkIndex)) {
        this.uploadedChunkIndexes.add(chunkIndex);
        this.uploadedBytes += chunk.size;
        this.emitProgress();
      }
    } finally {
      this.inFlightControllers.delete(chunkIndex);
    }
  }

  private emitProgress(): void {
    this.options.onProgress?.(this.progress);
  }
}

export function createRoomChunkedUploadTask(
  roomId: number,
  fileType: number,
  file: File,
  options?: CreateRoomChunkedUploadTaskOptions
): RoomChunkedUploadTask {
  return new RoomChunkedUploadTask(roomId, fileType, file, options);
}

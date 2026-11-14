import { apiRequest, buildQuery } from './client';
import { unwrapApiList } from '@/lib/api/normalize-list';
import { normalizeRoomEntryUrl } from '@/lib/room-entry-url';

const BASE = 'Room';

export type ProfessorRoomListItem = {
  roomId: number;
  title: string;
  slug?: string | null;
  serviceName: string;
  status: string;
};

export type ProfessorRoomDetail = {
  roomId: number;
  title: string | null;
  slug: string | null;
  capacity: number;
  classRoomLink: string | null;
  status: number;
  maxSessionTime: number;
  userId: number;
  isGuest?: boolean;
  guestQuantity?: number;
  teacherEntersFirst?: boolean;
  defaultMediaFileId?: number | null;
  defaultSlideFileId?: number | null;
  assignedManagedRoomStudentIds?: number[];
};

export type ProfessorRoomFile = {
  id: number;
  roomId: number;
  fileType: number;
  title: string;
  description?: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
};

export function getProfessorRoomFileDisplayTitle(file: Pick<ProfessorRoomFile, 'title' | 'fileName'>): string {
  const title = file.title?.trim();
  return title || file.fileName;
}

export const ProfessorRoomFileType = {
  Video: 1,
  Audio: 2,
  Slide: 3,
  Recording: 4,
  SharedFile: 5,
} as const;

export function getProfessorRoomFileTypeLabel(fileType: number, isRtl: boolean): string {
  switch (fileType) {
    case ProfessorRoomFileType.Video:
      return isRtl ? 'ویدیو' : 'Video';
    case ProfessorRoomFileType.Audio:
      return isRtl ? 'صوت' : 'Audio';
    case ProfessorRoomFileType.Slide:
      return isRtl ? 'اسلاید / سند' : 'Slide / document';
    case ProfessorRoomFileType.Recording:
      return isRtl ? 'ضبط‌شده' : 'Recording';
    case ProfessorRoomFileType.SharedFile:
      return isRtl ? 'فایل اشتراکی' : 'Shared file';
    default:
      return isRtl ? 'فایل' : 'File';
  }
}

function mapListItem(item: Record<string, unknown>): ProfessorRoomListItem | null {
  const roomId = Number(item.roomId ?? item.RoomId ?? 0);
  if (!roomId) return null;
  return {
    roomId,
    title: String(item.title ?? item.Title ?? ''),
    slug: (item.slug ?? item.Slug ?? null) as string | null,
    serviceName: String(item.serviceName ?? item.ServiceName ?? ''),
    status: String(item.status ?? item.Status ?? ''),
  };
}

function unwrapPaged(raw: unknown): { rows: Record<string, unknown>[]; totalCount: number } {
  const root = raw as Record<string, unknown>;
  const layer = (root?.data ?? root) as Record<string, unknown>;
  const rows = unwrapApiList<Record<string, unknown>>(layer?.queryResult ?? layer?.QueryResult ?? raw);
  return {
    rows,
    totalCount: Number(layer?.totalCount ?? layer?.TotalCount ?? rows.length),
  };
}

export async function getProfessorRooms(params: {
  userId: number;
  roomTitle?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ rooms: ProfessorRoomListItem[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 50;
  const raw = await apiRequest<unknown>(
    `${BASE}/GetAllRoom${buildQuery({
      userId: params.userId,
      roomTitle: params.roomTitle ?? '',
      pageNumber,
      pageSize,
      needTotalCount: true,
      skipCount: (pageNumber - 1) * pageSize,
    })}`
  );
  const { rows, totalCount } = unwrapPaged(raw);
  return {
    rooms: rows.map(mapListItem).filter(Boolean) as ProfessorRoomListItem[],
    totalCount,
  };
}

function unwrapRoomDetail(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  let cur: unknown = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? obj;
  for (let i = 0; i < 5; i++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) break;
    const row = cur as Record<string, unknown>;
    if ('roomId' in row || 'RoomId' in row) return row;
    cur = row.data ?? row.Data ?? row.queryResult ?? row.QueryResult;
  }
  return obj;
}

export async function getProfessorRoomById(roomId: number): Promise<ProfessorRoomDetail | null> {
  const raw = await apiRequest<unknown>(`${BASE}/GetRoomById${buildQuery({ roomId })}`);
  const row = unwrapRoomDetail(raw);
  if (!row) return null;
  const id = Number(row.roomId ?? row.RoomId ?? 0);
  if (!id) return null;

  const assignedRaw = row.assignedManagedRoomStudentIds ?? row.AssignedManagedRoomStudentIds;
  let assignedManagedRoomStudentIds: number[] | undefined;
  if (Array.isArray(assignedRaw)) {
    assignedManagedRoomStudentIds = assignedRaw.map((v) => Number(v)).filter((v) => v > 0);
  }

  return {
    roomId: id,
    title: (row.title ?? row.Title ?? null) as string | null,
    slug: (row.slug ?? row.Slug ?? null) as string | null,
    capacity: Number(row.capacity ?? row.Capacity ?? row.roomCapacity ?? row.RoomCapacity ?? 10),
    classRoomLink: (row.classRoomLink ?? row.ClassRoomLink ?? null) as string | null,
    status: Number(row.status ?? row.Status ?? 1),
    maxSessionTime: Number(row.maxSessionTime ?? row.MaxSessionTime ?? 120),
    userId: Number(row.userId ?? row.UserId ?? 0),
    isGuest: Boolean(row.isGuest ?? row.IsGuest ?? false),
    guestQuantity: Number(row.guestQuantity ?? row.GuestQuantity ?? 0),
    teacherEntersFirst: Boolean(row.teacherEntersFirst ?? row.TeacherEntersFirst ?? false),
    defaultMediaFileId:
      row.defaultMediaFileId != null || row.DefaultMediaFileId != null
        ? Number(row.defaultMediaFileId ?? row.DefaultMediaFileId)
        : null,
    defaultSlideFileId:
      row.defaultSlideFileId != null || row.DefaultSlideFileId != null
        ? Number(row.defaultSlideFileId ?? row.DefaultSlideFileId)
        : null,
    assignedManagedRoomStudentIds,
  };
}

export type CreateProfessorRoomPayload = {
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

export async function createProfessorRoom(
  payload: CreateProfessorRoomPayload
): Promise<{ roomId: number; roomLink: string; slug: string }> {
  const raw = await apiRequest<Record<string, unknown>>(`${BASE}/Add`, { method: 'POST', body: payload });
  const layer = (raw.data ?? raw.Data ?? raw) as Record<string, unknown>;
  return {
    roomId: Number(layer.roomId ?? layer.RoomId ?? raw.roomId ?? raw.RoomId ?? 0),
    roomLink: String(layer.roomLink ?? layer.RoomLink ?? raw.roomLink ?? raw.RoomLink ?? ''),
    slug: String(layer.slug ?? layer.Slug ?? raw.slug ?? raw.Slug ?? payload.slug),
  };
}

export async function assignManagedStudentsToRoom(roomId: number, managedStudentIds: number[]): Promise<void> {
  await apiRequest(`${BASE}/AssignManagedStudents`, {
    method: 'POST',
    body: { roomId, managedStudentIds },
  });
}

export async function issueStaffJoinTicket(roomId: number): Promise<{ joinTicket: string; meetingRole: string }> {
  const raw = await apiRequest<Record<string, unknown>>(`${BASE}/IssueStaffJoinTicket`, {
    method: 'POST',
    body: { roomId },
  });
  const layer = (raw.data ?? raw.Data ?? raw) as Record<string, unknown>;
  const joinTicket = String(layer.joinTicket ?? layer.JoinTicket ?? raw.joinTicket ?? raw.JoinTicket ?? '');
  if (!joinTicket) throw new Error('Missing join ticket');
  return {
    joinTicket,
    meetingRole: String(layer.meetingRole ?? layer.MeetingRole ?? 'teacher'),
  };
}

export async function openProfessorRoom(params: {
  roomId: number;
  slug?: string | null;
  classRoomLink?: string | null;
}): Promise<void> {
  const { joinTicket } = await issueStaffJoinTicket(params.roomId);
  const base = normalizeRoomEntryUrl(params.classRoomLink ?? undefined, params.slug ?? undefined);
  const url = new URL(base);
  url.searchParams.set('joinTicket', joinTicket);
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}

export function slugifyRoomTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48) || `room-${Date.now()}`;
}

export function getDefaultRoomBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const env = process.env.NEXT_PUBLIC_ROOM_DASHBOARD_ORIGIN?.trim();
    if (env) return env.replace(/\/+$/, '');
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_ROOM_DASHBOARD_ORIGIN?.trim()?.replace(/\/+$/, '') || 'https://admin-dashboard.arkasoftware.ir';
}

export type UpdateProfessorRoomPayload = {
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

export async function updateProfessorRoom(payload: UpdateProfessorRoomPayload): Promise<void> {
  await apiRequest(`${BASE}/Update`, { method: 'POST', body: payload });
}

function mapRoomFile(item: Record<string, unknown>): ProfessorRoomFile | null {
  const id = Number(item.id ?? item.Id ?? 0);
  const roomId = Number(item.roomId ?? item.RoomId ?? 0);
  if (!id || !roomId) return null;
  return {
    id,
    roomId,
    fileType: Number(item.fileType ?? item.FileType ?? 0),
    title: String(item.title ?? item.Title ?? item.fileName ?? item.FileName ?? ''),
    description: (item.description ?? item.Description ?? null) as string | null,
    fileName: String(item.fileName ?? item.FileName ?? ''),
    fileUrl: String(item.fileUrl ?? item.FileUrl ?? ''),
    fileSize: Number(item.fileSize ?? item.FileSize ?? 0),
  };
}

export async function getProfessorRoomFiles(roomId: number): Promise<ProfessorRoomFile[]> {
  try {
    const raw = await apiRequest<unknown>(`${BASE}/GetRoomFiles${buildQuery({ roomId })}`);
    const root = raw as Record<string, unknown>;
    const layer = root?.data ?? root;
    const list = unwrapApiList<Record<string, unknown>>(layer);
    return list.map(mapRoomFile).filter(Boolean) as ProfessorRoomFile[];
  } catch {
    try {
      const raw = await apiRequest<unknown>(`${BASE}/GetRoomFiles${buildQuery({ RoomId: roomId })}`);
      const root = raw as Record<string, unknown>;
      const layer = root?.data ?? root;
      const list = unwrapApiList<Record<string, unknown>>(layer);
      return list.map(mapRoomFile).filter(Boolean) as ProfessorRoomFile[];
    } catch {
      return [];
    }
  }
}

export async function deleteProfessorRoomFile(roomId: number, fileId: number): Promise<void> {
  await apiRequest(`${BASE}/DeleteRoomFile`, {
    method: 'POST',
    body: { roomId, fileId },
  });
}

export async function uploadProfessorRoomFile(
  roomId: number,
  fileType: number,
  file: File,
  metadata: { title: string; description?: string },
  onProgress?: (percent: number) => void
): Promise<{ roomId: number; title: string; fileName: string; fileUrl: string }> {
  const form = new FormData();
  form.append('roomId', String(roomId));
  form.append('fileType', String(fileType));
  form.append('title', metadata.title.trim());
  if (metadata.description?.trim()) {
    form.append('description', metadata.description.trim());
  }
  form.append('file', file);

  const { API_BASE_URL } = await import('./config');
  const url = `${API_BASE_URL.replace(/\/$/, '')}/Room/UploadFile`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.withCredentials = true;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as Record<string, unknown>;
          const layer = (parsed.data ?? parsed) as Record<string, unknown>;
          resolve({
            roomId: Number(layer.roomId ?? layer.RoomId ?? roomId),
            title: String(layer.title ?? layer.Title ?? metadata.title),
            fileName: String(layer.fileName ?? layer.FileName ?? file.name),
            fileUrl: String(layer.fileUrl ?? layer.FileUrl ?? ''),
          });
        } catch {
          reject(new Error('Invalid upload response'));
        }
        return;
      }
      reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }
    xhr.send(form);
  });
}

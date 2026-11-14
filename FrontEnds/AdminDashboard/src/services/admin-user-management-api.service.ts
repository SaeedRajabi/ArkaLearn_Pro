import apiClient from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/api-command-result';
import { asLongId } from '@/lib/id';

const BASE = '/AdminUserManagement';
const STUDENT_BASE = '/Student';

export type AdminCreateUserPayload = {
  userName: string;
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  userRole: 'STUDENT' | 'TEACHER';
};

export type AdminCreateUserResult = {
  userId: string;
  studentId?: string | null;
  teacherId?: string | null;
};
function unwrapData<T>(raw: unknown): T | null {
  const root = raw as Record<string, unknown> | null | undefined;
  if (!root || typeof root !== 'object') return null;
  const data = (root.data ?? root.Data ?? root) as T;
  return data ?? null;
}

function unwrapPagedRoot(raw: unknown): Record<string, unknown> {  let cur: unknown = raw;
  for (let depth = 0; depth < 6; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) break;
    const obj = cur as Record<string, unknown>;
    if ('queryResult' in obj || 'QueryResult' in obj || 'totalCount' in obj || 'TotalCount' in obj) {
      return obj;
    }
    const next = obj.data ?? obj.Data;
    if (next && typeof next === 'object' && !Array.isArray(next)) {
      cur = next;
      continue;
    }
    return obj;
  }
  return (cur && typeof cur === 'object' && !Array.isArray(cur) ? cur : {}) as Record<string, unknown>;
}

function extractPagedList(raw: unknown): unknown[] {
  let cur: unknown = raw;
  for (let depth = 0; depth < 8; depth++) {
    if (Array.isArray(cur)) return cur;
    if (!cur || typeof cur !== 'object') return [];
    const obj = cur as Record<string, unknown>;
    const qr = obj.queryResult ?? obj.QueryResult;
    if (qr != null) {
      cur = qr;
      continue;
    }
    if (Array.isArray(obj.$values)) return obj.$values;
    const next = obj.data ?? obj.Data;
    if (next && next !== cur) {
      cur = next;
      continue;
    }
    return [];
  }
  return [];
}

function readPagedTotalCount(raw: unknown, fallback: number): number {
  const layer = unwrapPagedRoot(raw);
  const total = Number(layer.totalCount ?? layer.TotalCount ?? 0);
  return total > 0 ? total : fallback;
}

async function fetchStudentPagedList(
  path: string,
  params: Record<string, unknown>
): Promise<{ list: unknown[]; totalCount: number }> {
  const { data } = await apiClient.get<unknown>(path, { params });
  const list = extractPagedList(data ?? {});
  return { list, totalCount: readPagedTotalCount(data, list.length) };
}

export async function adminCreateUser(payload: AdminCreateUserPayload): Promise<AdminCreateUserResult> {
  const res = await apiClient.post<unknown>(`${BASE}/AdminCreate`, {
    UserName: payload.userName,
    FullName: payload.fullName,
    Email: payload.email,
    Password: payload.password,
    PhoneNumber: payload.phoneNumber,
    UserRole: payload.userRole,
    AcceptedTerms: true,
  });
  const data = unwrapData<AdminCreateUserResult>(res.data);
  if (!data?.userId && !(data as Record<string, unknown> | null)?.UserId) {
    throw new Error(getApiErrorMessage(res.data, 'Could not create user.'));
  }
  const row = data as Record<string, unknown>;
  return {
    userId: asLongId(row.userId ?? row.UserId ?? 0),
    studentId: asLongId(row.studentId ?? row.StudentId ?? 0) !== '0'
      ? asLongId(row.studentId ?? row.StudentId ?? 0)
      : undefined,
    teacherId: asLongId(row.teacherId ?? row.TeacherId ?? 0) !== '0'
      ? asLongId(row.teacherId ?? row.TeacherId ?? 0)
      : undefined,
  };
}

export async function adminBulkNotify(payload: {
  userIds: string[];  channel: 'email' | 'sms';
  subject: string;
  body: string;
}): Promise<{ sent: number; failed: number }> {
  const res = await apiClient.post<unknown>(`${BASE}/BulkNotify`, {
    UserIds: payload.userIds.map((id) => asLongId(id)),    Channel: payload.channel,
    Subject: payload.subject,
    Body: payload.body,
  });
  const data = unwrapData<Record<string, unknown>>(res.data) ?? {};
  return {
    sent: Number(data.sent ?? data.Sent ?? 0),
    failed: Number(data.failed ?? data.Failed ?? 0),
  };
}

export async function adminSendNotifications(payload: {
  userIds: string[];  title: string;
  body: string;
  linkUrl?: string;
}): Promise<{ sent: number }> {
  const res = await apiClient.post<unknown>(`${BASE}/SendNotifications`, {
    UserIds: payload.userIds.map((id) => asLongId(id)),    Title: payload.title,
    Body: payload.body,
    LinkUrl: payload.linkUrl ?? '',
  });
  const data = unwrapData<Record<string, unknown>>(res.data) ?? {};
  return { sent: Number(data.sent ?? data.Sent ?? payload.userIds.length) };
}

export async function adminAssignStudentRooms(payload: {
  portalUserId: string;
  roomIds: number[];
}): Promise<{ assignedRoomCount: number }> {
  const res = await apiClient.post<unknown>(`${BASE}/AssignStudentRooms`, {
    PortalUserId: asLongId(payload.portalUserId),    RoomIds: payload.roomIds,
  });
  const data = unwrapData<Record<string, unknown>>(res.data) ?? {};
  return {
    assignedRoomCount: Number(data.assignedRoomCount ?? data.AssignedRoomCount ?? payload.roomIds.length),
  };
}

export async function adminAssignStudentsToTeacher(payload: {
  teacherUserId: string;
  studentUserIds: string[];
  courseId: number;
}): Promise<{ enrolledCount: number; skippedCount: number }> {
  const res = await apiClient.post<unknown>(`${BASE}/AssignStudentsToTeacher`, {
    TeacherUserId: asLongId(payload.teacherUserId),
    StudentUserIds: payload.studentUserIds.map((id) => asLongId(id)),    CourseId: payload.courseId,
  });
  const data = unwrapData<Record<string, unknown>>(res.data) ?? {};
  return {
    enrolledCount: Number(data.enrolledCount ?? data.EnrolledCount ?? 0),
    skippedCount: Number(data.skippedCount ?? data.SkippedCount ?? 0),
  };
}

export async function searchUserCourseComments(params: {
  userId: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: Array<{ id: number; courseTitle: string; commentText: string; createdAt: string; isApproved: boolean }>; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 7;
  const { list, totalCount } = await fetchStudentPagedList(`${STUDENT_BASE}/SearchUserCourseComments`, {
    UserId: asLongId(params.userId),
    PageNumber: pageNumber,
    PageSize: pageSize,
    NeedTotalCount: true,
  });
  const items = list.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: Number(row.id ?? row.Id ?? 0),
      courseTitle: String(row.courseTitle ?? row.CourseTitle ?? ''),
      commentText: String(row.commentText ?? row.CommentText ?? row.text ?? row.Text ?? ''),
      createdAt: String(row.createdAt ?? row.CreateAt ?? row.CreatedAt ?? row.timeStamp ?? row.TimeStamp ?? ''),
      isApproved: Boolean(row.isApproved ?? row.IsApproved),
    };
  });
  return { items, totalCount: totalCount || items.length };
}

export type StudentQaItem = {
  id: number;
  kind: 'project' | 'community';
  contextTitle: string;
  subject: string;
  status: string;
  createdAt: string;
};

export async function searchStudentQaItems(params: {
  userId: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: StudentQaItem[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 7;
  const userId = asLongId(params.userId);
  const query = {
    UserId: userId,
    PageNumber: pageNumber,
    PageSize: pageSize,
    NeedTotalCount: true,
  };

  const [projectRes, communityRes] = await Promise.all([
    fetchStudentPagedList(`${STUDENT_BASE}/SearchUserProjectQuestions`, query).catch(() => ({
      list: [] as unknown[],
      totalCount: 0,
    })),
    fetchStudentPagedList(`${STUDENT_BASE}/SearchUserCommunityThreads`, query).catch(() => ({
      list: [] as unknown[],
      totalCount: 0,
    })),
  ]);

  const projectItems: StudentQaItem[] = projectRes.list.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: Number(row.id ?? row.Id ?? 0),
      kind: 'project' as const,
      contextTitle: String(row.projectTitle ?? row.ProjectTitle ?? ''),
      subject: String(row.subject ?? row.Subject ?? ''),
      status: String(row.status ?? row.Status ?? ''),
      createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    };
  });

  const communityItems: StudentQaItem[] = communityRes.list.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: Number(row.id ?? row.Id ?? 0),
      kind: 'community' as const,
      contextTitle: '',
      subject: String(row.subject ?? row.Subject ?? row.contentPreview ?? row.ContentPreview ?? ''),
      status: 'Published',
      createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    };
  });

  const items = [...projectItems, ...communityItems].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt, undefined, { numeric: true })
  );
  const totalCount = (projectRes.totalCount || projectItems.length) + (communityRes.totalCount || communityItems.length);
  return { items, totalCount };
}

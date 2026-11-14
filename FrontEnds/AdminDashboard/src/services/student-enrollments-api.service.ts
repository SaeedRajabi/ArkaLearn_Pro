import apiClient from '@/lib/apiClient';
import { asLongId, isValidLongId } from '@/lib/id';

const BASE_STUDENT = 'Student';
const BASE_SEMINAR = 'Seminar';

export type CourseEnrollmentItem = {
  id: number;
  userId: string;
  userFullName: string | null;
  userName: string | null;
  email: string | null;
  courseId: number;
  courseTitle: string | null;
  teacherId?: number | null;
  teacherName?: string | null;
  isActive: boolean;
  enrollmentDateTime: string;
  deliveryMode?: 'directDownload' | 'desktopLicense';
  canApprove?: boolean;
};

export type SeminarRegistrationItem = {
  id: number;
  userId: number;
  userFullName: string | null;
  userName: string | null;
  email: string | null;
  seminarId: number;
  seminarTitle: string | null;
  hasPaid: boolean;
  registeredAt: string;
};

type PagedResponse<T> = {
  queryResult?: T[] | { $values?: T[] };
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
};

function unwrapPagedRoot(raw: unknown): Record<string, unknown> {
  const root = raw as Record<string, unknown> | null | undefined;
  if (!root || typeof root !== 'object') return {};
  const nested = root.data ?? root.Data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return root;
}

function extractArray<T>(data: unknown): T[] {
  const layer = unwrapPagedRoot(data);
  const qr = layer.queryResult ?? layer.QueryResult;
  if (qr == null) return [];
  if (Array.isArray(qr)) return qr;
  const withValues = qr as { $values?: T[] };
  return Array.isArray(withValues?.$values) ? withValues.$values : [];
}

function readTotalCount(data: unknown, fallback: number): number {
  const layer = unwrapPagedRoot(data);
  const total = Number(layer.totalCount ?? layer.TotalCount ?? 0);
  return total > 0 ? total : fallback;
}

function normalize<T extends Record<string, unknown>>(
  raw: Record<string, unknown>,
  keyMap: Record<string, string>
): T {
  const out: Record<string, unknown> = {};
  for (const [targetKey, srcKey] of Object.entries(keyMap)) {
    const val = raw[srcKey] ?? raw[targetKey];
    if (val !== undefined) out[targetKey] = val;
  }
  return out as T;
}

const seminarRegKeys: Record<string, string> = {
  id: 'Id', userId: 'UserId', userFullName: 'UserFullName', userName: 'UserName',
  email: 'Email', seminarId: 'SeminarId', seminarTitle: 'SeminarTitle', hasPaid: 'HasPaid',
  registeredAt: 'RegisteredAt',
};

export async function getCourseEnrollments(params: {
  courseId?: number;
  userId?: string | number;
  studentId?: string | number;
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
}): Promise<{ items: CourseEnrollmentItem[]; totalCount: number }> {
  const resolvedUserId = params.userId != null && isValidLongId(asLongId(params.userId))
    ? asLongId(params.userId)
    : '0';
  const resolvedStudentId = params.studentId != null && isValidLongId(asLongId(params.studentId))
    ? asLongId(params.studentId)
    : '0';

  const queryParams: Record<string, string | number | boolean> = {
    CourseId: params.courseId ?? 0,
    UserId: resolvedUserId,
    PageNumber: params.pageNumber ?? 1,
    PageSize: params.pageSize ?? 50,
    NeedTotalCount: params.needTotalCount ?? true,
  };
  if (resolvedStudentId !== '0') {
    queryParams.StudentId = resolvedStudentId;
  }

  const { data } = await apiClient.get<PagedResponse<Record<string, unknown>>>(
    `${BASE_STUDENT}/GetCourseEnrollments`,
    { params: queryParams }
  );
  const rawList = extractArray<Record<string, unknown>>(data ?? {});
  const items = rawList.map((r) =>
    normalizeCourseEnrollment(r)
  );
  const totalCount = readTotalCount(data, items.length);
  return { items, totalCount };
}

function normalizeCourseEnrollment(raw: Record<string, unknown>): CourseEnrollmentItem {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    userId: asLongId(raw.userId ?? raw.UserId ?? 0),
    userFullName: (raw.userFullName ?? raw.UserFullName ?? null) as string | null,
    userName: (raw.userName ?? raw.UserName ?? null) as string | null,
    email: (raw.email ?? raw.Email ?? null) as string | null,
    courseId: Number(raw.courseId ?? raw.CourseId ?? 0),
    courseTitle: (raw.courseTitle ?? raw.CourseTitle ?? null) as string | null,
    teacherId: raw.teacherId != null || raw.TeacherId != null
      ? Number(raw.teacherId ?? raw.TeacherId)
      : null,
    teacherName: (raw.teacherName ?? raw.TeacherName ?? null) as string | null,
    isActive: Boolean(raw.isActive ?? raw.IsActive),
    enrollmentDateTime: String(raw.enrollmentDateTime ?? raw.EnrollmentDateTime ?? ''),
    deliveryMode: (raw.deliveryMode ?? raw.DeliveryMode ?? 'directDownload') as CourseEnrollmentItem['deliveryMode'],
    canApprove: Boolean(raw.canApprove ?? raw.CanApprove ?? false),
  };
}

export async function getAllSeminarRegistrations(params: {
  seminarId?: number;
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
}): Promise<{ items: SeminarRegistrationItem[]; totalCount: number }> {
  const { data } = await apiClient.get<PagedResponse<Record<string, unknown>>>(
    `${BASE_SEMINAR}/GetAllRegistrations`,
    {
      params: {
        SeminarId: params.seminarId ?? 0,
        PageNumber: params.pageNumber ?? 1,
        PageSize: params.pageSize ?? 50,
        NeedTotalCount: params.needTotalCount ?? true,
      },
    }
  );
  const rawList = extractArray(data ?? {});
  const items = rawList.map((r) =>
    normalize<SeminarRegistrationItem>(r as Record<string, unknown>, seminarRegKeys)
  ) as SeminarRegistrationItem[];
  const totalCount = Number((data as Record<string, unknown>)?.totalCount ?? (data as Record<string, unknown>)?.TotalCount ?? 0) || items.length;
  return { items, totalCount };
}

import apiClient from '@/lib/apiClient';
import { asLongId } from '@/lib/id';

const BASE = 'Student';

export type PortalStudentRow = {
  userId: string;
  studentId: string;
  managedRoomStudentId: string | null;
  fullName: string | null;
  userName: string | null;
  email: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  status: string;
  courseEnrollmentCount: number;
  registeredAt: string;
};

type PagedResponse<T> = {
  queryResult?: T[] | { $values?: T[] };
  totalCount?: number;
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

function normalizePortalStudent(raw: Record<string, unknown>): PortalStudentRow {
  const managedRaw = raw.managedRoomStudentId ?? raw.ManagedRoomStudentId;
  const managedRoomStudentId =
    managedRaw != null && String(managedRaw).trim() !== '' && String(managedRaw) !== '0'
      ? asLongId(managedRaw)
      : null;
  return {
    userId: asLongId(raw.userId ?? raw.UserId ?? 0),
    studentId: asLongId(raw.studentId ?? raw.StudentId ?? 0),
    managedRoomStudentId,
    fullName: (raw.fullName ?? raw.FullName ?? null) as string | null,
    userName: (raw.userName ?? raw.UserName ?? null) as string | null,
    email: (raw.email ?? raw.Email ?? null) as string | null,
    phoneNumber: (raw.phoneNumber ?? raw.PhoneNumber ?? null) as string | null,
    isActive: Boolean(raw.isActive ?? raw.IsActive),
    status: String(raw.status ?? raw.Status ?? ''),
    courseEnrollmentCount: Number(raw.courseEnrollmentCount ?? raw.CourseEnrollmentCount ?? 0),
    registeredAt: String(raw.registeredAt ?? raw.RegisteredAt ?? ''),
  };
}

export async function searchPortalStudents(params: {
  inputValue?: string;
  userId?: string;
  isActive?: boolean | null;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: PortalStudentRow[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 10;
  const queryParams: Record<string, unknown> = {
    InputValue: params.inputValue ?? '',
    PageNumber: pageNumber,
    PageSize: pageSize,
    NeedTotalCount: true,
  };
  if (params.userId && params.userId !== '0') {
    queryParams.UserId = params.userId;
  }
  if (params.isActive !== undefined && params.isActive !== null) {
    queryParams.IsActive = params.isActive;
  }

  const { data } = await apiClient.get<PagedResponse<Record<string, unknown>>>(
    `${BASE}/SearchPortalStudents`,
    { params: queryParams }
  );
  const rawList = extractArray<Record<string, unknown>>(data ?? {});
  const items = rawList.map((r) => normalizePortalStudent(r));
  const totalCount = readTotalCount(data, items.length);
  return { items, totalCount };
}

import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';

const BASE = '/ManagedRoomStudent';

export type ManagedRoomStudentRow = {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  photoUrl?: string | null;
};

function unwrapPaged<T>(raw: unknown): { list: T[]; totalCount: number } {
  const root = raw as Record<string, unknown> | null | undefined;
  const dataLayer = (root && typeof root === 'object' && 'data' in root ? (root as { data?: unknown }).data : root) as
    | Record<string, unknown>
    | undefined;
  const inner =
    dataLayer && typeof dataLayer === 'object' && 'queryResult' in dataLayer
      ? (dataLayer as { queryResult?: unknown; totalCount?: number })
      : {};
  let list: T[] = [];
  const qr = inner.queryResult;
  if (Array.isArray(qr)) list = qr as T[];
  else if (qr && typeof qr === 'object' && '$values' in (qr as object))
    list = ((qr as { $values: T[] }).$values ?? []) as T[];
  return { list, totalCount: Number(inner.totalCount ?? 0) };
}

export async function searchManagedRoomStudents(params: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ list: ManagedRoomStudentRow[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 10;
  const res = await apiClient.get<unknown>(`${BASE}/Search`, {
    params: {
      inputValue: params.inputValue ?? '',
      pageNumber,
      pageSize,
      needTotalCount: true,
      skipCount: (pageNumber - 1) * pageSize,
      sortBy: 'Id',
      sortAscending: false,
    },
  });
  return unwrapPaged<ManagedRoomStudentRow>(res.data);
}

export type CreateManagedRoomStudentPayload = {
  firstName: string;
  lastName: string;
  userName: string;
  email?: string | null;
  password: string;
  phone?: string | null;
  notes?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  photoUrl?: string | null;
};

export async function createManagedRoomStudent(payload: CreateManagedRoomStudentPayload): Promise<number> {
  const res = await apiClient.post<{ data?: number } | number>(`${BASE}/Create`, payload);
  const raw = res.data as unknown;
  if (typeof raw === 'number') return raw;
  if (raw && typeof raw === 'object' && 'data' in (raw as object)) return Number((raw as { data: unknown }).data);
  return Number(raw);
}

export type UpdateManagedRoomStudentPayload = {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  email?: string | null;
  password?: string | null;
  phone?: string | null;
  notes?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  photoUrl?: string | null;
};

export async function updateManagedRoomStudent(payload: UpdateManagedRoomStudentPayload): Promise<void> {
  await apiWriteUpdate(`${BASE}/Update`, payload);
}

export async function deleteManagedRoomStudent(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/Delete`, { params: { id } });
}

export async function uploadManagedRoomStudentPhoto(studentId: number, file: File): Promise<string> {
  const form = new FormData();
  form.append('studentId', String(studentId));
  form.append('photo', file);
  const res = await apiClient.post<{ photoUrl?: string; data?: { photoUrl?: string } }>(`${BASE}/UploadPhoto`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const raw = res.data as Record<string, unknown> | undefined;
  const url =
    (raw?.photoUrl as string) ||
    ((raw?.data as Record<string, unknown> | undefined)?.photoUrl as string | undefined);
  if (!url) throw new Error('No photoUrl in response');
  return url;
}

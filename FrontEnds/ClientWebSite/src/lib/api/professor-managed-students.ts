import { apiRequest, buildQuery } from './client';
import { unwrapApiList } from '@/lib/api/normalize-list';

const BASE = 'ManagedRoomStudent';

export type ManagedRoomStudent = {
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

function mapRow(item: Record<string, unknown>): ManagedRoomStudent {
  return {
    id: Number(item.id ?? item.Id ?? 0),
    firstName: String(item.firstName ?? item.FirstName ?? ''),
    lastName: String(item.lastName ?? item.LastName ?? ''),
    userName: String(item.userName ?? item.UserName ?? ''),
    email: (item.email ?? item.Email ?? null) as string | null,
    phone: (item.phone ?? item.Phone ?? null) as string | null,
    notes: (item.notes ?? item.Notes ?? null) as string | null,
    gender: (item.gender ?? item.Gender ?? null) as string | null,
    dateOfBirth: (item.dateOfBirth ?? item.DateOfBirth ?? null) as string | null,
    photoUrl: (item.photoUrl ?? item.PhotoUrl ?? null) as string | null,
  };
}

export async function searchMyManagedRoomStudents(params: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ list: ManagedRoomStudent[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 100;
  const raw = await apiRequest<unknown>(
    `${BASE}/SearchMyStudents${buildQuery({
      inputValue: params.inputValue ?? '',
      pageNumber,
      pageSize,
      needTotalCount: true,
      skipCount: (pageNumber - 1) * pageSize,
      sortBy: 'Id',
      sortAscending: false,
    })}`
  );

  const root = raw as Record<string, unknown>;
  const layer = (root?.data ?? root) as Record<string, unknown>;
  const list = unwrapApiList<Record<string, unknown>>(layer?.queryResult ?? layer?.QueryResult ?? raw)
    .map(mapRow)
    .filter((s) => s.id > 0);

  return {
    list,
    totalCount: Number(layer?.totalCount ?? layer?.TotalCount ?? list.length),
  };
}

export async function searchManagedRoomStudents(params: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ list: ManagedRoomStudent[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 100;
  const raw = await apiRequest<unknown>(
    `${BASE}/Search${buildQuery({
      inputValue: params.inputValue ?? '',
      pageNumber,
      pageSize,
      needTotalCount: true,
      skipCount: (pageNumber - 1) * pageSize,
      sortBy: 'Id',
      sortAscending: false,
    })}`
  );

  const root = raw as Record<string, unknown>;
  const layer = (root?.data ?? root) as Record<string, unknown>;
  const list = unwrapApiList<Record<string, unknown>>(layer?.queryResult ?? layer?.QueryResult ?? raw)
    .map(mapRow)
    .filter((s) => s.id > 0);

  return {
    list,
    totalCount: Number(layer?.totalCount ?? layer?.TotalCount ?? list.length),
  };
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
};

export async function createManagedRoomStudent(payload: CreateManagedRoomStudentPayload): Promise<number> {
  const raw = await apiRequest<unknown>(`${BASE}/Create`, { method: 'POST', body: payload });
  if (typeof raw === 'number') return raw;
  const obj = raw as Record<string, unknown>;
  const data = obj?.data ?? obj?.Data ?? raw;
  return Number(data);
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
};

export async function updateManagedRoomStudent(payload: UpdateManagedRoomStudentPayload): Promise<void> {
  await apiRequest(`${BASE}/Update`, { method: 'POST', body: payload });
}

export async function deleteManagedRoomStudent(id: number): Promise<void> {
  await apiRequest(`${BASE}/Delete${buildQuery({ id })}`, { method: 'DELETE' });
}

export async function uploadManagedRoomStudentPhoto(studentId: number, file: File): Promise<string> {
  const form = new FormData();
  form.append('studentId', String(studentId));
  form.append('photo', file);
  const raw = await apiRequest<Record<string, unknown>>(`${BASE}/UploadPhoto`, {
    method: 'POST',
    body: form,
  });
  return String(raw.photoUrl ?? raw.PhotoUrl ?? '');
}

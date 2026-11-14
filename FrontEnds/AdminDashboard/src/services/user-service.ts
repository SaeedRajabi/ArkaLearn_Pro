import apiClient from '@/lib/apiClient';
import type {Role, User} from '@/lib/types';
import { PagedData } from '@/lib/responseTypes';
import { getApiErrorMessage, getCommandMessages, isCommandResponseSuccess } from '@/lib/api-command-result';
import { tryParseApiDate } from '@/lib/format-user-date';
import { resolveUserAvatarUrl } from '@/lib/default-user-avatar';
import { asLongId, isValidLongId } from '@/lib/id';

export type SearchUserRow = {
  id?: number | string;
  Id?: number | string;
  userId?: number | string;
  UserId?: number | string;
  name?: string;
  Name?: string;
  email?: string;
  Email?: string;
  avatarUrl?: string;
  AvatarUrl?: string;
  initials?: string;
  Initials?: string;
  status?: string;
  Status?: string;
  registrationDate?: string;
  RegistrationDate?: string;
  lastLogin?: string;
  LastLogin?: string;
  role?: string;
  Role?: string;
};

export function pickUserId(row: SearchUserRow | Record<string, unknown>): string {
  const r = row as SearchUserRow;
  const raw = r.id ?? r.Id ?? r.userId ?? r.UserId;
  const id = asLongId(raw);
  if (!isValidLongId(id)) {
    throw new Error('Invalid user id from API');
  }
  return id;
}

function unwrapPaged<T>(raw: unknown): { list: T[]; totalCount: number } {
  const root = raw as Record<string, unknown> | null | undefined;
  const dataLayer = (root && typeof root === 'object' && 'data' in root ? (root as { data?: unknown }).data : root) as
    | Record<string, unknown>
    | undefined;
  const inner =
    dataLayer && typeof dataLayer === 'object' && 'queryResult' in dataLayer
      ? (dataLayer as { queryResult?: unknown; totalCount?: number })
      : (dataLayer as { queryResult?: unknown; totalCount?: number } | undefined) ?? {};
  let list: T[] = [];
  const qr = inner.queryResult;
  if (Array.isArray(qr)) list = qr as T[];
  else if (qr && typeof qr === 'object' && '$values' in (qr as object))
    list = ((qr as { $values: T[] }).$values ?? []) as T[];
  return { list, totalCount: Number(inner.totalCount ?? 0) };
}

export function mapApiStatus(status: string): User['status'] {
  const normalized = (status ?? '').toUpperCase();
  if (normalized.includes('BLOCK')) return 'Blocked';
  return 'Active';
}

export function mapSearchRowToUser(row: SearchUserRow): User {
  const id = pickUserId(row);
  return {
    id,
    name: row.name ?? row.Name ?? row.email ?? row.Email ?? String(id),
    email: row.email ?? row.Email ?? '',
    avatarUrl: resolveUserAvatarUrl(row.avatarUrl ?? row.AvatarUrl),
    initials: row.initials ?? row.Initials ?? '?',
    status: mapApiStatus(row.status ?? row.Status ?? ''),
    registrationDate: row.registrationDate || row.RegistrationDate
      ? new Date(row.registrationDate ?? row.RegistrationDate ?? '')
      : new Date(),
    lastLogin: row.lastLogin || row.LastLogin
      ? new Date(row.lastLogin ?? row.LastLogin ?? '')
      : new Date(),
    role: (row.role ?? row.Role ?? 'User') as Role,
  };
}

export async function searchUsers(params: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
  cacheBust?: boolean;
}): Promise<{ list: SearchUserRow[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 10;
  const res = await apiClient.get<unknown>('/User/Search', {
    params: {
      inputValue: params.inputValue ?? '',
      pageNumber,
      pageSize,
      needTotalCount: true,
      skipCount: (pageNumber - 1) * pageSize,
      sortBy: 'UserName',
      sortAscending: true,
      ...(params.cacheBust ? { _: Date.now() } : {}),
    },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });
  return unwrapPaged<SearchUserRow>(res.data);
}

export async function getUser(id: string): Promise<User | null> {
  const res = await apiClient.get<unknown>('/User/GetById', { params: { UserId: id } });
  const raw = res.data as Record<string, unknown> | null;
  const data = (raw?.data ?? raw) as Record<string, unknown> | null;
  if (!data) return null;
  const row: SearchUserRow = {
    id: asLongId(data.userId ?? data.id ?? data.Id ?? data.UserId ?? id) ?? id,
    name: String(data.fullName ?? data.name ?? data.Name ?? data.userName ?? data.UserName ?? ''),
    email:
      typeof data.email === 'object' && data.email && 'value' in (data.email as object)
        ? String((data.email as { value: string }).value)
        : String(data.email ?? data.Email ?? ''),
    avatarUrl: String(data.avatar ?? data.profileImage ?? data.avatarUrl ?? data.AvatarUrl ?? ''),
    initials: String(data.userName ?? data.UserName ?? '').slice(0, 2).toUpperCase() || '?',
    status: String(data.status ?? data.Status ?? 'ACTIVE'),
    registrationDate: String(data.createAt ?? data.CreateAt ?? data.registrationDate ?? ''),
    lastLogin: String(data.lastLogin ?? data.LastLogin ?? ''),
    role: String(data.userRole ?? data.role ?? data.Role ?? 'User'),
  };
  return mapSearchRowToUser(row);
}

export async function setUserBlocked(userId: string, blocked: boolean): Promise<void> {
  await apiClient.post('/User/SetStatus', { UserId: userId, Blocked: blocked });
}

export async function deleteUser(userId: string): Promise<void> {
  const paths = ['/User/Delete', '/User/Remove'];
  let lastError: unknown;

  for (const path of paths) {
    try {
      const res = await apiClient.post(
        path,
        { userId, UserId: userId },
        { params: { userId } }
      );
      if (!isCommandResponseSuccess(res.data, res.status)) {
        const msgs = getCommandMessages(res.data);
        throw Object.assign(new Error(msgs[0] || 'Could not delete user.'), { response: res });
      }
      return;
    } catch (err) {
      lastError = err;
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404) throw err;
    }
  }

  throw lastError;
}

export type AdminUpdateUserPayload = {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
};

export async function adminUpdateUser(payload: AdminUpdateUserPayload): Promise<void> {
  await apiClient.post('/User/AdminUpdate', {
    UserId: payload.userId,
    FirstName: payload.firstName,
    LastName: payload.lastName,
    Email: payload.email,
    Password: payload.password,
  });
}

export function getUserDeleteErrorMessage(error: unknown): string {
  const ax = error as { response?: { status?: number; data?: unknown } };
  if (ax.response?.status === 404) {
    return 'User was not found. Refresh the list and try again.';
  }
  return getApiErrorMessage(error, 'Could not delete user.');
}

/** @deprecated Use searchUsers instead */
export const getUsers = async (
  action = '',
  searchTerm = '',
  pageNumber = 1,
  pageSize = 10,
  skipCount = 0,
  needTotalCount = true,
  sortBy = '',
  sortAscending = true
): Promise<PagedData<User>> => {
  void action;
  void skipCount;
  void needTotalCount;
  void sortBy;
  void sortAscending;
  const { list, totalCount } = await searchUsers({
    inputValue: searchTerm,
    pageNumber,
    pageSize,
  });
  return {
    queryResult: { $values: list.map(mapSearchRowToUser) },
    pageNumber,
    pageSize,
    totalCount,
    skipCount: (pageNumber - 1) * pageSize,
    needTotalCount: true,
    sortBy: '',
    sortAscending: true,
  };
};

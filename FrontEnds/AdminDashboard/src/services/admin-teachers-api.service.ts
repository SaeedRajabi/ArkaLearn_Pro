import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';
import { asLongId } from '@/lib/id';

export type AdminTeacherRow = {
  teacherId: number;
  userId: string;  displayName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  shortDescription: string;
  teachingCategoryName: string;
  publishedCourseCount: number;
  publishedArticleCount: number;
  points: number;
  accountStatus: string;
  isUserBlocked: boolean;
  walletBalanceToman: number;
  profileApprovalStatus: string;
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

export type TeacherCourseListItem = {
  id: number;
  title: string;
  status: string;
};

export async function searchTeacherUserCourses(params: {
  userId: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: TeacherCourseListItem[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 50;
  const { data } = await apiClient.get<unknown>('/Teacher/SearchUserCourses', {
    params: {
      TeacherUserId: asLongId(params.userId),
      InputValue: '',
      PageNumber: pageNumber,
      PageSize: pageSize,
      NeedTotalCount: true,
    },
  });
  const list = extractPagedList(data ?? {});
  const items = list.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: Number(row.id ?? row.Id ?? 0),
      title: String(row.title ?? row.Title ?? ''),
      status: String(row.status ?? row.Status ?? ''),
    };
  });
  const totalCount = readTotalCount(data, items.length);
  return { items, totalCount };
}

export type TeacherSeminarListItem = {
  id: number;
  title: string;
  status: number;
  startTime: string;
  roomTitle: string | null;
};

export async function searchTeacherUserSeminars(params: {
  userId: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: TeacherSeminarListItem[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 50;
  const { data } = await apiClient.get<unknown>('/Teacher/SearchUserSeminars', {
    params: {
      TeacherUserId: asLongId(params.userId),
      PageNumber: pageNumber,
      PageSize: pageSize,
      NeedTotalCount: true,
    },
  });
  const list = extractPagedList(data ?? {});
  const items = list.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: Number(row.id ?? row.Id ?? 0),
      title: String(row.title ?? row.Title ?? ''),
      status: Number(row.status ?? row.Status ?? 0),
      startTime: String(row.startTime ?? row.StartTime ?? ''),
      roomTitle: (row.roomTitle ?? row.RoomTitle ?? null) as string | null,
    };
  });
  const totalCount = readTotalCount(data, items.length);
  return { items, totalCount };
}

export async function grantTeacherAdvertisementPlan(params: {
  userId: string;
  tariffId: number;
}): Promise<void> {
  await apiWriteUpdate('/Teacher/AdminGrantAdvertisementPlan', {
    TeacherUserId: asLongId(params.userId),
    TariffId: params.tariffId,
  });
}

export async function grantTeacherAutoBumpPlan(params: {
  userId: string;
  packageId: number;
}): Promise<void> {
  await apiWriteUpdate('/Teacher/AdminGrantAutoBumpPlan', {
    TeacherUserId: asLongId(params.userId),
    PackageId: params.packageId,
  });
}

function normalizeTeacher(raw: Record<string, unknown>): AdminTeacherRow {
  return {
    teacherId: Number(raw.teacherId ?? raw.TeacherId ?? 0),
    userId: asLongId(raw.userId ?? raw.UserId ?? 0),
    displayName: String(raw.displayName ?? raw.DisplayName ?? ''),
    userName: String(raw.userName ?? raw.UserName ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    phoneNumber: String(raw.phoneNumber ?? raw.PhoneNumber ?? ''),
    avatarUrl: String(raw.avatarUrl ?? raw.AvatarUrl ?? ''),
    shortDescription: String(raw.shortDescription ?? raw.ShortDescription ?? ''),
    teachingCategoryName: String(raw.teachingCategoryName ?? raw.TeachingCategoryName ?? ''),
    publishedCourseCount: Number(raw.publishedCourseCount ?? raw.PublishedCourseCount ?? 0),
    publishedArticleCount: Number(raw.publishedArticleCount ?? raw.PublishedArticleCount ?? 0),
    points: Number(raw.points ?? raw.Points ?? 0),
    accountStatus: String(raw.accountStatus ?? raw.AccountStatus ?? 'active'),
    isUserBlocked: Boolean(raw.isUserBlocked ?? raw.IsUserBlocked),
    walletBalanceToman: Number(raw.walletBalanceToman ?? raw.WalletBalanceToman ?? 0),
    profileApprovalStatus: String(raw.profileApprovalStatus ?? raw.ProfileApprovalStatus ?? ''),
  };
}

export async function searchAdminTeachers(params: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: AdminTeacherRow[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 7;
  const { data } = await apiClient.get<PagedResponse<Record<string, unknown>>>('/Teacher/Search', {
    params: {
      InputValue: params.inputValue ?? '',
      PageNumber: pageNumber,
      PageSize: pageSize,
      NeedTotalCount: true,
      ForAdmin: true,
    },
  });
  const rawList = extractArray<Record<string, unknown>>(data ?? {});
  const items = rawList.map((r) => normalizeTeacher(r));
  const totalCount = readTotalCount(data, items.length);
  return { items, totalCount };
}

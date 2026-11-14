import apiClient from '@/lib/apiClient';
import { getCommandMessages, isCommandResponseSuccess } from '@/lib/api-command-result';

const BASE = '/Order/DiscountCode';

export type DiscountScopeType = 0 | 1 | 2 | 3;
export type DiscountTypeValue = 1 | 2; // FIXED | PERCENTAGE

export type DiscountCodeRow = {
  id: string;
  code: string;
  title: string | null;
  amount: number;
  discountType: string;
  expirationDate: string;
  isActive: boolean;
  isExpired: boolean;
  usageLimit: number;
  usedCount: number;
  scopeType: DiscountScopeType;
  scopeLabel: string;
  teacherId: string | null;
  studentUserId: string | null;
  courseIds: string[];
};

export type CreateDiscountCodePayload = {
  code: string;
  amount: number;
  discountType: DiscountTypeValue;
  expirationDate?: string | null;
  durationValue?: number | null;
  durationUnit?: 'hours' | 'days' | 'months' | null;
  usageLimit: number;
  scopeType: DiscountScopeType;
  teacherId?: string | null;
  studentUserId?: string | null;
  courseIds?: string[];
  title?: string | null;
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

function asId(value: unknown): string {
  if (value == null) return '0';
  return String(value);
}

function normalizeRow(raw: Record<string, unknown>): DiscountCodeRow {
  const courseRaw = raw.courseIds ?? raw.CourseIds;
  let courseIds: string[] = [];
  if (Array.isArray(courseRaw)) {
    courseIds = courseRaw.map((x) => asId(x));
  } else if (courseRaw && typeof courseRaw === 'object' && Array.isArray((courseRaw as { $values?: unknown[] }).$values)) {
    courseIds = ((courseRaw as { $values: unknown[] }).$values).map((x) => asId(x));
  }

  return {
    id: asId(raw.id ?? raw.Id),
    code: String(raw.code ?? raw.Code ?? ''),
    title: (raw.title ?? raw.Title ?? null) as string | null,
    amount: Number(raw.amount ?? raw.Amount ?? 0),
    discountType: String(raw.discountType ?? raw.DiscountType ?? ''),
    expirationDate: String(raw.expirationDate ?? raw.ExpirationDate ?? ''),
    isActive: Boolean(raw.isActive ?? raw.IsActive),
    isExpired: Boolean(raw.isExpired ?? raw.IsExpired),
    usageLimit: Number(raw.usageLimit ?? raw.UsageLimit ?? 0),
    usedCount: Number(raw.usedCount ?? raw.UsedCount ?? 0),
    scopeType: Number(raw.scopeType ?? raw.ScopeType ?? 0) as DiscountScopeType,
    scopeLabel: String(raw.scopeLabel ?? raw.ScopeLabel ?? ''),
    teacherId: raw.teacherId != null || raw.TeacherId != null ? asId(raw.teacherId ?? raw.TeacherId) : null,
    studentUserId:
      raw.studentUserId != null || raw.StudentUserId != null
        ? asId(raw.studentUserId ?? raw.StudentUserId)
        : null,
    courseIds,
  };
}

export async function searchDiscountCodes(params: {
  inputValue?: string;
  scopeType?: DiscountScopeType | null;
  isActive?: boolean | null;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: DiscountCodeRow[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 10;
  const queryParams: Record<string, unknown> = {
    InputValue: params.inputValue ?? '',
    PageNumber: pageNumber,
    PageSize: pageSize,
    NeedTotalCount: true,
  };
  if (params.scopeType !== undefined && params.scopeType !== null) {
    queryParams.ScopeType = params.scopeType;
  }
  if (params.isActive !== undefined && params.isActive !== null) {
    queryParams.IsActive = params.isActive;
  }

  const { data } = await apiClient.get<PagedResponse<Record<string, unknown>>>(`${BASE}/Search`, {
    params: queryParams,
  });
  const rawList = extractArray<Record<string, unknown>>(data ?? {});
  const items = rawList.map((r) => normalizeRow(r));
  return { items, totalCount: readTotalCount(data, items.length) };
}

export async function createDiscountCode(payload: CreateDiscountCodePayload): Promise<{ ok: boolean; message?: string }> {
  const body = {
    Code: payload.code.trim(),
    Amount: payload.amount,
    DiscountType: payload.discountType,
    ExpirationDate: payload.expirationDate ?? null,
    DurationValue: payload.durationValue ?? null,
    DurationUnit: payload.durationUnit ?? null,
    UsageLimit: payload.usageLimit,
    ScopeType: payload.scopeType,
    TeacherId: payload.teacherId && payload.teacherId !== '0' ? Number(payload.teacherId) : null,
    StudentUserId: payload.studentUserId && payload.studentUserId !== '0' ? Number(payload.studentUserId) : null,
    CourseIds: (payload.courseIds ?? []).map((x) => Number(x)).filter((x) => x > 0),
    Title: payload.title?.trim() || null,
  };

  const res = await apiClient.post(`${BASE}/Add`, body);
  if (isCommandResponseSuccess(res.data, res.status)) {
    return { ok: true };
  }
  const messages = getCommandMessages(res.data);
  return { ok: false, message: messages[0] || 'Failed to create discount code.' };
}

export async function deactivateDiscountCode(id: string): Promise<{ ok: boolean; message?: string }> {
  const res = await apiClient.post(`${BASE}/Deactivate`, { Id: Number(id) });
  if (isCommandResponseSuccess(res.data, res.status)) {
    return { ok: true };
  }
  const messages = getCommandMessages(res.data);
  return { ok: false, message: messages[0] || 'Failed to deactivate discount code.' };
}

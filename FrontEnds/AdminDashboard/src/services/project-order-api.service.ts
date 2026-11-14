import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';

export type ProjectOrderStatus = 'Submitted' | 'Approved' | 'Rejected';

export type SearchProjectOrderItem = {
  id: number;
  requestNumber: number;
  title: string;
  projectType?: string | null;
  status: ProjectOrderStatus;
  requesterName?: string | null;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
};

export type ProjectOrderDetail = {
  id: number;
  requestNumber: number;
  userId?: number | null;
  requesterName?: string | null;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  requesterAvatarUrl?: string | null;
  title: string;
  projectType?: string | null;
  descriptionHtml?: string | null;
  status: ProjectOrderStatus;
  adminNote?: string | null;
  reviewedByUserId?: number | null;
  reviewedByName?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
};

type PagedResponse = {
  queryResult?: SearchProjectOrderItem[] | { $values?: SearchProjectOrderItem[] };
  totalCount?: number;
  QueryResult?: SearchProjectOrderItem[] | { $values?: SearchProjectOrderItem[] };
  TotalCount?: number;
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if ('data' in obj && obj.data && typeof obj.data === 'object') return unwrap<T>(obj.data);
  return obj as T;
}

function extractList(raw: PagedResponse): SearchProjectOrderItem[] {
  const qr = raw.queryResult ?? raw.QueryResult;
  if (Array.isArray(qr)) return qr;
  if (qr && typeof qr === 'object' && Array.isArray((qr as { $values?: unknown[] }).$values)) {
    return (qr as { $values: SearchProjectOrderItem[] }).$values;
  }
  return [];
}

function mapSearchItem(row: Record<string, unknown>): SearchProjectOrderItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    requestNumber: Number(row.requestNumber ?? row.RequestNumber ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    projectType: (row.projectType ?? row.ProjectType ?? null) as string | null,
    status: String(row.status ?? row.Status ?? 'Submitted') as ProjectOrderStatus,
    requesterName: (row.requesterName ?? row.RequesterName ?? null) as string | null,
    requesterEmail: (row.requesterEmail ?? row.RequesterEmail ?? null) as string | null,
    requesterPhone: (row.requesterPhone ?? row.RequesterPhone ?? null) as string | null,
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    reviewedAt: (row.reviewedAt ?? row.ReviewedAt ?? null) as string | null,
  };
}

function mapDetail(row: Record<string, unknown>): ProjectOrderDetail {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    requestNumber: Number(row.requestNumber ?? row.RequestNumber ?? 0),
    userId: row.userId != null || row.UserId != null
      ? Number(row.userId ?? row.UserId)
      : null,
    requesterName: (row.requesterName ?? row.RequesterName ?? null) as string | null,
    requesterEmail: (row.requesterEmail ?? row.RequesterEmail ?? null) as string | null,
    requesterPhone: (row.requesterPhone ?? row.RequesterPhone ?? null) as string | null,
    requesterAvatarUrl: (row.requesterAvatarUrl ?? row.RequesterAvatarUrl ?? null) as string | null,
    title: String(row.title ?? row.Title ?? ''),
    projectType: (row.projectType ?? row.ProjectType ?? null) as string | null,
    descriptionHtml: (row.descriptionHtml ?? row.DescriptionHtml ?? null) as string | null,
    status: String(row.status ?? row.Status ?? 'Submitted') as ProjectOrderStatus,
    adminNote: (row.adminNote ?? row.AdminNote ?? null) as string | null,
    reviewedByUserId: row.reviewedByUserId != null || row.ReviewedByUserId != null
      ? Number(row.reviewedByUserId ?? row.ReviewedByUserId)
      : null,
    reviewedByName: (row.reviewedByName ?? row.ReviewedByName ?? null) as string | null,
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    reviewedAt: (row.reviewedAt ?? row.ReviewedAt ?? null) as string | null,
  };
}

export async function searchProjectOrders(params: {
  inputValue?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
}): Promise<{ items: SearchProjectOrderItem[]; totalCount: number }> {
  const res = await apiClient.get<unknown>('/ProjectOrder/Search', {
    params: {
      inputValue: params.inputValue ?? '',
      status: params.status ?? '',
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
      needTotalCount: params.needTotalCount ?? true,
    },
  });
  const payload = unwrap<PagedResponse>(res.data) ?? {};
  const list = extractList(payload).map((x) =>
    mapSearchItem(x as unknown as Record<string, unknown>)
  );
  return {
    items: list,
    totalCount: Number(payload.totalCount ?? payload.TotalCount ?? list.length),
  };
}

export async function getProjectOrderById(orderId: number): Promise<ProjectOrderDetail | null> {
  const res = await apiClient.get<unknown>('/ProjectOrder/GetById', { params: { orderId } });
  const payload = unwrap<Record<string, unknown>>(res.data);
  return payload ? mapDetail(payload) : null;
}

export async function reviewProjectOrder(payload: {
  orderId: number;
  approve: boolean;
  adminNote?: string;
}): Promise<void> {
  await apiWriteUpdate('/ProjectOrder/Review', payload);
}

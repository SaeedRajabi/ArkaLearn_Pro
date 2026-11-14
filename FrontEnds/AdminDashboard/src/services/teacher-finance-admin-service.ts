import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';

export type AdminTeacherPayout = {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  amountToman: number;
  status: string;
  requestedAtUtc: string;
  processedAtUtc?: string | null;
  teacherNote?: string | null;
  adminNote?: string | null;
  transferReference?: string | null;
};

export type BackfillTeacherCourseSalesResult = {
  totalPaidInvoices: number;
  invoicesCredited: number;
  newSalesCount: number;
};

function normalizeArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const obj = raw as { $values?: unknown; data?: unknown };
    if (Array.isArray(obj.$values)) return obj.$values as T[];
    if (obj.data) return normalizeArray<T>(obj.data);
  }
  return [];
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string {
  return value == null ? '' : String(value);
}

function normalizePayout(raw: unknown): AdminTeacherPayout {
  const o = raw as Record<string, unknown>;
  return {
    id: num(o.id ?? o.Id),
    teacherId: num(o.teacherId ?? o.TeacherId),
    teacherName: str(o.teacherName ?? o.TeacherName),
    teacherEmail: str(o.teacherEmail ?? o.TeacherEmail),
    amountToman: num(o.amountToman ?? o.AmountToman),
    status: str(o.status ?? o.Status).toLowerCase(),
    requestedAtUtc: str(o.requestedAtUtc ?? o.RequestedAtUtc),
    processedAtUtc: (o.processedAtUtc ?? o.ProcessedAtUtc) as string | null | undefined,
    teacherNote: (o.teacherNote ?? o.TeacherNote) as string | null | undefined,
    adminNote: (o.adminNote ?? o.AdminNote) as string | null | undefined,
    transferReference: (o.transferReference ?? o.TransferReference) as string | null | undefined,
  };
}

function normalizeBackfillResult(raw: unknown): BackfillTeacherCourseSalesResult {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    totalPaidInvoices: num(o.totalPaidInvoices ?? o.TotalPaidInvoices),
    invoicesCredited: num(o.invoicesCredited ?? o.InvoicesCredited),
    newSalesCount: num(o.newSalesCount ?? o.NewSalesCount),
  };
}

const BASE = '/Teacher';

export async function getTeacherPayoutQueue(params?: {
  status?: string;
  take?: number;
}): Promise<AdminTeacherPayout[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.take) search.set('take', String(params.take));
  const qs = search.toString();
  const response = await apiClient.get<unknown>(
    `${BASE}/GetTeacherPayoutQueue${qs ? `?${qs}` : ''}`
  );
  return normalizeArray<unknown>(response.data).map(normalizePayout);
}

export async function processTeacherPayout(payload: {
  payoutId: number;
  action: 'approve' | 'reject';
  transferReference?: string;
  adminNote?: string;
}): Promise<void> {
  await apiWriteUpdate(`${BASE}/ProcessTeacherPayout`, {
    payoutId: payload.payoutId,
    action: payload.action,
    transferReference: payload.transferReference,
    adminNote: payload.adminNote,
  });
}

export async function backfillTeacherCourseSales(): Promise<BackfillTeacherCourseSalesResult> {
  const response = await apiWriteUpdate<unknown>(`${BASE}/BackfillTeacherCourseSales`, {});
  const body = response.data;
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return normalizeBackfillResult((body as { data: unknown }).data);
  }
  return normalizeBackfillResult(body);
}

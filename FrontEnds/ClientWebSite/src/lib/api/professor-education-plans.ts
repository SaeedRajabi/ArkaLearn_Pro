import { apiRequest, buildQuery } from './client';
import { unwrapApiList } from '@/lib/api/normalize-list';

const BASE = 'EducationPlan';

export type ProfessorEducationPlan = {
  id: number;
  title: string;
  hourlyRate: number;
  totalHours: number;
  totalCost: number;
  description?: string;
  managedRoomStudentId?: number;
  roomId?: number;
  ownerUserId?: number;
  startDateUtc: string;
  endDateUtc: string;
  usedMinutes: number;
  remainingMinutes: number;
  usedHours: number;
  remainingHours: number;
  studentFullName?: string;
  studentUserName?: string;
  roomTitle?: string;
  roomSlug?: string;
  paymentType?: 'cash' | 'installment';
  baseTotalCostToman?: number;
  finalTotalCostToman?: number;
  installments?: {
    installmentId: number;
    installmentNumber: number;
    dueDateUtc: string;
    amountToman: number;
    isPaid: boolean;
  }[];
};

export type CreateEducationPlanPayload = {
  title: string;
  hourlyRate: number;
  totalHours: number;
  totalCost: number;
  description: string;
  managedRoomStudentId: number;
  roomId: number;
  ownerUserId: number;
  startDateUtc: string;
  endDateUtc: string;
  paymentType?: 'cash' | 'installment';
  installments?: {
    installmentNumber: number;
    dueDateUtc: string;
    amountToman: number;
  }[];
};

export const INSTALLMENT_MARKUP_PERCENT = 25;

export function applyInstallmentMarkup(baseToman: number): number {
  return Math.round(baseToman * (1 + INSTALLMENT_MARKUP_PERCENT / 100));
}

export function buildDefaultInstallmentRows(
  baseToman: number,
  count: number,
  startDate: Date,
  endDate: Date
): { installmentNumber: number; dueDate: Date; amountToman: number; isPaid?: boolean }[] {
  const finalTotal = applyInstallmentMarkup(baseToman);
  const per = Math.floor(finalTotal / count);
  const remainder = finalTotal - per * count;
  const span = Math.max(endDate.getTime() - startDate.getTime(), 86400000);
  return Array.from({ length: count }, (_, index) => {
    const installmentNumber = index + 1;
    const dueDate =
      count === 1
        ? new Date(startDate)
        : new Date(startDate.getTime() + (span * installmentNumber) / count);
    return {
      installmentNumber,
      dueDate,
      amountToman: installmentNumber === count ? per + remainder : per,
      isPaid: false,
    };
  });
}

/** Keep existing due dates / paid rows; only refresh amounts from current base total. */
export function redistributeInstallmentAmounts(
  rows: { installmentNumber: number; dueDate: Date; amountToman: number; isPaid?: boolean }[],
  baseToman: number
): { installmentNumber: number; dueDate: Date; amountToman: number; isPaid?: boolean }[] {
  if (rows.length === 0) return rows;
  const unpaid = rows.filter((row) => !row.isPaid);
  if (unpaid.length === 0) return rows;

  const paidTotal = rows.filter((row) => row.isPaid).reduce((sum, row) => sum + row.amountToman, 0);
  const finalTotal = applyInstallmentMarkup(baseToman);
  const remaining = Math.max(0, finalTotal - paidTotal);
  const per = Math.floor(remaining / unpaid.length);
  const remainder = remaining - per * unpaid.length;
  let unpaidIndex = 0;

  return rows.map((row) => {
    if (row.isPaid) return row;
    unpaidIndex += 1;
    return {
      ...row,
      amountToman: unpaidIndex === unpaid.length ? per + remainder : per,
    };
  });
}

export function installmentRowsSum(
  rows: { amountToman: number }[]
): number {
  return rows.reduce((sum, row) => sum + (Number(row.amountToman) || 0), 0);
}

export function mapPlanInstallmentsToFormRows(
  installments: ProfessorEducationPlan['installments']
): { installmentNumber: number; dueDate: Date; amountToman: number; isPaid: boolean }[] {
  return (installments ?? [])
    .slice()
    .sort((a, b) => a.installmentNumber - b.installmentNumber)
    .map((item) => ({
      installmentNumber: item.installmentNumber,
      dueDate: apiIsoToLocalDate(item.dueDateUtc) ?? new Date(),
      amountToman: item.amountToman,
      isPaid: item.isPaid,
    }));
}

function mapInstallment(item: Record<string, unknown>) {
  return {
    installmentId: Number(item.installmentId ?? item.InstallmentId ?? item.id ?? item.Id ?? 0),
    installmentNumber: Number(item.installmentNumber ?? item.InstallmentNumber ?? 0),
    dueDateUtc: String(item.dueDateUtc ?? item.DueDateUtc ?? ''),
    amountToman: Number(item.amountToman ?? item.AmountToman ?? 0),
    isPaid: Boolean(item.isPaid ?? item.IsPaid ?? false),
  };
}

function mapPlanRow(item: Record<string, unknown>): ProfessorEducationPlan {
  const id = Number(item.id ?? item.Id ?? item.planId ?? item.PlanId ?? 0);
  const totalHours = Number(item.totalHours ?? item.TotalHours ?? 0);
  const usedMinutes = Number(item.usedMinutes ?? item.UsedMinutes ?? 0);
  const remainingMinutes = Number(
    item.remainingMinutes ?? item.RemainingMinutes ?? Math.max(0, totalHours * 60 - usedMinutes)
  );
  const baseTotalCostToman = Number(item.baseTotalCostToman ?? item.BaseTotalCostToman ?? 0);
  const totalCost = Number(item.totalCost ?? item.TotalCost ?? 0);
  const paymentTypeRaw = String(item.paymentType ?? item.PaymentType ?? 'cash').toLowerCase();
  const installmentsRaw = item.installments ?? item.Installments;
  return {
    id,
    title: String(item.title ?? item.Title ?? ''),
    hourlyRate: Number(item.hourlyRate ?? item.HourlyRate ?? 0),
    totalHours,
    totalCost: baseTotalCostToman > 0 ? baseTotalCostToman : totalCost,
    description: String(item.description ?? item.Description ?? '') || undefined,
    managedRoomStudentId: Number(item.managedRoomStudentId ?? item.ManagedRoomStudentId ?? 0) || undefined,
    roomId: Number(item.roomId ?? item.RoomId ?? 0) || undefined,
    ownerUserId: Number(item.ownerUserId ?? item.OwnerUserId ?? 0) || undefined,
    startDateUtc: String(item.startDateUtc ?? item.StartDateUtc ?? ''),
    endDateUtc: String(item.endDateUtc ?? item.EndDateUtc ?? ''),
    usedMinutes,
    remainingMinutes,
    usedHours: Math.round((usedMinutes / 60) * 100) / 100,
    remainingHours: Math.round((remainingMinutes / 60) * 100) / 100,
    studentFullName: String(item.studentFullName ?? item.StudentFullName ?? '') || undefined,
    studentUserName: String(item.studentUserName ?? item.StudentUserName ?? '') || undefined,
    roomTitle: String(item.roomTitle ?? item.RoomTitle ?? '') || undefined,
    roomSlug: String(item.roomSlug ?? item.RoomSlug ?? '') || undefined,
    paymentType: paymentTypeRaw === 'installment' ? 'installment' : 'cash',
    baseTotalCostToman: baseTotalCostToman || undefined,
    finalTotalCostToman: Number(item.finalTotalCostToman ?? item.FinalTotalCostToman ?? 0) || undefined,
    installments: Array.isArray(installmentsRaw)
      ? (installmentsRaw as Record<string, unknown>[]).map(mapInstallment).filter((i) => i.installmentNumber > 0)
      : [],
  };
}

function unwrapDetail(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const layer = (obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? obj) as unknown;
  if (layer && typeof layer === 'object' && !Array.isArray(layer)) {
    return layer as Record<string, unknown>;
  }
  return obj;
}

export async function searchProfessorEducationPlans(params: {
  ownerUserId: number;
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ plans: ProfessorEducationPlan[]; totalCount: number }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 50;
  const raw = await apiRequest<unknown>(
    `${BASE}/Plan-Search${buildQuery({
      inputValue: params.inputValue ?? '',
      ownerUserId: params.ownerUserId,
      pageNumber,
      pageSize,
      skipCount: (pageNumber - 1) * pageSize,
      needTotalCount: true,
      sortAscending: false,
    })}`
  );

  const root = raw as Record<string, unknown>;
  const layer = (root?.data ?? root) as Record<string, unknown>;
  const plans = unwrapApiList<Record<string, unknown>>(layer?.queryResult ?? layer?.QueryResult ?? raw)
    .map(mapPlanRow)
    .filter((p) => p.id > 0);

  return {
    plans,
    totalCount: Number(layer?.totalCount ?? layer?.TotalCount ?? plans.length),
  };
}

export async function getProfessorEducationPlanById(planId: number): Promise<ProfessorEducationPlan | null> {
  const raw = await apiRequest<unknown>(`${BASE}/GetById${buildQuery({ planId })}`);
  const row = unwrapDetail(raw);
  if (!row) return null;
  const id = Number(row.planId ?? row.PlanId ?? row.id ?? row.Id ?? planId);
  if (!id) return null;
  return mapPlanRow({ ...row, id });
}

export async function createProfessorEducationPlan(payload: CreateEducationPlanPayload): Promise<void> {
  await apiRequest(`${BASE}/Add-Plan`, { method: 'POST', body: payload });
}

export async function updateProfessorEducationPlan(
  planId: number,
  payload: Omit<CreateEducationPlanPayload, 'ownerUserId'>
): Promise<void> {
  await apiRequest(`${BASE}/Update-Plan`, { method: 'POST', body: { planId, ...payload } });
}

export async function deleteProfessorEducationPlan(planId: number): Promise<void> {
  await apiRequest(`${BASE}/Delete-Plan${buildQuery({ planId })}`, { method: 'POST' });
}

import type { TrainingPlan } from '@/lib/types';
import { PagedData } from '@/lib/responseTypes';
import apiClient from '@/lib/apiClient';
import { apiWriteDelete, apiWriteUpdate } from '@/lib/api-write';
import { getCommandMessages, isCommandResponseSuccess } from '@/lib/api-command-result';
import { apiIsoToLocalDate } from '@/lib/utils/localized-dates';

const BASE = '/EducationPlan';

function mapInstallment(item: Record<string, unknown>) {
  return {
    installmentId: Number(item.installmentId ?? item.InstallmentId ?? item.id ?? item.Id ?? 0),
    installmentNumber: Number(item.installmentNumber ?? item.InstallmentNumber ?? 0),
    dueDateUtc: String(item.dueDateUtc ?? item.DueDateUtc ?? ''),
    amountToman: Number(item.amountToman ?? item.AmountToman ?? 0),
    isPaid: Boolean(item.isPaid ?? item.IsPaid ?? false),
  };
}

function mapPlanRow(item: Record<string, unknown>): TrainingPlan {
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
    id: String(id),
    title: String(item.title ?? item.Title ?? ''),
    hourlyRate: Number(item.hourlyRate ?? item.HourlyRate ?? 0),
    totalHours,
    totalAmount: baseTotalCostToman > 0 ? baseTotalCostToman : totalCost,
    description: String(item.description ?? item.Description ?? ''),
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

function unwrapList(data: unknown): Record<string, unknown>[] {
  const raw = data as Record<string, unknown> | null | undefined;
  const layer = (raw?.data ?? raw) as Record<string, unknown> | undefined;
  const qr = layer?.queryResult ?? layer?.QueryResult;
  if (Array.isArray(qr)) return qr as Record<string, unknown>[];
  if (qr && typeof qr === 'object' && '$values' in (qr as object))
    return ((qr as { $values: unknown[] }).$values ?? []) as Record<string, unknown>[];
  return [];
}

export type EducationPlanInstallmentPayload = {
  installmentNumber: number;
  dueDateUtc: string;
  amountToman: number;
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
  installments?: EducationPlanInstallmentPayload[];
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
        ? startDate
        : new Date(startDate.getTime() + (span * installmentNumber) / count);
    return {
      installmentNumber,
      dueDate,
      amountToman: installmentNumber === count ? per + remainder : per,
      isPaid: false,
    };
  });
}

export function mapPlanInstallmentsToFormRows(
  installments: TrainingPlan['installments']
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

export const getTrainingPlans = async (
  searchTerm = '',
  pageNumber = 1,
  pageSize = 20,
  cacheBust = false
): Promise<PagedData<TrainingPlan>> => {
  try {
    const response = await apiClient.get<unknown>(`${BASE}/Plan-Search`, {
      params: {
        inputValue: searchTerm,
        pageNumber,
        pageSize,
        skipCount: (pageNumber - 1) * pageSize,
        needTotalCount: true,
        sortAscending: false,
        ...(cacheBust ? { _: Date.now() } : {}),
      },
    });
    const rows = unwrapList(response.data).map(mapPlanRow);
    const raw = response.data as Record<string, unknown>;
    const layer = (raw?.data ?? raw) as Record<string, unknown>;
    return {
      queryResult: { $values: rows },
      pageNumber,
      pageSize,
      totalCount: Number(layer?.totalCount ?? layer?.TotalCount ?? rows.length),
      skipCount: 0,
      needTotalCount: true,
      sortAscending: false,
      sortBy: '',
    };
  } catch {
    return {
      queryResult: { $values: [] },
      pageNumber: 1,
      pageSize,
      totalCount: 0,
      skipCount: 0,
      needTotalCount: true,
      sortAscending: false,
      sortBy: '',
    };
  }
};

export async function getTrainingPlanById(planId: number, cacheBust = false): Promise<TrainingPlan | null> {
  const res = await apiClient.get<unknown>(`${BASE}/GetById`, {
    params: cacheBust ? { planId, _: Date.now() } : { planId },
  });
  const raw = res.data as Record<string, unknown>;
  const layer = (raw?.data ?? raw) as Record<string, unknown>;
  let item: unknown = layer?.queryResult ?? layer;
  if (item && typeof item === 'object' && '$values' in (item as object)) {
    const values = (item as { $values: unknown[] }).$values;
    item = values?.[0];
  }
  if (!item || typeof item !== 'object') return null;
  const row = item as Record<string, unknown>;
  const planIdNum = Number(row.planId ?? row.PlanId ?? row.id ?? row.Id ?? planId);
  if (!planIdNum) return null;
  return mapPlanRow({ ...row, id: planIdNum });
}

export async function createTrainingPlan(payload: CreateEducationPlanPayload): Promise<void> {
  const res = await apiClient.post(`${BASE}/Add-Plan`, payload);
  if (!isCommandResponseSuccess(res.data, res.status)) {
    const msgs = getCommandMessages(res.data);
    throw new Error(msgs[0] || 'Failed to create plan');
  }
}

export async function updateTrainingPlan(
  planId: number,
  payload: Omit<CreateEducationPlanPayload, 'ownerUserId'>
): Promise<void> {
  const res = await apiWriteUpdate(`${BASE}/Update-Plan`, { planId, ...payload });
  if (!isCommandResponseSuccess(res.data, res.status)) {
    const msgs = getCommandMessages(res.data);
    throw new Error(msgs[0] || 'Failed to update plan');
  }
}

export async function deleteTrainingPlan(planId: number): Promise<void> {
  const res = await apiWriteDelete(`${BASE}/Delete-Plan`, { planId });
  if (!isCommandResponseSuccess(res.data, res.status)) {
    const msgs = getCommandMessages(res.data);
    throw new Error(msgs[0] || 'Failed to delete plan');
  }
}

import { apiRequest } from './client';
import { unwrapApiList } from '@/lib/api/normalize-list';
import { normalizeRoomEntryUrl } from '@/lib/room-entry-url';
import { appendRoomAutoLoginParams } from '@/lib/room-entry-url';

const BASE = 'EducationPlan';

export type EducationPlanInstallment = {
  installmentId: number;
  educationPlanId?: number;
  installmentNumber: number;
  dueDateUtc: string;
  amountToman: number;
  isPaid: boolean;
  paidAtUtc?: string;
  isOverdue: boolean;
};

export type MyEducationPlan = {
  planId: number;
  title: string;
  planTypeLabel: string;
  startDateUtc: string;
  endDateUtc: string;
  totalHours: number;
  usedMinutes: number;
  remainingMinutes: number;
  remainingHours: number;
  roomId: number;
  roomTitle?: string;
  roomSlug?: string;
  isActive: boolean;
  ownerUserId?: number;
  ownerFullName?: string;
  paymentType?: 'cash' | 'installment';
  baseTotalCostToman?: number;
  finalTotalCostToman?: number;
  paymentBlocked?: boolean;
  installments?: EducationPlanInstallment[];
};

export type EducationPlanDetail = {
  planId: number;
  title: string;
  description?: string;
  hourlyRate: number;
  totalHours: number;
  totalCost: number;
  startDateUtc: string;
  endDateUtc: string;
  usedMinutes: number;
  remainingMinutes: number;
  usedHours: number;
  remainingHours: number;
  roomTitle?: string;
  roomSlug?: string;
  studentFullName?: string;
  studentUserName?: string;
  ownerUserId?: number;
  ownerFullName?: string;
  paymentType?: 'cash' | 'installment';
  baseTotalCostToman?: number;
  finalTotalCostToman?: number;
  paymentBlocked?: boolean;
  installments?: EducationPlanInstallment[];
};

function mapInstallmentRow(row: Record<string, unknown>): EducationPlanInstallment {
  return {
    installmentId: Number(row.installmentId ?? row.InstallmentId ?? row.id ?? row.Id ?? 0),
    educationPlanId: Number(row.educationPlanId ?? row.EducationPlanId ?? 0) || undefined,
    installmentNumber: Number(row.installmentNumber ?? row.InstallmentNumber ?? 0),
    dueDateUtc: String(row.dueDateUtc ?? row.DueDateUtc ?? ''),
    amountToman: Number(row.amountToman ?? row.AmountToman ?? 0),
    isPaid: Boolean(row.isPaid ?? row.IsPaid ?? false),
    paidAtUtc: String(row.paidAtUtc ?? row.PaidAtUtc ?? '') || undefined,
    isOverdue: Boolean(row.isOverdue ?? row.IsOverdue ?? false),
  };
}

function mapPlanRow(row: Record<string, unknown>): MyEducationPlan {
  const totalHours = Number(row.totalHours ?? row.TotalHours ?? 0);
  const usedMinutes = Number(row.usedMinutes ?? row.UsedMinutes ?? 0);
  const remainingMinutes = Number(
    row.remainingMinutes ?? row.RemainingMinutes ?? Math.max(0, totalHours * 60 - usedMinutes)
  );
  return {
    planId: Number(row.planId ?? row.PlanId ?? row.id ?? row.Id ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    planTypeLabel: String(row.planTypeLabel ?? row.PlanTypeLabel ?? `${totalHours}h`),
    startDateUtc: String(row.startDateUtc ?? row.StartDateUtc ?? ''),
    endDateUtc: String(row.endDateUtc ?? row.EndDateUtc ?? ''),
    totalHours,
    usedMinutes,
    remainingMinutes,
    remainingHours: Number(row.remainingHours ?? row.RemainingHours ?? remainingMinutes / 60),
    roomId: Number(row.roomId ?? row.RoomId ?? 0),
    roomTitle: String(row.roomTitle ?? row.RoomTitle ?? '') || undefined,
    roomSlug: String(row.roomSlug ?? row.RoomSlug ?? '') || undefined,
    isActive: Boolean(row.isActive ?? row.IsActive ?? false),
    ownerUserId: Number(row.ownerUserId ?? row.OwnerUserId ?? 0) || undefined,
    ownerFullName: String(row.ownerFullName ?? row.OwnerFullName ?? '') || undefined,
    paymentType: (String(row.paymentType ?? row.PaymentType ?? 'cash').toLowerCase() === 'installment'
      ? 'installment'
      : 'cash') as 'cash' | 'installment',
    baseTotalCostToman: Number(row.baseTotalCostToman ?? row.BaseTotalCostToman ?? 0) || undefined,
    finalTotalCostToman: Number(row.finalTotalCostToman ?? row.FinalTotalCostToman ?? 0) || undefined,
    paymentBlocked: Boolean(row.paymentBlocked ?? row.PaymentBlocked ?? false),
    installments: Array.isArray(row.installments ?? row.Installments)
      ? (row.installments ?? row.Installments as unknown[]).map((item) =>
          mapInstallmentRow(item as Record<string, unknown>)
        )
      : [],
  };
}

function mapDetailRow(row: Record<string, unknown>): EducationPlanDetail {
  const totalHours = Number(row.totalHours ?? row.TotalHours ?? 0);
  const usedMinutes = Number(row.usedMinutes ?? row.UsedMinutes ?? 0);
  const remainingMinutes = Number(
    row.remainingMinutes ?? row.RemainingMinutes ?? Math.max(0, totalHours * 60 - usedMinutes)
  );
  return {
    planId: Number(row.planId ?? row.PlanId ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    description: String(row.description ?? row.Description ?? '') || undefined,
    hourlyRate: Number(row.hourlyRate ?? row.HourlyRate ?? 0),
    totalHours,
    totalCost: Number(row.totalCost ?? row.TotalCost ?? 0),
    startDateUtc: String(row.startDateUtc ?? row.StartDateUtc ?? ''),
    endDateUtc: String(row.endDateUtc ?? row.EndDateUtc ?? ''),
    usedMinutes,
    remainingMinutes,
    usedHours: Number(row.usedHours ?? row.UsedHours ?? usedMinutes / 60),
    remainingHours: Number(row.remainingHours ?? row.RemainingHours ?? remainingMinutes / 60),
    roomTitle: String(row.roomTitle ?? row.RoomTitle ?? '') || undefined,
    roomSlug: String(row.roomSlug ?? row.RoomSlug ?? '') || undefined,
    studentFullName: String(row.studentFullName ?? row.StudentFullName ?? '') || undefined,
    studentUserName: String(row.studentUserName ?? row.StudentUserName ?? '') || undefined,
    ownerUserId: Number(row.ownerUserId ?? row.OwnerUserId ?? 0) || undefined,
    ownerFullName: String(row.ownerFullName ?? row.OwnerFullName ?? '') || undefined,
    paymentType: (String(row.paymentType ?? row.PaymentType ?? 'cash').toLowerCase() === 'installment'
      ? 'installment'
      : 'cash') as 'cash' | 'installment',
    baseTotalCostToman: Number(row.baseTotalCostToman ?? row.BaseTotalCostToman ?? 0) || undefined,
    finalTotalCostToman: Number(row.finalTotalCostToman ?? row.FinalTotalCostToman ?? 0) || undefined,
    paymentBlocked: Boolean(row.paymentBlocked ?? row.PaymentBlocked ?? false),
    installments: Array.isArray(row.installments ?? row.Installments)
      ? (row.installments ?? row.Installments as unknown[]).map((item) =>
          mapInstallmentRow(item as Record<string, unknown>)
        )
      : [],
  };
}

export async function getMyEducationPlans(): Promise<MyEducationPlan[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyPlans`);
  return unwrapApiList<Record<string, unknown>>(raw)
    .map(mapPlanRow)
    .filter((p) => p.planId > 0);
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

export async function getMyEducationPlanById(planId: number): Promise<EducationPlanDetail | null> {
  try {
    const raw = await apiRequest<unknown>(`${BASE}/GetMyPlanById?planId=${planId}`);
    const row = unwrapDetail(raw);
    if (!row) return null;
    return mapDetailRow(row);
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) {
      const status = (e as { status: number }).status;
      if (status === 204 || status === 404) return null;
    }
    throw e;
  }
}

export type EnterEducationPlanRoomResponse = {
  roomLink?: string | null;
  token?: string;
  userId?: string;
  userName?: string;
  displayName?: string;
  avatarUrl?: string | null;
  email?: string;
  role?: string;
};

export async function enterEducationPlanRoom(planId: number): Promise<EnterEducationPlanRoomResponse> {
  const raw = await apiRequest<Record<string, unknown>>(`${BASE}/EnterRoom`, {
    method: 'POST',
    body: { planId },
  });
  const roomLink = raw.roomLink ?? raw.RoomLink;
  const token = raw.token ?? raw.Token;
  return {
    roomLink: roomLink ? normalizeRoomEntryUrl(String(roomLink)) : undefined,
    token: token ? String(token) : undefined,
    userId: String(raw.userId ?? raw.UserId ?? ''),
    userName: String(raw.userName ?? raw.UserName ?? ''),
    displayName: String(raw.displayName ?? raw.DisplayName ?? ''),
    avatarUrl: raw.avatarUrl != null ? String(raw.avatarUrl) : raw.AvatarUrl != null ? String(raw.AvatarUrl) : null,
    email: String(raw.email ?? raw.Email ?? ''),
    role: String(raw.role ?? raw.Role ?? 'student'),
  };
}

export function openEducationPlanRoom(
  response: EnterEducationPlanRoomResponse
): void {
  const roomLink = response.roomLink;
  if (!roomLink) return;
  const url =
    response.token && response.userId
      ? appendRoomAutoLoginParams(roomLink, {
          token: response.token,
          userId: response.userId,
          userName: response.userName,
          displayName: response.displayName ?? response.userName,
          avatarUrl: response.avatarUrl ?? undefined,
          email: response.email,
        })
      : roomLink;
  window.open(url, '_blank', 'noopener,noreferrer');
}

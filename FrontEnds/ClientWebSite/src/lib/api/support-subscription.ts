import { apiRequest } from './client';
import { requestSupportPlanPayment, redirectToPaymentGateway } from './payments';

export type SupportPlanFeature = {
  featureCode: string;
  titleFa: string;
  descriptionFa: string;
  isOffered: boolean;
  addonPriceToman: number;
  sortOrder: number;
};

export type SupportPlanTariff = {
  id: number;
  durationMonths: number;
  priceToman: number;
  isActive: boolean;
  features: SupportPlanFeature[];
};

export type StudentSupportStatus = {
  hasActiveAccess: boolean;
  isFrozen: boolean;
  accessEndsAtUtc?: string | null;
  remainingDays: number;
  freezeCountUsed: number;
  freezeCountRemaining: number;
  frozenUntilUtc?: string | null;
  activeFreezeReason?: string | null;
  freezeHistory: Array<{
    startedAtUtc: string;
    endsAtUtc: string;
    durationDays: number;
    reason: string;
  }>;
  plans: SupportPlanTariff[];
  activeFeatureCodes: string[];
};

function unwrap<T>(raw: unknown): T {
  const root = raw as Record<string, unknown>;
  const data = (root?.data ?? root?.Data ?? root) as Record<string, unknown>;
  return (data?.queryResult ?? data?.QueryResult ?? data) as T;
}

function mapFeature(raw: Record<string, unknown>): SupportPlanFeature {
  return {
    featureCode: String(raw.featureCode ?? raw.FeatureCode ?? ''),
    titleFa: String(raw.titleFa ?? raw.TitleFa ?? ''),
    descriptionFa: String(raw.descriptionFa ?? raw.DescriptionFa ?? ''),
    isOffered: Boolean(raw.isOffered ?? raw.IsOffered ?? true),
    addonPriceToman: Number(raw.addonPriceToman ?? raw.AddonPriceToman ?? 0),
    sortOrder: Number(raw.sortOrder ?? raw.SortOrder ?? 0),
  };
}

function mapStudentSupportStatus(raw: unknown): StudentSupportStatus {
  const row = unwrap<Record<string, unknown>>(raw);
  const freezeHistoryRaw = (row.freezeHistory ?? row.FreezeHistory ?? []) as unknown[];
  const plansRaw = (row.plans ?? row.Plans ?? []) as unknown[];
  const activeFeaturesRaw = (row.activeFeatureCodes ?? row.ActiveFeatureCodes ?? []) as unknown[];

  return {
    hasActiveAccess: Boolean(row.hasActiveAccess ?? row.HasActiveAccess),
    isFrozen: Boolean(row.isFrozen ?? row.IsFrozen),
    accessEndsAtUtc: (row.accessEndsAtUtc ?? row.AccessEndsAtUtc ?? null) as string | null,
    remainingDays: Number(row.remainingDays ?? row.RemainingDays ?? 0),
    freezeCountUsed: Number(row.freezeCountUsed ?? row.FreezeCountUsed ?? 0),
    freezeCountRemaining: Number(row.freezeCountRemaining ?? row.FreezeCountRemaining ?? 0),
    frozenUntilUtc: (row.frozenUntilUtc ?? row.FrozenUntilUtc ?? null) as string | null,
    activeFreezeReason: (row.activeFreezeReason ?? row.ActiveFreezeReason ?? null) as string | null,
    freezeHistory: freezeHistoryRaw.map((item) => {
      const entry = item as Record<string, unknown>;
      return {
        startedAtUtc: String(entry.startedAtUtc ?? entry.StartedAtUtc ?? ''),
        endsAtUtc: String(entry.endsAtUtc ?? entry.EndsAtUtc ?? ''),
        durationDays: Number(entry.durationDays ?? entry.DurationDays ?? 0),
        reason: String(entry.reason ?? entry.Reason ?? ''),
      };
    }),
    plans: plansRaw.map((item) => {
      const plan = item as Record<string, unknown>;
      const featuresRaw = (plan.features ?? plan.Features ?? []) as unknown[];
      return {
        id: Number(plan.id ?? plan.Id ?? 0),
        durationMonths: Number(plan.durationMonths ?? plan.DurationMonths ?? 0),
        priceToman: Number(plan.priceToman ?? plan.PriceToman ?? 0),
        isActive: Boolean(plan.isActive ?? plan.IsActive),
        features: featuresRaw
          .map((f) => mapFeature(f as Record<string, unknown>))
          .filter((f) => f.isOffered)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      };
    }),
    activeFeatureCodes: activeFeaturesRaw.map((x) => String(x)),
  };
}

export async function fetchMySupportSubscriptionStatus(): Promise<StudentSupportStatus> {
  const res = await apiRequest<unknown>('SupportSubscription/GetMyStatus');
  return mapStudentSupportStatus(res);
}

export async function requestSupportFreeze(payload: {
  freezeDays: number;
  reason: string;
}): Promise<void> {
  await apiRequest('SupportSubscription/RequestFreeze', {
    method: 'POST',
    body: payload,
  });
}

export async function grantStudentSupportMonths(payload: {
  studentUserId: string;
  months: number;
}): Promise<void> {
  await apiRequest('SupportSubscription/GrantMonths', {
    method: 'POST',
    body: {
      studentUserId: payload.studentUserId,
      months: payload.months,
    },
  });
}

export async function purchaseSupportPlan(
  tariffId: number,
  featureCodes: string[] = []
): Promise<void> {
  const start = await requestSupportPlanPayment(tariffId, featureCodes);
  redirectToPaymentGateway(start.paymentUrl);
}

export function calculatePlanTotal(plan: SupportPlanTariff, selectedFeatureCodes: string[]): number {
  const selected = new Set(selectedFeatureCodes);
  const addons = plan.features
    .filter((f) => f.isOffered && selected.has(f.featureCode))
    .reduce((sum, f) => sum + (f.addonPriceToman || 0), 0);
  return plan.priceToman + addons;
}

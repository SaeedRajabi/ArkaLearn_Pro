import { apiRequest } from './client';

const TEACHER_BASE = 'Teacher';
const PAYMENT_BASE = 'Payment';

export type AdvertisementTariff = {
  id: number;
  durationMonths: number;
  starLevel: number;
  priceToman: number;
  discountPercent: number;
  isActive: boolean;
};

export type MyAdvertisementPlan = {
  planType: string;
  hasPaidFeatures: boolean;
  experiencePoints: number;
  xpNextFreeMonthThreshold: number;
  xpFreeMonthsRedeemed: number;
  hasActiveSubscription: boolean;
  subscriptionStartedAtUtc?: string | null;
  subscriptionDurationMonths: number;
  subscriptionExpiresAtUtc?: string | null;
  xpFreePlanUntilUtc?: string | null;
  activeStarLevel: number;
  contactUnlockPriceToman: number;
  oneTimeBumpPriceToman: number;
  hasActiveAutoBump: boolean;
  autoBumpIncludedWithSubscription: boolean;
  autoBumpIntervalMinutes: number;
  autoBumpStartedAtUtc?: string | null;
  autoBumpExpiresAtUtc?: string | null;
  lastAutoBumpAtUtc?: string | null;
  nextAutoBumpAtUtc?: string | null;
  remainingAutoBumps: number;
  manualBumpCooldownMinutes: number;
  lastManualBumpAtUtc?: string | null;
  canManualBumpNow: boolean;
  nextManualBumpAtUtc?: string | null;
  freeMinTags: number;
  freeMaxTags: number;
  freeMaxWorkExperienceChars: number;
  freeMaxVideos: number;
  freeMaxBooks: number;
  freeMaxArticles: number;
  freeMaxDescriptionChars: number;
};

export type AutoBumpPackage = {
  id: number;
  name: string;
  durationDays: number;
  priceToman: number;
  isActive: boolean;
};

export type MyTeacherXpSummary = {
  experiencePoints: number;
  xpNextFreeMonthThreshold: number;
  xpFreeMonthsRedeemed: number;
  xpFreePlanUntilUtc?: string | null;
  canRedeemFreeMonth: boolean;
  rewards: {
    saveAdvertisement: number;
    saveVideo: number;
    saveBook: number;
    publishCourse: number;
    publishArticle: number;
    portfolioArticle: number;
  };
  recentEvents: Array<{
    id: number;
    amount: number;
    reason: string;
    description?: string | null;
    balanceAfter: number;
    occurredAtUtc: string;
  }>;
};

export type ContactUnlockStatus = {
  isUnlocked: boolean;
  contactVisibleWithoutPayment: boolean;
  expiresAtUtc?: string | null;
  unlockPriceToman: number;
};

export type ManualBumpCaptcha = {
  captchaId: string;
  displayCode: string;
};

export type ManualBumpResult = {
  bumpedAtUtc: string;
  nextManualBumpAtUtc?: string | null;
  manualBumpCooldownMinutes: number;
};

function unwrapRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root.queryResult ?? root.QueryResult ?? root;
  if (layer && typeof layer === 'object' && !Array.isArray(layer)) return layer as Record<string, unknown>;
  return root;
}

function normalizeTariff(raw: Record<string, unknown>): AdvertisementTariff {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    durationMonths: Number(raw.durationMonths ?? raw.DurationMonths ?? 0),
    starLevel: Number(raw.starLevel ?? raw.StarLevel ?? 0),
    priceToman: Number(raw.priceToman ?? raw.PriceToman ?? 0),
    discountPercent: Number(raw.discountPercent ?? raw.DiscountPercent ?? 0),
    isActive: Boolean(raw.isActive ?? raw.IsActive ?? true),
  };
}

function normalizePlan(raw: Record<string, unknown>): MyAdvertisementPlan {
  return {
    planType: String(raw.planType ?? raw.PlanType ?? 'free'),
    hasPaidFeatures: Boolean(raw.hasPaidFeatures ?? raw.HasPaidFeatures),
    experiencePoints: Number(raw.experiencePoints ?? raw.ExperiencePoints ?? 0),
    xpNextFreeMonthThreshold: Number(raw.xpNextFreeMonthThreshold ?? raw.XpNextFreeMonthThreshold ?? 0),
    xpFreeMonthsRedeemed: Number(raw.xpFreeMonthsRedeemed ?? raw.XpFreeMonthsRedeemed ?? 0),
    hasActiveSubscription: Boolean(raw.hasActiveSubscription ?? raw.HasActiveSubscription),
    subscriptionStartedAtUtc:
      String(raw.subscriptionStartedAtUtc ?? raw.SubscriptionStartedAtUtc ?? '') || undefined,
    subscriptionDurationMonths: Number(raw.subscriptionDurationMonths ?? raw.SubscriptionDurationMonths ?? 0),
    subscriptionExpiresAtUtc: String(raw.subscriptionExpiresAtUtc ?? raw.SubscriptionExpiresAtUtc ?? '') || undefined,
    xpFreePlanUntilUtc: String(raw.xpFreePlanUntilUtc ?? raw.XpFreePlanUntilUtc ?? '') || undefined,
    activeStarLevel: Number(raw.activeStarLevel ?? raw.ActiveStarLevel ?? 0),
    contactUnlockPriceToman: Number(raw.contactUnlockPriceToman ?? raw.ContactUnlockPriceToman ?? 20000),
    oneTimeBumpPriceToman: Number(raw.oneTimeBumpPriceToman ?? raw.OneTimeBumpPriceToman ?? 50000),
    hasActiveAutoBump: Boolean(raw.hasActiveAutoBump ?? raw.HasActiveAutoBump),
    autoBumpIncludedWithSubscription: Boolean(
      raw.autoBumpIncludedWithSubscription ?? raw.AutoBumpIncludedWithSubscription
    ),
    autoBumpIntervalMinutes: Number(raw.autoBumpIntervalMinutes ?? raw.AutoBumpIntervalMinutes ?? 60),
    autoBumpStartedAtUtc: String(raw.autoBumpStartedAtUtc ?? raw.AutoBumpStartedAtUtc ?? '') || undefined,
    autoBumpExpiresAtUtc: String(raw.autoBumpExpiresAtUtc ?? raw.AutoBumpExpiresAtUtc ?? '') || undefined,
    lastAutoBumpAtUtc: String(raw.lastAutoBumpAtUtc ?? raw.LastAutoBumpAtUtc ?? '') || undefined,
    nextAutoBumpAtUtc: String(raw.nextAutoBumpAtUtc ?? raw.NextAutoBumpAtUtc ?? '') || undefined,
    remainingAutoBumps: Number(raw.remainingAutoBumps ?? raw.RemainingAutoBumps ?? 0),
    manualBumpCooldownMinutes: Number(raw.manualBumpCooldownMinutes ?? raw.ManualBumpCooldownMinutes ?? 25),
    lastManualBumpAtUtc: String(raw.lastManualBumpAtUtc ?? raw.LastManualBumpAtUtc ?? '') || undefined,
    canManualBumpNow: Boolean(raw.canManualBumpNow ?? raw.CanManualBumpNow),
    nextManualBumpAtUtc: String(raw.nextManualBumpAtUtc ?? raw.NextManualBumpAtUtc ?? '') || undefined,
    freeMinTags: Number(raw.freeMinTags ?? raw.FreeMinTags ?? 3),
    freeMaxTags: Number(raw.freeMaxTags ?? raw.FreeMaxTags ?? 3),
    freeMaxWorkExperienceChars: Number(
      raw.freeMaxWorkExperienceChars ??
        raw.FreeMaxWorkExperienceChars ??
        raw.freeMaxWorkExperienceWords ??
        raw.FreeMaxWorkExperienceWords ??
        1000
    ),
    freeMaxVideos: Number(raw.freeMaxVideos ?? raw.FreeMaxVideos ?? 1),
    freeMaxBooks: Number(raw.freeMaxBooks ?? raw.FreeMaxBooks ?? 1),
    freeMaxArticles: Number(raw.freeMaxArticles ?? raw.FreeMaxArticles ?? 1),
    freeMaxDescriptionChars: Number(raw.freeMaxDescriptionChars ?? raw.FreeMaxDescriptionChars ?? 2000),
  };
}

function normalizeUnlock(raw: Record<string, unknown>): ContactUnlockStatus {
  return {
    isUnlocked: Boolean(raw.isUnlocked ?? raw.IsUnlocked),
    contactVisibleWithoutPayment: Boolean(raw.contactVisibleWithoutPayment ?? raw.ContactVisibleWithoutPayment),
    expiresAtUtc: String(raw.expiresAtUtc ?? raw.ExpiresAtUtc ?? '') || undefined,
    unlockPriceToman: Number(raw.unlockPriceToman ?? raw.UnlockPriceToman ?? 20000),
  };
}

export async function getAdvertisementTariffs(): Promise<AdvertisementTariff[]> {
  const raw = await apiRequest<unknown>(`${TEACHER_BASE}/GetAdvertisementTariffs`);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.queryResult)
      ? (raw as Record<string, unknown>).queryResult
      : Array.isArray((raw as Record<string, unknown>)?.QueryResult)
        ? (raw as Record<string, unknown>).QueryResult
        : [];
  return (list as Record<string, unknown>[]).map(normalizeTariff);
}

export async function getMyAdvertisementPlan(): Promise<MyAdvertisementPlan | null> {
  const raw = await apiRequest<unknown>(`${TEACHER_BASE}/GetMyAdvertisementPlan`);
  const record = unwrapRecord(raw);
  return record ? normalizePlan(record) : null;
}

export async function getMyTeacherXpSummary(): Promise<MyTeacherXpSummary | null> {
  const raw = await apiRequest<unknown>(`${TEACHER_BASE}/GetMyTeacherXpSummary`);
  const record = unwrapRecord(raw);
  if (!record) return null;
  const rewardsRaw = (record.rewards ?? record.Rewards ?? {}) as Record<string, unknown>;
  const eventsRaw = record.recentEvents ?? record.RecentEvents ?? [];
  const events = Array.isArray(eventsRaw) ? eventsRaw : [];
  return {
    experiencePoints: Number(record.experiencePoints ?? record.ExperiencePoints ?? 0),
    xpNextFreeMonthThreshold: Number(record.xpNextFreeMonthThreshold ?? record.XpNextFreeMonthThreshold ?? 0),
    xpFreeMonthsRedeemed: Number(record.xpFreeMonthsRedeemed ?? record.XpFreeMonthsRedeemed ?? 0),
    xpFreePlanUntilUtc: String(record.xpFreePlanUntilUtc ?? record.XpFreePlanUntilUtc ?? '') || undefined,
    canRedeemFreeMonth: Boolean(record.canRedeemFreeMonth ?? record.CanRedeemFreeMonth),
    rewards: {
      saveAdvertisement: Number(rewardsRaw.saveAdvertisement ?? rewardsRaw.SaveAdvertisement ?? 0),
      saveVideo: Number(rewardsRaw.saveVideo ?? rewardsRaw.SaveVideo ?? 0),
      saveBook: Number(rewardsRaw.saveBook ?? rewardsRaw.SaveBook ?? 0),
      publishCourse: Number(rewardsRaw.publishCourse ?? rewardsRaw.PublishCourse ?? 0),
      publishArticle: Number(rewardsRaw.publishArticle ?? rewardsRaw.PublishArticle ?? 0),
      portfolioArticle: Number(rewardsRaw.portfolioArticle ?? rewardsRaw.PortfolioArticle ?? 0),
    },
    recentEvents: events.map((item) => {
      const e = item as Record<string, unknown>;
      return {
        id: Number(e.id ?? e.Id ?? 0),
        amount: Number(e.amount ?? e.Amount ?? 0),
        reason: String(e.reason ?? e.Reason ?? ''),
        description: (e.description ?? e.Description ?? null) as string | null,
        balanceAfter: Number(e.balanceAfter ?? e.BalanceAfter ?? 0),
        occurredAtUtc: String(e.occurredAtUtc ?? e.OccurredAtUtc ?? ''),
      };
    }),
  };
}

export async function redeemXpFreeMonth(): Promise<void> {
  await apiRequest(`${TEACHER_BASE}/RedeemXpFreeMonth`, { method: 'POST', body: {} });
}

export async function getManualBumpCaptcha(): Promise<ManualBumpCaptcha> {
  const raw = await apiRequest<unknown>(`${TEACHER_BASE}/GetManualBumpCaptcha`);
  const record = unwrapRecord(raw) ?? {};
  return {
    captchaId: String(record.captchaId ?? record.CaptchaId ?? ''),
    displayCode: String(record.displayCode ?? record.DisplayCode ?? ''),
  };
}

export async function manualBumpAdvertisement(captchaId: string, captchaCode: string): Promise<ManualBumpResult> {
  const raw = await apiRequest<unknown>(`${TEACHER_BASE}/ManualBumpAdvertisement`, {
    method: 'POST',
    body: { captchaId, captchaCode },
  });
  const record = unwrapRecord(raw) ?? {};
  return {
    bumpedAtUtc: String(record.bumpedAtUtc ?? record.BumpedAtUtc ?? ''),
    nextManualBumpAtUtc: String(record.nextManualBumpAtUtc ?? record.NextManualBumpAtUtc ?? '') || undefined,
    manualBumpCooldownMinutes: Number(record.manualBumpCooldownMinutes ?? record.ManualBumpCooldownMinutes ?? 25),
  };
}

export async function hasAdvertisementContactUnlock(teacherId: number): Promise<ContactUnlockStatus | null> {
  const raw = await apiRequest<unknown>(`${TEACHER_BASE}/HasAdvertisementContactUnlock?teacherId=${teacherId}`);
  const record = unwrapRecord(raw);
  return record ? normalizeUnlock(record) : null;
}

export async function getAdvertisementAutoBumpPackages(): Promise<AutoBumpPackage[]> {
  const raw = await apiRequest<unknown>(`${TEACHER_BASE}/GetAdvertisementAutoBumpPackages`);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.queryResult)
      ? (raw as Record<string, unknown>).queryResult
      : Array.isArray((raw as Record<string, unknown>)?.QueryResult)
        ? (raw as Record<string, unknown>).QueryResult
        : [];
  return (list as Record<string, unknown>[]).map((item) => ({
    id: Number(item.id ?? item.Id ?? 0),
    name: String(item.name ?? item.Name ?? ''),
    durationDays: Number(item.durationDays ?? item.DurationDays ?? 0),
    priceToman: Number(item.priceToman ?? item.PriceToman ?? 0),
    isActive: Boolean(item.isActive ?? item.IsActive ?? true),
  }));
}

export async function requestAdSubscriptionPayment(tariffId: number): Promise<{ paymentUrl: string }> {
  const raw = await apiRequest<Record<string, unknown>>(`${PAYMENT_BASE}/RequestAdSubscriptionPayment`, {
    method: 'POST',
    body: { tariffId },
  });
  return { paymentUrl: String(raw.paymentUrl ?? raw.PaymentUrl ?? '') };
}

export async function requestAdContactUnlockPayment(teacherId: number): Promise<{ paymentUrl: string }> {
  const raw = await apiRequest<Record<string, unknown>>(`${PAYMENT_BASE}/RequestAdContactUnlockPayment`, {
    method: 'POST',
    body: { teacherId },
  });
  return { paymentUrl: String(raw.paymentUrl ?? raw.PaymentUrl ?? '') };
}

export { requestAdOneTimeBumpPayment, requestAdAutoBumpPackagePayment } from './payments';

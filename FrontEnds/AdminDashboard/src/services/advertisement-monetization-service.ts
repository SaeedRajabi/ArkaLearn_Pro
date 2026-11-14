import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';

export type MonetizationSettings = {
  contactUnlockPriceToman: number;
  contactUnlockHours: number;
  freeMinTags: number;
  freeMaxTags: number;
  freeMaxWorkExperienceChars: number;
  freeMaxVideos: number;
  freeMaxBooks: number;
  freeMaxArticles: number;
  freeMaxDescriptionChars: number;
  xpFirstFreeMonthThreshold: number;
  xpThresholdIncrementPerMonth: number;
  xpRewardSaveAdvertisement: number;
  xpRewardSaveVideo: number;
  xpRewardSaveBook: number;
  autoBumpIntervalMinutes: number;
  oneTimeBumpPriceToman: number;
  subscriptionIncludesAutoBump: boolean;
  xpRewardPublishCourse: number;
  xpRewardPublishArticle: number;
  xpRewardPortfolioArticle: number;
};

export type TariffRow = {
  id: string;
  durationMonths: number;
  starLevel: number;
  priceToman: number;
  discountPercent: number;
  isActive: boolean;
};

export type AutoBumpPackageRow = {
  id: string;
  name: string;
  durationDays: number;
  priceToman: number;
  isActive: boolean;
};

export type MonetizationAdminData = {
  settings: MonetizationSettings;
  tariffs: TariffRow[];
  autoBumpPackages: AutoBumpPackageRow[];
};

function num(raw: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null) return Number(value);
  }
  return 0;
}

function idString(raw: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text.length > 0) return text;
  }
  return '0';
}

function serializeEntityId(id: string): string | number {
  const trimmed = id.trim();
  if (!trimmed || trimmed === '0') return 0;
  const asNumber = Number(trimmed);
  if (Number.isSafeInteger(asNumber)) return asNumber;
  return trimmed;
}

function bool(raw: Record<string, unknown>, camel: string, pascal: string) {
  return Boolean(raw[camel] ?? raw[pascal]);
}

function normalizeSettings(raw: Record<string, unknown>): MonetizationSettings {
  return {
    contactUnlockPriceToman: num(raw, 'contactUnlockPriceToman', 'ContactUnlockPriceToman'),
    contactUnlockHours: num(raw, 'contactUnlockHours', 'ContactUnlockHours'),
    freeMinTags: num(raw, 'freeMinTags', 'FreeMinTags'),
    freeMaxTags: num(raw, 'freeMaxTags', 'FreeMaxTags'),
    freeMaxWorkExperienceChars: num(raw, 'freeMaxWorkExperienceChars', 'FreeMaxWorkExperienceChars', 'freeMaxWorkExperienceWords', 'FreeMaxWorkExperienceWords'),
    freeMaxVideos: num(raw, 'freeMaxVideos', 'FreeMaxVideos'),
    freeMaxBooks: num(raw, 'freeMaxBooks', 'FreeMaxBooks'),
    freeMaxArticles: num(raw, 'freeMaxArticles', 'FreeMaxArticles'),
    freeMaxDescriptionChars: num(raw, 'freeMaxDescriptionChars', 'FreeMaxDescriptionChars'),
    xpFirstFreeMonthThreshold: num(raw, 'xpFirstFreeMonthThreshold', 'XpFirstFreeMonthThreshold'),
    xpThresholdIncrementPerMonth: num(raw, 'xpThresholdIncrementPerMonth', 'XpThresholdIncrementPerMonth'),
    xpRewardSaveAdvertisement: num(raw, 'xpRewardSaveAdvertisement', 'XpRewardSaveAdvertisement'),
    xpRewardSaveVideo: num(raw, 'xpRewardSaveVideo', 'XpRewardSaveVideo'),
    xpRewardSaveBook: num(raw, 'xpRewardSaveBook', 'XpRewardSaveBook'),
    autoBumpIntervalMinutes: num(raw, 'autoBumpIntervalMinutes', 'AutoBumpIntervalMinutes'),
    oneTimeBumpPriceToman: num(raw, 'oneTimeBumpPriceToman', 'OneTimeBumpPriceToman'),
    subscriptionIncludesAutoBump: bool(raw, 'subscriptionIncludesAutoBump', 'SubscriptionIncludesAutoBump'),
    xpRewardPublishCourse: num(raw, 'xpRewardPublishCourse', 'XpRewardPublishCourse'),
    xpRewardPublishArticle: num(raw, 'xpRewardPublishArticle', 'XpRewardPublishArticle'),
    xpRewardPortfolioArticle: num(raw, 'xpRewardPortfolioArticle', 'XpRewardPortfolioArticle'),
  };
}

function normalizeTariff(raw: Record<string, unknown>): TariffRow {
  return {
    id: idString(raw, 'id', 'Id'),
    durationMonths: num(raw, 'durationMonths', 'DurationMonths'),
    starLevel: num(raw, 'starLevel', 'StarLevel'),
    priceToman: num(raw, 'priceToman', 'PriceToman'),
    discountPercent: num(raw, 'discountPercent', 'DiscountPercent'),
    isActive: bool(raw, 'isActive', 'IsActive'),
  };
}

function normalizeBumpPackage(raw: Record<string, unknown>): AutoBumpPackageRow {
  return {
    id: idString(raw, 'id', 'Id'),
    name: String(raw.name ?? raw.Name ?? ''),
    durationDays: num(raw, 'durationDays', 'DurationDays'),
    priceToman: num(raw, 'priceToman', 'PriceToman'),
    isActive: bool(raw, 'isActive', 'IsActive'),
  };
}

function extractArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { $values?: unknown[] }).$values)) {
    return (raw as { $values: Record<string, unknown>[] }).$values;
  }
  return [];
}

function unwrapApiPayload(payload: unknown): Record<string, unknown> {
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  let cur = payload as Record<string, unknown>;
  for (let depth = 0; depth < 6; depth++) {
    const next =
      (cur.data && typeof cur.data === 'object' && !Array.isArray(cur.data)
        ? (cur.data as Record<string, unknown>)
        : null) ??
      (cur.Data && typeof cur.Data === 'object' && !Array.isArray(cur.Data)
        ? (cur.Data as Record<string, unknown>)
        : null) ??
      (cur.queryResult && typeof cur.queryResult === 'object' && !Array.isArray(cur.queryResult)
        ? (cur.queryResult as Record<string, unknown>)
        : null) ??
      (cur.QueryResult && typeof cur.QueryResult === 'object' && !Array.isArray(cur.QueryResult)
        ? (cur.QueryResult as Record<string, unknown>)
        : null);

    if (!next || next === cur) break;
    cur = next;
  }

  return cur;
}

function unwrapAdmin(raw: unknown): MonetizationAdminData {
  const layer = unwrapApiPayload(raw);
  const settingsRaw = (layer.settings ?? layer.Settings ?? {}) as Record<string, unknown>;
  const tariffs = extractArray(layer.tariffs ?? layer.Tariffs).map((t) => normalizeTariff(t));
  const autoBumpPackages = extractArray(layer.autoBumpPackages ?? layer.AutoBumpPackages).map((p) =>
    normalizeBumpPackage(p)
  );
  return { settings: normalizeSettings(settingsRaw), tariffs, autoBumpPackages };
}

export async function getAdvertisementMonetizationAdmin(): Promise<MonetizationAdminData> {
  const { data } = await apiClient.get('/Teacher/GetAdvertisementMonetizationAdmin');
  return unwrapAdmin(data);
}

export async function saveAdvertisementMonetizationSettings(payload: {
  settings: MonetizationSettings;
  tariffs: Array<{ id: string; priceToman: number; discountPercent: number; isActive: boolean }>;
  autoBumpPackages: Array<{ id: string; name: string; durationDays: number; priceToman: number; isActive: boolean }>;
}): Promise<void> {
  await apiWriteUpdate('/Teacher/SaveAdvertisementMonetizationSettings', {
    contactUnlockPriceToman: payload.settings.contactUnlockPriceToman,
    contactUnlockHours: payload.settings.contactUnlockHours,
    freeMinTags: payload.settings.freeMinTags,
    freeMaxTags: payload.settings.freeMaxTags,
    freeMaxWorkExperienceChars: payload.settings.freeMaxWorkExperienceChars,
    freeMaxVideos: payload.settings.freeMaxVideos,
    freeMaxBooks: payload.settings.freeMaxBooks,
    freeMaxArticles: payload.settings.freeMaxArticles,
    freeMaxDescriptionChars: payload.settings.freeMaxDescriptionChars,
    xpFirstFreeMonthThreshold: payload.settings.xpFirstFreeMonthThreshold,
    xpThresholdIncrementPerMonth: payload.settings.xpThresholdIncrementPerMonth,
    xpRewardSaveAdvertisement: payload.settings.xpRewardSaveAdvertisement,
    xpRewardSaveVideo: payload.settings.xpRewardSaveVideo,
    xpRewardSaveBook: payload.settings.xpRewardSaveBook,
    autoBumpIntervalMinutes: payload.settings.autoBumpIntervalMinutes,
    oneTimeBumpPriceToman: payload.settings.oneTimeBumpPriceToman,
    subscriptionIncludesAutoBump: payload.settings.subscriptionIncludesAutoBump,
    xpRewardPublishCourse: payload.settings.xpRewardPublishCourse,
    xpRewardPublishArticle: payload.settings.xpRewardPublishArticle,
    xpRewardPortfolioArticle: payload.settings.xpRewardPortfolioArticle,
    tariffs: payload.tariffs.map((t) => ({
      id: serializeEntityId(t.id),
      priceToman: t.priceToman,
      discountPercent: t.discountPercent,
      isActive: t.isActive,
    })),
    autoBumpPackages: payload.autoBumpPackages.map((p) => ({
      id: serializeEntityId(p.id),
      name: p.name,
      durationDays: p.durationDays,
      priceToman: p.priceToman,
      isActive: p.isActive,
    })),
  });
}

export function extractApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;
  if (!data) return undefined;
  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return undefined;
  const record = data as Record<string, unknown>;
  const messages = record.messages ?? record.Messages ?? record.errorMessages ?? record.ErrorMessages;
  if (Array.isArray(messages) && messages.length > 0) return String(messages[0]);
  const message = record.message ?? record.Message ?? record.title ?? record.Title;
  if (typeof message === 'string' && message.trim().length > 0) return message;
  return undefined;
}

export type AdvertisementRevenueReport = {
  totalToman: number;
  subscriptionToman: number;
  contactUnlockToman: number;
  oneTimeBumpToman: number;
  autoBumpPackageToman: number;
  items: AdvertisementRevenueItem[];
};

export type AdvertisementRevenueItem = {
  id: number;
  revenueType: string;
  teacherId: number;
  payerUserId: number;
  amountToman: number;
  paymentReference?: string | null;
  description?: string | null;
  occurredAtUtc: string;
};

function unwrapRevenue(raw: unknown): AdvertisementRevenueReport {
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const layer = (root.data ?? root.Data ?? root.queryResult ?? root.QueryResult ?? root) as Record<string, unknown>;
  const itemsRaw = layer.items ?? layer.Items ?? [];
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map((item) => {
        const o = item as Record<string, unknown>;
        return {
          id: num(o, 'id', 'Id'),
          revenueType: String(o.revenueType ?? o.RevenueType ?? ''),
          teacherId: num(o, 'teacherId', 'TeacherId'),
          payerUserId: num(o, 'payerUserId', 'PayerUserId'),
          amountToman: num(o, 'amountToman', 'AmountToman'),
          paymentReference: (o.paymentReference ?? o.PaymentReference ?? null) as string | null,
          description: (o.description ?? o.Description ?? null) as string | null,
          occurredAtUtc: String(o.occurredAtUtc ?? o.OccurredAtUtc ?? ''),
        };
      })
    : [];
  return {
    totalToman: num(layer, 'totalToman', 'TotalToman'),
    subscriptionToman: num(layer, 'subscriptionToman', 'SubscriptionToman'),
    contactUnlockToman: num(layer, 'contactUnlockToman', 'ContactUnlockToman'),
    oneTimeBumpToman: num(layer, 'oneTimeBumpToman', 'OneTimeBumpToman'),
    autoBumpPackageToman: num(layer, 'autoBumpPackageToman', 'AutoBumpPackageToman'),
    items,
  };
}

export async function getAdvertisementMonetizationRevenue(fromUtc?: string, toUtc?: string): Promise<AdvertisementRevenueReport> {
  const params = new URLSearchParams();
  if (fromUtc) params.set('FromUtc', fromUtc);
  if (toUtc) params.set('ToUtc', toUtc);
  const qs = params.toString();
  const { data } = await apiClient.get(`/Teacher/GetAdvertisementMonetizationRevenue${qs ? `?${qs}` : ''}`);
  return unwrapRevenue(data);
}

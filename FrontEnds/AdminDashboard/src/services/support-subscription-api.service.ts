import apiClient from '@/lib/apiClient';

export type SupportPlanFeatureRow = {
  featureCode: string;
  titleFa: string;
  descriptionFa: string;
  isOffered: boolean;
  addonPriceToman: number;
  sortOrder: number;
};

export type SupportPlanTariffRow = {
  id: number;
  durationMonths: number;
  priceToman: number;
  isActive: boolean;
  features: SupportPlanFeatureRow[];
};

function unwrapList<T>(raw: unknown): T[] {
  const root = raw as Record<string, unknown> | null | undefined;
  const dataLayer = (root?.data ?? root?.Data ?? root) as Record<string, unknown> | undefined;
  const qr = dataLayer?.queryResult ?? dataLayer?.QueryResult ?? dataLayer;
  if (Array.isArray(qr)) return qr as T[];
  return [];
}

function mapFeature(raw: Record<string, unknown>): SupportPlanFeatureRow {
  return {
    featureCode: String(raw.featureCode ?? raw.FeatureCode ?? ''),
    titleFa: String(raw.titleFa ?? raw.TitleFa ?? ''),
    descriptionFa: String(raw.descriptionFa ?? raw.DescriptionFa ?? ''),
    isOffered: Boolean(raw.isOffered ?? raw.IsOffered ?? true),
    addonPriceToman: Number(raw.addonPriceToman ?? raw.AddonPriceToman ?? 0),
    sortOrder: Number(raw.sortOrder ?? raw.SortOrder ?? 0),
  };
}

function mapTariff(raw: Record<string, unknown>): SupportPlanTariffRow {
  const featuresRaw = (raw.features ?? raw.Features ?? []) as unknown[];
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    durationMonths: Number(raw.durationMonths ?? raw.DurationMonths ?? 0),
    priceToman: Number(raw.priceToman ?? raw.PriceToman ?? 0),
    isActive: Boolean(raw.isActive ?? raw.IsActive),
    features: featuresRaw
      .map((item) => mapFeature(item as Record<string, unknown>))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function fetchSupportPlanTariffs(): Promise<SupportPlanTariffRow[]> {
  const res = await apiClient.get<unknown>('/SupportSubscription/GetPlanTariffs');
  return unwrapList<Record<string, unknown>>(res.data).map(mapTariff);
}

export async function saveSupportPlanTariffs(
  tariffs: Array<{
    durationMonths: number;
    priceToman: number;
    isActive: boolean;
    features: Array<{ featureCode: string; isOffered: boolean; addonPriceToman: number }>;
  }>
): Promise<void> {
  await apiClient.post('/SupportSubscription/UpsertPlanTariffs', { tariffs });
}

export async function grantStudentSupportMonths(studentUserId: string, months: number): Promise<void> {
  await apiClient.post('/SupportSubscription/GrantMonths', {
    studentUserId,
    months,
  });
}

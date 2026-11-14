import { apiRequest } from './client';

const BASE = 'Teacher';

export type TeacherEarningsSummary = {
  availableBalanceToman: number;
  reservedBalanceToman: number;
  totalGrossSalesToman: number;
  totalTaxWithheldToman: number;
  totalPlatformFeeToman: number;
  totalNetEarnedToman: number;
  totalWithdrawnToman: number;
  totalSaleCount: number;
  incomeTaxPercent: number;
  payoutCooldownHours: number;
  canRequestPayout: boolean;
  hasPayoutBankInfo: boolean;
  nextPayoutEligibleAtUtc?: string | null;
  salesTodayGrossToman: number;
  salesWeekGrossToman: number;
  salesMonthGrossToman: number;
  salesYearGrossToman: number;
  netTodayToman: number;
  netWeekToman: number;
  netMonthToman: number;
  netYearToman: number;
  taxTodayToman: number;
  taxWeekToman: number;
  taxMonthToman: number;
  taxYearToman: number;
  salesCountToday: number;
  salesCountWeek: number;
  salesCountMonth: number;
  salesCountYear: number;
};

export type TeacherEarningsChartPoint = {
  label: string;
  grossToman: number;
  netToman: number;
  taxToman: number;
  saleCount: number;
};

export type TeacherCourseSaleRow = {
  id: number;
  courseId: number;
  courseTitle: string;
  quantity: number;
  grossAmountToman: number;
  taxAmountToman: number;
  netAmountToman: number;
  invoiceId: number;
  orderId: number;
  soldAtUtc: string;
};

export type TeacherPayoutRow = {
  id: number;
  amountToman: number;
  status: string;
  requestedAtUtc: string;
  processedAtUtc?: string | null;
  teacherNote?: string | null;
  adminNote?: string | null;
  transferReference?: string | null;
};

function unwrapRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root.queryResult ?? root.QueryResult ?? root;
  if (layer && typeof layer === 'object' && !Array.isArray(layer)) return layer as Record<string, unknown>;
  return root;
}

function num(raw: Record<string, unknown>, camel: string, pascal: string) {
  return Number(raw[camel] ?? raw[pascal] ?? 0);
}

function bool(raw: Record<string, unknown>, camel: string, pascal: string) {
  return Boolean(raw[camel] ?? raw[pascal]);
}

function normalizeSummary(raw: Record<string, unknown>): TeacherEarningsSummary {
  return {
    availableBalanceToman: num(raw, 'availableBalanceToman', 'AvailableBalanceToman'),
    reservedBalanceToman: num(raw, 'reservedBalanceToman', 'ReservedBalanceToman'),
    totalGrossSalesToman: num(raw, 'totalGrossSalesToman', 'TotalGrossSalesToman'),
    totalTaxWithheldToman: num(raw, 'totalTaxWithheldToman', 'TotalTaxWithheldToman'),
    totalPlatformFeeToman: num(raw, 'totalPlatformFeeToman', 'TotalPlatformFeeToman'),
    totalNetEarnedToman: num(raw, 'totalNetEarnedToman', 'TotalNetEarnedToman'),
    totalWithdrawnToman: num(raw, 'totalWithdrawnToman', 'TotalWithdrawnToman'),
    totalSaleCount: num(raw, 'totalSaleCount', 'TotalSaleCount'),
    incomeTaxPercent: Number(raw.incomeTaxPercent ?? raw.IncomeTaxPercent ?? 5),
    payoutCooldownHours: num(raw, 'payoutCooldownHours', 'PayoutCooldownHours') || 24,
    canRequestPayout: bool(raw, 'canRequestPayout', 'CanRequestPayout'),
    hasPayoutBankInfo: bool(raw, 'hasPayoutBankInfo', 'HasPayoutBankInfo'),
    nextPayoutEligibleAtUtc:
      String(raw.nextPayoutEligibleAtUtc ?? raw.NextPayoutEligibleAtUtc ?? '') || undefined,
    salesTodayGrossToman: num(raw, 'salesTodayGrossToman', 'SalesTodayGrossToman'),
    salesWeekGrossToman: num(raw, 'salesWeekGrossToman', 'SalesWeekGrossToman'),
    salesMonthGrossToman: num(raw, 'salesMonthGrossToman', 'SalesMonthGrossToman'),
    salesYearGrossToman: num(raw, 'salesYearGrossToman', 'SalesYearGrossToman'),
    netTodayToman: num(raw, 'netTodayToman', 'NetTodayToman'),
    netWeekToman: num(raw, 'netWeekToman', 'NetWeekToman'),
    netMonthToman: num(raw, 'netMonthToman', 'NetMonthToman'),
    netYearToman: num(raw, 'netYearToman', 'NetYearToman'),
    taxTodayToman: num(raw, 'taxTodayToman', 'TaxTodayToman'),
    taxWeekToman: num(raw, 'taxWeekToman', 'TaxWeekToman'),
    taxMonthToman: num(raw, 'taxMonthToman', 'TaxMonthToman'),
    taxYearToman: num(raw, 'taxYearToman', 'TaxYearToman'),
    salesCountToday: num(raw, 'salesCountToday', 'SalesCountToday'),
    salesCountWeek: num(raw, 'salesCountWeek', 'SalesCountWeek'),
    salesCountMonth: num(raw, 'salesCountMonth', 'SalesCountMonth'),
    salesCountYear: num(raw, 'salesCountYear', 'SalesCountYear'),
  };
}

function normalizeChartPoint(raw: Record<string, unknown>): TeacherEarningsChartPoint {
  return {
    label: String(raw.label ?? raw.Label ?? ''),
    grossToman: num(raw, 'grossToman', 'GrossToman'),
    netToman: num(raw, 'netToman', 'NetToman'),
    taxToman: num(raw, 'taxToman', 'TaxToman'),
    saleCount: num(raw, 'saleCount', 'SaleCount'),
  };
}

function normalizeSale(raw: Record<string, unknown>): TeacherCourseSaleRow {
  return {
    id: num(raw, 'id', 'Id'),
    courseId: num(raw, 'courseId', 'CourseId'),
    courseTitle: String(raw.courseTitle ?? raw.CourseTitle ?? ''),
    quantity: num(raw, 'quantity', 'Quantity'),
    grossAmountToman: num(raw, 'grossAmountToman', 'GrossAmountToman'),
    taxAmountToman: num(raw, 'taxAmountToman', 'TaxAmountToman'),
    netAmountToman: num(raw, 'netAmountToman', 'NetAmountToman'),
    invoiceId: num(raw, 'invoiceId', 'InvoiceId'),
    orderId: num(raw, 'orderId', 'OrderId'),
    soldAtUtc: String(raw.soldAtUtc ?? raw.SoldAtUtc ?? ''),
  };
}

function normalizePayout(raw: Record<string, unknown>): TeacherPayoutRow {
  return {
    id: num(raw, 'id', 'Id'),
    amountToman: num(raw, 'amountToman', 'AmountToman'),
    status: String(raw.status ?? raw.Status ?? '').toLowerCase(),
    requestedAtUtc: String(raw.requestedAtUtc ?? raw.RequestedAtUtc ?? ''),
    processedAtUtc: String(raw.processedAtUtc ?? raw.ProcessedAtUtc ?? '') || undefined,
    teacherNote: String(raw.teacherNote ?? raw.TeacherNote ?? '') || undefined,
    adminNote: String(raw.adminNote ?? raw.AdminNote ?? '') || undefined,
    transferReference: String(raw.transferReference ?? raw.TransferReference ?? '') || undefined,
  };
}

function unwrapList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const record = unwrapRecord(raw);
  if (!record) return [];
  const list = record.queryResult ?? record.QueryResult ?? record.data ?? record.Data;
  if (Array.isArray(list)) return list as Record<string, unknown>[];
  return [];
}

export async function getMyTeacherEarningsSummary(): Promise<TeacherEarningsSummary | null> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyTeacherEarningsSummary`, { credentials: 'include' });
  const record = unwrapRecord(raw);
  return record ? normalizeSummary(record) : null;
}

export async function getMyTeacherEarningsChart(
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<TeacherEarningsChartPoint[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyTeacherEarningsChart?period=${period}`, {
    credentials: 'include',
  });
  return unwrapList(raw).map(normalizeChartPoint);
}

export async function getMyTeacherCourseSales(take = 50): Promise<TeacherCourseSaleRow[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyTeacherCourseSales?take=${take}`, {
    credentials: 'include',
  });
  return unwrapList(raw).map(normalizeSale);
}

export async function getMyTeacherPayouts(take = 20): Promise<TeacherPayoutRow[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyTeacherPayouts?take=${take}`, {
    credentials: 'include',
  });
  return unwrapList(raw).map(normalizePayout);
}

export async function requestTeacherPayout(payload?: {
  amountToman?: number;
  note?: string;
}): Promise<void> {
  await apiRequest(`${BASE}/RequestTeacherPayout`, {
    method: 'POST',
    credentials: 'include',
    body: {
      amountToman: payload?.amountToman ?? 0,
      note: payload?.note ?? '',
    },
  });
}

export type TeacherPayoutBankInfo = {
  payoutSheba?: string | null;
  payoutCardNumber?: string | null;
  hasCompleteBankInfo: boolean;
};

export async function fetchTeacherPayoutBankInfo(): Promise<TeacherPayoutBankInfo> {
  const raw = unwrapRecord(await apiRequest<unknown>(`${BASE}/GetPayoutBankInfo`));
  if (!raw) return { hasCompleteBankInfo: false };
  return {
    payoutSheba: String(raw.payoutSheba ?? raw.PayoutSheba ?? '') || undefined,
    payoutCardNumber: String(raw.payoutCardNumber ?? raw.PayoutCardNumber ?? '') || undefined,
    hasCompleteBankInfo: bool(raw, 'hasCompleteBankInfo', 'HasCompleteBankInfo'),
  };
}

export async function updateTeacherPayoutBankInfo(payload: {
  payoutSheba: string;
  payoutCardNumber: string;
}): Promise<void> {
  await apiRequest(`${BASE}/UpdatePayoutBankInfo`, {
    method: 'POST',
    credentials: 'include',
    body: payload,
  });
}

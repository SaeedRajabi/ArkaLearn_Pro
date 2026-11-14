import apiClient from '@/lib/apiClient';

const BASE = '/UserActivity';

export type UserActivitySubjectRow = {
  subjectKey: string;
  userId?: number;
  visitorKey: string;
  displayName: string;
  isAnonymous: boolean;
  latestIpAddressV4?: string;
  latestIpAddressV6?: string;
  latestBrowserName?: string;
  latestOperatingSystem?: string;
  latestDeviceType?: string;
  latestSiteSource?: string;
  lastActivityAtUtc: string;
  eventCount: number;
};

export type UserActivityTimelineItem = {
  id: number;
  actionType: string;
  actionTitle: string;
  pagePath: string;
  pageTitle?: string;
  referrer?: string;
  siteSource: string;
  ipAddressV4?: string;
  ipAddressV6?: string;
  browserName?: string;
  browserVersion?: string;
  operatingSystem?: string;
  deviceType?: string;
  userAgent?: string;
  displayName: string;
  occurredAtUtc: string;
  metadataJson?: string;
  isBuffered: boolean;
};

export type UserActivityTimeline = {
  subjectKey: string;
  displayName: string;
  isAnonymous: boolean;
  selectedDayUtc?: string;
  items: UserActivityTimelineItem[];
};

function extractPagedList(raw: unknown): { items: unknown[]; totalCount: number; pageNumber: number; pageSize: number } {
  const empty = { items: [] as unknown[], totalCount: 0, pageNumber: 1, pageSize: 20 };
  if (!raw || typeof raw !== 'object') return empty;

  // Walk nested envelopes until we find a paged object (do NOT treat queryResult array as the layer).
  let layer: Record<string, unknown> | null = null;
  let cur: unknown = raw;
  for (let depth = 0; depth < 8; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) break;
    const obj = cur as Record<string, unknown>;
    if (
      'queryResult' in obj ||
      'QueryResult' in obj ||
      'totalCount' in obj ||
      'TotalCount' in obj ||
      'items' in obj ||
      'Items' in obj
    ) {
      layer = obj;
      break;
    }
    const next = obj.data ?? obj.Data ?? obj.result ?? obj.Result;
    if (next && typeof next === 'object' && !Array.isArray(next) && next !== cur) {
      cur = next;
      continue;
    }
    layer = obj;
    break;
  }

  if (!layer) return empty;

  const listRaw = layer.queryResult ?? layer.QueryResult ?? layer.items ?? layer.Items ?? layer.$values;
  const items = Array.isArray(listRaw)
    ? listRaw
    : listRaw && typeof listRaw === 'object' && Array.isArray((listRaw as { $values?: unknown[] }).$values)
      ? (listRaw as { $values: unknown[] }).$values
      : [];

  return {
    items,
    totalCount: Number(layer.totalCount ?? layer.TotalCount ?? items.length),
    pageNumber: Number(layer.pageNumber ?? layer.PageNumber ?? 1),
    pageSize: Number(layer.pageSize ?? layer.PageSize ?? 20),
  };
}

function mapSubject(row: Record<string, unknown>): UserActivitySubjectRow {
  return {
    subjectKey: String(row.subjectKey ?? row.SubjectKey ?? ''),
    userId: row.userId != null ? Number(row.userId) : row.UserId != null ? Number(row.UserId) : undefined,
    visitorKey: String(row.visitorKey ?? row.VisitorKey ?? ''),
    displayName: String(row.displayName ?? row.DisplayName ?? ''),
    isAnonymous: Boolean(row.isAnonymous ?? row.IsAnonymous),
    latestIpAddressV4: String(row.latestIpAddressV4 ?? row.LatestIpAddressV4 ?? '') || undefined,
    latestIpAddressV6: String(row.latestIpAddressV6 ?? row.LatestIpAddressV6 ?? '') || undefined,
    latestBrowserName: String(row.latestBrowserName ?? row.LatestBrowserName ?? '') || undefined,
    latestOperatingSystem: String(row.latestOperatingSystem ?? row.LatestOperatingSystem ?? '') || undefined,
    latestDeviceType: String(row.latestDeviceType ?? row.LatestDeviceType ?? '') || undefined,
    latestSiteSource: String(row.latestSiteSource ?? row.LatestSiteSource ?? '') || undefined,
    lastActivityAtUtc: String(row.lastActivityAtUtc ?? row.LastActivityAtUtc ?? ''),
    eventCount: Number(row.eventCount ?? row.EventCount ?? 0),
  };
}

function mapTimelineItem(row: Record<string, unknown>): UserActivityTimelineItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    actionType: String(row.actionType ?? row.ActionType ?? ''),
    actionTitle: String(row.actionTitle ?? row.ActionTitle ?? ''),
    pagePath: String(row.pagePath ?? row.PagePath ?? ''),
    pageTitle: String(row.pageTitle ?? row.PageTitle ?? '') || undefined,
    referrer: String(row.referrer ?? row.Referrer ?? '') || undefined,
    siteSource: String(row.siteSource ?? row.SiteSource ?? ''),
    ipAddressV4: String(row.ipAddressV4 ?? row.IpAddressV4 ?? '') || undefined,
    ipAddressV6: String(row.ipAddressV6 ?? row.IpAddressV6 ?? '') || undefined,
    browserName: String(row.browserName ?? row.BrowserName ?? '') || undefined,
    browserVersion: String(row.browserVersion ?? row.BrowserVersion ?? '') || undefined,
    operatingSystem: String(row.operatingSystem ?? row.OperatingSystem ?? '') || undefined,
    deviceType: String(row.deviceType ?? row.DeviceType ?? '') || undefined,
    userAgent: String(row.userAgent ?? row.UserAgent ?? '') || undefined,
    displayName: String(row.displayName ?? row.DisplayName ?? ''),
    occurredAtUtc: String(row.occurredAtUtc ?? row.OccurredAtUtc ?? ''),
    metadataJson: String(row.metadataJson ?? row.MetadataJson ?? '') || undefined,
    isBuffered: Boolean(row.isBuffered ?? row.IsBuffered),
  };
}

export async function searchUserActivitySubjects(params: {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: UserActivitySubjectRow[]; totalCount: number; pageNumber: number; pageSize: number }> {
  const response = await apiClient.get<unknown>(`${BASE}/SearchSubjects`, {
    params: {
      search: params.search ?? '',
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
    },
  });
  const paged = extractPagedList(response.data);
  return {
    ...paged,
    items: paged.items
      .map((row) => mapSubject(row as Record<string, unknown>))
      .filter((x) => x.subjectKey),
  };
}

export async function getUserActivityTimeline(params: {
  subjectKey: string;
  fromUtc?: string;
  toUtc?: string;
}): Promise<UserActivityTimeline> {
  const response = await apiClient.get<unknown>(`${BASE}/GetTimeline`, {
    params: {
      subjectKey: params.subjectKey,
      fromUtc: params.fromUtc,
      toUtc: params.toUtc,
    },
  });
  const raw = response.data;
  let obj: Record<string, unknown> = {};
  let cur: unknown = raw;
  for (let depth = 0; depth < 6; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) break;
    const layer = cur as Record<string, unknown>;
    if (
      'items' in layer ||
      'Items' in layer ||
      'subjectKey' in layer ||
      'SubjectKey' in layer
    ) {
      obj = layer;
      break;
    }
    const next = layer.data ?? layer.Data ?? layer.result ?? layer.Result;
    if (next && typeof next === 'object' && !Array.isArray(next) && next !== cur) {
      cur = next;
      continue;
    }
    obj = layer;
    break;
  }

  const itemsRaw = obj.items ?? obj.Items ?? obj.$values;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw
    : itemsRaw && typeof itemsRaw === 'object' && Array.isArray((itemsRaw as { $values?: unknown[] }).$values)
      ? (itemsRaw as { $values: unknown[] }).$values
      : [];
  return {
    subjectKey: String(obj.subjectKey ?? obj.SubjectKey ?? params.subjectKey),
    displayName: String(obj.displayName ?? obj.DisplayName ?? ''),
    isAnonymous: Boolean(obj.isAnonymous ?? obj.IsAnonymous),
    selectedDayUtc: String(obj.selectedDayUtc ?? obj.SelectedDayUtc ?? '') || undefined,
    items: items.map((row) => mapTimelineItem(row as Record<string, unknown>)),
  };
}

export async function trackAdminUserActivity(payload: {
  visitorKey: string;
  pagePath: string;
  pageTitle?: string;
  actionTitle?: string;
}): Promise<void> {
  try {
    await apiClient.post(`${BASE}/Track`, {
      visitorKey: payload.visitorKey,
      actionType: 'PageView',
      actionTitle: payload.actionTitle ?? payload.pageTitle ?? payload.pagePath,
      pagePath: payload.pagePath,
      pageTitle: payload.pageTitle ?? '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      siteSource: 'admin',
    });
  } catch {
    // ignore
  }
}

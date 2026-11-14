import apiClient from '@/lib/apiClient';

export type SecuritySettingsPayload = {
  maxLoginAttempts: number;
  lockoutMinutes: number;
  permanentBlockAfterLockouts: number;
  ipUnblockOtpExpiryMinutes: number;
  ipUnblockOtpResendCooldownSeconds: number;
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

const DEFAULTS: SecuritySettingsPayload = {
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  permanentBlockAfterLockouts: 2,
  ipUnblockOtpExpiryMinutes: 10,
  ipUnblockOtpResendCooldownSeconds: 120,
};

export async function getSecuritySettings(): Promise<SecuritySettingsPayload> {
  const res = await apiClient.get<unknown>('/SecuritySettings/Get');
  return { ...DEFAULTS, ...(unwrap<SecuritySettingsPayload>(res.data) ?? {}) };
}

export async function upsertSecuritySettings(payload: SecuritySettingsPayload): Promise<void> {
  await apiClient.post('/SecuritySettings/Upsert', payload);
}

export type IPBlacklistRow = {
  id: number;
  ipAddress: string;
  deviceInformation: string;
  reason: string;
  addedDate: string;
  expirationDate: string;
  isPermanent: boolean;
};

function mapRow(raw: Record<string, unknown>): IPBlacklistRow {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    ipAddress: String(raw.ipAddress ?? raw.IpAddress ?? ''),
    deviceInformation: String(raw.deviceInformation ?? raw.DeviceInformation ?? ''),
    reason: String(raw.reason ?? raw.Reason ?? ''),
    addedDate: String(raw.addedDate ?? raw.AddedDate ?? ''),
    expirationDate: String(raw.expirationDate ?? raw.ExpirationDate ?? ''),
    isPermanent: Boolean(raw.isPermanent ?? raw.IsPermanent),
  };
}

export async function searchIPBlacklists(params: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: IPBlacklistRow[]; totalCount: number }> {
  const res = await apiClient.get<unknown>('/Security/IPBlacklist/Search', {
    params: {
      InputValue: params.inputValue ?? '',
      PageNumber: params.pageNumber ?? 1,
      PageSize: params.pageSize ?? 20,
      NeedTotalCount: true,
    },
  });
  const root = unwrap<Record<string, unknown>>(res.data) ?? {};
  const list = root.queryResult ?? root.QueryResult ?? root.$values ?? [];
  const items = (Array.isArray(list) ? list : []).map((row) => mapRow(row as Record<string, unknown>));
  const totalCount = Number(root.totalCount ?? root.TotalCount ?? items.length);
  return { items, totalCount };
}

export async function removeIPFromBlacklist(id: number): Promise<void> {
  await apiClient.post('/Security/IPBlacklist/Remove', { id });
}

import apiClient from '@/lib/apiClient';

export type AdminUserWallet = {
  userId: number;
  userName: string;
  fullName: string;
  email: string;
  availableBalanceToman: number;
  reservedBalanceToman: number;
  totalDepositedToman: number;
  totalSpentToman: number;
  totalReceivedToman: number;
  isSuspended: boolean;
  zibalSubMerchantId?: string | null;
};

function unwrap<T>(raw: unknown): T {
  const root = raw as Record<string, unknown>;
  const data = (root?.data ?? root?.Data ?? root) as Record<string, unknown>;
  return (data?.queryResult ?? data?.QueryResult ?? data) as T;
}

export async function fetchAdminUserWallets(search?: string, take = 50): Promise<AdminUserWallet[]> {
  const params = new URLSearchParams({ take: String(take) });
  if (search?.trim()) params.set('search', search.trim());
  const res = await apiClient.get<unknown>(`/Wallet/GetAdminUserWallets?${params}`);
  const list = unwrap<unknown[]>(res.data);
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      userId: Number(row.userId ?? row.UserId ?? 0),
      userName: String(row.userName ?? row.UserName ?? ''),
      fullName: String(row.fullName ?? row.FullName ?? ''),
      email: String(row.email ?? row.Email ?? ''),
      availableBalanceToman: Number(row.availableBalanceToman ?? row.AvailableBalanceToman ?? 0),
      reservedBalanceToman: Number(row.reservedBalanceToman ?? row.ReservedBalanceToman ?? 0),
      totalDepositedToman: Number(row.totalDepositedToman ?? row.TotalDepositedToman ?? 0),
      totalSpentToman: Number(row.totalSpentToman ?? row.TotalSpentToman ?? 0),
      totalReceivedToman: Number(row.totalReceivedToman ?? row.TotalReceivedToman ?? 0),
      isSuspended: Boolean(row.isSuspended ?? row.IsSuspended),
      zibalSubMerchantId: String(row.zibalSubMerchantId ?? row.ZibalSubMerchantId ?? '') || undefined,
    };
  });
}

export async function fetchPlatformWallet(): Promise<Record<string, number>> {
  const res = await apiClient.get<unknown>('/Wallet/GetPlatformWallet');
  const row = (res.data ?? {}) as Record<string, unknown>;
  return {
    availableBalanceToman: Number(row.availableBalanceToman ?? row.AvailableBalanceToman ?? 0),
    reservedBalanceToman: Number(row.reservedBalanceToman ?? row.ReservedBalanceToman ?? 0),
    totalDepositedToman: Number(row.totalDepositedToman ?? row.TotalDepositedToman ?? 0),
    totalSpentToman: Number(row.totalSpentToman ?? row.TotalSpentToman ?? 0),
  };
}

export async function adminAdjustWallet(userId: number, amountToman: number, note?: string): Promise<void> {
  await apiClient.post('/Wallet/AdminAdjustBalance', { userId, amountToman, note });
}

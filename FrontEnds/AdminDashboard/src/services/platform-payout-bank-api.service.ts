import apiClient from '@/lib/apiClient';

export type PlatformPayoutBankSettings = {
  platformPayoutSheba?: string | null;
  platformPayoutCardNumber?: string | null;
  zarinPalPlatformBankAccountId?: string | null;
  isConfigured: boolean;
};

function unwrap<T>(raw: unknown): T {
  const root = raw as Record<string, unknown>;
  const data = (root?.data ?? root?.Data ?? root) as Record<string, unknown>;
  return (data?.queryResult ?? data?.QueryResult ?? data) as T;
}

export async function fetchPlatformPayoutBankSettings(): Promise<PlatformPayoutBankSettings> {
  const res = await apiClient.get<unknown>('/Teacher/GetPlatformPayoutBankSettings');
  const row = unwrap<Record<string, unknown>>(res.data);
  return {
    platformPayoutSheba: String(row.platformPayoutSheba ?? row.PlatformPayoutSheba ?? '') || undefined,
    platformPayoutCardNumber: String(row.platformPayoutCardNumber ?? row.PlatformPayoutCardNumber ?? '') || undefined,
    zarinPalPlatformBankAccountId:
      String(row.zarinPalPlatformBankAccountId ?? row.ZarinPalPlatformBankAccountId ?? '') || undefined,
    isConfigured: Boolean(row.isConfigured ?? row.IsConfigured),
  };
}

export async function savePlatformPayoutBankSettings(payload: {
  platformPayoutSheba: string;
  platformPayoutCardNumber: string;
  zarinPalPlatformBankAccountId?: string;
}): Promise<void> {
  await apiClient.post('/Teacher/SavePlatformPayoutBankSettings', payload);
}

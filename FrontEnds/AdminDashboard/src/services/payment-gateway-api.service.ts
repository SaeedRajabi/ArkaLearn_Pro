import apiClient from '@/lib/apiClient';

export type PaymentGatewayProvider = 'ZarinPal' | 'Zibal';

export type PaymentGatewayProviderSettings = {
  isConfigured: boolean;
  useSandbox: boolean;
  hasMerchantId: boolean;
  hasApiKey: boolean;
  hasAccessToken: boolean;
  hasTerminalId: boolean;
  merchantIdHint?: string | null;
};

export type PaymentGatewaySettings = {
  provider: PaymentGatewayProvider;
  enabled: boolean;
  availableProviders: PaymentGatewayProvider[];
  zibal: PaymentGatewayProviderSettings;
  zarinPal: PaymentGatewayProviderSettings;
};

export type PaymentGatewayCredentialsInput = {
  merchantId?: string;
  apiKey?: string;
  accessToken?: string;
  terminalId?: string;
  useSandbox?: boolean;
};

function unwrap<T>(raw: unknown): T {
  const root = raw as Record<string, unknown>;
  const data = (root?.data ?? root?.Data ?? root) as Record<string, unknown>;
  return (data?.queryResult ?? data?.QueryResult ?? data) as T;
}

function mapProviderSettings(row: Record<string, unknown> | undefined): PaymentGatewayProviderSettings {
  const source = row ?? {};
  return {
    isConfigured: Boolean(source.isConfigured ?? source.IsConfigured),
    useSandbox: Boolean(source.useSandbox ?? source.UseSandbox),
    hasMerchantId: Boolean(source.hasMerchantId ?? source.HasMerchantId),
    hasApiKey: Boolean(source.hasApiKey ?? source.HasApiKey),
    hasAccessToken: Boolean(source.hasAccessToken ?? source.HasAccessToken),
    hasTerminalId: Boolean(source.hasTerminalId ?? source.HasTerminalId),
    merchantIdHint: (source.merchantIdHint ?? source.MerchantIdHint ?? null) as string | null,
  };
}

export async function fetchPaymentGatewaySettings(): Promise<PaymentGatewaySettings> {
  const res = await apiClient.get<unknown>('/Teacher/GetPaymentGatewaySettings');
  const row = unwrap<Record<string, unknown>>(res.data);
  const providers = (row.availableProviders ?? row.AvailableProviders ?? ['ZarinPal', 'Zibal']) as string[];
  const providerRaw = String(row.provider ?? row.Provider ?? 'Zibal');
  const provider: PaymentGatewayProvider = providerRaw === 'ZarinPal' ? 'ZarinPal' : 'Zibal';

  return {
    provider,
    enabled: Boolean(row.enabled ?? row.Enabled ?? true),
    availableProviders: providers.filter((p): p is PaymentGatewayProvider => p === 'ZarinPal' || p === 'Zibal'),
    zibal: mapProviderSettings((row.zibal ?? row.Zibal) as Record<string, unknown> | undefined),
    zarinPal: mapProviderSettings((row.zarinPal ?? row.ZarinPal) as Record<string, unknown> | undefined),
  };
}

export async function savePaymentGatewaySettings(payload: {
  provider: PaymentGatewayProvider;
  enabled: boolean;
  zibal?: PaymentGatewayCredentialsInput;
  zarinPal?: PaymentGatewayCredentialsInput;
}): Promise<void> {
  await apiClient.post('/Teacher/SavePaymentGatewaySettings', payload);
}

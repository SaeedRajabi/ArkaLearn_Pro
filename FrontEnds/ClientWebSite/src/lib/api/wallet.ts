import { apiRequest } from './client';
import { redirectToPaymentGateway } from './payments';

const BASE = 'Wallet';
const PAYMENT_BASE = 'Payment';

export type MyWallet = {
  userId: number;
  availableBalanceToman: number;
  reservedBalanceToman: number;
  totalDepositedToman: number;
  totalSpentToman: number;
  totalReceivedToman: number;
  totalWithdrawnToman: number;
  isSuspended: boolean;
  hasZibalSubMerchant: boolean;
  profileCompleteForWallet: boolean;
  profileCompletionHint?: string | null;
};

export type WalletTransaction = {
  id: number;
  type: string;
  amountToman: number;
  balanceAfterToman: number;
  reference: string;
  description?: string | null;
  createdAtUtc: string;
};

function unwrap<T>(raw: unknown): T {
  const root = raw as Record<string, unknown>;
  const data = (root?.data ?? root?.Data ?? root) as Record<string, unknown>;
  return (data?.queryResult ?? data?.QueryResult ?? data) as T;
}

function mapWallet(row: Record<string, unknown>): MyWallet {
  return {
    userId: Number(row.userId ?? row.UserId ?? 0),
    availableBalanceToman: Number(row.availableBalanceToman ?? row.AvailableBalanceToman ?? 0),
    reservedBalanceToman: Number(row.reservedBalanceToman ?? row.ReservedBalanceToman ?? 0),
    totalDepositedToman: Number(row.totalDepositedToman ?? row.TotalDepositedToman ?? 0),
    totalSpentToman: Number(row.totalSpentToman ?? row.TotalSpentToman ?? 0),
    totalReceivedToman: Number(row.totalReceivedToman ?? row.TotalReceivedToman ?? 0),
    totalWithdrawnToman: Number(row.totalWithdrawnToman ?? row.TotalWithdrawnToman ?? 0),
    isSuspended: Boolean(row.isSuspended ?? row.IsSuspended),
    hasZibalSubMerchant: Boolean(row.hasZibalSubMerchant ?? row.HasZibalSubMerchant),
    profileCompleteForWallet: Boolean(row.profileCompleteForWallet ?? row.ProfileCompleteForWallet ?? true),
    profileCompletionHint: String(row.profileCompletionHint ?? row.ProfileCompletionHint ?? '') || undefined,
  };
}

export async function getMyWallet(): Promise<MyWallet> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyWallet`);
  return mapWallet(unwrap<Record<string, unknown>>(raw));
}

export async function getMyWalletTransactions(take = 50): Promise<WalletTransaction[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyTransactions?take=${take}`);
  const list = unwrap<unknown[]>(raw);
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: Number(row.id ?? row.Id ?? 0),
      type: String(row.type ?? row.Type ?? ''),
      amountToman: Number(row.amountToman ?? row.AmountToman ?? 0),
      balanceAfterToman: Number(row.balanceAfterToman ?? row.BalanceAfterToman ?? 0),
      reference: String(row.reference ?? row.Reference ?? ''),
      description: String(row.description ?? row.Description ?? '') || undefined,
      createdAtUtc: String(row.createdAtUtc ?? row.CreatedAtUtc ?? ''),
    };
  });
}

export async function payInvoiceFromWallet(invoiceId: number): Promise<void> {
  await apiRequest(`${BASE}/PayInvoice`, {
    method: 'POST',
    body: { invoiceId },
  });
}

export async function paySeminarFromWallet(seminarId: number): Promise<void> {
  await apiRequest(`${BASE}/PaySeminar`, {
    method: 'POST',
    body: { seminarId },
  });
}

export async function requestWalletTopUp(amountToman: number): Promise<void> {
  const result = await apiRequest<{ paymentUrl?: string; PaymentUrl?: string }>(
    `${PAYMENT_BASE}/RequestWalletTopUp`,
    { method: 'POST', body: { amountToman } }
  );
  const url = result.paymentUrl ?? result.PaymentUrl;
  if (!url) throw new Error('Payment URL missing');
  redirectToPaymentGateway(url);
}

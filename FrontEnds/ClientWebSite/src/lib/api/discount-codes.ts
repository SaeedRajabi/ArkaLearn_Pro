import { apiRequest } from './client';

export type ValidateDiscountResult = {
  code: string;
  discountAmount: number;
  type: string;
  percentage?: number | null;
  message?: string;
  eligibleSubtotal?: number;
  scopeType?: number;
};

function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

export async function checkDiscountCode(
  code: string,
  subtotal: number,
  options?: {
    courseIds?: number[];
    lineTotals?: number[];
  }
): Promise<ValidateDiscountResult> {
  if (!code.trim()) throw new Error('کد تخفیف وارد نشده است');

  const raw = await apiRequest<unknown>('Order/DiscountCode/Validate', {
    method: 'POST',
    body: {
      code: code.trim(),
      subtotal: Number(subtotal) || 0,
      courseIds: options?.courseIds ?? [],
      lineTotals: options?.lineTotals ?? [],
    },
    timeoutMs: 20000,
  });

  const data = unwrapData<Record<string, unknown>>(raw);
  const discountAmount = Number(data?.discountAmount ?? data?.DiscountAmount ?? 0);
  if (!Number.isFinite(discountAmount) || discountAmount < 0) {
    throw new Error('کد تخفیف نامعتبر است');
  }

  const message = data?.message != null ? String(data.message) : undefined;
  if (message && discountAmount === 0 && /invalid|expired|not apply|نامعتبر|اعمال/i.test(message) && !/applied/i.test(message)) {
    throw new Error(message);
  }

  return {
    code: String(data?.code ?? data?.Code ?? code.trim().toUpperCase()),
    discountAmount,
    type: String(data?.type ?? data?.Type ?? ''),
    percentage:
      data?.percentage != null || data?.Percentage != null
        ? Number(data?.percentage ?? data?.Percentage)
        : null,
    message,
    eligibleSubtotal:
      data?.eligibleSubtotal != null || data?.EligibleSubtotal != null
        ? Number(data?.eligibleSubtotal ?? data?.EligibleSubtotal)
        : undefined,
    scopeType:
      data?.scopeType != null || data?.ScopeType != null
        ? Number(data?.scopeType ?? data?.ScopeType)
        : undefined,
  };
}

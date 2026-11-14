import { apiRequest } from './client';
import { requestInvoicePayment, redirectToPaymentGateway } from './payments';
import { getMyWallet, payInvoiceFromWallet } from './wallet';

const BASE = 'Invoice';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | 'CANCELED';

export interface InvoiceListItem {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus | string;
  orderId: number;
  description: string;
}

export interface InvoiceLineItem {
  courseTitle: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceDetail extends InvoiceListItem {
  items: InvoiceLineItem[];
}

export type PayInvoiceOutcome = 'wallet' | 'gateway';

function normalizeApiCollection<T>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'object' && value !== null && '$values' in value) {
    const nested = (value as { $values?: unknown }).$values;
    return Array.isArray(nested) ? (nested as T[]) : [];
  }
  return [];
}

function mapInvoiceLineItem(raw: Record<string, unknown>): InvoiceLineItem {
  return {
    courseTitle: String(raw.courseTitle ?? raw.CourseTitle ?? ''),
    quantity: Number(raw.quantity ?? raw.Quantity ?? 0),
    unitPrice: Number(raw.unitPrice ?? raw.UnitPrice ?? 0),
    totalPrice: Number(raw.totalPrice ?? raw.TotalPrice ?? 0),
  };
}

function normalizeInvoiceDescription(description: unknown): string | undefined {
  if (typeof description !== 'string') return undefined;
  const trimmed = description.trim();
  if (!trimmed || trimmed.toLowerCase() === 'no description') return undefined;
  return trimmed;
}

function normalizeInvoiceDetail(raw: Record<string, unknown>): InvoiceDetail {
  const orderItems = normalizeApiCollection<Record<string, unknown>>(
    raw.items ?? raw.orderItems ?? raw.OrderItems
  );

  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    invoiceNumber: String(raw.invoiceNumber ?? raw.InvoiceNumber ?? ''),
    invoiceDate: String(raw.invoiceDate ?? raw.InvoiceDate ?? ''),
    totalAmount: Number(raw.totalAmount ?? raw.TotalAmount ?? 0),
    paidAmount: Number(raw.paidAmount ?? raw.PaidAmount ?? 0),
    remainingAmount: Number(raw.remainingAmount ?? raw.RemainingAmount ?? 0),
    status: String(raw.status ?? raw.Status ?? ''),
    orderId: Number(raw.orderId ?? raw.OrderId ?? 0),
    description: normalizeInvoiceDescription(raw.description ?? raw.Description) ?? '',
    items: orderItems.map(mapInvoiceLineItem),
  };
}

function resolveAmountDueToman(invoice: Pick<InvoiceDetail, 'remainingAmount' | 'totalAmount' | 'paidAmount'>): number {
  const remaining = Number(invoice.remainingAmount);
  if (Number.isFinite(remaining) && remaining > 0) return Math.round(remaining);
  const total = Number(invoice.totalAmount) || 0;
  const paid = Number(invoice.paidAmount) || 0;
  return Math.max(0, Math.round(total - paid));
}

function isInsufficientWalletError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  return /insufficient|موجودی|کافی\s*نیست/i.test(message);
}

export async function getMyInvoices(): Promise<InvoiceListItem[]> {
  const result: any = await apiRequest(`${BASE}/GetMyInvoices`);

  if (result && typeof result === 'object' && '$values' in result && Array.isArray(result.$values)) {
    return result.$values;
  }

  return Array.isArray(result) ? result : [];
}

export async function getInvoiceById(id: number): Promise<InvoiceDetail | null> {
  try {
    const raw = await apiRequest<Record<string, unknown>>(`${BASE}/GetById?invoiceId=${id}`);
    if (!raw || typeof raw !== 'object') return null;
    return normalizeInvoiceDetail(raw);
  } catch {
    return null;
  }
}

/**
 * Pay invoice: use wallet when balance covers the amount; otherwise open Zibal gateway.
 * Returns `wallet` when paid from wallet. Returns `gateway` after redirect starts (page usually unloads).
 */
export async function payInvoice(
  invoiceId: number,
  amountDueToman?: number
): Promise<PayInvoiceOutcome> {
  let due =
    typeof amountDueToman === 'number' && Number.isFinite(amountDueToman)
      ? Math.max(0, Math.round(amountDueToman))
      : 0;

  if (due <= 0) {
    const detail = await getInvoiceById(invoiceId);
    if (detail) due = resolveAmountDueToman(detail);
  }

  let canTryWallet = due > 0;
  if (canTryWallet) {
    try {
      const wallet = await getMyWallet();
      canTryWallet = !wallet.isSuspended && wallet.availableBalanceToman >= due;
    } catch {
      canTryWallet = false;
    }
  }

  if (canTryWallet) {
    try {
      await payInvoiceFromWallet(invoiceId);
      return 'wallet';
    } catch (error) {
      if (!isInsufficientWalletError(error)) throw error;
      // Race: balance dropped — fall through to gateway.
    }
  }

  const payment = await requestInvoicePayment(invoiceId);
  if (!payment.paymentUrl) {
    throw new Error('Payment gateway URL was not returned.');
  }
  redirectToPaymentGateway(payment.paymentUrl);
  return 'gateway';
}

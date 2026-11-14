import apiClient from '@/lib/apiClient';
import { getDashboardOverview, type DashboardOverview } from '@/services/dashboard-service';

export type AdminInvoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  orderId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  transactionCount: number;
};

export type AdminPayment = {
  id: number;
  invoiceId?: number | null;
  invoiceNumber: string;
  transactionNumber: string;
  transactionDate: string;
  amount: number;
  status: string;
  referenceNumber?: string | null;
  description?: string | null;
  paymentId?: number | null;
  studentName: string;
  studentEmail: string;
};

export type FinanceSummary = {
  totalRevenue: number;
  outstandingAmount: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  paymentCount: number;
  failedPaymentCount: number;
};

function normalizeArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const obj = raw as { $values?: unknown; data?: unknown };
    if (Array.isArray(obj.$values)) return obj.$values as T[];
    if (obj.data) return normalizeArray<T>(obj.data);
  }
  return [];
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string {
  return value == null ? '' : String(value);
}

function normalizeInvoice(raw: unknown): AdminInvoice {
  const o = raw as Record<string, unknown>;
  return {
    id: num(o.id ?? o.Id),
    invoiceNumber: str(o.invoiceNumber ?? o.InvoiceNumber),
    invoiceDate: str(o.invoiceDate ?? o.InvoiceDate),
    totalAmount: num(o.totalAmount ?? o.TotalAmount),
    paidAmount: num(o.paidAmount ?? o.PaidAmount),
    remainingAmount: num(o.remainingAmount ?? o.RemainingAmount),
    status: str(o.status ?? o.Status),
    orderId: num(o.orderId ?? o.OrderId),
    studentId: num(o.studentId ?? o.StudentId),
    studentName: str(o.studentName ?? o.StudentName),
    studentEmail: str(o.studentEmail ?? o.StudentEmail),
    transactionCount: num(o.transactionCount ?? o.TransactionCount),
  };
}

function normalizePayment(raw: unknown): AdminPayment {
  const o = raw as Record<string, unknown>;
  return {
    id: num(o.id ?? o.Id),
    invoiceId: o.invoiceId == null && o.InvoiceId == null ? null : num(o.invoiceId ?? o.InvoiceId),
    invoiceNumber: str(o.invoiceNumber ?? o.InvoiceNumber),
    transactionNumber: str(o.transactionNumber ?? o.TransactionNumber),
    transactionDate: str(o.transactionDate ?? o.TransactionDate),
    amount: num(o.amount ?? o.Amount),
    status: str(o.status ?? o.Status),
    referenceNumber: (o.referenceNumber ?? o.ReferenceNumber ?? null) as string | null,
    description: (o.description ?? o.Description ?? null) as string | null,
    paymentId: o.paymentId == null && o.PaymentId == null ? null : num(o.paymentId ?? o.PaymentId),
    studentName: str(o.studentName ?? o.StudentName),
    studentEmail: str(o.studentEmail ?? o.StudentEmail),
  };
}

export async function getAdminInvoices(): Promise<AdminInvoice[]> {
  const res = await apiClient.get<unknown>('/Invoice/GetAdminInvoices');
  return normalizeArray<unknown>(res.data).map(normalizeInvoice);
}

export async function getAdminPayments(): Promise<AdminPayment[]> {
  const res = await apiClient.get<unknown>('/Invoice/GetAdminPayments');
  return normalizeArray<unknown>(res.data).map(normalizePayment);
}

export async function getFinanceOverview(months = 12): Promise<{
  overview: DashboardOverview;
  invoices: AdminInvoice[];
  payments: AdminPayment[];
  summary: FinanceSummary;
}> {
  const [overview, invoices, payments] = await Promise.all([
    getDashboardOverview(months),
    getAdminInvoices(),
    getAdminPayments(),
  ]);

  const summary: FinanceSummary = {
    totalRevenue: payments
      .filter((p) => p.status.toLowerCase() === 'success' || p.status.toLowerCase() === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    outstandingAmount: invoices.reduce((sum, invoice) => sum + invoice.remainingAmount, 0),
    invoiceCount: invoices.length,
    paidInvoiceCount: invoices.filter((invoice) => invoice.remainingAmount <= 0).length,
    paymentCount: payments.length,
    failedPaymentCount: payments.filter((p) => p.status.toLowerCase() === 'failed').length,
  };

  return { overview, invoices, payments, summary };
}

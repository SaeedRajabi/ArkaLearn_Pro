'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CreditCard, FileText, ReceiptText, WalletCards } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SalesChart } from '@/app/dashboard/components/sales-chart';
import { formatLocalizedCurrency, formatLocalizedNumber } from '@/lib/utils/localized-ui';
import {
  getFinanceOverview,
  type AdminInvoice,
  type AdminPayment,
  type FinanceSummary,
} from '@/services/finance-service';
import {
  getAdvertisementMonetizationRevenue,
  type AdvertisementRevenueReport,
} from '@/services/advertisement-monetization-service';
import type { DashboardOverview } from '@/services/dashboard-service';

type FinanceView = 'overview' | 'reports' | 'invoices' | 'payments';

type FinanceState = {
  overview: DashboardOverview;
  invoices: AdminInvoice[];
  payments: AdminPayment[];
  summary: FinanceSummary;
  adRevenue: AdvertisementRevenueReport | null;
};

const emptyState: FinanceState = {
  overview: {
    recentSupportTickets: [],
    announcements: [],
    recentArticles: [],
    monthlyEnrollments: [],
    monthlySales: [],
    topInstructors: [],
    salesPeriodTotal: 0,
    enrollmentPeriodTotal: 0,
    pendingProjectOrdersCount: 0,
    recentProjectOrders: [],
  },
  invoices: [],
  payments: [],
  summary: {
    totalRevenue: 0,
    outstandingAmount: 0,
    invoiceCount: 0,
    paidInvoiceCount: 0,
    paymentCount: 0,
    failedPaymentCount: 0,
  },
  adRevenue: null,
};

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'success' | 'outline' {
  const normalized = status.toLowerCase();
  if (['paid', 'success', 'completed', 'settled'].some((x) => normalized.includes(x))) return 'success';
  if (['failed', 'cancel', 'reject'].some((x) => normalized.includes(x))) return 'destructive';
  if (['pending', 'draft', 'issued'].some((x) => normalized.includes(x))) return 'secondary';
  return 'outline';
}

export function FinanceDashboardClient({ view = 'overview' }: { view?: FinanceView }) {
  const { t, locale } = useLanguage();
  const [state, setState] = useState<FinanceState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getFinanceOverview(12),
      view === 'reports' ? getAdvertisementMonetizationRevenue() : Promise.resolve(null),
    ])
      .then(([data, adRevenue]) => {
        setState({ ...data, adRevenue });
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load finance data:', err);
        setError(t('finance_load_failed'));
      })
      .finally(() => setLoading(false));
  }, [t, view]);

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.invoices;
    return state.invoices.filter((invoice) =>
      [invoice.invoiceNumber, invoice.status, invoice.studentName, invoice.studentEmail, String(invoice.orderId)]
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [query, state.invoices]);

  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.payments;
    return state.payments.filter((payment) =>
      [
        payment.transactionNumber,
        payment.invoiceNumber,
        payment.status,
        payment.referenceNumber ?? '',
        payment.studentName,
        payment.studentEmail,
      ].some((value) => value.toLowerCase().includes(q))
    );
  }, [query, state.payments]);

  const summaryCards = [
    {
      title: t('finance_total_revenue'),
      value: formatLocalizedCurrency(state.summary.totalRevenue, locale, t),
      icon: WalletCards,
      color: 'text-green-600',
    },
    {
      title: t('finance_outstanding_amount'),
      value: formatLocalizedCurrency(state.summary.outstandingAmount, locale, t),
      icon: FileText,
      color: 'text-orange-600',
    },
    {
      title: t('finance_invoice_count'),
      value: formatLocalizedNumber(state.summary.invoiceCount, locale),
      icon: ReceiptText,
      color: 'text-blue-600',
    },
    {
      title: t('finance_payment_count'),
      value: formatLocalizedNumber(state.summary.paymentCount, locale),
      icon: CreditCard,
      color: 'text-purple-600',
    },
  ];

  const titleByView: Record<FinanceView, string> = {
    overview: t('finance_overview_title'),
    reports: t('finance_reports_title'),
    invoices: t('finance_invoices_title'),
    payments: t('finance_payments_title'),
  };

  const descriptionByView: Record<FinanceView, string> = {
    overview: t('finance_overview_description'),
    reports: t('finance_reports_description'),
    invoices: t('finance_invoices_description'),
    payments: t('finance_payments_description'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{titleByView[view]}</h1>
        <p className="text-sm text-muted-foreground">{descriptionByView[view]}</p>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {(view === 'overview' || view === 'reports') && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-28" /> : <div className="text-2xl font-bold">{card.value}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(view === 'overview' || view === 'reports') && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesChart
              monthlySales={state.overview.monthlySales}
              periodTotal={state.overview.salesPeriodTotal}
              loading={loading}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('finance_report_snapshot')}
              </CardTitle>
              <CardDescription>{t('finance_report_snapshot_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t('finance_paid_invoices')}</span>
                <span className="font-semibold">{formatLocalizedNumber(state.summary.paidInvoiceCount, locale)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t('finance_failed_payments')}</span>
                <span className="font-semibold">{formatLocalizedNumber(state.summary.failedPaymentCount, locale)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t('finance_period_sales')}</span>
                <span className="font-semibold">
                  {formatLocalizedCurrency(state.overview.salesPeriodTotal, locale, t)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('finance_ad_revenue_title')}</CardTitle>
            <CardDescription>{t('finance_ad_revenue_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : state.adRevenue ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    { label: t('finance_ad_revenue_total'), value: state.adRevenue.totalToman },
                    { label: t('finance_ad_revenue_subscription'), value: state.adRevenue.subscriptionToman },
                    { label: t('finance_ad_revenue_contact'), value: state.adRevenue.contactUnlockToman },
                    { label: t('finance_ad_revenue_one_time_bump'), value: state.adRevenue.oneTimeBumpToman },
                    { label: t('finance_ad_revenue_auto_bump'), value: state.adRevenue.autoBumpPackageToman },
                  ].map((row) => (
                    <div key={row.label} className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">{row.label}</p>
                      <p className="mt-1 text-lg font-semibold">{formatLocalizedCurrency(row.value, locale, t)}</p>
                    </div>
                  ))}
                </div>
                {state.adRevenue.items.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t('finance_ad_revenue_empty')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('finance_ad_col_type')}</TableHead>
                          <TableHead>{t('finance_ad_col_amount')}</TableHead>
                          <TableHead>{t('finance_ad_col_teacher')}</TableHead>
                          <TableHead>{t('finance_ad_col_date')}</TableHead>
                          <TableHead>{t('finance_col_reference')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.adRevenue.items.slice(0, 50).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.revenueType}</TableCell>
                            <TableCell>{formatLocalizedCurrency(item.amountToman, locale, t)}</TableCell>
                            <TableCell>#{item.teacherId}</TableCell>
                            <TableCell>{new Date(item.occurredAtUtc).toLocaleString(locale)}</TableCell>
                            <TableCell>{item.paymentReference || t('not_available')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{t('finance_ad_revenue_empty')}</p>
            )}
          </CardContent>
        </Card>
      )}

      {(view === 'overview' || view === 'invoices') && (
        <Card>
          <CardHeader>
            <CardTitle>{t('finance_recent_invoices')}</CardTitle>
            <CardDescription>{t('finance_recent_invoices_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {view === 'invoices' && (
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('finance_search_invoices')}
                className="max-w-md"
              />
            )}
            <InvoicesTable invoices={view === 'overview' ? state.invoices.slice(0, 8) : filteredInvoices} loading={loading} />
          </CardContent>
        </Card>
      )}

      {(view === 'overview' || view === 'payments') && (
        <Card>
          <CardHeader>
            <CardTitle>{t('finance_recent_payments')}</CardTitle>
            <CardDescription>{t('finance_recent_payments_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {view === 'payments' && (
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('finance_search_payments')}
                className="max-w-md"
              />
            )}
            <PaymentsTable payments={view === 'overview' ? state.payments.slice(0, 8) : filteredPayments} loading={loading} />
          </CardContent>
        </Card>
      )}
    </div>
  );

  function InvoicesTable({ invoices, loading: tableLoading }: { invoices: AdminInvoice[]; loading: boolean }) {
    if (tableLoading) return <Skeleton className="h-48 w-full" />;
    if (invoices.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">{t('finance_no_invoices')}</p>;

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('finance_col_invoice')}</TableHead>
              <TableHead>{t('finance_col_student')}</TableHead>
              <TableHead>{t('finance_col_date')}</TableHead>
              <TableHead>{t('finance_col_total')}</TableHead>
              <TableHead>{t('finance_col_paid')}</TableHead>
              <TableHead>{t('finance_col_remaining')}</TableHead>
              <TableHead>{t('finance_col_status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber || `#${invoice.id}`}</TableCell>
                <TableCell>
                  <div className="font-medium">{invoice.studentName || t('unknown')}</div>
                  <div className="text-xs text-muted-foreground">{invoice.studentEmail}</div>
                </TableCell>
                <TableCell>{invoice.invoiceDate}</TableCell>
                <TableCell>{formatLocalizedCurrency(invoice.totalAmount, locale, t)}</TableCell>
                <TableCell>{formatLocalizedCurrency(invoice.paidAmount, locale, t)}</TableCell>
                <TableCell>{formatLocalizedCurrency(invoice.remainingAmount, locale, t)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(invoice.status)}>{invoice.status || t('unknown')}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  function PaymentsTable({ payments, loading: tableLoading }: { payments: AdminPayment[]; loading: boolean }) {
    if (tableLoading) return <Skeleton className="h-48 w-full" />;
    if (payments.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">{t('finance_no_payments')}</p>;

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('finance_col_transaction')}</TableHead>
              <TableHead>{t('finance_col_invoice')}</TableHead>
              <TableHead>{t('finance_col_student')}</TableHead>
              <TableHead>{t('finance_col_date')}</TableHead>
              <TableHead>{t('finance_col_amount')}</TableHead>
              <TableHead>{t('finance_col_reference')}</TableHead>
              <TableHead>{t('finance_col_status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.transactionNumber || `#${payment.id}`}</TableCell>
                <TableCell>{payment.invoiceNumber || (payment.invoiceId ? `#${payment.invoiceId}` : t('not_available'))}</TableCell>
                <TableCell>
                  <div className="font-medium">{payment.studentName || t('unknown')}</div>
                  <div className="text-xs text-muted-foreground">{payment.studentEmail}</div>
                </TableCell>
                <TableCell>{payment.transactionDate}</TableCell>
                <TableCell>{formatLocalizedCurrency(payment.amount, locale, t)}</TableCell>
                <TableCell>{payment.referenceNumber || t('not_available')}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(payment.status)}>{payment.status || t('unknown')}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
}

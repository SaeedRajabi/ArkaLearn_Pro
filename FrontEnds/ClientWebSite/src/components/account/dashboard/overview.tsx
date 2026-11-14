'use client';

import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';
import { getMyInvoices, type InvoiceListItem } from '@/lib/api/invoices';
import { Skeleton } from '@/components/ui/skeleton';
import { getInvoiceStatusColor, getInvoiceStatusText, normalizeInvoiceStatus } from '@/lib/utils/invoice-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InvoiceDetailClient } from '@/components/invoice-detail-client';

const ITEMS_PER_PAGE = 5;

export function Overview({ dict, enrolledCoursesCount }: { dict: Dictionary; enrolledCoursesCount: number }) {
  const { dir, locale } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isRtl = dir === 'rtl';
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const invoiceRows = await getMyInvoices();

        if (cancelled) return;
        setInvoices(invoiceRows);
      } catch {
        if (!cancelled) {
          setLoadError(t('dashboard.overview.loadFailed', 'We could not load your dashboard data.'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshInvoices = async () => {
    try {
      const invoiceRows = await getMyInvoices();
      setInvoices(invoiceRows);
    } catch {
      /* keep current list */
    }
  };

  const paginatedPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return invoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, invoices]);

  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { dateStyle: 'medium' }).format(date);
  };

  const formatMoney = (value: number) =>
    new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
      maximumFractionDigits: 0,
    }).format(value);

  const renderInvoiceAction = (invoice: InvoiceListItem) => {
    const isIssued = normalizeInvoiceStatus(invoice.status) === 'ISSUED';
    return (
      <Button
        size="sm"
        variant={isIssued ? 'default' : 'outline'}
        onClick={() => setSelectedInvoiceId(invoice.id)}
        className="w-full sm:w-auto"
      >
        {isIssued ? <CreditCard className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} /> : <Eye className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />}
        {isIssued ? t('dashboard.invoices.pay', 'Pay') : t('dashboard.invoices.view', 'View')}
      </Button>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.overview.latestPurchases', 'Latest Purchases')}</CardTitle>
          <CardDescription>{t('dashboard.overview.latestPurchasesDesc', 'A history of your recent course and seminar purchases.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {loadError}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : paginatedPurchases.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {t('dashboard.purchases.empty', 'No purchases have been recorded yet.')}
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {paginatedPurchases.map((invoice) => (
                  <div key={invoice.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{invoice.invoiceNumber}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(invoice.invoiceDate)}</p>
                      </div>
                      <Badge variant={getInvoiceStatusColor(invoice.status)}>
                        {getInvoiceStatusText(invoice.status, locale)}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="font-semibold">{formatMoney(invoice.totalAmount)}</span>
                      {renderInvoiceAction(invoice)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">{t('dashboard.purchases.item', 'Item')}</TableHead>
                      <TableHead className="text-start">{t('dashboard.purchases.date', 'Date')}</TableHead>
                      <TableHead className="text-start">{t('dashboard.purchases.status', 'Status')}</TableHead>
                      <TableHead className="text-end">{t('dashboard.purchases.price', 'Price')}</TableHead>
                      <TableHead className="text-end">{t('dashboard.purchases.action', 'Action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPurchases.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium text-start">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="text-start">{formatDate(invoice.invoiceDate)}</TableCell>
                        <TableCell className="text-start">
                          <Badge variant={getInvoiceStatusColor(invoice.status)}>
                            {getInvoiceStatusText(invoice.status, locale)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">{formatMoney(invoice.totalAmount)}</TableCell>
                        <TableCell className="text-end">{renderInvoiceAction(invoice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    aria-disabled={currentPage === 1}
                    className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink isActive={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    aria-disabled={currentPage === totalPages}
                    className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>

      <Dialog open={!!selectedInvoiceId} onOpenChange={(open) => !open && setSelectedInvoiceId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="sr-only">{t('dashboard.invoices.detailTitle', 'Invoice details')}</DialogTitle>
          </DialogHeader>
          {selectedInvoiceId && (
            <InvoiceDetailClient
              invoiceId={selectedInvoiceId}
              isModal
              onPaid={() => {
                void refreshInvoices();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, CreditCard, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMyInvoices, type InvoiceListItem } from '@/lib/api/invoices';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { InvoiceDetailClient } from '@/components/invoice-detail-client';
import { getInvoiceStatusText, getInvoiceStatusColor, normalizeInvoiceStatus } from '@/lib/utils/invoice-utils';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

export function Invoices({ dict }: { dict: Dictionary }) {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const { locale, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await getMyInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchInvoices();
  }, [fetchInvoices]);

  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { dateStyle: 'medium' }).format(date);
  };
  const formatMoney = (value: number) =>
    new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { maximumFractionDigits: 0 }).format(value);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('dashboard.invoices.title', 'لیست فاکتورها')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.invoices.subtitle', 'تاریخچه سفارشات و فاکتورهای شما')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('dashboard.invoices.empty', 'هیچ فاکتوری یافت نشد.')}
            </div>
          ) : (
            <>
            <div className="space-y-3 md:hidden">
              {invoices.map((invoice) => {
                const isIssued = normalizeInvoiceStatus(invoice.status) === 'ISSUED';
                return (
                  <div
                    key={invoice.id}
                    className="rounded-lg border p-4"
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{invoice.invoiceNumber}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(invoice.invoiceDate)}</p>
                      </div>
                      <Badge variant={getInvoiceStatusColor(invoice.status)}>
                        {getInvoiceStatusText(invoice.status, locale)}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between">
                      <span className="font-semibold">{formatMoney(invoice.totalAmount)}</span>
                      <Button 
                        size="sm" 
                        variant={isIssued ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoiceId(invoice.id);
                        }}
                      >
                        {isIssued ? <CreditCard className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} /> : <Eye className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />}
                        {isIssued ? t('dashboard.invoices.pay', 'Pay') : t('dashboard.invoices.view', 'View')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t('dashboard.invoices.invoiceNumber', 'Invoice number')}</TableHead>
                    <TableHead className="text-start">{t('dashboard.invoices.date', 'Date')}</TableHead>
                    <TableHead className="text-start">{t('dashboard.invoices.status', 'Status')}</TableHead>
                    <TableHead className="text-end">{t('dashboard.invoices.amount', 'Amount')}</TableHead>
                    <TableHead className="text-end">{t('dashboard.invoices.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const isIssued = normalizeInvoiceStatus(invoice.status) === 'ISSUED';
                    return (
                    <TableRow 
                      key={invoice.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                    >
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell>
                        <Badge variant={getInvoiceStatusColor(invoice.status)}>
                          {getInvoiceStatusText(invoice.status, locale)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">{formatMoney(invoice.totalAmount)}</TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {isIssued ? (
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedInvoiceId(invoice.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CreditCard className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                              {t('dashboard.invoices.pay', 'Pay')}
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedInvoiceId(invoice.id)}
                            >
                              <Eye className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
                              {t('dashboard.invoices.view', 'View')}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedInvoiceId} onOpenChange={(open) => !open && setSelectedInvoiceId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="sr-only">{t('dashboard.invoices.detailTitle', 'Invoice details')}</DialogTitle>
          </DialogHeader>
          {selectedInvoiceId && (
            <InvoiceDetailClient
              invoiceId={selectedInvoiceId}
              isModal
              onPaid={() => {
                void fetchInvoices();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

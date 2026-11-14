'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { SeminarPaymentTransaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';
import { formatLocalizedCurrency, getSeminarPaymentStatusLabel } from '@/lib/utils/localized-ui';

interface PaymentHistoryDialogProps {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  transactions: SeminarPaymentTransaction[];
  studentName: string;
  formatDateAction: (dateString: string) => string;
  onAddPaymentAction: () => void;
  canAddPayment: boolean;
}

export function PaymentHistoryDialog({
  isOpen,
  onOpenChangeAction,
  transactions,
  studentName,
  formatDateAction,
  onAddPaymentAction,
  canAddPayment,
}: PaymentHistoryDialogProps) {
  const { t, locale } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const formatDate = formatDateAction;
  const onAddPayment = onAddPaymentAction;
  const formatCurrency = (amount: number) => {
    return formatLocalizedCurrency(amount, locale, t);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('payment_history_title', { name: studentName })}</DialogTitle>
          <DialogDescription>
            {t('payment_history_description')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('comment_table_col_date')}</TableHead>
                <TableHead>{t('orders_table_col_amount')}</TableHead>
                <TableHead>{t('comment_table_col_status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === 'Completed' ? 'success' : 'destructive'
                        }
                      >
                        {getSeminarPaymentStatusLabel(payment.status, t)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    {t('payment_history_empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          {canAddPayment && (
            <Button onClick={onAddPayment}>{t('payment_history_add_payment')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

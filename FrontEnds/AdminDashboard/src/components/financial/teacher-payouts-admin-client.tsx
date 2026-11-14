'use client';

import * as React from 'react';
import { Banknote, Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { formatLocalizedCurrency, formatLocalizedNumber } from '@/lib/utils/localized-ui';
import {
  backfillTeacherCourseSales,
  getTeacherPayoutQueue,
  processTeacherPayout,
  type AdminTeacherPayout,
  type BackfillTeacherCourseSalesResult,
} from '@/services/teacher-finance-admin-service';

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'success' | 'outline' {
  const normalized = status.toLowerCase();
  if (['paid', 'approved'].includes(normalized)) return 'success';
  if (normalized === 'rejected') return 'destructive';
  if (normalized === 'pending') return 'secondary';
  return 'outline';
}

function formatUtcDate(value: string | null | undefined, locale: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function TeacherPayoutsAdminClient() {
  const { t, locale } = useLanguage();
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);
  const [backfilling, setBackfilling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<'pending' | 'all'>('pending');
  const [payouts, setPayouts] = React.useState<AdminTeacherPayout[]>([]);
  const [backfillResult, setBackfillResult] = React.useState<BackfillTeacherCourseSalesResult | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<AdminTeacherPayout | null>(null);
  const [dialogAction, setDialogAction] = React.useState<'approve' | 'reject'>('approve');
  const [transferReference, setTransferReference] = React.useState('');
  const [adminNote, setAdminNote] = React.useState('');

  const loadPayouts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getTeacherPayoutQueue({
        status: statusFilter === 'pending' ? 'pending' : undefined,
        take: 100,
      });
      setPayouts(rows);
    } catch (err) {
      console.error(err);
      setError(t('teacher_payouts_load_failed'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  React.useEffect(() => {
    void loadPayouts();
  }, [loadPayouts]);

  const openDialog = (row: AdminTeacherPayout, action: 'approve' | 'reject') => {
    setSelected(row);
    setDialogAction(action);
    setTransferReference('');
    setAdminNote('');
    setDialogOpen(true);
  };

  const handleProcess = async () => {
    if (!selected) return;
    if (dialogAction === 'approve' && !transferReference.trim()) {
      toast({ variant: 'destructive', title: t('teacher_payouts_transfer_required') });
      return;
    }

    setProcessing(true);
    try {
      await processTeacherPayout({
        payoutId: selected.id,
        action: dialogAction,
        transferReference: transferReference.trim() || undefined,
        adminNote: adminNote.trim() || undefined,
      });
      toast({
        title:
          dialogAction === 'approve'
            ? t('teacher_payouts_approved_toast')
            : t('teacher_payouts_rejected_toast'),
      });
      setDialogOpen(false);
      await loadPayouts();
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: t('teacher_payouts_process_failed') });
    } finally {
      setProcessing(false);
    }
  };

  const handleBackfill = async () => {
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const result = await backfillTeacherCourseSales();
      setBackfillResult(result);
      toast({ title: t('teacher_payouts_backfill_done') });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: t('teacher_payouts_backfill_failed') });
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('teacher_payouts_title')}</h1>
          <p className="text-muted-foreground">{t('teacher_payouts_description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadPayouts()} disabled={loading}>
            <RefreshCw className="me-2 h-4 w-4" />
            {t('teacher_payouts_refresh')}
          </Button>
          <Button variant="secondary" onClick={() => void handleBackfill()} disabled={backfilling}>
            {backfilling ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Banknote className="me-2 h-4 w-4" />}
            {t('teacher_payouts_backfill')}
          </Button>
        </div>
      </div>

      {backfillResult ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('teacher_payouts_backfill_result')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <span className="text-muted-foreground">{t('teacher_payouts_backfill_total_invoices')}: </span>
              {formatLocalizedNumber(backfillResult.totalPaidInvoices, locale)}
            </div>
            <div>
              <span className="text-muted-foreground">{t('teacher_payouts_backfill_credited')}: </span>
              {formatLocalizedNumber(backfillResult.invoicesCredited, locale)}
            </div>
            <div>
              <span className="text-muted-foreground">{t('teacher_payouts_backfill_new_sales')}: </span>
              {formatLocalizedNumber(backfillResult.newSalesCount, locale)}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('teacher_payouts_queue_title')}</CardTitle>
            <CardDescription>{t('teacher_payouts_queue_desc')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
            >
              {t('teacher_payouts_filter_pending')}
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
            >
              {t('teacher_payouts_filter_all')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          ) : payouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('teacher_payouts_empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('teacher_payouts_col_teacher')}</TableHead>
                  <TableHead>{t('teacher_payouts_col_amount')}</TableHead>
                  <TableHead>{t('teacher_payouts_col_requested')}</TableHead>
                  <TableHead>{t('finance_col_status')}</TableHead>
                  <TableHead>{t('teacher_payouts_col_note')}</TableHead>
                  <TableHead className="text-end">{t('teacher_payouts_col_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.teacherName}</div>
                      <div className="text-xs text-muted-foreground">{row.teacherEmail || `#${row.teacherId}`}</div>
                    </TableCell>
                    <TableCell>{formatLocalizedCurrency(row.amountToman, locale, t)}</TableCell>
                    <TableCell>{formatUtcDate(row.requestedAtUtc, locale)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {row.teacherNote || '—'}
                    </TableCell>
                    <TableCell className="text-end">
                      {row.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => openDialog(row, 'approve')}>
                            {t('teacher_payouts_approve')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openDialog(row, 'reject')}>
                            {t('teacher_payouts_reject')}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {row.transferReference || row.adminNote || '—'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'approve'
                ? t('teacher_payouts_approve_title')
                : t('teacher_payouts_reject_title')}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.teacherName} — ${formatLocalizedCurrency(selected.amountToman, locale, t)}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {dialogAction === 'approve' ? (
            <div className="space-y-2">
              <Label htmlFor="transfer-ref">{t('teacher_payouts_transfer_ref')}</Label>
              <Input
                id="transfer-ref"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                placeholder={t('teacher_payouts_transfer_ref_placeholder')}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="admin-note">{t('teacher_payouts_admin_note')}</Label>
            <Textarea
              id="admin-note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={t('teacher_payouts_admin_note_placeholder')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processing}>
              {t('cancel_button')}
            </Button>
            <Button onClick={() => void handleProcess()} disabled={processing}>
              {processing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {dialogAction === 'approve' ? t('teacher_payouts_approve') : t('teacher_payouts_reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

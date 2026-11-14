'use client';

import * as React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/components/language-provider';
import {
  deleteRemoteAssistHistory,
  getRemoteAssistHistory,
  type RemoteAssistHistoryPage,
  type RemoteAssistSession,
} from '@/services/remote-assist-api.service';

type Props = {
  studentUserId?: number | string | null;
  teacherUserId?: number | string | null;
  pageSize?: number;
  refreshKey?: number;
};

type PendingAction =
  | { type: 'one'; session: RemoteAssistSession }
  | { type: 'all' }
  | null;

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fa-IR');
}

function statusLabel(status: string | undefined, t: (key: string) => string) {
  const value = (status || '').trim().toLowerCase();
  switch (value) {
    case 'active':
      return t('remote_assist_status_active');
    case 'ended':
      return t('remote_assist_status_ended');
    case 'pending':
      return t('remote_assist_status_pending');
    case 'awaitingconsent':
      return t('remote_assist_status_awaiting_consent');
    case 'denied':
    case 'rejected':
      return t('remote_assist_status_denied');
    case 'expired':
      return t('remote_assist_status_expired');
    default:
      return status || '—';
  }
}

export function RemoteAssistHistoryTable({
  studentUserId,
  teacherUserId,
  pageSize = 20,
  refreshKey = 0,
}: Props) {
  const { t } = useLanguage();
  const [pageNumber, setPageNumber] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [pending, setPending] = React.useState<PendingAction>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<RemoteAssistHistoryPage>({
    pageNumber: 1,
    pageSize,
    totalCount: 0,
    items: [],
  });

  React.useEffect(() => {
    setPageNumber(1);
  }, [studentUserId, teacherUserId, refreshKey]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await getRemoteAssistHistory({
        studentUserId,
        teacherUserId,
        pageNumber,
        pageSize,
      });
      setData(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('remote_assist_history_failed'));
      setData({ pageNumber, pageSize, totalCount: 0, items: [] });
    } finally {
      setLoading(false);
    }
  }, [studentUserId, teacherUserId, pageNumber, pageSize, t]);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const confirmPending = async () => {
    if (!pending || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (pending.type === 'one') {
        await deleteRemoteAssistHistory({ sessionId: pending.session.sessionIdKey || pending.session.sessionId });
      } else {
        await deleteRemoteAssistHistory({ studentUserId, teacherUserId });
        setPageNumber(1);
      }
      setPending(null);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : pending.type === 'one'
            ? t('remote_assist_delete_failed')
            : t('remote_assist_clear_failed')
      );
      await load();
    } finally {
      setBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.totalCount || 0) / (data.pageSize || pageSize)));

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{t('remote_assist_history_title')}</CardTitle>
            <CardDescription>{t('remote_assist_history_description')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || data.totalCount <= 0 || busy}
              onClick={() => setPending({ type: 'all' })}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('remote_assist_clear_all')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t('remote_assist_status')}</TableHead>
                  <TableHead>{t('remote_assist_student')}</TableHead>
                  <TableHead>{t('remote_assist_helper')}</TableHead>
                  <TableHead>{t('remote_assist_created')}</TableHead>
                  <TableHead>{t('remote_assist_ended')}</TableHead>
                  <TableHead className="w-[1%] whitespace-nowrap">{t('remote_assist_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {t('remote_assist_history_empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((row) => (
                    <TableRow key={row.sessionIdKey || row.sessionId}>
                      <TableCell className="font-mono text-xs">{row.sessionIdKey || row.sessionId}</TableCell>
                      <TableCell>{statusLabel(row.status, t)}</TableCell>
                      <TableCell>{row.requesterDisplayName || row.requesterUserId || '—'}</TableCell>
                      <TableCell>{row.helperDisplayName || row.acceptedByTeacherUserId || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{formatDate(row.createdAtUtc)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{formatDate(row.endedAtUtc)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => setPending({ type: 'one', session: row })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {data.totalCount} · {t('remote_assist_page')} {data.pageNumber} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNumber <= 1 || loading}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              >
                {t('remote_assist_prev')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNumber >= totalPages || loading}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                {t('remote_assist_next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={pending != null} onOpenChange={(open) => !open && !busy && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.type === 'all' ? t('remote_assist_clear_all') : t('remote_assist_actions')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.type === 'all'
                ? t('remote_assist_clear_confirm')
                : t('remote_assist_delete_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('remote_assist_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmPending();
              }}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('remote_assist_confirm_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

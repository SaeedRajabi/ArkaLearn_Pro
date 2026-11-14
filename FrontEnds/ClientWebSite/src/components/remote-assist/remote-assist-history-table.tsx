'use client';

import * as React from 'react';
import { LogIn, Loader2, Trash2 } from 'lucide-react';
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
import {
  deleteRemoteAssistHistory,
  getRemoteAssistHistory,
  requestRemoteAssistReconnect,
  type RemoteAssistHistoryPage,
  type RemoteAssistSession,
  type RemoteAssistSessionAccepted,
} from '@/lib/api/remote-assist';
import { ApiError, getUserFacingApiErrorMessage } from '@/lib/api/client';
import { useRemoteAssistHub } from '@/hooks/use-remote-assist-hub';

type Props = {
  title?: string;
  description?: string;
  studentUserId?: number | string | null;
  teacherUserId?: number | string | null;
  pageSize?: number;
  refreshKey?: number;
  emptyLabel?: string;
  userId?: number | string | null;
  onReconnect?: (
    accepted: RemoteAssistSessionAccepted,
    session: RemoteAssistSession
  ) => void;
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

function statusFa(status?: string | null) {
  const value = (status || '').trim().toLowerCase();
  switch (value) {
    case 'active':
      return 'فعال';
    case 'ended':
      return 'پایان‌یافته';
    case 'pending':
      return 'در انتظار';
    case 'awaitingconsent':
      return 'در انتظار تأیید';
    case 'denied':
    case 'rejected':
      return 'رد شده';
    case 'expired':
      return 'منقضی';
    default:
      return status || '—';
  }
}

export function RemoteAssistHistoryTable({
  title = 'تاریخچه نشست‌ها',
  description = 'نشست‌های اخیر کمک از راه دور.',
  studentUserId,
  teacherUserId,
  pageSize = 20,
  refreshKey = 0,
  emptyLabel = 'نشستی یافت نشد.',
  userId,
  onReconnect,
}: Props) {
  const [pageNumber, setPageNumber] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [reconnectingId, setReconnectingId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<PendingAction>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [onlineOverrides, setOnlineOverrides] = React.useState<Record<string, boolean>>({});
  const [data, setData] = React.useState<RemoteAssistHistoryPage>({
    pageNumber: 1,
    pageSize,
    totalCount: 0,
    items: [],
  });

  useRemoteAssistHub({
    enabled: !!userId && !!onReconnect,
    userId,
    joinTeacherPool: !!onReconnect,
    handlers: {
      onUserPresenceChanged: ({ userId: changedUserId, isOnline }) => {
        setOnlineOverrides((current) => ({
          ...current,
          [String(changedUserId)]: isOnline,
        }));
      },
    },
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
      setError(getUserFacingApiErrorMessage(err, 'بارگذاری تاریخچه ناموفق بود.'));
      setData({ pageNumber, pageSize, totalCount: 0, items: [] });
    } finally {
      setLoading(false);
    }
  }, [studentUserId, teacherUserId, pageNumber, pageSize]);

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
        getUserFacingApiErrorMessage(
          err,
          pending.type === 'one' ? 'حذف نشست ناموفق بود.' : 'حذف تاریخچه ناموفق بود.'
        )
      );
      if (err instanceof ApiError && err.status === 404) {
        // stale row — refresh list
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const reconnect = async (row: RemoteAssistSession) => {
    if (!onReconnect || reconnectingId) return;
    const rowId = row.sessionIdKey || String(row.sessionId);
    setReconnectingId(rowId);
    setError(null);
    try {
      const accepted = await requestRemoteAssistReconnect(row.requesterUserId);
      onReconnect(accepted, row);
      await load();
    } catch (err) {
      setError(getUserFacingApiErrorMessage(err, 'ورود دوباره به نشست ناموفق بود.'));
    } finally {
      setReconnectingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.totalCount || 0) / (data.pageSize || pageSize)));

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
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
              <Trash2 className="me-2 h-4 w-4" />
              حذف همه
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شناسه</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>دانشجو</TableHead>
                  <TableHead>کمک‌کننده</TableHead>
                  <TableHead>ایجاد</TableHead>
                  <TableHead>پایان</TableHead>
                  <TableHead className="w-[1%] whitespace-nowrap">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {emptyLabel}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((row) => {
                    const rowId = row.sessionIdKey || String(row.sessionId);
                    const isOnline =
                      onlineOverrides[String(row.requesterUserId)] ?? row.isRequesterOnline;
                    const isReconnecting = reconnectingId === rowId;
                    return (
                      <TableRow key={rowId}>
                        <TableCell className="font-mono text-xs">
                          {row.sessionIdKey || row.sessionId}
                        </TableCell>
                        <TableCell>{statusFa(row.status)}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                isOnline ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                              title={isOnline ? 'آنلاین' : 'آفلاین'}
                              aria-label={isOnline ? 'آنلاین' : 'آفلاین'}
                            />
                            {row.requesterDisplayName || row.requesterUserId || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {row.helperDisplayName || row.acceptedByTeacherUserId || '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatDate(row.createdAtUtc)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatDate(row.endedAtUtc)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {onReconnect ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!isOnline || !!reconnectingId || busy}
                                onClick={() => void reconnect(row)}
                              >
                                {isReconnecting ? (
                                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <LogIn className="me-2 h-4 w-4" />
                                )}
                                ورود به نشست
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={busy || !!reconnectingId}
                              onClick={() => setPending({ type: 'one', session: row })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {data.totalCount} مورد · صفحه {data.pageNumber} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNumber <= 1 || loading}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              >
                قبلی
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNumber >= totalPages || loading}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                بعدی
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={pending != null} onOpenChange={(open) => !open && !busy && setPending(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.type === 'all' ? 'حذف همه نشست‌ها' : 'حذف نشست از تاریخچه'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.type === 'all'
                ? 'آیا از حذف همه نشست‌های این تاریخچه مطمئن هستید؟ این عمل قابل بازگشت نیست.'
                : `آیا از حذف نشست #${pending?.type === 'one' ? pending.session.sessionIdKey || pending.session.sessionId : ''} مطمئن هستید؟`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel disabled={busy}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmPending();
              }}
            >
              {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              تأیید حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

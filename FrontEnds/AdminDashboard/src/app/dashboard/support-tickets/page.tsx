'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eye, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import {
  searchSupportTickets,
  type SearchSupportTicketItem,
} from '@/services/support-ticket-api.service';
import {
  formatTicketDate,
  statusLabel,
  ticketSourceLabel,
} from './support-ticket-display';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';
import { usePlatformSupportTicketHub } from '@/hooks/use-platform-support-ticket-hub';

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Replied' || status === 'Answered') return 'default';
  if (status === 'ViewedByAdmin') return 'secondary';
  if (status === 'Closed') return 'secondary';
  return 'outline';
}

export default function SupportTicketsPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [items, setItems] = React.useState<SearchSupportTicketItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<string>('all');
  const [ticketSource, setTicketSource] = React.useState<string>('all');
  const [department, setDepartment] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);
  const [viewingTicketId, setViewingTicketId] = React.useState<number | null>(null);

  const exportColumns = React.useMemo<TableExportColumn<SearchSupportTicketItem>[]>(
    () => [
      { header: t('support_tickets_col_code'), accessor: (row) => row.displayCode },
      { header: t('support_tickets_col_subject'), accessor: (row) => row.subject },
      { header: t('support_tickets_col_requester'), accessor: (row) => row.requesterName || '—' },
      {
        header: t('userTable_col_email'),
        accessor: (row) => row.requesterEmail || '—',
      },
      {
        header: t('support_tickets_col_source'),
        accessor: (row) => ticketSourceLabel(row.ticketSource, t),
      },
      { header: t('support_tickets_col_status'), accessor: (row) => statusLabel(row.status, t) },
      {
        header: t('support_tickets_col_date'),
        accessor: (row) =>
          formatTicketDate(row.lastMessageAtUtc || row.createdDateTime, locale),
      },
    ],
    [t, locale]
  );

  const fetchAllTickets = React.useCallback(async () => {
    const result = await searchSupportTickets({
      inputValue: search,
      status: status === 'all' ? '' : status,
      ticketSource: ticketSource === 'all' ? '' : ticketSource,
      department: department === 'all' ? '' : department,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
      needTotalCount: true,
    });
    return result.items;
  }, [search, status, ticketSource, department, totalCount]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchSupportTickets({
        inputValue: search,
        status: status === 'all' ? '' : status,
        ticketSource: ticketSource === 'all' ? '' : ticketSource,
        department: department === 'all' ? '' : department,
        pageNumber: page,
        pageSize,
        needTotalCount: true,
      });
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch {
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, status, ticketSource, department, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [search, status, ticketSource, department, pageSize]);

  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  usePlatformSupportTicketHub({
    isAdmin: true,
    handlers: {
      onTicketOpened: () => void load(),
      onTicketStatusChanged: (payload) => {
        const data = payload as {
          ticketId?: number;
          TicketId?: number;
          status?: string;
          Status?: string;
        } | null;
        const ticketId = data?.ticketId ?? data?.TicketId;
        const status = data?.status ?? data?.Status;
        if (!ticketId || !status) {
          void load();
          return;
        }
        setItems((prev) =>
          prev.map((row) => (row.id === ticketId ? { ...row, status } : row))
        );
      },
      onMessagePosted: (payload) => {
        setItems((prev) =>
          prev.map((row) =>
            row.id === payload.ticketId ? { ...row, status: payload.status } : row
          )
        );
      },
      onNotificationPulse: () => void load(),
    },
  });

  const openTicket = (ticketId: number) => {
    setViewingTicketId(ticketId);
    router.push(`/dashboard/support-tickets/${ticketId}`);
  };

  const textAlign = locale === 'fa' ? 'right' : 'left';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">
          {t('support_tickets_title')}
        </h1>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t('support_tickets_search_placeholder')}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={ticketSource} onValueChange={setTicketSource}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder={t('support_tickets_filter_source')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('support_tickets_source_all')}</SelectItem>
            <SelectItem value="Platform">{t('support_tickets_source_platform')}</SelectItem>
            <SelectItem value="Contact">{t('support_tickets_source_contact')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder={t('support_tickets_filter_department')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('support_tickets_dept_all')}</SelectItem>
            <SelectItem value="Support">{t('support_tickets_dept_support')}</SelectItem>
            <SelectItem value="Services">{t('support_tickets_dept_services')}</SelectItem>
            <SelectItem value="Sales">{t('support_tickets_dept_sales')}</SelectItem>
            <SelectItem value="SoftwareDevelopment">{t('support_tickets_dept_software')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder={t('support_tickets_filter_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('support_tickets_status_all')}</SelectItem>
            <SelectItem value="Open">{t('support_tickets_status_open')}</SelectItem>
            <SelectItem value="Replied">{t('support_tickets_status_replied')}</SelectItem>
            <SelectItem value="UnderReview">{t('support_tickets_status_under_review')}</SelectItem>
            <SelectItem value="ViewedByAdmin">{t('support_tickets_status_viewed_by_admin')}</SelectItem>
            <SelectItem value="Answered">{t('support_tickets_status_answered')}</SelectItem>
            <SelectItem value="Closed">{t('support_tickets_status_closed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminTableShell
        title={t('support_tickets_title')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="support-tickets"
        exportTitle={t('support_tickets_title')}
        exportColumns={exportColumns}
        exportRows={items}
        fetchAllExportRows={fetchAllTickets}
        loading={loading}
        isEmpty={!loading && items.length === 0}
        emptyMessage={t('support_tickets_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead style={{ textAlign }}>{t('support_tickets_col_code')}</TableHead>
              <TableHead style={{ textAlign }}>{t('support_tickets_col_subject')}</TableHead>
              <TableHead style={{ textAlign }}>{t('support_tickets_col_requester')}</TableHead>
              <TableHead style={{ textAlign }}>{t('support_tickets_col_source')}</TableHead>
              <TableHead style={{ textAlign }}>{t('support_tickets_col_status')}</TableHead>
              <TableHead style={{ textAlign }}>{t('support_tickets_col_date')}</TableHead>
              <TableHead style={{ textAlign: locale === 'fa' ? 'left' : 'right' }}>
                {t('support_tickets_col_actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isNavigating = viewingTicketId === item.id;
              return (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{item.displayCode}</TableCell>
                  <TableCell className="font-medium max-w-[240px] truncate">{item.subject}</TableCell>
                  <TableCell>
                    <div className="text-sm">{item.requesterName || '—'}</div>
                    {item.requesterEmail && (
                      <div className="text-xs text-muted-foreground">{item.requesterEmail}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ticketSourceLabel(item.ticketSource, t)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>{statusLabel(item.status, t)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatTicketDate(item.lastMessageAtUtc || item.createdDateTime, locale)}
                  </TableCell>
                  <TableCell style={{ textAlign: locale === 'fa' ? 'left' : 'right' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isNavigating}
                      onClick={() => openTicket(item.id)}
                    >
                      {isNavigating ? (
                        <Loader2 className="h-4 w-4 me-1 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4 me-1" />
                      )}
                      {t('support_tickets_view')}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Eye } from 'lucide-react';
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
  searchProjectOrders,
  type SearchProjectOrderItem,
} from '@/services/project-order-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Approved') return 'default';
  if (status === 'Rejected') return 'destructive';
  return 'secondary';
}

export default function ProjectOrdersPage() {
  const { t, locale } = useLanguage();
  const [items, setItems] = React.useState<SearchProjectOrderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);

  const exportColumns = React.useMemo<TableExportColumn<SearchProjectOrderItem>[]>(
    () => [
      { header: '#', accessor: (row) => row.requestNumber },
      { header: t('project_orders_col_title'), accessor: (row) => row.title },
      { header: t('project_orders_col_requester'), accessor: (row) => row.requesterName || '—' },
      { header: t('userTable_col_email'), accessor: (row) => row.requesterEmail || '—' },
      { header: t('project_orders_col_phone'), accessor: (row) => row.requesterPhone || '—' },
      { header: t('project_orders_col_status'), accessor: (row) => row.status },
      { header: t('project_orders_col_date'), accessor: (row) => row.createdAt },
    ],
    [t]
  );

  const fetchAllOrders = React.useCallback(async () => {
    const result = await searchProjectOrders({
      inputValue: search,
      status: status === 'all' ? '' : status,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
      needTotalCount: true,
    });
    return result.items;
  }, [search, status, totalCount]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchProjectOrders({
        inputValue: search,
        status: status === 'all' ? '' : status,
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
  }, [search, status, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [search, status, pageSize]);

  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">
          {t('project_orders_title')}
        </h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t('project_orders_search_placeholder')}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('project_orders_filter_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('project_orders_status_all')}</SelectItem>
            <SelectItem value="Submitted">{t('project_orders_status_submitted')}</SelectItem>
            <SelectItem value="Approved">{t('project_orders_status_approved')}</SelectItem>
            <SelectItem value="Rejected">{t('project_orders_status_rejected')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminTableShell
        title={t('project_orders_title')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="project-orders"
        exportTitle={t('project_orders_title')}
        exportColumns={exportColumns}
        exportRows={items}
        fetchAllExportRows={fetchAllOrders}
        loading={loading}
        isEmpty={!loading && items.length === 0}
        emptyMessage={t('project_orders_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t('project_orders_col_title')}</TableHead>
              <TableHead>{t('project_orders_col_requester')}</TableHead>
              <TableHead>{t('project_orders_col_phone')}</TableHead>
              <TableHead>{t('project_orders_col_status')}</TableHead>
              <TableHead>{t('project_orders_col_date')}</TableHead>
              <TableHead className="text-right">{t('project_orders_col_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.requestNumber}</TableCell>
                <TableCell className="font-medium max-w-[240px] truncate">{item.title}</TableCell>
                <TableCell>
                  <div className="text-sm">{item.requesterName || '—'}</div>
                  {item.requesterEmail && (
                    <div className="text-xs text-muted-foreground">{item.requesterEmail}</div>
                  )}
                </TableCell>
                <TableCell className="text-sm font-mono">{item.requesterPhone || '—'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.createdAt}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/project-orders/${item.id}`}>
                      <Eye className="h-4 w-4 me-1" />
                      {t('project_orders_view')}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}

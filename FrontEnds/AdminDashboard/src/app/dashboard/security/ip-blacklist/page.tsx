'use client';

import * as React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { removeIPFromBlacklist, searchIPBlacklists, type IPBlacklistRow } from '@/services/security-settings-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

export default function IPBlacklistPage() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [items, setItems] = React.useState<IPBlacklistRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const textAlign = locale === 'fa' ? 'right' : 'left';

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const exportColumns = React.useMemo<TableExportColumn<IPBlacklistRow>[]>(
    () => [
      { header: t('ip_blacklist_col_ip'), accessor: (row) => row.ipAddress },
      { header: t('ip_blacklist_col_reason'), accessor: (row) => row.reason || '—' },
      {
        header: t('ip_blacklist_col_added'),
        accessor: (row) =>
          row.addedDate
            ? new Date(row.addedDate).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')
            : '—',
      },
      {
        header: t('ip_blacklist_col_type'),
        accessor: (row) => (row.isPermanent ? t('ip_blacklist_permanent') : t('ip_blacklist_temporary')),
      },
    ],
    [t, locale]
  );

  const fetchAllRows = React.useCallback(async () => {
    const res = await searchIPBlacklists({
      inputValue: debouncedSearch,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
    });
    return res.items;
  }, [debouncedSearch, totalCount]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchIPBlacklists({
        inputValue: debouncedSearch,
        pageNumber: page,
        pageSize,
      });
      setItems(res.items);
      setTotalCount(res.totalCount);
    } catch {
      setItems([]);
      setTotalCount(0);
      toast({ variant: 'destructive', title: t('ip_blacklist_load_failed') });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, t, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleRemove = async (row: IPBlacklistRow) => {
    if (!window.confirm(t('ip_blacklist_remove_confirm'))) return;
    setBusyId(row.id);
    try {
      await removeIPFromBlacklist(row.id);
      toast({ title: t('ip_blacklist_removed') });
      void load();
    } catch {
      toast({ variant: 'destructive', title: t('ip_blacklist_remove_failed') });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Input
          placeholder={t('ip_blacklist_search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AdminTableShell
        title={t('ip_blacklist_title')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="ip-blacklist"
        exportTitle={t('ip_blacklist_title')}
        exportColumns={exportColumns}
        exportRows={items}
        fetchAllExportRows={fetchAllRows}
        loading={loading}
        isEmpty={!loading && items.length === 0}
        emptyMessage={t('ip_blacklist_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ textAlign }}>{t('ip_blacklist_col_ip')}</TableHead>
              <TableHead style={{ textAlign }}>{t('ip_blacklist_col_reason')}</TableHead>
              <TableHead style={{ textAlign }}>{t('ip_blacklist_col_added')}</TableHead>
              <TableHead style={{ textAlign }}>{t('ip_blacklist_col_type')}</TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono">{row.ipAddress}</TableCell>
                <TableCell>{row.reason || '—'}</TableCell>
                <TableCell>
                  {row.addedDate
                    ? new Date(row.addedDate).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')
                    : '—'}
                </TableCell>
                <TableCell>{row.isPermanent ? t('ip_blacklist_permanent') : t('ip_blacklist_temporary')}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busyId === row.id}
                    onClick={() => void handleRemove(row)}
                  >
                    {busyId === row.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
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

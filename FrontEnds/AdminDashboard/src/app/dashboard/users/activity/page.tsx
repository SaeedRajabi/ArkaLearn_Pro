'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  searchUserActivitySubjects,
  type UserActivitySubjectRow,
} from '@/services/user-activity-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

function formatDateTime(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US');
}

export default function UserActivityReportsPage() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [navigatingKey, setNavigatingKey] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<UserActivitySubjectRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);

  const exportColumns = React.useMemo<TableExportColumn<UserActivitySubjectRow>[]>(
    () => [
      {
        header: t('user_activity_col_user'),
        accessor: (row) => (row.isAnonymous ? t('user_activity_anonymous') : row.displayName),
      },
      { header: t('user_activity_col_ip'), accessor: (row) => row.latestIpAddressV4 || '—' },
      { header: t('user_activity_col_browser'), accessor: (row) => row.latestBrowserName || '—' },
      { header: t('user_activity_col_os'), accessor: (row) => row.latestOperatingSystem || '—' },
      {
        header: t('user_activity_col_last'),
        accessor: (row) => formatDateTime(row.lastActivityAtUtc, locale),
      },
      { header: t('user_activity_col_count'), accessor: (row) => row.eventCount },
    ],
    [t, locale]
  );

  const fetchAllRows = React.useCallback(async () => {
    const result = await searchUserActivitySubjects({
      search: query,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
    });
    return result.items;
  }, [query, totalCount]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchUserActivitySubjects({ search: query, pageNumber: page, pageSize })
      .then((result) => {
        if (!cancelled) {
          setRows(result.items);
          setTotalCount(result.totalCount);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast({ title: t('user_activity_load_failed'), variant: 'destructive' });
          setRows([]);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, query, t, toast]);

  React.useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const handleViewActions = (subjectKey: string) => {
    setNavigatingKey(subjectKey);
    router.push(`/dashboard/users/activity/${encodeURIComponent(subjectKey)}`);
  };

  const textAlign = locale === 'fa' ? 'right' : 'left';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('user_activity_title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('user_activity_description')}</p>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
      >
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('user_activity_search_placeholder')}
            className="ps-9"
          />
        </div>
        <Button type="submit">{t('user_activity_search_button')}</Button>
      </form>

      <AdminTableShell
        title={t('user_activity_list_title')}
        description={t('user_activity_list_desc')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="user-activity"
        exportTitle={t('user_activity_list_title')}
        exportColumns={exportColumns}
        exportRows={rows}
        fetchAllExportRows={fetchAllRows}
        loading={loading}
        isEmpty={!loading && rows.length === 0}
        emptyMessage={t('user_activity_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead style={{ textAlign }}>{t('user_activity_col_user')}</TableHead>
              <TableHead style={{ textAlign }}>{t('user_activity_col_ip')}</TableHead>
              <TableHead style={{ textAlign }}>{t('user_activity_col_browser')}</TableHead>
              <TableHead style={{ textAlign }}>{t('user_activity_col_os')}</TableHead>
              <TableHead style={{ textAlign }}>{t('user_activity_col_last')}</TableHead>
              <TableHead style={{ textAlign }}>{t('user_activity_col_count')}</TableHead>
              <TableHead style={{ textAlign: locale === 'fa' ? 'left' : 'right' }}>
                {t('user_activity_col_actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.subjectKey} className="hover:bg-muted/30">
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {row.isAnonymous ? t('user_activity_anonymous') : row.displayName}
                    </div>
                    {row.isAnonymous ? (
                      <Badge variant="outline">{t('user_activity_anonymous_badge')}</Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{row.latestIpAddressV4 || '—'}</div>
                  {row.latestIpAddressV6 ? (
                    <div className="truncate text-xs text-muted-foreground">{row.latestIpAddressV6}</div>
                  ) : null}
                </TableCell>
                <TableCell>{row.latestBrowserName || '—'}</TableCell>
                <TableCell>{row.latestOperatingSystem || '—'}</TableCell>
                <TableCell>{formatDateTime(row.lastActivityAtUtc, locale)}</TableCell>
                <TableCell>{row.eventCount}</TableCell>
                <TableCell style={{ textAlign: locale === 'fa' ? 'left' : 'right' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={navigatingKey != null}
                    onClick={() => handleViewActions(row.subjectKey)}
                  >
                    {navigatingKey === row.subjectKey ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="me-2 h-4 w-4" />
                    )}
                    {t('user_activity_view_actions')}
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

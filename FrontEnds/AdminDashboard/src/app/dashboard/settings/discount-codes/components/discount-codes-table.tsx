'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  deactivateDiscountCode,
  searchDiscountCodes,
  type DiscountCodeRow,
  type DiscountScopeType,
} from '@/services/discount-codes-api.service';
import { Loader2 } from 'lucide-react';

type Props = {
  searchTerm: string;
  scopeType: DiscountScopeType | null;
  isActive: boolean | null;
  reloadKey: number;
};

function formatDate(value: string, locale: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US');
}

function scopeKey(scope: DiscountScopeType): string {
  switch (scope) {
    case 1:
      return 'discount_codes_scope_courses';
    case 2:
      return 'discount_codes_scope_teacher';
    case 3:
      return 'discount_codes_scope_student';
    default:
      return 'discount_codes_scope_all_courses';
  }
}

export function DiscountCodesTable({ searchTerm, scopeType, isActive, reloadKey }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [rows, setRows] = React.useState<DiscountCodeRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const textAlign = locale === 'fa' ? 'right' : 'left';

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, scopeType, isActive, pageSize]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchDiscountCodes({
        inputValue: searchTerm,
        scopeType,
        isActive,
        pageNumber: page,
        pageSize,
      });
      setRows(res.items);
      setTotalCount(res.totalCount);
    } catch {
      setRows([]);
      setTotalCount(0);
      toast({
        title: t('discount_codes_load_error_title'),
        description: t('discount_codes_load_error_desc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, scopeType, isActive, page, pageSize, t, toast]);

  React.useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const exportColumns = React.useMemo<TableExportColumn<DiscountCodeRow>[]>(
    () => [
      { header: t('discount_codes_col_code'), accessor: (row) => row.code },
      { header: t('discount_codes_col_amount'), accessor: (row) => String(row.amount) },
      { header: t('discount_codes_col_scope'), accessor: (row) => t(scopeKey(row.scopeType)) },
      {
        header: t('discount_codes_col_expires'),
        accessor: (row) => formatDate(row.expirationDate, locale),
      },
      {
        header: t('discount_codes_col_status'),
        accessor: (row) =>
          row.isExpired
            ? t('discount_codes_status_expired')
            : row.isActive
              ? t('discount_codes_status_active')
              : t('discount_codes_status_inactive'),
      },
    ],
    [t, locale]
  );

  const fetchAllRows = React.useCallback(async () => {
    const res = await searchDiscountCodes({
      inputValue: searchTerm,
      scopeType,
      isActive,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
    });
    return res.items;
  }, [searchTerm, scopeType, isActive, totalCount]);

  const handleDeactivate = async (row: DiscountCodeRow) => {
    setBusyId(row.id);
    try {
      const result = await deactivateDiscountCode(row.id);
      if (!result.ok) {
        toast({
          title: t('discount_codes_deactivate_error_title'),
          description: result.message || t('discount_codes_deactivate_error_desc'),
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: t('discount_codes_deactivate_success_title'),
        description: t('discount_codes_deactivate_success_desc'),
      });
      void load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminTableShell
      title={t('discount_codes_table_title')}
      locale={locale}
      t={t}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      exportFilenameBase="discount-codes"
      exportTitle={t('discount_codes_table_title')}
      exportColumns={exportColumns}
      exportRows={rows}
      fetchAllExportRows={fetchAllRows}
      loading={loading}
      isEmpty={!loading && rows.length === 0}
      emptyMessage={t('discount_codes_empty_desc')}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ textAlign }}>{t('discount_codes_col_code')}</TableHead>
            <TableHead style={{ textAlign }}>{t('discount_codes_col_amount')}</TableHead>
            <TableHead style={{ textAlign }}>{t('discount_codes_col_scope')}</TableHead>
            <TableHead style={{ textAlign }}>{t('discount_codes_col_usage')}</TableHead>
            <TableHead style={{ textAlign }}>{t('discount_codes_col_expires')}</TableHead>
            <TableHead style={{ textAlign }}>{t('discount_codes_col_status')}</TableHead>
            <TableHead className="w-[120px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-mono font-semibold">{row.code}</div>
                {row.title ? <div className="text-xs text-muted-foreground">{row.title}</div> : null}
              </TableCell>
              <TableCell>
                {row.discountType?.toUpperCase().includes('PERCENT')
                  ? `${row.amount}%`
                  : row.amount.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')}
              </TableCell>
              <TableCell>{t(scopeKey(row.scopeType))}</TableCell>
              <TableCell>
                {row.usedCount}
                {' / '}
                {row.usageLimit === 0 ? t('discount_codes_unlimited') : row.usageLimit}
              </TableCell>
              <TableCell>{formatDate(row.expirationDate, locale)}</TableCell>
              <TableCell>
                {row.isExpired ? (
                  <Badge variant="secondary">{t('discount_codes_status_expired')}</Badge>
                ) : row.isActive ? (
                  <Badge>{t('discount_codes_status_active')}</Badge>
                ) : (
                  <Badge variant="outline">{t('discount_codes_status_inactive')}</Badge>
                )}
              </TableCell>
              <TableCell>
                {row.isActive && !row.isExpired ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === row.id}
                    onClick={() => void handleDeactivate(row)}
                  >
                    {busyId === row.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('discount_codes_deactivate')
                    )}
                  </Button>
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminTableShell>
  );
}

'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TableExportColumn } from '@/lib/table-export';
import { AdminTableExportMenu } from './admin-table-export-menu';
import { AdminTablePagination } from './admin-table-pagination';

type AdminTableShellProps<T> = {
  title: string;
  description?: string;
  locale: 'fa' | 'en';
  t: (key: string) => string;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  exportFilenameBase: string;
  exportTitle: string;
  exportColumns: TableExportColumn<T>[];
  exportRows: T[];
  fetchAllExportRows?: () => Promise<T[]>;
  headerActions?: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  isEmpty?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function AdminTableShell<T>({
  title,
  description,
  locale,
  t,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  exportFilenameBase,
  exportTitle,
  exportColumns,
  exportRows,
  fetchAllExportRows,
  headerActions,
  loading = false,
  emptyMessage,
  isEmpty = false,
  children,
  className,
}: AdminTableShellProps<T>) {
  const isRtl = locale === 'fa';

  return (
    <Card className={cn('overflow-hidden border shadow-sm', className)}>
      <CardHeader className="border-b bg-muted/10 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerActions}
            <AdminTableExportMenu
              title={exportTitle}
              filenameBase={exportFilenameBase}
              columns={exportColumns}
              rows={exportRows}
              locale={locale}
              t={t}
              fetchAllRows={fetchAllExportRows}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <div className="flex min-h-[240px] items-center justify-center px-6 py-12 text-sm text-muted-foreground">
            {emptyMessage ?? t('table_no_records')}
          </div>
        ) : (
          <div className="overflow-x-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            {children}
          </div>
        )}
      </CardContent>

      {!loading ? (
        <AdminTablePagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          locale={locale}
          t={t}
          pageSizeOptions={pageSizeOptions}
        />
      ) : null}
    </Card>
  );
}

export type { TableExportColumn };

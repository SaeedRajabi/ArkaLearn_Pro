'use client';

import * as React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  getPageRange,
  getPageSizeOptions,
  getShowingRange,
  getTotalPages,
} from './admin-table-utils';
import { toPersianDigits , formatDigits } from '@/lib/utils/format/digits';



type AdminTablePaginationProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  locale: 'fa' | 'en';
  t: (key: string) => string;
  pageSizeOptions?: number[];
  className?: string;
};

export function AdminTablePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  locale,
  t,
  pageSizeOptions,
  className,
}: AdminTablePaginationProps) {
  const totalPages = getTotalPages(totalCount, pageSize);
  const { from, to } = getShowingRange(page, pageSize, totalCount);
  const pageRange = getPageRange(page, totalPages);
  const isRtl = locale === 'fa';

  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-t bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <p className="text-sm text-muted-foreground">
          {totalCount > 0
            ? t('table_showing_range')
                .replace('{from}', formatDigits(String(from) , isRtl ? "fa" : "en"))
                .replace('{to}', formatDigits(String(to), isRtl ? "fa" : "en"))
                .replace('{total}', formatDigits(String(totalCount), isRtl ? "fa" : "en"))
            : t('table_no_records')}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('table_rows_per_page')}</span>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-9 w-[84px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getPageSizeOptions(pageSizeOptions).map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {formatDigits(size , isRtl ? "fa" : "en")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (page > 1) onPageChange(page - 1);
              }}
              className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
            >
              {t('pagination_previous')}
            </PaginationPrevious>
          </PaginationItem>

          {pageRange.map((pageNumber, index) => {
            const prev = pageRange[index - 1];
            const needsEllipsis = prev != null && pageNumber - prev > 1;
            return (
              <React.Fragment key={pageNumber}>
                {needsEllipsis ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive={page === pageNumber}
                    onClick={(event) => {
                      event.preventDefault();
                      onPageChange(pageNumber);
                    }}
                  >
                    {formatDigits(pageNumber, isRtl ? "fa" : "en")}
                  </PaginationLink>
                </PaginationItem>
              </React.Fragment>
            );
          })}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (page < totalPages) onPageChange(page + 1);
              }}
              className={page >= totalPages ? 'pointer-events-none opacity-50' : undefined}
            >
              {t('pagination_next')}
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

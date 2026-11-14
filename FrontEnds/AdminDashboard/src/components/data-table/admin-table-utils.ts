import * as React from 'react';

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 7, 10, 15, 20, 50];

export function getPageSizeOptions(custom?: number[]): number[] {
  const merged = [...(custom ?? DEFAULT_PAGE_SIZE_OPTIONS)];
  return Array.from(new Set(merged)).sort((a, b) => a - b);
}

export function getTotalPages(totalCount: number, pageSize: number): number {
  if (totalCount <= 0) return 1;
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

export function getPageRange(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);
  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);
  if (currentPage > 2) pages.add(currentPage - 2);
  if (currentPage < totalPages - 1) pages.add(currentPage + 2);

  return Array.from(pages).sort((a, b) => a - b);
}

export function getShowingRange(
  page: number,
  pageSize: number,
  totalCount: number
): { from: number; to: number } {
  if (totalCount <= 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  return { from, to };
}

export function useAdminTablePagination(initialPageSize = 10) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);

  const setPageSize = React.useCallback((next: number) => {
    setPageSizeState(next);
    setPage(1);
  }, []);

  const resetPage = React.useCallback(() => setPage(1), []);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPage,
    skipCount: (page - 1) * pageSize,
  };
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  LayoutGrid,
  List,
  Loader2,
  Megaphone,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AdvertisementCard } from '@/components/advertisements/advertisement-card';
import { AdvertisementsLoading } from '@/components/advertisements/advertisements-loading';
import { AdvertisementsSidebar } from '@/components/advertisements/advertisements-sidebar';
import {
  searchTeacherAdvertisements,
  type TeacherAdvertisementListItem,
} from '@/lib/api/teacher-advertisements';
import { usePagination, DOTS } from '@/hooks/use-pagination';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

const PAGE_SIZE = 12;
const SIDEBAR_FETCH_SIZE = 40;

const GRID_COLUMNS: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 28 } },
};

export function AdvertisementsPageClient({ dict }: { dict: Dictionary }) {
  const pageDict = dict.advertisementsPage as Record<string, string>;
  const headerDict = (dict.header ?? {}) as Record<string, string | undefined>;
  const lang: 'en' | 'fa' = headerDict.advertisements === 'Advertisements' ? 'en' : 'fa';
  const isRtl = lang === 'fa';

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [tagQuery, setTagQuery] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [columns, setColumns] = useState(2);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<TeacherAdvertisementListItem[]>([]);
  const [sidebarItems, setSidebarItems] = useState<TeacherAdvertisementListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setTagQuery(tagFilter.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, tagFilter]);

  useEffect(() => {
    let cancelled = false;
    setSidebarLoading(true);
    void (async () => {
      try {
        const result = await searchTeacherAdvertisements({
          pageNumber: 1,
          pageSize: SIDEBAR_FETCH_SIZE,
        });
        if (!cancelled) setSidebarItems(result.items);
      } catch {
        if (!cancelled) setSidebarItems([]);
      } finally {
        if (!cancelled) setSidebarLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchTeacherAdvertisements({
        search: searchQuery || undefined,
        tag: tagQuery || undefined,
        pageNumber: currentPage,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch {
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [searchQuery, tagQuery, currentPage]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const paginationRange = usePagination({
    currentPage,
    pageSize: PAGE_SIZE,
    totalCount,
  });

  const popularTags = useMemo(() => {
    const set = new Set<string>();
    [...sidebarItems, ...items].forEach((item) => item.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set).slice(0, 14);
  }, [sidebarItems, items]);

  const showingLabel = useMemo(() => {
    if (totalCount === 0 || loading) return '';
    const from = (currentPage - 1) * PAGE_SIZE + 1;
    const to = Math.min(currentPage * PAGE_SIZE, totalCount);
    return (pageDict.showingResults || 'Showing {from}-{to} of {total}')
      .replace('{from}', String(from))
      .replace('{to}', String(to))
      .replace('{total}', String(totalCount));
  }, [currentPage, totalCount, pageDict.showingResults, loading]);

  const hasActiveFilters = Boolean(searchQuery || tagQuery);

  const clearFilters = () => {
    setSearchInput('');
    setTagFilter('');
  };

  const skeletonCount = layout === 'list' ? 5 : columns >= 3 ? 6 : 4;

  const sidebar = (
    <AdvertisementsSidebar
      items={sidebarItems}
      pageDict={pageDict}
      headerDict={headerDict}
      lang={lang}
      loading={sidebarLoading}
      className="lg:sticky lg:top-24"
    />
  );

  return (
    <motion.div
      className="space-y-7"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Hero / toolbar */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-teal-500/12 via-card to-sky-500/8 p-4 shadow-sm sm:p-6"
      >
        <div
          className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -start-10 h-48 w-48 rounded-full bg-sky-400/15 blur-3xl"
          aria-hidden
        />

        <div className="relative mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
              <Megaphone className="h-4 w-4" aria-hidden />
              {pageDict.heroEyebrow ?? (isRtl ? 'بازار تدریس و پروژه' : 'Tutoring & projects')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              {pageDict.heroHint ??
                (isRtl
                  ? 'اساتید تأییدشده را پیدا کنید، برچسب بزنید و آگهی مناسب تدریس یا پروژه را انتخاب کنید.'
                  : 'Discover verified teachers, filter by tags, and pick the right tutoring or project listing.')}
            </p>
          </div>
          {!initialLoad && totalCount > 0 ? (
            <div className="shrink-0 rounded-2xl border border-border/60 bg-background/80 px-5 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold tabular-nums text-teal-700 dark:text-teal-300">{totalCount}</p>
              <p className="text-[11px] text-muted-foreground">
                {pageDict.totalAdsLabel ?? (isRtl ? 'آگهی فعال' : 'active listings')}
              </p>
            </div>
          ) : null}
        </div>

        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
              <span>{pageDict.searchAndFilter ?? 'Search & filter'}</span>
            </div>
            {!initialLoad && totalCount > 0 ? (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-normal">
                <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" aria-hidden />
                {(pageDict.totalAds ?? '{count} advertisements').replace('{count}', String(totalCount))}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative max-w-md flex-1">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={pageDict.searchPlaceholder}
                  className="h-11 rounded-xl border-border/70 bg-background/85 ps-9 shadow-none focus-visible:ring-teal-500/30"
                />
              </div>
              <Input
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder={pageDict.filterByTag ?? 'Filter by tag...'}
                className="h-11 max-w-xs rounded-xl border-border/70 bg-background/85 shadow-none focus-visible:ring-teal-500/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {layout === 'grid' && (
                <Select value={String(columns)} onValueChange={(v) => setColumns(Number(v))}>
                  <SelectTrigger className="h-11 w-[130px] rounded-xl border-border/70 bg-background/85">
                    <SelectValue placeholder={pageDict.columns} />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {pageDict.columns} {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex rounded-xl border border-border/70 bg-background/85 p-1">
                <Button
                  type="button"
                  variant={layout === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setLayout('grid')}
                  aria-label={pageDict.viewAsGrid}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={layout === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setLayout('list')}
                  aria-label={pageDict.viewAsList}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {hasActiveFilters && !loading ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-4">
              <span className="text-xs text-muted-foreground">{pageDict.activeFilters ?? 'Active filters'}:</span>
              {searchQuery ? (
                <Badge variant="outline" className="gap-1 font-normal">
                  {searchQuery}
                </Badge>
              ) : null}
              {tagQuery ? (
                <Badge variant="outline" className="gap-1 font-normal">
                  #{tagQuery}
                </Badge>
              ) : null}
              <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                {pageDict.clearAllFilters ?? 'Clear all'}
              </Button>
            </div>
          ) : null}
        </div>
      </motion.section>

      {/* Popular tags */}
      {!loading && popularTags.length > 0 ? (
        <motion.section variants={itemVariants} className="space-y-3">
          <p className="text-sm font-medium text-foreground">{pageDict.popularTags ?? 'Popular tags'}</p>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Button
                key={tag}
                type="button"
                size="sm"
                variant={tagQuery.toLowerCase() === tag.toLowerCase() ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setTagFilter((prev) => (prev.toLowerCase() === tag.toLowerCase() ? '' : tag))}
              >
                #{tag}
              </Button>
            ))}
            {tagQuery ? (
              <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => setTagFilter('')}>
                {pageDict.clearTagFilter ?? 'Clear tag'}
              </Button>
            ) : null}
          </div>
        </motion.section>
      ) : null}

      {/* Results meta */}
      {showingLabel ? (
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{showingLabel}</p>
          {loading && !initialLoad ? (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" aria-hidden />
              {pageDict.refreshing ?? 'Updating...'}
            </span>
          ) : null}
        </motion.div>
      ) : null}

      {/* Main + physical right sidebar */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]" style={{ direction: 'ltr' }}>
        <motion.div variants={itemVariants} className="min-w-0" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          {loading ? (
            <div className="space-y-6">
              {initialLoad ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-teal-500/25 bg-teal-500/5 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-teal-600" aria-hidden />
                  <span>{pageDict.loadingSubtitle ?? pageDict.loading}</span>
                </div>
              ) : null}
              <AdvertisementsLoading layout={layout} columns={columns} count={skeletonCount} />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/20 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                <Megaphone className="h-8 w-8" aria-hidden />
              </div>
              <h2 className="font-headline text-xl font-semibold">{pageDict.emptyTitle ?? pageDict.empty}</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {hasActiveFilters
                  ? (pageDict.emptyFiltered ?? 'Try changing your search or tag filter.')
                  : (pageDict.emptyHint ?? pageDict.empty)}
              </p>
              {hasActiveFilters ? (
                <Button type="button" variant="outline" className="mt-6 rounded-xl" onClick={clearFilters}>
                  {pageDict.clearAllFilters ?? 'Clear all filters'}
                </Button>
              ) : null}
            </div>
          ) : layout === 'list' ? (
            <div className="space-y-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.28) }}
                >
                  <AdvertisementCard item={item} dict={pageDict} layout="list" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={cn('grid gap-5', GRID_COLUMNS[columns] ?? GRID_COLUMNS[2])}>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.28) }}
                >
                  <AdvertisementCard item={item} dict={pageDict} layout="grid" />
                </motion.div>
              ))}
            </div>
          )}

          {!loading && totalCount > PAGE_SIZE && (
            <Pagination className="pt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage((p) => p - 1);
                    }}
                    aria-disabled={currentPage <= 1}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {paginationRange?.map((page, idx) =>
                  page === DOTS ? (
                    <PaginationItem key={`dots-${idx}`}>
                      <span className="px-2">…</span>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(Number(page));
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage * PAGE_SIZE < totalCount) setCurrentPage((p) => p + 1);
                    }}
                    aria-disabled={currentPage * PAGE_SIZE >= totalCount}
                    className={currentPage * PAGE_SIZE >= totalCount ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          {/* Mobile: sidebar below listings so ads stay first */}
          <div className="mt-8 lg:hidden">{sidebar}</div>
        </motion.div>

        <motion.div variants={itemVariants} className="hidden lg:block" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          {sidebar}
        </motion.div>
      </div>
    </motion.div>
  );
}

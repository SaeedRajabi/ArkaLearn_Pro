'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Dictionary, ProjectListItem } from '@/types';
import { ProjectCard } from '@/components/project-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { usePagination, DOTS } from '@/hooks/use-pagination';
import { Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';

export type ProjectFacet = { name: string; count: number };

interface ProjectsPageClientProps {
  projects: ProjectListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  searchQuery: string;
  tagFilter: string;
  techFilter: string;
  tagFacets: ProjectFacet[];
  techFacets: ProjectFacet[];
  dict: Dictionary;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { y: 14, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};

export function ProjectsPageClient({
  projects,
  totalCount,
  pageNumber,
  pageSize,
  searchQuery,
  tagFilter,
  techFilter,
  tagFacets,
  techFacets,
  dict,
}: ProjectsPageClientProps) {
  const router = useRouter();
  const currentParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchQuery);
  const reduceMotion = useReducedMotion();

  const pageDict = dict.projectsPage as Record<string, string>;
  const lang: 'en' | 'fa' = (dict.header as { projects?: string }).projects === 'Projects' ? 'en' : 'fa';
  const isRtl = lang === 'fa';

  const hasFilters = Boolean(searchQuery || tagFilter || techFilter);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginationRange = usePagination({
    totalCount,
    pageSize,
    currentPage: pageNumber,
    siblingCount: 1,
  });

  /** Builds a /projects URL from the current params with the given mutation. */
  const buildUrl = useCallback(
    (mutate: (sp: URLSearchParams) => void, resetPage = true) => {
      const sp = new URLSearchParams(currentParams?.toString() ?? '');
      mutate(sp);
      if (resetPage) sp.delete('page');
      const qs = sp.toString();
      return qs ? `/projects?${qs}` : '/projects';
    },
    [currentParams]
  );

  const applySearch = useCallback(
    (value: string) => {
      router.replace(
        buildUrl((sp) => {
          if (value) sp.set('q', value);
          else sp.delete('q');
        }),
        { scroll: false }
      );
    },
    [buildUrl, router]
  );

  const toggleTag = useCallback(
    (name: string) => {
      router.push(
        buildUrl((sp) => {
          if (tagFilter === name) sp.delete('tag');
          else sp.set('tag', name);
        })
      );
    },
    [buildUrl, router, tagFilter]
  );

  const toggleTech = useCallback(
    (name: string) => {
      router.push(
        buildUrl((sp) => {
          if (techFilter === name) sp.delete('tech');
          else sp.set('tech', name);
        })
      );
    },
    [buildUrl, router, techFilter]
  );

  const clearAll = useCallback(() => {
    router.replace(
      buildUrl((sp) => {
        sp.delete('q');
        sp.delete('tag');
        sp.delete('tech');
      })
    );
  }, [buildUrl, router]);

  const goToPage = useCallback(
    (target: number) => {
      const clamped = Math.min(Math.max(1, target), totalPages);
      router.push(buildUrl((sp) => sp.set('page', String(clamped)), false));
    },
    [buildUrl, router, totalPages]
  );

  // Debounced, URL-synced search box.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput.trim() !== searchQuery) applySearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Keep the input in sync when the URL changes (back/forward, clear-all).
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const facetChip = (
    label: string,
    count: number,
    active: boolean,
    onClick: () => void,
    key?: string
  ) => (
    <button
      key={key ?? label}
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25'
          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground'
      )}
    >
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-px text-[10px] leading-4 tabular-nums',
          active ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {count}
      </span>
    </button>
  );

  const activeChip = (label: string, onRemove: () => void, key: string) => (
    <span
      key={key}
      className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label="remove filter"
        className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );

  const filtersPanel = (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={pageDict.searchPlaceholder}
          className="h-11 rounded-xl ps-10 pe-9"
        />
        {searchInput ? (
          <button
            type="button"
            onClick={() => setSearchInput('')}
            aria-label="clear search"
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="border-t pt-4">
        <p className="mb-3 text-sm font-semibold">{pageDict.filterByTag}</p>
        <div className="flex flex-wrap gap-2">
          {tagFacets.length > 0 ? (
            tagFacets.map((facet) =>
              facetChip(facet.name, facet.count, facet.name === tagFilter, () => toggleTag(facet.name))
            )
          ) : (
            <p className="text-xs text-muted-foreground">{pageDict.noResults}</p>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="mb-3 text-sm font-semibold">{pageDict.filterByTechnology}</p>
        <div className="flex flex-wrap gap-2">
          {techFacets.length > 0 ? (
            techFacets.map((facet) =>
              facetChip(facet.name, facet.count, facet.name === techFilter, () => toggleTech(facet.name))
            )
          ) : (
            <p className="text-xs text-muted-foreground">{pageDict.noResults}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="grid gap-8 lg:grid-cols-[290px_minmax(0,1fr)]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                {pageDict.filters}
              </p>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {pageDict.clearFilters}
                </button>
              ) : null}
            </div>
            <div className="p-4">{filtersPanel}</div>
          </div>
        </aside>

        {/* Results column */}
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {pageDict.showingResults.replace('{count}', String(totalCount))}
            </p>
            <div className="flex items-center gap-2">
              {hasFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="hidden rounded-full lg:inline-flex"
                >
                  <X className="me-1 h-3.5 w-3.5" />
                  {pageDict.clearFilters}
                </Button>
              ) : null}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="default" size="sm" className="gap-2 lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    {pageDict.filters}
                  </Button>
                </SheetTrigger>
                <SheetContent side={isRtl ? 'left' : 'right'} className="w-[92vw] overflow-y-auto sm:w-[420px]">
                  <SheetHeader>
                    <SheetTitle>{pageDict.filters}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-2 space-y-5 px-4 pb-8">{filtersPanel}</div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {hasFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              {searchQuery ? activeChip(`“${searchQuery}”`, () => applySearch(''), 'q') : null}
              {tagFilter ? activeChip(tagFilter, () => toggleTag(tagFilter), 'tag') : null}
              {techFilter ? activeChip(techFilter, () => toggleTech(techFilter), 'tech') : null}
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${searchQuery}-${tagFilter}-${techFilter}-${pageNumber}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {projects.length > 0 ? (
                <motion.div
                  className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {projects.map((project) => (
                    <motion.div key={String(project.id)} variants={itemVariants as Variants}>
                      <ProjectCard project={project} dict={dict} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-card/60 py-16 text-center">
                  <SearchX className="mx-auto mb-4 h-10 w-10 text-muted-foreground/60" />
                  <p className="text-muted-foreground">{pageDict.noResults}</p>
                  {hasFilters ? (
                    <Button variant="outline" size="sm" className="mt-4" onClick={clearAll}>
                      <X className="me-1 h-4 w-4" />
                      {pageDict.clearFilters}
                    </Button>
                  ) : null}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {totalCount > pageSize ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => goToPage(pageNumber - 1)}
                    className={pageNumber <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {(paginationRange ?? []).map((item, idx) =>
                  item === DOTS ? (
                    <PaginationItem key={`dots-${idx}`}>
                      <span className="px-2 text-muted-foreground">…</span>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink isActive={item === pageNumber} onClick={() => goToPage(Number(item))}>
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => goToPage(pageNumber + 1)}
                    className={pageNumber >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      </div>
    </div>
  );
}

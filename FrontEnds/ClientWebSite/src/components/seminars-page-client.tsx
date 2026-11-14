
'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type {SeminarListItem, Dictionary, Seminar} from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LayoutGrid, List, Search, X, SlidersHorizontal } from 'lucide-react';
import { SeminarCard } from '@/components/seminar-card';
import { usePagination, DOTS } from '@/hooks/use-pagination';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'motion/react';
import { SeminarListItem as SL } from "./seminar-list-item";

interface SeminarsPageClientProps {
  seminars: SeminarListItem[];
  dict: Dictionary;
}

const SEMINARS_PER_PAGE = 6;

const SeminarCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
    <Skeleton className="aspect-video w-full" />
    <div className="flex-grow space-y-3 p-4">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="flex items-center justify-between p-4 pt-0">
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

const SeminarListItemSkeleton = () => (
    <div className="flex flex-col gap-6 overflow-hidden rounded-lg border bg-card p-6 text-card-foreground shadow-sm md:flex-row">
      <Skeleton className="shrink-0 aspect-video md:w-1/3" />
      <div className="flex w-full flex-col space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-end justify-between pt-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>
    </div>
  );
  

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { y: 14, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};

export function SeminarsPageClient({ seminars, dict }: SeminarsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>('all');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [paginatedSeminars, setPaginatedSeminars] = useState<SeminarListItem[]>([]);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const pageDict:any = dict.seminarsPage;
  const lang:'en'|'fa' = (dict as any).header.seminars === 'Seminars' ? 'en' : 'fa';

  const categories = useMemo(() => ['all', ...Array.from(new Set(seminars.map((c) => c.roomTitle).filter(Boolean)))], [seminars]);

  const filteredSeminars = useMemo(() => {
    return seminars
      .filter((seminar) => seminar.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((seminar) => categoryFilter === 'all' || seminar.roomTitle === categoryFilter);
  }, [seminars, searchQuery, categoryFilter]);

  useEffect(() => setCurrentPage(1), [searchQuery, categoryFilter, layout]);

  useEffect(() => {
    setIsLoading(true);
    const handler = setTimeout(() => {
      const first = (currentPage - 1) * SEMINARS_PER_PAGE;
      const last = first + SEMINARS_PER_PAGE;
      setPaginatedSeminars(filteredSeminars.slice(first, last));
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(handler);
  }, [currentPage, filteredSeminars]);

  const totalPages = Math.max(1, Math.ceil(filteredSeminars.length / SEMINARS_PER_PAGE));

  const paginationRange = usePagination({
    currentPage,
    totalCount: filteredSeminars.length,
    siblingCount: 1,
    pageSize: SEMINARS_PER_PAGE,
  });

  const scrollToTopOfList = useCallback(() => {
    const el = listContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, []);

  useEffect(() => {
    if (!isLoading) scrollToTopOfList();
  }, [isLoading, currentPage, scrollToTopOfList]);

  const handlePageChange = (page: number | string) => {
    if (typeof page === 'string') return;
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const handlePrevious = () => handlePageChange(currentPage - 1);
  const handleNext = () => handlePageChange(currentPage + 1);

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setCurrentPage(1);
  };

  const listClass = cn(layout === 'grid' ? 'grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-6');

  const renderSkeletons = () =>
    Array.from({ length: SEMINARS_PER_PAGE }).map((_, index) =>
      layout === 'grid' ? <SeminarCardSkeleton key={index} /> : <SeminarListItemSkeleton key={index} />
    );

  const CategoryFilters = ({ inSheet = false }: { inSheet?: boolean }) => (
    <div className={cn(
        "flex gap-2",
        inSheet ? 'flex-col' : 'flex-wrap items-center justify-center'
    )}>
        {categories.map((category) => (
            <Button
                key={category}
                variant={categoryFilter === category ? 'default' : 'outline'}
                onClick={() => {
                  setCategoryFilter(category);
                  if (inSheet) {
                    // find the sheet trigger and click it to close
                    const trigger = document.querySelector('[aria-controls="radix-:R1mqcr:"][aria-expanded="true"]');
                    if (trigger instanceof HTMLElement) {
                      trigger.click();
                    }
                  }
                }}
                className={cn(inSheet && 'w-full')}
            >
                {category === 'all' ? (pageDict as any).allCategories : category}
            </Button>
        ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div ref={listContainerRef} className="rounded-xl border bg-card p-4 shadow-sm scroll-mt-24 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:right-3 rtl:left-auto" />
            <Input
              placeholder={pageDict.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rtl:pr-10 h-11"
            />
          </div>

          <div className="hidden sm:block">
              <CategoryFilters />
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
                {pageDict.showingResults.replace('{count}', filteredSeminars.length.toString())}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-md border">
                <Button
                  type="button"
                  variant={layout === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setLayout('grid')}
                  aria-label={pageDict.viewAsGrid}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={layout === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setLayout('list')}
                  aria-label={pageDict.viewAsList}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

               <Sheet>
                <SheetTrigger asChild>
                  <Button variant="default" size="sm" className="gap-2 sm:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    {lang === 'en' ? 'Filters' : 'فیلترها'}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[92vw] sm:w-[420px]">
                  <SheetHeader>
                    <SheetTitle>{lang === 'en' ? 'Filters' : 'فیلترها'}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-6">
                    <div>
                      <h3 className="mb-4 text-sm font-medium">{pageDict.filterByCategory}</h3>
                      <CategoryFilters inSheet />
                    </div>
                     <Button onClick={handleClearFilters} variant="outline" className="w-full">
                        <X className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        {pageDict.clearFilters}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

            </div>
          </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={layout}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {isLoading ? (
            <div className={listClass}>{renderSkeletons()}</div>
          ) : (
            <motion.div className={listClass} variants={containerVariants} initial="hidden" animate="visible">
              {paginatedSeminars.length > 0 ? (
                paginatedSeminars.map((seminar) => (
                  <motion.div key={seminar.id} variants={itemVariants as Variants}>
                    {layout === 'grid' ? <SeminarCard seminar={seminar} dict={dict} /> : <SL seminar={seminar} dict={dict} />}
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No seminars found matching your criteria.</p>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {filteredSeminars.length > SEMINARS_PER_PAGE && (
        <div className="pt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={handlePrevious} disabled={currentPage === 1 || isLoading}>
                  {pageDict.previous}
                </PaginationPrevious>
              </PaginationItem>

              {paginationRange?.map((pageNumber, index) => {
                if (pageNumber === DOTS) {
                  return (
                    <PaginationItem key={`dots-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={`page-${pageNumber}`}>
                    <PaginationLink
                      isActive={currentPage === pageNumber}
                      onClick={() => handlePageChange(pageNumber as number)}
                      disabled={isLoading}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext onClick={handleNext} disabled={currentPage === totalPages || isLoading}>
                  {pageDict.next}
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

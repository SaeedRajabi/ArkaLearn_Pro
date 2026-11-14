'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { CourseListItem, Dictionary } from '@/types';
import type { CategoryTreeItem } from '@/lib/api/categories';
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
import { SlidersHorizontal } from 'lucide-react';
import { CourseCard } from '@/components/course-card';
import { CourseListItem as CL } from '@/components/course-list-item';
import { CoursesStoreHero } from '@/components/features/courses/courses-store-hero';
import { CoursesStoreFilters } from '@/components/features/courses/courses-store-filters';
import { CoursesStoreToolbar } from '@/components/features/courses/courses-store-toolbar';
import {
  collectCourseParentCategories,
  getCategoryBranchIds,
} from '@/lib/category-browse';
import { computeCourseDiscountPercent } from '@/lib/utils/course-price';
import { usePagination, DOTS } from '@/hooks/use-pagination';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';

interface CoursesPageClientProps {
  courses: CourseListItem[];
  categoryTree: CategoryTreeItem[];
  dict: Dictionary;
}

const COURSES_PER_PAGE = 9;

function courseLevelToKey(level?: string): string {
  if (!level) return level ?? '';
  const l = level.toLowerCase();
  if (l.includes('adv') || l.includes('پیشرفته')) return 'advanced';
  if (l.includes('inter') || l.includes('میان')) return 'intermediate';
  if (l.includes('intro') || l.includes('مقدم')) return 'introductory';
  return level;
}

const CourseCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
    <Skeleton className="aspect-[16/10] w-full" />
    <div className="flex-grow space-y-3 p-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
};

export function CoursesPageClient({ courses, categoryTree, dict }: CoursesPageClientProps) {
  const pageDict: Record<string, string> = (dict.coursesPage ?? {}) as Record<string, string>;
  const lang = (dict.header as { courses?: string }).courses === 'Courses' ? 'en' : 'fa';
  const levelLabels = (dict.levels ?? {}) as Record<string, string>;

  const parentCategories = useMemo(
    () =>
      collectCourseParentCategories(categoryTree).map((node) => ({
        id: node.id,
        name: node.name,
      })),
    [categoryTree]
  );

  const availableLevels = useMemo(() => {
    const keys = new Set<string>();
    for (const course of courses) {
      const key = courseLevelToKey(course.courseLevel);
      if (key) keys.add(key);
    }
    return Array.from(keys);
  }, [courses]);

  const priceCeiling = useMemo(() => {
    const max = courses.reduce((acc, c) => Math.max(acc, c.price ?? 0, c.originalPrice ?? 0), 0);
    return Math.max(max, 1_000_000);
  }, [courses]);

  const [searchQuery, setSearchQuery] = useState('');
  const [parentFilter, setParentFilter] = useState<number | 'all'>('all');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(priceCeiling);
  const [discountedOnly, setDiscountedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'popular'>('popular');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [paginatedCourses, setPaginatedCourses] = useState<CourseListItem[]>([]);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMaxPrice(priceCeiling);
  }, [priceCeiling]);

  const parentBranchIds = useMemo(() => {
    if (parentFilter === 'all') return null;
    return new Set(getCategoryBranchIds(categoryTree, parentFilter));
  }, [categoryTree, parentFilter]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = courses.filter((course) => {
      if (q) {
        const haystack = [
          course.title,
          course.shortDescription,
          course.categoryName,
          course.teacherName,
          ...(course.categoryPath ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (parentBranchIds) {
        const catId = course.categoryId;
        if (catId == null || !parentBranchIds.has(catId)) return false;
      }

      if (selectedLevels.length > 0) {
        const key = courseLevelToKey(course.courseLevel);
        if (!selectedLevels.includes(key)) return false;
      }

      const price = course.price ?? 0;
      if (price > maxPrice) return false;

      if (discountedOnly) {
        const pct = computeCourseDiscountPercent(price, course.originalPrice);
        if (!pct) return false;
      }

      return true;
    });

    if (sortOrder === 'popular') {
      filtered = [...filtered].sort((a, b) => (b.studentCount ?? 0) - (a.studentCount ?? 0));
    } else {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.createAt || 0).getTime() - new Date(a.createAt || 0).getTime()
      );
    }

    return filtered;
  }, [
    courses,
    searchQuery,
    parentBranchIds,
    selectedLevels,
    maxPrice,
    discountedOnly,
    sortOrder,
  ]);

  const specialOffer = useMemo(() => {
    return (
      courses.find((c) => {
        const pct = computeCourseDiscountPercent(c.price ?? 0, c.originalPrice);
        return pct != null && pct > 0;
      }) ?? null
    );
  }, [courses]);

  useEffect(() => setCurrentPage(1), [
    searchQuery,
    parentFilter,
    selectedLevels,
    maxPrice,
    discountedOnly,
    sortOrder,
    layout,
  ]);

  useEffect(() => {
    setIsLoading(true);
    const handler = setTimeout(() => {
      const first = (currentPage - 1) * COURSES_PER_PAGE;
      setPaginatedCourses(filteredCourses.slice(first, first + COURSES_PER_PAGE));
      setIsLoading(false);
    }, 180);
    return () => clearTimeout(handler);
  }, [currentPage, filteredCourses]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / COURSES_PER_PAGE));
  const paginationRange = usePagination({
    currentPage,
    totalCount: filteredCourses.length,
    siblingCount: 1,
    pageSize: COURSES_PER_PAGE,
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

  const handleClearAll = () => {
    setSearchQuery('');
    setParentFilter('all');
    setSelectedLevels([]);
    setMaxPrice(priceCeiling);
    setDiscountedOnly(false);
    setSortOrder('popular');
    setCurrentPage(1);
  };

  const handleToggleLevel = (level: string, checked: boolean) => {
    setSelectedLevels((prev) =>
      checked ? [...prev, level] : prev.filter((item) => item !== level)
    );
  };

  const listClass = cn(
    layout === 'grid'
      ? 'grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3'
      : 'space-y-4'
  );

  const filtersProps = {
    dict: pageDict as {
      filtersTitle?: string;
      clearAll?: string;
      categoriesTitle?: string;
      allCategories?: string;
      levelTitle?: string;
      maxPriceTitle?: string;
      freeLabel?: string;
      discountedOnly?: string;
    },
    levelLabels,
    parentCategories,
    selectedParentId: parentFilter,
    onSelectParent: setParentFilter,
    availableLevels,
    selectedLevels,
    onToggleLevel: handleToggleLevel,
    maxPrice,
    priceCeiling,
    onMaxPriceChange: setMaxPrice,
    discountedOnly,
    onDiscountedOnlyChange: setDiscountedOnly,
    onClearAll: handleClearAll,
    lang: lang as 'en' | 'fa',
  };

  return (
    <div className="space-y-8">
      <CoursesStoreHero
        dict={pageDict}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        parentCategories={parentCategories}
        selectedParentId={parentFilter}
        onSelectParent={setParentFilter}
        totalCount={courses.length}
        filteredCount={filteredCourses.length}
        specialOffer={specialOffer}
        lang={lang}
      />

      <div ref={listContainerRef} className="scroll-mt-24 space-y-5">
        <div className="lg:hidden">
          <CoursesStoreToolbar
            dict={pageDict}
            filteredCount={filteredCourses.length}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            layout={layout}
            onLayoutChange={setLayout}
            lang={lang}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <div className="hidden lg:block">
            <CoursesStoreFilters {...filtersProps} className="sticky top-24" />
          </div>

          <div className="space-y-5">
            <div className="hidden lg:block">
              <CoursesStoreToolbar
                dict={pageDict}
                filteredCount={filteredCourses.length}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                layout={layout}
                onLayoutChange={setLayout}
                lang={lang}
              />
            </div>

            <div className="flex justify-end lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                    <SlidersHorizontal className="h-4 w-4" />
                    {pageDict.filtersTitle ?? (lang === 'en' ? 'Filters' : 'فیلترها')}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[92vw] overflow-y-auto sm:w-[420px]">
                  <SheetHeader>
                    <SheetTitle>{pageDict.filtersTitle ?? (lang === 'en' ? 'Filters' : 'فیلترها')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <CoursesStoreFilters {...filtersProps} className="border-0 p-0 shadow-none" />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={layout}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isLoading ? (
                  <div className={listClass}>
                    {Array.from({ length: COURSES_PER_PAGE }).map((_, index) => (
                      <CourseCardSkeleton key={index} />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    className={listClass}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {paginatedCourses.length > 0 ? (
                      paginatedCourses.map((course) => (
                        <motion.div key={course.id} variants={itemVariants as Variants}>
                          {layout === 'grid' ? (
                            <CourseCard course={course} dict={dict} compact />
                          ) : (
                            <CL course={course} dict={dict} />
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <p className="col-span-full py-10 text-center text-muted-foreground">
                        {pageDict.noResults ??
                          (lang === 'en'
                            ? 'No courses found matching your criteria.'
                            : 'دوره‌ای با این فیلترها پیدا نشد.')}
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {filteredCourses.length > COURSES_PER_PAGE ? (
              <div className="pt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                      >
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
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                      >
                        {pageDict.next}
                      </PaginationNext>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

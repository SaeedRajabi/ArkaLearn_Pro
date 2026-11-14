'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchSoftware, type SoftwareListItem } from '@/lib/api/software';
import type { CategoryTreeItem } from '@/lib/api/categories';
import { flattenCategoryTree } from '@/lib/api/categories';
import type { Dictionary } from '@/types';
import { SoftwareCard } from '@/components/software-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Layers, Loader2, Search, Sparkles, X } from 'lucide-react';
import { buildCategoryBrowseUrl } from '@/lib/nav-content-sections';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

function CategoryNavItem({
  children,
  active,
  href,
  onClick,
  className,
  compact,
}: {
  children: ReactNode;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const itemClassName = cn(
    'block text-start text-sm font-medium transition-all duration-200',
    compact
      ? 'w-auto max-w-[240px] shrink-0 truncate whitespace-nowrap rounded-full border px-4 py-2'
      : 'w-full max-w-full whitespace-normal break-words rounded-xl border px-4 py-3.5 leading-relaxed',
    active
      ? 'border-primary/25 bg-primary text-primary-foreground shadow-sm'
      : 'border-transparent bg-transparent text-foreground/85 hover:border-border hover:bg-muted/70 hover:text-foreground',
    className
  );

  if (href) {
    return (
      <Link href={href} className={itemClassName} title={typeof children === 'string' ? children : undefined}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={itemClassName}>
      {children}
    </button>
  );
}

interface SoftwarePageClientProps {
  dict: Dictionary;
  categories?: CategoryTreeItem[];
  initialTag?: string;
  initialSearch?: string;
  initialCategoryId?: number;
}

export function SoftwarePageClient({
  dict,
  categories = [],
  initialTag,
  initialSearch,
  initialCategoryId,
}: SoftwarePageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagFromUrl = searchParams.get('tag') ?? initialTag ?? '';
  const searchFromUrl = searchParams.get('search') ?? initialSearch ?? '';
  const categoryFromUrl = Number(searchParams.get('categoryId') ?? initialCategoryId ?? 0) || undefined;
  const pageFromUrl = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const lang = (dict.header as { software?: string }).software === 'Software' ? 'en' : 'fa';
  const isRtl = lang === 'fa';
  const pageDict = (dict.softwarePage ?? {}) as Record<string, string>;
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [items, setItems] = useState<SoftwareListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const flatCategories = useMemo(() => flattenCategoryTree(categories), [categories]);
  const activeCategory = flatCategories.find((c) => c.id === categoryFromUrl);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasActiveFilters = Boolean(activeCategory || tagFromUrl || searchFromUrl);

  const pushFilters = useCallback(
    (next: { search?: string; tag?: string; categoryId?: number; page?: number }) => {
      const params = new URLSearchParams();
      const search = next.search ?? searchFromUrl;
      const tag = next.tag ?? tagFromUrl;
      const categoryId = next.categoryId ?? categoryFromUrl;
      const page = next.page ?? 1;
      if (search.trim()) params.set('search', search.trim());
      if (tag.trim()) params.set('tag', tag.trim());
      if (categoryId) params.set('categoryId', String(categoryId));
      if (page > 1) params.set('page', String(page));
      const qs = params.toString();
      router.push(qs ? `/software?${qs}` : '/software');
    },
    [categoryFromUrl, router, searchFromUrl, tagFromUrl]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchSoftware({
      search: searchFromUrl.trim() || undefined,
      tag: tagFromUrl.trim() || undefined,
      categoryId: categoryFromUrl,
      pageNumber: pageFromUrl,
      pageSize: PAGE_SIZE,
    })
      .then((result) => {
        if (!cancelled) {
          setItems(result.queryResult);
          setTotalCount(result.totalCount);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchFromUrl, tagFromUrl, categoryFromUrl, pageFromUrl]);

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-violet-500/5 p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              {pageDict.heroEyebrow ?? (lang === 'fa' ? 'ابزارهای آموزشی' : 'Educational tools')}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              {pageDict.heroHint ??
                (lang === 'fa'
                  ? 'نرم‌افزارهای منتشرشده توسط پلتفرم و اساتید را مرور و دانلود کنید.'
                  : 'Browse and download software published by the platform and teachers.')}
            </p>
          </div>
          {!loading ? (
            <div className="rounded-2xl border bg-background/80 px-5 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold tabular-nums text-primary">{totalCount}</p>
              <p className="text-xs text-muted-foreground">
                {pageDict.resultsCount ?? (lang === 'fa' ? 'نرم‌افزار' : 'items')}
              </p>
            </div>
          ) : null}
        </div>

        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            pushFilters({ search: searchInput, page: 1 });
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                pageDict.searchPlaceholder ?? (lang === 'fa' ? 'جستجوی نرم‌افزار...' : 'Search software...')
              }
              className="h-12 rounded-xl bg-background/90 ps-9"
            />
          </div>
          <Button type="submit" className="h-12 rounded-xl px-8">
            {pageDict.search ?? (lang === 'fa' ? 'جستجو' : 'Search')}
          </Button>
        </form>
      </section>

      <div
        className={cn(
          'grid gap-8 lg:gap-10',
          // Keep sidebar physically on the right in both LTR and RTL (Persian).
          flatCategories.length > 0 && 'lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]'
        )}
        style={flatCategories.length > 0 ? { direction: 'ltr' } : undefined}
      >
        <div
          className="min-w-0 space-y-6 lg:order-1"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          {flatCategories.length > 0 ? (
            <div className="lg:hidden">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Layers className="h-4 w-4 shrink-0 text-primary" />
                {pageDict.browseByCategory ?? (lang === 'fa' ? 'دسته‌بندی‌ها' : 'Categories')}
              </p>
              <div className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <CategoryNavItem
                  active={!categoryFromUrl}
                  onClick={() => pushFilters({ categoryId: undefined, page: 1 })}
                  compact
                >
                  {pageDict.allCategories ?? (lang === 'fa' ? 'همه' : 'All')}
                </CategoryNavItem>
                {flatCategories.slice(0, 18).map((cat) => (
                  <CategoryNavItem
                    key={cat.id}
                    active={categoryFromUrl === cat.id}
                    href={buildCategoryBrowseUrl('software', cat.id)}
                    compact
                  >
                    {cat.categoryName}
                  </CategoryNavItem>
                ))}
              </div>
            </div>
          ) : null}
          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-muted/20 px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground">
                {pageDict.activeFilters ?? (lang === 'fa' ? 'فیلترهای فعال' : 'Active filters')}:
              </span>
              {activeCategory ? (
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  <Layers className="h-3.5 w-3.5" />
                  {activeCategory.categoryName}
                  <button
                    type="button"
                    onClick={() => pushFilters({ categoryId: undefined, page: 1 })}
                    aria-label="Clear category"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
              {tagFromUrl ? (
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  #{tagFromUrl}
                  <button type="button" onClick={() => pushFilters({ tag: '', page: 1 })} aria-label="Clear tag">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
              {searchFromUrl ? (
                <Badge variant="outline" className="gap-1 px-3 py-1">
                  {searchFromUrl}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      pushFilters({ search: '', page: 1 });
                    }}
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  setSearchInput('');
                  pushFilters({ search: '', tag: '', categoryId: undefined, page: 1 });
                }}
              >
                {pageDict.clearAllFilters ?? (lang === 'fa' ? 'پاک کردن همه' : 'Clear all')}
              </Button>
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-20 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                {pageDict.empty ?? (lang === 'fa' ? 'نرم‌افزاری یافت نشد.' : 'No software found.')}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <SoftwareCard key={item.id} software={item} dict={dict} />
              ))}
            </div>
          )}

          {!loading && totalPages > 1 ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pageFromUrl > 1) pushFilters({ page: pageFromUrl - 1 });
                    }}
                    className={pageFromUrl <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={page === pageFromUrl}
                      onClick={(e) => {
                        e.preventDefault();
                        pushFilters({ page });
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pageFromUrl < totalPages) pushFilters({ page: pageFromUrl + 1 });
                    }}
                    className={pageFromUrl >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>

        {flatCategories.length > 0 ? (
          <aside
            className="hidden h-fit w-full min-w-0 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm lg:sticky lg:top-24 lg:order-2 lg:block lg:w-[300px] xl:w-[320px]"
            style={{ direction: isRtl ? 'rtl' : 'ltr' }}
          >
            <div className="mb-4 flex items-center gap-2.5 border-b border-border/60 pb-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight">
                  {pageDict.browseByCategory ?? (lang === 'fa' ? 'دسته‌بندی‌ها' : 'Categories')}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {lang === 'fa' ? `${Math.min(flatCategories.length, 18)} دسته` : `${Math.min(flatCategories.length, 18)} topics`}
                </p>
              </div>
            </div>
            <nav className="flex max-h-[min(75vh,680px)] w-full min-w-0 flex-col gap-3 overflow-y-auto pe-1">
              <CategoryNavItem
                active={!categoryFromUrl}
                onClick={() => pushFilters({ categoryId: undefined, page: 1 })}
              >
                {pageDict.allCategories ?? (lang === 'fa' ? 'همه' : 'All')}
              </CategoryNavItem>
              {flatCategories.slice(0, 18).map((cat) => (
                <CategoryNavItem
                  key={cat.id}
                  active={categoryFromUrl === cat.id}
                  href={buildCategoryBrowseUrl('software', cat.id)}
                >
                  {cat.categoryName}
                </CategoryNavItem>
              ))}
            </nav>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

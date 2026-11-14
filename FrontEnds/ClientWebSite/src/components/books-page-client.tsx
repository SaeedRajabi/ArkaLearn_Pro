'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import type { TeacherBookListItem } from '@/lib/api/books';
import type { CategoryTreeItem } from '@/lib/api/categories';
import { flattenCategoryTree } from '@/lib/api/categories';
import type { Dictionary } from '@/types';
import { BookCard } from '@/components/book-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { BookMarked, Hash, Layers, Search, Sparkles, X } from 'lucide-react';
import { mergeUniqueTags } from '@/lib/seo/tag-utils';
import { buildCategoryBrowseUrl } from '@/lib/nav-content-sections';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const } },
};

interface BooksPageClientProps {
  books: TeacherBookListItem[];
  dict: Dictionary;
  categories?: CategoryTreeItem[];
  initialTag?: string;
  initialSearch?: string;
  initialCategoryId?: number;
}

export function BooksPageClient({
  books,
  dict,
  categories = [],
  initialTag,
  initialSearch,
  initialCategoryId,
}: BooksPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagFromUrl = searchParams.get('tag') ?? initialTag ?? '';
  const searchFromUrl = searchParams.get('search') ?? initialSearch ?? '';
  const categoryFromUrl = Number(searchParams.get('categoryId') ?? initialCategoryId ?? 0) || undefined;
  const lang = (dict.header as { books?: string }).books === 'Books' ? 'en' : 'fa';
  const pageDict = (dict.booksPage ?? {}) as Record<string, string>;
  const isRtl = lang === 'fa';
  const [searchInput, setSearchInput] = useState(searchFromUrl);

  const flatCategories = useMemo(() => flattenCategoryTree(categories), [categories]);
  const activeCategory = flatCategories.find((c) => c.id === categoryFromUrl);

  const allTags = useMemo(() => mergeUniqueTags(...books.map((b) => b.tags)), [books]);

  const publishers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const book of books) {
      const name = book.publisher?.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [books]);

  const filteredBooks = useMemo(() => {
    let result = books;
    if (categoryFromUrl) {
      result = result.filter((b) => b.categoryId === categoryFromUrl);
    }
    if (tagFromUrl.trim()) {
      const norm = tagFromUrl.trim().toLowerCase();
      result = result.filter((b) => b.tags.some((t) => t.trim().toLowerCase() === norm));
    }
    if (searchFromUrl.trim()) {
      const q = searchFromUrl.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.shortDescription.toLowerCase().includes(q) ||
          b.publisher?.toLowerCase().includes(q) ||
          b.teacherDisplayName?.toLowerCase().includes(q) ||
          b.categoryName?.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [books, tagFromUrl, searchFromUrl, categoryFromUrl]);

  const hasActiveFilters = Boolean(activeCategory || tagFromUrl || searchFromUrl);
  const showSidebar = flatCategories.length > 0 || allTags.length > 0 || publishers.length > 0;

  const pushFilters = (next: { search?: string; tag?: string; categoryId?: number }) => {
    const params = new URLSearchParams();
    const search = next.search !== undefined ? next.search : searchFromUrl;
    const tag = next.tag !== undefined ? next.tag : tagFromUrl;
    const categoryId = next.categoryId !== undefined ? next.categoryId : categoryFromUrl;
    if (search.trim()) params.set('search', search.trim());
    if (tag.trim()) params.set('tag', tag.trim());
    if (categoryId) params.set('categoryId', String(categoryId));
    const qs = params.toString();
    router.push(qs ? `/books?${qs}` : '/books');
  };

  const applySearch = (event: React.FormEvent) => {
    event.preventDefault();
    pushFilters({ search: searchInput });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    pushFilters({ search: '', tag: '', categoryId: undefined });
  };

  const sidebar = showSidebar ? (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <BookMarked className="h-4 w-4 text-primary" />
            {pageDict.resultsCount ?? (isRtl ? 'نتایج' : 'Results')}
          </p>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary">
            {filteredBooks.length}
          </span>
        </div>
        {hasActiveFilters ? (
          <Button type="button" size="sm" variant="ghost" className="h-8 w-full justify-start text-xs" onClick={clearAllFilters}>
            <X className="me-1.5 h-3.5 w-3.5" />
            {pageDict.clearAllFilters ?? (isRtl ? 'پاک کردن فیلترها' : 'Clear filters')}
          </Button>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {pageDict.sidebarHint ??
              (isRtl
                ? 'با دسته‌بندی و برچسب‌ها، کتاب و جزوه مناسب را سریع‌تر پیدا کنید.'
                : 'Use categories and tags to find books faster.')}
          </p>
        )}
      </div>

      {flatCategories.length > 0 ? (
        <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Layers className="h-4 w-4 text-primary" />
            {pageDict.categories ?? (isRtl ? 'دسته‌بندی‌ها' : 'Categories')}
          </p>
          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pe-1">
            <button
              type="button"
              onClick={() => pushFilters({ categoryId: undefined })}
              className={cn(
                'rounded-lg px-3 py-2 text-start text-sm transition-colors',
                !categoryFromUrl ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              {pageDict.allCategories ?? (isRtl ? 'همه' : 'All')}
            </button>
            {flatCategories.slice(0, 20).map((cat) => (
              <Link
                key={cat.id}
                href={buildCategoryBrowseUrl('books', cat.id)}
                className={cn(
                  'rounded-lg px-3 py-2 text-start text-sm transition-colors',
                  categoryFromUrl === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              >
                {cat.categoryName}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {allTags.length > 0 ? (
        <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Hash className="h-4 w-4 text-primary" />
            {pageDict.tags ?? (isRtl ? 'برچسب‌ها' : 'Tags')}
          </p>
          <div className="flex max-h-64 flex-wrap gap-1.5 overflow-y-auto pe-1">
            {allTags.slice(0, 28).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => pushFilters({ tag: tagFromUrl === tag ? '' : tag })}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs transition-colors',
                  tagFromUrl === tag
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/40 hover:bg-muted'
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {publishers.length > 0 ? (
        <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold">
            {pageDict.publishers ?? (isRtl ? 'ناشران پرتکرار' : 'Top publishers')}
          </p>
          <ul className="space-y-2">
            {publishers.map((item) => (
              <li key={item.name}>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput(item.name);
                    pushFilters({ search: item.name });
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-start text-sm hover:bg-muted"
                >
                  <span className="line-clamp-1">{item.name}</span>
                  <span className="tabular-nums text-xs text-muted-foreground">{item.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  ) : null;

  return (
    <motion.div
      className="container mx-auto px-4 py-10 md:py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <motion.section
        variants={itemVariants}
        className="mb-8 overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-emerald-500/5 p-5 md:p-7"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              {pageDict.heroEyebrow ?? (isRtl ? 'کتابخانه آموزشی' : 'Learning library')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              {pageDict.heroHint ??
                (isRtl
                  ? 'کتاب‌ها و جزوات منتشرشده توسط اساتید را جستجو و فیلتر کنید.'
                  : 'Search and filter books and notes published by teachers.')}
            </p>
          </div>
          <div className="rounded-2xl border bg-background/80 px-5 py-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold tabular-nums text-primary">{books.length}</p>
            <p className="text-xs text-muted-foreground">
              {pageDict.totalBooks ?? (isRtl ? 'عنوان منتشرشده' : 'published titles')}
            </p>
          </div>
        </div>

        <form onSubmit={applySearch} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                pageDict.searchPlaceholder ?? (isRtl ? 'جستجو در عنوان، نویسنده، ناشر…' : 'Search title, author, publisher…')
              }
              className="h-11 rounded-xl bg-background/90 ps-10"
            />
          </div>
          <Button type="submit" className="h-11 rounded-xl px-7">
            {pageDict.search ?? (isRtl ? 'جستجو' : 'Search')}
          </Button>
        </form>
      </motion.section>

      {hasActiveFilters ? (
        <motion.div variants={itemVariants} className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border bg-muted/20 px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">
            {pageDict.activeFilters ?? (isRtl ? 'فیلترهای فعال' : 'Active filters')}:
          </span>
          {activeCategory ? (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {activeCategory.categoryName}
              <button type="button" aria-label="Clear category" onClick={() => pushFilters({ categoryId: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ) : null}
          {tagFromUrl ? (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              #{tagFromUrl}
              <button type="button" aria-label="Clear tag" onClick={() => pushFilters({ tag: '' })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ) : null}
          {searchFromUrl ? (
            <Badge variant="outline" className="gap-1 px-3 py-1">
              {searchFromUrl}
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput('');
                  pushFilters({ search: '' });
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ) : null}
        </motion.div>
      ) : null}

      {/* Mobile: compact chips (desktop uses sticky right sidebar) */}
      {showSidebar ? (
        <motion.div variants={itemVariants} className="mb-6 space-y-4 lg:hidden">
          {flatCategories.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold">{pageDict.categories ?? (isRtl ? 'دسته‌بندی' : 'Categories')}</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Button
                  type="button"
                  size="sm"
                  variant={!categoryFromUrl ? 'default' : 'outline'}
                  className="shrink-0"
                  onClick={() => pushFilters({ categoryId: undefined })}
                >
                  {pageDict.allCategories ?? (isRtl ? 'همه' : 'All')}
                </Button>
                {flatCategories.slice(0, 12).map((cat) => (
                  <Button key={cat.id} type="button" size="sm" variant={categoryFromUrl === cat.id ? 'default' : 'outline'} className="shrink-0" asChild>
                    <Link href={buildCategoryBrowseUrl('books', cat.id)}>{cat.categoryName}</Link>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {allTags.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold">{pageDict.tags ?? (isRtl ? 'برچسب‌ها' : 'Tags')}</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {allTags.slice(0, 16).map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    size="sm"
                    variant={tagFromUrl === tag ? 'default' : 'outline'}
                    className="shrink-0"
                    onClick={() => pushFilters({ tag: tagFromUrl === tag ? '' : tag })}
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>
      ) : null}

      {/* Force physical right sidebar even in RTL */}
      <div
        className={cn('grid gap-8', showSidebar && 'lg:grid-cols-[minmax(0,1fr)_260px]')}
        style={showSidebar ? { direction: 'ltr' } : undefined}
      >
        <motion.div
          variants={itemVariants}
          className="min-w-0"
          style={showSidebar ? { direction: isRtl ? 'rtl' : 'ltr' } : undefined}
        >
          {filteredBooks.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              {pageDict.empty ?? (isRtl ? 'کتابی یافت نشد.' : 'No books found.')}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} dict={dict} compact />
              ))}
            </div>
          )}
        </motion.div>

        {showSidebar ? (
          <motion.div variants={itemVariants} className="hidden lg:block" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            {sidebar}
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}

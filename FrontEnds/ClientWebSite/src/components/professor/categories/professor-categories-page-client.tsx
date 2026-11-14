'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Info,
  Loader2,
  Search,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ProfessorCategorySearchGrid,
  ProfessorCategoryTreeView,
} from '@/components/professor/categories/professor-category-tree-view';
import {
  collectCategoryIds,
  findCategoryInTree,
  flattenAllCategoryRows,
  getCategoryAncestry,
  searchCategoryTree,
  type CategoryTreeItem,
} from '@/lib/api/categories';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';

type Props = { dict: Dictionary };

export function ProfessorCategoriesPageClient({ dict }: Props) {
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';

  const [tree, setTree] = React.useState<CategoryTreeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [collapsedIds, setCollapsedIds] = React.useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const viewLabels = {
    addSubcategory: t('professorDashboard.categories.addSubcategory', isRtl ? 'زیردسته' : 'Add child'),
    edit: t('professorDashboard.categories.edit', isRtl ? 'ویرایش' : 'Edit'),
    delete: t('professorDashboard.categories.delete', isRtl ? 'حذف' : 'Delete'),
    rootCategory: t('professorDashboard.categories.rootBadge', isRtl ? 'اصلی' : 'Root'),
    childBadge: t('professorDashboard.categories.childBadge', isRtl ? 'زیردسته' : 'Child'),
    courses: t('professorDashboard.categories.courses', isRtl ? 'دوره' : 'courses'),
    subcategories: t('professorDashboard.categories.subcategories', isRtl ? 'زیردسته' : 'subcategories'),
  };

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadCategories = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchCategoryTree({ pageSize: 500 });
      setTree(data);
    } catch {
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const toggleCollapse = (id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setCollapsedIds(new Set());

  const collapseAll = () => {
    setCollapsedIds(new Set(collectCategoryIds(tree)));
  };

  const searchResults = React.useMemo(() => {
    if (!debouncedSearch) return [];
    const term = debouncedSearch.toLowerCase();
    return flattenAllCategoryRows(tree)
      .map(({ node }) => node)
      .filter(
        (node) =>
          node.name.toLowerCase().includes(term) || node.description.toLowerCase().includes(term)
      );
  }, [tree, debouncedSearch]);

  const searchAncestryMap = React.useMemo(() => {
    const map = new Map<number, CategoryTreeItem[]>();
    for (const node of searchResults) {
      map.set(node.id, getCategoryAncestry(tree, node.id));
    }
    return map;
  }, [tree, searchResults]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('professorDashboard.categories.title', isRtl ? 'دسته‌بندی‌ها' : 'Categories')}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t(
            'professorDashboard.categories.pageDescription',
            isRtl
              ? 'مشاهده دسته‌بندی‌های سلسله‌مراتبی دوره‌ها و مقالات.'
              : 'Browse hierarchical categories for courses and articles.'
          )}
        </p>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className={cn(isRtl && 'text-right')}>
          {t(
            'professorDashboard.categories.viewOnlyNotice',
            isRtl
              ? 'شما فقط می‌توانید دسته‌بندی‌ها را مشاهده کنید. برای افزودن، ویرایش یا حذف دسته‌بندی جدید، '
              : 'You can only view categories. To add, edit, or remove a category, '
          )}
          <Link href="/professor/support" className="font-medium text-primary underline-offset-4 hover:underline">
            {t(
              'professorDashboard.categories.supportTicketLink',
              isRtl ? 'از بخش پشتیبانی تیکت ثبت کنید' : 'submit a support ticket'
            )}
          </Link>
          {t(
            'professorDashboard.categories.viewOnlyNoticeEnd',
            isRtl ? ' تا ادمین اصلی سایت آن را انجام دهد.' : ' so the site admin can handle it.'
          )}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3 rounded-xl border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              'professorDashboard.categories.searchPlaceholder',
              isRtl ? 'جستجو در دسته‌بندی‌ها...' : 'Search categories...'
            )}
            className="ltr:pl-9 rtl:pr-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} disabled={!!debouncedSearch}>
            <ChevronsUpDown className="h-4 w-4" />
            {t('professorDashboard.categories.expandAll', isRtl ? 'باز کردن همه' : 'Expand all')}
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} disabled={!!debouncedSearch}>
            <ChevronsDownUp className="h-4 w-4" />
            {t('professorDashboard.categories.collapseAll', isRtl ? 'جمع کردن همه' : 'Collapse all')}
          </Button>
        </div>
      </div>

      {selectedId != null ? (
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-sm shadow-sm',
            isRtl && 'flex-row-reverse'
          )}
        >
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">
            {t('professorDashboard.categories.selected', isRtl ? 'انتخاب‌شده:' : 'Selected:')}
          </span>
          <span className="font-semibold text-foreground">
            {findCategoryInTree(tree, selectedId)?.name}
          </span>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : debouncedSearch ? (
        searchResults.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            {t(
              'professorDashboard.categories.noResults',
              isRtl ? 'نتیجه‌ای یافت نشد.' : 'No results found.'
            )}
          </div>
        ) : (
          <ProfessorCategorySearchGrid
            items={searchResults}
            ancestryMap={searchAncestryMap}
            isRtl={isRtl}
            selectedId={selectedId}
            onSelect={setSelectedId}
            labels={viewLabels}
            readOnly
          />
        )
      ) : tree.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {t(
            'professorDashboard.categories.empty',
            isRtl ? 'هنوز دسته‌بندی ثبت نشده است.' : 'No categories have been created yet.'
          )}
        </div>
      ) : (
        <ProfessorCategoryTreeView
          tree={tree}
          isRtl={isRtl}
          selectedId={selectedId}
          collapsedIds={collapsedIds}
          onToggleCollapse={toggleCollapse}
          onSelect={setSelectedId}
          labels={viewLabels}
          readOnly
        />
      )}

      {loading && tree.length > 0 ? (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('professorDashboard.categories.loading', isRtl ? 'در حال بارگذاری...' : 'Loading...')}
        </div>
      ) : null}
    </div>
  );
}

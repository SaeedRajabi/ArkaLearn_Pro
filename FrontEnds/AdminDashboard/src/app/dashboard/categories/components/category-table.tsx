'use client';

import * as React from 'react';
import Image from 'next/image';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { useStore } from '@/lib/store';
import { deleteCategoryPermanently } from '@/services/category-service';
import { useToast } from '@/hooks/use-toast';
import { CategoryFormModal } from './category-form-modal';
import type { Category } from '@/lib/types';
import { resolveStaticAssetUrl } from '@/lib/apiClient';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

type Props = {
  searchTerm?: string;
};

function flattenForTable(nodes: Category[], depth = 0): Category[] {
  const rows: Category[] = [];
  for (const node of nodes) {
    rows.push({ ...node, depth });
    if (node.children?.length) rows.push(...flattenForTable(node.children, depth + 1));
  }
  return rows;
}

function matchesSearch(category: Category, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;
  return (
    category.categoryName.toLowerCase().includes(normalized) ||
    category.categoryDescription.toLowerCase().includes(normalized)
  );
}

function filterTree(nodes: Category[], term: string): Category[] {
  if (!term.trim()) return nodes;
  const out: Category[] = [];
  for (const node of nodes) {
    const filteredChildren = node.children?.length ? filterTree(node.children, term) : [];
    if (matchesSearch(node, term) || filteredChildren.length > 0) {
      out.push({ ...node, children: filteredChildren });
    }
  }
  return out;
}

export function CategoryTable({ searchTerm = '' }: Props) {
  const { t, locale } = useLanguage();
  const { categoryTree, refreshCategories } = useStore();
  const { toast } = useToast();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [addingChildFor, setAddingChildFor] = React.useState<string | null>(null);

  const rows = React.useMemo(() => {
    const filtered = filterTree(categoryTree, searchTerm);
    return flattenForTable(filtered);
  }, [categoryTree, searchTerm]);

  const paginatedRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize, rows.length]);

  const nameById = React.useMemo(() => {
    const map = new Map<string, string>();
    const walk = (nodes: Category[]) => {
      for (const node of nodes) {
        map.set(node.categoryId, node.categoryName);
        if (node.children?.length) walk(node.children);
      }
    };
    walk(categoryTree);
    return map;
  }, [categoryTree]);

  const exportColumns = React.useMemo<TableExportColumn<Category>[]>(
    () => [
      { header: t('categoryTable_col_name'), accessor: (row) => row.categoryName },
      { header: t('categoryTable_col_description'), accessor: (row) => row.categoryDescription },
      {
        header: t('categoryTable_col_parent'),
        accessor: (row) =>
          row.parentId ? nameById.get(row.parentId) ?? `#${row.parentId}` : t('category_parent_root'),
      },
      { header: t('categoryTable_col_courses'), accessor: (row) => row.courseCount },
    ],
    [t, nameById]
  );

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t('permanent_delete_description').replace('{name}', name))) return;
    try {
      await deleteCategoryPermanently(id);
      await refreshCategories();
      toast({
        title: t('permanent_delete_success_title'),
        description: t('permanent_delete_success_description').replace('{name}', name),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('permanent_delete_failed'),
      });
    }
  };

  return (
    <>
      <AdminTableShell
        title={t('categories_title')}
        description={t('categories_description')}
        locale={locale}
        t={t}
        totalCount={rows.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="categories"
        exportTitle={t('categories_title')}
        exportColumns={exportColumns}
        exportRows={paginatedRows}
        fetchAllExportRows={async () => rows}
        isEmpty={rows.length === 0}
        emptyMessage={t('categoryTable_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ textAlign: locale === 'fa' ? 'right' : 'left' }}>
                {t('categoryTable_col_name')}
              </TableHead>
              <TableHead style={{ textAlign: locale === 'fa' ? 'right' : 'left' }} className="hidden md:table-cell">
                {t('categoryTable_col_description')}
              </TableHead>
              <TableHead style={{ textAlign: locale === 'fa' ? 'right' : 'left' }} className="hidden lg:table-cell">
                {t('categoryTable_col_parent')}
              </TableHead>
              <TableHead style={{ textAlign: locale === 'fa' ? 'right' : 'left' }} className="hidden sm:table-cell">
                {t('categoryTable_col_courses')}
              </TableHead>
              <TableHead>
                <span className="sr-only">{t('categoryTable_col_actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((category) => {
              const imageSrc = category.categoryImage
                ? resolveStaticAssetUrl(category.categoryImage)
                : '';
              const parentLabel = category.parentId
                ? nameById.get(category.parentId) ?? `#${category.parentId}`
                : t('category_parent_root');

              return (
                <TableRow key={category.categoryId}>
                  <TableCell className="font-medium">
                    <div
                      className="flex items-center gap-3"
                      style={{ paddingInlineStart: `${(category.depth ?? 0) * 1.25}rem` }}
                    >
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt=""
                          width={36}
                          height={36}
                          unoptimized
                          className="h-9 w-9 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-md bg-muted" />
                      )}
                      <div>
                        <div>{category.categoryName}</div>
                        {(category.children?.length ?? 0) > 0 ? (
                          <div className="text-xs text-muted-foreground">
                            {t('category_children_count').replace(
                              '{count}',
                              String(category.children?.length ?? 0)
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                    {category.categoryDescription}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{parentLabel}</TableCell>
                  <TableCell className="hidden sm:table-cell">{category.courseCount}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t('actions_toggle_menu')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                          {t('actions_edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAddingChildFor(category.categoryId)}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          {t('category_add_child')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(category.categoryId, category.categoryName)}
                          className="text-destructive"
                        >
                          {t('actions_delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableShell>

      {editingCategory ? (
        <CategoryFormModal
          open={!!editingCategory}
          onOpenChangeAction={(isOpen) => !isOpen && setEditingCategory(null)}
          category={editingCategory}
        />
      ) : null}

      {addingChildFor ? (
        <CategoryFormModal
          open={!!addingChildFor}
          onOpenChangeAction={(isOpen) => !isOpen && setAddingChildFor(null)}
          defaultParentId={addingChildFor}
        />
      ) : null}
    </>
  );
}

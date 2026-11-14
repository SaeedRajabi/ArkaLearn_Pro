
'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
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
import { AddCategoryModal } from './add-category-modal';
import type { Category } from '@/lib/types';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

export function CategoryTable() {
  const { t , locale } = useLanguage();
  const { categories, deleteCategory } = useStore();
  const { toast } = useToast();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  const currentCategories = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return categories.slice(start, start + pageSize);
  }, [categories, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [pageSize, categories.length]);

  const exportColumns = React.useMemo<TableExportColumn<Category>[]>(
    () => [
      { header: t('categoryTable_col_name'), accessor: (row) => row.categoryName },
      { header: t('categoryTable_col_description'), accessor: (row) => row.categoryDescription },
      { header: t('categoryTable_col_courses'), accessor: (row) => row.courseCount },
    ],
    [t]
  );

  const formatCourseCount = (count: number) =>
    t(count.toString().length > 1
      ? count.toString().split('').map((x) => t(x)).toString().replaceAll(',', '')
      : count.toString());

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t('permanent_delete_description').replace('{name}', name))) return;
    try {
      await deleteCategoryPermanently(id);
      deleteCategory(id);
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

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  return (
    <>
      <AdminTableShell
        title={t('categories_title')}
        description={t('categories_description')}
        locale={locale}
        t={t}
        totalCount={categories.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="course-categories"
        exportTitle={t('categories_title')}
        exportColumns={exportColumns}
        exportRows={currentCategories}
        fetchAllExportRows={async () => categories}
        isEmpty={categories.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}}>{t('categoryTable_col_name')}</TableHead>
              <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="hidden md:table-cell">{t('categoryTable_col_description')}</TableHead>
              <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="hidden lg:table-cell">{t('categoryTable_col_courses')}</TableHead>
              <TableHead>
                <span className="sr-only">{t('categoryTable_col_actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCategories.map((category) => (
              <TableRow key={category.categoryId}>
                <TableCell className="font-medium">{category.categoryName}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {category.categoryDescription}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatCourseCount(category.courseCount)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t('actions_toggle_menu')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(category)}>{t('actions_edit')}</DropdownMenuItem>
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
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
      {editingCategory && (
        <AddCategoryModal
          open={!!editingCategory}
          onOpenChangeAction={(isOpen) => !isOpen && setEditingCategory(null)}
          category={editingCategory}
        />
      )}
    </>
  );
}

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dict: Dictionary;
  categoryName: string;
  childCount: number;
  onConfirm: () => void;
  loading?: boolean;
};

export function ProfessorCategoryDeleteDialog({
  open,
  onOpenChange,
  dict,
  categoryName,
  childCount,
  onConfirm,
  loading = false,
}: Props) {
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);
  const isRtl = getDictValue(dict, 'header.courses', '') !== 'Courses';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : ''}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('professorDashboard.categories.deleteTitle', isRtl ? 'حذف دسته‌بندی' : 'Delete category')}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-sm leading-relaxed">
            <span className="block">
              {t(
                'professorDashboard.categories.deleteConfirm',
                isRtl
                  ? 'آیا از حذف «{name}» مطمئن هستید؟'
                  : 'Are you sure you want to delete "{name}"?'
              ).replace('{name}', categoryName)}
            </span>
            {childCount > 0 ? (
              <span className="block font-medium text-destructive">
                {t(
                  'professorDashboard.categories.deleteChildrenWarning',
                  isRtl
                    ? 'توجه: این دسته {count} زیردسته دارد. با حذف آن، تمام زیردسته‌ها نیز برای همیشه حذف می‌شوند.'
                    : 'Warning: This category has {count} subcategories. Deleting it will permanently remove all of them too.'
                ).replace('{count}', String(childCount))}
              </span>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={isRtl ? 'flex-row-reverse gap-2' : ''}>
          <AlertDialogCancel disabled={loading}>
            {t('professorDashboard.categories.cancel', isRtl ? 'انصراف' : 'Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {t('professorDashboard.categories.deleteConfirmButton', isRtl ? 'بله، حذف شود' : 'Yes, delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

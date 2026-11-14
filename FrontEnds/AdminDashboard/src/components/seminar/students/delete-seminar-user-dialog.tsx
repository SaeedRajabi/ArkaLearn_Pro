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
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';

type DeleteSeminarUserDialogProps = {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  userName: string;
  onConfirmAction: () => void;
};

export function DeleteSeminarUserDialog({
  isOpen,
  onOpenChangeAction,
  userName,
  onConfirmAction,
}: DeleteSeminarUserDialogProps) {
  const onOpenChange = onOpenChangeAction;
  const onConfirm = onConfirmAction;
  const { t } = useLanguage();

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('seminar_students_delete_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('seminar_students_delete_description', { userName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions_cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(buttonVariants({ variant: 'destructive' }))}
          >
            {t('actions_delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

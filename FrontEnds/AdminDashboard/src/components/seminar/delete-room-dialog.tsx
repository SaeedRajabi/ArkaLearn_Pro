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
import { useLanguage } from '@/components/language-provider';
import { cn } from '@/lib/utils';

type DeleteRoomDialogProps = {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  roomName: string;
  onConfirmAction: () => void;
};

export function DeleteRoomDialog({
  isOpen,
  onOpenChangeAction,
  roomName,
  onConfirmAction,
}: DeleteRoomDialogProps) {
  const { t } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const onConfirm = onConfirmAction;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('seminar_delete_room_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('seminar_delete_room_description', { roomName })}
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

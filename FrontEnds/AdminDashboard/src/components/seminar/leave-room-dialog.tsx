'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';

type LeaveRoomDialogProps = {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onLeaveNowAction: () => void;
  onSetTimerAction: (minutes: number) => void;
};

export function LeaveRoomDialog({
  isOpen,
  onOpenChangeAction,
  onLeaveNowAction,
  onSetTimerAction,
}: LeaveRoomDialogProps) {
  const { t } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const onLeaveNow = onLeaveNowAction;
  const onSetTimer = onSetTimerAction;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('seminar_leave_room_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('seminar_leave_room_description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
          <Button variant="destructive" onClick={onLeaveNow} className="w-full">
            {t('seminar_leave_now')}
          </Button>
          <Button
            variant="outline"
            onClick={() => onSetTimer(5)}
            className="w-full"
          >
            {t('seminar_leave_in_minutes', { minutes: 5 })}
          </Button>
          <Button
            variant="outline"
            onClick={() => onSetTimer(10)}
            className="w-full"
          >
            {t('seminar_leave_in_minutes', { minutes: 10 })}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full mt-2"
          >
            {t('actions_cancel')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

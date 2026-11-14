'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { adminAssignStudentRooms } from '@/services/admin-user-management-api.service';

export function AssignStudentRoomsModal({
  open,
  onOpenChange,
  portalUserId,
  studentName,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portalUserId: string | null;
  studentName: string;
  onAssigned?: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [roomIdsInput, setRoomIdsInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) setRoomIdsInput('');
  }, [open]);

  const handleSave = async () => {
    if (!portalUserId) return;
    const roomIds = roomIdsInput
      .split(/[,،\s]+/)
      .map((x) => Number(x.trim()))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (roomIds.length === 0) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('assign_rooms_none_selected') });
      return;
    }
    setBusy(true);
    try {
      await adminAssignStudentRooms({ portalUserId, roomIds });
      toast({
        title: t('assign_rooms_success_title'),
        description: t('assign_rooms_success_desc').replace('{name}', studentName),
      });
      onOpenChange(false);
      onAssigned?.();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: err instanceof Error ? err.message : t('assign_rooms_failed'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('assign_rooms_title')}</DialogTitle>
          <DialogDescription>{t('assign_rooms_description').replace('{name}', studentName)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="room-ids">{t('assign_rooms_ids_label')}</Label>
          <Input
            id="room-ids"
            value={roomIdsInput}
            onChange={(e) => setRoomIdsInput(e.target.value)}
            placeholder={t('assign_rooms_ids_placeholder')}
          />
          <p className="text-xs text-muted-foreground">{t('assign_rooms_ids_hint')}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('actions_cancel')}
          </Button>
          <Button onClick={() => void handleSave()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('assign_rooms_save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { adminSendNotifications } from '@/services/admin-user-management-api.service';

export function AdminMessageModal({
  open,
  onOpenChange,
  userIds,
  recipientName,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userIds: string[];
  recipientName: string;
  onSent?: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setTitle('');
      setBody('');
    }
  }, [open]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('admin_message_fields_required') });
      return;
    }
    setBusy(true);
    try {
      await adminSendNotifications({ userIds, title: title.trim(), body: body.trim() });
      toast({
        title: t('admin_message_success_title'),
        description: t('admin_message_success_desc').replace('{name}', recipientName),
      });
      onOpenChange(false);
      onSent?.();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: err instanceof Error ? err.message : t('admin_message_failed'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('admin_message_title')}</DialogTitle>
          <DialogDescription>{t('admin_message_description').replace('{name}', recipientName)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="msg-title">{t('admin_message_subject_label')}</Label>
            <Input id="msg-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="msg-body">{t('admin_message_body_label')}</Label>
            <Textarea id="msg-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('actions_cancel')}
          </Button>
          <Button onClick={() => void handleSend()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('admin_message_send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { adminBulkNotify } from '@/services/admin-user-management-api.service';

export function BulkNotifyModal({
  open,
  onOpenChange,
  userIds,
  channel,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userIds: string[];
  channel: 'email' | 'sms';
  onSent?: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSubject('');
      setBody('');
    }
  }, [open]);

  const handleSend = async () => {
    if (userIds.length === 0) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('bulk_notify_no_selection') });
      return;
    }
    if (!body.trim()) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('bulk_notify_body_required') });
      return;
    }
    if (channel === 'email' && !subject.trim()) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('bulk_notify_subject_required') });
      return;
    }
    setBusy(true);
    try {
      const result = await adminBulkNotify({
        userIds,
        channel,
        subject: subject.trim(),
        body: body.trim(),
      });
      toast({
        title: t('bulk_notify_success_title'),
        description: t('bulk_notify_success_desc')
          .replace('{sent}', String(result.sent))
          .replace('{failed}', String(result.failed)),
      });
      onOpenChange(false);
      onSent?.();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: err instanceof Error ? err.message : t('bulk_notify_failed'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {channel === 'email' ? t('bulk_notify_email_title') : t('bulk_notify_sms_title')}
          </DialogTitle>
          <DialogDescription>
            {t('bulk_notify_description').replace('{count}', String(userIds.length))}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {channel === 'email' ? (
            <div className="space-y-2">
              <Label htmlFor="bulk-subject">{t('bulk_notify_subject_label')}</Label>
              <Input
                id="bulk-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('bulk_notify_subject_placeholder')}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="bulk-body">{t('bulk_notify_body_label')}</Label>
            <Textarea
              id="bulk-body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('bulk_notify_body_placeholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('actions_cancel')}
          </Button>
          <Button onClick={() => void handleSend()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('bulk_notify_send_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GrantSupportModal({
  open,
  onOpenChange,
  studentUserId,
  studentName,
  onGranted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentUserId: string | null;
  studentName: string;
  onGranted?: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [months, setMonths] = React.useState('1');
  const [busy, setBusy] = React.useState(false);

  const handleGrant = async () => {
    if (!studentUserId) return;
    const m = Number(months);
    if (!Number.isFinite(m) || m <= 0) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('grant_support_months_invalid') });
      return;
    }
    setBusy(true);
    try {
      const { grantStudentSupportMonths } = await import('@/services/support-subscription-api.service');
      await grantStudentSupportMonths(String(studentUserId), m);
      toast({
        title: t('grant_support_success_title'),
        description: t('grant_support_success_desc').replace('{name}', studentName).replace('{months}', String(m)),
      });
      onOpenChange(false);
      onGranted?.();
    } catch {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('grant_support_failed') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('grant_support_title')}</DialogTitle>
          <DialogDescription>{t('grant_support_description').replace('{name}', studentName)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>{t('grant_support_months_label')}</Label>
          <Select value={months} onValueChange={setMonths}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 3, 6, 12].map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {t('grant_support_months_option').replace('{months}', String(m))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('actions_cancel')}
          </Button>
          <Button onClick={() => void handleGrant()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('grant_support_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

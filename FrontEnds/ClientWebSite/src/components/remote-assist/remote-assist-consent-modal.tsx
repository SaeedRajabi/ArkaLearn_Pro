'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  confirmRemoteAssistConsent,
  denyRemoteAssistConsent,
  type RemoteAssistSession,
} from '@/lib/api/remote-assist';
import { ApiError } from '@/lib/api/client';

export type RemoteAssistConsentLabels = {
  sessionLabel?: string;
  helperFallback?: string;
  allowRemoteControl?: string;
  allowRemoteControlHint?: string;
  allowClipboard?: string;
  allowClipboardHint?: string;
  allowFileTransfer?: string;
  allowFileTransferHint?: string;
  allowAudio?: string;
  allowAudioHint?: string;
  allowLockLocalInput?: string;
  allowLockLocalInputHint?: string;
  deny?: string;
  grantAccess?: string;
  denyFailed?: string;
  grantFailed?: string;
};

type Props = {
  open: boolean;
  session: RemoteAssistSession | null;
  onOpenChange: (open: boolean) => void;
  onResolved: (session: RemoteAssistSession | null, granted: boolean) => void;
  onError?: (message: string) => void;
  title?: string;
  description?: string;
  labels?: RemoteAssistConsentLabels;
};

export function RemoteAssistConsentModal({
  open,
  session,
  onOpenChange,
  onResolved,
  onError,
  title = 'مجوز کمک از راه دور',
  description = 'یک کمک‌کننده درخواست دسترسی به نشست دسکتاپ شما را دارد. مشخص کنید چه اجازه‌هایی داشته باشد.',
  labels,
}: Props) {
  const L = {
    sessionLabel: labels?.sessionLabel ?? 'نشست',
    helperFallback: labels?.helperFallback ?? 'کمک‌کننده',
    allowRemoteControl: labels?.allowRemoteControl ?? 'اجازه کنترل از راه دور',
    allowRemoteControlHint: labels?.allowRemoteControlHint ?? 'ماوس و صفحه‌کلید توسط کمک‌کننده',
    allowClipboard: labels?.allowClipboard ?? 'اجازه کلیپ‌بورد',
    allowClipboardHint: labels?.allowClipboardHint ?? 'کپی و جای‌گذاری بین دستگاه‌ها',
    allowFileTransfer: labels?.allowFileTransfer ?? 'اجازه انتقال فایل',
    allowFileTransferHint: labels?.allowFileTransferHint ?? 'ارسال و دریافت فایل در طول نشست',
    allowAudio: labels?.allowAudio ?? 'اجازه صدا',
    allowAudioHint: labels?.allowAudioHint ?? 'اشتراک صدای دستگاه',
    allowLockLocalInput: labels?.allowLockLocalInput ?? 'اجازه قفل ورودی محلی',
    allowLockLocalInputHint:
      labels?.allowLockLocalInputHint ?? 'کمک‌کننده بتواند ماوس و صفحه‌کلید محلی را مسدود کند',
    deny: labels?.deny ?? 'رد کردن',
    grantAccess: labels?.grantAccess ?? 'تأیید دسترسی',
    denyFailed: labels?.denyFailed ?? 'رد دسترسی ناموفق بود.',
    grantFailed: labels?.grantFailed ?? 'تأیید دسترسی ناموفق بود.',
  };

  const [allowRemoteControl, setAllowRemoteControl] = React.useState(true);
  const [allowClipboard, setAllowClipboard] = React.useState(false);
  const [allowFileTransfer, setAllowFileTransfer] = React.useState(false);
  const [allowAudio, setAllowAudio] = React.useState(false);
  const [allowLockLocalInput, setAllowLockLocalInput] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!session) return;
    setAllowRemoteControl(session.allowRemoteControl);
    setAllowClipboard(session.allowClipboard);
    setAllowFileTransfer(session.allowFileTransfer);
    setAllowAudio(session.allowAudio);
    setAllowLockLocalInput(session.allowLockLocalInput);
  }, [session]);

  const handleDeny = async () => {
    if (!session || busy) return;
    setBusy(true);
    try {
      const result = await denyRemoteAssistConsent(session.sessionId);
      onResolved(result, false);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : L.denyFailed;
      onError?.(message);
    } finally {
      setBusy(false);
    }
  };

  const handleGrant = async () => {
    if (!session || busy) return;
    setBusy(true);
    try {
      const result = await confirmRemoteAssistConsent({
        sessionId: session.sessionId,
        allowRemoteControl,
        allowClipboard,
        allowFileTransfer,
        allowAudio,
        allowLockLocalInput,
      });
      onResolved(result, true);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : L.grantFailed;
      onError?.(message);
    } finally {
      setBusy(false);
    }
  };

  const helperLabel = session?.helperDisplayName || session?.acceptedByTeacherUserId || L.helperFallback;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            {session ? (
              <span className="mt-2 block text-foreground">
                {L.sessionLabel} #{session.sessionId} · {String(helperLabel)}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <ConsentRow
            id="ra-control"
            checked={allowRemoteControl}
            onCheckedChange={setAllowRemoteControl}
            label={L.allowRemoteControl}
            hint={L.allowRemoteControlHint}
            disabled={busy}
          />
          <ConsentRow
            id="ra-clipboard"
            checked={allowClipboard}
            onCheckedChange={setAllowClipboard}
            label={L.allowClipboard}
            hint={L.allowClipboardHint}
            disabled={busy}
          />
          <ConsentRow
            id="ra-files"
            checked={allowFileTransfer}
            onCheckedChange={setAllowFileTransfer}
            label={L.allowFileTransfer}
            hint={L.allowFileTransferHint}
            disabled={busy}
          />
          <ConsentRow
            id="ra-audio"
            checked={allowAudio}
            onCheckedChange={setAllowAudio}
            label={L.allowAudio}
            hint={L.allowAudioHint}
            disabled={busy}
          />
          <ConsentRow
            id="ra-lock"
            checked={allowLockLocalInput}
            onCheckedChange={setAllowLockLocalInput}
            label={L.allowLockLocalInput}
            hint={L.allowLockLocalInputHint}
            disabled={busy}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => void handleDeny()} disabled={busy || !session}>
            {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {L.deny}
          </Button>
          <Button type="button" onClick={() => void handleGrant()} disabled={busy || !session}>
            {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {L.grantAccess}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConsentRow({
  id,
  checked,
  onCheckedChange,
  label,
  hint,
  disabled,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

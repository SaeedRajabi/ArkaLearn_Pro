'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  requestRemoteAssistConnect,
  type RemoteAssistSession,
  type RemoteAssistSessionAccepted,
} from '@/lib/api/remote-assist';
import { ApiError } from '@/lib/api/client';

type Props = {
  title?: string;
  description?: string;
  submitLabel?: string;
  codeLabel?: string;
  usernameLabel?: string;
  passwordLabel?: string;
  failedLabel?: string;
  disabled?: boolean;
  onConnected: (result: RemoteAssistSessionAccepted, session: RemoteAssistSession | null) => void;
  onError?: (message: string) => void;
};

export function RemoteAssistConnectForm({
  title = 'اتصال به نشست دانشجو',
  description = 'شناسه ورود، نام کاربری و رمزی که در اپ دسکتاپ دانشجو نمایش داده می‌شود را وارد کنید.',
  submitLabel = 'ارسال درخواست اتصال',
  codeLabel = 'شناسه ورود',
  usernameLabel = 'نام کاربری',
  passwordLabel = 'رمز',
  failedLabel = 'درخواست اتصال ناموفق بود.',
  disabled,
  onConnected,
  onError,
}: Props) {
  const [code, setCode] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || disabled) return;

    setBusy(true);
    try {
      const result = await requestRemoteAssistConnect({
        oneTimeSessionCode: code,
        sessionUsername: username,
        sessionPassword: password,
      });
      onConnected(result, result.session ?? null);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : failedLabel;
      onError?.(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-3" onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-2">
            <Label htmlFor="remote-assist-code">{codeLabel}</Label>
            <Input
              id="remote-assist-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              required
              disabled={busy || disabled}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remote-assist-username">{usernameLabel}</Label>
            <Input
              id="remote-assist-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              disabled={busy || disabled}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remote-assist-password">{passwordLabel}</Label>
            <Input
              id="remote-assist-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={busy || disabled}
              dir="ltr"
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={busy || disabled}>
              {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

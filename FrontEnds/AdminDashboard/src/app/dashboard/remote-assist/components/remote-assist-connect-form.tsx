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
} from '@/services/remote-assist-api.service';
import { useLanguage } from '@/components/language-provider';

type Props = {
  disabled?: boolean;
  onConnected: (result: RemoteAssistSessionAccepted, session: RemoteAssistSession | null) => void;
  onError?: (message: string) => void;
};

export function RemoteAssistConnectForm({ disabled, onConnected, onError }: Props) {
  const { t } = useLanguage();
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
      const message = error instanceof Error ? error.message : t('remote_assist_connect_failed');
      onError?.(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('remote_assist_connect_title')}</CardTitle>
        <CardDescription>{t('remote_assist_connect_description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-3" onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-2">
            <Label htmlFor="admin-ra-code">{t('remote_assist_code')}</Label>
            <Input
              id="admin-ra-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={busy || disabled}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-ra-username">{t('remote_assist_username')}</Label>
            <Input
              id="admin-ra-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={busy || disabled}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-ra-password">{t('remote_assist_password')}</Label>
            <Input
              id="admin-ra-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy || disabled}
              autoComplete="current-password"
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={busy || disabled}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('remote_assist_connect_submit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

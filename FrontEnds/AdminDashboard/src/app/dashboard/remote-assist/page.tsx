'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import type { RemoteAssistSession } from '@/services/remote-assist-api.service';
import { RemoteAssistConnectForm } from './components/remote-assist-connect-form';
import { RemoteAssistViewer } from './components/remote-assist-viewer';
import { RemoteAssistHistoryTable } from './components/remote-assist-history-table';

function parseUserId(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed) || trimmed === '0') return null;
  return trimmed;
}

export default function RemoteAssistAdminPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { authUser } = useAuth();
  const searchParams = useSearchParams();
  const studentUserId = parseUserId(searchParams.get('studentUserId'));
  const teacherUserId = parseUserId(searchParams.get('teacherUserId'));

  const [session, setSession] = React.useState<RemoteAssistSession | null>(null);
  const [historyKey, setHistoryKey] = React.useState(0);

  const filterHint = React.useMemo(() => {
    if (studentUserId) return `${t('remote_assist_filter_student')}: ${studentUserId}`;
    if (teacherUserId) return `${t('remote_assist_filter_teacher')}: ${teacherUserId}`;
    return t('remote_assist_filter_all');
  }, [studentUserId, teacherUserId, t]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('remote_assist_title')}</h1>
        <p className="text-sm text-muted-foreground">{t('remote_assist_description')}</p>
        <p className="text-xs text-muted-foreground">{filterHint}</p>
      </div>

      <RemoteAssistConnectForm
        disabled={!!session && session.status.toLowerCase() === 'active'}
        onConnected={(result, connectedSession) => {
          const next =
            connectedSession ??
            ({
              sessionId: result.sessionId,
              sessionIdKey: String(result.sessionId),
              requesterUserId: result.requesterUserId,
              acceptedByTeacherUserId: result.acceptedByTeacherUserId,
              oneTimeSessionCode: '',
              sessionUsername: '',
              status: result.status || 'AwaitingConsent',
              createdAtUtc: '',
              codeExpiresAtUtc: '',
              acceptedAtUtc: result.acceptedAtUtc,
              consentRequestedAtUtc: result.consentRequestedAtUtc,
              allowRemoteControl: true,
              allowClipboard: false,
              allowFileTransfer: false,
              allowAudio: false,
              allowLockLocalInput: false,
            } satisfies RemoteAssistSession);
          setSession(next);
          setHistoryKey((k) => k + 1);
          toast({
            title: t('remote_assist_connect_requested'),
            description: t('remote_assist_awaiting_consent'),
          });
        }}
        onError={(message) => {
          toast({ title: t('remote_assist_title'), description: message, variant: 'destructive' });
        }}
      />

      <RemoteAssistViewer
        session={session}
        userId={authUser?.id}
        onSessionChange={setSession}
        onError={(message) => {
          toast({ title: t('remote_assist_title'), description: message, variant: 'destructive' });
        }}
      />

      <RemoteAssistHistoryTable
        studentUserId={studentUserId}
        teacherUserId={teacherUserId}
        refreshKey={historyKey}
      />
    </div>
  );
}

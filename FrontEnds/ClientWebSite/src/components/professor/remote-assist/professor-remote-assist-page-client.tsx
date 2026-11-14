'use client';

import * as React from 'react';
import type { Dictionary } from '@/types';
import { getDictValue } from '@/lib/i18n-client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { RemoteAssistConnectForm } from '@/components/remote-assist/remote-assist-connect-form';
import { RemoteAssistViewer } from '@/components/remote-assist/remote-assist-viewer';
import { RemoteAssistHistoryTable } from '@/components/remote-assist/remote-assist-history-table';
import type {
  RemoteAssistSession,
  RemoteAssistSessionAccepted,
} from '@/lib/api/remote-assist';
import { DesktopAppDownloadPanel } from '@/components/desktop-app/desktop-app-download-panel';

function acceptedToSession(
  accepted: RemoteAssistSessionAccepted,
  existing?: RemoteAssistSession
): RemoteAssistSession {
  return (
    accepted.session ?? {
      ...(existing ?? {
        oneTimeSessionCode: '',
        sessionUsername: '',
        createdAtUtc: '',
        codeExpiresAtUtc: '',
        allowRemoteControl: true,
        allowClipboard: false,
        allowFileTransfer: false,
        allowAudio: false,
        allowLockLocalInput: false,
        isRequesterOnline: true,
      }),
      sessionId: accepted.sessionId,
      sessionIdKey: String(accepted.sessionId),
      requesterUserId: accepted.requesterUserId,
      acceptedByTeacherUserId: accepted.acceptedByTeacherUserId,
      status: accepted.status || 'AwaitingConsent',
      acceptedAtUtc: accepted.acceptedAtUtc,
      consentRequestedAtUtc: accepted.consentRequestedAtUtc,
      endedAtUtc: null,
    }
  );
}

export function ProfessorRemoteAssistPageClient({ dict }: { dict: Dictionary }) {
  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = React.useState<RemoteAssistSession | null>(null);
  const [historyKey, setHistoryKey] = React.useState(0);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('remoteAssist.professorTitle', 'کمک از راه دور')}
        </h1>
        <p className="text-muted-foreground">
          {t(
            'remoteAssist.professorSubtitle',
            'به نشست دسکتاپ دانشجو متصل شوید و تاریخچه نشست‌های ریموت را ببینید.'
          )}
        </p>
      </div>

      <DesktopAppDownloadPanel dict={dict} variant="compact" audience="professor" />

      <RemoteAssistConnectForm
        title={t('remoteAssist.connectTitle', 'اتصال به دانشجو')}
        description={t(
          'remoteAssist.connectDescription',
          'شناسه ورود، نام کاربری و رمزی که در اپ دسکتاپ دانشجو نمایش داده می‌شود را وارد کنید.'
        )}
        submitLabel={t('remoteAssist.connectSubmit', 'ارسال درخواست اتصال')}
        codeLabel={t('remoteAssist.codeLabel', 'شناسه ورود')}
        usernameLabel={t('remoteAssist.usernameLabel', 'نام کاربری')}
        passwordLabel={t('remoteAssist.passwordLabel', 'رمز')}
        failedLabel={t('remoteAssist.connectFailed', 'درخواست اتصال ناموفق بود.')}
        disabled={!!session && session.status.toLowerCase() === 'active'}
        onConnected={(result, connectedSession) => {
          const next = connectedSession ?? acceptedToSession(result);
          setSession(next);
          setHistoryKey((k) => k + 1);
          toast({
            title: t('remoteAssist.connectRequested', 'درخواست اتصال ارسال شد'),
            description: t(
              'remoteAssist.awaitingConsent',
              'در انتظار تأیید دسترسی توسط دانشجو.'
            ),
          });
        }}
        onError={(message) => {
          toast({
            title: t('remoteAssist.errorTitle', 'کمک از راه دور'),
            description: message,
            variant: 'destructive',
          });
        }}
      />

      <RemoteAssistViewer
        session={session}
        userId={user?.id}
        title={t('remoteAssist.viewerTitle', 'صفحه ریموت')}
        waitingLabel={t('remoteAssist.waitingFrames', 'در انتظار دریافت تصویر صفحه…')}
        emptyDescription={t(
          'remoteAssist.viewerEmpty',
          'برای مشاهده صفحه، ابتدا به یک نشست متصل شوید.'
        )}
        noSessionLabel={t('remoteAssist.noSession', 'نشست فعالی وجود ندارد')}
        controlEnabledLabel={t('remoteAssist.controlEnabled', 'کنترل از راه دور فعال')}
        endLabel={t('remoteAssist.end', 'پایان')}
        expandLabel={t('remoteAssist.expand', 'بزرگ‌نمایی')}
        collapseLabel={t('remoteAssist.collapse', 'خروج از بزرگ‌نمایی')}
        endFailedLabel={t('remoteAssist.endFailed', 'پایان نشست ناموفق بود.')}
        statusPrefix={t('remoteAssist.status', 'وضعیت')}
        onSessionChange={(next) => {
          setSession(next);
          if (!next) setHistoryKey((k) => k + 1);
        }}
        onError={(message) => {
          toast({
            title: t('remoteAssist.errorTitle', 'کمک از راه دور'),
            description: message,
            variant: 'destructive',
          });
        }}
      />

      <RemoteAssistHistoryTable
        title={t('remoteAssist.historyTitle', 'تاریخچه نشست‌ها')}
        description={t('remoteAssist.historyDescription', 'نشست‌های اخیر کمک از راه دور شما.')}
        refreshKey={historyKey}
        emptyLabel={t('remoteAssist.historyEmpty', 'نشستی یافت نشد.')}
        userId={user?.id}
        onReconnect={(accepted, historySession) => {
          setSession(acceptedToSession(accepted, historySession));
          setHistoryKey((k) => k + 1);
          toast({
            title: t('remoteAssist.connectRequested', 'درخواست اتصال ارسال شد'),
            description: t(
              'remoteAssist.awaitingConsent',
              'در انتظار تأیید دسترسی توسط دانشجو.'
            ),
          });
        }}
      />
    </div>
  );
}

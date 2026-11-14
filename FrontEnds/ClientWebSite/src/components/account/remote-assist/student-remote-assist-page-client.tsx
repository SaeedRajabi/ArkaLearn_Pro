'use client';

import * as React from 'react';
import type { Dictionary } from '@/types';
import { getDictValue } from '@/lib/i18n-client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { RemoteAssistConsentModal } from '@/components/remote-assist/remote-assist-consent-modal';
import { RemoteAssistHistoryTable } from '@/components/remote-assist/remote-assist-history-table';
import { useRemoteAssistHub } from '@/hooks/use-remote-assist-hub';
import {
  getMyActiveRemoteAssistSession,
  type RemoteAssistSession,
} from '@/lib/api/remote-assist';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DesktopAppDownloadPanel } from '@/components/desktop-app/desktop-app-download-panel';

function isAwaitingConsent(status: string) {
  return status.trim().toLowerCase() === 'awaitingconsent';
}

function statusLabel(status: string | null | undefined, t: (key: string, def: string) => string) {
  const value = (status || '').trim().toLowerCase();
  switch (value) {
    case 'active':
      return t('remoteAssist.statusActive', 'فعال');
    case 'ended':
      return t('remoteAssist.statusEnded', 'پایان‌یافته');
    case 'pending':
      return t('remoteAssist.statusPending', 'در انتظار');
    case 'awaitingconsent':
      return t('remoteAssist.statusAwaitingConsent', 'در انتظار تأیید');
    case 'denied':
    case 'rejected':
      return t('remoteAssist.statusDenied', 'رد شده');
    case 'expired':
      return t('remoteAssist.statusExpired', 'منقضی');
    default:
      return status || '—';
  }
}

export function StudentRemoteAssistPageClient({ dict }: { dict: Dictionary }) {
  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSession, setActiveSession] = React.useState<RemoteAssistSession | null>(null);
  const [consentOpen, setConsentOpen] = React.useState(false);
  const [historyKey, setHistoryKey] = React.useState(0);

  const loadActive = React.useCallback(async () => {
    try {
      const session = await getMyActiveRemoteAssistSession();
      setActiveSession(session);
      setConsentOpen(!!session && isAwaitingConsent(session.status));
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    void loadActive();
  }, [loadActive]);

  useRemoteAssistHub({
    enabled: !!user?.id,
    userId: user?.id,
    handlers: {
      onConsentRequired: (payload) => {
        setActiveSession(payload);
        setConsentOpen(true);
        toast({
          title: t('remoteAssist.consentRequiredTitle', 'نیاز به تأیید دسترسی'),
          description: t(
            'remoteAssist.consentRequiredDescription',
            'یک کمک‌کننده درخواست دسترسی از راه دور داده است. لطفاً مجوزها را بررسی کنید.'
          ),
        });
      },
      onSessionChanged: (payload) => {
        setActiveSession(payload);
        if (isAwaitingConsent(payload.status)) {
          setConsentOpen(true);
        }
        if (String(payload.status).toLowerCase() === 'ended') {
          setConsentOpen(false);
          setHistoryKey((k) => k + 1);
        }
      },
      onConsentResolved: (payload) => {
        setActiveSession(payload);
        setConsentOpen(false);
        setHistoryKey((k) => k + 1);
      },
    },
  });

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('remoteAssist.studentTitle', 'کمک از راه دور')}
        </h1>
        <p className="text-muted-foreground">
          {t(
            'remoteAssist.studentSubtitle',
            'تاریخچه نشست‌ها را ببینید و درخواست‌های کنترل از راه دور را تأیید کنید. میزبانی معمولاً در اپلیکیشن دسکتاپ انجام می‌شود.'
          )}
        </p>
      </div>

      <DesktopAppDownloadPanel dict={dict} variant="compact" audience="student" />

      {activeSession ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('remoteAssist.activeTitle', 'نشست فعال / در انتظار')}</CardTitle>
            <CardDescription>
              #{activeSession.sessionId} · {statusLabel(activeSession.status, t)}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isAwaitingConsent(activeSession.status)
              ? t(
                  'remoteAssist.activeAwaitingConsent',
                  'یک کمک‌کننده منتظر اجازه شماست. از پنجره تأیید برای موافقت یا رد دسترسی استفاده کنید.'
                )
              : t(
                  'remoteAssist.activeHint',
                  'اپلیکیشن دسکتاپ را باز نگه دارید تا صفحه شما به اشتراک گذاشته شود. پایان نشست را می‌توانید از داخل اپ انجام دهید.'
                )}
          </CardContent>
        </Card>
      ) : null}

      <RemoteAssistHistoryTable
        title={t('remoteAssist.historyTitle', 'تاریخچه نشست‌ها')}
        description={t('remoteAssist.studentHistoryDescription', 'نشست‌های کمک از راه دور شما.')}
        studentUserId={user?.id ? Number(user.id) : null}
        refreshKey={historyKey}
        emptyLabel={t('remoteAssist.historyEmpty', 'نشستی یافت نشد.')}
      />

      <RemoteAssistConsentModal
        open={consentOpen}
        session={activeSession}
        onOpenChange={setConsentOpen}
        title={t('remoteAssist.consentTitle', 'مجوز کمک از راه دور')}
        description={t(
          'remoteAssist.consentDescription',
          'یک کمک‌کننده درخواست دسترسی به نشست دسکتاپ شما را دارد. مشخص کنید چه اجازه‌هایی داشته باشد.'
        )}
        labels={{
          sessionLabel: t('remoteAssist.consentSessionLabel', 'نشست'),
          helperFallback: t('remoteAssist.consentHelperFallback', 'کمک‌کننده'),
          allowRemoteControl: t('remoteAssist.allowRemoteControl', 'اجازه کنترل از راه دور'),
          allowRemoteControlHint: t(
            'remoteAssist.allowRemoteControlHint',
            'ماوس و صفحه‌کلید توسط کمک‌کننده'
          ),
          allowClipboard: t('remoteAssist.allowClipboard', 'اجازه کلیپ‌بورد'),
          allowClipboardHint: t('remoteAssist.allowClipboardHint', 'کپی و جای‌گذاری بین دستگاه‌ها'),
          allowFileTransfer: t('remoteAssist.allowFileTransfer', 'اجازه انتقال فایل'),
          allowFileTransferHint: t(
            'remoteAssist.allowFileTransferHint',
            'ارسال و دریافت فایل در طول نشست'
          ),
          allowAudio: t('remoteAssist.allowAudio', 'اجازه صدا'),
          allowAudioHint: t('remoteAssist.allowAudioHint', 'اشتراک صدای دستگاه'),
          allowLockLocalInput: t('remoteAssist.allowLockLocalInput', 'اجازه قفل ورودی محلی'),
          allowLockLocalInputHint: t(
            'remoteAssist.allowLockLocalInputHint',
            'کمک‌کننده بتواند ماوس و صفحه‌کلید محلی را مسدود کند'
          ),
          deny: t('remoteAssist.deny', 'رد کردن'),
          grantAccess: t('remoteAssist.grantAccess', 'تأیید دسترسی'),
          denyFailed: t('remoteAssist.denyFailed', 'رد دسترسی ناموفق بود.'),
          grantFailed: t('remoteAssist.grantFailed', 'تأیید دسترسی ناموفق بود.'),
        }}
        onResolved={(session) => {
          setActiveSession(session);
          setHistoryKey((k) => k + 1);
          toast({
            title: t('remoteAssist.consentResolvedTitle', 'وضعیت دسترسی به‌روز شد'),
            description: statusLabel(session?.status, t),
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
    </div>
  );
}

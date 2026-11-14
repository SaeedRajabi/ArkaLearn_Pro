'use client';

import * as React from 'react';
import { Loader2, Maximize2, Minimize2, MonitorOff, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/components/language-provider';
import { useRemoteAssistHub } from '@/hooks/use-remote-assist-hub';
import { endRemoteAssistSession, type RemoteAssistSession } from '@/services/remote-assist-api.service';
import { remoteAssistHubClient } from '@/lib/remote-assist-hub';

type Props = {
  session: RemoteAssistSession | null;
  userId?: number | string | null;
  onSessionChange?: (session: RemoteAssistSession | null) => void;
  onError?: (message: string) => void;
};

function isActiveStatus(status: string) {
  return status.trim().toLowerCase() === 'active';
}

function isEndedStatus(status: string) {
  const value = status.trim().toLowerCase();
  return value === 'ended' || value === 'denied' || value === 'expired';
}

function pointerPercent(event: React.PointerEvent<HTMLImageElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
  const y = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0;
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
}

function browserKeyToVk(event: React.KeyboardEvent): number {
  if (event.key.length === 1) {
    const upper = event.key.toUpperCase();
    const code = upper.charCodeAt(0);
    if (code >= 65 && code <= 90) return code;
    if (code >= 48 && code <= 57) return code;
  }

  const map: Record<string, number> = {
    Backspace: 8,
    Tab: 9,
    Enter: 13,
    Shift: 16,
    Control: 17,
    Alt: 18,
    Escape: 27,
    ' ': 32,
    PageUp: 33,
    PageDown: 34,
    End: 35,
    Home: 36,
    ArrowLeft: 37,
    ArrowUp: 38,
    ArrowRight: 39,
    ArrowDown: 40,
    Insert: 45,
    Delete: 46,
    Meta: 91,
  };

  if (map[event.key] != null) return map[event.key];
  return event.keyCode || 0;
}

export function RemoteAssistViewer({ session, userId, onSessionChange, onError }: Props) {
  const { t } = useLanguage();
  const [frameSrc, setFrameSrc] = React.useState<string | null>(null);
  const [ending, setEnding] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const sessionRef = React.useRef(session);
  sessionRef.current = session;

  const active = !!session && isActiveStatus(session.status);
  const allowControl = active && !!session?.allowRemoteControl;

  const clearFrame = React.useCallback(() => {
    setFrameSrc(null);
    setExpanded(false);
  }, []);

  useRemoteAssistHub({
    enabled: !!session && session.sessionId > 0,
    userId,
    sessionId: session?.sessionId ?? null,
    handlers: {
      onSessionChanged: (payload) => {
        const current = sessionRef.current;
        if (!current || payload.sessionId !== current.sessionId) return;
        if (isEndedStatus(String(payload.status))) {
          clearFrame();
          onSessionChange?.(null);
          return;
        }
        onSessionChange?.(payload);
      },
      onConsentResolved: (payload) => {
        const current = sessionRef.current;
        if (!current || payload.sessionId !== current.sessionId) return;
        if (isEndedStatus(String(payload.status))) {
          clearFrame();
          onSessionChange?.(null);
          return;
        }
        onSessionChange?.(payload);
      },
      onScreenFrame: (payload) => {
        const current = sessionRef.current;
        if (!current || payload.sessionId !== current.sessionId || !payload.jpegBase64) return;
        if (!isActiveStatus(current.status)) return;
        setFrameSrc(
          payload.jpegBase64.startsWith('data:')
            ? payload.jpegBase64
            : `data:image/jpeg;base64,${payload.jpegBase64}`
        );
      },
    },
  });

  React.useEffect(() => {
    clearFrame();
  }, [session?.sessionId, clearFrame]);

  React.useEffect(() => {
    if (!session || isEndedStatus(session.status) || !isActiveStatus(session.status)) {
      clearFrame();
    }
  }, [session, clearFrame]);

  React.useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  const relayInput = React.useCallback(
    (payloadJson: string) => {
      if (!session || !allowControl) return;
      void remoteAssistHubClient.relayInput(session.sessionId, payloadJson);
    },
    [allowControl, session]
  );

  const handleEnd = async () => {
    if (!session || ending) return;
    setEnding(true);
    try {
      await endRemoteAssistSession(session.sessionId);
      clearFrame();
      onSessionChange?.(null);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : t('remote_assist_end_failed'));
    } finally {
      setEnding(false);
    }
  };

  const renderScreen = (className: string) => (
    <div
      className="outline-none"
      tabIndex={allowControl ? 0 : -1}
      onKeyDown={(e) => {
        if (!allowControl) return;
        e.preventDefault();
        const vk = browserKeyToVk(e);
        if (vk) void relayInput(JSON.stringify({ kind: 'key', vk, down: true }));
      }}
      onKeyUp={(e) => {
        if (!allowControl) return;
        e.preventDefault();
        const vk = browserKeyToVk(e);
        if (vk) void relayInput(JSON.stringify({ kind: 'key', vk, down: false }));
      }}
    >
      <div className={`relative overflow-hidden rounded-lg border bg-black ${className}`}>
        {frameSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frameSrc}
            alt="صفحه ریموت"
            className="mx-auto h-full w-full object-contain"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onPointerMove={(e) => {
              if (!allowControl) return;
              const { x, y } = pointerPercent(e);
              void relayInput(JSON.stringify({ kind: 'mouseMove', x, y }));
            }}
            onPointerDown={(e) => {
              if (!allowControl) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              const { x, y } = pointerPercent(e);
              void relayInput(
                JSON.stringify({
                  kind: 'mouseButton',
                  button: e.button === 2 ? 2 : 0,
                  down: true,
                  x,
                  y,
                })
              );
            }}
            onPointerUp={(e) => {
              if (!allowControl) return;
              const { x, y } = pointerPercent(e);
              void relayInput(
                JSON.stringify({
                  kind: 'mouseButton',
                  button: e.button === 2 ? 2 : 0,
                  down: false,
                  x,
                  y,
                })
              );
            }}
            style={{ cursor: allowControl ? 'crosshair' : 'default' }}
          />
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>
              {active ? t('remote_assist_waiting_frames') : `${t('remote_assist_status')}: ${session?.status}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (!session || isEndedStatus(session.status)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('remote_assist_viewer_title')}</CardTitle>
          <CardDescription>{t('remote_assist_viewer_empty')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
            <MonitorOff className="h-8 w-8" />
            <p className="text-sm">{t('remote_assist_no_session')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{t('remote_assist_viewer_title')}</CardTitle>
            <CardDescription>
              #{session.sessionId} · {session.status}
              {allowControl ? ` · ${t('remote_assist_control_enabled')}` : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!frameSrc}
              onClick={() => setExpanded(true)}
            >
              <Maximize2 className="mr-2 h-4 w-4" />
              {t('remote_assist_expand')}
            </Button>
            {active ? (
              <Button type="button" variant="destructive" size="sm" onClick={() => void handleEnd()} disabled={ending}>
                {ending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                {t('remote_assist_end')}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>{renderScreen('max-h-[min(70vh,720px)]')}</CardContent>
      </Card>

      {expanded ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-white/80">{t('remote_assist_viewer_title')}</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => setExpanded(false)}>
              <Minimize2 className="mr-2 h-4 w-4" />
              {t('remote_assist_collapse')}
            </Button>
          </div>
          <div className="min-h-0 flex-1">{renderScreen('h-full')}</div>
        </div>
      ) : null}
    </>
  );
}

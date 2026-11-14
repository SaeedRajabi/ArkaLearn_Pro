'use client';

import { useEffect, useRef } from 'react';
import {
  normalizeScreenFrame,
  normalizeSessionEvent,
  remoteAssistHubClient,
  type RemoteAssistHubEvent,
  type RemoteAssistScreenFramePayload,
  type RemoteAssistSessionChangedPayload,
} from '@/lib/remote-assist-hub';

type HubHandlers = {
  onSessionChanged?: (payload: RemoteAssistSessionChangedPayload) => void;
  onConsentResolved?: (payload: RemoteAssistSessionChangedPayload) => void;
  onScreenFrame?: (payload: RemoteAssistScreenFramePayload) => void;
};

export function useRemoteAssistHub(options: {
  userId?: number | string | null;
  sessionId?: number | null;
  enabled?: boolean;
  handlers?: HubHandlers;
}) {
  const handlersRef = useRef(options.handlers);
  handlersRef.current = options.handlers;
  const enabled = options.enabled ?? true;
  const sessionId = options.sessionId != null ? Number(options.sessionId) : 0;
  const userId = options.userId != null ? Number(options.userId) : 0;

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    const subscribe = async () => {
      try {
        const connection = await remoteAssistHubClient.acquire();
        if (!active || !connection) return;

        if (userId > 0) {
          await connection.invoke('JoinUser', userId);
        }
        if (sessionId > 0) {
          await connection.invoke('JoinSession', sessionId);
        }
      } catch {
        /* optional */
      }
    };

    const onSessionChanged = (...args: unknown[]) => {
      handlersRef.current?.onSessionChanged?.(normalizeSessionEvent(args[0]));
    };
    const onConsentResolved = (...args: unknown[]) => {
      handlersRef.current?.onConsentResolved?.(normalizeSessionEvent(args[0]));
    };
    const onScreenFrame = (...args: unknown[]) => {
      handlersRef.current?.onScreenFrame?.(normalizeScreenFrame(args[0]));
    };

    const events: [RemoteAssistHubEvent, (...args: unknown[]) => void][] = [
      ['SessionChanged', onSessionChanged],
      ['ConsentResolved', onConsentResolved],
      ['ScreenFrame', onScreenFrame],
    ];

    events.forEach(([event, handler]) => remoteAssistHubClient.on(event, handler));
    void subscribe();

    return () => {
      active = false;
      events.forEach(([event, handler]) => remoteAssistHubClient.off(event, handler));
      void remoteAssistHubClient
        .leaveGroups({
          sessionId: sessionId > 0 ? sessionId : undefined,
          userId: userId > 0 ? userId : undefined,
        })
        .finally(() => remoteAssistHubClient.release());
    };
  }, [enabled, sessionId, userId]);
}

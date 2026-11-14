'use client';

import { useEffect, useRef } from 'react';
import {
  normalizeInputRelay,
  normalizeScreenFrame,
  normalizeSessionEvent,
  normalizeUserPresenceChanged,
  remoteAssistHubClient,
  type RemoteAssistHubEvent,
  type RemoteAssistInputRelayPayload,
  type RemoteAssistScreenFramePayload,
  type RemoteAssistSessionChangedPayload,
  type RemoteAssistUserPresenceChangedPayload,
} from '@/lib/signalr/remote-assist-hub';

type HubHandlers = {
  onSessionChanged?: (payload: RemoteAssistSessionChangedPayload) => void;
  onConsentRequired?: (payload: RemoteAssistSessionChangedPayload) => void;
  onConsentResolved?: (payload: RemoteAssistSessionChangedPayload) => void;
  onScreenFrame?: (payload: RemoteAssistScreenFramePayload) => void;
  onInputRelay?: (payload: RemoteAssistInputRelayPayload) => void;
  onUserPresenceChanged?: (payload: RemoteAssistUserPresenceChangedPayload) => void;
};

export function useRemoteAssistHub(options: {
  userId?: number | string | null;
  sessionId?: number | null;
  enabled?: boolean;
  joinTeacherPool?: boolean;
  handlers?: HubHandlers;
}) {
  const handlersRef = useRef(options.handlers);
  handlersRef.current = options.handlers;
  const enabled = options.enabled ?? true;
  const sessionId = options.sessionId != null ? Number(options.sessionId) : 0;
  const userId = options.userId != null ? Number(options.userId) : 0;
  const joinTeacherPool = options.joinTeacherPool ?? false;

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    const subscribe = async () => {
      try {
        const connection = await remoteAssistHubClient.acquire();
        if (!active || !connection) return;

        if (userId > 0) {
          await remoteAssistHubClient.joinUser(userId);
        }
        if (sessionId > 0) {
          await remoteAssistHubClient.joinSession(sessionId);
        }
        if (joinTeacherPool) {
          await remoteAssistHubClient.joinTeacherPool();
        }
      } catch {
        /* optional realtime */
      }
    };

    const onSessionChanged = (...args: unknown[]) => {
      handlersRef.current?.onSessionChanged?.(normalizeSessionEvent(args[0]));
    };
    const onConsentRequired = (...args: unknown[]) => {
      handlersRef.current?.onConsentRequired?.(normalizeSessionEvent(args[0]));
    };
    const onConsentResolved = (...args: unknown[]) => {
      handlersRef.current?.onConsentResolved?.(normalizeSessionEvent(args[0]));
    };
    const onScreenFrame = (...args: unknown[]) => {
      handlersRef.current?.onScreenFrame?.(normalizeScreenFrame(args[0]));
    };
    const onInputRelay = (...args: unknown[]) => {
      handlersRef.current?.onInputRelay?.(normalizeInputRelay(args[0]));
    };
    const onUserPresenceChanged = (...args: unknown[]) => {
      handlersRef.current?.onUserPresenceChanged?.(normalizeUserPresenceChanged(args[0]));
    };

    const events: [RemoteAssistHubEvent, (...args: unknown[]) => void][] = [
      ['SessionChanged', onSessionChanged],
      ['ConsentRequired', onConsentRequired],
      ['ConsentResolved', onConsentResolved],
      ['ScreenFrame', onScreenFrame],
      ['InputRelay', onInputRelay],
      ['UserPresenceChanged', onUserPresenceChanged],
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
          teacherPool: joinTeacherPool,
        })
        .finally(() => remoteAssistHubClient.release());
    };
  }, [enabled, joinTeacherPool, sessionId, userId]);
}

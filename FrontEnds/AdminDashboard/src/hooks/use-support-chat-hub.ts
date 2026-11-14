'use client';

import { useEffect, useRef } from 'react';
import { supportChatHubClient, type SupportChatHubEvent } from '@/lib/support-chat-hub';

type HubHandlers = {
  onMessagePosted?: () => void;
  onConversationOpened?: () => void;
  onNotificationPulse?: () => void;
};

export function useSupportChatHub(options: {
  userId?: number | string | null;
  enabled?: boolean;
  handlers?: HubHandlers;
}) {
  const handlersRef = useRef(options.handlers);
  handlersRef.current = options.handlers;
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    const subscribe = async () => {
      try {
        const connection = await supportChatHubClient.acquire();
        if (!active || !connection) return;

        const userId = options.userId != null ? Number(options.userId) : 0;
        if (userId > 0) {
          await connection.invoke('JoinUser', userId);
        }
      } catch {
        /* optional */
      }
    };

    const onMessagePosted = () => handlersRef.current?.onMessagePosted?.();
    const onConversationOpened = () => handlersRef.current?.onConversationOpened?.();
    const onNotificationPulse = () => handlersRef.current?.onNotificationPulse?.();

    const events: [SupportChatHubEvent, (...args: unknown[]) => void][] = [
      ['MessagePosted', onMessagePosted],
      ['ConversationOpened', onConversationOpened],
      ['NotificationPulse', onNotificationPulse],
    ];

    events.forEach(([event, handler]) => supportChatHubClient.on(event, handler));
    void subscribe();

    return () => {
      active = false;
      events.forEach(([event, handler]) => supportChatHubClient.off(event, handler));
      supportChatHubClient.release();
    };
  }, [enabled, options.userId]);
}

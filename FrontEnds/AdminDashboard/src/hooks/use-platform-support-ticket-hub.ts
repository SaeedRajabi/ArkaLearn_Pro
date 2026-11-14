'use client';

import { useEffect, useRef } from 'react';
import {
  platformSupportTicketHubClient,
  type PlatformTicketHubEvent,
  type PlatformTicketMessagePostedPayload,
} from '@/lib/platform-support-ticket-hub';

type HubHandlers = {
  onTicketOpened?: (payload: unknown) => void;
  onMessagePosted?: (payload: PlatformTicketMessagePostedPayload) => void;
  onTicketStatusChanged?: (payload: unknown) => void;
  onNotificationPulse?: () => void;
};

export function usePlatformSupportTicketHub(options: {
  ticketId?: number;
  userId?: number | string | null;
  isAdmin?: boolean;
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
        const connection = await platformSupportTicketHubClient.acquire();
        if (!active || !connection) return;

        if (options.isAdmin) {
          await connection.invoke('JoinAdmins');
        }

        if (options.ticketId && options.ticketId > 0) {
          await connection.invoke('JoinTicket', options.ticketId);
        }

        const userId = options.userId != null ? Number(options.userId) : 0;
        if (userId > 0) {
          await connection.invoke('JoinUser', userId);
        }
      } catch {
        /* optional */
      }
    };

    const onTicketOpened = (...args: unknown[]) => {
      handlersRef.current?.onTicketOpened?.(args[0]);
    };
    const onMessagePosted = (...args: unknown[]) => {
      handlersRef.current?.onMessagePosted?.(args[0] as PlatformTicketMessagePostedPayload);
    };
    const onTicketStatusChanged = (...args: unknown[]) => {
      handlersRef.current?.onTicketStatusChanged?.(args[0]);
    };
    const onNotificationPulse = () => {
      handlersRef.current?.onNotificationPulse?.();
    };

    const events: [PlatformTicketHubEvent, (...args: unknown[]) => void][] = [
      ['TicketOpened', onTicketOpened],
      ['MessagePosted', onMessagePosted],
      ['TicketStatusChanged', onTicketStatusChanged],
      ['NotificationPulse', onNotificationPulse],
    ];

    events.forEach(([event, handler]) => platformSupportTicketHubClient.on(event, handler));
    void subscribe();

    return () => {
      active = false;
      events.forEach(([event, handler]) => platformSupportTicketHubClient.off(event, handler));
      platformSupportTicketHubClient.release();
    };
  }, [enabled, options.ticketId, options.userId, options.isAdmin]);
}

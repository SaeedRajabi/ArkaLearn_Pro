'use client';

import { useEffect, useRef } from 'react';
import {
  platformSupportTicketHubClient,
  type MessagePostedPayload,
  type PlatformSupportTicketHubEvent,
  type TicketOpenedPayload,
  type TicketStatusChangedPayload,
} from '@/lib/signalr/platform-support-ticket-hub';

type HubHandlers = {
  onTicketOpened?: (payload: TicketOpenedPayload) => void;
  onMessagePosted?: (payload: MessagePostedPayload) => void;
  onTicketStatusChanged?: (payload: TicketStatusChangedPayload) => void;
  onNotificationPulse?: () => void;
};

export function usePlatformSupportTicketHub(options: {
  ticketId?: number;
  userId?: number | string | null;
  handlers?: HubHandlers;
}) {
  const handlersRef = useRef(options.handlers);
  handlersRef.current = options.handlers;

  useEffect(() => {
    let active = true;

    const subscribe = async () => {
      try {
        const connection = await platformSupportTicketHubClient.acquire();
        if (!active || !connection) return;

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
      handlersRef.current?.onTicketOpened?.(args[0] as TicketOpenedPayload);
    };
    const onMessagePosted = (...args: unknown[]) => {
      handlersRef.current?.onMessagePosted?.(args[0] as MessagePostedPayload);
    };
    const onTicketStatusChanged = (...args: unknown[]) => {
      handlersRef.current?.onTicketStatusChanged?.(args[0] as TicketStatusChangedPayload);
    };
    const onNotificationPulse = () => {
      handlersRef.current?.onNotificationPulse?.();
    };

    const events: [PlatformSupportTicketHubEvent, (...args: unknown[]) => void][] = [
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
      void platformSupportTicketHubClient.leaveGroups({
        ticketId: options.ticketId,
        userId: options.userId != null ? Number(options.userId) : undefined,
      });
      platformSupportTicketHubClient.release();
    };
  }, [options.ticketId, options.userId]);
}

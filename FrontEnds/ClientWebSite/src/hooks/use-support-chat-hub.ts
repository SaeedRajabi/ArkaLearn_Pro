'use client';

import { useEffect, useRef } from 'react';
import {
  supportChatHubClient,
  type ConversationDeletedPayload,
  type ConversationOpenedPayload,
  type ConversationStatusChangedPayload,
  type ConversationUpdatedPayload,
  type MessageDeletedPayload,
  type MessagePostedPayload,
  type MessageUpdatedPayload,
  type MessagesDeliveredPayload,
  type MessagesReadPayload,
  type SupportChatHubEvent,
  type UserPresenceChangedPayload,
} from '@/lib/signalr/support-chat-hub';

type HubHandlers = {
  onMessagePosted?: (payload: MessagePostedPayload) => void;
  onMessageUpdated?: (payload: MessageUpdatedPayload) => void;
  onMessageDeleted?: (payload: MessageDeletedPayload) => void;
  onConversationOpened?: (payload: ConversationOpenedPayload) => void;
  onConversationUpdated?: (payload: ConversationUpdatedPayload) => void;
  onConversationDeleted?: (payload: ConversationDeletedPayload) => void;
  onConversationStatusChanged?: (payload: ConversationStatusChangedPayload) => void;
  onMessagesDelivered?: (payload: MessagesDeliveredPayload) => void;
  onMessagesRead?: (payload: MessagesReadPayload) => void;
  onNotificationPulse?: () => void;
  onUserPresenceChanged?: (payload: UserPresenceChangedPayload) => void;
};

export function useSupportChatHub(options: {
  conversationId?: number;
  userId?: number | string | null;
  watchPresenceUserId?: number | null;
  handlers?: HubHandlers;
}) {
  const handlersRef = useRef(options.handlers);
  handlersRef.current = options.handlers;
  const watchPresenceUserId =
    options.watchPresenceUserId != null ? Number(options.watchPresenceUserId) : 0;

  useEffect(() => {
    let active = true;

    const subscribe = async () => {
      try {
        const connection = await supportChatHubClient.acquire();
        if (!active || !connection) return;

        if (options.conversationId && options.conversationId > 0) {
          await connection.invoke('JoinConversation', options.conversationId);
        }

        const userId = options.userId != null ? Number(options.userId) : 0;
        if (userId > 0) {
          await connection.invoke('JoinUser', userId);
        }

        if (watchPresenceUserId > 0) {
          await connection.invoke('WatchUserPresence', watchPresenceUserId);
        }
      } catch {
        /* optional */
      }
    };

    const onMessagePosted = (...args: unknown[]) => {
      handlersRef.current?.onMessagePosted?.(args[0] as MessagePostedPayload);
    };
    const onMessageUpdated = (...args: unknown[]) => {
      handlersRef.current?.onMessageUpdated?.(args[0] as MessageUpdatedPayload);
    };
    const onMessageDeleted = (...args: unknown[]) => {
      handlersRef.current?.onMessageDeleted?.(args[0] as MessageDeletedPayload);
    };
    const onConversationOpened = (...args: unknown[]) => {
      handlersRef.current?.onConversationOpened?.(args[0] as ConversationOpenedPayload);
    };
    const onConversationUpdated = (...args: unknown[]) => {
      handlersRef.current?.onConversationUpdated?.(args[0] as ConversationUpdatedPayload);
    };
    const onConversationDeleted = (...args: unknown[]) => {
      handlersRef.current?.onConversationDeleted?.(args[0] as ConversationDeletedPayload);
    };
    const onConversationStatusChanged = (...args: unknown[]) => {
      handlersRef.current?.onConversationStatusChanged?.(args[0] as ConversationStatusChangedPayload);
    };
    const onMessagesDelivered = (...args: unknown[]) => {
      handlersRef.current?.onMessagesDelivered?.(args[0] as MessagesDeliveredPayload);
    };
    const onMessagesRead = (...args: unknown[]) => {
      handlersRef.current?.onMessagesRead?.(args[0] as MessagesReadPayload);
    };
    const onNotificationPulse = () => {
      handlersRef.current?.onNotificationPulse?.();
    };
    const onUserPresenceChanged = (...args: unknown[]) => {
      handlersRef.current?.onUserPresenceChanged?.(args[0] as UserPresenceChangedPayload);
    };

    const events: [SupportChatHubEvent, (...args: unknown[]) => void][] = [
      ['MessagePosted', onMessagePosted],
      ['MessageUpdated', onMessageUpdated],
      ['MessageDeleted', onMessageDeleted],
      ['ConversationOpened', onConversationOpened],
      ['ConversationUpdated', onConversationUpdated],
      ['ConversationDeleted', onConversationDeleted],
      ['ConversationStatusChanged', onConversationStatusChanged],
      ['MessagesDelivered', onMessagesDelivered],
      ['MessagesRead', onMessagesRead],
      ['NotificationPulse', onNotificationPulse],
      ['UserPresenceChanged', onUserPresenceChanged],
    ];

    events.forEach(([event, handler]) => supportChatHubClient.on(event, handler));
    void subscribe();

    return () => {
      active = false;
      events.forEach(([event, handler]) => supportChatHubClient.off(event, handler));

      const userId = options.userId != null ? Number(options.userId) : 0;
      void supportChatHubClient
        .leaveGroups({
          conversationId: options.conversationId,
          userId: userId > 0 ? userId : undefined,
          watchPresenceUserId: watchPresenceUserId > 0 ? watchPresenceUserId : undefined,
        })
        .finally(() => supportChatHubClient.release());
    };
  }, [options.conversationId, options.userId, watchPresenceUserId]);
}

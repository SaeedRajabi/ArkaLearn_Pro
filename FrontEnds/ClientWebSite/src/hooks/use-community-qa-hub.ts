'use client';

import { useEffect, useRef } from 'react';
import {
  communityQaHubClient,
  type CommunityQaHubEvent,
  type ReplyLikeChangedPayload,
  type ReplyPostedPayload,
  type ThreadCreatedPayload,
  type ThreadReactionChangedPayload,
} from '@/lib/signalr/community-qa-hub';

type HubHandlers = {
  onThreadCreated?: (payload: ThreadCreatedPayload) => void;
  onReplyPosted?: (payload: ReplyPostedPayload) => void;
  onThreadReactionChanged?: (payload: ThreadReactionChangedPayload) => void;
  onReplyLikeChanged?: (payload: ReplyLikeChangedPayload) => void;
  onNotificationPulse?: () => void;
};

export function useCommunityQaHub(options: {
  threadId?: number;
  userId?: number | string | null;
  onList?: boolean;
  handlers?: HubHandlers;
}) {
  const handlersRef = useRef(options.handlers);
  handlersRef.current = options.handlers;

  useEffect(() => {
    const hasTarget =
      Boolean(options.onList) ||
      Boolean(options.threadId && options.threadId > 0) ||
      Boolean(options.userId != null && String(options.userId).trim() !== '' && String(options.userId) !== '0');

    if (!hasTarget) return;

    let active = true;

    const subscribe = async () => {
      try {
        const connection = await communityQaHubClient.acquire();
        if (!active || !connection) return;

        if (options.onList) {
          await connection.invoke('JoinList');
        }

        if (options.threadId && options.threadId > 0) {
          await connection.invoke('JoinThread', options.threadId);
        }

        const userId = options.userId != null ? Number(options.userId) : 0;
        if (userId > 0) {
          await connection.invoke('JoinUser', userId);
        }
      } catch {
        /* hub optional */
      }
    };

    const onThreadCreated = (...args: unknown[]) => {
      handlersRef.current?.onThreadCreated?.(args[0] as ThreadCreatedPayload);
    };
    const onReplyPosted = (...args: unknown[]) => {
      handlersRef.current?.onReplyPosted?.(args[0] as ReplyPostedPayload);
    };
    const onThreadReactionChanged = (...args: unknown[]) => {
      handlersRef.current?.onThreadReactionChanged?.(args[0] as ThreadReactionChangedPayload);
    };
    const onReplyLikeChanged = (...args: unknown[]) => {
      handlersRef.current?.onReplyLikeChanged?.(args[0] as ReplyLikeChangedPayload);
    };
    const onNotificationPulse = () => {
      handlersRef.current?.onNotificationPulse?.();
    };

    const events: [CommunityQaHubEvent, (...args: unknown[]) => void][] = [
      ['ThreadCreated', onThreadCreated],
      ['ReplyPosted', onReplyPosted],
      ['ThreadReactionChanged', onThreadReactionChanged],
      ['ReplyLikeChanged', onReplyLikeChanged],
      ['NotificationPulse', onNotificationPulse],
    ];

    events.forEach(([event, handler]) => communityQaHubClient.on(event, handler));
    void subscribe();

    return () => {
      active = false;
      events.forEach(([event, handler]) => communityQaHubClient.off(event, handler));

      const userId = options.userId != null ? Number(options.userId) : 0;
      void communityQaHubClient
        .leaveGroups({
          threadId: options.threadId,
          userId: userId > 0 ? userId : undefined,
          onList: options.onList,
        })
        .finally(() => communityQaHubClient.release());
    };
  }, [options.threadId, options.userId, options.onList]);
}

export function scrollToCommunityReply(replyId: number, highlight = true) {
  const el = document.getElementById(`reply-${replyId}`);
  if (!el) return false;

  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (highlight) {
    el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
    window.setTimeout(() => {
      el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
    }, 3000);
  }
  return true;
}

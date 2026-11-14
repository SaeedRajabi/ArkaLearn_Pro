'use client';

import { useEffect, useRef } from 'react';
import {
  engagementHubClient,
  type CommentAddedPayload,
  type EngagementHubEvent,
  type LikeChangedPayload,
} from '@/lib/signalr/engagement-hub';

type HubHandlers = {
  onCommentAdded?: (payload: CommentAddedPayload) => void;
  onLikeChanged?: (payload: LikeChangedPayload) => void;
  onNotificationPulse?: () => void;
};

export function useEngagementHub(options: {
  courseId?: number;
  articleId?: number;
  videoId?: number;
  userId?: number | string | null;
  handlers?: HubHandlers;
}) {
  const handlersRef = useRef(options.handlers);
  handlersRef.current = options.handlers;

  useEffect(() => {
    const hasTarget =
      Boolean(options.courseId && options.courseId > 0) ||
      Boolean(options.articleId && options.articleId > 0) ||
      Boolean(options.videoId && options.videoId > 0) ||
      Boolean(options.userId != null && String(options.userId).trim() !== '' && String(options.userId) !== '0');

    if (!hasTarget) return;

    let active = true;

    const subscribe = async () => {
      try {
        const connection = await engagementHubClient.acquire();
        if (!active || !connection) return;

        if (options.courseId && options.courseId > 0) {
          await connection.invoke('JoinCourse', options.courseId);
        }

        if (options.articleId && options.articleId > 0) {
          await connection.invoke('JoinArticle', options.articleId);
        }

        if (options.videoId && options.videoId > 0) {
          await connection.invoke('JoinVideo', options.videoId);
        }

        const userId = options.userId != null ? Number(options.userId) : 0;
        if (userId > 0) {
          await connection.invoke('JoinUser', userId);
        }
      } catch {
        /* hub optional */
      }
    };

    const onCommentAdded = (...args: unknown[]) => {
      handlersRef.current?.onCommentAdded?.(args[0] as CommentAddedPayload);
    };
    const onLikeChanged = (...args: unknown[]) => {
      handlersRef.current?.onLikeChanged?.(args[0] as LikeChangedPayload);
    };
    const onNotificationPulse = () => {
      handlersRef.current?.onNotificationPulse?.();
    };

    const events: [EngagementHubEvent, (...args: unknown[]) => void][] = [
      ['CommentAdded', onCommentAdded],
      ['LikeChanged', onLikeChanged],
      ['NotificationPulse', onNotificationPulse],
    ];

    events.forEach(([event, handler]) => engagementHubClient.on(event, handler));
    void subscribe();

    return () => {
      active = false;
      events.forEach(([event, handler]) => engagementHubClient.off(event, handler));

      const userId = options.userId != null ? Number(options.userId) : 0;
      void engagementHubClient
        .leaveGroups({
          courseId: options.courseId,
          articleId: options.articleId,
          videoId: options.videoId,
          userId: userId > 0 ? userId : undefined,
        })
        .finally(() => engagementHubClient.release());
    };
  }, [options.courseId, options.articleId, options.videoId, options.userId]);
}

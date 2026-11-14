'use client';

import { useEffect, useRef } from 'react';
import {
  projectQaHubClient,
  type AnswerPostedPayload,
  type ProjectQaHubEvent,
  type QuestionReviewedPayload,
  type QuestionSubmittedPayload,
} from '@/lib/project-qa-hub';

type HubHandlers = {
  onAnswerPosted?: (payload: AnswerPostedPayload) => void;
  onQuestionSubmitted?: (payload: QuestionSubmittedPayload) => void;
  onQuestionReviewed?: (payload: QuestionReviewedPayload) => void;
  onNotificationPulse?: () => void;
};

export function useProjectQaHub(options: {
  projectId?: number;
  userId?: number | string | null;
  isAdmin?: boolean;
  handlers?: HubHandlers;
}) {
  const handlersRef = useRef(options.handlers);
  handlersRef.current = options.handlers;

  useEffect(() => {
    let active = true;

    const subscribe = async () => {
      try {
        const connection = await projectQaHubClient.acquire();
        if (!active) return;

        if (options.projectId && options.projectId > 0) {
          await connection.invoke('JoinProject', options.projectId);
        }

        const userId = options.userId != null ? Number(options.userId) : 0;
        if (userId > 0) {
          await connection.invoke('JoinUser', userId);
        }

        if (options.isAdmin) {
          await connection.invoke('JoinAdmin');
        }
      } catch {
        /* hub optional */
      }
    };

    const onAnswerPosted = (...args: unknown[]) => {
      handlersRef.current?.onAnswerPosted?.(args[0] as AnswerPostedPayload);
    };
    const onQuestionSubmitted = (...args: unknown[]) => {
      handlersRef.current?.onQuestionSubmitted?.(args[0] as QuestionSubmittedPayload);
    };
    const onQuestionReviewed = (...args: unknown[]) => {
      handlersRef.current?.onQuestionReviewed?.(args[0] as QuestionReviewedPayload);
    };
    const onNotificationPulse = () => {
      handlersRef.current?.onNotificationPulse?.();
    };

    const events: [ProjectQaHubEvent, (...args: unknown[]) => void][] = [
      ['AnswerPosted', onAnswerPosted],
      ['QuestionSubmitted', onQuestionSubmitted],
      ['QuestionReviewed', onQuestionReviewed],
      ['NotificationPulse', onNotificationPulse],
    ];

    events.forEach(([event, handler]) => projectQaHubClient.on(event, handler));
    void subscribe();

    return () => {
      active = false;
      events.forEach(([event, handler]) => projectQaHubClient.off(event, handler));

      const userId = options.userId != null ? Number(options.userId) : 0;
      void projectQaHubClient
        .leaveGroups({
          projectId: options.projectId,
          userId: userId > 0 ? userId : undefined,
          isAdmin: options.isAdmin,
        })
        .finally(() => projectQaHubClient.release());
    };
  }, [options.projectId, options.userId, options.isAdmin]);
}

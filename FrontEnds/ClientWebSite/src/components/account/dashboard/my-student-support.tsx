'use client';

import * as React from 'react';
import { Bell, ChevronLeft, Copy, Loader2, Lock, MessageCircle, Pencil, Plus, Reply, RotateCcw, Send, Trash2, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SupportMessageActionsMenu, type SupportMessageAction } from '@/components/support/support-message-actions-menu';
import { SupportMessageDeliveryTicks } from '@/components/support/support-message-delivery-ticks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { QaRichTextEditor } from '@/components/ui/qa-rich-text-editor';
import { QaContentHtml } from '@/components/shared/qa-content-html';
import { resolveQaMediaUrl } from '@/lib/qa-content-html';
import { SupportRatingDialog } from '@/components/support/support-rating-dialog';
import { TeacherStoriesPanel } from '@/components/support/teacher-stories-panel';
import { StudentSupportSubscriptionPanel } from './student-support-subscription-panel';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useSupportChatHub } from '@/hooks/use-support-chat-hub';
import { useSupportNotificationSettings } from '@/hooks/use-support-notifications';
import { getBackendApiOrigin } from '@/lib/api/config';
import { getDictValue } from '@/lib/i18n-client';
import { cn } from '@/lib/utils';
import {
  closeSupportConversation,
  deleteSupportConversation,
  deleteSupportMessage,
  getMySupportConversations,
  getStudentSupportTeachers,
  getSupportConversation,
  markSupportConversationRead,
  markSupportMessagesDelivered,
  mapRealtimeMessage,
  openSupportConversation,
  reopenSupportConversation,
  sendSupportMessage,
  stripSupportMessageHtml,
  submitSupportConversationRating,
  updateSupportConversationSubject,
  updateSupportMessage,
  getSupportChatErrorMessage,
  SUPPORT_MESSAGE_PAGE_SIZE,
  uploadSupportChatAudio,
  uploadSupportChatImage,
  uploadSupportChatVideo,
  type SupportConversationDetail,
  type SupportConversationRow,
  type SupportMessageRow,
  type SupportMessageDeliveryStatus,
  type SupportTeacherOption,
} from '@/lib/api/support-chat';
import { fetchMySupportSubscriptionStatus, type StudentSupportStatus } from '@/lib/api/support-subscription';
import { ProfessorGrantSupportMonthsCard } from '@/components/professor/support/professor-grant-support-months-card';
import type {
  ConversationDeletedPayload,
  ConversationUpdatedPayload,
  MessageDeletedPayload,
  MessagePostedPayload,
  MessageUpdatedPayload,
  MessagesDeliveredPayload,
  MessagesReadPayload,
} from '@/lib/signalr/support-chat-hub';
import { asLongId } from '@/lib/id';

type SupportChatWorkspaceProps = {
  dict: Dictionary;
  mode: 'student' | 'teacher';
  conversationQueryKey?: string;
  filterStudentUserId?: string;
  studentDisplayName?: string;
  onBackToStudents?: () => void;
  filterTeacherUserId?: string;
  teacherDisplayName?: string;
  onBackToTeachers?: () => void;
  onStudentsRefresh?: () => void;
  onMobileChatViewChange?: (inChatView: boolean) => void;
};

/** Below Tailwind `lg` — single-panel navigation like WhatsApp */
const MOBILE_LAYOUT_MAX_WIDTH = 1023;

function formatTime(value: string, locale: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  return resolveQaMediaUrl(url);
}

function isConversationClosed(status?: string | null) {
  return (status ?? '').toLowerCase() === 'closed';
}

function applyDeliveredReceipts(messages: SupportMessageRow[], messageIds: number[]): SupportMessageRow[] {
  const idSet = new Set(messageIds);
  return messages.map((m) => {
    if (!m.isMine || !idSet.has(m.id) || m.deliveryStatus === 'read') return m;
    return { ...m, deliveryStatus: 'delivered' satisfies SupportMessageDeliveryStatus };
  });
}

function applyReadReceipts(
  messages: SupportMessageRow[],
  detail: SupportConversationDetail,
  payload: Pick<MessagesReadPayload, 'readerUserId' | 'studentLastReadAtUtc' | 'teacherLastReadAtUtc'>
): SupportMessageRow[] {
  const readerIsStudent = payload.readerUserId === detail.studentUserId;
  const readerIsTeacher = payload.readerUserId === detail.teacherUserId;
  if (!readerIsStudent && !readerIsTeacher) return messages;

  const readAt = readerIsStudent ? payload.studentLastReadAtUtc : payload.teacherLastReadAtUtc;
  if (!readAt) return messages;

  const readTime = new Date(readAt).getTime();
  if (Number.isNaN(readTime)) return messages;

  return messages.map((m) => {
    if (!m.isMine) return m;
    const sentTime = new Date(m.sentAtUtc).getTime();
    if (Number.isNaN(sentTime) || sentTime > readTime) return m;
    return { ...m, deliveryStatus: 'read' satisfies SupportMessageDeliveryStatus };
  });
}

function buildMessageActions(options: {
  message: SupportMessageRow;
  isClosed: boolean;
  isRtl: boolean;
  t: (key: string, def: string) => string;
  onCopy: (message: SupportMessageRow) => void;
  onReply: (message: SupportMessageRow) => void;
  onEdit: (message: SupportMessageRow) => void;
  onDelete: (message: SupportMessageRow) => void;
}): SupportMessageAction[] {
  const { message, isClosed, isRtl, t, onCopy, onReply, onEdit, onDelete } = options;
  const iconClass = cn('h-4 w-4', isRtl ? 'ms-0' : 'me-0');
  const actions: SupportMessageAction[] = [];

  if (!message.isDeleted) {
    actions.push({
      key: 'copy',
      label: t('supportChat.copyMessage', 'Copy text'),
      icon: <Copy className={iconClass} />,
      onClick: () => onCopy(message),
    });
  }

  if (!isClosed && !message.isDeleted) {
    actions.push({
      key: 'reply',
      label: t('supportChat.reply', 'Reply'),
      icon: <Reply className={iconClass} />,
      onClick: () => onReply(message),
    });
  }

  if (!isClosed && message.isMine && !message.isDeleted) {
    actions.push({
      key: 'edit',
      label: t('supportChat.editMessage', 'Edit'),
      icon: <Pencil className={iconClass} />,
      onClick: () => onEdit(message),
    });
    actions.push({
      key: 'delete',
      label: t('supportChat.deleteMessage', 'Delete'),
      icon: <Trash2 className={iconClass} />,
      onClick: () => onDelete(message),
      destructive: true,
      separatorBefore: true,
    });
  }

  return actions;
}

function buildTopicActions(options: {
  editingSubject: boolean;
  isClosed: boolean;
  mode: 'student' | 'teacher';
  hasRating: boolean;
  isRtl: boolean;
  t: (key: string, def: string) => string;
  onEditSubject: () => void;
  onDeleteTopic: () => void;
  onCloseTopic: () => void;
  onReopenTopic: () => void;
  onRate: () => void;
}): SupportMessageAction[] {
  const {
    editingSubject,
    isClosed,
    mode,
    hasRating,
    isRtl,
    t,
    onEditSubject,
    onDeleteTopic,
    onCloseTopic,
    onReopenTopic,
    onRate,
  } = options;

  if (editingSubject) return [];

  const iconClass = cn('h-4 w-4', isRtl ? 'ms-0' : 'me-0');
  const actions: SupportMessageAction[] = [];

  actions.push({
    key: 'edit-subject',
    label: t('supportChat.editSubject', 'Edit subject'),
    icon: <Pencil className={iconClass} />,
    onClick: onEditSubject,
  });

  if (!isClosed) {
    actions.push({
      key: 'close',
      label: t('supportChat.closeTopic', 'Close topic'),
      icon: <Lock className={iconClass} />,
      onClick: onCloseTopic,
    });
  } else if (mode === 'teacher') {
    actions.push({
      key: 'reopen',
      label: t('supportChat.reopenTopic', 'Reopen topic'),
      icon: <RotateCcw className={iconClass} />,
      onClick: onReopenTopic,
    });
  } else if (!hasRating) {
    actions.push({
      key: 'rate',
      label: t('supportChat.rateInstructor', 'Rate instructor'),
      icon: <MessageCircle className={iconClass} />,
      onClick: onRate,
    });
  }

  actions.push({
    key: 'delete',
    label: t('supportChat.deleteTopic', 'Delete topic'),
    icon: <Trash2 className={iconClass} />,
    onClick: onDeleteTopic,
    destructive: true,
    separatorBefore: true,
  });

  return actions;
}

export function SupportChatWorkspace({
  dict,
  mode,
  conversationQueryKey = 'conversation',
  filterStudentUserId,
  studentDisplayName,
  onBackToStudents,
  filterTeacherUserId,
  teacherDisplayName,
  onBackToTeachers,
  onStudentsRefresh,
  onMobileChatViewChange,
}: SupportChatWorkspaceProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = String(dict.locale ?? 'fa');
  const isRtl = locale === 'fa';
  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const { playSound, browserPermission, requestBrowserPermission, showBrowserNotification } =
    useSupportNotificationSettings();

  const toastRef = React.useRef(toast);
  const loadFailedRef = React.useRef(t('supportChat.loadFailed', 'Failed to load support chat'));
  const activeIdRef = React.useRef<number | null>(null);
  const userRef = React.useRef(user);
  const modeRef = React.useRef(mode);
  const filterStudentUserIdRef = React.useRef(filterStudentUserId);
  const filterTeacherUserIdRef = React.useRef(filterTeacherUserId);

  toastRef.current = toast;
  loadFailedRef.current = t('supportChat.loadFailed', 'Failed to load support chat');
  userRef.current = user;
  modeRef.current = mode;
  filterStudentUserIdRef.current = filterStudentUserId;
  filterTeacherUserIdRef.current = filterTeacherUserId;

  const [listLoading, setListLoading] = React.useState(true);
  const [conversations, setConversations] = React.useState<SupportConversationRow[]>([]);
  const [teachers, setTeachers] = React.useState<SupportTeacherOption[]>([]);
  const [teachersLoading, setTeachersLoading] = React.useState(false);
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [detail, setDetail] = React.useState<SupportConversationDetail | null>(null);
  const [composerHtml, setComposerHtml] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [reopening, setReopening] = React.useState(false);
  const [newSubject, setNewSubject] = React.useState('');
  const [newTeacherId, setNewTeacherId] = React.useState('');
  const [newInitialMessageHtml, setNewInitialMessageHtml] = React.useState('');
  const [showNewForm, setShowNewForm] = React.useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = React.useState(false);
  const [ratingConversationId, setRatingConversationId] = React.useState<number | null>(null);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const [editingMessageId, setEditingMessageId] = React.useState<number | null>(null);
  const [replyToMessage, setReplyToMessage] = React.useState<SupportMessageRow | null>(null);
  const [editingSubject, setEditingSubject] = React.useState(false);
  const [subjectDraft, setSubjectDraft] = React.useState('');
  const [savingSubject, setSavingSubject] = React.useState(false);
  const [deletingConversation, setDeletingConversation] = React.useState(false);
  const [loadingConversationId, setLoadingConversationId] = React.useState<number | null>(null);
  const [otherParticipantOnline, setOtherParticipantOnline] = React.useState<boolean | null>(null);
  const messagesScrollRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const stickToBottomRef = React.useRef(true);
  const loadingOlderRef = React.useRef(false);
  const isMobileLayoutRef = React.useRef(false);
  const initialConversationFromUrlRef = React.useRef<number | null>(null);

  const [isMobileLayout, setIsMobileLayout] = React.useState(false);
  const [supportStatus, setSupportStatus] = React.useState<StudentSupportStatus | null>(null);
  const [supportStatusLoading, setSupportStatusLoading] = React.useState(mode === 'student');

  const canUseSupport =
    mode !== 'student' || (supportStatus?.hasActiveAccess === true && supportStatus.isFrozen !== true);

  activeIdRef.current = activeId;
  isMobileLayoutRef.current = isMobileLayout;

  if (initialConversationFromUrlRef.current === null) {
    initialConversationFromUrlRef.current = Number(searchParams.get(conversationQueryKey) || 0);
  }

  const isClosed = detail ? isConversationClosed(detail.status) : false;
  const isOpeningConversation = loadingConversationId != null;
  const showMobileChat =
    isMobileLayout && activeId != null && (detail != null || loadingConversationId === activeId);
  const otherParticipantUserId = detail
    ? mode === 'student'
      ? detail.teacherUserId
      : detail.studentUserId
    : null;

  React.useEffect(() => {
    setOtherParticipantOnline(null);
  }, [otherParticipantUserId, activeId]);

  const refreshSupportStatus = React.useCallback(async () => {
    if (modeRef.current !== 'student') return;
    setSupportStatusLoading(true);
    try {
      const status = await fetchMySupportSubscriptionStatus();
      setSupportStatus(status);
    } catch {
      setSupportStatus(null);
    } finally {
      setSupportStatusLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (mode !== 'student') return;
    void refreshSupportStatus();
  }, [mode, refreshSupportStatus]);

  React.useEffect(() => {
    if (mode !== 'student') return;

    const onFocus = () => {
      void refreshSupportStatus();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [mode, refreshSupportStatus]);

  React.useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX_WIDTH}px)`);
    const sync = () => setIsMobileLayout(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  React.useEffect(() => {
    onMobileChatViewChange?.(showMobileChat);
  }, [onMobileChatViewChange, showMobileChat]);

  const updateConversationUrl = React.useCallback(
    (conversationId: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (conversationId != null && conversationId > 0) {
        params.set(conversationQueryKey, String(conversationId));
      } else {
        params.delete(conversationQueryKey);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [conversationQueryKey, pathname, router, searchParams]
  );

  const clearConversationView = React.useCallback(() => {
    setActiveId(null);
    setDetail(null);
    setEditingSubject(false);
    setEditingMessageId(null);
    setReplyToMessage(null);
    setComposerHtml('');
    updateConversationUrl(null);
  }, [updateConversationUrl]);

  const goBackToTopics = React.useCallback(() => {
    setLoadingConversationId(null);
    clearConversationView();
  }, [clearConversationView]);

  const loadList = React.useCallback(async () => {
    const studentId =
      modeRef.current === 'teacher' && filterStudentUserIdRef.current
        ? filterStudentUserIdRef.current
        : undefined;
    let rows = await getMySupportConversations(studentId);
    const teacherFilter = filterTeacherUserIdRef.current;
    if (modeRef.current === 'student' && teacherFilter) {
      rows = rows.filter((row) => String(row.teacherUserId) === String(teacherFilter));
    }
    setConversations(rows);
    return rows;
  }, []);

  const refreshTeachers = React.useCallback(async () => {
    if (modeRef.current !== 'student') return [];
    setTeachersLoading(true);
    try {
      const teacherRows = await getStudentSupportTeachers();
      setTeachers(teacherRows);
      return teacherRows;
    } finally {
      setTeachersLoading(false);
    }
  }, []);

  const loadDetail = React.useCallback(async (conversationId: number, options?: { beforeMessageId?: number }) => {
    const data = await getSupportConversation(conversationId, {
      messageTake: SUPPORT_MESSAGE_PAGE_SIZE,
      beforeMessageId: options?.beforeMessageId,
    });
    if (!options?.beforeMessageId) {
      await markSupportConversationRead(conversationId);
      void loadList();
    }
    return data;
  }, [loadList]);

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const loadInitialDetail = React.useCallback(
    async (conversationId: number) => {
      stickToBottomRef.current = true;
      const data = await loadDetail(conversationId);
      setDetail(data);
      requestAnimationFrame(() => {
        scrollToBottom('auto');
        requestAnimationFrame(() => scrollToBottom('auto'));
      });
      return data;
    },
    [loadDetail, scrollToBottom]
  );

  const loadOlderMessages = React.useCallback(async () => {
    if (!detail || loadingOlderRef.current || !detail.hasMoreOlderMessages) return;
    const oldestId = detail.messages[0]?.id;
    if (!oldestId) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    const scrollEl = messagesScrollRef.current;
    const prevScrollHeight = scrollEl?.scrollHeight ?? 0;
    const prevScrollTop = scrollEl?.scrollTop ?? 0;

    try {
      const older = await loadDetail(detail.id, { beforeMessageId: oldestId });
      setDetail((prev) => {
        if (!prev || prev.id !== detail.id) return prev;
        const existingIds = new Set(prev.messages.map((m) => m.id));
        const merged = [...older.messages.filter((m) => !existingIds.has(m.id)), ...prev.messages];
        return {
          ...prev,
          hasMoreOlderMessages: older.hasMoreOlderMessages,
          messages: merged,
        };
      });
      requestAnimationFrame(() => {
        if (!scrollEl) return;
        scrollEl.scrollTop = prevScrollTop + (scrollEl.scrollHeight - prevScrollHeight);
      });
    } catch {
      toastRef.current({
        variant: 'destructive',
        title: loadFailedRef.current,
      });
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [detail, loadDetail]);

  const handleMessagesScroll = React.useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 120;
    if (el.scrollTop < 80 && detail?.hasMoreOlderMessages && !loadingOlderRef.current) {
      void loadOlderMessages();
    }
  }, [detail?.hasMoreOlderMessages, loadOlderMessages]);

  const notifyIncoming = React.useCallback(
    (payload: { senderUserId: number; senderName: string; subject: string; conversationId: number }) => {
      const currentUserId = userRef.current?.id;
      if (currentUserId != null && Number(payload.senderUserId) === Number(currentUserId)) return;

      playSound();

      const isTeacherView = modeRef.current === 'teacher';
      const title = isTeacherView
        ? t('supportChat.notifStudentTitle', 'New student question')
        : t('supportChat.notifTeacherTitle', 'New instructor reply');
      const body = isTeacherView
        ? t('supportChat.notifStudentBody', '{name} asked in topic «{subject}».')
            .replace('{name}', payload.senderName)
            .replace('{subject}', payload.subject)
        : t('supportChat.notifTeacherBody', '{name} replied in topic «{subject}».')
            .replace('{name}', payload.senderName)
            .replace('{subject}', payload.subject);

      showBrowserNotification(title, body, () => {
        const url = new URL(window.location.href);
        url.searchParams.set(conversationQueryKey, String(payload.conversationId));
        window.location.href = url.toString();
      });
    },
    [conversationQueryKey, playSound, showBrowserNotification, t]
  );

  const appendRealtimeMessage = React.useCallback((payload: MessagePostedPayload) => {
    setDetail((prev) => {
      if (!prev || prev.id !== payload.conversationId) return prev;
      const msg = mapRealtimeMessage(
        payload as unknown as Record<string, unknown>,
        userRef.current?.id ?? undefined
      );
      if (prev.messages.some((m) => m.id === msg.id)) return prev;
      const withoutPending = prev.messages.filter(
        (m) => !(m.id < 0 && m.isMine && m.contentHtml.trim() === msg.contentHtml.trim())
      );
      requestAnimationFrame(() => {
        if (stickToBottomRef.current) scrollToBottom('smooth');
      });
      return { ...prev, messages: [...withoutPending, msg] };
    });
  }, [scrollToBottom]);

  const appendOptimisticMessage = React.useCallback(
    (contentHtml: string, replyTo?: SupportMessageRow | null) => {
      const tempId = -Date.now();
      const senderName =
        userRef.current?.name?.trim() ||
        userRef.current?.email?.trim() ||
        t('supportChat.you', 'You');
      const optimistic: SupportMessageRow = {
        id: tempId,
        senderUserId: Number(userRef.current?.id ?? 0),
        senderName,
        contentHtml,
        sentAtUtc: new Date().toISOString(),
        isMine: true,
        replyToMessageId: replyTo?.id ?? null,
        replyToSenderName: replyTo?.senderName ?? null,
        replyToContentPreview: replyTo?.contentHtml
          ? stripSupportMessageHtml(replyTo.contentHtml).slice(0, 80)
          : null,
        deliveryStatus: 'sent',
      };
      setDetail((prev) => (prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev));
      return tempId;
    },
    [t]
  );

  const finalizeOptimisticMessage = React.useCallback(
    (tempId: number, messageId: number, contentHtml: string, replyTo?: SupportMessageRow | null) => {
      setDetail((prev) => {
        if (!prev) return prev;
        const senderName =
          userRef.current?.name?.trim() ||
          userRef.current?.email?.trim() ||
          t('supportChat.you', 'You');
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: messageId,
                  contentHtml,
                  sentAtUtc: new Date().toISOString(),
                  senderName,
                  isMine: true,
                  replyToMessageId: replyTo?.id ?? null,
                  replyToSenderName: replyTo?.senderName ?? null,
                  replyToContentPreview: replyTo?.contentHtml
                    ? stripSupportMessageHtml(replyTo.contentHtml).slice(0, 80)
                    : null,
                  deliveryStatus: 'sent' as SupportMessageDeliveryStatus,
                }
              : m
          ),
        };
      });
    },
    [t]
  );

  const removeOptimisticMessage = React.useCallback((tempId: number) => {
    setDetail((prev) =>
      prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) } : prev
    );
  }, []);

  React.useEffect(() => {
    if (authLoading) return;
    if (mode === 'teacher' && !filterStudentUserId) {
      setListLoading(false);
      return;
    }
    if (mode === 'student' && !filterTeacherUserId) {
      setListLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setListLoading(true);
      setLoadingConversationId(null);
      setActiveId(null);
      setDetail(null);
      setEditingSubject(false);
      setEditingMessageId(null);
      setReplyToMessage(null);
      setComposerHtml('');
      if (filterTeacherUserId) {
        setNewTeacherId(filterTeacherUserId);
      }

      try {
        const rows = await loadList();
        if (cancelled) return;

        if (mode === 'student') {
          const teacherRows = await getStudentSupportTeachers();
          if (cancelled) return;
          setTeachers(teacherRows);
        }

        const isMobile = window.matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX_WIDTH}px)`).matches;
        const fromUrl = initialConversationFromUrlRef.current ?? 0;
        const urlMatch = fromUrl > 0 && rows.some((row) => row.id === fromUrl) ? fromUrl : null;
        const initial = urlMatch ?? (isMobile ? null : rows[0]?.id ?? null);

        if (initial) {
          setActiveId(initial);
          setLoadingConversationId(initial);
          const data = await loadDetail(initial);
          if (cancelled) return;
          stickToBottomRef.current = true;
          setDetail(data);
          requestAnimationFrame(() => {
            scrollToBottom('auto');
            requestAnimationFrame(() => scrollToBottom('auto'));
          });
        }
      } catch {
        if (!cancelled) {
          setActiveId(null);
          setDetail(null);
          toastRef.current({
            variant: 'destructive',
            title: loadFailedRef.current,
          });
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
          setLoadingConversationId(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, filterStudentUserId, filterTeacherUserId, loadDetail, loadList, mode, scrollToBottom]);

  useSupportChatHub({
    conversationId: activeId ?? undefined,
    userId: user?.id,
    watchPresenceUserId: otherParticipantUserId,
    handlers: {
      onMessagePosted: (payload) => {
        const mine =
          userRef.current?.id != null &&
          Number(payload.senderUserId) === Number(userRef.current.id);

        if (!mine) {
          notifyIncoming({
            senderUserId: payload.senderUserId,
            senderName: payload.senderName,
            subject: payload.subject,
            conversationId: payload.conversationId,
          });
        }

        void loadList();
        onStudentsRefresh?.();

        if (payload.conversationId === activeIdRef.current) {
          appendRealtimeMessage(payload);
          if (!mine) {
            void markSupportMessagesDelivered(payload.conversationId, [payload.messageId]);
            void markSupportConversationRead(payload.conversationId);
          }
        }
      },
      onConversationOpened: (payload) => {
        void loadList();
        onStudentsRefresh?.();
        if (modeRef.current === 'teacher') {
          playSound();
          showBrowserNotification(
            t('supportChat.notifNewTopicTitle', 'New support topic'),
            t('supportChat.notifNewTopicBody', '{name} opened «{subject}».')
              .replace('{name}', payload.studentName)
              .replace('{subject}', payload.subject),
            () => {
              const url = new URL(window.location.href);
              url.searchParams.set(conversationQueryKey, String(payload.conversationId));
              window.location.href = url.toString();
            }
          );
        }
      },
      onConversationStatusChanged: (payload) => {
        void loadList();
        onStudentsRefresh?.();
        if (payload.conversationId !== activeIdRef.current) return;
        const status = payload.status.toLowerCase();
        setDetail((prev) => (prev ? { ...prev, status } : prev));
        setConversations((prev) =>
          prev.map((row) => (row.id === payload.conversationId ? { ...row, status } : row))
        );
      },
      onMessageUpdated: (payload: MessageUpdatedPayload) => {
        if (payload.conversationId !== activeIdRef.current) return;
        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === payload.messageId
                ? {
                    ...m,
                    contentHtml: payload.contentHtml,
                    editedAtUtc: payload.editedAtUtc ?? m.editedAtUtc,
                  }
                : m
            ),
          };
        });
      },
      onMessageDeleted: (payload: MessageDeletedPayload) => {
        if (payload.conversationId !== activeIdRef.current) return;
        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === payload.messageId ? { ...m, isDeleted: true, contentHtml: '' } : m
            ),
          };
        });
        void loadList();
        onStudentsRefresh?.();
      },
      onConversationUpdated: (payload: ConversationUpdatedPayload) => {
        void loadList();
        onStudentsRefresh?.();
        if (payload.conversationId !== activeIdRef.current) return;
        setDetail((prev) => (prev ? { ...prev, subject: payload.subject } : prev));
        setConversations((prev) =>
          prev.map((row) => (row.id === payload.conversationId ? { ...row, subject: payload.subject } : row))
        );
      },
      onConversationDeleted: (payload: ConversationDeletedPayload) => {
        void loadList();
        onStudentsRefresh?.();
        setConversations((prev) => prev.filter((row) => row.id !== payload.conversationId));
        if (activeIdRef.current === payload.conversationId) {
          clearConversationView();
        }
      },
      onMessagesDelivered: (payload: MessagesDeliveredPayload) => {
        if (payload.conversationId !== activeIdRef.current) return;
        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: applyDeliveredReceipts(prev.messages, payload.messageIds ?? []),
          };
        });
      },
      onMessagesRead: (payload: MessagesReadPayload) => {
        if (payload.conversationId !== activeIdRef.current) return;
        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            studentLastReadAtUtc: payload.studentLastReadAtUtc ?? prev.studentLastReadAtUtc,
            teacherLastReadAtUtc: payload.teacherLastReadAtUtc ?? prev.teacherLastReadAtUtc,
            messages: applyReadReceipts(prev.messages, prev, payload),
          };
        });
      },
      onUserPresenceChanged: (payload) => {
        if (otherParticipantUserId && payload.userId === otherParticipantUserId) {
          setOtherParticipantOnline(payload.isOnline);
        }
      },
    },
  });

  const selectConversation = async (id: number) => {
    if (loadingConversationId != null) return;
    setActiveId(id);
    setDetail(null);
    setLoadingConversationId(id);
    setEditingSubject(false);
    setEditingMessageId(null);
    setReplyToMessage(null);
    setComposerHtml('');
    try {
      await loadInitialDetail(id);
      updateConversationUrl(id);
    } catch {
      setActiveId((prev) => (prev === id ? null : prev));
      setDetail(null);
      toast({ variant: 'destructive', title: t('supportChat.loadFailed', 'Failed to load support chat') });
    } finally {
      setLoadingConversationId(null);
    }
  };

  const handleSend = async () => {
    if (!activeId || !composerHtml.trim() || isClosed) return;
    if (mode === 'student' && !canUseSupport) {
      toast({
        variant: 'destructive',
        title: t('supportSubscription.accessDenied', 'Support access is not active'),
      });
      return;
    }
    const contentHtml = composerHtml.trim();
    const replyTarget = replyToMessage;
    let tempId: number | null = null;

    if (!editingMessageId) {
      tempId = appendOptimisticMessage(contentHtml, replyTarget);
      setComposerHtml('');
      setReplyToMessage(null);
      stickToBottomRef.current = true;
      requestAnimationFrame(() => scrollToBottom('smooth'));
    }

    setSending(true);
    try {
      if (editingMessageId) {
        await updateSupportMessage({
          conversationId: activeId,
          messageId: editingMessageId,
          contentHtml,
        });
        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === editingMessageId
                ? { ...m, contentHtml, editedAtUtc: new Date().toISOString() }
                : m
            ),
          };
        });
        setEditingMessageId(null);
        setComposerHtml('');
      } else {
        const messageId = await sendSupportMessage({
          conversationId: activeId,
          contentHtml,
          replyToMessageId: replyTarget?.id,
        });
        if (messageId > 0 && tempId != null) {
          finalizeOptimisticMessage(tempId, messageId, contentHtml, replyTarget);
        } else if (tempId != null) {
          removeOptimisticMessage(tempId);
          await loadInitialDetail(activeId);
        }
        void loadList();
        onStudentsRefresh?.();
      }
      stickToBottomRef.current = true;
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } catch {
      if (tempId != null) {
        removeOptimisticMessage(tempId);
        setComposerHtml(contentHtml);
        if (replyTarget) setReplyToMessage(replyTarget);
      }
      toast({
        variant: 'destructive',
        title: editingMessageId
          ? t('supportChat.editFailed', 'Failed to edit message')
          : t('supportChat.sendFailed', 'Failed to send message'),
      });
    } finally {
      setSending(false);
    }
  };

  const handleCopyMessage = async (message: SupportMessageRow) => {
    if (message.isDeleted) return;
    try {
      const text = stripSupportMessageHtml(message.contentHtml);
      await navigator.clipboard.writeText(text);
      toast({ title: t('supportChat.copied', 'Message copied') });
    } catch {
      toast({ variant: 'destructive', title: t('supportChat.copyFailed', 'Failed to copy message') });
    }
  };

  const handleReplyTo = (message: SupportMessageRow) => {
    if (message.isDeleted || isClosed) return;
    setReplyToMessage(message);
    setEditingMessageId(null);
    setComposerHtml('');
  };

  const handleEditMessage = (message: SupportMessageRow) => {
    if (!message.isMine || message.isDeleted || isClosed) return;
    setEditingMessageId(message.id);
    setReplyToMessage(null);
    setComposerHtml(message.contentHtml);
  };

  const handleDeleteMessage = async (message: SupportMessageRow) => {
    if (!activeId || !message.isMine || message.isDeleted || isClosed) return;
    if (!window.confirm(t('supportChat.deleteMessageConfirm', 'Delete this message?'))) return;
    try {
      await deleteSupportMessage({ conversationId: activeId, messageId: message.id });
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === message.id ? { ...m, isDeleted: true, contentHtml: '' } : m
          ),
        };
      });
      if (editingMessageId === message.id) {
        setEditingMessageId(null);
        setComposerHtml('');
      }
      if (replyToMessage?.id === message.id) setReplyToMessage(null);
      void loadList();
    } catch {
      toast({ variant: 'destructive', title: t('supportChat.deleteMessageFailed', 'Failed to delete message') });
    }
  };

  const handleSaveSubject = async () => {
    if (!activeId || subjectDraft.trim().length < 3) return;
    setSavingSubject(true);
    try {
      await updateSupportConversationSubject({ conversationId: activeId, subject: subjectDraft.trim() });
      setDetail((prev) => (prev ? { ...prev, subject: subjectDraft.trim() } : prev));
      setConversations((prev) =>
        prev.map((row) => (row.id === activeId ? { ...row, subject: subjectDraft.trim() } : row))
      );
      setEditingSubject(false);
      toast({ title: t('supportChat.subjectUpdated', 'Subject updated') });
    } catch (error) {
      const apiMessage = getSupportChatErrorMessage(error, '');
      toast({
        variant: 'destructive',
        title: t('supportChat.subjectUpdateFailed', 'Failed to update subject'),
        description: /already exists/i.test(apiMessage)
          ? t('supportChat.duplicateSubject', 'A topic with this subject already exists.')
          : apiMessage || undefined,
      });
    } finally {
      setSavingSubject(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeId) return;
    if (!window.confirm(t('supportChat.deleteTopicConfirm', 'Delete this support topic and all messages?'))) return;
    setDeletingConversation(true);
    try {
      await deleteSupportConversation(activeId);
      setConversations((prev) => prev.filter((row) => row.id !== activeId));
      clearConversationView();
      toast({ title: t('supportChat.topicDeleted', 'Topic deleted') });
    } catch {
      toast({ variant: 'destructive', title: t('supportChat.deleteTopicFailed', 'Failed to delete topic') });
    } finally {
      setDeletingConversation(false);
    }
  };

  const handleCreate = async () => {
    if (mode !== 'student') return;
    if (!canUseSupport) {
      toast({
        variant: 'destructive',
        title: t('supportSubscription.accessDenied', 'Support access is not active'),
        description: supportStatus?.isFrozen
          ? t('supportSubscription.frozenHint', 'Your support is frozen. Wait until the freeze ends.')
          : t('supportSubscription.expiredHint', 'Purchase a support plan to continue.'),
      });
      return;
    }
    if (!newTeacherId) {
      toast({
        variant: 'destructive',
        title: t('supportChat.teacherRequired', 'Please select a teacher'),
      });
      return;
    }
    if (newSubject.trim().length < 3 || !newInitialMessageHtml.trim()) return;
    setCreating(true);
    try {
      const id = await openSupportConversation({
        teacherUserId: newTeacherId,
        subject: newSubject.trim(),
        initialMessageHtml: newInitialMessageHtml.trim(),
      });
      setShowNewForm(false);
      setNewSubject('');
      setNewTeacherId('');
      setNewInitialMessageHtml('');
      await loadList();
      await selectConversation(id);
      toast({ title: t('supportChat.created', 'Support topic created') });
    } catch (error) {
      const apiMessage = getSupportChatErrorMessage(error, '');
      const isDuplicateSubject = /already exists/i.test(apiMessage);
      toast({
        variant: 'destructive',
        title: t('supportChat.createFailed', 'Failed to create topic'),
        description: isDuplicateSubject
          ? t('supportChat.duplicateSubject', 'A topic with this subject already exists.')
          : apiMessage || t('supportChat.createFailed', 'Failed to create topic'),
      });
    } finally {
      setCreating(false);
    }
  };

  const handleClose = async () => {
    if (!activeId || isClosed) return;
    setClosing(true);
    try {
      await closeSupportConversation(activeId);
      const updated = await loadInitialDetail(activeId);
      if (mode === 'student' && updated && !updated.hasRating) {
        setRatingConversationId(activeId);
        setRatingDialogOpen(true);
      }
      toast({ title: t('supportChat.closed', 'Topic closed') });
    } catch {
      toast({ variant: 'destructive', title: t('supportChat.closeFailed', 'Failed to close topic') });
    } finally {
      setClosing(false);
    }
  };

  const handleReopen = async () => {
    if (!activeId || !isClosed) return;
    setReopening(true);
    try {
      await reopenSupportConversation(activeId);
      await loadInitialDetail(activeId);
      toast({ title: t('supportChat.reopened', 'Topic reopened') });
    } catch {
      toast({ variant: 'destructive', title: t('supportChat.reopenFailed', 'Failed to reopen topic') });
    } finally {
      setReopening(false);
    }
  };

  const handleSubmitRating = async (payload: { ratingLevel: number; feedback?: string }) => {
    if (!ratingConversationId) return;
    await submitSupportConversationRating({
      conversationId: ratingConversationId,
      ratingLevel: payload.ratingLevel,
      feedback: payload.feedback,
    });
    setDetail((prev) => (prev ? { ...prev, hasRating: true } : prev));
    toast({ title: t('supportChat.ratingSaved', 'Thank you for your feedback') });
  };

  const panelHeightClass = showMobileChat
    ? 'h-[min(calc(100dvh-5rem),920px)] min-h-0'
    : 'h-[min(calc(100dvh-8rem),920px)] min-h-0 lg:min-h-[720px]';

  return (
    <div className="space-y-3 pb-10">
      {mode === 'student' && !showMobileChat ? <TeacherStoriesPanel /> : null}
      {mode === 'teacher' && !filterStudentUserId && !showMobileChat ? (
        <TeacherStoriesPanel canPublish />
      ) : null}
      {browserPermission === 'default' && !showMobileChat ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bell className="h-4 w-4 shrink-0" />
            <span>{t('supportChat.enableBrowserNotif', 'Enable browser notifications to get alerts when you are away.')}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => void requestBrowserPermission()}>
            {t('supportChat.enableNotifications', 'Enable notifications')}
          </Button>
        </div>
      ) : null}

      {mode === 'student' && !supportStatusLoading && !canUseSupport && !showMobileChat ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-medium">{t('supportSubscription.accessDenied', 'Support access is not active')}</p>
          <p className="mt-1 text-muted-foreground">
            {supportStatus?.isFrozen
              ? t('supportSubscription.frozenHint', 'Your support is frozen. Wait until the freeze ends.')
              : t('supportSubscription.expiredHint', 'Purchase a support plan above to continue chatting.')}
          </p>
        </div>
      ) : null}

      {mode === 'teacher' && detail && !filterStudentUserId ? (
        <ProfessorGrantSupportMonthsCard
          dict={dict}
          studentUserId={asLongId(detail.studentUserId)}
          studentName={detail.studentName}
        />
      ) : null}

      <div className="grid min-h-0 gap-4 lg:grid-cols-[320px_1fr]">
        <Card
          className={cn(
            'flex min-h-0 flex-col overflow-hidden',
            panelHeightClass,
            showMobileChat ? 'hidden lg:flex' : 'flex'
          )}
        >
          <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {mode === 'teacher' && onBackToStudents ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label={t('supportChat.backToStudents', 'Back to students')}
                  onClick={() => onBackToStudents()}
                >
                  <ChevronLeft className={cn('h-5 w-5', isRtl && 'rotate-180')} />
                </Button>
              ) : null}
              {mode === 'student' && onBackToTeachers ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label={t('supportChat.backToTeachers', 'Back to teachers')}
                  onClick={() => onBackToTeachers()}
                >
                  <ChevronLeft className={cn('h-5 w-5', isRtl && 'rotate-180')} />
                </Button>
              ) : null}
              <div className="min-w-0">
                <CardTitle className="text-base">{t('supportChat.topics', 'Support topics')}</CardTitle>
                {mode === 'teacher' && studentDisplayName ? (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{studentDisplayName}</p>
                ) : null}
                {mode === 'student' && teacherDisplayName ? (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{teacherDisplayName}</p>
                ) : null}
              </div>
            </div>
            {mode === 'student' ? (
              <Button
                size="sm"
                variant="outline"
                disabled={!canUseSupport}
                onClick={() => {
                  setShowNewForm((v) => {
                    const next = !v;
                    if (next) void refreshTeachers();
                    return next;
                  });
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 pt-0">
            {showNewForm && mode === 'student' ? (
              <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <div className="space-y-1">
                  <Label>{t('supportChat.teacher', 'Teacher')}</Label>
                  {filterTeacherUserId ? (
                    <Input value={teacherDisplayName || filterTeacherUserId} disabled />
                  ) : (
                  <Select
                    value={newTeacherId || undefined}
                    onValueChange={setNewTeacherId}
                    onOpenChange={(open) => {
                      if (open) void refreshTeachers();
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('supportChat.selectTeacher', 'Select teacher')} />
                    </SelectTrigger>
                    <SelectContent>
                      {teachersLoading ? (
                        <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('loading', 'Loading…')}
                        </div>
                      ) : teachers.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-muted-foreground">
                          {t('supportChat.noTeachers', 'No teachers available')}
                        </div>
                      ) : (
                        teachers
                          .filter((teacher) => teacher.teacherUserId !== '0')
                          .map((teacher) => (
                            <SelectItem key={teacher.teacherUserId} value={teacher.teacherUserId}>
                              {teacher.displayName}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>{t('supportChat.subject', 'Subject')}</Label>
                  <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t('supportChat.initialMessage', 'Your question')}</Label>
                  <QaRichTextEditor
                    value={newInitialMessageHtml}
                    onChange={setNewInitialMessageHtml}
                    onUploadImage={uploadSupportChatImage}
                    onUploadAudio={uploadSupportChatAudio}
                    onUploadVideo={uploadSupportChatVideo}
                    placeholder={t('supportChat.initialMessagePlaceholder', 'Describe your question...')}
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={
                    creating ||
                    teachersLoading ||
                    !newTeacherId ||
                    newSubject.trim().length < 3 ||
                    !newInitialMessageHtml.trim()
                  }
                  onClick={() => void handleCreate()}
                >
                  {creating ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                  {t('supportChat.createTopic', 'Create topic')}
                </Button>
              </div>
            ) : null}

            {(listLoading || authLoading) ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm">{t('loading', 'Loading…')}</p>
              </div>
            ) : conversations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('supportChat.empty', 'No support topics yet')}
              </p>
            ) : (
              <div className="space-y-1">
                {conversations.map((row) => {
                  const isOpening = loadingConversationId === row.id;
                  const isActive = activeId === row.id && !isOpening;
                  return (
                  <button
                    key={row.id}
                    type="button"
                    disabled={isOpeningConversation}
                    aria-busy={isOpening}
                    onClick={() => void selectConversation(row.id)}
                    className={cn(
                      'relative w-full rounded-lg border px-3 py-2 text-start transition hover:bg-muted/40 disabled:pointer-events-none',
                      (isActive || isOpening) && 'border-primary bg-primary/5',
                      isOpening && 'opacity-90'
                    )}
                  >
                    {isOpening ? (
                      <div
                        className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-background/55 backdrop-blur-[1px]"
                        aria-hidden="true"
                      >
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : null}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.subject}</p>
                        <p className="truncate text-xs text-muted-foreground">{row.otherParticipantName}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {isOpening ? (
                          <span className="text-xs text-muted-foreground">
                            {t('supportChat.openingTopic', 'Opening…')}
                          </span>
                        ) : null}
                        {!isOpening && isConversationClosed(row.status) ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {t('supportChat.closedBadge', 'Closed')}
                          </span>
                        ) : null}
                        {!isOpening && row.unreadCount > 0 ? (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                            {row.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {row.lastMessagePreview ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{row.lastMessagePreview}</p>
                    ) : null}
                  </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={cn(
            'flex min-h-0 flex-col overflow-hidden',
            panelHeightClass,
            showMobileChat ? 'flex' : 'hidden lg:flex'
          )}
        >
          {loadingConversationId === activeId && !detail ? (
            <>
              <CardHeader className="shrink-0 border-b pb-3">
                <div className="flex items-center gap-2">
                  {isMobileLayout ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      aria-label={t('supportChat.backToTopics', 'Back to topics')}
                      onClick={() => goBackToTopics()}
                    >
                      <ChevronLeft className={cn('h-5 w-5', isRtl && 'rotate-180')} />
                    </Button>
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/5 max-w-xs" />
                    <Skeleton className="h-4 w-2/5 max-w-[10rem]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">{t('supportChat.openingTopic', 'Opening…')}</p>
                </div>
              </CardContent>
            </>
          ) : detail ? (
            <>
              <CardHeader className="shrink-0 border-b pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    {isMobileLayout ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-0.5 h-9 w-9 shrink-0"
                        aria-label={t('supportChat.backToTopics', 'Back to topics')}
                        onClick={() => goBackToTopics()}
                      >
                        <ChevronLeft className={cn('h-5 w-5', isRtl && 'rotate-180')} />
                      </Button>
                    ) : null}
                    <div className="min-w-0 flex-1">
                    {editingSubject ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={subjectDraft}
                          onChange={(e) => setSubjectDraft(e.target.value)}
                          className="max-w-md"
                        />
                        <Button size="sm" disabled={savingSubject || subjectDraft.trim().length < 3} onClick={() => void handleSaveSubject()}>
                          {t('supportChat.saveSubject', 'Save')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSubject(false);
                            setSubjectDraft(detail.subject);
                          }}
                        >
                          {t('supportChat.cancel', 'Cancel')}
                        </Button>
                      </div>
                    ) : (
                      <CardTitle className="text-base">{detail.subject}</CardTitle>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span
                        className={cn(
                          'inline-block h-2 w-2 shrink-0 rounded-full',
                          otherParticipantOnline === true && 'bg-emerald-500',
                          otherParticipantOnline === false && 'bg-muted-foreground/45',
                          otherParticipantOnline === null && 'bg-muted-foreground/25'
                        )}
                        aria-hidden
                      />
                      <span className="text-sm text-muted-foreground">
                        {mode === 'student' ? detail.teacherName : detail.studentName}
                      </span>
                      {otherParticipantOnline !== null ? (
                        <span
                          className={cn(
                            'text-xs',
                            otherParticipantOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                          )}
                        >
                          {otherParticipantOnline
                            ? t('supportChat.online', 'Online')
                            : t('supportChat.offline', 'Offline')}
                        </span>
                      ) : null}
                    </div>
                    {isClosed ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        {t('supportChat.closedHint', 'This topic is closed. You can only read past messages.')}
                      </p>
                    ) : null}
                    </div>
                  </div>
                  {!editingSubject ? (
                    <SupportMessageActionsMenu
                      triggerLabel={t('supportChat.topicActions', 'Topic actions')}
                      cancelLabel={t('supportChat.cancel', 'Cancel')}
                      isRtl={isRtl}
                      alignEnd
                      menuWidth={220}
                      triggerClassName="mt-0.5 h-9 w-9"
                      actions={buildTopicActions({
                        editingSubject,
                        isClosed,
                        mode,
                        hasRating: detail.hasRating,
                        isRtl,
                        t,
                        onEditSubject: () => {
                          setSubjectDraft(detail.subject);
                          setEditingSubject(true);
                        },
                        onDeleteTopic: () => void handleDeleteConversation(),
                        onCloseTopic: () => void handleClose(),
                        onReopenTopic: () => void handleReopen(),
                        onRate: () => {
                          setRatingConversationId(detail.id);
                          setRatingDialogOpen(true);
                        },
                      })}
                    />
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
                <div
                  ref={messagesScrollRef}
                  onScroll={handleMessagesScroll}
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
                >
                  {loadingOlder ? (
                    <div className="flex justify-center py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : detail.hasMoreOlderMessages ? (
                    <p className="py-1 text-center text-xs text-muted-foreground">
                      {t('supportChat.loadOlderHint', 'Scroll up for older messages')}
                    </p>
                  ) : null}
                  {detail.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'group relative max-w-[85%] rounded-2xl border px-3 py-2',
                        message.isMine ? 'ms-auto bg-primary/10' : 'me-auto bg-muted/40'
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <span>{message.senderName}</span>
                          {message.editedAtUtc ? (
                            <span className="italic opacity-80">{t('supportChat.edited', 'edited')}</span>
                          ) : null}
                        </span>
                        <div className="flex items-center gap-1">
                          <span>{formatTime(message.sentAtUtc, locale)}</span>
                          {message.isMine ? (
                            <SupportMessageDeliveryTicks status={message.deliveryStatus ?? 'sent'} />
                          ) : null}
                          <SupportMessageActionsMenu
                            triggerLabel={t('supportChat.messageActions', 'Message actions')}
                            cancelLabel={t('supportChat.cancel', 'Cancel')}
                            isRtl={isRtl}
                            alignEnd={message.isMine}
                            actions={buildMessageActions({
                              message,
                              isClosed,
                              isRtl,
                              t,
                              onCopy: (m) => void handleCopyMessage(m),
                              onReply: handleReplyTo,
                              onEdit: handleEditMessage,
                              onDelete: (m) => void handleDeleteMessage(m),
                            })}
                          />
                        </div>
                      </div>
                      {message.replyToMessageId ? (
                        <div className="mb-2 rounded-lg border border-dashed bg-background/60 px-2 py-1 text-xs text-muted-foreground">
                          <span className="font-medium">{message.replyToSenderName ?? t('supportChat.reply', 'Reply')}</span>
                          {message.replyToContentPreview ? (
                            <p className="mt-0.5 truncate">{message.replyToContentPreview}</p>
                          ) : (
                            <p className="mt-0.5 italic">{t('supportChat.deletedMessage', 'Message deleted')}</p>
                          )}
                        </div>
                      ) : null}
                      {message.isDeleted ? (
                        <p className="text-sm italic text-muted-foreground">
                          {t('supportChat.deletedMessage', 'Message deleted')}
                        </p>
                      ) : (
                        <QaContentHtml html={message.contentHtml} resolveMediaUrl={resolveMediaUrl} />
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {isClosed || (mode === 'student' && !canUseSupport) ? (
                  <div className="shrink-0 border-t bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                    {isClosed
                      ? t('supportChat.readOnly', 'Messaging is disabled for closed topics.')
                      : t('supportSubscription.expiredHint', 'Purchase a support plan above to continue chatting.')}
                  </div>
                ) : (
                    <div className="shrink-0 border-t p-3">
                    {editingMessageId ? (
                      <div className="mb-2 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                        <span>{t('supportChat.editingMessage', 'Editing message')}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingMessageId(null);
                            setComposerHtml('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                    {replyToMessage ? (
                      <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium">{t('supportChat.replyingTo', 'Replying to')} {replyToMessage.senderName}</p>
                          <p className="truncate text-muted-foreground">
                            {stripSupportMessageHtml(replyToMessage.contentHtml)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => setReplyToMessage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                    <QaRichTextEditor
                      value={composerHtml}
                      onChange={setComposerHtml}
                      onUploadImage={uploadSupportChatImage}
                      onUploadAudio={uploadSupportChatAudio}
                      onUploadVideo={uploadSupportChatVideo}
                      placeholder={t('supportChat.placeholder', 'Write your message...')}
                      editorMinHeight="140px"
                      editorMaxHeight="200px"
                      colorPickerLabel={t('supportChat.textColor', 'Text color')}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button disabled={sending || !composerHtml.trim()} onClick={() => void handleSend()}>
                        <Send className={cn('h-4 w-4', isRtl ? 'ms-2' : 'me-2')} />
                        {editingMessageId
                          ? t('supportChat.saveEdit', 'Save edit')
                          : t('supportChat.send', 'Send')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
              <MessageCircle className="h-10 w-10" />
              <p>{t('supportChat.selectTopic', 'Select or create a support topic')}</p>
            </CardContent>
          )}
        </Card>
      </div>

      {mode === 'student' ? (
        <SupportRatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          onSubmit={handleSubmitRating}
          title={t('supportChat.ratingTitle', 'Rate your instructor')}
          description={t('supportChat.ratingDescription', 'How was the support you received?')}
          submitLabel={t('supportChat.ratingSubmit', 'Submit rating')}
          feedbackLabel={t('supportChat.ratingFeedback', 'Comments (optional)')}
          feedbackPlaceholder={t('supportChat.ratingFeedbackPlaceholder', 'Share your experience...')}
        />
      ) : null}
    </div>
  );
}

export { StudentSupportChatsView, MyStudentSupport } from './student-support-workspace';

export function StudentSupportFreezeView({ dict }: { dict: Dictionary }) {
  const t = (key: string, def: string) => getDictValue(dict, key, def);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('dashboard.menu.supportFreeze', 'Support freeze')}
        </h1>
        <p className="text-muted-foreground">
          {t('supportSubscription.freezePageSubtitle', 'View your support status and request a freeze when needed.')}
        </p>
      </div>
      <StudentSupportSubscriptionPanel />
    </div>
  );
}

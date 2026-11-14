'use client';

import * as React from 'react';
import { ChevronLeft, Loader2, Reply, Send, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { AdminSupportMessageDeliveryTicks } from '@/components/support/admin-support-message-delivery-ticks';
import { asLongId, isValidLongId } from '@/lib/id';
import { cn } from '@/lib/utils';
import { resolveRichTextHtml } from '@/lib/resolve-rich-text-html';
import {
  ADMIN_SUPPORT_MESSAGE_PAGE_SIZE,
  getAdminSupportConversation,
  getAdminTeacherSupportConversations,
  sendAdminSupportStaffMessage,
  stripSupportMessageHtml,
  type AdminSupportConversationDetail,
  type AdminSupportConversationRow,
  type AdminSupportMessageRow,
} from '@/services/support-chat-admin-api.service';

const MOBILE_LAYOUT_MAX_WIDTH = 1023;
const STAFF_SENDER_FA = 'پشتیبان آرکا نرم افزار';

function formatTime(value: string, locale: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function isConversationClosed(status?: string | null) {
  return (status ?? '').toLowerCase() === 'closed';
}

type AdminSupportChatWorkspaceProps = {
  teacherUserId: string;
  teacherName: string;
};

export function AdminSupportChatWorkspace({ teacherUserId, teacherName }: AdminSupportChatWorkspaceProps) {
  const { t, locale, direction } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRtl = direction === 'rtl';

  const [listLoading, setListLoading] = React.useState(true);
  const [conversations, setConversations] = React.useState<AdminSupportConversationRow[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<AdminSupportConversationDetail | null>(null);
  const [loadingConversationId, setLoadingConversationId] = React.useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const [composerHtml, setComposerHtml] = React.useState('');
  const [replyToMessage, setReplyToMessage] = React.useState<AdminSupportMessageRow | null>(null);
  const [sending, setSending] = React.useState(false);
  const [isMobileLayout, setIsMobileLayout] = React.useState(false);

  const messagesScrollRef = React.useRef<HTMLDivElement | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const loadingOlderRef = React.useRef(false);
  const stickToBottomRef = React.useRef(true);

  const conversationParam = searchParams.get('conversation');
  const conversationFromUrl =
    conversationParam && isValidLongId(asLongId(conversationParam))
      ? asLongId(conversationParam)
      : null;
  const showMobileChat = isMobileLayout && activeId != null;

  const toastRef = React.useRef(toast);
  toastRef.current = toast;
  const loadFailedLabelRef = React.useRef(t('admin_support_load_failed'));
  loadFailedLabelRef.current = t('admin_support_load_failed');

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX_WIDTH}px)`);
    const update = () => setIsMobileLayout(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const loadDetail = React.useCallback(async (conversationId: string, beforeMessageId?: string) => {
    return getAdminSupportConversation({
      teacherUserId,
      conversationId,
      messageTake: ADMIN_SUPPORT_MESSAGE_PAGE_SIZE,
      beforeMessageId,
    });
  }, [teacherUserId]);

  const loadInitialDetail = React.useCallback(async (conversationId: string) => {
    const data = await loadDetail(conversationId);
    if (data) setDetail(data);
    return data;
  }, [loadDetail]);

  const loadList = React.useCallback(async () => {
    const rows = await getAdminTeacherSupportConversations(teacherUserId);
    setConversations(rows);
    return rows;
  }, [teacherUserId]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setListLoading(true);
      setConversations([]);
      setDetail(null);
      setActiveId(null);
      setLoadingConversationId(null);

      try {
        const rows = await getAdminTeacherSupportConversations(teacherUserId);
        if (cancelled) return;
        setConversations(rows);

        const isMobile = window.matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX_WIDTH}px)`).matches;
        const urlMatch =
          conversationFromUrl && rows.some((row) => row.id === conversationFromUrl)
            ? conversationFromUrl
            : null;
        const initial = urlMatch ?? (!isMobile ? rows[0]?.id ?? null : null);

        if (!initial) return;

        setActiveId(initial);
        setLoadingConversationId(initial);

        const data = await getAdminSupportConversation({
          teacherUserId,
          conversationId: initial,
          messageTake: ADMIN_SUPPORT_MESSAGE_PAGE_SIZE,
        });
        if (cancelled) return;
        setDetail(data);
        if (data) {
          requestAnimationFrame(() => scrollToBottom('auto'));
        }
      } catch {
        if (!cancelled) {
          setActiveId(null);
          setDetail(null);
          toastRef.current({
            variant: 'destructive',
            title: loadFailedLabelRef.current,
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
  }, [teacherUserId, conversationFromUrl, scrollToBottom]);

  const selectConversation = async (conversationId: string) => {
    setActiveId(conversationId);
    setLoadingConversationId(conversationId);
    setReplyToMessage(null);
    setComposerHtml('');
    const params = new URLSearchParams(searchParams.toString());
    params.set('conversation', String(conversationId));
    router.replace(`?${params.toString()}`, { scroll: false });
    try {
      const data = await loadInitialDetail(conversationId);
      stickToBottomRef.current = true;
      setDetail(data);
      requestAnimationFrame(() => scrollToBottom('auto'));
    } catch {
      toast({ variant: 'destructive', title: t('admin_support_load_failed') });
    } finally {
      setLoadingConversationId(null);
    }
  };

  const loadOlderMessages = React.useCallback(async () => {
    if (!detail || !detail.hasMoreOlderMessages || loadingOlderRef.current) return;
    const oldest = detail.messages[0];
    if (!oldest) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const older = await loadDetail(detail.id, oldest.id);
      if (!older) return;
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              hasMoreOlderMessages: older.hasMoreOlderMessages,
              messages: [...older.messages, ...prev.messages],
            }
          : prev,
      );
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

  const handleSend = async () => {
    if (!activeId || !composerHtml.trim()) return;
    if (isConversationClosed(detail?.status)) return;
    setSending(true);
    try {
      await sendAdminSupportStaffMessage({
        teacherUserId,
        conversationId: activeId,
        contentHtml: composerHtml.trim(),
        replyToMessageId: replyToMessage?.id,
      });
      setComposerHtml('');
      setReplyToMessage(null);
      const updated = await loadInitialDetail(activeId);
      await loadList();
      stickToBottomRef.current = true;
      setDetail(updated);
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } catch {
      toast({ variant: 'destructive', title: t('admin_support_send_failed') });
    } finally {
      setSending(false);
    }
  };

  const goBackToTopics = () => {
    setActiveId(null);
    setDetail(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('conversation');
    router.replace(params.toString() ? `?${params.toString()}` : '?', { scroll: false });
  };

  const panelHeightClass = showMobileChat
    ? 'h-[min(88dvh,calc(100dvh-6rem))] min-h-0'
    : 'h-[min(88dvh,calc(100dvh-10rem))] min-h-0 lg:min-h-[640px]';

  const isClosed = isConversationClosed(detail?.status);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t('admin_support_teacher_context').replace('{name}', teacherName)}
      </p>

      <div className="grid min-h-0 gap-4 lg:grid-cols-[320px_1fr]">
        <Card
          className={cn(
            'flex min-h-0 flex-col overflow-hidden',
            panelHeightClass,
            showMobileChat ? 'hidden lg:flex' : 'flex',
          )}
        >
          <CardHeader className="shrink-0 pb-3">
            <CardTitle className="text-base">{t('admin_support_topics')}</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pt-0">
            {listLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm">{t('loading')}</p>
              </div>
            ) : conversations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('admin_support_no_topics')}</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((row) => {
                  const isActive = row.id === activeId;
                  const isOpening = loadingConversationId === row.id;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => void selectConversation(row.id)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-start transition-colors',
                        isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{row.subject}</p>
                          <p className="truncate text-xs text-muted-foreground">{row.studentName}</p>
                        </div>
                        {isOpening ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                        ) : isConversationClosed(row.status) ? (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {t('admin_support_closed_badge')}
                          </span>
                        ) : null}
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
            showMobileChat ? 'flex' : 'hidden lg:flex',
          )}
        >
          {activeId != null && loadingConversationId === activeId && !detail ? (
            <CardContent className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          ) : detail ? (
            <>
              <CardHeader className="shrink-0 border-b pb-3">
                <div className="flex items-start gap-2">
                  {isMobileLayout ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      aria-label={t('admin_support_back_topics')}
                      onClick={goBackToTopics}
                    >
                      <ChevronLeft className={cn('h-5 w-5', isRtl && 'rotate-180')} />
                    </Button>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">{detail.subject}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {detail.studentName} · {detail.teacherName}
                    </p>
                  </div>
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
                    <p className="py-1 text-center text-xs text-muted-foreground">{t('admin_support_load_older')}</p>
                  ) : null}

                  {detail.messages.map((message) => {
                    const isStaff = message.isStaffMessage || message.senderName === STAFF_SENDER_FA;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'group relative max-w-[85%] rounded-2xl border px-3 py-2',
                          message.isMine || isStaff
                            ? 'ms-auto border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
                            : 'me-auto bg-muted/40',
                        )}
                      >
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{message.senderName}</span>
                          <div className="flex items-center gap-2">
                            <span>{formatTime(message.sentAtUtc, locale)}</span>
                            {message.isMine ? (
                              <AdminSupportMessageDeliveryTicks
                                status={message.deliveryStatus ?? 'sent'}
                              />
                            ) : null}
                            {!isClosed && !message.isDeleted ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                onClick={() => setReplyToMessage(message)}
                              >
                                <Reply className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        {message.replyToMessageId ? (
                          <div className="mb-2 rounded-lg border border-dashed bg-background/60 px-2 py-1 text-xs text-muted-foreground">
                            <span className="font-medium">{message.replyToSenderName ?? t('admin_support_reply')}</span>
                            {message.replyToContentPreview ? (
                              <p className="mt-0.5 truncate">{message.replyToContentPreview}</p>
                            ) : null}
                          </div>
                        ) : null}
                        {message.isDeleted ? (
                          <p className="text-sm italic text-muted-foreground">{t('admin_support_deleted_message')}</p>
                        ) : (
                          <div
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: resolveRichTextHtml(message.contentHtml) }}
                          />
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {isClosed ? (
                  <div className="shrink-0 border-t bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                    {t('admin_support_read_only')}
                  </div>
                ) : (
                  <div className="shrink-0 border-t p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      {t('admin_support_send_as').replace('{name}', STAFF_SENDER_FA)}
                    </p>
                    {replyToMessage ? (
                      <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {t('admin_support_replying_to')} {replyToMessage.senderName}
                          </p>
                          <p className="truncate text-muted-foreground">
                            {stripSupportMessageHtml(replyToMessage.contentHtml)}
                          </p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setReplyToMessage(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                    <div className="max-h-[180px] overflow-y-auto">
                      <CustomRichTextEditor
                        content={composerHtml}
                        onChangeAction={setComposerHtml}
                        placeholder={t('admin_support_placeholder')}
                        expandVertically
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button type="button" onClick={() => void handleSend()} disabled={sending || !composerHtml.trim()}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="ms-2">{t('admin_support_send')}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              {t('admin_support_select_topic')}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

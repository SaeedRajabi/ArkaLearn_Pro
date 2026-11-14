'use client';

import * as React from 'react';
import { ChevronLeft, HelpCircle, Loader2, Lock, MessageCircle, Plus, Reply, Send, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { QaRichTextEditor } from '@/components/ui/qa-rich-text-editor';
import { QaContentHtml } from '@/components/shared/qa-content-html';
import { SupportRatingDialog } from '@/components/support/support-rating-dialog';
import { EmailVerificationRequiredBanner } from '@/components/platform-support/email-verification-required-banner';
import { useAuth } from '@/contexts/auth-context';
import { profileSettingsHref, requiresEmailVerificationForSupport } from '@/lib/auth/email-verification-support';
import { useToast } from '@/hooks/use-toast';
import { usePlatformSupportTicketHub } from '@/hooks/use-platform-support-ticket-hub';
import { getDictValue } from '@/lib/i18n-client';
import { cn } from '@/lib/utils';
import {
  closePlatformSupportTicket,
  createPlatformSupportTicket,
  getMyPlatformSupportTickets,
  getPlatformSupportTicket,
  mapRealtimePlatformMessage,
  sendPlatformSupportTicketMessage,
  uploadPlatformSupportAudio,
  uploadPlatformSupportImage,
  uploadPlatformSupportVideo,
  PLATFORM_TICKET_MESSAGE_PAGE_SIZE,
  getPlatformSupportErrorMessage,
  type PlatformSupportDepartment,
  type PlatformSupportTicketDetail,
  type PlatformSupportTicketMessageRow,
  type PlatformSupportTicketRow,
} from '@/lib/api/platform-support-ticket';
import {
  getPublishedPlatformSupportTopic,
  getPublishedPlatformSupportTopics,
  type PlatformSupportTopicDetail,
  type PlatformSupportTopicRow,
} from '@/lib/api/platform-support-topics';
import type { Dictionary } from '@/types';

const MOBILE_LAYOUT_MAX_WIDTH = 1023;

const DEPARTMENTS: PlatformSupportDepartment[] = [
  'Support',
  'Services',
  'Sales',
  'SoftwareDevelopment',
];

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Answered') return 'default';
  if (status === 'ViewedByAdmin') return 'secondary';
  if (status === 'Closed') return 'secondary';
  return 'outline';
}

function departmentLabel(dept: string, t: (key: string, def: string) => string): string {
  const map: Record<string, string> = {
    Support: t('platform_support.dept_support', 'Support'),
    Services: t('platform_support.dept_services', 'Services'),
    Sales: t('platform_support.dept_sales', 'Sales'),
    SoftwareDevelopment: t('platform_support.dept_software', 'Software development'),
  };
  return map[dept] ?? dept;
}

function statusLabel(status: string, t: (key: string, def: string) => string): string {
  const map: Record<string, string> = {
    UnderReview: t('platform_support.status_under_review', 'Under review'),
    ViewedByAdmin: t('platform_support.status_viewed_by_admin', 'Viewed by admin'),
    Answered: t('platform_support.status_answered', 'Answered'),
    Closed: t('platform_support.status_closed', 'Closed'),
  };
  return map[status] ?? status;
}

export function PlatformSupportWorkspace({ dict }: { dict: Dictionary }) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = String(dict.locale ?? 'fa');
  const isRtl = locale === 'fa';
  const t = (key: string, def: string) => getDictValue(dict, key, def);

  const [listLoading, setListLoading] = React.useState(true);
  const [topicsLoading, setTopicsLoading] = React.useState(true);
  const [topics, setTopics] = React.useState<PlatformSupportTopicRow[]>([]);
  const [tickets, setTickets] = React.useState<PlatformSupportTicketRow[]>([]);
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [activeTopicId, setActiveTopicId] = React.useState<number | null>(null);
  const [detail, setDetail] = React.useState<PlatformSupportTicketDetail | null>(null);
  const [topicDetail, setTopicDetail] = React.useState<PlatformSupportTopicDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [loadingTopicDetail, setLoadingTopicDetail] = React.useState(false);
  const [composerHtml, setComposerHtml] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [showNewForm, setShowNewForm] = React.useState(false);
  const [newSubject, setNewSubject] = React.useState('');
  const [newDepartment, setNewDepartment] = React.useState<PlatformSupportDepartment>('Support');
  const [newMessageHtml, setNewMessageHtml] = React.useState('');
  const [ratingOpen, setRatingOpen] = React.useState(false);
  const [replyToMessage, setReplyToMessage] = React.useState<PlatformSupportTicketMessageRow | null>(null);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const [isMobileLayout, setIsMobileLayout] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesScrollRef = React.useRef<HTMLDivElement>(null);

  const userId = user?.id != null ? Number(user.id) : 0;
  const supportBlockedByEmail = requiresEmailVerificationForSupport(user?.role, user?.emailVerified);
  const profileHref = profileSettingsHref(user?.role);
  const isClosed = detail?.status === 'Closed';
  const canClose = detail?.status === 'Answered';
  const showMobileChat = isMobileLayout && (activeId != null || activeTopicId != null);

  const toastRef = React.useRef(toast);
  const loadFailedRef = React.useRef(
    getDictValue(dict, 'platform_support.load_failed', 'Failed to load tickets')
  );
  toastRef.current = toast;
  loadFailedRef.current = getDictValue(dict, 'platform_support.load_failed', 'Failed to load tickets');

  const updateTicketUrl = React.useCallback(
    (ticketId: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (ticketId != null && ticketId > 0) {
        params.set('ticket', String(ticketId));
        params.delete('topic');
      } else {
        params.delete('ticket');
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const updateTopicUrl = React.useCallback(
    (topicId: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (topicId != null && topicId > 0) {
        params.set('topic', String(topicId));
        params.delete('ticket');
      } else {
        params.delete('topic');
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const clearSelectionUrl = React.useCallback(() => {
    // Drop ticket/topic without depending on a stale searchParams snapshot mid-navigate.
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  /** While true, ignore URL→state hydration so goBack cannot race and reopen the chat. */
  const ignoringUrlSelectionRef = React.useRef(false);

  const refreshList = React.useCallback(async () => {
    const rows = await getMyPlatformSupportTickets();
    setTickets(rows);
    return rows;
  }, []);

  const loadList = React.useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setListLoading(true);
      try {
        await refreshList();
      } catch {
        setTickets([]);
        toastRef.current({
          variant: 'destructive',
          title: loadFailedRef.current,
        });
      } finally {
        if (!options?.silent) setListLoading(false);
      }
    },
    [refreshList]
  );

  const loadTopicDetail = React.useCallback(async (topicId: number) => {
    setLoadingTopicDetail(true);
    try {
      const data = await getPublishedPlatformSupportTopic(topicId);
      setTopicDetail(data);
    } catch {
      setTopicDetail(null);
    } finally {
      setLoadingTopicDetail(false);
    }
  }, []);

  const loadDetail = React.useCallback(async (ticketId: number, beforeMessageId?: number) => {
    if (!beforeMessageId) setLoadingDetail(true);
    try {
      const data = await getPlatformSupportTicket(ticketId, PLATFORM_TICKET_MESSAGE_PAGE_SIZE, beforeMessageId);
      if (!data) {
        if (!beforeMessageId) setDetail(null);
        return;
      }
      if (beforeMessageId) {
        setDetail((prev) => {
          if (!prev || prev.id !== ticketId) return data;
          return {
            ...data,
            messages: [
              ...data.messages,
              ...prev.messages.filter((m) => !data.messages.some((n) => n.id === m.id)),
            ],
          };
        });
      } else {
        setDetail(data);
      }
    } catch {
      if (!beforeMessageId) setDetail(null);
    } finally {
      if (!beforeMessageId) setLoadingDetail(false);
    }
  }, []);

  React.useEffect(() => {
    if (authLoading) return;
    if (userId <= 0) {
      setListLoading(false);
      setTopicsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setListLoading(true);
      setTopicsLoading(true);
      try {
        const [rows, topicRows] = await Promise.all([
          getMyPlatformSupportTickets(),
          getPublishedPlatformSupportTopics(),
        ]);
        if (!cancelled) {
          setTickets(rows);
          setTopics(topicRows);
        }
      } catch {
        if (!cancelled) {
          setTickets([]);
          setTopics([]);
          toastRef.current({
            variant: 'destructive',
            title: loadFailedRef.current,
          });
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
          setTopicsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  React.useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX_WIDTH}px)`);
    const sync = () => setIsMobileLayout(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  React.useEffect(() => {
    const fromUrl = Number(searchParams.get('ticket') || 0);
    const fromTopicUrl = Number(searchParams.get('topic') || 0);

    // Back/clear: ignore stale URL until ticket/topic query params are gone.
    if (ignoringUrlSelectionRef.current) {
      if (fromUrl <= 0 && fromTopicUrl <= 0) {
        ignoringUrlSelectionRef.current = false;
      }
      return;
    }

    if (fromTopicUrl > 0) {
      if (fromTopicUrl !== activeTopicId) {
        setActiveTopicId(fromTopicUrl);
        setActiveId(null);
        setDetail(null);
        void loadTopicDetail(fromTopicUrl);
      }
      return;
    }

    if (fromUrl > 0) {
      if (fromUrl !== activeId) {
        setActiveId(fromUrl);
        setActiveTopicId(null);
        setTopicDetail(null);
        void loadDetail(fromUrl);
      }
    }
    // Do not clear selection when URL is bare — that races with openTicket
    // (state updates before router.replace flushes). goBack clears explicitly.
  }, [searchParams, activeId, activeTopicId, loadDetail, loadTopicDetail]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages.length, activeId]);

  usePlatformSupportTicketHub({
    ticketId: activeId ?? undefined,
    userId,
    handlers: {
      onMessagePosted: (payload) => {
        setTickets((prev) =>
          prev.map((row) => (row.id === payload.ticketId ? { ...row, status: payload.status } : row))
        );
        if (payload.ticketId !== activeId) {
          void refreshList().catch(() => {});
          return;
        }
        setDetail((prev) => {
          if (!prev || prev.id !== payload.ticketId) return prev;
          if (prev.messages.some((m) => m.id === payload.messageId)) return prev;
          const row = mapRealtimePlatformMessage(payload, userId);
          return {
            ...prev,
            status: payload.status,
            messages: [...prev.messages, row],
          };
        });
        void refreshList().catch(() => {});
      },
      onTicketOpened: () => {
        void refreshList().catch(() => {});
      },
      onTicketStatusChanged: (payload) => {
        const data = payload as {
          ticketId?: number;
          TicketId?: number;
          status?: string;
          Status?: string;
        };
        const ticketId = data.ticketId ?? data.TicketId;
        const status = data.status ?? data.Status;
        if (!ticketId || !status) {
          void refreshList().catch(() => {});
          return;
        }
        setTickets((prev) =>
          prev.map((row) => (row.id === ticketId ? { ...row, status } : row))
        );
        if (ticketId === activeId) {
          setDetail((prev) => (prev ? { ...prev, status } : prev));
        }
        void refreshList().catch(() => {});
      },
      onNotificationPulse: () => {
        void refreshList().catch(() => {});
        if (activeId) void loadDetail(activeId);
      },
    },
  });

  const openTicket = (ticketId: number) => {
    setActiveId(ticketId);
    setActiveTopicId(null);
    setTopicDetail(null);
    setReplyToMessage(null);
    setComposerHtml('');
    updateTicketUrl(ticketId);
    void loadDetail(ticketId);
  };

  const openTopic = (topicId: number) => {
    setActiveTopicId(topicId);
    setActiveId(null);
    setDetail(null);
    setReplyToMessage(null);
    setComposerHtml('');
    updateTopicUrl(topicId);
    void loadTopicDetail(topicId);
  };

  const goBack = () => {
    // Block URL-sync from re-opening chat while clearSelectionUrl is in flight.
    ignoringUrlSelectionRef.current = true;
    setActiveId(null);
    setActiveTopicId(null);
    setDetail(null);
    setTopicDetail(null);
    setReplyToMessage(null);
    setComposerHtml('');
    clearSelectionUrl();
  };

  const resetNewTicketForm = React.useCallback(() => {
    setNewSubject('');
    setNewDepartment('Support');
    setNewMessageHtml('');
  }, []);

  const handleNewTicketOpenChange = (open: boolean) => {
    setShowNewForm(open);
    if (!open) resetNewTicketForm();
  };

  const handleCreate = async () => {
    if (supportBlockedByEmail) return;
    if (!newSubject.trim() || !newMessageHtml.replace(/<[^>]+>/g, '').trim()) {
      toast({ variant: 'destructive', title: t('platform_support.create_validation', 'Subject and message are required') });
      return;
    }
    setCreating(true);
    try {
      const id = await createPlatformSupportTicket({
        subject: newSubject,
        department: newDepartment,
        contentHtml: newMessageHtml,
      });
      setShowNewForm(false);
      resetNewTicketForm();
      await loadList({ silent: true });
      openTicket(id);
      toast({ title: t('platform_support.created', 'Ticket created') });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('platform_support.create_failed', 'Could not create ticket'),
        description: getPlatformSupportErrorMessage(e, t('platform_support.create_failed', 'Could not create ticket')),
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async () => {
    if (supportBlockedByEmail) return;
    if (!activeId || !composerHtml.replace(/<[^>]+>/g, '').trim()) return;
    setSending(true);
    try {
      await sendPlatformSupportTicketMessage({
        ticketId: activeId,
        contentHtml: composerHtml,
        replyToMessageId: replyToMessage?.id,
      });
      setComposerHtml('');
      setReplyToMessage(null);
      await loadDetail(activeId);
      await loadList({ silent: true });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('platform_support.send_failed', 'Could not send message'),
        description: getPlatformSupportErrorMessage(e, t('platform_support.send_failed', 'Could not send message')),
      });
    } finally {
      setSending(false);
    }
  };

  const handleCloseWithRating = async (payload: { ratingLevel: number; feedback?: string }) => {
    if (!activeId) return;
    setClosing(true);
    try {
      await closePlatformSupportTicket({
        ticketId: activeId,
        rating: payload.ratingLevel,
        ratingComment: payload.feedback,
      });
      setRatingOpen(false);
      await loadDetail(activeId);
      await loadList({ silent: true });
      toast({ title: t('platform_support.closed', 'Ticket closed') });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('platform_support.close_failed', 'Could not close ticket'),
        description: getPlatformSupportErrorMessage(e, t('platform_support.close_failed', 'Could not close ticket')),
      });
    } finally {
      setClosing(false);
    }
  };

  const loadOlder = async () => {
    if (!detail || !activeId || loadingOlder || !detail.hasMoreOlderMessages) return;
    const oldest = detail.messages[0];
    if (!oldest) return;
    setLoadingOlder(true);
    try {
      await loadDetail(activeId, oldest.id);
    } finally {
      setLoadingOlder(false);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[480px] w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('platform_support.login_required', 'Please sign in to use site support.')}
        </CardContent>
      </Card>
    );
  }

  const listPanel = (
    <div className={cn('flex h-full min-h-0 flex-col border-e', showMobileChat && 'hidden lg:flex')}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b p-4">
        <h2 className="font-semibold">{t('platform_support.my_tickets', 'My tickets')}</h2>
        <Button size="sm" onClick={() => !supportBlockedByEmail && setShowNewForm(true)} disabled={supportBlockedByEmail}>
          <Plus className="h-4 w-4" />
          <span className="ms-2">{t('platform_support.new_ticket', 'New ticket')}</span>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {topicsLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-14 w-full" />
          </div>
        ) : topics.length > 0 ? (
          <div className="border-b">
            <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('platform_support.guide_topics', 'Support guide')}
            </p>
            {topics.map((row) => (
              <button
                key={`topic-${row.id}`}
                type="button"
                onClick={() => openTopic(row.id)}
                className={cn(
                  'w-full border-b px-4 py-3 text-start transition hover:bg-muted/50',
                  activeTopicId === row.id && 'bg-muted'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <HelpCircle className="h-3 w-3" />
                    {t('platform_support.from_support', 'From support')}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-1 font-medium">{row.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {row.summary ||
                    (row.department ? departmentLabel(row.department, t) : t('platform_support.read_only', 'Read only'))}
                </p>
              </button>
            ))}
          </div>
        ) : null}

        {listLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t('platform_support.empty', 'No tickets yet.')}</p>
        ) : (
          tickets.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => openTicket(row.id)}
              className={cn(
                'w-full border-b px-4 py-3 text-start transition hover:bg-muted/50',
                activeId === row.id && 'bg-muted'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">{row.displayCode}</span>
                <Badge variant={statusVariant(row.status)}>{statusLabel(row.status, t)}</Badge>
              </div>
              <p className="mt-1 line-clamp-1 font-medium">{row.subject}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {departmentLabel(row.department, t)}
                {row.lastMessagePreview ? ` · ${row.lastMessagePreview}` : ''}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const chatPanel = (
    <div className={cn('flex h-[100vh] min-h-0 flex-col', !showMobileChat && activeId == null && activeTopicId == null && 'hidden lg:flex')}>
      {activeTopicId ? (
        loadingTopicDetail && !topicDetail ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : topicDetail ? (
          <>
            <div className="flex items-center gap-2 border-b p-4">
              {isMobileLayout ? (
                <Button variant="ghost" size="icon" onClick={goBack}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <HelpCircle className="h-3 w-3" />
                    {t('platform_support.from_support', 'From support')}
                  </Badge>
                </div>
                <h3 className="truncate font-semibold">{topicDetail.title}</h3>
                {topicDetail.department ? (
                  <p className="text-xs text-muted-foreground">{departmentLabel(topicDetail.department, t)}</p>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {topicDetail.summary ? (
                <p className="mb-4 text-sm text-muted-foreground">{topicDetail.summary}</p>
              ) : null}
              <QaContentHtml html={topicDetail.contentHtml} />
            </div>

            <div className="border-t p-4 text-center text-sm text-muted-foreground">
              <HelpCircle className="mx-auto mb-2 h-5 w-5" />
              {t(
                'platform_support.topic_read_only_hint',
                'This is a support guide topic. If your question is not answered here, open a new ticket.'
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            {t('platform_support.topic_not_found', 'Topic not found.')}
          </div>
        )
      ) : !activeId ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          {t('platform_support.select_ticket', 'Select a ticket to view the conversation.')}
        </div>
      ) : loadingDetail && !detail ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : detail ? (
        <>
          <div className="flex items-center gap-2 border-b p-4">
            {isMobileLayout ? (
              <Button variant="ghost" size="icon" onClick={goBack}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{detail.displayCode}</span>
                <Badge variant={statusVariant(detail.status)}>{statusLabel(detail.status, t)}</Badge>
              </div>
              <h3 className="truncate font-semibold">{detail.subject}</h3>
              <p className="text-xs text-muted-foreground">{departmentLabel(detail.department, t)}</p>
            </div>
            {canClose ? (
              <Button variant="outline" size="sm" disabled={closing} onClick={() => setRatingOpen(true)}>
                <Lock className="h-4 w-4" />
                <span className="ms-2">{t('platform_support.close_ticket', 'Close ticket')}</span>
              </Button>
            ) : null}
          </div>

          <div ref={messagesScrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
            {detail.hasMoreOlderMessages ? (
              <div className="text-center">
                <Button variant="ghost" size="sm" disabled={loadingOlder} onClick={() => void loadOlder()}>
                  {loadingOlder ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platform_support.load_older', 'Load older messages')}
                </Button>
              </div>
            ) : null}

            {detail.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex', msg.isMine ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                    msg.isStaffMessage
                      ? 'bg-primary/10 text-foreground'
                      : msg.isMine
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                  )}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                    <span>{msg.senderName}</span>
                    {!msg.isMine && !isClosed && !supportBlockedByEmail ? (
                      <button type="button" className="hover:underline" onClick={() => setReplyToMessage(msg)}>
                        <Reply className="inline h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                  {msg.replyToContentPreview ? (
                    <div className="mb-2 rounded border border-border/50 bg-background/40 px-2 py-1 text-xs opacity-80">
                      {msg.replyToSenderName}: {msg.replyToContentPreview}
                    </div>
                  ) : null}
                  <QaContentHtml html={msg.contentHtml} />
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {!isClosed ? (
            supportBlockedByEmail ? (
              <div className="border-t p-4">
                <EmailVerificationRequiredBanner dict={dict} profileHref={profileHref} />
              </div>
            ) : (
            <div className="border-t p-4">
              {replyToMessage ? (
                <div className="mb-2 flex items-center justify-between rounded-md bg-muted px-3 py-2 text-xs">
                  <span>
                    {t('platform_support.replying_to', 'Replying to')} {replyToMessage.senderName}
                  </span>
                  <button type="button" onClick={() => setReplyToMessage(null)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
              <QaRichTextEditor
                value={composerHtml}
                onChange={setComposerHtml}
                placeholder={t('platform_support.reply_placeholder', 'Write your message…')}
                onUploadImage={uploadPlatformSupportImage}
                onUploadAudio={uploadPlatformSupportAudio}
                onUploadVideo={uploadPlatformSupportVideo}
                editorMinHeight="100px"
                editorMaxHeight="200px"
              />
              <div className="mt-2 flex justify-end">
                <Button onClick={() => void handleSend()} disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="ms-2">{t('platform_support.send', 'Send')}</span>
                </Button>
              </div>
            </div>
            )
          ) : (
            <div className="border-t p-4 text-center text-sm text-muted-foreground">
              <MessageCircle className="mx-auto mb-2 h-5 w-5" />
              {t('platform_support.ticket_closed', 'This ticket is closed.')}
            </div>
          )}
        </>
      ) : null}
    </div>
  );

  return (
    <div className="h-[1000px]">
      <Card className="overflow-hidden h-[940px]">
        <CardHeader className="border-b space-y-3">
          <CardTitle>{t('platform_support.title', 'Site support')}</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              'platform_support.intro',
              'Before opening a ticket, check the support guide topics below — your question may already be answered. Guide topics are read-only. For a personal reply, submit a new ticket.'
            )}
          </p>
          {supportBlockedByEmail ? (
            <EmailVerificationRequiredBanner dict={dict} profileHref={profileHref} />
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid h-[min(72vh,720px)] min-h-0 lg:grid-cols-[320px_1fr]">
            {listPanel}
            {chatPanel}
          </div>
        </CardContent>
      </Card>

      <SupportRatingDialog
        open={ratingOpen}
        onOpenChange={setRatingOpen}
        title={t('platform_support.rate_title', 'Rate support')}
        description={t('platform_support.rate_desc', 'Optional feedback helps us improve.')}
        submitLabel={t('platform_support.close_ticket', 'Close ticket')}
        feedbackLabel={t('platform_support.feedback_label', 'Comments')}
        feedbackPlaceholder={t('platform_support.feedback_placeholder', 'Tell us more (optional)')}
        ratingRequiredMessage={t('platform_support.select_rating', 'Please select a rating')}
        onSubmit={handleCloseWithRating}
      />

      <Dialog open={showNewForm && !supportBlockedByEmail} onOpenChange={handleNewTicketOpenChange}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <div className="border-b bg-gradient-to-b from-primary/5 to-background px-6 pb-5 pt-6">
            <DialogHeader className={cn('space-y-3', isRtl ? 'text-right sm:text-right' : 'text-left')}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <DialogTitle className="text-xl">
                    {t('platform_support.new_ticket', 'New ticket')}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed">
                    {t(
                      'platform_support.new_ticket_desc',
                      'Describe your issue and our team will respond as soon as possible.'
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="max-h-[min(60vh,520px)] space-y-4 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="platform-support-subject">{t('platform_support.subject', 'Subject')}</Label>
              <Input
                id="platform-support-subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder={t('platform_support.subject_placeholder', 'Brief summary of your request')}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('platform_support.department', 'Department')}</Label>
              <Select value={newDepartment} onValueChange={(v) => setNewDepartment(v as PlatformSupportDepartment)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {departmentLabel(d, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('platform_support.message', 'Message')}</Label>
              <QaRichTextEditor
                value={newMessageHtml}
                onChange={setNewMessageHtml}
                placeholder={t('platform_support.message_placeholder', 'Describe your issue…')}
                onUploadImage={uploadPlatformSupportImage}
                onUploadAudio={uploadPlatformSupportAudio}
                onUploadVideo={uploadPlatformSupportVideo}
                editorMinHeight="160px"
                editorMaxHeight="280px"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleNewTicketOpenChange(false)}
              disabled={creating}
            >
              {t('platform_support.cancel', 'Cancel')}
            </Button>
            <Button type="button" onClick={() => void handleCreate()} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ms-2">{t('platform_support.submitting', 'Submitting…')}</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="ms-2">{t('platform_support.submit', 'Submit')}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

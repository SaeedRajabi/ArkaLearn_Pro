'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Reply, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { RichHtmlContent } from '@/components/shared/rich-html-content';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { cn } from '@/lib/utils';
import { usePlatformSupportTicketHub } from '@/hooks/use-platform-support-ticket-hub';
import type { PlatformTicketMessagePostedPayload } from '@/lib/platform-support-ticket-hub';
import {
  ADMIN_PLATFORM_TICKET_MESSAGE_PAGE_SIZE,
  getSupportTicketById,
  replySupportTicket,
  sendAdminPlatformTicketMessage,
  type PlatformSupportTicketMessage,
  type SupportTicketDetail,
} from '@/services/support-ticket-api.service';
import {
  departmentLabel,
  statusLabel,
  ticketSourceLabel,
} from '../support-ticket-display';

export default function SupportTicketDetailPage() {
  const params = useParams();
  const ticketId = Number(params.id);
  const { t, direction } = useLanguage();
  const { toast } = useToast();
  const [ticket, setTicket] = React.useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [replyMessage, setReplyMessage] = React.useState('');
  const [composerHtml, setComposerHtml] = React.useState('');
  const [replyToMessage, setReplyToMessage] = React.useState<PlatformSupportTicketMessage | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const isPlatform = ticket?.ticketSource === 'Platform';
  const isClosed = ticket?.status === 'Closed';

  const load = React.useCallback(async (beforeMessageId?: number) => {
    if (!Number.isFinite(ticketId) || ticketId <= 0) return;
    if (!beforeMessageId) setLoading(true);
    try {
      const data = await getSupportTicketById(
        ticketId,
        ADMIN_PLATFORM_TICKET_MESSAGE_PAGE_SIZE,
        beforeMessageId,
      );
      if (!beforeMessageId) {
        setTicket(data);
        setReplyMessage(data?.adminReply ?? '');
      } else if (data) {
        setTicket((prev) => {
          if (!prev) return data;
          return {
            ...data,
            messages: [
              ...data.messages,
              ...prev.messages.filter((m) => !data.messages.some((n) => n.id === m.id)),
            ],
          };
        });
      }
    } catch {
      if (!beforeMessageId) setTicket(null);
    } finally {
      if (!beforeMessageId) setLoading(false);
    }
  }, [ticketId]);

  React.useEffect(() => {
    void load();
  }, [ticketId]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages.length]);

  const handleRealtimeMessage = React.useCallback(
    (payload: PlatformTicketMessagePostedPayload) => {
      if (payload.ticketId !== ticketId) return;
      setTicket((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === payload.messageId)) return { ...prev, status: payload.status };
        const row: PlatformSupportTicketMessage = {
          id: payload.messageId,
          senderUserId: payload.senderUserId,
          senderName: payload.senderName,
          contentHtml: payload.contentHtml,
          sentAtUtc: payload.sentAtUtc,
          isMine: payload.isStaffMessage,
          isStaffMessage: payload.isStaffMessage,
          replyToMessageId: payload.replyToMessageId ?? null,
          replyToSenderName: payload.replyToSenderName ?? null,
          replyToContentPreview: payload.replyToContentPreview ?? null,
        };
        return { ...prev, status: payload.status, messages: [...prev.messages, row] };
      });
    },
    [ticketId],
  );

  usePlatformSupportTicketHub({
    ticketId: Number.isFinite(ticketId) && ticketId > 0 ? ticketId : undefined,
    isAdmin: true,
    enabled: Number.isFinite(ticketId) && ticketId > 0,
    handlers: {
      onMessagePosted: handleRealtimeMessage,
      onTicketStatusChanged: () => void load(),
    },
  });

  const handleLegacyReply = async () => {
    if (!ticket) return;
    setSubmitting(true);
    try {
      await replySupportTicket({ ticketId: ticket.id, replyMessage: replyMessage.trim() });
      toast({ title: t('support_tickets_reply_sent_toast') });
      await load();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('support_tickets_reply_error'),
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlatformSend = async () => {
    if (!ticket || !composerHtml.replace(/<[^>]+>/g, '').trim()) return;
    setSubmitting(true);
    try {
      await sendAdminPlatformTicketMessage({
        ticketId: ticket.id,
        contentHtml: composerHtml,
        replyToMessageId: replyToMessage?.id,
      });
      setComposerHtml('');
      setReplyToMessage(null);
      await load();
      toast({ title: t('support_tickets_reply_sent_toast') });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('support_tickets_reply_error'),
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const loadOlder = async () => {
    if (!ticket?.hasMoreOlderMessages || loadingOlder) return;
    const oldest = ticket.messages[0];
    if (!oldest) return;
    setLoadingOlder(true);
    try {
      await load(oldest.id);
    } finally {
      setLoadingOlder(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/support-tickets">
            <ArrowLeft className="h-4 w-4 me-2" />
            {t('support_tickets_back')}
          </Link>
        </Button>
        <p className="text-muted-foreground">{t('support_tickets_not_found')}</p>
      </div>
    );
  }

  const canLegacyReply = !isPlatform && !ticket.adminReply;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/support-tickets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {ticket.displayCode}
            </h1>
            <p className="text-sm text-muted-foreground">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{ticketSourceLabel(ticket.ticketSource, t)}</Badge>
          {ticket.department ? (
            <Badge variant="secondary">{departmentLabel(ticket.department, t)}</Badge>
          ) : null}
          <Badge>{statusLabel(ticket.status, t)}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {isPlatform ? (
            <CardContent className="space-y-4 pt-6">
              {ticket.hasMoreOlderMessages ? (
                <div className="text-center">
                  <Button variant="ghost" size="sm" disabled={loadingOlder} onClick={() => void loadOlder()}>
                    {loadingOlder ? <Loader2 className="h-4 w-4 animate-spin" /> : t('support_tickets_load_older')}
                  </Button>
                </div>
              ) : null}
              {ticket.messages.map((msg) => (
                <div key={msg.id} className={cn('flex', msg.isStaffMessage ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[90%] rounded-2xl border px-4 py-3 text-sm',
                      msg.isStaffMessage ? 'bg-primary/10' : 'bg-muted',
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{msg.senderName}</span>
                      {!isClosed && !msg.isStaffMessage ? (
                        <button type="button" onClick={() => setReplyToMessage(msg)}>
                          <Reply className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                    {msg.replyToContentPreview ? (
                      <div className="mb-2 rounded border bg-background/60 px-2 py-1 text-xs">
                        {msg.replyToSenderName}: {msg.replyToContentPreview}
                      </div>
                    ) : null}
                    <RichHtmlContent html={msg.contentHtml} dir={direction === 'rtl' ? 'rtl' : 'ltr'} />
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle>{t('support_tickets_message')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{ticket.message}</p>
              </CardContent>
            </>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('support_tickets_requester')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{ticket.requesterName}</p>
            <a href={`mailto:${ticket.requesterEmail}`} className="text-primary hover:underline break-all">
              {ticket.requesterEmail}
            </a>
            <p className="text-muted-foreground">{ticket.createdDateTime}</p>
            {ticket.firstViewedAtUtc ? (
              <p className="text-xs text-muted-foreground">
                {t('support_tickets_first_viewed')}: {ticket.firstViewedAtUtc}
              </p>
            ) : null}
            {ticket.rating ? (
              <p className="text-xs text-muted-foreground">
                {t('support_tickets_rating')}: {ticket.rating}/5
                {ticket.ratingComment ? ` — ${ticket.ratingComment}` : ''}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {isPlatform ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('support_tickets_reply_title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isClosed ? (
              <p className="text-sm text-muted-foreground">{t('support_tickets_ticket_closed')}</p>
            ) : (
              <>
                {replyToMessage ? (
                  <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-xs">
                    <span>
                      {t('support_tickets_replying_to')} {replyToMessage.senderName}
                    </span>
                    <button type="button" onClick={() => setReplyToMessage(null)}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
                <CustomRichTextEditor
                  content={composerHtml}
                  onChangeAction={setComposerHtml}
                  placeholder={t('support_tickets_reply_placeholder')}
                  expandVertically
                />
                <Button onClick={() => void handlePlatformSend()} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Send className="h-4 w-4 me-2" />}
                  {t('support_tickets_send_reply')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('support_tickets_reply_title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder={t('support_tickets_reply_placeholder')}
              rows={6}
              disabled={!canLegacyReply || submitting}
            />
            {ticket.adminReply && ticket.repliedAt ? (
              <p className="text-xs text-muted-foreground">
                {t('support_tickets_replied_at')}: {ticket.repliedAt}
              </p>
            ) : null}
            <Button
              onClick={() => void handleLegacyReply()}
              disabled={!canLegacyReply || submitting || replyMessage.trim().length < 5}
            >
              <Send className="h-4 w-4 me-2" />
              {t('support_tickets_send_reply')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

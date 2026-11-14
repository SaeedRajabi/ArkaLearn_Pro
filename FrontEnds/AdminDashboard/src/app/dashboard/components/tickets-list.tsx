'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/components/language-provider';
import type { DashboardSupportTicket } from '@/services/dashboard-service';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveStaticAssetUrl } from '@/lib/api-config';

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  const a = p[0]?.[0]?.toUpperCase() ?? '?';
  const b = p[1]?.[0]?.toUpperCase() ?? '';
  return a + b;
}

interface TicketsListProps {
  tickets: DashboardSupportTicket[];
  loading?: boolean;
}

export function TicketsList({ tickets, loading }: TicketsListProps) {
  const { t, locale } = useLanguage();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('tickets_title')}</CardTitle>
          <CardDescription>{t('tickets_description_db')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ul className="space-y-4">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[75%] max-w-[200px]" />
                  <Skeleton className="h-3 w-1/2 max-w-[160px]" />
                </div>
              </li>
            ))}
          </ul>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('tickets_empty')}</p>
        ) : (
          <ul className="space-y-4">
            {tickets.map((ticket) => {
              const img = ticket.requesterAvatarUrl ? resolveStaticAssetUrl(ticket.requesterAvatarUrl) : '';
              return (
                <li key={ticket.id} className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    {img ? <AvatarImage src={img} alt="" /> : null}
                    <AvatarFallback>{initials(ticket.requesterName)}</AvatarFallback>
                  </Avatar>
                  <Link href={`/dashboard/support-tickets/${ticket.id}`} className="flex-1 min-w-0 hover:opacity-90">
                    <p className="font-medium truncate">{ticket.requesterName}</p>
                    <p className="text-sm text-muted-foreground truncate" title={ticket.subject}>
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('tickets_new_ticket_prefix')} #{ticket.ticketNumber}
                      {ticket.createdDateTime
                        ? ` · ${new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(ticket.createdDateTime))}`
                        : ''}
                    </p>
                    <span className="inline-block mt-1 text-[11px] rounded-md bg-muted px-2 py-0.5">
                      {ticket.status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

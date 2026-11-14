'use client';

import type { MouseEvent } from 'react';
import { format } from 'date-fns';
import { format as formatJalali } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CALENDAR_CATEGORY_META, resolveCalendarEventStyles } from '@/lib/calendar/constants';
import { useLanguage } from '@/components/language-provider';
import { isPersianLocale, toLocaleDigits } from '@/lib/utils/locale-format';
import type { CalendarEventItem } from '@/services/calendar-api.service';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: CalendarEventItem[];
  onSelectEvent: (eventId: number) => void;
  onCreateEvent: (date: Date) => void;
  onEventContextMenu?: (event: MouseEvent, calendarEvent: CalendarEventItem) => void;
  formatTimeLabel: (event: CalendarEventItem) => string;
  statusNow?: Date;
};

export function CalendarDayEventsDialog({
  open,
  onOpenChange,
  date,
  events,
  onSelectEvent,
  onCreateEvent,
  onEventContextMenu,
  formatTimeLabel,
  statusNow = new Date(),
}: Props) {
  const { t, locale } = useLanguage();

  const dateLabel = date
    ? isPersianLocale(locale)
      ? toLocaleDigits(formatJalali(date, 'EEEE d MMMM yyyy', { locale: faIR }), locale)
      : format(date, 'EEEE, MMMM d, yyyy')
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('calendar_day_events_title')}</DialogTitle>
          <DialogDescription>{dateLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('calendar_no_events_day')}</p>
          ) : (
            events.map((event) => {
              const meta = resolveCalendarEventStyles(event, statusNow);
              const categoryMeta = CALENDAR_CATEGORY_META[event.category];
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    onSelectEvent(event.id);
                    onOpenChange(false);
                  }}
                  onContextMenu={(mouseEvent) => onEventContextMenu?.(mouseEvent, event)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border p-3 text-start transition hover:border-primary/40',
                    meta.bg,
                    meta.border
                  )}
                >
                  <div className={cn('mt-0.5 h-8 w-1 shrink-0 rounded-full', meta.bg.replace('/15', ''))} />
                  <div className="min-w-0 flex-1">
                    <div className={cn('font-medium', meta.color)}>{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.isAllDay ? t('calendar_all_day') : formatTimeLabel(event)}
                      {' · '}
                      {t(categoryMeta.labelKey)}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {date ? (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              onCreateEvent(date);
              onOpenChange(false);
            }}
          >
            <Plus className="me-2 h-4 w-4" />
            {t('calendar_add_event')}
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  endOfMonth as endOfMonthJalali,
  format as formatJalali,
  isSameDay as isSameDayJalali,
  isSameMonth as isSameMonthJalali,
  startOfMonth as startOfMonthJalali,
} from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Loader2,
  Pencil,
  Plus,
  Scissors,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  buildMonthGrid,
  getMonthIndex,
  getMonthOptions,
  getWeekdayLabels,
  getYearValue,
  shiftMonth,
} from '@/lib/utils/calendar-grid';
import { formatLocaleTime, isPersianLocale, toLocaleDigits } from '@/lib/utils/locale-format';
import { parseUtcApiDateTime } from '@/lib/utils/localized-dates';
import {
  ALL_CALENDAR_CATEGORIES,
  CALENDAR_CATEGORY_META,
  eventOccursOnDay,
  resolveCalendarEventStyles,
  type CalendarViewMode,
} from '@/lib/calendar/constants';
import {
  deleteCalendarEvent,
  fetchCalendarEventsByRange,
  saveCalendarEvent,
  updateCalendarEvent,
  type CalendarEventCategory,
  type CalendarEventItem,
} from '@/services/calendar-api.service';
import { calendarEventPayloadForDay } from '@/lib/calendar/event-clipboard';
import { CalendarEventDialog } from './calendar-event-dialog';
import { CalendarDayEventsDialog } from './calendar-day-events-dialog';

const VIEW_MODES: CalendarViewMode[] = ['month', 'week', 'day', 'list'];

type CalendarClipboard = {
  event: CalendarEventItem;
  mode: 'copy' | 'cut';
};

type CalendarContextMenu =
  | { kind: 'event'; x: number; y: number; event: CalendarEventItem }
  | { kind: 'day'; x: number; y: number; day: Date };

function formatMonthTitle(viewDate: Date, locale: 'fa' | 'en'): string {
  if (isPersianLocale(locale)) {
    return toLocaleDigits(formatJalali(viewDate, 'MMMM yyyy', { locale: faIR }), locale);
  }
  return format(viewDate, 'MMMM yyyy');
}

function formatTimeLabel(event: CalendarEventItem, locale: 'fa' | 'en'): string {
  if (event.isAllDay) return '';
  const d = parseUtcApiDateTime(event.startUtc);
  if (!d) return '';
  return formatLocaleTime(d, locale);
}

function toEventLocalDate(iso: string): Date {
  return parseUtcApiDateTime(iso) ?? new Date(iso);
}

export function CalendarPageClient() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [viewDate, setViewDate] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>('month');
  const [activeCategories, setActiveCategories] = React.useState<Set<CalendarEventCategory>>(
    () => new Set(ALL_CALENDAR_CATEGORIES)
  );
  const [events, setEvents] = React.useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingEventId, setEditingEventId] = React.useState<number | null>(null);
  const [dialogSeedDate, setDialogSeedDate] = React.useState<Date | undefined>();
  const [dayEventsOpen, setDayEventsOpen] = React.useState(false);
  const [dayEventsDate, setDayEventsDate] = React.useState<Date | null>(null);
  const [statusNow, setStatusNow] = React.useState(() => new Date());
  const [clipboard, setClipboard] = React.useState<CalendarClipboard | null>(null);
  const [contextMenu, setContextMenu] = React.useState<CalendarContextMenu | null>(null);
  const contextMenuRef = React.useRef<HTMLDivElement>(null);
  const fetchSequenceRef = React.useRef(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => setStatusNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const range = React.useMemo(() => {
    if (viewMode === 'day') {
      return { start: startOfDay(viewDate), end: endOfDay(viewDate) };
    }
    if (viewMode === 'week') {
      const weekStart = isPersianLocale(locale)
        ? startOfWeek(viewDate, { weekStartsOn: 6 })
        : startOfWeek(viewDate, { weekStartsOn: 0 });
      const weekEnd = isPersianLocale(locale)
        ? endOfWeek(viewDate, { weekStartsOn: 6 })
        : endOfWeek(viewDate, { weekStartsOn: 0 });
      return { start: weekStart, end: weekEnd };
    }
    const monthStart = isPersianLocale(locale) ? startOfMonthJalali(viewDate) : startOfMonth(viewDate);
    const monthEnd = isPersianLocale(locale) ? endOfMonthJalali(viewDate) : endOfMonth(viewDate);
    const gridStart = isPersianLocale(locale)
      ? startOfWeek(monthStart, { weekStartsOn: 6 })
      : startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = isPersianLocale(locale)
      ? endOfWeek(monthEnd, { weekStartsOn: 6 })
      : endOfWeek(monthEnd, { weekStartsOn: 0 });
    return { start: gridStart, end: gridEnd };
  }, [viewDate, viewMode, locale]);

  const loadEvents = React.useCallback(async (options?: { background?: boolean }) => {
    const sequence = ++fetchSequenceRef.current;
    if (!options?.background) setLoading(true);
    try {
      const categories = ALL_CALENDAR_CATEGORIES.filter((c) => activeCategories.has(c));
      const list = await fetchCalendarEventsByRange({
        rangeStartUtc: range.start,
        rangeEndUtc: range.end,
        categories,
      });
      if (sequence === fetchSequenceRef.current) setEvents(list);
    } finally {
      if (sequence === fetchSequenceRef.current) setLoading(false);
    }
  }, [range.start, range.end, activeCategories]);

  React.useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const monthGrid = buildMonthGrid(viewDate, selectedDate, locale);
  const weekdayLabels = getWeekdayLabels(locale);
  const monthOptions = getMonthOptions(locale);
  const currentMonthIndex = getMonthIndex(viewDate, locale);
  const currentYear = getYearValue(viewDate, locale);

  const filteredEvents = events.filter((e) => activeCategories.has(e.category));

  const openCreate = (date?: Date) => {
    setEditingEventId(null);
    setDialogSeedDate(date ?? selectedDate);
    setDialogOpen(true);
  };

  const openEdit = (eventId: number) => {
    setEditingEventId(eventId);
    setDialogSeedDate(undefined);
    setDialogOpen(true);
  };

  const removeEventOptimistically = React.useCallback((eventId: number) => {
    // Invalidate any older GET which could otherwise put the deleted event back.
    fetchSequenceRef.current += 1;
    setEvents((current) => current.filter((event) => event.id !== eventId));
  }, []);

  const menuPosition = (event: React.MouseEvent) => ({
    x: Math.max(8, Math.min(event.clientX, window.innerWidth - 224)),
    y: Math.max(8, Math.min(event.clientY, window.innerHeight - 280)),
  });

  const openEventContextMenu = (mouseEvent: React.MouseEvent, event: CalendarEventItem) => {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    setContextMenu({ kind: 'event', ...menuPosition(mouseEvent), event });
  };

  const openDayContextMenu = (mouseEvent: React.MouseEvent, day: Date) => {
    mouseEvent.preventDefault();
    setSelectedDate(day);
    setContextMenu({ kind: 'day', ...menuPosition(mouseEvent), day });
  };

  React.useEffect(() => {
    if (!contextMenu) return;
    const closeOutside = (event: PointerEvent) => {
      if (!contextMenuRef.current?.contains(event.target as Node)) setContextMenu(null);
    };
    const close = () => setContextMenu(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('pointerdown', closeOutside);
    window.addEventListener('blur', close);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('blur', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [contextMenu]);

  const copyEvent = (event: CalendarEventItem, mode: 'copy' | 'cut') => {
    setClipboard({ event, mode });
    setContextMenu(null);
    toast({
      title: mode === 'copy' ? t('calendar_event_copied') : t('calendar_event_cut'),
      description: t('calendar_paste_hint'),
    });
  };

  const duplicateEvent = async (event: CalendarEventItem) => {
    setContextMenu(null);
    try {
      await saveCalendarEvent(calendarEventPayloadForDay(event, toEventLocalDate(event.startUtc)));
      toast({ title: t('calendar_event_duplicated') });
      await loadEvents({ background: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('calendar_error'),
        description: error instanceof Error ? error.message : t('calendar_event_operation_failed'),
      });
    }
  };

  const deleteEventFromContextMenu = async (event: CalendarEventItem) => {
    setContextMenu(null);
    if (!window.confirm(t('calendar_delete_confirm', { title: event.title }))) return;
    const snapshot = events;
    removeEventOptimistically(event.id);
    try {
      await deleteCalendarEvent(event.id);
      toast({ title: t('calendar_event_deleted') });
    } catch (error) {
      setEvents(snapshot);
      toast({
        variant: 'destructive',
        title: t('calendar_error'),
        description: error instanceof Error ? error.message : t('calendar_event_delete_failed'),
      });
    } finally {
      void loadEvents({ background: true });
    }
  };

  const pasteEventToDay = async (day: Date) => {
    if (!clipboard) return;
    setContextMenu(null);
    const payload = calendarEventPayloadForDay(clipboard.event, day);
    const snapshot = events;

    if (clipboard.mode === 'cut') {
      fetchSequenceRef.current += 1;
      setEvents((current) =>
        current.map((event) =>
          event.id === clipboard.event.id
            ? { ...event, startUtc: payload.startUtc, endUtc: payload.endUtc }
            : event
        )
      );
    }

    try {
      if (clipboard.mode === 'cut') {
        await updateCalendarEvent(clipboard.event.id, payload);
        setClipboard(null);
        toast({ title: t('calendar_event_moved') });
      } else {
        await saveCalendarEvent(payload);
        toast({ title: t('calendar_event_pasted') });
      }
      await loadEvents({ background: true });
    } catch (error) {
      setEvents(snapshot);
      toast({
        variant: 'destructive',
        title: t('calendar_error'),
        description: error instanceof Error ? error.message : t('calendar_event_operation_failed'),
      });
      void loadEvents({ background: true });
    }
  };

  const getEventsForDay = React.useCallback(
    (day: Date) =>
      filteredEvents.filter((event) =>
        eventOccursOnDay(toEventLocalDate(event.startUtc), toEventLocalDate(event.endUtc), day)
      ),
    [filteredEvents]
  );

  const openDayEvents = (date: Date) => {
    setSelectedDate(date);
    setDayEventsDate(date);
    setDayEventsOpen(true);
  };

  const selectedDayEvents = React.useMemo(
    () => getEventsForDay(selectedDate),
    [getEventsForDay, selectedDate]
  );

  const dayEventsDialogList = React.useMemo(
    () => (dayEventsDate ? getEventsForDay(dayEventsDate) : []),
    [dayEventsDate, getEventsForDay]
  );

  const toggleCategory = (cat: CalendarEventCategory, checked: boolean) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (checked) next.add(cat);
      else next.delete(cat);
      return next;
    });
  };

  const renderMonthCell = (cell: (typeof monthGrid)[number]) => {
    const dayEvents = getEventsForDay(cell.date);
    const visible = dayEvents.slice(0, 3);
    const overflow = dayEvents.length - visible.length;

    return (
      <div
        key={cell.date.toISOString()}
        role="presentation"
        onClick={() => {
          setSelectedDate(cell.date);
          if (dayEvents.length === 0) openCreate(cell.date);
        }}
        onDoubleClick={() => openCreate(cell.date)}
        onContextMenu={(event) => openDayContextMenu(event, cell.date)}
        className={cn(
          'group relative flex min-h-[7.5rem] cursor-pointer flex-col rounded-xl border bg-background/70 p-2 text-start transition hover:border-primary/40 hover:bg-accent/30',
          !cell.inCurrentMonth && 'opacity-45',
          cell.isToday && 'ring-2 ring-primary/30',
          cell.isSelected && 'border-primary bg-primary/5'
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-1">
          <span
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
              cell.isToday && 'bg-primary text-primary-foreground'
            )}
          >
            {cell.label}
          </span>
          <button
            type="button"
            title={t('calendar_view_day_events')}
            aria-label={t('calendar_view_day_events')}
            onClick={(e) => {
              e.stopPropagation();
              openDayEvents(cell.date);
            }}
            className={cn(
              'inline-flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-md px-1 text-muted-foreground transition hover:bg-accent hover:text-foreground',
              dayEvents.length > 0
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {dayEvents.length > 0 ? (
              <span className="rounded-full bg-primary/15 px-1 text-[10px] font-semibold text-primary">
                {isPersianLocale(locale) ? toLocaleDigits(dayEvents.length, locale) : dayEvents.length}
              </span>
            ) : null}
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          {visible.map((event) => {
            const meta = resolveCalendarEventStyles(event, statusNow);
            return (
              <button
                key={event.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(event.id);
                }}
                onContextMenu={(mouseEvent) => openEventContextMenu(mouseEvent, event)}
                className={cn(
                  'truncate rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition',
                  meta.bg,
                  meta.color,
                  meta.border
                )}
              >
                {!event.isAllDay && (
                  <span className="opacity-80">{formatTimeLabel(event, locale)} </span>
                )}
                {event.title}
              </button>
            );
          })}
          {overflow > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {t('calendar_more_events').replace('{count}', String(overflow))}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderWeekOrDay = () => {
    const days =
      viewMode === 'day'
        ? [viewDate]
        : Array.from({ length: 7 }, (_, i) => {
            const start = isPersianLocale(locale)
              ? startOfWeek(viewDate, { weekStartsOn: 6 })
              : startOfWeek(viewDate, { weekStartsOn: 0 });
            return addDays(start, i);
          });

    return (
      <div className={cn('grid gap-3', viewMode === 'week' ? 'md:grid-cols-7' : 'grid-cols-1')}>
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const label = isPersianLocale(locale)
            ? toLocaleDigits(formatJalali(day, 'EEEE d MMM', { locale: faIR }), locale)
            : format(day, 'EEE d MMM');

          return (
            <div
              key={day.toISOString()}
              onContextMenu={(event) => openDayContextMenu(event, day)}
              className="rounded-xl border bg-card/60 p-3 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{label}</h3>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    title={t('calendar_view_day_events')}
                    onClick={() => openDayEvents(day)}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openCreate(day)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {dayEvents.length === 0 && (
                  <p className="text-xs text-muted-foreground">{t('calendar_no_events_day')}</p>
                )}
                {dayEvents.map((event) => {
                  const meta = resolveCalendarEventStyles(event, statusNow);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openEdit(event.id)}
                      onContextMenu={(mouseEvent) => openEventContextMenu(mouseEvent, event)}
                      className={cn('w-full rounded-lg border p-2 text-start text-sm transition', meta.bg, meta.border)}
                    >
                      <div className={cn('font-medium', meta.color)}>{event.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {event.isAllDay
                          ? t('calendar_all_day')
                          : formatTimeLabel(event, locale)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderList = () => {
    const sorted = [...filteredEvents].sort(
      (a, b) => toEventLocalDate(a.startUtc).getTime() - toEventLocalDate(b.startUtc).getTime()
    );

    if (sorted.length === 0) {
      return <p className="py-12 text-center text-muted-foreground">{t('calendar_no_events')}</p>;
    }

    return (
      <div className="space-y-2">
        {sorted.map((event) => {
          const meta = resolveCalendarEventStyles(event, statusNow);
          const categoryMeta = CALENDAR_CATEGORY_META[event.category];
          const start = toEventLocalDate(event.startUtc);
          const dateLabel = isPersianLocale(locale)
            ? toLocaleDigits(formatJalali(start, 'yyyy/MM/dd', { locale: faIR }), locale)
            : format(start, 'yyyy/MM/dd');

          return (
            <button
              key={event.id}
              type="button"
              onClick={() => openEdit(event.id)}
              onContextMenu={(mouseEvent) => openEventContextMenu(mouseEvent, event)}
              className="flex w-full items-center gap-4 rounded-xl border bg-card/70 p-4 text-start transition hover:border-primary/30"
            >
              <div className={cn('h-12 w-1 rounded-full', meta.bg.replace('/15', ''))} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{event.title}</div>
                <div className="text-sm text-muted-foreground">
                  {dateLabel}
                  {!event.isAllDay && ` · ${formatTimeLabel(event, locale)}`}
                  {' · '}
                  {t(categoryMeta.labelKey)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const miniGrid = buildMonthGrid(viewDate, selectedDate, locale);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-500/10 via-background to-sky-500/10 p-6 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('nav_calendar')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('calendar_page_description')}</p>
          </div>
          <Button onClick={() => openCreate()} className="shadow-md">
            <Plus className="me-2 h-4 w-4" />
            {t('calendar_add_event')}
          </Button>
        </div>
      </div>

      {clipboard && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            {clipboard.mode === 'copy' ? <Copy className="h-4 w-4 shrink-0" /> : <Scissors className="h-4 w-4 shrink-0" />}
            <span className="truncate">
              {t(clipboard.mode === 'copy' ? 'calendar_clipboard_copy_ready' : 'calendar_clipboard_cut_ready', {
                title: clipboard.event.title,
              })}
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setClipboard(null)}>
            {t('actions_cancel')}
          </Button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
        <div className="order-2 xl:order-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/60 p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setViewDate(shiftMonth(viewDate, -1, locale))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setViewDate(shiftMonth(viewDate, 1, locale))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[10rem] text-center text-lg font-semibold">
                {formatMonthTitle(viewDate, locale)}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewDate(new Date())}>
                {t('calendar_today')}
              </Button>
            </div>

            <div className="flex rounded-lg border bg-background p-1">
              {VIEW_MODES.map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  className="h-8 px-3"
                  onClick={() => setViewMode(mode)}
                >
                  {t(`calendar_view_${mode}`)}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="me-2 h-5 w-5 animate-spin" />
              {t('loading')}
            </div>
          ) : viewMode === 'month' ? (
            <div className="overflow-hidden rounded-2xl border bg-card/50 shadow-sm">
              <div className="grid grid-cols-7 border-b bg-muted/30">
                {weekdayLabels.map((label) => (
                  <div key={label} className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-border/60 p-px">
                {monthGrid.map((cell) => renderMonthCell(cell))}
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="rounded-2xl border bg-card/50 p-4 shadow-sm">{renderList()}</div>
          ) : (
            renderWeekOrDay()
          )}
        </div>

        <aside className="order-1 xl:order-2 space-y-4">
          <div className="rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur">
            <Button className="mb-4 w-full" onClick={() => openCreate(selectedDate)}>
              <Plus className="me-2 h-4 w-4" />
              {t('calendar_add_event')}
            </Button>

            <div className="mb-3 flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewDate(shiftMonth(viewDate, -1, locale))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {monthOptions.find((m) => m.value === currentMonthIndex)?.label}{' '}
                {isPersianLocale(locale) ? toLocaleDigits(String(currentYear), locale) : currentYear}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewDate(shiftMonth(viewDate, 1, locale))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
              {weekdayLabels.map((d) => (
                <span key={d}>{d.slice(0, 2)}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {miniGrid.map((cell) => {
                const inMonth = isPersianLocale(locale)
                  ? isSameMonthJalali(cell.date, viewDate)
                  : isSameMonth(cell.date, viewDate);
                const isSelected = isPersianLocale(locale)
                  ? isSameDayJalali(cell.date, selectedDate)
                  : isSameDay(cell.date, selectedDate);
                const hasEvents = getEventsForDay(cell.date).length > 0;
                return (
                  <button
                    key={`mini-${cell.date.toISOString()}`}
                    type="button"
                    onClick={() => {
                      setSelectedDate(cell.date);
                      setViewDate(cell.date);
                    }}
                    onContextMenu={(event) => openDayContextMenu(event, cell.date)}
                    className={cn(
                      'relative h-7 rounded-md text-xs transition',
                      !inMonth && 'text-muted-foreground/50',
                      cell.isToday && 'bg-primary/15 font-semibold text-primary',
                      isSelected && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {cell.label}
                    {hasEvents ? (
                      <span className="absolute bottom-0.5 start-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t('calendar_selected_day_events')}</h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                title={t('calendar_view_day_events')}
                onClick={() => openDayEvents(selectedDate)}
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              {isPersianLocale(locale)
                ? toLocaleDigits(formatJalali(selectedDate, 'EEEE d MMMM', { locale: faIR }), locale)
                : format(selectedDate, 'EEE, MMM d')}
            </p>
            <div className="space-y-2">
              {selectedDayEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('calendar_no_events_day')}</p>
              ) : (
                selectedDayEvents.map((event) => {
                  const meta = resolveCalendarEventStyles(event, statusNow);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openEdit(event.id)}
                      onContextMenu={(mouseEvent) => openEventContextMenu(mouseEvent, event)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-start text-xs transition hover:border-primary/30',
                        meta.bg,
                        meta.border
                      )}
                    >
                      <span className={cn('font-medium', meta.color)}>{event.title}</span>
                      {!event.isAllDay && (
                        <span className="text-muted-foreground">{formatTimeLabel(event, locale)}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">{t('calendar_filters')}</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={activeCategories.size === ALL_CALENDAR_CATEGORIES.length}
                  onCheckedChange={(checked) => {
                    setActiveCategories(
                      checked ? new Set(ALL_CALENDAR_CATEGORIES) : new Set()
                    );
                  }}
                />
                {t('calendar_filter_all')}
              </label>
              {ALL_CALENDAR_CATEGORIES.map((cat) => {
                const meta = CALENDAR_CATEGORY_META[cat];
                return (
                  <label key={cat} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={activeCategories.has(cat)}
                      onCheckedChange={(checked) => toggleCategory(cat, Boolean(checked))}
                    />
                    <span className={cn('inline-block h-2.5 w-2.5 rounded-full', meta.bg.replace('/15', ''))} />
                    {t(meta.labelKey)}
                  </label>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <CalendarEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={editingEventId}
        initialDate={dialogSeedDate}
        onSaved={() => void loadEvents({ background: true })}
        onDeleteOptimistic={removeEventOptimistically}
      />

      <CalendarDayEventsDialog
        open={dayEventsOpen}
        onOpenChange={setDayEventsOpen}
        date={dayEventsDate}
        events={dayEventsDialogList}
        onSelectEvent={openEdit}
        onCreateEvent={openCreate}
        onEventContextMenu={(event, calendarEvent) => {
          setDayEventsOpen(false);
          openEventContextMenu(event, calendarEvent);
        }}
        formatTimeLabel={(event) => formatTimeLabel(event, locale)}
        statusNow={statusNow}
      />

      {contextMenu && (
        <div
          ref={contextMenuRef}
          role="menu"
          aria-label={t('calendar_context_actions')}
          onContextMenu={(event) => event.preventDefault()}
          className="fixed z-[200] w-56 overflow-hidden rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-2xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.kind === 'event' ? (
            <>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-accent"
                onClick={() => {
                  setContextMenu(null);
                  openEdit(contextMenu.event.id);
                }}
              >
                <Pencil className="h-4 w-4" />
                {t('calendar_context_edit')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-accent"
                onClick={() => copyEvent(contextMenu.event, 'copy')}
              >
                <Copy className="h-4 w-4" />
                {t('calendar_context_copy')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-accent"
                onClick={() => copyEvent(contextMenu.event, 'cut')}
              >
                <Scissors className="h-4 w-4" />
                {t('calendar_context_cut')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-accent"
                onClick={() => void duplicateEvent(contextMenu.event)}
              >
                <CopyPlus className="h-4 w-4" />
                {t('calendar_context_duplicate')}
              </button>
              {clipboard && (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-accent"
                  onClick={() => void pasteEventToDay(toEventLocalDate(contextMenu.event.startUtc))}
                >
                  <ClipboardPaste className="h-4 w-4" />
                  {t('calendar_context_paste_here')}
                </button>
              )}
              <div className="my-1 border-t" />
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-destructive hover:bg-destructive/10"
                onClick={() => void deleteEventFromContextMenu(contextMenu.event)}
              >
                <Trash2 className="h-4 w-4" />
                {t('calendar_context_delete')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                disabled={!clipboard}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-45"
                onClick={() => void pasteEventToDay(contextMenu.day)}
              >
                <ClipboardPaste className="h-4 w-4" />
                {clipboard
                  ? t('calendar_context_paste_event', { title: clipboard.event.title })
                  : t('calendar_context_clipboard_empty')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-accent"
                onClick={() => {
                  const day = contextMenu.day;
                  setContextMenu(null);
                  openCreate(day);
                }}
              >
                <Plus className="h-4 w-4" />
                {t('calendar_add_event')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

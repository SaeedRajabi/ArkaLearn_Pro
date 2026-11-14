'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LocalizedDateTimePicker } from '@/components/ui/localized-date-time-picker';
import { LocalizedDatePicker } from '@/components/ui/localized-date-picker';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { ALL_CALENDAR_CATEGORIES, CALENDAR_CATEGORY_META, toAllDayRange } from '@/lib/calendar/constants';
import {
  buildCalendarEventOccurrences,
  type CalendarRepeatMode,
} from '@/lib/calendar/event-occurrences';
import { parseUtcApiDateTime } from '@/lib/utils/localized-dates';
import {
  deleteCalendarEvent,
  fetchCalendarEventById,
  resolveParticipantDisplayNames,
  saveCalendarEvent,
  updateCalendarEvent,
  type CalendarEventCategory,
  type CalendarEventItem,
} from '@/services/calendar-api.service';
import { mapSearchRowToUser, searchUsers } from '@/services/user-service';

const schema = z
  .object({
    title: z.string().min(1),
    category: z.coerce.number().min(0).max(4),
    start: z.date(),
    end: z.date(),
    isAllDay: z.boolean(),
    eventUrl: z.string().optional(),
    description: z.string().optional(),
    repeatMode: z.enum(['single', 'odd-days', 'even-days', 'date-range']),
    repeatRangeStart: z.date().optional(),
    repeatRangeEnd: z.date().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.end < v.start) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End must be after start', path: ['end'] });
    }
    if (v.repeatMode === 'date-range') {
      if (!v.repeatRangeStart) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start date is required', path: ['repeatRangeStart'] });
      }
      if (!v.repeatRangeEnd) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date is required', path: ['repeatRangeEnd'] });
      }
      if (v.repeatRangeStart && v.repeatRangeEnd && v.repeatRangeEnd < v.repeatRangeStart) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date must be after start date', path: ['repeatRangeEnd'] });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: number | null;
  initialDate?: Date;
  onSaved: () => void;
  onDeleteOptimistic?: (eventId: number) => void;
};

export function CalendarEventDialog({
  open,
  onOpenChange,
  eventId,
  initialDate,
  onSaved,
  onDeleteOptimistic,
}: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [participantIds, setParticipantIds] = React.useState<string[]>([]);
  const [participantLabels, setParticipantLabels] = React.useState<Record<string, string>>({});
  const [userSearch, setUserSearch] = React.useState('');
  const [userResults, setUserResults] = React.useState<{ id: string; name: string }[]>([]);
  const [searchingUsers, setSearchingUsers] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      category: 0,
      start: initialDate ?? new Date(),
      end: initialDate ?? new Date(),
      isAllDay: false,
      eventUrl: '',
      description: '',
      repeatMode: 'single',
      repeatRangeStart: initialDate ?? new Date(),
      repeatRangeEnd: initialDate ?? new Date(),
    },
  });

  const resetCreate = React.useCallback(
    (date?: Date) => {
      const base = date ?? new Date();
      const end = new Date(base);
      end.setHours(base.getHours() + 1, 0, 0, 0);
      form.reset({
        title: '',
        category: 0,
        start: base,
        end,
        isAllDay: false,
        eventUrl: '',
        description: '',
        repeatMode: 'single',
        repeatRangeStart: base,
        repeatRangeEnd: base,
      });
      setParticipantIds([]);
      setParticipantLabels({});
      setUserSearch('');
      setUserResults([]);
    },
    [form]
  );

  React.useEffect(() => {
    if (!open) return;

    if (!eventId) {
      resetCreate(initialDate);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchCalendarEventById(eventId)
      .then(async (event) => {
        if (cancelled || !event) return;
        form.reset({
          title: event.title,
          category: event.category,
          start: parseUtcApiDateTime(event.startUtc) ?? new Date(),
          end: parseUtcApiDateTime(event.endUtc) ?? new Date(),
          isAllDay: event.isAllDay,
          eventUrl: event.eventUrl ?? '',
          description: event.description ?? '',
          repeatMode: 'single',
          repeatRangeStart: parseUtcApiDateTime(event.startUtc) ?? new Date(),
          repeatRangeEnd: parseUtcApiDateTime(event.startUtc) ?? new Date(),
        });
        const ids = event.participants.map((p) => p.userId);
        setParticipantIds(ids);
        const labels = await resolveParticipantDisplayNames(event.participants);
        if (!cancelled) setParticipantLabels(labels);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, eventId, initialDate, form, resetCreate]);

  React.useEffect(() => {
    if (!open || userSearch.trim().length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const { list } = await searchUsers({ inputValue: userSearch.trim(), pageSize: 8 });
        setUserResults(
          list.map((row) => {
            const user = mapSearchRowToUser(row);
            return { id: user.id, name: user.name };
          })
        );
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, open]);

  const addParticipant = (id: string, name: string) => {
    if (participantIds.includes(id)) return;
    setParticipantIds((prev) => [...prev, id]);
    setParticipantLabels((prev) => ({ ...prev, [id]: name }));
    setUserSearch('');
    setUserResults([]);
  };

  const removeParticipant = (id: string) => {
    setParticipantIds((prev) => prev.filter((x) => x !== id));
  };

  const repeatMode = form.watch('repeatMode') as CalendarRepeatMode;
  const repeatPreviewCount = eventId
    ? 1
    : buildCalendarEventOccurrences({
        start: form.watch('start'),
        end: form.watch('end'),
        repeatMode,
        rangeStart: form.watch('repeatRangeStart'),
        rangeEnd: form.watch('repeatRangeEnd'),
        locale,
      }).length;

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const expanded = buildCalendarEventOccurrences({
        start: values.start,
        end: values.end,
        repeatMode: values.repeatMode,
        rangeStart: values.repeatRangeStart,
        rangeEnd: values.repeatRangeEnd,
        locale,
      });
      if (expanded.length === 0) throw new Error(t('calendar_recurrence_empty'));
      if (expanded.length > 366) throw new Error(t('calendar_recurrence_too_many'));

      const occurrenceRanges = expanded.map((occurrence) =>
        values.isAllDay
          ? toAllDayRange(occurrence.start, occurrence.end)
          : { startUtc: occurrence.start.toISOString(), endUtc: occurrence.end.toISOString() }
      );
      const range = occurrenceRanges[0];

      const payload = {
        title: values.title.trim(),
        category: values.category as CalendarEventCategory,
        startUtc: range.startUtc,
        endUtc: range.endUtc,
        isAllDay: values.isAllDay,
        eventUrl: values.eventUrl?.trim() || undefined,
        description: values.description?.trim() || undefined,
        participantUserIds: participantIds,
        occurrences: eventId || values.repeatMode === 'single' ? undefined : occurrenceRanges,
      };

      if (eventId) {
        await updateCalendarEvent(eventId, payload);
        toast({ title: t('calendar_event_updated') });
      } else {
        await saveCalendarEvent(payload);
        toast({
          title:
            occurrenceRanges.length > 1
              ? t('calendar_events_created', { count: occurrenceRanges.length })
              : t('calendar_event_created'),
        });
        resetCreate();
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('calendar_error'),
        description: err instanceof Error ? err.message : t('calendar_event_save_failed'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    setSubmitting(true);
    onDeleteOptimistic?.(eventId);
    try {
      await deleteCalendarEvent(eventId);
      toast({ title: t('calendar_event_deleted') });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      onSaved();
      toast({
        variant: 'destructive',
        title: t('calendar_error'),
        description: err instanceof Error ? err.message : t('calendar_event_delete_failed'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{eventId ? t('calendar_edit_event') : t('calendar_add_event')}</DialogTitle>
          <DialogDescription>{t('calendar_event_dialog_desc')}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('loading')}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar_field_title')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('calendar_field_title_placeholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar_field_category')}</FormLabel>
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ALL_CALENDAR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={String(cat)}>
                            {t(CALENDAR_CATEGORY_META[cat].labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAllDay"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">{t('calendar_field_all_day')}</FormLabel>
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('calendar_field_start')}</FormLabel>
                      <FormControl>
                        {form.watch('isAllDay') ? (
                          <LocalizedDatePicker value={field.value} onChange={field.onChange} />
                        ) : (
                          <LocalizedDateTimePicker value={field.value} onChange={field.onChange} />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('calendar_field_end')}</FormLabel>
                      <FormControl>
                        {form.watch('isAllDay') ? (
                          <LocalizedDatePicker value={field.value} onChange={field.onChange} />
                        ) : (
                          <LocalizedDateTimePicker value={field.value} onChange={field.onChange} />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!eventId && (
                <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                  <FormField
                    control={form.control}
                    name="repeatMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('calendar_repeat_mode')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single">{t('calendar_repeat_single')}</SelectItem>
                            <SelectItem value="odd-days">{t('calendar_repeat_odd_days')}</SelectItem>
                            <SelectItem value="even-days">{t('calendar_repeat_even_days')}</SelectItem>
                            <SelectItem value="date-range">{t('calendar_repeat_date_range')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {repeatMode === 'date-range' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="repeatRangeStart"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('calendar_repeat_range_start')}</FormLabel>
                            <FormControl>
                              <LocalizedDatePicker value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="repeatRangeEnd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('calendar_repeat_range_end')}</FormLabel>
                            <FormControl>
                              <LocalizedDatePicker value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {repeatMode !== 'single' && (
                    <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                      {t('calendar_repeat_preview', { count: repeatPreviewCount })}
                    </p>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="eventUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar_field_url')}</FormLabel>
                    <FormControl>
                      <Input {...field} dir="ltr" placeholder="https://" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>{t('calendar_field_participants')}</FormLabel>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="ps-9"
                    placeholder={t('calendar_search_users_placeholder')}
                  />
                </div>
                {searchingUsers && (
                  <p className="text-xs text-muted-foreground">{t('loading')}</p>
                )}
                {userResults.length > 0 && (
                  <div className="rounded-lg border bg-popover p-1 shadow-sm">
                    {userResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => addParticipant(user.id, user.name)}
                      >
                        <span>{user.name}</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
                {participantIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {participantIds.map((id) => (
                      <Badge key={id} variant="secondary" className="gap-1 pe-1">
                        {participantLabels[id] ?? id}
                        <button type="button" onClick={() => removeParticipant(id)} aria-label="Remove">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar_field_description')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder={t('calendar_field_description_placeholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:justify-between">
                {eventId ? (
                  <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={submitting}>
                    <Trash2 className="me-2 h-4 w-4" />
                    {t('actions_delete')}
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    {t('actions_cancel')}
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    {t('calendar_save')}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

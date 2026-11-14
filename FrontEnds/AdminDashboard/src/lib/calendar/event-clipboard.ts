import type { CalendarEventItem, SaveCalendarEventPayload } from '@/services/calendar-api.service';
import { parseUtcApiDateTime } from '@/lib/utils/localized-dates';

function moveDateTimeToDay(source: Date, targetDay: Date): Date {
  const result = new Date(targetDay);
  result.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds()
  );
  return result;
}

/** Creates the save/update payload used by copy, duplicate, and cut/paste actions. */
export function calendarEventPayloadForDay(
  event: CalendarEventItem,
  targetDay: Date
): SaveCalendarEventPayload {
  const originalStart = parseUtcApiDateTime(event.startUtc) ?? new Date(event.startUtc);
  const originalEnd = parseUtcApiDateTime(event.endUtc) ?? new Date(event.endUtc);
  const durationMs = Math.max(0, originalEnd.getTime() - originalStart.getTime());
  const start = moveDateTimeToDay(originalStart, targetDay);
  const end = new Date(start.getTime() + durationMs);

  return {
    title: event.title,
    category: event.category,
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
    isAllDay: event.isAllDay,
    eventUrl: event.eventUrl || undefined,
    description: event.description || undefined,
    participantUserIds: event.participants.map((participant) => participant.userId),
  };
}

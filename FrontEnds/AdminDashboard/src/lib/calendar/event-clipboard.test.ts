import { calendarEventPayloadForDay } from './event-clipboard';
import type { CalendarEventItem } from '@/services/calendar-api.service';

describe('calendar event clipboard', () => {
  it('moves an event to the target day while preserving time, duration and participants', () => {
    const event: CalendarEventItem = {
      id: 12,
      title: 'React class',
      category: 1,
      startUtc: new Date(2026, 8, 10, 17, 0).toISOString(),
      endUtc: new Date(2026, 8, 10, 19, 0).toISOString(),
      isAllDay: false,
      eventUrl: 'https://example.test/room',
      description: 'Lesson 1',
      ownerUserId: '1',
      participants: [{ userId: '20', displayName: 'Student' }],
    };

    const payload = calendarEventPayloadForDay(event, new Date(2026, 8, 20));
    const start = new Date(payload.startUtc);
    const end = new Date(payload.endUtc);

    expect(start.getDate()).toBe(20);
    expect(start.getHours()).toBe(17);
    expect(end.getTime() - start.getTime()).toBe(2 * 60 * 60 * 1000);
    expect(payload.participantUserIds).toEqual(['20']);
  });
});

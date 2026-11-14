import { getMonth as getMonthJalali } from 'date-fns-jalali';
import { buildCalendarEventOccurrences } from './event-occurrences';

describe('calendar event occurrence expansion', () => {
  const start = new Date(2026, 2, 25, 17, 0, 0, 0);
  const end = new Date(2026, 2, 25, 19, 0, 0, 0);

  it('creates Sunday, Tuesday and Thursday for the odd-day schedule', () => {
    const occurrences = buildCalendarEventOccurrences({
      start,
      end,
      repeatMode: 'odd-days',
      locale: 'fa',
    });

    expect(occurrences.length).toBeGreaterThan(0);
    expect(occurrences.every((item) => [0, 2, 4].includes(item.start.getDay()))).toBe(true);
    expect(occurrences.every((item) => getMonthJalali(item.start) === getMonthJalali(start))).toBe(true);
    expect(occurrences.every((item) => item.start.getHours() === 17 && item.end.getHours() === 19)).toBe(true);
  });

  it('creates Saturday, Monday and Wednesday for the even-day schedule', () => {
    const occurrences = buildCalendarEventOccurrences({
      start: new Date(2026, 1, 5, 17),
      end: new Date(2026, 1, 5, 19),
      repeatMode: 'even-days',
      locale: 'en',
    });

    expect(occurrences.length).toBeGreaterThan(0);
    expect(occurrences.every((item) => [6, 1, 3].includes(item.start.getDay()))).toBe(true);
    expect(occurrences.some((item) => item.start.getDay() === 5)).toBe(false);
  });

  it('creates one occurrence per day for an inclusive date range', () => {
    const occurrences = buildCalendarEventOccurrences({
      start,
      end,
      repeatMode: 'date-range',
      rangeStart: new Date(2026, 2, 10),
      rangeEnd: new Date(2026, 2, 20),
      locale: 'fa',
    });

    expect(occurrences).toHaveLength(11);
    expect(occurrences[0].start.getDate()).toBe(10);
    expect(occurrences.at(-1)?.start.getDate()).toBe(20);
    expect(occurrences.every((item) => item.end.getTime() - item.start.getTime() === 2 * 60 * 60 * 1000)).toBe(true);
  });
});

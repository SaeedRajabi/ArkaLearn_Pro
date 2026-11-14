import apiClient from '@/lib/apiClient';
import { getApiErrorMessage, isCommandResponseSuccess } from '@/lib/api-command-result';
import { asLongId } from '@/lib/id';

export type CalendarEventCategory = 0 | 1 | 2 | 3 | 4;

export type CalendarEventParticipant = {
  userId: string;
  displayName: string;
  phoneNumber?: string | null;
};

export type CalendarEventItem = {
  id: number;
  title: string;
  category: CalendarEventCategory;
  startUtc: string;
  endUtc: string;
  isAllDay: boolean;
  eventUrl?: string | null;
  description?: string | null;
  ownerUserId: string;
  participants: CalendarEventParticipant[];
};

export type SaveCalendarEventPayload = {
  title: string;
  category: CalendarEventCategory;
  startUtc: string;
  endUtc: string;
  isAllDay: boolean;
  eventUrl?: string;
  description?: string;
  participantUserIds: string[];
  occurrences?: Array<{
    startUtc: string;
    endUtc: string;
  }>;
};

function unwrapList<T>(raw: unknown): T[] {
  const root = raw as Record<string, unknown> | null | undefined;
  const dataLayer = (root?.data ?? root?.Data ?? root) as Record<string, unknown> | undefined;
  const qr = dataLayer?.queryResult ?? dataLayer?.QueryResult ?? dataLayer;
  if (Array.isArray(qr)) return qr as T[];
  if (qr && typeof qr === 'object' && '$values' in (qr as object))
    return ((qr as { $values: T[] }).$values ?? []) as T[];
  return [];
}

function unwrapObject<T>(raw: unknown): T | null {
  const root = raw as Record<string, unknown> | null | undefined;
  const dataLayer = (root?.data ?? root?.Data ?? root) as Record<string, unknown> | undefined;
  const qr = dataLayer?.queryResult ?? dataLayer?.QueryResult ?? dataLayer;
  return (qr as T) ?? null;
}

function mapParticipant(raw: Record<string, unknown>): CalendarEventParticipant {
  const displayName = String(
    raw.displayName ??
      raw.DisplayName ??
      raw.name ??
      raw.Name ??
      raw.fullName ??
      raw.FullName ??
      ''
  ).trim();
  return {
    userId: asLongId(raw.userId ?? raw.UserId ?? 0),
    displayName,
    phoneNumber: (raw.phoneNumber ?? raw.PhoneNumber ?? null) as string | null,
  };
}

export async function resolveParticipantDisplayNames(
  participants: CalendarEventParticipant[]
): Promise<Record<string, string>> {
  const { getUser } = await import('@/services/user-service');
  const labels: Record<string, string> = {};

  await Promise.all(
    participants.map(async (participant) => {
      if (participant.displayName) {
        labels[participant.userId] = participant.displayName;
        return;
      }
      try {
        const user = await getUser(participant.userId);
        labels[participant.userId] =
          user?.name?.trim() || user?.email?.trim() || String(participant.userId);
      } catch {
        labels[participant.userId] = String(participant.userId);
      }
    })
  );

  return labels;
}

function mapEvent(raw: Record<string, unknown>): CalendarEventItem {
  const participantsRaw = raw.participants ?? raw.Participants;
  let participants: CalendarEventParticipant[] = [];
  if (Array.isArray(participantsRaw)) {
    participants = participantsRaw.map((p) => mapParticipant(p as Record<string, unknown>));
  } else if (participantsRaw && typeof participantsRaw === 'object' && '$values' in participantsRaw) {
    participants = ((participantsRaw as { $values: Record<string, unknown>[] }).$values ?? []).map(mapParticipant);
  }

  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    category: Number(raw.category ?? raw.Category ?? 0) as CalendarEventCategory,
    startUtc: String(raw.startUtc ?? raw.StartUtc ?? ''),
    endUtc: String(raw.endUtc ?? raw.EndUtc ?? ''),
    isAllDay: Boolean(raw.isAllDay ?? raw.IsAllDay ?? false),
    eventUrl: (raw.eventUrl ?? raw.EventUrl ?? null) as string | null,
    description: (raw.description ?? raw.Description ?? null) as string | null,
    ownerUserId: asLongId(raw.ownerUserId ?? raw.OwnerUserId ?? 0),
    participants,
  };
}

export async function fetchCalendarEventsByRange(params: {
  rangeStartUtc: Date;
  rangeEndUtc: Date;
  categories?: number[];
}): Promise<CalendarEventItem[]> {
  const res = await apiClient.get<unknown>('/CalendarEvent/By-Range', {
    params: {
      rangeStartUtc: params.rangeStartUtc.toISOString(),
      rangeEndUtc: params.rangeEndUtc.toISOString(),
      categories: params.categories?.length ? params.categories.join(',') : undefined,
      _ts: Date.now(),
    },
    headers: { 'Cache-Control': 'no-cache' },
  });
  return unwrapList<Record<string, unknown>>(res.data).map(mapEvent);
}

export async function fetchCalendarEventById(eventId: number): Promise<CalendarEventItem | null> {
  const res = await apiClient.get<unknown>('/CalendarEvent/By-Id', {
    params: { eventId },
  });
  const raw = unwrapObject<Record<string, unknown>>(res.data);
  return raw ? mapEvent(raw) : null;
}

export async function saveCalendarEvent(payload: SaveCalendarEventPayload): Promise<void> {
  const res = await apiClient.post<unknown>('/CalendarEvent/Save', payload);
  if (!isCommandResponseSuccess(res.data, res.status)) {
    throw new Error(getApiErrorMessage(res.data, 'Failed to save event'));
  }
}

export async function updateCalendarEvent(
  eventId: number,
  payload: SaveCalendarEventPayload
): Promise<void> {
  const res = await apiClient.post<unknown>('/CalendarEvent/Update', { eventId, ...payload });
  if (!isCommandResponseSuccess(res.data, res.status)) {
    throw new Error(getApiErrorMessage(res.data, 'Failed to update event'));
  }
}

export async function deleteCalendarEvent(eventId: number): Promise<void> {
  const res = await apiClient.post<unknown>('/CalendarEvent/Delete', null, {
    params: { eventId },
  });
  if (!isCommandResponseSuccess(res.data, res.status)) {
    throw new Error(getApiErrorMessage(res.data, 'Failed to delete event'));
  }
}

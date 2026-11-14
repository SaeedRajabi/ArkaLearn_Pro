import { apiRequest, buildQuery } from './client';
import type { PagedData, PagedResponseRaw, SearchSeminarQri, SeminarQri, FavoriteSeminarQri } from './types';
import { normalizePagedResponse } from './types';
import type { MySeminar } from '@/types';
import { unwrapApiList } from '@/lib/api/normalize-list';
import { normalizeRoomEntryUrl } from '@/lib/room-entry-url';

const BASE = 'Seminar';

function normalizeArray<T>(raw: T[] | { $values?: T[] } | null | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && '$values' in raw && Array.isArray((raw as { $values?: T[] }).$values))
    return (raw as { $values: T[] }).$values;
  return [];
}

export async function getSeminarById(id: number): Promise<SeminarQri | null> {
  try {
    const path = `${BASE}/GetById?SeminarId=${id}`;
    return await apiRequest<SeminarQri>(path);
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) {
      const status = (e as { status: number }).status;
      if (status === 204 || status === 404) return null;
    }
    throw e;
  }
}

export async function searchSeminars(params: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
  status?: number;
  onlyClientVisible?: boolean;
  from?: string;
  to?: string;
}): Promise<PagedData<SearchSeminarQri>> {
  const {
    inputValue = '',
    pageNumber = 1,
    pageSize = 12,
    needTotalCount = true,
    status,
    onlyClientVisible,
    from,
    to,
  } = params;
  const q: Record<string, string | number | boolean> = {
    inputValue,
    pageNumber,
    pageSize,
    needTotalCount,
  };
  if (status != null) q.status = status;
  if (onlyClientVisible) q.onlyClientVisible = true;
  if (from) q.from = from;
  if (to) q.to = to;
  const path = `${BASE}/Search${buildQuery(q)}`;
  const raw = await apiRequest<PagedResponseRaw<SearchSeminarQri>>(path);
  return normalizePagedResponse(raw);
}

export async function addSeminarToFavorites(seminarId: number): Promise<string> {
  const result = await apiRequest<{ result?: string }>(`${BASE}/AddToFavorites`, {
    method: 'POST',
    body: { seminarId },
  });
  return (result as { result?: string })?.result ?? 'OK';
}

export async function removeSeminarFromFavorites(seminarId: number): Promise<string> {
  const result = await apiRequest<{ result?: string }>(`${BASE}/RemoveFromFavorites`, {
    method: 'POST',
    body: { seminarId },
  });
  return (result as { result?: string })?.result ?? 'OK';
}

export async function getMyFavoriteSeminarIds(): Promise<number[]> {
  const raw = await apiRequest<number[] | { $values?: number[] }>(`${BASE}/GetMyFavoriteSeminarIds`);
  return normalizeArray(raw).map((x) => Number(x)).filter((x) => !Number.isNaN(x));
}

export async function getMyFavoriteSeminars(): Promise<FavoriteSeminarQri[]> {
  const raw = await apiRequest<FavoriteSeminarQri[] | { $values?: FavoriteSeminarQri[] }>(`${BASE}/GetMyFavoriteSeminars`);
  return normalizeArray(raw);
}

export async function registerSeminar(seminarId: number, hasPaid: boolean): Promise<string> {
  const result = await apiRequest<{ result?: string }>(`${BASE}/Register`, {
    method: 'POST',
    body: { seminarId, hasPaid },
  });
  return (result as { result?: string })?.result ?? 'OK';
}

export type EnterSeminarRoomResponse = {
  roomLink?: string | null;
  userData?: {
    token?: string;
    userId?: string;
    Role?: string;
    role?: string;
    userName?: string;
    displayName?: string;
    avatarUrl?: string | null;
    email?: string;
  };
};

export async function enterSeminarRoom(seminarId: number): Promise<EnterSeminarRoomResponse> {
  const response = await apiRequest<EnterSeminarRoomResponse>(`${BASE}/EnterRoom`, {
    method: 'POST',
    body: { seminarId },
  });
  if (response.roomLink) {
    response.roomLink = normalizeRoomEntryUrl(response.roomLink);
  }
  return response;
}

function mapMySeminarRow(row: Record<string, unknown>): MySeminar {
  return {
    seminarId: Number(row.seminarId ?? row.SeminarId ?? 0),
    seminarTitle: String(row.seminarTitle ?? row.SeminarTitle ?? ''),
    startTime: String(row.startTime ?? row.StartTime ?? ''),
    endTime: String(row.endTime ?? row.EndTime ?? ''),
    roomLink: (() => {
      const raw =
        row.roomLink != null
          ? String(row.roomLink)
          : row.RoomLink != null
            ? String(row.RoomLink)
            : undefined;
      return raw ? normalizeRoomEntryUrl(raw) : undefined;
    })(),
    roomUserName:
      row.roomUserName != null
        ? String(row.roomUserName)
        : row.RoomUserName != null
          ? String(row.RoomUserName)
          : undefined,
    registeredAt: String(row.registeredAt ?? row.RegisteredAt ?? ''),
    hasPaid: Boolean(row.hasPaid ?? row.HasPaid ?? false),
  };
}

/** Registered seminars for the current user (requires login). */
export async function getMyRegisteredSeminars(): Promise<MySeminar[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyRegisteredSeminars`);
  return unwrapApiList<Record<string, unknown>>(raw)
    .map(mapMySeminarRow)
    .filter((s) => s.seminarId > 0);
}

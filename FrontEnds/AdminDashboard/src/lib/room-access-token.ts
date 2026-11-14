/**
 * JWT from `/Account/UserLoginIntoRoom` — stored so `apiClient` can send `Authorization: Bearer`
 * for Room API calls (dashboard auth uses cookies; room seats do not).
 */
const ROOM_ACCESS_TOKEN_STORAGE_KEY = 'edcentral-room-access-token';

export function persistRoomAccessToken(token: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  if (token && token.trim().length > 0) {
    sessionStorage.setItem(ROOM_ACCESS_TOKEN_STORAGE_KEY, token.trim());
  } else {
    sessionStorage.removeItem(ROOM_ACCESS_TOKEN_STORAGE_KEY);
  }
}

export function clearRoomAccessToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ROOM_ACCESS_TOKEN_STORAGE_KEY);
}

export function getRoomAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const v = sessionStorage.getItem(ROOM_ACCESS_TOKEN_STORAGE_KEY);
  return v && v.trim().length > 0 ? v.trim() : null;
}

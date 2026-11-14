const DEFAULT_ROOM_DASHBOARD_ORIGIN =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ROOM_DASHBOARD_ORIGIN?.trim()) ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://admin-dashboard.arkasoftware.ir');

const RESERVED_SEGMENTS = new Set([
  'dashboard',
  'login',
  'room',
  'svc',
  'api',
  'mono-administrator',
  'manifest.json',
  'sw.js',
]);

function normalizeOrigin(value: string): string {
  let origin = value.trim().replace(/\/+$/, '');
  while (origin.toLowerCase().endsWith('/room')) {
    origin = origin.slice(0, -5);
  }
  return origin;
}

export function buildRoomEntryUrl(slug: string, origin = DEFAULT_ROOM_DASHBOARD_ORIGIN): string {
  const safeSlug = slug.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!safeSlug) return normalizeOrigin(origin);
  return `${normalizeOrigin(origin)}/room/${encodeURIComponent(safeSlug)}`;
}

/** Ensures shared class links always target /room/{slug} on the admin dashboard host. */
export function normalizeRoomEntryUrl(
  storedLink: string | null | undefined,
  slug?: string | null,
  origin = DEFAULT_ROOM_DASHBOARD_ORIGIN
): string {
  const dashboardOrigin = normalizeOrigin(origin);

  if (slug?.trim()) {
    return buildRoomEntryUrl(slug, dashboardOrigin);
  }

  const raw = (storedLink ?? '').trim();
  if (!raw) return dashboardOrigin;

  if (/\/room\//i.test(raw)) return raw;

  try {
    const url = new URL(raw, dashboardOrigin);
    const parts = url.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && !RESERVED_SEGMENTS.has(last.toLowerCase())) {
      return buildRoomEntryUrl(last, url.origin || dashboardOrigin);
    }
    if (url.pathname === '/' || url.pathname === '') {
      return dashboardOrigin;
    }
  } catch {
    /* fall through */
  }

  return raw;
}

export function appendRoomAutoLoginParams(
  roomLink: string,
  params: {
    token: string;
    userId: string;
    userName?: string;
    displayName?: string;
    avatarUrl?: string | null;
    email?: string;
  }
): string {
  const url = new URL(normalizeRoomEntryUrl(roomLink), DEFAULT_ROOM_DASHBOARD_ORIGIN);
  url.searchParams.set('roomToken', params.token);
  url.searchParams.set('roomUserId', params.userId);
  if (params.userName) url.searchParams.set('roomUserName', params.userName);
  if (params.displayName) url.searchParams.set('roomDisplayName', params.displayName);
  if (params.avatarUrl) url.searchParams.set('roomAvatar', params.avatarUrl);
  if (params.email) url.searchParams.set('roomEmail', params.email);
  return url.toString();
}

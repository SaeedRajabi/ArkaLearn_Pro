import { getStaticBaseUrl, resolveStaticAssetUrl } from '@/lib/api-config';

/** Admin dashboard bundle (public/assets/icons/defualtUserImages.png). */
export const DEFAULT_USER_AVATAR_LOCAL_PATH = '/assets/icons/defualtUserImages.png';

/** API wwwroot default (also used when Search returns no custom image). */
export const DEFAULT_USER_AVATAR_API_PATH = '/assets/icons/defaultUserImage.png';

function isLikelyProfileImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(data:|blob:|https?:\/\/)/i.test(trimmed)) return true;
  if (trimmed.includes('/')) return true;
  return false;
}

function resolveDefaultAvatarUrl(): string {
  const staticBase = getStaticBaseUrl();
  if (staticBase) {
    const apiDefault = resolveStaticAssetUrl(DEFAULT_USER_AVATAR_API_PATH);
    if (apiDefault.trim()) return apiDefault;
  }
  return DEFAULT_USER_AVATAR_LOCAL_PATH;
}

/** Profile image URL for display; uses API/static default when the user has no photo. */
export function resolveUserAvatarUrl(avatarUrl?: string | null): string {
  if (!avatarUrl?.trim()) return resolveDefaultAvatarUrl();

  let raw = avatarUrl.trim();
  if (/^api\.arkasoftware\.ir/i.test(raw)) {
    raw = `https://${raw.replace(/^\/+/, '')}`;
  }

  if (!isLikelyProfileImageUrl(raw)) return resolveDefaultAvatarUrl();

  const resolved = resolveStaticAssetUrl(raw);
  return resolved.trim() || resolveDefaultAvatarUrl();
}

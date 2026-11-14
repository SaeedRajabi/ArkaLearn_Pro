type AssetKind = 'article' | 'course' | 'seminar' | 'about' | 'user' | 'project' | 'book';

const PROD_STATIC_ASSET_BASE_FALLBACK = 'https://msg.arkasoftware.ir';

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeStaticHostBase(rawBase: string): string {
  const raw = rawBase.trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const staticPath = trimTrailingSlashes((url.pathname || '').replace(/\/api(?:\/service)?\/?$/i, ''));
    return `${url.protocol}//${url.host}${staticPath && staticPath !== '/' ? staticPath : ''}`;
  } catch {
    return trimTrailingSlashes(raw.replace(/\/api(?:\/service)?\/?$/i, ''));
  }
}

function getApiAssetBaseUrl(): string {
  const explicitStaticBase = process.env.NEXT_PUBLIC_STATIC_ASSET_BASE_URL?.trim();
  if (explicitStaticBase) return normalizeStaticHostBase(explicitStaticBase);

  // Production media is on the download host (static/FTP), not the API.
  if (process.env.NODE_ENV === 'production') {
    return PROD_STATIC_ASSET_BASE_FALLBACK;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiBase) return normalizeStaticHostBase(apiBase);

  return PROD_STATIC_ASSET_BASE_FALLBACK;
}

function isMsgAssetHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'msg.arkasoftware.ir' || host.startsWith('msg.');
}

function isApiOrAppHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === 'api.arkasoftware.ir' ||
    host.startsWith('api.') ||
    host === 'arkasoftware.ir' ||
    host === 'www.arkasoftware.ir' ||
    host.endsWith('.arkasoftware.ir')
  );
}

function hasImageFileExtension(value: string): boolean {
  return /\.(png|jpe?g|webp|gif|svg|avif)(?:$|[?#])/i.test(value);
}

function hasVideoFileExtension(value: string): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i.test(value);
}

function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return path;
  return `${trimTrailingSlashes(baseUrl)}${path.startsWith('/') ? '' : '/'}${path}`;
}

function normalizeApiAssetPath(path: string): string {
  let normalized = path.trim().replace(/\\/g, '/');
  if (!normalized) return '';
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;

  // Static media lives under wwwroot and should not include /api in the final URL.
  normalized = normalized.replace(/^\/api\/api\/(?=(?:images|videos|seminars|rooms|media|audio)\b)/i, '/api/');
  normalized = normalized.replace(/^\/api\/(?=(?:images|videos|seminars|rooms|media|audio)\b)/i, '/');

  return normalized;
}

/** When assets are served from msg host, legacy /images/... maps to /public/images/... */
function toMsgPublicPath(assetPath: string, staticBase: string): string {
  if (!assetPath.startsWith('/')) return assetPath;
  if (/^\/(?:public|private|drm)\//i.test(assetPath)) return assetPath;
  if (!staticBase) return assetPath;

  let host = '';
  try {
    host = new URL(staticBase).hostname.toLowerCase();
  } catch {
    return assetPath;
  }

  if (host !== 'msg.arkasoftware.ir' && !host.startsWith('msg.')) return assetPath;

  if (/^\/(?:images|videos|seminars|rooms|users|projects|files|media|audio)\//i.test(assetPath))
    return `/public${assetPath}`;

  return assetPath;
}

function isLocalNextAssetPath(path: string): boolean {
  return (
    /^\/(?:icons|placeholder-images|assets|fonts)\b/i.test(path) ||
    /^\/placeholder-[^/]+\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(path) ||
    /^\/images\/(?:background|placeholders?)\//i.test(path) ||
    /^\/images\/article-banner\.jpg$/i.test(path)
  );
}

/**
 * Strip known hosts to a path, then ensure msg `/public` prefix.
 * Absolute third-party URLs are left untouched.
 */
function normalizeBackendStaticPath(rawUrl?: string | null): string {
  if (!rawUrl) return '';

  let value = rawUrl.trim();
  if (!value) return '';

  if (/^(data:|blob:)/i.test(value)) return value;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      // msg / api / app hosts → use pathname so we can force /public on the download host.
      if (isMsgAssetHost(parsed.hostname) || isApiOrAppHost(parsed.hostname)) {
        value = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } else {
        return value;
      }
    } catch {
      return value;
    }
  }

  value = value.replace(/\\/g, '/');

  const webRootIndex = value.toLowerCase().indexOf('/wwwroot/');
  if (webRootIndex >= 0) {
    value = value.slice(webRootIndex + '/wwwroot'.length);
  } else {
    value = value.replace(/^\/?wwwroot(?=\/|$)/i, '');
  }

  if (!value.startsWith('/')) value = `/${value}`;

  return value;
}

function buildEntityApiPath(kind: AssetKind, normalizedPath: string): string {
  const canonicalPath = normalizeApiAssetPath(normalizedPath);

  // If only file name was stored, map to known static folders under wwwroot.
  const pathWithoutLeadingSlash = canonicalPath.replace(/^\/+/, '');
  const segmentCount = pathWithoutLeadingSlash.split('/').filter(Boolean).length;
  if (segmentCount === 1 && hasImageFileExtension(pathWithoutLeadingSlash)) {
    if (kind === 'article') return `/images/articles/${pathWithoutLeadingSlash}`;
    if (kind === 'course') return `/images/courses/${pathWithoutLeadingSlash}`;
    if (kind === 'project') return `/images/projects/${pathWithoutLeadingSlash}`;
    if (kind === 'about') return `/images/about-us/${pathWithoutLeadingSlash}`;
    if (kind === 'book') return `/images/books/${pathWithoutLeadingSlash}`;
    if (kind === 'user') return `/images/usersProfile/${pathWithoutLeadingSlash}`;
    return `/seminars/image/${pathWithoutLeadingSlash}`;
  }

  // Legacy controller image routes can be rewritten to static folder routes.
  const controllerRouteMatch = canonicalPath.match(/^\/api\/(?:api\/)?(article|course|seminar)s?\/(.+)$/i);
  if (controllerRouteMatch) {
    const controllerName = controllerRouteMatch[1].toLowerCase();
    const remainder = controllerRouteMatch[2];
    if (controllerName === 'article') return `/images/articles/${remainder}`;
    if (controllerName === 'course') return `/images/courses/${remainder}`;
    return `/seminars/image/${remainder}`;
  }

  if (/^\/images\/article\//i.test(canonicalPath)) return canonicalPath.replace(/^\/images\/article\//i, '/images/articles/');
  if (/^\/images\/course\//i.test(canonicalPath)) return canonicalPath.replace(/^\/images\/course\//i, '/images/courses/');
  if (/^\/images\/user-profile\//i.test(canonicalPath)) return canonicalPath.replace(/^\/images\/user-profile\//i, '/images/usersProfile/');
  if (/^\/images\/users-profile\//i.test(canonicalPath)) return canonicalPath.replace(/^\/images\/users-profile\//i, '/images/usersProfile/');

  // Static folder routes (including msg /public/...).
  if (/^\/(?:public|images|videos|seminars|rooms|users|projects|files|media|audio)\//i.test(canonicalPath)) return canonicalPath;

  // Client public assets should stay on the Next.js app host.
  if (isLocalNextAssetPath(canonicalPath)) return canonicalPath;

  return canonicalPath;
}

/**
 * Resolve any stored media path/URL to a browser-loadable absolute download-host URL
 * (or a local Next public path for site placeholders).
 */
function resolvePublicMediaUrl(
  rawUrl: string | null | undefined,
  options?: {
    kind?: AssetKind;
    fallback?: string;
    preferVideoFolder?: boolean;
  }
): string {
  const fallback = options?.fallback ?? '';
  const normalized = normalizeBackendStaticPath(rawUrl);
  if (!normalized) return fallback;
  if (/^(data:|blob:)/i.test(normalized)) return normalized;
  // External non-app absolute URL kept as-is by normalizeBackendStaticPath.
  if (/^https?:\/\//i.test(normalized)) return normalized;

  const apiAssetBase = getApiAssetBaseUrl();
  let assetPath = options?.kind
    ? buildEntityApiPath(options.kind, normalized)
    : normalizeApiAssetPath(normalized);

  if (isLocalNextAssetPath(assetPath)) return assetPath;

  if (options?.preferVideoFolder) {
    const isKnownVideoPath =
      /^\/(?:public\/)?(?:videos|projects\/video|seminars\/video|media)\//i.test(assetPath);
    if (!isKnownVideoPath && (hasVideoFileExtension(assetPath) || segmentLooksLikeBareFile(assetPath))) {
      const fileName = assetPath.replace(/^\/+/, '').replace(/^public\//i, '');
      if (fileName) assetPath = `/videos/${fileName}`;
    }
  }

  assetPath = toMsgPublicPath(assetPath, apiAssetBase);
  if (!apiAssetBase) return assetPath;
  return joinUrl(apiAssetBase, assetPath);
}

function segmentLooksLikeBareFile(path: string): boolean {
  const cleaned = path.replace(/^\/+/, '').replace(/^public\//i, '');
  if (!cleaned || cleaned.includes('/')) return false;
  // Never treat bare numeric media ids as video filenames (avoids /videos/8).
  if (/^\d+$/.test(cleaned)) return false;
  return true;
}

function toPublicApiImageUrl(rawUrl: string | null | undefined, kind: AssetKind, fallback: string): string {
  return resolvePublicMediaUrl(rawUrl, { kind, fallback });
}

export function getSeminarImageUrl(thumbnailUrl?: string | null): string {
  return toPublicApiImageUrl(thumbnailUrl, 'seminar', '/placeholder-seminar.png');
}

export function getArticleImageUrl(thumbnailUrl?: string | null): string {
  return toPublicApiImageUrl(thumbnailUrl, 'article', '/placeholder-article.png');
}

export function getCourseImageUrl(imageUrl?: string | null): string {
  return toPublicApiImageUrl(imageUrl, 'course', '/placeholder-course.png');
}

/** Course intro / preview video (wwwroot/videos or /public/videos). */
export function getCourseVideoUrl(videoUrl?: string | null): string {
  const raw = (videoUrl ?? '').trim();
  // Intro videos are public; DRM schemes are lesson-only and not playable on the web.
  if (!raw || raw.toLowerCase().startsWith('drm://')) return '';
  return resolvePublicMediaUrl(videoUrl, { preferVideoFolder: true });
}

/** Matches backend default when the user has no custom profile photo. */
export const DEFAULT_USER_PROFILE_IMAGE_PATH = '/assets/icons/defaultUserImage.png';

function isLikelyProfileImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(data:|blob:|https?:\/\/)/i.test(trimmed)) return true;
  if (trimmed.includes('/')) return true;
  if (hasImageFileExtension(trimmed)) return true;
  return false;
}

/** Profile photo for the signed-in user; ignores login initials masquerading as AvatarUrl. */
export function resolveUserProfileImageUrl(imageUrl?: string | null): string {
  if (!imageUrl?.trim() || !isLikelyProfileImageUrl(imageUrl)) {
    return getUserImageUrl(DEFAULT_USER_PROFILE_IMAGE_PATH);
  }
  return getUserImageUrl(imageUrl);
}

/** Default dashboard cover when the user has not uploaded a custom banner. */
export const DEFAULT_DASHBOARD_HEADER_IMAGE_PATH = '/icons/Dashboard_Header.jpg';

/** Default certificate/diploma image when the teacher has not uploaded one. */
export const DEFAULT_CERTIFICATE_IMAGE_PATH = '/icons/certificate-default-image.png';

export function getTeacherHeaderImageUrl(imageUrl?: string | null): string {
  return getDashboardHeaderImageUrl(imageUrl);
}

/** Dashboard banner/cover image (professor or student header). */
export function getDashboardHeaderImageUrl(imageUrl?: string | null): string {
  if (!imageUrl?.trim()) return DEFAULT_DASHBOARD_HEADER_IMAGE_PATH;
  return toPublicApiImageUrl(imageUrl, 'user', DEFAULT_DASHBOARD_HEADER_IMAGE_PATH);
}

export function getUserImageUrl(imageUrl?: string | null): string {
  return toPublicApiImageUrl(imageUrl, 'user', DEFAULT_USER_PROFILE_IMAGE_PATH);
}

/** Teacher education certificate / diploma image. */
export function getDegreeImageUrl(imageUrl?: string | null): string {
  if (!imageUrl?.trim()) return DEFAULT_CERTIFICATE_IMAGE_PATH;
  return toPublicApiImageUrl(imageUrl, 'user', DEFAULT_CERTIFICATE_IMAGE_PATH);
}

export function getAboutImageUrl(imageUrl?: string | null, fallback = '/placeholder-images/about-hero.png'): string {
  return toPublicApiImageUrl(imageUrl, 'about', fallback);
}

export function getProjectImageUrl(thumbnailUrl?: string | null): string {
  return toPublicApiImageUrl(thumbnailUrl, 'project', '/placeholder-article.png');
}

export function getProjectVideoUrl(videoUrl?: string | null): string {
  const resolved = resolvePublicMediaUrl(videoUrl);
  if (!resolved) return '';
  if (/^(data:|blob:|https?:\/\/)/i.test(resolved) && !resolved.includes('arkasoftware.ir')) {
    return resolved;
  }

  // Prefer /projects/video for project paths that are not already under videos/.
  if (/^https?:\/\//i.test(resolved)) {
    try {
      const parsed = new URL(resolved);
      let path = parsed.pathname;
      if (
        !/^\/(?:public\/)?projects\/video\//i.test(path) &&
        !/^\/(?:public\/)?videos\//i.test(path)
      ) {
        const fileName = path.replace(/^\/+/, '').replace(/^public\//i, '');
        if (fileName && !fileName.includes('/')) {
          const apiAssetBase = getApiAssetBaseUrl();
          path = toMsgPublicPath(`/projects/video/${fileName}`, apiAssetBase);
          return joinUrl(apiAssetBase, path);
        }
      }
    } catch {
      /* keep resolved */
    }
  }

  return resolved;
}

/** Teacher book covers stored under wwwroot/images/books/… */
export function getBookCoverImageUrl(imageUrl?: string | null): string {
  return toPublicApiImageUrl(imageUrl, 'book', '/placeholder-article.png');
}

/** Platform / teacher software cover images */
export function getSoftwareCoverImageUrl(imageUrl?: string | null): string {
  return toPublicApiImageUrl(imageUrl, 'book', '/placeholder-article.png');
}

export function getSoftwareFileUrl(fileUrl?: string | null): string {
  const resolved = resolvePublicMediaUrl(fileUrl);
  if (!resolved) return '';
  if (/^(data:|blob:)/i.test(resolved)) return resolved;

  try {
    const isAbsolute = /^https?:\/\//i.test(resolved);
    const pathname = isAbsolute ? new URL(resolved).pathname : resolved;
    if (!/^\/(?:public\/)?(?:files\/software|media|files\/books)\//i.test(pathname)) {
      const fileName = pathname.replace(/^\/+/, '').replace(/^public\//i, '');
      if (fileName && !fileName.includes('/')) {
        const apiAssetBase = getApiAssetBaseUrl();
        return joinUrl(apiAssetBase, toMsgPublicPath(`/files/software/${fileName}`, apiAssetBase));
      }
    }
  } catch {
    /* keep */
  }
  return resolved;
}

export function getBookFileUrl(fileUrl?: string | null): string {
  const resolved = resolvePublicMediaUrl(fileUrl);
  if (!resolved) return '';
  if (/^(data:|blob:)/i.test(resolved)) return resolved;

  try {
    const isAbsolute = /^https?:\/\//i.test(resolved);
    const pathname = isAbsolute ? new URL(resolved).pathname : resolved;
    if (!/^\/(?:public\/)?files\/books\//i.test(pathname)) {
      const fileName = pathname.replace(/^\/+/, '').replace(/^public\//i, '');
      if (fileName && !fileName.includes('/')) {
        const apiAssetBase = getApiAssetBaseUrl();
        return joinUrl(apiAssetBase, toMsgPublicPath(`/files/books/${fileName}`, apiAssetBase));
      }
    }
  } catch {
    /* keep */
  }
  return resolved;
}

/** Downloadable teacher resume PDFs stored under wwwroot/files/resumes/… */
export function getResumeFileUrl(fileUrl?: string | null): string {
  const resolved = resolvePublicMediaUrl(fileUrl);
  if (!resolved) return '';
  if (/^(data:|blob:)/i.test(resolved)) return resolved;

  try {
    const isAbsolute = /^https?:\/\//i.test(resolved);
    const pathname = isAbsolute ? new URL(resolved).pathname : resolved;
    if (!/^\/(?:public\/)?files\/resumes\//i.test(pathname)) {
      const fileName = pathname.replace(/^\/+/, '').replace(/^public\//i, '');
      if (fileName && !fileName.includes('/')) {
        const apiAssetBase = getApiAssetBaseUrl();
        return joinUrl(apiAssetBase, toMsgPublicPath(`/files/resumes/${fileName}`, apiAssetBase));
      }
    }
  } catch {
    /* keep */
  }
  return resolved;
}

export function isPdfBookFile(fileUrl?: string | null, fileName?: string | null): boolean {
  const probe = `${fileUrl ?? ''} ${fileName ?? ''}`.toLowerCase();
  return probe.includes('.pdf');
}

/** Teacher promotional videos stored under wwwroot/videos/teachers/… */
export function getTeacherPromotionalVideoUrl(videoUrl?: string | null): string {
  return resolvePublicMediaUrl(videoUrl, { preferVideoFolder: true });
}

/** Re-export for components that need raw static base. */
export function getStaticAssetBaseUrl(): string {
  return getApiAssetBaseUrl();
}

import createDOMPurify from 'dompurify';

import { getStaticAssetBaseUrl } from '@/lib/utils/image-url';

/**
 * Resolves stored media paths (e.g. /public/images/community-qa/x.png) against the
 * static asset host. Uploaded public files live on the download host (msg), NOT on
 * the API origin — resolving them against the API produced 404s for images/audio.
 */
export function resolveQaMediaUrl(url: string): string {
  if (!url || url.startsWith('http')) return url;
  return `${getStaticAssetBaseUrl()}${url.startsWith('/') ? url : `/${url}`}`;
}

const AUDIO_ATTRS =
  'controls preload="metadata" class="qa-audio my-2 w-full max-w-md"';

/** Fix TipTap-stored audio tags that were escaped as plain text. */
export function unwrapEscapedAudioTags(html: string, resolveUrl: (url: string) => string): string {
  if (!html) return '';

  let result = html;

  result = result.replace(
    /&lt;audio\s+([^&]*?)&gt;&lt;\/audio&gt;/gi,
    (_, attrs: string) => {
      const srcMatch = attrs.match(/src="([^"]+)"/i);
      const src = srcMatch ? resolveUrl(srcMatch[1]) : '';
      return `<audio ${AUDIO_ATTRS} src="${src}"></audio>`;
    }
  );

  result = result.replace(
    /<p>\s*<audio\s+([^>]*?)><\/audio>\s*<\/p>/gi,
    (_, attrs: string) => {
      const srcMatch = attrs.match(/src="([^"]+)"/i);
      const src = srcMatch ? resolveUrl(srcMatch[1]) : '';
      return `<audio ${AUDIO_ATTRS} src="${src}"></audio>`;
    }
  );

  return result;
}

export function normalizeQaMediaInHtml(html: string, resolveUrl: (url: string) => string): string {
  let result = unwrapEscapedAudioTags(html, resolveUrl);

  result = result.replace(/<audio([^>]*?)src="([^"]+)"([^>]*)>/gi, (_m, before, src, after) => {
    const resolved = src.startsWith('http') ? src : resolveUrl(src);
    const merged = `${before} ${after}`;
    const hasControls = /controls/i.test(merged);
    const cls = /class="/i.test(merged) ? '' : ' class="qa-audio my-2 w-full max-w-md"';
    const controls = hasControls ? '' : ' controls';
    const preload = /preload=/i.test(merged) ? '' : ' preload="metadata"';
    return `<audio${controls}${preload}${cls}${before} src="${resolved}"${after}>`;
  });

  result = result.replace(/<img\b([^>]*)>/gi, (match, attrs: string) => {
    const srcMatch = attrs.match(/\bsrc="([^"]+)"/i);
    if (!srcMatch) return match;
    const resolved = srcMatch[1].startsWith('http') ? srcMatch[1] : resolveUrl(srcMatch[1]);
    let next = attrs.replace(/\bsrc="[^"]+"/i, `src="${resolved}"`);
    if (/\bclass="/i.test(next)) {
      next = next.replace(/\bclass="([^"]*)"/i, (_, cls) =>
        cls.includes('qa-content-image') ? `class="${cls}"` : `class="${cls} qa-content-image"`
      );
    } else {
      next = `${next.trimEnd()} class="qa-content-image"`;
    }
    if (!/\bdata-qa-full-src="/i.test(next)) {
      next = `${next} data-qa-full-src="${resolved}"`;
    }
    return `<img${next}>`;
  });

  result = result.replace(/<video\b([^>]*)>/gi, (match, attrs: string) => {
    const srcMatch = attrs.match(/\bsrc="([^"]+)"/i);
    if (!srcMatch) return match;
    const resolved = srcMatch[1].startsWith('http') ? srcMatch[1] : resolveUrl(srcMatch[1]);
    let next = attrs.replace(/\bsrc="[^"]+"/i, `src="${resolved}"`);
    if (!/\bclass="/i.test(next)) {
      next = `${next.trimEnd()} class="qa-content-video max-w-full rounded-md"`;
    }
    if (!/\bcontrols/i.test(next)) {
      next = `${next.trimEnd()} controls`;
    }
    return `<video${next}>`;
  });

  return result;
}

export function sanitizeQaHtml(html: string, resolveUrl: (url: string) => string): string {
  if (typeof window === 'undefined') return html;
  const normalized = normalizeQaMediaInHtml(html, resolveUrl);
  const DOMPurify = createDOMPurify(window);
  return DOMPurify.sanitize(normalized, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['audio', 'video'],
    ADD_ATTR: [
      'style',
      'class',
      'controls',
      'src',
      'preload',
      'dir',
      'data-qa-audio-src',
      'data-qa-full-src',
      'playsinline',
    ],
  });
}

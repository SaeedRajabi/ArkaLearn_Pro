'use client';

import * as React from 'react';
import { Film, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveStaticAssetUrl, toSameOriginAssetSrc } from '@/lib/apiClient';

type Props = {
  contentType: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  title?: string;
  className?: string;
};

function resolveMediaUrl(url?: string): string {
  if (!url?.trim()) return '';
  if (/^(blob:|data:|https?:\/\/)/i.test(url)) return url;
  return toSameOriginAssetSrc(url) ?? resolveStaticAssetUrl(url) ?? url;
}

export function TeacherContentPreview({
  contentType,
  previewUrl,
  thumbnailUrl,
  coverImageUrl,
  title,
  className,
}: Props) {
  const [playing, setPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const type = contentType.toLowerCase();

  const videoSrc = resolveMediaUrl(previewUrl);
  const poster = resolveMediaUrl(thumbnailUrl);
  const coverSrc = resolveMediaUrl(coverImageUrl);

  React.useEffect(() => {
    setPlaying(false);
  }, [contentType, previewUrl, thumbnailUrl, coverImageUrl]);

  const startPlayback = React.useCallback(() => {
    if (!videoSrc) return;
    setPlaying(true);
    requestAnimationFrame(() => {
      const el = videoRef.current;
      if (el) void el.play().catch(() => undefined);
    });
  }, [videoSrc]);

  if (type === 'video' && videoSrc) {
    return (
      <div className={cn('relative aspect-video w-full overflow-hidden rounded-xl bg-black', className)}>
        {playing ? (
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            playsInline
            className="h-full w-full object-contain"
            preload="metadata"
          />
        ) : (
          <button
            type="button"
            onClick={startPlayback}
            className="group relative block h-full w-full cursor-pointer text-start"
            aria-label={title ? `Play ${title}` : 'Play video'}
          >
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt={title ?? ''}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                <Film className="h-10 w-10 opacity-60" />
              </div>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <Play className="h-6 w-6 translate-x-0.5" />
              </span>
            </span>
          </button>
        )}
      </div>
    );
  }

  if (type === 'book' && coverSrc) {
    return (
      <div className={cn('overflow-hidden rounded-xl border bg-muted', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverSrc} alt={title ?? ''} className="mx-auto max-h-72 w-full object-contain" />
      </div>
    );
  }

  return null;
}

export function extractPreviewFromReviewChanges(
  changes: { fieldKey: string; currentText?: string | null }[] | undefined
): { previewUrl?: string; thumbnailUrl?: string; coverImageUrl?: string } {
  if (!changes?.length) return {};
  const read = (key: string) => changes.find((c) => c.fieldKey === key)?.currentText?.trim() || undefined;
  return {
    previewUrl: read('videoUrl'),
    thumbnailUrl: read('thumbnailUrl'),
    coverImageUrl: read('coverImageUrl'),
  };
}

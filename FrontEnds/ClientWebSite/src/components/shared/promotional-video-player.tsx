'use client';

import * as React from 'react';
import { Film, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTeacherPromotionalVideoUrl, getCourseImageUrl } from '@/lib/utils/image-url';
import { BrandedVideoPlayer } from '@/components/shared/branded-video-player';

type Props = {
  videoUrl: string;
  thumbnailUrl?: string | null;
  title?: string;
  className?: string;
  onPlay?: () => void;
};

export function PromotionalVideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  className,
  onPlay,
}: Props) {
  const [playing, setPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const src = React.useMemo(() => {
    if (!videoUrl) return '';
    if (/^(blob:|data:)/i.test(videoUrl)) return videoUrl;
    return getTeacherPromotionalVideoUrl(videoUrl) || videoUrl;
  }, [videoUrl]);

  const poster = React.useMemo(() => {
    if (!thumbnailUrl) return undefined;
    if (/^(blob:|data:)/i.test(thumbnailUrl)) return thumbnailUrl;
    return getCourseImageUrl(thumbnailUrl) || thumbnailUrl;
  }, [thumbnailUrl]);

  const startPlayback = React.useCallback(() => {
    if (!src) return;
    setPlaying(true);
    onPlay?.();
    requestAnimationFrame(() => {
      const el = videoRef.current;
      if (el) void el.play().catch(() => undefined);
    });
  }, [src, onPlay]);

  if (!src) {
    return (
      <div
        className={cn(
          'flex aspect-video w-full items-center justify-center rounded-xl bg-muted text-muted-foreground',
          className
        )}
      >
        <Film className="h-10 w-10 opacity-50" />
      </div>
    );
  }

  return (
    <BrandedVideoPlayer className={cn('aspect-video w-full rounded-xl bg-black', className)}>
      {playing ? (
        <video
          ref={videoRef}
          src={src}
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
            <img src={poster} alt={title ?? ''} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black">
              <Film className="h-12 w-12 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-lg ring-4 ring-white/20 transition-transform group-hover:scale-110 sm:h-16 sm:w-16">
              <Play className="ms-0.5 h-7 w-7 fill-current sm:h-8 sm:w-8" />
            </span>
          </div>
        </button>
      )}
    </BrandedVideoPlayer>
  );
}

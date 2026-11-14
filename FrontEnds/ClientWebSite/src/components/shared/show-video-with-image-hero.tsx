'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { PlayCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCourseVideoUrl } from '@/lib/utils/image-url';

type Props = {
  imageUrl: string;
  title: string;
  videoUrl: string;
};

export function ShowVideoWithImage({ imageUrl, title, videoUrl }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const resolvedVideoUrl = useMemo(() => {
    if (!videoUrl?.trim()) return '';
    if (/\/api\/Service\/Seminar\/Stream/i.test(videoUrl)) return videoUrl;
    if (/^(blob:|data:)/i.test(videoUrl)) return videoUrl;
    return getCourseVideoUrl(videoUrl) || videoUrl;
  }, [videoUrl]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl">
      {!isPlaying ? (
        <>
          <Image src={imageUrl} alt={title} fill className="object-cover" />

          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent"
            aria-label="Play video"
            disabled={!resolvedVideoUrl}
          >
            <span className="rounded-full bg-white/30 p-2 backdrop-blur-sm">
              <PlayCircle className="h-16 w-16 text-white/90 transition-transform hover:scale-110" />
            </span>
          </button>

          <Button size="icon" variant="secondary" className="absolute right-4 top-4 rounded-full" type="button">
            <Share2 className="h-5 w-5" />
          </Button>
        </>
      ) : (
        <>
          <video
            className="h-full w-full object-cover"
            src={resolvedVideoUrl}
            controls
            autoPlay
            playsInline
            preload="metadata"
          />
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-4 top-4 rounded-full"
            type="button"
            onClick={() => setIsPlaying(false)}
          >
            ✕
          </Button>
        </>
      )}
    </div>
  );
}

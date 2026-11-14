'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { registerTeacherStoryView, type TeacherStoryItem } from '@/lib/api/support-chat';
import { cn } from '@/lib/utils';

type TeacherStoryViewerProps = {
  stories: TeacherStoryItem[];
  open: boolean;
  onClose: () => void;
  onStoryViewed?: (storyId: number) => void;
};

export function TeacherStoryViewer({ stories, open, onClose, onStoryViewed }: TeacherStoryViewerProps) {
  const [index, setIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const viewedRef = React.useRef<Set<number>>(new Set());

  const story = stories[index] ?? null;
  const durationMs = Math.max(1, (story?.durationSeconds || 5) * 1000);

  React.useEffect(() => {
    if (!open) return;
    setIndex(0);
    setProgress(0);
    setPaused(false);
    viewedRef.current = new Set();
  }, [open, stories]);

  React.useEffect(() => {
    if (!open || !story) return;
    if (viewedRef.current.has(story.id)) return;
    viewedRef.current.add(story.id);
    void registerTeacherStoryView(story.id)
      .then(() => onStoryViewed?.(story.id))
      .catch(() => undefined);
  }, [open, story, onStoryViewed]);

  React.useEffect(() => {
    if (!open || !story || paused) return;

    if (story.mediaKind === 2 && videoRef.current) {
      const video = videoRef.current;
      const onTime = () => {
        const total = video.duration > 0 ? video.duration : story.durationSeconds;
        setProgress(Math.min(100, (video.currentTime / total) * 100));
      };
      const onEnded = () => goNext();
      video.addEventListener('timeupdate', onTime);
      video.addEventListener('ended', onEnded);
      void video.play().catch(() => undefined);
      return () => {
        video.removeEventListener('timeupdate', onTime);
        video.removeEventListener('ended', onEnded);
      };
    }

    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - started) / durationMs) * 100);
      setProgress(pct);
      if (pct >= 100) {
        goNext();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, story?.id, paused, durationMs]);

  React.useEffect(() => {
    if (!videoRef.current) return;
    if (paused) videoRef.current.pause();
    else void videoRef.current.play().catch(() => undefined);
  }, [paused]);

  const goNext = React.useCallback(() => {
    setProgress(0);
    setIndex((i) => {
      if (i >= stories.length - 1) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [onClose, stories.length]);

  const goPrev = React.useCallback(() => {
    setProgress(0);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  if (!open || !story) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 text-white">
      <button
        type="button"
        className="absolute end-4 top-4 z-20 rounded-full bg-white/10 p-2"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 top-0 z-10 flex gap-1 px-3 pt-3">
        {stories.map((s, i) => (
          <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full bg-white transition-[width] duration-75"
              style={{
                width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      <div
        className="relative flex h-full w-full max-w-lg flex-col"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        <div className="absolute inset-y-0 start-0 z-10 w-1/3" onClick={goPrev} />
        <div className="absolute inset-y-0 end-0 z-10 w-1/3" onClick={goNext} />

        <div className="flex flex-1 items-center justify-center px-4">
          {story.mediaKind === 2 && story.mediaUrl ? (
            <video
              ref={videoRef}
              key={story.id}
              src={story.mediaUrl}
              className="max-h-[75vh] w-full rounded-xl object-contain"
              playsInline
              muted={false}
            />
          ) : story.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={story.mediaUrl}
              alt={story.caption || story.teacherName}
              className="max-h-[75vh] w-full rounded-xl object-contain"
            />
          ) : (
            <div className="flex min-h-[50vh] w-full items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 px-6 text-center text-xl font-medium">
              {story.caption || story.teacherName}
            </div>
          )}
        </div>

        <div className="space-y-1 px-5 pb-8 pt-3">
          <p className="text-sm font-semibold">{story.teacherName}</p>
          {story.caption ? <p className="text-sm text-white/85">{story.caption}</p> : null}
          <p className={cn('text-[11px] text-white/50', paused && 'opacity-100')}>
            {paused ? 'متوقف شد' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

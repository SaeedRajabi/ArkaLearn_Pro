'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  X,
  ZoomIn,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ImageLightboxItem = {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
};

type ImageLightboxLabels = {
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  previous: string;
  next: string;
  close: string;
};

const DEFAULT_LABELS: ImageLightboxLabels = {
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  resetZoom: 'Reset zoom',
  previous: 'Previous image',
  next: 'Next image',
  close: 'Close',
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

type ImageLightboxProps = {
  items: ImageLightboxItem[];
  open: boolean;
  initialIndex?: number;
  onOpenChange: (open: boolean) => void;
  labels?: Partial<ImageLightboxLabels>;
  isRtl?: boolean;
};

export function ImageLightbox({
  items,
  open,
  initialIndex = 0,
  onOpenChange,
  labels: labelOverrides,
  isRtl = false,
}: ImageLightboxProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [index, setIndex] = React.useState(initialIndex);
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const current = items[index];
  const hasMultiple = items.length > 1;

  const resetView = React.useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  React.useEffect(() => {
    if (open) {
      setIndex(Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0)));
      resetView();
    }
  }, [open, initialIndex, items.length, resetView]);

  React.useEffect(() => {
    resetView();
  }, [index, resetView]);

  const goPrevious = React.useCallback(() => {
    setIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
  }, [items.length]);

  const goNext = React.useCallback(() => {
    setIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1));
  }, [items.length]);

  const adjustZoom = React.useCallback((delta: number) => {
    setScale((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onOpenChange(false);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (isRtl) goNext();
          else goPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (isRtl) goPrevious();
          else goNext();
          break;
        case '+':
        case '=':
          event.preventDefault();
          adjustZoom(ZOOM_STEP);
          break;
        case '-':
          event.preventDefault();
          adjustZoom(-ZOOM_STEP);
          break;
        case '0':
          event.preventDefault();
          resetView();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, goPrevious, goNext, adjustZoom, resetView, isRtl]);

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    adjustZoom(event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      posX: position.x,
      posY: position.y,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!isDragging || scale <= 1) return;
    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      resetView();
      return;
    }
    setScale(2);
  };

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="fixed inset-0 z-[200] flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 border-0 bg-black/95 p-0 shadow-none sm:rounded-none"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogTitle className="sr-only">
          {current.title || current.alt || labels.close}
        </DialogTitle>

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2 sm:px-4">
          <div className="min-w-0 flex-1 pe-2">
            {current.title && (
              <p className="truncate text-sm font-semibold text-white">{current.title}</p>
            )}
            {hasMultiple && (
              <p className="text-xs text-white/60">
                {index + 1} / {items.length}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/10 hover:text-white"
              onClick={() => adjustZoom(-ZOOM_STEP)}
              disabled={scale <= MIN_ZOOM}
              aria-label={labels.zoomOut}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-xs tabular-nums text-white/80">
              {Math.round(scale * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/10 hover:text-white"
              onClick={() => adjustZoom(ZOOM_STEP)}
              disabled={scale >= MAX_ZOOM}
              aria-label={labels.zoomIn}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/10 hover:text-white"
              onClick={resetView}
              disabled={scale === 1 && position.x === 0 && position.y === 0}
              aria-label={labels.resetZoom}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/10 hover:text-white"
              onClick={() => onOpenChange(false)}
              aria-label={labels.close}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {hasMultiple && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'absolute z-10 h-11 w-11 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white',
                isRtl ? 'end-2 sm:end-4' : 'start-2 sm:start-4'
              )}
              onClick={isRtl ? goNext : goPrevious}
              aria-label={labels.previous}
            >
              {isRtl ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
            </Button>
          )}

          <div
            ref={viewportRef}
            className={cn(
              'flex h-full w-full touch-none items-center justify-center overflow-hidden px-12 py-4 sm:px-16',
              scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
            )}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={handleDoubleClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              alt={current.alt || current.title || ''}
              draggable={false}
              className="max-h-full max-w-full select-none object-contain transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              }}
            />
          </div>

          {hasMultiple && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'absolute z-10 h-11 w-11 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white',
                isRtl ? 'start-2 sm:start-4' : 'end-2 sm:end-4'
              )}
              onClick={isRtl ? goPrevious : goNext}
              aria-label={labels.next}
            >
              {isRtl ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
            </Button>
          )}
        </div>

        {current.description && (
          <div className="shrink-0 border-t border-white/10 px-4 py-3 text-center text-sm leading-relaxed text-white/80">
            {current.description}
          </div>
        )}

        {hasMultiple && (
          <div className="shrink-0 border-t border-white/10 px-3 py-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {items.map((item, itemIndex) => (
                <button
                  key={`${item.src}-${itemIndex}`}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  className={cn(
                    'relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-opacity',
                    itemIndex === index
                      ? 'border-primary opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                  aria-label={item.title || item.alt || `Image ${itemIndex + 1}`}
                  aria-current={itemIndex === index}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type GalleryImageTriggerProps = {
  src: string;
  alt: string;
  onOpen: () => void;
  className?: string;
  children: React.ReactNode;
};

export function GalleryImageTrigger({ alt, onOpen, className, children }: GalleryImageTriggerProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group relative block w-full cursor-zoom-in overflow-hidden text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
      aria-label={alt}
    >
      {children}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
        <ZoomIn className="h-8 w-8 scale-90 text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100" />
      </span>
    </button>
  );
}

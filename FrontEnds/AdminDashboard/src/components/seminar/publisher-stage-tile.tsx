'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Maximize, Pin, PinOff, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WebcamOverlayStylePayload } from '@/lib/seminar-webcam-overlay';
import { isUsableVideoTrack } from '@/lib/seminar-media-tracks';
import { defaultPipPixelRect, getDisplayPipRect } from '@/lib/seminar-room-layout';
import { useLanguage } from '@/components/language-provider';

export type PublisherStageTileProps = {
  connectionId: string;
  userName: string;
  label?: string;
  screenStream: MediaStream | null;
  screenTracks?: MediaStreamTrack[] | null;
  cameraStream: MediaStream | null;
  cameraTracks?: MediaStreamTrack[] | null;
  showCamera: boolean;
  overlayStyle: WebcamOverlayStylePayload;
  imageFilter?: { brightness: number; contrast: number; touchUp?: boolean };
  /** Normalized or pixel pip rect relative to this tile. */
  pipPos?: { x: number; y: number };
  pipSize?: { width: number; height: number };
  className?: string;
  isSpeaking?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
};

function assignTracks(
  el: HTMLVideoElement | null,
  tracks: MediaStreamTrack[] | MediaStream | null | undefined
) {
  if (!el) return;
  const live =
    !tracks
      ? []
      : tracks instanceof MediaStream
        ? tracks.getTracks().filter(isUsableVideoTrack)
        : tracks.filter(isUsableVideoTrack);
  if (!live.length) {
    if (el.srcObject) {
      el.srcObject = null;
      el.load();
    }
    return;
  }
  const next = new MediaStream(live);
  const cur = el.srcObject;
  const same =
    cur instanceof MediaStream &&
    cur.getTracks().length === next.getTracks().length &&
    cur.getTracks().every((t, i) => t.id === next.getTracks()[i]?.id);
  if (!same) {
    el.srcObject = next;
  }
  el.muted = true;
  el.playsInline = true;
  void el.play().catch(() => undefined);
}

export function PublisherStageTile({
  connectionId,
  userName,
  label,
  screenStream,
  screenTracks,
  cameraStream,
  cameraTracks,
  showCamera,
  overlayStyle,
  imageFilter,
  pipPos,
  pipSize,
  className,
  isSpeaking = false,
  isPinned = false,
  onTogglePin,
}: PublisherStageTileProps) {
  const { t } = useLanguage();
  const screenRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [tileSize, setTileSize] = useState({ width: 0, height: 0 });
  const [viewerPipPos, setViewerPipPos] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const node = tileRef.current;
    if (!node) return;
    const update = () => setTileSize({ width: node.clientWidth, height: node.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    assignTracks(screenRef.current, screenTracks ?? screenStream);
  }, [screenStream, screenTracks]);

  useEffect(() => {
    if (!showCamera) {
      assignTracks(cameraRef.current, null);
      return;
    }
    assignTracks(cameraRef.current, cameraTracks ?? cameraStream);
  }, [showCamera, cameraStream, cameraTracks]);

  const tileW = tileSize.width;
  const tileH = tileSize.height;
  const defaultPip = defaultPipPixelRect(Math.max(tileW, 160), Math.max(tileH, 90));
  const rawPip = {
    x: viewerPipPos?.x ?? pipPos?.x ?? defaultPip.x,
    y: viewerPipPos?.y ?? pipPos?.y ?? defaultPip.y,
    width: pipSize?.width ?? defaultPip.width,
    height: pipSize?.height ?? defaultPip.height,
  };
  const pip =
    tileW > 0 && tileH > 0
      ? getDisplayPipRect(rawPip, tileW, tileH, false)
      : rawPip;

  const brightness = imageFilter?.brightness ?? 100;
  const contrast = imageFilter?.contrast ?? 100;
  const touchUp = imageFilter?.touchUp ?? false;

  const takeSnapshot = () => {
    const video = screenRef.current;
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const camera = cameraRef.current;
    if (context && showCamera && camera && camera.videoWidth > 0 && tileW > 0 && tileH > 0) {
      context.drawImage(
        camera,
        (pip.x / tileW) * canvas.width,
        (pip.y / tileH) * canvas.height,
        (pip.width / tileW) * canvas.width,
        (pip.height / tileH) * canvas.height
      );
    }
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${userName || 'screen'}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.click();
  };

  return (
    <div
      ref={tileRef}
      className={cn(
        'group relative h-full min-h-0 w-full min-w-0 overflow-hidden border-2 bg-black transition-all duration-300',
        isSpeaking ? 'border-emerald-400 ring-4 ring-emerald-400/40' : 'border-transparent',
        className
      )}
      data-publisher-tile={connectionId}
    >
      <video
        ref={screenRef}
        className="h-full w-full object-contain transition-transform duration-200"
        style={{ transform: `scale(${zoom})` }}
        autoPlay
        playsInline
        muted
      />
      <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[min(100%,16rem)] rounded-md border border-white/15 bg-black/55 px-2 py-1 text-[10px] text-white shadow-md backdrop-blur-sm md:text-xs">
        <span className="font-medium">{userName}</span>
        {label ? <span className="text-white/80"> — {label}</span> : null}
      </div>
      <div className="absolute right-2 top-2 z-30 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {onTogglePin && (
          <button type="button" className="grid h-8 w-8 place-items-center rounded-lg bg-black/65 text-white hover:bg-black/90" onClick={onTogglePin} title={isPinned ? t('seminar_unpin_tile') : t('seminar_pin_tile')}>
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </button>
        )}
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg bg-black/65 text-white hover:bg-black/90" onClick={() => setZoom((value) => Math.min(3, value + 0.25))} title={t('seminar_zoom_in')}>
          <ZoomIn className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg bg-black/65 text-white hover:bg-black/90" onClick={() => setZoom((value) => Math.max(1, value - 0.25))} title={t('seminar_zoom_out')}>
          <ZoomOut className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg bg-black/65 text-white hover:bg-black/90" onClick={takeSnapshot} title={t('seminar_take_snapshot')}>
          <Download className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-lg bg-black/65 text-white hover:bg-black/90"
          onClick={() => void (document.fullscreenElement === tileRef.current
            ? document.exitFullscreen()
            : tileRef.current?.requestFullscreen())}
          title={t('seminar_enter_fullscreen')}
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>
      {showCamera && (
        <div
          className="absolute z-20 touch-none cursor-move overflow-hidden bg-black"
          style={{
            left: pip.x,
            top: pip.y,
            width: pip.width,
            height: pip.height,
            borderRadius:
              overlayStyle.shape === 'circle' ? '9999px' : `${overlayStyle.cornerRadius}px`,
            border: `${overlayStyle.borderWidth}px solid ${overlayStyle.borderColor}`,
            boxShadow: overlayStyle.shadow
              ? `0 10px 20px -5px ${overlayStyle.shadowColor}`
              : 'none',
          }}
          onPointerDown={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            const bounds = tileRef.current?.getBoundingClientRect();
            if (!bounds) return;
            setViewerPipPos({
              x: Math.max(0, Math.min(bounds.width - pip.width, event.clientX - bounds.left - dragOffsetRef.current.x)),
              y: Math.max(0, Math.min(bounds.height - pip.height, event.clientY - bounds.top - dragOffsetRef.current.y)),
            });
          }}
          onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
        >
          <video
            ref={cameraRef}
            className={cn('h-full w-full object-cover', touchUp && 'blur-sm')}
            style={{
              filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              borderRadius:
                overlayStyle.shape === 'circle'
                  ? '9999px'
                  : `${Math.max(0, overlayStyle.cornerRadius - overlayStyle.borderWidth)}px`,
            }}
            autoPlay
            playsInline
            muted
          />
        </div>
      )}
    </div>
  );
}

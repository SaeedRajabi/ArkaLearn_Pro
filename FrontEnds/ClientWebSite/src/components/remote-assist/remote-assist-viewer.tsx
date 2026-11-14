'use client';

import * as React from 'react';
import { Loader2, Maximize2, Minimize2, MonitorOff, Power, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRemoteAssistHub } from '@/hooks/use-remote-assist-hub';
import { endRemoteAssistSession, type RemoteAssistSession } from '@/lib/api/remote-assist';
import { remoteAssistHubClient } from '@/lib/signalr/remote-assist-hub';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils';

type Props = {
  session: RemoteAssistSession | null;
  userId?: number | string | null;
  title?: string;
  waitingLabel?: string;
  emptyDescription?: string;
  noSessionLabel?: string;
  controlEnabledLabel?: string;
  endLabel?: string;
  expandLabel?: string;
  collapseLabel?: string;
  endFailedLabel?: string;
  statusPrefix?: string;
  onSessionChange?: (session: RemoteAssistSession | null) => void;
  onError?: (message: string) => void;
  showEndButton?: boolean;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.15;
const MOUSE_MOVE_INTERVAL_MS = 45;

function isActiveStatus(status: string) {
  return status.trim().toLowerCase() === 'active';
}

function isEndedStatus(status: string) {
  const value = status.trim().toLowerCase();
  return value === 'ended' || value === 'denied' || value === 'expired';
}

function pointerPercent(event: React.PointerEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  const rect = img.getBoundingClientRect();
  const naturalWidth = img.naturalWidth || rect.width || 1;
  const naturalHeight = img.naturalHeight || rect.height || 1;
  const containScale = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);
  const contentWidth = naturalWidth * containScale;
  const contentHeight = naturalHeight * containScale;
  const offsetX = (rect.width - contentWidth) / 2;
  const offsetY = (rect.height - contentHeight) / 2;
  const x = contentWidth > 0 ? (event.clientX - rect.left - offsetX) / contentWidth : 0;
  const y = contentHeight > 0 ? (event.clientY - rect.top - offsetY) / contentHeight : 0;
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
}

function browserKeyToVk(event: React.KeyboardEvent): number {
  if (event.key.length === 1) {
    const upper = event.key.toUpperCase();
    const code = upper.charCodeAt(0);
    if (code >= 65 && code <= 90) return code;
    if (code >= 48 && code <= 57) return code;
  }

  const map: Record<string, number> = {
    Backspace: 8,
    Tab: 9,
    Enter: 13,
    Shift: 16,
    Control: 17,
    Alt: 18,
    Escape: 27,
    ' ': 32,
    Space: 32,
    PageUp: 33,
    PageDown: 34,
    End: 35,
    Home: 36,
    ArrowLeft: 37,
    ArrowUp: 38,
    ArrowRight: 39,
    ArrowDown: 40,
    Insert: 45,
    Delete: 46,
    Meta: 91,
  };

  if (map[event.key] != null) return map[event.key];
  return typeof event.keyCode === 'number' ? event.keyCode : 0;
}

function statusLabelFa(status?: string | null) {
  const value = (status || '').trim().toLowerCase();
  switch (value) {
    case 'active':
      return 'فعال';
    case 'ended':
      return 'پایان‌یافته';
    case 'pending':
      return 'در انتظار';
    case 'awaitingconsent':
      return 'در انتظار تأیید';
    case 'denied':
      return 'رد شده';
    case 'expired':
      return 'منقضی';
    default:
      return status || '—';
  }
}

function base64ToBlobUrl(base64: string): string {
  const raw = base64.startsWith('data:') ? base64.split(',')[1] ?? '' : base64;
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
}

function useViewportTransform(enabled: boolean) {
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const reset = React.useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    dragRef.current = null;
  }, []);

  React.useEffect(() => {
    if (!enabled) reset();
  }, [enabled, reset]);

  const clampPan = React.useCallback((nextZoom: number, nextPan: { x: number; y: number }) => {
    if (nextZoom <= 1) return { x: 0, y: 0 };
    const max = 1200 * (nextZoom - 1);
    return {
      x: Math.min(max, Math.max(-max, nextPan.x)),
      y: Math.min(max, Math.max(-max, nextPan.y)),
    };
  }, []);

  const setZoomClamped = React.useCallback(
    (value: number) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
      setZoom(next);
      setPan((prev) => clampPan(next, prev));
    },
    [clampPan]
  );

  const onWheel = React.useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const direction = event.deltaY > 0 ? -1 : 1;
      setZoom((current) => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + direction * ZOOM_STEP).toFixed(2))));
        setPan((prev) => clampPan(next, prev));
        return next;
      });
    },
    [clampPan]
  );

  const beginPan = React.useCallback(
    (event: React.PointerEvent) => {
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: pan.x,
        originY: pan.y,
      };
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    [pan.x, pan.y]
  );

  const movePan = React.useCallback(
    (event: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return false;
      const next = clampPan(zoom, {
        x: drag.originX + (event.clientX - drag.startX),
        y: drag.originY + (event.clientY - drag.startY),
      });
      setPan(next);
      return true;
    },
    [clampPan, zoom]
  );

  const endPan = React.useCallback((event: React.PointerEvent) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      return true;
    }
    return false;
  }, []);

  const isPanning = React.useCallback(() => dragRef.current != null, []);

  return {
    zoom,
    pan,
    reset,
    setZoomClamped,
    onWheel,
    beginPan,
    movePan,
    endPan,
    isPanning,
  };
}

export function RemoteAssistViewer({
  session,
  userId,
  title = 'صفحه ریموت',
  waitingLabel = 'در انتظار دریافت تصویر صفحه…',
  emptyDescription = 'برای مشاهده صفحه، ابتدا به یک نشست متصل شوید.',
  noSessionLabel = 'نشست فعالی وجود ندارد',
  controlEnabledLabel = 'کنترل از راه دور فعال',
  endLabel = 'پایان',
  expandLabel = 'تمام‌صفحه',
  collapseLabel = 'خروج از تمام‌صفحه',
  endFailedLabel = 'پایان نشست ناموفق بود.',
  statusPrefix = 'وضعیت',
  onSessionChange,
  onError,
  showEndButton = true,
}: Props) {
  const [frameSrc, setFrameSrc] = React.useState<string | null>(null);
  const [ending, setEnding] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = React.useState(false);
  const sessionRef = React.useRef(session);
  sessionRef.current = session;
  const frameUrlRef = React.useRef<string | null>(null);
  const pendingFrameUrlRef = React.useRef<string | null>(null);
  const pendingFrameImageRef = React.useRef<HTMLImageElement | null>(null);
  const frameSequenceRef = React.useRef(0);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const queuedMouseMoveRef = React.useRef<{ x: number; y: number } | null>(null);
  const mouseMoveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMouseMoveAtRef = React.useRef(0);
  const viewport = useViewportTransform(!!frameSrc);
  const resetViewportRef = React.useRef(viewport.reset);
  resetViewportRef.current = viewport.reset;

  const active = !!session && isActiveStatus(session.status);
  const allowControl = active && !!session?.allowRemoteControl;
  const statusFa = statusLabelFa(session?.status);

  const revokeFrameUrl = React.useCallback(() => {
    frameSequenceRef.current += 1;
    if (pendingFrameImageRef.current) {
      pendingFrameImageRef.current.onload = null;
      pendingFrameImageRef.current.onerror = null;
      pendingFrameImageRef.current = null;
    }
    if (pendingFrameUrlRef.current) {
      URL.revokeObjectURL(pendingFrameUrlRef.current);
      pendingFrameUrlRef.current = null;
    }
    if (frameUrlRef.current) {
      URL.revokeObjectURL(frameUrlRef.current);
      frameUrlRef.current = null;
    }
  }, []);

  const clearFrame = React.useCallback(() => {
    revokeFrameUrl();
    setFrameSrc(null);
    setExpanded(false);
    setIsNativeFullscreen(false);
    resetViewportRef.current();
  }, [revokeFrameUrl]);

  useRemoteAssistHub({
    enabled: !!session && session.sessionId > 0,
    userId,
    sessionId: session?.sessionId ?? null,
    handlers: {
      onSessionChanged: (payload) => {
        const current = sessionRef.current;
        if (!current || payload.sessionId !== current.sessionId) return;
        if (isEndedStatus(String(payload.status))) {
          clearFrame();
          onSessionChange?.(null);
          return;
        }
        onSessionChange?.(payload);
      },
      onConsentResolved: (payload) => {
        const current = sessionRef.current;
        if (!current || payload.sessionId !== current.sessionId) return;
        if (isEndedStatus(String(payload.status))) {
          clearFrame();
          onSessionChange?.(null);
          return;
        }
        onSessionChange?.(payload);
      },
      onScreenFrame: (payload) => {
        const current = sessionRef.current;
        if (!current || payload.sessionId !== current.sessionId) return;
        if (!isActiveStatus(current.status) || !payload.jpegBase64) return;
        try {
          const nextUrl = base64ToBlobUrl(payload.jpegBase64);
          const sequence = ++frameSequenceRef.current;
          if (pendingFrameImageRef.current) {
            pendingFrameImageRef.current.onload = null;
            pendingFrameImageRef.current.onerror = null;
          }
          if (pendingFrameUrlRef.current) {
            URL.revokeObjectURL(pendingFrameUrlRef.current);
          }

          const image = new Image();
          pendingFrameImageRef.current = image;
          pendingFrameUrlRef.current = nextUrl;
          image.onload = () => {
            if (sequence !== frameSequenceRef.current || pendingFrameUrlRef.current !== nextUrl) {
              URL.revokeObjectURL(nextUrl);
              return;
            }

            const previous = frameUrlRef.current;
            pendingFrameImageRef.current = null;
            pendingFrameUrlRef.current = null;
            frameUrlRef.current = nextUrl;
            setFrameSrc(nextUrl);
            if (previous) {
              requestAnimationFrame(() => URL.revokeObjectURL(previous));
            }
          };
          image.onerror = () => {
            if (pendingFrameUrlRef.current === nextUrl) {
              pendingFrameImageRef.current = null;
              pendingFrameUrlRef.current = null;
            }
            URL.revokeObjectURL(nextUrl);
          };
          image.src = nextUrl;
        } catch {
          // Keep the last successfully decoded frame visible.
        }
      },
    },
  });

  React.useEffect(() => {
    clearFrame();
  }, [session?.sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!session || isEndedStatus(session.status) || !isActiveStatus(session.status)) {
      clearFrame();
    }
  }, [session?.status, session, clearFrame]);

  React.useEffect(() => () => revokeFrameUrl(), [revokeFrameUrl]);

  React.useEffect(() => {
    const onFullscreenChange = () => {
      const el = document.fullscreenElement;
      const activeFs = Boolean(el && (el === stageRef.current || stageRef.current?.contains(el)));
      setIsNativeFullscreen(activeFs);
      if (!activeFs) setExpanded(false);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  React.useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) setExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded]);

  const enterFullscreen = React.useCallback(async () => {
    viewport.reset();
    setExpanded(true);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const node = stageRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement !== node) {
        await node.requestFullscreen();
      }
      setIsNativeFullscreen(true);
    } catch {
      setIsNativeFullscreen(false);
    }
  }, [viewport]);

  const exitFullscreen = React.useCallback(async () => {
    viewport.reset();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // ignore
    }
    setIsNativeFullscreen(false);
    setExpanded(false);
  }, [viewport]);

  const relayInput = React.useCallback(
    (payloadJson: string) => {
      if (!session || !allowControl) return;
      void remoteAssistHubClient.relayInput(session.sessionId, payloadJson);
    },
    [allowControl, session]
  );

  const cancelQueuedMouseMove = React.useCallback(() => {
    if (mouseMoveTimerRef.current) {
      clearTimeout(mouseMoveTimerRef.current);
      mouseMoveTimerRef.current = null;
    }
    queuedMouseMoveRef.current = null;
  }, []);

  const relayMouseMove = React.useCallback(
    (position: { x: number; y: number }) => {
      queuedMouseMoveRef.current = position;
      const elapsed = performance.now() - lastMouseMoveAtRef.current;

      const sendQueued = () => {
        mouseMoveTimerRef.current = null;
        const latest = queuedMouseMoveRef.current;
        queuedMouseMoveRef.current = null;
        if (!latest) return;
        lastMouseMoveAtRef.current = performance.now();
        relayInput(JSON.stringify({ kind: 'mouseMove', ...latest }));
      };

      if (elapsed >= MOUSE_MOVE_INTERVAL_MS && !mouseMoveTimerRef.current) {
        sendQueued();
        return;
      }

      if (!mouseMoveTimerRef.current) {
        mouseMoveTimerRef.current = setTimeout(
          sendQueued,
          Math.max(0, MOUSE_MOVE_INTERVAL_MS - elapsed)
        );
      }
    },
    [relayInput]
  );

  React.useEffect(
    () => cancelQueuedMouseMove,
    [cancelQueuedMouseMove, session?.sessionId]
  );

  const shouldPan = (event: React.PointerEvent) =>
    viewport.zoom > 1 && (event.button === 1 || event.altKey || event.button === 2 || !allowControl);

  const handlePointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    if (viewport.movePan(event)) return;
    if (!allowControl || viewport.isPanning()) return;
    const { x, y } = pointerPercent(event);
    relayMouseMove({ x, y });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (shouldPan(event)) {
      event.preventDefault();
      viewport.beginPan(event);
      return;
    }
    if (!allowControl) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { x, y } = pointerPercent(event);
    const button = event.button === 2 ? 2 : 0;
    cancelQueuedMouseMove();
    relayInput(JSON.stringify({ kind: 'mouseButton', button, down: true, x, y }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLImageElement>) => {
    if (viewport.endPan(event)) return;
    if (!allowControl) return;
    const { x, y } = pointerPercent(event);
    const button = event.button === 2 ? 2 : 0;
    cancelQueuedMouseMove();
    relayInput(JSON.stringify({ kind: 'mouseButton', button, down: false, x, y }));
  };

  const handleKey = (event: React.KeyboardEvent<HTMLDivElement>, down: boolean) => {
    if (!allowControl) return;
    event.preventDefault();
    const vk = browserKeyToVk(event);
    if (!vk) return;
    void relayInput(JSON.stringify({ kind: 'key', vk, down }));
  };

  const handleEnd = async () => {
    if (!session || ending) return;
    setEnding(true);
    try {
      await endRemoteAssistSession(session.sessionId);
      clearFrame();
      onSessionChange?.(null);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : endFailedLabel;
      onError?.(message);
    } finally {
      setEnding(false);
    }
  };

  const renderViewport = (mode: 'inline' | 'expanded') => {
    const ended = !!session && isEndedStatus(session.status);
    const awaiting = !!session && !active && !ended;
    const isExpanded = mode === 'expanded';

    return (
      <div
        className={cn(
          'outline-none',
          isExpanded ? 'flex h-full min-h-0 w-full flex-col' : 'flex h-full min-h-[420px] w-full flex-col'
        )}
        tabIndex={allowControl ? 0 : -1}
        onKeyDown={(e) => handleKey(e, true)}
        onKeyUp={(e) => handleKey(e, false)}
      >
        {frameSrc ? (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => viewport.setZoomClamped(viewport.zoom - ZOOM_STEP)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => viewport.setZoomClamped(viewport.zoom + ZOOM_STEP)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={viewport.reset}>
              <RotateCcw className="me-1 h-4 w-4" />
              {Math.round(viewport.zoom * 100)}٪
            </Button>
            <span className="text-xs text-muted-foreground">
              اسکرول برای زوم · Alt + درگ برای جابه‌جایی
            </span>
          </div>
        ) : null}

        <div
          className={cn(
            'relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-zinc-950',
            isExpanded ? 'h-full' : 'h-[min(78vh,860px)] w-full'
          )}
          onWheel={frameSrc ? viewport.onWheel : undefined}
        >
          {frameSrc ? (
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden touch-none"
              onContextMenu={(e) => e.preventDefault()}
              onWheel={viewport.onWheel}
              onPointerMove={(e) => {
                if (viewport.movePan(e)) e.preventDefault();
              }}
              onPointerDown={(e) => {
                if (shouldPan(e)) {
                  e.preventDefault();
                  viewport.beginPan(e);
                }
              }}
              onPointerUp={(e) => {
                viewport.endPan(e);
              }}
              onPointerCancel={(e) => viewport.endPan(e)}
              style={{ cursor: viewport.zoom > 1 ? 'grab' : 'default' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frameSrc}
                alt="صفحه ریموت"
                draggable={false}
                decoding="async"
                className="h-full w-full select-none object-contain"
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                style={{
                  imageRendering: 'auto',
                  transform: `translate(${viewport.pan.x}px, ${viewport.pan.y}px) scale(${viewport.zoom})`,
                  transformOrigin: 'center center',
                  transition: viewport.isPanning() ? 'none' : 'transform 60ms linear',
                  cursor: allowControl ? 'crosshair' : viewport.zoom > 1 ? 'grab' : 'default',
                }}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              {ended ? (
                <>
                  <MonitorOff className="h-8 w-8" />
                  <p>جلسه پایان یافت.</p>
                </>
              ) : awaiting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p>
                    {statusPrefix}: {statusFa}. تصویر پس از فعال شدن نشست شروع می‌شود.
                  </p>
                </>
              ) : (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p>{waitingLabel}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!session || isEndedStatus(session.status)) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{emptyDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[min(78vh,860px)] min-h-[420px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
            <MonitorOff className="h-8 w-8" />
            <p className="text-sm">{noSessionLabel}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fullscreenActive = expanded || isNativeFullscreen;

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              نشست #{session.sessionId} · {statusFa}
              {allowControl ? ` · ${controlEnabledLabel}` : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!frameSrc}
              onClick={() => void (fullscreenActive ? exitFullscreen() : enterFullscreen())}
            >
              {fullscreenActive ? <Minimize2 className="me-2 h-4 w-4" /> : <Maximize2 className="me-2 h-4 w-4" />}
              {fullscreenActive ? collapseLabel : expandLabel}
            </Button>
            {showEndButton && active ? (
              <Button type="button" variant="destructive" size="sm" onClick={() => void handleEnd()} disabled={ending}>
                {ending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Power className="me-2 h-4 w-4" />}
                {endLabel}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="pt-0">{renderViewport('inline')}</CardContent>
      </Card>

      {/* Native / overlay fullscreen stage */}
      <div
        ref={stageRef}
        className={cn(
          fullscreenActive
            ? 'fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-black p-3 sm:p-4'
            : 'pointer-events-none fixed -left-[9999px] top-0 h-px w-px opacity-0'
        )}
      >
        {fullscreenActive ? (
          <>
            <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
              <p className="truncate text-sm text-white/80">{title}</p>
              <Button type="button" variant="secondary" size="sm" onClick={() => void exitFullscreen()}>
                <Minimize2 className="me-2 h-4 w-4" />
                {collapseLabel}
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden text-white [&_.text-muted-foreground]:text-white/70">
              {renderViewport('expanded')}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

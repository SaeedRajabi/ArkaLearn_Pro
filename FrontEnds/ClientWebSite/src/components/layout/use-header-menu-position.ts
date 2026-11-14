'use client';

import { useCallback, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

const VIEWPORT_MARGIN = 8;
const GAP = 8;

const OFFSCREEN_STYLE: CSSProperties = {
  position: 'fixed',
  top: -9999,
  left: -9999,
  zIndex: 9999,
  visibility: 'hidden',
};

export type HeaderMenuAlign = 'start' | 'end' | 'center';
export type HeaderMenuPlacement = 'auto' | 'below';

function readPanelWidth(panel: HTMLElement): number {
  const computed = window.getComputedStyle(panel);
  const cssMinWidth = Number.parseFloat(computed.minWidth) || 0;
  return Math.max(panel.offsetWidth, panel.scrollWidth, cssMinWidth, 1);
}

function clampHorizontal(left: number, panelWidth: number, vw: number): number {
  if (left < VIEWPORT_MARGIN) {
    left = VIEWPORT_MARGIN;
  }
  if (left + panelWidth > vw - VIEWPORT_MARGIN) {
    left = Math.max(VIEWPORT_MARGIN, vw - panelWidth - VIEWPORT_MARGIN);
  }
  return left;
}

/**
 * Positions a menu panel with `position: fixed` inside the viewport (portal to body).
 */
export function useHeaderMenuPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  align: HeaderMenuAlign = 'end',
  isRtl = false,
  placement: HeaderMenuPlacement = 'auto'
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>(OFFSCREEN_STYLE);

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const anchorRect = anchor.getBoundingClientRect();
    const panelWidth = readPanelWidth(panel);
    const panelHeight = panel.offsetHeight || panel.getBoundingClientRect().height;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = anchorRect.bottom + GAP;
    let left: number;

    if (align === 'center') {
      left = anchorRect.left + anchorRect.width / 2 - panelWidth / 2;
    } else if (align === 'start') {
      left = isRtl ? anchorRect.right - panelWidth : anchorRect.left;
    } else {
      left = isRtl ? anchorRect.left : anchorRect.right - panelWidth;
    }

    left = clampHorizontal(left, panelWidth, vw);

    if (placement === 'below') {
      const maxHeight = Math.max(160, vh - top - VIEWPORT_MARGIN);
      setStyle({
        position: 'fixed',
        top: Math.round(top),
        left: Math.round(left),
        zIndex: 9999,
        visibility: 'visible',
        maxHeight: Math.round(maxHeight),
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      });
      return;
    }

    if (top + panelHeight > vh - VIEWPORT_MARGIN) {
      top = anchorRect.top - panelHeight - GAP;
    }
    if (top < VIEWPORT_MARGIN) {
      top = VIEWPORT_MARGIN;
    }

    setStyle({
      position: 'fixed',
      top: Math.round(top),
      left: Math.round(left),
      zIndex: 9999,
      visibility: 'visible',
    });
  }, [align, anchorRef, isRtl, panelRef, placement]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(OFFSCREEN_STYLE);
      return;
    }

    update();
    const raf1 = requestAnimationFrame(() => {
      update();
      requestAnimationFrame(update);
    });

    const panel = panelRef.current;
    const ro = panel ? new ResizeObserver(update) : null;
    if (panel && ro) ro.observe(panel);

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      cancelAnimationFrame(raf1);
      ro?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, update, anchorRef, panelRef]);

  return style;
}

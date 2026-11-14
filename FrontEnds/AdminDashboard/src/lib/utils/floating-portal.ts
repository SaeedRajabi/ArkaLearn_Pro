import * as React from 'react';
import type { CSSProperties, RefObject } from 'react';

const MENU_MARGIN = 8;
const MENU_GAP = 4;

export function resolveFloatingPortalContainer(trigger: HTMLElement | null): HTMLElement {
  if (!trigger) return document.body;
  const dialog = trigger.closest('[role="dialog"]') as HTMLElement | null;
  return dialog ?? document.body;
}

export function isDialogContainer(container: HTMLElement): boolean {
  return container.getAttribute('role') === 'dialog';
}

type FloatingPositionOptions = {
  isRtl?: boolean;
  minWidth?: number;
  maxHeight?: number;
  matchTriggerWidth?: boolean;
};

export function computeFloatingStyle(
  trigger: HTMLElement,
  panel: HTMLElement | null,
  container: HTMLElement,
  options: FloatingPositionOptions = {}
): CSSProperties {
  const {
    isRtl = false,
    minWidth = 220,
    maxHeight = 280,
    matchTriggerWidth = true,
  } = options;

  const triggerRect = trigger.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const inDialog = isDialogContainer(container);
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const width = matchTriggerWidth
    ? Math.min(Math.max(triggerRect.width, minWidth), (inDialog ? containerRect.width : vw) - MENU_MARGIN * 2)
    : Math.min(minWidth, vw - MENU_MARGIN * 2);

  const panelHeight = panel?.getBoundingClientRect().height ?? 0;
  const estimatedHeight = panelHeight > 0 ? panelHeight : Math.min(maxHeight, 220);

  if (inDialog) {
    let top = triggerRect.bottom - containerRect.top + MENU_GAP;
    let left = isRtl ? triggerRect.right - containerRect.left - width : triggerRect.left - containerRect.left;

    if (left < MENU_MARGIN) left = MENU_MARGIN;
    if (left + width > containerRect.width - MENU_MARGIN) {
      left = Math.max(MENU_MARGIN, containerRect.width - MENU_MARGIN - width);
    }

    const spaceBelow = containerRect.height - top - MENU_MARGIN;
    const spaceAbove = triggerRect.top - containerRect.top - MENU_GAP;
    if (estimatedHeight > spaceBelow && spaceAbove > spaceBelow) {
      top = Math.max(MENU_MARGIN, triggerRect.top - containerRect.top - estimatedHeight - MENU_GAP);
    }

    const computedMaxHeight = Math.min(maxHeight, containerRect.height - top - MENU_MARGIN);

    return {
      position: 'absolute',
      top,
      left,
      width,
      maxHeight: Math.max(120, computedMaxHeight),
      zIndex: 200,
      pointerEvents: 'auto',
    };
  }

  let top = triggerRect.bottom + MENU_GAP;
  let left = isRtl ? triggerRect.right - width : triggerRect.left;

  if (left < MENU_MARGIN) left = MENU_MARGIN;
  if (left + width > vw - MENU_MARGIN) left = vw - MENU_MARGIN - width;

  const spaceBelow = vh - MENU_MARGIN - top;
  const spaceAbove = triggerRect.top - MENU_GAP - MENU_MARGIN;
  if (estimatedHeight > spaceBelow && spaceAbove > spaceBelow) {
    top = Math.max(MENU_MARGIN, triggerRect.top - estimatedHeight - MENU_GAP);
  }

  const computedMaxHeight = Math.min(maxHeight, vh - MENU_MARGIN * 2);
  if (top + estimatedHeight > vh - MENU_MARGIN) {
    top = Math.max(MENU_MARGIN, vh - MENU_MARGIN - computedMaxHeight);
  }

  return {
    position: 'fixed',
    top,
    left,
    width,
    maxHeight: computedMaxHeight,
    zIndex: 9999,
    pointerEvents: 'auto',
  };
}

function isSameFloatingStyle(a: CSSProperties, b: CSSProperties): boolean {
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.maxHeight === b.maxHeight &&
    a.zIndex === b.zIndex
  );
}

type PanelState = {
  style: CSSProperties;
  portalContainer: HTMLElement;
};

export function useFloatingPanelPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  isRtl: boolean,
  options?: Omit<FloatingPositionOptions, 'isRtl'>
) {
  const [panelState, setPanelState] = React.useState<PanelState | null>(null);

  const minWidth = options?.minWidth ?? 220;
  const maxHeight = options?.maxHeight ?? 280;
  const matchTriggerWidth = options?.matchTriggerWidth ?? true;

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const container = resolveFloatingPortalContainer(trigger);
    const nextStyle = computeFloatingStyle(trigger, panelRef.current, container, {
      isRtl,
      minWidth,
      maxHeight,
      matchTriggerWidth,
    });

    setPanelState((prev) => {
      if (
        prev &&
        prev.portalContainer === container &&
        isSameFloatingStyle(prev.style, nextStyle)
      ) {
        return prev;
      }
      return { style: nextStyle, portalContainer: container };
    });
  }, [triggerRef, panelRef, isRtl, minWidth, maxHeight, matchTriggerWidth]);

  React.useLayoutEffect(() => {
    if (!open) {
      setPanelState((prev) => (prev === null ? prev : null));
      return;
    }

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  return {
    style: panelState?.style ?? null,
    portalContainer: panelState?.portalContainer ?? null,
  };
}

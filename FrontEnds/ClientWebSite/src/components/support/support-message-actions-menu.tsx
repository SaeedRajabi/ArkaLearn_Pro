'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';

import './support-message-actions-menu.css';

const MOBILE_MAX_WIDTH = 640;
const DEFAULT_POPOVER_WIDTH = 184;
const VIEWPORT_PADDING = 8;

export type SupportMessageAction = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  separatorBefore?: boolean;
};

type SupportMessageActionsMenuProps = {
  actions: SupportMessageAction[];
  triggerLabel: string;
  cancelLabel: string;
  isRtl?: boolean;
  alignEnd?: boolean;
  menuWidth?: number;
  triggerClassName?: string;
};

export function SupportMessageActionsMenu({
  actions,
  triggerLabel,
  cancelLabel,
  isRtl = false,
  alignEnd = false,
  menuWidth = DEFAULT_POPOVER_WIDTH,
  triggerClassName,
}: SupportMessageActionsMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [popoverPos, setPopoverPos] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const updatePopoverPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || isMobile) return;

    const rect = trigger.getBoundingClientRect();
    const menuEl = popoverRef.current;
    const menuHeight = menuEl?.offsetHeight ?? actions.length * 40 + 16;
    const gap = 6;

    let left = alignEnd ? rect.right - menuWidth : rect.left;
    left = Math.max(VIEWPORT_PADDING, Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PADDING));

    let top = rect.bottom + gap;
    if (top + menuHeight > window.innerHeight - VIEWPORT_PADDING) {
      top = Math.max(VIEWPORT_PADDING, rect.top - menuHeight - gap);
    }

    setPopoverPos({ top, left });
  }, [actions.length, alignEnd, isMobile, menuWidth]);

  React.useLayoutEffect(() => {
    if (!open || isMobile) return;
    updatePopoverPosition();
    const frame = requestAnimationFrame(() => updatePopoverPosition());
    return () => cancelAnimationFrame(frame);
  }, [open, isMobile, updatePopoverPosition]);

  React.useEffect(() => {
    if (!open || isMobile) return;

    const onReposition = () => updatePopoverPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, isMobile, updatePopoverPosition]);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  const close = React.useCallback(() => setOpen(false), []);

  const runAction = React.useCallback(
    (action: SupportMessageAction) => {
      close();
      action.onClick();
    },
    [close]
  );

  if (actions.length === 0) return null;

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  const renderAction = (action: SupportMessageAction, sheet = false) => (
    <React.Fragment key={action.key}>
      {action.separatorBefore ? <div className="support-msg-menu__sep" role="separator" /> : null}
      <button
        type="button"
        role="menuitem"
        className={cn(
          'support-msg-menu__item',
          sheet && 'support-msg-menu__item--sheet',
          action.destructive && 'support-msg-menu__item--danger'
        )}
        onClick={() => runAction(action)}
      >
        <span className="support-msg-menu__icon">{action.icon}</span>
        <span>{action.label}</span>
      </button>
    </React.Fragment>
  );

  const desktopMenu =
    open && !isMobile && portalTarget
      ? createPortal(
          <div
            ref={popoverRef}
            role="menu"
            dir={isRtl ? 'rtl' : 'ltr'}
            className="support-msg-menu--popover"
            style={{
              position: 'fixed',
              top: popoverPos.top,
              left: popoverPos.left,
              width: menuWidth,
              zIndex: 9999,
            }}
          >
            {actions.map((action) => renderAction(action))}
          </div>,
          portalTarget
        )
      : null;

  const mobileSheet =
    open && isMobile && portalTarget
      ? createPortal(
          <>
            <button
              type="button"
              className="support-msg-menu__backdrop"
              aria-label={cancelLabel}
              onClick={close}
            />
            <div
              ref={popoverRef}
              role="menu"
              dir={isRtl ? 'rtl' : 'ltr'}
              className="support-msg-menu--sheet"
            >
              <div className="support-msg-menu__sheet-handle" aria-hidden="true" />
              {actions.map((action) => renderAction(action, true))}
              <button type="button" className="support-msg-menu__cancel" onClick={close}>
                {cancelLabel}
              </button>
            </div>
          </>,
          portalTarget
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn('support-msg-menu__trigger', triggerClassName)}
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
      {desktopMenu}
      {mobileSheet}
    </>
  );
}

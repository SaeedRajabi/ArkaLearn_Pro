'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useHeaderMenuPosition, type HeaderMenuAlign, type HeaderMenuPlacement } from './use-header-menu-position';

interface HeaderMenuPortalProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  role?: string;
  align?: HeaderMenuAlign;
  isRtl?: boolean;
  placement?: HeaderMenuPlacement;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** Called with the panel element so parents can treat it as "inside" for dismiss logic. */
  onPanelMount?: (panel: HTMLDivElement | null) => void;
}

export function HeaderMenuPortal({
  open,
  anchorRef,
  children,
  className,
  role = 'menu',
  align = 'end',
  isRtl = false,
  placement = 'auto',
  onMouseEnter,
  onMouseLeave,
  onPanelMount,
}: HeaderMenuPortalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const positionStyle = useHeaderMenuPosition(open, anchorRef, panelRef, align, isRtl, placement);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setPanelRef = (el: HTMLDivElement | null) => {
    panelRef.current = el;
    onPanelMount?.(el);
  };

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      ref={setPanelRef}
      className={className}
      role={role}
      style={positionStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>,
    document.body
  );
}

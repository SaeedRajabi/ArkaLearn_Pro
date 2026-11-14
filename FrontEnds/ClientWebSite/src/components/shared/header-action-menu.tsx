'use client';

import * as React from 'react';
import '@/components/layout/header-menu.css';
import { HeaderMenuPortal } from '@/components/layout/header-menu-portal';
import { cn } from '@/lib/utils';

export type HeaderActionMenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onClick: () => void;
};

type Props = {
  items: HeaderActionMenuItem[];
  trigger: React.ReactNode;
  className?: string;
  panelClassName?: string;
  onOpenChange?: (open: boolean) => void;
};

export function HeaderActionMenu({
  items,
  trigger,
  className,
  panelClassName,
  onOpenChange,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const setOpenState = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpenState(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenState(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open, setOpenState]);

  return (
    <div ref={rootRef} className={cn('header-menu', className)}>
      {React.isValidElement(trigger)
        ? React.cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
            onClick: (event: React.MouseEvent) => {
              event.stopPropagation();
              const original = (trigger as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props
                .onClick;
              original?.(event);
              setOpenState(!open);
            },
            'aria-expanded': open,
            'aria-haspopup': 'menu',
          })
        : trigger}

      <HeaderMenuPortal
        open={open}
        anchorRef={rootRef}
        onPanelMount={(el) => {
          panelRef.current = el;
        }}
        className={cn('header-menu__panel', panelClassName)}
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className={cn('header-menu__item', item.destructive && 'text-destructive')}
            onClick={(event) => {
              event.stopPropagation();
              setOpenState(false);
              item.onClick();
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </HeaderMenuPortal>
    </div>
  );
}

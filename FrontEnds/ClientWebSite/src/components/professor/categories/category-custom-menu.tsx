'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MENU_MARGIN = 8;
const MENU_GAP = 4;

type FloatingOptions = {
  isRtl: boolean;
  matchTriggerWidth?: boolean;
  minWidth?: number;
  maxHeight?: number;
};

function useDismissOnOutside(
  triggerRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void
) {
  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, triggerRef, panelRef]);
}

function useFloatingMenu(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  options: FloatingOptions
) {
  const { isRtl, matchTriggerWidth = false, minWidth = 160, maxHeight = 240 } = options;
  const [style, setStyle] = React.useState<React.CSSProperties | null>(null);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panel = panelRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const availableWidth = vw - MENU_MARGIN * 2;

    const width = matchTriggerWidth
      ? Math.min(rect.width, availableWidth)
      : Math.min(Math.max(rect.width, minWidth), availableWidth);

    const panelHeight = panel?.getBoundingClientRect().height ?? 0;
    const estimatedHeight = panelHeight > 0 ? panelHeight : Math.min(maxHeight, 180);

    let top = rect.bottom + MENU_GAP;
    let left = isRtl ? rect.left : rect.right - width;

    if (left < MENU_MARGIN) left = MENU_MARGIN;
    if (left + width > vw - MENU_MARGIN) left = vw - MENU_MARGIN - width;

    const spaceBelow = vh - MENU_MARGIN - top;
    const spaceAbove = rect.top - MENU_GAP - MENU_MARGIN;

    if (estimatedHeight > spaceBelow && spaceAbove > spaceBelow) {
      top = Math.max(MENU_MARGIN, rect.top - estimatedHeight - MENU_GAP);
    }

    const computedMaxHeight = Math.min(maxHeight, vh - MENU_MARGIN * 2);
    if (top + estimatedHeight > vh - MENU_MARGIN) {
      top = Math.max(MENU_MARGIN, vh - MENU_MARGIN - computedMaxHeight);
    }

    setStyle({
      position: 'fixed',
      top,
      left,
      width,
      maxHeight: computedMaxHeight,
      zIndex: 9999,
    });
  }, [triggerRef, panelRef, isRtl, matchTriggerWidth, minWidth, maxHeight]);

  React.useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
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

  return style;
}

function FloatingMenuPortal({
  open,
  style,
  panelRef,
  children,
  className,
  role,
}: {
  open: boolean;
  style: React.CSSProperties | null;
  panelRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  className?: string;
  role: 'menu' | 'listbox';
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !style || !mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      role={role}
      style={style}
      className={className}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

const menuPanelClass =
  'overflow-hidden overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg';

const menuItemClass =
  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground';

const menuItemDangerClass =
  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10';

const menuDividerClass = 'my-1 h-px bg-border';

type ActionMenuSize = 'root' | 'md' | 'sm' | 'xs';

type CategoryActionMenuProps = {
  nodeId: number;
  isRtl: boolean;
  labels: {
    addSubcategory: string;
    edit: string;
    delete: string;
  };
  size: ActionMenuSize;
  onAddChild: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

export function CategoryActionMenu({
  nodeId,
  isRtl,
  labels,
  size,
  onAddChild,
  onEdit,
  onDelete,
}: CategoryActionMenuProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);

  useDismissOnOutside(triggerRef, panelRef, open, close);
  const menuStyle = useFloatingMenu(open, triggerRef, panelRef, { isRtl, minWidth: 168, maxHeight: 220 });

  const btnClass =
    size === 'root' ? 'h-7 w-7' : size === 'md' ? 'h-6 w-6' : 'h-5 w-5';
  const iconClass = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  const run = (action: () => void) => (event: React.MouseEvent) => {
    event.stopPropagation();
    action();
    close();
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
          btnClass
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <MoreHorizontal className={iconClass} />
      </button>

      <FloatingMenuPortal
        open={open}
        style={menuStyle}
        panelRef={panelRef}
        role="menu"
        className={menuPanelClass}
      >
        <button type="button" role="menuitem" className={menuItemClass} onClick={run(() => onAddChild(nodeId))}>
          <Plus className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 text-start">{labels.addSubcategory}</span>
        </button>
        <div className={menuDividerClass} role="separator" />
        <button type="button" role="menuitem" className={menuItemClass} onClick={run(() => onEdit(nodeId))}>
          <Pencil className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 text-start">{labels.edit}</span>
        </button>
        <button type="button" role="menuitem" className={menuItemDangerClass} onClick={run(() => onDelete(nodeId))}>
          <Trash2 className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 text-start">{labels.delete}</span>
        </button>
      </FloatingMenuPortal>
    </div>
  );
}

export type CategorySelectOption = {
  id: number | null;
  name: string;
  depth: number;
};

type CategoryParentSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: CategorySelectOption[];
  isRtl: boolean;
  placeholder: string;
  id?: string;
};

export function CategoryParentSelect({
  value,
  onChange,
  options,
  isRtl,
  placeholder,
  id,
}: CategoryParentSelectProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);

  useDismissOnOutside(triggerRef, panelRef, open, close);
  const menuStyle = useFloatingMenu(open, triggerRef, panelRef, {
    isRtl,
    matchTriggerWidth: true,
    maxHeight: 240,
  });

  const selected = options.find((option) =>
    option.id != null ? String(option.id) === value : value === 'root'
  );

  return (
    <div className="relative w-full" dir={isRtl ? 'rtl' : 'ltr'}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:bg-accent/40',
          isRtl ? 'text-right' : 'text-left'
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-muted-foreground')}>
          {selected?.name ?? placeholder}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      <FloatingMenuPortal
        open={open}
        style={menuStyle}
        panelRef={panelRef}
        role="listbox"
        className={menuPanelClass}
      >
        {options.map((option) => {
          const optionValue = option.id != null ? String(option.id) : 'root';
          const isActive = optionValue === value;

          return (
            <button
              key={option.id ?? 'root'}
              type="button"
              role="option"
              aria-selected={isActive}
              className={cn(
                menuItemClass,
                isActive && 'bg-accent text-accent-foreground',
                isRtl ? 'flex-row-reverse text-right' : 'text-left'
              )}
              style={
                isRtl
                  ? { paddingRight: 10 + option.depth * 14 }
                  : { paddingLeft: 10 + option.depth * 14 }
              }
              onClick={() => {
                onChange(optionValue);
                close();
              }}
            >
              {option.depth > 0 ? <span className="shrink-0 text-muted-foreground">↳</span> : null}
              <span className="min-w-0 truncate">{option.name}</span>
            </button>
          );
        })}
      </FloatingMenuPortal>
    </div>
  );
}

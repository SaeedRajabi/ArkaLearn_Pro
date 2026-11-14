'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFloatingPanelPosition } from '@/lib/utils/floating-portal';
import styles from './icon-select-picker.module.css';

export type IconSelectOption = {
  value: string;
  label: string;
  icon?: LucideIcon;
};

type Props = {
  options: IconSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  isRtl?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
  className?: string;
  id?: string;
  maxHeight?: number;
};

export function IconSelectPicker({
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
  isRtl = false,
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  noResultsText = 'No results found.',
  className,
  id,
  maxHeight = 280,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);
  const SelectedIcon = selected?.icon;
  const { style: panelStyle, portalContainer } = useFloatingPanelPosition(open, triggerRef, panelRef, isRtl, {
    maxHeight,
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searchable || !q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    close();
  };

  const portalTarget = portalContainer ?? (mounted ? document.body : null);

  return (
    <div className={cn(styles.root, className)} dir={isRtl ? 'rtl' : 'ltr'}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(styles.trigger, open && styles.triggerOpen, !selected && styles.triggerMuted)}
        onClick={() => setOpen((prev) => !prev)}
      >
        {SelectedIcon ? (
          <span className={styles.triggerIconWrap}>
            <SelectedIcon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
        <span className={styles.triggerLabel}>{selected?.label ?? placeholder ?? ''}</span>
        <ChevronDown className={cn(styles.triggerChevron, open && styles.triggerChevronOpen)} aria-hidden />
      </button>

      {open && panelStyle && portalTarget
        ? createPortal(
            <div
              ref={panelRef}
              role="listbox"
              aria-label={ariaLabel}
              className={styles.panel}
              style={panelStyle}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {searchable ? (
                <div className={styles.searchWrap}>
                  <input
                    type="search"
                    value={query}
                    placeholder={searchPlaceholder}
                    className={styles.searchInput}
                    onChange={(e) => setQuery(e.target.value)}
                    onMouseDown={(event) => event.stopPropagation()}
                  />
                </div>
              ) : null}

              <div className={styles.options}>
                {filtered.length === 0 ? (
                  <p className={styles.empty}>{noResultsText}</p>
                ) : (
                  filtered.map((option) => {
                    const Icon = option.icon;
                    const isActive = option.value === value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={cn(styles.option, isActive && styles.optionActive)}
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={() => handleSelect(option.value)}
                      >
                        {Icon ? (
                          <span className={styles.optionIconWrap}>
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                        ) : null}
                        <span className={styles.optionLabel}>{option.label}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            portalTarget
          )
        : null}
    </div>
  );
}

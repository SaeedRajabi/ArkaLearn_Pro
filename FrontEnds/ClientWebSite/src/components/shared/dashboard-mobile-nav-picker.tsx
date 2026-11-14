'use client';

import * as React from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './dashboard-mobile-nav-picker.module.css';

export type DashboardMobileNavPickerItem = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export type DashboardMobileNavPickerSection = {
  label: string;
  items: DashboardMobileNavPickerItem[];
};

type Props = {
  items?: DashboardMobileNavPickerItem[];
  sections?: DashboardMobileNavPickerSection[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  isRtl?: boolean;
};

export function DashboardMobileNavPicker({
  items,
  sections,
  value,
  onChange,
  ariaLabel,
  isRtl = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const flatItems = React.useMemo(
    () => (sections ? sections.flatMap((section) => section.items) : (items ?? [])),
    [items, sections]
  );

  const selected = flatItems.find((item) => item.value === value) ?? flatItems[0];
  const SelectedIcon = selected?.icon;

  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        close();
      }
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

  return (
    <div
      ref={rootRef}
      className={styles.dashboardMobileNav}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <button
        type="button"
        className={cn(styles.trigger, open && styles.triggerOpen)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
      >
        {SelectedIcon ? (
          <span className={styles.triggerIconWrap}>
            <SelectedIcon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
        <span className={styles.triggerLabel}>{selected?.label}</span>
        <ChevronDown
          className={cn(styles.triggerChevron, open && styles.triggerChevronOpen)}
          aria-hidden
        />
      </button>

      {open ? (
        <div role="listbox" aria-label={ariaLabel} className={styles.panel}>
          {sections
            ? sections.map((section) => (
                <div key={section.label} className={styles.section}>
                  <div className={styles.sectionLabel}>{section.label}</div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.value === value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={cn(styles.option, isActive && styles.optionActive)}
                        onClick={() => handleSelect(item.value)}
                      >
                        <span className={styles.optionIconWrap}>
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className={styles.optionLabel}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            : flatItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.value === value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={cn(styles.option, isActive && styles.optionActive)}
                    onClick={() => handleSelect(item.value)}
                  >
                    <span className={styles.optionIconWrap}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className={styles.optionLabel}>{item.label}</span>
                  </button>
                );
              })}
        </div>
      ) : null}
    </div>
  );
}

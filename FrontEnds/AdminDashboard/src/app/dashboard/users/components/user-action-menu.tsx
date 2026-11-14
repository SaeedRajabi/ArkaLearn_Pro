'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import styles from './user-action-menu.module.css';
import {useLanguage} from "@/components/language-provider";

export type UserActionMenuItem =
  | { type: 'label'; label: string }
  | { type: 'separator' }
  | {
      type: 'item';
      id: string;
      label: string;
      icon?: React.ReactNode;
      href?: string;
      onClick?: () => void;
      danger?: boolean;
    };

type UserActionMenuProps = {
  items: UserActionMenuItem[];
  disabled?: boolean;
  loading?: boolean;
  onItemActivate?: (itemId: string) => void;
  ariaLabel: string;
  isRtl?: boolean;
};

type PanelPosition = {
  top: number;
  left: number;
};

const PANEL_ESTIMATE_WIDTH = 280;
const PANEL_ESTIMATE_HEIGHT = 320;

function useIsMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function UserActionMenu({
  items,
  disabled,
  loading = false,
  onItemActivate,
  ariaLabel,
  isRtl = true,
}: UserActionMenuProps) {
  const { direction } = useLanguage();
  const mounted = useIsMounted();
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState<PanelPosition | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const closeMenu = React.useCallback(() => {
    setOpen(false);
    setPosition(null);
  }, []);

  const computePosition = React.useCallback((panelWidth: number, panelHeight: number): PanelPosition => {
    const trigger = triggerRef.current;
    const margin = 8;
    if (!trigger) return { top: margin, left: margin };
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = rect.bottom + 6;
    if (top + panelHeight > viewportHeight - margin) {
      top = Math.max(margin, rect.top - panelHeight - 6);
    }

    let left = rect.right - panelWidth;
    if (left < margin) {
      left = rect.left;
    }

    left = clamp(left, margin, Math.max(margin, viewportWidth - panelWidth - margin));
    top = clamp(top, margin, Math.max(margin, viewportHeight - panelHeight - margin));

    return { top, left };
  }, []);

  const updatePosition = React.useCallback(() => {
    const panelWidth = panelRef.current?.offsetWidth || PANEL_ESTIMATE_WIDTH;
    const panelHeight = panelRef.current?.offsetHeight || PANEL_ESTIMATE_HEIGHT;
    setPosition(computePosition(panelWidth, panelHeight));
  }, [computePosition]);

  const openMenu = React.useCallback(() => {
    if (disabled) return;
    setPosition(computePosition(PANEL_ESTIMATE_WIDTH, PANEL_ESTIMATE_HEIGHT));
    setOpen(true);
  }, [computePosition, disabled]);

  React.useEffect(() => {
    if (!open) return;

    const runPosition = () => updatePosition();
    const raf = window.requestAnimationFrame(runPosition);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', runPosition);
    window.addEventListener('scroll', runPosition, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', runPosition);
      window.removeEventListener('scroll', runPosition, true);
    };
  }, [closeMenu, open, updatePosition]);

  const renderItem = (item: Extract<UserActionMenuItem, { type: 'item' }>) => {
    const className = `${styles.item}${item.danger ? ` ${styles.itemDanger}` : ''}`;

    if (item.href) {
      return (
        <Link
          key={item.id}
          href={item.href}
          className={className}
          onClick={() => {
            onItemActivate?.(item.id);
            closeMenu();
          }}
        >
          {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
          <span className={styles.text}>{item.label}</span>
        </Link>
      );
    }

    return (
        <button
            style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}
            key={item.id}
            type="button"
            className={className}
            onClick={() => {
                onItemActivate?.(item.id);
                item.onClick?.();
                closeMenu();
            }}
        >
        {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
        <span className={styles.text}>{item.label}</span>
      </button>
    );
  };

  const panel =
    open && position ? (
      <>
        <div className={styles.backdrop} onClick={closeMenu} aria-hidden />
        <div
          ref={panelRef}
          className={`${styles.panel} ${isRtl ? styles.panelRtl : styles.panelLtr}`}
          role="menu"
          aria-label={ariaLabel}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {items.map((item, index) => {
            if (item.type === 'label') {
              return (
                <div key={`label-${index}`} className={styles.label} role="presentation">
                  {item.label}
                </div>
              );
            }
            if (item.type === 'separator') {
              return <div key={`sep-${index}`} className={styles.separator} role="separator" />;
            }
            return renderItem(item);
          })}
        </div>
      </>
    ) : null;

  return (
    <div className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-busy={loading}
        disabled={disabled || loading}
        onClick={() => (open ? closeMenu() : openMenu())}
      >
        <span className={styles.triggerDots} aria-hidden>
          <span className={styles.triggerDot} />
          <span className={styles.triggerDot} />
          <span className={styles.triggerDot} />
        </span>
      </button>
      {loading ? <Loader2 className={styles.adjacentSpinner} aria-hidden /> : null}
      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
